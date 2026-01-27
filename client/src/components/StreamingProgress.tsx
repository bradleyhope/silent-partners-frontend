/**
 * Silent Partners - Streaming Progress Component
 * 
 * Shows real-time progress during streaming pipeline operations.
 */

import { Loader2, X, Zap, Users, Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreamingState } from '@/hooks/useStreamingPipeline';

interface StreamingProgressProps {
  state: StreamingState;
  onCancel: () => void;
}

export default function StreamingProgress({ state, onCancel }: StreamingProgressProps) {
  if (!state.isStreaming && !state.error) {
    return null;
  }

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state.error ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}
          <span className="text-sm font-medium">
            {state.error ? 'Error' : state.phase || 'Processing...'}
          </span>
        </div>
        {state.isStreaming && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-destructive/10"
            onClick={onCancel}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Progress message */}
      {state.progress && !state.error && (
        <p className="text-xs text-muted-foreground truncate">
          {state.progress}
        </p>
      )}

      {/* Error message */}
      {state.error && (
        <p className="text-xs text-destructive">
          {state.error}
        </p>
      )}

      {/* Stats */}
      {(state.entitiesFound > 0 || state.relationshipsFound > 0) && (
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{state.entitiesFound} entities</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Link2 className="w-3 h-3" />
            <span>{state.relationshipsFound} connections</span>
          </div>
        </div>
      )}

      {/* Animated dots for activity */}
      {state.isStreaming && (
        <div className="flex gap-1 pt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}
