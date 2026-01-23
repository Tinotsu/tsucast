"use client";

import { Component, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <AlertCircle className="mb-4 h-8 w-8 text-red-500" />
          <h3 className="mb-2 font-semibold text-red-400">Something went wrong</h3>
          <p className="mb-4 text-sm text-red-300">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/30"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
