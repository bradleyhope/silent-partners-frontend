/**
 * Silent Partners - Empty State
 * 
 * Displayed when the network canvas has no entities.
 * Provides guidance and a quick action to start investigating.
 */

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onAddEntity: () => void;
}

export function EmptyState({ onAddEntity }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      <div className="text-center p-8 pointer-events-auto">
        <div className="text-4xl mb-4 opacity-30">🔍</div>
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Start Your Investigation
        </h3>
        <p className="text-sm text-muted-foreground/70 mb-4 max-w-xs">
          Use the AI panel to research a topic, or manually add entities to begin mapping connections.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm shadow-sm"
          onClick={onAddEntity}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add First Entity
        </Button>
      </div>
    </div>
  );
}

export default EmptyState;
