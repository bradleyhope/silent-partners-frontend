/**
 * Silent Partners - Assistant Types
 * 
 * Shared type definitions for the investigative assistant components.
 */

// Narrative event (from NarrativePanel)
export interface NarrativeEvent {
  id: string;
  timestamp: string;
  type: 'extraction' | 'context_update' | 'reasoning' | 'suggestion' | 'error' | 'user_action' | 'info' | 'discovery';
  title: string;
  content: string;
  reasoning?: string;
  actions?: { label: string; action: string; variant: 'primary' | 'secondary' }[];
  metadata?: Record<string, any>;
}

// Investigation context
export interface InvestigationContext {
  topic: string;
  domain: string;
  focus: string;
  keyQuestions: string[];
  title?: string;
  description?: string;
  key_findings?: string[];
  red_flags?: Array<{description: string; severity: string; entities_involved?: string[]}>;
  next_steps?: Array<{suggestion: string; reasoning: string; priority?: string; action_query: string}> | string[];
  hypotheses?: Array<{hypothesis: string; status: string}>;
  session_summaries?: Array<{date: string; summary: string}>;
  last_updated?: string;
}

// Suggestion type
export interface Suggestion {
  id?: string;
  type: string;
  message?: string;
  text?: string;
  reasoning?: string;
  action?: string;
  priority?: 'high' | 'medium' | 'low';
}

// Research history item
export interface ResearchHistoryItem {
  id: string;
  query: string;
  source: string;
  entities_found: number;
  relationships_found: number;
  timestamp: string;
}

// Progress status
export interface ProgressStatus {
  step?: number;
  total?: number;
  goal?: string;
  searching?: string;
  plan?: Array<{ step: number; goal: string }>;
}

// Chat message (re-export from ChatMessageBubble)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    entitiesFound?: number;
    relationshipsFound?: number;
    claimsCreated?: number;
  };
}
