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

import { useState, useCallback, useEffect } from 'react';
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
import { Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

// Inner component that has access to network context
function AppContentInner() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Get network context for investigation context persistence
  const { network, updateInvestigationContext } = useNetwork();
  
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

  // Handle action clicks from narrative
  const handleNarrativeAction = useCallback((action: string) => {
    // Parse action string like "enrich:entity_id"
    const [actionType, ...args] = action.split(':');
    
    switch (actionType) {
      case 'enrich':
        toast.info(`Enriching entity: ${args.join(':')}`);
        // TODO: Trigger enrichment
        break;
      case 'dismiss':
        // Just remove the suggestion
        break;
      default:
        console.log('Unknown action:', action);
    }
  }, []);

  // Chat history for context
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Handle chat submission
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
    
    try {
      // Build context from current network
      const context = {
        entities: network.entities.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          description: e.description
        })),
        relationships: network.relationships.map(r => ({
          source: r.source,
          target: r.target,
          type: r.type || r.label || 'related'
        }))
      };
      
      // Call the Per-Investigation Intelligence Agent
      // Pass investigation context (title/description) if available
      const investigationContext = network.title ? 
        `Investigation: ${network.title}${network.description ? ` - ${network.description}` : ''}` : 
        undefined;
      
      const result = await api.chat(message, context, chatHistory, investigationContext);
      
      // Build reasoning text from graph insights and actions
      let reasoningText = '';
      if (result.graph_insights) {
        const insights = result.graph_insights;
        if (insights.patterns_detected?.length) {
          reasoningText += `Patterns: ${insights.patterns_detected.join(', ')}. `;
        }
        if (insights.shell_indicators?.length) {
          reasoningText += `Shell indicators: ${insights.shell_indicators.length} found. `;
        }
      }
      if (result.actions?.length) {
        reasoningText += `Suggested: ${result.actions.map(a => a.description || a.type).join(', ')}`;
      }
      
      // Add AI response to narrative
      addNarrativeEvent({
        type: 'reasoning',
        title: 'AI Assistant',
        content: result.response,
        reasoning: reasoningText || undefined
      });
      
      // Update chat history with assistant response
      setChatHistory([...newHistory, { role: 'assistant' as const, content: result.response }]);
      
    } catch (error) {
      console.error('Chat error:', error);
      addNarrativeEvent({
        type: 'error',
        title: 'Error',
        content: error instanceof Error ? error.message : 'Failed to get AI response'
      });
      toast.error('Failed to get AI response');
    } finally {
      setIsProcessing(false);
    }
  }, [addNarrativeEvent, chatHistory, network.entities, network.relationships]);

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
  
  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (suggestion.action) {
      // Execute the suggested action
      toast.info(`Executing: ${suggestion.message}`);
      // TODO: Parse and execute the action
    }
    // Remove the suggestion after clicking
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  }, []);
  
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

  // Update investigation context - both local state AND network state (for persistence)
  const handleUpdateContext = useCallback((context: InvestigationContext) => {
    // Update local state
    setInvestigationContext(context);
    
    // Update network state (this will be saved with the graph)
    updateInvestigationContext(context);
    
    // Add narrative event
    addNarrativeEvent({
      type: 'context_update',
      title: 'Context Updated',
      content: `Investigation focus: ${context.topic || 'Not set'}`,
      reasoning: 'I will use this context to better understand your investigation and provide more relevant suggestions.'
    });
    toast.success('Investigation context updated and will be saved with the graph');
  }, [addNarrativeEvent, updateInvestigationContext]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar 
          onNarrativeEvent={addNarrativeEvent}
          setIsProcessing={setIsProcessing}
        />
        <div className="flex-1 relative flex flex-col min-w-0">
          <CanvasErrorBoundary>
            <NetworkCanvas onNarrativeEvent={addToNarrative} />
          </CanvasErrorBoundary>
          <UndoHistoryPanel />
          
          {/* Narrative Panel Toggle - positioned below History button */}
          <Button
            variant="outline"
            size="sm"
            className="absolute right-4 top-14 z-10 h-8 text-xs gap-1.5 bg-card/90 hover:bg-card"
            onClick={() => setShowNarrative(!showNarrative)}
          >
            <Brain className="w-3.5 h-3.5" />
            Narrative
            {showNarrative ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </Button>
        </div>
        
        {/* Narrative Panel */}
        {showNarrative && (
          <div className="w-80 shrink-0 animate-in slide-in-from-right duration-200">
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

// Wrapper component that uses the keyboard shortcuts hook
function AppContent() {
  return <AppContentInner />;
}

export default function Home() {
  return (
    <NetworkProvider>
      <MobileSidebarProvider>
        <AppContent />
      </MobileSidebarProvider>
    </NetworkProvider>
  );
}
