/**
 * Silent Partners - Suggestion Queue Component
 *
 * Displays pending claims from the AI for user review.
 * Part of the Investigative Companion feature (v8.0).
 *
 * Features:
 * - Shows pending claims with subject → predicate → object
 * - Displays evidence excerpts and source information
 * - Accept/Reject buttons for each claim
 * - Batch accept/reject functionality
 * - IQS (Investigation Quality Score) display
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  AlertTriangle,
  Loader2,
  CheckCheck,
  XCircle,
  Info,
  Shield,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import claimsApi, { Claim, Evidence, IQSGuidance } from '@/lib/claims-api';

// Source tier colors and labels
const SOURCE_TIERS: Record<number, { label: string; color: string; description: string }> = {
  1: { label: 'Official', color: 'bg-green-500', description: 'Court documents, SEC filings' },
  2: { label: 'Registry', color: 'bg-blue-500', description: 'Corporate registries, government databases' },
  3: { label: 'News', color: 'bg-yellow-500', description: 'Major news outlets' },
  4: { label: 'Secondary', color: 'bg-orange-500', description: 'Wikipedia, Crunchbase' },
  5: { label: 'Social', color: 'bg-red-500', description: 'Social media, unverified' },
};

// Confidence color based on value
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  if (confidence >= 0.4) return 'text-orange-600';
  return 'text-red-600';
};

// IQS status colors
const getIQSColor = (total: number): string => {
  if (total >= 70) return 'text-green-600';
  if (total >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

interface ClaimCardProps {
  claim: Claim;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onViewEvidence: (id: number) => void;
  isLoading: boolean;
  isSelected: boolean;
  onSelect: (id: number, selected: boolean) => void;
}

function ClaimCard({ 
  claim, 
  onAccept, 
  onReject, 
  onViewEvidence, 
  isLoading,
  isSelected,
  onSelect
}: ClaimCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  const handleExpand = async () => {
    if (!isExpanded && evidence.length === 0) {
      setLoadingEvidence(true);
      try {
        // Note: We'd need graphId here - for now we'll show the rationale
        setEvidence([]);
      } catch (error) {
        console.error('Failed to load evidence:', error);
      } finally {
        setLoadingEvidence(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="mb-3 border-l-4 border-l-amber-500/50 hover:border-l-amber-500 transition-colors">
      <CardHeader className="py-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(claim.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{claim.subject_name}</span>
                <Badge variant="outline" className="text-xs font-mono">
                  {claim.predicate.replace(/_/g, ' ')}
                </Badge>
                <span className="font-semibold text-sm">{claim.object_name}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span className={getConfidenceColor(claim.confidence)}>
                  {Math.round(claim.confidence * 100)}% confidence
                </span>
                {claim.evidence_count && claim.evidence_count > 0 && (
                  <>
                    <span>•</span>
                    <span>{claim.evidence_count} evidence</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => onAccept(claim.id)}
              disabled={isLoading}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onReject(claim.id)}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {claim.suggestion_rationale && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-4 py-1 h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleExpand}
            >
              <span>View rationale</span>
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 px-4">
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 mt-1">
                <Info className="h-3 w-3 inline mr-1" />
                {claim.suggestion_rationale}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Card>
  );
}

interface IQSDisplayProps {
  iqs: IQSGuidance | null;
  isLoading: boolean;
}

function IQSDisplay({ iqs, isLoading }: IQSDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        <span className="text-sm text-muted-foreground">Loading IQS...</span>
      </div>
    );
  }

  if (!iqs) return null;

  return (
    <Card className="mb-4 bg-gradient-to-r from-amber-50/50 to-transparent border-amber-200/50">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm">Investigation Quality Score</CardTitle>
          </div>
          <span className={`text-2xl font-bold ${getIQSColor(iqs.iqs.total)}`}>
            {Math.round(iqs.iqs.total)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-4">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Density</span>
            <span>{Math.round(iqs.iqs.relationship_density)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connected</span>
            <span>{Math.round(100 - iqs.iqs.orphan_rate)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sources</span>
            <span>{Math.round(iqs.iqs.source_coverage)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depth</span>
            <span>{Math.round(iqs.iqs.research_depth)}%</span>
          </div>
        </div>
        {iqs.recommendations && iqs.recommendations.length > 0 && (
          <div className="mt-2 pt-2 border-t border-amber-200/50">
            <div className="text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3 inline mr-1" />
              {iqs.recommendations[0].message}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SuggestionQueueProps {
  graphId: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimAccepted?: (claim: Claim) => void;
  onClaimRejected?: (claim: Claim) => void;
}

export default function SuggestionQueue({
  graphId,
  isOpen,
  onOpenChange,
  onClaimAccepted,
  onClaimRejected,
}: SuggestionQueueProps) {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [iqs, setIqs] = useState<IQSGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingIQS, setIsLoadingIQS] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<Set<number>>(new Set());

  // Load pending claims
  const loadClaims = useCallback(async () => {
    if (!graphId) return;
    
    setIsLoading(true);
    try {
      const result = await claimsApi.getPendingClaims(graphId, 20);
      setClaims(result.claims);
      setTotalPending(result.total_pending);
    } catch (error) {
      console.error('Failed to load claims:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
    }
  }, [graphId]);

  // Load IQS
  const loadIQS = useCallback(async () => {
    if (!graphId) return;
    
    setIsLoadingIQS(true);
    try {
      const result = await claimsApi.getIQS(graphId);
      setIqs(result);
    } catch (error) {
      console.error('Failed to load IQS:', error);
    } finally {
      setIsLoadingIQS(false);
    }
  }, [graphId]);

  // Load data when panel opens or graphId changes
  useEffect(() => {
    if (isOpen && graphId) {
      loadClaims();
      loadIQS();
    }
  }, [isOpen, graphId, loadClaims, loadIQS]);

  // Handle accept
  const handleAccept = async (claimId: number) => {
    if (!graphId) return;
    
    setActionInProgress(claimId);
    try {
      await claimsApi.acceptClaim(claimId, graphId);
      const acceptedClaim = claims.find(c => c.id === claimId);
      setClaims(prev => prev.filter(c => c.id !== claimId));
      setTotalPending(prev => prev - 1);
      toast.success('Claim accepted');
      if (acceptedClaim && onClaimAccepted) {
        onClaimAccepted(acceptedClaim);
      }
      // Refresh IQS after accepting
      loadIQS();
    } catch (error) {
      console.error('Failed to accept claim:', error);
      toast.error('Failed to accept claim');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle reject
  const handleReject = async (claimId: number) => {
    if (!graphId) return;
    
    setActionInProgress(claimId);
    try {
      await claimsApi.rejectClaim(claimId, graphId);
      const rejectedClaim = claims.find(c => c.id === claimId);
      setClaims(prev => prev.filter(c => c.id !== claimId));
      setTotalPending(prev => prev - 1);
      toast.success('Claim rejected');
      if (rejectedClaim && onClaimRejected) {
        onClaimRejected(rejectedClaim);
      }
    } catch (error) {
      console.error('Failed to reject claim:', error);
      toast.error('Failed to reject claim');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle batch accept
  const handleBatchAccept = async () => {
    if (!graphId || selectedClaims.size === 0) return;
    
    setIsLoading(true);
    try {
      const result = await claimsApi.batchAcceptClaims(graphId, Array.from(selectedClaims));
      setClaims(prev => prev.filter(c => !result.accepted.includes(c.id)));
      setTotalPending(prev => prev - result.accepted.length);
      setSelectedClaims(new Set());
      toast.success(`Accepted ${result.accepted.length} claims`);
      loadIQS();
    } catch (error) {
      console.error('Failed to batch accept:', error);
      toast.error('Failed to accept claims');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle batch reject
  const handleBatchReject = async () => {
    if (!graphId || selectedClaims.size === 0) return;
    
    setIsLoading(true);
    try {
      const result = await claimsApi.batchRejectClaims(graphId, Array.from(selectedClaims));
      setClaims(prev => prev.filter(c => !result.rejected.includes(c.id)));
      setTotalPending(prev => prev - result.rejected.length);
      setSelectedClaims(new Set());
      toast.success(`Rejected ${result.rejected.length} claims`);
    } catch (error) {
      console.error('Failed to batch reject:', error);
      toast.error('Failed to reject claims');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection
  const handleSelect = (id: number, selected: boolean) => {
    setSelectedClaims(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedClaims.size === claims.length) {
      setSelectedClaims(new Set());
    } else {
      setSelectedClaims(new Set(claims.map(c => c.id)));
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sidebar-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-amber-600" />
            <span className="font-medium text-sm">Suggestion Queue</span>
            {totalPending > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">
                {totalPending}
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="px-4 pb-4">
          {/* IQS Display */}
          <IQSDisplay iqs={iqs} isLoading={isLoadingIQS} />
          
          {/* Batch actions */}
          {claims.length > 0 && (
            <div className="flex items-center justify-between mb-3 pb-2 border-b">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSelectAll}
                >
                  {selectedClaims.size === claims.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedClaims.size > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {selectedClaims.size} selected
                  </span>
                )}
              </div>
              {selectedClaims.size > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-green-600 border-green-200 hover:bg-green-50"
                    onClick={handleBatchAccept}
                    disabled={isLoading}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleBatchReject}
                    disabled={isLoading}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Claims list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading suggestions...</span>
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No pending suggestions</p>
              <p className="text-xs mt-1">AI-discovered connections will appear here for your review</p>
            </div>
          ) : (
            <div className="space-y-2">
              {claims.map(claim => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  onViewEvidence={() => {}}
                  isLoading={actionInProgress === claim.id}
                  isSelected={selectedClaims.has(claim.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
          
          {/* Load more */}
          {totalPending > claims.length && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={loadClaims}
              disabled={isLoading}
            >
              Load more ({totalPending - claims.length} remaining)
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
