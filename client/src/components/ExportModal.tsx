/**
 * Export Modal for Silent Partners
 * Creates high-quality poster-style artwork exports that MATCH the live graph view
 * 
 * Key features:
 * - Captures actual node positions from the live SVG (no re-simulation)
 * - Exports look identical to what you see on screen
 * - High-resolution canvas rendering
 * - Lombardi-style curved lines and typography
 * 
 * Updated 2026-02-02: Fixed to capture live graph state instead of re-optimizing
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
  const { theme, config: themeConfig } = useCanvasTheme();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState('print-portrait');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showLegend, setShowLegend] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  
  // Captured node positions from live graph
  const [capturedNodes, setCapturedNodes] = useState<ExportNode[]>([]);
  const [capturedLinks, setCapturedLinks] = useState<ExportLink[]>([]);

  // Initialize from network
  useEffect(() => {
    if (open && network.title) {
      setTitle(network.title);
      setSubtitle(network.description || '');
    }
  }, [open, network.title, network.description]);

  // Capture live graph positions from the SVG DOM
  const captureLiveGraph = useCallback(() => {
    if (network.entities.length === 0) return;
    
    setIsRendering(true);
    
    // Find the main SVG element
    const svg = document.querySelector('svg.absolute.inset-0');
    if (!svg) {
      console.warn('Could not find main SVG element');
      setIsRendering(false);
      return;
    }
    
    // Get all node containers and extract their positions
    const nodeContainers = svg.querySelectorAll('g.node');
    const nodePositions = new Map<string, { x: number; y: number }>();
    
    nodeContainers.forEach((container) => {
      const transform = container.getAttribute('transform');
      if (transform) {
        // Parse transform="translate(x,y) scale(1)"
        const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
        if (match) {
          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          
          // Get entity ID from the node
          const entityId = container.getAttribute('data-entity-id');
          if (entityId) {
            nodePositions.set(entityId, { x, y });
          }
        }
      }
    });
    
    // If we couldn't get positions from data-entity-id, try matching by name
    if (nodePositions.size === 0) {
      // Alternative: match by text content
      nodeContainers.forEach((container) => {
        const transform = container.getAttribute('transform');
        const textEl = container.querySelector('text');
        if (transform && textEl) {
          const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
          if (match) {
            const x = parseFloat(match[1]);
            const y = parseFloat(match[2]);
            const name = textEl.textContent?.trim();
            
            // Find matching entity by name
            const entity = network.entities.find(e => e.name === name);
            if (entity) {
              nodePositions.set(entity.id, { x, y });
            }
          }
        }
      });
    }
    
    // Build nodes with captured positions
    const nodes: ExportNode[] = network.entities.map((e, i) => {
      const pos = nodePositions.get(e.id);
      return {
        id: e.id,
        name: e.name,
        type: e.type,
        importance: e.importance || 0.5,
        // Use captured position, or fall back to entity's stored position, or default
        x: pos?.x ?? e.x ?? 400 + (i % 5) * 100,
        y: pos?.y ?? e.y ?? 300 + Math.floor(i / 5) * 100,
      };
    });
    
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    const links: ExportLink[] = network.relationships
      .filter(r => nodeMap.has(r.source) && nodeMap.has(r.target))
      .map(r => ({
        source: nodeMap.get(r.source)!,
        target: nodeMap.get(r.target)!,
        type: r.type,
        label: r.label,
        status: r.status,
      }));
    
    setCapturedNodes(nodes);
    setCapturedLinks(links);
    setIsRendering(false);
  }, [network]);

  // Capture live graph when modal opens
  useEffect(() => {
    if (open) {
      captureLiveGraph();
    }
  }, [open, captureLiveGraph]);

  // Get network bounds for scaling
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

  // Render canvas with captured positions
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || capturedNodes.length === 0) return;
    
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
    const bounds = getNetworkBounds(capturedNodes);
    
    // Calculate scale to fit network with proper padding
    const padding = 0.08;
    const scale = Math.min(
      width * (1 - padding * 2) / (bounds.width || 1),
      height * 0.70 / (bounds.height || 1)
    );
    
    const translateX = (width / 2) - ((bounds.minX + bounds.width / 2) * scale);
    const translateY = (height * 0.45) - ((bounds.minY + bounds.height / 2) * scale);
    
    // Draw title
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
      
      const maxLines = 4;
      if (subtitleLines.length > maxLines) {
        subtitleLines.length = maxLines;
        subtitleLines[maxLines - 1] = subtitleLines[maxLines - 1].slice(0, -3) + '...';
      }
      
      const lineHeight = subtitleFontSize * 1.4;
      const startY = height * 0.09;
      subtitleLines.forEach((l, i) => {
        ctx.fillText(l, width / 2, startY + i * lineHeight);
      });
    }
    
    // Create node map for link drawing
    const nodeMap = new Map(capturedNodes.map(n => [n.id, n]));
    
    // Draw links with Lombardi-style curves
    const baseLineWidth = 1.5 * scale;
    ctx.lineWidth = Math.max(1, baseLineWidth);
    
    capturedLinks.forEach(link => {
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
      
      // Calculate control point for quadratic curve
      const curvature = 1.0;
      const dr = dist * curvature;
      
      ctx.beginPath();
      ctx.strokeStyle = colors.lines[link.status as keyof typeof colors.lines] || colors.lines.confirmed;
      ctx.setLineDash([]);
      
      if (link.status === 'former') {
        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
      } else {
        ctx.moveTo(sx, sy);
        
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        
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
    
    // Draw nodes
    capturedNodes.forEach(node => {
      const x = node.x * scale + translateX;
      const y = node.y * scale + translateY;
      const radius = (5 + (node.importance || 0.5) * 10) * scale;
      
      const isHollow = ['corporation', 'organization', 'financial', 'government'].includes(node.type);
      const isUnknown = node.type === 'unknown' || !node.type;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      if (isHollow) {
        ctx.fillStyle = colors.nodes[node.type as keyof typeof colors.nodes] || colors.background;
        ctx.fill();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
      } else if (isUnknown) {
        ctx.fillStyle = colors.background;
        ctx.fill();
        ctx.strokeStyle = colors.text;
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, radius, -Math.PI / 2, Math.PI / 2);
        ctx.fillStyle = colors.text;
        ctx.fill();
      } else {
        ctx.fillStyle = colors.text;
        ctx.fill();
      }
      
      // Draw node labels with text stroke for readability
      const fontSize = 12 * scale;
      ctx.font = `${fontSize}px 'Garamond', 'Georgia', 'Baskerville', serif`;
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      
      ctx.strokeStyle = colors.background;
      ctx.lineWidth = 3 * scale;
      ctx.strokeText(node.name, x, y + 22 * scale);
      ctx.fillText(node.name, x, y + 22 * scale);
    });
    
    // Draw notes at bottom if provided
    if (notes) {
      ctx.font = `${width * 0.018}px 'Garamond', 'Georgia', 'Baskerville', serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.text;
      
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
      
      const entityTypes = Array.from(new Set(capturedNodes.map(n => n.type || 'unknown')));
      const typeLabels: Record<string, string> = {
        person: 'Person',
        corporation: 'Corporation',
        organization: 'Organization',
        financial: 'Financial',
        government: 'Government',
        unknown: 'Unknown',
      };
      
      let totalWidth = 0;
      entityTypes.forEach(type => {
        const label = typeLabels[type] || type;
        totalWidth += ctx.measureText(label).width + dotSize * 2 + 30;
      });
      
      let legendX = (width - totalWidth) / 2 + dotSize;
      
      entityTypes.forEach(type => {
        const isHollow = ['corporation', 'organization', 'financial', 'government'].includes(type);
        const isUnknown = type === 'unknown' || !type;
        
        ctx.beginPath();
        ctx.arc(legendX + dotSize, legendY, dotSize, 0, Math.PI * 2);
        if (isHollow) {
          ctx.fillStyle = colors.background;
          ctx.fill();
          ctx.strokeStyle = colors.text;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (isUnknown) {
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
  }, [capturedNodes, capturedLinks, format, title, subtitle, notes, showLegend, showWatermark, getNetworkBounds]);

  // Re-render when options change
  useEffect(() => {
    if (open && capturedNodes.length > 0) {
      renderCanvas();
    }
  }, [open, capturedNodes, renderCanvas]);

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
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-legend"
                  checked={showLegend}
                  onCheckedChange={(checked) => setShowLegend(checked as boolean)}
                />
                <Label htmlFor="show-legend" className="cursor-pointer">Show Legend</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-watermark"
                  checked={showWatermark}
                  onCheckedChange={(checked) => setShowWatermark(checked as boolean)}
                />
                <Label htmlFor="show-watermark" className="cursor-pointer">Show Watermark</Label>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={captureLiveGraph}
              disabled={isRendering}
              className="w-full"
            >
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-capture Layout
                </>
              )}
            </Button>
          </div>
          
          {/* Right: Preview */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <div 
              className="border rounded-lg overflow-hidden bg-[#F9F6EE]"
              style={{ aspectRatio: aspectRatio }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full"
              />
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {capturedNodes.length} entities, {capturedLinks.length} relationships
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="default" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
          <Button variant="outline" onClick={handleCopy}>
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
