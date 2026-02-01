/**
 * Silent Partners - Agent V2 Streaming API Client v5.2
 *
 * Handles Server-Sent Events (SSE) for the new tool-calling AI agent.
 * Uses the Agent v2 endpoint which:
 * - Uses Modal for serverless processing (better reliability)
 * - Has proper async support (no gevent conflicts)
 * - Includes token tracking and credit deduction
 * - iOS Safari compatibility (v5.2)
 */

// Detect iOS Safari for streaming fallback
const isIOSSafari = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  return isIOS && isSafari;
};

// Parse SSE events from text (for iOS fallback)
const parseSSEEvents = (text: string): Array<{ type: string; [key: string]: any }> => {
  const events: Array<{ type: string; [key: string]: any }> = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const jsonStr = line.slice(6).trim();
        if (jsonStr) {
          const event = JSON.parse(jsonStr);
          events.push(event);
        }
      } catch (e) {
        // Skip malformed events
      }
    }
  }
  
  return events;
};

// API URLs - environment variables with validation
const ENV_API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;

// Get API base URL with development fallback
const getApiBase = () => {
  if (ENV_API_BASE) return ENV_API_BASE;
  if (import.meta.env.DEV) {
    console.warn('VITE_API_URL not set, using default development URL');
    return 'https://silent-partners-ai-api.onrender.com/api';
  }
  throw new Error('VITE_API_URL environment variable is required');
};

// Get Agent V2 API URL
const getAgentV2Api = () => {
  return `${getApiBase()}/v2/agent-v2`;
};

// Agent V2 event types from the backend
export type AgentV2EventType =
  | 'thinking'
  | 'tool_start'
  | 'tool_result'
  | 'response'
  | 'suggestions'
  | 'context_update'
  | 'complete'
  | 'error';

export interface AgentV2Entity {
  id?: string;
  name: string;
  type: string;
  description?: string;
  importance?: number;
}

export interface AgentV2Relationship {
  id?: string;
  source: string;
  target: string;
  type: string;
  label?: string;
  description?: string;
}

export interface AgentV2ToolCall {
  tool_name: string;
  arguments: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  duration_ms?: number;
}

export interface AgentV2Usage {
  prompt_tokens: number;
  completion_tokens: number;
  reasoning_tokens?: number;
  cached_tokens?: number;
  tool_calls: number;
  external_api_calls?: number;
}

export interface AgentV2Callbacks {
  // Core callbacks
  onStart?: (message: string) => void;
  onThinking?: (message: string, reasoning?: string) => void;
  onToolStart?: (tool: string, arguments: Record<string, any>) => void;
  onToolResult?: (tool: string, result: Record<string, any>) => void;
  onResponse?: (content: string) => void;
  onComplete?: (response: string, toolCalls: AgentV2ToolCall[], usage?: AgentV2Usage) => void;
  onError?: (message: string, recoverable: boolean) => void;
  
  // Entity/relationship callbacks (extracted from tool results)
  onEntityFound?: (entity: AgentV2Entity, isNew: boolean) => void;
  onRelationshipFound?: (relationship: AgentV2Relationship, isNew: boolean) => void;
  
  // Suggestion callbacks
  onEntitySuggestion?: (entity: AgentV2Entity, reason: string) => void;
  onRelationshipSuggestion?: (relationship: AgentV2Relationship, evidence: string) => void;
  
  // Context callbacks
  onContextUpdate?: (context: Record<string, any>) => void;
  
  // Credit/usage callbacks
  onUsageUpdate?: (usage: AgentV2Usage) => void;
}

export interface AgentV2Context {
  topic?: string;
  domain?: string;
  focus?: string;
  key_questions?: string[];
  entities?: Array<{ id: string; name: string; type: string; description?: string }>;
  relationships?: Array<{ source: string; target: string; type: string; label?: string }>;
  investigation_context?: Record<string, any>;
  graph_id?: number | string;  // v8.1: Enable claims integration when provided
}

/**
 * Stream AI agent chat with tool execution.
 * Uses the new Agent V2 endpoint for better reliability and credit tracking.
 * 
 * Returns an abort function to cancel the stream.
 */
export function streamAgentV2Chat(
  message: string,
  context: AgentV2Context,
  callbacks: AgentV2Callbacks,
  sessionToken?: string
): () => void {
  const abortController = new AbortController();
  let lastActivityTime = Date.now();
  let timeoutId: NodeJS.Timeout | null = null;
  const TIMEOUT_MS = 180000; // 3 minute timeout (agent may need more time for tool calls)
  
  // Track entities and relationships found during this session
  const entitiesFound: AgentV2Entity[] = [];
  const relationshipsFound: AgentV2Relationship[] = [];
  
  // Check for inactivity and abort if needed
  const checkTimeout = () => {
    if (Date.now() - lastActivityTime > TIMEOUT_MS) {
      console.warn('Agent V2 timeout - no activity for 3 minutes');
      callbacks.onError?.('Investigation timed out. Please try again with a simpler query.', true);
      abortController.abort();
      return;
    }
    timeoutId = setTimeout(checkTimeout, 10000); // Check every 10 seconds
  };
  
  const runStream = async () => {
    // Start timeout checker
    timeoutId = setTimeout(checkTimeout, 10000);
    
    // Notify start
    callbacks.onStart?.(message);
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      };
      
      // Add auth header if session token provided
      if (sessionToken) {
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      
      const response = await fetch(`${getAgentV2Api()}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message,
          entities: context.entities || [],
          relationships: context.relationships || [],
          history: [], // Could add conversation history here
          graph_id: context.graph_id,  // v8.1: Enable claims integration
          investigation_context: context.investigation_context || {
            title: context.topic || '',
            description: context.domain || '',
            key_findings: [],
            hypotheses: [],
            red_flags: [],
            timeline: [],
            next_steps: [],
            session_summaries: []
          }
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Agent request failed' }));
        callbacks.onError?.(error.error || `HTTP ${response.status}`, false);
        return;
      }

      // iOS Safari fallback: read entire response as text then parse
      const useIOSFallback = isIOSSafari();
      console.log(`[SSE Agent V2] Starting stream, iOS fallback: ${useIOSFallback}`);
      
      if (useIOSFallback || !response.body) {
        console.log('[SSE Agent V2] Using text() fallback');
        const text = await response.text();
        console.log(`[SSE Agent V2] Received ${text.length} bytes`);
        
        const events = parseSSEEvents(text);
        console.log(`[SSE Agent V2] Parsed ${events.length} events`);
        
        for (const event of events) {
          lastActivityTime = Date.now();
          handleAgentV2Event(event, callbacks, entitiesFound, relationshipsFound);
        }
        return;
      }

      // Standard streaming for other browsers
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              // Update activity timestamp on each event
              lastActivityTime = Date.now();
              const event = JSON.parse(line.slice(6));
              handleAgentV2Event(event, callbacks, entitiesFound, relationshipsFound);
            } catch (e) {
              console.warn('Failed to parse agent event:', line, e);
            }
          }
        }
      }
      
      // Process any remaining buffer
      if (buffer.startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.slice(6));
          handleAgentV2Event(event, callbacks, entitiesFound, relationshipsFound);
        } catch (e) {
          // Ignore incomplete final chunk
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Cleanup timeout on abort
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }
      callbacks.onError?.(
        error instanceof Error ? error.message : 'Agent connection failed',
        true
      );
    } finally {
      // Cleanup timeout when stream ends
      if (timeoutId) clearTimeout(timeoutId);
    }
  };

  runStream();

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    abortController.abort();
  };
}

/**
 * Handle individual Agent V2 events.
 */
function handleAgentV2Event(
  event: { type: AgentV2EventType; [key: string]: any },
  callbacks: AgentV2Callbacks,
  entitiesFound: AgentV2Entity[],
  relationshipsFound: AgentV2Relationship[]
) {
  switch (event.type) {
    case 'thinking':
      callbacks.onThinking?.(event.content || 'Thinking...');
      break;
      
    case 'tool_start':
      callbacks.onToolStart?.(event.tool || '', event.arguments || {});
      // Also emit as thinking for UI feedback
      const toolMessage = getToolStartMessage(event.tool, event.arguments);
      callbacks.onThinking?.(toolMessage);
      break;
      
    case 'tool_result':
      callbacks.onToolResult?.(event.tool || '', event.result || {});
      // Extract entities and relationships from tool results
      processToolResult(event.tool, event.result, callbacks, entitiesFound, relationshipsFound);
      break;
      
    case 'response':
      callbacks.onResponse?.(event.content || '');
      break;
      
    case 'suggestions':
      // Handle entity suggestions
      if (event.entities) {
        for (const suggestion of event.entities) {
          if (suggestion.entity) {
            callbacks.onEntitySuggestion?.(suggestion.entity, suggestion.reason || '');
          }
        }
      }
      // Handle relationship suggestions
      if (event.relationships) {
        for (const suggestion of event.relationships) {
          if (suggestion.relationship) {
            callbacks.onRelationshipSuggestion?.(suggestion.relationship, suggestion.evidence || '');
          }
        }
      }
      break;
      
    case 'context_update':
      callbacks.onContextUpdate?.(event.context || {});
      break;
      
    case 'complete':
      callbacks.onComplete?.(
        event.response || '',
        event.tool_calls || [],
        event.usage
      );
      // Also emit usage update if available
      if (event.usage) {
        callbacks.onUsageUpdate?.(event.usage);
      }
      break;
      
    case 'error':
      callbacks.onError?.(event.error || 'An error occurred', false);
      break;
  }
}

/**
 * Generate a user-friendly message for tool start events.
 */
function getToolStartMessage(tool: string, args: Record<string, any>): string {
  switch (tool) {
    case 'search_web':
      return `🔍 Searching: ${args.query || 'web'}...`;
    case 'enrich_entity':
      return `📊 Enriching: ${args.entity_name || 'entity'}...`;
    case 'find_connections':
      return `🔗 Finding connections between ${args.entity1 || '?'} and ${args.entity2 || '?'}...`;
    case 'query_graph':
      return `📈 Analyzing graph: ${args.query_type || 'query'}...`;
    case 'add_finding':
      return `📝 Recording finding...`;
    case 'add_red_flag':
      return `🚩 Recording red flag...`;
    case 'suggest_entity':
      return `💡 Suggesting entity: ${args.name || 'entity'}...`;
    case 'suggest_relationship':
      return `💡 Suggesting connection...`;
    default:
      return `⚙️ Executing: ${tool}...`;
  }
}

/**
 * Process tool results to extract entities and relationships.
 */
function processToolResult(
  tool: string,
  result: Record<string, any>,
  callbacks: AgentV2Callbacks,
  entitiesFound: AgentV2Entity[],
  relationshipsFound: AgentV2Relationship[]
) {
  if (!result || result.error) return;
  
  // Handle search_web results - may contain entities
  if (tool === 'search_web' && result.entities) {
    for (const entity of result.entities) {
      if (!entitiesFound.some(e => e.name.toLowerCase() === entity.name?.toLowerCase())) {
        entitiesFound.push(entity);
        callbacks.onEntityFound?.(entity, true);
      }
    }
  }
  
  // Handle enrich_entity results
  if (tool === 'enrich_entity' && result.related_entities) {
    for (const entity of result.related_entities) {
      if (!entitiesFound.some(e => e.name.toLowerCase() === entity.name?.toLowerCase())) {
        entitiesFound.push(entity);
        callbacks.onEntityFound?.(entity, true);
      }
    }
  }
  
  // Handle find_connections results
  if (tool === 'find_connections') {
    if (result.connections) {
      for (const conn of result.connections) {
        // Add intermediary entities
        if (conn.intermediary && !entitiesFound.some(e => e.name.toLowerCase() === conn.intermediary.toLowerCase())) {
          const entity: AgentV2Entity = {
            name: conn.intermediary,
            type: 'unknown',
            description: conn.description
          };
          entitiesFound.push(entity);
          callbacks.onEntityFound?.(entity, true);
        }
        
        // Add relationships
        if (conn.relationship) {
          relationshipsFound.push(conn.relationship);
          callbacks.onRelationshipFound?.(conn.relationship, true);
        }
      }
    }
  }
  
  // Handle entity suggestions
  if (result.type === 'entity_suggestion' && result.entity) {
    callbacks.onEntitySuggestion?.(result.entity, result.reason || '');
  }
  
  // Handle relationship suggestions
  if (result.type === 'relationship_suggestion' && result.relationship) {
    callbacks.onRelationshipSuggestion?.(result.relationship, result.evidence || '');
  }
}

/**
 * Adapter function to use Agent V2 with the existing OrchestratorCallbacks interface.
 * This allows gradual migration from the old orchestrator to the new agent.
 */
export function streamAgentV2AsOrchestrator(
  query: string,
  context: {
    topic?: string;
    domain?: string;
    focus?: string;
    key_questions?: string[];
    entities?: Array<{ id: string; name: string; type: string }>;
    relationships?: Array<{ source: string; target: string; type: string }>;
    graph_id?: number;
  },
  callbacks: {
    onStart?: (query: string, referencedEntities: string[]) => void;
    onThinking?: (message: string, reasoning?: string) => void;
    onIntentClassified?: (intentType: string, confidence: number, message: string, reasoning?: string) => void;
    onPlanCreated?: (steps: number, plan: Array<{ step: number; goal: string; search_query: string }>, reasoning?: string) => void;
    onStepStarted?: (step: number, total: number, goal: string) => void;
    onStepComplete?: (step: number, entitiesFound: number, relationshipsFound: number) => void;
    onSearching?: (message: string) => void;
    onResearchFound?: (message: string) => void;
    onEntityFound?: (entity: any, isNew: boolean) => void;
    onRelationshipFound?: (relationship: any, isNew: boolean) => void;
    onFactFound?: (entity: string, fact: { label: string; value: string; confidence: number }) => void;
    onEnrichComplete?: (entity: string, factsFound: number) => void;
    onComplete?: (entities: any[], relationships: any[], message: string) => void;
    onError?: (message: string, recoverable: boolean) => void;
    onWarning?: (message: string) => void;
    onSuggestions?: (suggestions: Array<{ type: string; message: string; action?: string }>) => void;
    onResearchCached?: (query: string, message: string) => void;
    onGraphAnalysis?: (analysis: any) => void;
    onSanctionsAlert?: (entity: string, sanctionType: string, details: string) => void;
  },
  sessionToken?: string
): () => void {
  // Track tool calls for step simulation
  let toolCallCount = 0;
  const entitiesFound: any[] = [];
  const relationshipsFound: any[] = [];
  
  const agentCallbacks: AgentV2Callbacks = {
    onStart: (message) => {
      callbacks.onStart?.(query, []);
    },
    
    onThinking: (message, reasoning) => {
      callbacks.onThinking?.(message, reasoning);
    },
    
    onToolStart: (tool, args) => {
      toolCallCount++;
      // Simulate step started
      callbacks.onStepStarted?.(toolCallCount, toolCallCount + 1, getToolStartMessage(tool, args));
      callbacks.onSearching?.(getToolStartMessage(tool, args));
    },
    
    onToolResult: (tool, result) => {
      // Simulate step complete
      callbacks.onStepComplete?.(toolCallCount, entitiesFound.length, relationshipsFound.length);
      if (result && !result.error) {
        callbacks.onResearchFound?.(`Found results from ${tool}`);
      }
    },
    
    onEntityFound: (entity, isNew) => {
      entitiesFound.push(entity);
      callbacks.onEntityFound?.(entity, isNew);
    },
    
    onRelationshipFound: (relationship, isNew) => {
      relationshipsFound.push(relationship);
      callbacks.onRelationshipFound?.(relationship, isNew);
    },
    
    onEntitySuggestion: (entity, reason) => {
      // Emit as entity found with a flag
      callbacks.onEntityFound?.({ ...entity, is_suggestion: true }, true);
    },
    
    onRelationshipSuggestion: (relationship, evidence) => {
      // Emit as relationship found with a flag
      callbacks.onRelationshipFound?.({ ...relationship, is_suggestion: true }, true);
    },
    
    onResponse: (content) => {
      callbacks.onThinking?.(content);
    },
    
    onComplete: (response, toolCalls, usage) => {
      callbacks.onComplete?.(entitiesFound, relationshipsFound, response || 'Investigation complete');
    },
    
    onError: (message, recoverable) => {
      callbacks.onError?.(message, recoverable);
    },
    
    onContextUpdate: (context) => {
      // Could emit graph analysis here
      callbacks.onGraphAnalysis?.({
        entity_count: entitiesFound.length,
        relationship_count: relationshipsFound.length,
        central_nodes: [],
        orphans: [],
        gaps: []
      });
    }
  };
  
  return streamAgentV2Chat(query, {
    topic: context.topic,
    domain: context.domain,
    focus: context.focus,
    key_questions: context.key_questions,
    entities: context.entities,
    relationships: context.relationships,
    graph_id: context.graph_id  // v8.1: Enable claims integration
  }, agentCallbacks, sessionToken);
}
