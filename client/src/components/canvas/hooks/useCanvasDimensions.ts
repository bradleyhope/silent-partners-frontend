/**
 * Silent Partners - Canvas Dimensions Hook
 * 
 * Manages canvas dimensions and handles container resize events.
 * Uses ResizeObserver to detect when the container size changes
 * (e.g., when the assistant panel is toggled).
 * 
 * Extracted from NetworkCanvas.tsx for better separation of concerns.
 */

import { useState, useEffect, RefObject } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Hook to track container dimensions and update on resize
 * @param containerRef - Ref to the container element
 * @param defaultDimensions - Default dimensions before measurement
 * @returns Current dimensions object
 */
export function useCanvasDimensions(
  containerRef: RefObject<HTMLDivElement | null>,
  defaultDimensions: Dimensions = { width: 800, height: 600 }
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>(defaultDimensions);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Only update if dimensions actually changed (avoid unnecessary re-renders)
        setDimensions(prev => {
          if (prev.width !== width || prev.height !== height) {
            return { width, height };
          }
          return prev;
        });
      }
    };

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver to detect container size changes
    // This handles cases like:
    // - Assistant panel being toggled (container width changes)
    // - Sidebar being collapsed/expanded
    // - Any other layout changes that affect the container
    let resizeObserver: ResizeObserver | null = null;
    
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        // Use requestAnimationFrame to avoid layout thrashing
        requestAnimationFrame(() => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            setDimensions(prev => {
              if (prev.width !== width || prev.height !== height) {
                return { width, height };
              }
              return prev;
            });
          }
        });
      });
      
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize as a fallback
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [containerRef]);

  return dimensions;
}

export default useCanvasDimensions;
