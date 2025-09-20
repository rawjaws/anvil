/**
 * Team Analytics Dashboard
 * Comprehensive team performance and collaboration analytics
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Clock,
  MessageSquare,
  GitBranch,
  Code,
  BarChart3,
  PieChart,
  Activity,
  Star,
  Zap,
  Calendar,
  UserCheck,
  UserX
} from 'lucide-react';

// Team member performance card
function TeamMemberCard({ member, benchmarks }) {
  const getPerformanceLevel = (score) => {
    if (score >= 0.9) return { level: 'exceptional', color: '#10b981' };
    if (score >= 0.8) return { level: 'excellent', color: '#22c55e' };
    if (score >= 0.7) return { level: 'good', color: '#f59e0b' };
    if (score >= 0.6) return { level: 'fair', color: '#f97316' };
    return { level: 'needs-improvement', color: '#ef4444' };
  };

  const performance = getPerformanceLevel(member.overallScore);

  return (
    <div className={`team-member-card ${performance.level}`}>
      <div className="member-header">
        <div className="member-avatar">
          <img
            src={member.avatar || `/api/placeholder/40/40`}
            alt={member.name}
            className="avatar-image"
          />
          <div className="member-status">
            {member.isActive ? (
              <UserCheck className="status-icon active" />
            ) : (
              <UserX className="status-icon inactive" />
            )}
          </div>
        </div>
        <div className="member-info">
          <h4 className="member-name">{member.name}</h4>
          <span className="member-role">{member.role}</span>
          <span className={`performance-badge ${performance.level}`}>
            {performance.level.replace('-', ' ')}
          </span>
        </div>
      </div>

      <div className="member-metrics">
        <div className="overall-score">
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
                stroke={performance.color}
                strokeWidth="8"
                strokeDasharray={`${member.overallScore * 251} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="score-text">{Math.round(member.overallScore * 100)}</div>
          </div>
          <span className="score-label">Overall Score</span>
        </div>

        <div className="member-stats">
          <div className="stat-item">
            <Target className="stat-icon" />
            <span className="stat-label">Velocity</span>
            <span className="stat-value">{member.velocity}</span>
          </div>
          <div className="stat-item">
            <Code className="stat-icon" />
            <span className="stat-label">Code Quality</span>
            <span className="stat-value">{Math.round(member.codeQuality * 100)}%</span>
          </div>
          <div className="stat-item">
            <MessageSquare className="stat-icon" />
            <span className="stat-label">Collaboration</span>
            <span className="stat-value">{Math.round(member.collaboration * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="member-achievements">
        {member.achievements.slice(0, 3).map((achievement, index) => (
          <div key={index} className="achievement-badge">
            <Star className="achievement-icon" />
            <span className="achievement-text">{achievement}</span>
          </div>
        ))}
      </div>

      <div className="member-trends">
        <div className="trend-item">
          <span className="trend-label">Recent Trend</span>
          <div className="trend-indicator">
            {member.trend === 'improving' ? (
              <TrendingUp className="trend-icon improving" />
            ) : member.trend === 'declining' ? (
              <TrendingDown className="trend-icon declining" />
            ) : (
              <Activity className="trend-icon stable" />
            )}
            <span className={`trend-text ${member.trend}`}>{member.trend}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Team velocity comparison
function TeamVelocityComparison({ teams, currentTeamId }) {
  const sortedTeams = teams.sort((a, b) => b.velocity - a.velocity);
  const maxVelocity = Math.max(...teams.map(team => team.velocity));

  return (
    <div className="team-velocity-comparison">
      <div className="comparison-header">
        <h3>Team Velocity Comparison</h3>
        <BarChart3 className="header-icon" />
      </div>

      <div className="velocity-chart">
        {sortedTeams.map((team, index) => (
          <div
            key={team.id}
            className={`velocity-bar-item ${team.id === currentTeamId ? 'current-team' : ''}`}
          >
            <div className="bar-header">
              <span className="team-name">{team.name}</span>
              <span className="velocity-value">{team.velocity} SP</span>
            </div>
            <div className="velocity-bar">
              <div
                className="velocity-fill"
                style={{
                  width: `${(team.velocity / maxVelocity) * 100}%`,
                  backgroundColor: team.id === currentTeamId ? '#3b82f6' : '#e5e7eb'
                }}
              />
            </div>
            <div className="bar-footer">
              <span className="team-size">{team.size} members</span>
              <span className="velocity-per-member">
                {Math.round(team.velocity / team.size * 10) / 10} SP/member
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Collaboration network visualization
function CollaborationNetwork({ collaborationData }) {
  const maxConnections = Math.max(...collaborationData.map(member => member.connections.length));

  return (
    <div className="collaboration-network">
      <div className="network-header">
        <h3>Collaboration Network</h3>
        <Users className="header-icon" />
      </div>

      <div className="network-visualization">
        <div className="network-nodes">
          {collaborationData.map((member, index) => (
            <div
              key={member.id}
              className="network-node"
              style={{
                '--node-size': `${20 + (member.connections.length / maxConnections) * 30}px`,
                '--node-color': member.role === 'Lead' ? '#3b82f6' : '#10b981'
              }}
              title={`${member.name} - ${member.connections.length} connections`}
            >
              <div className="node-circle">
                <span className="node-initial">{member.name.charAt(0)}</span>
              </div>
              <span className="node-label">{member.name}</span>
            </div>
          ))}
        </div>

        <div className="network-metrics">
          <div className="metric-item">
            <span className="metric-label">Network Density</span>
            <span className="metric-value">{collaborationData.networkDensity}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Avg Connections</span>
            <span className="metric-value">
              {Math.round(collaborationData.reduce((sum, m) => sum + m.connections.length, 0) / collaborationData.length * 10) / 10}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Collaboration Score</span>
            <span className="metric-value">{collaborationData.overallScore}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Team capacity planning
function TeamCapacityPlanning({ capacityData, forecastData }) {
  const currentUtilization = (capacityData.allocated / capacityData.total) * 100;

  const getUtilizationStatus = (utilization) => {
    if (utilization > 95) return { status: 'overallocated', color: '#ef4444' };
    if (utilization > 85) return { status: 'high', color: '#f59e0b' };
    if (utilization > 70) return { status: 'optimal', color: '#10b981' };
    return { status: 'underutilized', color: '#6b7280' };
  };

  const utilizationStatus = getUtilizationStatus(currentUtilization);

  return (
    <div className="team-capacity-planning">
      <div className="capacity-header">
        <h3>Capacity Planning</h3>
        <Calendar className="header-icon" />
      </div>

      <div className="capacity-overview">
        <div className="capacity-gauge">
          <div className="gauge-container">
            <svg viewBox="0 0 200 120" className="capacity-svg">
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={utilizationStatus.color}
                strokeWidth="12"
                strokeDasharray={`${(currentUtilization / 100) * 251} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="gauge-value">
              <span className="gauge-percentage">{Math.round(currentUtilization)}%</span>
              <span className="gauge-label">{utilizationStatus.status}</span>
            </div>
          </div>
        </div>

        <div className="capacity-details">
          <div className="detail-item">
            <span className="detail-label">Total Capacity</span>
            <span className="detail-value">{capacityData.total}h</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Allocated</span>
            <span className="detail-value">{capacityData.allocated}h</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Available</span>
            <span className="detail-value">{capacityData.available}h</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Buffer</span>
            <span className="detail-value">{capacityData.buffer}h</span>
          </div>
        </div>
      </div>

      <div className="capacity-forecast">
        <h4>Capacity Forecast</h4>
        <div className="forecast-chart">
          {forecastData.map((period, index) => (
            <div key={index} className="forecast-period">
              <div className="period-header">
                <span className="period-label">{period.period}</span>
                <span className="period-utilization">{period.utilization}%</span>
              </div>
              <div className="period-bar">
                <div
                  className="period-fill"
                  style={{
                    width: `${period.utilization}%`,
                    backgroundColor: getUtilizationStatus(period.utilization).color
                  }}
                />
              </div>
              <div className="period-details">
                <span className="period-capacity">{period.capacity}h capacity</span>
                <span className="period-demand">{period.demand}h demand</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="capacity-recommendations">
        <h4>Recommendations</h4>
        <div className="recommendations-list">
          {capacityData.recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-item ${rec.priority}`}>
              <div className="rec-icon">
                {rec.type === 'add_capacity' ? (
                  <UserCheck className="icon" />
                ) : rec.type === 'redistribute' ? (
                  <Activity className="icon" />
                ) : (
                  <Clock className="icon" />
                )}
              </div>
              <div className="rec-content">
                <span className="rec-title">{rec.title}</span>
                <p className="rec-description">{rec.description}</p>
                <span className="rec-impact">{rec.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Team performance dashboard
function TeamPerformanceDashboard({ performanceData }) {
  const metrics = [
    {
      label: 'Delivery Velocity',
      value: performanceData.deliveryVelocity,
      target: 85,
      unit: 'SP/sprint',
      trend: performanceData.velocityTrend,
      icon: Target
    },
    {
      label: 'Quality Score',
      value: performanceData.qualityScore * 100,
      target: 80,
      unit: '%',
      trend: performanceData.qualityTrend,
      icon: Award
    },
    {
      label: 'Team Happiness',
      value: performanceData.teamHappiness * 100,
      target: 75,
      unit: '%',
      trend: performanceData.happinessTrend,
      icon: Star
    },
    {
      label: 'Collaboration Index',
      value: performanceData.collaborationIndex * 100,
      target: 70,
      unit: '%',
      trend: performanceData.collaborationTrend,
      icon: Users
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
    <div className="team-performance-dashboard">
      <div className="dashboard-header">
        <h3>Team Performance Overview</h3>
        <BarChart3 className="header-icon" />
      </div>

      <div className="performance-metrics">
        {metrics.map((metric, index) => {
          const MetricIcon = metric.icon;
          const isAboveTarget = metric.value >= metric.target;

          return (
            <div key={index} className={`performance-metric ${isAboveTarget ? 'above-target' : 'below-target'}`}>
              <div className="metric-header">
                <MetricIcon className="metric-icon" />
                <span className="metric-label">{metric.label}</span>
                {getTrendIcon(metric.trend)}
              </div>

              <div className="metric-value">
                <span className="value-number">{Math.round(metric.value)}{metric.unit}</span>
                <span className="value-target">Target: {metric.target}{metric.unit}</span>
              </div>

              <div className="metric-progress">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, (metric.value / metric.target) * 100)}%`,
                    backgroundColor: isAboveTarget ? '#10b981' : '#f59e0b'
                  }}
                />
                <div
                  className="progress-target"
                  style={{ left: `${Math.min(100, (metric.target / (metric.target * 1.2)) * 100)}%` }}
                />
              </div>

              <div className="metric-insights">
                <span className={`trend-label ${metric.trend}`}>
                  {metric.trend.charAt(0).toUpperCase() + metric.trend.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="performance-summary">
        <div className="summary-score">
          <div className="score-circle">
            <svg viewBox="0 0 100 100">
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
                strokeDasharray={`${performanceData.overallScore * 251} 251`}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="score-text">{Math.round(performanceData.overallScore * 100)}%</div>
          </div>
          <span className="score-label">Overall Performance</span>
        </div>

        <div className="performance-insights">
          <h4>Key Insights</h4>
          <ul className="insights-list">
            {performanceData.insights.map((insight, index) => (
              <li key={index} className="insight-item">{insight}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Main TeamAnalytics component
export default function TeamAnalytics({ teamId, realTimeData }) {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [timeRange, setTimeRange] = useState('month');

  // Mock team data - in production, this would come from API
  const mockTeamData = useMemo(() => ({
    team: {
      id: teamId || 'team_1',
      name: 'Analytics Team',
      size: 6,
      velocity: 92,
      performance: 0.84
    },
    members: [
      {
        id: 1,
        name: 'Alice Johnson',
        role: 'Tech Lead',
        avatar: null,
        isActive: true,
        overallScore: 0.92,
        velocity: 18,
        codeQuality: 0.95,
        collaboration: 0.88,
        trend: 'improving',
        achievements: ['Code Review Champion', 'Quality Guardian', 'Mentor']
      },
      {
        id: 2,
        name: 'Bob Smith',
        role: 'Senior Developer',
        avatar: null,
        isActive: true,
        overallScore: 0.85,
        velocity: 16,
        codeQuality: 0.82,
        collaboration: 0.90,
        trend: 'stable',
        achievements: ['Team Player', 'Bug Hunter', 'Documentation Pro']
      },
      {
        id: 3,
        name: 'Carol Davis',
        role: 'Developer',
        avatar: null,
        isActive: true,
        overallScore: 0.78,
        velocity: 14,
        codeQuality: 0.75,
        collaboration: 0.85,
        trend: 'improving',
        achievements: ['Fast Learner', 'Test Advocate']
      },
      {
        id: 4,
        name: 'David Wilson',
        role: 'Developer',
        avatar: null,
        isActive: false,
        overallScore: 0.72,
        velocity: 12,
        codeQuality: 0.70,
        collaboration: 0.78,
        trend: 'declining',
        achievements: ['Innovative Thinker']
      }
    ],
    allTeams: [
      { id: 'team_1', name: 'Analytics Team', velocity: 92, size: 6 },
      { id: 'team_2', name: 'Platform Team', velocity: 88, size: 5 },
      { id: 'team_3', name: 'Frontend Team', velocity: 85, size: 4 },
      { id: 'team_4', name: 'DevOps Team', velocity: 78, size: 3 }
    ],
    collaborationData: [
      { id: 1, name: 'Alice', role: 'Lead', connections: [2, 3, 4, 5, 6] },
      { id: 2, name: 'Bob', role: 'Senior', connections: [1, 3, 4] },
      { id: 3, name: 'Carol', role: 'Dev', connections: [1, 2, 5] },
      { id: 4, name: 'David', role: 'Dev', connections: [1, 2] },
      { id: 5, name: 'Eve', role: 'QA', connections: [1, 3, 6] },
      { id: 6, name: 'Frank', role: 'Design', connections: [1, 5] }
    ],
    capacityData: {
      total: 240,
      allocated: 204,
      available: 36,
      buffer: 24,
      recommendations: [
        {
          type: 'redistribute',
          priority: 'medium',
          title: 'Redistribute workload',
          description: 'Balance tasks across team members to optimize capacity',
          impact: 'Improve utilization by 8%'
        },
        {
          type: 'add_capacity',
          priority: 'low',
          title: 'Consider additional resources',
          description: 'Team approaching capacity limits for next quarter',
          impact: 'Support 20% growth in deliverables'
        }
      ]
    },
    forecastData: [
      { period: 'This Sprint', utilization: 85, capacity: 240, demand: 204 },
      { period: 'Next Sprint', utilization: 92, capacity: 240, demand: 220 },
      { period: 'Sprint +2', utilization: 88, capacity: 240, demand: 210 },
      { period: 'Sprint +3', utilization: 95, capacity: 240, demand: 228 }
    ],
    performanceData: {
      deliveryVelocity: 92,
      velocityTrend: 'improving',
      qualityScore: 0.87,
      qualityTrend: 'stable',
      teamHappiness: 0.82,
      happinessTrend: 'improving',
      collaborationIndex: 0.78,
      collaborationTrend: 'stable',
      overallScore: 0.84,
      insights: [
        'Team velocity improved 12% over last month',
        'Code quality remains consistently high',
        'Collaboration patterns show strong knowledge sharing',
        'Team happiness scores indicate positive work environment'
      ]
    }
  }), [teamId]);

  // Add network metrics to collaboration data
  mockTeamData.collaborationData.networkDensity = 75;
  mockTeamData.collaborationData.overallScore = 82;

  useEffect(() => {
    const loadTeamData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 700));
        setTeamData(mockTeamData);
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [mockTeamData, teamId, timeRange]);

  if (loading) {
    return (
      <div className="team-analytics loading">
        <div className="loading-spinner">
          <Users className="spinner-icon" />
          <span>Loading team analytics...</span>
        </div>
      </div>
    );
  }

  if (!teamData) {
    return (
      <div className="team-analytics error">
        <div className="error-message">
          <Users className="error-icon" />
          <span>Failed to load team data</span>
        </div>
      </div>
    );
  }

  return (
    <div className="team-analytics">
      <div className="analytics-header">
        <div className="header-title">
          <Users className="header-icon" />
          <h1>Team Analytics</h1>
          <span className="team-name">{teamData.team.name}</span>
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
              className={`view-button ${selectedView === 'members' ? 'active' : ''}`}
              onClick={() => setSelectedView('members')}
            >
              Members
            </button>
            <button
              className={`view-button ${selectedView === 'collaboration' ? 'active' : ''}`}
              onClick={() => setSelectedView('collaboration')}
            >
              Collaboration
            </button>
            <button
              className={`view-button ${selectedView === 'capacity' ? 'active' : ''}`}
              onClick={() => setSelectedView('capacity')}
            >
              Capacity
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

      <div className="analytics-content">
        {selectedView === 'overview' && (
          <div className="overview-content">
            <TeamPerformanceDashboard performanceData={teamData.performanceData} />
            <TeamVelocityComparison teams={teamData.allTeams} currentTeamId={teamData.team.id} />
          </div>
        )}

        {selectedView === 'members' && (
          <div className="members-content">
            <div className="members-grid">
              {teamData.members.map(member => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        )}

        {selectedView === 'collaboration' && (
          <div className="collaboration-content">
            <CollaborationNetwork collaborationData={teamData.collaborationData} />
          </div>
        )}

        {selectedView === 'capacity' && (
          <div className="capacity-content">
            <TeamCapacityPlanning
              capacityData={teamData.capacityData}
              forecastData={teamData.forecastData}
            />
          </div>
        )}
      </div>
    </div>
  );
}