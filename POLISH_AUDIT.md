# Silent Partners - Polish Audit

## Current State
- Graph renders correctly with nodes, edges, labels
- 7 themes available (lombardi, lombardiRed, colorful, professional, dark, highContrast, print)
- Force-directed layout via ForceAtlas2
- Node entrance animation (elastic grow-in) exists
- Entity card popup on click works
- Sidebar with collapsible panels
- Investigative Assistant chat panel on right

## Issues Identified

### GRAPH AESTHETICS (Priority: HIGH)
1. **All nodes are solid dark circles** - Lombardi style should have hollow circles for orgs and solid for people. The `@sigma/node-border` import is commented out. Without it, all nodes look the same.
2. **Edge curves are uniform** - All edges have the same curvature. Lombardi drawings have varied, elegant curves with different arc heights.
3. **No edge label rendering by default** - Relationship labels hidden unless "Show All Labels" toggled. Should show on hover at minimum.
4. **Node colors all #2C2C2C** - In Lombardi mode, all nodes are charcoal. No visual distinction between entity types without switching themes.
5. **No node shadows or glow effects** - Nodes feel flat. Selected node highlight is just a border color change.
6. **Canvas background is plain** - The paper-texture CSS class exists in index.css but isn't applied to the canvas. The dot-grid pattern only shows in colorful theme.

### ANIMATIONS (Priority: HIGH)
7. **No edge drawing animation** - Edges appear instantly. Should animate drawing/growing from source to target.
8. **No hover animation on nodes** - Cursor changes to pointer but no visual scale/glow transition.
9. **No smooth transitions when switching themes** - Theme changes are instant/jarring.
10. **No camera animation on initial load** - Graph just appears. Should zoom in from overview.
11. **Layout snaps into place** - ForceAtlas2 runs synchronously then stops. No animated settling.

### UI CHROME (Priority: MEDIUM)
12. **Empty state uses emoji** (🔍) - Should use an SVG illustration matching the archival aesthetic.
13. **Zoom controls are generic** - White buttons with no theme awareness.
14. **Status bar is plain text** - "12 entities · 15 connections" could be more elegant.
15. **Sidebar section headers are plain** - NETWORK, MANUAL, etc. use basic accordion style.
16. **Chat panel has no visual hierarchy** - Messages all look similar, timestamps are small gray text.
17. **"Start fresh" button placement** - Sits awkwardly in the network panel.
18. **Assistant toggle button** - Generic purple button, doesn't match archival aesthetic.

### TYPOGRAPHY (Priority: MEDIUM)
19. **Source Serif 4 not loaded** - HTML loads Playfair Display, Source Sans 3, IBM Plex Mono but NOT Source Serif 4 (used in Lombardi theme for labels).
20. **Label font rendering** - Sigma labels are plain text, no italic/weight variation for different entity types.

### INTERACTIONS (Priority: MEDIUM)
21. **Node click requires exact hit** - Sigma's hit detection seems to require clicking exactly on the node circle, not the label area.
22. **No right-click context menu** - Would be useful for quick actions.
23. **No keyboard shortcuts** - No way to navigate graph via keyboard.
24. **Drag doesn't persist** - Node positions reset when data syncs.

## Implementation Plan

### Phase 1: Graph Aesthetics
- Enable node-border program for hollow/solid distinction
- Add custom node renderer with shadow/glow
- Implement varied edge curvatures
- Apply paper texture to canvas background
- Add Source Serif 4 font

### Phase 2: Animations
- Animated ForceAtlas2 layout settling
- Edge drawing animation on new edges
- Hover scale/glow transitions
- Theme transition animations
- Initial camera zoom animation

### Phase 3: UI Chrome
- Redesign empty state with SVG illustration
- Theme-aware zoom controls
- Enhanced status bar
- Polished chat message styling
- Refined sidebar aesthetics
