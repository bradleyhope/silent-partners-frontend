/**
 * Silent Partners - Network Canvas (Sigma.js GPU-Powered)
 * 
 * WebGL-powered network visualization using Sigma.js v3 + Graphology.
 * Replaces D3.js SVG rendering for 10-100x better performance at scale.
 * 
 * Supports 1000+ nodes with smooth 60fps rendering via GPU acceleration.
 * Preserves all Lombardi aesthetic features, themes, and interactions.
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { createNodeBorderProgram } from '@sigma/node-border';
import { EdgeCurvedArrowProgram } from '@sigma/edge-curve';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { useNetwork } from '@/contexts/NetworkContext';
import { useCanvasTheme, shouldUseSecondaryColor } from '@/contexts/CanvasThemeContext';
import { Entity, Relationship, generateId } from '@/lib/store';
import EntityCardV2 from './EntityCardV2';
import { RelationshipCard } from './RelationshipCard';
import { ZoomControls, AddEntityDialog, EmptyState, isHollowNode } from './canvas';
import { useCanvasDimensions } from './canvas/hooks/useCanvasDimensions';

interface NetworkCanvasProps {
  onNarrativeEvent?: (message: string) => void;
}

export default function NetworkCanvas({ onNarrativeEvent }: NetworkCanvasProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaContainerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const graphRef = useRef<Graph>(new Graph({ multi: true }));
  const layoutRunningRef = useRef(false);
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
      // For hollow nodes: fill with background color (border program will draw the ring)
      // For solid nodes: fill with stroke color
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

  const getLinkColor = useCallback((rel: Relationship): string => {
    if (themeConfig.secondaryColor && rel.label) {
      if (shouldUseSecondaryColor(rel.label)) {
        return themeConfig.secondaryColor;
      }
    }
    return themeConfig.linkStroke;
  }, [themeConfig]);

  // ============================================
  // Sigma initialization (once)
  // ============================================

  useEffect(() => {
    if (!sigmaContainerRef.current) return;

    const graph = new Graph({ multi: true });
    graphRef.current = graph;

    const NodeBorderCustom = createNodeBorderProgram({
      borders: [
        { size: { value: 0.15, mode: 'relative' }, color: { attribute: 'borderColor' } },
        { size: { fill: true }, color: { attribute: 'color' } },
      ],
    });

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
      defaultNodeType: 'bordered',
      defaultEdgeType: 'curved',
      nodeProgramClasses: {
        bordered: NodeBorderCustom,
      },
      edgeProgramClasses: {
        curved: EdgeCurvedArrowProgram,
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
          res.borderColor = '#B8860B';
          res.highlighted = true;
          res.zIndex = 1;
        }

        if (hovered && hovered !== node) {
          // Dim non-hovered nodes when a node is hovered
          const g = graphRef.current;
          const isNeighbor = g.hasNode(hovered) && (
            g.areNeighbors(node, hovered) || node === hovered
          );
          if (!isNeighbor) {
            res.color = res.color + '40'; // Add alpha for dimming
            res.borderColor = (res.borderColor || '#000') + '40';
            res.label = ''; // Hide label for dimmed nodes
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
              res.color = (res.color || '#000') + '20';
              res.hidden = true;
            } else {
              res.forceLabel = true;
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

    sigma.getMouseCaptor().on('mouseup', () => {
      if (dragStateRef.current.isDragging && dragStateRef.current.node) {
        const node = dragStateRef.current.node;
        if (graph.hasNode(node)) {
          const attrs = graph.getNodeAttributes(node);
          updateEntity(node, { x: attrs.x, y: attrs.y });
        }
      }
      dragStateRef.current = { isDragging: false, node: null };
      sigma.getCamera().enable();
    });

    return () => {
      layoutRunningRef.current = false;
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
      const size = getNodeSize(entity);
      const isNew = newEntityIds.has(entity.id);

      if (graph.hasNode(entity.id)) {
        graph.mergeNodeAttributes(entity.id, {
          size,
          label: entity.name,
          color: nodeColor,
          borderColor,
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
          size: isNew ? size * 0.3 : size,
          label: entity.name,
          color: nodeColor,
          borderColor,
          type: 'bordered',
          entityType: entity.type,
        });

        // Animate new nodes growing in
        if (isNew) {
          const targetSize = size;
          const startTime = Date.now() + i * 60;
          const duration = 400;
          const animateGrow = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < 0) { requestAnimationFrame(animateGrow); return; }
            const progress = Math.min(elapsed / duration, 1);
            // Ease out elastic
            const elastic = progress === 1 ? 1 :
              Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
            if (graph.hasNode(entity.id)) {
              graph.setNodeAttribute(entity.id, 'size', targetSize * 0.3 + (targetSize * 0.7) * elastic);
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

    // Add/update edges
    network.relationships.forEach(rel => {
      if (!visibleEntityIds.has(rel.source) || !visibleEntityIds.has(rel.target)) return;

      const edgeColor = getLinkColor(rel);
      const curvature = themeConfig.curveIntensity * 0.3;

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

    // Run ForceAtlas2 layout synchronously if we have new nodes
    if (graph.order > 0 && hasNewNodes) {
      try {
        const settings = forceAtlas2.inferSettings(graph);
        settings.gravity = 1;
        settings.scalingRatio = 10;
        settings.barnesHutOptimize = graph.order > 50;
        settings.strongGravityMode = true;
        settings.slowDown = 2;

        // Run synchronous layout iterations
        const iterations = graph.order < 20 ? 200 : graph.order < 100 ? 150 : 100;
        forceAtlas2.assign(graph, { iterations, settings });
      } catch (e) {
        console.warn('ForceAtlas2 layout failed:', e);
      }

      // Reset camera to show all nodes
      setTimeout(() => {
        sigmaRef.current?.getCamera().animatedReset({ duration: 500 });
      }, 100);
    }

    sigmaRef.current?.refresh();
  }, [network.entities, network.relationships, themeConfig, showArrows,
      getNodeSize, getNodeColor, getNodeBorderColor, getLinkColor, isEntityTypeVisible]);

  // ============================================
  // Update background color when theme changes
  // ============================================

  useEffect(() => {
    if (sigmaContainerRef.current) {
      const canvases = sigmaContainerRef.current.querySelectorAll('canvas');
      canvases.forEach(canvas => {
        canvas.style.background = themeConfig.background;
      });
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
