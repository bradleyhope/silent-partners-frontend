/**
 * Silent Partners - Home Page
 * 
 * Main application layout with sidebar, canvas, and detail panel.
 * Design: Archival Investigator aesthetic
 */

import { NetworkProvider } from '@/contexts/NetworkContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import NetworkCanvas from '@/components/NetworkCanvas';
import DetailPanel from '@/components/DetailPanel';

export default function Home() {
  return (
    <NetworkProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <NetworkCanvas />
          <DetailPanel />
        </div>
      </div>
    </NetworkProvider>
  );
}
