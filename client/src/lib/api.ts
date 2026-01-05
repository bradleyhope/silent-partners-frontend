/**
 * Silent Partners - API Client
 * 
 * Handles all communication with the Silent Partners backend API.
 */

const API_BASE = 'https://silent-partners-ai-api.onrender.com/api';

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

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
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

  // Infer relationships between entities
  async infer(entities: Array<{ id: string; name: string; type: string }>, relationships: Array<{ source: string; target: string }>): Promise<{
    inferred_relationships: Array<{
      source: string;
      target: string;
      type: string;
      confidence: number;
      description: string;
      evidence: string;
    }>;
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

    const response = await fetch(`${API_BASE}/jobs/upload-pdf`, {
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
}

export const api = new ApiClient();
export default api;
