/**
 * Import JSON Dialog for Silent Partners
 * 
 * Handles drag-and-drop JSON import with options to:
 * - Add to existing network (merge)
 * - Replace current network (start fresh)
 * 
 * Validates JSON format and provides helpful error messages.
 */

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { AlertCircle, FileJson, Plus, Replace, CheckCircle2 } from 'lucide-react';
import { Entity, Relationship, Network } from '@/lib/store';

interface ImportedData {
  title?: string;
  description?: string;
  entities: Entity[];
  relationships: Relationship[];
  investigationContext?: Network['investigationContext'];
}

interface ImportJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importedData: ImportedData | null;
  onImport: (mode: 'merge' | 'replace') => void;
  currentEntityCount: number;
  currentRelationshipCount: number;
}

// Validation result type
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    entities: number;
    relationships: number;
    entityTypes: Record<string, number>;
  };
}

// Validate the imported JSON data
export function validateImportData(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entityTypes: Record<string, number> = {};
  
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid JSON: Expected an object with entities and relationships'],
      warnings: [],
      stats: { entities: 0, relationships: 0, entityTypes: {} },
    };
  }
  
  const obj = data as Record<string, unknown>;
  
  // Check for entities array
  if (!Array.isArray(obj.entities)) {
    errors.push('Missing or invalid "entities" array');
  }
  
  // Check for relationships array
  if (!Array.isArray(obj.relationships)) {
    errors.push('Missing or invalid "relationships" array');
  }
  
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      stats: { entities: 0, relationships: 0, entityTypes: {} },
    };
  }
  
  const entities = obj.entities as unknown[];
  const relationships = obj.relationships as unknown[];
  const entityIds = new Set<string>();
  
  // Validate entities
  entities.forEach((entity, index) => {
    if (!entity || typeof entity !== 'object') {
      errors.push(`Entity at index ${index} is not an object`);
      return;
    }
    
    const e = entity as Record<string, unknown>;
    
    if (!e.id || typeof e.id !== 'string') {
      errors.push(`Entity at index ${index} missing required "id" field`);
    } else {
      if (entityIds.has(e.id)) {
        warnings.push(`Duplicate entity ID: "${e.id}"`);
      }
      entityIds.add(e.id);
    }
    
    if (!e.name || typeof e.name !== 'string') {
      errors.push(`Entity at index ${index} missing required "name" field`);
    }
    
    if (!e.type || typeof e.type !== 'string') {
      warnings.push(`Entity "${e.name || index}" missing "type" field, will default to "unknown"`);
    } else {
      const validTypes = ['person', 'corporation', 'organization', 'financial', 'government', 'event', 'location', 'asset', 'unknown'];
      if (!validTypes.includes(e.type as string)) {
        warnings.push(`Entity "${e.name}" has invalid type "${e.type}", will default to "unknown"`);
      } else {
        entityTypes[e.type as string] = (entityTypes[e.type as string] || 0) + 1;
      }
    }
  });
  
  // Validate relationships
  relationships.forEach((rel, index) => {
    if (!rel || typeof rel !== 'object') {
      errors.push(`Relationship at index ${index} is not an object`);
      return;
    }
    
    const r = rel as Record<string, unknown>;
    
    if (!r.id || typeof r.id !== 'string') {
      warnings.push(`Relationship at index ${index} missing "id" field, will be auto-generated`);
    }
    
    if (!r.source || typeof r.source !== 'string') {
      errors.push(`Relationship at index ${index} missing required "source" field`);
    } else if (!entityIds.has(r.source)) {
      warnings.push(`Relationship at index ${index} references unknown source entity: "${r.source}"`);
    }
    
    if (!r.target || typeof r.target !== 'string') {
      errors.push(`Relationship at index ${index} missing required "target" field`);
    } else if (!entityIds.has(r.target)) {
      warnings.push(`Relationship at index ${index} references unknown target entity: "${r.target}"`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      entities: entities.length,
      relationships: relationships.length,
      entityTypes,
    },
  };
}

// Parse and normalize imported data
export function parseImportData(data: unknown): ImportedData | null {
  const validation = validateImportData(data);
  if (!validation.isValid) return null;
  
  const obj = data as Record<string, unknown>;
  const entities = (obj.entities as unknown[]).map((e, index) => {
    const entity = e as Record<string, unknown>;
    return {
      id: (entity.id as string) || `imported-${Date.now()}-${index}`,
      name: entity.name as string,
      type: (['person', 'corporation', 'organization', 'financial', 'government', 'event', 'location', 'asset'].includes(entity.type as string) 
        ? entity.type 
        : 'unknown') as Entity['type'],
      description: entity.description as string | undefined,
      importance: entity.importance as number | undefined,
      source_type: 'manual' as const,
      created_at: new Date().toISOString(),
    };
  });
  
  const relationships = (obj.relationships as unknown[]).map((r, index) => {
    const rel = r as Record<string, unknown>;
    return {
      id: (rel.id as string) || `imported-rel-${Date.now()}-${index}`,
      source: rel.source as string,
      target: rel.target as string,
      type: rel.type as string | undefined,
      label: rel.label as string | undefined,
      status: (['confirmed', 'suspected', 'former'].includes(rel.status as string) 
        ? rel.status 
        : 'confirmed') as Relationship['status'],
      strength: rel.strength as number | undefined,
    };
  });
  
  return {
    title: obj.title as string | undefined,
    description: obj.description as string | undefined,
    entities,
    relationships,
    investigationContext: obj.investigationContext as Network['investigationContext'],
  };
}

export default function ImportJsonDialog({
  open,
  onOpenChange,
  importedData,
  onImport,
  currentEntityCount,
  currentRelationshipCount,
}: ImportJsonDialogProps) {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  
  if (!importedData) return null;
  
  const hasExistingData = currentEntityCount > 0 || currentRelationshipCount > 0;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-amber-600" />
            Import Network Data
          </DialogTitle>
          <DialogDescription>
            Choose how to import the JSON data into your network.
          </DialogDescription>
        </DialogHeader>
        
        {/* Import summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Valid JSON detected
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Entities:</span>{' '}
              <span className="font-medium">{importedData.entities.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Relationships:</span>{' '}
              <span className="font-medium">{importedData.relationships.length}</span>
            </div>
          </div>
          {importedData.title && (
            <div className="text-sm">
              <span className="text-muted-foreground">Title:</span>{' '}
              <span className="font-medium">{importedData.title}</span>
            </div>
          )}
        </div>
        
        {/* Import mode selection */}
        {hasExistingData ? (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Import Mode</Label>
            <RadioGroup
              value={importMode}
              onValueChange={(value) => setImportMode(value as 'merge' | 'replace')}
              className="space-y-3"
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="merge" id="merge" className="mt-1" />
                <Label htmlFor="merge" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Add to existing network
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Merge {importedData.entities.length} entities and {importedData.relationships.length} relationships 
                    with your current {currentEntityCount} entities and {currentRelationshipCount} relationships.
                    Duplicates will be skipped.
                  </p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="replace" id="replace" className="mt-1" />
                <Label htmlFor="replace" className="cursor-pointer flex-1">
                  <div className="flex items-center gap-2 font-medium">
                    <Replace className="w-4 h-4 text-amber-600" />
                    Replace current network
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clear your current network and start fresh with the imported data.
                    <span className="text-amber-600 font-medium"> This cannot be undone.</span>
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-800">
              Your network is empty. The imported data will create a new network.
            </p>
          </div>
        )}
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onImport(hasExistingData ? importMode : 'replace')}>
            {hasExistingData && importMode === 'merge' ? 'Merge Data' : 'Import Network'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
