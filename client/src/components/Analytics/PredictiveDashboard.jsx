/**
 * Predictive Analytics Dashboard
 * Advanced ML-based insights and predictions interface
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  Users
} from 'lucide-react';

// Prediction confidence indicator
function ConfidenceIndicator({ confidence, size = 'sm' }) {
  const getColor = (conf) => {
    if (conf >= 85) return '#10b981'; // green
    if (conf >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getLabel = (conf) => {
    if (conf >= 85) return 'High';
    if (conf >= 70) return 'Medium';
    return 'Low';
  };

  return (
    <div className={`confidence-indicator ${size}`}>
      <div
        className="confidence-bar"
        style={{
          width: `${confidence}%`,
          backgroundColor: getColor(confidence)
        }}
      />
      <span className="confidence-label">
        {confidence}% {getLabel(confidence)}
      </span>
    </div>
  );
}

// Quality prediction card
function QualityPredictionCard({ prediction, project }) {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="trend-icon improving" />;
      case 'declining': return <TrendingDown className="trend-icon declining" />;
      default: return <Activity className="trend-icon stable" />;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'excellent';
    if (score >= 0.6) return 'good';
    if (score >= 0.4) return 'fair';
    return 'poor';
  };

  return (
    <div className="prediction-card quality">
      <div className="card-header">
        <div className="card-title">
          <Target className="card-icon" />
          <h3>Quality Prediction</h3>
        </div>
        {getTrendIcon(prediction.trend)}
      </div>

      <div className="prediction-score">
        <div className={`score-display ${getScoreColor(prediction.score)}`}>
          {Math.round(prediction.score * 100)}%
        </div>
        <ConfidenceIndicator confidence={prediction.confidence} />
      </div>

      <div className="prediction-factors">
        <h4>Key Factors</h4>
        <div className="factors-list">
          {prediction.factors.slice(0, 3).map((factor, index) => (
            <div key={index} className="factor-item">
              <span className="factor-name">{factor.factor.replace(/_/g, ' ')}</span>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{
                    width: `${Math.abs(factor.impact) * 100}%`,
                    backgroundColor: factor.impact > 0 ? '#10b981' : '#ef4444'
                  }}
                />
              </div>
              <span className="factor-impact">
                {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {prediction.recommendations && prediction.recommendations.length > 0 && (
        <div className="prediction-recommendations">
          <h4>Recommendations</h4>
          <div className="recommendations-list">
            {prediction.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className={`recommendation-item ${rec.priority}`}>
                <div className="recommendation-header">
                  <span className="recommendation-action">{rec.action}</span>
                  <span className={`priority-badge ${rec.priority}`}>{rec.priority}</span>
                </div>
                <p className="recommendation-description">{rec.description}</p>
                <span className="recommendation-impact">{rec.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Completion prediction card
function CompletionPredictionCard({ prediction, project }) {
  const getCompletionStatus = (probability) => {
    if (probability >= 0.8) return { status: 'on-track', color: '#10b981' };
    if (probability >= 0.6) return { status: 'at-risk', color: '#f59e0b' };
    return { status: 'high-risk', color: '#ef4444' };
  };

  const status = getCompletionStatus(prediction.probability);

  const formatDate = (date) => {
    if (!date) return 'TBD';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="prediction-card completion">
      <div className="card-header">
        <div className="card-title">
          <Clock className="card-icon" />
          <h3>Completion Prediction</h3>
        </div>
        <div className={`status-badge ${status.status}`}>
          {status.status.replace('-', ' ')}
        </div>
      </div>

      <div className="prediction-score">
        <div className="probability-display">
          <div className="probability-circle">
            <svg viewBox="0 0 100 100" className="probability-svg">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={status.color}
                strokeWidth="8"
                strokeDasharray={`${prediction.probability * 283} 283`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="probability-text">
              {Math.round(prediction.probability * 100)}%
            </div>
          </div>
        </div>
        <ConfidenceIndicator confidence={prediction.confidence} />
      </div>

      <div className="completion-details">
        <div className="detail-item">
          <span className="detail-label">Estimated Completion</span>
          <span className="detail-value">{formatDate(prediction.estimatedCompletion)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Original Target</span>
          <span className="detail-value">{formatDate(project.plannedEndDate)}</span>
        </div>
      </div>

      {prediction.factors && (
        <div className="completion-factors">
          <h4>Impact Factors</h4>
          <div className="factors-grid">
            {prediction.factors.slice(0, 4).map((factor, index) => (
              <div key={index} className="factor-chip">
                <span className="factor-name">{factor.factor.replace(/_/g, ' ')}</span>
                <span className={`factor-value ${factor.impact > 0 ? 'positive' : 'negative'}`}>
                  {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Risk assessment card
function RiskAssessmentCard({ assessment, project }) {
  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'low': return <CheckCircle className="risk-icon low" />;
      case 'medium': return <AlertTriangle className="risk-icon medium" />;
      case 'high': return <AlertTriangle className="risk-icon high" />;
      case 'critical': return <AlertTriangle className="risk-icon critical" />;
      default: return <AlertTriangle className="risk-icon" />;
    }
  };

  return (
    <div className={`prediction-card risk ${assessment.level}`}>
      <div className="card-header">
        <div className="card-title">
          <AlertTriangle className="card-icon" />
          <h3>Risk Assessment</h3>
        </div>
        {getRiskIcon(assessment.level)}
      </div>

      <div className="risk-score">
        <div className="risk-level">
          <span className="risk-label">{assessment.level.toUpperCase()}</span>
          <span className="risk-percentage">{Math.round(assessment.score * 100)}%</span>
        </div>
        <div
          className="risk-bar"
          style={{ backgroundColor: getRiskColor(assessment.level) }}
        >
          <div
            className="risk-fill"
            style={{ width: `${assessment.score * 100}%` }}
          />
        </div>
        <ConfidenceIndicator confidence={assessment.confidence} />
      </div>

      {assessment.alerts && assessment.alerts.length > 0 && (
        <div className="risk-alerts">
          {assessment.alerts.map((alert, index) => (
            <div key={index} className={`alert-item ${alert.level}`}>
              <AlertTriangle className="alert-icon" />
              <div className="alert-content">
                <span className="alert-message">{alert.message}</span>
                <span className="alert-action">{alert.action}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {assessment.mitigationStrategies && assessment.mitigationStrategies.length > 0 && (
        <div className="mitigation-strategies">
          <h4>Mitigation Strategies</h4>
          <div className="strategies-list">
            {assessment.mitigationStrategies.slice(0, 3).map((strategy, index) => (
              <div key={index} className="strategy-item">
                <div className="strategy-header">
                  <span className="strategy-risk">{strategy.risk}</span>
                  <span className="strategy-timeline">{strategy.timeline}</span>
                </div>
                <p className="strategy-description">{strategy.strategy}</p>
                <span className="strategy-owner">Owner: {strategy.owner}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Overall health indicator
function OverallHealthIndicator({ health }) {
  const getHealthColor = (status) => {
    switch (status) {
      case 'excellent': return '#10b981';
      case 'good': return '#22c55e';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="health-icon excellent" />;
      case 'good': return <CheckCircle className="health-icon good" />;
      case 'fair': return <AlertTriangle className="health-icon fair" />;
      case 'poor': return <AlertTriangle className="health-icon poor" />;
      default: return <Activity className="health-icon" />;
    }
  };

  return (
    <div className="overall-health">
      <div className="health-header">
        <h2>Project Health</h2>
        <div className="health-score">
          {getHealthIcon(health.status)}
          <span className={`health-status ${health.status}`}>
            {health.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="health-score-circle">
        <svg viewBox="0 0 120 120" className="health-svg">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={getHealthColor(health.status)}
            strokeWidth="10"
            strokeDasharray={`${health.score * 314} 314`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="health-percentage">
          {Math.round(health.score * 100)}%
        </div>
      </div>

      <div className="health-indicators">
        <div className={`indicator-item ${health.indicators.quality}`}>
          <Target className="indicator-icon" />
          <span>Quality</span>
        </div>
        <div className={`indicator-item ${health.indicators.delivery}`}>
          <Clock className="indicator-icon" />
          <span>Delivery</span>
        </div>
        <div className={`indicator-item ${health.indicators.risk}`}>
          <AlertTriangle className="indicator-icon" />
          <span>Risk</span>
        </div>
      </div>
    </div>
  );
}

// Action items panel
function ActionItemsPanel({ actionItems }) {
  const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedItems = actionItems
    .sort((a, b) => (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0))
    .slice(0, 5);

  return (
    <div className="action-items-panel">
      <h3>Recommended Actions</h3>
      <div className="action-items-list">
        {sortedItems.map((item, index) => (
          <div key={index} className={`action-item ${item.priority} ${item.category}`}>
            <div className="action-header">
              <span className={`priority-badge ${item.priority}`}>
                {item.priority}
              </span>
              <span className={`category-badge ${item.category}`}>
                {item.category}
              </span>
            </div>
            <div className="action-content">
              <h4 className="action-title">{item.action}</h4>
              <p className="action-description">{item.description}</p>
              {item.impact && (
                <span className="action-impact">{item.impact}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main PredictiveDashboard component
export default function PredictiveDashboard({ projectId, realTimeData }) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  // Mock project data - in production, this would come from props or context
  const mockProject = {
    id: projectId || 'project_1',
    name: 'Advanced Analytics Implementation',
    plannedEndDate: '2024-12-31',
    progress: 0.65,
    team: [
      { id: 1, name: 'Alice', experience: 8 },
      { id: 2, name: 'Bob', experience: 5 },
      { id: 3, name: 'Carol', experience: 6 }
    ],
    totalEnablers: 12,
    dependencies: ['auth-service', 'data-pipeline'],
    sprintVelocities: [8, 12, 10, 14, 11]
  };

  // Mock prediction data - in production, this would come from API
  const mockPredictions = useMemo(() => ({
    quality: {
      score: 0.87,
      confidence: 89,
      trend: 'improving',
      factors: [
        { factor: 'test_coverage', value: 0.85, weight: 0.3, impact: 0.25 },
        { factor: 'code_review_frequency', value: 0.9, weight: 0.15, impact: 0.14 },
        { factor: 'team_experience', value: 0.8, weight: 0.4, impact: 0.32 }
      ],
      recommendations: [
        {
          priority: 'medium',
          action: 'Increase integration test coverage',
          description: 'Add more end-to-end test scenarios',
          impact: 'Improve quality prediction by 10-15%'
        }
      ]
    },
    completion: {
      probability: 0.82,
      confidence: 85,
      estimatedCompletion: '2024-12-28',
      factors: [
        { factor: 'velocity_trend', value: 0.8, weight: 0.4, impact: 0.32 },
        { factor: 'blockers_count', value: 0.1, weight: -0.35, impact: -0.035 },
        { factor: 'resource_availability', value: 0.9, weight: 0.3, impact: 0.27 }
      ],
      recommendations: [
        {
          priority: 'low',
          action: 'Monitor velocity trends',
          description: 'Continue current sprint practices',
          impact: 'Maintain delivery confidence'
        }
      ]
    },
    risk: {
      score: 0.25,
      level: 'low',
      confidence: 92,
      factors: [
        { factor: 'technical_complexity', value: 0.6, weight: 0.3, impact: 0.18 },
        { factor: 'team_turnover', value: 0.1, weight: 0.35, impact: 0.035 },
        { factor: 'external_dependencies', value: 0.3, weight: 0.25, impact: 0.075 }
      ],
      alerts: [],
      mitigationStrategies: [
        {
          risk: 'Technical complexity',
          strategy: 'Implement gradual rollout strategy',
          timeline: '2 weeks',
          owner: 'Tech Lead'
        }
      ]
    }
  }), []);

  const overallHealth = useMemo(() => ({
    score: 0.84,
    status: 'good',
    indicators: {
      quality: 'good',
      delivery: 'on-track',
      risk: 'low'
    }
  }), []);

  const actionItems = useMemo(() => [
    {
      priority: 'medium',
      category: 'quality',
      action: 'Increase integration test coverage',
      description: 'Add more end-to-end test scenarios',
      impact: 'Improve quality prediction by 10-15%'
    },
    {
      priority: 'high',
      category: 'risk',
      action: 'Implement gradual rollout strategy',
      description: 'Reduce technical complexity risks',
      impact: 'Lower deployment risks by 30%'
    },
    {
      priority: 'low',
      category: 'delivery',
      action: 'Monitor velocity trends',
      description: 'Continue current sprint practices',
      impact: 'Maintain delivery confidence'
    }
  ], []);

  useEffect(() => {
    const loadPredictions = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setPredictions(mockPredictions);
        setError(null);
      } catch (err) {
        setError('Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    loadPredictions();

    // Set up refresh interval
    const interval = setInterval(loadPredictions, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, mockPredictions]);

  if (loading) {
    return (
      <div className="predictive-dashboard loading">
        <div className="loading-spinner">
          <Brain className="spinner-icon" />
          <span>Analyzing predictions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="predictive-dashboard error">
        <div className="error-message">
          <AlertTriangle className="error-icon" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="predictive-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <Brain className="header-icon" />
          <h1>Predictive Analytics Dashboard</h1>
        </div>
        <div className="header-meta">
          <div className="real-time-indicator">
            <Zap className="real-time-icon" />
            <span>Real-time</span>
          </div>
          <span className="last-updated">
            Updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="main-predictions">
          <QualityPredictionCard
            prediction={predictions.quality}
            project={mockProject}
          />
          <CompletionPredictionCard
            prediction={predictions.completion}
            project={mockProject}
          />
          <RiskAssessmentCard
            assessment={predictions.risk}
            project={mockProject}
          />
        </div>

        <div className="dashboard-sidebar">
          <OverallHealthIndicator health={overallHealth} />
          <ActionItemsPanel actionItems={actionItems} />
        </div>
      </div>
    </div>
  );
}