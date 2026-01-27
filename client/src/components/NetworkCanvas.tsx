/**
 * Silent Partners - Network Canvas
 * 
 * D3-powered network visualization with authentic Mark Lombardi style.
 * 
 * Lombardi Visual Language:
 * - Hollow circles for organizations/institutions
 * - Solid black dots for individuals/people  
 * - Elegant curved arcs (quadratic curves)
 * - Clean, minimal aesthetic
 * - Text labels beside nodes
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme } from '@/contexts/CanvasThemeContext';
import { Entity, Relationship, entityColors, generateId } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import EntityCard from './EntityCard';
import { RelationshipCard } from './RelationshipCard';

interface SimulationNode extends Entity {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimulationLink {
  id: string;
  source: SimulationNode | string;
  target: SimulationNode | string;
  type?: string;
  label?: string;
  status?: 'confirmed' | 'suspected' | 'former';
}

// Lombardi node styles based on entity type
// People = solid dots, Organizations/Institutions = hollow circles
const isHollowNode = (type: Entity['type']): boolean => {
  return ['corporation', 'organization', 'financial', 'government'].includes(type);
};

export default function NetworkCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { network, selectedEntityId, selectEntity, updateEntity, dispatch } = useNetwork();
  const { theme, config: themeConfig, showAllLabels } = useCanvasTheme();
  
  // Add entity modal state
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<Entity['type']>('person');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [relationshipCardPosition, setRelationshipCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Generate quadratic curved path
  const generateCurvedPath = useCallback((source: SimulationNode, target: SimulationNode): string => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate control point for quadratic curve
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const perpX = -dy / (dist || 1);
    const perpY = dx / (dist || 1);
    
    // Curve offset - consistent direction based on node IDs
    const curveDirection = source.id < target.id ? 1 : -1;
    const curveOffset = dist * 0.12 * curveDirection;
    
    const cpX = midX + perpX * curveOffset;
    const cpY = midY + perpY * curveOffset;
    
    return `M${source.x},${source.y}Q${cpX},${cpY} ${target.x},${target.y}`;
  }, []);

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current || network.entities.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    const g = svg.append('g').attr('class', 'canvas-content');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .touchable(() => true)
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom)
      .on('touchstart.zoom', null)
      .call(zoom);
    zoomRef.current = zoom;

    const nodes: SimulationNode[] = network.entities.map((e) => ({
      ...e,
      x: e.x ?? width / 2 + (Math.random() - 0.5) * 200,
      y: e.y ?? height / 2 + (Math.random() - 0.5) * 200,
    }));

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    
    const links: SimulationLink[] = network.relationships
      .filter((r) => nodeMap.has(r.source) && nodeMap.has(r.target))
      .map((r) => ({
        ...r,
        source: r.source,
        target: r.target,
      }));

    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force('link', d3.forceLink<SimulationLink, SimulationNode>(links)
        .id((d) => d.id)
        .distance(200)
        .strength(0.2))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(60))
      // Slow down animation for a more pleasant, watchable experience
      .alphaDecay(0.01)  // Slower decay = longer animation (default is 0.0228)
      .velocityDecay(0.4);  // More friction = smoother movement (default is 0.4)

    simulationRef.current = simulation;

    // Expose simulation state globally for export modal
    (window as any).__SILENT_PARTNERS_STATE__ = {
      nodes,
      links,
      theme,
      themeConfig,
      getNodePositions: () => nodes.map(n => ({ id: n.id, name: n.name, type: n.type, x: n.x, y: n.y })),
    };

    const linkGroup = g.append('g').attr('class', 'links');
    
    // Determine if we're in Lombardi mode
    const isLombardiMode = theme === 'lombardi';
    const lineWidth = isLombardiMode ? 1 : 1.5;
    
    // Create single path elements for links (no duplicates)
    const linkPaths = linkGroup.selectAll('path.link-path')
      .data(links)
      .join('path')
      .attr('class', 'link-path')
      .attr('id', (d, i) => `link-path-${i}`)
      .attr('fill', 'none')
      .attr('stroke', themeConfig.linkStroke)
      .attr('stroke-width', lineWidth)
      .attr('stroke-opacity', isLombardiMode ? 0.85 : 0.5)
      .attr('stroke-dasharray', (d) => {
        if (d.status === 'suspected') return '4,4';
        if (d.status === 'former') return '2,3';
        return 'none';
      })
      .style('cursor', 'pointer');

    // Text labels ON the curved path (Lombardi style)
    const linkLabelsGroup = linkGroup.selectAll('text.link-label')
      .data(links.filter((l) => l.label))
      .join('text')
      .attr('class', 'link-label')
      .attr('font-family', isLombardiMode ? "'Source Serif 4', Georgia, serif" : "'IBM Plex Mono', monospace")
      .attr('font-size', isLombardiMode ? '9px' : '8px')
      .attr('fill', themeConfig.linkLabelText || themeConfig.textColor)
      .attr('opacity', showAllLabels ? 0.8 : 0)
      .attr('pointer-events', 'none');

    // Add textPath to make text follow the curve
    linkLabelsGroup.each(function(d) {
      const textEl = d3.select(this);
      textEl.selectAll('*').remove();
      
      const linkIndex = links.findIndex(l => l.id === d.id);
      
      textEl.append('textPath')
        .attr('href', `#link-path-${linkIndex}`)
        .attr('startOffset', '50%')
        .attr('text-anchor', 'middle')
        .style('dominant-baseline', 'text-after-edge')
        .text(d.label || '');
    });

    // Click and hover on links
    linkPaths
      .on('click', function(event, d) {
        event.stopPropagation();
        const rel = network.relationships.find(r => r.id === d.id);
        if (rel) {
          setSelectedRelationship(rel);
          setRelationshipCardPosition({ x: event.clientX, y: event.clientY });
          selectEntity(null);
          setCardPosition(null);
        }
      })
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .attr('stroke', '#B8860B')
          .attr('stroke-width', lineWidth + 1)
          .attr('stroke-opacity', 1);
        linkLabelsGroup.filter((l) => l.id === d.id)
          .attr('opacity', 1);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .attr('stroke', themeConfig.linkStroke)
          .attr('stroke-width', lineWidth)
          .attr('stroke-opacity', isLombardiMode ? 0.85 : 0.5);
        if (!showAllLabels) {
          linkLabelsGroup.filter((l) => l.id === d.id)
            .attr('opacity', 0);
        }
      });

    const nodeGroup = g.append('g').attr('class', 'nodes');

    const drag = d3.drag<SVGGElement, SimulationNode>()
      .on('start', function(event, d) {
        if (!event.active) simulation.alphaTarget(0.1).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
        d.vx = 0;
        d.vy = 0;
        updateEntity(d.id, { x: d.x, y: d.y });
      });

    const nodeContainers = nodeGroup.selectAll<SVGGElement, SimulationNode>('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(drag);

    // Lombardi-style node rendering
    const useColors = themeConfig.useEntityColors !== false;
    
    nodeContainers.append('circle')
      .attr('r', (d) => {
        // In Lombardi mode, people are smaller solid dots, orgs are larger hollow circles
        if (isLombardiMode) {
          return isHollowNode(d.type) ? 8 : 4;
        }
        return 7 + (d.importance || 5) * 0.4;
      })
      .attr('fill', (d) => {
        if (isLombardiMode) {
          // Lombardi style: hollow for orgs, solid for people
          return isHollowNode(d.type) ? themeConfig.background : themeConfig.nodeStroke;
        }
        return useColors ? (entityColors[d.type] || entityColors.unknown) : themeConfig.nodeFill;
      })
      .attr('stroke', (d) => d.id === selectedEntityId ? '#B8860B' : themeConfig.nodeStroke)
      .attr('stroke-width', (d) => {
        if (d.id === selectedEntityId) return 2.5;
        if (isLombardiMode) return isHollowNode(d.type) ? 1.2 : 0;
        return useColors ? 1.5 : 1;
      })
      .attr('opacity', 1);

    // Node labels - positioned beside the node
    nodeContainers.each(function(d) {
      const container = d3.select(this);
      const nodeRadius = isLombardiMode ? (isHollowNode(d.type) ? 8 : 4) : 7 + (d.importance || 5) * 0.4;
      
      // Position label to the right of the node
      const labelGroup = container.append('g')
        .attr('class', 'label-group')
        .attr('transform', `translate(${nodeRadius + 5}, 0)`);
      
      // Main name
      labelGroup.append('text')
        .attr('class', 'node-name')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('font-family', isLombardiMode ? "'Source Serif 4', Georgia, serif" : "'Source Sans 3', sans-serif")
        .attr('font-size', isLombardiMode ? '10px' : '10px')
        .attr('font-weight', isLombardiMode ? '400' : '500')
        .attr('fill', themeConfig.textColor)
        .attr('opacity', 0.9)
        .text(d.name);
    });

    // Node click handler
    nodeContainers.on('click', function(event, d) {
      event.stopPropagation();
      setSelectedRelationship(null);
      setRelationshipCardPosition(null);
      
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCardPosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }
      selectEntity(d.id);
    });

    svg.on('click', () => {
      selectEntity(null);
      setCardPosition(null);
      setSelectedRelationship(null);
      setRelationshipCardPosition(null);
    });

    simulation.on('tick', () => {
      linkPaths.attr('d', (d) => {
        const source = d.source as SimulationNode;
        const target = d.target as SimulationNode;
        return generateCurvedPath(source, target);
      });

      nodeContainers.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [network.entities, network.relationships, dimensions, selectedEntityId, selectEntity, updateEntity, generateCurvedPath, themeConfig, showAllLabels, theme]);

  // Only show dot pattern for default theme
  const showDotPattern = theme === 'default';

  // Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  };

  const handleFitView = () => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  // Add entity
  const handleAddEntity = () => {
    if (!newEntityName.trim()) return;
    
    const newEntity: Entity = {
      id: generateId(),
      name: newEntityName.trim(),
      type: newEntityType,
      importance: 5,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 100,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 100,
    };
    
    dispatch({ type: 'ADD_ENTITY', payload: newEntity });
    setNewEntityName('');
    setShowAddEntity(false);
  };

  if (network.entities.length === 0) {
    return (
      <div 
        ref={containerRef}
        className={`flex-1 flex items-center justify-center transition-colors duration-300 ${showDotPattern ? 'canvas-container' : ''}`}
        style={{ backgroundColor: themeConfig.background }}
      >
        <div className="text-center max-w-md px-4 sm:px-8">
          <h2 className="font-display text-xl sm:text-2xl mb-2 sm:mb-3" style={{ color: themeConfig.textColor }}>
            Begin Your Investigation
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6">
            <span className="hidden sm:inline">Paste an article, upload a PDF, or start adding entities manually to map the hidden connections.</span>
            <span className="sm:hidden">Tap the menu to load an example network or add entities manually.</span>
          </p>
          <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground/60 font-mono flex-wrap justify-center">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#6B8E9F]"></span> Person</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#7BA05B]"></span> Organization</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#C9A227]"></span> Financial</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      id="network-canvas"
      ref={containerRef} 
      className={`flex-1 relative overflow-hidden transition-colors duration-300 ${showDotPattern ? 'canvas-container' : ''}`}
      style={{ backgroundColor: themeConfig.background }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="touch-none"
      />

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-background/80 backdrop-blur-sm"
          onClick={handleFitView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Add Entity Button */}
      <Button
        variant="outline"
        size="sm"
        className="absolute bottom-4 left-4 h-8 bg-background/80 backdrop-blur-sm z-10"
        onClick={() => setShowAddEntity(true)}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Entity
      </Button>

      {/* Entity Card */}
      {selectedEntityId && cardPosition && (
        <EntityCard
          entityId={selectedEntityId}
          position={cardPosition}
          onClose={() => {
            selectEntity(null);
            setCardPosition(null);
          }}
        />
      )}

      {/* Relationship Card */}
      {selectedRelationship && relationshipCardPosition && (
        <RelationshipCard
          relationship={selectedRelationship}
          position={relationshipCardPosition}
          onClose={() => {
            setSelectedRelationship(null);
            setRelationshipCardPosition(null);
          }}
        />
      )}

      {/* Add Entity Dialog */}
      <Dialog open={showAddEntity} onOpenChange={setShowAddEntity}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Entity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="Entity name..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddEntity()}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={newEntityType} onValueChange={(v) => setNewEntityType(v as Entity['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Person</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEntity(false)}>Cancel</Button>
            <Button onClick={handleAddEntity} disabled={!newEntityName.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
