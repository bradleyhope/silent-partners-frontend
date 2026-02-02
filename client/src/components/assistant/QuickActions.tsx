/**
 * Silent Partners - Quick Actions
 * 
 * Quick action buttons for common investigation tasks.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface QuickActionsProps {
  onAction: (query: string) => void;
  disabled: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Find connections', query: 'Find connections between the entities in my graph' },
  { label: 'Identify gaps', query: 'What information is missing from this investigation?' },
  { label: 'Summarize findings', query: 'Summarize what we know so far' },
];

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border bg-muted/20">
      {QUICK_ACTIONS.map((action, i) => (
        <Button
          key={i}
          variant="outline"
          size="sm"
          className="h-6 text-[10px] px-2"
          onClick={() => onAction(action.query)}
          disabled={disabled}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}

export default QuickActions;
