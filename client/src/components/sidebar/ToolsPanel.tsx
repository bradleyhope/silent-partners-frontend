/**
 * Silent Partners - Tools Panel
 *
 * Graph manipulation tools: remove orphans, find links, enrich, custom prompts.
 * 
 * v9.0: AI actions now route through orchestrator for unified handling
 */

import { useState, useCallback, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, Loader2, Trash2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNetwork } from '@/contexts/NetworkContext';
import { useOrchestrator } from '@/contexts/OrchestratorContext';

interface ToolsPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ToolsPanel({ isOpen, onOpenChange }: ToolsPanelProps) {
  const { network, dispatch } = useNetwork();
  const { sendAction, isProcessing: orchestratorProcessing } = useOrchestrator();

  const [isRemovingOrphans, setIsRemovingOrphans] = useState(false);
  const [toolPrompt, setToolPrompt] = useState('');

  // Count orphan nodes
  const orphanCount = useMemo(() => {
    const connectedIds = new Set<string>();
    network.relationships.forEach((r) => {
      connectedIds.add(r.source);
      connectedIds.add(r.target);
    });
    return network.entities.filter((e) => !connectedIds.has(e.id)).length;
  }, [network.entities, network.relationships]);

  // Tool: Remove orphan nodes (entities with no connections) - LOCAL, no AI
  const handleRemoveOrphans = useCallback(() => {
    const connectedIds = new Set<string>();
    network.relationships.forEach((r) => {
      connectedIds.add(r.source);
      connectedIds.add(r.target);
    });

    const orphans = network.entities.filter((e) => !connectedIds.has(e.id));

    if (orphans.length === 0) {
      toast.info('No orphan nodes found - all entities are connected');
      return;
    }

    setIsRemovingOrphans(true);
    orphans.forEach((orphan) => {
      dispatch({ type: 'DELETE_ENTITY', payload: orphan.id });
    });
    setIsRemovingOrphans(false);
    toast.success(`Removed ${orphans.length} orphan node${orphans.length > 1 ? 's' : ''}`);
  }, [network.entities, network.relationships, dispatch]);

  // Tool: Find missing links - NOW ROUTES THROUGH ORCHESTRATOR
  const handleFindMissingLinks = useCallback(() => {
    if (network.entities.length < 2) {
      toast.error('Need at least 2 entities to find missing links');
      return;
    }

    sendAction('find_links', {});
    
    toast.info('Finding missing connections...', {
      description: 'Check the Assistant panel for progress'
    });
  }, [network.entities.length, sendAction]);

  // Tool: Enrich all entities - NOW ROUTES THROUGH ORCHESTRATOR
  const handleEnrichAll = useCallback(() => {
    if (network.entities.length === 0) {
      toast.error('No entities to enrich');
      return;
    }

    // Build list of entities to enrich
    const entityList = network.entities
      .slice(0, 15)
      .map((e) => `${e.name} (${e.type})`)
      .join(', ');

    sendAction('chat', {
      message: `Please research and enrich these entities with more details and find connections between them: ${entityList}. For each entity, find their background, key facts, and any relationships to other entities in the graph.`
    });
    
    toast.info('Enriching entities...', {
      description: 'Check the Assistant panel for progress'
    });
  }, [network.entities, sendAction]);

  // Tool: Custom prompt - NOW ROUTES THROUGH ORCHESTRATOR
  const handleToolPrompt = useCallback(() => {
    if (!toolPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    sendAction('chat', {
      message: toolPrompt.trim()
    });
    
    setToolPrompt('');
    toast.info('Processing your request...', {
      description: 'Check the Assistant panel for progress'
    });
  }, [toolPrompt, sendAction]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto font-medium text-xs"
        >
          <span className="flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5" />
            AI TOOLS
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 space-y-3">
        {/* Remove Orphans - Local action */}
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={handleRemoveOrphans}
            disabled={isRemovingOrphans || orphanCount === 0}
          >
            {isRemovingOrphans ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 mr-2" />
            )}
            Remove Orphan Nodes
            {orphanCount > 0 && (
              <span className="ml-auto text-muted-foreground">({orphanCount})</span>
            )}
          </Button>
          <p className="text-[10px] text-muted-foreground pl-1">
            Delete entities with no connections
          </p>
        </div>

        {/* Find Missing Links - Routes through orchestrator */}
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={handleFindMissingLinks}
            disabled={orchestratorProcessing || network.entities.length < 2}
          >
            {orchestratorProcessing ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
            )}
            Find Missing Links
          </Button>
          <p className="text-[10px] text-muted-foreground pl-1">
            AI discovers hidden connections between entities
          </p>
        </div>

        {/* Enrich All - Routes through orchestrator */}
        <div className="space-y-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs h-8"
            onClick={handleEnrichAll}
            disabled={orchestratorProcessing || network.entities.length === 0}
          >
            {orchestratorProcessing ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 mr-2" />
            )}
            Enrich All Entities
          </Button>
          <p className="text-[10px] text-muted-foreground pl-1">
            Research and add details to all entities
          </p>
        </div>

        {/* Custom Prompt - Routes through orchestrator */}
        <div className="space-y-2">
          <label className="text-xs font-medium">Custom AI Request</label>
          <Textarea
            value={toolPrompt}
            onChange={(e) => setToolPrompt(e.target.value)}
            placeholder="Ask AI to modify the graph..."
            className="min-h-[60px] text-xs"
          />
          <Button
            variant="default"
            size="sm"
            className="w-full text-xs h-8"
            onClick={handleToolPrompt}
            disabled={orchestratorProcessing || !toolPrompt.trim()}
          >
            {orchestratorProcessing ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 mr-2" />
            )}
            Run AI Request
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
