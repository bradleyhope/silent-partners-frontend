/**
 * Silent Partners - Progress Indicator
 * 
 * Displays research progress with step tracking and plan preview.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { Loader2 } from 'lucide-react';
import { ProgressStatus } from './types';

interface ProgressIndicatorProps {
  status: ProgressStatus | null;
}

export function ProgressIndicator({ status }: ProgressIndicatorProps) {
  if (!status) return null;

  return (
    <div className="flex justify-start mb-3">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[95%]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <div className="text-sm">
            {status.step && status.total ? (
              <div className="space-y-1">
                <div className="text-muted-foreground">
                  Step {status.step} of {status.total}
                </div>
                {status.goal && (
                  <div className="text-foreground font-medium">
                    {status.goal}
                  </div>
                )}
                {status.searching && (
                  <div className="text-xs text-muted-foreground italic">
                    🔍 {status.searching}
                  </div>
                )}
              </div>
            ) : status.searching ? (
              <div className="space-y-1">
                <div className="text-muted-foreground">Researching...</div>
                <div className="text-xs text-muted-foreground italic">
                  🔍 {status.searching}
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">Researching...</span>
            )}
          </div>
        </div>
        
        {/* Show plan preview if available */}
        {status.plan && status.plan.length > 1 && (
          <div className="mt-2 pt-2 border-t border-border/50">
            <div className="text-[10px] text-muted-foreground mb-1">Research Plan:</div>
            <div className="space-y-0.5">
              {status.plan.slice(0, 4).map((p, i) => (
                <div 
                  key={i} 
                  className={`text-[10px] flex items-center gap-1 ${
                    status.step && i + 1 < status.step 
                      ? 'text-green-500 line-through opacity-60' 
                      : i + 1 === status.step 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground'
                  }`}
                >
                  <span className="w-3">{i + 1}.</span>
                  <span className="truncate">{p.goal}</span>
                </div>
              ))}
              {status.plan.length > 4 && (
                <div className="text-[10px] text-muted-foreground">
                  +{status.plan.length - 4} more steps...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressIndicator;
