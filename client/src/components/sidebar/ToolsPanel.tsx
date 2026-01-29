/**
 * Silent Partners - Tools Panel
 *
 * Graph manipulation tools: remove orphans, find links, enrich, custom prompts.
 */

import { useState, useCallback, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChevronDown, Loader2, Trash2, RefreshCw, Sparkles, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNetwork } from '@/contexts/NetworkContext';
import api from '@/lib/api';
import { generateId, Entity, Relationship } from '@/lib/store';

interface ToolsPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ToolsPanel({ isOpen, onOpenChange }: ToolsPanelProps) {
  const { network, dispatch, addEntitiesAndRelationships } = useNetwork();

  const [isRemovingOrphans, setIsRemovingOrphans] = useState(false);
  const [isFindingLinks, setIsFindingLinks] = useState(false);
  const [isEnrichingAll, setIsEnrichingAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  // Tool: Remove orphan nodes (entities with no connections)
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

  // Tool: Find missing links using AI
  const handleFindMissingLinks = useCallback(async () => {
    if (network.entities.length < 2) {
      toast.error('Need at least 2 entities to find missing links');
      return;
    }

    setIsFindingLinks(true);
    toast.info('Aggressively searching for missing connections (this may take 20-30 seconds)...', {
      duration: 30000,
    });

    try {
      // Build entity name to ID mapping for later
      const entityNameToId = new Map(network.entities.map((e) => [e.name.toLowerCase(), e.id]));

      const result = await api.infer(
        network.entities.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          description: e.description || '',
        })),
        network.relationships.map((r) => ({
          source: r.source,
          target: r.target,
          type: r.type,
        }))
      );

      const newRelationships: Relationship[] = [];

      if (result.inferred_relationships && result.inferred_relationships.length > 0) {
        // Lower confidence threshold to 0.3 for more aggressive finding
        const validRelationships = result.inferred_relationships.filter((ir) => ir.confidence >= 0.3);

        for (const ir of validRelationships) {
          // Try to match source/target by ID first, then by name
          let sourceId = ir.source;
          let targetId = ir.target;

          // If source/target are names, convert to IDs
          if (!network.entities.some((e) => e.id === sourceId)) {
            sourceId = entityNameToId.get(ir.source.toLowerCase()) || '';
          }
          if (!network.entities.some((e) => e.id === targetId)) {
            targetId = entityNameToId.get(ir.target.toLowerCase()) || '';
          }

          if (sourceId && targetId && sourceId !== targetId) {
            // Check if relationship already exists (in either direction)
            const exists = network.relationships.some(
              (r) =>
                (r.source === sourceId && r.target === targetId) ||
                (r.source === targetId && r.target === sourceId)
            );

            if (!exists) {
              // Also check if we already added this relationship
              const alreadyAdded = newRelationships.some(
                (r) =>
                  (r.source === sourceId && r.target === targetId) ||
                  (r.source === targetId && r.target === sourceId)
              );

              if (!alreadyAdded) {
                newRelationships.push({
                  id: generateId(),
                  source: sourceId,
                  target: targetId,
                  type: ir.type || 'connected_to',
                  label: ir.description || ir.type || 'inferred connection',
                });
              }
            }
          }
        }
      }

      if (newRelationships.length > 0) {
        addEntitiesAndRelationships([], newRelationships);

        // Show detailed success message
        const webSearchUsed = result.metadata?.web_search_used ? ' (with web search)' : '';
        toast.success(
          `Found ${newRelationships.length} missing connection${newRelationships.length > 1 ? 's' : ''}${webSearchUsed}!`,
          { duration: 5000 }
        );

        // Show analysis summary if available
        if (result.analysis) {
          const improvement = result.analysis.network_density_improvement;
          if (improvement) {
            setTimeout(() => {
              toast.info(`Network density improved by ${improvement}`, { duration: 4000 });
            }, 1000);
          }
        }
      } else {
        toast.info('No additional connections found. The network may already be well-connected.');
      }
    } catch (error) {
      console.error('Find links error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to find missing links');
    } finally {
      setIsFindingLinks(false);
    }
  }, [network.entities, network.relationships, addEntitiesAndRelationships]);

  // Tool: Enrich all entities using /api/extract
  const handleEnrichAll = useCallback(async () => {
    if (network.entities.length === 0) {
      toast.error('No entities to enrich');
      return;
    }

    setIsEnrichingAll(true);
    toast.info(`Enriching entities with AI...`);

    try {
      // Build a prompt that asks AI to find more details about existing entities
      const entityList = network.entities
        .slice(0, 15)
        .map((e) => `${e.name} (${e.type})`)
        .join(', ');
      const prompt =
        `Research and provide detailed information about these entities and their connections: ${entityList}. ` +
        `For each entity, provide: description, key facts, and any known relationships between them. ` +
        `Focus on financial connections, business relationships, and organizational ties.`;

      const result = await api.extract(prompt, 'gpt-5');

      if (!result.entities || result.entities.length === 0) {
        toast.info('No additional information found');
        return;
      }

      // Update existing entities with new descriptions
      let enrichedCount = 0;
      const newEntities: Entity[] = [];
      const newRelationships: Relationship[] = [];
      const existingNames = new Set(network.entities.map((e) => e.name.toLowerCase()));

      for (const apiEntity of result.entities) {
        const existingEntity = network.entities.find(
          (e) => e.name.toLowerCase() === apiEntity.name.toLowerCase()
        );

        if (existingEntity && apiEntity.description) {
          // Update existing entity
          dispatch({
            type: 'UPDATE_ENTITY',
            payload: { id: existingEntity.id, updates: { description: apiEntity.description } },
          });
          enrichedCount++;
        } else if (!existingNames.has(apiEntity.name.toLowerCase())) {
          // Add new entity
          newEntities.push({
            id: generateId(),
            name: apiEntity.name,
            type: (apiEntity.type?.toLowerCase() || 'person') as Entity['type'],
            description: apiEntity.description,
            importance: apiEntity.importance || 5,
          });
          existingNames.add(apiEntity.name.toLowerCase());
        }
      }

      // Add new relationships
      const allEntities = [...network.entities, ...newEntities];
      const entityNameToId = new Map(allEntities.map((e) => [e.name.toLowerCase(), e.id]));

      for (const rel of result.relationships || []) {
        const sourceId = entityNameToId.get(rel.source.toLowerCase());
        const targetId = entityNameToId.get(rel.target.toLowerCase());

        if (sourceId && targetId) {
          // Check if relationship already exists
          const exists = network.relationships.some(
            (r) =>
              (r.source === sourceId && r.target === targetId) ||
              (r.source === targetId && r.target === sourceId)
          );

          if (!exists) {
            newRelationships.push({
              id: generateId(),
              source: sourceId,
              target: targetId,
              type: rel.type,
              label: rel.label || rel.type,
            });
          }
        }
      }

      if (newEntities.length > 0 || newRelationships.length > 0) {
        addEntitiesAndRelationships(newEntities, newRelationships);
      }

      toast.success(
        `Enriched ${enrichedCount} entities, added ${newEntities.length} new entities and ${newRelationships.length} connections`
      );
    } catch (error) {
      console.error('Enrich all error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enrich entities');
    } finally {
      setIsEnrichingAll(false);
    }
  }, [network.entities, network.relationships, dispatch, addEntitiesAndRelationships]);

  // Tool: Custom prompt to modify graph
  const handleToolPrompt = useCallback(async () => {
    if (!toolPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsProcessing(true);
    toast.info('Processing your request...');

    try {
      // Build context from current network
      const context =
        `Current network has ${network.entities.length} entities: ${network.entities.map((e) => `${e.name} (${e.type})`).join(', ')}. ` +
        `And ${network.relationships.length} relationships. ` +
        `User request: ${toolPrompt}`;

      const result = await api.extract(context, 'gpt-5');

      if (result.entities.length === 0 && result.relationships.length === 0) {
        toast.warning('No changes suggested. Try a more specific prompt.');
        return;
      }

      // Map API IDs to our IDs
      const apiIdToOurId = new Map<string, string>();

      const entities: Entity[] = result.entities
        .map((e) => {
          const existingEntity = network.entities.find(
            (existing) => existing.name.toLowerCase() === e.name.toLowerCase()
          );

          if (existingEntity) {
            apiIdToOurId.set(e.id, existingEntity.id);
            return null;
          }

          const ourId = generateId();
          apiIdToOurId.set(e.id, ourId);

          return {
            id: ourId,
            name: e.name,
            type: (e.type?.toLowerCase() || 'person') as Entity['type'],
            description: e.description,
            importance: e.importance || 5,
          };
        })
        .filter((e): e is Entity => e !== null);

      const relationships: Relationship[] = result.relationships
        .map((r) => {
          const sourceId = apiIdToOurId.get(r.source);
          const targetId = apiIdToOurId.get(r.target);

          if (!sourceId || !targetId) return null;

          // Check if relationship already exists
          const exists = network.relationships.some(
            (existing) =>
              (existing.source === sourceId && existing.target === targetId) ||
              (existing.source === targetId && existing.target === sourceId)
          );
          if (exists) return null;

          return {
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: r.type,
            label: r.label || r.type,
          } as Relationship;
        })
        .filter((r): r is Relationship => r !== null);

      addEntitiesAndRelationships(entities, relationships);
      toast.success(`Added ${entities.length} entities and ${relationships.length} connections`);
      setToolPrompt('');
    } catch (error) {
      console.error('Tool prompt error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process prompt');
    } finally {
      setIsProcessing(false);
    }
  }, [toolPrompt, network.entities, network.relationships, addEntitiesAndRelationships]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
        <span className="section-header mb-0 border-0 pb-0">Tools</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-3">
        {/* Remove Orphans */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs justify-start"
          onClick={handleRemoveOrphans}
          disabled={isRemovingOrphans || network.entities.length === 0}
        >
          {isRemovingOrphans ? (
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          ) : (
            <Trash2 className="w-3 h-3 mr-2" />
          )}
          Remove Orphan Nodes
          {orphanCount > 0 && (
            <span className="ml-auto bg-amber-500/20 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">
              {orphanCount}
            </span>
          )}
        </Button>

        {/* Find Missing Links */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs justify-start"
          onClick={handleFindMissingLinks}
          disabled={isFindingLinks || network.entities.length < 2}
        >
          {isFindingLinks ? (
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-2" />
          )}
          Find Missing Links
        </Button>

        {/* Enrich All */}
        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs justify-start"
          onClick={handleEnrichAll}
          disabled={isEnrichingAll || network.entities.length === 0}
        >
          {isEnrichingAll ? (
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3 mr-2" />
          )}
          Enrich All Entities
          {network.entities.length > 10 && (
            <span className="ml-auto text-[10px] text-muted-foreground">(first 10)</span>
          )}
        </Button>

        {/* Custom Prompt */}
        <div className="pt-2 border-t border-border space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Wand2 className="w-3 h-3" /> Custom Prompt
          </div>
          <Textarea
            value={toolPrompt}
            onChange={(e) => setToolPrompt(e.target.value)}
            placeholder="Describe what you want to add or change..."
            className="text-xs bg-background resize-none min-h-[60px]"
            disabled={isProcessing}
          />
          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleToolPrompt}
            disabled={isProcessing || !toolPrompt.trim()}
          >
            {isProcessing ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Wand2 className="w-3 h-3 mr-1" />
            )}
            Apply
          </Button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
