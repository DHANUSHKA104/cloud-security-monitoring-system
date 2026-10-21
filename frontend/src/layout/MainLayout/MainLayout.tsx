import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 p-6 text-center">
          <div className="max-w-md w-full bg-gray-900 border border-red-800/50 p-6 rounded-lg">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-xs text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected runtime error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs rounded font-medium border border-gray-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const MainLayout: React.FC = () => {
  const { toasts, removeToast } = useAppStore();

  const toastToneStyles = {
    success: 'bg-emerald-950 text-emerald-200 border-emerald-800',
    error: 'bg-red-950 text-red-200 border-red-800',
    warning: 'bg-amber-950 text-amber-200 border-amber-800',
    info: 'bg-blue-950 text-blue-200 border-blue-800',
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
        <Outlet />

        {/* Global Toast Area */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              className={`p-3 rounded-md border text-xs shadow-lg cursor-pointer pointer-events-auto flex items-start justify-between transition-all duration-200 ${
                toastToneStyles[toast.type]
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                className="ml-2 text-gray-400 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </ErrorBoundary>
  );
};
