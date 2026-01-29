/**
 * Silent Partners - Sidebar
 * 
 * Three-section sidebar: Network Info, AI Input, View Options
 * Design: Archival Investigator with gold accents
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Loader2, Download, Share2, Save, Plus, Link, Upload, FileText, Search, X, Trash2, Sparkles, Wand2, AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import api, { DocumentTooLargeError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCanvasTheme, CanvasTheme } from '@/contexts/CanvasThemeContext';
import { generateId, Entity, Relationship } from '@/lib/store';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { extractTextFromPdf, isPdfFile } from '@/lib/pdf-utils';
import pako from 'pako';
import ExportModal from './ExportModal';
import StreamingProgress from './StreamingProgress';
import { useStreamingPipeline } from '@/hooks/useStreamingPipeline';
import UnifiedAIInput from './UnifiedAIInput';

// Investigation templates organized by use case
const INVESTIGATION_TEMPLATES = [
  // Corporate Investigations
  { id: 'corporate-structure', name: 'Corporate Structure', category: 'corporate', 
    query: 'Map the ownership structure, subsidiaries, and key executives of [Company Name]',
    description: 'Trace corporate hierarchies and beneficial ownership' },
  { id: 'due-diligence', name: 'Due Diligence', category: 'corporate',
    query: 'Research [Person/Company] background, business history, legal issues, and key relationships',
    description: 'Background check for business partnerships' },
  
  // Financial Investigations  
  { id: 'money-trail', name: 'Money Trail', category: 'financial',
    query: 'Trace the flow of funds and financial relationships involving [Entity]',
    description: 'Follow financial connections and transactions' },
  { id: 'shell-companies', name: 'Shell Company Network', category: 'financial',
    query: 'Map shell companies, offshore entities, and nominee directors connected to [Entity]',
    description: 'Uncover hidden corporate structures' },
    
  // People Networks
  { id: 'influence-network', name: 'Influence Network', category: 'people',
    query: 'Map the professional network, board memberships, and political connections of [Person]',
    description: 'Understand who influences whom' },
  { id: 'family-business', name: 'Family Business', category: 'people',
    query: 'Map family members and their business interests for [Family Name]',
    description: 'Family business empires and dynasties' },
    
  // Historical Examples (pre-built networks)
  { id: '1mdb', name: '1MDB Scandal', category: 'examples',
    query: 'Map the key players and financial connections in the 1MDB scandal involving Jho Low and Malaysian government officials',
    description: 'Multi-billion dollar embezzlement case',
    prebuilt: true },
  { id: 'bcci', name: 'BCCI', category: 'examples',
    query: 'Map the Bank of Credit and Commerce International scandal network including key figures and shell companies',
    description: 'Historic banking fraud network',
    prebuilt: true },
  { id: 'epstein', name: 'Epstein Network', category: 'examples',
    query: 'Map Jeffrey Epstein network of associates, connections to financial institutions and powerful individuals',
    description: 'Power and influence network',
    prebuilt: true },
];

// Keep old reference for backward compatibility
const EXAMPLE_NETWORKS = INVESTIGATION_TEMPLATES;

import { NarrativeEvent } from './NarrativePanel';

interface SidebarProps {
  onNarrativeEvent?: (event: Omit<NarrativeEvent, 'id' | 'timestamp'>) => void;
  setIsProcessing?: (processing: boolean) => void;
}

export default function Sidebar({ onNarrativeEvent, setIsProcessing: setParentProcessing }: SidebarProps = {}) {
  const { network, dispatch, addEntitiesAndRelationships, clearNetwork, selectEntity, setNetwork } = useNetwork();
  const { isAuthenticated } = useAuth();
  const { theme, setTheme, showAllLabels, setShowAllLabels } = useCanvasTheme();
  const { isOpen: mobileOpen, close: closeMobile } = useMobileSidebar();
  const [networkOpen, setNetworkOpen] = useState(true);

  // Close mobile sidebar when selecting an entity or loading a network
  useEffect(() => {
    if (network.entities.length > 0 && mobileOpen) {
      // Small delay to allow the action to complete
      const timer = setTimeout(() => closeMobile(), 300);
      return () => clearTimeout(timer);
    }
  }, [network.entities.length]);
  const [aiOpen, setAiOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  
  // AI input state
  const [aiInput, setAiInput] = useState('');
  const [aiActionMode, setAiActionMode] = useState<'extract' | 'discover' | 'connect'>('extract');
  const [aiMode, setAiMode] = useState<'add' | 'new'>('add');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Manual add sections
  const [manualOpen, setManualOpen] = useState(false);
  
  // Add entity form state
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<Entity['type']>('person');
  const [entityImportance, setEntityImportance] = useState(5);
  const [entityDate, setEntityDate] = useState('');
  
  // Add relationship form state
  const [relSource, setRelSource] = useState('');
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState('');
  const [relLabel, setRelLabel] = useState('');
  
  // PDF upload state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [savedGraphId, setSavedGraphId] = useState<number | null>(null);
  
  // Deduplication and normalization state
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState(false);
  
  // Tools section state
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isRemovingOrphans, setIsRemovingOrphans] = useState(false);
  const [isFindingLinks, setIsFindingLinks] = useState(false);
  const [isEnrichingAll, setIsEnrichingAll] = useState(false);
  const [toolPrompt, setToolPrompt] = useState('');

  // Streaming pipeline hook for real-time graph building
  const { state: streamingState, startExtraction, startResearch, cancel: cancelStreaming } = useStreamingPipeline();
  
  // Use streaming state to control processing indicator
  const isStreamingActive = streamingState.isStreaming;


  // Handle AI extraction/discovery - now uses streaming pipeline
  const handleAiSubmit = useCallback(() => {
    if (!aiInput.trim()) {
      toast.error('Please enter some text or a question');
      return;
    }

    // Determine if this is a question (discover/query) or text (extract)
    const isQuestion = aiInput.trim().endsWith('?') || 
      aiInput.toLowerCase().startsWith('who') ||
      aiInput.toLowerCase().startsWith('what') ||
      aiInput.toLowerCase().startsWith('how') ||
      aiInput.toLowerCase().startsWith('find') ||
      aiInput.toLowerCase().startsWith('map') ||
      aiInput.length < 200;

    // Use streaming pipeline for real-time graph building
    if (isQuestion) {
      // Research query - uses Perplexity to search and extract
      startExtraction('query', aiInput, { clearFirst: aiMode === 'new' });
    } else {
      // Text extraction - directly extracts entities from text
      startExtraction('text', aiInput, { clearFirst: aiMode === 'new' });
    }
    
    setAiInput('');
  }, [aiInput, aiMode, startExtraction]);

  // Handle Find Connection mode - uses streaming research pipeline
  const handleConnectSubmit = useCallback(() => {
    if (!aiInput.trim()) {
      toast.error('Please enter two names to find connections between');
      return;
    }

    // Parse the input to extract two entity names
    // Support formats: "A and B", "A, B", "A to B", "A -> B"
    const input = aiInput.trim();
    let entity1 = '';
    let entity2 = '';
    
    const separators = [' and ', ', ', ' to ', ' -> ', ' & '];
    for (const sep of separators) {
      if (input.toLowerCase().includes(sep)) {
        const parts = input.split(new RegExp(sep, 'i'));
        if (parts.length >= 2) {
          entity1 = parts[0].trim();
          entity2 = parts[1].trim();
          break;
        }
      }
    }
    
    if (!entity1 || !entity2) {
      toast.error('Please enter two names separated by "and", ",", or "to"');
      return;
    }
    
    // Use streaming research pipeline for real-time connection building
    startResearch(entity1, entity2, { clearFirst: aiMode === 'new' });
    setAiInput('');
  }, [aiInput, aiMode, startResearch]);

  // Load example network from pre-built data or template
  const handleLoadExample = useCallback(async (exampleId: string) => {
    const template = INVESTIGATION_TEMPLATES.find((t) => t.id === exampleId);
    if (!template) return;
    
    // For templates with placeholders, open AI panel with the query
    if (template.query.includes('[')) {
      // This is a template that needs user input
      setAiOpen(true);
      setAiInput(template.query);
      dispatch({ type: 'UPDATE_NETWORK', payload: { title: template.name.replace(/^[^\s]+\s/, ''), description: template.description } });
      toast.info(`Template loaded! Replace the [placeholder] with your target and submit.`);
      return;
    }
    
    // For pre-built examples, load the data
    const example = template;

    setIsProcessing(true);
    clearNetwork();
    
    try {
      toast.info(`Loading ${example.name}...`);
      
      // Load pre-built data from initial_data.js
      // The file is loaded as a script and sets window.silentPartners.initialData
      const initialData = (window as unknown as { silentPartners?: { initialData?: Record<string, { title: string; description: string; nodes: Array<{ id: string; name: string; type: string; importance?: number; description?: string }>; links: Array<{ source: string; target: string; type: string; label?: string }> }> } }).silentPartners?.initialData;
      
      let networkData: { title: string; description: string; nodes: Array<{ id: string; name: string; type: string; importance?: number; description?: string }>; links: Array<{ source: string; target: string; type: string; label?: string }> } | null = null;
      
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
        const result = await api.discover(example.query, 'gpt-5', 5);
        
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
        const relationships: Relationship[] = result.relationships.map((r) => {
          const sourceId = apiIdToOurId.get(r.source) || apiIdToOurId.get(r.source.toLowerCase()) || r.source;
          const targetId = apiIdToOurId.get(r.target) || apiIdToOurId.get(r.target.toLowerCase()) || r.target;
          return {
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: r.type,
            label: r.label || r.type,
          };
        }).filter((r) => entities.some((e) => e.id === r.source) && entities.some((e) => e.id === r.target));
        
        dispatch({ type: 'UPDATE_NETWORK', payload: { title: example.name } });
        addEntitiesAndRelationships(entities, relationships);
        toast.success(`Loaded ${example.name}`);
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
      
      toast.success(`Loaded ${example.name} (${entities.length} entities, ${relationships.length} connections)`);
    } catch (error) {
      console.error('Failed to load example:', error);
      toast.error('Failed to load example network');
    } finally {
      setIsProcessing(false);
    }
  }, [clearNetwork, dispatch, addEntitiesAndRelationships, setNetwork, network]);

  // Export format state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Export network as JSON
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

  // Export network as SVG
  const handleExportSvg = useCallback(() => {
    const container = document.querySelector('#network-canvas');
    const svg = container?.querySelector('svg');
    if (!svg || !container) {
      toast.error('No network to export');
      return;
    }
    
    // Clone the SVG to avoid modifying the original
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    
    // Add XML declaration and namespace
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Get background color from container
    const bgColor = window.getComputedStyle(container).backgroundColor || '#F5F0E6';
    
    // Add background rect as first child
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

  // Export network as PNG - captures full network at high resolution
  const handleExportPng = useCallback(() => {
    const container = document.querySelector('#network-canvas');
    const svg = container?.querySelector('svg');
    if (!svg || !container) {
      toast.error('No network to export');
      return;
    }
    
    toast.info('Preparing high-resolution export...');
    
    // Clone and prepare SVG
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // Get background color from container
    const bgColor = window.getComputedStyle(container).backgroundColor || '#F5F0E6';
    
    // Find the content group (g.canvas-content) and get its transform
    const contentGroup = svgClone.querySelector('g.canvas-content');
    
    // Calculate the bounding box of all nodes to determine full network extent
    const nodes = svgClone.querySelectorAll('g.node');
    if (nodes.length === 0) {
      toast.error('No entities to export');
      return;
    }
    
    // Parse node positions from transform attributes
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
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
    
    // Add padding around the network
    const padding = 150;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate the network dimensions
    const networkWidth = maxX - minX;
    const networkHeight = maxY - minY;
    
    // Set a high-resolution output size while maintaining aspect ratio
    const targetSize = 4000; // 4K resolution
    const aspectRatio = networkWidth / networkHeight;
    let outputWidth: number, outputHeight: number;
    
    if (aspectRatio > 1) {
      outputWidth = targetSize;
      outputHeight = targetSize / aspectRatio;
    } else {
      outputHeight = targetSize;
      outputWidth = targetSize * aspectRatio;
    }
    
    // Update SVG dimensions and viewBox to show full network
    svgClone.setAttribute('width', String(outputWidth));
    svgClone.setAttribute('height', String(outputHeight));
    svgClone.setAttribute('viewBox', `${minX} ${minY} ${networkWidth} ${networkHeight}`);
    
    // Remove any transform on the content group (we're using viewBox now)
    if (contentGroup) {
      contentGroup.removeAttribute('transform');
    }
    
    // Add background rect as first child
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
        // Fill background first
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

  // Legacy export handler (for backward compatibility)
  const handleExport = useCallback(() => {
    setShowExportMenu(prev => !prev);
  }, []);

  // Handle save - saves to cloud if authenticated, otherwise saves locally
  const handleSave = useCallback(async () => {
    if (network.entities.length === 0) {
      toast.error('Nothing to save - add some entities first');
      return;
    }

    setIsSaving(true);
    try {
      if (isAuthenticated) {
        // Save to cloud
        const { id } = await api.saveGraph({
          name: network.title,
          description: network.description,
          entities: network.entities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            description: e.description,
          })),
          relationships: network.relationships.map(r => ({
            source: r.source,
            target: r.target,
            type: r.type,
            label: r.label,
          })),
        });
        setSavedGraphId(id);
        toast.success('Network saved to cloud!');
      } else {
        // Save to localStorage
        const networkData = {
          title: network.title || 'Untitled Network',
          description: network.description,
          entities: network.entities,
          relationships: network.relationships,
          savedAt: new Date().toISOString(),
        };
        const savedNetworks = JSON.parse(localStorage.getItem('silentPartners_savedNetworks') || '[]');
        // Check if network with same title exists and update it
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

  // Handle deduplication - find and merge duplicate entities
  const handleDeduplicate = useCallback(async () => {
    if (!savedGraphId) {
      toast.error('Please save the network first to use deduplication');
      return;
    }
    
    setIsDeduplicating(true);
    try {
      // First do a dry run to see what would be merged
      const dryResult = await api.deduplicateEntities(savedGraphId, true, 0.75);
      
      if (dryResult.result.duplicates_found === 0) {
        toast.success('No duplicate entities found!');
        return;
      }
      
      // Show what would be merged and ask for confirmation
      const mergeList = dryResult.result.potential_merges
        .map(m => `"${m.entity1.name}" \u2192 "${m.entity2.name}" (${Math.round(m.confidence * 100)}%)`)
        .join('\n');
      
      if (!confirm(`Found ${dryResult.result.duplicates_found} potential duplicates:\n\n${mergeList}\n\nMerge them?`)) {
        return;
      }
      
      // Apply the merges
      const result = await api.deduplicateEntities(savedGraphId, false, 0.75);
      toast.success(`Merged ${result.result.merged_count || 0} duplicate entities`);
      
      // Reload the graph to reflect changes
      // TODO: Implement graph reload
    } catch (error) {
      console.error('Deduplication error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deduplicate');
    } finally {
      setIsDeduplicating(false);
    }
  }, [savedGraphId]);

  // Handle relationship normalization
  const handleNormalize = useCallback(async () => {
    if (!savedGraphId) {
      toast.error('Please save the network first to use normalization');
      return;
    }
    
    setIsNormalizing(true);
    try {
      // First do a dry run
      const dryResult = await api.normalizeRelationships(savedGraphId, true);
      
      if (dryResult.result.type_changes === 0 && dryResult.result.duplicates_found === 0) {
        toast.success('All relationships are already normalized!');
        return;
      }
      
      const changes = dryResult.result.changes.slice(0, 5)
        .map(c => `"${c.original_type}" \u2192 "${c.canonical_type}"`)
        .join('\n');
      
      if (!confirm(`Found ${dryResult.result.type_changes} type changes and ${dryResult.result.duplicates_found} duplicates.\n\nExamples:\n${changes}\n\nApply normalization?`)) {
        return;
      }
      
      // Apply the normalization
      const result = await api.normalizeRelationships(savedGraphId, false);
      toast.success(`Normalized ${result.result.type_changes} relationships, removed ${result.result.duplicates_found} duplicates`);
      
    } catch (error) {
      console.error('Normalization error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to normalize');
    } finally {
      setIsNormalizing(false);
    }
  }, [savedGraphId]);

  // Handle share network
  const [isSharing, setIsSharing] = useState(false);
  const handleShare = useCallback(async () => {
    if (network.entities.length === 0) {
      toast.error('Nothing to share - add some entities first');
      return;
    }

    setIsSharing(true);
    try {
      if (isAuthenticated) {
        // Share via cloud - save and get share link
        const { id } = await api.saveGraph({
          name: network.title,
          description: network.description,
          entities: network.entities.map(e => ({
            id: e.id,
            name: e.name,
            type: e.type,
            description: e.description,
          })),
          relationships: network.relationships.map(r => ({
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
        // Share as compressed JSON data URL - encode network data and copy as shareable link
        const networkData = {
          title: network.title || 'Untitled Network',
          description: network.description,
          entities: network.entities,
          relationships: network.relationships,
        };
        const jsonString = JSON.stringify(networkData);
        // Compress with pako for smaller URLs
        const compressed = pako.deflate(jsonString);
        const base64Data = btoa(String.fromCharCode(...compressed));
        const shareUrl = `${window.location.origin}/share?data=${encodeURIComponent(base64Data)}`;
        
        // If URL is too long, fall back to downloading JSON
        if (shareUrl.length > 2000) {
          // Download as JSON file instead
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

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = network.entities.filter(e => 
      e.name.toLowerCase().includes(lowerQuery) ||
      e.type.toLowerCase().includes(lowerQuery) ||
      (e.description && e.description.toLowerCase().includes(lowerQuery))
    );
    setSearchResults(results);
  }, [network.entities]);

  // Handle PDF upload - client-side extraction then AI analysis
  const MAX_PAGES = 20; // Maximum pages allowed
  
  const handlePdfUpload = useCallback(async (file: File) => {
    if (!isPdfFile(file)) {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setUploadProgress('Reading PDF...');

    try {
      // Step 1: Extract text from PDF client-side
      const pdfResult = await extractTextFromPdf(file, (progress) => {
        setUploadProgress(progress.message);
      });
      
      if (!pdfResult.text.trim()) {
        toast.error('No text could be extracted from the PDF');
        return;
      }
      
      // Check page count before sending to API
      if (pdfResult.pageCount > MAX_PAGES) {
        toast.error(
          `Document too large: ${pdfResult.pageCount} pages detected. Maximum allowed is ${MAX_PAGES} pages. Please upload a smaller document or split it into sections.`,
          { duration: 8000 }
        );
        return;
      }
      
      setUploadProgress(`Extracted ${pdfResult.pageCount} pages. Analyzing with AI...`);
      
      // Step 2: Send extracted text to AI for entity/relationship extraction
      const result = await api.extract(pdfResult.text, 'gpt-5');
      
      if (!result.entities || result.entities.length === 0) {
        toast.warning('No entities found in the PDF');
        return;
      }

      // Convert API response to our format
      const apiIdToOurId = new Map<string, string>();
      
      const entities: Entity[] = result.entities.map((e) => {
        const ourId = generateId();
        if (e.id) apiIdToOurId.set(e.id, ourId);
        apiIdToOurId.set(e.name.toLowerCase(), ourId);
        
        return {
          id: ourId,
          name: e.name,
          type: (e.type?.toLowerCase() || 'organization') as Entity['type'],
          description: e.description,
          importance: e.importance || 5,
        };
      });

      const relationships: Relationship[] = result.relationships
        .map((r) => {
          const sourceId = apiIdToOurId.get(r.source) || apiIdToOurId.get(r.source.toLowerCase());
          const targetId = apiIdToOurId.get(r.target) || apiIdToOurId.get(r.target.toLowerCase());
          
          if (!sourceId || !targetId) return null;
          
          return {
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: r.type,
            label: r.label,
          } as Relationship;
        })
        .filter((r): r is Relationship => r !== null);

      if (aiMode === 'new') clearNetwork();
      addEntitiesAndRelationships(entities, relationships);
      
      toast.success(`Extracted ${entities.length} entities and ${relationships.length} connections from PDF (${pdfResult.pageCount} pages)`);
    } catch (error) {
      console.error('PDF upload error:', error);
      
      // Handle specific error types
      if (error instanceof DocumentTooLargeError) {
        toast.error(
          `Document too large: ~${error.estimatedPages} pages detected. Maximum allowed is ${error.maxPages} pages. Please upload a smaller document.`,
          { duration: 8000 }
        );
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
      }
    } finally {
      setIsProcessing(false);
      setUploadProgress(null);
    }
  }, [aiMode, addEntitiesAndRelationships, clearNetwork]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handlePdfUpload(file);
  }, [handlePdfUpload]);

  // Add entity manually
  const handleAddEntity = useCallback(() => {
    if (!entityName.trim()) {
      toast.error('Entity name is required');
      return;
    }

    const newEntity: Entity = {
      id: generateId(),
      name: entityName.trim(),
      type: entityType,
      importance: entityImportance,
      description: entityDate ? `Date: ${entityDate}` : undefined,
    };

    dispatch({ type: 'ADD_ENTITY', payload: newEntity });
    toast.success(`Added ${entityName}`);
    
    // Reset form
    setEntityName('');
    setEntityImportance(5);
    setEntityDate('');
  }, [entityName, entityType, entityImportance, entityDate, dispatch]);

  // Add relationship manually
  const handleAddRelationship = useCallback(() => {
    if (!relSource || !relTarget) {
      toast.error('Both source and target entities are required');
      return;
    }
    if (relSource === relTarget) {
      toast.error('Source and target cannot be the same');
      return;
    }

    // Check if relationship already exists
    const exists = network.relationships.some(
      (r) => (r.source === relSource && r.target === relTarget) ||
             (r.source === relTarget && r.target === relSource)
    );
    if (exists) {
      toast.error('A relationship between these entities already exists');
      return;
    }

    const newRelationship: Relationship = {
      id: generateId(),
      source: relSource,
      target: relTarget,
      type: relType || 'connection',
      label: relLabel || relType || 'connection',
    };

    dispatch({ type: 'ADD_RELATIONSHIP', payload: newRelationship });
    
    const sourceName = network.entities.find((e) => e.id === relSource)?.name || 'Entity';
    const targetName = network.entities.find((e) => e.id === relTarget)?.name || 'Entity';
    toast.success(`Connected ${sourceName} to ${targetName}`);
    
    // Reset form
    setRelSource('');
    setRelTarget('');
    setRelType('');
    setRelLabel('');
  }, [relSource, relTarget, relType, relLabel, network.entities, network.relationships, dispatch]);

  // Tool: Remove orphan nodes (entities with no connections)
  const handleRemoveOrphans = useCallback(() => {
    const connectedIds = new Set<string>();
    network.relationships.forEach(r => {
      connectedIds.add(r.source);
      connectedIds.add(r.target);
    });
    
    const orphans = network.entities.filter(e => !connectedIds.has(e.id));
    
    if (orphans.length === 0) {
      toast.info('No orphan nodes found - all entities are connected');
      return;
    }
    
    setIsRemovingOrphans(true);
    orphans.forEach(orphan => {
      dispatch({ type: 'DELETE_ENTITY', payload: orphan.id });
    });
    setIsRemovingOrphans(false);
    toast.success(`Removed ${orphans.length} orphan node${orphans.length > 1 ? 's' : ''}`);
  }, [network.entities, network.relationships, dispatch]);

  // Tool: Find missing links using AI
  const handleFindMissingLinks = useCallback(async () => {
    if (network.entities.length < 2) {
      toast.error('Need at least 2 entities to find missing links');
      return;
    }
    
    setIsFindingLinks(true);
    toast.info('Aggressively searching for missing connections (this may take 20-30 seconds)...', { duration: 30000 });
    
    try {
      // Use the improved /api/infer endpoint with web search enabled
      let newRelationships: Relationship[] = [];
      
      // Build entity name to ID mapping for later
      const entityNameToId = new Map(network.entities.map(e => [e.name.toLowerCase(), e.id]));
      const entityIdToName = new Map(network.entities.map(e => [e.id, e.name]));
      
      const result = await api.infer(
        network.entities.map(e => ({ 
          id: e.id, 
          name: e.name, 
          type: e.type,
          description: e.description || ''
        })),
        network.relationships.map(r => ({ 
          source: r.source, 
          target: r.target,
          type: r.type 
        }))
      );
      
      if (result.inferred_relationships && result.inferred_relationships.length > 0) {
        // Lower confidence threshold to 0.3 for more aggressive finding
        const validRelationships = result.inferred_relationships.filter(ir => ir.confidence >= 0.3);
        
        for (const ir of validRelationships) {
          // Try to match source/target by ID first, then by name
          let sourceId = ir.source;
          let targetId = ir.target;
          
          // If source/target are names, convert to IDs
          if (!network.entities.some(e => e.id === sourceId)) {
            sourceId = entityNameToId.get(ir.source.toLowerCase()) || '';
          }
          if (!network.entities.some(e => e.id === targetId)) {
            targetId = entityNameToId.get(ir.target.toLowerCase()) || '';
          }
          
          if (sourceId && targetId && sourceId !== targetId) {
            // Check if relationship already exists (in either direction)
            const exists = network.relationships.some(
              r => (r.source === sourceId && r.target === targetId) ||
                   (r.source === targetId && r.target === sourceId)
            );
            
            if (!exists) {
              // Also check if we already added this relationship
              const alreadyAdded = newRelationships.some(
                r => (r.source === sourceId && r.target === targetId) ||
                     (r.source === targetId && r.target === sourceId)
              );
              
              if (!alreadyAdded) {
                newRelationships.push({
                  id: generateId(),
                  source: sourceId,
                  target: targetId,
                  type: ir.type || 'connected_to',
                  label: ir.description || ir.type || 'inferred connection',
                });
              }
            }
          }
        }
      }
      
      if (newRelationships.length > 0) {
        addEntitiesAndRelationships([], newRelationships);
        
        // Show detailed success message
        const webSearchUsed = result.metadata?.web_search_used ? ' (with web search)' : '';
        toast.success(
          `Found ${newRelationships.length} missing connection${newRelationships.length > 1 ? 's' : ''}${webSearchUsed}!`,
          { duration: 5000 }
        );
        
        // Show analysis summary if available
        if (result.analysis) {
          const improvement = result.analysis.network_density_improvement;
          if (improvement) {
            setTimeout(() => {
              toast.info(`Network density improved by ${improvement}`, { duration: 4000 });
            }, 1000);
          }
        }
      } else {
        toast.info('No additional connections found. The network may already be well-connected.');
      }
    } catch (error) {
      console.error('Find links error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to find missing links');
    } finally {
      setIsFindingLinks(false);
    }
  }, [network.entities, network.relationships, addEntitiesAndRelationships]);

  // Tool: Enrich all entities using /api/extract
  const handleEnrichAll = useCallback(async () => {
    if (network.entities.length === 0) {
      toast.error('No entities to enrich');
      return;
    }
    
    setIsEnrichingAll(true);
    toast.info(`Enriching entities with AI...`);
    
    try {
      // Build a prompt that asks AI to find more details about existing entities
      const entityList = network.entities.slice(0, 15).map(e => `${e.name} (${e.type})`).join(', ');
      const prompt = `Research and provide detailed information about these entities and their connections: ${entityList}. ` +
        `For each entity, provide: description, key facts, and any known relationships between them. ` +
        `Focus on financial connections, business relationships, and organizational ties.`;
      
      const result = await api.extract(prompt, 'gpt-5');
      
      if (!result.entities || result.entities.length === 0) {
        toast.info('No additional information found');
        return;
      }
      
      // Update existing entities with new descriptions
      let enrichedCount = 0;
      const newEntities: Entity[] = [];
      const newRelationships: Relationship[] = [];
      const existingNames = new Set(network.entities.map(e => e.name.toLowerCase()));
      
      for (const apiEntity of result.entities) {
        const existingEntity = network.entities.find(
          e => e.name.toLowerCase() === apiEntity.name.toLowerCase()
        );
        
        if (existingEntity && apiEntity.description) {
          // Update existing entity
          dispatch({
            type: 'UPDATE_ENTITY',
            payload: { id: existingEntity.id, updates: { description: apiEntity.description } }
          });
          enrichedCount++;
        } else if (!existingNames.has(apiEntity.name.toLowerCase())) {
          // Add new entity
          newEntities.push({
            id: generateId(),
            name: apiEntity.name,
            type: (apiEntity.type?.toLowerCase() || 'person') as Entity['type'],
            description: apiEntity.description,
            importance: apiEntity.importance || 5,
          });
          existingNames.add(apiEntity.name.toLowerCase());
        }
      }
      
      // Add new relationships
      const allEntities = [...network.entities, ...newEntities];
      const entityNameToId = new Map(allEntities.map(e => [e.name.toLowerCase(), e.id]));
      
      for (const rel of result.relationships || []) {
        const sourceId = entityNameToId.get(rel.source.toLowerCase());
        const targetId = entityNameToId.get(rel.target.toLowerCase());
        
        if (sourceId && targetId) {
          // Check if relationship already exists
          const exists = network.relationships.some(
            r => (r.source === sourceId && r.target === targetId) ||
                 (r.source === targetId && r.target === sourceId)
          );
          
          if (!exists) {
            newRelationships.push({
              id: generateId(),
              source: sourceId,
              target: targetId,
              type: rel.type,
              label: rel.label || rel.type,
            });
          }
        }
      }
      
      if (newEntities.length > 0 || newRelationships.length > 0) {
        addEntitiesAndRelationships(newEntities, newRelationships);
      }
      
      toast.success(`Enriched ${enrichedCount} entities, added ${newEntities.length} new entities and ${newRelationships.length} connections`);
    } catch (error) {
      console.error('Enrich all error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enrich entities');
    } finally {
      setIsEnrichingAll(false);
    }
  }, [network.entities, network.relationships, dispatch, addEntitiesAndRelationships]);

  // Tool: Custom prompt to modify graph
  const handleToolPrompt = useCallback(async () => {
    if (!toolPrompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }
    
    setIsProcessing(true);
    toast.info('Processing your request...');
    
    try {
      // Build context from current network
      const context = `Current network has ${network.entities.length} entities: ${network.entities.map(e => `${e.name} (${e.type})`).join(', ')}. ` +
        `And ${network.relationships.length} relationships. ` +
        `User request: ${toolPrompt}`;
      
      const result = await api.extract(context, 'gpt-5');
      
      if (result.entities.length === 0 && result.relationships.length === 0) {
        toast.warning('No changes suggested. Try a more specific prompt.');
        return;
      }
      
      // Map API IDs to our IDs
      const apiIdToOurId = new Map<string, string>();
      
      const entities: Entity[] = result.entities.map((e) => {
        const existingEntity = network.entities.find(
          existing => existing.name.toLowerCase() === e.name.toLowerCase()
        );
        
        if (existingEntity) {
          apiIdToOurId.set(e.id, existingEntity.id);
          return null;
        }
        
        const ourId = generateId();
        apiIdToOurId.set(e.id, ourId);
        
        return {
          id: ourId,
          name: e.name,
          type: (e.type?.toLowerCase() || 'person') as Entity['type'],
          description: e.description,
          importance: e.importance || 5,
        };
      }).filter((e): e is Entity => e !== null);
      
      const relationships: Relationship[] = result.relationships
        .map((r) => {
          const sourceId = apiIdToOurId.get(r.source);
          const targetId = apiIdToOurId.get(r.target);
          
          if (!sourceId || !targetId) return null;
          
          // Check if relationship already exists
          const exists = network.relationships.some(
            existing => (existing.source === sourceId && existing.target === targetId) ||
                       (existing.source === targetId && existing.target === sourceId)
          );
          if (exists) return null;
          
          return {
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: r.type,
            label: r.label || r.type,
          } as Relationship;
        })
        .filter((r): r is Relationship => r !== null);
      
      addEntitiesAndRelationships(entities, relationships);
      toast.success(`Added ${entities.length} entities and ${relationships.length} connections`);
      setToolPrompt('');
    } catch (error) {
      console.error('Tool prompt error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process prompt');
    } finally {
      setIsProcessing(false);
    }
  }, [toolPrompt, network.entities, network.relationships, addEntitiesAndRelationships]);

  // Count orphan nodes
  const orphanCount = network.entities.filter(e => {
    return !network.relationships.some(r => r.source === e.id || r.target === e.id);
  }).length;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
        />
      )}
      
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      {/* Scrollable content area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      {/* Network Info Section */}
      <Collapsible open={networkOpen} onOpenChange={setNetworkOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">Network</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${networkOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          <div>
            <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
            <Input
              id="title"
              value={network.title}
              onChange={(e) => dispatch({ type: 'UPDATE_NETWORK', payload: { title: e.target.value } })}
              className="h-8 text-sm bg-background"
              placeholder="Untitled Network"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="text-xs text-muted-foreground">Description</Label>
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
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Corporate</div>
                {INVESTIGATION_TEMPLATES.filter(t => t.category === 'corporate').map((t) => (
                  <SelectItem key={t.id} value={t.id} className="py-2">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">Financial</div>
                {INVESTIGATION_TEMPLATES.filter(t => t.category === 'financial').map((t) => (
                  <SelectItem key={t.id} value={t.id} className="py-2">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">People</div>
                {INVESTIGATION_TEMPLATES.filter(t => t.category === 'people').map((t) => (
                  <SelectItem key={t.id} value={t.id} className="py-2">
                    <div className="flex flex-col">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">{t.description}</span>
                    </div>
                  </SelectItem>
                ))}
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-t mt-1 pt-2">Examples</div>
                {INVESTIGATION_TEMPLATES.filter(t => t.category === 'examples').map((t) => (
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
              {isSaving ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Save className="w-3 h-3 mr-1" />
              )}
              Save
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-7 text-xs" 
              onClick={handleShare}
              disabled={isSharing || network.entities.length === 0}
            >
              {isSharing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Share2 className="w-3 h-3 mr-1" />
              )}
              Share
            </Button>
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs px-2" 
                onClick={handleExport}
                disabled={network.entities.length === 0}
              >
                <Download className="w-3 h-3" />
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[140px]">
                  <button
                    onClick={() => { setShowExportModal(true); setShowExportMenu(false); }}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-accent transition-colors font-medium text-primary"
                  >
                    ✨ Create Artwork
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
                  title={savedGraphId ? "Find and merge duplicate entities" : "Save network first to use this feature"}
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
                  title={savedGraphId ? "Normalize relationship types" : "Save network first to use this feature"}
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

      <div className="border-t border-sidebar-border" />

      {/* AI Input Section - Unified Orchestrator */}
      <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">AI</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${aiOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          {/* Unified AI Input with Orchestrator */}
          <UnifiedAIInput 
            onNarrativeEvent={onNarrativeEvent}
            clearFirst={aiMode === 'new'}
            investigationContext={network.investigationContext}
            initialQuery={aiInput}
          />
          
          <RadioGroup value={aiMode} onValueChange={(v) => setAiMode(v as 'add' | 'new')} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="add" id="add" />
              <Label htmlFor="add" className="text-xs text-muted-foreground cursor-pointer">Add to current</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="new" id="new" />
              <Label htmlFor="new" className="text-xs text-muted-foreground cursor-pointer">Start new</Label>
            </div>
          </RadioGroup>

          {/* PDF Upload Drop Zone */}
          <div className="pt-2 border-t border-border">
            <label
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative block border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50 hover:bg-muted/30'
              } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
                className="sr-only"
                disabled={isProcessing}
              />
              {uploadProgress ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">{uploadProgress}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Drop PDF here or click to upload
                  </span>
                </div>
              )}
            </label>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-sidebar-border" />

      {/* Manual Add Section */}
      <Collapsible open={manualOpen} onOpenChange={setManualOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">Manual</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${manualOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {/* Add Entity Form */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Plus className="w-3 h-3" /> Add Entity
            </div>
            <Input
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder="Entity name"
              className="h-8 text-sm bg-background"
            />
            <Select value={entityType} onValueChange={(v) => setEntityType(v as Entity['type'])}>
              <SelectTrigger className="h-8 text-sm bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person">Person</SelectItem>
                <SelectItem value="corporation">Corporation</SelectItem>
                <SelectItem value="government">Government</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Importance: {entityImportance}</Label>
              <Slider
                value={[entityImportance]}
                onValueChange={(v) => setEntityImportance(v[0])}
                min={1}
                max={10}
                step={1}
                className="py-1"
              />
            </div>
            <Input
              value={entityDate}
              onChange={(e) => setEntityDate(e.target.value)}
              placeholder="Date (optional, e.g. 1990-2000)"
              className="h-8 text-sm bg-background"
            />
            <Button onClick={handleAddEntity} size="sm" className="w-full h-7 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Entity
            </Button>
          </div>

          {/* Add Relationship Form */}
          {network.entities.length >= 2 && (
            <div className="space-y-2 pt-2 border-t border-sidebar-border">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Link className="w-3 h-3" /> Add Relationship
              </div>
              <Select value={relSource} onValueChange={setRelSource}>
                <SelectTrigger className="h-8 text-sm bg-background">
                  <SelectValue placeholder="Source entity" />
                </SelectTrigger>
                <SelectContent>
                  {network.entities.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={relTarget} onValueChange={setRelTarget}>
                <SelectTrigger className="h-8 text-sm bg-background">
                  <SelectValue placeholder="Target entity" />
                </SelectTrigger>
                <SelectContent>
                  {network.entities.filter((e) => e.id !== relSource).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                placeholder="Relationship type (e.g. Invested in)"
                className="h-8 text-sm bg-background"
              />
              <Input
                value={relLabel}
                onChange={(e) => setRelLabel(e.target.value)}
                placeholder="Label (optional)"
                className="h-8 text-sm bg-background"
              />
              <Button onClick={handleAddRelationship} size="sm" className="w-full h-7 text-xs">
                <Link className="w-3 h-3 mr-1" /> Add Relationship
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-sidebar-border" />

      {/* Tools Section */}
      <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">Tools</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${toolsOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          {/* Remove Orphans */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-start"
            onClick={handleRemoveOrphans}
            disabled={isRemovingOrphans || network.entities.length === 0}
          >
            {isRemovingOrphans ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3 mr-2" />
            )}
            Remove Orphan Nodes
            {orphanCount > 0 && (
              <span className="ml-auto bg-amber-500/20 text-amber-700 px-1.5 py-0.5 rounded text-[10px]">
                {orphanCount}
              </span>
            )}
          </Button>

          {/* Find Missing Links */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-start"
            onClick={handleFindMissingLinks}
            disabled={isFindingLinks || network.entities.length < 2}
          >
            {isFindingLinks ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3 mr-2" />
            )}
            Find Missing Links
          </Button>

          {/* Enrich All */}
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs justify-start"
            onClick={handleEnrichAll}
            disabled={isEnrichingAll || network.entities.length === 0}
          >
            {isEnrichingAll ? (
              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3 mr-2" />
            )}
            Enrich All Entities
            {network.entities.length > 10 && (
              <span className="ml-auto text-[10px] text-muted-foreground">(first 10)</span>
            )}
          </Button>

          {/* Custom Prompt */}
          <div className="pt-2 border-t border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Wand2 className="w-3 h-3" /> Custom Prompt
            </div>
            <Textarea
              value={toolPrompt}
              onChange={(e) => setToolPrompt(e.target.value)}
              placeholder="Describe what you want to add or change..."
              className="text-xs bg-background resize-none min-h-[60px]"
              disabled={isProcessing}
            />
            <Button
              size="sm"
              className="w-full h-7 text-xs"
              onClick={handleToolPrompt}
              disabled={isProcessing || !toolPrompt.trim()}
            >
              {isProcessing ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3 mr-1" />
              )}
              Apply
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-sidebar-border" />

      {/* Search Section */}
      <Collapsible open={searchOpen} onOpenChange={setSearchOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">Search</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${searchOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entities..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    selectEntity(entity.id);
                    setSearchOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-sidebar-accent/50 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entity.type === 'person' ? '#4A90A4' : entity.type === 'corporation' ? '#7CB342' : entity.type === 'organization' ? '#7BA05B' : entity.type === 'financial' ? '#C9A227' : '#8B7355' }} />
                  <span className="truncate">{entity.name}</span>
                  <span className="text-muted-foreground text-[10px] ml-auto">{entity.type}</span>
                </button>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No entities found</p>
          )}
          
          {!searchQuery && network.entities.length > 0 && (
            <p className="text-xs text-muted-foreground">Search {network.entities.length} entities by name or type</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-sidebar-border" />

      {/* View Options Section */}
      <Collapsible open={viewOpen} onOpenChange={setViewOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">View</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${viewOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {/* Theme selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as CanvasTheme)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {/* Artistic Themes */}
                <SelectItem value="lombardi">Lombardi Classic</SelectItem>
                <SelectItem value="lombardiRed">Lombardi Investigative</SelectItem>
                {/* Functional Themes */}
                <SelectItem value="colorful">Colorful</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="dark">Dark Mode</SelectItem>
                {/* Export Themes */}
                <SelectItem value="highContrast">High Contrast</SelectItem>
                <SelectItem value="print">Print Ready</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show labels toggle */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Show All Labels</Label>
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-border cursor-pointer" 
              checked={showAllLabels}
              onChange={(e) => setShowAllLabels(e.target.checked)}
            />
          </div>

          {/* Entity type legend */}
          <div className="pt-2 border-t border-border">
            <Label className="text-xs font-medium mb-2 block">Entity Types</Label>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#4A90A4]"></span> Person
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#7CB342]"></span> Corporation
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#7BA05B]"></span> Organization
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#C9A227]"></span> Financial
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#8B7355]"></span> Government
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      </div>
      {/* End scrollable content area */}

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-sidebar-border bg-sidebar-accent/30">
        <div className="text-[10px] font-mono text-muted-foreground">
          {network.entities.length} entities · {network.relationships.length} connections
        </div>
      </div>
    </aside>

      {/* Export Modal */}
      <ExportModal open={showExportModal} onOpenChange={setShowExportModal} />
    </>
  );
}
