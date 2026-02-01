/**
 * Silent Partners - Sidebar (Left Toolbar)
 *
 * Tool palette for manual editing and graph operations.
 * Design: Archival Investigator with gold accents
 * 
 * v8.2: Removed AI panel (moved to dedicated chat panel on right)
 *       Added pending claims indicator badge
 * v8.5: Added collapse toggle for desktop (matching right panel behavior)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { NarrativeEvent } from './NarrativePanel';
import { Claim } from '@/lib/claims-api';
import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ 
  onNarrativeEvent,
  onClaimAccepted,
  onClaimRejected,
  pendingClaimsCount = 0,
  onToggleSuggestionQueue,
  isCollapsed = false,
  onToggleCollapse,
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

  // Collapsed state - show only a thin strip with expand button
  if (isCollapsed && !mobileOpen) {
    return (
      <aside className="hidden md:flex flex-col h-full w-12 bg-sidebar border-r border-sidebar-border">
        {/* Expand button at top */}
        <div className="p-2 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0"
            onClick={onToggleCollapse}
            title="Expand toolbar"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Vertical label */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Wrench className="w-4 h-4 text-muted-foreground" />
            <span 
              className="text-[10px] font-medium text-muted-foreground writing-mode-vertical"
              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
            >
              Tools
            </span>
          </div>
        </div>
        
        {/* Stats at bottom */}
        <div className="p-2 border-t border-sidebar-border">
          <div className="text-[9px] font-mono text-muted-foreground text-center">
            <div>{network.entities.length}</div>
            <div className="text-[8px]">ent</div>
          </div>
          {/* Pending claims indicator */}
          {pendingClaimsCount > 0 && onToggleSuggestionQueue && (
            <button
              onClick={onToggleSuggestionQueue}
              className="mt-2 w-full flex justify-center"
              title={`${pendingClaimsCount} pending suggestions`}
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 text-[8px] text-white font-bold flex items-center justify-center">
                  {pendingClaimsCount > 9 ? '9+' : pendingClaimsCount}
                </span>
              </span>
            </button>
          )}
        </div>
      </aside>
    );
  }

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
        {/* Collapse button (desktop only) */}
        {onToggleCollapse && (
          <div className="hidden md:flex items-center justify-between px-3 py-2 border-b border-sidebar-border bg-sidebar-accent/20">
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Tool Palette</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onToggleCollapse}
              title="Collapse toolbar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

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
