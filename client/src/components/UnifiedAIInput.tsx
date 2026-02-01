/**
 * Silent Partners - Unified AI Input Component
 * 
 * A single intelligent input box that handles all AI operations.
 * The Orchestrator determines intent and coordinates the appropriate functions.
 * 
 * Features:
 * - Entity autocomplete with / syntax
 * - Natural language understanding
 * - Context-aware suggestions
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Send } from 'lucide-react';
import { toast } from 'sonner';
import { streamOrchestrate, OrchestratorCallbacks, InvestigationContext, PipelineEntity, PipelineRelationship } from '@/lib/streaming-api';
import { generateId, Entity, Relationship } from '@/lib/store';
import { NarrativeEvent } from './NarrativePanel';

interface UnifiedAIInputProps {
  onNarrativeEvent?: (event: Omit<NarrativeEvent, 'id' | 'timestamp'>) => void;
  clearFirst?: boolean;
  investigationContext?: {
    topic?: string;
    domain?: string;
    focus?: string;
    key_questions?: string[];
  };
  graphId?: number;  // NEW: For research memory
  onSuggestions?: (suggestions: Array<{ type: string; message: string; action?: string }>) => void;
  onResearchHistory?: (item: { query: string; source: string }) => void;
  initialQuery?: string;  // Pre-populate input from templates
  onContextUpdate?: (context: {
    title?: string;
    description?: string;
    key_findings?: string[];
    red_flags?: Array<{description: string; severity: string; entities_involved?: string[]}>;
    next_steps?: Array<{suggestion: string; reasoning: string; priority?: string; action_query: string}>;
  }) => void;
}

export default function UnifiedAIInput({ onNarrativeEvent, clearFirst = false, investigationContext, graphId, onSuggestions, onResearchHistory, initialQuery, onContextUpdate }: UnifiedAIInputProps) {
  const { network, addEntity, addOrMergeEntity, addRelationship, addOrMergeRelationship, clearNetwork, dispatch, deduplicateNetwork } = useNetwork();
  const [input, setInput] = useState(initialQuery || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ step: number; total: number; goal: string; startTime: number; entitiesFound?: number; relationshipsFound?: number } | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<Entity[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  
  // Track entity ID mapping for this session
  const entityIdMap = useRef<Map<string, string>>(new Map());

  // Track all entities added during this session (for relationship resolution)
  const sessionEntities = useRef<Map<string, Entity>>(new Map());

  // Buffer for relationships that couldn't be resolved immediately
  const pendingRelationships = useRef<PipelineRelationship[]>([]);
  
  // Cleanup abort controller on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current();
        abortRef.current = null;
      }
    };
  }, []);
  
  // Update input when initialQuery prop changes (e.g., from template selection)
  useEffect(() => {
    if (initialQuery) {
      setInput(initialQuery);
    }
  }, [initialQuery]);
  
  // Handle input change and check for / trigger
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const position = e.target.selectionStart || 0;
    setInput(value);
    setCursorPosition(position);
    
    // Check if we should show autocomplete
    const textBeforeCursor = value.slice(0, position);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    
    if (lastSlashIndex !== -1) {
      const searchText = textBeforeCursor.slice(lastSlashIndex + 1).toLowerCase();
      // Check if there's no space between / and cursor (still typing entity name)
      if (!searchText.includes(' ') && !searchText.includes('\n')) {
        const matches = network.entities.filter(e => 
          e.name.toLowerCase().includes(searchText) ||
          searchText === ''
        ).slice(0, 5);
        
        if (matches.length > 0) {
          setAutocompleteResults(matches);
          setShowAutocomplete(true);
          setAutocompleteIndex(0);
          return;
        }
      }
    }
    
    setShowAutocomplete(false);
  }, [network.entities]);
  
  // Handle autocomplete selection
  const selectAutocomplete = useCallback((entity: Entity) => {
    const textBeforeCursor = input.slice(0, cursorPosition);
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');
    const textAfterCursor = input.slice(cursorPosition);
    
    // Replace /partial with /EntityName
    const newText = input.slice(0, lastSlashIndex) + '/' + entity.name + textAfterCursor;
    setInput(newText);
    setShowAutocomplete(false);
    
    // Focus back on input
    inputRef.current?.focus();
  }, [input, cursorPosition]);
  
  // Handle keyboard navigation in autocomplete
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setAutocompleteIndex(i => Math.min(i + 1, autocompleteResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setAutocompleteIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectAutocomplete(autocompleteResults[autocompleteIndex]);
      } else if (e.key === 'Escape') {
        setShowAutocomplete(false);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [showAutocomplete, autocompleteResults, autocompleteIndex, selectAutocomplete]);
  
  // Convert pipeline entity to our Entity format
  const convertEntity = useCallback((pipelineEntity: PipelineEntity): Entity => {
    const id = generateId();
    entityIdMap.current.set(pipelineEntity.id || pipelineEntity.name, id);
    // Also map by lowercase name for case-insensitive lookup
    entityIdMap.current.set(pipelineEntity.name.toLowerCase(), id);

    const entity: Entity = {
      id,
      name: pipelineEntity.name,
      type: (pipelineEntity.type as Entity['type']) || 'unknown',
      description: pipelineEntity.description,
      importance: pipelineEntity.importance || 5,
      source_type: 'web', // Entities from streaming orchestrator come from web research
      created_at: new Date().toISOString(),
    };

    // Track in session entities for relationship resolution
    sessionEntities.current.set(id, entity);
    sessionEntities.current.set(pipelineEntity.name.toLowerCase(), entity);

    return entity;
  }, []);
  
  // Find entity ID from various sources (session, entity map, or existing network)
  const findEntityId = useCallback((nameOrId: string): string | undefined => {
    // First check the entity ID map (most reliable for current session)
    const fromMap = entityIdMap.current.get(nameOrId) ||
                    entityIdMap.current.get(nameOrId.toLowerCase());
    if (fromMap) return fromMap;

    // Then check session entities
    const fromSession = sessionEntities.current.get(nameOrId.toLowerCase());
    if (fromSession) return fromSession.id;

    // Finally fall back to existing network entities
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

  // Process any pending relationships that couldn't be resolved earlier
  const processPendingRelationships = useCallback(() => {
    const stillPending: PipelineRelationship[] = [];

    for (const pipelineRel of pendingRelationships.current) {
      const converted = convertRelationship(pipelineRel);
      if (converted) {
        addRelationship(converted);
      } else {
        stillPending.push(pipelineRel);
      }
    }

    pendingRelationships.current = stillPending;
  }, [convertRelationship, addRelationship]);
  
  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    entityIdMap.current.clear();
    sessionEntities.current.clear();
    pendingRelationships.current = [];
    
    // Clear network if requested
    if (clearFirst) {
      clearNetwork();
    }
    
    // Build context for orchestrator
    const context: InvestigationContext = {
      topic: investigationContext?.topic || '',
      domain: investigationContext?.domain || '',
      focus: investigationContext?.focus || '',
      key_questions: investigationContext?.key_questions || [],
      entities: network.entities.map(e => ({ id: e.id, name: e.name, type: e.type })),
      relationships: network.relationships.map(r => ({ source: r.source, target: r.target, type: r.type || 'related' })),
      graph_id: graphId,  // NEW: For research memory
    };
    
    // Create callbacks
    const callbacks: OrchestratorCallbacks = {
      onStart: (query, referencedEntities) => {
        // Auto-populate title if network is untitled and empty
        if (network.title === 'Untitled Network' && network.entities.length === 0) {
          // Generate a title from the query (first 50 chars, capitalized)
          const autoTitle = query.length > 50 ? query.slice(0, 47) + '...' : query;
          dispatch({ type: 'UPDATE_NETWORK', payload: { title: autoTitle } });
        }
        
        onNarrativeEvent?.({
          type: 'extraction',
          title: 'Starting Investigation',
          content: `Processing: "${query}"${referencedEntities.length > 0 ? ` (Referenced: ${referencedEntities.join(', ')})` : ''}`,
        });
        toast.info('AI is working...', { id: 'orchestrator-progress' });
      },
      
      onThinking: (message, reasoning) => {
        onNarrativeEvent?.({
          type: 'reasoning',
          title: 'AI Thinking',
          content: message,
          reasoning: reasoning || undefined,
        });
        toast.loading(message, { id: 'orchestrator-progress' });
      },
      
      onIntentClassified: (intentType, confidence, message, reasoning) => {
        onNarrativeEvent?.({
          type: 'reasoning',
          title: 'Intent Classified',
          content: message,
          reasoning: reasoning || `Detected ${intentType} intent with ${(confidence * 100).toFixed(0)}% confidence`,
        });
      },
      
      onPlanCreated: (steps, plan, reasoning) => {
        const planDetails = plan.map(s => `${s.step}. ${s.goal}`).join('\n');
        onNarrativeEvent?.({
          type: 'reasoning',
          title: 'Research Plan Created',
          content: `Created ${steps}-step research plan`,
          reasoning: reasoning ? `${reasoning}\n\nSteps:\n${planDetails}` : `Steps:\n${planDetails}`,
        });
      },
      
      onStepStarted: (step, total, goal) => {
        setProgress({ step, total, goal, startTime: Date.now() });
        onNarrativeEvent?.({
          type: 'extraction',
          title: `Step ${step}/${total}`,
          content: goal,
        });
        toast.loading(`Step ${step}/${total}: ${goal}`, { id: 'orchestrator-progress' });
      },
      
      onSearching: (message) => {
        onNarrativeEvent?.({
          type: 'extraction',
          title: 'Searching',
          content: message,
        });
      },
      
      onEntityFound: (entity, isNew) => {
        if (isNew) {
          const converted = convertEntity(entity);
          // Use addOrMergeEntity to prevent duplicates
          addOrMergeEntity(converted);
          // Update progress with entity count
          setProgress(prev => prev ? { ...prev, entitiesFound: (prev.entitiesFound || 0) + 1 } : null);
          onNarrativeEvent?.({
            type: 'extraction',
            title: 'Entity Found',
            content: `${entity.name} (${entity.type})`,
          });
          // Try to resolve any pending relationships now that we have a new entity
          processPendingRelationships();
        }
      },

      onRelationshipFound: (relationship, isNew) => {
        if (isNew) {
          const converted = convertRelationship(relationship);
          if (converted) {
            // Use addOrMergeRelationship to prevent duplicate relationships
            addOrMergeRelationship(converted);
            // Update progress with relationship count
            setProgress(prev => prev ? { ...prev, relationshipsFound: (prev.relationshipsFound || 0) + 1 } : null);
            // Show visual feedback for relationship discovery
            onNarrativeEvent?.({
              type: 'discovery',
              title: 'Connection Found',
              content: `${relationship.source_name || relationship.source} → ${relationship.label || relationship.type} → ${relationship.target_name || relationship.target}`,
            });
          } else {
            // Buffer the relationship to try again later when entities arrive
            pendingRelationships.current.push(relationship);
          }
        }
      },
      
      onFactFound: (entityName, fact) => {
        onNarrativeEvent?.({
          type: 'extraction',
          title: 'Fact Found',
          content: `${entityName}: ${fact.label} = ${fact.value}`,
        });
      },
      
      onComplete: (entities, relationships, message) => {
        // Process any remaining pending relationships before completing
        processPendingRelationships();

        setIsProcessing(false);
        setProgress(null);  // Clear progress
        abortRef.current = null;  // Clear abort ref

        // Clear the loading toast and show success
        toast.dismiss('orchestrator-progress');
        
        // Show a prominent completion message
        const completionMessage = entities.length > 0 || relationships.length > 0
          ? `✅ Done! Found ${entities.length} entities and ${relationships.length} connections`
          : '✅ Investigation complete';
        
        toast.success(completionMessage, {
          duration: 5000,
          style: {
            background: '#10B981',
            color: 'white',
            fontWeight: 'bold',
          },
        });
        
        onNarrativeEvent?.({
          type: 'extraction',
          title: '✅ Investigation Complete',
          content: `Found ${entities.length} entities and ${relationships.length} connections. ${message}`,
        });
        
        setInput('');
      },
      
      onError: (message, recoverable) => {
        // Always reset processing state on error
        setIsProcessing(false);
        setProgress(null);  // Clear progress
        abortRef.current = null;  // Clear abort ref
        toast.error(message, { id: 'orchestrator-progress' });
        onNarrativeEvent?.({
          type: 'error',
          title: recoverable ? 'Warning' : 'Error',
          content: message,
        });
      },
      
      onWarning: (message) => {
        onNarrativeEvent?.({
          type: 'info',
          title: 'Warning',
          content: message,
        });
      },
      
      // NEW v2.0 callbacks
      onSuggestions: (suggestions) => {
        onSuggestions?.(suggestions);
        if (suggestions.length > 0) {
          onNarrativeEvent?.({
            type: 'suggestion',
            title: 'AI Suggestions',
            content: suggestions.map(s => `${s.type}: ${s.message}`).join('\n'),
          });
        }
      },
      
      onResearchCached: (query, message) => {
        onNarrativeEvent?.({
          type: 'info',
          title: 'Using Cached Research',
          content: message,
        });
        onResearchHistory?.({ query, source: 'cache' });
      },
      
      onSanctionsAlert: (entity, sanctionType, details) => {
        // Show prominent toast for sanctions alerts
        toast.warning(`⚠️ SANCTIONS ALERT: ${entity}`, {
          description: details || 'This entity may be subject to international sanctions',
          duration: 10000,  // Keep visible longer
        });
        onNarrativeEvent?.({
          type: 'error',
          title: `⚠️ Sanctions Alert: ${entity}`,
          content: `${sanctionType}: ${details || 'This entity may be subject to international sanctions. Please verify before proceeding.'}`,
        });
      },
      
      onGraphAnalysis: (analysis) => {
        onNarrativeEvent?.({
          type: 'reasoning',
          title: 'Graph Analysis',
          content: `${analysis.entity_count} entities, ${analysis.relationship_count} relationships`,
          reasoning: analysis.central_nodes.length > 0 
            ? `Central nodes: ${analysis.central_nodes.join(', ')}` 
            : undefined,
        });
      },
      
      // Context management callback
      onContextUpdate: (context) => {
        // Pass context updates to parent component
        onContextUpdate?.(context);
        
        // Update network title if provided
        if (context.title) {
          dispatch({ type: 'UPDATE_NETWORK', payload: { title: context.title } });
        }
        
        // Log context updates as narrative events
        if (context.update_type === 'set_investigation_title' && context.title) {
          onNarrativeEvent?.({
            type: 'context_update',
            title: 'Investigation Title Set',
            content: context.title,
          });
        } else if (context.update_type === 'update_investigation_summary' && context.description) {
          onNarrativeEvent?.({
            type: 'context_update',
            title: 'Summary Updated',
            content: context.description,
          });
        } else if (context.update_type === 'suggest_next_step' && context.next_steps?.length) {
          const latestStep = context.next_steps[context.next_steps.length - 1];
          const stepText = typeof latestStep === 'string' ? latestStep : latestStep.suggestion;
          onNarrativeEvent?.({
            type: 'suggestion',
            title: 'Next Step Suggested',
            content: stepText,
          });
        } else if (context.update_type === 'add_finding' && context.key_findings?.length) {
          onNarrativeEvent?.({
            type: 'discovery',
            title: 'Key Finding',
            content: context.key_findings[context.key_findings.length - 1],
          });
        } else if (context.update_type === 'add_red_flag' && context.red_flags?.length) {
          const latestFlag = context.red_flags[context.red_flags.length - 1];
          onNarrativeEvent?.({
            type: 'error',
            title: `⚠️ Red Flag (${latestFlag.severity})`,
            content: latestFlag.description,
          });
        }
      },
    };
    
    // Start orchestration
    abortRef.current = streamOrchestrate(input, context, callbacks);
  }, [input, isProcessing, clearFirst, clearNetwork, investigationContext, network, onNarrativeEvent, convertEntity, convertRelationship, addEntity, addRelationship, dispatch, processPendingRelationships, onContextUpdate]);
  
  // Cancel handler
  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setIsProcessing(false);
      toast.info('Cancelled');
    }
  }, []);
  
  return (
    <div className="relative space-y-2">
      {/* Progress indicator - floating at top, doesn't push content */}
      {progress && (
        <div className="bg-primary/10 rounded-lg px-3 py-1.5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin text-primary flex-shrink-0" />
            <span className="text-xs text-primary truncate flex-1">{progress.goal}</span>
            <span className="text-xs text-primary/70 flex-shrink-0">{progress.step}/{progress.total}</span>
          </div>
          {(progress.entitiesFound || progress.relationshipsFound) && (
            <div className="flex items-center gap-3 mt-1 text-xs text-primary/60">
              {progress.entitiesFound ? <span>• {progress.entitiesFound} entities</span> : null}
              {progress.relationshipsFound ? <span>• {progress.relationshipsFound} connections</span> : null}
            </div>
          )}
        </div>
      )}
      
      {/* Main input */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[80px] p-3 pr-10 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Ask anything... Type / to reference entities from your graph"
          disabled={isProcessing}
        />
        
        {/* Sparkle icon */}
        <Sparkles className="absolute top-3 right-3 w-4 h-4 text-muted-foreground" />
        
        {/* Autocomplete dropdown */}
        {showAutocomplete && autocompleteResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
            {autocompleteResults.map((entity, index) => (
              <button
                key={entity.id}
                onClick={() => selectAutocomplete(entity)}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                  index === autocompleteIndex ? 'bg-accent' : 'hover:bg-accent/50'
                }`}
              >
                <span className="text-xs text-muted-foreground uppercase">{entity.type}</span>
                <span className="font-medium">{entity.name}</span>
              </button>
            ))}
            <div className="px-3 py-1.5 text-xs text-muted-foreground border-t border-border bg-muted/50">
              ↑↓ to navigate, Enter to select, Esc to close
            </div>
          </div>
        )}
      </div>
      
      {/* Submit button */}
      <Button
        onClick={isProcessing ? handleCancel : handleSubmit}
        disabled={!input.trim() && !isProcessing}
        className="w-full"
        variant={isProcessing ? "destructive" : "default"}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Cancel
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Send to AI
          </>
        )}
      </Button>
      
      {/* Help text */}
      <p className="text-xs text-muted-foreground text-center">
        Type <code className="px-1 py-0.5 bg-muted rounded">/</code> to reference entities • Shift+Enter for new line
      </p>
    </div>
  );
}
