/**
 * Silent Partners - Network Context
 * 
 * Global state management for the network visualization.
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

type NetworkAction =
  | { type: 'SET_NETWORK'; payload: Network }
  | { type: 'UPDATE_NETWORK'; payload: Partial<Network> }
  | { type: 'ADD_ENTITY'; payload: Entity }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; updates: Partial<Entity> } }
  | { type: 'DELETE_ENTITY'; payload: string }
  | { type: 'ADD_RELATIONSHIP'; payload: Relationship }
  | { type: 'UPDATE_RELATIONSHIP'; payload: { id: string; updates: Partial<Relationship> } }
  | { type: 'DELETE_RELATIONSHIP'; payload: string }
  | { type: 'ADD_ENTITIES_AND_RELATIONSHIPS'; payload: { entities: Entity[]; relationships: Relationship[] } }
  | { type: 'SELECT_ENTITY'; payload: string | null }
  | { type: 'SELECT_RELATIONSHIP'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_INVESTIGATION_CONTEXT'; payload: InvestigationContext }
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
      // Merge new entities, avoiding duplicates by name
      const existingNames = new Set(state.network.entities.map((e) => e.name.toLowerCase()));
      const newEntities = action.payload.entities.filter(
        (e) => !existingNames.has(e.name.toLowerCase())
      );
      
      // Create name-to-id mapping for relationships (using all entities)
      const allEntities = [...state.network.entities, ...newEntities];
      const nameToId = new Map<string, string>();
      allEntities.forEach((e) => {
        nameToId.set(e.name.toLowerCase(), e.id);
        nameToId.set(e.name, e.id); // Also map exact case
      });
      
      // Map relationship source/target from names to IDs
      const newRelationships = action.payload.relationships
        .map((r) => {
          // Try to find the entity ID by name (case-insensitive)
          const sourceId = nameToId.get(r.source.toLowerCase()) || nameToId.get(r.source) || r.source;
          const targetId = nameToId.get(r.target.toLowerCase()) || nameToId.get(r.target) || r.target;
          
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
          return sourceExists && targetExists;
        });
      
      // Debug logging only in development
      if (import.meta.env.DEV) {
        console.log('Adding entities:', newEntities.length, 'relationships:', newRelationships.length);
        console.log('Name to ID map:', Object.fromEntries(nameToId));
        console.log('Relationships after mapping:', newRelationships);
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
  addEntity: (entity: Omit<Entity, 'id'>) => void;
  updateEntity: (id: string, updates: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  addRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  updateRelationship: (id: string, updates: Partial<Relationship>) => void;
  deleteRelationship: (id: string) => void;
  addEntitiesAndRelationships: (entities: Entity[], relationships: Relationship[]) => void;
  selectEntity: (id: string | null) => void;
  selectRelationship: (id: string | null) => void;
  clearNetwork: () => void;
  setNetwork: (network: Network) => void;
  updateInvestigationContext: (context: InvestigationContext) => void;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(networkReducer, initialState);

  const addEntity = useCallback((entity: Omit<Entity, 'id'> & { id?: string }) => {
    dispatch({ type: 'ADD_ENTITY', payload: { ...entity, id: entity.id || generateId() } });
  }, []);

  const updateEntity = useCallback((id: string, updates: Partial<Entity>) => {
    dispatch({ type: 'UPDATE_ENTITY', payload: { id, updates } });
  }, []);

  const deleteEntity = useCallback((id: string) => {
    dispatch({ type: 'DELETE_ENTITY', payload: id });
  }, []);

  const addRelationship = useCallback((relationship: Omit<Relationship, 'id'>) => {
    dispatch({ type: 'ADD_RELATIONSHIP', payload: { ...relationship, id: generateId() } });
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

  const value: NetworkContextValue = {
    ...state,
    dispatch,
    addEntity,
    updateEntity,
    deleteEntity,
    addRelationship,
    updateRelationship,
    deleteRelationship,
    addEntitiesAndRelationships,
    selectEntity,
    selectRelationship,
    clearNetwork,
    setNetwork,
    updateInvestigationContext,
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
