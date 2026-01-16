/**
 * Silent Partners - Export Modal
 * 
 * High-quality artwork generation using SVG serialization.
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
import { entityColors } from '@/lib/store';
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

// Convert OKLCH to RGB hex
function oklchToHex(oklchStr: string): string {
  // Simple fallback - return a default color if we can't parse
  // This handles oklch colors that html2canvas can't process
  const match = oklchStr.match(/oklch\(([\d.]+)%?\s+([\d.]+)\s+([\d.]+)/);
  if (!match) return oklchStr;
  
  // Simplified conversion - just return approximate colors based on lightness
  const lightness = parseFloat(match[1]);
  if (lightness > 90) return '#f5f5f0'; // Light cream
  if (lightness > 50) return '#666666'; // Medium gray
  return '#1a1a1a'; // Dark
}

export default function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { network } = useNetwork();
  const { theme, config: themeConfig } = useCanvasTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [svgDataUrl, setSvgDataUrl] = useState<string | null>(null);
  
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

  // Capture the SVG when modal opens
  useEffect(() => {
    if (open) {
      setIsRendering(true);
      const captureSvg = () => {
        const svgElement = document.querySelector('#network-canvas svg') as SVGSVGElement;
        if (svgElement) {
          try {
            // Clone the SVG
            const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
            
            // Get dimensions
            const svgWidth = svgElement.clientWidth || 800;
            const svgHeight = svgElement.clientHeight || 600;
            
            // Set explicit dimensions
            svgClone.setAttribute('width', String(svgWidth));
            svgClone.setAttribute('height', String(svgHeight));
            svgClone.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);
            
            // Add xmlns
            svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            
            // Inline all computed styles and convert OKLCH colors
            const elements = svgClone.querySelectorAll('*');
            elements.forEach(el => {
              const computed = window.getComputedStyle(el as Element);
              const style = (el as HTMLElement).style;
              
              // Copy key styles
              ['fill', 'stroke', 'stroke-width', 'font-family', 'font-size', 'font-weight', 'opacity'].forEach(prop => {
                let value = computed.getPropertyValue(prop);
                if (value && value !== 'none') {
                  // Convert OKLCH colors
                  if (value.includes('oklch')) {
                    value = oklchToHex(value);
                  }
                  style.setProperty(prop, value);
                }
              });
            });
            
            // Serialize to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgClone);
            
            // Create data URL
            const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
            setSvgDataUrl(dataUrl);
          } catch (error) {
            console.error('Failed to capture SVG:', error);
          }
        }
        setIsRendering(false);
      };
      
      // Small delay to ensure network is fully rendered
      setTimeout(captureSvg, 300);
    }
  }, [open]);

  // Render final artwork to canvas
  const renderToCanvas = useCallback(async (canvas: HTMLCanvasElement, width: number, height: number, scale: number = 1): Promise<boolean> => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !svgDataUrl) return false;

    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Get background color - convert OKLCH if needed
    let bgColor = themeConfig.background;
    if (bgColor.includes('oklch')) {
      bgColor = theme === 'lombardi' ? '#f5f5f0' : '#1a1a1a';
    }
    
    let textColor = themeConfig.textColor;
    if (textColor.includes('oklch')) {
      textColor = theme === 'lombardi' ? '#1a1a1a' : '#f5f5f0';
    }

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Calculate layout areas
    const padding = width * 0.04;
    const headerHeight = title ? height * 0.12 : height * 0.02;
    const legendHeight = showLegend ? height * 0.06 : 0;
    const watermarkHeight = showWatermark ? height * 0.04 : 0;

    const networkArea = {
      x: padding,
      y: headerHeight,
      width: width - padding * 2,
      height: height - headerHeight - legendHeight - watermarkHeight - padding * 0.5
    };

    // Draw title
    if (title) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${Math.min(width * 0.04, 48)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText(title, width / 2, headerHeight * 0.45);

      if (subtitle) {
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.6;
        ctx.font = `${Math.min(width * 0.018, 22)}px sans-serif`;
        
        // Truncate subtitle if too long
        const maxSubtitleLength = 100;
        const displaySubtitle = subtitle.length > maxSubtitleLength 
          ? subtitle.substring(0, maxSubtitleLength) + '...'
          : subtitle;
        ctx.fillText(displaySubtitle, width / 2, headerHeight * 0.75);
        ctx.globalAlpha = 1;
      }
    }

    // Draw network from SVG
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const imgAspect = img.width / img.height;
        const areaAspect = networkArea.width / networkArea.height;
        
        let drawWidth, drawHeight, drawX, drawY;
        
        if (imgAspect > areaAspect) {
          drawWidth = networkArea.width;
          drawHeight = networkArea.width / imgAspect;
          drawX = networkArea.x;
          drawY = networkArea.y + (networkArea.height - drawHeight) / 2;
        } else {
          drawHeight = networkArea.height;
          drawWidth = networkArea.height * imgAspect;
          drawX = networkArea.x + (networkArea.width - drawWidth) / 2;
          drawY = networkArea.y;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

        // Draw legend
        if (showLegend) {
          const legendY = height - legendHeight - watermarkHeight + legendHeight * 0.6;
          const entityTypes = [...new Set(network.entities.map(e => e.type))];
          const isLombardi = theme === 'lombardi';

          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.5;
          ctx.font = `bold ${Math.min(width * 0.012, 14)}px sans-serif`;
          ctx.textAlign = 'left';

          let xPos = padding;
          ctx.fillText('ENTITIES:', xPos, legendY);
          xPos += 80;

          ctx.globalAlpha = 1;
          ctx.font = `${Math.min(width * 0.011, 13)}px sans-serif`;

          entityTypes.slice(0, 5).forEach(type => {
            ctx.beginPath();
            const isHollow = ['corporation', 'organization', 'financial', 'government'].includes(type);
            
            if (isLombardi) {
              ctx.arc(xPos + 10, legendY - 4, isHollow ? 7 : 5, 0, Math.PI * 2);
              ctx.fillStyle = isHollow ? bgColor : textColor;
              ctx.fill();
              if (isHollow) {
                ctx.strokeStyle = textColor;
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            } else {
              ctx.arc(xPos + 10, legendY - 4, 6, 0, Math.PI * 2);
              ctx.fillStyle = entityColors[type] || entityColors.unknown;
              ctx.fill();
            }

            ctx.fillStyle = textColor;
            ctx.fillText(type.charAt(0).toUpperCase() + type.slice(1), xPos + 22, legendY);
            xPos += 100;
          });
        }

        // Draw watermark
        if (showWatermark) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.4;
          ctx.font = `${Math.min(width * 0.012, 14)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(watermarkText, width / 2, height - watermarkHeight * 0.3);
          ctx.globalAlpha = 1;
        }

        resolve(true);
      };
      img.onerror = () => {
        console.error('Failed to load SVG image');
        resolve(false);
      };
      img.src = svgDataUrl;
    });
  }, [svgDataUrl, network, theme, themeConfig, title, subtitle, showLabels, showLegend, showWatermark, watermarkText]);

  // Render preview when options change
  useEffect(() => {
    if (open && canvasRef.current && svgDataUrl) {
      const { width, height } = EXPORT_FORMATS[format];
      // Render at reduced size for preview
      const previewScale = Math.min(450 / width, 320 / height);
      const previewWidth = Math.floor(width * previewScale);
      const previewHeight = Math.floor(height * previewScale);
      
      canvasRef.current.style.width = `${previewWidth}px`;
      canvasRef.current.style.height = `${previewHeight}px`;
      
      renderToCanvas(canvasRef.current, width, height, previewScale);
    }
  }, [open, format, title, subtitle, showLabels, showLegend, showWatermark, watermarkText, svgDataUrl, renderToCanvas]);

  // Download PNG
  const handleDownloadPNG = async () => {
    if (!svgDataUrl) {
      toast.error('Network not captured yet. Please wait.');
      return;
    }
    
    setIsExporting(true);
    try {
      const { width, height } = EXPORT_FORMATS[format];
      const exportCanvas = document.createElement('canvas');
      const success = await renderToCanvas(exportCanvas, width, height, 2); // 2x scale for high quality

      if (!success) {
        throw new Error('Failed to render network');
      }

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
    if (!svgDataUrl) {
      toast.error('Network not captured yet. Please wait.');
      return;
    }
    
    setIsExporting(true);
    try {
      const { width, height } = EXPORT_FORMATS[format];
      const exportCanvas = document.createElement('canvas');
      const success = await renderToCanvas(exportCanvas, width, height, 2);

      if (!success) {
        throw new Error('Failed to render network');
      }

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
              {isRendering ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Capturing network...</span>
                </div>
              ) : !svgDataUrl ? (
                <div className="text-muted-foreground text-sm">
                  No network to preview
                </div>
              ) : (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[320px] shadow-lg rounded"
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadPNG}
                disabled={isExporting || !svgDataUrl}
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
                disabled={isExporting || !svgDataUrl}
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
