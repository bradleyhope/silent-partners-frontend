/**
 * Silent Partners - Network Canvas
 * 
 * D3-powered network visualization with smooth animations and elegant transitions.
 * Now with comprehensive theme support for multiple visual styles.
 * 
 * Animation Features:
 * - Nodes fade in smoothly with scale animation
 * - Edges animate drawing from source to target
 * - Force simulation eases nodes into position
 * - Pulsing effect on newly added nodes
 * - Smooth transitions on all updates
 */

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme, shouldUseSecondaryColor } from '@/contexts/CanvasThemeContext';
import { Entity, Relationship, entityColors, generateId } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import EntityCardV2 from './EntityCardV2';
import { RelationshipCard } from './RelationshipCard';

interface SimulationNode extends Entity {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  isNew?: boolean;
  addedAt?: number;
}

interface SimulationLink {
  id: string;
  source: SimulationNode | string;
  target: SimulationNode | string;
  type?: string;
  label?: string;
  status?: 'confirmed' | 'suspected' | 'former';
  confidence?: number;
  isNew?: boolean;
  addedAt?: number;
}

// Lombardi-style: hollow nodes for organizations, solid for people
const isHollowNode = (type: Entity['type']): boolean => {
  return ['corporation', 'organization', 'financial', 'government'].includes(type);
};

// Animation constants
const ANIMATION = {
  NODE_FADE_DURATION: 600,
  NODE_SCALE_DURATION: 400,
  EDGE_DRAW_DURATION: 800,
  PULSE_DURATION: 2000,
  STAGGER_DELAY: 100,
};

interface NetworkCanvasProps {
  onNarrativeEvent?: (message: string) => void;
}

export default function NetworkCanvas({ onNarrativeEvent }: NetworkCanvasProps = {}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { network, selectedEntityId, selectEntity, updateEntity, dispatch } = useNetwork();
  const { theme, config: themeConfig, showAllLabels, getEntityColor } = useCanvasTheme();
  
  // Track previous entities/relationships for animation
  const prevEntitiesRef = useRef<Set<string>>(new Set());
  const prevRelationshipsRef = useRef<Set<string>>(new Set());
  
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
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesRef = useRef<SimulationNode[]>([]);
  const linksRef = useRef<SimulationLink[]>([]);

  // Helper function to get node radius based on theme and entity
  const getNodeRadius = useCallback((entity: SimulationNode): number => {
    if (themeConfig.isLombardiStyle) {
      return isHollowNode(entity.type) ? themeConfig.nodeHollowSize : themeConfig.nodeSolidSize;
    }
    // Scale based on importance for non-Lombardi themes
    const importance = entity.importance || 5;
    const scale = (importance - 1) / 9; // Normalize 1-10 to 0-1
    return themeConfig.nodeBaseSize + scale * (themeConfig.nodeMaxSize - themeConfig.nodeBaseSize);
  }, [themeConfig]);

  // Helper function to get node fill color
  const getNodeFill = useCallback((entity: SimulationNode): string => {
    if (themeConfig.isLombardiStyle) {
      // Lombardi: hollow for orgs (background fill), solid for people (stroke color)
      return isHollowNode(entity.type) ? themeConfig.background : themeConfig.nodeStroke;
    }
    if (themeConfig.useEntityColors) {
      return getEntityColor(entity.type);
    }
    return themeConfig.nodeFill;
  }, [themeConfig, getEntityColor]);

  // Helper function to get node stroke width
  const getNodeStrokeWidth = useCallback((entity: SimulationNode, isSelected: boolean): number => {
    if (isSelected) return themeConfig.nodeStrokeWidth + 1;
    if (themeConfig.isLombardiStyle) {
      return isHollowNode(entity.type) ? themeConfig.nodeStrokeWidth : 0;
    }
    return themeConfig.nodeStrokeWidth;
  }, [themeConfig]);

  // Helper function to get link color (handles lombardiRed secondary color)
  const getLinkColor = useCallback((link: SimulationLink): string => {
    if (themeConfig.secondaryColor && link.label) {
      if (shouldUseSecondaryColor(link.label)) {
        return themeConfig.secondaryColor;
      }
    }
    return themeConfig.linkStroke;
  }, [themeConfig]);

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

  // Generate quadratic curved path with configurable intensity
  const generateCurvedPath = useCallback((source: SimulationNode, target: SimulationNode): string => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const midX = (source.x + target.x) / 2;
    const midY = (source.y + target.y) / 2;
    const perpX = -dy / (dist || 1);
    const perpY = dx / (dist || 1);
    
    const curveDirection = source.id < target.id ? 1 : -1;
    const curveOffset = dist * 0.15 * themeConfig.curveIntensity * curveDirection;
    
    const cpX = midX + perpX * curveOffset;
    const cpY = midY + perpY * curveOffset;
    
    return `M${source.x},${source.y}Q${cpX},${cpY} ${target.x},${target.y}`;
  }, [themeConfig.curveIntensity]);

  // Initialize SVG structure once
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add defs for animations and effects
    const defs = svg.append('defs');
    
    // Glow filter for new nodes
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    
    glowFilter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');
    
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Pulse animation filter
    const pulseFilter = defs.append('filter')
      .attr('id', 'pulse')
      .attr('x', '-100%')
      .attr('y', '-100%')
      .attr('width', '300%')
      .attr('height', '300%');
    
    pulseFilter.append('feGaussianBlur')
      .attr('in', 'SourceGraphic')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    
    pulseFilter.append('feColorMatrix')
      .attr('in', 'blur')
      .attr('type', 'matrix')
      .attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7')
      .attr('result', 'glow');
    
    const pulseMerge = pulseFilter.append('feMerge');
    pulseMerge.append('feMergeNode').attr('in', 'glow');
    pulseMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('class', 'canvas-content');
    gRef.current = g;

    // Create layer groups
    g.append('g').attr('class', 'links');
    g.append('g').attr('class', 'nodes');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // Click to deselect (only if clicking on background, not on nodes)
    svg.on('click', (event) => {
      const target = event.target as Element;
      if (target.closest('.node') || target.closest('.link')) {
        return;
      }
      selectEntity(null);
      setCardPosition(null);
      setSelectedRelationship(null);
      setRelationshipCardPosition(null);
    });

  }, [selectEntity]);

  // Update graph when data changes - with animations
  useEffect(() => {
    if (!gRef.current || network.entities.length === 0) return;

    const g = gRef.current;
    const { width, height } = dimensions;
    const now = Date.now();

    // Determine which entities/relationships are new
    const currentEntityIds = new Set(network.entities.map(e => e.id));
    const currentRelIds = new Set(network.relationships.map(r => r.id));
    const newEntityIds = new Set<string>();
    const newRelIds = new Set<string>();

    network.entities.forEach(e => {
      if (!prevEntitiesRef.current.has(e.id)) {
        newEntityIds.add(e.id);
      }
    });

    network.relationships.forEach(r => {
      if (!prevRelationshipsRef.current.has(r.id)) {
        newRelIds.add(r.id);
      }
    });

    // Update refs for next render
    prevEntitiesRef.current = currentEntityIds;
    prevRelationshipsRef.current = currentRelIds;

    // Build nodes - preserve positions for existing nodes
    const existingNodeMap = new Map(nodesRef.current.map(n => [n.id, n]));
    const nodes: SimulationNode[] = network.entities.map((e, i) => {
      const existing = existingNodeMap.get(e.id);
      const isNew = newEntityIds.has(e.id);
      
      return {
        ...e,
        x: existing?.x ?? e.x ?? width / 2 + (Math.random() - 0.5) * 100,
        y: existing?.y ?? e.y ?? height / 2 + (Math.random() - 0.5) * 100,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
        isNew,
        addedAt: isNew ? now + i * ANIMATION.STAGGER_DELAY : (existing?.addedAt ?? 0),
      };
    });
    nodesRef.current = nodes;

    const nodeMap = new Map(nodes.map(n => [n.id, n]));

    // Build links
    const links: SimulationLink[] = network.relationships
      .filter(r => nodeMap.has(r.source) && nodeMap.has(r.target))
      .map((r, i) => ({
        ...r,
        source: r.source,
        target: r.target,
        confidence: (r as any).confidence ?? 0.8,
        isNew: newRelIds.has(r.id),
        addedAt: newRelIds.has(r.id) ? now + (nodes.length + i) * ANIMATION.STAGGER_DELAY : 0,
      }));
    linksRef.current = links;

    // Update or create simulation
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<SimulationNode>(nodes)
        .force('link', d3.forceLink<SimulationLink, SimulationNode>(links)
          .id(d => d.id)
          .distance(180)
          .strength(0.15))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
        .force('collision', d3.forceCollide().radius(50))
        .alphaDecay(0.008)
        .velocityDecay(0.5);
    } else {
      simulationRef.current.nodes(nodes);
      (simulationRef.current.force('link') as d3.ForceLink<SimulationNode, SimulationLink>)
        .links(links);
      simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2).strength(0.05));
      simulationRef.current.alpha(0.3).restart();
    }

    const simulation = simulationRef.current;

    // --- RENDER LINKS ---
    const linkGroup = g.select<SVGGElement>('g.links');
    
    const linkSelection = linkGroup.selectAll<SVGPathElement, SimulationLink>('path.link-path')
      .data(links, d => d.id);

    // Remove old links
    linkSelection.exit()
      .transition()
      .duration(300)
      .attr('stroke-opacity', 0)
      .remove();

    // Add new links with animation
    const linkEnter = linkSelection.enter()
      .append('path')
      .attr('class', 'link-path')
      .attr('id', d => `link-path-${d.id}`)
      .attr('fill', 'none')
      .attr('stroke', d => getLinkColor(d))
      .attr('stroke-width', themeConfig.linkWidth)
      .attr('stroke-opacity', 0)
      .attr('stroke-dasharray', d => {
        if (d.status === 'suspected') return '4,4';
        if (d.status === 'former') return '2,3';
        const conf = d.confidence ?? 0.8;
        if (conf < 0.4) return '2,2';
        if (conf < 0.7) return '6,3';
        return 'none';
      })
      .style('cursor', 'pointer');

    // Animate new links fading in
    linkEnter
      .transition()
      .delay(d => d.isNew ? Math.max(0, (d.addedAt || 0) - now) : 0)
      .duration(ANIMATION.EDGE_DRAW_DURATION)
      .attr('stroke-opacity', themeConfig.isLombardiStyle ? 0.85 : 0.6);

    // Merge and update all links
    const linkPaths = linkEnter.merge(linkSelection);

    // Update link colors on theme change
    linkPaths
      .attr('stroke', d => getLinkColor(d))
      .attr('stroke-width', themeConfig.linkWidth);

    // Link labels
    const linkLabelsSelection = linkGroup.selectAll<SVGTextElement, SimulationLink>('text.link-label')
      .data(links.filter(l => l.label), d => d.id);

    linkLabelsSelection.exit().remove();

    const linkLabelsEnter = linkLabelsSelection.enter()
      .append('text')
      .attr('class', 'link-label')
      .attr('font-family', themeConfig.fontFamily)
      .attr('font-size', `${themeConfig.linkLabelSize}px`)
      .attr('fill', themeConfig.linkLabelText || themeConfig.textColor)
      .attr('opacity', 0)
      .attr('pointer-events', 'none');

    linkLabelsEnter.each(function(d) {
      d3.select(this).append('textPath')
        .attr('href', `#link-path-${d.id}`)
        .attr('startOffset', '50%')
        .attr('text-anchor', 'middle')
        .style('dominant-baseline', 'text-after-edge')
        .text(d.label || '');
    });

    if (showAllLabels) {
      linkLabelsEnter.transition().duration(300).attr('opacity', 0.8);
    }

    const linkLabelsGroup = linkLabelsEnter.merge(linkLabelsSelection);

    // Update link label styles on theme change
    linkLabelsGroup
      .attr('font-family', themeConfig.fontFamily)
      .attr('font-size', `${themeConfig.linkLabelSize}px`)
      .attr('fill', themeConfig.linkLabelText || themeConfig.textColor);

    // Link hover/click handlers
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
          .transition()
          .duration(150)
          .attr('stroke', '#B8860B')
          .attr('stroke-width', themeConfig.linkWidth + 1)
          .attr('stroke-opacity', 1);
        linkLabelsGroup.filter(l => l.id === d.id)
          .transition()
          .duration(150)
          .attr('opacity', 1);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('stroke', getLinkColor(d))
          .attr('stroke-width', themeConfig.linkWidth)
          .attr('stroke-opacity', themeConfig.isLombardiStyle ? 0.85 : 0.6);
        if (!showAllLabels) {
          linkLabelsGroup.filter(l => l.id === d.id)
            .transition()
            .duration(150)
            .attr('opacity', 0);
        }
      });

    // --- RENDER NODES ---
    const nodeGroup = g.select<SVGGElement>('g.nodes');

    const drag = d3.drag<SVGGElement, SimulationNode>()
      .clickDistance(5)
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

    const nodeSelection = nodeGroup.selectAll<SVGGElement, SimulationNode>('g.node')
      .data(nodes, d => d.id);

    // Remove old nodes with animation
    nodeSelection.exit()
      .transition()
      .duration(300)
      .attr('opacity', 0)
      .attr('transform', d => `translate(${d.x},${d.y}) scale(0)`)
      .remove();

    // Add new nodes with animation
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'node')
      .attr('opacity', 0)
      .attr('transform', d => `translate(${d.x},${d.y}) scale(0.3)`)
      .style('cursor', 'pointer')
      .call(drag);

    // Add circle to new nodes
    nodeEnter.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeFill(d))
      .attr('stroke', d => d.id === selectedEntityId ? '#B8860B' : themeConfig.nodeStroke)
      .attr('stroke-width', d => getNodeStrokeWidth(d, d.id === selectedEntityId));

    // Add pulse ring for new nodes
    nodeEnter.filter(d => d.isNew)
      .append('circle')
      .attr('class', 'pulse-ring')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', 'none')
      .attr('stroke', d => themeConfig.useEntityColors ? getEntityColor(d.type) : '#B8860B')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8);

    // Add labels to new nodes
    nodeEnter.each(function(d) {
      const container = d3.select(this);
      const nodeRadius = getNodeRadius(d);
      
      const labelGroup = container.append('g')
        .attr('class', 'label-group')
        .attr('transform', `translate(${nodeRadius + 6}, 0)`)
        .attr('opacity', 0);
      
      labelGroup.append('text')
        .attr('class', 'node-name')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('font-family', themeConfig.fontFamily)
        .attr('font-size', `${themeConfig.labelSize}px`)
        .attr('font-weight', '500')
        .attr('fill', themeConfig.textColor)
        .text(d.name);
    });

    // Animate new nodes appearing
    nodeEnter
      .transition()
      .delay(d => d.isNew ? Math.max(0, (d.addedAt || 0) - now) : 0)
      .duration(ANIMATION.NODE_FADE_DURATION)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('opacity', 1)
      .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);

    // Animate labels appearing after node
    nodeEnter.selectAll('.label-group')
      .transition()
      .delay(d => {
        const node = d as unknown as SimulationNode;
        return (node.isNew ? Math.max(0, (node.addedAt || 0) - now) : 0) + 200;
      })
      .duration(400)
      .attr('opacity', 0.9);

    // Animate pulse rings
    nodeEnter.selectAll('.pulse-ring')
      .transition()
      .delay(d => {
        const node = d as unknown as SimulationNode;
        return Math.max(0, (node.addedAt || 0) - now);
      })
      .duration(ANIMATION.PULSE_DURATION)
      .ease(d3.easeQuadOut)
      .attr('r', d => {
        const node = d as unknown as SimulationNode;
        return getNodeRadius(node) + 25;
      })
      .attr('opacity', 0)
      .remove();

    // Merge selections
    const nodeContainers = nodeEnter.merge(nodeSelection);

    // Update existing node styles (for theme changes and selection)
    nodeContainers.select('circle.node-circle')
      .transition()
      .duration(200)
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeFill(d))
      .attr('stroke', d => d.id === selectedEntityId ? '#B8860B' : themeConfig.nodeStroke)
      .attr('stroke-width', d => getNodeStrokeWidth(d, d.id === selectedEntityId));

    // Update label styles on theme change
    nodeContainers.select('.label-group text.node-name')
      .attr('font-family', themeConfig.fontFamily)
      .attr('font-size', `${themeConfig.labelSize}px`)
      .attr('fill', themeConfig.textColor);

    // Update label position if node size changed
    nodeContainers.select('.label-group')
      .attr('transform', d => `translate(${getNodeRadius(d) + 6}, 0)`);

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

    // Tick handler
    simulation.on('tick', () => {
      linkPaths.attr('d', d => {
        const source = d.source as SimulationNode;
        const target = d.target as SimulationNode;
        return generateCurvedPath(source, target);
      });

      // Only update transform for nodes that aren't animating in
      nodeContainers
        .filter(d => !d.isNew || (Date.now() - (d.addedAt || 0)) > ANIMATION.NODE_FADE_DURATION)
        .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);
    });

  }, [network.entities, network.relationships, dimensions, selectedEntityId, selectEntity, updateEntity, generateCurvedPath, themeConfig, showAllLabels, theme, getNodeRadius, getNodeFill, getNodeStrokeWidth, getLinkColor, getEntityColor]);

  // Show dot pattern only for colorful theme
  const showDotPattern = theme === 'colorful';

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

  const selectedEntity = network.entities.find((e) => e.id === selectedEntityId);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: themeConfig.background }}>
      {/* Dot pattern background for colorful theme */}
      {showDotPattern && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${themeConfig.gridColor || 'rgba(0,0,0,0.15)'} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      )}
      
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      />

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 z-10">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-white/90 backdrop-blur-sm shadow-sm"
          onClick={handleFitView}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Empty state - only show when no entities */}
      {network.entities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center p-8 pointer-events-auto">
            <div className="text-4xl mb-4 opacity-30">🔍</div>
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Start Your Investigation</h3>
            <p className="text-sm text-muted-foreground/70 mb-4 max-w-xs">
              Use the AI panel to research a topic, or manually add entities to begin mapping connections.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm shadow-sm"
              onClick={() => setShowAddEntity(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add First Entity
            </Button>
          </div>
        </div>
      )}

      {/* Entity card */}
      {selectedEntity && cardPosition && (
        <div
          className="absolute z-20"
          style={{
            left: Math.min(cardPosition.x, dimensions.width - 320),
            top: Math.min(cardPosition.y, dimensions.height - 200),
          }}
        >
          <EntityCardV2 
            entity={selectedEntity} 
            position={cardPosition} 
            onClose={() => selectEntity(null)}
            onAddToNarrative={onNarrativeEvent}
          />
        </div>
      )}

      {/* Relationship card */}
      {selectedRelationship && relationshipCardPosition && (
        <div
          className="absolute z-20"
          style={{
            left: Math.min(relationshipCardPosition.x, dimensions.width - 320),
            top: Math.min(relationshipCardPosition.y, dimensions.height - 200),
          }}
        >
          <RelationshipCard
            relationship={selectedRelationship}
            sourceEntity={network.entities.find(e => e.id === selectedRelationship.source)}
            targetEntity={network.entities.find(e => e.id === selectedRelationship.target)}
            position={relationshipCardPosition}
            onClose={() => {
              setSelectedRelationship(null);
              setRelationshipCardPosition(null);
            }}
          />
        </div>
      )}

      {/* Add entity dialog */}
      <Dialog open={showAddEntity} onOpenChange={setShowAddEntity}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Entity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="Enter entity name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={newEntityType} onValueChange={(v) => setNewEntityType(v as Entity['type'])}>
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
            <Button variant="outline" onClick={() => setShowAddEntity(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddEntity}>Add Entity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
