/**
 * Silent Partners - Home Page
 * 
 * Main application layout with sidebar, canvas, and detail panel.
 * Design: Archival Investigator aesthetic
 * 
 * Keyboard shortcuts:
 * - Ctrl+Z: Undo last action
 * - Delete/Backspace: Delete selected entity or relationship
 * - Escape: Deselect current selection
 */

import { NetworkProvider } from '@/contexts/NetworkContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import NetworkCanvas from '@/components/NetworkCanvas';
import DetailPanel from '@/components/DetailPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Wrapper component that uses the keyboard shortcuts hook
function AppContent() {
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <NetworkCanvas />
        <DetailPanel />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <NetworkProvider>
      <AppContent />
    </NetworkProvider>
  );
}
