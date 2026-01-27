/**
 * Silent Partners - Streaming API Client
 * 
 * Handles Server-Sent Events (SSE) for real-time graph construction.
 * Uses the new unified pipeline endpoints.
 */

const API_BASE = 'https://silent-partners-ai-api.onrender.com/api';

// Event types from the backend
export type PipelineEventType = 
  | 'pipeline_started'
  | 'phase_started'
  | 'phase_complete'
  | 'entity_found'
  | 'relationship_found'
  | 'cross_reference_found'
  | 'validation_issue'
  | 'validation_fixed'
  | 'pipeline_progress'
  | 'pipeline_complete'
  | 'pipeline_error';

export interface PipelineEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  importance?: number;
  context?: string;
  aliases?: string[];
  sources?: string[];
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
  onRelationshipFound?: (relationship: PipelineRelationship, isNew: boolean) => void;
  onCrossReference?: (newEntity: string, existingEntity: string, relationship: PipelineRelationship) => void;
  onProgress?: (message: string, progress?: number) => void;
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
}

/**
 * Stream graph construction from the pipeline API.
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
      const response = await fetch(`${API_BASE}/pipeline/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          source_type: sourceType,
          source_data: sourceData,
          options,
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
 * Research connections between two entities with streaming.
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
      const response = await fetch(`${API_BASE}/pipeline/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          entity1,
          entity2,
          stream: true,
          options,
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
  const response = await fetch(`${API_BASE}/pipeline/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_type: sourceType,
      source_data: sourceData,
      options,
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

  return response.json();
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
  const response = await fetch(`${API_BASE}/pipeline/research`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      entity1,
      entity2,
      stream: false,
      options,
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
  switch (event.type) {
    case 'pipeline_started':
      callbacks.onStart?.(
        event.data.pipeline_id || '',
        event.data.phase || 'unknown'
      );
      break;

    case 'phase_started':
      callbacks.onPhaseStart?.(event.data.phase || '');
      break;

    case 'phase_complete':
      callbacks.onPhaseComplete?.(event.data.phase || '');
      break;

    case 'entity_found':
      if (event.data.entity) {
        callbacks.onEntityFound?.(event.data.entity, event.data.is_new ?? true);
      }
      break;

    case 'relationship_found':
      if (event.data.relationship) {
        callbacks.onRelationshipFound?.(event.data.relationship, event.data.is_new ?? true);
      }
      break;

    case 'cross_reference_found':
      if (event.data.new_entity && event.data.existing_entity && event.data.relationship) {
        callbacks.onCrossReference?.(
          event.data.new_entity,
          event.data.existing_entity,
          event.data.relationship
        );
      }
      break;

    case 'pipeline_progress':
      callbacks.onProgress?.(
        event.data.message || '',
        event.data.progress
      );
      break;

    case 'validation_issue':
      callbacks.onValidationIssue?.(
        event.data.issue_type || '',
        event.data.entity_id
      );
      break;

    case 'validation_fixed':
      callbacks.onValidationFixed?.(
        event.data.issue_type || '',
        event.data.entity_id
      );
      break;

    case 'pipeline_complete':
      if (event.data.graph) {
        callbacks.onComplete?.(event.data.graph, event.data.stats);
      }
      break;

    case 'pipeline_error':
      callbacks.onError?.(
        event.data.error_type || 'unknown',
        event.data.message || 'An error occurred',
        event.data.recoverable ?? false,
        event.data.suggestion
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
