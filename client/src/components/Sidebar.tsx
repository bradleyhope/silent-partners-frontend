/**
 * Silent Partners - Sidebar
 * 
 * Three-section sidebar: Network Info, AI Input, View Options
 * Design: Archival Investigator with gold accents
 */

import { useState, useCallback, useEffect } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Loader2, Download, Share2, Save, Plus, Link, Upload, FileText, Search, X, Trash2, Sparkles, Wand2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCanvasTheme, CanvasTheme } from '@/contexts/CanvasThemeContext';
import { generateId, Entity, Relationship } from '@/lib/store';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import { extractTextFromPdf, isPdfFile } from '@/lib/pdf-utils';
import pako from 'pako';
import ExportModal from './ExportModal';

// Example networks
const EXAMPLE_NETWORKS = [
  { id: '1mdb', name: '1MDB Scandal', query: 'Map the key players and financial connections in the 1MDB scandal involving Jho Low and Malaysian government officials' },
  { id: 'bcci', name: 'BCCI', query: 'Map the Bank of Credit and Commerce International scandal network including key figures and shell companies' },
  { id: 'epstein', name: "Epstein's Web", query: 'Map Jeffrey Epstein network of associates, connections to financial institutions and powerful individuals' },
];

export default function Sidebar() {
  const { network, dispatch, addEntitiesAndRelationships, clearNetwork, selectEntity } = useNetwork();
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
  
  // Tools section state
  const [toolsOpen, setToolsOpen] = useState(false);
  const [isRemovingOrphans, setIsRemovingOrphans] = useState(false);
  const [isFindingLinks, setIsFindingLinks] = useState(false);
  const [isEnrichingAll, setIsEnrichingAll] = useState(false);
  const [toolPrompt, setToolPrompt] = useState('');

  // Handle AI extraction/discovery
  const handleAiSubmit = useCallback(async () => {
    if (!aiInput.trim()) {
      toast.error('Please enter some text or a question');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Determine if this is a question (discover) or text (extract)
      const isQuestion = aiInput.trim().endsWith('?') || 
        aiInput.toLowerCase().startsWith('who') ||
        aiInput.toLowerCase().startsWith('what') ||
        aiInput.toLowerCase().startsWith('how') ||
        aiInput.toLowerCase().startsWith('find') ||
        aiInput.toLowerCase().startsWith('map') ||
        aiInput.length < 200;

      let result;
      
      if (isQuestion) {
        toast.info('Researching connections...', { duration: 10000 });
        result = await api.discover(aiInput, 'gpt-5', 3);
      } else {
        toast.info('Extracting network from text...', { duration: 5000 });
        result = await api.extract(aiInput, 'gpt-5');
      }

      if (result.entities.length === 0) {
        toast.warning('No entities found. Try a different query or more detailed text.');
        return;
      }

      // Convert API response to our format
      // Create a mapping from API entity IDs (E1, E2, etc.) to our generated IDs
      const apiIdToOurId = new Map<string, string>();
      
      const entities: Entity[] = result.entities.map((e) => {
        const ourId = generateId();
        // Map the API's entity ID to our generated ID
        if (e.id) {
          apiIdToOurId.set(e.id, ourId);
        }
        // Also map by name for fallback
        apiIdToOurId.set(e.name.toLowerCase(), ourId);
        
        return {
          id: ourId,
          name: e.name,
          type: (e.type as Entity['type']) || 'unknown',
          description: e.description,
          importance: e.importance || 5,
        };
      });

      // Map relationships using the API ID mapping
      const relationships: Relationship[] = result.relationships.map((r) => {
        // Look up our IDs from the API's source/target IDs
        const sourceId = apiIdToOurId.get(r.source) || apiIdToOurId.get(r.source.toLowerCase()) || r.source;
        const targetId = apiIdToOurId.get(r.target) || apiIdToOurId.get(r.target.toLowerCase()) || r.target;
        
        return {
          id: generateId(),
          source: sourceId,
          target: targetId,
          type: r.type,
          label: r.label || r.type,
        };
      }).filter((r) => {
        // Only include relationships where both source and target were mapped
        const sourceExists = entities.some((e) => e.id === r.source);
        const targetExists = entities.some((e) => e.id === r.target);
        return sourceExists && targetExists;
      });

      if (aiMode === 'new') {
        clearNetwork();
      }

      addEntitiesAndRelationships(entities, relationships);
      
      toast.success(`Added ${entities.length} entities and ${relationships.length} connections`);
      setAiInput('');
      
    } catch (error) {
      console.error('AI processing error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [aiInput, aiMode, addEntitiesAndRelationships, clearNetwork]);

  // Load example network from pre-built data
  const handleLoadExample = useCallback(async (exampleId: string) => {
    const example = EXAMPLE_NETWORKS.find((e) => e.id === exampleId);
    if (!example) return;

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
      
      dispatch({ type: 'UPDATE_NETWORK', payload: { title: networkData.title, description: networkData.description } });
      addEntitiesAndRelationships(entities, relationships);
      
      toast.success(`Loaded ${example.name} (${entities.length} entities, ${relationships.length} connections)`);
    } catch (error) {
      console.error('Failed to load example:', error);
      toast.error('Failed to load example network');
    } finally {
      setIsProcessing(false);
    }
  }, [clearNetwork, dispatch, addEntitiesAndRelationships]);

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

  // Export network as PNG
  const handleExportPng = useCallback(() => {
    const container = document.querySelector('#network-canvas');
    const svg = container?.querySelector('svg');
    if (!svg || !container) {
      toast.error('No network to export');
      return;
    }
    
    // Clone and prepare SVG
    const svgClone = svg.cloneNode(true) as SVGSVGElement;
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
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 2; // Higher resolution
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Fill background first
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = `${network.title.toLowerCase().replace(/\s+/g, '-')}.png`;
            a.click();
            URL.revokeObjectURL(pngUrl);
            toast.success('Network exported as PNG');
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
        await api.saveGraph({
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
      
      setUploadProgress(`Extracted ${pdfResult.pageCount} pages. Analyzing with AI...`);
      
      // Step 2: Send extracted text to AI for entity/relationship extraction
      // Truncate if too long (API limit)
      const maxTextLength = 50000;
      const textToAnalyze = pdfResult.text.length > maxTextLength 
        ? pdfResult.text.slice(0, maxTextLength) + '\n\n[Text truncated due to length...]'
        : pdfResult.text;
      
      const result = await api.extract(textToAnalyze, 'gpt-5');
      
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
      toast.error(error instanceof Error ? error.message : 'Failed to process PDF');
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
    toast.info('Analyzing network for missing connections...');
    
    try {
      // First try the /api/infer endpoint
      let newRelationships: Relationship[] = [];
      
      try {
        const result = await api.infer(
          network.entities.map(e => ({ id: e.id, name: e.name, type: e.type })),
          network.relationships.map(r => ({ source: r.source, target: r.target }))
        );
        
        if (result.inferred_relationships && result.inferred_relationships.length > 0) {
          newRelationships = result.inferred_relationships
            .filter(ir => ir.confidence > 0.5)
            .map(ir => ({
              id: generateId(),
              source: ir.source,
              target: ir.target,
              type: ir.type,
              label: ir.description || ir.type,
            }));
        }
      } catch (inferError) {
        console.warn('Infer API failed, falling back to extract:', inferError);
        
        // Fallback: Use /api/extract to find relationships
        const entityNames = network.entities.map(e => e.name).join(', ');
        const existingRels = network.relationships.map(r => {
          const source = network.entities.find(e => e.id === r.source);
          const target = network.entities.find(e => e.id === r.target);
          return source && target ? `${source.name} - ${target.name}` : null;
        }).filter(Boolean).join('; ');
        
        const prompt = `Given these entities: ${entityNames}\n\nAnd these existing relationships: ${existingRels || 'none'}\n\n` +
          `Find additional relationships between these entities that are not already listed. ` +
          `Focus on business connections, financial ties, organizational relationships, and personal connections.`;
        
        const result = await api.extract(prompt, 'gpt-5');
        
        if (result.relationships && result.relationships.length > 0) {
          const entityNameToId = new Map(network.entities.map(e => [e.name.toLowerCase(), e.id]));
          
          for (const rel of result.relationships) {
            const sourceId = entityNameToId.get(rel.source.toLowerCase());
            const targetId = entityNameToId.get(rel.target.toLowerCase());
            
            if (sourceId && targetId && sourceId !== targetId) {
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
        }
      }
      
      if (newRelationships.length > 0) {
        addEntitiesAndRelationships([], newRelationships);
        toast.success(`Found ${newRelationships.length} missing connection${newRelationships.length > 1 ? 's' : ''}`);
      } else {
        toast.info('No additional connections found');
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
            <Label className="text-xs text-muted-foreground">Load Example</Label>
            <Select onValueChange={handleLoadExample} disabled={isProcessing}>
              <SelectTrigger className="h-8 text-sm bg-background">
                <SelectValue placeholder="Select example..." />
              </SelectTrigger>
              <SelectContent>
                {EXAMPLE_NETWORKS.map((ex) => (
                  <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-1">
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
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-sidebar-border" />

      {/* AI Input Section */}
      <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">AI</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${aiOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          <Textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            className="text-sm bg-background resize-none min-h-[100px]"
            placeholder="Paste an article, ask a question, or describe what you want to map..."
            disabled={isProcessing}
          />
          
          <Button 
            onClick={handleAiSubmit} 
            disabled={isProcessing || !aiInput.trim()}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Extract Network'
            )}
          </Button>

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
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="lombardi">Lombardi Classic</SelectItem>
                <SelectItem value="dark">Dark Mode</SelectItem>
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
