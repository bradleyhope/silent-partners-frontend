/**
 * Silent Partners - Canvas Theme Context
 * 
 * Manages the visual theme of the network canvas.
 * 
 * Themes:
 * - default: Current cream/gold aesthetic (what you see on load)
 * - lombardi: True Mark Lombardi style - black lines on white/cream, no colors
 * - dark: Dark mode without distracting grid dots
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
  // Lombardi Classic: True Mark Lombardi style - black ink on cream paper
  // No colors, just black circles and curved lines like his original drawings
  lombardi: {
    name: 'Lombardi Classic',
    background: '#FFFEF9', // Slightly warm white like aged paper
    nodeStroke: '#1A1A1A', // Black ink
    nodeFill: '#FFFEF9', // Same as background - hollow circles
    linkStroke: '#1A1A1A', // Black ink
    linkLabelBg: '#FFFEF9',
    linkLabelText: '#1A1A1A',
    textColor: '#1A1A1A',
    gridColor: 'transparent',
    showGrid: false,
    useEntityColors: false, // All entities are black circles
  },
  // Dark mode: Clean dark background without distracting grid
  dark: {
    name: 'Dark Mode',
    background: '#0F0F14', // Very dark, almost black
    nodeStroke: '#E2E8F0',
    nodeFill: '#1E1E28',
    linkStroke: '#6B7280',
    linkLabelBg: '#1E1E28',
    linkLabelText: '#E2E8F0',
    textColor: '#F1F5F9',
    gridColor: 'transparent', // No grid in dark mode
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
