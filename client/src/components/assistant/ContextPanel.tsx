/**
 * Silent Partners - Context Panel
 * 
 * Displays the investigation context with collapsible sections.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Target, ChevronUp, ChevronDown, Edit2,
  Lightbulb, AlertCircle, Sparkles, HelpCircle
} from 'lucide-react';
import { InvestigationContext } from './types';
import { ContextEditor } from './ContextEditor';

interface ContextPanelProps {
  context: InvestigationContext;
  onUpdateContext: (context: InvestigationContext) => void;
  onActionClick: (action: string) => void;
}

export function ContextPanel({ context, onUpdateContext, onActionClick }: ContextPanelProps) {
  const [showContext, setShowContext] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);

  const hasContext = context.topic || context.domain || context.focus || context.keyQuestions.length > 0;

  return (
    <div className="border-b border-border shrink-0">
      <button
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-muted/30"
        onClick={() => setShowContext(!showContext)}
      >
        <div className="flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-purple-500" />
          <span className="text-xs font-medium">Investigation Context</span>
          {context.red_flags && context.red_flags.length > 0 && (
            <Badge variant="destructive" className="h-4 text-[9px] px-1">
              {context.red_flags.length} red flags
            </Badge>
          )}
        </div>
        {showContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      
      {showContext && (
        <div className="px-4 pb-3">
          {isEditingContext ? (
            <ContextEditor
              context={context}
              onSave={(ctx) => {
                onUpdateContext(ctx);
                setIsEditingContext(false);
              }}
              onCancel={() => setIsEditingContext(false)}
            />
          ) : hasContext ? (
            <div className="space-y-2 text-xs">
              {context.topic && (
                <div>
                  <span className="text-muted-foreground">Topic: </span>
                  <span className="font-medium">{context.topic}</span>
                </div>
              )}
              {context.domain && (
                <div>
                  <span className="text-muted-foreground">Domain: </span>
                  <span>{context.domain}</span>
                </div>
              )}
              {context.focus && (
                <div>
                  <span className="text-muted-foreground">Focus: </span>
                  <span>{context.focus}</span>
                </div>
              )}
              {context.keyQuestions.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Key Questions:</span>
                  <ul className="mt-1 space-y-0.5 pl-3">
                    {context.keyQuestions.map((q, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <HelpCircle className="w-3 h-3 mt-0.5 text-muted-foreground shrink-0" />
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Key Findings */}
              {context.key_findings && context.key_findings.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground font-medium">Key Findings:</span>
                  <ul className="mt-1 space-y-0.5 pl-3">
                    {context.key_findings.slice(0, 5).map((finding, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Red Flags */}
              {context.red_flags && context.red_flags.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground font-medium text-red-500">Red Flags:</span>
                  <ul className="mt-1 space-y-0.5 pl-3">
                    {context.red_flags.slice(0, 3).map((flag, i) => (
                      <li key={i} className="flex items-start gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>{flag.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Next Steps */}
              {context.next_steps && context.next_steps.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <span className="text-muted-foreground font-medium">Suggested Next Steps:</span>
                  <div className="mt-1 space-y-1">
                    {(context.next_steps as any[]).slice(0, 3).map((step, i) => {
                      const isString = typeof step === 'string';
                      const suggestion = isString ? step : step.suggestion;
                      const actionQuery = isString ? suggestion : step.action_query;
                      return (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="h-auto py-1 px-2 text-[10px] w-full justify-start text-left"
                          onClick={() => onActionClick(actionQuery)}
                        >
                          <Sparkles className="w-3 h-3 mr-1 text-green-500 shrink-0" />
                          <span className="truncate">{suggestion}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] mt-2"
                onClick={() => setIsEditingContext(true)}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit Context
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              <p className="italic">No investigation context set yet.</p>
              <p className="mt-1">The AI will learn about your investigation as you add information.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-6 text-[10px] mt-2"
                onClick={() => setIsEditingContext(true)}
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Set Context
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ContextPanel;
