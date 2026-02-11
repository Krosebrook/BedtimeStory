
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component to catch rendering errors and show a comic-themed fallback.
 * Explicitly extending React.Component to ensure props and setState are correctly inherited.
 */
// Fix: Explicitly using React.Component ensures the type system correctly identifies the inherited props and setState methods.
export class ErrorBoundary extends React.Component<Props, State> {
  // Initialize state
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Fix: Use ErrorInfo from the React import
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    // Fix: Access inherited state and props from the React.Component base class explicitly.
    // Using 'this.state' and 'this.props' from a class that correctly extends React.Component.
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) return fallback;
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center bg-slate-900 text-white border-4 border-red-500 rounded-xl m-4 shadow-[8px_8px_0px_rgba(0,0,0,0.5)]">
          <h2 className="text-4xl font-comic text-red-500 mb-4 animate-bounce">💥 POW! SPLAT!</h2>
          <p className="text-xl font-serif mb-4">Something went wrong in the multiverse.</p>
          <div className="font-mono text-sm opacity-70 bg-black/50 p-4 rounded mb-6 text-left w-full max-w-md overflow-auto">
            {error?.message}
          </div>
          {/* Fix: setState is a method inherited from the React.Component base class. */}
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="comic-btn bg-blue-500 text-white px-6 py-2 hover:bg-blue-400"
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}
