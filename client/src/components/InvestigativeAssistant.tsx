/**
 * Silent Partners - Investigative Assistant Panel
 * 
 * The primary AI interface for conducting investigations.
 * A conversational assistant with full access to research tools,
 * graph manipulation, and investigation memory.
 * 
 * v8.2: Enhanced from NarrativePanel with better UX
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Brain, ChevronDown, ChevronUp, Send, Trash2,
  Lightbulb, AlertCircle, Loader2, MessageSquare,
  Target, Sparkles, X, Search, FileText,
  CheckCircle, Clock, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { streamOrchestrate, OrchestratorCallbacks, InvestigationContext as StreamContext, PipelineEntity, PipelineRelationship } from '@/lib/streaming-api';
import { generateId, Entity, Relationship } from '@/lib/store';
import claimsApi, { Claim } from '@/lib/claims-api';

// Message types for the chat
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    entitiesFound?: number;
    relationshipsFound?: number;
    claimsCreated?: number;
    toolsUsed?: string[];
  };
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
}

// Format timestamp for display
function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Chat message component
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${
        isUser 
          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
          : isSystem
            ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg'
            : 'bg-muted rounded-2xl rounded-bl-md'
      } px-4 py-2.5`}>
        {!isUser && !isSystem && (
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">Assistant</span>
          </div>
        )}
        <p className={`text-sm whitespace-pre-wrap ${isUser ? '' : 'text-foreground'}`}>
          {message.content}
        </p>
        <div className="flex items-center justify-between mt-1.5">
          <span className={`text-[10px] ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {formatTime(message.timestamp)}
          </span>
          {message.metadata && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {message.metadata.entitiesFound !== undefined && (
                <span>+{message.metadata.entitiesFound} entities</span>
              )}
              {message.metadata.relationshipsFound !== undefined && (
                <span>+{message.metadata.relationshipsFound} connections</span>
              )}
              {message.metadata.claimsCreated !== undefined && message.metadata.claimsCreated > 0 && (
                <span className="text-amber-600">+{message.metadata.claimsCreated} pending</span>
              )}
            </div>
          )}
        </div>
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

export default function InvestigativeAssistant({
  isOpen,
  onToggle,
  context,
  onUpdateContext,
  pendingClaimsCount,
  onToggleSuggestionQueue,
  isProcessing,
  setIsProcessing,
}: InvestigativeAssistantProps) {
  const { network, addOrMergeEntity, addOrMergeRelationship, dispatch } = useNetwork();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showContext, setShowContext] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }
    };
  }, []);
  
  // Add a welcome message on first open
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
    // Focus textarea
    textareaRef.current?.focus();
  }, []);
  
  // Clear chat
  const handleClear = useCallback(() => {
    setMessages([{
      id: 'welcome-new',
      role: 'assistant',
      content: "Chat cleared. How can I help with your investigation?",
      timestamp: new Date().toISOString(),
    }]);
  }, []);
  
  if (!isOpen) return null;
  
  return (
    <div className="h-full flex flex-col bg-background border-l border-border w-96">
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
      
      {/* Investigation Context (collapsible) */}
      {(context.topic || context.key_findings?.length || context.red_flags?.length) && (
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
            <div className="px-4 pb-3 space-y-2 text-xs">
              {context.topic && (
                <div>
                  <span className="text-muted-foreground">Topic: </span>
                  <span className="font-medium">{context.topic}</span>
                </div>
              )}
              {context.key_findings && context.key_findings.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Key Findings:</span>
                  <ul className="mt-1 space-y-0.5 pl-3">
                    {context.key_findings.slice(0, 3).map((finding, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {context.red_flags && context.red_flags.length > 0 && (
                <div>
                  <span className="text-red-500 font-medium">Red Flags:</span>
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
            </div>
          )}
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
