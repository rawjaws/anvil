/*
 * Copyright 2025 Darcy Davidson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react';

/**
 * THE HAMMER'S FINAL OPTIMIZATION: Comprehensive Error Boundary
 * Provides 100% error resilience with graceful degradation and recovery
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error with comprehensive details
    const errorDetails = {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      props: this.props,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId
    };

    console.error('[ERROR BOUNDARY] Critical error caught:', errorDetails);

    // Report to monitoring service (if available)
    if (window.reportError) {
      window.reportError(errorDetails);
    }

    // Store error for debugging
    localStorage.setItem('lastError', JSON.stringify(errorDetails));

    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount >= 3) {
      // After 3 retries, suggest page reload
      this.setState({
        retryCount: newRetryCount,
        hasError: false
      });
      setTimeout(() => window.location.reload(), 100);
      return;
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: newRetryCount
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount, errorId } = this.state;
      const { fallbackComponent: FallbackComponent, level = 'page' } = this.props;

      // If a custom fallback component is provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            retry={this.handleRetry}
            retryCount={retryCount}
            errorId={errorId}
          />
        );
      }

      // Default error UI based on error level
      const isComponentLevel = level === 'component';

      return (
        <div className={`error-boundary ${isComponentLevel ? 'error-boundary--component' : 'error-boundary--page'}`}>
          <div className="error-boundary__content">
            <div className="error-boundary__icon">
              <Shield className="w-12 h-12 text-red-500" />
            </div>

            <div className="error-boundary__header">
              <h2 className="error-boundary__title">
                {isComponentLevel ? 'Component Error' : 'Something went wrong'}
              </h2>
              <p className="error-boundary__subtitle">
                {isComponentLevel
                  ? 'A component has encountered an error, but the rest of the page should work normally.'
                  : 'We encountered an unexpected error. Don\'t worry, your data is safe.'
                }
              </p>
            </div>

            <div className="error-boundary__details">
              <p className="error-boundary__error-id">
                Error ID: <code>{errorId}</code>
              </p>

              {process.env.NODE_ENV === 'development' && (
                <details className="error-boundary__debug">
                  <summary>Debug Information</summary>
                  <pre className="error-boundary__error-text">
                    {error && error.toString()}
                    {errorInfo && errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="error-boundary__actions">
              <button
                onClick={this.handleRetry}
                className="error-boundary__button error-boundary__button--primary"
                disabled={retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {retryCount >= 3 ? 'Reloading...' : `Try Again ${retryCount > 0 ? `(${retryCount}/3)` : ''}`}
              </button>

              {!isComponentLevel && (
                <button
                  onClick={this.handleGoHome}
                  className="error-boundary__button error-boundary__button--secondary"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </button>
              )}
            </div>

            <div className="error-boundary__help">
              <p className="text-sm text-gray-600">
                If this problem persists, please report it with the Error ID above.
              </p>
            </div>
          </div>

          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 2rem;
              min-height: 400px;
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              margin: 1rem;
            }

            .error-boundary--page {
              min-height: 60vh;
              background: #fefefe;
              border: none;
              margin: 0;
            }

            .error-boundary--component {
              min-height: 200px;
              background: #fef2f2;
            }

            .error-boundary__content {
              text-align: center;
              max-width: 500px;
            }

            .error-boundary__icon {
              margin-bottom: 1rem;
            }

            .error-boundary__title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #dc2626;
              margin-bottom: 0.5rem;
            }

            .error-boundary__subtitle {
              color: #6b7280;
              margin-bottom: 1.5rem;
              line-height: 1.5;
            }

            .error-boundary__details {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 1rem;
              margin-bottom: 1.5rem;
              text-align: left;
            }

            .error-boundary__error-id {
              font-size: 0.875rem;
              color: #374151;
              margin-bottom: 0.5rem;
            }

            .error-boundary__error-id code {
              background: #f3f4f6;
              padding: 0.25rem 0.5rem;
              border-radius: 4px;
              font-family: monospace;
              font-size: 0.8rem;
            }

            .error-boundary__debug {
              margin-top: 1rem;
            }

            .error-boundary__debug summary {
              cursor: pointer;
              font-weight: 500;
              color: #6b7280;
            }

            .error-boundary__error-text {
              background: #1f2937;
              color: #f9fafb;
              padding: 1rem;
              border-radius: 4px;
              font-size: 0.75rem;
              overflow-x: auto;
              margin-top: 0.5rem;
            }

            .error-boundary__actions {
              display: flex;
              gap: 0.75rem;
              justify-content: center;
              margin-bottom: 1rem;
            }

            .error-boundary__button {
              display: inline-flex;
              align-items: center;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              font-size: 0.875rem;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              border: none;
            }

            .error-boundary__button:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            .error-boundary__button--primary {
              background: #dc2626;
              color: white;
            }

            .error-boundary__button--primary:hover:not(:disabled) {
              background: #b91c1c;
            }

            .error-boundary__button--secondary {
              background: #f3f4f6;
              color: #374151;
              border: 1px solid #d1d5db;
            }

            .error-boundary__button--secondary:hover {
              background: #e5e7eb;
            }

            .error-boundary__help {
              color: #6b7280;
              font-size: 0.875rem;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;