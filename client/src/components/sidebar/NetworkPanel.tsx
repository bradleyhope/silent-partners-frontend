/**
 * Silent Partners - Network Panel
 *
 * Network info, save/share/export, investigation templates, and graph tools.
 */

import { useState, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Loader2, Download, Share2, Save, RotateCcw, RefreshCw, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNetwork } from '@/contexts/NetworkContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { generateId, Entity, Relationship } from '@/lib/store';
import pako from 'pako';
import ExportModal from '@/components/ExportModal';
import { INVESTIGATION_TEMPLATES } from './InvestigationTemplates';

interface NetworkPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate?: (query: string) => void;
}

export default function NetworkPanel({ isOpen, onOpenChange, onSelectTemplate }: NetworkPanelProps) {
  const { network, dispatch, clearNetwork, addEntitiesAndRelationships, setNetwork } = useNetwork();
  const { isAuthenticated } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [savedGraphId, setSavedGraphId] = useState<number | null>(null);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load example network from pre-built data or template
  const handleLoadExample = useCallback(
    async (exampleId: string) => {
      const template = INVESTIGATION_TEMPLATES.find((t) => t.id === exampleId);
      if (!template) return;

      // For templates with placeholders, open AI panel with the query
      if (template.query.includes('[')) {
        dispatch({
          type: 'UPDATE_NETWORK',
          payload: { title: template.name.replace(/^[^\s]+\s/, ''), description: template.description },
        });
        onSelectTemplate?.(template.query);
        toast.info(`Template loaded! Replace the [placeholder] with your target and submit.`);
        return;
      }

      // For pre-built examples, load the data
      setIsProcessing(true);
      clearNetwork();

      try {
        toast.info(`Loading ${template.name}...`);

        // Load pre-built data from initial_data.js
        const initialData = (
          window as unknown as {
            silentPartners?: {
              initialData?: Record<
                string,
                {
                  title: string;
                  description: string;
                  nodes: Array<{ id: string; name: string; type: string; importance?: number; description?: string }>;
                  links: Array<{ source: string; target: string; type: string; label?: string }>;
                }
              >;
            };
          }
        ).silentPartners?.initialData;

        let networkData: {
          title: string;
          description: string;
          nodes: Array<{ id: string; name: string; type: string; importance?: number; description?: string }>;
          links: Array<{ source: string; target: string; type: string; label?: string }>;
        } | null = null;

        if (exampleId === '1mdb' && initialData?.oneMDB) {
          networkData = initialData.oneMDB;
        } else if (exampleId === 'bcci' && initialData?.bcci) {
          networkData = initialData.bcci;
        } else if (exampleId === 'epstein' && initialData?.epstein) {
          networkData = initialData.epstein;
        }

        if (!networkData) {
          // Fallback to API if pre-built data not available
          toast.info('Pre-built data not found, fetching from API...');
          const result = await api.discover(template.query, 'gpt-5', 5);

          const apiIdToOurId = new Map<string, string>();
          const entities: Entity[] = result.entities.map((e) => {
            const ourId = generateId();
            if (e.id) apiIdToOurId.set(e.id, ourId);
            apiIdToOurId.set(e.name.toLowerCase(), ourId);
            return {
              id: ourId,
              name: e.name,
              type: (e.type as Entity['type']) || 'unknown',
              description: e.description,
              importance: e.importance || 5,
            };
          });
          const relationships: Relationship[] = result.relationships
            .map((r) => {
              const sourceId = apiIdToOurId.get(r.source) || apiIdToOurId.get(r.source.toLowerCase()) || r.source;
              const targetId = apiIdToOurId.get(r.target) || apiIdToOurId.get(r.target.toLowerCase()) || r.target;
              return {
                id: generateId(),
                source: sourceId,
                target: targetId,
                type: r.type,
                label: r.label || r.type,
              };
            })
            .filter(
              (r) => entities.some((e) => e.id === r.source) && entities.some((e) => e.id === r.target)
            );

          dispatch({ type: 'UPDATE_NETWORK', payload: { title: template.name } });
          addEntitiesAndRelationships(entities, relationships);
          toast.success(`Loaded ${template.name}`);
          return;
        }

        // Convert pre-built data format to our format
        const entities: Entity[] = networkData.nodes.map((n) => ({
          id: n.id,
          name: n.name,
          type: (n.type as Entity['type']) || 'unknown',
          description: n.description,
          importance: n.importance ? Math.round(n.importance * 10) : 5,
        }));

        const relationships: Relationship[] = networkData.links.map((e, i) => ({
          id: `rel_${i}`,
          source: e.source,
          target: e.target,
          type: e.type,
          label: e.label || e.type,
        }));

        // Use setNetwork for instant loading (no animation) of pre-built networks
        setNetwork({
          ...network,
          title: networkData.title,
          description: networkData.description,
          entities,
          relationships,
        });

        toast.success(`Loaded ${template.name} (${entities.length} entities, ${relationships.length} connections)`);
      } catch (error) {
        console.error('Failed to load example:', error);
        toast.error('Failed to load example network');
      } finally {
        setIsProcessing(false);
      }
    },
    [clearNetwork, dispatch, addEntitiesAndRelationships, setNetwork, network, onSelectTemplate]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (network.entities.length === 0) {
      toast.error('Nothing to save - add some entities first');
      return;
    }

    setIsSaving(true);
    try {
      if (isAuthenticated) {
        const { id } = await api.saveGraph({
          name: network.title,
          description: network.description,
          entities: network.entities.map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            description: e.description,
          })),
          relationships: network.relationships.map((r) => ({
            source: r.source,
            target: r.target,
            type: r.type,
            label: r.label,
          })),
        });
        setSavedGraphId(id);
        toast.success('Network saved to cloud!');
      } else {
        const networkData = {
          title: network.title || 'Untitled Network',
          description: network.description,
          entities: network.entities,
          relationships: network.relationships,
          savedAt: new Date().toISOString(),
        };
        const savedNetworks = JSON.parse(localStorage.getItem('silentPartners_savedNetworks') || '[]');
        const existingIndex = savedNetworks.findIndex((n: { title: string }) => n.title === networkData.title);
        if (existingIndex >= 0) {
          savedNetworks[existingIndex] = networkData;
        } else {
          savedNetworks.push(networkData);
        }
        localStorage.setItem('silentPartners_savedNetworks', JSON.stringify(savedNetworks));
        toast.success('Network saved locally! Sign in to save to cloud.');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save network');
    } finally {
      setIsSaving(false);
    }
  }, [network, isAuthenticated]);

  // Handle share
  const handleShare = useCallback(async () => {
    if (network.entities.length === 0) {
      toast.error('Nothing to share - add some entities first');
      return;
    }

    setIsSharing(true);
    try {
      if (isAuthenticated) {
        const { id } = await api.saveGraph({
          name: network.title,
          description: network.description,
          entities: network.entities.map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            description: e.description,
          })),
          relationships: network.relationships.map((r) => ({
            source: r.source,
            target: r.target,
            type: r.type,
            label: r.label,
          })),
        });
        const { share_url } = await api.shareGraph(id);
        await navigator.clipboard.writeText(share_url);
        toast.success('Share link copied to clipboard!');
      } else {
        const networkData = {
          title: network.title || 'Untitled Network',
          description: network.description,
          entities: network.entities,
          relationships: network.relationships,
        };
        const jsonString = JSON.stringify(networkData);
        const compressed = pako.deflate(jsonString);
        const base64Data = btoa(String.fromCharCode.apply(null, Array.from(compressed) as number[]));
        const shareUrl = `${window.location.origin}/share?data=${encodeURIComponent(base64Data)}`;

        if (shareUrl.length > 2000) {
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${network.title || 'network'}.json`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Network exported as JSON file (too large for URL sharing)');
        } else {
          await navigator.clipboard.writeText(shareUrl);
          toast.success('Share link copied! Sign in for cloud sharing.');
        }
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to share network');
    } finally {
      setIsSharing(false);
    }
  }, [network, isAuthenticated]);

  // Export handlers
  const handleExportJson = useCallback(() => {
    const data = JSON.stringify(network, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${network.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Network exported as JSON');
    setShowExportMenu(false);
  }, [network]);

  const handleExportSvg = useCallback(() => {
    const container = document.querySelector('#network-canvas');
    const svg = container?.querySelector('svg');
    if (!svg || !container) {
      toast.error('No network to export');
      return;
    }

    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const bgColor = window.getComputedStyle(container).backgroundColor || '#F5F0E6';
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', bgColor);
    svgClone.insertBefore(bgRect, svgClone.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${network.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Network exported as SVG');
    setShowExportMenu(false);
  }, [network]);

  const handleExportPng = useCallback(() => {
    const container = document.querySelector('#network-canvas');
    const svg = container?.querySelector('svg');
    if (!svg || !container) {
      toast.error('No network to export');
      return;
    }

    toast.info('Preparing high-resolution export...');

    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    const bgColor = window.getComputedStyle(container).backgroundColor || '#F5F0E6';
    const nodes = svgClone.querySelectorAll('g.node');
    if (nodes.length === 0) {
      toast.error('No entities to export');
      return;
    }

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    nodes.forEach((node) => {
      const transform = node.getAttribute('transform');
      if (transform) {
        const match = transform.match(/translate\(([\d.-]+),\s*([\d.-]+)\)/);
        if (match) {
          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    });

    const padding = 150;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const networkWidth = maxX - minX;
    const networkHeight = maxY - minY;
    const targetSize = 4000;
    const aspectRatio = networkWidth / networkHeight;
    let outputWidth: number, outputHeight: number;

    if (aspectRatio > 1) {
      outputWidth = targetSize;
      outputHeight = targetSize / aspectRatio;
    } else {
      outputHeight = targetSize;
      outputWidth = targetSize * aspectRatio;
    }

    svgClone.setAttribute('width', String(outputWidth));
    svgClone.setAttribute('height', String(outputHeight));
    svgClone.setAttribute('viewBox', `${minX} ${minY} ${networkWidth} ${networkHeight}`);

    const contentGroup = svgClone.querySelector('g.canvas-content');
    if (contentGroup) {
      contentGroup.removeAttribute('transform');
    }

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', String(minX));
    bgRect.setAttribute('y', String(minY));
    bgRect.setAttribute('width', String(networkWidth));
    bgRect.setAttribute('height', String(networkHeight));
    bgRect.setAttribute('fill', bgColor);
    svgClone.insertBefore(bgRect, svgClone.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, outputWidth, outputHeight);

        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${network.title.toLowerCase().replace(/\s+/g, '-')}.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
            toast.success(`Exported ${Math.round(outputWidth)}x${Math.round(outputHeight)} PNG`);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      toast.error('Failed to export PNG. Try SVG export instead.');
      URL.revokeObjectURL(url);
    };
    img.src = url;
    setShowExportMenu(false);
  }, [network]);

  // Handle deduplication
  const handleDeduplicate = useCallback(async () => {
    if (!savedGraphId) {
      toast.error('Please save the network first to use deduplication');
      return;
    }

    setIsDeduplicating(true);
    try {
      const dryResult = await api.deduplicateEntities(savedGraphId, true, 0.75);

      if (dryResult.result.duplicates_found === 0) {
        toast.success('No duplicate entities found!');
        return;
      }

      const mergeList = dryResult.result.potential_merges
        .map((m) => `"${m.entity1.name}" → "${m.entity2.name}" (${Math.round(m.confidence * 100)}%)`)
        .join('\n');

      if (!confirm(`Found ${dryResult.result.duplicates_found} potential duplicates:\n\n${mergeList}\n\nMerge them?`)) {
        return;
      }

      const result = await api.deduplicateEntities(savedGraphId, false, 0.75);
      toast.success(`Merged ${result.result.merged_count || 0} duplicate entities`);
    } catch (error) {
      console.error('Deduplication error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deduplicate');
    } finally {
      setIsDeduplicating(false);
    }
  }, [savedGraphId]);

  // Handle normalization
  const handleNormalize = useCallback(async () => {
    if (!savedGraphId) {
      toast.error('Please save the network first to use normalization');
      return;
    }

    setIsNormalizing(true);
    try {
      const dryResult = await api.normalizeRelationships(savedGraphId, true);

      if (dryResult.result.type_changes === 0 && dryResult.result.duplicates_found === 0) {
        toast.success('All relationships are already normalized!');
        return;
      }

      const changes = dryResult.result.changes
        .slice(0, 5)
        .map((c) => `"${c.original_type}" → "${c.canonical_type}"`)
        .join('\n');

      if (
        !confirm(
          `Found ${dryResult.result.type_changes} type changes and ${dryResult.result.duplicates_found} duplicates.\n\nExamples:\n${changes}\n\nApply normalization?`
        )
      ) {
        return;
      }

      const result = await api.normalizeRelationships(savedGraphId, false);
      toast.success(
        `Normalized ${result.result.type_changes} relationships, removed ${result.result.duplicates_found} duplicates`
      );
    } catch (error) {
      console.error('Normalization error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to normalize');
    } finally {
      setIsNormalizing(false);
    }
  }, [savedGraphId]);

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">Network</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          <div>
            <Label htmlFor="title" className="text-xs text-muted-foreground">
              Title
            </Label>
            <Input
              id="title"
              value={network.title}
              onChange={(e) => dispatch({ type: 'UPDATE_NETWORK', payload: { title: e.target.value } })}
              className="h-8 text-sm bg-background"
              placeholder="Untitled Network"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-xs text-muted-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              value={network.description}
              onChange={(e) => dispatch({ type: 'UPDATE_NETWORK', payload: { description: e.target.value } })}
              className="text-sm bg-background resize-none"
              rows={2}
              placeholder="Brief description..."
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Investigation Templates</Label>
            <Select onValueChange={handleLoadExample} disabled={isProcessing}>
              <SelectTrigger className="h-8 text-sm bg-background">
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Corporate
                </div>
                {INVESTIGATION_TEMPLATES.filter((t) => t.category === 'corporate').map((t) => (
                  <SelectItem key={t.id} value={t.id} className="py-2">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                  Financial
                </div>
                {INVESTIGATION_TEMPLATES.filter((t) => t.category === 'financial').map((t) => (
                  <SelectItem key={t.id} value={t.id} className="py-2">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                  People
                </div>
                {INVESTIGATION_TEMPLATES.filter((t) => t.category === 'people').map((t) => (
                  <SelectItem key={t.id} value={t.id} className="py-2">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">
                  Examples
                </div>
                {INVESTIGATION_TEMPLATES.filter((t) => t.category === 'examples').map((t) => (
                  <SelectItem key={t.id} value={t.id} className="py-2">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => {
                if (network.entities.length > 0 && !confirm('Clear all entities and start fresh?')) return;
                clearNetwork();
                dispatch({ type: 'UPDATE_NETWORK', payload: { title: 'Untitled Network', description: '' } });
                toast.success('Canvas cleared');
              }}
              title="Start fresh"
            >
              <RotateCcw className="w-3 h-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={handleSave}
              disabled={isSaving || network.entities.length === 0}
            >
              {isSaving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={handleShare}
              disabled={isSharing || network.entities.length === 0}
            >
              {isSharing ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Share2 className="w-3 h-3 mr-1" />}
              Share
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2"
                onClick={() => setShowExportMenu((prev) => !prev)}
                disabled={network.entities.length === 0}
              >
                <Download className="w-3 h-3" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[140px]">
                  <button
                    onClick={() => {
                      setShowExportModal(true);
                      setShowExportMenu(false);
                    }}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors font-medium text-primary"
                  >
                    Create Artwork
                  </button>
                  <div className="border-t border-border" />
                  <button
                    onClick={handleExportPng}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors"
                  >
                    Quick PNG
                  </button>
                  <button
                    onClick={handleExportSvg}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors"
                  >
                    Export SVG
                  </button>
                  <button
                    onClick={handleExportJson}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors border-t border-border"
                  >
                    Export JSON
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Graph Tools - Deduplication and Normalization */}
          {network.entities.length > 0 && (
            <div className="pt-2 border-t border-sidebar-border/50">
              <div className="text-xs font-medium text-muted-foreground mb-2">Graph Tools</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={handleDeduplicate}
                  disabled={isDeduplicating || !savedGraphId}
                  title={savedGraphId ? 'Find and merge duplicate entities' : 'Save network first to use this feature'}
                >
                  {isDeduplicating ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Dedupe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={handleNormalize}
                  disabled={isNormalizing || !savedGraphId}
                  title={savedGraphId ? 'Normalize relationship types' : 'Save network first to use this feature'}
                >
                  {isNormalizing ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
                  Normalize
                </Button>
              </div>
              {!savedGraphId && (
                <p className="text-xs text-muted-foreground mt-1 italic">Save network to enable graph tools</p>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Export Modal */}
      <ExportModal open={showExportModal} onOpenChange={setShowExportModal} />
    </>
  );
}
