/**
 * Export Modal for Silent Partners
 * Creates high-quality artwork exports with title, subtitle, legend, and watermark
 */

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Copy, RefreshCw } from 'lucide-react';
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
  '8k-square': { width: 7680, height: 7680, label: '8K Square (7680×7680)', scale: 1 },
  '8k-portrait': { width: 4320, height: 7680, label: '8K Portrait (4320×7680)', scale: 1 },
  'print-a4': { width: 2480, height: 3508, label: 'Print A4 (300dpi)', scale: 1 },
};

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { network } = useNetwork();
  const { theme } = useCanvasTheme();
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Default to 8K for large networks (100+ entities), 4K for medium (50+), Twitter for small
  const getDefaultFormat = () => {
    const entityCount = network.entities.length;
    // For large networks, use square format which fits better
    if (entityCount > 100) return '8k-square';
    if (entityCount > 50) return '4k';
    return 'twitter';
  };
  const [format, setFormat] = useState(getDefaultFormat());
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('Made with Silent Partners');

  // Initialize title from network
  useEffect(() => {
    if (open && network.title) {
      setTitle(network.title);
      setSubtitle(network.description || '');
    }
  }, [open, network.title, network.description]);

  // Render function
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.log('No canvas ref');
      return;
    }

    // Get global state
    const state = (window as any).__SILENT_PARTNERS_STATE__;
    if (!state || typeof state.getNodePositions !== 'function') {
      console.log('No global state');
      return;
    }

    const nodes = state.getNodePositions();
    const links = state.links || [];
    
    if (nodes.length === 0) {
      console.log('No nodes');
      return;
    }

    const formatConfig = EXPORT_FORMATS[format];
    const width = formatConfig.width;
    const height = formatConfig.height;
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Theme colors
    const isLombardi = theme === 'lombardi';
    const isDark = theme === 'dark';
    const bgColor = isLombardi ? '#F9F7F4' : isDark ? '#1a1a1a' : '#FAFAF8';
    const textColor = isLombardi ? '#2A2A2A' : isDark ? '#E0E0E0' : '#1a1a1a';
    const textLightColor = isLombardi ? '#666666' : isDark ? '#888888' : '#666666';
    const nodeStroke = isLombardi ? '#2A2A2A' : isDark ? '#E0E0E0' : '#333333';
    const nodeFill = isLombardi ? '#F9F7F4' : isDark ? '#2a2a2a' : '#FFFFFF';
    const linkColor = isLombardi ? '#2A2A2A' : isDark ? '#666666' : '#888888';

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate layout areas - minimized to maximize graph space
    const padding = Math.max(20, width * 0.015);
    const titleHeight = title ? Math.max(40, height * 0.04) : 0;
    const subtitleHeight = subtitle ? Math.max(20, height * 0.02) : 0;
    const legendHeight = showLegend ? Math.max(25, height * 0.025) : 0;
    const watermarkHeight = showWatermark ? Math.max(20, height * 0.02) : 0;
    
    const graphTop = padding + titleHeight + subtitleHeight;
    const graphBottom = height - padding - legendHeight - watermarkHeight;
    const graphLeft = padding;
    const graphRight = width - padding;
    const graphWidth = graphRight - graphLeft;
    const graphHeight = graphBottom - graphTop;

    // Calculate network bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach((node: any) => {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    });
    
    const networkWidth = maxX - minX || 100;
    const networkHeight = maxY - minY || 100;
    
    // Calculate scale to fit network in graph area
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
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.max(24, width * 0.025)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, padding + titleHeight * 0.6);
    }

    // Draw subtitle
    if (subtitle) {
      ctx.fillStyle = textLightColor;
      ctx.font = `${Math.max(14, width * 0.012)}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      const truncatedSubtitle = subtitle.length > 120 ? subtitle.substring(0, 117) + '...' : subtitle;
      ctx.fillText(truncatedSubtitle, width / 2, padding + titleHeight + subtitleHeight * 0.5);
    }

    // Create node position map for link drawing
    const nodeMap = new Map<string, any>();
    nodes.forEach((node: any) => nodeMap.set(node.id, node));

    // Draw links
    ctx.strokeStyle = linkColor;
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
        if (dist > 0) {
          const curvature = Math.min(dist * 0.15, 30);
          const ctrlX = midX - dy * curvature / dist;
          const ctrlY = midY + dx * curvature / dist;
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(ctrlX, ctrlY, x2, y2);
        } else {
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1;

    // Calculate dynamic sizes based on resolution and network complexity
    const nodeCount = nodes.length;
    const resolutionFactor = width / 1920; // Normalize to HD as baseline
    
    // For 8K exports (7680px), this gives much larger readable labels
    const baseRadius = Math.max(8, width * 0.008 * Math.max(1, resolutionFactor * 0.5));
    const fontSize = Math.max(14, width * 0.01 * Math.max(1, resolutionFactor * 0.6));
    
    // Collect label positions for collision detection
    const labelPositions: { x: number; y: number; width: number }[] = [];
    
    nodes.forEach((node: any) => {
      const x = node.x * networkScale + translateX;
      const y = node.y * networkScale + translateY;
      const color = entityColors[node.type as keyof typeof entityColors] || entityColors.default;
      
      const radius = baseRadius * (0.7 + (node.importance || 0.5) * 0.6);
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      
      // Lombardi style: hollow for orgs, solid for people
      if (isLombardi) {
        ctx.strokeStyle = nodeStroke;
        ctx.lineWidth = Math.max(1, width * 0.001);
        if (node.type === 'person') {
          ctx.fillStyle = nodeStroke;
          ctx.fill();
        } else {
          ctx.fillStyle = nodeFill;
          ctx.fill();
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Draw label with collision detection
      if (showLabels && node.name) {
        const label = node.name;
        ctx.font = `${fontSize}px "Inter", sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = 'center';
        
        // Simple collision avoidance - offset if overlapping
        let labelY = y + baseRadius + fontSize + 4;
        const labelWidth = ctx.measureText(label).width;
        
        // Check for overlaps with existing labels
        for (const pos of labelPositions) {
          if (Math.abs(x - pos.x) < (labelWidth + pos.width) / 2 + 10 &&
              Math.abs(labelY - pos.y) < fontSize + 4) {
            labelY = pos.y + fontSize + 4;
          }
        }
        
        labelPositions.push({ x, y: labelY, width: labelWidth });
        ctx.fillText(label, x, labelY);
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
      ctx.fillStyle = textLightColor;
      ctx.fillText('ENTITIES:', legendX, legendY);
      legendX += ctx.measureText('ENTITIES:').width + 15;
      
      entityTypes.forEach(type => {
        const color = entityColors[type.toLowerCase() as keyof typeof entityColors] || entityColors.default;
        
        // Draw dot
        ctx.beginPath();
        ctx.arc(legendX + dotSize, legendY - dotSize / 2, dotSize, 0, Math.PI * 2);
        if (isLombardi) {
          ctx.strokeStyle = nodeStroke;
          ctx.lineWidth = 1;
          if (type === 'Person') {
            ctx.fillStyle = nodeStroke;
            ctx.fill();
          } else {
            ctx.fillStyle = nodeFill;
            ctx.fill();
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = color;
          ctx.fill();
        }
        
        // Draw label
        ctx.fillStyle = textLightColor;
        ctx.fillText(type, legendX + dotSize * 2 + 5, legendY);
        legendX += ctx.measureText(type).width + dotSize * 2 + 20;
      });
    }

    // Draw watermark
    if (showWatermark && watermarkText) {
      ctx.fillStyle = textLightColor;
      ctx.font = `${Math.max(11, width * 0.009)}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.5;
      ctx.fillText(watermarkText, width / 2, height - watermarkHeight * 0.35);
      ctx.globalAlpha = 1;
    }

    console.log(`Rendered ${nodes.length} nodes, ${links.length} links`);
  };

  // Trigger render when modal opens or options change
  useEffect(() => {
    if (open) {
      // Wait for canvas to be mounted
      const timer = setTimeout(() => {
        renderCanvas();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, format, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, theme]);

  // Download PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Re-render at full resolution
    renderCanvas();
    
    const link = document.createElement('a');
    link.download = `${title || 'network'}-${format}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    toast.success('PNG downloaded successfully');
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
            <div className="flex items-center justify-between mb-1">
              <Label>Preview</Label>
              <Button variant="ghost" size="sm" onClick={renderCanvas}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
            <div 
              className="border rounded-lg overflow-hidden bg-muted"
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
