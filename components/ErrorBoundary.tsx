/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-slate-900 text-white border-4 border-red-500 rounded-xl m-4 shadow-[8px_8px_0px_rgba(255,0,0,0.5)]">
          <h2 className="text-4xl font-comic text-red-500 mb-4 animate-bounce">💥 POW! SPLAT!</h2>
          <p className="text-xl font-serif mb-4">Something went wrong in the multiverse.</p>
          <div className="font-mono text-sm opacity-70 bg-black/50 p-4 rounded mb-6 text-left w-full max-w-md overflow-auto">
            {this.state.error?.message}
          </div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="comic-btn bg-blue-500 text-white px-6 py-2 hover:bg-blue-400"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}