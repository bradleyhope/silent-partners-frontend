/**
 * OrchestratorContext - Unified AI Action Routing
 * 
 * This context provides a single channel for ALL AI-powered actions in the app.
 * Instead of each button having its own API call, everything routes through
 * the orchestrator, which handles:
 * - Queueing concurrent requests
 * - Providing consistent feedback
 * - Error handling and retries
 * - Streaming responses
 * 
 * Usage:
 *   const { sendAction, isProcessing } = useOrchestrator();
 *   sendAction('enrich', { entityName: 'Peter Thiel', entityType: 'person' });
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Action types that can be sent to the orchestrator
export type OrchestratorActionType = 
  | 'enrich'           // Enrich a single entity
  | 'find_links'       // Find missing connections
  | 'extract'          // Extract entities from text
  | 'discover'         // Discover network from query
  | 'deduplicate'      // Deduplicate entities
  | 'normalize'        // Normalize relationships
  | 'resolve'          // Resolve entity conflicts
  | 'chat'             // Regular chat message
  | 'process_document' // Process uploaded document
  | 'analyze_article'; // Analyze pasted article

// Action payload varies by type
export interface OrchestratorAction {
  type: OrchestratorActionType;
  payload: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

// Queue item with metadata
interface QueueItem {
  id: string;
  action: OrchestratorAction;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: number;
  error?: string;
}

// Context value type
interface OrchestratorContextValue {
  // Send an action to the orchestrator
  sendAction: (type: OrchestratorActionType, payload: Record<string, any>, priority?: 'high' | 'normal' | 'low') => void;
  
  // Register the message handler (called by InvestigativeAssistant)
  registerMessageHandler: (handler: (message: string) => void) => void;
  
  // Current processing state
  isProcessing: boolean;
  
  // Queue state for UI feedback
  queueLength: number;
  currentAction: OrchestratorAction | null;
}

const OrchestratorContext = createContext<OrchestratorContextValue | null>(null);

// Convert action to natural language message for the orchestrator
function actionToMessage(action: OrchestratorAction): string {
  const { type, payload } = action;
  
  switch (type) {
    case 'enrich':
      return `[ACTION:ENRICH] Please enrich this entity and find its connections: "${payload.entityName}" (${payload.entityType || 'unknown type'})${payload.context ? `. Context: ${payload.context}` : ''}`;
    
    case 'find_links':
      return `[ACTION:FIND_LINKS] Analyze the current graph and find any missing connections or relationships between the entities. Look for indirect connections, shared affiliations, or patterns that might reveal hidden relationships.`;
    
    case 'extract':
      return `[ACTION:EXTRACT] Extract all entities and relationships from the following text and add them to the graph:\n\n${payload.text}`;
    
    case 'discover':
      return `[ACTION:DISCOVER] Research and build a network graph for: ${payload.query}`;
    
    case 'deduplicate':
      return `[ACTION:DEDUPLICATE] Review the current graph for duplicate entities that should be merged. Look for entities with similar names, aliases, or that clearly refer to the same person/organization.`;
    
    case 'normalize':
      return `[ACTION:NORMALIZE] Review all relationships in the graph and normalize them to use consistent relationship types. Standardize labels like "works at" vs "employee of" to a single format.`;
    
    case 'resolve':
      return `[ACTION:RESOLVE] There are conflicting entities that need resolution: ${JSON.stringify(payload.conflicts)}. Please analyze and suggest how to merge or distinguish them.`;
    
    case 'process_document':
      return `[ACTION:PROCESS_DOCUMENT] Process this uploaded document and extract all relevant entities and relationships:\n\nFilename: ${payload.filename}\nContent:\n${payload.content}`;
    
    case 'analyze_article':
      return `[ACTION:ANALYZE_ARTICLE] Analyze this article and create a relationship map of all the people, organizations, and connections mentioned:\n\n${payload.articleText || payload.articleUrl}`;
    
    case 'chat':
    default:
      return payload.message || '';
  }
}

export function OrchestratorProvider({ children }: { children: React.ReactNode }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentAction, setCurrentAction] = useState<OrchestratorAction | null>(null);
  
  // Reference to the message handler (set by InvestigativeAssistant)
  const messageHandlerRef = useRef<((message: string) => void) | null>(null);
  
  // Register the message handler
  const registerMessageHandler = useCallback((handler: (message: string) => void) => {
    messageHandlerRef.current = handler;
  }, []);
  
  // Send an action to the orchestrator
  const sendAction = useCallback((
    type: OrchestratorActionType, 
    payload: Record<string, any>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    const action: OrchestratorAction = { type, payload, priority };
    const message = actionToMessage(action);
    
    // If we have a message handler, send the message
    if (messageHandlerRef.current) {
      setCurrentAction(action);
      setIsProcessing(true);
      messageHandlerRef.current(message);
    } else {
      console.warn('OrchestratorContext: No message handler registered. Is InvestigativeAssistant mounted?');
    }
  }, []);
  
  // Called when processing completes (will be connected to InvestigativeAssistant)
  const onProcessingComplete = useCallback(() => {
    setIsProcessing(false);
    setCurrentAction(null);
  }, []);
  
  return (
    <OrchestratorContext.Provider value={{
      sendAction,
      registerMessageHandler,
      isProcessing,
      queueLength: queue.length,
      currentAction
    }}>
      {children}
    </OrchestratorContext.Provider>
  );
}

export function useOrchestrator() {
  const context = useContext(OrchestratorContext);
  if (!context) {
    throw new Error('useOrchestrator must be used within an OrchestratorProvider');
  }
  return context;
}

export default OrchestratorContext;
