/**
 * Silent Partners - Investigative Assistant Panel
 * 
 * The primary AI interface for conducting investigations.
 * A conversational assistant with full access to research tools,
 * graph manipulation, and investigation memory.
 * 
 * v8.3: Full feature parity with NarrativePanel + new enhancements
 * - Next Steps (one-click actions)
 * - Context Editor (topic, domain, focus, key questions)
 * - Events Stream (real-time thinking with expandable reasoning)
 * - Research History (collapsible list)
 * - Suggestions Panel (clickable AI suggestions)
 * - Quick Actions (new)
 * - Pending Claims Badge (new)
 * - Message Metadata (new)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Brain, ChevronDown, ChevronUp, Send, Trash2, Edit2,
  Lightbulb, AlertCircle, Loader2, MessageSquare,
  Target, Sparkles, X, Search, FileText, History,
  CheckCircle, Clock, AlertTriangle, HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { streamOrchestrate, OrchestratorCallbacks, InvestigationContext as StreamContext, PipelineEntity, PipelineRelationship } from '@/lib/streaming-api';
import { generateId, Entity, Relationship } from '@/lib/store';
import claimsApi, { Claim } from '@/lib/claims-api';
import { ChatMessageBubble, ChatMessage } from './ChatMessageBubble';

// ============================================
// Types and Interfaces
// ============================================

// Narrative event (from NarrativePanel)
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

// Investigation context
export interface InvestigationContext {
  topic: string;
  domain: string;
  focus: string;
  keyQuestions: string[];
  title?: string;
  description?: string;
  key_findings?: string[];
  red_flags?: Array<{description: string; severity: string; entities_involved?: string[]}>;
  next_steps?: Array<{suggestion: string; reasoning: string; priority?: string; action_query: string}> | string[];
  hypotheses?: Array<{hypothesis: string; status: string}>;
  session_summaries?: Array<{date: string; summary: string}>;
  last_updated?: string;
}

// Suggestion type
export interface Suggestion {
  id?: string;
  type: string;
  message?: string;
  text?: string;
  reasoning?: string;
  action?: string;
  priority?: 'high' | 'medium' | 'low';
}

// Research history item
export interface ResearchHistoryItem {
  id: string;
  query: string;
  source: string;
  entities_found: number;
  relationships_found: number;
  timestamp: string;
}

interface InvestigativeAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  context: InvestigationContext;
  onUpdateContext: (context: InvestigationContext) => void;
  pendingClaimsCount: number;
  onToggleSuggestionQueue: () => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  // New props for full feature parity
  events?: NarrativeEvent[];
  suggestions?: Suggestion[];
  researchHistory?: ResearchHistoryItem[];
  onActionClick?: (action: string) => void;
  onClearEvents?: () => void;
  onSuggestionClick?: (suggestion: Suggestion) => void;
}

// ============================================
// Helper Components
// ============================================

// Format timestamp for display
function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

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

// Narrative event card (from NarrativePanel)
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

// Context editor component (from NarrativePanel)
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

// Quick action buttons
function QuickActions({ onAction, disabled }: { onAction: (query: string) => void; disabled: boolean }) {
  const actions = [
    { label: 'Find connections', query: 'Find connections between the entities in my graph' },
    { label: 'Identify gaps', query: 'What information is missing from this investigation?' },
    { label: 'Summarize findings', query: 'Summarize what we know so far' },
  ];
  
  return (
    <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border bg-muted/20">
      {actions.map((action, i) => (
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

// ============================================
// Main Component
// ============================================

export default function InvestigativeAssistant({
  isOpen,
  onToggle,
  context,
  onUpdateContext,
  pendingClaimsCount,
  onToggleSuggestionQueue,
  isProcessing,
  setIsProcessing,
  events = [],
  suggestions = [],
  researchHistory = [],
  onActionClick,
  onClearEvents,
  onSuggestionClick,
}: InvestigativeAssistantProps) {
  const { network, addOrMergeEntity, addOrMergeRelationship, dispatch } = useNetwork();
  
  // Generate storage key based on network ID
  const storageKey = `sp-chat-${network.id || 'default'}`;
  
  // Initialize messages from localStorage
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage:', e);
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [showContext, setShowContext] = useState(true);
  const [showEvents, setShowEvents] = useState(false);
  const [showResearchHistory, setShowResearchHistory] = useState(false);
  const [isEditingContext, setIsEditingContext] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventsScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  
  // Entity tracking for current session
  const entityIdMap = useRef<Map<string, string>>(new Map());
  const sessionEntities = useRef<Map<string, Entity>>(new Map());
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Auto-scroll events when new events arrive
  useEffect(() => {
    if (eventsScrollRef.current) {
      eventsScrollRef.current.scrollTop = eventsScrollRef.current.scrollHeight;
    }
  }, [events]);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }
    };
  }, []);
  
  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.warn('Failed to save chat history to localStorage:', e);
      }
    }
  }, [messages, storageKey]);
  
  // Load messages when network ID changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e);
    }
    // If no saved messages, show welcome
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "I'm your investigative assistant. I can help you research people, organizations, and their connections. Ask me to find information, analyze patterns, or explore relationships in your network.",
      timestamp: new Date().toISOString(),
    }]);
  }, [storageKey]);
  
  // Add a welcome message on first open (only if no messages loaded)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "I'm your investigative assistant. I can help you research people, organizations, and their connections. Ask me to find information, analyze patterns, or explore relationships in your network.",
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [isOpen, messages.length]);
  
  // Convert pipeline entity to our Entity format
  const convertEntity = useCallback((pipelineEntity: PipelineEntity): Entity => {
    const id = generateId();
    entityIdMap.current.set(pipelineEntity.id || pipelineEntity.name, id);
    entityIdMap.current.set(pipelineEntity.name.toLowerCase(), id);

    const entity: Entity = {
      id,
      name: pipelineEntity.name,
      type: (pipelineEntity.type as Entity['type']) || 'unknown',
      description: pipelineEntity.description,
      importance: pipelineEntity.importance || 5,
      source_type: 'web',
      created_at: new Date().toISOString(),
    };

    sessionEntities.current.set(id, entity);
    sessionEntities.current.set(pipelineEntity.name.toLowerCase(), entity);

    return entity;
  }, []);
  
  // Find entity ID from various sources
  const findEntityId = useCallback((nameOrId: string): string | undefined => {
    const fromMap = entityIdMap.current.get(nameOrId) ||
                    entityIdMap.current.get(nameOrId.toLowerCase());
    if (fromMap) return fromMap;

    const fromSession = sessionEntities.current.get(nameOrId.toLowerCase());
    if (fromSession) return fromSession.id;

    const fromNetwork = network.entities.find(
      e => e.name.toLowerCase() === nameOrId.toLowerCase() || e.id === nameOrId
    );
    return fromNetwork?.id;
  }, [network.entities]);

  // Convert pipeline relationship to our Relationship format
  const convertRelationship = useCallback((pipelineRel: PipelineRelationship): Relationship | null => {
    const sourceId = findEntityId(pipelineRel.source);
    const targetId = findEntityId(pipelineRel.target);

    if (!sourceId || !targetId) return null;

    return {
      id: generateId(),
      source: sourceId,
      target: targetId,
      type: pipelineRel.type || 'related_to',
      label: pipelineRel.label || pipelineRel.type,
    };
  }, [findEntityId]);
  
  // Handle action click (for events and next steps)
  const handleActionClick = useCallback((action: string) => {
    if (onActionClick) {
      onActionClick(action);
    } else {
      // Default behavior: set as input and send
      setInputValue(action);
      textareaRef.current?.focus();
    }
  }, [onActionClick]);
  
  // Handle sending a message
  const handleSend = useCallback(async () => {
    const query = inputValue.trim();
    if (!query || isProcessing) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);
    
    // Clear entity tracking for new query
    entityIdMap.current.clear();
    sessionEntities.current.clear();
    
    // Track results
    let entitiesFound = 0;
    let relationshipsFound = 0;
    let claimsCreated = 0;
    let responseContent = '';
    
    // Extract potential entity names from query immediately
    // This gives instant visual feedback while the AI researches
    const extractImmediateEntities = (text: string): string[] => {
      const entities: string[] = [];
      
      // Pattern 1: Capitalized multi-word names (e.g., "Benjamin Mauerberger", "Elon Musk")
      const namePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
      let match;
      while ((match = namePattern.exec(text)) !== null) {
        const name = match[1];
        // Filter out common phrases that aren't names
        const skipPhrases = ['The', 'This', 'That', 'What', 'Who', 'How', 'Why', 'When', 'Where'];
        if (!skipPhrases.some(p => name.startsWith(p + ' '))) {
          entities.push(name);
        }
      }
      
      // Pattern 2: Quoted names (e.g., "Benjamin Mauerberger")
      const quotedPattern = /["']([^"']+)["']/g;
      while ((match = quotedPattern.exec(text)) !== null) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 50 && !entities.includes(name)) {
          entities.push(name);
        }
      }
      
      return [...new Set(entities)]; // Remove duplicates
    };
    
    // Add immediate entities to graph with "pending" status
    const immediateEntities = extractImmediateEntities(query);
    for (const name of immediateEntities) {
      // Check if entity already exists
      const exists = network.entities.some(
        e => e.name.toLowerCase() === name.toLowerCase()
      );
      if (!exists) {
        const newEntity: Entity = {
          id: generateId(),
          name: name,
          type: 'unknown', // Will be updated by AI
          description: 'Researching...',
          importance: 5,
          source_type: 'manual',
          source_query: query,
          created_at: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_ENTITY', payload: newEntity });
        entitiesFound++;
      }
    }
    
    // Build context for orchestrator
    const streamContext: StreamContext = {
      topic: context.topic || '',
      domain: context.domain || '',
      focus: context.focus || '',
      key_questions: context.keyQuestions || [],
      entities: network.entities.map(e => ({ id: e.id, name: e.name, type: e.type })),
      relationships: network.relationships.map(r => ({ source: r.source, target: r.target, type: r.type || 'related' })),
      graph_id: network.id,
    };
    
    // Create callbacks matching OrchestratorCallbacks interface
    const callbacks: OrchestratorCallbacks = {
      onStart: () => {
        // Auto-populate title if network is untitled and empty
        if (network.title === 'Untitled Network' && network.entities.length === 0) {
          const autoTitle = query.length > 50 ? query.slice(0, 47) + '...' : query;
          dispatch({ type: 'UPDATE_NETWORK', payload: { title: autoTitle } });
        }
      },
      onStepStarted: (step: number, total: number, goal: string) => {
        // Could show progress indicator
      },
      onEntityFound: (entity: PipelineEntity, isNew: boolean) => {
        const converted = convertEntity(entity);
        addOrMergeEntity(converted);
        entitiesFound++;
      },
      onRelationshipFound: (rel: PipelineRelationship, isNew: boolean) => {
        const converted = convertRelationship(rel);
        if (converted) {
          addOrMergeRelationship(converted);
          relationshipsFound++;
        }
        // Track claims created
        if ((rel as any).claim_id) {
          claimsCreated++;
        }
      },
      onThinking: (content: string) => {
        responseContent += content;
      },
      onComplete: (entities: PipelineEntity[], relationships: PipelineRelationship[], message: string) => {
        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: responseContent || message || 'Research complete.',
          timestamp: new Date().toISOString(),
          metadata: {
            entitiesFound,
            relationshipsFound,
            claimsCreated,
          },
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsProcessing(false);
        
        // Show toast for claims
        if (claimsCreated > 0) {
          toast.info(`${claimsCreated} new suggestions ready for review`, {
            action: {
              label: 'Review',
              onClick: onToggleSuggestionQueue,
            },
          });
        }
      },
      onError: (error: string, recoverable: boolean) => {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `Error: ${error}`,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsProcessing(false);
        toast.error('Research failed. Please try again.');
      },
      onContextUpdate: (update) => {
        // Update investigation context
        if (update.title || update.description || update.key_findings || update.red_flags || update.next_steps) {
          onUpdateContext({
            ...context,
            topic: update.title || context.topic,
            domain: update.description || context.domain,
            key_findings: update.key_findings,
            red_flags: update.red_flags,
            next_steps: update.next_steps,
          });
        }
      },
    };
    
    // Start streaming - streamOrchestrate returns abort function directly
    const abort = streamOrchestrate(query, streamContext, callbacks);
    abortRef.current = abort;
  }, [inputValue, isProcessing, context, network, dispatch, convertEntity, convertRelationship, addOrMergeEntity, addOrMergeRelationship, onUpdateContext, onToggleSuggestionQueue, setIsProcessing]);
  
  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);
  
  // Handle quick action
  const handleQuickAction = useCallback((query: string) => {
    setInputValue(query);
    textareaRef.current?.focus();
  }, []);
  
  // Clear chat (also clears localStorage)
  const handleClear = useCallback(() => {
    const newMessages = [{
      id: 'welcome-new',
      role: 'assistant',
      content: "Chat cleared. How can I help with your investigation?",
      timestamp: new Date().toISOString(),
    }];
    setMessages(newMessages);
    // Update localStorage immediately
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMessages));
    } catch (e) {
      console.warn('Failed to clear chat history in localStorage:', e);
    }
  }, [storageKey]);
  
  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    } else {
      // Default: use the action or message as input
      const query = suggestion.action || suggestion.text || suggestion.message || '';
      if (query) {
        setInputValue(query);
        textareaRef.current?.focus();
      }
    }
  }, [onSuggestionClick]);
  
  const hasContext = context.topic || context.domain || context.focus || context.keyQuestions.length > 0;
  
  if (!isOpen) return null;
  
  return (
    <div className="h-full flex flex-col bg-background border-l border-border w-[420px] lg:w-[480px]">
      {/* Header */}
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
      
      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} disabled={isProcessing} />
      
      {/* Investigation Context (collapsible with editor) */}
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
                            onClick={() => handleActionClick(actionQuery)}
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
      
      {/* Events Stream (collapsible) */}
      {events.length > 0 && (
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
                    onActionClick={handleActionClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Research History (collapsible) */}
      {researchHistory.length > 0 && (
        <div className="border-b border-border shrink-0">
          <button
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-muted/30"
            onClick={() => setShowResearchHistory(!showResearchHistory)}
          >
            <div className="flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs font-medium">Research History ({researchHistory.length})</span>
            </div>
            {showResearchHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {showResearchHistory && (
            <div className="px-4 pb-3 max-h-40 overflow-y-auto">
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
      
      {/* Suggestions Panel */}
      {suggestions.length > 0 && (
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
                onClick={() => handleSuggestionClick(suggestion)}
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
      
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="p-4">
            {messages.map(message => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            {isProcessing && (
              <div className="flex justify-start mb-3">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Researching...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-border p-3 shrink-0 bg-muted/20">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to research someone, find connections, analyze patterns..."
            className="min-h-[44px] max-h-32 text-sm resize-none"
            rows={1}
            disabled={isProcessing}
          />
          <Button 
            size="sm" 
            className="h-[44px] w-[44px] p-0 shrink-0"
            onClick={handleSend}
            disabled={!inputValue.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </span>
          {messages.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-[10px] px-1.5"
              onClick={handleClear}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
