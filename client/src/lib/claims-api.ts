/**
 * Silent Partners - Claims API Client
 *
 * Handles communication with the Claims/Suggestion Queue endpoints.
 * Part of the Investigative Companion feature (v8.0).
 */

import api from './api';

// Types for Claims API
export interface Claim {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_type?: string;
  predicate: string;
  object_id: number;
  object_name: string;
  object_type?: string;
  status: 'pending_review' | 'confirmed' | 'rejected' | 'disputed' | 'inferred';
  confidence: number;
  suggestion_priority?: number;
  suggestion_rationale?: string;
  evidence_count?: number;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface Evidence {
  id: number;
  claim_id: number;
  source_id: number;
  excerpt: string;
  excerpt_location?: string;
  context_before?: string;
  context_after?: string;
  relevance_score: number;
  is_direct: boolean;
  verified: boolean;
  source_title?: string;
  source_url?: string;
  source_tier?: number;
  source_trust_score?: number;
}

export interface Source {
  id: number;
  graph_id: number;
  source_type: string;
  title?: string;
  url?: string;
  trust_score: number;
  source_tier: number;
  evidence_count?: number;
  created_at: string;
}

export interface IQS {
  total: number;
  relationship_density: number;
  orphan_rate: number;
  source_coverage: number;
  research_depth: number;
}

export interface IQSGuidance {
  iqs: IQS;
  status: 'good' | 'needs_work' | 'critical';
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    message: string;
    action?: string;
  }>;
}

export interface Finding {
  id: number;
  graph_id: number;
  finding_type: 'anomaly' | 'pattern' | 'red_flag' | 'gap' | 'connection';
  title: string;
  description: string;
  significance: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  acknowledged_at?: string;
  user_notes?: string;
  created_at: string;
}

export interface ClaimStats {
  entities: number;
  confirmed_claims: number;
  pending_claims: number;
  sources: number;
  evidence_pieces: number;
  unread_findings: number;
  iqs: IQS;
}

// API base URL - same as main API
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE || 'https://silent-partners-ai.onrender.com/api';

class ClaimsApiClient {
  private getToken(): string | null {
    // Get token from localStorage (set by auth)
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
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

  // =========================================================================
  // SUGGESTION QUEUE
  // =========================================================================

  /**
   * Get pending claims awaiting user review.
   */
  async getPendingClaims(graphId: number, limit: number = 20): Promise<{
    claims: Claim[];
    total_pending: number;
  }> {
    return this.request(`/v2/claims/pending?graph_id=${graphId}&limit=${limit}`);
  }

  /**
   * Get detailed information about a claim including all evidence.
   */
  async getClaimDetails(claimId: number, graphId: number): Promise<{
    claim: Claim & { evidence: Evidence[] };
  }> {
    return this.request(`/v2/claims/${claimId}?graph_id=${graphId}`);
  }

  /**
   * Accept a pending claim, making it visible in the graph.
   */
  async acceptClaim(claimId: number, graphId: number): Promise<{
    status: 'accepted';
    claim_id: number;
  }> {
    return this.request(`/v2/claims/${claimId}/accept?graph_id=${graphId}`, {
      method: 'POST',
    });
  }

  /**
   * Reject a pending claim.
   */
  async rejectClaim(claimId: number, graphId: number): Promise<{
    status: 'rejected';
    claim_id: number;
  }> {
    return this.request(`/v2/claims/${claimId}/reject?graph_id=${graphId}`, {
      method: 'POST',
    });
  }

  /**
   * Accept multiple claims at once.
   */
  async batchAcceptClaims(graphId: number, claimIds: number[]): Promise<{
    accepted: number[];
    failed: number[];
  }> {
    return this.request('/v2/claims/batch/accept', {
      method: 'POST',
      body: JSON.stringify({ graph_id: graphId, claim_ids: claimIds }),
    });
  }

  /**
   * Reject multiple claims at once.
   */
  async batchRejectClaims(graphId: number, claimIds: number[]): Promise<{
    rejected: number[];
    failed: number[];
  }> {
    return this.request('/v2/claims/batch/reject', {
      method: 'POST',
      body: JSON.stringify({ graph_id: graphId, claim_ids: claimIds }),
    });
  }

  // =========================================================================
  // CONFIRMED CLAIMS
  // =========================================================================

  /**
   * Get all confirmed claims for display in the graph.
   */
  async getConfirmedClaims(graphId: number): Promise<{
    claims: Claim[];
    total: number;
  }> {
    return this.request(`/v2/claims/confirmed?graph_id=${graphId}`);
  }

  // =========================================================================
  // INVESTIGATION QUALITY SCORE
  // =========================================================================

  /**
   * Get the Investigation Quality Score and recommendations.
   */
  async getIQS(graphId: number): Promise<IQSGuidance> {
    return this.request(`/v2/claims/iqs?graph_id=${graphId}`);
  }

  // =========================================================================
  // STATISTICS
  // =========================================================================

  /**
   * Get comprehensive investigation statistics.
   */
  async getStats(graphId: number): Promise<ClaimStats> {
    return this.request(`/v2/claims/stats?graph_id=${graphId}`);
  }

  // =========================================================================
  // FINDINGS
  // =========================================================================

  /**
   * Get unacknowledged findings (anomalies, patterns, red flags).
   */
  async getFindings(graphId: number): Promise<{
    findings: Finding[];
    total: number;
  }> {
    return this.request(`/v2/claims/findings?graph_id=${graphId}`);
  }

  /**
   * Acknowledge a finding (mark as read).
   */
  async acknowledgeFinding(findingId: number, graphId: number, notes?: string): Promise<{
    status: 'acknowledged';
    finding_id: number;
  }> {
    return this.request(`/v2/claims/findings/${findingId}/acknowledge?graph_id=${graphId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // =========================================================================
  // SOURCES
  // =========================================================================

  /**
   * Get all sources for an investigation.
   */
  async getSources(graphId: number): Promise<{
    sources: Source[];
    total: number;
  }> {
    return this.request(`/v2/claims/sources?graph_id=${graphId}`);
  }

  /**
   * Get all claims linked to a specific source.
   */
  async getClaimsForSource(sourceId: number): Promise<{
    claims: Claim[];
  }> {
    return this.request(`/v2/claims/sources/${sourceId}/claims`);
  }

  // =========================================================================
  // ENTITY ALIASES
  // =========================================================================

  /**
   * Get all aliases for an entity.
   */
  async getEntityAliases(entityId: number, graphId: number): Promise<{
    aliases: Array<{
      id: number;
      entity_id: number;
      alias: string;
      alias_type: string;
      confidence: number;
    }>;
  }> {
    return this.request(`/v2/claims/entities/${entityId}/aliases?graph_id=${graphId}`);
  }

  /**
   * Add an alias for an entity.
   */
  async addEntityAlias(
    entityId: number,
    graphId: number,
    alias: string,
    aliasType: string = 'aka'
  ): Promise<{
    status: 'created' | 'duplicate';
    alias_id?: number;
  }> {
    return this.request(`/v2/claims/entities/${entityId}/aliases?graph_id=${graphId}`, {
      method: 'POST',
      body: JSON.stringify({ alias, alias_type: aliasType }),
    });
  }
}

export const claimsApi = new ClaimsApiClient();
export default claimsApi;
