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

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Brain,
  Target,
  Users,
  Calendar,
  Activity,
  Zap,
  Shield
} from 'lucide-react';
import apiService from '../services/apiService';
import './IntelligenceDashboard.css';

const IntelligenceDashboard = () => {
  const [intelligence, setIntelligence] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadIntelligenceData();
    const interval = setInterval(loadMetrics, 30000); // Update metrics every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadIntelligenceData = async () => {
    try {
      setLoading(true);
      // Create mock data for now since the intelligence endpoints don't exist yet
      const mockIntelligence = {
        health: {
          overall: 85,
          capabilities: { total: 12, approved: 8, inProgress: 3, blocked: 1 },
          enablers: { total: 24, implemented: 18, inProgress: 4, notStarted: 2 },
          requirements: { total: 36, implemented: 28, inProgress: 6, approved: 2 },
          timeline: { averageAge: 14, recentActivity: 12, staleDocuments: 3 }
        },
        summary: {
          totalDocuments: 36,
          completionEstimate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          riskLevel: 2
        },
        documents: { capabilities: 12, enablers: 24 },
        forecast: {
          estimatedCompletion: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          confidence: 78,
          riskFactors: [
            {
              type: 'dependency_bottleneck',
              severity: 'medium',
              description: 'Some enablers are blocking multiple capabilities',
              impact: 'Could delay completion by 1-2 weeks'
            }
          ],
          recommendations: [
            {
              action: 'Prioritize blocked enablers',
              priority: 'high',
              impact: 'Reduce completion time by 1 week'
            }
          ]
        },
        patterns: {
          developmentVelocity: {
            trend: 'stable',
            weeklyAverage: 3.2,
            anomalies: []
          },
          qualityIndicators: {
            requirementCompleteness: 85,
            documentationQuality: 92
          }
        },
        recommendations: [
          {
            priority: 'high',
            title: 'Address Dependency Bottlenecks',
            description: 'Several capabilities are waiting on enabler implementation',
            actions: [
              'Prioritize blocked enablers in next sprint',
              'Consider parallel development where possible',
              'Review dependency mapping for optimization opportunities'
            ],
            impact: 'Could reduce overall timeline by 2-3 weeks'
          }
        ]
      };

      const mockMetrics = {
        activeUsers: 5,
        documentsModified: 8,
        averageResponseTime: 120
      };

      setIntelligence(mockIntelligence);
      setMetrics(mockMetrics);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error loading intelligence data:', err);
      setError('Failed to load project intelligence data');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      // Mock metrics data for now
      const mockMetrics = {
        activeUsers: Math.floor(Math.random() * 10) + 3,
        documentsModified: Math.floor(Math.random() * 15) + 5,
        averageResponseTime: Math.floor(Math.random() * 200) + 80
      };
      setMetrics(mockMetrics);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  };

  const refreshData = async () => {
    // Clear any cache and reload data
    await loadIntelligenceData();
  };

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getRiskLevel = (level) => {
    const levels = { 1: 'Low', 2: 'Medium', 3: 'High' };
    return levels[level] || 'Unknown';
  };

  const getRiskColor = (level) => {
    const colors = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
    return colors[level] || '#6b7280';
  };

  if (loading && !intelligence) {
    return (
      <div className="intelligence-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="animate-spin" size={32} />
          <p>Loading project intelligence...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="intelligence-dashboard error">
        <div className="error-message">
          <AlertTriangle size={24} />
          <h3>Unable to Load Intelligence Data</h3>
          <p>{error}</p>
          <button onClick={loadIntelligenceData} className="retry-button">
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="intelligence-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <Brain size={28} />
            Project Intelligence
          </h1>
          <div className="header-actions">
            <span className="last-updated">
              Last updated: {lastUpdated?.toLocaleTimeString()}
            </span>
            <button
              onClick={refreshData}
              className="refresh-button"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Target size={16} />
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            <Activity size={16} />
            Health
          </button>
          <button
            className={`tab ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            <Calendar size={16} />
            Forecast
          </button>
          <button
            className={`tab ${activeTab === 'patterns' ? 'active' : ''}`}
            onClick={() => setActiveTab('patterns')}
          >
            <BarChart3 size={16} />
            Patterns
          </button>
          <button
            className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <Zap size={16} />
            Recommendations
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab intelligence={intelligence} metrics={metrics} />
        )}
        {activeTab === 'health' && (
          <HealthTab health={intelligence?.health} />
        )}
        {activeTab === 'forecast' && (
          <ForecastTab forecast={intelligence?.forecast} />
        )}
        {activeTab === 'patterns' && (
          <PatternsTab patterns={intelligence?.patterns} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsTab recommendations={intelligence?.recommendations} />
        )}
      </div>
    </div>
  );
};

const OverviewTab = ({ intelligence, metrics }) => {
  if (!intelligence || !metrics) return <div>Loading overview...</div>;

  const health = intelligence.health;
  const summary = intelligence.summary;

  return (
    <div className="overview-tab">
      <div className="overview-cards">
        <div className="metric-card primary">
          <div className="card-header">
            <Shield size={24} />
            <h3>Project Health</h3>
          </div>
          <div className="card-value">
            <span
              className="health-score"
              style={{ color: getHealthColor(health.overall) }}
            >
              {health.overall}%
            </span>
          </div>
          <div className="card-subtitle">Overall health score</div>
        </div>

        <div className="metric-card">
          <div className="card-header">
            <Users size={20} />
            <h4>Total Documents</h4>
          </div>
          <div className="card-value">{summary.totalDocuments}</div>
          <div className="card-breakdown">
            <span>{intelligence.documents.capabilities} capabilities</span>
            <span>{intelligence.documents.enablers} enablers</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="card-header">
            <CheckCircle size={20} />
            <h4>Implementation Progress</h4>
          </div>
          <div className="card-value">
            {Math.round((health.enablers.implemented / health.enablers.total) * 100)}%
          </div>
          <div className="card-breakdown">
            <span>{health.enablers.implemented} of {health.enablers.total} enablers</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="card-header">
            <Calendar size={20} />
            <h4>Completion Estimate</h4>
          </div>
          <div className="card-value">
            {summary.completionEstimate ?
              new Date(summary.completionEstimate).toLocaleDateString() :
              'TBD'
            }
          </div>
          <div className="card-breakdown">
            <span>Risk: {getRiskLevel(summary.riskLevel)}</span>
          </div>
        </div>
      </div>

      <div className="overview-charts">
        <div className="chart-container">
          <h3>Capability Status Distribution</h3>
          <div className="status-chart">
            <div className="status-item">
              <div className="status-bar">
                <div
                  className="status-fill approved"
                  style={{
                    width: `${(health.capabilities.approved / health.capabilities.total) * 100}%`
                  }}
                ></div>
              </div>
              <span>Approved: {health.capabilities.approved}</span>
            </div>
            <div className="status-item">
              <div className="status-bar">
                <div
                  className="status-fill in-progress"
                  style={{
                    width: `${(health.capabilities.inProgress / health.capabilities.total) * 100}%`
                  }}
                ></div>
              </div>
              <span>In Progress: {health.capabilities.inProgress}</span>
            </div>
            <div className="status-item">
              <div className="status-bar">
                <div
                  className="status-fill blocked"
                  style={{
                    width: `${(health.capabilities.blocked / health.capabilities.total) * 100}%`
                  }}
                ></div>
              </div>
              <span>Blocked: {health.capabilities.blocked}</span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h3>Enabler Implementation Status</h3>
          <div className="status-chart">
            <div className="status-item">
              <div className="status-bar">
                <div
                  className="status-fill implemented"
                  style={{
                    width: `${(health.enablers.implemented / health.enablers.total) * 100}%`
                  }}
                ></div>
              </div>
              <span>Implemented: {health.enablers.implemented}</span>
            </div>
            <div className="status-item">
              <div className="status-bar">
                <div
                  className="status-fill in-progress"
                  style={{
                    width: `${(health.enablers.inProgress / health.enablers.total) * 100}%`
                  }}
                ></div>
              </div>
              <span>In Progress: {health.enablers.inProgress}</span>
            </div>
            <div className="status-item">
              <div className="status-bar">
                <div
                  className="status-fill not-started"
                  style={{
                    width: `${(health.enablers.notStarted / health.enablers.total) * 100}%`
                  }}
                ></div>
              </div>
              <span>Not Started: {health.enablers.notStarted}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HealthTab = ({ health }) => {
  if (!health) return <div>Loading health data...</div>;

  return (
    <div className="health-tab">
      <div className="health-summary">
        <div className="health-score-display">
          <div
            className="health-circle"
            style={{ '--health-color': getHealthColor(health.overall) }}
          >
            <span className="health-percentage">{health.overall}%</span>
            <span className="health-label">Overall Health</span>
          </div>
        </div>

        <div className="health-breakdown">
          <div className="health-category">
            <h4>Capabilities</h4>
            <div className="category-metrics">
              <div className="metric">
                <span className="metric-label">Total</span>
                <span className="metric-value">{health.capabilities.total}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Approved</span>
                <span className="metric-value approved">{health.capabilities.approved}</span>
              </div>
              <div className="metric">
                <span className="metric-label">In Progress</span>
                <span className="metric-value in-progress">{health.capabilities.inProgress}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Blocked</span>
                <span className="metric-value blocked">{health.capabilities.blocked}</span>
              </div>
            </div>
          </div>

          <div className="health-category">
            <h4>Enablers</h4>
            <div className="category-metrics">
              <div className="metric">
                <span className="metric-label">Total</span>
                <span className="metric-value">{health.enablers.total}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Implemented</span>
                <span className="metric-value implemented">{health.enablers.implemented}</span>
              </div>
              <div className="metric">
                <span className="metric-label">In Progress</span>
                <span className="metric-value in-progress">{health.enablers.inProgress}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Not Started</span>
                <span className="metric-value not-started">{health.enablers.notStarted}</span>
              </div>
            </div>
          </div>

          <div className="health-category">
            <h4>Requirements</h4>
            <div className="category-metrics">
              <div className="metric">
                <span className="metric-label">Total</span>
                <span className="metric-value">{health.requirements.total}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Implemented</span>
                <span className="metric-value implemented">{health.requirements.implemented}</span>
              </div>
              <div className="metric">
                <span className="metric-label">In Progress</span>
                <span className="metric-value in-progress">{health.requirements.inProgress}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Approved</span>
                <span className="metric-value approved">{health.requirements.approved}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="timeline-health">
        <h3>Timeline Health</h3>
        <div className="timeline-metrics">
          <div className="timeline-metric">
            <Clock size={20} />
            <div className="metric-info">
              <span className="metric-label">Average Document Age</span>
              <span className="metric-value">{health.timeline.averageAge} days</span>
            </div>
          </div>
          <div className="timeline-metric">
            <TrendingUp size={20} />
            <div className="metric-info">
              <span className="metric-label">Recent Activity</span>
              <span className="metric-value">{health.timeline.recentActivity} updates</span>
            </div>
          </div>
          <div className="timeline-metric">
            <AlertTriangle size={20} />
            <div className="metric-info">
              <span className="metric-label">Stale Documents</span>
              <span className="metric-value">{health.timeline.staleDocuments} documents</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ForecastTab = ({ forecast }) => {
  if (!forecast) return <div>Loading forecast data...</div>;

  return (
    <div className="forecast-tab">
      <div className="forecast-summary">
        <div className="forecast-card">
          <h3>Estimated Completion</h3>
          <div className="completion-date">
            {forecast.estimatedCompletion ?
              new Date(forecast.estimatedCompletion).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) :
              'Insufficient data for prediction'
            }
          </div>
          <div className="confidence-level">
            Confidence: {forecast.confidence}%
          </div>
        </div>
      </div>

      {forecast.riskFactors.length > 0 && (
        <div className="risk-factors">
          <h3>Risk Factors</h3>
          <div className="risk-list">
            {forecast.riskFactors.map((risk, index) => (
              <div key={index} className={`risk-item ${risk.severity}`}>
                <div className="risk-header">
                  <AlertTriangle size={16} />
                  <span className="risk-type">{risk.type.replace('_', ' ')}</span>
                  <span className={`risk-severity ${risk.severity}`}>
                    {risk.severity} risk
                  </span>
                </div>
                <div className="risk-description">{risk.description}</div>
                <div className="risk-impact">Impact: {risk.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {forecast.recommendations.length > 0 && (
        <div className="forecast-recommendations">
          <h3>Timeline Recommendations</h3>
          <div className="recommendation-list">
            {forecast.recommendations.map((rec, index) => (
              <div key={index} className={`recommendation-item ${rec.priority}`}>
                <div className="recommendation-header">
                  <Zap size={16} />
                  <span className="recommendation-action">{rec.action}</span>
                </div>
                <div className="recommendation-impact">{rec.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PatternsTab = ({ patterns }) => {
  if (!patterns) return <div>Loading patterns data...</div>;

  return (
    <div className="patterns-tab">
      <div className="pattern-section">
        <h3>Development Velocity</h3>
        <div className="velocity-info">
          <div className="velocity-metric">
            <span className="metric-label">Trend</span>
            <span className={`metric-value trend-${patterns.developmentVelocity.trend}`}>
              {patterns.developmentVelocity.trend}
            </span>
          </div>
          <div className="velocity-metric">
            <span className="metric-label">Weekly Average</span>
            <span className="metric-value">
              {patterns.developmentVelocity.weeklyAverage.toFixed(1)} items
            </span>
          </div>
        </div>

        {patterns.developmentVelocity.anomalies.length > 0 && (
          <div className="velocity-anomalies">
            <h4>Velocity Anomalies</h4>
            {patterns.developmentVelocity.anomalies.map((anomaly, index) => (
              <div key={index} className="anomaly-item">
                <span>Week {anomaly.week}:</span>
                <span>Expected {anomaly.expected}, Actual {anomaly.actual}</span>
                <span className={anomaly.deviation > 0 ? 'positive' : 'negative'}>
                  ({anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pattern-section">
        <h3>Quality Indicators</h3>
        <div className="quality-metrics">
          <div className="quality-metric">
            <span className="metric-label">Requirement Completeness</span>
            <div className="metric-bar">
              <div
                className="metric-fill"
                style={{
                  width: `${patterns.qualityIndicators.requirementCompleteness}%`
                }}
              ></div>
            </div>
            <span className="metric-value">
              {patterns.qualityIndicators.requirementCompleteness}%
            </span>
          </div>
          <div className="quality-metric">
            <span className="metric-label">Documentation Quality</span>
            <div className="metric-bar">
              <div
                className="metric-fill"
                style={{
                  width: `${patterns.qualityIndicators.documentationQuality}%`
                }}
              ></div>
            </div>
            <span className="metric-value">
              {patterns.qualityIndicators.documentationQuality}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecommendationsTab = ({ recommendations }) => {
  if (!recommendations) return <div>Loading recommendations...</div>;

  if (recommendations.length === 0) {
    return (
      <div className="recommendations-tab">
        <div className="no-recommendations">
          <CheckCircle size={48} />
          <h3>All Good!</h3>
          <p>No specific recommendations at this time. Your project appears to be on track.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-tab">
      <div className="recommendations-list">
        {recommendations.map((rec, index) => (
          <div key={index} className={`recommendation-card ${rec.priority}`}>
            <div className="recommendation-header">
              <div className="recommendation-priority">
                <span className={`priority-badge ${rec.priority}`}>
                  {rec.priority}
                </span>
              </div>
              <h3>{rec.title}</h3>
            </div>
            <div className="recommendation-description">
              {rec.description}
            </div>
            <div className="recommendation-actions">
              <h4>Recommended Actions:</h4>
              <ul>
                {rec.actions.map((action, actionIndex) => (
                  <li key={actionIndex}>{action}</li>
                ))}
              </ul>
            </div>
            <div className="recommendation-impact">
              <strong>Expected Impact:</strong> {rec.impact}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntelligenceDashboard;