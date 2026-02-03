/**
 * Silent Partners - Canvas Theme Context
 * 
 * Manages the visual theme of the network canvas with comprehensive styling options.
 * 
 * Themes:
 * - lombardi: Authentic Mark Lombardi style - black ink on cream paper (default)
 * - lombardiRed: Lombardi style with red for alleged/disputed connections
 * - colorful: Cream/gold aesthetic with colored entity types (original default)
 * - professional: Clean white/gray for corporate reports
 * - highContrast: Maximum readability for presentations/accessibility
 * - print: Optimized for PDF export and printing
 * - dark: Dark mode for low-light environments
 */

import { createContext, useContext, useState, ReactNode } from 'react';

// All available themes
export type CanvasTheme = 
  | 'lombardi' 
  | 'lombardiRed' 
  | 'colorful' 
  | 'professional' 
  | 'highContrast' 
  | 'print' 
  | 'dark';

// Entity type color palettes
export const ENTITY_COLORS = {
  // Vibrant palette for colorful/dark modes
  vibrant: {
    person: '#4A90A4',      // Teal blue
    corporation: '#7CB342', // Green
    organization: '#9575CD', // Purple
    financial: '#C9A227',   // Gold
    government: '#8B7355',  // Brown
    location: '#E57373',    // Coral
    event: '#FF8A65',       // Orange
  },
  // Muted palette for professional mode
  muted: {
    person: '#64748B',      // Slate
    corporation: '#059669', // Emerald (muted)
    organization: '#7C3AED', // Violet (muted)
    financial: '#D97706',   // Amber (muted)
    government: '#78716C',  // Stone
    location: '#DC2626',    // Red (muted)
    event: '#EA580C',       // Orange (muted)
  },
  // High contrast palette
  highContrast: {
    person: '#0066CC',      // Strong blue
    corporation: '#008800', // Strong green
    organization: '#6600CC', // Strong purple
    financial: '#CC6600',   // Strong orange
    government: '#663300',  // Strong brown
    location: '#CC0000',    // Strong red
    event: '#CC3300',       // Strong red-orange
  },
};

// Complete theme configuration interface
interface CanvasThemeConfig {
  // Identity
  name: string;
  description: string;
  category: 'artistic' | 'functional' | 'export';
  
  // Colors
  background: string;
  nodeStroke: string;
  nodeFill: string;
  linkStroke: string;
  linkLabelBg: string;
  linkLabelText: string;
  textColor: string;
  gridColor: string;
  secondaryColor?: string;  // For lombardiRed - alleged/disputed connections
  
  // Display options
  showGrid: boolean;
  useEntityColors: boolean;
  entityColors: Record<string, string>;
  
  // Node sizing (in pixels)
  nodeBaseSize: number;     // Base size for standard nodes
  nodeMaxSize: number;      // Maximum size (for importance scaling)
  nodeHollowSize: number;   // Size for hollow nodes (orgs in Lombardi)
  nodeSolidSize: number;    // Size for solid nodes (people in Lombardi)
  nodeStrokeWidth: number;  // Stroke width for node borders
  
  // Typography
  fontFamily: string;
  labelSize: number;        // Node label font size
  linkLabelSize: number;    // Link label font size
  
  // Line styling
  linkWidth: number;        // Default link stroke width
  curveIntensity: number;   // 0-1, how curved the arcs are (1 = more curved)
  
  // Special flags
  isLombardiStyle: boolean; // Uses hollow/solid node distinction
  isMonochrome: boolean;    // No entity type colors
}

// Theme definitions
export const canvasThemes: Record<CanvasTheme, CanvasThemeConfig> = {
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ARTISTIC THEMES - For presentations and visual impact
  // ═══════════════════════════════════════════════════════════════════════════
  
  lombardi: {
    name: 'Lombardi Classic',
    description: 'Authentic Mark Lombardi style - black ink on warm cream paper',
    category: 'artistic',
    
    background: '#FDFBF5',
    nodeStroke: '#2C2C2C',
    nodeFill: '#FDFBF5',
    linkStroke: '#2C2C2C',
    linkLabelBg: 'transparent',
    linkLabelText: '#2C2C2C',
    textColor: '#2C2C2C',
    gridColor: 'transparent',
    
    showGrid: false,
    useEntityColors: false,
    entityColors: ENTITY_COLORS.vibrant,
    
    nodeBaseSize: 12,
    nodeMaxSize: 18,
    nodeHollowSize: 12,
    nodeSolidSize: 8,
    nodeStrokeWidth: 1.5,
    
    fontFamily: "'Source Serif 4', Georgia, serif",
    labelSize: 13,
    linkLabelSize: 10,
    
    linkWidth: 1.5,
    curveIntensity: 0.8,
    
    isLombardiStyle: true,
    isMonochrome: true,
  },
  
  lombardiRed: {
    name: 'Lombardi Investigative',
    description: 'Lombardi style with red highlighting for alleged/disputed connections',
    category: 'artistic',
    
    background: '#FDFBF5',
    nodeStroke: '#2C2C2C',
    nodeFill: '#FDFBF5',
    linkStroke: '#2C2C2C',
    linkLabelBg: 'transparent',
    linkLabelText: '#2C2C2C',
    textColor: '#2C2C2C',
    gridColor: 'transparent',
    secondaryColor: '#B91C1C',  // Red for alleged/criminal connections
    
    showGrid: false,
    useEntityColors: false,
    entityColors: ENTITY_COLORS.vibrant,
    
    nodeBaseSize: 12,
    nodeMaxSize: 18,
    nodeHollowSize: 12,
    nodeSolidSize: 8,
    nodeStrokeWidth: 1.5,
    
    fontFamily: "'Source Serif 4', Georgia, serif",
    labelSize: 13,
    linkLabelSize: 10,
    
    linkWidth: 1.5,
    curveIntensity: 0.8,
    
    isLombardiStyle: true,
    isMonochrome: false,  // Uses red as secondary
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FUNCTIONAL THEMES - For working and analysis
  // ═══════════════════════════════════════════════════════════════════════════
  
  colorful: {
    name: 'Colorful',
    description: 'Warm cream background with colored entity types for quick identification',
    category: 'functional',
    
    background: '#F5F0E6',
    nodeStroke: '#5D4E37',
    nodeFill: '#FDFBF7',
    linkStroke: '#8B7355',
    linkLabelBg: '#F5F0E6',
    linkLabelText: '#5D4E37',
    textColor: '#3D3425',
    gridColor: '#E8E0D0',
    
    showGrid: false,
    useEntityColors: true,
    entityColors: ENTITY_COLORS.vibrant,
    
    nodeBaseSize: 14,
    nodeMaxSize: 20,
    nodeHollowSize: 14,
    nodeSolidSize: 10,
    nodeStrokeWidth: 2,
    
    fontFamily: "'Source Sans 3', sans-serif",
    labelSize: 13,
    linkLabelSize: 9,
    
    linkWidth: 1.5,
    curveIntensity: 0.6,
    
    isLombardiStyle: false,
    isMonochrome: false,
  },
  
  professional: {
    name: 'Professional',
    description: 'Clean white/gray design for corporate reports and due diligence',
    category: 'functional',
    
    background: '#FFFFFF',
    nodeStroke: '#64748B',
    nodeFill: '#F8FAFC',
    linkStroke: '#94A3B8',
    linkLabelBg: '#FFFFFF',
    linkLabelText: '#475569',
    textColor: '#1E293B',
    gridColor: '#E2E8F0',
    
    showGrid: false,
    useEntityColors: true,
    entityColors: ENTITY_COLORS.muted,
    
    nodeBaseSize: 14,
    nodeMaxSize: 20,
    nodeHollowSize: 14,
    nodeSolidSize: 10,
    nodeStrokeWidth: 2,
    
    fontFamily: "'Inter', 'Source Sans 3', sans-serif",
    labelSize: 12,
    linkLabelSize: 9,
    
    linkWidth: 1.5,
    curveIntensity: 0.5,
    
    isLombardiStyle: false,
    isMonochrome: false,
  },
  
  dark: {
    name: 'Dark Mode',
    description: 'Dark background for low-light environments and extended screen work',
    category: 'functional',
    
    background: '#0F0F14',
    nodeStroke: '#E2E8F0',
    nodeFill: '#1E1E28',
    linkStroke: '#6B7280',
    linkLabelBg: '#1E1E28',
    linkLabelText: '#E2E8F0',
    textColor: '#F1F5F9',
    gridColor: '#1E1E28',
    
    showGrid: false,
    useEntityColors: true,
    entityColors: ENTITY_COLORS.vibrant,
    
    nodeBaseSize: 14,
    nodeMaxSize: 20,
    nodeHollowSize: 14,
    nodeSolidSize: 10,
    nodeStrokeWidth: 2,
    
    fontFamily: "'Source Sans 3', sans-serif",
    labelSize: 13,
    linkLabelSize: 9,
    
    linkWidth: 1.5,
    curveIntensity: 0.6,
    
    isLombardiStyle: false,
    isMonochrome: false,
  },
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT THEMES - Optimized for output
  // ═══════════════════════════════════════════════════════════════════════════
  
  highContrast: {
    name: 'High Contrast',
    description: 'Maximum readability for presentations, projectors, and accessibility',
    category: 'export',
    
    background: '#FFFFFF',
    nodeStroke: '#000000',
    nodeFill: '#FFFFFF',
    linkStroke: '#000000',
    linkLabelBg: '#FFFFFF',
    linkLabelText: '#000000',
    textColor: '#000000',
    gridColor: '#E5E5E5',
    
    showGrid: false,
    useEntityColors: true,
    entityColors: ENTITY_COLORS.highContrast,
    
    nodeBaseSize: 16,
    nodeMaxSize: 24,
    nodeHollowSize: 16,
    nodeSolidSize: 12,
    nodeStrokeWidth: 2.5,
    
    fontFamily: "'Source Sans 3', sans-serif",
    labelSize: 14,
    linkLabelSize: 11,
    
    linkWidth: 2,
    curveIntensity: 0.5,
    
    isLombardiStyle: false,
    isMonochrome: false,
  },
  
  print: {
    name: 'Print Ready',
    description: 'Optimized for PDF export, publication, and printing',
    category: 'export',
    
    background: '#FFFFFF',
    nodeStroke: '#000000',
    nodeFill: '#FFFFFF',
    linkStroke: '#000000',
    linkLabelBg: '#FFFFFF',
    linkLabelText: '#000000',
    textColor: '#000000',
    gridColor: 'transparent',
    
    showGrid: false,
    useEntityColors: false,
    entityColors: ENTITY_COLORS.vibrant,
    
    nodeBaseSize: 14,
    nodeMaxSize: 20,
    nodeHollowSize: 14,
    nodeSolidSize: 10,
    nodeStrokeWidth: 1.5,
    
    fontFamily: "'Source Serif 4', Georgia, serif",
    labelSize: 12,
    linkLabelSize: 9,
    
    linkWidth: 1,
    curveIntensity: 0.6,
    
    isLombardiStyle: true,
    isMonochrome: true,
  },
};

// Helper function to get entity color for a given theme and type
export function getEntityColor(theme: CanvasTheme, entityType: string): string {
  const config = canvasThemes[theme];
  if (!config.useEntityColors) {
    return config.nodeStroke;
  }
  return config.entityColors[entityType] || config.nodeStroke;
}

// Helper function to check if a relationship should use secondary color (red)
export function shouldUseSecondaryColor(relationshipType: string): boolean {
  const allegedKeywords = [
    'alleged', 'accused', 'suspected', 'disputed', 'criminal',
    'lawsuit', 'indicted', 'charged', 'investigated', 'questionable'
  ];
  const lowerType = relationshipType.toLowerCase();
  return allegedKeywords.some(keyword => lowerType.includes(keyword));
}

// Context type
interface CanvasThemeContextType {
  theme: CanvasTheme;
  config: CanvasThemeConfig;
  setTheme: (theme: CanvasTheme) => void;
  showAllLabels: boolean;
  setShowAllLabels: (show: boolean) => void;
  showArrows: boolean;
  setShowArrows: (show: boolean) => void;
  getEntityColor: (entityType: string) => string;
}

const CanvasThemeContext = createContext<CanvasThemeContextType | null>(null);

export function CanvasThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CanvasTheme>('lombardi');
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [showArrows, setShowArrows] = useState(false);

  const getEntityColorForTheme = (entityType: string) => {
    return getEntityColor(theme, entityType);
  };

  return (
    <CanvasThemeContext.Provider
      value={{
        theme,
        config: canvasThemes[theme],
        setTheme,
        showAllLabels,
        setShowAllLabels,
        showArrows,
        setShowArrows,
        getEntityColor: getEntityColorForTheme,
      }}
    >
      {children}
    </CanvasThemeContext.Provider>
  );
}

export function useCanvasTheme() {
  const context = useContext(CanvasThemeContext);
  if (!context) {
    throw new Error('useCanvasTheme must be used within a CanvasThemeProvider');
  }
  return context;
}

// Export theme config type for use in other components
export type { CanvasThemeConfig };
