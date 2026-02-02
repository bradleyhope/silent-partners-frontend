/**
 * Export Modal for Silent Partners
 * Creates high-quality exports that EXACTLY match the live graph view
 * 
 * Key features:
 * - Captures actual node positions from the live SVG
 * - Uses the same theme config as the live graph
 * - Same node sizes, colors, fonts - just scaled to fit export format
 * - No re-simulation, no reformatting - what you see is what you get
 * 
 * Updated 2026-02-02: Fixed to exactly match live graph appearance
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

interface CapturedNode {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  isHollow: boolean;
}

interface CapturedLink {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  stroke: string;
  strokeWidth: number;
  strokeDasharray: string;
  pathData: string;
}

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { network } = useNetwork();
  const { theme, config: themeConfig, getEntityColor } = useCanvasTheme();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState('print-portrait');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [notes, setNotes] = useState('');
  const [showLegend, setShowLegend] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  
  // Captured graph state from live SVG
  const [capturedNodes, setCapturedNodes] = useState<CapturedNode[]>([]);
  const [capturedLinks, setCapturedLinks] = useState<CapturedLink[]>([]);
  const [graphBounds, setGraphBounds] = useState({ minX: 0, minY: 0, maxX: 800, maxY: 600 });

  // Initialize from network
  useEffect(() => {
    if (open && network.title) {
      setTitle(network.title);
      setSubtitle(network.description || '');
    }
  }, [open, network.title, network.description]);

  // Capture the live graph exactly as it appears
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
    
    // Get the transform group to account for zoom/pan
    const canvasContent = svg.querySelector('g.canvas-content');
    
    // Capture all nodes with their exact visual properties
    const nodes: CapturedNode[] = [];
    const nodeElements = svg.querySelectorAll('g.node');
    
    nodeElements.forEach((nodeEl) => {
      const transform = nodeEl.getAttribute('transform');
      if (!transform) return;
      
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
      if (!match) return;
      
      const x = parseFloat(match[1]);
      const y = parseFloat(match[2]);
      
      const entityId = nodeEl.getAttribute('data-entity-id');
      const entity = network.entities.find(e => e.id === entityId);
      if (!entity) return;
      
      // Get the circle element to capture exact visual properties
      const circle = nodeEl.querySelector('circle.node-circle');
      if (!circle) return;
      
      const radius = parseFloat(circle.getAttribute('r') || '8');
      const fill = circle.getAttribute('fill') || themeConfig.nodeFill;
      const stroke = circle.getAttribute('stroke') || themeConfig.nodeStroke;
      const strokeWidth = parseFloat(circle.getAttribute('stroke-width') || '1.5');
      
      // Determine if hollow based on fill matching background
      const isHollow = fill === themeConfig.background || fill === themeConfig.nodeFill;
      
      nodes.push({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        x,
        y,
        radius,
        fill,
        stroke,
        strokeWidth,
        isHollow,
      });
    });
    
    // Capture all links with their exact visual properties
    const links: CapturedLink[] = [];
    const linkElements = svg.querySelectorAll('path.link-path');
    
    linkElements.forEach((linkEl) => {
      const pathData = linkEl.getAttribute('d') || '';
      const stroke = linkEl.getAttribute('stroke') || themeConfig.linkStroke;
      const strokeWidth = parseFloat(linkEl.getAttribute('stroke-width') || '1.5');
      const strokeDasharray = linkEl.getAttribute('stroke-dasharray') || 'none';
      
      // Parse path to get source and target coordinates
      // Path format: M sx,sy Q cx,cy tx,ty or M sx,sy L tx,ty
      const moveMatch = pathData.match(/M\s*([\d.-]+)[,\s]+([\d.-]+)/);
      let targetMatch = pathData.match(/[QL]\s*[\d.-]+[,\s]+[\d.-]+[,\s]*([\d.-]+)[,\s]+([\d.-]+)/);
      if (!targetMatch) {
        targetMatch = pathData.match(/L\s*([\d.-]+)[,\s]+([\d.-]+)/);
      }
      
      if (moveMatch && targetMatch) {
        links.push({
          sourceX: parseFloat(moveMatch[1]),
          sourceY: parseFloat(moveMatch[2]),
          targetX: parseFloat(targetMatch[1]),
          targetY: parseFloat(targetMatch[2]),
          stroke,
          strokeWidth,
          strokeDasharray,
          pathData,
        });
      }
    });
    
    // Calculate bounds from captured nodes
    if (nodes.length > 0) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(n => {
        minX = Math.min(minX, n.x - n.radius - 50);
        minY = Math.min(minY, n.y - n.radius - 30);
        maxX = Math.max(maxX, n.x + n.radius + 50);
        maxY = Math.max(maxY, n.y + n.radius + 30);
      });
      setGraphBounds({ minX, minY, maxX, maxY });
    }
    
    setCapturedNodes(nodes);
    setCapturedLinks(links);
    setIsRendering(false);
  }, [network, themeConfig]);

  // Capture live graph when modal opens
  useEffect(() => {
    if (open) {
      captureLiveGraph();
    }
  }, [open, captureLiveGraph]);

  // Render canvas matching the live graph exactly
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || capturedNodes.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const formatConfig = EXPORT_FORMATS[format];
    const width = formatConfig.width;
    const height = formatConfig.height;
    
    canvas.width = width;
    canvas.height = height;
    
    // Use the actual theme background
    ctx.fillStyle = themeConfig.background;
    ctx.fillRect(0, 0, width, height);
    
    // Calculate scale to fit the captured graph
    const graphWidth = graphBounds.maxX - graphBounds.minX;
    const graphHeight = graphBounds.maxY - graphBounds.minY;
    
    // Leave room for title at top and legend at bottom
    const availableHeight = height * 0.75;
    const availableWidth = width * 0.9;
    const topMargin = height * 0.15;
    
    const scale = Math.min(
      availableWidth / graphWidth,
      availableHeight / graphHeight
    );
    
    // Center the graph
    const offsetX = (width - graphWidth * scale) / 2 - graphBounds.minX * scale;
    const offsetY = topMargin + (availableHeight - graphHeight * scale) / 2 - graphBounds.minY * scale;
    
    // Draw title using theme font
    if (title) {
      ctx.fillStyle = themeConfig.textColor;
      ctx.font = `bold ${width * 0.035}px ${themeConfig.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, height * 0.05);
    }
    
    // Draw subtitle
    if (subtitle) {
      ctx.fillStyle = themeConfig.textColor;
      ctx.globalAlpha = 0.7;
      const subtitleFontSize = width * 0.016;
      ctx.font = `${subtitleFontSize}px ${themeConfig.fontFamily}`;
      ctx.textAlign = 'center';
      
      // Word wrap
      const maxSubtitleWidth = width * 0.85;
      const words = subtitle.split(' ');
      let line = '';
      const lines: string[] = [];
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        if (ctx.measureText(testLine).width > maxSubtitleWidth && i > 0) {
          lines.push(line.trim());
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
      
      const lineHeight = subtitleFontSize * 1.3;
      lines.slice(0, 3).forEach((l, i) => {
        ctx.fillText(l, width / 2, height * 0.08 + i * lineHeight);
      });
      ctx.globalAlpha = 1;
    }
    
    // Draw links exactly as captured (scaled)
    capturedLinks.forEach(link => {
      ctx.beginPath();
      ctx.strokeStyle = link.stroke;
      ctx.lineWidth = link.strokeWidth * scale;
      
      if (link.strokeDasharray && link.strokeDasharray !== 'none') {
        const dashes = link.strokeDasharray.split(',').map(d => parseFloat(d) * scale);
        ctx.setLineDash(dashes);
      } else {
        ctx.setLineDash([]);
      }
      
      // Scale the path coordinates
      const sx = link.sourceX * scale + offsetX;
      const sy = link.sourceY * scale + offsetY;
      const tx = link.targetX * scale + offsetX;
      const ty = link.targetY * scale + offsetY;
      
      // Draw curved line matching the live graph
      const dx = tx - sx;
      const dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      ctx.moveTo(sx, sy);
      
      if (dist > 0) {
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        const curveOffset = dist * themeConfig.curveIntensity * 0.3;
        const perpX = -dy / dist * curveOffset;
        const perpY = dx / dist * curveOffset;
        
        ctx.quadraticCurveTo(midX + perpX, midY + perpY, tx, ty);
      } else {
        ctx.lineTo(tx, ty);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
    });
    
    // Draw nodes exactly as captured (scaled)
    capturedNodes.forEach(node => {
      const x = node.x * scale + offsetX;
      const y = node.y * scale + offsetY;
      const r = node.radius * scale;
      
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.fill;
      ctx.fill();
      
      if (node.strokeWidth > 0) {
        ctx.strokeStyle = node.stroke;
        ctx.lineWidth = node.strokeWidth * scale;
        ctx.stroke();
      }
      
      // Draw label using theme settings
      ctx.fillStyle = themeConfig.textColor;
      const fontSize = themeConfig.labelSize * scale;
      ctx.font = `500 ${fontSize}px ${themeConfig.fontFamily}`;
      ctx.textAlign = 'center';
      
      // Text stroke for readability
      ctx.strokeStyle = themeConfig.background;
      ctx.lineWidth = 3 * scale;
      ctx.strokeText(node.name, x, y + r + fontSize);
      ctx.fillText(node.name, x, y + r + fontSize);
    });
    
    // Draw legend
    if (showLegend) {
      const legendY = height * 0.93;
      const legendFontSize = Math.max(12, width * 0.012);
      const dotSize = Math.max(4, width * 0.004);
      
      ctx.font = `${legendFontSize}px ${themeConfig.fontFamily}`;
      ctx.textAlign = 'left';
      
      const entityTypes = Array.from(new Set(capturedNodes.map(n => n.type)));
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
        totalWidth += ctx.measureText(typeLabels[type] || type).width + dotSize * 2 + 25;
      });
      
      let legendX = (width - totalWidth) / 2;
      
      entityTypes.forEach(type => {
        const isHollow = ['corporation', 'organization', 'financial', 'government'].includes(type);
        
        ctx.beginPath();
        ctx.arc(legendX + dotSize, legendY, dotSize, 0, Math.PI * 2);
        
        if (isHollow) {
          ctx.fillStyle = themeConfig.background;
          ctx.fill();
          ctx.strokeStyle = themeConfig.nodeStroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.fillStyle = themeConfig.nodeStroke;
          ctx.fill();
        }
        
        ctx.fillStyle = themeConfig.textColor;
        ctx.globalAlpha = 0.7;
        ctx.fillText(typeLabels[type] || type, legendX + dotSize * 2 + 6, legendY + dotSize / 2);
        ctx.globalAlpha = 1;
        legendX += ctx.measureText(typeLabels[type] || type).width + dotSize * 2 + 25;
      });
    }
    
    // Draw watermark
    if (showWatermark) {
      ctx.fillStyle = themeConfig.textColor;
      ctx.globalAlpha = 0.5;
      ctx.font = `${width * 0.015}px ${themeConfig.fontFamily}`;
      ctx.textAlign = 'center';
      ctx.fillText('Created with SilentPartners.app', width / 2, height * 0.97);
      ctx.globalAlpha = 1;
    }
  }, [capturedNodes, capturedLinks, graphBounds, format, title, subtitle, notes, showLegend, showWatermark, themeConfig]);

  // Re-render when options change
  useEffect(() => {
    if (open && capturedNodes.length > 0) {
      renderCanvas();
    }
  }, [open, capturedNodes, renderCanvas]);

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
              className="border rounded-lg overflow-hidden"
              style={{ aspectRatio: aspectRatio, background: themeConfig.background }}
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
