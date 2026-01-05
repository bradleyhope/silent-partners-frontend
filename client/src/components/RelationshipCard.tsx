import { useState } from 'react';
import { X, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Relationship, Entity } from '@/lib/store';
import { useNetwork } from '@/contexts/NetworkContext';

interface RelationshipCardProps {
  relationship: Relationship;
  sourceEntity: Entity | undefined;
  targetEntity: Entity | undefined;
  position: { x: number; y: number };
  onClose: () => void;
}

export function RelationshipCard({ 
  relationship, 
  sourceEntity, 
  targetEntity, 
  position, 
  onClose 
}: RelationshipCardProps) {
  const { dispatch } = useNetwork();
  const [label, setLabel] = useState(relationship.label || '');
  const [type, setType] = useState(relationship.type || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_RELATIONSHIP',
      payload: {
        id: relationship.id,
        updates: {
          label,
          type,
        },
      },
    });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this relationship?')) {
      dispatch({
        type: 'DELETE_RELATIONSHIP',
        payload: relationship.id,
      });
      onClose();
    }
  };

  // Position the card near the click but ensure it stays in viewport
  const cardStyle: React.CSSProperties = {
    position: 'absolute',
    left: Math.min(position.x, window.innerWidth - 320),
    top: Math.min(position.y, window.innerHeight - 300),
    zIndex: 1000,
  };

  return (
    <div 
      style={cardStyle}
      className="w-72 bg-white rounded-lg shadow-xl border border-stone-200 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-stone-100 px-4 py-3 flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-600" />
          <span className="text-xs font-medium text-stone-600 uppercase tracking-wide">
            Relationship
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Connection display */}
        <div className="text-center py-2 bg-stone-50 rounded-md">
          <div className="text-sm font-medium text-stone-800">
            {sourceEntity?.name || 'Unknown'}
          </div>
          <div className="text-xs text-stone-500 my-1">↓</div>
          <div className="text-sm font-medium text-stone-800">
            {targetEntity?.name || 'Unknown'}
          </div>
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label className="text-xs text-stone-500">Type</Label>
          {isEditing ? (
            <Input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., financial, business, personal"
              className="h-8 text-sm"
            />
          ) : (
            <div 
              className="text-sm text-stone-700 cursor-pointer hover:bg-stone-50 p-2 rounded"
              onClick={() => setIsEditing(true)}
            >
              {type || 'Click to add type'}
            </div>
          )}
        </div>

        {/* Label */}
        <div className="space-y-1">
          <Label className="text-xs text-stone-500">Label</Label>
          {isEditing ? (
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., CEO of, invested in"
              className="h-8 text-sm"
            />
          ) : (
            <div 
              className="text-sm text-stone-700 cursor-pointer hover:bg-stone-50 p-2 rounded"
              onClick={() => setIsEditing(true)}
            >
              {label || 'Click to add label'}
            </div>
          )}
        </div>

        {/* Date if available */}
        {relationship.startDate && (
          <div className="space-y-1">
            <Label className="text-xs text-stone-500">Date</Label>
            <div className="text-sm text-stone-700">
              {relationship.startDate}
              {relationship.endDate && ` - ${relationship.endDate}`}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                onClick={handleSave}
              >
                <Save className="w-3 h-3 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
