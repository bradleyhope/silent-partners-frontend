/**
 * Silent Partners - IQS Dashboard Component
 *
 * Displays the Investigation Quality Score (IQS) and its components.
 * Provides recommendations for improving investigation quality.
 * Part of the Investigative Companion feature (v8.0).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Loader2,
  Network,
  Link2,
  FileSearch,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import claimsApi, { IQSGuidance, ClaimStats } from '@/lib/claims-api';

// IQS component configuration
const IQS_COMPONENTS: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  goodThreshold: number;
  criticalThreshold: number;
  invert?: boolean;
}> = {
  relationship_density: {
    label: 'Relationship Density',
    icon: Network,
    description: 'How well-connected are the entities in your graph?',
    goodThreshold: 60,
    criticalThreshold: 30,
  },
  orphan_rate: {
    label: 'Connected Entities',
    icon: Link2,
    description: 'Percentage of entities with at least one connection',
    goodThreshold: 80,
    criticalThreshold: 50,
    invert: true, // Lower orphan rate is better
  },
  source_coverage: {
    label: 'Source Coverage',
    icon: FileSearch,
    description: 'How many claims have documented evidence?',
    goodThreshold: 70,
    criticalThreshold: 40,
  },
  research_depth: {
    label: 'Research Depth',
    icon: Layers,
    description: 'Quality of evidence based on source tiers',
    goodThreshold: 50,
    criticalThreshold: 25,
  },
};

// Get color based on value and thresholds
const getScoreColor = (value: number, good: number, critical: number, invert: boolean = false): string => {
  const effectiveValue = invert ? 100 - value : value;
  if (effectiveValue >= good) return 'text-green-600';
  if (effectiveValue >= critical) return 'text-yellow-600';
  return 'text-red-600';
};

const getProgressColor = (value: number, good: number, critical: number, invert: boolean = false): string => {
  const effectiveValue = invert ? 100 - value : value;
  if (effectiveValue >= good) return 'bg-green-500';
  if (effectiveValue >= critical) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Get overall status
const getOverallStatus = (total: number): { label: string; color: string; icon: typeof CheckCircle } => {
  if (total >= 70) return { label: 'Good', color: 'text-green-600', icon: CheckCircle };
  if (total >= 40) return { label: 'Needs Work', color: 'text-yellow-600', icon: AlertTriangle };
  return { label: 'Critical', color: 'text-red-600', icon: AlertTriangle };
};

interface IQSComponentCardProps {
  name: string;
  value: number;
}

function IQSComponentCard({ name, value }: IQSComponentCardProps) {
  const config = IQS_COMPONENTS[name];
  if (!config) return null;
  const Icon = config.icon;
  const displayValue = config.invert ? 100 - value : value;
  const colorClass = getScoreColor(value, config.goodThreshold, config.criticalThreshold, config.invert);
  const progressColor = getProgressColor(value, config.goodThreshold, config.criticalThreshold, config.invert);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-sm cursor-help">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{config.label}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-xs">{config.description}</p>
          </TooltipContent>
        </Tooltip>
        <span className={`text-sm font-medium ${colorClass}`}>
          {Math.round(displayValue)}%
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: {
    priority: 'high' | 'medium' | 'low';
    message: string;
    action?: string;
  };
  onAction?: (action: string) => void;
}

function RecommendationCard({ recommendation, onAction }: RecommendationCardProps) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50/50',
    medium: 'border-yellow-200 bg-yellow-50/50',
    low: 'border-blue-200 bg-blue-50/50',
  };

  const priorityBadgeColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className={`p-3 rounded-lg border ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <Badge className={`${priorityBadgeColors[recommendation.priority]} text-xs mb-1`}>
            {recommendation.priority}
          </Badge>
          <p className="text-sm">{recommendation.message}</p>
        </div>
        {recommendation.action && onAction && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onAction(recommendation.action!)}
          >
            Fix
          </Button>
        )}
      </div>
    </div>
  );
}

interface IQSDashboardProps {
  graphId: number | null;
  onAction?: (action: string) => void;
  compact?: boolean;
}

export default function IQSDashboard({ graphId, onAction, compact = false }: IQSDashboardProps) {
  const [iqs, setIqs] = useState<IQSGuidance | null>(null);
  const [stats, setStats] = useState<ClaimStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load IQS data
  const loadData = useCallback(async () => {
    if (!graphId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [iqsResult, statsResult] = await Promise.all([
        claimsApi.getIQS(graphId),
        claimsApi.getStats(graphId),
      ]);
      setIqs(iqsResult);
      setStats(statsResult);
    } catch (err) {
      console.error('Failed to load IQS:', err);
      setError('Failed to load investigation quality data');
    } finally {
      setIsLoading(false);
    }
  }, [graphId]);

  // Load on mount and when graphId changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!graphId) {
    return (
      <Card className="opacity-50">
        <CardContent className="py-6 text-center text-muted-foreground">
          <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Save your investigation to track quality</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Loading IQS...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="py-6 text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={loadData}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!iqs) return null;

  const status = getOverallStatus(iqs.iqs.total);
  const StatusIcon = status.icon;

  // Compact view for sidebar
  if (compact) {
    return (
      <Card className="bg-gradient-to-r from-amber-50/50 to-transparent border-amber-200/50">
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm">IQS</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${status.color}`}>
                {Math.round(iqs.iqs.total)}
              </span>
              <StatusIcon className={`h-4 w-4 ${status.color}`} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-3 px-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <IQSComponentCard name="relationship_density" value={iqs.iqs.relationship_density} />
            <IQSComponentCard name="orphan_rate" value={iqs.iqs.orphan_rate} />
            <IQSComponentCard name="source_coverage" value={iqs.iqs.source_coverage} />
            <IQSComponentCard name="research_depth" value={iqs.iqs.research_depth} />
          </div>
          {iqs.recommendations && iqs.recommendations.length > 0 && (
            <div className="mt-3 pt-2 border-t border-amber-200/50">
              <p className="text-xs text-muted-foreground flex items-center">
                <Info className="h-3 w-3 mr-1" />
                {iqs.recommendations[0].message}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-600" />
            <CardTitle>Investigation Quality Score</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription>
          Track the completeness and reliability of your investigation
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main score */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${status.color}`}>
            {Math.round(iqs.iqs.total)}
          </div>
          <div className={`flex items-center justify-center gap-1 mt-1 ${status.color}`}>
            <StatusIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
        </div>

        {/* Component scores */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Score Components</h4>
          <div className="space-y-3">
            <IQSComponentCard name="relationship_density" value={iqs.iqs.relationship_density} />
            <IQSComponentCard name="orphan_rate" value={iqs.iqs.orphan_rate} />
            <IQSComponentCard name="source_coverage" value={iqs.iqs.source_coverage} />
            <IQSComponentCard name="research_depth" value={iqs.iqs.research_depth} />
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.entities}</div>
              <div className="text-xs text-muted-foreground">Entities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.confirmed_claims}</div>
              <div className="text-xs text-muted-foreground">Claims</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.sources}</div>
              <div className="text-xs text-muted-foreground">Sources</div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {iqs.recommendations && iqs.recommendations.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {iqs.recommendations.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  recommendation={rec}
                  onAction={onAction}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending items */}
        {stats && stats.pending_claims > 0 && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm">
                <strong>{stats.pending_claims}</strong> pending claims awaiting review
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
