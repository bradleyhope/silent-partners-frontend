/**
 * Silent Partners - Events Stream
 * 
 * Displays AI thinking events in a collapsible panel.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Brain, ChevronUp, ChevronDown, Trash2,
  Lightbulb, AlertCircle, MessageSquare,
  Target, Sparkles, CheckCircle
} from 'lucide-react';
import { NarrativeEvent } from './types';

// Format timestamp for display
function formatTimeWithSeconds(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Event icon component
function EventIcon({ type }: { type: NarrativeEvent['type'] }) {
  switch (type) {
    case 'extraction':
      return <Brain className="w-3.5 h-3.5 text-blue-500" />;
    case 'context_update':
      return <Target className="w-3.5 h-3.5 text-purple-500" />;
    case 'reasoning':
      return <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />;
    case 'suggestion':
      return <Sparkles className="w-3.5 h-3.5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    case 'user_action':
      return <MessageSquare className="w-3.5 h-3.5 text-gray-500" />;
    case 'discovery':
      return <Sparkles className="w-3.5 h-3.5 text-cyan-500" />;
    default:
      return <CheckCircle className="w-3.5 h-3.5 text-gray-400" />;
  }
}

// Narrative event card
function NarrativeEventCard({ event, onActionClick }: { event: NarrativeEvent; onActionClick: (action: string) => void }) {
  const [expanded, setExpanded] = useState(event.type === 'suggestion' || event.type === 'error');

  return (
    <div className={`border rounded-lg p-2.5 text-xs ${
      event.type === 'error' ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20' :
      event.type === 'suggestion' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' :
      'border-border bg-card'
    }`}>
      <div className="flex items-start gap-2">
        <EventIcon type={event.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium truncate">{event.title}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">{formatTimeWithSeconds(event.timestamp)}</span>
          </div>
          <p className="text-muted-foreground mt-0.5 line-clamp-2">{event.content}</p>
          
          {event.reasoning && (
            <button 
              className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1.5 hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              <Lightbulb className="w-3 h-3" />
              Reasoning
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          
          {expanded && event.reasoning && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-[11px] italic text-muted-foreground">
              "{event.reasoning}"
            </div>
          )}
          
          {event.actions && event.actions.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {event.actions.map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant === 'primary' ? 'default' : 'outline'}
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={() => onActionClick(action.action)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EventsStreamProps {
  events: NarrativeEvent[];
  onActionClick: (action: string) => void;
  onClearEvents?: () => void;
}

export function EventsStream({ events, onActionClick, onClearEvents }: EventsStreamProps) {
  const [showEvents, setShowEvents] = useState(false);
  const eventsScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (showEvents && eventsScrollRef.current) {
      eventsScrollRef.current.scrollTop = eventsScrollRef.current.scrollHeight;
    }
  }, [events, showEvents]);

  if (events.length === 0) return null;

  return (
    <div className="border-b border-border shrink-0">
      <button
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-muted/30"
        onClick={() => setShowEvents(!showEvents)}
      >
        <div className="flex items-center gap-2">
          <Brain className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium">Thinking ({events.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {onClearEvents && events.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onClearEvents();
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
          {showEvents ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      
      {showEvents && (
        <div className="px-4 pb-3 max-h-48 overflow-y-auto" ref={eventsScrollRef}>
          <div className="space-y-2">
            {events.map(event => (
              <NarrativeEventCard 
                key={event.id} 
                event={event} 
                onActionClick={onActionClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EventsStream;
