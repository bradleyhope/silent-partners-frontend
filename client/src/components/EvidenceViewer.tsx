/**
 * Silent Partners - Evidence Viewer Component
 *
 * Displays evidence for a claim including source information, excerpts, and context.
 * Part of the Investigative Companion feature (v8.0).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink,
  FileText,
  Quote,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import claimsApi, { Claim, Evidence } from '@/lib/claims-api';

// Source tier configuration
const SOURCE_TIERS: Record<number, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: typeof Shield;
  description: string;
}> = {
  1: { 
    label: 'Official', 
    color: 'text-green-700', 
    bgColor: 'bg-green-100',
    icon: ShieldCheck,
    description: 'Court documents, SEC filings, official government records' 
  },
  2: { 
    label: 'Registry', 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    icon: Shield,
    description: 'Corporate registries, OpenCorporates, FEC filings' 
  },
  3: { 
    label: 'News', 
    color: 'text-yellow-700', 
    bgColor: 'bg-yellow-100',
    icon: FileText,
    description: 'Major news outlets (NYT, WSJ, Bloomberg, Reuters)' 
  },
  4: { 
    label: 'Secondary', 
    color: 'text-orange-700', 
    bgColor: 'bg-orange-100',
    icon: FileText,
    description: 'Wikipedia, Crunchbase, LinkedIn' 
  },
  5: { 
    label: 'Social', 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    icon: ShieldAlert,
    description: 'Social media, unverified blogs, forums' 
  },
};

// Get source tier info with fallback
const getSourceTier = (tier: number | undefined) => {
  return SOURCE_TIERS[tier || 5] || SOURCE_TIERS[5];
};

// Format trust score as percentage
const formatTrustScore = (score: number | undefined): string => {
  if (score === undefined) return 'N/A';
  return `${Math.round(score * 100)}%`;
};

interface EvidenceCardProps {
  evidence: Evidence;
  isExpanded?: boolean;
}

function EvidenceCard({ evidence, isExpanded: initialExpanded = false }: EvidenceCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const tier = getSourceTier(evidence.source_tier);
  const TierIcon = tier.icon;

  return (
    <Card className="mb-3 border-l-2" style={{ borderLeftColor: tier.color.replace('text-', '') }}>
      <CardHeader className="py-2 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Source info */}
            <div className="flex items-center gap-2 mb-1">
              <Badge className={`${tier.bgColor} ${tier.color} text-xs font-normal`}>
                <TierIcon className="h-3 w-3 mr-1" />
                {tier.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Trust: {formatTrustScore(evidence.source_trust_score)}
              </span>
            </div>
            
            {/* Source title */}
            {evidence.source_title && (
              <div className="text-sm font-medium truncate">
                {evidence.source_title}
              </div>
            )}
          </div>
          
          {/* External link */}
          {evidence.source_url && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={() => window.open(evidence.source_url, '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="py-2 px-3">
        {/* Excerpt */}
        <div className="relative">
          <Quote className="absolute -left-1 -top-1 h-4 w-4 text-muted-foreground/30" />
          <blockquote className="pl-4 text-sm italic text-foreground/80 border-l-2 border-muted">
            {evidence.excerpt}
          </blockquote>
        </div>
        
        {/* Context toggle */}
        {(evidence.context_before || evidence.context_after) && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 h-6 text-xs text-muted-foreground"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide context
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show context
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                {evidence.context_before && (
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="font-medium">Before:</span> {evidence.context_before}
                  </div>
                )}
                {evidence.context_after && (
                  <div className="p-2 bg-muted/30 rounded">
                    <span className="font-medium">After:</span> {evidence.context_after}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Metadata row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {evidence.excerpt_location && (
            <span>Location: {evidence.excerpt_location}</span>
          )}
          <span className={evidence.is_direct ? 'text-green-600' : 'text-yellow-600'}>
            {evidence.is_direct ? 'Direct statement' : 'Inferred'}
          </span>
          {evidence.verified && (
            <span className="text-green-600 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface EvidenceViewerDialogProps {
  claim: Claim | null;
  graphId: number;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (claim: Claim) => void;
  onReject?: (claim: Claim) => void;
}

export function EvidenceViewerDialog({
  claim,
  graphId,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: EvidenceViewerDialogProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load evidence when dialog opens
  useEffect(() => {
    if (isOpen && claim) {
      setIsLoading(true);
      setError(null);
      
      claimsApi.getClaimDetails(claim.id, graphId)
        .then(result => {
          setEvidence(result.claim.evidence || []);
        })
        .catch(err => {
          console.error('Failed to load evidence:', err);
          setError('Failed to load evidence');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, claim, graphId]);

  if (!claim) return null;

  const getStatusBadge = () => {
    switch (claim.status) {
      case 'pending_review':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-50 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700"><AlertCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'disputed':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700"><AlertCircle className="h-3 w-3 mr-1" />Disputed</Badge>;
      default:
        return <Badge variant="outline">{claim.status}</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            <span>{claim.subject_name}</span>
            <Badge variant="outline" className="font-mono text-xs">
              {claim.predicate.replace(/_/g, ' ')}
            </Badge>
            <span>{claim.object_name}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            {getStatusBadge()}
            <span className="text-sm">
              Confidence: <strong>{Math.round(claim.confidence * 100)}%</strong>
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {/* Rationale */}
          {claim.suggestion_rationale && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-1">AI Rationale</h4>
              <p className="text-sm text-muted-foreground">{claim.suggestion_rationale}</p>
            </div>
          )}

          {/* Evidence section */}
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Evidence ({evidence.length})
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading evidence...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          ) : evidence.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No evidence recorded for this claim</p>
            </div>
          ) : (
            <div className="space-y-2">
              {evidence.map((ev) => (
                <EvidenceCard key={ev.id} evidence={ev} />
              ))}
            </div>
          )}
        </div>

        {/* Action buttons for pending claims */}
        {claim.status === 'pending_review' && (
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => {
                onReject?.(claim);
                onClose();
              }}
            >
              Reject
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => {
                onAccept?.(claim);
                onClose();
              }}
            >
              Accept Claim
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default EvidenceViewerDialog;
