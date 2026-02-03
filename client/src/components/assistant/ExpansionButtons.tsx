/**
 * ExpansionButtons - Guided Exploration UI Component
 * 
 * Displays expansion path buttons after scaffold generation.
 * Users click these to expand the investigation in specific directions.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Search, ChevronRight } from 'lucide-react';

export interface ExpansionPath {
  id: string;
  icon: string;
  title: string;
  description: string;
  prompt: string;
  priority?: number;
}

interface ExpansionButtonsProps {
  paths: ExpansionPath[];
  onSelect: (path: ExpansionPath) => void;
  onCustomQuery?: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingPathId?: string;
}

export function ExpansionButtons({
  paths,
  onSelect,
  onCustomQuery,
  disabled = false,
  loading = false,
  loadingPathId
}: ExpansionButtonsProps) {
  if (!paths || paths.length === 0) {
    return null;
  }

  return (
    <div className="expansion-buttons space-y-4 mt-4">
      <div className="expansion-header">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Where would you like to go deeper?
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Click an option to expand the investigation in that direction
        </p>
      </div>
      
      <div className="expansion-grid grid grid-cols-1 md:grid-cols-2 gap-3">
        {paths.map((path) => {
          const isLoading = loading && loadingPathId === path.id;
          const isDisabled = disabled || (loading && loadingPathId !== path.id);
          
          return (
            <Card
              key={path.id}
              className={`
                expansion-button p-4 cursor-pointer transition-all duration-200
                hover:border-blue-400 hover:shadow-md
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isLoading ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
              onClick={() => !isDisabled && onSelect(path)}
            >
              <div className="flex items-start gap-3">
                <span className="expansion-icon text-2xl flex-shrink-0">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  ) : (
                    path.icon
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="expansion-title font-semibold text-gray-900 dark:text-gray-100">
                      {path.title}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                  <p className="expansion-description text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {path.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      
      {onCustomQuery && (
        <Button
          variant="outline"
          className="w-full mt-2 text-gray-600 dark:text-gray-400"
          onClick={onCustomQuery}
          disabled={disabled || loading}
        >
          <Search className="h-4 w-4 mr-2" />
          Ask your own question...
        </Button>
      )}
    </div>
  );
}

export default ExpansionButtons;
