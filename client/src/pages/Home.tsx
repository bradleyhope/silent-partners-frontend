/**
 * Silent Partners - Home Page
 * 
 * Main application layout with sidebar, canvas, and investigative assistant.
 * Design: Archival Investigator aesthetic
 * 
 * v8.3: Full feature parity for InvestigativeAssistant
 *       Added events, suggestions, research history state management
 *       Added suggestion queue modal with pending indicator
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
import InvestigativeAssistant, { 
  InvestigationContext, 
  NarrativeEvent, 
  Suggestion, 
  ResearchHistoryItem 
} from '@/components/InvestigativeAssistant';
import SuggestionQueue from '@/components/SuggestionQueue';
import { UndoHistoryPanel } from '@/components/UndoHistoryPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/button';
import { Brain, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Claim } from '@/lib/claims-api';
import claimsApi from '@/lib/claims-api';
import { toast } from 'sonner';
import { generateId } from '@/lib/store';

// Inner component that has access to network context
function AppContentInner() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Get network context
  const { network, updateInvestigationContext, addOrMergeRelationship } = useNetwork();
  
  // Panel states
  const [showAssistant, setShowAssistant] = useState(true);
  const [showSuggestionQueue, setShowSuggestionQueue] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Pending claims count for indicator
  const [pendingClaimsCount, setPendingClaimsCount] = useState(0);
  
  // Investigation context state
  const [investigationContext, setInvestigationContext] = useState<InvestigationContext>({
    topic: '',
    domain: '',
    focus: '',
    keyQuestions: []
  });

  // Narrative events state (for "Thinking" stream)
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  
  // Suggestions state (AI-generated suggestions)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  
  // Research history state
  const [researchHistory, setResearchHistory] = useState<ResearchHistoryItem[]>([]);

  // Sync investigation context from network when it changes
  useEffect(() => {
    if (network.investigationContext) {
      setInvestigationContext(network.investigationContext);
    }
  }, [network.investigationContext]);

  // Fetch pending claims count periodically
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (typeof network.id === 'number') {
        try {
          const result = await claimsApi.getPendingClaims(network.id, 1);
          setPendingClaimsCount(result.total_pending);
        } catch (error) {
          // Silently fail - not critical
        }
      } else {
        setPendingClaimsCount(0);
      }
    };
    
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [network.id]);

  // Update investigation context and sync to network
  const handleUpdateContext = useCallback((newContext: InvestigationContext) => {
    setInvestigationContext(newContext);
    updateInvestigationContext(newContext);
  }, [updateInvestigationContext]);

  // Handle claim accepted from suggestion queue
  const handleClaimAccepted = useCallback((claim: Claim) => {
    // Add the relationship to the network
    addOrMergeRelationship({
      source: claim.subject_name,
      target: claim.object_name,
      type: claim.predicate,
      label: claim.predicate.replace(/_/g, ' '),
      status: 'confirmed',
    });
    
    // Decrement pending count
    setPendingClaimsCount(prev => Math.max(0, prev - 1));
    
    toast.success(`Added: ${claim.subject_name} ${claim.predicate.replace(/_/g, ' ')} ${claim.object_name}`);
  }, [addOrMergeRelationship]);

  // Handle claim rejected from suggestion queue
  const handleClaimRejected = useCallback((claim: Claim) => {
    // Decrement pending count
    setPendingClaimsCount(prev => Math.max(0, prev - 1));
    toast.info(`Rejected: ${claim.subject_name} → ${claim.object_name}`);
  }, []);

  // Toggle suggestion queue
  const toggleSuggestionQueue = useCallback(() => {
    setShowSuggestionQueue(prev => !prev);
  }, []);

  // Add a narrative event
  const addEvent = useCallback((event: Omit<NarrativeEvent, 'id' | 'timestamp'>) => {
    const newEvent: NarrativeEvent = {
      ...event,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  // Clear all events
  const handleClearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Handle action click from events or next steps
  const handleActionClick = useCallback((action: string) => {
    // This could trigger a new query or perform an action
    // For now, we'll add it as an event and let the user see it
    addEvent({
      type: 'user_action',
      title: 'Action Triggered',
      content: action,
    });
  }, [addEvent]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    // Remove the clicked suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    
    // Add an event for the action
    addEvent({
      type: 'user_action',
      title: 'Suggestion Accepted',
      content: suggestion.text || suggestion.message || suggestion.action || '',
    });
  }, [addEvent]);

  // Add research history item
  const addResearchHistoryItem = useCallback((item: Omit<ResearchHistoryItem, 'id' | 'timestamp'>) => {
    const newItem: ResearchHistoryItem = {
      ...item,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    setResearchHistory(prev => [newItem, ...prev].slice(0, 50)); // Keep last 50
    return newItem;
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools */}
        <Sidebar 
          pendingClaimsCount={pendingClaimsCount}
          onToggleSuggestionQueue={toggleSuggestionQueue}
        />
        
        {/* Main Canvas */}
        <main className="flex-1 relative overflow-hidden">
          <CanvasErrorBoundary>
            <NetworkCanvas />
          </CanvasErrorBoundary>
          
          {/* Top-right controls */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
            <UndoHistoryPanel />
            <Button
              variant={showAssistant ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAssistant(!showAssistant)}
              className="gap-1.5"
            >
              <Brain className="w-4 h-4" />
              Assistant
              {showAssistant ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </Button>
          </div>
        </main>
        
        {/* Right Panel - Investigative Assistant */}
        {showAssistant && (
          <InvestigativeAssistant
            isOpen={showAssistant}
            onToggle={() => setShowAssistant(false)}
            context={investigationContext}
            onUpdateContext={handleUpdateContext}
            pendingClaimsCount={pendingClaimsCount}
            onToggleSuggestionQueue={toggleSuggestionQueue}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            events={events}
            suggestions={suggestions}
            researchHistory={researchHistory}
            onActionClick={handleActionClick}
            onClearEvents={handleClearEvents}
            onSuggestionClick={handleSuggestionClick}
          />
        )}
        
        {/* Suggestion Queue Modal */}
        {showSuggestionQueue && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowSuggestionQueue(false)}
            />
            
            {/* Modal */}
            <div className="relative bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-semibold">Suggestion Queue</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setShowSuggestionQueue(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(80vh-60px)]">
                <SuggestionQueue
                  graphId={typeof network.id === 'number' ? network.id : null}
                  isOpen={true}
                  onOpenChange={() => {}}
                  onClaimAccepted={handleClaimAccepted}
                  onClaimRejected={handleClaimRejected}
                />
              </div>
            </div>
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
