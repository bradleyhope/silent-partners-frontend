/**
 * Silent Partners - Zoom Controls
 * 
 * UI controls for canvas zoom and pan operations.
 * Theme-aware styling that blends with the canvas background.
 */

import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onFitView }: ZoomControlsProps) {
  const btnClass = "h-8 w-8 bg-background/80 backdrop-blur-sm shadow-sm border-border/50 hover:bg-background hover:border-border transition-all duration-150 text-muted-foreground hover:text-foreground";

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
      <Button
        variant="outline"
        size="icon"
        className={btnClass}
        onClick={onZoomIn}
        title="Zoom In"
      >
        <ZoomIn className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={btnClass}
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <ZoomOut className="h-3.5 w-3.5" />
      </Button>
      <div className="h-px bg-border/30 mx-1.5 my-0.5" />
      <Button
        variant="outline"
        size="icon"
        className={btnClass}
        onClick={onFitView}
        title="Fit to View"
      >
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export default ZoomControls;
