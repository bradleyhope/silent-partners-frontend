/**
 * Silent Partners - Entity Card
 * 
 * Floating card that appears when clicking on an entity node.
 * Allows viewing and editing entity details.
 * 
 * v9.0: Enrich now routes through orchestrator for unified AI handling
 */

import { useState, useEffect, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useOrchestrator } from '@/contexts/OrchestratorContext';
import { Entity, generateId } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2, Sparkles, Link, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EntityCardProps {
  entity: Entity;
  position: { x: number; y: number };
  onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  person: '#4A90A4',
  corporation: '#7CB342',
  government: '#8B7355',
  financial: '#C9A227',
  organization: '#9575CD',
  unknown: '#78909C',
};

export default function EntityCard({ entity, position, onClose }: EntityCardProps) {
  const { network, dispatch, addEntitiesAndRelationships } = useNetwork();
  const { sendAction, isProcessing: orchestratorProcessing } = useOrchestrator();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [name, setName] = useState(entity.name);
  const [type, setType] = useState(entity.type);
  const [description, setDescription] = useState(entity.description || '');
  const [isEditing, setIsEditing] = useState(false);

  // Get connections for this entity
  const connections = network.relationships.filter(
    r => r.source === entity.id || r.target === entity.id
  ).map(r => {
    const otherId = r.source === entity.id ? r.target : r.source;
    const otherEntity = network.entities.find(e => e.id === otherId);
    return {
      relationship: r,
      entity: otherEntity,
      direction: r.source === entity.id ? 'outgoing' : 'incoming'
    };
  });

  // Position the card near the node but within viewport
  const [cardPosition, setCardPosition] = useState({ x: position.x, y: position.y });
  
  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newX = position.x + 20;
      let newY = position.y - 20;
      
      if (newX + rect.width > viewportWidth - 20) {
        newX = position.x - rect.width - 20;
      }
      if (newY + rect.height > viewportHeight - 20) {
        newY = viewportHeight - rect.height - 20;
      }
      if (newY < 60) newY = 60;
      
      setCardPosition({ x: newX, y: newY });
    }
  }, [position]);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_ENTITY',
      payload: { id: entity.id, updates: { name, type, description } }
    });
    setIsEditing(false);
    toast.success('Entity updated');
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_ENTITY', payload: entity.id });
    onClose();
    toast.success('Entity deleted');
  };

  // Enrich now routes through the orchestrator
  const handleEnrich = () => {
    // Build context from existing connections
    const contextParts = connections.map(c => 
      `${c.entity?.name || 'Unknown'} (${c.relationship.type || 'related'})`
    );
    const context = contextParts.length > 0 
      ? `Known connections: ${contextParts.join(', ')}`
      : undefined;

    // Send to orchestrator - it will handle everything
    sendAction('enrich', {
      entityName: entity.name,
      entityType: entity.type,
      context: context
    });
    
    toast.info(`Enriching ${entity.name}...`, {
      description: 'Check the Assistant panel for progress'
    });
    
    // Close the card since the orchestrator will handle the rest
    onClose();
  };

  const typeColor = TYPE_COLORS[type] || TYPE_COLORS.unknown;

  return (
    <div
      ref={cardRef}
      className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-xl"
      style={{ left: cardPosition.x, top: cardPosition.y }}
    >
      {/* Header */}
      <div 
        className="px-4 py-3 border-b border-border rounded-t-lg"
        style={{ backgroundColor: `${typeColor}15` }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-semibold text-sm h-7"
              />
            ) : (
              <h3 className="font-semibold text-sm truncate">{name}</h3>
            )}
            <div className="flex items-center gap-2 mt-1">
              {isEditing ? (
                <Select value={type} onValueChange={(v) => setType(v as Entity['type'])}>
                  <SelectTrigger className="h-6 text-xs w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${typeColor}30`, color: typeColor }}
                >
                  {type}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Description */}
        <div>
          <label className="text-xs text-muted-foreground">Description</label>
          {isEditing ? (
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 text-xs min-h-[60px]"
              placeholder="Add a description..."
            />
          ) : (
            <p className="text-xs mt-1 text-muted-foreground">
              {description || 'No description'}
            </p>
          )}
        </div>

        {/* Connections */}
        {connections.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground">
              Connections ({connections.length})
            </label>
            <div className="mt-1 space-y-1 max-h-24 overflow-y-auto">
              {connections.slice(0, 5).map((conn, i) => (
                <div key={i} className="flex items-center gap-1 text-xs">
                  <Link className="w-3 h-3 text-muted-foreground" />
                  <span className="truncate">{conn.entity?.name || 'Unknown'}</span>
                  <span className="text-muted-foreground">
                    ({conn.relationship.type || 'related'})
                  </span>
                </div>
              ))}
              {connections.length > 5 && (
                <span className="text-xs text-muted-foreground">
                  +{connections.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-border bg-muted/30 rounded-b-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" className="h-7 text-xs" onClick={handleSave}>
                Save
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => {
                  setName(entity.name);
                  setType(entity.type);
                  setDescription(entity.description || '');
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={handleEnrich}
                disabled={orchestratorProcessing}
              >
                {orchestratorProcessing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Enrich
              </Button>
            </>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
