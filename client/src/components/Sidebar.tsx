/**
 * Silent Partners - Sidebar (Left Toolbar)
 *
 * Tool palette for manual editing and graph operations.
 * Design: Archival Investigator with gold accents
 * 
 * v8.2: Removed AI panel (moved to dedicated chat panel on right)
 *       Added pending claims indicator badge
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { NarrativeEvent } from './NarrativePanel';
import { Claim } from '@/lib/claims-api';
import {
  NetworkPanel,
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
  pendingClaimsCount?: number;
  onToggleSuggestionQueue?: () => void;
}

export default function Sidebar({ 
  onNarrativeEvent,
  onClaimAccepted,
  onClaimRejected,
  pendingClaimsCount = 0,
  onToggleSuggestionQueue,
}: SidebarProps = {}) {
  const { network } = useNetwork();
  const { isOpen: mobileOpen, close: closeMobile } = useMobileSidebar();

  // Panel open states
  const [networkOpen, setNetworkOpen] = useState(true);
  const [manualOpen, setManualOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);

  // Close mobile sidebar when selecting an entity or loading a network
  useEffect(() => {
    if (network.entities.length > 0 && mobileOpen) {
      const timer = setTimeout(() => closeMobile(), 300);
      return () => clearTimeout(timer);
    }
  }, [network.entities.length, mobileOpen, closeMobile]);

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

        {/* Footer with stats and pending claims indicator */}
        <div className="px-4 py-3 border-t border-sidebar-border bg-sidebar-accent/30">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono text-muted-foreground">
              {network.entities.length} entities · {network.relationships.length} connections
            </div>
            {/* Pending claims indicator */}
            {pendingClaimsCount > 0 && onToggleSuggestionQueue && (
              <button
                onClick={onToggleSuggestionQueue}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 transition-colors"
                title={`${pendingClaimsCount} pending suggestions`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  {pendingClaimsCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
