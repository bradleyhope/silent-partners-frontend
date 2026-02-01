/**
 * Silent Partners - Sidebar
 *
 * Main sidebar container that orchestrates panel components.
 * Design: Archival Investigator with gold accents
 * 
 * v8.0: Added Suggestion Queue for Investigative Companion feature
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { NarrativeEvent } from './NarrativePanel';
import SuggestionQueue from './SuggestionQueue';
import { Claim } from '@/lib/claims-api';
import {
  NetworkPanel,
  AIInputPanel,
  ManualEntryPanel,
  ToolsPanel,
  SearchPanel,
  ViewPanel,
} from './sidebar';

interface SidebarProps {
  onNarrativeEvent?: (event: Omit<NarrativeEvent, 'id' | 'timestamp'>) => void;
  setIsProcessing?: (processing: boolean) => void;
  onClaimAccepted?: (claim: Claim) => void;
  onClaimRejected?: (claim: Claim) => void;
}

export default function Sidebar({ 
  onNarrativeEvent,
  onClaimAccepted,
  onClaimRejected,
}: SidebarProps = {}) {
  const { network } = useNetwork();
  const { isOpen: mobileOpen, close: closeMobile } = useMobileSidebar();

  // Panel open states
  const [networkOpen, setNetworkOpen] = useState(true);
  const [suggestionQueueOpen, setSuggestionQueueOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  // AI input state for template loading
  const [aiInitialQuery, setAiInitialQuery] = useState('');

  // Close mobile sidebar when selecting an entity or loading a network
  useEffect(() => {
    if (network.entities.length > 0 && mobileOpen) {
      const timer = setTimeout(() => closeMobile(), 300);
      return () => clearTimeout(timer);
    }
  }, [network.entities.length, mobileOpen, closeMobile]);

  // Handle template selection from NetworkPanel
  const handleSelectTemplate = useCallback((query: string) => {
    setAiInitialQuery(query);
    setAiOpen(true);
  }, []);

  // Handle claim accepted - add relationship to network
  const handleClaimAccepted = useCallback((claim: Claim) => {
    // Notify parent component
    if (onClaimAccepted) {
      onClaimAccepted(claim);
    }
    
    // Add narrative event
    if (onNarrativeEvent) {
      onNarrativeEvent({
        type: 'discovery',
        title: 'Claim Accepted',
        content: `${claim.subject_name} ${claim.predicate.replace(/_/g, ' ')} ${claim.object_name}`,
      });
    }
  }, [onClaimAccepted, onNarrativeEvent]);

  // Handle claim rejected
  const handleClaimRejected = useCallback((claim: Claim) => {
    if (onClaimRejected) {
      onClaimRejected(claim);
    }
  }, [onClaimRejected]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}

      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-50
          w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full
          transform transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Scrollable content area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Network Info Section */}
          <NetworkPanel
            isOpen={networkOpen}
            onOpenChange={setNetworkOpen}
            onSelectTemplate={handleSelectTemplate}
          />

          <div className="border-t border-sidebar-border" />

          {/* Suggestion Queue Section - NEW in v8.0 */}
          <SuggestionQueue
            graphId={typeof network.id === 'number' ? network.id : null}
            isOpen={suggestionQueueOpen}
            onOpenChange={setSuggestionQueueOpen}
            onClaimAccepted={handleClaimAccepted}
            onClaimRejected={handleClaimRejected}
          />

          <div className="border-t border-sidebar-border" />

          {/* AI Input Section */}
          <AIInputPanel
            isOpen={aiOpen}
            onOpenChange={setAiOpen}
            onNarrativeEvent={onNarrativeEvent}
            initialQuery={aiInitialQuery}
          />

          <div className="border-t border-sidebar-border" />

          {/* Manual Entry Section */}
          <ManualEntryPanel isOpen={manualOpen} onOpenChange={setManualOpen} />

          <div className="border-t border-sidebar-border" />

          {/* Tools Section */}
          <ToolsPanel isOpen={toolsOpen} onOpenChange={setToolsOpen} />

          <div className="border-t border-sidebar-border" />

          {/* Search Section */}
          <SearchPanel isOpen={searchOpen} onOpenChange={setSearchOpen} />

          <div className="border-t border-sidebar-border" />

          {/* View Options Section */}
          <ViewPanel isOpen={viewOpen} onOpenChange={setViewOpen} />
        </div>
        {/* End scrollable content area */}

        {/* Footer stats */}
        <div className="px-4 py-3 border-t border-sidebar-border bg-sidebar-accent/30">
          <div className="text-[10px] font-mono text-muted-foreground">
            {network.entities.length} entities · {network.relationships.length} connections
          </div>
        </div>
      </aside>
    </>
  );
}
