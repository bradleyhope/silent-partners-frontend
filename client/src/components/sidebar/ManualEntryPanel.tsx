/**
 * Silent Partners - Manual Entry Panel
 *
 * Add entities and relationships manually.
 */

import { useState, useCallback, useMemo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Plus, Link } from 'lucide-react';
import { toast } from 'sonner';
import { useNetwork } from '@/contexts/NetworkContext';
import { generateId, Entity, Relationship } from '@/lib/store';

interface ManualEntryPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManualEntryPanel({ isOpen, onOpenChange }: ManualEntryPanelProps) {
  const { network, dispatch, addRelationship } = useNetwork();

  // Add entity form state
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<Entity['type']>('person');
  const [entityImportance, setEntityImportance] = useState(5);
  const [entityDate, setEntityDate] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  // Add relationship form state
  const [relSource, setRelSource] = useState('');
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState('');
  const [relLabel, setRelLabel] = useState('');

  // Quick entity linking suggestions - find similar entities
  const suggestions = useMemo(() => {
    if (!entityName || entityName.length < 3) return [];
    const lowerName = entityName.toLowerCase();
    return network.entities
      .filter(
        (e) =>
          e.name.toLowerCase().includes(lowerName) ||
          lowerName.includes(e.name.toLowerCase().split(' ')[0])
      )
      .slice(0, 5);
  }, [entityName, network.entities]);

  // Add entity manually
  const handleAddEntity = useCallback(() => {
    if (!entityName.trim()) {
      toast.error('Entity name is required');
      return;
    }

    const newEntity: Entity = {
      id: generateId(),
      name: entityName.trim(),
      type: entityType,
      importance: entityImportance,
      description: entityDate ? `Date: ${entityDate}` : undefined,
      source_type: 'manual',
    };

    dispatch({ type: 'ADD_ENTITY', payload: newEntity });

    // If a connection was selected, create the relationship
    if (selectedConnection) {
      const newRelationship: Relationship = {
        id: generateId(),
        source: newEntity.id,
        target: selectedConnection,
        type: 'connected_to',
        label: 'connected to',
      };
      addRelationship(newRelationship);
      const targetName = network.entities.find((e) => e.id === selectedConnection)?.name;
      toast.success(`Added ${entityName} and connected to ${targetName}`);
    } else {
      toast.success(`Added ${entityName}`);
    }

    // Reset form
    setEntityName('');
    setEntityImportance(5);
    setEntityDate('');
    setSelectedConnection(null);
  }, [entityName, entityType, entityImportance, entityDate, selectedConnection, dispatch, addRelationship, network.entities]);

  // Add relationship manually
  const handleAddRelationship = useCallback(() => {
    if (!relSource || !relTarget) {
      toast.error('Both source and target entities are required');
      return;
    }
    if (relSource === relTarget) {
      toast.error('Source and target cannot be the same');
      return;
    }

    // Check if relationship already exists
    const exists = network.relationships.some(
      (r) =>
        (r.source === relSource && r.target === relTarget) ||
        (r.source === relTarget && r.target === relSource)
    );
    if (exists) {
      toast.error('A relationship between these entities already exists');
      return;
    }

    const newRelationship: Relationship = {
      id: generateId(),
      source: relSource,
      target: relTarget,
      type: relType || 'connection',
      label: relLabel || relType || 'connection',
    };

    dispatch({ type: 'ADD_RELATIONSHIP', payload: newRelationship });

    const sourceName = network.entities.find((e) => e.id === relSource)?.name || 'Entity';
    const targetName = network.entities.find((e) => e.id === relTarget)?.name || 'Entity';
    toast.success(`Connected ${sourceName} to ${targetName}`);

    // Reset form
    setRelSource('');
    setRelTarget('');
    setRelType('');
    setRelLabel('');
  }, [relSource, relTarget, relType, relLabel, network.entities, network.relationships, dispatch]);

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
        <span className="section-header mb-0 border-0 pb-0">Manual</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-4">
        {/* Add Entity Form */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Plus className="w-3 h-3" /> Add Entity
          </div>
          <Input
            value={entityName}
            onChange={(e) => setEntityName(e.target.value)}
            placeholder="Entity name"
            className="h-8 text-sm bg-background"
          />

          {/* Quick Entity Linking Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 p-2 bg-muted/50 rounded-md">
              <p className="text-[10px] text-muted-foreground mb-1">Connect to existing:</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((s) => (
                  <Button
                    key={s.id}
                    variant={selectedConnection === s.id ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setSelectedConnection(selectedConnection === s.id ? null : s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Select value={entityType} onValueChange={(v) => setEntityType(v as Entity['type'])}>
            <SelectTrigger className="h-8 text-sm bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="person">Person</SelectItem>
              <SelectItem value="corporation">Corporation</SelectItem>
              <SelectItem value="government">Government</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
              <SelectItem value="location">Location</SelectItem>
              <SelectItem value="asset">Asset</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <Label className="text-[10px] text-muted-foreground">Importance: {entityImportance}</Label>
            <Slider
              value={[entityImportance]}
              onValueChange={(v) => setEntityImportance(v[0])}
              min={1}
              max={10}
              step={1}
              className="py-1"
            />
          </div>
          <Input
            value={entityDate}
            onChange={(e) => setEntityDate(e.target.value)}
            placeholder="Date (optional, e.g. 1990-2000)"
            className="h-8 text-sm bg-background"
          />
          <Button onClick={handleAddEntity} size="sm" className="w-full h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" /> Add Entity
            {selectedConnection && ' & Connect'}
          </Button>
        </div>

        {/* Add Relationship Form */}
        {network.entities.length >= 2 && (
          <div className="space-y-2 pt-2 border-t border-sidebar-border">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link className="w-3 h-3" /> Add Relationship
            </div>
            <Select value={relSource} onValueChange={setRelSource}>
              <SelectTrigger className="h-8 text-sm bg-background">
                <SelectValue placeholder="Source entity" />
              </SelectTrigger>
              <SelectContent>
                {network.entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={relTarget} onValueChange={setRelTarget}>
              <SelectTrigger className="h-8 text-sm bg-background">
                <SelectValue placeholder="Target entity" />
              </SelectTrigger>
              <SelectContent>
                {network.entities
                  .filter((e) => e.id !== relSource)
                  .map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input
              value={relType}
              onChange={(e) => setRelType(e.target.value)}
              placeholder="Relationship type (e.g. Invested in)"
              className="h-8 text-sm bg-background"
            />
            <Input
              value={relLabel}
              onChange={(e) => setRelLabel(e.target.value)}
              placeholder="Label (optional)"
              className="h-8 text-sm bg-background"
            />
            <Button onClick={handleAddRelationship} size="sm" className="w-full h-7 text-xs">
              <Link className="w-3 h-3 mr-1" /> Add Relationship
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
