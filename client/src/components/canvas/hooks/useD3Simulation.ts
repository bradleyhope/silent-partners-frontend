/**
 * Silent Partners - D3 Simulation Hook
 * 
 * React hook that wraps the D3 simulation engine.
 * Manages simulation lifecycle and provides reactive updates.
 */

import { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { Entity, Relationship } from '@/lib/store';
import {
  SimulationNode,
  SimulationLink,
  createSimulation,
  updateSimulation,
  entitiesToNodes,
  relationshipsToLinks,
} from '../D3SimulationEngine';

interface UseD3SimulationProps {
  entities: Entity[];
  relationships: Relationship[];
  dimensions: { width: number; height: number };
  onTick?: () => void;
}

interface UseD3SimulationReturn {
  simulationRef: React.MutableRefObject<d3.Simulation<SimulationNode, SimulationLink> | null>;
  nodesRef: React.MutableRefObject<SimulationNode[]>;
  linksRef: React.MutableRefObject<SimulationLink[]>;
  restartSimulation: (alpha?: number) => void;
}

/**
 * Hook to manage D3 force simulation lifecycle
 */
export function useD3Simulation({
  entities,
  relationships,
  dimensions,
  onTick,
}: UseD3SimulationProps): UseD3SimulationReturn {
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const nodesRef = useRef<SimulationNode[]>([]);
  const linksRef = useRef<SimulationLink[]>([]);
  const prevEntitiesRef = useRef<Set<string>>(new Set());
  const prevRelationshipsRef = useRef<Set<string>>(new Set());

  // Initialize simulation
  useEffect(() => {
    if (!simulationRef.current) {
      simulationRef.current = createSimulation(dimensions);
    }

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  // Update simulation when data changes
  useEffect(() => {
    if (!simulationRef.current) return;

    // Determine which entities/relationships are new
    const currentEntityIds = new Set(entities.map(e => e.id));
    const currentRelIds = new Set(relationships.map(r => r.id));
    const newEntityIds = new Set<string>();
    const newRelIds = new Set<string>();

    entities.forEach(e => {
      if (!prevEntitiesRef.current.has(e.id)) {
        newEntityIds.add(e.id);
      }
    });

    relationships.forEach(r => {
      if (!prevRelationshipsRef.current.has(r.id)) {
        newRelIds.add(r.id);
      }
    });

    // Create node position map from existing nodes
    const existingNodesMap = new Map<string, SimulationNode>();
    nodesRef.current.forEach(node => {
      existingNodesMap.set(node.id, node);
    });

    // Convert to simulation data
    const nodes = entitiesToNodes(entities, existingNodesMap, dimensions, newEntityIds);
    const links = relationshipsToLinks(relationships, newRelIds);

    // Update refs
    nodesRef.current = nodes;
    linksRef.current = links;
    prevEntitiesRef.current = currentEntityIds;
    prevRelationshipsRef.current = currentRelIds;

    // Update simulation
    updateSimulation(simulationRef.current, nodes, links);

    // Set up tick handler
    if (onTick) {
      simulationRef.current.on('tick', onTick);
    }
  }, [entities, relationships, dimensions, onTick]);

  // Update center force when dimensions change
  useEffect(() => {
    if (simulationRef.current) {
      const centerForce = simulationRef.current.force('center') as d3.ForceCenter<SimulationNode>;
      if (centerForce) {
        centerForce.x(dimensions.width / 2).y(dimensions.height / 2);
      }
    }
  }, [dimensions]);

  const restartSimulation = useCallback((alpha: number = 0.3) => {
    if (simulationRef.current) {
      simulationRef.current.alpha(alpha).restart();
    }
  }, []);

  return {
    simulationRef,
    nodesRef,
    linksRef,
    restartSimulation,
  };
}

export default useD3Simulation;
