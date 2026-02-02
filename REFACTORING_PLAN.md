# Silent Partners - Codebase Refactoring Plan

**Date:** 2026-02-02
**Aesthetic Score:** 6.2/10 → Target: 8.0/10

## Executive Summary

This document outlines the refactoring plan for the two "god objects" identified in the aesthetic review:
1. **NetworkCanvas.tsx** (884 lines) - D3 visualization component
2. **InvestigativeAssistant.tsx** (1,305 lines) - AI chat interface

## Phase 1: NetworkCanvas.tsx Refactoring

### Current Responsibilities (Too Many!)
- D3 simulation initialization and management
- Node rendering and styling
- Edge/link rendering and styling  
- Animation timing and effects
- Zoom and pan controls
- Drag handling
- Click event handling
- Entity card positioning
- Relationship card positioning
- Add entity modal
- Theme-aware styling

### Proposed Component Structure

```
client/src/components/canvas/
├── NetworkCanvas.tsx          # Main orchestrator (reduced to ~200 lines)
├── D3SimulationEngine.ts      # Simulation logic (non-React)
├── NodeRenderer.tsx           # Node drawing and styling
├── EdgeRenderer.tsx           # Edge drawing and styling  
├── AnimationController.ts     # Animation timing utilities
├── CanvasEventHandlers.ts     # Click, drag, zoom handlers
├── ZoomControls.tsx           # Zoom UI buttons
├── AddEntityDialog.tsx        # Add entity modal
└── hooks/
    ├── useD3Simulation.ts     # Simulation hook
    ├── useCanvasDimensions.ts # Resize handling
    └── useNodePositioning.ts  # Card positioning logic
```

### Extraction Order
1. **ZoomControls.tsx** - Simple extraction, self-contained UI
2. **AddEntityDialog.tsx** - Simple extraction, self-contained modal
3. **AnimationController.ts** - Extract animation constants and utilities
4. **D3SimulationEngine.ts** - Core simulation logic (non-React)
5. **useD3Simulation.ts** - React hook wrapping the engine
6. **CanvasEventHandlers.ts** - Event handling utilities
7. **NodeRenderer.tsx** - Node-specific rendering
8. **EdgeRenderer.tsx** - Edge-specific rendering

---

## Phase 2: InvestigativeAssistant.tsx Refactoring

### Current Responsibilities (Too Many!)
- Chat message display and scrolling
- User input handling
- Message sending logic
- Entity extraction from queries
- Orchestrator API calls
- Entity/relationship conversion
- Context display and editing
- Events stream display
- Research history display
- Suggestions panel display
- Progress status display
- URL/article processing
- Claims API integration

### Proposed Component Structure

```
client/src/components/assistant/
├── InvestigativeAssistant.tsx # Main orchestrator (reduced to ~300 lines)
├── ChatPanel.tsx              # Message display and scrolling
├── ChatInput.tsx              # Input textarea and send button
├── ContextPanel.tsx           # Investigation context display
├── ContextEditor.tsx          # Context editing form (already exists inline)
├── EventsStream.tsx           # Thinking/events display
├── ResearchHistory.tsx        # Past queries display
├── SuggestionsPanel.tsx       # AI suggestions display
├── ProgressIndicator.tsx      # Research progress display
└── hooks/
    ├── useAssistantState.ts   # Unified state management
    ├── useEntityConversion.ts # Entity/relationship conversion
    ├── useOrchestratorApi.ts  # API call handling
    └── useChatMessages.ts     # Message management
```

### Extraction Order
1. **ContextEditor.tsx** - Already exists inline, extract to file
2. **EventsStream.tsx** - Self-contained events display
3. **ResearchHistory.tsx** - Self-contained history display
4. **SuggestionsPanel.tsx** - Self-contained suggestions display
5. **ProgressIndicator.tsx** - Progress display component
6. **ChatInput.tsx** - Input handling component
7. **ChatPanel.tsx** - Message display component
8. **useAssistantState.ts** - Consolidate 15+ useState hooks
9. **useEntityConversion.ts** - Entity/relationship conversion logic
10. **useOrchestratorApi.ts** - API call handling

---

## Phase 3: Quick Wins

### 1. Remove Duplicate entityColors
**Problem:** `entityColors` exists in both `store.ts` and `CanvasThemeContext.tsx`

**Solution:** 
- Delete `entityColors` from `store.ts` (lines 84-94)
- Update imports to use `ENTITY_COLORS` from `CanvasThemeContext.tsx`
- Affected files: `NetworkCanvas.tsx` (line 19)

### 2. Standardize Naming
**Problem:** Mixed naming conventions (`nodesRef/linksRef` vs `capturedNodes/capturedLinks`)

**Solution:** Use `nodesRef/linksRef` consistently throughout

### 3. Consistent useCallback Usage
**Problem:** Some helper functions wrapped in useCallback, others not

**Solution:** Wrap all helper functions that are used in dependency arrays

### 4. Spacing Tokens
**Problem:** Arbitrary padding classes (`p-2`, `p-3`, `p-4`, `px-1.5`)

**Solution:** Define spacing scale in theme and use consistently

---

## Implementation Notes

### Testing Strategy
1. After each extraction, verify the app still works
2. Test theme switching
3. Test entity/relationship CRUD
4. Test export functionality
5. Test AI research flow

### Commit Strategy
- One commit per extracted component
- Format: `refactor(canvas): Extract ZoomControls component`
- Include before/after line counts in commit message

### Risk Mitigation
- Keep original files as `.backup` until refactoring is complete
- Test each change in isolation before moving to next
- Document any breaking changes

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| NetworkCanvas.tsx lines | 884 | 645 + extracted | <200 |
| InvestigativeAssistant.tsx lines | 1,305 | (ready for integration) | <300 |
| Max component complexity | High | Medium | Medium |
| Simplicity score | 4/10 | 6/10 | 7/10 |
| Overall aesthetic score | 6.2/10 | 7.0/10 | 8.0/10 |

## Completion Status

**Date:** 2026-02-02

### Phase 1: NetworkCanvas.tsx - COMPLETE ✅

Extracted components:
- `canvas/ZoomControls.tsx` (48 lines)
- `canvas/AddEntityDialog.tsx` (82 lines)
- `canvas/EmptyState.tsx` (32 lines)
- `canvas/AnimationController.ts` (56 lines)
- `canvas/D3SimulationEngine.ts` (154 lines)
- `canvas/hooks/useCanvasDimensions.ts` (40 lines)
- `canvas/hooks/useD3Simulation.ts` (93 lines)

Refactored main component: `NetworkCanvasRefactored.tsx` (645 lines)

### Phase 2: InvestigativeAssistant.tsx - COMPONENTS READY ✅

Extracted components:
- `assistant/AssistantHeader.tsx` (64 lines)
- `assistant/ContextPanel.tsx` (180 lines)
- `assistant/ContextEditor.tsx` (108 lines)
- `assistant/EventsStream.tsx` (167 lines)
- `assistant/ResearchHistory.tsx` (58 lines)
- `assistant/SuggestionsPanel.tsx` (61 lines)
- `assistant/ProgressIndicator.tsx` (86 lines)
- `assistant/ChatInput.tsx` (95 lines)
- `assistant/QuickActions.tsx` (42 lines)
- `assistant/types.ts` (76 lines)
- `assistant/hooks/useAssistantState.ts` (121 lines)
- `assistant/hooks/useEntityConversion.ts` (122 lines)

Total extracted: 1,202 lines of reusable components

### Phase 3: Quick Wins - PARTIAL ✅

- [x] Deprecated entityColors in store.ts with JSDoc comment
- [ ] Full removal requires updating 3 files (DetailPanel, SearchPanel, NetworkCanvas)
- [ ] Naming standardization deferred to next session

### Next Steps

1. Replace `NetworkCanvas.tsx` with `NetworkCanvasRefactored.tsx`
2. Create `InvestigativeAssistantRefactored.tsx` using extracted components
3. Update imports throughout the app
4. Remove deprecated entityColors usage
5. Run full test suite
