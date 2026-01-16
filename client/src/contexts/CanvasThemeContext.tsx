/**
 * Silent Partners - Canvas Theme Context
 * 
 * Manages the visual theme of the network canvas.
 * 
 * Themes:
 * - default: Current cream/gold aesthetic with colored entity types
 * - lombardi: Authentic Mark Lombardi style - black ink on cream paper
 *   - Hollow circles for organizations/institutions
 *   - Solid dots for people
 *   - Elegant curved arcs with arrows
 *   - Text labels on the lines
 * - dark: Dark mode for low-light environments
 */

import { createContext, useContext, useState, ReactNode } from 'react';

export type CanvasTheme = 'default' | 'lombardi' | 'dark';

interface CanvasThemeConfig {
  name: string;
  background: string;
  nodeStroke: string;
  nodeFill: string;
  linkStroke: string;
  linkLabelBg: string;
  linkLabelText: string;
  textColor: string;
  gridColor: string;
  showGrid: boolean;
  // Lombardi mode uses black for all entity types instead of colors
  useEntityColors: boolean;
}

export const canvasThemes: Record<CanvasTheme, CanvasThemeConfig> = {
  // Default: Current cream/gold aesthetic with colored entity types
  default: {
    name: 'Default',
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
  },
  // Lombardi Classic: Authentic Mark Lombardi style
  // Black ink on warm cream paper, like his original drawings
  // Hollow circles for orgs, solid dots for people
  lombardi: {
    name: 'Lombardi Classic',
    background: '#FDFBF5', // Warm cream like aged paper
    nodeStroke: '#2C2C2C', // Rich black ink
    nodeFill: '#FDFBF5', // Same as background for hollow effect
    linkStroke: '#2C2C2C', // Black ink
    linkLabelBg: 'transparent',
    linkLabelText: '#2C2C2C',
    textColor: '#2C2C2C',
    gridColor: 'transparent',
    showGrid: false,
    useEntityColors: false, // Monochromatic
  },
  // Dark mode: Clean dark background
  dark: {
    name: 'Dark Mode',
    background: '#0F0F14',
    nodeStroke: '#E2E8F0',
    nodeFill: '#1E1E28',
    linkStroke: '#6B7280',
    linkLabelBg: '#1E1E28',
    linkLabelText: '#E2E8F0',
    textColor: '#F1F5F9',
    gridColor: 'transparent',
    showGrid: false,
    useEntityColors: true,
  },
};

interface CanvasThemeContextType {
  theme: CanvasTheme;
  config: CanvasThemeConfig;
  setTheme: (theme: CanvasTheme) => void;
  showAllLabels: boolean;
  setShowAllLabels: (show: boolean) => void;
}

const CanvasThemeContext = createContext<CanvasThemeContextType | null>(null);

export function CanvasThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CanvasTheme>('default');
  const [showAllLabels, setShowAllLabels] = useState(false);

  return (
    <CanvasThemeContext.Provider
      value={{
        theme,
        config: canvasThemes[theme],
        setTheme,
        showAllLabels,
        setShowAllLabels,
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
