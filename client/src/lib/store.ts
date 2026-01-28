/**
 * Silent Partners - Network State Store
 * 
 * Simple state management for network data using React context.
 * Handles entities, relationships, and UI state.
 */

export interface Entity {
  id: string;
  name: string;
  type: 'person' | 'corporation' | 'organization' | 'financial' | 'government' | 'event' | 'unknown';
  description?: string;
  importance?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  startDate?: string;
  endDate?: string;
  status?: 'confirmed' | 'suspected' | 'former';
  strength?: number;
}

export interface InvestigationContext {
  topic: string;
  domain: string;
  focus: string;
  keyQuestions: string[];
}

export interface Network {
  id?: string;
  title: string;
  description: string;
  entities: Entity[];
  relationships: Relationship[];
  investigationContext?: InvestigationContext;
  createdAt?: string;
  updatedAt?: string;
}

export interface NetworkState {
  network: Network;
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  isLoading: boolean;
  error: string | null;
}

export const initialNetwork: Network = {
  title: 'Untitled Network',
  description: '',
  entities: [],
  relationships: [],
};

export const initialState: NetworkState = {
  network: initialNetwork,
  selectedEntityId: null,
  selectedRelationshipId: null,
  isLoading: false,
  error: null,
};

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Entity type colors
export const entityColors: Record<Entity['type'], string> = {
  person: '#4A90A4',
  corporation: '#7CB342',
  organization: '#7BA05B',
  financial: '#C9A227',
  government: '#8B7355',
  event: '#9B6B9E',
  unknown: '#78909C',
};

// Relationship status styles
export const relationshipStyles: Record<string, { strokeDasharray: string; opacity: number }> = {
  confirmed: { strokeDasharray: 'none', opacity: 0.8 },
  suspected: { strokeDasharray: '5,5', opacity: 0.6 },
  former: { strokeDasharray: '2,4', opacity: 0.4 },
};
