/**
 * Silent Partners - Animation Controller
 * 
 * Animation constants and timing utilities for network canvas.
 * Extracted from NetworkCanvas.tsx for better separation of concerns.
 */

// Animation timing constants (in milliseconds)
export const ANIMATION = {
  NODE_FADE_DURATION: 600,
  NODE_SCALE_DURATION: 400,
  EDGE_DRAW_DURATION: 800,
  PULSE_DURATION: 2000,
  STAGGER_DELAY: 100,
  TRANSITION_DURATION: 200,
  EXIT_DURATION: 300,
  LABEL_DELAY: 200,
  LABEL_DURATION: 400,
} as const;

// Easing functions for D3 transitions
export const EASING = {
  // Elastic easing for node appearance - bouncy effect
  nodeAppear: {
    amplitude: 1,
    period: 0.5,
  },
  // Quad easing for pulse rings
  pulse: 'quadOut',
} as const;

/**
 * Calculate staggered delay for multiple elements appearing
 * @param index - Element index in the sequence
 * @param baseDelay - Base delay before staggering starts
 * @returns Total delay in milliseconds
 */
export function getStaggeredDelay(index: number, baseDelay: number = 0): number {
  return baseDelay + index * ANIMATION.STAGGER_DELAY;
}

/**
 * Calculate animation delay for new nodes based on when they were added
 * @param addedAt - Timestamp when node was added
 * @param isNew - Whether this is a newly added node
 * @returns Delay in milliseconds
 */
export function getNodeAnimationDelay(addedAt: number | undefined, isNew: boolean): number {
  if (!isNew) return 0;
  const now = Date.now();
  return Math.max(0, (addedAt || 0) - now);
}

/**
 * Check if a node's entrance animation has completed
 * @param addedAt - Timestamp when node was added
 * @returns True if animation is complete
 */
export function isNodeAnimationComplete(addedAt: number | undefined): boolean {
  if (!addedAt) return true;
  return Date.now() - addedAt > ANIMATION.NODE_FADE_DURATION;
}
