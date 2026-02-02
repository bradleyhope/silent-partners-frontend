/**
 * Silent Partners - Assistant Header
 * 
 * Header for the investigative assistant panel.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { Button } from '@/components/ui/button';
import { Brain, X, Loader2 } from 'lucide-react';

interface AssistantHeaderProps {
  pendingClaimsCount: number;
  isProcessing: boolean;
  onToggle: () => void;
  onToggleSuggestionQueue: () => void;
}

export function AssistantHeader({
  pendingClaimsCount,
  isProcessing,
  onToggle,
  onToggleSuggestionQueue,
}: AssistantHeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-semibold text-sm">Investigative Assistant</h2>
            <p className="text-[10px] text-muted-foreground">Research, analyze, discover</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Pending claims indicator */}
          {pendingClaimsCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
              onClick={onToggleSuggestionQueue}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              {pendingClaimsCount} pending
            </Button>
          )}
          {isProcessing && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
          )}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AssistantHeader;
