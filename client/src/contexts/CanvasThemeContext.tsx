/**
 * Silent Partners - Canvas Theme Context
 * 
 * Manages the visual theme of the network canvas.
 */

import { createContext, useContext, useState, ReactNode } from 'react';

export type CanvasTheme = 'classic' | 'minimal' | 'dark';

interface CanvasThemeConfig {
  background: string;
  nodeStroke: string;
  nodeFill: string;
  linkStroke: string;
  linkLabelBg: string;
  linkLabelText: string;
  textColor: string;
  gridColor: string;
}

export const canvasThemes: Record<CanvasTheme, CanvasThemeConfig> = {
  classic: {
    background: '#F5F0E6',
    nodeStroke: '#5D4E37',
    nodeFill: '#FDFBF7',
    linkStroke: '#8B7355',
    linkLabelBg: '#F5F0E6',
    linkLabelText: '#5D4E37',
    textColor: '#3D3425',
    gridColor: '#E8E0D0',
  },
  minimal: {
    background: '#FFFFFF',
    nodeStroke: '#374151',
    nodeFill: '#FFFFFF',
    linkStroke: '#9CA3AF',
    linkLabelBg: '#FFFFFF',
    linkLabelText: '#374151',
    textColor: '#111827',
    gridColor: '#F3F4F6',
  },
  dark: {
    background: '#1A1A2E',
    nodeStroke: '#E2E8F0',
    nodeFill: '#2D2D44',
    linkStroke: '#64748B',
    linkLabelBg: '#1A1A2E',
    linkLabelText: '#E2E8F0',
    textColor: '#F1F5F9',
    gridColor: '#2D2D44',
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
  const [theme, setTheme] = useState<CanvasTheme>('classic');
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
