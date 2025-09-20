#!/usr/bin/env node

/**
 * Feature Team Monitoring System
 * Enhanced monitoring specifically designed for parallel feature team development
 */

const fs = require('fs-extra')
const path = require('path')
const EventEmitter = require('events')
const axios = require('axios')

class FeatureTeamMonitor extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      monitoringInterval: 15000, // 15 seconds for feature team monitoring
      featureTeams: {
        'realtime-collaboration': {
          namespace: 'realtime',
          endpoints: [
            '/api/realtime/health',
            '/api/collaboration/status',
            '/api/websocket/ping'
          ],
          metrics: ['active_connections', 'message_latency', 'sync_conflicts'],
          alerts: {
            connection_threshold: 1000,
            latency_threshold: 100,
            conflict_rate_threshold: 0.05
          }
        },
        'ai-workflow': {
          namespace: 'ai-workflow',
          endpoints: [
            '/api/ai/health',
            '/api/workflow/status',
            '/api/agents/ping'
          ],
          metrics: ['active_workflows', 'ai_response_time', 'agent_utilization'],
          alerts: {
            workflow_queue_threshold: 100,
            ai_response_threshold: 5000,
            agent_utilization_threshold: 90
          }
        }
      },
      infrastructure: {
        loadBalancers: ['dev-lb.anvil.local', 'staging-lb.anvil.local'],
        databases: ['main-db', 'session-store', 'workflow-db'],
        services: ['redis', 'websocket-server', 'ai-service']
      },
      integrations: {
        qualityAgent: '/api/quality/metrics',
        deploymentCoordinator: '/api/deployment/status',
        performanceMonitor: '/api/monitoring/metrics'
      },
      ...options
    }

    this.teamMetrics = new Map()
    this.isolationMetrics = new Map()
    this.conflictDetector = new Map()
    this.alertHistory = []
    this.performanceBaselines = new Map()

    this.init()
  }

  async init() {
    this.log('Initializing Feature Team Monitor...', 'info')

    // Load existing baselines
    await this.loadPerformanceBaselines()

    // Initialize team-specific monitoring
    await this.initializeTeamMonitoring()

    // Start monitoring loops
    this.startFeatureTeamMonitoring()
    this.startIsolationMonitoring()
    this.startConflictDetection()

    this.log('Feature Team Monitor initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  🔍',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      team: '  👥',
      conflict: '  ⚡'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async loadPerformanceBaselines() {
    const baselineFile = path.join(__dirname, 'baselines', 'feature-team-baselines.json')

    try {
      if (await fs.pathExists(baselineFile)) {
        const baselines = await fs.readJSON(baselineFile)
        for (const [team, baseline] of Object.entries(baselines)) {
          this.performanceBaselines.set(team, baseline)
        }
        this.log(`Loaded baselines for ${this.performanceBaselines.size} teams`, 'info')
      }
    } catch (error) {
      this.log(`Failed to load baselines: ${error.message}`, 'error')
    }
  }

  async savePerformanceBaselines() {
    const baselineFile = path.join(__dirname, 'baselines', 'feature-team-baselines.json')

    try {
      await fs.ensureDir(path.dirname(baselineFile))
      const baselines = Object.fromEntries(this.performanceBaselines)
      await fs.writeJSON(baselineFile, baselines, { spaces: 2 })
    } catch (error) {
      this.log(`Failed to save baselines: ${error.message}`, 'error')
    }
  }

  async initializeTeamMonitoring() {
    for (const [teamName, teamConfig] of Object.entries(this.config.featureTeams)) {
      // Initialize metrics tracking
      this.teamMetrics.set(teamName, {
        endpoints: new Map(),
        customMetrics: new Map(),
        lastUpdate: null,
        status: 'initializing'
      })

      // Initialize isolation tracking
      this.isolationMetrics.set(teamName, {
        resourceUsage: {},
        conflicts: [],
        dependencies: new Set(),
        lastCheck: null
      })

      // Initialize conflict detection
      this.conflictDetector.set(teamName, {
        fileConflicts: [],
        apiConflicts: [],
        resourceConflicts: [],
        lastScan: null
      })

      this.log(`Initialized monitoring for team: ${teamName}`, 'team')
    }
  }

  startFeatureTeamMonitoring() {
    const monitorTeams = async () => {
      for (const [teamName, teamConfig] of Object.entries(this.config.featureTeams)) {
        try {
          await this.monitorTeam(teamName, teamConfig)
        } catch (error) {
          this.log(`Team monitoring failed for ${teamName}: ${error.message}`, 'error')
        }
      }
    }

    setInterval(monitorTeams, this.config.monitoringInterval)
    monitorTeams() // Run immediately

    this.log('Feature team monitoring started', 'success')
  }

  async monitorTeam(teamName, teamConfig) {
    const teamMetrics = this.teamMetrics.get(teamName)

    // Monitor endpoints
    for (const endpoint of teamConfig.endpoints) {
      try {
        const response = await this.checkEndpoint(endpoint)
        teamMetrics.endpoints.set(endpoint, {
          status: response.status,
          responseTime: response.responseTime,
          lastCheck: new Date()
        })
      } catch (error) {
        teamMetrics.endpoints.set(endpoint, {
          status: 'error',
          error: error.message,
          lastCheck: new Date()
        })

        this.emit('endpointFailure', { team: teamName, endpoint, error: error.message })
      }
    }

    // Collect custom metrics
    for (const metric of teamConfig.metrics) {
      try {
        const value = await this.collectCustomMetric(teamName, metric)
        teamMetrics.customMetrics.set(metric, {
          value,
          timestamp: new Date()
        })

        // Check against alerts
        await this.checkMetricAlerts(teamName, metric, value, teamConfig.alerts)

      } catch (error) {
        this.log(`Failed to collect metric ${metric} for ${teamName}: ${error.message}`, 'error')
      }
    }

    teamMetrics.lastUpdate = new Date()
    teamMetrics.status = 'active'

    // Update performance baselines
    await this.updatePerformanceBaseline(teamName, teamMetrics)

    this.emit('teamMetricsUpdated', { team: teamName, metrics: teamMetrics })
  }

  async checkEndpoint(endpoint) {
    const startTime = Date.now()

    try {
      // For local endpoints, check against running server
      const baseUrl = 'http://localhost:3000'
      const response = await axios.get(`${baseUrl}${endpoint}`, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      })

      return {
        status: response.status,
        responseTime: Date.now() - startTime,
        data: response.data
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return {
          status: 'offline',
          responseTime: Date.now() - startTime,
          error: 'Connection refused'
        }
      }

      throw error
    }
  }

  async collectCustomMetric(teamName, metricName) {
    // Simulate custom metric collection
    // In real implementation, this would query specific monitoring endpoints or databases

    switch (metricName) {
      case 'active_connections':
        return Math.floor(Math.random() * 1200) // Simulate 0-1200 connections

      case 'message_latency':
        return Math.floor(Math.random() * 150) // Simulate 0-150ms latency

      case 'sync_conflicts':
        return Math.random() * 0.1 // Simulate 0-10% conflict rate

      case 'active_workflows':
        return Math.floor(Math.random() * 80) // Simulate 0-80 active workflows

      case 'ai_response_time':
        return Math.floor(Math.random() * 8000) // Simulate 0-8000ms AI response time

      case 'agent_utilization':
        return Math.floor(Math.random() * 100) // Simulate 0-100% utilization

      default:
        return Math.random() * 100 // Default random metric
    }
  }

  async checkMetricAlerts(teamName, metricName, value, alertConfig) {
    const thresholdKey = `${metricName}_threshold`
    const threshold = alertConfig[thresholdKey]

    if (threshold !== undefined) {
      const exceeded = value > threshold

      if (exceeded) {
        const alert = {
          id: `alert-${Date.now()}-${teamName}-${metricName}`,
          team: teamName,
          metric: metricName,
          value,
          threshold,
          severity: this.calculateAlertSeverity(value, threshold),
          timestamp: new Date()
        }

        this.alertHistory.push(alert)
        this.emit('metricAlert', alert)

        this.log(`Alert: ${teamName} ${metricName} = ${value} exceeds threshold ${threshold}`, 'warning')
      }
    }
  }

  calculateAlertSeverity(value, threshold) {
    const ratio = value / threshold

    if (ratio >= 2.0) return 'critical'
    if (ratio >= 1.5) return 'high'
    if (ratio >= 1.2) return 'medium'
    return 'low'
  }

  async updatePerformanceBaseline(teamName, teamMetrics) {
    const currentBaseline = this.performanceBaselines.get(teamName) || {
      endpoints: {},
      metrics: {},
      samples: 0,
      created: new Date()
    }

    // Update endpoint baselines
    for (const [endpoint, data] of teamMetrics.endpoints) {
      if (data.status === 200 && data.responseTime) {
        const existing = currentBaseline.endpoints[endpoint] || { responseTime: 0, samples: 0 }

        // Running average
        existing.responseTime = ((existing.responseTime * existing.samples) + data.responseTime) / (existing.samples + 1)
        existing.samples++
        existing.lastUpdate = new Date()

        currentBaseline.endpoints[endpoint] = existing
      }
    }

    // Update metric baselines
    for (const [metric, data] of teamMetrics.customMetrics) {
      if (typeof data.value === 'number') {
        const existing = currentBaseline.metrics[metric] || { value: 0, samples: 0 }

        // Running average
        existing.value = ((existing.value * existing.samples) + data.value) / (existing.samples + 1)
        existing.samples++
        existing.lastUpdate = new Date()

        currentBaseline.metrics[metric] = existing
      }
    }

    currentBaseline.samples++
    currentBaseline.lastUpdate = new Date()

    this.performanceBaselines.set(teamName, currentBaseline)

    // Periodically save baselines
    if (currentBaseline.samples % 10 === 0) {
      await this.savePerformanceBaselines()
    }
  }

  startIsolationMonitoring() {
    const monitorIsolation = async () => {
      for (const [teamName] of this.config.featureTeams) {
        try {
          await this.monitorTeamIsolation(teamName)
        } catch (error) {
          this.log(`Isolation monitoring failed for ${teamName}: ${error.message}`, 'error')
        }
      }
    }

    setInterval(monitorIsolation, this.config.monitoringInterval * 2) // Less frequent
    monitorIsolation()

    this.log('Isolation monitoring started', 'success')
  }

  async monitorTeamIsolation(teamName) {
    const isolationMetrics = this.isolationMetrics.get(teamName)

    // Monitor resource usage
    isolationMetrics.resourceUsage = await this.collectResourceUsage(teamName)

    // Check for dependency conflicts
    const dependencyConflicts = await this.checkDependencyConflicts(teamName)
    isolationMetrics.conflicts = dependencyConflicts

    // Monitor namespace isolation
    const namespaceStatus = await this.checkNamespaceIsolation(teamName)
    isolationMetrics.namespaceStatus = namespaceStatus

    isolationMetrics.lastCheck = new Date()

    if (dependencyConflicts.length > 0) {
      this.emit('isolationViolation', { team: teamName, conflicts: dependencyConflicts })
    }
  }

  async collectResourceUsage(teamName) {
    // Simulate resource usage collection
    return {
      cpu: Math.random() * 100, // CPU percentage
      memory: Math.random() * 8192, // Memory in MB
      storage: Math.random() * 50000, // Storage in MB
      networkIn: Math.random() * 1000, // Network in Mbps
      networkOut: Math.random() * 1000 // Network out Mbps
    }
  }

  async checkDependencyConflicts(teamName) {
    const conflicts = []

    // Simulate dependency conflict detection
    // In real implementation, this would check shared resources, databases, etc.

    const conflictTypes = ['database_lock', 'shared_service', 'port_conflict', 'resource_limit']

    if (Math.random() < 0.1) { // 10% chance of conflict
      conflicts.push({
        type: conflictTypes[Math.floor(Math.random() * conflictTypes.length)],
        resource: `shared-resource-${Math.floor(Math.random() * 5)}`,
        severity: Math.random() > 0.7 ? 'high' : 'medium',
        timestamp: new Date()
      })
    }

    return conflicts
  }

  async checkNamespaceIsolation(teamName) {
    const teamConfig = this.config.featureTeams[teamName]

    return {
      namespace: teamConfig.namespace,
      isolated: true, // Assume good isolation
      violations: [],
      lastCheck: new Date()
    }
  }

  startConflictDetection() {
    const detectConflicts = async () => {
      for (const [teamName] of this.config.featureTeams) {
        try {
          await this.detectTeamConflicts(teamName)
        } catch (error) {
          this.log(`Conflict detection failed for ${teamName}: ${error.message}`, 'error')
        }
      }
    }

    setInterval(detectConflicts, this.config.monitoringInterval * 4) // Less frequent
    detectConflicts()

    this.log('Conflict detection started', 'success')
  }

  async detectTeamConflicts(teamName) {
    const conflictData = this.conflictDetector.get(teamName)

    // Detect file conflicts (git-based)
    conflictData.fileConflicts = await this.detectFileConflicts(teamName)

    // Detect API conflicts
    conflictData.apiConflicts = await this.detectApiConflicts(teamName)

    // Detect resource conflicts
    conflictData.resourceConflicts = await this.detectResourceConflicts(teamName)

    conflictData.lastScan = new Date()

    const totalConflicts = conflictData.fileConflicts.length +
                          conflictData.apiConflicts.length +
                          conflictData.resourceConflicts.length

    if (totalConflicts > 0) {
      this.emit('conflictsDetected', {
        team: teamName,
        conflicts: conflictData,
        total: totalConflicts
      })

      this.log(`Detected ${totalConflicts} conflicts for ${teamName}`, 'conflict')
    }
  }

  async detectFileConflicts(teamName) {
    // Simulate file conflict detection
    // In real implementation, this would check git merge conflicts

    const conflicts = []

    if (Math.random() < 0.05) { // 5% chance
      conflicts.push({
        file: `src/components/shared-component-${Math.floor(Math.random() * 10)}.js`,
        type: 'merge_conflict',
        teams: [teamName, Object.keys(this.config.featureTeams).find(t => t !== teamName)],
        severity: 'medium'
      })
    }

    return conflicts
  }

  async detectApiConflicts(teamName) {
    // Simulate API conflict detection
    const conflicts = []

    if (Math.random() < 0.03) { // 3% chance
      conflicts.push({
        endpoint: `/api/shared/endpoint-${Math.floor(Math.random() * 5)}`,
        type: 'endpoint_conflict',
        description: 'Multiple teams modifying same endpoint',
        severity: 'high'
      })
    }

    return conflicts
  }

  async detectResourceConflicts(teamName) {
    // Simulate resource conflict detection
    const conflicts = []

    if (Math.random() < 0.02) { // 2% chance
      conflicts.push({
        resource: `database-table-${Math.floor(Math.random() * 10)}`,
        type: 'schema_conflict',
        description: 'Conflicting schema changes',
        severity: 'high'
      })
    }

    return conflicts
  }

  async generateTeamReport(teamName) {
    if (!this.teamMetrics.has(teamName)) {
      throw new Error(`No monitoring data for team: ${teamName}`)
    }

    const teamMetrics = this.teamMetrics.get(teamName)
    const isolationMetrics = this.isolationMetrics.get(teamName)
    const conflictData = this.conflictDetector.get(teamName)
    const baseline = this.performanceBaselines.get(teamName)

    const report = {
      team: teamName,
      timestamp: new Date(),
      status: teamMetrics.status,
      performance: {
        endpoints: Object.fromEntries(teamMetrics.endpoints),
        metrics: Object.fromEntries(teamMetrics.customMetrics),
        baseline: baseline
      },
      isolation: {
        resourceUsage: isolationMetrics.resourceUsage,
        conflicts: isolationMetrics.conflicts,
        namespaceStatus: isolationMetrics.namespaceStatus
      },
      conflicts: {
        file: conflictData.fileConflicts,
        api: conflictData.apiConflicts,
        resource: conflictData.resourceConflicts,
        total: conflictData.fileConflicts.length +
               conflictData.apiConflicts.length +
               conflictData.resourceConflicts.length
      },
      alerts: this.alertHistory.filter(alert => alert.team === teamName).slice(-10),
      recommendations: await this.generateTeamRecommendations(teamName)
    }

    return report
  }

  async generateTeamRecommendations(teamName) {
    const recommendations = []
    const teamMetrics = this.teamMetrics.get(teamName)
    const conflictData = this.conflictDetector.get(teamName)
    const baseline = this.performanceBaselines.get(teamName)

    // Performance recommendations
    if (baseline && baseline.samples > 10) {
      for (const [endpoint, data] of teamMetrics.endpoints) {
        const baselineData = baseline.endpoints[endpoint]
        if (baselineData && data.responseTime > baselineData.responseTime * 1.5) {
          recommendations.push({
            type: 'performance',
            priority: 'medium',
            message: `Endpoint ${endpoint} response time degraded`,
            action: 'Investigate performance regression'
          })
        }
      }
    }

    // Conflict recommendations
    const totalConflicts = conflictData.fileConflicts.length +
                          conflictData.apiConflicts.length +
                          conflictData.resourceConflicts.length

    if (totalConflicts > 0) {
      recommendations.push({
        type: 'collaboration',
        priority: 'high',
        message: `${totalConflicts} conflicts detected`,
        action: 'Review and resolve conflicts before merge'
      })
    }

    // Resource recommendations
    const isolationMetrics = this.isolationMetrics.get(teamName)
    if (isolationMetrics.resourceUsage.cpu > 80) {
      recommendations.push({
        type: 'resources',
        priority: 'medium',
        message: 'High CPU usage detected',
        action: 'Consider optimization or resource scaling'
      })
    }

    return recommendations
  }

  getOverallStatus() {
    const status = {
      timestamp: Date.now(),
      teamsMonitored: this.teamMetrics.size,
      totalAlerts: this.alertHistory.length,
      activeAlerts: this.alertHistory.filter(alert =>
        Date.now() - alert.timestamp.getTime() < 300000 // Last 5 minutes
      ).length,
      teams: {}
    }

    for (const [teamName, teamMetrics] of this.teamMetrics) {
      const conflictData = this.conflictDetector.get(teamName)
      const isolationMetrics = this.isolationMetrics.get(teamName)

      status.teams[teamName] = {
        status: teamMetrics.status,
        lastUpdate: teamMetrics.lastUpdate,
        endpointsHealthy: Array.from(teamMetrics.endpoints.values()).filter(e => e.status === 200).length,
        totalEndpoints: teamMetrics.endpoints.size,
        conflicts: conflictData ? (
          conflictData.fileConflicts.length +
          conflictData.apiConflicts.length +
          conflictData.resourceConflicts.length
        ) : 0,
        isolationViolations: isolationMetrics ? isolationMetrics.conflicts.length : 0
      }
    }

    return status
  }
}

module.exports = FeatureTeamMonitor

// CLI interface
if (require.main === module) {
  const monitor = new FeatureTeamMonitor()

  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'status':
      console.log(JSON.stringify(monitor.getOverallStatus(), null, 2))
      break

    case 'report':
      const teamName = args[1]
      if (!teamName) {
        console.error('Usage: node feature-team-monitor.js report <team>')
        process.exit(1)
      }

      monitor.generateTeamReport(teamName).then(report => {
        console.log(JSON.stringify(report, null, 2))
      }).catch(error => {
        console.error(`Report generation failed: ${error.message}`)
        process.exit(1)
      })
      break

    default:
      console.log('Available commands: status, report <team>')
      console.log('Teams:', Object.keys(monitor.config.featureTeams).join(', '))

      // Start monitoring and keep process alive
      console.log('\n🚀 Feature Team Monitor started')
      console.log('Press Ctrl+C to stop')

      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Feature Team Monitor...')
        process.exit(0)
      })
  }
}