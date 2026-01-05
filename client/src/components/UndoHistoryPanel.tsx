/**
 * Silent Partners - Undo History Panel
 * 
 * Shows a list of recent actions that users can step back through.
 */

import { useState, useEffect, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { History, RotateCcw, ChevronDown, ChevronUp, X } from 'lucide-react';

interface HistoryEntry {
  id: string;
  action: string;
  description: string;
  timestamp: Date;
  entityCount: number;
  relationshipCount: number;
  snapshot: {
    entities: any[];
    relationships: any[];
  };
}

export function UndoHistoryPanel() {
  const { network, dispatch } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const lastStateRef = useRef<string>('');
  const actionCountRef = useRef(0);

  // Track network changes and create history entries
  useEffect(() => {
    const currentState = JSON.stringify({
      entities: network.entities.length,
      relationships: network.relationships.length
    });

    if (currentState !== lastStateRef.current && lastStateRef.current !== '') {
      const prevState = JSON.parse(lastStateRef.current);
      const entitiesDiff = network.entities.length - prevState.entities;
      const relationshipsDiff = network.relationships.length - prevState.relationships;

      let action = 'Modified';
      let description = 'Network modified';

      if (entitiesDiff > 0) {
        action = 'Added';
        description = `Added ${entitiesDiff} ${entitiesDiff === 1 ? 'entity' : 'entities'}`;
      } else if (entitiesDiff < 0) {
        action = 'Deleted';
        description = `Deleted ${Math.abs(entitiesDiff)} ${Math.abs(entitiesDiff) === 1 ? 'entity' : 'entities'}`;
      } else if (relationshipsDiff > 0) {
        action = 'Connected';
        description = `Added ${relationshipsDiff} ${relationshipsDiff === 1 ? 'connection' : 'connections'}`;
      } else if (relationshipsDiff < 0) {
        action = 'Disconnected';
        description = `Removed ${Math.abs(relationshipsDiff)} ${Math.abs(relationshipsDiff) === 1 ? 'connection' : 'connections'}`;
      }

      const newEntry: HistoryEntry = {
        id: `history-${actionCountRef.current++}`,
        action,
        description,
        timestamp: new Date(),
        entityCount: network.entities.length,
        relationshipCount: network.relationships.length,
        snapshot: {
          entities: [...network.entities],
          relationships: [...network.relationships]
        }
      };

      setHistory(prev => {
        const updated = [newEntry, ...prev];
        return updated.slice(0, 20); // Keep last 20 entries
      });
    }

    lastStateRef.current = currentState;
  }, [network.entities.length, network.relationships.length]);

  const restoreToEntry = (entry: HistoryEntry) => {
    dispatch({
      type: 'SET_NETWORK',
      payload: {
        ...network,
        entities: entry.snapshot.entities,
        relationships: entry.snapshot.relationships
      }
    });
    setIsOpen(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-10">
      <Button
        variant="outline"
        size="sm"
        className="h-8 bg-card/90 hover:bg-card gap-1.5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <History className="h-3.5 w-3.5" />
        <span className="text-xs">History</span>
        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{history.length}</span>
        {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {isOpen && (
        <div className="absolute top-10 right-0 w-64 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium">Recent Actions</span>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {history.map((entry, index) => (
              <div
                key={entry.id}
                className="px-3 py-2 border-b border-border/50 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        entry.action === 'Added' ? 'bg-green-100 text-green-700' :
                        entry.action === 'Deleted' ? 'bg-red-100 text-red-700' :
                        entry.action === 'Connected' ? 'bg-blue-100 text-blue-700' :
                        entry.action === 'Disconnected' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {entry.action}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate">{entry.description}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.entityCount} entities · {entry.relationshipCount} connections
                    </p>
                  </div>
                  
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => restoreToEntry(entry)}
                      title="Restore to this state"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="px-3 py-2 bg-muted/30 text-[10px] text-muted-foreground">
            Press Ctrl+Z to undo last action
          </div>
        </div>
      )}
    </div>
  );
}
