/**
 * Silent Partners - Share View
 * 
 * Read-only view of a shared network.
 * Users can explore the network but cannot edit it.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Entity, Relationship, Network } from '@/lib/store';
import { useCanvasTheme } from '@/contexts/CanvasThemeContext';
import { toast } from 'sonner';
import { ZoomIn, ZoomOut, Maximize2, Info, X, ExternalLink, Download } from 'lucide-react';
import pako from 'pako';

// Node type for D3 simulation
interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: Entity['type'];
  description?: string;
  importance?: number;
}

// Link type for D3 simulation
interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  id: string;
  type?: string;
  label?: string;
}

// Decode network from URL data parameter
function decodeNetworkFromUrl(data: string): Network | null {
  try {
    // Try base64 + gzip first
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const decompressed = pako.inflate(bytes, { to: 'string' });
    return JSON.parse(decompressed);
  } catch {
    try {
      // Fallback to plain base64
      const decoded = atob(data);
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}

export default function ShareView() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [network, setNetwork] = useState<Network | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<{
    relationship: Relationship;
    source: Entity | undefined;
    target: Entity | undefined;
  } | null>(null);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const { themeConfig } = useCanvasTheme();
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Load network from URL
  useEffect(() => {
    const loadNetwork = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check for data in URL query params
        const urlParams = new URLSearchParams(window.location.search);
        const data = urlParams.get('data');
        
        if (data) {
          const decoded = decodeNetworkFromUrl(data);
          if (decoded) {
            setNetwork(decoded);
          } else {
            setError('Invalid share link');
          }
        } else if (params.id) {
          // Try to load from API (future feature)
          setError('Share ID not found. This link may have expired.');
        } else {
          setError('No network data provided');
        }
      } catch (err) {
        console.error('Failed to load shared network:', err);
        setError('Failed to load network');
      } finally {
        setLoading(false);
      }
    };
    
    loadNetwork();
  }, [params.id]);

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !network || network.entities.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create nodes and links
    const nodes: SimulationNode[] = network.entities.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      description: e.description,
      importance: e.importance,
    }));

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    const links: SimulationLink[] = network.relationships
      .filter(r => nodeMap.has(r.source) && nodeMap.has(r.target))
      .map(r => ({
        id: r.id,
        source: r.source,
        target: r.target,
        type: r.type,
        label: r.label,
      }));

    // Create simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius(40));

    // Create container group for zoom
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    zoomRef.current = zoom;

    // Create arrow marker
    svg.append('defs').append('marker')
      .attr('id', 'arrow-share')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', themeConfig.linkColor);

    // Create links
    const linkGroup = g.append('g').attr('class', 'links');
    
    const linkElements = linkGroup.selectAll('g')
      .data(links)
      .join('g')
      .attr('class', 'link-group')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        const rel = network.relationships.find(r => r.id === d.id);
        if (rel) {
          setSelectedRelationship({
            relationship: rel,
            source: network.entities.find(e => e.id === rel.source),
            target: network.entities.find(e => e.id === rel.target),
          });
          setCardPosition({ x: event.clientX, y: event.clientY });
          setSelectedEntity(null);
        }
      });

    // Add path for each link
    linkElements.append('path')
      .attr('class', 'link-path')
      .attr('fill', 'none')
      .attr('stroke', themeConfig.linkColor)
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrow-share)');

    // Create nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');
    
    const nodeElements = nodeGroup.selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        const entity = network.entities.find(e => e.id === d.id);
        if (entity) {
          setSelectedEntity(entity);
          setCardPosition({ x: event.clientX, y: event.clientY });
          setSelectedRelationship(null);
        }
      });

    // Add circles for nodes
    nodeElements.append('circle')
      .attr('r', d => 6 + (d.importance || 5) * 0.5)
      .attr('fill', d => {
        if (themeConfig.name === 'lombardi') {
          return d.type === 'person' ? themeConfig.nodeColor : 'transparent';
        }
        return themeConfig.entityColors[d.type] || themeConfig.nodeColor;
      })
      .attr('stroke', themeConfig.nodeColor)
      .attr('stroke-width', themeConfig.name === 'lombardi' ? 1.5 : 0);

    // Add labels
    nodeElements.append('text')
      .attr('dx', 12)
      .attr('dy', 4)
      .attr('font-size', '11px')
      .attr('fill', themeConfig.textColor)
      .text(d => d.name);

    // Update positions on tick
    simulation.on('tick', () => {
      linkElements.select('path')
        .attr('d', (d) => {
          const source = d.source as SimulationNode;
          const target = d.target as SimulationNode;
          const dx = target.x! - source.x!;
          const dy = target.y! - source.y!;
          const dr = Math.sqrt(dx * dx + dy * dy) * 2;
          return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
        });

      nodeElements.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Clear selection on background click
    svg.on('click', () => {
      setSelectedEntity(null);
      setSelectedRelationship(null);
    });

    return () => {
      simulation.stop();
    };
  }, [network, dimensions, themeConfig]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        zoomRef.current.scaleBy, 1.3
      );
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        zoomRef.current.scaleBy, 0.7
      );
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(
        zoomRef.current.transform,
        d3.zoomIdentity
      );
    }
  }, []);

  // Export as PNG
  const handleExportPng = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || !network) return;

    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', themeConfig.background);
    svgClone.insertBefore(bgRect, svgClone.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = dimensions.width * scale;
      canvas.height = dimensions.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = themeConfig.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${network.title || 'network'}.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
            toast.success('Network exported as PNG');
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [network, dimensions, themeConfig]);

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared network...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !network) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Unable to Load Network</h1>
          <p className="text-muted-foreground mb-6">{error || 'The shared network could not be found.'}</p>
          <Button onClick={() => setLocation('/')}>
            Create Your Own Network
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">{network.title || 'Shared Network'}</span>
          <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
            Read-only
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPng}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button size="sm" onClick={() => setLocation('/')}>
            <ExternalLink className="w-4 h-4 mr-1" />
            Create Your Own
          </Button>
        </div>
      </header>

      {/* Network info bar */}
      {network.description && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border">
          <p className="text-sm text-muted-foreground">{network.description}</p>
        </div>
      )}

      {/* Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ backgroundColor: themeConfig.background }}
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0"
        />

        {/* Zoom controls */}
        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleResetZoom}>
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="absolute bottom-4 right-4 bg-card/80 backdrop-blur-sm border border-border rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">
            {network.entities.length} entities · {network.relationships.length} connections
          </p>
        </div>
      </div>

      {/* Entity detail card */}
      {selectedEntity && (
        <div
          className="fixed z-50 w-72 bg-card border border-border rounded-lg shadow-xl"
          style={{
            left: Math.min(cardPosition.x + 10, window.innerWidth - 300),
            top: Math.min(cardPosition.y + 10, window.innerHeight - 200),
          }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 rounded-t-lg">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ 
                backgroundColor: themeConfig.entityColors[selectedEntity.type] || themeConfig.nodeColor 
              }} />
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {selectedEntity.type}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedEntity(null)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm">{selectedEntity.name}</h3>
            {selectedEntity.description && (
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                {selectedEntity.description}
              </p>
            )}
            {selectedEntity.importance && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Importance: {selectedEntity.importance}/10
              </p>
            )}
          </div>
        </div>
      )}

      {/* Relationship detail card */}
      {selectedRelationship && (
        <div
          className="fixed z-50 w-72 bg-card border border-border rounded-lg shadow-xl"
          style={{
            left: Math.min(cardPosition.x + 10, window.innerWidth - 300),
            top: Math.min(cardPosition.y + 10, window.innerHeight - 200),
          }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30 rounded-t-lg">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Relationship
            </span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedRelationship(null)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="p-3">
            <div className="text-center py-2 bg-muted/50 rounded-md mb-2">
              <div className="text-sm font-medium">{selectedRelationship.source?.name || 'Unknown'}</div>
              <div className="text-xs text-muted-foreground my-1">↓</div>
              <div className="text-sm font-medium">{selectedRelationship.target?.name || 'Unknown'}</div>
            </div>
            {selectedRelationship.relationship.type && (
              <p className="text-xs">
                <span className="text-muted-foreground">Type:</span>{' '}
                {selectedRelationship.relationship.type}
              </p>
            )}
            {selectedRelationship.relationship.label && (
              <p className="text-xs mt-1">
                <span className="text-muted-foreground">Label:</span>{' '}
                {selectedRelationship.relationship.label}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
