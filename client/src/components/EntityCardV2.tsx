/**
 * Silent Partners - Entity Card V2
 * 
 * A rich, living dossier for each entity that:
 * - Accumulates knowledge with confidence levels and sources
 * - Shows knowledge gaps to guide enrichment
 * - Enables intelligent, targeted enrichment
 * - Displays connections with context
 * - ALL fields are editable by the user
 */

import { useState, useEffect, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Entity, generateId } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { 
  X, Trash2, Sparkles, Link, Loader2, Plus, ChevronDown, ChevronUp,
  FileText, AlertCircle, CheckCircle, HelpCircle, Edit2, Save, Pencil
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface EntityDetail {
  id: string;
  key: string;
  value: string;
  confidence: number;
  source?: string;
  sourceDate?: string;
}

interface EntityCardV2Props {
  entity: Entity;
  position: { x: number; y: number };
  onClose: () => void;
  onAddToNarrative?: (message: string) => void;
}

const TYPE_COLORS: Record<string, string> = {
  person: '#4A90A4',
  corporation: '#7CB342',
  government: '#8B7355',
  financial: '#C9A227',
  organization: '#9575CD',
  location: '#E57373',
  event: '#FF8A65',
  unknown: '#78909C',
};

const TYPE_ICONS: Record<string, string> = {
  person: '👤',
  corporation: '🏢',
  government: '🏛️',
  financial: '💰',
  organization: '🏛️',
  location: '📍',
  event: '📅',
  unknown: '❓',
};

// Knowledge gaps based on entity type
const KNOWLEDGE_GAP_TEMPLATES: Record<string, string[]> = {
  person: ['Current role/position', 'Education', 'Family connections', 'Political affiliations', 'Financial interests'],
  corporation: ['Ownership structure', 'Key executives', 'Financial status', 'Subsidiaries', 'Legal issues'],
  government: ['Key officials', 'Budget/funding', 'Jurisdiction', 'Recent policies', 'Controversies'],
  financial: ['Assets under management', 'Key investors', 'Performance', 'Regulatory status', 'Ownership'],
  organization: ['Leadership', 'Funding sources', 'Mission/purpose', 'Key members', 'Activities'],
  location: ['Population', 'Economic activity', 'Political status', 'Key events', 'Notable residents'],
  event: ['Date/time', 'Location', 'Key participants', 'Outcomes', 'Related events'],
};

// Editable confidence selector
function ConfidenceSelector({ confidence, onChange }: { confidence: number; onChange: (val: number) => void }) {
  const getColor = () => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getLabel = () => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="flex items-center gap-2">
      <Slider
        value={[confidence * 100]}
        onValueChange={([val]) => onChange(val / 100)}
        max={100}
        step={10}
        className="w-20"
      />
      <span className={`text-[10px] font-medium ${getColor()}`}>{getLabel()}</span>
    </div>
  );
}

// Read-only confidence bar
function ConfidenceBar({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-1">
      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
    </div>
  );
}

// Editable knowledge fact component
function EditableKnowledgeFact({ 
  detail, 
  onUpdate, 
  onDelete 
}: { 
  detail: EntityDetail; 
  onUpdate: (updated: EntityDetail) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editKey, setEditKey] = useState(detail.key);
  const [editValue, setEditValue] = useState(detail.value);
  const [editConfidence, setEditConfidence] = useState(detail.confidence);
  const [editSource, setEditSource] = useState(detail.source || '');

  const handleSave = () => {
    onUpdate({
      ...detail,
      key: editKey,
      value: editValue,
      confidence: editConfidence,
      source: editSource || undefined
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditKey(detail.key);
    setEditValue(detail.value);
    setEditConfidence(detail.confidence);
    setEditSource(detail.source || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-muted/50 rounded p-2 text-xs space-y-2 border border-primary/30">
        <div className="flex gap-2">
          <Input
            value={editKey}
            onChange={(e) => setEditKey(e.target.value)}
            className="h-6 text-xs flex-1"
            placeholder="Label (e.g., Role, Education)"
          />
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-xs resize-none min-h-[40px]"
          placeholder="Value..."
        />
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Confidence:</span>
          <ConfidenceSelector confidence={editConfidence} onChange={setEditConfidence} />
        </div>
        <Input
          value={editSource}
          onChange={(e) => setEditSource(e.target.value)}
          className="h-6 text-xs"
          placeholder="Source (e.g., Wikipedia, Court Filing)"
        />
        <div className="flex gap-1">
          <Button size="sm" className="h-6 text-[10px] flex-1" onClick={handleSave}>
            <Save className="w-3 h-3 mr-1" /> Save
          </Button>
          <Button variant="destructive" size="sm" className="h-6 text-[10px] px-2" onClick={onDelete}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded p-2 text-xs group hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <span className="font-medium text-muted-foreground">{detail.key}: </span>
          <span>{detail.value}</span>
        </div>
        <div className="flex items-center gap-1">
          <ConfidenceBar confidence={detail.confidence} />
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
      </div>
      {detail.source && (
        <div className="text-[10px] text-muted-foreground mt-1">
          Source: {detail.source}
        </div>
      )}
    </div>
  );
}

export default function EntityCardV2({ entity, position, onClose, onAddToNarrative }: EntityCardV2Props) {
  const { network, dispatch, addEntitiesAndRelationships } = useNetwork();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [name, setName] = useState(entity.name);
  const [type, setType] = useState(entity.type);
  const [description, setDescription] = useState(entity.description || '');
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(true);
  const [showGaps, setShowGaps] = useState(false);
  const [isAddingFact, setIsAddingFact] = useState(false);
  const [newFactKey, setNewFactKey] = useState('');
  const [newFactValue, setNewFactValue] = useState('');
  const [newFactConfidence, setNewFactConfidence] = useState(0.8);
  const [newFactSource, setNewFactSource] = useState('');
  
  // Entity details (knowledge facts)
  const [details, setDetails] = useState<EntityDetail[]>([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState<string[]>([]);

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

  // Parse existing description into details (for backward compatibility)
  useEffect(() => {
    if (entity.description) {
      const lines = entity.description.split('\n').filter(l => l.trim());
      const extractedDetails: EntityDetail[] = [];
      
      lines.forEach((line, i) => {
        if (line.startsWith('Key facts:')) {
          const facts = line.replace('Key facts:', '').split(';');
          facts.forEach((fact, j) => {
            if (fact.trim()) {
              extractedDetails.push({
                id: `fact-${i}-${j}`,
                key: 'Fact',
                value: fact.trim(),
                confidence: 0.7,
                source: 'AI Enrichment'
              });
            }
          });
        } else if (line.startsWith('Note:')) {
          extractedDetails.push({
            id: `note-${i}`,
            key: 'Note',
            value: line.replace('Note:', '').trim(),
            confidence: 1.0,
            source: 'User'
          });
        } else if (!extractedDetails.some(d => d.value === line)) {
          extractedDetails.push({
            id: `desc-${i}`,
            key: 'Description',
            value: line,
            confidence: 0.8,
            source: 'Extraction'
          });
        }
      });
      
      setDetails(extractedDetails);
    }
    
    // Calculate knowledge gaps
    const typeGaps = KNOWLEDGE_GAP_TEMPLATES[type] || KNOWLEDGE_GAP_TEMPLATES.unknown || [];
    const existingKeys = details.map(d => d.key.toLowerCase());
    const gaps = typeGaps.filter(gap => 
      !existingKeys.some(k => k.includes(gap.toLowerCase()) || gap.toLowerCase().includes(k))
    );
    setKnowledgeGaps(gaps);
  }, [entity.description, type]);

  // Position the card near the node but within viewport
  const [cardPosition, setCardPosition] = useState({ x: position.x, y: position.y });
  
  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let x = position.x + 20;
      let y = position.y - 20;
      
      if (x + rect.width > viewportWidth - 20) {
        x = position.x - rect.width - 20;
      }
      if (y + rect.height > viewportHeight - 20) {
        y = viewportHeight - rect.height - 20;
      }
      if (y < 80) y = 80;
      if (x < 300) x = 300;
      
      setCardPosition({ x, y });
    }
  }, [position]);

  // Save entity header changes
  const handleSaveHeader = () => {
    dispatch({
      type: 'UPDATE_ENTITY',
      payload: { id: entity.id, updates: { name, type, description } }
    });
    setIsEditingHeader(false);
    toast.success('Entity updated');
  };

  // Update a knowledge fact
  const handleUpdateFact = (updated: EntityDetail) => {
    setDetails(prev => prev.map(d => d.id === updated.id ? updated : d));
    
    // Rebuild description from details
    const newDescription = details
      .map(d => d.id === updated.id ? updated : d)
      .map(d => d.key === 'Note' ? `Note: ${d.value}` : d.value)
      .join('\n\n');
    
    dispatch({
      type: 'UPDATE_ENTITY',
      payload: { id: entity.id, updates: { description: newDescription } }
    });
    toast.success('Fact updated');
  };

  // Delete a knowledge fact
  const handleDeleteFact = (id: string) => {
    const newDetails = details.filter(d => d.id !== id);
    setDetails(newDetails);
    
    const newDescription = newDetails
      .map(d => d.key === 'Note' ? `Note: ${d.value}` : d.value)
      .join('\n\n');
    
    dispatch({
      type: 'UPDATE_ENTITY',
      payload: { id: entity.id, updates: { description: newDescription } }
    });
    toast.success('Fact deleted');
  };

  // Add a new knowledge fact
  const handleAddFact = () => {
    if (!newFactValue.trim()) return;
    
    const newDetail: EntityDetail = {
      id: `user-${Date.now()}`,
      key: newFactKey || 'Note',
      value: newFactValue.trim(),
      confidence: newFactConfidence,
      source: newFactSource || 'User',
      sourceDate: new Date().toISOString()
    };
    
    const newDetails = [...details, newDetail];
    setDetails(newDetails);
    
    const newDescription = newDetails
      .map(d => d.key === 'Note' ? `Note: ${d.value}` : d.value)
      .join('\n\n');
    
    dispatch({
      type: 'UPDATE_ENTITY',
      payload: { id: entity.id, updates: { description: newDescription } }
    });
    
    setNewFactKey('');
    setNewFactValue('');
    setNewFactConfidence(0.8);
    setNewFactSource('');
    setIsAddingFact(false);
    toast.success('Fact added');
  };

  // Add fact from knowledge gap
  const handleAddFromGap = (gap: string) => {
    setNewFactKey(gap);
    setNewFactValue('');
    setIsAddingFact(true);
    setShowGaps(false);
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_ENTITY', payload: entity.id });
    onClose();
    toast.success('Entity deleted');
  };

  const handleEnrich = async () => {
    setIsEnriching(true);
    onAddToNarrative?.(`🔍 Enriching ${entity.name}...`);
    
    try {
      const contextParts = connections.map(c => 
        `${c.entity?.name || 'Unknown'} (${c.relationship.type || 'related'})`
      );
      
      const gapsContext = knowledgeGaps.length > 0 
        ? `\nKnowledge gaps to fill: ${knowledgeGaps.slice(0, 3).join(', ')}`
        : '';
      
      const context = [
        contextParts.length > 0 ? `Known connections: ${contextParts.join(', ')}` : '',
        gapsContext
      ].filter(Boolean).join('\n');

      const result = await api.enrichEntity(entity.name, entity.type, context);
      
      if (result.enriched) {
        const enrichedDescription = [
          result.enriched.description,
          result.enriched.key_facts?.length > 0 
            ? `Key facts: ${result.enriched.key_facts.join('; ')}`
            : null
        ].filter(Boolean).join('\n\n');

        dispatch({
          type: 'UPDATE_ENTITY',
          payload: { 
            id: entity.id, 
            updates: { 
              description: enrichedDescription,
              type: result.enriched.type as Entity['type'] || entity.type
            } 
          }
        });
        setDescription(enrichedDescription);

        // Add new details
        const newDetails: EntityDetail[] = [];
        if (result.enriched.key_facts) {
          result.enriched.key_facts.forEach((fact: string, i: number) => {
            newDetails.push({
              id: `enriched-${Date.now()}-${i}`,
              key: 'Fact',
              value: fact,
              confidence: 0.7,
              source: 'AI Enrichment',
              sourceDate: new Date().toISOString()
            });
          });
        }
        setDetails(prev => [...prev, ...newDetails]);

        // Add suggested connections
        if (result.enriched.connections_suggested?.length > 0) {
          const newEntities: Entity[] = [];
          const newRelationships: { id: string; source: string; target: string; type: string; label: string }[] = [];

          for (const suggestion of result.enriched.connections_suggested) {
            const existingEntity = network.entities.find(
              e => e.name.toLowerCase() === suggestion.name.toLowerCase()
            );

            if (!existingEntity) {
              const newId = generateId();
              newEntities.push({
                id: newId,
                name: suggestion.name,
                type: 'person',
                description: `Suggested connection to ${entity.name}`,
                importance: 5,
              });
              newRelationships.push({
                id: generateId(),
                source: entity.id,
                target: newId,
                type: suggestion.relationship,
                label: suggestion.relationship,
              });
            } else {
              const existingRel = network.relationships.find(
                r => (r.source === entity.id && r.target === existingEntity.id) ||
                     (r.target === entity.id && r.source === existingEntity.id)
              );
              if (!existingRel) {
                newRelationships.push({
                  id: generateId(),
                  source: entity.id,
                  target: existingEntity.id,
                  type: suggestion.relationship,
                  label: suggestion.relationship,
                });
              }
            }
          }

          if (newEntities.length > 0 || newRelationships.length > 0) {
            addEntitiesAndRelationships(newEntities, newRelationships);
            onAddToNarrative?.(`✨ Enriched ${entity.name}: Added ${newEntities.length} entities and ${newRelationships.length} connections`);
            toast.success(`Enriched! Added ${newEntities.length} entities and ${newRelationships.length} connections`);
          } else {
            onAddToNarrative?.(`✨ Enriched ${entity.name} with additional details`);
            toast.success('Entity enriched with additional details');
          }
        } else {
          onAddToNarrative?.(`✨ Enriched ${entity.name} with additional details`);
          toast.success('Entity enriched with additional details');
        }
      }
    } catch (error) {
      console.error('Enrich error:', error);
      onAddToNarrative?.(`❌ Failed to enrich ${entity.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(error instanceof Error ? error.message : 'Failed to enrich entity');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="fixed z-50 w-80 bg-card border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-[80vh] overflow-hidden flex flex-col"
      style={{ left: cardPosition.x, top: cardPosition.y }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 rounded-t-lg shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">{TYPE_ICONS[type] || TYPE_ICONS.unknown}</span>
          <span 
            className="w-2 h-2 rounded-full" 
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

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-3">
          {/* Entity Header - Editable */}
          {isEditingHeader ? (
            <div className="space-y-2 p-2 bg-muted/30 rounded-lg border border-primary/30">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm font-medium"
                placeholder="Entity name"
                autoFocus
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
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleSaveHeader}>
                  <Save className="w-3 h-3 mr-1" /> Save
                </Button>
                <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setIsEditingHeader(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="group">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-base">{entity.name}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setIsEditingHeader(true)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Knowledge Section */}
          <div className="border-t border-border pt-2">
            <button 
              className="flex items-center justify-between w-full text-left"
              onClick={() => setShowKnowledge(!showKnowledge)}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                Knowledge ({details.length} facts)
              </div>
              {showKnowledge ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            
            {showKnowledge && (
              <div className="mt-2 space-y-2">
                {details.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No knowledge recorded yet. Click + to add facts.</p>
                ) : (
                  details.map(detail => (
                    <EditableKnowledgeFact
                      key={detail.id}
                      detail={detail}
                      onUpdate={handleUpdateFact}
                      onDelete={() => handleDeleteFact(detail.id)}
                    />
                  ))
                )}
                
                {/* Add New Fact */}
                {isAddingFact ? (
                  <div className="bg-muted/50 rounded p-2 text-xs space-y-2 border border-primary/30">
                    <Input
                      value={newFactKey}
                      onChange={(e) => setNewFactKey(e.target.value)}
                      className="h-6 text-xs"
                      placeholder="Label (e.g., Role, Education, Note)"
                      autoFocus
                    />
                    <Textarea
                      value={newFactValue}
                      onChange={(e) => setNewFactValue(e.target.value)}
                      className="text-xs resize-none min-h-[40px]"
                      placeholder="Enter the information..."
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Confidence:</span>
                      <ConfidenceSelector confidence={newFactConfidence} onChange={setNewFactConfidence} />
                    </div>
                    <Input
                      value={newFactSource}
                      onChange={(e) => setNewFactSource(e.target.value)}
                      className="h-6 text-xs"
                      placeholder="Source (optional)"
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="h-6 text-[10px] flex-1" onClick={handleAddFact}>
                        <Plus className="w-3 h-3 mr-1" /> Add Fact
                      </Button>
                      <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => setIsAddingFact(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs w-full"
                    onClick={() => setIsAddingFact(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add Knowledge
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Connections */}
          {connections.length > 0 && (
            <div className="border-t border-border pt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
                <Link className="w-3.5 h-3.5" />
                {connections.length} connection{connections.length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-1">
                {(showAllConnections ? connections : connections.slice(0, 3)).map(({ relationship, entity: otherEntity, direction }) => (
                  <div key={relationship.id} className="text-xs flex items-center gap-1 bg-muted/20 rounded px-2 py-1">
                    <span className="text-muted-foreground">
                      {direction === 'outgoing' ? '→' : '←'}
                    </span>
                    <span className="font-medium truncate flex-1">{otherEntity?.name || 'Unknown'}</span>
                    <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                      {relationship.type}
                    </span>
                  </div>
                ))}
                {connections.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 text-[10px] w-full"
                    onClick={() => setShowAllConnections(!showAllConnections)}
                  >
                    {showAllConnections ? 'Show less' : `+${connections.length - 3} more`}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Knowledge Gaps */}
          {knowledgeGaps.length > 0 && (
            <div className="border-t border-border pt-2">
              <button 
                className="flex items-center justify-between w-full text-left"
                onClick={() => setShowGaps(!showGaps)}
              >
                <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Knowledge Gaps ({knowledgeGaps.length})
                </div>
                {showGaps ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              
              {showGaps && (
                <div className="mt-2 space-y-1">
                  {knowledgeGaps.map((gap, i) => (
                    <button
                      key={i}
                      className="w-full text-left text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors p-1 rounded hover:bg-muted/30"
                      onClick={() => handleAddFromGap(gap)}
                    >
                      <Plus className="w-3 h-3 text-amber-500" />
                      {gap}
                    </button>
                  ))}
                  <p className="text-[10px] text-muted-foreground italic mt-2">
                    Click a gap to add it manually, or use "Enrich" for AI assistance
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="border-t border-border p-2 bg-muted/20 shrink-0">
        <div className="flex gap-1.5">
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 h-7 text-xs"
            onClick={handleEnrich}
            disabled={isEnriching}
          >
            {isEnriching ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Sparkles className="w-3 h-3 mr-1" />
            )}
            Enrich
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs px-2"
            onClick={() => setIsEditingHeader(true)}
            title="Edit"
          >
            <Edit2 className="w-3 h-3" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
            onClick={handleDelete}
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
