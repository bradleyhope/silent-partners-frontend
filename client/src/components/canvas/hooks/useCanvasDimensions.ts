/**
 * Silent Partners - Canvas Dimensions Hook
 * 
 * Manages canvas dimensions and handles window resize events.
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
        setDimensions({ width, height });
      }
    };

    // Initial measurement
    updateDimensions();

    // Listen for resize events
    window.addEventListener('resize', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, [containerRef]);

  return dimensions;
}

export default useCanvasDimensions;
