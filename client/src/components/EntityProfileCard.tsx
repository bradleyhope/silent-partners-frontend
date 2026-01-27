/**
 * Silent Partners - Entity Profile Card
 * 
 * Rich entity profile with facts, relationships, sources, and evidence.
 * Designed for investigators who need detailed information.
 */

import { useState, useEffect, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Entity, Relationship, generateId } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  X, Trash2, Sparkles, Link, Loader2, User, Building, 
  MapPin, FileText, ExternalLink, Calendar, ChevronRight,
  Plus, Search
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface EntityProfileCardProps {
  entity: Entity;
  position: { x: number; y: number };
  onClose: () => void;
  onSelectEntity?: (entityId: string) => void;
}

interface Fact {
  statement: string;
  source?: string;
  sourceUrl?: string;
  date?: string;
  confidence?: number;
}

interface RelationshipWithDetails {
  relationship: Relationship;
  otherEntity: Entity | undefined;
  direction: 'outgoing' | 'incoming';
  evidence?: string;
}

const TYPE_COLORS: Record<string, string> = {
  person: '#4A90A4',
  corporation: '#7CB342',
  government: '#8B7355',
  financial: '#C9A227',
  organization: '#9575CD',
  location: '#26A69A',
  asset: '#FF7043',
  event: '#AB47BC',
  unknown: '#78909C',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  person: <User className="w-4 h-4" />,
  corporation: <Building className="w-4 h-4" />,
  organization: <Building className="w-4 h-4" />,
  location: <MapPin className="w-4 h-4" />,
  government: <Building className="w-4 h-4" />,
  financial: <Building className="w-4 h-4" />,
  asset: <FileText className="w-4 h-4" />,
  event: <Calendar className="w-4 h-4" />,
};

export default function EntityProfileCard({ 
  entity, 
  position, 
  onClose,
  onSelectEntity 
}: EntityProfileCardProps) {
  const { network, dispatch, addEntitiesAndRelationships } = useNetwork();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Edit state
  const [name, setName] = useState(entity.name);
  const [type, setType] = useState(entity.type);
  const [description, setDescription] = useState(entity.description || '');
  
  // Facts (parsed from description or fetched)
  const [facts, setFacts] = useState<Fact[]>([]);
  
  // Get all connections for this entity
  const connections: RelationshipWithDetails[] = network.relationships
    .filter(r => r.source === entity.id || r.target === entity.id)
    .map(r => {
      const otherId = r.source === entity.id ? r.target : r.source;
      const otherEntity = network.entities.find(e => e.id === otherId);
      return {
        relationship: r,
        otherEntity,
        direction: r.source === entity.id ? 'outgoing' : 'incoming',
        evidence: r.description || r.label
      };
    })
    .sort((a, b) => {
      // Sort by importance of connected entity
      const aImportance = a.otherEntity?.importance || 0;
      const bImportance = b.otherEntity?.importance || 0;
      return bImportance - aImportance;
    });

  // Group connections by type
  const connectionsByType = connections.reduce((acc, conn) => {
    const type = conn.relationship.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(conn);
    return acc;
  }, {} as Record<string, RelationshipWithDetails[]>);

  // Parse facts from description
  useEffect(() => {
    if (entity.description) {
      // Try to parse structured facts from description
      const lines = entity.description.split('\n').filter(l => l.trim());
      const parsedFacts: Fact[] = lines.map(line => {
        // Check if line has source annotation [Source: ...]
        const sourceMatch = line.match(/\[Source:\s*([^\]]+)\]/i);
        const statement = line.replace(/\[Source:[^\]]+\]/i, '').trim();
        
        return {
          statement,
          source: sourceMatch ? sourceMatch[1] : undefined
        };
      });
      setFacts(parsedFacts);
    }
  }, [entity.description]);

  // Position the card
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
    
    try {
      const contextParts = connections.map(c => 
        `${c.otherEntity?.name || 'Unknown'} (${c.relationship.type || 'related'})`
      );
      const context = contextParts.length > 0 
        ? `Known connections: ${contextParts.join(', ')}`
        : undefined;

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
            toast.success(`Added ${newEntities.length} entities and ${newRelationships.length} connections`);
          }
        }
        
        toast.success('Entity enriched');
      }
    } catch (error) {
      console.error('Enrich error:', error);
      toast.error('Failed to enrich entity');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleResearchConnections = async () => {
    setIsResearching(true);
    toast.info(`Researching connections for ${entity.name}...`);
    
    // This would call the new v2 research endpoint
    // For now, just use the enrich function
    await handleEnrich();
    setIsResearching(false);
  };

  return (
    <div
      ref={cardRef}
      className="fixed z-50 w-96 bg-card border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-150"
      style={{ left: cardPosition.x, top: cardPosition.y, maxHeight: '80vh' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: TYPE_COLORS[type] || TYPE_COLORS.unknown }}
          >
            {TYPE_ICONS[type] || <User className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h3 className="font-semibold text-sm">{entity.name}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] h-4">
                {type}
              </Badge>
              {entity.importance && entity.importance >= 8 && (
                <Badge variant="default" className="text-[10px] h-4 bg-amber-500">
                  Key Figure
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start px-4 pt-2 bg-transparent border-b rounded-none h-auto gap-4">
          <TabsTrigger 
            value="overview" 
            className="text-xs pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="connections" 
            className="text-xs pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Connections ({connections.length})
          </TabsTrigger>
          <TabsTrigger 
            value="facts" 
            className="text-xs pb-2 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
          >
            Facts ({facts.length})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[300px]">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-4 space-y-4 mt-0">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                  placeholder="Entity name"
                />
                <Select value={type} onValueChange={(v) => setType(v as Entity['type'])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="government">Government</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                  rows={4}
                  placeholder="Description and notes..."
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={handleSave}>
                    Save Changes
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Description */}
                {description && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm whitespace-pre-wrap">{description}</p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{connections.length}</div>
                    <div className="text-xs text-muted-foreground">Connections</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{entity.importance || '-'}</div>
                    <div className="text-xs text-muted-foreground">Importance</div>
                  </div>
                </div>

                {/* Top Connections Preview */}
                {connections.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Key Connections</h4>
                    <div className="space-y-1">
                      {connections.slice(0, 3).map(({ relationship, otherEntity, direction }) => (
                        <div 
                          key={relationship.id} 
                          className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => otherEntity && onSelectEntity?.(otherEntity.id)}
                        >
                          <div 
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]"
                            style={{ backgroundColor: TYPE_COLORS[otherEntity?.type || 'unknown'] }}
                          >
                            {otherEntity?.name?.charAt(0) || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{otherEntity?.name || 'Unknown'}</div>
                            <div className="text-[10px] text-muted-foreground">{relationship.label || relationship.type}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                    {connections.length > 3 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full mt-2 text-xs"
                        onClick={() => setActiveTab('connections')}
                      >
                        View all {connections.length} connections
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="p-4 space-y-4 mt-0">
            {Object.entries(connectionsByType).map(([type, conns]) => (
              <div key={type}>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                  {type.replace(/_/g, ' ')} ({conns.length})
                </h4>
                <div className="space-y-1">
                  {conns.map(({ relationship, otherEntity, direction, evidence }) => (
                    <div 
                      key={relationship.id}
                      className="p-2 rounded border border-transparent hover:border-border hover:bg-muted/30 cursor-pointer transition-all"
                      onClick={() => otherEntity && onSelectEntity?.(otherEntity.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {direction === 'outgoing' ? '→' : '←'}
                        </span>
                        <div 
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px]"
                          style={{ backgroundColor: TYPE_COLORS[otherEntity?.type || 'unknown'] }}
                        >
                          {otherEntity?.name?.charAt(0) || '?'}
                        </div>
                        <span className="text-sm font-medium flex-1 truncate">
                          {otherEntity?.name || 'Unknown'}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4">
                          {otherEntity?.type}
                        </Badge>
                      </div>
                      {evidence && (
                        <p className="text-[10px] text-muted-foreground mt-1 ml-7 line-clamp-2">
                          {evidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {connections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Link className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No connections yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                  onClick={handleResearchConnections}
                  disabled={isResearching}
                >
                  {isResearching ? (
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  ) : (
                    <Search className="w-3 h-3 mr-2" />
                  )}
                  Research Connections
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Facts Tab */}
          <TabsContent value="facts" className="p-4 space-y-3 mt-0">
            {facts.length > 0 ? (
              facts.map((fact, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm">{fact.statement}</p>
                  {fact.source && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      <FileText className="w-3 h-3" />
                      <span>{fact.source}</span>
                      {fact.sourceUrl && (
                        <a href={fact.sourceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No facts recorded</p>
                <p className="text-xs mt-1">Enrich this entity to discover facts</p>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Add a new fact
                const newFact = prompt('Enter a new fact:');
                if (newFact) {
                  setFacts([...facts, { statement: newFact }]);
                  const newDescription = description 
                    ? `${description}\n${newFact}`
                    : newFact;
                  setDescription(newDescription);
                  dispatch({
                    type: 'UPDATE_ENTITY',
                    payload: { id: entity.id, updates: { description: newDescription } }
                  });
                }
              }}
            >
              <Plus className="w-3 h-3 mr-2" />
              Add Fact
            </Button>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer Actions */}
      <div className="flex gap-2 p-3 border-t border-border">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 text-xs"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs px-3"
          onClick={handleEnrich}
          disabled={isEnriching}
          title="Enrich with AI"
        >
          {isEnriching ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs px-3"
          onClick={handleResearchConnections}
          disabled={isResearching}
          title="Research connections"
        >
          {isResearching ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Search className="w-3 h-3" />
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs px-3 text-destructive hover:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
