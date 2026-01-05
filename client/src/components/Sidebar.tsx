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
import { ChevronDown, Loader2, Download, Share2, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { generateId, Entity, Relationship } from '@/lib/store';

// Example networks
const EXAMPLE_NETWORKS = [
  { id: '1mdb', name: '1MDB Scandal', query: 'Map the key players and financial connections in the 1MDB scandal involving Jho Low and Malaysian government officials' },
  { id: 'bcci', name: 'BCCI', query: 'Map the Bank of Credit and Commerce International scandal network including key figures and shell companies' },
  { id: 'epstein', name: "Epstein's Web", query: 'Map Jeffrey Epstein network of associates, connections to financial institutions and powerful individuals' },
];

export default function Sidebar() {
  const { network, dispatch, addEntitiesAndRelationships, clearNetwork } = useNetwork();
  const [networkOpen, setNetworkOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(true);
  const [viewOpen, setViewOpen] = useState(false);
  
  // AI input state
  const [aiInput, setAiInput] = useState('');
  const [aiMode, setAiMode] = useState<'add' | 'new'>('add');
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Load example network
  const handleLoadExample = useCallback(async (exampleId: string) => {
    const example = EXAMPLE_NETWORKS.find((e) => e.id === exampleId);
    if (!example) return;

    setIsProcessing(true);
    clearNetwork();
    
    try {
      toast.info(`Loading ${example.name}...`, { duration: 15000 });
      const result = await api.discover(example.query, 'gpt-5', 5);

      // Create a mapping from API entity IDs to our generated IDs
      const apiIdToOurId = new Map<string, string>();
      
      const entities: Entity[] = result.entities.map((e) => {
        const ourId = generateId();
        if (e.id) {
          apiIdToOurId.set(e.id, ourId);
        }
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
      }).filter((r) => {
        const sourceExists = entities.some((e) => e.id === r.source);
        const targetExists = entities.some((e) => e.id === r.target);
        return sourceExists && targetExists;
      });

      dispatch({ type: 'UPDATE_NETWORK', payload: { title: example.name } });
      addEntitiesAndRelationships(entities, relationships);
      
      toast.success(`Loaded ${example.name}`);
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

  return (
    <aside className="w-72 bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden">
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
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" disabled>
              <Save className="w-3 h-3 mr-1" /> Save
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
        </CollapsibleContent>
      </Collapsible>

      <div className="border-t border-sidebar-border" />

      {/* View Options Section */}
      <Collapsible open={viewOpen} onOpenChange={setViewOpen}>
        <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
          <span className="section-header mb-0 border-0 pb-0">View</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${viewOpen ? '' : '-rotate-90'}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            <p className="mb-2">Layout and display options coming soon.</p>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#6B8E9F]"></span> Person
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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer stats */}
      <div className="px-4 py-3 border-t border-sidebar-border bg-sidebar-accent/30">
        <div className="text-[10px] font-mono text-muted-foreground">
          {network.entities.length} entities · {network.relationships.length} connections
        </div>
      </div>
    </aside>
  );
}
