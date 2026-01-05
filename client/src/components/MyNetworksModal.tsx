/**
 * Silent Partners - My Networks Modal
 * 
 * Shows user's saved networks and allows loading them.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Network, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useNetwork } from '@/contexts/NetworkContext';
import { generateId, Entity, Relationship } from '@/lib/store';

interface SavedNetwork {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

interface MyNetworksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MyNetworksModal({ open, onOpenChange }: MyNetworksModalProps) {
  const { dispatch, clearNetwork, addEntitiesAndRelationships } = useNetwork();
  const [networks, setNetworks] = useState<SavedNetwork[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // Fetch networks when modal opens
  useEffect(() => {
    if (open) {
      fetchNetworks();
    }
  }, [open]);

  const fetchNetworks = async () => {
    setIsLoading(true);
    try {
      const result = await api.listGraphs();
      setNetworks(result.graphs || []);
    } catch (error) {
      console.error('Failed to fetch networks:', error);
      toast.error('Failed to load your networks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadNetwork = async (id: number) => {
    setLoadingId(id);
    try {
      const graph = await api.loadGraph(id);
      
      // Convert to our format
      const apiIdToOurId = new Map<string, string>();
      
      const entities: Entity[] = graph.entities.map((e) => {
        const ourId = generateId();
        apiIdToOurId.set(e.id, ourId);
        apiIdToOurId.set(e.name.toLowerCase(), ourId);
        
        return {
          id: ourId,
          name: e.name,
          type: (e.type?.toLowerCase() || 'organization') as Entity['type'],
          importance: 5,
        };
      });

      const relationships: Relationship[] = graph.relationships
        .map((r) => {
          const sourceId = apiIdToOurId.get(r.source) || apiIdToOurId.get(r.source.toLowerCase());
          const targetId = apiIdToOurId.get(r.target) || apiIdToOurId.get(r.target.toLowerCase());
          
          if (!sourceId || !targetId) return null;
          
          return {
            id: generateId(),
            source: sourceId,
            target: targetId,
            type: r.type,
          } as Relationship;
        })
        .filter((r): r is Relationship => r !== null);

      // Clear and load
      clearNetwork();
      dispatch({ type: 'UPDATE_NETWORK', payload: { title: graph.title, description: graph.description } });
      addEntitiesAndRelationships(entities, relationships);
      
      toast.success(`Loaded "${graph.title}"`);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to load network:', error);
      toast.error('Failed to load network');
    } finally {
      setLoadingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">My Networks</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : networks.length === 0 ? (
            <div className="text-center py-12">
              <Network className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No saved networks yet.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a network and click Save to store it here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {networks.map((network) => (
                <div
                  key={network.id}
                  className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{network.title}</h3>
                      {network.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {network.description}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(network.created_at)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLoadNetwork(network.id)}
                      disabled={loadingId === network.id}
                    >
                      {loadingId === network.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Load'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
