/**
 * Silent Partners - Entity Card
 * 
 * Floating card that appears when clicking on an entity node.
 * Allows viewing and editing entity details.
 */

import { useState, useEffect, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Entity } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Trash2, Sparkles, Link } from 'lucide-react';
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
  const { network, dispatch } = useNetwork();
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
      
      let x = position.x + 20;
      let y = position.y - 20;
      
      // Keep within viewport
      if (x + rect.width > viewportWidth - 20) {
        x = position.x - rect.width - 20;
      }
      if (y + rect.height > viewportHeight - 20) {
        y = viewportHeight - rect.height - 20;
      }
      if (y < 80) y = 80; // Below header
      if (x < 300) x = 300; // After sidebar
      
      setCardPosition({ x, y });
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

  const handleEnrich = () => {
    toast.info('AI enrichment coming soon');
  };

  return (
    <div
      ref={cardRef}
      className="fixed z-50 w-72 bg-card border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150"
      style={{ left: cardPosition.x, top: cardPosition.y }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.unknown }}
          />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {type}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {isEditing ? (
          <>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm font-medium"
              placeholder="Entity name"
            />
            <Select value={type} onValueChange={(v) => setType(v as Entity['type'])}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm resize-none"
              rows={2}
              placeholder="Description..."
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h3 
                className="font-medium text-sm cursor-pointer hover:text-primary transition-colors"
                onClick={() => setIsEditing(true)}
              >
                {entity.name}
              </h3>
              {entity.description && (
                <p className="text-xs text-muted-foreground mt-1">{entity.description}</p>
              )}
              {entity.importance && (
                <p className="text-[10px] text-muted-foreground mt-1">Importance: {entity.importance}/10</p>
              )}
            </div>

            {/* Connections */}
            {connections.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground mb-2">
                  <Link className="w-3 h-3" />
                  {connections.length} connection{connections.length !== 1 ? 's' : ''}
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {connections.slice(0, 5).map(({ relationship, entity: otherEntity, direction }) => (
                    <div key={relationship.id} className="text-xs flex items-center gap-1">
                      <span className="text-muted-foreground">
                        {direction === 'outgoing' ? '→' : '←'}
                      </span>
                      <span className="font-medium truncate">{otherEntity?.name || 'Unknown'}</span>
                      <span className="text-muted-foreground text-[10px]">({relationship.type})</span>
                    </div>
                  ))}
                  {connections.length > 5 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{connections.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-7 text-xs"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs px-2"
                onClick={handleEnrich}
              >
                <Sparkles className="w-3 h-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
