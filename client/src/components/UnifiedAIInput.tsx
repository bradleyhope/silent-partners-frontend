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
}

export default function UnifiedAIInput({ onNarrativeEvent, clearFirst = false, investigationContext, graphId, onSuggestions, onResearchHistory }: UnifiedAIInputProps) {
  const { network, addEntity, addRelationship, clearNetwork, dispatch } = useNetwork();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<Entity[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  
  // Track entity ID mapping for this session
  const entityIdMap = useRef<Map<string, string>>(new Map());
  
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
    return {
      id,
      name: pipelineEntity.name,
      type: (pipelineEntity.type as Entity['type']) || 'unknown',
      description: pipelineEntity.description,
      importance: pipelineEntity.importance || 5,
    };
  }, []);
  
  // Convert pipeline relationship to our Relationship format
  const convertRelationship = useCallback((pipelineRel: PipelineRelationship): Relationship | null => {
    const sourceId = entityIdMap.current.get(pipelineRel.source) || 
                     network.entities.find(e => e.name.toLowerCase() === pipelineRel.source.toLowerCase())?.id;
    const targetId = entityIdMap.current.get(pipelineRel.target) ||
                     network.entities.find(e => e.name.toLowerCase() === pipelineRel.target.toLowerCase())?.id;
    
    if (!sourceId || !targetId) return null;
    
    return {
      id: generateId(),
      source: sourceId,
      target: targetId,
      type: pipelineRel.type || 'related_to',
      label: pipelineRel.label || pipelineRel.type,
    };
  }, [network.entities]);
  
  // Handle submit
  const handleSubmit = useCallback(() => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    entityIdMap.current.clear();
    
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
      relationships: network.relationships.map(r => ({ source: r.source, target: r.target, type: r.type })),
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
          addEntity(converted);
          onNarrativeEvent?.({
            type: 'extraction',
            title: 'Entity Found',
            content: `${entity.name} (${entity.type})`,
          });
        }
      },
      
      onRelationshipFound: (relationship, isNew) => {
        if (isNew) {
          const converted = convertRelationship(relationship);
          if (converted) {
            addRelationship(converted);
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
        setIsProcessing(false);
        abortRef.current = null;  // Clear abort ref
        onNarrativeEvent?.({
          type: 'extraction',
          title: 'Investigation Complete',
          content: `Found ${entities.length} entities and ${relationships.length} connections`,
        });
        toast.success(message, { id: 'orchestrator-progress' });
        setInput('');
      },
      
      onError: (message, recoverable) => {
        // Always reset processing state on error
        setIsProcessing(false);
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
    };
    
    // Start orchestration
    abortRef.current = streamOrchestrate(input, context, callbacks);
  }, [input, isProcessing, clearFirst, clearNetwork, investigationContext, network, onNarrativeEvent, convertEntity, convertRelationship, addEntity, addRelationship, dispatch]);
  
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
      {/* Main input */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[100px] p-3 pr-10 text-sm bg-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
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
