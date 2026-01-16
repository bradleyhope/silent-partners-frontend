/**
 * Silent Partners - Network Canvas
 * 
 * D3-powered network visualization with authentic Mark Lombardi style.
 * 
 * Lombardi Visual Language:
 * - Hollow circles for organizations/institutions
 * - Solid black dots for individuals/people  
 * - Elegant curved arcs (ship's curves)
 * - Arrows showing direction of money/influence flow
 * - Text labels ON the curved lines (using SVG textPath)
 * - Dashed lines for suspected/unconfirmed relationships
 * - Thin, delicate black ink on cream paper
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

  // Generate Lombardi-style curved path (ship's curve)
  // More pronounced arc for the authentic Lombardi look
  const generateCurvedPath = useCallback((source: SimulationNode, target: SimulationNode, forArrow = false): string => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // More pronounced curve (0.6 instead of 0.8 for tighter arcs)
    const dr = dist * 0.7;
    // Deterministic sweep direction based on comparing source and target IDs
    const sweep = source.id < target.id ? 1 : 0;
    
    if (forArrow) {
      // For arrows, we need to stop short of the target node
      const nodeRadius = 8;
      const angle = Math.atan2(dy, dx);
      const endX = target.x - Math.cos(angle) * (nodeRadius + 2);
      const endY = target.y - Math.sin(angle) * (nodeRadius + 2);
      return `M${source.x},${source.y}A${dr},${dr} 0 0,${sweep} ${endX},${endY}`;
    }
    
    return `M${source.x},${source.y}A${dr},${dr} 0 0,${sweep} ${target.x},${target.y}`;
  }, []);

  // Main D3 rendering
  useEffect(() => {
    if (!svgRef.current || network.entities.length === 0) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensions;

    svg.selectAll('*').remove();

    // Add defs for arrow markers
    const defs = svg.append('defs');
    
    // Arrow marker for Lombardi style
    defs.append('marker')
      .attr('id', 'arrow-lombardi')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', themeConfig.linkStroke);

    // Arrow marker for default/dark themes
    defs.append('marker')
      .attr('id', 'arrow-default')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-3L8,0L0,3')
      .attr('fill', themeConfig.linkStroke);

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
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
        .id((d) => d.id)
        .distance(180) // Slightly more distance for cleaner layout
        .strength(0.25))
      .force('charge', d3.forceManyBody().strength(-500)) // Stronger repulsion
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));

    simulationRef.current = simulation;

    const linkGroup = g.append('g').attr('class', 'links');
    
    // Determine if we're in Lombardi mode
    const isLombardiMode = theme === 'lombardi';
    const lineWidth = isLombardiMode ? 1 : 1.5;
    const arrowMarkerId = isLombardiMode ? 'arrow-lombardi' : 'arrow-default';
    
    // Create path elements for links
    const linkPaths = linkGroup.selectAll('path.link-path')
      .data(links)
      .join('path')
      .attr('class', 'link-path')
      .attr('id', (d, i) => `link-path-${i}`)
      .attr('fill', 'none')
      .attr('stroke', themeConfig.linkStroke)
      .attr('stroke-width', lineWidth)
      .attr('stroke-opacity', isLombardiMode ? 0.9 : 0.6)
      .attr('stroke-dasharray', (d) => {
        if (d.status === 'suspected') return '4,4';
        if (d.status === 'former') return '2,3';
        return 'none';
      })
      .attr('marker-end', `url(#${arrowMarkerId})`);

    // Create invisible hitboxes for hover detection on links
    const linkHitboxes = linkGroup.selectAll('path.hitbox')
      .data(links)
      .join('path')
      .attr('class', 'hitbox')
      .attr('fill', 'none')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 15)
      .style('cursor', 'pointer');

    // Text labels ON the curved path (Lombardi style)
    // Create text elements that follow the path
    const linkLabelsGroup = linkGroup.selectAll('text.link-label')
      .data(links.filter((l) => l.label))
      .join('text')
      .attr('class', 'link-label')
      .attr('font-family', isLombardiMode ? "'Source Serif 4', Georgia, serif" : "'IBM Plex Mono', monospace")
      .attr('font-size', isLombardiMode ? '10px' : '9px')
      .attr('fill', themeConfig.linkLabelText)
      .attr('opacity', showAllLabels ? 1 : 0)
      .attr('pointer-events', 'none');

    // Add textPath to make text follow the curve
    linkLabelsGroup.each(function(d, i) {
      const textEl = d3.select(this);
      textEl.selectAll('*').remove();
      
      // Find the index of this link in the full links array
      const linkIndex = links.findIndex(l => l.id === d.id);
      
      textEl.append('textPath')
        .attr('href', `#link-path-${linkIndex}`)
        .attr('startOffset', '50%')
        .attr('text-anchor', 'middle')
        .style('dominant-baseline', 'text-after-edge')
        .text(d.label || '');
    });

    // Click to select relationship
    linkHitboxes
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
        linkPaths.filter((l) => l.id === d.id)
          .attr('stroke', '#B8860B')
          .attr('stroke-width', lineWidth + 1)
          .attr('stroke-opacity', 1);
        linkLabelsGroup.filter((l) => l.id === d.id)
          .attr('opacity', 1);
      })
      .on('mouseleave', function(event, d) {
        linkPaths.filter((l) => l.id === d.id)
          .attr('stroke', themeConfig.linkStroke)
          .attr('stroke-width', lineWidth)
          .attr('stroke-opacity', isLombardiMode ? 0.9 : 0.6);
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
          return isHollowNode(d.type) ? 10 : 5;
        }
        return 8 + (d.importance || 5) * 0.5;
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
        if (d.id === selectedEntityId) return 3;
        if (isLombardiMode) return isHollowNode(d.type) ? 1.5 : 0;
        return useColors ? 2 : 1.5;
      })
      .attr('opacity', 1);

    // Node labels - positioned beside the node (Lombardi style)
    // Multi-line support for additional info like dates/titles
    nodeContainers.each(function(d) {
      const container = d3.select(this);
      const nodeRadius = isLombardiMode ? (isHollowNode(d.type) ? 10 : 5) : 8 + (d.importance || 5) * 0.5;
      
      // Position label to the right of the node
      const labelGroup = container.append('g')
        .attr('class', 'label-group')
        .attr('transform', `translate(${nodeRadius + 6}, 0)`);
      
      // Main name
      labelGroup.append('text')
        .attr('class', 'node-name')
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('font-family', isLombardiMode ? "'Source Serif 4', Georgia, serif" : "'Source Sans 3', sans-serif")
        .attr('font-size', isLombardiMode ? '11px' : '11px')
        .attr('font-weight', isLombardiMode ? '400' : '500')
        .attr('fill', themeConfig.textColor)
        .text(d.name);
      
      // Additional info (description) on second line if available
      if (d.description && isLombardiMode) {
        // Truncate description for display
        const shortDesc = d.description.length > 30 
          ? d.description.substring(0, 30) + '...' 
          : d.description;
        
        labelGroup.append('text')
          .attr('class', 'node-desc')
          .attr('dy', '1.5em')
          .attr('text-anchor', 'start')
          .attr('font-family', "'Source Serif 4', Georgia, serif")
          .attr('font-size', '9px')
          .attr('font-style', 'italic')
          .attr('fill', themeConfig.textColor)
          .attr('opacity', 0.7)
          .text(shortDesc);
      }
    });

    nodeContainers.on('click', (event, d) => {
      event.stopPropagation();
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        setCardPosition({
          x: svgRect.left + d.x,
          y: svgRect.top + d.y
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
        return generateCurvedPath(source, target, true);
      });

      linkHitboxes.attr('d', (d) => {
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
      ref={containerRef} 
      className={`flex-1 relative overflow-hidden transition-colors duration-300 ${showDotPattern ? 'canvas-container' : ''}`}
      style={{ backgroundColor: themeConfig.background }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
      
      {/* Zoom Controls */}
      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/90 hover:bg-card"
          onClick={() => {
            if (svgRef.current && zoomRef.current) {
              d3.select(svgRef.current).transition().duration(300).call(
                zoomRef.current.scaleBy, 1.3
              );
            }
          }}
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/90 hover:bg-card"
          onClick={() => {
            if (svgRef.current && zoomRef.current) {
              d3.select(svgRef.current).transition().duration(300).call(
                zoomRef.current.scaleBy, 0.7
              );
            }
          }}
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card/90 hover:bg-card"
          onClick={() => {
            if (svgRef.current && zoomRef.current) {
              const nodeGs = svgRef.current.querySelectorAll('g.node');
              if (nodeGs.length === 0) return;
              
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
              nodeGs.forEach((node) => {
                const transform = node.getAttribute('transform');
                if (transform) {
                  const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
                  if (match) {
                    const x = parseFloat(match[1]);
                    const y = parseFloat(match[2]);
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  }
                }
              });
              
              const padding = 50;
              minX -= padding;
              minY -= padding;
              maxX += padding;
              maxY += padding;
              
              const boxWidth = maxX - minX;
              const boxHeight = maxY - minY;
              const { width, height } = dimensions;
              
              const scale = Math.min(width / boxWidth, height / boxHeight, 1);
              const centerX = (minX + maxX) / 2;
              const centerY = (minY + maxY) / 2;
              
              const transform = d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(scale)
                .translate(-centerX, -centerY);
              
              d3.select(svgRef.current).transition().duration(500).call(
                zoomRef.current.transform, transform
              );
            }
          }}
          title="Reset Zoom"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Minimap - hidden on mobile */}
      <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-24 sm:w-32 h-auto sm:h-24 bg-card/80 border border-border rounded shadow-sm opacity-50 hidden sm:block">
        <div className="text-[8px] sm:text-[9px] text-muted-foreground p-1 font-mono">
          {network.entities.length} entities · {network.relationships.length} connections
        </div>
      </div>

      {/* Entity Card */}
      {selectedEntityId && cardPosition && (() => {
        const selectedEntity = network.entities.find(e => e.id === selectedEntityId);
        if (!selectedEntity) return null;
        return (
          <EntityCard
            entity={selectedEntity}
            position={cardPosition}
            onClose={() => {
              selectEntity(null);
              setCardPosition(null);
            }}
          />
        );
      })()}

      {/* Relationship Card */}
      {selectedRelationship && relationshipCardPosition && (
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
      )}
    </div>
  );
}
