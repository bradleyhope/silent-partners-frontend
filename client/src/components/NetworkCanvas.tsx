/**
 * Silent Partners - Network Canvas
 * 
 * D3-powered network visualization with Lombardi-style curved connections.
 * Design: Archival Investigator aesthetic with subtle paper texture.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { useNetwork } from '@/contexts/NetworkContext';
import { Entity, Relationship, entityColors } from '@/lib/store';

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
  const { network, selectedEntityId, selectEntity, updateEntity } = useNetwork();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
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
  const generateCurvedPath = useCallback((source: SimulationNode, target: SimulationNode): string => {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dr = Math.sqrt(dx * dx + dy * dy) * 0.8;
    const sweep = Math.random() > 0.5 ? 1 : 0;
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
      .attr('stroke', '#888888')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)
      .attr('stroke-dasharray', (d) => {
        if (d.status === 'suspected') return '5,5';
        if (d.status === 'former') return '2,4';
        return 'none';
      });

    const linkLabels = linkGroup.selectAll('text')
      .data(links.filter((l) => l.label))
      .join('text')
      .attr('font-family', "'IBM Plex Mono', monospace")
      .attr('font-size', '9px')
      .attr('fill', '#666666')
      .attr('text-anchor', 'middle')
      .text((d) => d.label || '');

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
      .attr('stroke', (d) => d.id === selectedEntityId ? '#B8860B' : '#ffffff')
      .attr('stroke-width', (d) => d.id === selectedEntityId ? 3 : 2)
      .attr('opacity', 0.9);

    nodeContainers.append('text')
      .attr('dy', (d) => 20 + (d.importance || 5) * 0.5)
      .attr('text-anchor', 'middle')
      .attr('font-family', "'Source Sans 3', sans-serif")
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('fill', '#2A2A2A')
      .text((d) => d.name);

    nodeContainers.on('click', (event, d) => {
      event.stopPropagation();
      console.log('Node clicked:', d.id, d.name);
      selectEntity(d.id);
    });

    svg.on('click', () => {
      selectEntity(null);
    });

    simulation.on('tick', () => {
      linkPaths.attr('d', (d) => {
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
  }, [network.entities, network.relationships, dimensions, selectedEntityId, selectEntity, updateEntity, generateCurvedPath]);

  if (network.entities.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center canvas-container"
      >
        <div className="text-center max-w-md px-8">
          <h2 className="font-display text-2xl text-foreground/80 mb-3">
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
    <div ref={containerRef} className="flex-1 canvas-container relative overflow-hidden">
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
    </div>
  );
}
