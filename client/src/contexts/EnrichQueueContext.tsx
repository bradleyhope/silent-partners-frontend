/**
 * Enrich Queue Context
 * 
 * Manages a global queue of entity enrichment tasks with:
 * - Queue management (add, remove, reorder)
 * - Progress tracking for active tasks
 * - Status updates (pending, processing, complete, error)
 * - Concurrent execution limit
 */

import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { Entity } from '@/lib/store';
import { api } from '@/lib/api';

export interface EnrichTask {
  id: string;
  entityId: string;
  entityName: string;
  entityType: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  error?: string;
  result?: {
    connectionsAdded: number;
    factsAdded: number;
  };
  startedAt?: number;
  completedAt?: number;
}

interface EnrichQueueContextType {
  queue: EnrichTask[];
  isProcessing: boolean;
  addToQueue: (entity: Entity, context?: string) => void;
  removeFromQueue: (taskId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  activeTask: EnrichTask | null;
}

const EnrichQueueContext = createContext<EnrichQueueContextType | null>(null);

const MAX_CONCURRENT = 1; // Process one at a time for now

export function EnrichQueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<EnrichTask[]>([]);
  const processingRef = useRef(false);
  const onCompleteCallbackRef = useRef<((task: EnrichTask, result: any) => void) | null>(null);

  // Process the next task in queue
  const processNext = useCallback(async () => {
    if (processingRef.current) return;
    
    const pendingTask = queue.find(t => t.status === 'pending');
    if (!pendingTask) return;

    processingRef.current = true;

    // Update task to processing
    setQueue(prev => prev.map(t => 
      t.id === pendingTask.id 
        ? { ...t, status: 'processing' as const, progress: 10, startedAt: Date.now() }
        : t
    ));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setQueue(prev => prev.map(t => 
          t.id === pendingTask.id && t.status === 'processing'
            ? { ...t, progress: Math.min(t.progress + 10, 90) }
            : t
        ));
      }, 2000);

      // Call the enrich API
      const result = await api.enrichEntity(
        pendingTask.entityName,
        pendingTask.entityType,
        '' // context
      );

      clearInterval(progressInterval);

      // Update task to complete
      setQueue(prev => prev.map(t => 
        t.id === pendingTask.id 
          ? { 
              ...t, 
              status: 'complete' as const, 
              progress: 100, 
              completedAt: Date.now(),
              result: {
                connectionsAdded: result.enriched?.connections_suggested?.length || 0,
                factsAdded: result.enriched?.key_facts?.length || 0,
              }
            }
          : t
      ));

      // Trigger callback if set
      if (onCompleteCallbackRef.current) {
        onCompleteCallbackRef.current(pendingTask, result);
      }

    } catch (error) {
      // Update task to error
      setQueue(prev => prev.map(t => 
        t.id === pendingTask.id 
          ? { 
              ...t, 
              status: 'error' as const, 
              progress: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          : t
      ));
    } finally {
      processingRef.current = false;
      // Process next task
      setTimeout(() => processNext(), 500);
    }
  }, [queue]);

  // Add entity to enrichment queue
  const addToQueue = useCallback((entity: Entity, context?: string) => {
    const task: EnrichTask = {
      id: `enrich-${entity.id}-${Date.now()}`,
      entityId: entity.id,
      entityName: entity.name,
      entityType: entity.type,
      status: 'pending',
      progress: 0,
    };

    setQueue(prev => {
      // Don't add if already in queue
      if (prev.some(t => t.entityId === entity.id && t.status !== 'complete' && t.status !== 'error')) {
        return prev;
      }
      return [...prev, task];
    });

    // Start processing if not already
    setTimeout(() => processNext(), 100);
  }, [processNext]);

  // Remove task from queue
  const removeFromQueue = useCallback((taskId: string) => {
    setQueue(prev => prev.filter(t => t.id !== taskId));
  }, []);

  // Clear completed tasks
  const clearCompleted = useCallback(() => {
    setQueue(prev => prev.filter(t => t.status !== 'complete'));
  }, []);

  // Clear all tasks
  const clearAll = useCallback(() => {
    setQueue([]);
    processingRef.current = false;
  }, []);

  const activeTask = queue.find(t => t.status === 'processing') || null;
  const isProcessing = queue.some(t => t.status === 'processing');

  return (
    <EnrichQueueContext.Provider value={{
      queue,
      isProcessing,
      addToQueue,
      removeFromQueue,
      clearCompleted,
      clearAll,
      activeTask,
    }}>
      {children}
    </EnrichQueueContext.Provider>
  );
}

export function useEnrichQueue() {
  const context = useContext(EnrichQueueContext);
  if (!context) {
    throw new Error('useEnrichQueue must be used within EnrichQueueProvider');
  }
  return context;
}
