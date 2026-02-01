/**
 * Silent Partners - Home Page
 * 
 * Main application layout with sidebar, canvas, narrative panel, and detail panel.
 * Design: Archival Investigator aesthetic
 * 
 * Keyboard shortcuts:
 * - Ctrl+Z: Undo last action
 * - Delete/Backspace: Delete selected entity or relationship
 * - Escape: Deselect current selection
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { NetworkProvider, useNetwork } from '@/contexts/NetworkContext';
import { MobileSidebarProvider } from '@/contexts/MobileSidebarContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import NetworkCanvas from '@/components/NetworkCanvas';
import CanvasErrorBoundary from '@/components/CanvasErrorBoundary';
import NarrativePanel, { NarrativeEvent, InvestigationContext, Suggestion, ResearchHistoryItem } from '@/components/NarrativePanel';
import { UndoHistoryPanel } from '@/components/UndoHistoryPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Brain, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { Claim } from '@/lib/claims-api';
import IQSDashboard from '@/components/IQSDashboard';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { streamOrchestrate, OrchestratorCallbacks, PipelineEntity, PipelineRelationship } from '@/lib/streaming-api';

// Inner component that has access to network context
function AppContentInner() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Get network context for investigation context persistence
  const { network, updateInvestigationContext, addOrMergeEntity, addOrMergeRelationship, setNetworkTitle } = useNetwork();
  
  // Narrative panel state
  const [showNarrative, setShowNarrative] = useState(false);
  const [narrativeEvents, setNarrativeEvents] = useState<NarrativeEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local investigation context state (synced with network)
  const [investigationContext, setInvestigationContext] = useState<InvestigationContext>({
    topic: '',
    domain: '',
    focus: '',
    keyQuestions: []
  });
  
  // NEW: Suggestions and research history from orchestrator v2.0
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [researchHistory, setResearchHistory] = useState<ResearchHistoryItem[]>([]);

  // Chat history for context
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Store abort function for cancelling ongoing chat
  const [abortChat, setAbortChat] = useState<(() => void) | null>(null);

  // Sync investigation context from network when it changes (e.g., when loading a saved graph)
  useEffect(() => {
    if (network.investigationContext) {
      setInvestigationContext(network.investigationContext);
    }
  }, [network.investigationContext]);

  // Add event to narrative
  const addNarrativeEvent = useCallback((event: Omit<NarrativeEvent, 'id' | 'timestamp'>) => {
    const newEvent: NarrativeEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    setNarrativeEvents(prev => [...prev, newEvent]);
    
    // Auto-show narrative panel when events arrive
    if (!showNarrative && (event.type === 'suggestion' || event.type === 'error')) {
      setShowNarrative(true);
    }
  }, [showNarrative]);

  // Add simple message to narrative
  const addToNarrative = useCallback((message: string) => {
    addNarrativeEvent({
      type: 'info',
      title: 'Activity',
      content: message
    });
  }, [addNarrativeEvent]);

  // Handle chat submission - uses full Agent V2 streaming with all tools
  // IMPORTANT: This must be defined BEFORE handleNarrativeAction and handleSuggestionClick
  const handleChatSubmit = useCallback(async (message: string) => {
    // Add user message to narrative
    addNarrativeEvent({
      type: 'user_action',
      title: 'You',
      content: message
    });
    
    // Add to chat history
    const newHistory = [...chatHistory, { role: 'user' as const, content: message }];
    setChatHistory(newHistory);
    
    // Show thinking indicator
    setIsProcessing(true);
    
    // Build context from current network for Agent V2
    const context = {
      topic: network.title || '',
      domain: network.description || '',
      focus: '',
      key_questions: [],
      entities: network.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type
      })),
      relationships: network.relationships.map(r => ({
        source: r.source,
        target: r.target,
        type: r.type || r.label || 'related'
      })),
      graph_id: network.id  // v8.1: Enable claims integration when graph is saved
    };
    
    // Collect response content for chat history
    let responseContent = '';
    
    // Define callbacks for streaming events
    const callbacks: OrchestratorCallbacks = {
      onThinking: (msg: string) => {
        addNarrativeEvent({
          type: 'info',
          title: 'Thinking',
          content: msg
        });
      },
      
      onSearching: (msg: string) => {
        toast.loading(msg, { id: 'orchestrator-search' });
      },
      
      onEntityFound: (entity: PipelineEntity, isNew: boolean) => {
        if (isNew && entity.name) {
          addOrMergeEntity({
            id: entity.id || `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: entity.name,
            type: entity.type || 'unknown',
            description: entity.description || '',
            x: Math.random() * 600 + 100,
            y: Math.random() * 400 + 100
          });
        }
      },
      
      onRelationshipFound: (relationship: PipelineRelationship, isNew: boolean) => {
        if (isNew && relationship.source && relationship.target) {
          addOrMergeRelationship({
            id: relationship.id || `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: relationship.source,
            target: relationship.target,
            label: relationship.label || relationship.type || 'connected to',
            type: relationship.type
          });
        }
      },
      
      onContextUpdate: (ctx) => {
        // Update network title if provided
        if (ctx.title && setNetworkTitle) {
          setNetworkTitle(ctx.title);
        }
        
        // Update investigation context
        if (ctx.description || ctx.key_findings || ctx.red_flags || ctx.next_steps) {
          setInvestigationContext(prev => ({
            ...prev,
            topic: ctx.title || prev.topic,
            domain: ctx.description || prev.domain,
            keyQuestions: ctx.key_findings || prev.keyQuestions
          }));
        }
        
        // Handle next steps as suggestions
        if (ctx.next_steps && ctx.next_steps.length > 0) {
          const newSuggestions: Suggestion[] = ctx.next_steps.map((step, idx) => ({
            id: `suggestion-${Date.now()}-${idx}`,
            type: 'research' as const,
            text: step.suggestion,
            reasoning: step.reasoning,
            action: step.action_query,
            priority: step.priority as 'high' | 'medium' | 'low' || 'medium'
          }));
          setSuggestions(newSuggestions);
        }
        
        // Show key findings as narrative events
        if (ctx.key_findings) {
          for (const finding of ctx.key_findings) {
            addNarrativeEvent({
              type: 'discovery',
              title: 'Key Finding',
              content: finding
            });
          }
        }
        
        // Show red flags as alerts
        if (ctx.red_flags) {
          for (const flag of ctx.red_flags) {
            addNarrativeEvent({
              type: 'warning',
              title: `Red Flag (${flag.severity})`,
              content: flag.description
            });
          }
        }
      },
      
      onComplete: (entities, relationships, msg) => {
        toast.dismiss('orchestrator-search');
        responseContent = msg || `Found ${entities.length} entities and ${relationships.length} relationships`;
        
        // Add completion message to narrative
        addNarrativeEvent({
          type: 'reasoning',
          title: 'Orchestrator',
          content: responseContent
        });
        
        // Update chat history
        setChatHistory([...newHistory, { role: 'assistant' as const, content: responseContent }]);
        setIsProcessing(false);
        setAbortChat(null);
      },
      
      onError: (msg: string, recoverable: boolean) => {
        toast.dismiss('orchestrator-search');
        toast.error(msg);
        addNarrativeEvent({
          type: 'error',
          title: 'Error',
          content: msg
        });
        setIsProcessing(false);
        setAbortChat(null);
      }
    };
    
    // Start streaming with Agent V2
    const abort = streamOrchestrate(message, context, callbacks);
    setAbortChat(() => abort);
  }, [addNarrativeEvent, addOrMergeEntity, addOrMergeRelationship, chatHistory, network.entities, network.relationships, network.title, network.description, setNetworkTitle]);

  // Handle action clicks from narrative - execute via Orchestrator
  // IMPORTANT: This must be defined AFTER handleChatSubmit
  const handleNarrativeAction = useCallback((action: string) => {
    // Parse action string like "enrich:entity_id"
    const [actionType, ...args] = action.split(':');
    
    switch (actionType) {
      case 'enrich':
        toast.info(`Enriching entity: ${args.join(':')}`);
        handleChatSubmit(`Enrich and find more details about ${args.join(':')}`);
        break;
      case 'dismiss':
        // Just remove the suggestion
        break;
      default:
        // For any other action, treat it as a research query
        if (action && action.length > 5) {
          toast.info(`Researching: ${action.slice(0, 50)}...`);
          handleChatSubmit(action);
        } else {
          console.log('Unknown action:', action);
        }
    }
  }, [handleChatSubmit]);

  // Clear narrative events
  const handleClearEvents = useCallback(() => {
    setNarrativeEvents([]);
  }, []);
  
  // Handle suggestions from orchestrator v2.0
  const handleSuggestions = useCallback((newSuggestions: Suggestion[]) => {
    setSuggestions(newSuggestions);
    // Auto-show narrative panel when suggestions arrive
    if (newSuggestions.length > 0 && !showNarrative) {
      setShowNarrative(true);
    }
  }, [showNarrative]);
  
  // Handle suggestion click - execute the action query via the Orchestrator
  // IMPORTANT: This must be defined AFTER handleChatSubmit
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (suggestion.action) {
      // Execute the suggested action by sending it to the Orchestrator
      toast.info(`Executing: ${suggestion.message || suggestion.text || suggestion.action}`);
      handleChatSubmit(suggestion.action);
    }
    // Remove the suggestion after clicking
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  }, [handleChatSubmit]);
  
  // Add research history item
  const handleResearchHistory = useCallback((item: { query: string; source: string }) => {
    const newItem: ResearchHistoryItem = {
      id: `research-${Date.now()}`,
      query: item.query,
      source: item.source,
      entities_found: 0,
      relationships_found: 0,
      timestamp: new Date().toISOString(),
    };
    setResearchHistory(prev => [newItem, ...prev].slice(0, 20)); // Keep last 20
  }, []);

  // Update investigation context and sync to network
  const handleUpdateContext = useCallback((newContext: InvestigationContext) => {
    setInvestigationContext(newContext);
    updateInvestigationContext(newContext);
  }, [updateInvestigationContext]);

  // Handle claim accepted from suggestion queue - add relationship to network
  const handleClaimAccepted = useCallback((claim: Claim) => {
    // Add the relationship to the network
    addOrMergeRelationship({
      source: claim.subject_name,
      target: claim.object_name,
      type: claim.predicate,
      label: claim.predicate.replace(/_/g, ' '),
      status: 'confirmed',
    });
    
    toast.success(`Added: ${claim.subject_name} ${claim.predicate.replace(/_/g, ' ')} ${claim.object_name}`);
  }, [addOrMergeRelationship]);

  // Handle claim rejected from suggestion queue
  const handleClaimRejected = useCallback((claim: Claim) => {
    toast.info(`Rejected claim: ${claim.subject_name} → ${claim.object_name}`);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          onNarrativeEvent={addNarrativeEvent}
          onClaimAccepted={handleClaimAccepted}
          onClaimRejected={handleClaimRejected}
        />
        <main className="flex-1 relative overflow-hidden">
          <CanvasErrorBoundary>
            <NetworkCanvas />
          </CanvasErrorBoundary>
          
          {/* Narrative Panel Toggle */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
            <UndoHistoryPanel />
            <Button
              variant={showNarrative ? "default" : "outline"}
              size="sm"
              onClick={() => setShowNarrative(!showNarrative)}
              className="gap-1.5"
            >
              <Brain className="w-4 h-4" />
              Orchestrator
              {showNarrative ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </Button>
          </div>
        </main>
        
        {/* Narrative Panel */}
        {showNarrative && (
          <div className="w-80 shrink-0 border-l border-border overflow-hidden">
            <NarrativePanel
              events={narrativeEvents}
              context={investigationContext}
              suggestions={suggestions}
              researchHistory={researchHistory}
              onUpdateContext={handleUpdateContext}
              onActionClick={handleNarrativeAction}
              onChatSubmit={handleChatSubmit}
              onClearEvents={handleClearEvents}
              onSuggestionClick={handleSuggestionClick}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Main component with providers
export default function Home() {
  return (
    <NetworkProvider>
      <MobileSidebarProvider>
        <AppContentInner />
      </MobileSidebarProvider>
    </NetworkProvider>
  );
}
