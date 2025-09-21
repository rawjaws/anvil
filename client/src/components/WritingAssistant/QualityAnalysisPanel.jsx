/**
 * Quality Analysis Panel - Writing quality analysis and improvement suggestions
 */

import React, { useState } from 'react';
import {
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Zap,
  TrendingUp,
  Eye,
  Clock,
  Award
} from 'lucide-react';
import './QualityAnalysisPanel.css';

const QualityAnalysisPanel = ({
  analysis,
  text,
  onReanalyze,
  onApplyFix,
  isLoading = false
}) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedIssue, setSelectedIssue] = useState(null);

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle size={14} className="severity-high" />;
      case 'medium':
        return <Info size={14} className="severity-medium" />;
      case 'low':
        return <CheckCircle size={14} className="severity-low" />;
      default:
        return <Info size={14} className="severity-default" />;
    }
  };

  // Get quality score color
  const getScoreColor = (score) => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  // Handle auto-fix application
  const handleApplyFix = (fix) => {
    if (onApplyFix) {
      onApplyFix(fix);
    }
  };

  if (isLoading) {
    return (
      <div className="quality-analysis-panel">
        <div className="panel-header">
          <h4>Quality Analysis</h4>
          <button onClick={onReanalyze} className="refresh-btn" disabled>
            <RefreshCw size={14} className="spinning" />
          </button>
        </div>
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Analyzing quality...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="quality-analysis-panel">
        <div className="panel-header">
          <h4>Quality Analysis</h4>
          <button onClick={onReanalyze} className="refresh-btn">
            <RefreshCw size={14} />
          </button>
        </div>
        <div className="empty-state">
          <Target size={24} className="empty-icon" />
          <p>Click refresh to analyze text quality</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quality-analysis-panel">
      <div className="panel-header">
        <h4>Quality Analysis</h4>
        <button onClick={onReanalyze} className="refresh-btn">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Quality Score Overview */}
      <div className="quality-overview">
        <div className={`quality-score ${getScoreColor(analysis.overallScore)}`}>
          <div className="score-circle">
            <span className="score-value">{analysis.overallScore}</span>
            <span className="score-label">Quality Score</span>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="quick-metrics">
          <div className="metric">
            <AlertTriangle size={12} />
            <span>{analysis.issues?.length || 0} Issues</span>
          </div>
          <div className="metric">
            <TrendingUp size={12} />
            <span>{analysis.suggestions?.length || 0} Suggestions</span>
          </div>
          {analysis.autoFixes?.length > 0 && (
            <div className="metric">
              <Zap size={12} />
              <span>{analysis.autoFixes.length} Auto-fixes</span>
            </div>
          )}
        </div>
      </div>

      {/* Section Navigation */}
      <div className="section-nav">
        <button
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <Eye size={12} />
          Overview
        </button>
        <button
          className={`nav-btn ${activeSection === 'issues' ? 'active' : ''}`}
          onClick={() => setActiveSection('issues')}
        >
          <AlertTriangle size={12} />
          Issues
        </button>
        <button
          className={`nav-btn ${activeSection === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveSection('suggestions')}
        >
          <TrendingUp size={12} />
          Improvements
        </button>
        <button
          className={`nav-btn ${activeSection === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveSection('metrics')}
        >
          <Award size={12} />
          Metrics
        </button>
      </div>

      {/* Section Content */}
      <div className="section-content">
        {activeSection === 'overview' && (
          <div className="overview-section">
            {/* Quality Breakdown */}
            {analysis.metrics && (
              <div className="quality-breakdown">
                <h5>Quality Breakdown</h5>
                {Object.entries(analysis.metrics).map(([key, value]) => (
                  <div key={key} className="breakdown-item">
                    <span className="metric-name">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                    <div className="metric-bar">
                      <div
                        className={`metric-fill ${getScoreColor(value)}`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="metric-value">{value}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            {analysis.autoFixes?.length > 0 && (
              <div className="quick-actions">
                <h5>Quick Fixes Available</h5>
                {analysis.autoFixes.slice(0, 3).map((fix, index) => (
                  <div key={index} className="quick-fix">
                    <div className="fix-info">
                      <Zap size={12} />
                      <span>{fix.type.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="confidence">
                        {Math.round(fix.confidence * 100)}% confident
                      </span>
                    </div>
                    <button
                      className="apply-fix-btn"
                      onClick={() => handleApplyFix(fix)}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div className="recommendations">
                <h5>Top Recommendations</h5>
                {analysis.recommendations.slice(0, 2).map((rec, index) => (
                  <div key={index} className="recommendation">
                    <div className="rec-header">
                      <strong>{rec.title}</strong>
                      {rec.actionRequired && (
                        <span className="action-required">Action Required</span>
                      )}
                    </div>
                    <p>{rec.description}</p>
                    {rec.items?.length > 0 && (
                      <ul>
                        {rec.items.slice(0, 2).map((item, i) => (
                          <li key={i}>{item.message || item.description}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSection === 'issues' && (
          <div className="issues-section">
            {analysis.issues?.length > 0 ? (
              <div className="issues-list">
                {analysis.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`issue-item ${selectedIssue === index ? 'selected' : ''}`}
                    onClick={() => setSelectedIssue(selectedIssue === index ? null : index)}
                  >
                    <div className="issue-header">
                      {getSeverityIcon(issue.severity)}
                      <span className="issue-message">{issue.message}</span>
                      {issue.autoFixable && (
                        <span className="auto-fixable">Auto-fixable</span>
                      )}
                    </div>

                    {selectedIssue === index && (
                      <div className="issue-details">
                        {issue.suggestion && (
                          <div className="suggestion">
                            <strong>Suggestion:</strong> {issue.suggestion}
                          </div>
                        )}

                        {issue.match && (
                          <div className="match">
                            <strong>Found:</strong>
                            <code>{issue.match}</code>
                          </div>
                        )}

                        {issue.position !== undefined && (
                          <div className="position">
                            <strong>Position:</strong> Character {issue.position}
                          </div>
                        )}

                        <div className="issue-meta">
                          <span className="category">Category: {issue.category}</span>
                          <span className="type">Type: {issue.type}</span>
                        </div>

                        {issue.autoFixable && (
                          <button
                            className="auto-fix-btn"
                            onClick={() => handleApplyFix({
                              type: issue.type,
                              original: issue.match,
                              confidence: 0.8
                            })}
                          >
                            <Zap size={12} />
                            Apply Auto-fix
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-issues">
                <CheckCircle size={24} className="success-icon" />
                <p>No issues found! Your writing quality looks good.</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'suggestions' && (
          <div className="suggestions-section">
            {analysis.suggestions?.length > 0 ? (
              <div className="suggestions-list">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="suggestion-item">
                    <div className="suggestion-header">
                      <TrendingUp size={14} />
                      <span className="suggestion-message">{suggestion.message}</span>
                      {suggestion.confidence && (
                        <span className="confidence">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    {suggestion.originalIssue && (
                      <div className="suggestion-context">
                        Related to: {suggestion.originalIssue.message}
                      </div>
                    )}

                    <div className="suggestion-meta">
                      <span className="category">Category: {suggestion.category}</span>
                      <span className="type">Type: {suggestion.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-suggestions">
                <Award size={24} className="award-icon" />
                <p>Great job! No improvement suggestions at this time.</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'metrics' && (
          <div className="metrics-section">
            {/* NLP Analysis Metrics */}
            {analysis.nlpAnalysis && (
              <div className="nlp-metrics">
                <h5>Language Analysis</h5>
                <div className="metrics-grid">
                  {Object.entries(analysis.nlpAnalysis.quality || {}).map(([key, data]) => (
                    <div key={key} className="metric-card">
                      <div className="metric-header">
                        <span className="metric-name">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </span>
                        <span className={`metric-score ${getScoreColor(data.score || 0)}`}>
                          {data.score || 0}%
                        </span>
                      </div>
                      {data.issues?.length > 0 && (
                        <div className="metric-issues">
                          <small>{data.issues.length} issues found</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Writing Analysis Metrics */}
            {analysis.writingAnalysis && (
              <div className="writing-metrics">
                <h5>Writing Statistics</h5>
                <div className="stats-grid">
                  <div className="stat">
                    <Clock size={12} />
                    <span>{analysis.writingAnalysis.wordCount} words</span>
                  </div>
                  <div className="stat">
                    <Eye size={12} />
                    <span>{analysis.writingAnalysis.sentenceCount} sentences</span>
                  </div>
                  <div className="stat">
                    <Target size={12} />
                    <span>
                      {analysis.writingAnalysis.averageWordsPerSentence?.toFixed(1)} avg words/sentence
                    </span>
                  </div>
                  <div className="stat">
                    <Award size={12} />
                    <span>
                      {analysis.writingAnalysis.readability?.level || 'N/A'} readability
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Time */}
            {analysis.processingTime && (
              <div className="processing-info">
                <small>
                  Analysis completed in {analysis.processingTime}ms
                </small>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityAnalysisPanel;