/**
 * Silent Partners - View Panel
 *
 * Theme selector and display options.
 */

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react';
import { useCanvasTheme, CanvasTheme } from '@/contexts/CanvasThemeContext';

interface ViewPanelProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewPanel({ isOpen, onOpenChange }: ViewPanelProps) {
  const { theme, setTheme, showAllLabels, setShowAllLabels } = useCanvasTheme();

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
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#5C9EAD]"></span> Location
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D4A574]"></span> Asset
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
