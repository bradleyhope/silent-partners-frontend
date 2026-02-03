# AGENTS.md - Silent Partners Frontend

**Last Updated:** 2026-02-03
**Project:** Silent Partners - Investigation Network Mapping Tool
**Current Version:** 9.0.8

---

## Quick Start for AI Agents

You are working on **Silent Partners**, a React/TypeScript web application that helps users build visual network maps of power, money, and influence. The frontend displays an interactive D3 force-directed graph and provides an AI chat interface for building investigations.

### The Mission Right Now

We are **overhauling the AI intelligence** of the Investigation Assistant. The backend is being updated to return complete graphs in 2-3 seconds (instead of 10-30 seconds). Your job is to update the frontend to:

1. Handle the new `scaffold` response type
2. Render expansion path buttons
3. Wire button clicks to expansion calls

---

## Project Structure

```
sp-frontend/
├── client/
│   └── src/
│       ├── components/
│       │   ├── NetworkCanvas.tsx        # D3 force-directed graph
│       │   ├── InvestigativeAssistant.tsx  # AI chat interface (1300+ lines)
│       │   ├── ExportModal.tsx          # PNG/SVG export
│       │   ├── canvas/                  # Extracted canvas components
│       │   │   ├── ZoomControls.tsx
│       │   │   ├── AddEntityDialog.tsx
│       │   │   └── hooks/
│       │   └── assistant/               # Extracted assistant components
│       │       ├── ContextPanel.tsx
│       │       ├── ChatInput.tsx
│       │       └── hooks/
│       ├── contexts/
│       │   └── CanvasThemeContext.tsx   # Theme colors for entities
│       ├── lib/
│       │   └── store.ts                 # Zustand state management
│       └── pages/
│           └── Investigation.tsx        # Main investigation page
├── server/                              # Express server (minimal)
└── AGENTS.md                            # This file
```

---

## Current Architecture

### Data Flow

```
User types in InvestigativeAssistant
    ↓
POST /api/v2/agent-v2/chat/stream (SSE)
    ↓
Stream events: tool_start, tool_result, response, suggestions, complete
    ↓
InvestigativeAssistant processes events
    ↓
Calls onAddEntity/onAddRelationship for each suggestion
    ↓
NetworkCanvas re-renders with new nodes
```

### Key Components

**InvestigativeAssistant.tsx** - The AI chat interface
- Handles streaming SSE events
- Displays AI responses and tool calls
- Shows entity/relationship suggestions
- Manages conversation history

**NetworkCanvas.tsx** - The D3 visualization
- Force-directed graph layout
- Drag, zoom, pan interactions
- Node selection and editing
- Export functionality

---

## What You're Building

### 1. Handle Scaffold Response

The backend will return a new response type from `/api/v2/agent-v2/scaffold`:

```json
{
  "type": "scaffold",
  "title": "Peter Thiel Intellectual Network",
  "description": "...",
  "entities": [...],
  "relationships": [...],
  "expansion_paths": [...]
}
```

Update `InvestigativeAssistant.tsx` to:
1. Detect when starting a new investigation
2. Call `/scaffold` instead of `/chat/stream`
3. Batch-add all entities and relationships at once
4. Display expansion path buttons

### 2. ExpansionButtons Component

Create a new component that renders expansion paths as clickable buttons:

```tsx
// components/assistant/ExpansionButtons.tsx

interface ExpansionPath {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
}

interface Props {
  paths: ExpansionPath[];
  onSelect: (path: ExpansionPath) => void;
  disabled?: boolean;
}

export function ExpansionButtons({ paths, onSelect, disabled }: Props) {
  return (
    <div className="expansion-buttons">
      <p className="expansion-header">Where would you like to go deeper?</p>
      <div className="expansion-grid">
        {paths.map(path => (
          <button
            key={path.id}
            onClick={() => onSelect(path)}
            disabled={disabled}
            className="expansion-button"
          >
            <span className="expansion-icon">{path.icon}</span>
            <span className="expansion-title">{path.title}</span>
            <span className="expansion-description">{path.description}</span>
          </button>
        ))}
      </div>
      <button className="custom-query-button">
        🔍 Ask your own question...
      </button>
    </div>
  );
}
```

### 3. Wire Button Clicks

When user clicks an expansion button:
1. Send the `prompt` to `/chat/stream` (existing endpoint)
2. Show loading state on buttons
3. Process streaming response as normal
4. After completion, generate new expansion paths

---

## Key Files to Modify

### InvestigativeAssistant.tsx

Add:
```tsx
// State for expansion paths
const [expansionPaths, setExpansionPaths] = useState<ExpansionPath[]>([]);

// Function to call scaffold endpoint
const handleNewInvestigation = async (query: string) => {
  const response = await fetch('/api/v2/agent-v2/scaffold', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await response.json();
  
  // Batch add all entities
  data.entities.forEach(entity => onAddEntity(entity));
  
  // Batch add all relationships
  data.relationships.forEach(rel => onAddRelationship(rel));
  
  // Set expansion paths for buttons
  setExpansionPaths(data.expansion_paths);
};

// Function to handle expansion button click
const handleExpansionSelect = (path: ExpansionPath) => {
  // Send the prompt to existing chat/stream endpoint
  handleSend(path.prompt);
};
```

### New: ExpansionButtons.tsx

See component code above.

---

## Development Environment

```bash
# Node version
node 22.x

# Package manager
pnpm

# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Key dependencies
react 18.x
typescript 5.x
tailwindcss 3.x
d3 7.x
zustand 4.x
```

---

## Styling

Use Tailwind CSS classes. The expansion buttons should match the existing UI style:

```css
/* Example button styles */
.expansion-button {
  @apply flex flex-col items-start p-4 rounded-lg border border-gray-200;
  @apply hover:border-gray-400 hover:bg-gray-50 transition-colors;
  @apply text-left;
}

.expansion-icon {
  @apply text-2xl mb-2;
}

.expansion-title {
  @apply font-semibold text-gray-900;
}

.expansion-description {
  @apply text-sm text-gray-600 mt-1;
}
```

---

## Testing

```bash
# Run type checking
pnpm tsc --noEmit

# Run linting
pnpm lint

# Build to check for errors
pnpm build
```

---

## Common Pitfalls

1. **Don't break existing chat flow** - Scaffold is for NEW investigations only
2. **Batch add entities** - Don't add one at a time (causes re-renders)
3. **Handle loading states** - Show spinner while scaffold is loading
4. **Preserve conversation history** - Expansion uses existing chat/stream
5. **Mobile responsive** - Expansion buttons should work on small screens

---

## Reference Documents

- Backend `AGENTS.md` - Backend implementation details
- `COMPASS.md` in cogos-system - Project goals
- `ARCHITECTURE.md` in cogos-system - System architecture

---

## Current Sprint Goals

1. ✅ Refactor NetworkCanvas.tsx (extracted components)
2. ✅ Refactor InvestigativeAssistant.tsx (extracted components)
3. ⬜ Handle scaffold response type
4. ⬜ Create ExpansionButtons component
5. ⬜ Wire button clicks to expansion
6. ⬜ Test and deploy
