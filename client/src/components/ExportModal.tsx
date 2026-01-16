/**
 * Silent Partners - Export Modal
 * 
 * High-quality artwork generation with proper Lombardi visualization.
 * Includes title, subtitle, legend, and watermark options.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme } from '@/contexts/CanvasThemeContext';
import { Entity, Relationship, entityColors } from '@/lib/store';
import { Download, Copy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPORT_FORMATS = {
  'twitter': { width: 1200, height: 675, label: 'Twitter/X Card' },
  'instagram-square': { width: 1080, height: 1080, label: 'Instagram Square' },
  'instagram-story': { width: 1080, height: 1920, label: 'Instagram Story' },
  'linkedin': { width: 1200, height: 627, label: 'LinkedIn' },
  'hd-landscape': { width: 1920, height: 1080, label: 'HD Landscape' },
  '4k-landscape': { width: 3840, height: 2160, label: '4K Landscape' },
  'print-a4': { width: 2480, height: 3508, label: 'Print A4 (300dpi)' },
} as const;

type FormatKey = keyof typeof EXPORT_FORMATS;

const ENTITY_SHAPES: Record<string, 'circle' | 'hollow'> = {
  'person': 'circle',
  'corporation': 'hollow',
  'organization': 'hollow',
  'financial': 'hollow',
  'government': 'hollow',
};

export default function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { network } = useNetwork();
  const { theme, config: themeConfig } = useCanvasTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Export options
  const [format, setFormat] = useState<FormatKey>('twitter');
  const [title, setTitle] = useState(network.title || '');
  const [subtitle, setSubtitle] = useState(network.description || '');
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('Made with Silent Partners');

  // Update title when network changes
  useEffect(() => {
    setTitle(network.title || '');
    setSubtitle(network.description || '');
  }, [network.title, network.description]);

  // Get network bounds
  const getNetworkBounds = useCallback(() => {
    if (network.entities.length === 0) {
      return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    network.entities.forEach(entity => {
      const x = entity.x ?? 0;
      const y = entity.y ?? 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });

    const labelPadding = 80;
    return {
      minX: minX - labelPadding,
      minY: minY - labelPadding,
      maxX: maxX + labelPadding,
      maxY: maxY + labelPadding,
      width: (maxX - minX + labelPadding * 2) || 100,
      height: (maxY - minY + labelPadding * 2) || 100
    };
  }, [network.entities]);

  // Draw entity shape
  const drawEntityShape = useCallback((
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    type: Entity['type'],
    isLombardi: boolean
  ) => {
    ctx.beginPath();
    
    if (isLombardi) {
      // Lombardi style: hollow circles for orgs, solid dots for people
      const isHollow = ENTITY_SHAPES[type] === 'hollow';
      ctx.arc(x, y, isHollow ? radius * 1.2 : radius * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = isHollow ? themeConfig.background : themeConfig.nodeStroke;
      ctx.fill();
      if (isHollow) {
        ctx.strokeStyle = themeConfig.nodeStroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    } else {
      // Default colored style
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = entityColors[type] || entityColors.unknown;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [themeConfig]);

  // Render to canvas
  const renderToCanvas = useCallback((canvas: HTMLCanvasElement, width: number, height: number, scale: number = 1) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const isLombardi = theme === 'lombardi';

    // Background
    ctx.fillStyle = themeConfig.background;
    ctx.fillRect(0, 0, width, height);

    if (network.entities.length === 0) {
      ctx.fillStyle = themeConfig.textColor;
      ctx.font = '24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('No network to export', width / 2, height / 2);
      return;
    }

    // Calculate layout areas
    const padding = width * 0.05;
    const headerHeight = title ? height * 0.12 : height * 0.03;
    const legendHeight = showLegend ? height * 0.08 : 0;
    const watermarkHeight = showWatermark ? height * 0.04 : 0;

    const networkArea = {
      x: padding,
      y: headerHeight,
      width: width - padding * 2,
      height: height - headerHeight - legendHeight - watermarkHeight - padding * 0.5
    };

    // Draw title
    if (title) {
      ctx.fillStyle = themeConfig.textColor;
      ctx.font = `bold ${Math.min(width * 0.035, 42)}px "Source Serif 4", Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, headerHeight * 0.5);

      if (subtitle) {
        ctx.fillStyle = themeConfig.textColor;
        ctx.globalAlpha = 0.6;
        ctx.font = `${Math.min(width * 0.018, 20)}px "Source Sans 3", sans-serif`;
        ctx.fillText(subtitle, width / 2, headerHeight * 0.8);
        ctx.globalAlpha = 1;
      }
    }

    // Calculate network bounds and scale
    const bounds = getNetworkBounds();
    const networkScale = Math.min(
      networkArea.width / bounds.width,
      networkArea.height / bounds.height
    ) * 0.9;

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    const translateX = networkArea.x + networkArea.width / 2 - centerX * networkScale;
    const translateY = networkArea.y + networkArea.height / 2 - centerY * networkScale;

    // Create entity map for quick lookup
    const entityMap = new Map(network.entities.map(e => [e.id, e]));

    // Draw links
    ctx.lineWidth = isLombardi ? 1 : 1.5;
    ctx.strokeStyle = themeConfig.linkStroke;

    network.relationships.forEach(rel => {
      const source = entityMap.get(rel.source);
      const target = entityMap.get(rel.target);
      if (!source || !target) return;

      const sx = (source.x ?? 0) * networkScale + translateX;
      const sy = (source.y ?? 0) * networkScale + translateY;
      const ex = (target.x ?? 0) * networkScale + translateX;
      const ey = (target.y ?? 0) * networkScale + translateY;

      ctx.beginPath();
      ctx.strokeStyle = themeConfig.linkStroke;
      ctx.globalAlpha = isLombardi ? 0.9 : 0.6;

      // Draw curved line (Lombardi style)
      const dx = ex - sx;
      const dy = ey - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;
      const perpX = -dy / dist;
      const perpY = dx / dist;
      const curveOffset = dist * 0.15;
      const cpX = midX + perpX * curveOffset;
      const cpY = midY + perpY * curveOffset;

      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(cpX, cpY, ex, ey);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw relationship label on the curve
      if (showLabels && rel.label) {
        ctx.fillStyle = themeConfig.textColor;
        ctx.globalAlpha = 0.7;
        ctx.font = `${Math.max(9, width * 0.008)}px "Source Sans 3", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(rel.label, cpX, cpY - 4);
        ctx.globalAlpha = 1;
      }
    });

    // Draw nodes
    const baseRadius = Math.max(6, width * 0.006);

    network.entities.forEach(entity => {
      const x = (entity.x ?? 0) * networkScale + translateX;
      const y = (entity.y ?? 0) * networkScale + translateY;
      const radius = baseRadius * (0.8 + (entity.importance || 5) * 0.04);

      drawEntityShape(ctx, x, y, radius, entity.type, isLombardi);

      // Draw label
      if (showLabels) {
        ctx.fillStyle = themeConfig.textColor;
        ctx.font = `${Math.max(10, width * 0.009)}px "Source Sans 3", sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(entity.name, x + radius + 6, y + 4);
      }
    });

    // Draw legend
    if (showLegend) {
      const legendY = height - legendHeight - watermarkHeight + legendHeight * 0.5;
      const entityTypes = [...new Set(network.entities.map(e => e.type))];

      ctx.fillStyle = themeConfig.textColor;
      ctx.globalAlpha = 0.5;
      ctx.font = `bold ${Math.min(width * 0.01, 11)}px "Source Sans 3", sans-serif`;
      ctx.textAlign = 'left';

      let xPos = padding;
      ctx.fillText('ENTITIES:', xPos, legendY);
      xPos += 70;

      ctx.globalAlpha = 1;
      ctx.font = `${Math.min(width * 0.009, 10)}px "Source Sans 3", sans-serif`;

      entityTypes.slice(0, 5).forEach(type => {
        drawEntityShape(ctx, xPos + 8, legendY - 3, 5, type, isLombardi);
        ctx.fillStyle = themeConfig.textColor;
        ctx.fillText(type.charAt(0).toUpperCase() + type.slice(1), xPos + 18, legendY);
        xPos += 90;
      });
    }

    // Draw watermark
    if (showWatermark) {
      ctx.fillStyle = themeConfig.textColor;
      ctx.globalAlpha = 0.4;
      ctx.font = `${Math.min(width * 0.01, 12)}px "Source Sans 3", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(watermarkText, width / 2, height - watermarkHeight * 0.3);
      ctx.globalAlpha = 1;
    }
  }, [network, theme, themeConfig, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, getNetworkBounds, drawEntityShape]);

  // Render preview when options change
  useEffect(() => {
    if (open && canvasRef.current) {
      const { width, height } = EXPORT_FORMATS[format];
      // Render at reduced size for preview
      const previewScale = Math.min(500 / width, 350 / height);
      const previewWidth = width * previewScale;
      const previewHeight = height * previewScale;
      
      canvasRef.current.style.width = `${previewWidth}px`;
      canvasRef.current.style.height = `${previewHeight}px`;
      
      renderToCanvas(canvasRef.current, width, height, 1);
    }
  }, [open, format, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, renderToCanvas]);

  // Download PNG
  const handleDownloadPNG = async () => {
    setIsExporting(true);
    try {
      const { width, height } = EXPORT_FORMATS[format];
      const exportCanvas = document.createElement('canvas');
      renderToCanvas(exportCanvas, width, height, 2); // 2x scale for high quality

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/png',
          1.0
        );
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'network'}-${format}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('PNG downloaded successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PNG');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    setIsExporting(true);
    try {
      const { width, height } = EXPORT_FORMATS[format];
      const exportCanvas = document.createElement('canvas');
      renderToCanvas(exportCanvas, width, height, 2);

      const blob = await new Promise<Blob>((resolve, reject) => {
        exportCanvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/png',
          1.0
        );
      });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      toast.success('Copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      toast.error('Failed to copy to clipboard');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Create Artwork</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Options Panel */}
          <div className="space-y-4">
            {/* Format Selection */}
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as FormatKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPORT_FORMATS).map(([key, fmt]) => (
                    <SelectItem key={key} value={key}>
                      {fmt.label} ({fmt.width}×{fmt.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Network title..."
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional subtitle..."
              />
            </div>

            {/* Display Options */}
            <div className="space-y-3 pt-2">
              <Label className="text-muted-foreground">Display Options</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-labels"
                  checked={showLabels}
                  onCheckedChange={(c) => setShowLabels(!!c)}
                />
                <label htmlFor="show-labels" className="text-sm">Show Labels</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-legend"
                  checked={showLegend}
                  onCheckedChange={(c) => setShowLegend(!!c)}
                />
                <label htmlFor="show-legend" className="text-sm">Show Legend</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-watermark"
                  checked={showWatermark}
                  onCheckedChange={(c) => setShowWatermark(!!c)}
                />
                <label htmlFor="show-watermark" className="text-sm">Show Watermark</label>
              </div>
            </div>

            {showWatermark && (
              <div className="space-y-2">
                <Label>Watermark Text</Label>
                <Input
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="Made with Silent Partners"
                />
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div className="space-y-4">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center min-h-[300px]">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[350px] shadow-lg rounded"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadPNG}
                disabled={isExporting || network.entities.length === 0}
                className="flex-1"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PNG
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyToClipboard}
                disabled={isExporting || network.entities.length === 0}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
