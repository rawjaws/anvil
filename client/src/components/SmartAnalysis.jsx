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

import React, { useState, useEffect, useRef } from 'react';

const SmartAnalysis = () => {
  const [analysisInput, setAnalysisInput] = useState('');
  const [analysisType, setAnalysisType] = useState('capability');
  const [documentId, setDocumentId] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  // Mock AI analysis service call
  const performAnalysis = async (content, type, documentId) => {
    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/ai-workflow/ai/smart-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
          documentId: documentId || `analysis_${Date.now()}`,
          options: {
            enableSuggestions: true,
            depth: 'comprehensive'
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAnalysisResults(result.analysis);
        setSuggestions(result.suggestions || []);

        // Add to history
        const historyItem = {
          id: Date.now(),
          type,
          content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          timestamp: new Date(),
          results: result.analysis
        };
        setAnalysisHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResults({
        error: error.message,
        type: 'error'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analysisInput.trim()) return;

    await performAnalysis(analysisInput, analysisType, documentId);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target.result;
      setAnalysisInput(content);
      setDocumentId(file.name);

      // Auto-analyze uploaded file
      await performAnalysis(content, analysisType, file.name);
    };
    reader.readAsText(file);
  };

  const applySuggestion = (suggestion) => {
    if (suggestion.type === 'improvement') {
      setAnalysisInput(prev => prev + '\n\n' + suggestion.content);
    } else if (suggestion.type === 'replacement') {
      setAnalysisInput(suggestion.content);
    }
  };

  const renderAnalysisResults = () => {
    if (!analysisResults) return null;

    if (analysisResults.error) {
      return (
        <div className="analysis-error">
          <h3>Analysis Error</h3>
          <p>{analysisResults.error}</p>
        </div>
      );
    }

    return (
      <div className="analysis-results">
        <div className="results-header">
          <h3>Analysis Results</h3>
          <div className="results-meta">
            <span>Type: {analysisType}</span>
            <span>Confidence: {analysisResults.confidence || 'N/A'}%</span>
          </div>
        </div>

        {analysisResults.summary && (
          <div className="results-section">
            <h4>Summary</h4>
            <p>{analysisResults.summary}</p>
          </div>
        )}

        {analysisResults.insights && analysisResults.insights.length > 0 && (
          <div className="results-section">
            <h4>Key Insights</h4>
            <ul className="insights-list">
              {analysisResults.insights.map((insight, index) => (
                <li key={index} className={`insight-item ${insight.priority || 'medium'}`}>
                  <strong>{insight.title}:</strong> {insight.description}
                  {insight.impact && (
                    <span className="insight-impact">Impact: {insight.impact}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysisResults.gaps && analysisResults.gaps.length > 0 && (
          <div className="results-section">
            <h4>Identified Gaps</h4>
            <div className="gaps-grid">
              {analysisResults.gaps.map((gap, index) => (
                <div key={index} className="gap-card">
                  <h5>{gap.category}</h5>
                  <p>{gap.description}</p>
                  <div className="gap-severity">
                    Severity: <span className={`severity-${gap.severity}`}>{gap.severity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysisResults.quality && (
          <div className="results-section">
            <h4>Quality Assessment</h4>
            <div className="quality-metrics">
              <div className="quality-metric">
                <span>Completeness</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${analysisResults.quality.completeness || 0}%` }}
                  ></div>
                </div>
                <span>{analysisResults.quality.completeness || 0}%</span>
              </div>
              <div className="quality-metric">
                <span>Clarity</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${analysisResults.quality.clarity || 0}%` }}
                  ></div>
                </div>
                <span>{analysisResults.quality.clarity || 0}%</span>
              </div>
              <div className="quality-metric">
                <span>Consistency</span>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${analysisResults.quality.consistency || 0}%` }}
                  ></div>
                </div>
                <span>{analysisResults.quality.consistency || 0}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSuggestions = () => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
      <div className="suggestions-panel">
        <h3>AI Suggestions</h3>
        <div className="suggestions-list">
          {suggestions.map((suggestion, index) => (
            <div key={index} className={`suggestion-card ${suggestion.priority || 'medium'}`}>
              <div className="suggestion-header">
                <h4>{suggestion.title}</h4>
                <span className="suggestion-type">{suggestion.type}</span>
              </div>
              <p className="suggestion-description">{suggestion.description}</p>
              {suggestion.content && (
                <div className="suggestion-content">
                  <code>{suggestion.content}</code>
                </div>
              )}
              <div className="suggestion-actions">
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => applySuggestion(suggestion)}
                >
                  Apply
                </button>
                <button className="btn btn-small btn-secondary">
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAnalysisHistory = () => (
    <div className="analysis-history">
      <h3>Recent Analyses</h3>
      <div className="history-list">
        {analysisHistory.map(item => (
          <div
            key={item.id}
            className={`history-item ${selectedAnalysis?.id === item.id ? 'selected' : ''}`}
            onClick={() => setSelectedAnalysis(item)}
          >
            <div className="history-content">
              <span className="history-type">{item.type}</span>
              <span className="history-preview">{item.content}</span>
            </div>
            <div className="history-timestamp">
              {item.timestamp.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="smart-analysis">
      <div className="analysis-header">
        <h2>Smart Analysis & Suggestions</h2>
        <p>AI-powered analysis to improve your requirements and documents</p>
      </div>

      <div className="analysis-layout">
        <div className="analysis-input-section">
          <div className="input-controls">
            <div className="control-group">
              <label>Analysis Type</label>
              <select
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value)}
              >
                <option value="capability">Capability Analysis</option>
                <option value="enabler">Enabler Analysis</option>
                <option value="requirement">Requirement Analysis</option>
                <option value="document">Document Analysis</option>
                <option value="quality">Quality Assessment</option>
              </select>
            </div>

            <div className="control-group">
              <label>Document ID (optional)</label>
              <input
                type="text"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Enter document identifier"
              />
            </div>

            <div className="file-upload">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md,.json"
                style={{ display: 'none' }}
              />
              <button
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload File
              </button>
            </div>
          </div>

          <div className="input-area">
            <label>Content to Analyze</label>
            <textarea
              value={analysisInput}
              onChange={(e) => setAnalysisInput(e.target.value)}
              placeholder="Enter the content you want to analyze..."
              rows="12"
            />
          </div>

          <div className="analyze-controls">
            <button
              className="btn btn-primary btn-large"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !analysisInput.trim()}
            >
              {isAnalyzing ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                'Analyze Content'
              )}
            </button>
          </div>
        </div>

        <div className="analysis-results-section">
          {renderAnalysisResults()}
          {renderSuggestions()}
        </div>
      </div>

      <div className="analysis-sidebar">
        {renderAnalysisHistory()}
      </div>

      <style jsx>{`
        .smart-analysis {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .analysis-header {
          margin-bottom: 30px;
        }

        .analysis-header h2 {
          color: #1f2937;
          margin-bottom: 8px;
        }

        .analysis-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .analysis-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .input-controls {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 16px;
          margin-bottom: 20px;
        }

        .control-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #374151;
        }

        .control-group select,
        .control-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .file-upload {
          display: flex;
          align-items: end;
        }

        .input-area {
          margin-bottom: 20px;
        }

        .input-area label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .input-area textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: monospace;
          resize: vertical;
        }

        .analyze-controls {
          display: flex;
          justify-content: center;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-large {
          padding: 12px 24px;
          font-size: 16px;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .analysis-results {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }

        .analysis-error {
          background: #fee2e2;
          color: #991b1b;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #ef4444;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .results-meta {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #6b7280;
        }

        .results-section {
          margin-bottom: 24px;
        }

        .results-section h4 {
          color: #1f2937;
          margin-bottom: 12px;
        }

        .insights-list {
          list-style: none;
          padding: 0;
        }

        .insight-item {
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 6px;
          border-left: 4px solid #6b7280;
        }

        .insight-item.high {
          border-left-color: #ef4444;
          background: #fef2f2;
        }

        .insight-item.medium {
          border-left-color: #f59e0b;
          background: #fffbeb;
        }

        .insight-item.low {
          border-left-color: #10b981;
          background: #ecfdf5;
        }

        .insight-impact {
          display: block;
          margin-top: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .gaps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .gap-card {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .gap-card h5 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .gap-severity {
          margin-top: 8px;
          font-size: 12px;
        }

        .severity-high {
          color: #ef4444;
          font-weight: 600;
        }

        .severity-medium {
          color: #f59e0b;
          font-weight: 600;
        }

        .severity-low {
          color: #10b981;
          font-weight: 600;
        }

        .quality-metrics {
          space-y: 12px;
        }

        .quality-metric {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .quality-metric span:first-child {
          min-width: 100px;
          font-size: 14px;
          color: #374151;
        }

        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .suggestions-panel {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .suggestions-list {
          space-y: 16px;
        }

        .suggestion-card {
          padding: 16px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          margin-bottom: 16px;
        }

        .suggestion-card.high {
          border-left: 4px solid #ef4444;
        }

        .suggestion-card.medium {
          border-left: 4px solid #f59e0b;
        }

        .suggestion-card.low {
          border-left: 4px solid #10b981;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .suggestion-header h4 {
          margin: 0;
          color: #1f2937;
        }

        .suggestion-type {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .suggestion-description {
          color: #6b7280;
          margin-bottom: 12px;
        }

        .suggestion-content {
          background: #f9fafb;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .suggestion-content code {
          font-family: monospace;
          font-size: 13px;
          color: #374151;
        }

        .suggestion-actions {
          display: flex;
          gap: 8px;
        }

        .analysis-sidebar {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .history-list {
          space-y: 8px;
        }

        .history-item {
          padding: 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 8px;
        }

        .history-item:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .history-item.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .history-content {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .history-type {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          color: #6b7280;
        }

        .history-preview {
          flex: 1;
          font-size: 13px;
          color: #374151;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .history-timestamp {
          font-size: 11px;
          color: #9ca3af;
        }

        @media (max-width: 1024px) {
          .analysis-layout {
            grid-template-columns: 1fr;
          }

          .input-controls {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SmartAnalysis;