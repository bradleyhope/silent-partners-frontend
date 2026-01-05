/**
 * Silent Partners - Detail Panel
 * 
 * Slide-in panel showing entity or relationship details.
 * Design: Archival Investigator with typewriter metadata
 */

import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Entity, entityColors } from '@/lib/store';

const ENTITY_TYPES: Entity['type'][] = ['person', 'organization', 'financial', 'government', 'event', 'unknown'];

export default function DetailPanel() {
  const { 
    network, 
    selectedEntityId, 
    selectedRelationshipId, 
    selectEntity, 
    selectRelationship,
    updateEntity,
    deleteEntity,
    updateRelationship,
    deleteRelationship,
  } = useNetwork();

  // Find selected entity
  const selectedEntity = selectedEntityId 
    ? network.entities.find((e) => e.id === selectedEntityId) 
    : null;

  // Find selected relationship
  const selectedRelationship = selectedRelationshipId
    ? network.relationships.find((r) => r.id === selectedRelationshipId)
    : null;

  // Get connections for selected entity
  const connections = selectedEntity
    ? network.relationships.filter(
        (r) => r.source === selectedEntity.id || r.target === selectedEntity.id
      ).map((r) => {
        const otherId = r.source === selectedEntity.id ? r.target : r.source;
        const otherEntity = network.entities.find((e) => e.id === otherId);
        return { relationship: r, entity: otherEntity };
      })
    : [];

  // Close panel
  const handleClose = () => {
    selectEntity(null);
    selectRelationship(null);
  };

  // Nothing selected
  if (!selectedEntity && !selectedRelationship) {
    return null;
  }

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col h-full overflow-hidden animate-in slide-in-from-right-5 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="section-header mb-0 border-0 pb-0">
          {selectedEntity ? 'Entity' : 'Connection'}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Entity details */}
      {selectedEntity && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Type badge */}
          <div className="flex items-center gap-2">
            <span 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entityColors[selectedEntity.type] }}
            />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              {selectedEntity.type}
            </span>
          </div>

          {/* Name */}
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              value={selectedEntity.name}
              onChange={(e) => updateEntity(selectedEntity.id, { name: e.target.value })}
              className="h-8 text-sm font-medium"
            />
          </div>

          {/* Type selector */}
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select 
              value={selectedEntity.type} 
              onValueChange={(v) => updateEntity(selectedEntity.id, { type: v as Entity['type'] })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type} className="capitalize">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: entityColors[type] }}
                      />
                      {type}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={selectedEntity.description || ''}
              onChange={(e) => updateEntity(selectedEntity.id, { description: e.target.value })}
              className="text-sm resize-none"
              rows={3}
              placeholder="Add details about this entity..."
            />
          </div>

          {/* Connections */}
          {connections.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Connections ({connections.length})
              </Label>
              <div className="space-y-1">
                {connections.map(({ relationship, entity }) => (
                  <button
                    key={relationship.id}
                    onClick={() => entity && selectEntity(entity.id)}
                    className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent/50 transition-colors flex items-center gap-2"
                  >
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{entity?.name || 'Unknown'}</span>
                    {relationship.label && (
                      <span className="text-muted-foreground font-mono text-[10px]">
                        ({relationship.label})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t border-border flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 text-xs"
              onClick={() => toast.info('AI enrichment coming soon')}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Enrich with AI
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                deleteEntity(selectedEntity.id);
                toast.success('Entity deleted');
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Relationship details */}
      {selectedRelationship && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Connection</Label>
            <div className="text-sm font-medium mt-1">
              {network.entities.find((e) => e.id === selectedRelationship.source)?.name || 'Unknown'}
              <span className="mx-2 text-muted-foreground">→</span>
              {network.entities.find((e) => e.id === selectedRelationship.target)?.name || 'Unknown'}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Label</Label>
            <Input
              value={selectedRelationship.label || ''}
              onChange={(e) => updateRelationship(selectedRelationship.id, { label: e.target.value })}
              className="h-8 text-sm"
              placeholder="e.g., business partner, funded by..."
            />
          </div>

          <div className="pt-2 border-t border-border">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                deleteRelationship(selectedRelationship.id);
                toast.success('Connection deleted');
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete Connection
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
