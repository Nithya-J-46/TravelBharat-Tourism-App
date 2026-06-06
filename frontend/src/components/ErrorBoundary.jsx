import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-250/30 dark:border-rose-900/30 rounded-3xl text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {this.props.fallbackMessage || "Unable to load section"}
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold max-w-md mx-auto leading-relaxed">
            We encountered a temporary rendering issue in this section. Try reloading the page or continuing to other sections of the planner.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
