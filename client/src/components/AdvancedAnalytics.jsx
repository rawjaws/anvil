import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAdvancedAnalytics } from '../contexts/FeatureContext'
import { BarChart3, TrendingUp, Users, FileText, Clock, Target, Brain, Activity, AlertTriangle, Zap } from 'lucide-react'
import './AdvancedAnalytics.css'

// PreCog Integration Hook
function usePreCogAnalytics() {
  const [precogData, setPrecogData] = useState(null)
  const [marketIntelligence, setMarketIntelligence] = useState(null)
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchPreCogData = async () => {
      setLoading(true)
      try {
        // Simulate PreCog API calls
        const [market, intelligence, predict] = await Promise.all([
          simulateMarketPrecognition(),
          simulateIntelligenceGathering(),
          simulatePredictiveModeling()
        ])
        setPrecogData(market)
        setMarketIntelligence(intelligence)
        setPredictions(predict)
      } catch (error) {
        console.error('PreCog Analytics Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPreCogData()
    const interval = setInterval(fetchPreCogData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  return { precogData, marketIntelligence, predictions, loading }
}

// Simulate PreCog API calls
async function simulateMarketPrecognition() {
  await new Promise(resolve => setTimeout(resolve, 800))
  return {
    marketTrend: 'growth',
    confidence: 0.87,
    riskLevel: 'medium',
    successProbability: 0.82,
    timeframe: '6 months',
    keyInsights: [
      'Market adoption accelerating by 25%',
      'Competitive landscape shifting',
      'Technology convergence creating opportunities'
    ]
  }
}

async function simulateIntelligenceGathering() {
  await new Promise(resolve => setTimeout(resolve, 600))
  return {
    competitiveThreats: 2,
    marketOpportunities: 4,
    industryGrowth: '+18%',
    marketPosition: 'Strong',
    strategicRecommendations: [
      'Accelerate product development',
      'Expand market presence',
      'Strengthen partnerships'
    ]
  }
}

async function simulatePredictiveModeling() {
  await new Promise(resolve => setTimeout(resolve, 700))
  return {
    qualityScore: 0.91,
    deliveryProbability: 0.85,
    riskFactors: [
      { factor: 'Technical complexity', impact: 'medium', probability: 0.3 },
      { factor: 'Resource availability', impact: 'low', probability: 0.2 }
    ],
    recommendations: [
      'Increase test coverage to 95%',
      'Implement continuous monitoring',
      'Enhance team training programs'
    ]
  }
}

// Analytics Data Processing
function useAnalyticsData() {
  const { capabilities, enablers } = useApp()

  return useMemo(() => {
    const now = new Date()
    const statusCounts = {}
    const priorityCounts = {}
    const monthlyProgress = {}
    const capabilityMetrics = {}

    // Process capabilities
    capabilities.forEach(cap => {
      const status = cap.status || 'Draft'
      const priority = cap.priority || 'Medium'

      statusCounts[status] = (statusCounts[status] || 0) + 1
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1

      // Calculate capability completion based on enablers
      const relatedEnablers = enablers.filter(en => en.capabilityId === cap.id)
      const completedEnablers = relatedEnablers.filter(en =>
        en.status === 'Implemented' || en.status === 'Deployed'
      )

      capabilityMetrics[cap.id] = {
        name: cap.title || cap.id,
        totalEnablers: relatedEnablers.length,
        completedEnablers: completedEnablers.length,
        completionRate: relatedEnablers.length > 0
          ? Math.round((completedEnablers.length / relatedEnablers.length) * 100)
          : 0,
        priority: cap.priority,
        status: cap.status
      }
    })

    // Process enablers for timeline data
    enablers.forEach(enabler => {
      const createdDate = new Date(enabler.createdDate || now)
      const monthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyProgress[monthKey]) {
        monthlyProgress[monthKey] = { created: 0, completed: 0 }
      }

      monthlyProgress[monthKey].created++

      if (enabler.status === 'Implemented' || enabler.status === 'Deployed') {
        monthlyProgress[monthKey].completed++
      }
    })

    return {
      overview: {
        totalCapabilities: capabilities.length,
        totalEnablers: enablers.length,
        completedEnablers: enablers.filter(e =>
          e.status === 'Implemented' || e.status === 'Deployed'
        ).length,
        inProgressEnablers: enablers.filter(e =>
          e.status === 'In Implementation' || e.status === 'In Development'
        ).length
      },
      statusDistribution: statusCounts,
      priorityDistribution: priorityCounts,
      monthlyProgress,
      capabilityMetrics: Object.values(capabilityMetrics)
    }
  }, [capabilities, enablers])
}

// Individual Analytics Components
function MetricCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <Icon className="metric-icon" />
        <span className="metric-title">{title}</span>
      </div>
      <div className="metric-value">{value}</div>
      {subtitle && <div className="metric-subtitle">{subtitle}</div>}
      {trend && (
        <div className={`metric-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          <TrendingUp size={16} />
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  )
}

function StatusChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div className="chart-placeholder">No status data available</div>
  }

  const total = Object.values(data).reduce((sum, count) => sum + count, 0)
  const colors = {
    'Draft': '#6b7280',
    'In Review': '#f59e0b',
    'In Development': '#3b82f6',
    'Testing': '#8b5cf6',
    'Deployed': '#10b981',
    'Deprecated': '#ef4444'
  }

  return (
    <div className="status-chart">
      <h3>Status Distribution</h3>
      <div className="chart-bars">
        {Object.entries(data).map(([status, count]) => {
          const percentage = Math.round((count / total) * 100)
          return (
            <div key={status} className="chart-bar-group">
              <div className="chart-bar-label">
                <span>{status}</span>
                <span>{count} ({percentage}%)</span>
              </div>
              <div className="chart-bar-container">
                <div
                  className="chart-bar"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[status] || '#6b7280'
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CapabilityProgress({ metrics }) {
  if (!metrics || metrics.length === 0) {
    return <div className="chart-placeholder">No capability data available</div>
  }

  const sortedMetrics = metrics
    .filter(m => m.totalEnablers > 0)
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 10) // Top 10

  return (
    <div className="capability-progress">
      <h3>Capability Completion Progress</h3>
      <div className="progress-list">
        {sortedMetrics.map(metric => (
          <div key={metric.name} className="progress-item">
            <div className="progress-header">
              <span className="progress-name">{metric.name}</span>
              <span className="progress-stats">
                {metric.completedEnablers}/{metric.totalEnablers} ({metric.completionRate}%)
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${metric.completionRate}%` }}
              />
            </div>
            <div className="progress-meta">
              <span className={`priority-badge ${metric.priority?.toLowerCase()}`}>
                {metric.priority}
              </span>
              <span className={`status-badge ${metric.status?.toLowerCase()?.replace(/\s+/g, '-')}`}>
                {metric.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineChart({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return <div className="chart-placeholder">No timeline data available</div>
  }

  const months = Object.keys(data).sort().slice(-6) // Last 6 months
  const maxValue = Math.max(...months.map(month =>
    Math.max(data[month].created || 0, data[month].completed || 0)
  ))

  return (
    <div className="timeline-chart">
      <h3>Monthly Progress</h3>
      <div className="timeline-bars">
        {months.map(month => {
          const monthData = data[month]
          const createdHeight = maxValue > 0 ? (monthData.created / maxValue) * 100 : 0
          const completedHeight = maxValue > 0 ? (monthData.completed / maxValue) * 100 : 0

          return (
            <div key={month} className="timeline-group">
              <div className="timeline-bars-container">
                <div
                  className="timeline-bar created"
                  style={{ height: `${createdHeight}%` }}
                  title={`Created: ${monthData.created}`}
                />
                <div
                  className="timeline-bar completed"
                  style={{ height: `${completedHeight}%` }}
                  title={`Completed: ${monthData.completed}`}
                />
              </div>
              <div className="timeline-label">{month}</div>
            </div>
          )
        })}
      </div>
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-color created" />
          <span>Created</span>
        </div>
        <div className="legend-item">
          <div className="legend-color completed" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  )
}

// PreCog Market Intelligence Component
function PreCogIntelligence({ data, loading }) {
  if (loading) {
    return (
      <div className="precog-loading">
        <Brain className="precog-brain spinning" />
        <span>Analyzing market intelligence...</span>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="precog-intelligence">
      <h3><Brain size={20} /> Market Precognition</h3>
      <div className="intelligence-grid">
        <div className="intelligence-metric">
          <span className="metric-label">Market Trend</span>
          <span className={`metric-value trend-${data.marketTrend}`}>
            {data.marketTrend.toUpperCase()}
          </span>
        </div>
        <div className="intelligence-metric">
          <span className="metric-label">Confidence</span>
          <span className="metric-value">{Math.round(data.confidence * 100)}%</span>
        </div>
        <div className="intelligence-metric">
          <span className="metric-label">Success Probability</span>
          <span className="metric-value">{Math.round(data.successProbability * 100)}%</span>
        </div>
        <div className="intelligence-metric">
          <span className="metric-label">Risk Level</span>
          <span className={`metric-value risk-${data.riskLevel}`}>
            {data.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="key-insights">
        <h4>Key Insights</h4>
        <ul>
          {data.keyInsights.map((insight, index) => (
            <li key={index}>{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Real-Time Intelligence Processor
function RealTimeIntelligence({ intelligence, predictions }) {
  if (!intelligence || !predictions) return null

  return (
    <div className="realtime-intelligence">
      <h3><Activity size={20} /> Live Intelligence</h3>
      <div className="intelligence-dashboard">
        <div className="intel-section">
          <h4>Market Position</h4>
          <div className="position-indicator">
            <span className="position-label">Current Position:</span>
            <span className={`position-value ${intelligence.marketPosition.toLowerCase()}`}>
              {intelligence.marketPosition}
            </span>
          </div>
          <div className="growth-metric">
            <span className="growth-label">Industry Growth:</span>
            <span className="growth-value positive">{intelligence.industryGrowth}</span>
          </div>
        </div>

        <div className="intel-section">
          <h4>Threat Assessment</h4>
          <div className="threat-metrics">
            <div className="threat-item">
              <AlertTriangle size={16} className="threat-icon" />
              <span>{intelligence.competitiveThreats} Active Threats</span>
            </div>
            <div className="opportunity-item">
              <Zap size={16} className="opportunity-icon" />
              <span>{intelligence.marketOpportunities} Opportunities</span>
            </div>
          </div>
        </div>

        <div className="intel-section">
          <h4>Predictive Scores</h4>
          <div className="prediction-scores">
            <div className="score-item">
              <span className="score-label">Quality Forecast:</span>
              <span className="score-value high">{Math.round(predictions.qualityScore * 100)}%</span>
            </div>
            <div className="score-item">
              <span className="score-label">Delivery Probability:</span>
              <span className="score-value high">{Math.round(predictions.deliveryProbability * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Intelligence Alerts System
function IntelligenceAlerts({ predictions }) {
  if (!predictions || !predictions.recommendations) return null

  return (
    <div className="intelligence-alerts">
      <h3><AlertTriangle size={20} /> Intelligence Alerts</h3>
      <div className="alerts-list">
        {predictions.recommendations.map((rec, index) => (
          <div key={index} className="alert-item">
            <div className="alert-priority high"></div>
            <div className="alert-content">
              <span className="alert-text">{rec}</span>
              <span className="alert-timestamp">Just now</span>
            </div>
          </div>
        ))}
        {predictions.riskFactors.map((risk, index) => (
          <div key={`risk-${index}`} className="alert-item">
            <div className={`alert-priority ${risk.impact}`}></div>
            <div className="alert-content">
              <span className="alert-text">Risk: {risk.factor}</span>
              <span className="alert-detail">{Math.round(risk.probability * 100)}% probability</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Morgana's Crystal Ball Component
export default function AdvancedAnalytics() {
  const { enabled, config } = useAdvancedAnalytics()
  const analytics = useAnalyticsData()
  const { precogData, marketIntelligence, predictions, loading } = usePreCogAnalytics()
  const [refreshTime, setRefreshTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (config.realTimeMetrics) {
      const interval = setInterval(() => {
        setRefreshTime(new Date())
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [config.realTimeMetrics])

  if (!enabled) {
    return (
      <div className="analytics-disabled">
        <h2>Morgana's Crystal Ball</h2>
        <p>This feature is currently disabled. Enable it in the Feature Management settings to access advanced analytics and insights.</p>
      </div>
    )
  }

  const { overview, statusDistribution, priorityDistribution, monthlyProgress, capabilityMetrics } = analytics

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <h1>Enhanced Analytics</h1>
        <div className="analytics-meta">
          <span className="last-updated">
            <Clock size={16} />
            Updated: {refreshTime.toLocaleTimeString()}
          </span>
          {config.realTimeMetrics && (
            <span className="real-time-indicator">
              <div className="pulse-dot" />
              Real-time + PreCog
            </span>
          )}
        </div>
      </div>

      <div className="analytics-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={16} /> Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'precog' ? 'active' : ''}`}
          onClick={() => setActiveTab('precog')}
        >
          <Brain size={16} /> PreCog Intelligence
        </button>
        <button
          className={`tab-button ${activeTab === 'realtime' ? 'active' : ''}`}
          onClick={() => setActiveTab('realtime')}
        >
          <Activity size={16} /> Live Intelligence
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          {config.dashboardWidgets && (
            <div className="metrics-overview">
              <MetricCard
                title="Total Capabilities"
                value={overview.totalCapabilities}
                icon={Target}
              />
              <MetricCard
                title="Total Enablers"
                value={overview.totalEnablers}
                icon={FileText}
              />
              <MetricCard
                title="Completed"
                value={overview.completedEnablers}
                subtitle={`${Math.round((overview.completedEnablers / overview.totalEnablers) * 100) || 0}% complete`}
                icon={BarChart3}
              />
              <MetricCard
                title="In Progress"
                value={overview.inProgressEnablers}
                subtitle={`${Math.round((overview.inProgressEnablers / overview.totalEnablers) * 100) || 0}% active`}
                icon={Users}
              />
              {predictions && (
                <MetricCard
                  title="Quality Forecast"
                  value={`${Math.round(predictions.qualityScore * 100)}%`}
                  subtitle="AI Prediction"
                  icon={Brain}
                  trend={5}
                />
              )}
              {precogData && (
                <MetricCard
                  title="Success Probability"
                  value={`${Math.round(precogData.successProbability * 100)}%`}
                  subtitle="PreCog Analysis"
                  icon={Zap}
                  trend={8}
                />
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'overview' && (
        <div className="analytics-grid">
          <div className="analytics-card">
            <StatusChart data={statusDistribution} />
          </div>

          <div className="analytics-card">
            <CapabilityProgress metrics={capabilityMetrics} />
          </div>

          <div className="analytics-card">
            <TimelineChart data={monthlyProgress} />
          </div>

          <div className="analytics-card">
            <StatusChart data={priorityDistribution} />
          </div>
        </div>
      )}

      {activeTab === 'precog' && (
        <div className="precog-dashboard">
          <div className="precog-grid">
            <div className="analytics-card">
              <PreCogIntelligence data={precogData} loading={loading} />
            </div>

            <div className="analytics-card">
              <IntelligenceAlerts predictions={predictions} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'realtime' && (
        <div className="realtime-dashboard">
          <div className="analytics-card full-width">
            <RealTimeIntelligence
              intelligence={marketIntelligence}
              predictions={predictions}
            />
          </div>
        </div>
      )}

      {config.exportCharts && (
        <div className="analytics-actions">
          <button className="export-button" onClick={() => window.print()}>
            Export Analytics Report
          </button>
        </div>
      )}
    </div>
  )
}