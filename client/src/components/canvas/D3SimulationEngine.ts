/**
 * Silent Partners - D3 Simulation Engine
 * 
 * Core D3 force simulation logic extracted from NetworkCanvas.tsx.
 * This is a non-React module that handles the physics simulation.
 */

import * as d3 from 'd3';
import { Entity, Relationship } from '@/lib/store';

// ============================================
// Types
// ============================================

export interface SimulationNode extends Entity {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  isNew?: boolean;
  addedAt?: number;
}

export interface SimulationLink {
  id: string;
  source: SimulationNode | string;
  target: SimulationNode | string;
  type?: string;
  label?: string;
  status?: 'confirmed' | 'suspected' | 'former';
  confidence?: number;
  isNew?: boolean;
  addedAt?: number;
}

export interface SimulationConfig {
  width: number;
  height: number;
  chargeStrength?: number;
  linkDistance?: number;
  centerStrength?: number;
  collisionRadius?: number;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a node type should be rendered as hollow (organizations)
 * vs solid (people) in Lombardi style
 */
export function isHollowNode(type: Entity['type']): boolean {
  return ['corporation', 'organization', 'financial', 'government'].includes(type);
}

/**
 * Generate a quadratic curved path between two nodes
 * @param source - Source node
 * @param target - Target node
 * @param curveIntensity - How curved the arc should be (0-1)
 * @returns SVG path string
 */
export function generateCurvedPath(
  source: SimulationNode,
  target: SimulationNode,
  curveIntensity: number = 0.8
): string {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const perpX = -dy / (dist || 1);
  const perpY = dx / (dist || 1);

  // Consistent curve direction based on node IDs
  const curveDirection = source.id < target.id ? 1 : -1;
  const curveOffset = dist * 0.15 * curveIntensity * curveDirection;

  const cpX = midX + perpX * curveOffset;
  const cpY = midY + perpY * curveOffset;

  return `M${source.x},${source.y}Q${cpX},${cpY} ${target.x},${target.y}`;
}

// ============================================
// Simulation Factory
// ============================================

/**
 * Create a new D3 force simulation
 * @param config - Simulation configuration
 * @returns Configured D3 simulation
 */
export function createSimulation(
  config: SimulationConfig
): d3.Simulation<SimulationNode, SimulationLink> {
  const {
    width,
    height,
    chargeStrength = -400,
    linkDistance = 150,
    centerStrength = 0.05,
    collisionRadius = 50,
  } = config;

  return d3.forceSimulation<SimulationNode>()
    .force('link', d3.forceLink<SimulationNode, SimulationLink>()
      .id(d => d.id)
      .distance(linkDistance)
      .strength(0.5)
    )
    .force('charge', d3.forceManyBody()
      .strength(chargeStrength)
      .distanceMax(400)
    )
    .force('center', d3.forceCenter(width / 2, height / 2)
      .strength(centerStrength)
    )
    .force('collision', d3.forceCollide()
      .radius(collisionRadius)
      .strength(0.7)
    )
    .alphaDecay(0.02)
    .velocityDecay(0.4);
}

/**
 * Update simulation with new nodes and links
 * @param simulation - Existing simulation
 * @param nodes - Array of nodes
 * @param links - Array of links
 */
export function updateSimulation(
  simulation: d3.Simulation<SimulationNode, SimulationLink>,
  nodes: SimulationNode[],
  links: SimulationLink[]
): void {
  simulation.nodes(nodes);
  
  const linkForce = simulation.force('link') as d3.ForceLink<SimulationNode, SimulationLink>;
  if (linkForce) {
    linkForce.links(links);
  }
  
  // Restart with gentle alpha for smooth transitions
  simulation.alpha(0.3).restart();
}

/**
 * Convert entities to simulation nodes, preserving existing positions
 * @param entities - Array of entities
 * @param existingNodes - Map of existing node positions
 * @param dimensions - Canvas dimensions
 * @param newEntityIds - Set of newly added entity IDs
 * @returns Array of simulation nodes
 */
export function entitiesToNodes(
  entities: Entity[],
  existingNodes: Map<string, SimulationNode>,
  dimensions: { width: number; height: number },
  newEntityIds: Set<string>
): SimulationNode[] {
  const now = Date.now();
  
  return entities.map((entity, index) => {
    const existing = existingNodes.get(entity.id);
    const isNew = newEntityIds.has(entity.id);
    
    if (existing) {
      // Preserve position and velocity for existing nodes
      return {
        ...entity,
        x: existing.x,
        y: existing.y,
        vx: existing.vx,
        vy: existing.vy,
        fx: existing.fx,
        fy: existing.fy,
        isNew: false,
      };
    }
    
    // New node - start near center with slight offset
    return {
      ...entity,
      x: entity.x ?? dimensions.width / 2 + (Math.random() - 0.5) * 100,
      y: entity.y ?? dimensions.height / 2 + (Math.random() - 0.5) * 100,
      isNew,
      addedAt: isNew ? now + index * 100 : undefined,
    };
  });
}

/**
 * Convert relationships to simulation links
 * @param relationships - Array of relationships
 * @param newRelIds - Set of newly added relationship IDs
 * @returns Array of simulation links
 */
export function relationshipsToLinks(
  relationships: Relationship[],
  newRelIds: Set<string>
): SimulationLink[] {
  const now = Date.now();
  
  return relationships.map((rel, index) => ({
    id: rel.id,
    source: rel.source,
    target: rel.target,
    type: rel.type,
    label: rel.label || rel.type,
    status: rel.status,
    isNew: newRelIds.has(rel.id),
    addedAt: newRelIds.has(rel.id) ? now + index * 50 : undefined,
  }));
}
