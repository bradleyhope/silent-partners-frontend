/**
 * Silent Partners - Assistant Components
 * 
 * Barrel export for all assistant-related components.
 */

// Components
export { AssistantHeader } from './AssistantHeader';
export { ContextPanel } from './ContextPanel';
export { ContextEditor } from './ContextEditor';
export { EventsStream } from './EventsStream';
export { ResearchHistory } from './ResearchHistory';
export { SuggestionsPanel } from './SuggestionsPanel';
export { ProgressIndicator } from './ProgressIndicator';
export { ChatInput } from './ChatInput';
export { QuickActions } from './QuickActions';

// Types
export * from './types';

// Re-export ChatInput ref type
export type { ChatInputRef } from './ChatInput';
