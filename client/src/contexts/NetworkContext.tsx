/**
 * Silent Partners - Network Context
 * 
 * Global state management for the network visualization.
 * Includes smart deduplication and entity merging.
 */

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { 
  Network, 
  Entity, 
  Relationship, 
  NetworkState, 
  initialState, 
  initialNetwork,
  generateId 
} from '@/lib/store';

import { InvestigationContext } from '@/lib/store';

/**
 * Normalize entity name for comparison.
 * Handles common variations like "Inc.", "Corp.", "LLC", etc.
 */
function normalizeEntityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/,?\s*(inc\.?|corp\.?|llc\.?|ltd\.?|co\.?|company|corporation|incorporated)$/i, '')
    .replace(/\s*\([^)]*\)\s*$/, '') // Remove parenthetical suffixes like "(Meta Platforms)"
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if two entity names are similar enough to be considered duplicates.
 */
function areNamesSimilar(name1: string, name2: string): boolean {
  const norm1 = normalizeEntityName(name1);
  const norm2 = normalizeEntityName(name2);
  
  // Exact match after normalization
  if (norm1 === norm2) return true;
  
  // One is a substring of the other (e.g., "Tesla" vs "Tesla, Inc.")
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check for common abbreviations
  const abbrev1 = norm1.split(' ').map(w => w[0]).join('');
  const abbrev2 = norm2.split(' ').map(w => w[0]).join('');
  if (abbrev1.length > 2 && abbrev1 === norm2) return true;
  if (abbrev2.length > 2 && abbrev2 === norm1) return true;
  
  return false;
}

/**
 * Find an existing entity that matches the given entity.
 */
function findMatchingEntity(entities: Entity[], newEntity: Entity): Entity | null {
  for (const existing of entities) {
    if (areNamesSimilar(existing.name, newEntity.name)) {
      // Also check type if both have types
      if (newEntity.type && existing.type && newEntity.type !== existing.type) {
        continue; // Different types, not a match
      }
      return existing;
    }
  }
  return null;
}

/**
 * Merge two entities, keeping the best data from each.
 */
function mergeEntities(existing: Entity, incoming: Entity): Entity {
  return {
    ...existing,
    // Keep the longer/more descriptive name
    name: incoming.name.length > existing.name.length ? incoming.name : existing.name,
    // Merge descriptions
    description: incoming.description || existing.description,
    // Keep the more specific type
    type: incoming.type || existing.type,
    // Merge aliases
    aliases: [...new Set([...(existing.aliases || []), ...(incoming.aliases || []), existing.name, incoming.name])],
    // Keep higher importance
    importance: Math.max(existing.importance || 5, incoming.importance || 5),
    // Merge sources
    sources: [...new Set([...(existing.sources || []), ...(incoming.sources || [])])],
    // Keep existing ID
    id: existing.id,
  };
}

type NetworkAction =
  | { type: 'SET_NETWORK'; payload: Network }
  | { type: 'UPDATE_NETWORK'; payload: Partial<Network> }
  | { type: 'ADD_ENTITY'; payload: Entity }
  | { type: 'ADD_OR_MERGE_ENTITY'; payload: Entity }
  | { type: 'MERGE_ENTITY'; payload: { existingId: string; incoming: Entity } }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; updates: Partial<Entity> } }
  | { type: 'DELETE_ENTITY'; payload: string }
  | { type: 'ADD_RELATIONSHIP'; payload: Relationship }
  | { type: 'ADD_OR_MERGE_RELATIONSHIP'; payload: Relationship }
  | { type: 'UPDATE_RELATIONSHIP'; payload: { id: string; updates: Partial<Relationship> } }
  | { type: 'DELETE_RELATIONSHIP'; payload: string }
  | { type: 'ADD_ENTITIES_AND_RELATIONSHIPS'; payload: { entities: Entity[]; relationships: Relationship[] } }
  | { type: 'SELECT_ENTITY'; payload: string | null }
  | { type: 'SELECT_RELATIONSHIP'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_INVESTIGATION_CONTEXT'; payload: InvestigationContext }
  | { type: 'DEDUPLICATE_NETWORK' }
  | { type: 'CLEAR_NETWORK' };

function networkReducer(state: NetworkState, action: NetworkAction): NetworkState {
  switch (action.type) {
    case 'SET_NETWORK':
      return { ...state, network: action.payload, selectedEntityId: null, selectedRelationshipId: null };
    
    case 'UPDATE_NETWORK':
      return { ...state, network: { ...state.network, ...action.payload } };
    
    case 'ADD_ENTITY':
      return {
        ...state,
        network: {
          ...state.network,
          entities: [...state.network.entities, action.payload],
        },
      };
    
    case 'ADD_OR_MERGE_ENTITY': {
      const matchingEntity = findMatchingEntity(state.network.entities, action.payload);
      
      if (matchingEntity) {
        // Merge with existing entity
        const mergedEntity = mergeEntities(matchingEntity, action.payload);
        return {
          ...state,
          network: {
            ...state.network,
            entities: state.network.entities.map((e) =>
              e.id === matchingEntity.id ? mergedEntity : e
            ),
          },
        };
      }
      
      // No match, add as new
      return {
        ...state,
        network: {
          ...state.network,
          entities: [...state.network.entities, { ...action.payload, id: action.payload.id || generateId() }],
        },
      };
    }
    
    case 'MERGE_ENTITY': {
      const { existingId, incoming } = action.payload;
      const existing = state.network.entities.find(e => e.id === existingId);
      
      if (!existing) {
        // Existing entity not found, add incoming as new
        return {
          ...state,
          network: {
            ...state.network,
            entities: [...state.network.entities, { ...incoming, id: generateId() }],
          },
        };
      }
      
      const mergedEntity = mergeEntities(existing, incoming);
      return {
        ...state,
        network: {
          ...state.network,
          entities: state.network.entities.map((e) =>
            e.id === existingId ? mergedEntity : e
          ),
        },
      };
    }
    
    case 'UPDATE_ENTITY':
      return {
        ...state,
        network: {
          ...state.network,
          entities: state.network.entities.map((e) =>
            e.id === action.payload.id ? { ...e, ...action.payload.updates } : e
          ),
        },
      };
    
    case 'DELETE_ENTITY':
      return {
        ...state,
        network: {
          ...state.network,
          entities: state.network.entities.filter((e) => e.id !== action.payload),
          relationships: state.network.relationships.filter(
            (r) => r.source !== action.payload && r.target !== action.payload
          ),
        },
        selectedEntityId: state.selectedEntityId === action.payload ? null : state.selectedEntityId,
      };
    
    case 'ADD_RELATIONSHIP':
      return {
        ...state,
        network: {
          ...state.network,
          relationships: [...state.network.relationships, action.payload],
        },
      };
    
    case 'ADD_OR_MERGE_RELATIONSHIP': {
      const { source, target, type } = action.payload;
      
      // Check if relationship already exists (same source, target, and type)
      const existingRel = state.network.relationships.find(r => 
        (r.source === source && r.target === target && r.type === type) ||
        (r.source === target && r.target === source && r.type === type)
      );
      
      if (existingRel) {
        // Merge evidence and update
        return {
          ...state,
          network: {
            ...state.network,
            relationships: state.network.relationships.map(r => 
              r.id === existingRel.id 
                ? { 
                    ...r, 
                    evidence: action.payload.evidence || r.evidence,
                    confidence: Math.max(r.confidence || 0, action.payload.confidence || 0)
                  }
                : r
            ),
          },
        };
      }
      
      // No match, add as new
      return {
        ...state,
        network: {
          ...state.network,
          relationships: [...state.network.relationships, { ...action.payload, id: action.payload.id || generateId() }],
        },
      };
    }
    
    case 'UPDATE_RELATIONSHIP':
      return {
        ...state,
        network: {
          ...state.network,
          relationships: state.network.relationships.map((r) =>
            r.id === action.payload.id ? { ...r, ...action.payload.updates } : r
          ),
        },
      };
    
    case 'DELETE_RELATIONSHIP':
      return {
        ...state,
        network: {
          ...state.network,
          relationships: state.network.relationships.filter((r) => r.id !== action.payload),
        },
        selectedRelationshipId: state.selectedRelationshipId === action.payload ? null : state.selectedRelationshipId,
      };
    
    case 'ADD_ENTITIES_AND_RELATIONSHIPS': {
      // Merge new entities, avoiding duplicates by name (with smart matching)
      const newEntities: Entity[] = [];
      const entityIdMap = new Map<string, string>(); // Map old IDs to new/existing IDs
      
      for (const entity of action.payload.entities) {
        const matchingEntity = findMatchingEntity(state.network.entities, entity);
        
        if (matchingEntity) {
          // Entity already exists, map to existing ID
          entityIdMap.set(entity.id || entity.name, matchingEntity.id);
          // Optionally merge data (update existing entity)
          // For now, we just skip adding duplicates
        } else {
          // Check if we already added a similar entity in this batch
          const matchInBatch = findMatchingEntity(newEntities, entity);
          if (matchInBatch) {
            entityIdMap.set(entity.id || entity.name, matchInBatch.id);
          } else {
            const newId = entity.id || generateId();
            entityIdMap.set(entity.id || entity.name, newId);
            newEntities.push({ ...entity, id: newId });
          }
        }
      }
      
      // Create name-to-id mapping for relationships (using all entities)
      const allEntities = [...state.network.entities, ...newEntities];
      const nameToId = new Map<string, string>();
      allEntities.forEach((e) => {
        nameToId.set(e.name.toLowerCase(), e.id);
        nameToId.set(e.name, e.id);
        nameToId.set(normalizeEntityName(e.name), e.id);
      });
      
      // Map relationship source/target from names to IDs
      const newRelationships = action.payload.relationships
        .map((r) => {
          // Try to find the entity ID by name (case-insensitive)
          const sourceId = entityIdMap.get(r.source) || 
                          nameToId.get(r.source.toLowerCase()) || 
                          nameToId.get(normalizeEntityName(r.source)) ||
                          r.source;
          const targetId = entityIdMap.get(r.target) || 
                          nameToId.get(r.target.toLowerCase()) || 
                          nameToId.get(normalizeEntityName(r.target)) ||
                          r.target;
          
          return {
            ...r,
            id: r.id || generateId(),
            source: sourceId,
            target: targetId,
          };
        })
        .filter((r) => {
          // Only add if both source and target exist as valid entity IDs
          const sourceExists = allEntities.some((e) => e.id === r.source);
          const targetExists = allEntities.some((e) => e.id === r.target);
          
          // Also check for duplicate relationships
          const isDuplicate = state.network.relationships.some(existing =>
            (existing.source === r.source && existing.target === r.target && existing.type === r.type) ||
            (existing.source === r.target && existing.target === r.source && existing.type === r.type)
          );
          
          return sourceExists && targetExists && !isDuplicate;
        });
      
      // Debug logging only in development
      if (import.meta.env.DEV) {
        console.log('Adding entities:', newEntities.length, 'relationships:', newRelationships.length);
        console.log('Entity ID map:', Object.fromEntries(entityIdMap));
      }
      
      return {
        ...state,
        network: {
          ...state.network,
          entities: allEntities,
          relationships: [...state.network.relationships, ...newRelationships],
        },
      };
    }
    
    case 'DEDUPLICATE_NETWORK': {
      // Find and merge duplicate entities
      const mergedEntities: Entity[] = [];
      const idMapping = new Map<string, string>(); // Old ID -> New ID
      
      for (const entity of state.network.entities) {
        const match = findMatchingEntity(mergedEntities, entity);
        
        if (match) {
          // Merge with existing
          const merged = mergeEntities(match, entity);
          const idx = mergedEntities.findIndex(e => e.id === match.id);
          mergedEntities[idx] = merged;
          idMapping.set(entity.id, match.id);
        } else {
          mergedEntities.push(entity);
          idMapping.set(entity.id, entity.id);
        }
      }
      
      // Update relationships to use merged entity IDs
      const updatedRelationships = state.network.relationships
        .map(r => ({
          ...r,
          source: idMapping.get(r.source) || r.source,
          target: idMapping.get(r.target) || r.target,
        }))
        .filter((r, idx, arr) => {
          // Remove duplicate relationships
          const firstIdx = arr.findIndex(other => 
            (other.source === r.source && other.target === r.target && other.type === r.type) ||
            (other.source === r.target && other.target === r.source && other.type === r.type)
          );
          return firstIdx === idx;
        });
      
      console.log(`Deduplication: ${state.network.entities.length} -> ${mergedEntities.length} entities`);
      console.log(`Deduplication: ${state.network.relationships.length} -> ${updatedRelationships.length} relationships`);
      
      return {
        ...state,
        network: {
          ...state.network,
          entities: mergedEntities,
          relationships: updatedRelationships,
        },
      };
    }
    
    case 'SELECT_ENTITY':
      return { ...state, selectedEntityId: action.payload, selectedRelationshipId: null };
    
    case 'SELECT_RELATIONSHIP':
      return { ...state, selectedRelationshipId: action.payload, selectedEntityId: null };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'UPDATE_INVESTIGATION_CONTEXT':
      return {
        ...state,
        network: {
          ...state.network,
          investigationContext: action.payload
        }
      };
    
    case 'CLEAR_NETWORK':
      return { ...state, network: initialNetwork, selectedEntityId: null, selectedRelationshipId: null };
    
    default:
      return state;
  }
}

interface NetworkContextValue extends NetworkState {
  dispatch: React.Dispatch<NetworkAction>;
  addEntity: (entity: Omit<Entity, 'id'> & { id?: string }) => void;
  addOrMergeEntity: (entity: Omit<Entity, 'id'> & { id?: string }) => void;
  mergeEntity: (existingId: string, incoming: Entity) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  addOrMergeRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  updateRelationship: (id: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (id: string) => void;
  addEntitiesAndRelationships: (entities: Entity[], relationships: Relationship[]) => void;
  selectEntity: (id: string | null) => void;
  selectRelationship: (id: string | null) => void;
  clearNetwork: () => void;
  setNetwork: (network: Network) => void;
  updateInvestigationContext: (context: InvestigationContext) => void;
  deduplicateNetwork: () => void;
  findMatchingEntity: (entity: Entity) => Entity | null;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(networkReducer, initialState);

  const addEntity = useCallback((entity: Omit<Entity, 'id'> & { id?: string }) => {
    dispatch({ type: 'ADD_ENTITY', payload: { ...entity, id: entity.id || generateId() } as Entity });
  }, []);

  const addOrMergeEntity = useCallback((entity: Omit<Entity, 'id'> & { id?: string }) => {
    dispatch({ type: 'ADD_OR_MERGE_ENTITY', payload: { ...entity, id: entity.id || generateId() } as Entity });
  }, []);

  const mergeEntity = useCallback((existingId: string, incoming: Entity) => {
    dispatch({ type: 'MERGE_ENTITY', payload: { existingId, incoming } });
  }, []);

  const updateEntity = useCallback((id: string, updates: Partial<Entity>) => {
    dispatch({ type: 'UPDATE_ENTITY', payload: { id, updates } });
  }, []);

  const deleteEntity = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ENTITY', payload: id });
  }, []);

  const addRelationship = useCallback((relationship: Omit<Relationship, 'id'>) => {
    dispatch({ type: 'ADD_RELATIONSHIP', payload: { ...relationship, id: generateId() } as Relationship });
  }, []);

  const addOrMergeRelationship = useCallback((relationship: Omit<Relationship, 'id'>) => {
    dispatch({ type: 'ADD_OR_MERGE_RELATIONSHIP', payload: { ...relationship, id: generateId() } as Relationship });
  }, []);

  const updateRelationship = useCallback((id: string, updates: Partial<Relationship>) => {
    dispatch({ type: 'UPDATE_RELATIONSHIP', payload: { id, updates } });
  }, []);

  const deleteRelationship = useCallback((id: string) => {
    dispatch({ type: 'DELETE_RELATIONSHIP', payload: id });
  }, []);

  const addEntitiesAndRelationships = useCallback((entities: Entity[], relationships: Relationship[]) => {
    dispatch({ type: 'ADD_ENTITIES_AND_RELATIONSHIPS', payload: { entities, relationships } });
  }, []);

  const selectEntity = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_ENTITY', payload: id });
  }, []);

  const selectRelationship = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_RELATIONSHIP', payload: id });
  }, []);

  const clearNetwork = useCallback(() => {
    dispatch({ type: 'CLEAR_NETWORK' });
  }, []);

  const setNetwork = useCallback((network: Network) => {
    dispatch({ type: 'SET_NETWORK', payload: network });
  }, []);

  const updateInvestigationContext = useCallback((context: InvestigationContext) => {
    dispatch({ type: 'UPDATE_INVESTIGATION_CONTEXT', payload: context });
  }, []);

  const deduplicateNetwork = useCallback(() => {
    dispatch({ type: 'DEDUPLICATE_NETWORK' });
  }, []);

  const findMatchingEntityFn = useCallback((entity: Entity) => {
    return findMatchingEntity(state.network.entities, entity);
  }, [state.network.entities]);

  const value: NetworkContextValue = {
    ...state,
    dispatch,
    addEntity,
    addOrMergeEntity,
    mergeEntity,
    updateEntity,
    deleteEntity,
    addRelationship,
    addOrMergeRelationship,
    updateRelationship,
    deleteRelationship,
    addEntitiesAndRelationships,
    selectEntity,
    selectRelationship,
    clearNetwork,
    setNetwork,
    updateInvestigationContext,
    deduplicateNetwork,
    findMatchingEntity: findMatchingEntityFn,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
