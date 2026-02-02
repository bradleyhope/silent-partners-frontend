/**
 * Silent Partners - Suggestions Panel
 * 
 * Displays AI-generated suggestions for investigation.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { Sparkles } from 'lucide-react';
import { Suggestion } from './types';

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
}

export function SuggestionsPanel({ suggestions, onSuggestionClick }: SuggestionsPanelProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="border-b border-border p-3 shrink-0 bg-green-50/50 dark:bg-green-950/20">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-green-500" />
        <span className="text-xs font-medium text-green-700 dark:text-green-400">Suggestions</span>
      </div>
      <div className="space-y-1.5">
        {suggestions.slice(0, 3).map((suggestion, i) => (
          <button
            key={suggestion.id || i}
            className="w-full text-left p-2 rounded-md bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-700 dark:text-green-400 capitalize">
                {suggestion.type}
              </span>
              {suggestion.priority && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                  suggestion.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                  suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {suggestion.priority}
                </span>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {suggestion.text || suggestion.message}
            </div>
            {suggestion.reasoning && (
              <div className="text-[10px] text-muted-foreground/70 mt-1 italic">
                💡 {suggestion.reasoning}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SuggestionsPanel;
