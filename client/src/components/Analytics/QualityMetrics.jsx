/**
 * Quality Metrics Dashboard
 * Comprehensive quality analysis and trend monitoring
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  FileText,
  Bug,
  Code,
  TestTube,
  GitBranch,
  Activity,
  Zap
} from 'lucide-react';

// Quality score indicator
function QualityScoreIndicator({ score, label, target = 0.8 }) {
  const getScoreColor = (s) => {
    if (s >= target) return '#10b981';
    if (s >= target * 0.8) return '#f59e0b';
    return '#ef4444';
  };

  const getScoreIcon = (s) => {
    if (s >= target) return <CheckCircle className="score-icon success" />;
    if (s >= target * 0.8) return <AlertTriangle className="score-icon warning" />;
    return <XCircle className="score-icon error" />;
  };

  return (
    <div className="quality-score-indicator">
      <div className="score-header">
        {getScoreIcon(score)}
        <span className="score-label">{label}</span>
      </div>
      <div className="score-value" style={{ color: getScoreColor(score) }}>
        {Math.round(score * 100)}%
      </div>
      <div className="score-bar">
        <div
          className="score-fill"
          style={{
            width: `${score * 100}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
        <div
          className="score-target"
          style={{ left: `${target * 100}%` }}
        />
      </div>
    </div>
  );
}

// Code quality metrics
function CodeQualityMetrics({ codeMetrics }) {
  const metrics = [
    {
      label: 'Test Coverage',
      value: codeMetrics.testCoverage,
      target: 0.8,
      icon: TestTube,
      trend: codeMetrics.testCoverageTrend
    },
    {
      label: 'Code Review Coverage',
      value: codeMetrics.codeReviewCoverage,
      target: 0.95,
      icon: Eye,
      trend: codeMetrics.codeReviewTrend
    },
    {
      label: 'Technical Debt Ratio',
      value: 1 - codeMetrics.technicalDebt, // Inverse for display
      target: 0.8,
      icon: Code,
      trend: codeMetrics.technicalDebtTrend === 'improving' ? 'declining' : 'improving', // Inverse
      inverted: true
    },
    {
      label: 'Documentation Coverage',
      value: codeMetrics.documentationCoverage,
      target: 0.7,
      icon: FileText,
      trend: codeMetrics.documentationTrend
    }
  ];

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="trend-icon improving" />;
      case 'declining': return <TrendingDown className="trend-icon declining" />;
      default: return <Activity className="trend-icon stable" />;
    }
  };

  return (
    <div className="code-quality-metrics">
      <div className="metrics-header">
        <h3>Code Quality</h3>
        <Code className="header-icon" />
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => {
          const MetricIcon = metric.icon;
          return (
            <div key={index} className="metric-card">
              <div className="metric-header">
                <MetricIcon className="metric-icon" />
                <span className="metric-label">{metric.label}</span>
                {getTrendIcon(metric.trend)}
              </div>

              <div className="metric-value">
                <span className="value-number">
                  {Math.round(metric.value * 100)}%
                </span>
                <span className="value-target">
                  Target: {Math.round(metric.target * 100)}%
                </span>
              </div>

              <div className="metric-progress">
                <div
                  className="progress-fill"
                  style={{
                    width: `${metric.value * 100}%`,
                    backgroundColor: metric.value >= metric.target ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Defect tracking component
function DefectTracking({ defectData }) {
  const severityColors = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#22c55e'
  };

  const defectTrendData = defectData.history.slice(-7); // Last 7 days

  return (
    <div className="defect-tracking">
      <div className="tracking-header">
        <h3>Defect Analysis</h3>
        <Bug className="header-icon" />
      </div>

      <div className="defect-summary">
        <div className="summary-cards">
          <div className="summary-card total">
            <span className="card-value">{defectData.total}</span>
            <span className="card-label">Total Defects</span>
          </div>
          <div className="summary-card open">
            <span className="card-value">{defectData.open}</span>
            <span className="card-label">Open</span>
          </div>
          <div className="summary-card resolved">
            <span className="card-value">{defectData.resolved}</span>
            <span className="card-label">Resolved</span>
          </div>
          <div className="summary-card rate">
            <span className="card-value">{defectData.rate}%</span>
            <span className="card-label">Defect Rate</span>
          </div>
        </div>
      </div>

      <div className="defect-breakdown">
        <div className="severity-breakdown">
          <h4>By Severity</h4>
          <div className="severity-chart">
            {Object.entries(defectData.bySeverity).map(([severity, count]) => (
              <div key={severity} className="severity-item">
                <div className="severity-header">
                  <span className="severity-label">{severity}</span>
                  <span className="severity-count">{count}</span>
                </div>
                <div
                  className="severity-bar"
                  style={{
                    width: `${(count / defectData.total) * 100}%`,
                    backgroundColor: severityColors[severity]
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="trend-chart">
          <h4>7-Day Trend</h4>
          <div className="trend-bars">
            {defectTrendData.map((day, index) => (
              <div key={index} className="trend-bar-group">
                <div className="trend-bars-container">
                  <div
                    className="trend-bar found"
                    style={{ height: `${(day.found / 10) * 100}%` }}
                    title={`Found: ${day.found}`}
                  />
                  <div
                    className="trend-bar resolved"
                    style={{ height: `${(day.resolved / 10) * 100}%` }}
                    title={`Resolved: ${day.resolved}`}
                  />
                </div>
                <span className="trend-label">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
          <div className="trend-legend">
            <div className="legend-item">
              <div className="legend-color found" />
              <span>Found</span>
            </div>
            <div className="legend-item">
              <div className="legend-color resolved" />
              <span>Resolved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="defect-insights">
        <h4>Quality Insights</h4>
        <div className="insights-list">
          {defectData.insights.map((insight, index) => (
            <div key={index} className={`insight-item ${insight.type}`}>
              <div className="insight-icon">
                {insight.type === 'positive' ? (
                  <CheckCircle className="positive-icon" />
                ) : (
                  <AlertTriangle className="warning-icon" />
                )}
              </div>
              <div className="insight-content">
                <span className="insight-text">{insight.message}</span>
                <span className="insight-recommendation">{insight.recommendation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Quality trends over time
function QualityTrends({ trendsData, timeRange }) {
  const maxValue = Math.max(...trendsData.map(d =>
    Math.max(d.quality, d.coverage, d.defectRate)
  ));

  return (
    <div className="quality-trends">
      <div className="trends-header">
        <h3>Quality Trends</h3>
        <Activity className="header-icon" />
      </div>

      <div className="trends-chart">
        <div className="chart-container">
          <div className="chart-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid-line" style={{ bottom: `${i * 25}%` }} />
            ))}
          </div>

          <div className="chart-lines">
            {/* Quality Score Line */}
            <svg className="trend-line quality-line" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={trendsData.map((point, index) =>
                  `${(index / (trendsData.length - 1)) * 100},${100 - (point.quality / maxValue) * 100}`
                ).join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
              />
            </svg>

            {/* Test Coverage Line */}
            <svg className="trend-line coverage-line" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={trendsData.map((point, index) =>
                  `${(index / (trendsData.length - 1)) * 100},${100 - (point.coverage / maxValue) * 100}`
                ).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            </svg>

            {/* Defect Rate Line (inverted) */}
            <svg className="trend-line defect-line" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                points={trendsData.map((point, index) =>
                  `${(index / (trendsData.length - 1)) * 100},${(point.defectRate / maxValue) * 100}`
                ).join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className="chart-points">
            {trendsData.map((point, index) => (
              <div
                key={index}
                className="data-point"
                style={{ left: `${(index / (trendsData.length - 1)) * 100}%` }}
                title={`Date: ${point.date}, Quality: ${(point.quality * 100).toFixed(1)}%`}
              />
            ))}
          </div>
        </div>

        <div className="chart-legend">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#10b981' }} />
            <span>Quality Score</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3b82f6' }} />
            <span>Test Coverage</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ef4444' }} />
            <span>Defect Rate</span>
          </div>
        </div>

        <div className="chart-x-axis">
          {trendsData.filter((_, index) => index % Math.ceil(trendsData.length / 6) === 0)
            .map((point, index) => (
              <span key={index} className="axis-label">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}

// Review process metrics
function ReviewProcessMetrics({ reviewMetrics }) {
  const avgReviewTime = reviewMetrics.averageReviewTime;
  const reviewEfficiency = reviewMetrics.efficiency;

  return (
    <div className="review-process-metrics">
      <div className="process-header">
        <h3>Review Process</h3>
        <GitBranch className="header-icon" />
      </div>

      <div className="process-metrics">
        <div className="metric-item">
          <div className="metric-header">
            <Eye className="metric-icon" />
            <span className="metric-label">Review Coverage</span>
          </div>
          <div className="metric-value">
            <span className="value-number">{Math.round(reviewMetrics.coverage * 100)}%</span>
            <div className="value-bar">
              <div
                className="value-fill"
                style={{ width: `${reviewMetrics.coverage * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-header">
            <Clock className="metric-icon" />
            <span className="metric-label">Avg Review Time</span>
          </div>
          <div className="metric-value">
            <span className="value-number">{avgReviewTime}h</span>
            <span className="value-trend">
              {reviewMetrics.reviewTimeTrend === 'improving' ? '↓' : '↑'}
            </span>
          </div>
        </div>

        <div className="metric-item">
          <div className="metric-header">
            <Zap className="metric-icon" />
            <span className="metric-label">Review Efficiency</span>
          </div>
          <div className="metric-value">
            <span className="value-number">{Math.round(reviewEfficiency * 100)}%</span>
            <div className="efficiency-indicator">
              <div className={`efficiency-status ${reviewEfficiency > 0.8 ? 'high' : reviewEfficiency > 0.6 ? 'medium' : 'low'}`}>
                {reviewEfficiency > 0.8 ? 'High' : reviewEfficiency > 0.6 ? 'Medium' : 'Low'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="review-breakdown">
        <h4>Review Outcomes</h4>
        <div className="outcomes-chart">
          {Object.entries(reviewMetrics.outcomes).map(([outcome, count]) => {
            const total = Object.values(reviewMetrics.outcomes).reduce((sum, c) => sum + c, 0);
            const percentage = (count / total) * 100;

            return (
              <div key={outcome} className="outcome-item">
                <span className="outcome-label">{outcome}</span>
                <div className="outcome-bar">
                  <div
                    className={`outcome-fill ${outcome.toLowerCase()}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="outcome-percentage">{Math.round(percentage)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main QualityMetrics component
export default function QualityMetrics({ projectId, realTimeData }) {
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  // Mock quality data - in production, this would come from API
  const mockQualityData = useMemo(() => ({
    overall: {
      score: 0.85,
      trend: 'improving',
      target: 0.8
    },
    codeMetrics: {
      testCoverage: 0.82,
      testCoverageTrend: 'improving',
      codeReviewCoverage: 0.95,
      codeReviewTrend: 'stable',
      technicalDebt: 0.25,
      technicalDebtTrend: 'improving',
      documentationCoverage: 0.68,
      documentationTrend: 'improving'
    },
    defectData: {
      total: 23,
      open: 8,
      resolved: 15,
      rate: 2.1,
      bySeverity: {
        critical: 1,
        high: 3,
        medium: 8,
        low: 11
      },
      history: [
        { date: '2024-01-15', found: 4, resolved: 2 },
        { date: '2024-01-16', found: 2, resolved: 5 },
        { date: '2024-01-17', found: 3, resolved: 3 },
        { date: '2024-01-18', found: 1, resolved: 4 },
        { date: '2024-01-19', found: 2, resolved: 2 },
        { date: '2024-01-20', found: 0, resolved: 3 },
        { date: '2024-01-21', found: 1, resolved: 1 }
      ],
      insights: [
        {
          type: 'positive',
          message: 'Defect resolution rate improved by 25% this week',
          recommendation: 'Continue current quality practices'
        },
        {
          type: 'warning',
          message: 'Critical defect open for 3+ days',
          recommendation: 'Prioritize critical defect resolution'
        }
      ]
    },
    trendsData: [
      { date: '2024-01-01', quality: 0.78, coverage: 0.75, defectRate: 0.03 },
      { date: '2024-01-08', quality: 0.80, coverage: 0.77, defectRate: 0.028 },
      { date: '2024-01-15', quality: 0.82, coverage: 0.79, defectRate: 0.025 },
      { date: '2024-01-22', quality: 0.85, coverage: 0.82, defectRate: 0.021 }
    ],
    reviewMetrics: {
      coverage: 0.95,
      averageReviewTime: 4.5,
      reviewTimeTrend: 'improving',
      efficiency: 0.78,
      outcomes: {
        approved: 45,
        'changes-requested': 12,
        rejected: 3
      }
    }
  }), []);

  useEffect(() => {
    const loadQualityData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 600));
        setQualityData(mockQualityData);
      } catch (error) {
        console.error('Failed to load quality data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQualityData();
  }, [mockQualityData, timeRange]);

  if (loading) {
    return (
      <div className="quality-metrics loading">
        <div className="loading-spinner">
          <Shield className="spinner-icon" />
          <span>Loading quality metrics...</span>
        </div>
      </div>
    );
  }

  if (!qualityData) {
    return (
      <div className="quality-metrics error">
        <div className="error-message">
          <AlertTriangle className="error-icon" />
          <span>Failed to load quality data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="quality-metrics">
      <div className="metrics-header">
        <div className="header-title">
          <Shield className="header-icon" />
          <h1>Quality Metrics</h1>
        </div>

        <div className="header-controls">
          <div className="view-selector">
            <button
              className={`view-button ${selectedView === 'overview' ? 'active' : ''}`}
              onClick={() => setSelectedView('overview')}
            >
              Overview
            </button>
            <button
              className={`view-button ${selectedView === 'trends' ? 'active' : ''}`}
              onClick={() => setSelectedView('trends')}
            >
              Trends
            </button>
            <button
              className={`view-button ${selectedView === 'defects' ? 'active' : ''}`}
              onClick={() => setSelectedView('defects')}
            >
              Defects
            </button>
          </div>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
        </div>
      </div>

      <div className="metrics-content">
        {selectedView === 'overview' && (
          <>
            <div className="overall-quality">
              <QualityScoreIndicator
                score={qualityData.overall.score}
                label="Overall Quality Score"
                target={qualityData.overall.target}
              />
            </div>

            <div className="metrics-grid">
              <CodeQualityMetrics codeMetrics={qualityData.codeMetrics} />
              <ReviewProcessMetrics reviewMetrics={qualityData.reviewMetrics} />
            </div>
          </>
        )}

        {selectedView === 'trends' && (
          <QualityTrends
            trendsData={qualityData.trendsData}
            timeRange={timeRange}
          />
        )}

        {selectedView === 'defects' && (
          <DefectTracking defectData={qualityData.defectData} />
        )}
      </div>
    </div>
  );
}