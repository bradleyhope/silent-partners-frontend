/**
 * Silent Partners - Search Panel
 *
 * Entity search functionality with debounced filtering.
 */

import { useState, useMemo, useCallback } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search, X } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { entityColors } from '@/lib/store';

interface SearchPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SearchPanel({ isOpen, onOpenChange }: SearchPanelProps) {
  const { network, selectEntity } = useNetwork();
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce search query for better performance with large entity lists
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 150);

  // Compute search results from debounced query using useMemo
  const searchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return [];
    const lowerQuery = debouncedSearchQuery.toLowerCase();
    return network.entities.filter(
      (e) =>
        e.name.toLowerCase().includes(lowerQuery) ||
        e.type.toLowerCase().includes(lowerQuery) ||
        (e.description && e.description.toLowerCase().includes(lowerQuery))
    );
  }, [debouncedSearchQuery, network.entities]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleSelectEntity = useCallback(
    (entityId: string) => {
      selectEntity(entityId);
      onOpenChange(false);
    },
    [selectEntity, onOpenChange]
  );

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
        <span className="section-header mb-0 border-0 pb-0">Search</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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
              onClick={() => setSearchQuery('')}
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
                onClick={() => handleSelectEntity(entity.id)}
                className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-sidebar-accent/50 flex items-center gap-2"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entityColors[entity.type] || '#78909C' }}
                />
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
          <p className="text-xs text-muted-foreground">
            Search {network.entities.length} entities by name or type
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
