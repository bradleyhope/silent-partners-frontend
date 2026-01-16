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
import { Download, Copy, Image } from 'lucide-react';
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
  const [isRendering, setIsRendering] = useState(false);

  // Initialize title from network
  useEffect(() => {
    if (open && network.title) {
      setTitle(network.title);
      setSubtitle(network.description || '');
    }
  }, [open, network.title, network.description]);

  // Get node positions from global state or calculate from entities
  const getNetworkState = useCallback(() => {
    const globalState = (window as any).__SILENT_PARTNERS_STATE__;
    
    if (globalState && globalState.nodes && globalState.nodes.length > 0) {
      return {
        nodes: globalState.getNodePositions(),
        links: globalState.links || [],
      };
    }
    
    // Fallback: use entity positions from network context
    return {
      nodes: network.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        x: e.x ?? 0,
        y: e.y ?? 0,
      })),
      links: network.relationships.map(r => ({
        source: r.source,
        target: r.target,
        label: r.label,
        status: r.status,
      })),
    };
  }, [network.entities, network.relationships]);

  // Calculate network bounds
  const getNetworkBounds = useCallback((nodes: any[]) => {
    if (!nodes || nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
      if (node.x < minX) minX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.x > maxX) maxX = node.x;
      if (node.y > maxY) maxY = node.y;
    });

    const labelPadding = 100;
    return {
      minX: minX - labelPadding,
      minY: minY - labelPadding,
      maxX: maxX + labelPadding,
      maxY: maxY + labelPadding,
      width: (maxX - minX + labelPadding * 2) || 100,
      height: (maxY - minY + labelPadding * 2) || 100,
    };
  }, []);

  // Render to canvas
  const renderToCanvas = useCallback((canvas: HTMLCanvasElement, isExport: boolean = false) => {
    const formatConfig = EXPORT_FORMATS[format];
    const scale = isExport ? formatConfig.scale : 1;
    const width = formatConfig.width;
    const height = formatConfig.height;
    
    canvas.width = width * scale;
    canvas.height = height * scale;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Get theme colors
    const themeKey = theme as keyof typeof EXPORT_THEMES;
    const colors = EXPORT_THEMES[themeKey] || EXPORT_THEMES.default;

    // Background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Get network state
    const state = getNetworkState();
    if (!state.nodes || state.nodes.length === 0) {
      ctx.fillStyle = colors.textLight;
      ctx.font = '24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('No network to export', width / 2, height / 2);
      return;
    }

    // Calculate layout areas - give more space to the network
    const padding = width * 0.03;
    const headerHeight = title ? height * 0.1 : height * 0.02;
    const legendHeight = showLegend ? height * 0.06 : 0;
    const watermarkHeight = showWatermark ? height * 0.03 : 0;
    
    const networkArea = {
      x: padding,
      y: headerHeight,
      width: width - padding * 2,
      height: height - headerHeight - legendHeight - watermarkHeight,
    };

    // Draw title
    if (title) {
      ctx.fillStyle = colors.text;
      const titleSize = Math.min(width * 0.04, 48);
      ctx.font = `bold ${titleSize}px "Crimson Text", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, headerHeight * 0.45);
      
      if (subtitle) {
        ctx.fillStyle = colors.textLight;
        const subtitleSize = Math.min(width * 0.016, 20);
        ctx.font = `${subtitleSize}px "Inter", sans-serif`;
        const maxSubtitleWidth = width * 0.9;
        const truncatedSubtitle = subtitle.length > 140 ? subtitle.substring(0, 137) + '...' : subtitle;
        ctx.fillText(truncatedSubtitle, width / 2, headerHeight * 0.78);
      }
    }

    // Calculate network bounds and scale to fit - use more of the available space
    const bounds = getNetworkBounds(state.nodes);
    const networkScale = Math.min(
      networkArea.width / bounds.width,
      networkArea.height / bounds.height
    ) * 0.95; // Use 95% of available space

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    const translateX = networkArea.x + networkArea.width / 2 - centerX * networkScale;
    const translateY = networkArea.y + networkArea.height / 2 - centerY * networkScale;

    // Create node map for link drawing
    const nodeMap = new Map(state.nodes.map((n: any) => [n.id, n]));

    // Draw links
    const lineWidth = Math.max(0.8, width * 0.0008);
    ctx.lineWidth = lineWidth;

    state.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      const source = nodeMap.get(sourceId);
      const target = nodeMap.get(targetId);
      if (!source || !target) return;

      const sx = source.x * networkScale + translateX;
      const sy = source.y * networkScale + translateY;
      const ex = target.x * networkScale + translateX;
      const ey = target.y * networkScale + translateY;

      // Calculate curve control point
      const dx = ex - sx;
      const dy = ey - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;
      const perpX = -dy / (dist || 1);
      const perpY = dx / (dist || 1);
      const curveDirection = sourceId < targetId ? 1 : -1;
      const curveOffset = dist * 0.12 * curveDirection;
      const cpX = midX + perpX * curveOffset;
      const cpY = midY + perpY * curveOffset;

      ctx.beginPath();
      ctx.strokeStyle = colors.linkStroke;
      ctx.globalAlpha = 0.5;
      
      if (link.status === 'suspected') {
        ctx.setLineDash([4, 4]);
      } else if (link.status === 'former') {
        ctx.setLineDash([2, 3]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpX, cpY, ex, ey);
      ctx.stroke();
    });

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Draw nodes
    const isLombardi = theme === 'lombardi';
    const baseRadius = Math.max(3, width * 0.004);
    const fontSize = Math.max(8, width * 0.007);

    state.nodes.forEach((node: any) => {
      const x = node.x * networkScale + translateX;
      const y = node.y * networkScale + translateY;
      const isHollow = ['corporation', 'organization', 'financial', 'government'].includes(node.type);
      const radius = isLombardi ? (isHollow ? baseRadius * 1.4 : baseRadius * 0.7) : baseRadius;

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      if (isLombardi) {
        ctx.fillStyle = isHollow ? colors.background : colors.nodeStroke;
        ctx.strokeStyle = colors.nodeStroke;
        ctx.lineWidth = isHollow ? 1 : 0;
        ctx.fill();
        if (isHollow) ctx.stroke();
      } else {
        ctx.fillStyle = entityColors[node.type as keyof typeof entityColors] || entityColors.unknown;
        ctx.fill();
      }

      // Draw label
      if (showLabels) {
        ctx.fillStyle = colors.text;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        ctx.textAlign = 'left';
        ctx.globalAlpha = 0.9;
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
      
      ctx.font = `bold ${legendFontSize}px "Inter", sans-serif`;
      ctx.fillStyle = colors.textLight;
      ctx.textAlign = 'left';
      
      let legendX = padding;
      ctx.fillText('ENTITIES:', legendX, legendY);
      legendX += ctx.measureText('ENTITIES:').width + 15;

      ctx.font = `${legendFontSize}px "Inter", sans-serif`;
      entityTypes.forEach((type) => {
        const color = entityColors[type.toLowerCase() as keyof typeof entityColors] || entityColors.unknown;
        
        ctx.beginPath();
        ctx.arc(legendX + dotSize, legendY - dotSize * 0.3, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        ctx.fillStyle = colors.text;
        ctx.fillText(type, legendX + dotSize * 2 + 6, legendY);
        legendX += ctx.measureText(type).width + dotSize * 2 + 25;
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
  }, [format, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, theme, getNetworkState, getNetworkBounds]);

  // Render preview when modal opens or options change
  useEffect(() => {
    if (open && canvasRef.current) {
      setIsRendering(true);
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (canvasRef.current) {
          renderToCanvas(canvasRef.current, false);
        }
        setIsRendering(false);
      }, 150);
    }
  }, [open, format, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, theme, renderToCanvas]);

  // Download PNG
  const handleDownload = useCallback(() => {
    const canvas = document.createElement('canvas');
    renderToCanvas(canvas, true);
    
    const link = document.createElement('a');
    const formatConfig = EXPORT_FORMATS[format];
    link.download = `${title || 'network'}-${format}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    toast.success('PNG downloaded successfully', {
      description: `${formatConfig.width * formatConfig.scale}×${formatConfig.height * formatConfig.scale}px`,
    });
  }, [format, title, renderToCanvas]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    const canvas = document.createElement('canvas');
    renderToCanvas(canvas, true);
    
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/png', 1.0);
      });
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  }, [renderToCanvas]);

  const formatConfig = EXPORT_FORMATS[format];
  const previewScale = Math.min(480 / formatConfig.width, 340 / formatConfig.height, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Create Artwork
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Options */}
          <div className="space-y-4">
            <div>
              <Label>Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_FORMATS).map(([key, fmt]) => (
                    <SelectItem key={key} value={key}>{fmt.label}</SelectItem>
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
                  onCheckedChange={(c) => setShowLabels(!!c)}
                />
                <label htmlFor="show-labels" className="text-sm">Show Labels</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-legend"
                  checked={showLegend}
                  onCheckedChange={(c) => setShowLegend(!!c)}
                />
                <label htmlFor="show-legend" className="text-sm">Show Legend</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="show-watermark"
                  checked={showWatermark}
                  onCheckedChange={(c) => setShowWatermark(!!c)}
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

          {/* Preview */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <div 
              className="border rounded-lg overflow-hidden bg-muted flex items-center justify-center"
              style={{ minHeight: 300 }}
            >
              {isRendering ? (
                <div className="text-muted-foreground text-sm">Rendering...</div>
              ) : (
                <canvas
                  ref={canvasRef}
                  style={{
                    width: formatConfig.width * previewScale,
                    height: formatConfig.height * previewScale,
                    maxWidth: '100%',
                  }}
                />
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownload} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
