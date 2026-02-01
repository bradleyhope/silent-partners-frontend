/**
 * Silent Partners - Narrative Panel
 * 
 * A real-time panel showing the AI's thinking process, including:
 * - Investigation context (topic, domain, key questions)
 * - AI reasoning and decision-making
 * - Actionable suggestions
 * - Chat interface for user guidance
 */

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain, ChevronDown, ChevronUp, Edit2, Send, Trash2,
  Lightbulb, AlertCircle, CheckCircle, Loader2, MessageSquare,
  Target, HelpCircle, Sparkles, X, History, Search
} from 'lucide-react';

export interface NarrativeEvent {
  id: string;
  timestamp: string;
  type: 'extraction' | 'context_update' | 'reasoning' | 'suggestion' | 'error' | 'user_action' | 'info' | 'discovery';
  title: string;
  content: string;
  reasoning?: string;
  actions?: { label: string; action: string; variant: 'primary' | 'secondary' }[];
  metadata?: Record<string, any>;
}

export interface InvestigationContext {
  topic: string;
  domain: string;
  focus: string;
  keyQuestions: string[];
  // New fields from backend
  title?: string;
  description?: string;
  key_findings?: string[];
  red_flags?: Array<{description: string; severity: string; entities_involved?: string[]}>;
  next_steps?: Array<{suggestion: string; reasoning: string; priority?: string; action_query: string}> | string[];
  hypotheses?: Array<{hypothesis: string; status: string}>;
  session_summaries?: Array<{date: string; summary: string}>;
  last_updated?: string;
}

export interface Suggestion {
  id?: string;
  type: string;
  message?: string;  // Legacy field
  text?: string;     // New field from context updates
  reasoning?: string;
  action?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ResearchHistoryItem {
  id: string;
  query: string;
  source: string;
  entities_found: number;
  relationships_found: number;
  timestamp: string;
}

interface NarrativePanelProps {
  events: NarrativeEvent[];
  context: InvestigationContext;
  suggestions?: Suggestion[];
  researchHistory?: ResearchHistoryItem[];
  onUpdateContext: (context: InvestigationContext) => void;
  onActionClick: (action: string) => void;
  onChatSubmit: (message: string) => void;
  onClearEvents: () => void;
  onSuggestionClick?: (suggestion: Suggestion) => void;
  isProcessing?: boolean;
}

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

function NarrativeEventCard({ event, onActionClick }: { event: NarrativeEvent; onActionClick: (action: string) => void }) {
  const [expanded, setExpanded] = useState(event.type === 'suggestion' || event.type === 'error');
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

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
            <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(event.timestamp)}</span>
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

function ContextEditor({ context, onSave, onCancel }: { 
  context: InvestigationContext; 
  onSave: (ctx: InvestigationContext) => void;
  onCancel: () => void;
}) {
  const [editedContext, setEditedContext] = useState(context);
  const [newQuestion, setNewQuestion] = useState('');

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setEditedContext(prev => ({
        ...prev,
        keyQuestions: [...prev.keyQuestions, newQuestion.trim()]
      }));
      setNewQuestion('');
    }
  };

  const removeQuestion = (index: number) => {
    setEditedContext(prev => ({
      ...prev,
      keyQuestions: prev.keyQuestions.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Topic</label>
        <Input
          value={editedContext.topic}
          onChange={(e) => setEditedContext(prev => ({ ...prev, topic: e.target.value }))}
          className="h-7 text-xs mt-1"
          placeholder="e.g., 1MDB Financial Scandal"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Domain</label>
        <Input
          value={editedContext.domain}
          onChange={(e) => setEditedContext(prev => ({ ...prev, domain: e.target.value }))}
          className="h-7 text-xs mt-1"
          placeholder="e.g., Financial Crime, Politics"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Focus</label>
        <Input
          value={editedContext.focus}
          onChange={(e) => setEditedContext(prev => ({ ...prev, focus: e.target.value }))}
          className="h-7 text-xs mt-1"
          placeholder="e.g., Following the money trail"
        />
      </div>
      <div>
        <label className="text-[10px] font-medium text-muted-foreground">Key Questions</label>
        <div className="space-y-1 mt-1">
          {editedContext.keyQuestions.map((q, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="text-xs flex-1 bg-background rounded px-2 py-1">{q}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeQuestion(i)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
          <div className="flex gap-1">
            <Input
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              className="h-7 text-xs"
              placeholder="Add a key question..."
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
            />
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addQuestion}>
              Add
            </Button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" className="flex-1 h-7 text-xs" onClick={() => onSave(editedContext)}>
          Save Context
        </Button>
        <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function NarrativePanel({
  events,
  context,
  suggestions = [],
  researchHistory = [],
  onUpdateContext,
  onActionClick,
  onChatSubmit,
  onClearEvents,
  onSuggestionClick,
  isProcessing = false
}: NarrativePanelProps) {
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showContext, setShowContext] = useState(true);
  const [showResearchHistory, setShowResearchHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const handleChatSubmit = () => {
    if (chatMessage.trim()) {
      onChatSubmit(chatMessage.trim());
      setChatMessage('');
    }
  };

  const hasContext = context.topic || context.domain || context.focus || context.keyQuestions.length > 0;

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Orchestrator</span>
          </div>
          {isProcessing && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Investigation Context */}
      <div className="border-b border-border shrink-0">
        <button
          className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/30"
          onClick={() => setShowContext(!showContext)}
        >
          <div className="flex items-center gap-2">
            <Target className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs font-medium">Investigation Context</span>
          </div>
          {showContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        
        {showContext && (
          <div className="px-3 pb-3">
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
                {/* Next Steps - One-click actions */}
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

      {/* Events Stream */}
      <div className="flex-1 overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between border-b border-border bg-muted/20">
          <span className="text-xs font-medium text-muted-foreground">Thinking</span>
          {events.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-5 text-[10px] px-1.5"
              onClick={onClearEvents}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-3 space-y-2">
            {events.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>AI thinking will appear here as you work.</p>
              </div>
            ) : (
              events.map(event => (
                <NarrativeEventCard 
                  key={event.id} 
                  event={event} 
                  onActionClick={onActionClick}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Research History */}
      {researchHistory.length > 0 && (
        <div className="border-t border-border shrink-0">
          <button
            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/30"
            onClick={() => setShowResearchHistory(!showResearchHistory)}
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium">Research History ({researchHistory.length})</span>
            </div>
            {showResearchHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {showResearchHistory && (
            <div className="px-3 pb-3 max-h-40 overflow-y-auto">
              <div className="space-y-1.5">
                {researchHistory.slice(0, 10).map((item) => (
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
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="border-t border-border p-3 shrink-0 bg-green-50/50 dark:bg-green-950/20">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Suggestions</span>
          </div>
          <div className="space-y-1.5">
            {suggestions.slice(0, 3).map((suggestion, i) => (
              <button
                key={suggestion.id || i}
                className="w-full text-left p-2 rounded-md bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-green-700 dark:text-green-400 capitalize">{suggestion.type}</span>
                  {suggestion.priority && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>{suggestion.priority}</span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{suggestion.text || suggestion.message}</div>
                {suggestion.reasoning && (
                  <div className="text-[10px] text-muted-foreground/70 mt-1 italic">💡 {suggestion.reasoning}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="border-t border-border p-3 shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="Research someone, find connections, analyze patterns..."
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleChatSubmit()}
          />
          <Button 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={handleChatSubmit}
            disabled={!chatMessage.trim()}
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
