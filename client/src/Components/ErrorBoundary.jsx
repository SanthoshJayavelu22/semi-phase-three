// client/src/Components/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidMount() {
    this.handleUnhandledRejection = (event) => {
      console.error('Async unhandled promise rejection:', event.reason);
      this.setState({ hasError: true, error: event.reason || new Error('Unhandled Promise Rejection') });
    };
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    if (this.handleUnhandledRejection) {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by React ErrorBoundary:', error, errorInfo);
    
    // Auto-reload once on stale chunk import failure after new build deployments
    const errorMsg = (error?.message || error?.toString() || '');
    if (
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Importing a module script failed') ||
      errorMsg.includes('error loading dynamically imported module')
    ) {
      const isReloaded = sessionStorage.getItem('chunk_reload_retry');
      if (!isReloaded) {
        sessionStorage.setItem('chunk_reload_retry', 'true');
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full p-6 bg-white border border-rose-100 rounded-2xl shadow-xl text-center space-y-4 font-sans">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800">Something went wrong</h2>
              <p className="text-xs text-rose-600 font-medium mt-1 break-words">
                {this.state.error?.message || 'An unexpected error occurred in this view.'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
