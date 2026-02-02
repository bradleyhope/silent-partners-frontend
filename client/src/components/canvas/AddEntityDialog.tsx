/**
 * Silent Partners - Add Entity Dialog
 * 
 * Modal dialog for manually adding new entities to the network.
 * Extracted from NetworkCanvas.tsx for better separation of concerns.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Entity } from '@/lib/store';

interface AddEntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEntity: (name: string, type: Entity['type']) => void;
}

export function AddEntityDialog({ open, onOpenChange, onAddEntity }: AddEntityDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Entity['type']>('person');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddEntity(name.trim(), type);
    setName('');
    setType('person');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setName('');
    setType('person');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Entity</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter entity name"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as Entity['type'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!name.trim()}>
            Add Entity
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddEntityDialog;
