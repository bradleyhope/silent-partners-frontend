/**
 * Silent Partners - Streaming Progress Component v5.0
 * 
 * Shows real-time progress during streaming pipeline operations.
 * Enhanced with visual feedback for:
 * - Searching for entities
 * - Connecting entities
 * - Entity merging (deduplication)
 */

import { Loader2, X, Users, Link2, AlertCircle, Search, Plug, GitMerge, Sparkles } from 'lucide-react';
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

  // Determine the current activity icon based on the phase/progress message
  const getActivityIcon = () => {
    const progress = state.progress?.toLowerCase() || '';
    const phase = state.phase?.toLowerCase() || '';
    
    if (progress.includes('searching') || progress.includes('looking for') || progress.includes('finding next')) {
      return <Search className="w-4 h-4 text-blue-500 animate-pulse" />;
    }
    if (progress.includes('connecting') || progress.includes('finding connections')) {
      return <Plug className="w-4 h-4 text-green-500 animate-pulse" />;
    }
    if (progress.includes('merged') || progress.includes('dedup')) {
      return <GitMerge className="w-4 h-4 text-purple-500" />;
    }
    if (progress.includes('research')) {
      return <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />;
    }
    return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
  };

  // Get a user-friendly phase name
  const getPhaseName = () => {
    const progress = state.progress?.toLowerCase() || '';
    
    if (progress.includes('searching') || progress.includes('looking for')) {
      return 'Discovering entities...';
    }
    if (progress.includes('connecting') || progress.includes('finding connections')) {
      return 'Building connections...';
    }
    if (progress.includes('research')) {
      return 'Researching...';
    }
    if (progress.includes('analyzing')) {
      return 'Analyzing...';
    }
    return state.phase || 'Processing...';
  };

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state.error ? (
            <AlertCircle className="w-4 h-4 text-destructive" />
          ) : (
            getActivityIcon()
          )}
          <span className="text-sm font-medium">
            {state.error ? 'Error' : getPhaseName()}
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

      {/* Current entity being processed */}
      {state.currentEntity && state.isStreaming && (
        <div className="flex items-center gap-2 text-xs bg-primary/10 rounded px-2 py-1">
          <Search className="w-3 h-3 text-primary" />
          <span className="font-medium text-primary truncate">{state.currentEntity}</span>
        </div>
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

      {/* Animated activity bar */}
      {state.isStreaming && (
        <div className="w-full h-1 bg-primary/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/60 rounded-full animate-pulse"
            style={{ 
              width: '30%',
              animation: 'slide 1.5s ease-in-out infinite'
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(200%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
