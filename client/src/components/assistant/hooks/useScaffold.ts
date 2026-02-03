/**
 * useScaffold - Hook for scaffold API integration
 * 
 * Provides functions to generate scaffolds and expand investigations
 * using the new fast scaffold endpoint.
 */

import { useState, useCallback } from 'react';
import { ExpansionPath } from '../ExpansionButtons';

interface ScaffoldEntity {
  name: string;
  type: string;
  description?: string;
  importance?: number;
  evidence?: string;
}

interface ScaffoldRelationship {
  source: string;
  target: string;
  type: string;
  description?: string;
  evidence?: string;
  status?: string;
}

interface ScaffoldResult {
  type: 'scaffold' | 'expansion';
  title: string;
  description: string;
  entities: ScaffoldEntity[];
  relationships: ScaffoldRelationship[];
  expansion_paths: ExpansionPath[];
  metadata?: {
    generation_time?: number;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
  credits_used?: number;
  credits_remaining?: number;
}

interface UseScaffoldOptions {
  apiBase?: string;
  onEntitiesGenerated?: (entities: ScaffoldEntity[]) => void;
  onRelationshipsGenerated?: (relationships: ScaffoldRelationship[]) => void;
  onExpansionPathsGenerated?: (paths: ExpansionPath[]) => void;
  onError?: (error: string) => void;
}

export function useScaffold(options: UseScaffoldOptions = {}) {
  const {
    apiBase = '/api/v2/agent-v2',
    onEntitiesGenerated,
    onRelationshipsGenerated,
    onExpansionPathsGenerated,
    onError
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScaffoldResult | null>(null);

  /**
   * Generate a complete investigation scaffold
   */
  const generateScaffold = useCallback(async (
    query: string,
    existingEntities: any[] = [],
    existingRelationships: any[] = [],
    focus?: string
  ): Promise<ScaffoldResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/scaffold`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Auth header will be added by the app's fetch interceptor
        },
        body: JSON.stringify({
          query,
          existing_entities: existingEntities,
          existing_relationships: existingRelationships,
          focus
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: ScaffoldResult = await response.json();
      setLastResult(result);

      // Call callbacks
      if (result.entities && onEntitiesGenerated) {
        onEntitiesGenerated(result.entities);
      }
      if (result.relationships && onRelationshipsGenerated) {
        onRelationshipsGenerated(result.relationships);
      }
      if (result.expansion_paths && onExpansionPathsGenerated) {
        onExpansionPathsGenerated(result.expansion_paths);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Scaffold generation failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, onEntitiesGenerated, onRelationshipsGenerated, onExpansionPathsGenerated, onError]);

  /**
   * Expand an existing investigation in a specific direction
   */
  const expandInvestigation = useCallback(async (
    prompt: string,
    existingEntities: any[],
    existingRelationships: any[]
  ): Promise<ScaffoldResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/expand`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          existing_entities: existingEntities,
          existing_relationships: existingRelationships
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: ScaffoldResult = await response.json();
      setLastResult(result);

      // Call callbacks
      if (result.entities && onEntitiesGenerated) {
        onEntitiesGenerated(result.entities);
      }
      if (result.relationships && onRelationshipsGenerated) {
        onRelationshipsGenerated(result.relationships);
      }
      if (result.expansion_paths && onExpansionPathsGenerated) {
        onExpansionPathsGenerated(result.expansion_paths);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Expansion failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, onEntitiesGenerated, onRelationshipsGenerated, onExpansionPathsGenerated, onError]);

  return {
    generateScaffold,
    expandInvestigation,
    isLoading,
    error,
    lastResult
  };
}

export default useScaffold;
