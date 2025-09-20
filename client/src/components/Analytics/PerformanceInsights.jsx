/**
 * Performance Insights Dashboard
 * Team productivity and performance analytics interface
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Clock,
  Target,
  Award,
  AlertCircle,
  BarChart3,
  Activity,
  Gauge,
  Calendar,
  FileText,
  MessageSquare
} from 'lucide-react';

// Team velocity chart component
function VelocityChart({ velocityData, teamSize }) {
  const maxVelocity = Math.max(...velocityData.historical, velocityData.current);
  const normalizedCurrent = (velocityData.current / maxVelocity) * 100;

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="trend-icon improving" />;
      case 'declining': return <TrendingDown className="trend-icon declining" />;
      default: return <Activity className="trend-icon stable" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return '#10b981';
      case 'declining': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className="velocity-chart">
      <div className="chart-header">
        <h3>Team Velocity</h3>
        <div className="velocity-trend">
          {getTrendIcon(velocityData.trend)}
          <span className={`trend-label ${velocityData.trend}`}>
            {velocityData.trend}
          </span>
        </div>
      </div>

      <div className="velocity-metrics">
        <div className="metric-primary">
          <span className="metric-value">{velocityData.current}</span>
          <span className="metric-unit">story points</span>
        </div>
        <div className="metric-secondary">
          <span className="metric-label">Per team member</span>
          <span className="metric-value">{Math.round(velocityData.normalized * 10) / 10}</span>
        </div>
      </div>

      <div className="velocity-bar">
        <div
          className="velocity-fill"
          style={{
            width: `${normalizedCurrent}%`,
            backgroundColor: getTrendColor(velocityData.trend)
          }}
        />
        <div className="velocity-target" style={{ left: `${(velocityData.target / maxVelocity) * 100}%` }}>
          <span className="target-label">Target: {velocityData.target}</span>
        </div>
      </div>

      <div className="velocity-prediction">
        <div className="prediction-item">
          <span className="prediction-label">Next Sprint Prediction</span>
          <span className="prediction-value">{velocityData.prediction}</span>
        </div>
      </div>

      <div className="velocity-history">
        <h4>Sprint History</h4>
        <div className="history-bars">
          {velocityData.historical.slice(-6).map((velocity, index) => (
            <div key={index} className="history-bar">
              <div
                className="history-fill"
                style={{
                  height: `${(velocity / maxVelocity) * 100}%`,
                  backgroundColor: index === velocityData.historical.length - 1 ? getTrendColor(velocityData.trend) : '#e5e7eb'
                }}
              />
              <span className="history-label">S{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Productivity breakdown component
function ProductivityBreakdown({ productivity }) {
  const factors = [
    { name: 'Focus Time', value: productivity.factors.focus_time, color: '#10b981', icon: Target },
    { name: 'Collaboration', value: productivity.factors.collaboration_time, color: '#3b82f6', icon: Users },
    { name: 'Meetings', value: productivity.factors.meeting_time, color: '#f59e0b', icon: MessageSquare },
    { name: 'Development', value: productivity.factors.development_time, color: '#8b5cf6', icon: FileText }
  ];

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#10b981';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="productivity-breakdown">
      <div className="breakdown-header">
        <h3>Productivity Analysis</h3>
        <div className="productivity-score">
          <Gauge
            className="score-icon"
            style={{ color: getScoreColor(productivity.score) }}
          />
          <span className="score-value">{Math.round(productivity.score * 100)}%</span>
        </div>
      </div>

      <div className="productivity-factors">
        {factors.map((factor, index) => {
          const Factor = factor.icon;
          return (
            <div key={index} className="factor-item">
              <div className="factor-header">
                <Factor className="factor-icon" style={{ color: factor.color }} />
                <span className="factor-name">{factor.name}</span>
                <span className="factor-percentage">
                  {Math.round(factor.value * 100)}%
                </span>
              </div>
              <div className="factor-bar">
                <div
                  className="factor-fill"
                  style={{
                    width: `${factor.value * 100}%`,
                    backgroundColor: factor.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {productivity.recommendations && productivity.recommendations.length > 0 && (
        <div className="productivity-recommendations">
          <h4>Optimization Opportunities</h4>
          <div className="recommendations-list">
            {productivity.recommendations.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-header">
                  <AlertCircle className="rec-icon" />
                  <span className="rec-area">{rec.area}</span>
                </div>
                <p className="rec-action">{rec.action}</p>
                <span className="rec-impact">{rec.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Collaboration metrics component
function CollaborationMetrics({ collaboration }) {
  const patterns = [
    { name: 'Pair Programming', value: collaboration.patterns.pair_programming, unit: 'hours', target: 10 },
    { name: 'Code Reviews', value: collaboration.patterns.code_reviews, unit: 'reviews', target: 20 },
    { name: 'Knowledge Sharing', value: collaboration.patterns.knowledge_sharing, unit: 'sessions', target: 3 },
    { name: 'Cross Training', value: collaboration.patterns.cross_training, unit: 'hours', target: 5 }
  ];

  const effectiveness = [
    { name: 'Communication', value: collaboration.effectiveness.communication_frequency, max: 10 },
    { name: 'Decision Speed', value: collaboration.effectiveness.decision_speed, max: 5 },
    { name: 'Conflict Resolution', value: collaboration.effectiveness.conflict_resolution, max: 5 }
  ];

  return (
    <div className="collaboration-metrics">
      <div className="metrics-header">
        <h3>Collaboration Effectiveness</h3>
        <div className="collaboration-score">
          <div className="score-circle">
            <svg viewBox="0 0 100 100" className="score-svg">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={`${collaboration.score * 251} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="score-text">{Math.round(collaboration.score * 100)}%</div>
          </div>
        </div>
      </div>

      <div className="collaboration-patterns">
        <h4>Collaboration Patterns</h4>
        <div className="patterns-grid">
          {patterns.map((pattern, index) => (
            <div key={index} className="pattern-item">
              <div className="pattern-header">
                <span className="pattern-name">{pattern.name}</span>
                <span className="pattern-value">
                  {pattern.value} {pattern.unit}
                </span>
              </div>
              <div className="pattern-progress">
                <div
                  className="pattern-fill"
                  style={{
                    width: `${Math.min(100, (pattern.value / pattern.target) * 100)}%`,
                    backgroundColor: pattern.value >= pattern.target ? '#10b981' : '#f59e0b'
                  }}
                />
              </div>
              <span className="pattern-target">Target: {pattern.target} {pattern.unit}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="collaboration-effectiveness">
        <h4>Team Effectiveness</h4>
        <div className="effectiveness-items">
          {effectiveness.map((item, index) => (
            <div key={index} className="effectiveness-item">
              <span className="effectiveness-name">{item.name}</span>
              <div className="effectiveness-rating">
                {[...Array(item.max)].map((_, i) => (
                  <div
                    key={i}
                    className={`rating-star ${i < item.value ? 'filled' : 'empty'}`}
                  />
                ))}
              </div>
              <span className="effectiveness-score">{item.value}/{item.max}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Resource utilization component
function ResourceUtilization({ utilization, capacity }) {
  const utilizationPercentage = (utilization.current / capacity.current) * 100;

  const getUtilizationColor = (percentage) => {
    if (percentage > 95) return '#ef4444'; // Over-utilized
    if (percentage > 85) return '#f59e0b'; // High utilization
    if (percentage > 70) return '#10b981'; // Optimal
    return '#6b7280'; // Under-utilized
  };

  const getUtilizationStatus = (percentage) => {
    if (percentage > 95) return 'Over-utilized';
    if (percentage > 85) return 'High utilization';
    if (percentage > 70) return 'Optimal';
    return 'Under-utilized';
  };

  return (
    <div className="resource-utilization">
      <div className="utilization-header">
        <h3>Resource Utilization</h3>
        <div className="utilization-status">
          <span className={`status-label ${getUtilizationStatus(utilizationPercentage).toLowerCase().replace(/[^a-z]/g, '-')}`}>
            {getUtilizationStatus(utilizationPercentage)}
          </span>
        </div>
      </div>

      <div className="utilization-gauge">
        <div className="gauge-container">
          <svg viewBox="0 0 200 120" className="gauge-svg">
            {/* Background arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            {/* Utilization arc */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={getUtilizationColor(utilizationPercentage)}
              strokeWidth="12"
              strokeDasharray={`${(utilizationPercentage / 100) * 251} 251`}
              strokeLinecap="round"
            />
            {/* Needle */}
            <line
              x1="100"
              y1="100"
              x2={100 + 60 * Math.cos((utilizationPercentage / 100) * Math.PI + Math.PI)}
              y2={100 + 60 * Math.sin((utilizationPercentage / 100) * Math.PI + Math.PI)}
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <div className="gauge-value">
            <span className="gauge-percentage">{Math.round(utilizationPercentage)}%</span>
            <span className="gauge-label">Utilization</span>
          </div>
        </div>
      </div>

      <div className="utilization-details">
        <div className="detail-row">
          <span className="detail-label">Current Allocation</span>
          <span className="detail-value">{utilization.current} hours</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Total Capacity</span>
          <span className="detail-value">{capacity.current} hours</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Available</span>
          <span className="detail-value">{capacity.current - utilization.current} hours</span>
        </div>
      </div>

      <div className="utilization-trend">
        <h4>Utilization Trend</h4>
        <div className="trend-chart">
          {utilization.historical?.slice(-7).map((value, index) => (
            <div key={index} className="trend-bar">
              <div
                className="trend-fill"
                style={{
                  height: `${value}%`,
                  backgroundColor: getUtilizationColor(value)
                }}
              />
              <span className="trend-label">D{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Performance benchmarks component
function PerformanceBenchmarks({ teamMetrics, benchmarks }) {
  const comparisons = [
    {
      metric: 'Team Velocity',
      current: teamMetrics.velocity,
      benchmark: benchmarks.team_velocity,
      unit: 'SP/sprint'
    },
    {
      metric: 'Code Quality',
      current: teamMetrics.quality * 100,
      benchmark: benchmarks.code_quality,
      unit: '%'
    },
    {
      metric: 'Delivery Predictability',
      current: teamMetrics.predictability * 100,
      benchmark: benchmarks.delivery_predictability,
      unit: '%'
    }
  ];

  const getBenchmarkLevel = (current, benchmark) => {
    if (current >= benchmark.excellent) return { level: 'excellent', color: '#10b981' };
    if (current >= benchmark.good) return { level: 'good', color: '#22c55e' };
    if (current >= benchmark.average) return { level: 'average', color: '#f59e0b' };
    return { level: 'below_average', color: '#ef4444' };
  };

  return (
    <div className="performance-benchmarks">
      <div className="benchmarks-header">
        <h3>Performance Benchmarks</h3>
        <Award className="benchmarks-icon" />
      </div>

      <div className="benchmarks-list">
        {comparisons.map((comparison, index) => {
          const benchmarkLevel = getBenchmarkLevel(comparison.current, comparison.benchmark);

          return (
            <div key={index} className="benchmark-item">
              <div className="benchmark-header">
                <span className="benchmark-metric">{comparison.metric}</span>
                <span className={`benchmark-level ${benchmarkLevel.level}`}>
                  {benchmarkLevel.level.replace('_', ' ')}
                </span>
              </div>

              <div className="benchmark-comparison">
                <div className="current-value">
                  <span className="value-number">{comparison.current}{comparison.unit}</span>
                  <span className="value-label">Current</span>
                </div>

                <div className="benchmark-scale">
                  <div className="scale-bar">
                    <div className="scale-ranges">
                      <div className="range excellent" style={{ width: '25%' }} />
                      <div className="range good" style={{ width: '25%' }} />
                      <div className="range average" style={{ width: '25%' }} />
                      <div className="range below-average" style={{ width: '25%' }} />
                    </div>
                    <div
                      className="current-marker"
                      style={{
                        left: `${Math.min(100, (comparison.current / comparison.benchmark.excellent) * 100)}%`,
                        backgroundColor: benchmarkLevel.color
                      }}
                    />
                  </div>
                  <div className="scale-labels">
                    <span>{comparison.benchmark.below_average}</span>
                    <span>{comparison.benchmark.average}</span>
                    <span>{comparison.benchmark.good}</span>
                    <span>{comparison.benchmark.excellent}</span>
                  </div>
                </div>

                <div className="benchmark-targets">
                  <div className="target-item">
                    <span className="target-label">Next Target</span>
                    <span className="target-value">
                      {comparison.benchmark.good}{comparison.unit}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main PerformanceInsights component
export default function PerformanceInsights({ teamId, realTimeData }) {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, quarter
  const [selectedMetrics, setSelectedMetrics] = useState(['velocity', 'productivity', 'collaboration']);

  // Mock performance data - in production, this would come from API
  const mockPerformanceData = useMemo(() => ({
    team: {
      id: teamId || 'team_1',
      name: 'Analytics Team',
      size: 5,
      velocity: 85,
      quality: 0.87,
      predictability: 0.82
    },
    velocity: {
      current: 85,
      normalized: 17,
      trend: 'improving',
      target: 100,
      prediction: 92,
      historical: [65, 70, 75, 80, 85, 88, 85]
    },
    productivity: {
      score: 0.78,
      factors: {
        focus_time: 0.75,
        collaboration_time: 0.8,
        meeting_time: 0.6,
        development_time: 0.85
      },
      recommendations: [
        {
          area: 'Focus Time',
          action: 'Implement no-meeting Fridays',
          impact: 'Increase productivity by 15%'
        },
        {
          area: 'Meeting Efficiency',
          action: 'Reduce average meeting duration',
          impact: 'Save 3-4 hours per week'
        }
      ]
    },
    collaboration: {
      score: 0.72,
      patterns: {
        pair_programming: 8,
        code_reviews: 18,
        knowledge_sharing: 2,
        cross_training: 4
      },
      effectiveness: {
        communication_frequency: 8,
        decision_speed: 4,
        conflict_resolution: 4
      }
    },
    utilization: {
      current: 34,
      historical: [85, 88, 82, 90, 87, 85, 88]
    },
    capacity: {
      current: 40
    },
    benchmarks: {
      team_velocity: {
        excellent: 120,
        good: 100,
        average: 80,
        below_average: 60
      },
      code_quality: {
        excellent: 95,
        good: 85,
        average: 75,
        below_average: 65
      },
      delivery_predictability: {
        excellent: 90,
        good: 80,
        average: 70,
        below_average: 60
      }
    }
  }), [teamId]);

  useEffect(() => {
    const loadPerformanceData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setPerformanceData(mockPerformanceData);
      } catch (error) {
        console.error('Failed to load performance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPerformanceData();
  }, [mockPerformanceData, timeRange]);

  if (loading) {
    return (
      <div className="performance-insights loading">
        <div className="loading-spinner">
          <BarChart3 className="spinner-icon" />
          <span>Loading performance insights...</span>
        </div>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="performance-insights error">
        <div className="error-message">
          <AlertCircle className="error-icon" />
          <span>Failed to load performance data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="performance-insights">
      <div className="insights-header">
        <div className="header-title">
          <BarChart3 className="header-icon" />
          <h1>Performance Insights</h1>
          <span className="team-name">{performanceData.team.name}</span>
        </div>

        <div className="header-controls">
          <div className="time-range-selector">
            <Calendar className="selector-icon" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="time-select"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="insights-content">
        <div className="insights-main">
          <div className="metrics-row">
            <VelocityChart
              velocityData={performanceData.velocity}
              teamSize={performanceData.team.size}
            />
            <ProductivityBreakdown
              productivity={performanceData.productivity}
            />
          </div>

          <div className="metrics-row">
            <CollaborationMetrics
              collaboration={performanceData.collaboration}
            />
            <ResourceUtilization
              utilization={performanceData.utilization}
              capacity={performanceData.capacity}
            />
          </div>
        </div>

        <div className="insights-sidebar">
          <PerformanceBenchmarks
            teamMetrics={performanceData.team}
            benchmarks={performanceData.benchmarks}
          />
        </div>
      </div>
    </div>
  );
}