/**
 * Silent Partners - Zoom Controls
 * 
 * UI controls for canvas zoom and pan operations.
 * Extracted from NetworkCanvas.tsx for better separation of concerns.
 */

import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export function ZoomControls({ onZoomIn, onZoomOut, onFitView }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"
        onClick={onZoomIn}
        title="Zoom In"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"
        onClick={onZoomOut}
        title="Zoom Out"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"
        onClick={onFitView}
        title="Fit to View"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default ZoomControls;
