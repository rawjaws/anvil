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

import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Bot, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Specialized Error Boundary for AI Workflow Components
 * Provides AI-specific error handling and graceful degradation
 */
const AIWorkflowFallback = ({ error, errorInfo, retry, retryCount, errorId }) => {
  const isAIServiceError = error?.message?.includes('AI service') ||
                          error?.message?.includes('Claude') ||
                          error?.message?.includes('API');

  return (
    <div className="ai-workflow-error">
      <div className="ai-workflow-error__content">
        <div className="ai-workflow-error__icon">
          <Bot className="w-8 h-8 text-orange-500" />
          <AlertCircle className="w-4 h-4 text-red-500 -ml-2 -mt-2" />
        </div>

        <div className="ai-workflow-error__header">
          <h3 className="ai-workflow-error__title">
            AI Workflow Temporarily Unavailable
          </h3>
          <p className="ai-workflow-error__subtitle">
            {isAIServiceError
              ? 'The AI service is currently experiencing issues. You can continue using other features.'
              : 'The AI workflow component encountered an error. Manual workflows are still available.'
            }
          </p>
        </div>

        <div className="ai-workflow-error__actions">
          <button
            onClick={retry}
            className="ai-workflow-error__button"
            disabled={retryCount >= 3}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryCount >= 3 ? 'Service Unavailable' : 'Retry AI Connection'}
          </button>
        </div>

        <div className="ai-workflow-error__fallback">
          <p className="text-sm text-gray-600">
            <strong>Alternative:</strong> Use manual document creation and editing features while AI services are restored.
          </p>
        </div>

        <div className="ai-workflow-error__error-id">
          <code>Error ID: {errorId}</code>
        </div>
      </div>

      <style jsx>{`
        .ai-workflow-error {
          background: linear-gradient(135deg, #fef3c7 0%, #fef2f2 100%);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 1.5rem;
          margin: 1rem 0;
          text-align: center;
        }

        .ai-workflow-error__content {
          max-width: 400px;
          margin: 0 auto;
        }

        .ai-workflow-error__icon {
          position: relative;
          display: inline-flex;
          margin-bottom: 1rem;
        }

        .ai-workflow-error__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 0.5rem;
        }

        .ai-workflow-error__subtitle {
          color: #6b7280;
          margin-bottom: 1rem;
          line-height: 1.5;
        }

        .ai-workflow-error__actions {
          margin-bottom: 1rem;
        }

        .ai-workflow-error__button {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background: #f59e0b;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ai-workflow-error__button:hover:not(:disabled) {
          background: #d97706;
        }

        .ai-workflow-error__button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .ai-workflow-error__fallback {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 6px;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .ai-workflow-error__error-id {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .ai-workflow-error__error-id code {
          background: rgba(255, 255, 255, 0.8);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

const AIWorkflowErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      level="component"
      fallbackComponent={AIWorkflowFallback}
    >
      {children}
    </ErrorBoundary>
  );
};

export default AIWorkflowErrorBoundary;