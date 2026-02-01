/**
 * Silent Partners - Streaming API Client v5.1
 *
 * Handles Server-Sent Events (SSE) for real-time graph construction.
 * Uses the new smart extraction endpoints with:
 * - Incremental entity resolution
 * - Immediate relationship finding
 * - Centrality-based ordering
 * - Visual feedback events
 * - Context-aware extraction (uses existing graph entities)
 */

// API URLs - environment variables with validation
const ENV_API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;
const ENV_API_V5 = import.meta.env.VITE_API_V5;

// Validate in production
if (!ENV_API_BASE && import.meta.env.PROD) {
  console.error('VITE_API_URL environment variable is required in production');
}

// Get API base URL with development fallback
const getApiBase = () => {
  if (ENV_API_BASE) return ENV_API_BASE;
  if (import.meta.env.DEV) {
    console.warn('VITE_API_URL not set, using default development URL');
    return 'https://silent-partners-ai-api.onrender.com/api';
  }
  throw new Error('VITE_API_URL environment variable is required');
};

// Get API V5 URL with development fallback
const getApiV5 = () => {
  if (ENV_API_V5) return ENV_API_V5;
  if (import.meta.env.DEV) {
    return 'https://silent-partners-ai-api.onrender.com/api/v5';
  }
  // Fall back to base API + /v5 if V5 not explicitly set
  // Note: getApiBase() should return URL ending with /api
  return `${getApiBase()}/v5`;
};

// Event types from the backend
export type PipelineEventType = 
  | 'pipeline_started'
  | 'phase_started'
  | 'phase_complete'
  | 'entity_found'
  | 'entity_merged'
  | 'relationship_found'
  | 'cross_reference_found'
  | 'validation_issue'
  | 'validation_fixed'
  | 'pipeline_progress'
  | 'pipeline_complete'
  | 'pipeline_error'
  // v5 smart events
  | 'extraction_started'
  | 'extraction_complete'
  | 'research_started'
  | 'research_found'
  | 'research_complete'
  | 'searching'
  | 'connecting'
  | 'progress'
  | 'context_loaded'
  | 'context_resolved'
  | 'error';

export interface PipelineEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  importance?: number;
  context?: string;
  aliases?: string[];
  sources?: string[];
  is_target?: boolean;
}

export interface PipelineRelationship {
  id: string;
  source: string;
  target: string;
  source_name?: string;
  target_name?: string;
  type: string;
  label?: string;
  description?: string;
  evidence?: string;
  confidence?: number;
  date?: string;
}

export interface PipelineEvent {
  type: PipelineEventType;
  data: {
    // Common fields
    pipeline_id?: string;
    phase?: string;
    message?: string;
    
    // Entity events
    entity?: PipelineEntity;
    is_new?: boolean;
    is_target?: boolean;
    merged_with?: string;
    
    // Relationship events
    relationship?: PipelineRelationship;
    
    // Cross-reference events
    new_entity?: string;
    existing_entity?: string;
    
    // Validation events
    issue_type?: string;
    entity_id?: string;
    
    // Progress events
    progress?: number;
    current?: number;
    total?: number;
    count?: number;
    
    // Complete event
    graph?: {
      entities: PipelineEntity[];
      relationships: PipelineRelationship[];
    };
    stats?: {
      entities_found: number;
      relationships_found: number;
      cross_references: number;
      validation_fixes: number;
    };
    total_entities?: number;
    total_relationships?: number;
    most_connected?: string[];
    
    // Error events
    error_type?: string;
    recoverable?: boolean;
    suggestion?: string;
  };
}

export interface StreamingCallbacks {
  onStart?: (pipelineId: string, sourceType: string) => void;
  onPhaseStart?: (phase: string) => void;
  onPhaseComplete?: (phase: string) => void;
  onEntityFound?: (entity: PipelineEntity, isNew: boolean) => void;
  onEntityMerged?: (entity: PipelineEntity, message: string) => void;
  onRelationshipFound?: (relationship: PipelineRelationship, isNew: boolean) => void;
  onCrossReference?: (newEntity: string, existingEntity: string, relationship: PipelineRelationship) => void;
  onProgress?: (message: string, progress?: number) => void;
  onSearching?: (message: string, entity?: string) => void;
  onConnecting?: (entity: string) => void;
  onContextLoaded?: (count: number, message: string) => void;
  onContextResolved?: (original: string, rewritten: string, inputType: string, confidence: number) => void;
  onValidationIssue?: (issueType: string, entityId?: string) => void;
  onValidationFixed?: (issueType: string, entityId?: string) => void;
  onComplete?: (graph: { entities: PipelineEntity[]; relationships: PipelineRelationship[] }, stats: any) => void;
  onError?: (errorType: string, message: string, recoverable: boolean, suggestion?: string) => void;
}

export interface PipelineOptions {
  enable_cross_reference?: boolean;
  existing_entities?: Array<{ id: string; name: string; type: string }>;
  existing_relationships?: Array<{ source: string; target: string }>;
  max_entities?: number;
  include_locations?: boolean;
  include_organizations?: boolean;
  target_entities?: string[];
}

/**
 * Stream graph construction from the v5 smart API.
 * Uses research best practices:
 * - Incremental entity resolution (no duplicates)
 * - Immediate relationship finding (entities connect as they appear)
 * - Centrality-based ordering (most connected first)
 * - Visual feedback (searching, connecting animations)
 * - Context-aware extraction (recognizes existing graph entities)
 * 
 * Returns an abort function to cancel the stream.
 */
export function streamPipeline(
  sourceType: 'text' | 'pdf' | 'url' | 'query' | 'expand',
  sourceData: string,
  callbacks: StreamingCallbacks,
  options: PipelineOptions = {}
): () => void {
  const abortController = new AbortController();
  
  const runStream = async () => {
    try {
      // Use v5 smart endpoint with existing entities for context
      const response = await fetch(`${getApiV5()}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          text: sourceData,
          stream: true,
          existing_entities: options.existing_entities || [],
          existing_relationships: options.existing_relationships || [],
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Stream failed' }));
        callbacks.onError?.('request_failed', error.error || `HTTP ${response.status}`, false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('no_stream', 'No response stream available', false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: PipelineEvent = JSON.parse(line.slice(6));
              handleEvent(event, callbacks);
            } catch (e) {
              console.warn('Failed to parse SSE event:', line, e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Stream was cancelled, not an error
        return;
      }
      callbacks.onError?.(
        'stream_error',
        error instanceof Error ? error.message : 'Stream connection failed',
        true,
        'Please try again'
      );
    }
  };

  runStream();

  // Return abort function
  return () => abortController.abort();
}

/**
 * Research connections between two entities with v5 smart streaming.
 * Target entities appear immediately, then intermediaries stream in with relationships.
 * Uses semantic deduplication and immediate relationship finding.
 * Context-aware: recognizes entities already in the graph.
 */
export function streamResearch(
  entity1: string,
  entity2: string,
  callbacks: StreamingCallbacks,
  options: PipelineOptions = {}
): () => void {
  const abortController = new AbortController();
  
  const runStream = async () => {
    try {
      // Use v5 smart research endpoint with existing entities for context
      const response = await fetch(`${getApiV5()}/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          entity1,
          entity2,
          stream: true,
          existing_entities: options.existing_entities || [],
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Research failed' }));
        callbacks.onError?.('request_failed', error.error || `HTTP ${response.status}`, false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('no_stream', 'No response stream available', false);
        return;
      }

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
              const event: PipelineEvent = JSON.parse(line.slice(6));
              handleEvent(event, callbacks);
            } catch (e) {
              console.warn('Failed to parse SSE event:', line, e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      callbacks.onError?.(
        'stream_error',
        error instanceof Error ? error.message : 'Research connection failed',
        true,
        'Please try again'
      );
    }
  };

  runStream();

  return () => abortController.abort();
}

/**
 * Non-streaming extraction (for smaller documents or when streaming isn't needed).
 */
export async function extractPipeline(
  sourceType: 'text' | 'pdf' | 'url' | 'query',
  sourceData: string,
  options: PipelineOptions = {}
): Promise<{
  success: boolean;
  graph?: {
    entities: PipelineEntity[];
    relationships: PipelineRelationship[];
  };
  stats?: {
    entities_found: number;
    relationships_found: number;
    cross_references: number;
  };
  error?: string;
  suggestion?: string;
}> {
  const response = await fetch(`${getApiV5()}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: sourceData,
      stream: false,
      existing_entities: options.existing_entities || [],
      existing_relationships: options.existing_relationships || [],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Extraction failed' }));
    return {
      success: false,
      error: error.error || `HTTP ${response.status}`,
      suggestion: error.suggestion,
    };
  }

  const result = await response.json();
  return {
    success: true,
    graph: {
      entities: result.entities || [],
      relationships: result.relationships || [],
    },
    stats: {
      entities_found: result.total_entities || result.entities?.length || 0,
      relationships_found: result.total_relationships || result.relationships?.length || 0,
      cross_references: 0,
    },
  };
}

/**
 * Non-streaming connection research.
 */
export async function researchConnection(
  entity1: string,
  entity2: string,
  options: PipelineOptions = {}
): Promise<{
  entities: PipelineEntity[];
  relationships: PipelineRelationship[];
  error?: string;
}> {
  const response = await fetch(`${getApiV5()}/research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entity1,
      entity2,
      stream: false,
      existing_entities: options.existing_entities || [],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Research failed' }));
    return {
      entities: [],
      relationships: [],
      error: error.error || `HTTP ${response.status}`,
    };
  }

  return response.json();
}

/**
 * Handle individual pipeline events and dispatch to callbacks.
 */
function handleEvent(event: PipelineEvent, callbacks: StreamingCallbacks) {
  const eventData = event.data as any;
  
  switch (event.type) {
    // v5 smart events
    case 'extraction_started':
    case 'research_started':
      callbacks.onStart?.('', 'extraction');
      callbacks.onProgress?.(eventData.message || 'Starting...', undefined);
      break;

    case 'context_loaded':
      callbacks.onContextLoaded?.(eventData.count || 0, eventData.message || 'Context loaded');
      callbacks.onProgress?.(eventData.message || `Loaded ${eventData.count} existing entities`, undefined);
      break;

    case 'context_resolved':
      callbacks.onContextResolved?.(
        eventData.original || '',
        eventData.rewritten || '',
        eventData.input_type || 'ENTITY_ADD',
        eventData.confidence || 1.0
      );
      // Show what was understood
      if (eventData.original !== eventData.rewritten) {
        callbacks.onProgress?.(`Understood: "${eventData.rewritten}"`, undefined);
      }
      break;

    case 'searching':
      callbacks.onSearching?.(eventData.message || 'Searching...', eventData.entity);
      callbacks.onProgress?.(eventData.message || 'Searching...', undefined);
      break;

    case 'connecting':
      callbacks.onConnecting?.(eventData.entity || '');
      callbacks.onProgress?.(eventData.message || `Finding connections for ${eventData.entity}...`, undefined);
      break;

    case 'entity_merged':
      callbacks.onEntityMerged?.(eventData.entity, eventData.message || 'Merged with existing entity');
      callbacks.onProgress?.(eventData.message || 'Merged duplicate entity', undefined);
      break;

    case 'extraction_complete':
    case 'research_complete':
      callbacks.onComplete?.({
        entities: eventData.entities || [],
        relationships: eventData.relationships || []
      }, {
        entities_found: eventData.total_entities || 0,
        relationships_found: eventData.total_relationships || 0,
        most_connected: eventData.most_connected || [],
        cross_references: 0,
        validation_fixes: 0
      });
      break;

    case 'research_found':
      callbacks.onProgress?.(eventData.message || 'Research data found', undefined);
      break;

    case 'progress':
      callbacks.onProgress?.(eventData.message || 'Processing...', eventData.progress);
      break;

    case 'error':
      callbacks.onError?.(
        'extraction_error',
        eventData.message || 'An error occurred',
        true,
        'Please try again'
      );
      break;

    // Entity events
    case 'entity_found':
      // Handle both single entity and array of entities
      if (eventData.entities && Array.isArray(eventData.entities)) {
        for (const entity of eventData.entities) {
          callbacks.onEntityFound?.(entity, true);
        }
      } else if (eventData.entity) {
        callbacks.onEntityFound?.(eventData.entity, eventData.is_new ?? true);
      }
      break;

    // Relationship events
    case 'relationship_found':
      if (eventData.relationship) {
        callbacks.onRelationshipFound?.(eventData.relationship, eventData.is_new ?? true);
      }
      break;

    // Legacy events for backwards compatibility
    case 'pipeline_started':
      callbacks.onStart?.(
        eventData.pipeline_id || '',
        eventData.phase || 'unknown'
      );
      break;

    case 'phase_started':
      callbacks.onPhaseStart?.(eventData.phase || '');
      break;

    case 'phase_complete':
      callbacks.onPhaseComplete?.(eventData.phase || '');
      break;

    case 'cross_reference_found':
      if (eventData.new_entity && eventData.existing_entity && eventData.relationship) {
        callbacks.onCrossReference?.(
          eventData.new_entity,
          eventData.existing_entity,
          eventData.relationship
        );
      }
      break;

    case 'pipeline_progress':
      callbacks.onProgress?.(
        eventData.message || '',
        eventData.progress
      );
      break;

    case 'validation_issue':
      callbacks.onValidationIssue?.(
        eventData.issue_type || '',
        eventData.entity_id
      );
      break;

    case 'validation_fixed':
      callbacks.onValidationFixed?.(
        eventData.issue_type || '',
        eventData.entity_id
      );
      break;

    case 'pipeline_complete':
      if (eventData.graph) {
        callbacks.onComplete?.(eventData.graph, eventData.stats);
      }
      break;

    case 'pipeline_error':
      callbacks.onError?.(
        eventData.error_type || 'unknown',
        eventData.message || 'An error occurred',
        eventData.recoverable ?? false,
        eventData.suggestion
      );
      break;
  }
}

export default {
  streamPipeline,
  streamResearch,
  extractPipeline,
  researchConnection,
};


// Agent V2 API - uses the new tool-calling agent with Modal serverless processing
// This replaces the old v6 orchestrator which had gevent compatibility issues
const getAgentV2Api = () => {
  return `${getApiBase()}/v2/agent-v2`;
};

// Legacy v6 API (kept for reference, but no longer used)
const ENV_API_V6 = import.meta.env.VITE_API_V6;
const getApiV6 = () => {
  if (ENV_API_V6) return ENV_API_V6;
  if (import.meta.env.DEV) {
    return 'https://silent-partners-ai-api.onrender.com/api/v6';
  }
  return `${getApiBase()}/v6`;
};

// Orchestrator event types
export type OrchestratorEventType =
  | 'orchestrator_started'
  | 'orchestrator_thinking'
  | 'intent_classified'
  | 'plan_created'
  | 'step_started'
  | 'step_complete'
  | 'step_warning'
  | 'step_error'
  | 'searching'
  | 'research_found'
  | 'entity_found'
  | 'relationship_found'
  | 'fact_found'
  | 'enrich_complete'
  | 'orchestrator_complete'
  | 'suggestions'  // NEW v2.0
  | 'research_cached'  // NEW v2.0
  | 'graph_analysis'  // NEW v2.0
  | 'sanctions_alert'  // Sanctions warning
  | 'using_cached_research'  // Backend compatibility
  | 'error';

export interface OrchestratorCallbacks {
  onStart?: (query: string, referencedEntities: string[]) => void;
  onThinking?: (message: string, reasoning?: string) => void;
  onIntentClassified?: (intentType: string, confidence: number, message: string, reasoning?: string) => void;
  onPlanCreated?: (steps: number, plan: Array<{ step: number; goal: string; search_query: string }>, reasoning?: string) => void;
  onStepStarted?: (step: number, total: number, goal: string) => void;
  onStepComplete?: (step: number, entitiesFound: number, relationshipsFound: number) => void;
  onSearching?: (message: string) => void;
  onResearchFound?: (message: string) => void;
  onEntityFound?: (entity: PipelineEntity, isNew: boolean) => void;
  onRelationshipFound?: (relationship: PipelineRelationship, isNew: boolean) => void;
  onFactFound?: (entity: string, fact: { label: string; value: string; confidence: number }) => void;
  onEnrichComplete?: (entity: string, factsFound: number) => void;
  onComplete?: (entities: PipelineEntity[], relationships: PipelineRelationship[], message: string) => void;
  onError?: (message: string, recoverable: boolean) => void;
  onWarning?: (message: string) => void;
  // NEW v2.0 callbacks
  onSuggestions?: (suggestions: Array<{ type: string; message: string; action?: string }>) => void;
  onResearchCached?: (query: string, message: string) => void;
  onGraphAnalysis?: (analysis: { entity_count: number; relationship_count: number; central_nodes: string[]; orphans: string[]; gaps: string[] }) => void;
  onSanctionsAlert?: (entity: string, sanctionType: string, details: string) => void;
  // Context management callbacks
  onContextUpdate?: (context: {
    title?: string;
    description?: string;
    key_findings?: string[];
    red_flags?: Array<{description: string; severity: string; entities_involved?: string[]}>;
    next_steps?: Array<{suggestion: string; reasoning: string; priority?: string; action_query: string}>;
    update_type?: string;
  }) => void;
}

export interface InvestigationContext {
  topic?: string;
  domain?: string;
  focus?: string;
  key_questions?: string[];
  entities?: Array<{ id: string; name: string; type: string }>;
  relationships?: Array<{ source: string; target: string; type: string }>;
  graph_id?: number;  // NEW: For research memory
}

/**
 * Stream orchestrated query execution using Agent V2.
 * The Agent V2 uses OpenAI function calling with Modal serverless processing.
 * 
 * Supports /EntityName syntax to reference entities from the graph.
 * 
 * NOTE: This now uses the Agent V2 endpoint instead of the legacy v6 orchestrator
 * which had compatibility issues with gevent workers.
 */
export function streamOrchestrate(
  query: string,
  context: InvestigationContext,
  callbacks: OrchestratorCallbacks
): () => void {
  const abortController = new AbortController();
  let lastActivityTime = Date.now();
  let timeoutId: NodeJS.Timeout | null = null;
  const TIMEOUT_MS = 180000; // 3 minute timeout (agent may need more time for tool calls)
  
  // Track entities and relationships found during this session
  const entitiesFound: PipelineEntity[] = [];
  const relationshipsFound: PipelineRelationship[] = [];
  let toolCallCount = 0;
  
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
    
    try {
      // Use Agent V2 endpoint instead of legacy v6 orchestrator
      const response = await fetch(`${getAgentV2Api()}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message: query,
          entities: context.entities || [],
          relationships: context.relationships || [],
          history: [],
          investigation_context: {
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
        const error = await response.json().catch(() => ({ error: 'Orchestration failed' }));
        callbacks.onError?.(error.error || `HTTP ${response.status}`, false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        callbacks.onError?.('No response stream available', false);
        return;
      }

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
              // Handle Agent V2 events and map to orchestrator callbacks
              handleAgentV2Event(event, callbacks, entitiesFound, relationshipsFound, toolCallCount);
              if (event.type === 'tool_start') toolCallCount++;
            } catch (e) {
              console.warn('Failed to parse agent event:', line, e);
            }
          }
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
 * Get a user-friendly message for tool start events.
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
 * Handle Agent V2 events and map to orchestrator callbacks.
 * This provides backward compatibility with the existing UI.
 */
function handleAgentV2Event(
  event: { type: string; [key: string]: any },
  callbacks: OrchestratorCallbacks,
  entitiesFound: PipelineEntity[],
  relationshipsFound: PipelineRelationship[],
  toolCallCount: number
) {
  switch (event.type) {
    case 'thinking':
      callbacks.onThinking?.(event.content || 'Thinking...');
      break;
      
    case 'tool_start':
      // Simulate step started
      const toolMessage = getToolStartMessage(event.tool, event.arguments || {});
      callbacks.onStepStarted?.(toolCallCount + 1, toolCallCount + 2, toolMessage);
      callbacks.onSearching?.(toolMessage);
      callbacks.onThinking?.(toolMessage);
      break;
      
    case 'tool_result':
      // Simulate step complete
      callbacks.onStepComplete?.(toolCallCount, entitiesFound.length, relationshipsFound.length);
      if (event.result && !event.result.error) {
        callbacks.onResearchFound?.(`Found results from ${event.tool}`);
        
        // Extract entities from tool results
        if (event.result.entities) {
          for (const entity of event.result.entities) {
            if (!entitiesFound.some(e => e.name?.toLowerCase() === entity.name?.toLowerCase())) {
              entitiesFound.push(entity);
              callbacks.onEntityFound?.(entity, true);
            }
          }
        }
        
        // Extract related entities from enrich results
        if (event.result.related_entities) {
          for (const entity of event.result.related_entities) {
            if (!entitiesFound.some(e => e.name?.toLowerCase() === entity.name?.toLowerCase())) {
              entitiesFound.push(entity);
              callbacks.onEntityFound?.(entity, true);
            }
          }
        }
        
        // Extract connections
        if (event.result.connections) {
          for (const conn of event.result.connections) {
            if (conn.relationship) {
              relationshipsFound.push(conn.relationship);
              callbacks.onRelationshipFound?.(conn.relationship, true);
            }
          }
        }
        
        // Handle entity suggestions
        if (event.result.type === 'entity_suggestion' && event.result.entity) {
          callbacks.onEntityFound?.({ ...event.result.entity, is_suggestion: true }, true);
        }
        
        // Handle relationship suggestions
        if (event.result.type === 'relationship_suggestion' && event.result.relationship) {
          // Map backend relationship format to frontend format
          const rel = event.result.relationship;
          const mappedRelationship = {
            source: rel.source,
            target: rel.target,
            label: rel.type || rel.label || 'connected to',
            type: rel.relationship_type || 'connection',
            is_suggestion: true,
            evidence: event.result.evidence
          };
          relationshipsFound.push(mappedRelationship);
          callbacks.onRelationshipFound?.(mappedRelationship, true);
        }
      }
      break;
      
    case 'response':
      callbacks.onThinking?.(event.content || '');
      break;
      
    case 'suggestions':
      // Handle entity suggestions
      if (event.entities) {
        for (const suggestion of event.entities) {
          if (suggestion.entity) {
            callbacks.onEntityFound?.({ ...suggestion.entity, is_suggestion: true }, true);
          }
        }
      }
      // Handle relationship suggestions
      if (event.relationships) {
        for (const suggestion of event.relationships) {
          if (suggestion.relationship) {
            // Map backend relationship format to frontend format
            // Backend sends: { source, target, type } where type is the relationship description
            // Frontend expects: { source, target, label } where label is the relationship description
            const rel = suggestion.relationship;
            const mappedRelationship = {
              source: rel.source,
              target: rel.target,
              label: rel.type || rel.label || 'connected to',
              type: rel.relationship_type || 'connection',
              is_suggestion: true,
              evidence: suggestion.evidence
            };
            relationshipsFound.push(mappedRelationship);
            callbacks.onRelationshipFound?.(mappedRelationship, true);
          }
        }
      }
      break;
      
    case 'context_update':
      // Emit context update with investigation metadata
      if (event.context) {
        callbacks.onContextUpdate?.({
          title: event.context.title,
          description: event.context.description,
          key_findings: event.context.key_findings,
          red_flags: event.context.red_flags,
          next_steps: event.context.next_steps,
          update_type: event.update_type
        });
      }
      // Also emit graph analysis
      callbacks.onGraphAnalysis?.({
        entity_count: entitiesFound.length,
        relationship_count: relationshipsFound.length,
        central_nodes: [],
        orphans: [],
        gaps: []
      });
      break;
      
    case 'complete':
      callbacks.onComplete?.(
        entitiesFound,
        relationshipsFound,
        event.response || 'Investigation complete'
      );
      break;
      
    case 'error':
      callbacks.onError?.(event.error || 'An error occurred', false);
      break;
      
    // Legacy event types for backward compatibility
    case 'orchestrator_started':
      callbacks.onStart?.(event.data?.query || '', event.data?.referenced_entities || []);
      break;
      
    case 'orchestrator_thinking':
      callbacks.onThinking?.(event.data?.message || 'Thinking...');
      break;
      
    case 'entity_found':
      if (event.data?.entity) {
        entitiesFound.push(event.data.entity);
        callbacks.onEntityFound?.(event.data.entity, event.data.is_new !== false);
      }
      break;
      
    case 'relationship_found':
      if (event.data?.relationship) {
        relationshipsFound.push(event.data.relationship);
        callbacks.onRelationshipFound?.(event.data.relationship, event.data.is_new !== false);
      }
      break;
      
    case 'orchestrator_complete':
      callbacks.onComplete?.(
        event.data?.entities || entitiesFound,
        event.data?.relationships || relationshipsFound,
        event.data?.message || 'Complete'
      );
      break;
  }
}
