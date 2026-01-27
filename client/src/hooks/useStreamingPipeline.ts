/**
 * Silent Partners - Streaming Pipeline Hook
 * 
 * Custom hook for integrating the streaming pipeline with the network context.
 * Provides real-time entity/relationship addition with progress tracking.
 */

import { useState, useCallback, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { generateId, Entity, Relationship } from '@/lib/store';
import { 
  streamPipeline, 
  streamResearch, 
  extractPipeline,
  PipelineEntity, 
  PipelineRelationship,
  PipelineOptions,
  StreamingCallbacks 
} from '@/lib/streaming-api';
import { toast } from 'sonner';

export interface StreamingState {
  isStreaming: boolean;
  phase: string;
  progress: string;
  entitiesFound: number;
  relationshipsFound: number;
  error: string | null;
}

export interface UseStreamingPipelineReturn {
  state: StreamingState;
  startExtraction: (sourceType: 'text' | 'pdf' | 'url' | 'query', sourceData: string, options?: PipelineOptions & { clearFirst?: boolean }) => void;
  startResearch: (entity1: string, entity2: string, options?: PipelineOptions & { clearFirst?: boolean }) => void;
  cancel: () => void;
}

/**
 * Convert pipeline entity to our Entity format.
 */
function convertEntity(pipelineEntity: PipelineEntity): Entity {
  return {
    id: generateId(),
    name: pipelineEntity.name,
    type: (pipelineEntity.type as Entity['type']) || 'unknown',
    description: pipelineEntity.description,
    importance: pipelineEntity.importance || 5,
  };
}

/**
 * Custom hook for streaming pipeline operations.
 */
export function useStreamingPipeline(): UseStreamingPipelineReturn {
  const { addEntity, addRelationship, addEntitiesAndRelationships, clearNetwork, network } = useNetwork();
  
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    phase: '',
    progress: '',
    entitiesFound: 0,
    relationshipsFound: 0,
    error: null,
  });
  
  // Track entity ID mapping (pipeline ID -> our ID)
  const entityIdMap = useRef<Map<string, string>>(new Map());
  // Track entities added during this stream
  const addedEntities = useRef<Entity[]>([]);
  // Abort function reference
  const abortRef = useRef<(() => void) | null>(null);
  
  const resetState = useCallback(() => {
    entityIdMap.current.clear();
    addedEntities.current = [];
    setState({
      isStreaming: false,
      phase: '',
      progress: '',
      entitiesFound: 0,
      relationshipsFound: 0,
      error: null,
    });
  }, []);
  
  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      toast.info('Operation cancelled');
      resetState();
    }
  }, [resetState]);
  
  /**
   * Create streaming callbacks that update state and add to network.
   */
  const createCallbacks = useCallback((clearFirst: boolean): StreamingCallbacks => {
    let hasCleared = false;
    
    return {
      onStart: (pipelineId, sourceType) => {
        if (clearFirst && !hasCleared) {
          clearNetwork();
          hasCleared = true;
        }
        setState(s => ({ ...s, isStreaming: true, phase: 'Starting...' }));
        toast.info('Building network...', { id: 'pipeline-progress' });
      },
      
      onPhaseStart: (phase) => {
        const phaseLabels: Record<string, string> = {
          'text_extraction': 'Extracting text...',
          'entity_extraction': 'Finding entities...',
          'relationship_extraction': 'Finding relationships...',
          'cross_reference': 'Cross-referencing...',
          'validation': 'Validating graph...',
          'research': 'Researching connections...',
        };
        setState(s => ({ ...s, phase: phaseLabels[phase] || phase }));
      },
      
      onPhaseComplete: (phase) => {
        // Phase complete, progress continues
      },
      
      onEntityFound: (pipelineEntity, isNew) => {
        if (!isNew) return; // Skip duplicates
        
        const entity = convertEntity(pipelineEntity);
        
        // Store mapping from pipeline ID to our ID
        entityIdMap.current.set(pipelineEntity.id, entity.id);
        entityIdMap.current.set(pipelineEntity.name.toLowerCase(), entity.id);
        
        // Add to network
        addEntity({
          name: entity.name,
          type: entity.type,
          description: entity.description,
          importance: entity.importance,
        });
        
        // Track for relationship mapping
        addedEntities.current.push(entity);
        
        setState(s => ({ 
          ...s, 
          entitiesFound: s.entitiesFound + 1,
          progress: `Found: ${entity.name}` 
        }));
      },
      
      onRelationshipFound: (pipelineRel, isNew) => {
        if (!isNew) return;
        
        // Map source and target IDs
        const sourceId = entityIdMap.current.get(pipelineRel.source) || 
                        entityIdMap.current.get(pipelineRel.source.toLowerCase());
        const targetId = entityIdMap.current.get(pipelineRel.target) || 
                        entityIdMap.current.get(pipelineRel.target.toLowerCase());
        
        if (!sourceId || !targetId) {
          console.warn('Could not map relationship:', pipelineRel);
          return;
        }
        
        addRelationship({
          source: sourceId,
          target: targetId,
          type: pipelineRel.type,
          label: pipelineRel.label || pipelineRel.type,
        });
        
        setState(s => ({ 
          ...s, 
          relationshipsFound: s.relationshipsFound + 1 
        }));
      },
      
      onCrossReference: (newEntity, existingEntity, relationship) => {
        // Cross-reference connects new entity to existing one
        setState(s => ({ 
          ...s, 
          progress: `Connected: ${newEntity} ↔ ${existingEntity}` 
        }));
      },
      
      onProgress: (message, progress) => {
        setState(s => ({ ...s, progress: message }));
        toast.loading(message, { id: 'pipeline-progress' });
      },
      
      onValidationIssue: (issueType, entityId) => {
        console.log('Validation issue:', issueType, entityId);
      },
      
      onValidationFixed: (issueType, entityId) => {
        console.log('Validation fixed:', issueType, entityId);
      },
      
      onComplete: (graph, stats) => {
        toast.success(
          `Complete! ${stats?.entities_found || graph.entities.length} entities, ${stats?.relationships_found || graph.relationships.length} relationships`,
          { id: 'pipeline-progress' }
        );
        resetState();
      },
      
      onError: (errorType, message, recoverable, suggestion) => {
        console.error('Pipeline error:', errorType, message);
        setState(s => ({ ...s, error: message, isStreaming: false }));
        
        if (suggestion) {
          toast.error(`${message}. ${suggestion}`, { id: 'pipeline-progress' });
        } else {
          toast.error(message, { id: 'pipeline-progress' });
        }
      },
    };
  }, [addEntity, addRelationship, clearNetwork, resetState]);
  
  /**
   * Start streaming extraction from text, PDF, URL, or query.
   */
  const startExtraction = useCallback((
    sourceType: 'text' | 'pdf' | 'url' | 'query',
    sourceData: string,
    options: PipelineOptions & { clearFirst?: boolean } = {}
  ) => {
    const { clearFirst = false, ...pipelineOptions } = options;
    
    // Reset state
    entityIdMap.current.clear();
    addedEntities.current = [];
    setState({
      isStreaming: true,
      phase: 'Initializing...',
      progress: '',
      entitiesFound: 0,
      relationshipsFound: 0,
      error: null,
    });
    
    // Include existing entities for cross-referencing if not clearing
    if (!clearFirst && network.entities.length > 0) {
      pipelineOptions.existing_entities = network.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
      }));
      pipelineOptions.existing_relationships = network.relationships.map(r => ({
        source: r.source,
        target: r.target,
      }));
      pipelineOptions.enable_cross_reference = true;
      
      // Pre-populate ID map with existing entities
      network.entities.forEach(e => {
        entityIdMap.current.set(e.id, e.id);
        entityIdMap.current.set(e.name.toLowerCase(), e.id);
      });
    }
    
    const callbacks = createCallbacks(clearFirst);
    abortRef.current = streamPipeline(sourceType, sourceData, callbacks, pipelineOptions);
  }, [createCallbacks, network.entities, network.relationships]);
  
  /**
   * Start streaming research between two entities.
   */
  const startResearch = useCallback((
    entity1: string,
    entity2: string,
    options: PipelineOptions & { clearFirst?: boolean } = {}
  ) => {
    const { clearFirst = false, ...pipelineOptions } = options;
    
    // Reset state
    entityIdMap.current.clear();
    addedEntities.current = [];
    setState({
      isStreaming: true,
      phase: 'Researching connections...',
      progress: `Finding connections between ${entity1} and ${entity2}`,
      entitiesFound: 0,
      relationshipsFound: 0,
      error: null,
    });
    
    // Include existing entities for cross-referencing
    if (!clearFirst && network.entities.length > 0) {
      pipelineOptions.existing_entities = network.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
      }));
      pipelineOptions.enable_cross_reference = true;
      
      network.entities.forEach(e => {
        entityIdMap.current.set(e.id, e.id);
        entityIdMap.current.set(e.name.toLowerCase(), e.id);
      });
    }
    
    const callbacks = createCallbacks(clearFirst);
    abortRef.current = streamResearch(entity1, entity2, callbacks, pipelineOptions);
  }, [createCallbacks, network.entities]);
  
  return {
    state,
    startExtraction,
    startResearch,
    cancel,
  };
}

export default useStreamingPipeline;
