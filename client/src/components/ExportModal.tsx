/**
 * Export Modal for Silent Partners
 * Creates high-quality artwork exports with title, subtitle, legend, and watermark
 * Renders directly from D3 simulation state for accurate positioning
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme } from '@/contexts/CanvasThemeContext';
import { entityColors } from '@/lib/store';
import { toast } from 'sonner';

interface ExportFormat {
  width: number;
  height: number;
  label: string;
  scale: number;
}

const EXPORT_FORMATS: Record<string, ExportFormat> = {
  'twitter': { width: 1200, height: 675, label: 'Twitter/X Card (1200×675)', scale: 2 },
  'instagram-square': { width: 1080, height: 1080, label: 'Instagram Square (1080×1080)', scale: 2 },
  'instagram-story': { width: 1080, height: 1920, label: 'Instagram Story (1080×1920)', scale: 2 },
  'linkedin': { width: 1200, height: 627, label: 'LinkedIn (1200×627)', scale: 2 },
  'hd': { width: 1920, height: 1080, label: 'HD Landscape (1920×1080)', scale: 2 },
  '4k': { width: 3840, height: 2160, label: '4K Landscape (3840×2160)', scale: 1 },
  '8k': { width: 7680, height: 4320, label: '8K Ultra HD (7680×4320)', scale: 1 },
  'print-a4': { width: 2480, height: 3508, label: 'Print A4 (300dpi)', scale: 1 },
};

// Theme configurations for export
const EXPORT_THEMES = {
  lombardi: {
    background: '#F9F7F4',
    text: '#2A2A2A',
    textLight: '#666666',
    nodeStroke: '#2A2A2A',
    nodeFill: '#F9F7F4',
    linkStroke: '#2A2A2A',
  },
  default: {
    background: '#FAFAF8',
    text: '#1a1a1a',
    textLight: '#666666',
    nodeStroke: '#333333',
    nodeFill: '#FFFFFF',
    linkStroke: '#888888',
  },
  dark: {
    background: '#1a1a1a',
    text: '#E0E0E0',
    textLight: '#888888',
    nodeStroke: '#E0E0E0',
    nodeFill: '#2a2a2a',
    linkStroke: '#666666',
  },
};

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NodePosition {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
}

export default function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { network } = useNetwork();
  const { theme } = useCanvasTheme();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState('twitter');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('Made with Silent Partners');
  const [renderKey, setRenderKey] = useState(0);

  // Initialize title from network
  useEffect(() => {
    if (open && network.title) {
      setTitle(network.title);
      setSubtitle(network.description || '');
    }
  }, [open, network.title, network.description]);

  // Get node positions from global state
  const getNodes = useCallback((): NodePosition[] => {
    const globalState = (window as any).__SILENT_PARTNERS_STATE__;
    if (globalState && typeof globalState.getNodePositions === 'function') {
      return globalState.getNodePositions();
    }
    // Fallback to network entities
    return network.entities.map((e, i) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      x: e.x ?? (100 + (i % 10) * 50),
      y: e.y ?? (100 + Math.floor(i / 10) * 50),
    }));
  }, [network.entities]);

  // Get links from global state or network
  const getLinks = useCallback(() => {
    const globalState = (window as any).__SILENT_PARTNERS_STATE__;
    if (globalState && globalState.links) {
      return globalState.links;
    }
    return network.relationships.map(r => ({
      source: r.sourceId,
      target: r.targetId,
      type: r.type,
      status: r.status,
    }));
  }, [network.relationships]);

  // Render to canvas - now a standalone function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const formatConfig = EXPORT_FORMATS[format];
    const width = formatConfig.width;
    const height = formatConfig.height;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get theme colors
    const themeKey = theme === 'lombardi' ? 'lombardi' : theme === 'dark' ? 'dark' : 'default';
    const colors = EXPORT_THEMES[themeKey];

    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Get network data
    const nodes = getNodes();
    const links = getLinks();
    
    if (nodes.length === 0) {
      ctx.fillStyle = colors.textLight;
      ctx.font = '24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('No network to export', width / 2, height / 2);
      return;
    }

    // Calculate layout areas
    const padding = Math.max(30, width * 0.025);
    const titleHeight = title ? Math.max(50, height * 0.08) : 0;
    const subtitleHeight = subtitle ? Math.max(30, height * 0.04) : 0;
    const legendHeight = showLegend ? Math.max(35, height * 0.05) : 0;
    const watermarkHeight = showWatermark ? Math.max(25, height * 0.035) : 0;
    
    const graphTop = padding + titleHeight + subtitleHeight;
    const graphBottom = height - padding - legendHeight - watermarkHeight;
    const graphLeft = padding;
    const graphRight = width - padding;
    const graphWidth = graphRight - graphLeft;
    const graphHeight = graphBottom - graphTop;

    // Calculate network bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    });
    
    const networkWidth = maxX - minX || 100;
    const networkHeight = maxY - minY || 100;
    
    // Calculate scale to fit network in graph area with padding
    const scaleX = graphWidth / (networkWidth * 1.1);
    const scaleY = graphHeight / (networkHeight * 1.1);
    const networkScale = Math.min(scaleX, scaleY);
    
    // Calculate translation to center network
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const translateX = graphLeft + graphWidth / 2 - centerX * networkScale;
    const translateY = graphTop + graphHeight / 2 - centerY * networkScale;

    // Draw title
    if (title) {
      ctx.fillStyle = colors.text;
      ctx.font = `bold ${Math.max(24, width * 0.025)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, padding + titleHeight * 0.6);
    }

    // Draw subtitle
    if (subtitle) {
      ctx.fillStyle = colors.textLight;
      ctx.font = `${Math.max(14, width * 0.012)}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      const maxSubtitleWidth = width - padding * 2;
      const truncatedSubtitle = subtitle.length > 120 ? subtitle.substring(0, 117) + '...' : subtitle;
      ctx.fillText(truncatedSubtitle, width / 2, padding + titleHeight + subtitleHeight * 0.5);
    }

    // Create node position map for link drawing
    const nodeMap = new Map<string, NodePosition>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // Draw links
    ctx.strokeStyle = colors.linkStroke;
    ctx.lineWidth = Math.max(0.5, width * 0.0005);
    ctx.globalAlpha = 0.4;
    
    links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const source = nodeMap.get(sourceId);
      const target = nodeMap.get(targetId);
      
      if (source && target) {
        const x1 = source.x * networkScale + translateX;
        const y1 = source.y * networkScale + translateY;
        const x2 = target.x * networkScale + translateX;
        const y2 = target.y * networkScale + translateY;
        
        ctx.beginPath();
        // Draw curved line
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const curvature = Math.min(dist * 0.15, 30);
        const ctrlX = midX - dy * curvature / dist;
        const ctrlY = midY + dx * curvature / dist;
        
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(ctrlX, ctrlY, x2, y2);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // Draw nodes
    const radius = Math.max(3, width * 0.003);
    const fontSize = Math.max(8, width * 0.007);
    
    nodes.forEach(node => {
      const x = node.x * networkScale + translateX;
      const y = node.y * networkScale + translateY;
      const color = entityColors[node.type as keyof typeof entityColors] || entityColors.default;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      // Lombardi style: hollow for orgs, solid for people
      if (theme === 'lombardi') {
        ctx.strokeStyle = colors.nodeStroke;
        ctx.lineWidth = Math.max(1, width * 0.001);
        if (node.type === 'person') {
          ctx.fillStyle = colors.nodeStroke;
          ctx.fill();
        } else {
          ctx.fillStyle = colors.nodeFill;
          ctx.fill();
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Draw label
      if (showLabels) {
        ctx.fillStyle = colors.text;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'left';
        ctx.globalAlpha = 0.85;
        ctx.fillText(node.name, x + radius + 3, y + fontSize * 0.35);
        ctx.globalAlpha = 1;
      }
    });

    // Draw legend
    if (showLegend) {
      const legendY = height - legendHeight - watermarkHeight + legendHeight * 0.55;
      const entityTypes = ['Person', 'Government', 'Financial', 'Organization', 'Corporation'];
      const legendFontSize = Math.max(10, width * 0.009);
      const dotSize = Math.max(5, width * 0.004);
      
      ctx.font = `${legendFontSize}px "Inter", sans-serif`;
      ctx.textAlign = 'left';
      
      let legendX = padding;
      ctx.fillStyle = colors.textLight;
      ctx.fillText('ENTITIES:', legendX, legendY);
      legendX += ctx.measureText('ENTITIES:').width + 15;
      
      entityTypes.forEach(type => {
        const color = entityColors[type.toLowerCase() as keyof typeof entityColors] || entityColors.default;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(legendX + dotSize, legendY - dotSize / 2, dotSize, 0, Math.PI * 2);
        if (theme === 'lombardi') {
          ctx.strokeStyle = colors.nodeStroke;
          ctx.lineWidth = 1;
          if (type === 'Person') {
            ctx.fillStyle = colors.nodeStroke;
            ctx.fill();
          } else {
            ctx.fillStyle = colors.nodeFill;
            ctx.fill();
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = color;
          ctx.fill();
        }
        
        // Draw label
        ctx.fillStyle = colors.textLight;
        ctx.fillText(type, legendX + dotSize * 2 + 5, legendY);
        legendX += ctx.measureText(type).width + dotSize * 2 + 20;
      });
    }

    // Draw watermark
    if (showWatermark && watermarkText) {
      ctx.fillStyle = colors.textLight;
      ctx.font = `${Math.max(11, width * 0.009)}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.5;
      ctx.fillText(watermarkText, width / 2, height - watermarkHeight * 0.35);
      ctx.globalAlpha = 1;
    }
  }, [format, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, theme, getNodes, getLinks]);

  // Trigger render when modal opens or options change
  useEffect(() => {
    if (open) {
      // Use requestAnimationFrame to ensure DOM is ready
      const rafId = requestAnimationFrame(() => {
        setTimeout(() => {
          renderCanvas();
        }, 100);
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [open, renderKey]);

  // Re-render when options change
  useEffect(() => {
    if (open && canvasRef.current) {
      renderCanvas();
    }
  }, [format, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, theme, renderCanvas, open]);

  // Download PNG
  const handleDownload = useCallback(() => {
    const formatConfig = EXPORT_FORMATS[format];
    const canvas = document.createElement('canvas');
    canvas.width = formatConfig.width * formatConfig.scale;
    canvas.height = formatConfig.height * formatConfig.scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(formatConfig.scale, formatConfig.scale);
    
    // Copy the preview canvas content at higher resolution
    const previewCanvas = canvasRef.current;
    if (previewCanvas) {
      // Re-render at export scale
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = formatConfig.width;
      tempCanvas.height = formatConfig.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(previewCanvas, 0, 0);
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
    
    const link = document.createElement('a');
    link.download = `${title || 'network'}-${format}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    toast.success('PNG downloaded successfully');
  }, [format, title]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
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
  }, []);

  // Force re-render button
  const handleRefresh = () => {
    setRenderKey(k => k + 1);
    setTimeout(renderCanvas, 50);
  };

  const formatConfig = EXPORT_FORMATS[format];
  const aspectRatio = formatConfig.width / formatConfig.height;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Artwork</DialogTitle>
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
              <Label>Subtitle</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional subtitle..."
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
            
            {showWatermark && (
              <div>
                <Label>Watermark Text</Label>
                <Input
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Made with Silent Partners"
                />
              </div>
            )}
          </div>
          
          {/* Right: Preview */}
          <div>
            <Label>Preview</Label>
            <div 
              className="border rounded-lg overflow-hidden bg-muted mt-1"
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
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleRefresh}>
            Refresh Preview
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download PNG
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
