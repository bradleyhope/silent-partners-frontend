/**
 * Export Modal for Silent Partners
 * Creates high-quality poster-style artwork exports with optimized graph layout
 * 
 * Key features:
 * - Dedicated force simulation for export (separate from live view)
 * - Optimized spacing to prevent node clustering
 * - High-resolution canvas rendering
 * - Lombardi-style curved lines and typography
 * 
 * Updated 2026-02-02: Improved label rendering based on original working version
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme } from '@/contexts/CanvasThemeContext';
import { entityColors } from '@/lib/store';
import { toast } from 'sonner';
import * as d3 from 'd3';

interface ExportFormat {
  width: number;
  height: number;
  label: string;
}

const EXPORT_FORMATS: Record<string, ExportFormat> = {
  'print-portrait': { width: 2400, height: 3000, label: 'Print Portrait (2400×3000)' },
  'print-landscape': { width: 3000, height: 2400, label: 'Print Landscape (3000×2400)' },
  'square': { width: 2400, height: 2400, label: 'Square (2400×2400)' },
  'twitter': { width: 1200, height: 675, label: 'Twitter/X (1200×675)' },
  'instagram-square': { width: 1080, height: 1080, label: 'Instagram Square (1080×1080)' },
  'instagram-story': { width: 1080, height: 1920, label: 'Instagram Story (1080×1920)' },
  '4k': { width: 3840, height: 2160, label: '4K Landscape (3840×2160)' },
  '8k': { width: 7680, height: 4320, label: '8K Ultra HD (7680×4320)' },
};

// Lombardi color palette - matching our app's style
const LOMBARDI_COLORS = {
  background: '#F9F6EE',  // Warm cream background
  text: '#2A2A2A',        // Dark charcoal text
  textLight: '#666666',   // Lighter text for subtitles
  lines: {
    confirmed: 'rgba(26, 26, 26, 0.85)',
    suspected: 'rgba(26, 26, 26, 0.4)',
    former: 'rgba(26, 26, 26, 0.25)',
  },
  nodes: {
    person: 'rgba(249, 246, 238, 0.6)',
    corporation: 'rgba(245, 245, 245, 0.6)',
    government: 'rgba(240, 234, 214, 0.6)',
    financial: 'rgba(255, 250, 240, 0.6)',
    organization: 'rgba(248, 248, 255, 0.6)',
  }
};

interface ExportNode {
  id: string;
  name: string;
  type: string;
  importance?: number;
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface ExportLink {
  source: string | ExportNode;
  target: string | ExportNode;
  type?: string;
  label?: string;
  status?: string;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { network } = useNetwork();
  const { theme } = useCanvasTheme();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState('print-portrait');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  
  // Optimized node positions for export
  const [optimizedNodes, setOptimizedNodes] = useState<ExportNode[]>([]);
  const [optimizedLinks, setOptimizedLinks] = useState<ExportLink[]>([]);

  // Initialize from network
  useEffect(() => {
    if (open && network.title) {
      setTitle(network.title);
      setSubtitle(network.description || '');
    }
  }, [open, network.title, network.description]);

  // Get network bounds for scaling (from original working version)
  const getNetworkBounds = useCallback((nodes: ExportNode[]) => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, width: 100, height: 100 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const radius = 5 + (node.importance || 0.5) * 10;
      minX = Math.min(minX, node.x - radius);
      minY = Math.min(minY, node.y - radius);
      maxX = Math.max(maxX, node.x + radius);
      maxY = Math.max(maxY, node.y + radius);
    });

    // Add space for labels
    minY = Math.min(minY, minY - 30);
    maxY = Math.max(maxY, maxY + 40);

    return {
      minX,
      minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, []);

  // Run dedicated force simulation for export layout
  const optimizeLayout = useCallback(() => {
    if (network.entities.length === 0) return;
    
    setIsRendering(true);
    
    const formatConfig = EXPORT_FORMATS[format];
    const width = formatConfig.width;
    const height = formatConfig.height;
    
    // Calculate graph area (leaving room for title, notes, etc.)
    const graphWidth = width * 0.9;
    const graphHeight = height * 0.65;
    const graphCenterX = width / 2;
    const graphCenterY = height * 0.45;
    
    // Create nodes with initial positions spread out
    const nodeCount = network.entities.length;
    const nodes: ExportNode[] = network.entities.map((e, i) => {
      // Spread nodes in a circle initially for better convergence
      const angle = (i / nodeCount) * 2 * Math.PI;
      const radius = Math.min(graphWidth, graphHeight) * 0.3;
      return {
        id: e.id,
        name: e.name,
        type: e.type,
        importance: e.importance || 0.5,
        x: graphCenterX + Math.cos(angle) * radius,
        y: graphCenterY + Math.sin(angle) * radius,
      };
    });
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    const links: ExportLink[] = network.relationships
      .filter(r => nodeMap.has(r.source) && nodeMap.has(r.target))
      .map(r => ({
        source: r.source,
        target: r.target,
        type: r.type,
        label: r.label,
        status: r.status,
      }));
    
    // Calculate optimal forces based on network size
    const linkDistance = Math.max(120, Math.min(250, graphWidth / Math.sqrt(nodeCount)));
    const chargeStrength = -Math.max(400, Math.min(1000, 600 * Math.sqrt(nodeCount / 10)));
    const collisionRadius = Math.max(40, Math.min(80, graphWidth / nodeCount * 0.4));
    
    // Create force simulation optimized for poster layout
    const simulation = d3.forceSimulation<ExportNode>(nodes)
      .force('link', d3.forceLink<ExportNode, ExportLink>(links)
        .id(d => d.id)
        .distance(linkDistance)
        .strength(0.3))
      .force('charge', d3.forceManyBody<ExportNode>()
        .strength(chargeStrength)
        .distanceMax(graphWidth * 0.5))
      .force('collide', d3.forceCollide<ExportNode>()
        .radius(d => collisionRadius + (d.importance || 0.5) * 25)
        .strength(0.9))
      .force('center', d3.forceCenter(graphCenterX, graphCenterY))
      .force('x', d3.forceX(graphCenterX).strength(0.05))
      .force('y', d3.forceY(graphCenterY).strength(0.05))
      .alphaDecay(0.02)
      .velocityDecay(0.3);
    
    // Run simulation to completion
    simulation.stop();
    for (let i = 0; i < 300; i++) {
      simulation.tick();
    }
    
    // Constrain nodes to graph area
    const padding = 60;
    const minX = (width - graphWidth) / 2 + padding;
    const maxX = (width + graphWidth) / 2 - padding;
    const minY = height * 0.15 + padding;
    const maxY = height * 0.75 - padding;
    
    nodes.forEach(node => {
      node.x = Math.max(minX, Math.min(maxX, node.x));
      node.y = Math.max(minY, Math.min(maxY, node.y));
    });
    
    setOptimizedNodes([...nodes]);
    setOptimizedLinks(links.map(l => ({
      ...l,
      source: nodeMap.get(typeof l.source === 'string' ? l.source : l.source.id)!,
      target: nodeMap.get(typeof l.target === 'string' ? l.target : l.target.id)!,
    })));
    
    setIsRendering(false);
  }, [network, format]);

  // Optimize layout when modal opens or format changes
  useEffect(() => {
    if (open) {
      optimizeLayout();
    }
  }, [open, format, optimizeLayout]);

  // Render canvas - using technique from original working version
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || optimizedNodes.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const formatConfig = EXPORT_FORMATS[format];
    const width = formatConfig.width;
    const height = formatConfig.height;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    const colors = LOMBARDI_COLORS;
    
    // Fill background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Get network bounds for scaling
    const bounds = getNetworkBounds(optimizedNodes);
    
    // Calculate scale to fit network with proper padding (from original)
    const padding = 0.08;
    const scale = Math.min(
      width * (1 - padding * 2) / (bounds.width || 1),
      height * 0.70 / (bounds.height || 1)
    );
    
    const translateX = (width / 2) - ((bounds.minX + bounds.width / 2) * scale);
    const translateY = (height * 0.45) - ((bounds.minY + bounds.height / 2) * scale);
    
    // Draw title - LARGER with serif font
    if (title) {
      ctx.fillStyle = colors.text;
      ctx.font = `bold ${width * 0.04}px 'Garamond', 'Georgia', 'Baskerville', serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, height * 0.06);
    }
    
    // Draw subtitle with word wrapping
    if (subtitle) {
      ctx.fillStyle = colors.textLight;
      const subtitleFontSize = width * 0.018;
      ctx.font = `${subtitleFontSize}px 'Garamond', 'Georgia', 'Baskerville', serif`;
      ctx.textAlign = 'center';
      
      // Word wrap subtitle to fit within 85% of width
      const maxSubtitleWidth = width * 0.85;
      const words = subtitle.split(' ');
      let line = '';
      const subtitleLines: string[] = [];
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxSubtitleWidth && i > 0) {
          subtitleLines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      subtitleLines.push(line.trim());
      
      // Limit to 4 lines max
      const maxLines = 4;
      if (subtitleLines.length > maxLines) {
        subtitleLines.length = maxLines;
        subtitleLines[maxLines - 1] = subtitleLines[maxLines - 1].slice(0, -3) + '...';
      }
      
      // Draw each line
      const lineHeight = subtitleFontSize * 1.4;
      const startY = height * 0.09;
      subtitleLines.forEach((l, i) => {
        ctx.fillText(l, width / 2, startY + i * lineHeight);
      });
    }
    
    // Create node map for link drawing
    const nodeMap = new Map(optimizedNodes.map(n => [n.id, n]));
    
    // Draw links with Lombardi-style curves (matching original)
    const baseLineWidth = 1.5 * scale;
    ctx.lineWidth = Math.max(1, baseLineWidth);
    
    optimizedLinks.forEach(link => {
      const source = typeof link.source === 'string' ? nodeMap.get(link.source) : link.source;
      const target = typeof link.target === 'string' ? nodeMap.get(link.target) : link.target;
      
      if (!source || !target) return;
      
      // Transform coordinates
      const sx = source.x * scale + translateX;
      const sy = source.y * scale + translateY;
      const tx = target.x * scale + translateX;
      const ty = target.y * scale + translateY;
      
      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate control point for quadratic curve (matching original curvature)
      const curvature = 1.0;
      const dr = dist * curvature;
      
      ctx.beginPath();
      ctx.strokeStyle = colors.lines[link.status as keyof typeof colors.lines] || colors.lines.confirmed;
      ctx.setLineDash([]);
      
      if (link.status === 'former') {
        // Straight line for former relationships
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
      } else {
        // Draw curved line matching original
        ctx.moveTo(sx, sy);
        
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        
        // Perpendicular offset for curve
        const offsetX = -dy / (dist || 1) * dr * 0.4;
        const offsetY = dx / (dist || 1) * dr * 0.4;
        
        const controlX = midX + offsetX;
        const controlY = midY + offsetY;
        
        ctx.quadraticCurveTo(controlX, controlY, tx, ty);
      }
      
      ctx.stroke();
      
      // Draw arrowhead
      const arrowSize = 5 * scale;
      let angle;
      
      if (link.status === 'former') {
        angle = Math.atan2(ty - sy, tx - sx);
      } else {
        // Calculate angle from control point to target
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        const offsetX = -dy / (dist || 1) * dr * 0.4;
        const offsetY = dx / (dist || 1) * dr * 0.4;
        const controlX = midX + offsetX;
        const controlY = midY + offsetY;
        angle = Math.atan2(ty - controlY, tx - controlX);
      }
      
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(
        tx - arrowSize * Math.cos(angle - Math.PI / 6),
        ty - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        tx - arrowSize * Math.cos(angle + Math.PI / 6),
        ty - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = colors.lines[link.status as keyof typeof colors.lines] || colors.lines.confirmed;
      ctx.fill();
    });
    
    // Draw nodes (matching original style)
    optimizedNodes.forEach(node => {
      const x = node.x * scale + translateX;
      const y = node.y * scale + translateY;
      const radius = (5 + (node.importance || 0.5) * 10) * scale;
      
      const isHollow = ['corporation', 'organization', 'financial', 'government'].includes(node.type);
      const isUnknown = node.type === 'unknown' || !node.type;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      if (isHollow) {
        // Hollow circle with fill for organizations
        ctx.fillStyle = colors.nodes[node.type as keyof typeof colors.nodes] || colors.background;
        ctx.fill();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
      } else if (isUnknown) {
        // Half-filled circle for unknown type
        ctx.fillStyle = colors.background;
        ctx.fill();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
        // Fill right half
        ctx.beginPath();
        ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2);
        ctx.fillStyle = colors.text;
        ctx.fill();
      } else {
        // Solid circle for people
        ctx.fillStyle = colors.text;
        ctx.fill();
      }
      
      // ALWAYS draw node labels with text stroke for readability (key fix from original)
      if (showLabels) {
        const fontSize = 12 * scale;
        ctx.font = `${fontSize}px 'Garamond', 'Georgia', 'Baskerville', serif`;
        ctx.fillStyle = colors.text;
        ctx.textAlign = 'center';
        
        // Text stroke for better readability (from original)
        ctx.strokeStyle = colors.background;
        ctx.lineWidth = 3 * scale;
        ctx.strokeText(node.name, x, y + radius + fontSize + 4);
        ctx.fillText(node.name, x, y + radius + fontSize + 4);
      }
    });
    
    // Draw notes at bottom if provided
    if (notes) {
      ctx.font = `${width * 0.018}px 'Garamond', 'Georgia', 'Baskerville', serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.text;
      
      // Word wrap notes
      const maxWidth = width * 0.8;
      const words = notes.split(' ');
      let line = '';
      const lines: string[] = [];
      let y = height * 0.88;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          lines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
      
      lines.forEach((l, i) => {
        ctx.fillText(l, width / 2, y + i * (width * 0.025));
      });
    }
    
    // Draw legend
    if (showLegend) {
      const legendY = height * 0.92;
      const legendFontSize = Math.max(12, width * 0.014);
      const dotSize = Math.max(5, width * 0.005);
      
      ctx.font = `${legendFontSize}px 'Garamond', 'Georgia', 'Baskerville', serif`;
      ctx.textAlign = 'left';
      
      // Get unique entity types in the network
      const entityTypes = Array.from(new Set(optimizedNodes.map(n => n.type || 'unknown')));
      const typeLabels: Record<string, string> = {
        person: 'Person',
        corporation: 'Corporation',
        organization: 'Organization',
        financial: 'Financial',
        government: 'Government',
        unknown: 'Unknown',
      };
      
      // Calculate total legend width for centering
      let totalWidth = 0;
      entityTypes.forEach(type => {
        const label = typeLabels[type] || type;
        totalWidth += ctx.measureText(label).width + dotSize * 2 + 30;
      });
      
      let legendX = (width - totalWidth) / 2 + dotSize;
      
      entityTypes.forEach(type => {
        const isHollow = ['corporation', 'organization', 'financial', 'government'].includes(type);
        const isUnknown = type === 'unknown' || !type;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(legendX + dotSize, legendY, dotSize, 0, Math.PI * 2);
        if (isHollow) {
          ctx.fillStyle = colors.background;
          ctx.fill();
          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (isUnknown) {
          // Half-filled circle for unknown
          ctx.fillStyle = colors.background;
          ctx.fill();
          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(legendX + dotSize, legendY, dotSize, -Math.PI / 2, Math.PI / 2);
          ctx.fillStyle = colors.text;
          ctx.fill();
        } else {
          ctx.fillStyle = colors.text;
          ctx.fill();
        }
        
        // Draw label
        ctx.fillStyle = colors.textLight;
        const label = typeLabels[type] || type;
        ctx.fillText(label, legendX + dotSize * 2 + 8, legendY + dotSize / 2);
        legendX += ctx.measureText(label).width + dotSize * 2 + 30;
      });
    }
    
    // Draw watermark
    if (showWatermark) {
      ctx.fillStyle = colors.textLight;
      ctx.font = `${width * 0.02}px 'Garamond', 'Georgia', 'Baskerville', serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Created with SilentPartners.app — A Brazen Production', width / 2, height * 0.97);
    }
  }, [optimizedNodes, optimizedLinks, format, title, subtitle, notes, showLabels, showLegend, showWatermark, getNetworkBounds]);

  // Re-render when options change
  useEffect(() => {
    if (open && optimizedNodes.length > 0) {
      renderCanvas();
    }
  }, [open, optimizedNodes, renderCanvas]);

  // Download PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    renderCanvas();
    
    const link = document.createElement('a');
    const filename = (title || 'network').toLowerCase().replace(/[^a-z0-9]/g, '-') + '.png';
    link.download = filename;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    toast.success('Artwork downloaded successfully');
  };

  // Copy to clipboard
  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 1.0);
      });
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      toast.success('Image copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy image');
    }
  };

  const formatConfig = EXPORT_FORMATS[format];
  const aspectRatio = formatConfig.width / formatConfig.height;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Artwork</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Options */}
          <div className="space-y-4">
            <div>
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_FORMATS).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Network title..."
              />
            </div>
            
            <div>
              <Label>Subtitle (optional)</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Subtitle or description..."
              />
            </div>
            
            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional context or notes..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Display Options</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-labels"
                  checked={showLabels}
                  onCheckedChange={(checked) => setShowLabels(checked === true)}
                />
                <label htmlFor="show-labels" className="text-sm">Show Labels</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-legend"
                  checked={showLegend}
                  onCheckedChange={(checked) => setShowLegend(checked === true)}
                />
                <label htmlFor="show-legend" className="text-sm">Show Legend</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-watermark"
                  checked={showWatermark}
                  onCheckedChange={(checked) => setShowWatermark(checked === true)}
                />
                <label htmlFor="show-watermark" className="text-sm">Show Watermark</label>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={optimizeLayout}
              disabled={isRendering}
              className="w-full"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Optimizing Layout...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-optimize Layout
                </>
              )}
            </Button>
          </div>
          
          {/* Right: Preview */}
          <div>
            <Label className="mb-2 block">Preview</Label>
            <div 
              className="border rounded-lg overflow-hidden bg-[#F9F6EE]"
              style={{ aspectRatio }}
            >
              <canvas
                ref={canvasRef}
                style={{ 
                  width: '100%', 
                  height: '100%',
                  display: 'block'
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {optimizedNodes.length} entities, {optimizedLinks.length} relationships
            </p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={handleDownload} disabled={optimizedNodes.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
          <Button variant="outline" onClick={handleCopy} disabled={optimizedNodes.length === 0}>
            <Copy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
