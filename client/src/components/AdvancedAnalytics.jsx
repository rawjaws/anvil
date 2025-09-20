import React, { useState, useEffect, useMemo } from 'react'
import { useApp } from '../contexts/AppContext'
import { useAdvancedAnalytics } from '../contexts/FeatureContext'
import { BarChart3, TrendingUp, Users, FileText, Clock, Target } from 'lucide-react'
import './AdvancedAnalytics.css'

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

// Main Advanced Analytics Component
export default function AdvancedAnalytics() {
  const { enabled, config } = useAdvancedAnalytics()
  const analytics = useAnalyticsData()
  const [refreshTime, setRefreshTime] = useState(new Date())

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
        <h2>Advanced Analytics</h2>
        <p>This feature is currently disabled. Enable it in the Feature Management settings to access advanced analytics and insights.</p>
      </div>
    )
  }

  const { overview, statusDistribution, priorityDistribution, monthlyProgress, capabilityMetrics } = analytics

  return (
    <div className="advanced-analytics">
      <div className="analytics-header">
        <h1>Advanced Analytics</h1>
        <div className="analytics-meta">
          <span className="last-updated">
            <Clock size={16} />
            Updated: {refreshTime.toLocaleTimeString()}
          </span>
          {config.realTimeMetrics && (
            <span className="real-time-indicator">
              <div className="pulse-dot" />
              Real-time
            </span>
          )}
        </div>
      </div>

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
        </div>
      )}

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