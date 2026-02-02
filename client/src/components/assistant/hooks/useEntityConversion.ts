/**
 * Silent Partners - Entity Conversion Hook
 * 
 * Handles conversion between pipeline entities/relationships and store format.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { useCallback, useRef } from 'react';
import { Entity, Relationship, generateId } from '@/lib/store';

type EntityType = Entity['type'];
import { PipelineEntity, PipelineRelationship } from '@/lib/streaming-api';

interface UseEntityConversionReturn {
  convertEntity: (pipelineEntity: PipelineEntity) => Entity;
  convertRelationship: (pipelineRel: PipelineRelationship) => Relationship | null;
  findEntityId: (name: string) => string | undefined;
  clearEntityMap: () => void;
  entityIdMap: React.MutableRefObject<Map<string, string>>;
  sessionEntities: React.MutableRefObject<Set<string>>;
}

/**
 * Hook for converting pipeline entities to store format
 */
export function useEntityConversion(
  existingEntities: Entity[]
): UseEntityConversionReturn {
  // Track entity IDs for relationship mapping
  const entityIdMap = useRef<Map<string, string>>(new Map());
  const sessionEntities = useRef<Set<string>>(new Set());

  // Find entity ID by name (case-insensitive)
  const findEntityId = useCallback((name: string): string | undefined => {
    const normalizedName = name.toLowerCase().trim();
    
    // First check session entities
    if (entityIdMap.current.has(normalizedName)) {
      return entityIdMap.current.get(normalizedName);
    }
    
    // Then check existing entities
    const existing = existingEntities.find(
      e => e.name.toLowerCase().trim() === normalizedName
    );
    if (existing) {
      entityIdMap.current.set(normalizedName, existing.id);
      return existing.id;
    }
    
    return undefined;
  }, [existingEntities]);

  // Convert pipeline entity to store entity
  const convertEntity = useCallback((pipelineEntity: PipelineEntity): Entity => {
    const normalizedName = pipelineEntity.name.toLowerCase().trim();
    
    // Check if we already have this entity
    let entityId = entityIdMap.current.get(normalizedName);
    if (!entityId) {
      // Check existing entities
      const existing = existingEntities.find(
        e => e.name.toLowerCase().trim() === normalizedName
      );
      entityId = existing?.id || generateId();
      entityIdMap.current.set(normalizedName, entityId);
    }
    
    sessionEntities.current.add(normalizedName);
    
    return {
      id: entityId,
      name: pipelineEntity.name,
      type: (pipelineEntity.type as EntityType) || 'unknown',
      description: pipelineEntity.description || '',
      importance: pipelineEntity.importance || 5,
      source_type: 'web',
      source_query: (pipelineEntity as any).source_query || '',
      created_at: new Date().toISOString(),
    };
  }, [existingEntities]);

  // Convert pipeline relationship to store relationship
  const convertRelationship = useCallback((pipelineRel: PipelineRelationship): Relationship | null => {
    const sourceId = findEntityId(pipelineRel.source);
    const targetId = findEntityId(pipelineRel.target);
    
    if (!sourceId || !targetId) {
      console.warn('Could not find entity IDs for relationship:', pipelineRel);
      return null;
    }
    
    // Prevent self-referential relationships
    if (sourceId === targetId) {
      console.warn('Skipping self-referential relationship:', pipelineRel);
      return null;
    }
    
    return {
      id: generateId(),
      source: sourceId,
      target: targetId,
      type: pipelineRel.type || 'related_to',
      label: pipelineRel.label || pipelineRel.type,
    };
  }, [findEntityId]);

  // Clear entity map for new query
  const clearEntityMap = useCallback(() => {
    entityIdMap.current.clear();
    sessionEntities.current.clear();
  }, []);

  return {
    convertEntity,
    convertRelationship,
    findEntityId,
    clearEntityMap,
    entityIdMap,
    sessionEntities,
  };
}

export default useEntityConversion;
