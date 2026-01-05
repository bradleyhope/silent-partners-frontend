/**
 * Silent Partners - Network Canvas
 * 
 * D3-powered network visualization with Lombardi-style curved connections.
 * Design: Archival Investigator aesthetic with subtle paper texture.
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
import { Plus } from 'lucide-react';
import EntityCard from './EntityCard';

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

export default function NetworkCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { network, selectedEntityId, selectEntity, updateEntity, dispatch } = useNetwork();
  const { config: themeConfig, showAllLabels } = useCanvasTheme();
  
  // Add entity modal state
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<Entity['type']>('person');
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);

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

  // Generate Lombardi-style curved path
  // Use deterministic sweep based on node IDs to prevent flashing
  const generateCurvedPath = useCallback((source: SimulationNode, target: SimulationNode): string => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
    // Deterministic sweep direction based on comparing source and target IDs
    const sweep = source.id < target.id ? 1 : 0;
    return `M${source.x},${source.y}A${dr},${dr} 0 0,${sweep} ${target.x},${target.y}`;
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
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

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
        .distance(150)
        .strength(0.3))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40));

    simulationRef.current = simulation;

    const linkGroup = g.append('g').attr('class', 'links');
    
    const linkPaths = linkGroup.selectAll('path')
      .data(links)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', themeConfig.linkStroke)
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', (d) => {
        if (d.status === 'suspected') return '5,5';
        if (d.status === 'former') return '2,4';
        return 'none';
      });

    // Create invisible hitboxes for hover detection on links
    const linkHitboxes = linkGroup.selectAll('path.hitbox')
      .data(links)
      .join('path')
      .attr('class', 'hitbox')
      .attr('fill', 'none')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 15) // Wider hitbox for easier hovering
      .style('cursor', 'pointer');

    // Labels hidden by default, shown on hover
    const linkLabels = linkGroup.selectAll('text')
      .data(links.filter((l) => l.label))
      .join('text')
      .attr('font-family', "'IBM Plex Mono', monospace")
      .attr('font-size', '9px')
      .attr('fill', themeConfig.linkLabelText)
      .attr('text-anchor', 'middle')
      .attr('opacity', showAllLabels ? 1 : 0) // Controlled by showAllLabels
      .attr('pointer-events', 'none')
      .text((d) => d.label || '');

    // Show label on hover
    linkHitboxes
      .on('mouseenter', function(event, d) {
        // Highlight the link
        linkPaths.filter((l) => l.id === d.id)
          .attr('stroke', '#B8860B')
          .attr('stroke-width', 2.5)
          .attr('stroke-opacity', 1);
        // Show the label
        linkLabels.filter((l) => l.id === d.id)
          .attr('opacity', 1);
      })
      .on('mouseleave', function(event, d) {
        // Reset the link
        linkPaths.filter((l) => l.id === d.id)
          .attr('stroke', themeConfig.linkStroke)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.6);
        // Hide the label (unless showAllLabels is on)
        if (!showAllLabels) {
          linkLabels.filter((l) => l.id === d.id)
            .attr('opacity', 0);
        }
      });

    const nodeGroup = g.append('g').attr('class', 'nodes');

    const drag = d3.drag<SVGGElement, SimulationNode>()
      .on('start', function(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', function(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', function(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        updateEntity(d.id, { x: d.x, y: d.y, fx: d.x, fy: d.y });
      });

    const nodeContainers = nodeGroup.selectAll<SVGGElement, SimulationNode>('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(drag);

    nodeContainers.append('circle')
      .attr('r', (d) => 8 + (d.importance || 5) * 0.5)
      .attr('fill', (d) => entityColors[d.type] || entityColors.unknown)
      .attr('stroke', (d) => d.id === selectedEntityId ? '#B8860B' : themeConfig.nodeStroke)
      .attr('stroke-width', (d) => d.id === selectedEntityId ? 3 : 2)
      .attr('opacity', 0.9);

    nodeContainers.append('text')
      .attr('dy', (d) => 20 + (d.importance || 5) * 0.5)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'Source Sans 3', sans-serif")
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', themeConfig.textColor)
      .text((d) => d.name);

    nodeContainers.on('click', (event, d) => {
      event.stopPropagation();
      console.log('Node clicked:', d.id, d.name);
      // Get screen position for the card
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
    });

    simulation.on('tick', () => {
      linkPaths.attr('d', (d) => {
        const source = d.source as SimulationNode;
        const target = d.target as SimulationNode;
        return generateCurvedPath(source, target);
      });

      // Update hitbox paths to match visible paths
      linkHitboxes.attr('d', (d) => {
        const source = d.source as SimulationNode;
        const target = d.target as SimulationNode;
        return generateCurvedPath(source, target);
      });

      linkLabels
        .attr('x', (d) => {
          const source = d.source as SimulationNode;
          const target = d.target as SimulationNode;
          return (source.x + target.x) / 2;
        })
        .attr('y', (d) => {
          const source = d.source as SimulationNode;
          const target = d.target as SimulationNode;
          return (source.y + target.y) / 2 - 5;
        });

      nodeContainers.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [network.entities, network.relationships, dimensions, selectedEntityId, selectEntity, updateEntity, generateCurvedPath, themeConfig, showAllLabels]);

  if (network.entities.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center canvas-container transition-colors duration-300"
        style={{ backgroundColor: themeConfig.background }}
      >
        <div className="text-center max-w-md px-8">
          <h2 className="font-display text-2xl mb-3" style={{ color: themeConfig.textColor }}>
            Begin Your Investigation
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            Paste an article, upload a PDF, or start adding entities manually 
            to map the hidden connections.
          </p>
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground/60 font-mono">
            <span className="w-3 h-3 rounded-full bg-[#6B8E9F]"></span> Person
            <span className="w-3 h-3 rounded-full bg-[#7BA05B] ml-2"></span> Organization
            <span className="w-3 h-3 rounded-full bg-[#C9A227] ml-2"></span> Financial
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="flex-1 canvas-container relative overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: themeConfig.background }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      />
      
      <div className="absolute bottom-4 right-4 w-32 h-24 bg-card/80 border border-border rounded shadow-sm opacity-50">
        <div className="text-[9px] text-muted-foreground p-1 font-mono">
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
    </div>
  );
}
