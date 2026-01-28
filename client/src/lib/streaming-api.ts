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

const API_BASE = 'https://silent-partners-ai-api.onrender.com/api';
const API_V5 = 'https://silent-partners-ai-api.onrender.com/api/v5';

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
      const response = await fetch(`${API_V5}/extract`, {
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
      const response = await fetch(`${API_V5}/research`, {
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
  const response = await fetch(`${API_V5}/extract`, {
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
  const response = await fetch(`${API_V5}/research`, {
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
