/**
 * Silent Partners - Entity Card V2
 * 
 * A rich, living dossier for each entity that:
 * - Accumulates knowledge with confidence levels and sources
 * - Shows knowledge gaps to guide enrichment
 * - Enables intelligent, targeted enrichment
 * - Displays connections with context
 */

import { useState, useEffect, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Entity, generateId } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  X, Trash2, Sparkles, Link, Loader2, Plus, ChevronDown, ChevronUp,
  FileText, AlertCircle, CheckCircle, HelpCircle, ExternalLink, MessageSquare
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

function ConfidenceBar({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getLabel = () => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span className="text-[9px] text-muted-foreground">{getLabel()}</span>
    </div>
  );
}

export default function EntityCardV2({ entity, position, onClose, onAddToNarrative }: EntityCardV2Props) {
  const { network, dispatch, addEntitiesAndRelationships } = useNetwork();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [name, setName] = useState(entity.name);
  const [type, setType] = useState(entity.type);
  const [description, setDescription] = useState(entity.description || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(true);
  const [showGaps, setShowGaps] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  
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
      // Try to extract facts from description
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
    const typeGaps = KNOWLEDGE_GAP_TEMPLATES[type] || KNOWLEDGE_GAP_TEMPLATES.unknown;
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

  const handleEnrich = async () => {
    setIsEnriching(true);
    
    // Notify narrative view
    onAddToNarrative?.(`🔍 Enriching ${entity.name}...`);
    
    try {
      // Build context from existing connections and knowledge gaps
      const contextParts = connections.map(c => 
        `${c.entity?.name || 'Unknown'} (${c.relationship.type || 'related'})`
      );
      
      // Include knowledge gaps in the enrichment request
      const gapsContext = knowledgeGaps.length > 0 
        ? `\nKnowledge gaps to fill: ${knowledgeGaps.slice(0, 3).join(', ')}`
        : '';
      
      const context = [
        contextParts.length > 0 ? `Known connections: ${contextParts.join(', ')}` : '',
        gapsContext
      ].filter(Boolean).join('\n');

      const result = await api.enrichEntity(entity.name, entity.type, context);
      
      if (result.enriched) {
        // Update the entity description
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

        // Add new details with confidence
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

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const noteDetail: EntityDetail = {
      id: `note-${Date.now()}`,
      key: 'Note',
      value: newNote.trim(),
      confidence: 1.0,
      source: 'User',
      sourceDate: new Date().toISOString()
    };
    
    setDetails(prev => [...prev, noteDetail]);
    setNewNote('');
    setIsAddingNote(false);
    
    // Update entity description to include note
    const updatedDescription = description 
      ? `${description}\n\nNote: ${newNote.trim()}`
      : `Note: ${newNote.trim()}`;
    
    dispatch({
      type: 'UPDATE_ENTITY',
      payload: { id: entity.id, updates: { description: updatedDescription } }
    });
    
    toast.success('Note added');
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
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm resize-none"
                rows={3}
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
              {/* Entity Name */}
              <div>
                <h3 
                  className="font-semibold text-base cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setIsEditing(true)}
                >
                  {entity.name}
                </h3>
              </div>

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
                      <p className="text-xs text-muted-foreground italic">No knowledge recorded yet</p>
                    ) : (
                      details.map(detail => (
                        <div key={detail.id} className="bg-muted/30 rounded p-2 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="font-medium text-muted-foreground">{detail.key}: </span>
                              <span>{detail.value}</span>
                            </div>
                            {detail.confidence >= 0.8 ? (
                              <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                            ) : detail.confidence >= 0.5 ? (
                              <AlertCircle className="w-3 h-3 text-yellow-500 shrink-0" />
                            ) : (
                              <HelpCircle className="w-3 h-3 text-red-500 shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-muted-foreground">
                              {detail.source || 'Unknown source'}
                            </span>
                            <ConfidenceBar confidence={detail.confidence} />
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Add Note */}
                    {isAddingNote ? (
                      <div className="space-y-2">
                        <Textarea
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="text-xs resize-none"
                          rows={2}
                          placeholder="Add a note..."
                          autoFocus
                        />
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 text-[10px] flex-1" onClick={handleAddNote}>
                            Add
                          </Button>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] flex-1" onClick={() => setIsAddingNote(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] w-full justify-start"
                        onClick={() => setIsAddingNote(true)}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add note
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
                        <div key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <span className="text-amber-500">•</span>
                          {gap}
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground italic mt-2">
                        Click "Enrich" to fill these gaps
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      {!isEditing && (
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
              onClick={() => setIsEditing(true)}
              title="Edit"
            >
              Edit
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
      )}
    </div>
  );
}
