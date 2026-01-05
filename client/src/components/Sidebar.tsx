/**
 * Silent Partners - Sidebar
 * 
 * Three-section sidebar: Network Info, AI Input, View Options
 * Design: Archival Investigator with gold accents
 */

import { useState, useCallback } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ChevronDown, Loader2, Download, Share2, Save, Plus, Link, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCanvasTheme, CanvasTheme } from '@/contexts/CanvasThemeContext';
import { generateId, Entity, Relationship } from '@/lib/store';

// Example networks
const EXAMPLE_NETWORKS = [
  { id: '1mdb', name: '1MDB Scandal', query: 'Map the key players and financial connections in the 1MDB scandal involving Jho Low and Malaysian government officials' },
  { id: 'bcci', name: 'BCCI', query: 'Map the Bank of Credit and Commerce International scandal network including key figures and shell companies' },
  { id: 'epstein', name: "Epstein's Web", query: 'Map Jeffrey Epstein network of associates, connections to financial institutions and powerful individuals' },
];

export default function Sidebar() {
  const { network, dispatch, addEntitiesAndRelationships, clearNetwork } = useNetwork();
  const { isAuthenticated } = useAuth();
  const { theme, setTheme, showAllLabels, setShowAllLabels } = useCanvasTheme();
  const [networkOpen, setNetworkOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  
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

  // Export network as JSON
  const handleExport = useCallback(() => {
    const data = JSON.stringify(network, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${network.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Network exported');
  }, [network]);

  // Handle save to cloud
  const handleSave = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save networks');
      return;
    }

    if (network.entities.length === 0) {
      toast.error('Nothing to save - add some entities first');
      return;
    }

    setIsSaving(true);
    try {
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
      toast.success('Network saved!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save network');
    } finally {
      setIsSaving(false);
    }
  }, [network, isAuthenticated]);

  // Handle PDF upload
  const handlePdfUpload = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setUploadProgress('Uploading PDF...');

    try {
      // Start the upload job
      const { job_id } = await api.uploadPdf(file);
      setUploadProgress('Processing document...');

      // Poll for job completion
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        const status = await api.getJobStatus(job_id);
        
        if (status.status === 'completed' && status.result) {
          // Process the result
          const result = status.result;
          
          if (result.entities.length === 0) {
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
          
          toast.success(`Extracted ${entities.length} entities and ${relationships.length} connections from PDF`);
          return;
        } else if (status.status === 'failed') {
          throw new Error(status.message || 'PDF processing failed');
        }
        
        setUploadProgress(`Processing... ${status.stage || ''}`);
        attempts++;
      }
      
      throw new Error('PDF processing timed out');
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

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
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
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" disabled>
              <Share2 className="w-3 h-3 mr-1" /> Share
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={handleExport}>
              <Download className="w-3 h-3" />
            </Button>
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
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
              />
              {uploadProgress ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">{uploadProgress}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Drop PDF here or click to upload
                  </span>
                </div>
              )}
            </div>
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
                <SelectItem value="classic">Lombardi Classic</SelectItem>
                <SelectItem value="minimal">Clean Minimal</SelectItem>
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
  );
}
