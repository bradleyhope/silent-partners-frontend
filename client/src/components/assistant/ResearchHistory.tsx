/**
 * Silent Partners - Research History
 * 
 * Displays past research queries in a collapsible panel.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { useState } from 'react';
import { History, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { ResearchHistoryItem } from './types';

interface ResearchHistoryProps {
  history: ResearchHistoryItem[];
}

export function ResearchHistory({ history }: ResearchHistoryProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="border-b border-border shrink-0">
      <button
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-muted/30"
        onClick={() => setShowHistory(!showHistory)}
      >
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium">Research History ({history.length})</span>
        </div>
        {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      
      {showHistory && (
        <div className="px-4 pb-3 max-h-40 overflow-y-auto">
          <div className="space-y-1.5">
            {history.slice(0, 10).map((item) => (
              <div key={item.id} className="p-2 rounded-md bg-muted/30 text-xs">
                <div className="flex items-center gap-1.5">
                  <Search className="w-3 h-3 text-muted-foreground" />
                  <span className="font-medium truncate flex-1">{item.query}</span>
                  <span className="text-[10px] text-muted-foreground">{item.source}</span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground flex gap-3">
                  <span>{item.entities_found} entities</span>
                  <span>{item.relationships_found} relationships</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResearchHistory;
