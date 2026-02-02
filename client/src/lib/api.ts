/**
 * Silent Partners - API Client
 *
 * Handles all communication with the Silent Partners backend API.
 */

// API base URL from environment variable with validation
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE;

if (!API_BASE && import.meta.env.PROD) {
  console.error('VITE_API_URL environment variable is required in production');
}

// Fallback for development only
const getApiBase = () => {
  if (API_BASE) return API_BASE;
  if (import.meta.env.DEV) {
    console.warn('VITE_API_URL not set, using default development URL');
    return 'https://silent-partners-ai-api.onrender.com/api';
  }
  throw new Error('VITE_API_URL environment variable is required');
};

interface ExtractResponse {
  entities: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    importance?: number;
  }>;
  relationships: Array<{
    source: string;
    target: string;
    type?: string;
    label?: string;
  }>;
  metadata?: {
    model: string;
    tokens_used: number;
    cost_estimate: number;
  };
}

interface DiscoverResponse extends ExtractResponse {
  sources?: Array<{
    title: string;
    url: string;
    type: string;
  }>;
}

interface JobResponse {
  job_id: string;
  status: string;
  stage?: string;
  progress?: number;
  result?: ExtractResponse;
  message?: string;
}

// Custom error for document size limits
export class DocumentTooLargeError extends Error {
  estimatedPages: number;
  maxPages: number;
  
  constructor(message: string, estimatedPages: number, maxPages: number) {
    super(message);
    this.name = 'DocumentTooLargeError';
    this.estimatedPages = estimatedPages;
    this.maxPages = maxPages;
  }
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeout = options.timeout || 120000; // Default 120 seconds for long-running AI operations
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${getApiBase()}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        
        // Handle specific error codes
        if (error.error_code === 'DOCUMENT_TOO_LARGE') {
          const meta = error.metadata || {};
          throw new DocumentTooLargeError(
            error.error,
            meta.estimated_pages || 0,
            meta.max_pages_allowed || 20
          );
        }
        
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. The AI is taking longer than expected. Please try again.');
      }
      throw error;
    }
  }

  // Health check
  async health(): Promise<{ status: string; version: string }> {
    return this.request('/health');
  }

  // Extract entities and relationships from text
  async extract(text: string, model: string = 'gpt-5'): Promise<ExtractResponse> {
    return this.request('/extract', {
      method: 'POST',
      body: JSON.stringify({ text, model }),
    });
  }

  // Discover connections about a topic (sync)
  async discover(query: string, model: string = 'gpt-5', maxSources: number = 3): Promise<DiscoverResponse> {
    return this.request('/discover', {
      method: 'POST',
      body: JSON.stringify({ query, model, max_sources: maxSources }),
    });
  }

  // Start async discovery job
  async startDiscoverJob(query: string, model: string = 'gpt-5', maxSources: number = 5): Promise<{ job_id: string }> {
    return this.request('/jobs/discover', {
      method: 'POST',
      body: JSON.stringify({ query, model, max_sources: maxSources }),
    });
  }

  // Check job status
  async getJobStatus(jobId: string): Promise<JobResponse> {
    return this.request(`/jobs/${jobId}`);
  }

  // Infer relationships between entities - aggressive mode with web search
  async infer(
    entities: Array<{ id: string; name: string; type: string; description?: string }>, 
    relationships: Array<{ source: string; target: string; type?: string }>
  ): Promise<{
    inferred_relationships: Array<{
      source: string;
      target: string;
      type: string;
      confidence: number;
      description: string;
      evidence: string;
      category?: string;
    }>;
    analysis?: {
      total_possible_pairs: number;
      existing_connections: number;
      new_connections_found: number;
      network_density_improvement: string;
    };
    metadata?: {
      model: string;
      web_search_used: boolean;
      pairs_searched: number;
      entities_analyzed: number;
      existing_relationships: number;
    };
  }> {
    return this.request('/infer', {
      method: 'POST',
      body: JSON.stringify({ entities, relationships }),
    });
  }

  // Analyze graph
  async analyzeGraph(entities: Array<{ id: string; name: string; type?: string }>, relationships: Array<{ source: string; target: string; type?: string }>): Promise<{
    insights: string[];
    missingConnections: Array<{ source: string; target: string; reason: string }>;
    nodesOfInterest: Array<{ name: string; reason: string }>;
    overview: string;
    recommendations: Array<{ action: string; reason: string; priority: string }>;
  }> {
    return this.request('/analyze-graph', {
      method: 'POST',
      body: JSON.stringify({ entities, relationships }),
    });
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<{ token: string; user: { id: number; email: string; ai_credits_remaining: number } }> {
    const result = await this.request<{ token: string; user: { id: number; email: string; ai_credits_remaining: number } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.token = result.token;
    return result;
  }

  async register(email: string, password: string, username: string): Promise<{ token: string; user: { id: number; email: string } }> {
    const result = await this.request<{ token: string; user: { id: number; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, username }),
    });
    this.token = result.token;
    return result;
  }

  // PDF upload (async job)
  async uploadPdf(file: File): Promise<{ job_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${getApiBase()}/jobs/upload-pdf`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Graph persistence
  async saveGraph(network: {
    name: string;
    description: string;
    entities: Array<{ id: string; name: string; type: string; description?: string }>;
    relationships: Array<{ source: string; target: string; type?: string; label?: string }>;
  }): Promise<{ id: number }> {
    return this.request('/graphs', {
      method: 'POST',
      body: JSON.stringify(network),
    });
  }

  async listGraphs(): Promise<{ graphs: Array<{ id: number; title: string; description: string; created_at: string }> }> {
    return this.request('/graphs');
  }

  async loadGraph(id: number): Promise<{
    id: number;
    title: string;
    description: string;
    entities: Array<{ id: string; name: string; type: string }>;
    relationships: Array<{ source: string; target: string; type?: string }>;
  }> {
    return this.request(`/graphs/${id}`);
  }

  // Delete a graph
  async deleteGraph(id: number): Promise<{ success: boolean }> {
    return this.request(`/graphs/${id}`, {
      method: 'DELETE',
    });
  }

  // Share a graph (generate shareable link)
  async shareGraph(id: number): Promise<{ share_url: string; share_id: string }> {
    return this.request(`/graphs/${id}/share`, {
      method: 'POST',
    });
  }

  // Enrich an entity with AI
  async enrichEntity(entityName: string, entityType: string, context?: string): Promise<{
    enriched: {
      name: string;
      type: string;
      description: string;
      key_facts: string[];
      connections_suggested: Array<{ name: string; relationship: string }>;
    };
  }> {
    return this.request('/ai/enrich', {
      method: 'POST',
      body: JSON.stringify({ 
        entity_name: entityName, 
        entity_type: entityType,
        context 
      }),
    });
  }

  // Estimate processing cost and time for a document
  async estimateProcessing(text: string): Promise<{
    estimate: {
      total_pages: number;
      total_sections: number;
      estimated_tokens: number;
      estimated_cost: number;
      estimated_time_minutes: number;
      section_breakdown: Array<{ section: number; pages: string; estimated_cost: number }>;
    };
    recommendations: {
      incremental: boolean;
      message: string;
      estimated_cost: string;
      estimated_time: string;
    };
  }> {
    return this.request('/estimate', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  // Incremental extraction - add a section to existing network
  async extractIncremental(
    text: string,
    existingEntities: Array<{ id: string; name: string; type: string }>,
    existingRelationships: Array<{ source: string; target: string }>,
    resolutionMap?: Record<string, string>,
    sectionsProcessed?: number,
    model: string = 'gpt-5-nano'
  ): Promise<{
    network: {
      entities: Array<{ id: string; name: string; type: string; description?: string }>;
      relationships: Array<{ source: string; target: string; type?: string }>;
    };
    section_result: {
      section_number: number;
      total_sections: number;
      entities_found: number;
      entities_merged: number;
      entities_new: number;
      relationships_found: number;
      cross_relationships_found: number;
      tokens_used: number;
      cost: number;
      processing_time: number;
    };
    metadata: {
      total_entities: number;
      total_relationships: number;
      entities_merged: number;
      entities_new: number;
      cross_relationships_found: number;
      sections_processed: number;
    };
    _resolution_map: Record<string, string>;
    _sections_processed: number;
  }> {
    return this.request('/extract/incremental', {
      method: 'POST',
      body: JSON.stringify({
        text,
        entities: existingEntities,
        relationships: existingRelationships,
        _resolution_map: resolutionMap || {},
        _sections_processed: sectionsProcessed || 0,
        model,
      }),
    });
  }

  // Find connection between two entities using AI - returns a connected network
  async findConnection(
    entity1: string,
    entity2: string,
    contextEntities?: Array<{ id?: string; name: string; type?: string; description?: string }>,
    contextRelationships?: Array<{ source: string; target: string; type?: string }>,
    model: string = 'gpt-5'
  ): Promise<{
    connection_found: boolean;
    connection_type?: 'direct' | 'through_intermediary' | 'through_organization' | 'circumstantial';
    connection_strength?: 'strong' | 'moderate' | 'weak';
    entities: Array<{
      id: string;
      name: string;
      type: string;
      description?: string;
      role_in_connection?: string;
    }>;
    relationships: Array<{
      source: string;
      target: string;
      type: string;
      label?: string;
      description?: string;
      evidence?: string;
      date?: string;
    }>;
    path_description?: string;
    key_intermediaries?: string[];
    summary: string;
    metadata: {
      entity1: string;
      entity2: string;
      model: string;
      sources_searched?: number;
      entities_count?: number;
      relationships_count?: number;
    };
  }> {
    return this.request('/find-connection', {
      method: 'POST',
      body: JSON.stringify({
        entity1,
        entity2,
        entities: contextEntities || [],
        relationships: contextRelationships || [],
        model,
      }),
    });
  }

  // Resolve entities and relationships through intelligent deduplication
  async resolveEntities(
    graphId: number,
    entities: Array<{ name: string; type: string; description?: string }>,
    relationships: Array<{ source: string; target: string; type: string }>,
    context?: string,
    autoAdd: boolean = true
  ): Promise<{
    success: boolean;
    resolved: {
      entities: Array<{
        id: string;
        name: string;
        type: string;
        is_new: boolean;
        merged_with?: string;
        aliases?: string[];
        confidence: number;
        resolution_method: string;
      }>;
      relationships: Array<{
        source: string;
        target: string;
        type: string;
        original_type?: string;
      }>;
      stats: {
        entities_added: number;
        entities_merged: number;
        entities_rejected: number;
        relationships_added: number;
      };
      rejected_entities?: Array<{ name: string; reason: string }>;
    };
  }> {
    return this.request(`/graph/${graphId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        entities,
        relationships,
        context,
        auto_add: autoAdd
      }),
    });
  }

  // Normalize all relationship types in a graph
  async normalizeRelationships(
    graphId: number,
    dryRun: boolean = true
  ): Promise<{
    success: boolean;
    result: {
      type_changes: number;
      duplicates_found: number;
      changes: Array<{ relationship_id: string; original_type: string; canonical_type: string }>;
      duplicates: Array<{ relationship_id: string; source: string; target: string; type: string }>;
      applied?: boolean;
      dry_run?: boolean;
    };
  }> {
    return this.request(`/graph/${graphId}/normalize-relationships`, {
      method: 'POST',
      body: JSON.stringify({ dry_run: dryRun }),
    });
  }

  // Find and merge duplicate entities in a graph
  async deduplicateEntities(
    graphId: number,
    dryRun: boolean = true,
    threshold: number = 0.85
  ): Promise<{
    success: boolean;
    result: {
      duplicates_found: number;
      potential_merges: Array<{
        entity1: { id: string; name: string };
        entity2: { id: string; name: string };
        match_type: string;
        confidence: number;
      }>;
      merged_count?: number;
      applied?: boolean;
      dry_run?: boolean;
    };
  }> {
    return this.request(`/graph/${graphId}/deduplicate-entities`, {
      method: 'POST',
      body: JSON.stringify({ dry_run: dryRun, threshold }),
    });
  }

  // Chat with the Per-Investigation Intelligence Agent
  async chat(
    message: string,
    context: {
      entities: Array<{ id: string; name: string; type: string; description?: string }>;
      relationships: Array<{ source: string; target: string; type: string }>;
    },
    history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    investigationContext?: string
  ): Promise<{
    response: string;
    actions?: Array<{ type: string; description?: string; target?: string }>;
    graph_insights?: {
      hub_entities?: Array<[string, number]>;
      patterns_detected?: string[];
      shell_indicators?: string[];
    };
  }> {
    return this.request('/v2/agent/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        context,
        history,
        investigation_context: investigationContext
      }),
    });
  }

  // F-06: Process article URL or pasted text to extract entities
  async processArticle(input: string): Promise<{
    success: boolean;
    url?: string;
    title?: string;
    source?: 'exa' | 'scrape' | 'pasted_text';
    content_length?: number;
    entities: Array<{
      id?: string;
      name: string;
      type: string;
      description?: string;
    }>;
    relationships: Array<{
      source: string;
      target: string;
      type?: string;
    }>;
    entity_count: number;
    relationship_count: number;
    error?: string;
  }> {
    return this.request('/ai/process-article', {
      method: 'POST',
      body: JSON.stringify({ input }),
      timeout: 180000, // 3 minutes for article processing
    });
  }
}
export const api = new ApiClient();
export default api;
