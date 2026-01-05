/**
 * Silent Partners - Keyboard Shortcuts Hook
 * 
 * Handles keyboard shortcuts for improved workflow:
 * - Ctrl+Z: Undo last action
 * - Delete/Backspace: Delete selected entity or relationship
 * - Escape: Deselect current selection
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { NetworkState } from '@/lib/store';

// History stack for undo functionality
interface HistoryEntry {
  entities: NetworkState['network']['entities'];
  relationships: NetworkState['network']['relationships'];
}

export function useKeyboardShortcuts() {
  const { 
    network, 
    selectedEntityId, 
    selectedRelationshipId,
    selectEntity,
    deleteEntity,
    deleteRelationship,
    dispatch
  } = useNetwork();
  
  // History for undo - store last 20 states
  const historyRef = useRef<HistoryEntry[]>([]);
  const lastNetworkRef = useRef<string>('');

  // Track network changes for undo history
  useEffect(() => {
    const currentState = JSON.stringify({
      entities: network.entities,
      relationships: network.relationships
    });
    
    // Only add to history if state actually changed
    if (currentState !== lastNetworkRef.current && lastNetworkRef.current !== '') {
      historyRef.current.push({
        entities: JSON.parse(lastNetworkRef.current).entities || [],
        relationships: JSON.parse(lastNetworkRef.current).relationships || []
      });
      
      // Keep only last 20 entries
      if (historyRef.current.length > 20) {
        historyRef.current.shift();
      }
    }
    
    lastNetworkRef.current = currentState;
  }, [network.entities, network.relationships]);

  const handleUndo = useCallback(() => {
    if (historyRef.current.length === 0) {
      console.log('Nothing to undo');
      return;
    }
    
    const previousState = historyRef.current.pop();
    if (previousState) {
      // Temporarily disable history tracking
      lastNetworkRef.current = JSON.stringify(previousState);
      
      dispatch({
        type: 'SET_NETWORK',
        payload: {
          ...network,
          entities: previousState.entities,
          relationships: previousState.relationships
        }
      });
      console.log('Undo: Restored previous state');
    }
  }, [dispatch, network]);

  const handleDelete = useCallback(() => {
    if (selectedEntityId) {
      deleteEntity(selectedEntityId);
      console.log('Deleted entity:', selectedEntityId);
    } else if (selectedRelationshipId) {
      deleteRelationship(selectedRelationshipId);
      console.log('Deleted relationship:', selectedRelationshipId);
    }
  }, [selectedEntityId, selectedRelationshipId, deleteEntity, deleteRelationship]);

  const handleDeselect = useCallback(() => {
    selectEntity(null);
    dispatch({ type: 'SELECT_RELATIONSHIP', payload: null });
    console.log('Deselected all');
  }, [selectEntity, dispatch]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        handleUndo();
        return;
      }

      // Delete or Backspace for delete
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleDelete();
        return;
      }

      // Escape for deselect
      if (event.key === 'Escape') {
        event.preventDefault();
        handleDeselect();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleDelete, handleDeselect]);

  return {
    undo: handleUndo,
    deleteSelected: handleDelete,
    deselect: handleDeselect,
    canUndo: historyRef.current.length > 0
  };
}
