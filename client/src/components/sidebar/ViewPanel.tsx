/**
 * Silent Partners - View Panel
 *
 * Theme selector and display options.
 * MEDIUM-4: Entity type legend is now interactive for filtering.
 */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useCanvasTheme, CanvasTheme, ENTITY_TYPES, EntityType, ENTITY_COLORS } from '@/contexts/CanvasThemeContext';

interface ViewPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Entity type display config
const ENTITY_TYPE_CONFIG: Record<EntityType, { label: string; color: string }> = {
  person: { label: 'Person', color: ENTITY_COLORS.vibrant.person },
  corporation: { label: 'Corporation', color: ENTITY_COLORS.vibrant.corporation },
  organization: { label: 'Organization', color: ENTITY_COLORS.vibrant.organization },
  financial: { label: 'Financial', color: ENTITY_COLORS.vibrant.financial },
  government: { label: 'Government', color: ENTITY_COLORS.vibrant.government },
  location: { label: 'Location', color: '#5C9EAD' },
  asset: { label: 'Asset', color: '#D4A574' },
};

export default function ViewPanel({ isOpen, onOpenChange }: ViewPanelProps) {
  const { 
    theme, 
    setTheme, 
    showAllLabels, 
    setShowAllLabels, 
    showArrows, 
    setShowArrows,
    hiddenEntityTypes,
    toggleEntityType,
  } = useCanvasTheme();

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className="w-full px-4 py-3 flex items-center justify-between hover:bg-sidebar-accent/50 transition-colors">
        <span className="section-header mb-0 border-0 pb-0">View</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? '' : '-rotate-90'}`} />
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

        {/* Show arrows toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium">Show Arrows</Label>
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-border cursor-pointer"
            checked={showArrows}
            onChange={(e) => setShowArrows(e.target.checked)}
          />
        </div>

        {/* Entity type legend - now interactive! */}
        <div className="pt-2 border-t border-border">
          <Label className="text-xs font-medium mb-2 block">
            Entity Types
            <span className="text-[10px] text-muted-foreground ml-1">(click to filter)</span>
          </Label>
          <div className="space-y-1 font-mono text-[10px]">
            {ENTITY_TYPES.map((type) => {
              const config = ENTITY_TYPE_CONFIG[type];
              const isHidden = hiddenEntityTypes.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleEntityType(type)}
                  className={`flex items-center gap-2 w-full px-1 py-0.5 rounded hover:bg-muted/50 transition-colors ${
                    isHidden ? 'opacity-40' : ''
                  }`}
                  title={isHidden ? `Show ${config.label} entities` : `Hide ${config.label} entities`}
                >
                  <span 
                    className="w-3 h-3 rounded-full transition-opacity"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="flex-1 text-left">{config.label}</span>
                  {isHidden ? (
                    <EyeOff className="w-3 h-3 text-muted-foreground" />
                  ) : (
                    <Eye className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              );
            })}
          </div>
          {hiddenEntityTypes.size > 0 && (
            <button
              onClick={() => {
                // Clear all filters
                ENTITY_TYPES.forEach(type => {
                  if (hiddenEntityTypes.has(type)) {
                    toggleEntityType(type);
                  }
                });
              }}
              className="text-[10px] text-primary hover:underline mt-2"
            >
              Show all types
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
