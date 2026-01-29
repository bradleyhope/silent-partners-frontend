/**
 * Silent Partners - Canvas Error Boundary
 *
 * A specialized error boundary for the NetworkCanvas component.
 * Catches D3.js rendering errors without crashing the entire app.
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class CanvasErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for debugging (only in development)
    if (import.meta.env.DEV) {
      console.error('Canvas Error:', error);
      console.error('Error Info:', errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-muted/30">
          <div className="flex flex-col items-center p-8 max-w-md text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Visualization Error
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Something went wrong with the network visualization.
              This might be due to invalid data or a rendering issue.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-xs text-left bg-muted p-3 rounded mb-4 max-w-full overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default CanvasErrorBoundary;
