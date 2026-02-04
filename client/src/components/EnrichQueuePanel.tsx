/**
 * Enrich Queue Panel
 * 
 * Floating panel that shows the enrichment queue status.
 * Displays active tasks, pending tasks, and completed tasks.
 */

import { useState } from 'react';
import { useEnrichQueue, EnrichTask } from '@/contexts/EnrichQueueContext';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  X,
  Sparkles,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

function TaskStatusIcon({ status }: { status: EnrichTask['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="w-3 h-3 text-muted-foreground" />;
    case 'processing':
      return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />;
    case 'complete':
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case 'error':
      return <XCircle className="w-3 h-3 text-red-500" />;
  }
}

function TaskItem({ task, onRemove }: { task: EnrichTask; onRemove: () => void }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded text-xs",
      task.status === 'processing' && "bg-blue-50 dark:bg-blue-950/30",
      task.status === 'complete' && "bg-green-50 dark:bg-green-950/30 opacity-70",
      task.status === 'error' && "bg-red-50 dark:bg-red-950/30",
    )}>
      <TaskStatusIcon status={task.status} />
      <span className="flex-1 truncate font-medium">{task.entityName}</span>
      {task.status === 'processing' && (
        <span className="text-blue-600 dark:text-blue-400 tabular-nums">
          {task.progress}%
        </span>
      )}
      {task.status === 'complete' && task.result && (
        <span className="text-green-600 dark:text-green-400">
          +{task.result.connectionsAdded}
        </span>
      )}
      {(task.status === 'complete' || task.status === 'error') && (
        <button 
          onClick={onRemove}
          className="p-0.5 hover:bg-black/10 rounded"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function EnrichQueuePanel() {
  const { queue, isProcessing, clearCompleted, clearAll, removeFromQueue } = useEnrichQueue();
  const [isExpanded, setIsExpanded] = useState(true);

  // Don't show if queue is empty
  if (queue.length === 0) {
    return null;
  }

  const pendingCount = queue.filter(t => t.status === 'pending').length;
  const processingCount = queue.filter(t => t.status === 'processing').length;
  const completedCount = queue.filter(t => t.status === 'complete').length;
  const errorCount = queue.filter(t => t.status === 'error').length;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-background border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center gap-2 px-3 py-2 bg-muted/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="flex-1 font-medium text-sm">
          Enrichment Queue
        </span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {processingCount > 0 && (
            <span className="flex items-center gap-1 text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              {processingCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {pendingCount}
            </span>
          )}
          {completedCount > 0 && (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="w-3 h-3" />
              {completedCount}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Task list */}
      {isExpanded && (
        <div className="max-h-64 overflow-y-auto">
          <div className="p-2 space-y-1">
            {queue.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onRemove={() => removeFromQueue(task.id)}
              />
            ))}
          </div>

          {/* Actions */}
          {(completedCount > 0 || errorCount > 0) && (
            <div className="flex items-center gap-2 px-2 py-2 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={clearCompleted}
              >
                Clear completed
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
