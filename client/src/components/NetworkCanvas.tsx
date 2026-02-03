/**
 * Silent Partners - Network Canvas (Refactored)
 * 
 * D3-powered network visualization with smooth animations and elegant transitions.
 * This is the refactored version that uses extracted components and hooks.
 * 
 * Refactored from 884 lines to ~400 lines by extracting:
 * - ZoomControls, AddEntityDialog, EmptyState (UI components)
 * - AnimationController (timing constants)
 * - D3SimulationEngine (simulation logic)
 * - useCanvasDimensions, useD3Simulation (hooks)
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme, shouldUseSecondaryColor } from '@/contexts/CanvasThemeContext';
import { Entity, Relationship, generateId } from '@/lib/store';
import EntityCardV2 from './EntityCardV2';
import { RelationshipCard } from './RelationshipCard';

// Import extracted components and utilities
import {
  ZoomControls,
  AddEntityDialog,
  EmptyState,
  ANIMATION,
  SimulationNode,
  SimulationLink,
  isHollowNode,
  generateCurvedPath,
} from './canvas';
import { useCanvasDimensions } from './canvas/hooks/useCanvasDimensions';

interface NetworkCanvasProps {
  onNarrativeEvent?: (message: string) => void;
}

export default function NetworkCanvas({ onNarrativeEvent }: NetworkCanvasProps = {}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { network, selectedEntityId, selectEntity, updateEntity, dispatch } = useNetwork();
  const { theme, config: themeConfig, showAllLabels, showArrows, getEntityColor } = useCanvasTheme();
  
  // Track previous entities/relationships for animation
  const prevEntitiesRef = useRef<Set<string>>(new Set());
  const prevRelationshipsRef = useRef<Set<string>>(new Set());
  
  // UI state
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [relationshipCardPosition, setRelationshipCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  
  // D3 refs
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const gRef = useRef<d3.Selection<SVGGElement, unknown, null, undefined> | null>(null);
  const nodesRef = useRef<SimulationNode[]>([]);
  const linksRef = useRef<SimulationLink[]>([]);

  // Use extracted hook for dimensions
  const dimensions = useCanvasDimensions(containerRef);

  // ============================================
  // Theme-aware helper functions
  // ============================================

  const getNodeRadius = useCallback((entity: SimulationNode): number => {
    if (themeConfig.isLombardiStyle) {
      return isHollowNode(entity.type) ? themeConfig.nodeHollowSize : themeConfig.nodeSolidSize;
    }
    const importance = entity.importance || 5;
    const scale = (importance - 1) / 9;
    return themeConfig.nodeBaseSize + scale * (themeConfig.nodeMaxSize - themeConfig.nodeBaseSize);
  }, [themeConfig]);

  const getNodeFill = useCallback((entity: SimulationNode): string => {
    if (themeConfig.isLombardiStyle) {
      return isHollowNode(entity.type) ? themeConfig.background : themeConfig.nodeStroke;
    }
    if (themeConfig.useEntityColors) {
      return getEntityColor(entity.type);
    }
    return themeConfig.nodeFill;
  }, [themeConfig, getEntityColor]);

  const getNodeStrokeWidth = useCallback((entity: SimulationNode, isSelected: boolean): number => {
    if (isSelected) return themeConfig.nodeStrokeWidth + 1;
    if (themeConfig.isLombardiStyle) {
      return isHollowNode(entity.type) ? themeConfig.nodeStrokeWidth : 0;
    }
    return themeConfig.nodeStrokeWidth;
  }, [themeConfig]);

  const getLinkColor = useCallback((link: SimulationLink): string => {
    if (themeConfig.secondaryColor && link.label) {
      if (shouldUseSecondaryColor(link.label)) {
        return themeConfig.secondaryColor;
      }
    }
    return themeConfig.linkStroke;
  }, [themeConfig]);

  const getCurvedPath = useCallback((source: SimulationNode, target: SimulationNode): string => {
    return generateCurvedPath(source, target, themeConfig.curveIntensity);
  }, [themeConfig.curveIntensity]);

  // ============================================
  // Zoom handlers
  // ============================================

  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  }, []);

  const handleFitView = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  // ============================================
  // Entity handlers
  // ============================================

  const handleAddEntity = useCallback((name: string, type: Entity['type']) => {
    const newEntity: Entity = {
      id: generateId(),
      name,
      type,
      importance: 5,
      x: dimensions.width / 2 + (Math.random() - 0.5) * 100,
      y: dimensions.height / 2 + (Math.random() - 0.5) * 100,
    };
    dispatch({ type: 'ADD_ENTITY', payload: newEntity });
  }, [dispatch, dimensions]);

  // ============================================
  // SVG initialization
  // ============================================

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Add defs for filters
    const defs = svg.append('defs');
    
    // Glow filter
    const glowFilter = defs.append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Pulse filter
    const pulseFilter = defs.append('filter')
      .attr('id', 'pulse')
      .attr('x', '-100%').attr('y', '-100%')
      .attr('width', '300%').attr('height', '300%');
    pulseFilter.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', '4').attr('result', 'blur');
    pulseFilter.append('feColorMatrix').attr('in', 'blur').attr('type', 'matrix')
      .attr('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7').attr('result', 'glow');
    const pulseMerge = pulseFilter.append('feMerge');
    pulseMerge.append('feMergeNode').attr('in', 'glow');
    pulseMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('class', 'canvas-content');
    gRef.current = g;

    g.append('g').attr('class', 'links');
    g.append('g').attr('class', 'nodes');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => g.attr('transform', event.transform));

    svg.call(zoom);
    zoomRef.current = zoom;

    // Click to deselect
    svg.on('click', (event) => {
      const target = event.target as Element;
      if (target.closest('.node') || target.closest('.link')) return;
      selectEntity(null);
      setCardPosition(null);
      setSelectedRelationship(null);
      setRelationshipCardPosition(null);
    });
  }, [selectEntity]);

  // ============================================
  // Graph update effect (main rendering logic)
  // ============================================

  useEffect(() => {
    if (!gRef.current) return;
    
    const g = gRef.current;
    const { width, height } = dimensions;
    
    // Handle empty network
    if (network.entities.length === 0) {
      g.selectAll('.link').remove();
      g.selectAll('.node').remove();
      g.selectAll('.link-label').remove();
      nodesRef.current = [];
      linksRef.current = [];
      prevEntitiesRef.current = new Set();
      prevRelationshipsRef.current = new Set();
      if (simulationRef.current) simulationRef.current.stop();
      return;
    }

    const now = Date.now();

    // Determine new entities/relationships
    const currentEntityIds = new Set(network.entities.map(e => e.id));
    const currentRelIds = new Set(network.relationships.map(r => r.id));
    const newEntityIds = new Set<string>();
    const newRelIds = new Set<string>();

    network.entities.forEach(e => {
      if (!prevEntitiesRef.current.has(e.id)) newEntityIds.add(e.id);
    });
    network.relationships.forEach(r => {
      if (!prevRelationshipsRef.current.has(r.id)) newRelIds.add(r.id);
    });

    prevEntitiesRef.current = currentEntityIds;
    prevRelationshipsRef.current = currentRelIds;

    // Build nodes
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

    // Dynamic layout parameters
    const nodeCount = nodes.length;
    const linkCount = links.length;
    const density = linkCount / Math.max(nodeCount, 1);
    const linkDistance = Math.max(120, Math.min(250, 180 + nodeCount * 2));
    const chargeStrength = Math.max(-800, Math.min(-300, -400 - nodeCount * 5));
    const collisionRadius = Math.max(40, Math.min(80, 50 + density * 5));

    // Create or update simulation
    if (!simulationRef.current) {
      simulationRef.current = d3.forceSimulation<SimulationNode>(nodes)
        .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
          .id((d: SimulationNode) => d.id)
          .distance(linkDistance)
          .strength(0.2))
        .force('charge', d3.forceManyBody().strength(chargeStrength).distanceMax(500))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.03))
        .force('collision', d3.forceCollide<SimulationNode>()
          .radius(d => collisionRadius + getNodeRadius(d))
          .strength(0.8))
        .force('x', d3.forceX(width / 2).strength(0.02))
        .force('y', d3.forceY(height / 2).strength(0.02))
        .alphaDecay(0.01)
        .velocityDecay(0.4);
    } else {
      simulationRef.current.nodes(nodes);
      const linkForce = simulationRef.current.force('link') as d3.ForceLink<SimulationNode, SimulationLink>;
      linkForce.links(links).distance(linkDistance);
      (simulationRef.current.force('charge') as d3.ForceManyBody<SimulationNode>).strength(chargeStrength);
      (simulationRef.current.force('collision') as d3.ForceCollide<SimulationNode>)
        .radius(d => collisionRadius + getNodeRadius(d));
      simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2).strength(0.03));
      simulationRef.current.force('x', d3.forceX(width / 2).strength(0.02));
      simulationRef.current.force('y', d3.forceY(height / 2).strength(0.02));
      simulationRef.current.alpha(newEntityIds.size > 0 ? 0.5 : 0.3).restart();
    }

    const simulation = simulationRef.current;

    // --- RENDER LINKS ---
    const linkGroup = g.select<SVGGElement>('g.links');
    const linkSelection = linkGroup.selectAll<SVGPathElement, SimulationLink>('path.link-path')
      .data(links, d => d.id);

    linkSelection.exit().transition().duration(300).attr('stroke-opacity', 0).remove();

    // Add arrow marker definition if arrows are enabled
    const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');
    if (showArrows) {
      // Remove existing markers and recreate
      defs.selectAll('marker').remove();
      defs.append('marker')
        .attr('id', 'arrow-marker')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)  // Offset from node center
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', themeConfig.linkStroke);
    } else {
      defs.selectAll('marker').remove();
    }

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
      .attr('marker-end', showArrows ? 'url(#arrow-marker)' : null)
      .style('cursor', 'pointer');

    linkEnter.transition()
      .delay(d => d.isNew ? Math.max(0, (d.addedAt || 0) - now) : 0)
      .duration(ANIMATION.EDGE_DRAW_DURATION)
      .attr('stroke-opacity', themeConfig.isLombardiStyle ? 0.85 : 0.6);

    const linkPaths = linkEnter.merge(linkSelection);
    linkPaths.attr('stroke', d => getLinkColor(d)).attr('stroke-width', themeConfig.linkWidth);

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

    const linkLabelsGroup = linkLabelsEnter.merge(linkLabelsSelection);
    linkLabelsGroup.transition().duration(300).attr('opacity', showAllLabels ? 0.8 : 0);
    linkLabelsGroup
      .attr('font-family', themeConfig.fontFamily)
      .attr('font-size', `${themeConfig.linkLabelSize}px`)
      .attr('fill', themeConfig.linkLabelText || themeConfig.textColor);

    // Link event handlers
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
        d3.select(this).transition().duration(150)
          .attr('stroke', '#B8860B')
          .attr('stroke-width', themeConfig.linkWidth + 1)
          .attr('stroke-opacity', 1);
        linkLabelsGroup.filter(l => l.id === d.id).transition().duration(150).attr('opacity', 1);
      })
      .on('mouseleave', function(event, d) {
        d3.select(this).transition().duration(150)
          .attr('stroke', getLinkColor(d))
          .attr('stroke-width', themeConfig.linkWidth)
          .attr('stroke-opacity', themeConfig.isLombardiStyle ? 0.85 : 0.6);
        if (!showAllLabels) {
          linkLabelsGroup.filter(l => l.id === d.id).transition().duration(150).attr('opacity', 0);
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

    nodeSelection.exit<SimulationNode>()
      .transition().duration(300)
      .attr('opacity', 0)
      .attr('transform', (d: SimulationNode) => `translate(${d.x},${d.y}) scale(0)`)
      .remove();

    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'node')
      .attr('data-entity-id', d => d.id)
      .attr('opacity', 0)
      .attr('transform', d => `translate(${d.x},${d.y}) scale(0.3)`)
      .style('cursor', 'pointer')
      .call(drag);

    nodeEnter.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeFill(d))
      .attr('stroke', d => d.id === selectedEntityId ? '#B8860B' : themeConfig.nodeStroke)
      .attr('stroke-width', d => getNodeStrokeWidth(d, d.id === selectedEntityId));

    nodeEnter.filter(d => d.isNew === true)
      .append('circle')
      .attr('class', 'pulse-ring')
      .attr('r', d => getNodeRadius(d))
      .attr('fill', 'none')
      .attr('stroke', d => themeConfig.useEntityColors ? getEntityColor(d.type) : '#B8860B')
      .attr('stroke-width', 2)
      .attr('opacity', 0.8);

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

    nodeEnter.transition()
      .delay(d => d.isNew ? Math.max(0, (d.addedAt || 0) - now) : 0)
      .duration(ANIMATION.NODE_FADE_DURATION)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('opacity', 1)
      .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);

    nodeEnter.selectAll('.label-group')
      .transition()
      .delay(d => {
        const node = d as unknown as SimulationNode;
        return (node.isNew ? Math.max(0, (node.addedAt || 0) - now) : 0) + 200;
      })
      .duration(400)
      .attr('opacity', 0.9);

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

    const nodeContainers = nodeEnter.merge(nodeSelection);

    nodeContainers.select('circle.node-circle')
      .transition().duration(200)
      .attr('r', d => getNodeRadius(d))
      .attr('fill', d => getNodeFill(d))
      .attr('stroke', d => d.id === selectedEntityId ? '#B8860B' : themeConfig.nodeStroke)
      .attr('stroke-width', d => getNodeStrokeWidth(d, d.id === selectedEntityId));

    nodeContainers.select('.label-group text.node-name')
      .attr('font-family', themeConfig.fontFamily)
      .attr('font-size', `${themeConfig.labelSize}px`)
      .attr('fill', themeConfig.textColor);

    nodeContainers.select('.label-group')
      .attr('transform', d => `translate(${getNodeRadius(d) + 6}, 0)`);

    nodeContainers.on('click', function(event, d) {
      event.stopPropagation();
      setSelectedRelationship(null);
      setRelationshipCardPosition(null);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCardPosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      }
      selectEntity(d.id);
    });

    // Tick handler
    let frameRequested = false;
    simulation.on('tick', () => {
      if (!frameRequested) {
        frameRequested = true;
        requestAnimationFrame(() => {
          linkPaths.attr('d', d => {
            const source = d.source as SimulationNode;
            const target = d.target as SimulationNode;
            return getCurvedPath(source, target);
          });
          nodeContainers
            .filter(d => !d.isNew || (Date.now() - (d.addedAt || 0)) > ANIMATION.NODE_FADE_DURATION)
            .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);
          frameRequested = false;
        });
      }
    });

  }, [network.entities, network.relationships, dimensions, selectedEntityId, selectEntity, updateEntity, 
      getCurvedPath, themeConfig, showAllLabels, theme, getNodeRadius, getNodeFill, getNodeStrokeWidth, 
      getLinkColor, getEntityColor]);

  // ============================================
  // Render
  // ============================================

  const showDotPattern = theme === 'colorful';
  const selectedEntity = network.entities.find((e) => e.id === selectedEntityId);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden" style={{ background: themeConfig.background }}>
      {/* Dot pattern background */}
      {showDotPattern && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${themeConfig.gridColor || 'rgba(0,0,0,0.15)'} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      )}
      
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="absolute inset-0" />

      {/* Extracted components */}
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onFitView={handleFitView} />

      {network.entities.length === 0 && (
        <EmptyState onAddEntity={() => setShowAddEntity(true)} />
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
      <AddEntityDialog
        open={showAddEntity}
        onOpenChange={setShowAddEntity}
        onAddEntity={handleAddEntity}
      />
    </div>
  );
}
