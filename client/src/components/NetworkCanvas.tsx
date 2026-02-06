/**
 * Silent Partners - Network Canvas (Sigma.js GPU-Powered)
 * 
 * WebGL-powered network visualization using Sigma.js v3 + Graphology.
 * Replaces D3.js SVG rendering for 10-100x better performance at scale.
 * 
 * Supports 1000+ nodes with smooth 60fps rendering via GPU acceleration.
 * Preserves all Lombardi aesthetic features, themes, and interactions.
 * 
 * v9.0: Aesthetic polish pass
 *   - Enabled @sigma/node-border for hollow/solid node distinction
 *   - Varied edge curvatures for Lombardi-style sweeping arcs
 *   - Paper texture overlay on canvas
 *   - Animated ForceAtlas2 layout settling
 *   - Improved hover/selection visual feedback
 *   - Edge labels on hover (always, not just when toggled)
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { createNodeBorderProgram } from '@sigma/node-border';
import EdgeCurveProgram, { EdgeCurvedArrowProgram, indexParallelEdgesIndex } from '@sigma/edge-curve';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme, shouldUseSecondaryColor } from '@/contexts/CanvasThemeContext';
import { Entity, Relationship, generateId } from '@/lib/store';
import EntityCardV2 from './EntityCardV2';
import { RelationshipCard } from './RelationshipCard';
import { ZoomControls, AddEntityDialog, EmptyState, isHollowNode } from './canvas';
import { useCanvasDimensions } from './canvas/hooks/useCanvasDimensions';

// ============================================
// Custom node border program for Lombardi style
// ============================================

// Hollow nodes: visible border ring with transparent/background fill
const HollowNodeProgram = createNodeBorderProgram({
  borders: [
    {
      size: { attribute: 'borderSize', defaultValue: 0.2 },
      color: { attribute: 'borderColor' },
    },
    {
      size: { fill: true },
      color: { attribute: 'color' },
    },
  ],
});

// Solid nodes: filled circle (no visible border distinction)
const SolidNodeProgram = createNodeBorderProgram({
  borders: [
    {
      size: { fill: true },
      color: { attribute: 'color' },
    },
  ],
});

// Selected node: gold highlight ring
const SelectedNodeProgram = createNodeBorderProgram({
  borders: [
    {
      size: { value: 0.15 },
      color: { attribute: 'highlightColor', defaultValue: '#B8860B' },
    },
    {
      size: { value: 0.15 },
      color: { attribute: 'borderColor', defaultValue: '#2C2C2C' },
    },
    {
      size: { fill: true },
      color: { attribute: 'color' },
    },
  ],
});

interface NetworkCanvasProps {
  onNarrativeEvent?: (message: string) => void;
}

export default function NetworkCanvas({ onNarrativeEvent }: NetworkCanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaContainerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph>(new Graph({ multi: true }));
  const layoutRunningRef = useRef(false);
  const layoutAnimFrameRef = useRef<number | null>(null);
  const dragStateRef = useRef<{ isDragging: boolean; node: string | null }>({ isDragging: false, node: null });

  // Hover/selection state stored in refs for use in reducers
  const hoveredNodeRef = useRef<string | null>(null);
  const hoveredEdgeRef = useRef<string | null>(null);
  const selectedNodeRef = useRef<string | null>(null);

  const { network, selectedEntityId, selectEntity, updateEntity, dispatch } = useNetwork();
  const { theme, config: themeConfig, showAllLabels, showArrows, getEntityColor, isEntityTypeVisible } = useCanvasTheme();

  // Track previous entities for new-node detection
  const prevEntitiesRef = useRef<Set<string>>(new Set());
  const prevRelationshipsRef = useRef<Set<string>>(new Set());

  // UI state
  const [showAddEntity, setShowAddEntity] = useState(false);
  const [cardPosition, setCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [relationshipCardPosition, setRelationshipCardPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [, forceUpdate] = useState(0); // Force re-render for card display

  const dimensions = useCanvasDimensions(containerRef);

  // Keep selectedNodeRef in sync
  useEffect(() => {
    selectedNodeRef.current = selectedEntityId || null;
    sigmaRef.current?.refresh();
  }, [selectedEntityId]);

  // ============================================
  // Theme-aware helper functions
  // ============================================

  const getNodeSize = useCallback((entity: Entity): number => {
    if (themeConfig.isLombardiStyle) {
      return isHollowNode(entity.type) ? themeConfig.nodeHollowSize : themeConfig.nodeSolidSize;
    }
    const importance = entity.importance || 5;
    const scale = (importance - 1) / 9;
    return themeConfig.nodeBaseSize + scale * (themeConfig.nodeMaxSize - themeConfig.nodeBaseSize);
  }, [themeConfig]);

  const getNodeColor = useCallback((entity: Entity): string => {
    if (themeConfig.isLombardiStyle) {
      // Hollow nodes: fill with background color (creates ring effect)
      // Solid nodes: fill with stroke color
      return isHollowNode(entity.type) ? themeConfig.background : themeConfig.nodeStroke;
    }
    if (themeConfig.useEntityColors) {
      return getEntityColor(entity.type);
    }
    return themeConfig.nodeFill;
  }, [themeConfig, getEntityColor]);

  const getNodeBorderColor = useCallback((entity: Entity): string => {
    if (themeConfig.isLombardiStyle) {
      return themeConfig.nodeStroke;
    }
    if (themeConfig.useEntityColors) {
      return getEntityColor(entity.type);
    }
    return themeConfig.nodeStroke;
  }, [themeConfig, getEntityColor]);

  const getNodeBorderSize = useCallback((entity: Entity): number => {
    if (themeConfig.isLombardiStyle) {
      // Hollow nodes get a visible border ring; solid nodes get none
      return isHollowNode(entity.type) ? 0.2 : 0;
    }
    return 0.12; // Subtle border for non-Lombardi themes
  }, [themeConfig]);

  const getLinkColor = useCallback((rel: Relationship): string => {
    if (themeConfig.secondaryColor && rel.label) {
      if (shouldUseSecondaryColor(rel.label)) {
        return themeConfig.secondaryColor;
      }
    }
    return themeConfig.linkStroke;
  }, [themeConfig]);

  // ============================================
  // Compute varied curvatures for Lombardi-style arcs
  // ============================================

  const computeEdgeCurvature = useCallback((
    rel: Relationship,
    index: number,
    total: number,
  ): number => {
    const baseIntensity = themeConfig.curveIntensity;
    
    // Create varied curvatures based on relationship index
    // This gives each edge a unique arc height, mimicking Lombardi's hand-drawn style
    const variation = Math.sin(index * 2.3 + 0.7) * 0.15;
    const curvature = (baseIntensity * 0.25) + variation;
    
    // Alternate positive/negative curvature for visual variety
    const sign = index % 2 === 0 ? 1 : -1;
    return curvature * sign;
  }, [themeConfig.curveIntensity]);

  // ============================================
  // Sigma initialization (once)
  // ============================================

  useEffect(() => {
    if (!sigmaContainerRef.current) return;

    const graph = new Graph({ multi: true });
    graphRef.current = graph;

    const sigma = new Sigma(graph, sigmaContainerRef.current, {
      allowInvalidContainer: true,
      renderLabels: true,
      renderEdgeLabels: false,
      enableEdgeEvents: true,
      labelFont: "'Source Serif 4', Georgia, serif",
      labelSize: 13,
      labelWeight: 'normal',
      labelColor: { color: '#2C2C2C' },
      edgeLabelFont: "'Source Serif 4', Georgia, serif",
      edgeLabelSize: 10,
      edgeLabelColor: { color: '#2C2C2C' },
      defaultNodeType: 'hollow',
      defaultEdgeType: 'curved',
      nodeProgramClasses: {
        hollow: HollowNodeProgram,
        solid: SolidNodeProgram,
        selected: SelectedNodeProgram,
      },
      edgeProgramClasses: {
        curved: EdgeCurveProgram,
        curvedArrow: EdgeCurvedArrowProgram,
      },
      labelRenderedSizeThreshold: 3,
      // Use screen-based sizing so node sizes are in pixels
      itemSizesReference: 'screen',
      zoomDuration: 300,
      inertiaDuration: 300,
      inertiaRatio: 0.5,
      minCameraRatio: 0.01,
      maxCameraRatio: 20,
      stagePadding: 50,
      // Node reducer for selection/hover highlighting
      nodeReducer: (node: string, data: any) => {
        const res = { ...data };
        const hovered = hoveredNodeRef.current;
        const selected = selectedNodeRef.current;

        if (node === selected) {
          res.highlightColor = '#B8860B';
          res.type = 'selected';
          res.highlighted = true;
          res.zIndex = 1;
        }

        if (hovered) {
          const g = graphRef.current;
          const isNeighbor = g.hasNode(hovered) && (
            g.areNeighbors(node, hovered) || node === hovered
          );

          if (node === hovered) {
            // Hovered node: slight size increase
            res.size = (data.size || 10) * 1.15;
            res.zIndex = 2;
          } else if (!isNeighbor) {
            // Dim non-neighbor nodes
            res.color = res.color + '30';
            res.borderColor = (res.borderColor || '#000') + '30';
            res.label = '';
          }
        }

        return res;
      },
      // Edge reducer for hover highlighting
      edgeReducer: (edge: string, data: any) => {
        const res = { ...data };
        const hovered = hoveredNodeRef.current;
        const hoveredEdge = hoveredEdgeRef.current;

        if (edge === hoveredEdge) {
          res.size = (data.size || 1) + 1.5;
          res.forceLabel = true;
        }

        if (hovered) {
          const g = graphRef.current;
          try {
            const source = g.source(edge);
            const target = g.target(edge);
            const isConnected = source === hovered || target === hovered;
            if (!isConnected) {
              res.color = (res.color || '#000') + '15';
              res.hidden = true;
            } else {
              // Show labels on connected edges when hovering a node
              res.forceLabel = true;
              res.size = (data.size || 1) + 0.5;
            }
          } catch (e) {
            // Edge might have been removed
          }
        }

        return res;
      },
    });

    sigmaRef.current = sigma;

    // ---- Event handlers ----

    // Click on node
    sigma.on('clickNode', ({ node, event }) => {
      const mouseEvent = event.original as MouseEvent;
      setSelectedRelationship(null);
      setRelationshipCardPosition(null);
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCardPosition({ x: mouseEvent.clientX - rect.left, y: mouseEvent.clientY - rect.top });
      }
      selectEntity(node);
    });

    // Click on edge
    sigma.on('clickEdge', ({ edge, event }) => {
      const mouseEvent = event.original as MouseEvent;
      const attrs = graph.getEdgeAttributes(edge);
      const relId = attrs.relId;
      if (relId) {
        selectEntity(null);
        setCardPosition(null);
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          setRelationshipCardPosition({ x: mouseEvent.clientX - rect.left, y: mouseEvent.clientY - rect.top });
        }
        setSelectedRelationship({ id: relId } as Relationship);
        forceUpdate(n => n + 1);
      }
    });

    // Click on stage (deselect)
    sigma.on('clickStage', () => {
      selectEntity(null);
      setCardPosition(null);
      setSelectedRelationship(null);
      setRelationshipCardPosition(null);
    });

    // Hover effects
    sigma.on('enterNode', ({ node }) => {
      hoveredNodeRef.current = node;
      sigmaContainerRef.current!.style.cursor = 'pointer';
      sigma.refresh();
    });

    sigma.on('leaveNode', () => {
      hoveredNodeRef.current = null;
      sigmaContainerRef.current!.style.cursor = 'default';
      sigma.refresh();
    });

    sigma.on('enterEdge', ({ edge }) => {
      hoveredEdgeRef.current = edge;
      sigmaContainerRef.current!.style.cursor = 'pointer';
      sigma.refresh();
    });

    sigma.on('leaveEdge', () => {
      hoveredEdgeRef.current = null;
      sigmaContainerRef.current!.style.cursor = 'default';
      sigma.refresh();
    });

    // Node drag
    sigma.on('downNode', ({ node }) => {
      dragStateRef.current = { isDragging: true, node };
      sigma.getCamera().disable();
    });

    sigma.getMouseCaptor().on('mousemovebody', (e: any) => {
      if (!dragStateRef.current.isDragging || !dragStateRef.current.node) return;
      const pos = sigma.viewportToGraph(e);
      graph.setNodeAttribute(dragStateRef.current.node, 'x', pos.x);
      graph.setNodeAttribute(dragStateRef.current.node, 'y', pos.y);
    });

    const mouseUpHandler = () => {
      if (dragStateRef.current.isDragging && dragStateRef.current.node) {
        const node = dragStateRef.current.node;
        if (graph.hasNode(node)) {
          const attrs = graph.getNodeAttributes(node);
          updateEntity(node, { x: attrs.x, y: attrs.y });
        }
      }
      dragStateRef.current = { isDragging: false, node: null };
      sigma.getCamera().enable();
    };

    sigma.getMouseCaptor().on('mouseup', mouseUpHandler);

    return () => {
      layoutRunningRef.current = false;
      if (layoutAnimFrameRef.current) {
        cancelAnimationFrame(layoutAnimFrameRef.current);
      }
      sigma.kill();
      sigmaRef.current = null;
    };
  }, []); // Only init once

  // ============================================
  // Update Sigma settings when theme/display changes
  // ============================================

  useEffect(() => {
    if (!sigmaRef.current) return;
    const sigma = sigmaRef.current;

    sigma.setSetting('labelFont', themeConfig.fontFamily);
    sigma.setSetting('labelSize', themeConfig.labelSize);
    sigma.setSetting('labelColor', { color: themeConfig.textColor });
    sigma.setSetting('edgeLabelFont', themeConfig.fontFamily);
    sigma.setSetting('edgeLabelSize', themeConfig.linkLabelSize);
    sigma.setSetting('edgeLabelColor', { color: themeConfig.linkLabelText || themeConfig.textColor });
    sigma.setSetting('renderEdgeLabels', showAllLabels);
    sigma.setSetting('defaultEdgeType', showArrows ? 'curvedArrow' : 'curved');

    sigma.refresh();
  }, [themeConfig, showAllLabels, showArrows]);

  // ============================================
  // Graph data sync (main effect)
  // ============================================

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !sigmaRef.current) return;

    // Detect new entities
    const currentEntityIds = new Set(network.entities.map(e => e.id));
    const newEntityIds = new Set<string>();
    network.entities.forEach(e => {
      if (!prevEntitiesRef.current.has(e.id)) newEntityIds.add(e.id);
    });
    prevEntitiesRef.current = currentEntityIds;

    // Filter by visible entity types
    const visibleEntities = network.entities.filter(e => isEntityTypeVisible(e.type));
    const visibleEntityIds = new Set(visibleEntities.map(e => e.id));

    // Remove nodes that should no longer be visible
    graph.forEachNode((nodeId) => {
      if (!visibleEntityIds.has(nodeId)) {
        graph.dropNode(nodeId);
      }
    });

    // Add/update nodes
    const hasNewNodes = newEntityIds.size > 0;
    visibleEntities.forEach((entity, i) => {
      const nodeColor = getNodeColor(entity);
      const borderColor = getNodeBorderColor(entity);
      const borderSize = getNodeBorderSize(entity);
      const size = getNodeSize(entity);
      const isNew = newEntityIds.has(entity.id);
      const nodeType = themeConfig.isLombardiStyle
        ? (isHollowNode(entity.type) ? 'hollow' : 'solid')
        : 'hollow'; // Non-Lombardi themes use hollow with colored fill

      if (graph.hasNode(entity.id)) {
        graph.mergeNodeAttributes(entity.id, {
          size,
          label: entity.name,
          color: nodeColor,
          borderColor,
          borderSize,
          type: nodeType,
          entityType: entity.type,
        });
      } else {
        // Spread new nodes in a circle for better initial layout
        const angle = (i / Math.max(visibleEntities.length, 1)) * 2 * Math.PI;
        const radius = 5 + Math.random() * 5;
        const x = entity.x ?? (Math.cos(angle) * radius);
        const y = entity.y ?? (Math.sin(angle) * radius);

        graph.addNode(entity.id, {
          x,
          y,
          size: isNew ? size * 0.1 : size,
          label: entity.name,
          color: nodeColor,
          borderColor,
          borderSize,
          type: nodeType,
          entityType: entity.type,
        });

        // Animate new nodes growing in with staggered elastic ease
        if (isNew) {
          const targetSize = size;
          const startTime = Date.now() + i * 80; // Stagger each node by 80ms
          const duration = 500;
          const animateGrow = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 0) { requestAnimationFrame(animateGrow); return; }
            const progress = Math.min(elapsed / duration, 1);
            // Ease out elastic for a bouncy, organic feel
            const elastic = progress === 1 ? 1 :
              Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
            if (graph.hasNode(entity.id)) {
              graph.setNodeAttribute(entity.id, 'size', targetSize * 0.1 + (targetSize * 0.9) * elastic);
            }
            if (progress < 1) requestAnimationFrame(animateGrow);
          };
          requestAnimationFrame(animateGrow);
        }
      }
    });

    // Build set of existing edge relIds
    const existingRelIds = new Set<string>();
    graph.forEachEdge((_edge, attrs) => {
      existingRelIds.add(attrs.relId);
    });

    // Remove edges whose relationship no longer exists or whose endpoints are hidden
    const validRelIds = new Set<string>();
    network.relationships.forEach(rel => {
      if (visibleEntityIds.has(rel.source) && visibleEntityIds.has(rel.target)) {
        validRelIds.add(rel.id);
      }
    });

    const edgesToDrop: string[] = [];
    graph.forEachEdge((edge, attrs) => {
      if (!validRelIds.has(attrs.relId)) {
        edgesToDrop.push(edge);
      }
    });
    edgesToDrop.forEach(edge => graph.dropEdge(edge));

    // Rebuild existing relIds after dropping
    existingRelIds.clear();
    graph.forEachEdge((_edge, attrs) => {
      existingRelIds.add(attrs.relId);
    });

    // Add/update edges with varied curvatures
    const validRels = network.relationships.filter(
      rel => visibleEntityIds.has(rel.source) && visibleEntityIds.has(rel.target)
    );

    validRels.forEach((rel, i) => {
      const edgeColor = getLinkColor(rel);
      const curvature = computeEdgeCurvature(rel, i, validRels.length);

      if (existingRelIds.has(rel.id)) {
        // Update existing edge
        graph.forEachEdge((edge, attrs) => {
          if (attrs.relId === rel.id) {
            graph.mergeEdgeAttributes(edge, {
              size: themeConfig.linkWidth,
              color: edgeColor,
              label: rel.label || rel.type || '',
              curvature,
            });
          }
        });
      } else {
        // Add new edge
        try {
          graph.addEdgeWithKey(`edge-${rel.id}`, rel.source, rel.target, {
            size: themeConfig.linkWidth,
            color: edgeColor,
            label: rel.label || rel.type || '',
            type: showArrows ? 'curvedArrow' : 'curved',
            curvature,
            relId: rel.id,
            relStatus: rel.status,
          });
        } catch (e) {
          // Silently handle duplicate edge keys
          console.warn('Edge add skipped:', (e as Error).message);
        }
      }
    });

    // Index parallel edges for proper curvature offset
    try {
      indexParallelEdgesIndex(graph);
    } catch (e) {
      // Non-critical: parallel edge indexing may fail on some graph states
    }

    // Run animated ForceAtlas2 layout if we have new nodes
    if (graph.order > 0 && hasNewNodes) {
      // Cancel any existing layout animation
      if (layoutAnimFrameRef.current) {
        cancelAnimationFrame(layoutAnimFrameRef.current);
      }
      layoutRunningRef.current = true;

      try {
        const settings = forceAtlas2.inferSettings(graph);
        settings.gravity = 1;
        settings.scalingRatio = 10;
        settings.barnesHutOptimize = graph.order > 50;
        settings.strongGravityMode = true;
        settings.slowDown = 2;

        // Animated layout: run iterations in batches over multiple frames
        const totalIterations = graph.order < 20 ? 200 : graph.order < 100 ? 150 : 100;
        const iterationsPerFrame = 5;
        let completed = 0;

        const animateLayout = () => {
          if (!layoutRunningRef.current || completed >= totalIterations) {
            layoutRunningRef.current = false;
            // Final camera reset after layout settles
            sigmaRef.current?.getCamera().animatedReset({ duration: 600 });
            return;
          }

          const batch = Math.min(iterationsPerFrame, totalIterations - completed);
          forceAtlas2.assign(graph, { iterations: batch, settings });
          completed += batch;

          // Gradually slow down the layout for a settling effect
          settings.slowDown = 2 + (completed / totalIterations) * 8;

          layoutAnimFrameRef.current = requestAnimationFrame(animateLayout);
        };

        layoutAnimFrameRef.current = requestAnimationFrame(animateLayout);
      } catch (e) {
        console.warn('ForceAtlas2 layout failed:', e);
        layoutRunningRef.current = false;
      }
    }

    sigmaRef.current?.refresh();
  }, [network.entities, network.relationships, themeConfig, showArrows,
      getNodeSize, getNodeColor, getNodeBorderColor, getNodeBorderSize,
      getLinkColor, computeEdgeCurvature, isEntityTypeVisible]);

  // ============================================
  // Update background color when theme changes
  // ============================================

  useEffect(() => {
    if (sigmaContainerRef.current) {
      // IMPORTANT: Only set background on the container div, NOT on individual canvases.
      // Sigma.js uses stacked transparent canvases (WebGL for nodes/edges, 2D for labels).
      // Setting opaque backgrounds on individual canvases hides the WebGL-rendered content.
      sigmaContainerRef.current.style.background = themeConfig.background;
    }
  }, [themeConfig.background]);

  // ============================================
  // Zoom handlers
  // ============================================

  const handleZoomIn = useCallback(() => {
    sigmaRef.current?.getCamera().animatedZoom({ duration: 300 });
  }, []);

  const handleZoomOut = useCallback(() => {
    sigmaRef.current?.getCamera().animatedUnzoom({ duration: 300 });
  }, []);

  const handleFitView = useCallback(() => {
    sigmaRef.current?.getCamera().animatedReset({ duration: 500 });
  }, []);

  // ============================================
  // Entity handlers
  // ============================================

  const handleAddEntity = useCallback((name: string, type: Entity['type']) => {
    const newEntity: Entity = {
      id: generateId(),
      name,
      type,
      importance: 5,
      x: Math.random() * 10 - 5,
      y: Math.random() * 10 - 5,
    };
    dispatch({ type: 'ADD_ENTITY', payload: newEntity });
  }, [dispatch]);

  // ============================================
  // Resolve selected relationship from network
  // ============================================

  const resolvedRelationship = selectedRelationship
    ? network.relationships.find(r => r.id === selectedRelationship.id) || null
    : null;

  const selectedEntity = network.entities.find((e) => e.id === selectedEntityId);
  const showDotPattern = theme === 'colorful';
  const showPaperTexture = themeConfig.isLombardiStyle;

  // ============================================
  // Render
  // ============================================

  return (
    <div
      ref={containerRef}
      id="network-canvas"
      className="relative w-full h-full overflow-hidden"
      style={{ background: themeConfig.background }}
    >
      {/* Paper texture overlay for Lombardi themes */}
      {showPaperTexture && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            opacity: 0.025,
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {/* Dot pattern background for colorful theme */}
      {showDotPattern && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${themeConfig.gridColor || 'rgba(0,0,0,0.15)'} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Sigma.js WebGL container */}
      <div
        ref={sigmaContainerRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Zoom controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
      />

      {/* Empty state */}
      {network.entities.length === 0 && (
        <EmptyState onAddEntity={() => setShowAddEntity(true)} />
      )}

      {/* Entity detail card */}
      {selectedEntity && cardPosition && (
        <div
          className="absolute z-20"
          style={{
            left: Math.min(cardPosition.x, (dimensions.width || 800) - 320),
            top: Math.min(cardPosition.y, (dimensions.height || 600) - 200),
          }}
        >
          <EntityCardV2
            entity={selectedEntity}
            position={cardPosition}
            onClose={() => { selectEntity(null); setCardPosition(null); }}
            onAddToNarrative={onNarrativeEvent}
          />
        </div>
      )}

      {/* Relationship detail card */}
      {resolvedRelationship && relationshipCardPosition && (
        <div
          className="absolute z-20"
          style={{
            left: Math.min(relationshipCardPosition.x, (dimensions.width || 800) - 320),
            top: Math.min(relationshipCardPosition.y, (dimensions.height || 600) - 200),
          }}
        >
          <RelationshipCard
            relationship={resolvedRelationship}
            sourceEntity={network.entities.find(e => e.id === resolvedRelationship.source)}
            targetEntity={network.entities.find(e => e.id === resolvedRelationship.target)}
            position={relationshipCardPosition}
            onClose={() => {
              setSelectedRelationship(null);
              setRelationshipCardPosition(null);
            }}
          />
        </div>
      )}

      {/* Add entity dialog */}
      <AddEntityDialog
        open={showAddEntity}
        onOpenChange={setShowAddEntity}
        onAddEntity={handleAddEntity}
      />
    </div>
  );
}
