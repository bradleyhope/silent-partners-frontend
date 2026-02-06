/**
 * Silent Partners - Empty State
 * 
 * Displayed when the network canvas has no entities.
 * Features a Lombardi-inspired SVG illustration with sweeping arcs
 * and hollow/solid nodes, matching the archival investigator aesthetic.
 */

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddEntity: () => void;
}

function LombardiIllustration() {
  return (
    <svg
      width="180"
      height="120"
      viewBox="0 0 180 120"
      fill="none"
      className="mx-auto mb-5 opacity-20"
    >
      {/* Sweeping arcs - Lombardi signature */}
      <path d="M 30 80 Q 90 -10 150 60" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M 20 50 Q 70 110 140 40" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M 50 90 Q 100 30 160 80" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M 10 70 Q 60 20 110 70" stroke="currentColor" strokeWidth="0.8" fill="none" />
      <path d="M 70 100 Q 120 10 170 50" stroke="currentColor" strokeWidth="0.8" fill="none" />
      
      {/* Hollow nodes (organizations) */}
      <circle cx="30" cy="80" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="150" cy="60" r="7" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <circle cx="110" cy="70" r="5" stroke="currentColor" strokeWidth="1.2" fill="none" />
      
      {/* Solid nodes (people) */}
      <circle cx="20" cy="50" r="3" fill="currentColor" />
      <circle cx="140" cy="40" r="3.5" fill="currentColor" />
      <circle cx="50" cy="90" r="2.5" fill="currentColor" />
      <circle cx="160" cy="80" r="2.5" fill="currentColor" />
      <circle cx="70" cy="100" r="2" fill="currentColor" />
      <circle cx="10" cy="70" r="2" fill="currentColor" />
      <circle cx="170" cy="50" r="2" fill="currentColor" />
    </svg>
  );
}

export function EmptyState({ onAddEntity }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="text-center p-8 pointer-events-auto max-w-sm">
        <LombardiIllustration />
        <h3 className="font-display text-lg font-medium text-foreground/60 mb-2 tracking-tight">
          Start Your Investigation
        </h3>
        <p className="text-sm text-muted-foreground/60 mb-5 leading-relaxed">
          Use the Assistant to research a topic, or manually add entities to begin mapping connections.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm shadow-sm border-border/60 hover:border-primary/40 hover:bg-background transition-all duration-200"
          onClick={onAddEntity}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add First Entity
        </Button>
      </div>
    </div>
  );
}

export default EmptyState;
