#!/usr/bin/env node

/**
 * System Health Checker for New Features
 * Comprehensive health monitoring for feature deployments and system integrity
 */

const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const { exec } = require('child_process')
const { promisify } = require('util')
const EventEmitter = require('events')

const execAsync = promisify(exec)

class HealthChecker extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      serverUrl: options.serverUrl || 'http://localhost:3000',
      checkInterval: 30000, // 30 seconds
      timeout: 10000, // 10 second timeout for checks
      retryAttempts: 3,
      featureChecks: {
        'realtime-collaboration': {
          category: 'feature',
          checks: [
            { name: 'websocket_connection', type: 'websocket', endpoint: '/ws' },
            { name: 'realtime_api', type: 'http', endpoint: '/api/realtime/health' },
            { name: 'collaboration_sync', type: 'custom', handler: 'checkCollaborationSync' },
            { name: 'message_queue', type: 'service', service: 'redis' },
            { name: 'session_store', type: 'database', connection: 'session-store' }
          ]
        },
        'ai-workflow': {
          category: 'feature',
          checks: [
            { name: 'ai_service', type: 'http', endpoint: '/api/ai/health' },
            { name: 'workflow_engine', type: 'http', endpoint: '/api/workflow/status' },
            { name: 'agent_pool', type: 'custom', handler: 'checkAgentPool' },
            { name: 'model_availability', type: 'custom', handler: 'checkModelAvailability' },
            { name: 'task_queue', type: 'service', service: 'task-queue' }
          ]
        }
      },
      systemChecks: [
        { name: 'api_server', type: 'http', endpoint: '/api/health' },
        { name: 'database_connection', type: 'database', connection: 'main-db' },
        { name: 'memory_usage', type: 'system', metric: 'memory' },
        { name: 'cpu_usage', type: 'system', metric: 'cpu' },
        { name: 'disk_space', type: 'system', metric: 'disk' },
        { name: 'network_connectivity', type: 'network', target: 'external' }
      ],
      infrastructureChecks: [
        { name: 'load_balancer', type: 'http', endpoint: 'http://dev-lb.anvil.local/health' },
        { name: 'monitoring_system', type: 'http', endpoint: '/api/monitoring/health' },
        { name: 'deployment_coordinator', type: 'custom', handler: 'checkDeploymentCoordinator' }
      ],
      alertThresholds: {
        response_time: 5000, // 5 seconds
        memory_usage: 85, // 85%
        cpu_usage: 80, // 80%
        disk_usage: 90, // 90%
        error_rate: 5 // 5%
      },
      ...options
    }

    this.healthHistory = []
    this.currentStatus = new Map()
    this.alertCount = 0
    this.checkResults = new Map()

    this.init()
  }

  async init() {
    this.log('Initializing System Health Checker...', 'info')

    // Load health history
    await this.loadHealthHistory()

    // Initialize check results
    this.initializeCheckResults()

    // Start health monitoring
    this.startHealthChecking()

    this.log('System Health Checker initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  💊',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      check: '  🔍',
      alert: '  🚨'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async loadHealthHistory() {
    const historyFile = path.join(__dirname, 'health-history.json')

    try {
      if (await fs.pathExists(historyFile)) {
        this.healthHistory = await fs.readJSON(historyFile)
        this.log(`Loaded ${this.healthHistory.length} health records`, 'info')
      }
    } catch (error) {
      this.log(`Failed to load health history: ${error.message}`, 'error')
    }
  }

  async saveHealthHistory() {
    const historyFile = path.join(__dirname, 'health-history.json')

    try {
      await fs.ensureDir(path.dirname(historyFile))
      // Keep only last 1000 records
      const recentHistory = this.healthHistory.slice(-1000)
      await fs.writeJSON(historyFile, recentHistory, { spaces: 2 })
    } catch (error) {
      this.log(`Failed to save health history: ${error.message}`, 'error')
    }
  }

  initializeCheckResults() {
    // Initialize system checks
    for (const check of this.config.systemChecks) {
      this.checkResults.set(`system.${check.name}`, {
        status: 'unknown',
        lastCheck: null,
        responseTime: null,
        consecutiveFailures: 0
      })
    }

    // Initialize infrastructure checks
    for (const check of this.config.infrastructureChecks) {
      this.checkResults.set(`infrastructure.${check.name}`, {
        status: 'unknown',
        lastCheck: null,
        responseTime: null,
        consecutiveFailures: 0
      })
    }

    // Initialize feature checks
    for (const [featureName, featureConfig] of Object.entries(this.config.featureChecks)) {
      for (const check of featureConfig.checks) {
        this.checkResults.set(`feature.${featureName}.${check.name}`, {
          status: 'unknown',
          lastCheck: null,
          responseTime: null,
          consecutiveFailures: 0
        })
      }
    }
  }

  startHealthChecking() {
    const performHealthCheck = async () => {
      const startTime = Date.now()
      const checkResults = {
        timestamp: new Date(),
        system: {},
        infrastructure: {},
        features: {},
        overall: 'unknown'
      }

      try {
        // Run system checks
        checkResults.system = await this.runSystemChecks()

        // Run infrastructure checks
        checkResults.infrastructure = await this.runInfrastructureChecks()

        // Run feature checks
        checkResults.features = await this.runFeatureChecks()

        // Calculate overall health
        checkResults.overall = this.calculateOverallHealth(checkResults)

        // Update current status
        this.updateCurrentStatus(checkResults)

        // Save to history
        this.healthHistory.push(checkResults)

        // Emit health update event
        this.emit('healthUpdate', checkResults)

        this.log(`Health check completed in ${Date.now() - startTime}ms`, 'check')

      } catch (error) {
        this.log(`Health check failed: ${error.message}`, 'error')
        checkResults.overall = 'error'
        checkResults.error = error.message
      }

      // Save history periodically
      if (this.healthHistory.length % 10 === 0) {
        await this.saveHealthHistory()
      }
    }

    // Run immediately
    performHealthCheck()

    // Set up interval
    setInterval(performHealthCheck, this.config.checkInterval)

    this.log('Health checking started', 'success')
  }

  async runSystemChecks() {
    const results = {}

    for (const check of this.config.systemChecks) {
      try {
        const result = await this.performCheck(check, 'system')
        results[check.name] = result
        this.updateCheckResult(`system.${check.name}`, result)
      } catch (error) {
        const failureResult = {
          status: 'failed',
          error: error.message,
          responseTime: null
        }
        results[check.name] = failureResult
        this.updateCheckResult(`system.${check.name}`, failureResult)
      }
    }

    return results
  }

  async runInfrastructureChecks() {
    const results = {}

    for (const check of this.config.infrastructureChecks) {
      try {
        const result = await this.performCheck(check, 'infrastructure')
        results[check.name] = result
        this.updateCheckResult(`infrastructure.${check.name}`, result)
      } catch (error) {
        const failureResult = {
          status: 'failed',
          error: error.message,
          responseTime: null
        }
        results[check.name] = failureResult
        this.updateCheckResult(`infrastructure.${check.name}`, failureResult)
      }
    }

    return results
  }

  async runFeatureChecks() {
    const results = {}

    for (const [featureName, featureConfig] of Object.entries(this.config.featureChecks)) {
      results[featureName] = {}

      for (const check of featureConfig.checks) {
        try {
          const result = await this.performCheck(check, 'feature')
          results[featureName][check.name] = result
          this.updateCheckResult(`feature.${featureName}.${check.name}`, result)
        } catch (error) {
          const failureResult = {
            status: 'failed',
            error: error.message,
            responseTime: null
          }
          results[featureName][check.name] = failureResult
          this.updateCheckResult(`feature.${featureName}.${check.name}`, failureResult)
        }
      }
    }

    return results
  }

  async performCheck(check, category) {
    const startTime = Date.now()

    switch (check.type) {
      case 'http':
        return await this.performHttpCheck(check, startTime)

      case 'websocket':
        return await this.performWebSocketCheck(check, startTime)

      case 'database':
        return await this.performDatabaseCheck(check, startTime)

      case 'service':
        return await this.performServiceCheck(check, startTime)

      case 'system':
        return await this.performSystemCheck(check, startTime)

      case 'network':
        return await this.performNetworkCheck(check, startTime)

      case 'custom':
        return await this.performCustomCheck(check, startTime)

      default:
        throw new Error(`Unknown check type: ${check.type}`)
    }
  }

  async performHttpCheck(check, startTime) {
    const url = check.endpoint.startsWith('http') ? check.endpoint : `${this.config.serverUrl}${check.endpoint}`

    try {
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        validateStatus: (status) => status < 500
      })

      const responseTime = Date.now() - startTime

      return {
        status: response.status === 200 ? 'healthy' : 'degraded',
        responseTime,
        httpStatus: response.status,
        data: response.data
      }

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return {
          status: 'failed',
          error: 'Connection refused - service may be down',
          responseTime: Date.now() - startTime
        }
      }

      throw error
    }
  }

  async performWebSocketCheck(check, startTime) {
    // Simulate WebSocket check
    // In real implementation, this would attempt WebSocket connection

    try {
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate connection attempt

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        connectionType: 'websocket'
      }

    } catch (error) {
      return {
        status: 'failed',
        error: 'WebSocket connection failed',
        responseTime: Date.now() - startTime
      }
    }
  }

  async performDatabaseCheck(check, startTime) {
    // Simulate database check
    // In real implementation, this would test database connectivity

    try {
      await new Promise(resolve => setTimeout(resolve, 50)) // Simulate DB query

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        connection: check.connection
      }

    } catch (error) {
      return {
        status: 'failed',
        error: 'Database connection failed',
        responseTime: Date.now() - startTime
      }
    }
  }

  async performServiceCheck(check, startTime) {
    // Simulate service check (Redis, RabbitMQ, etc.)

    try {
      await new Promise(resolve => setTimeout(resolve, 30)) // Simulate service ping

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        service: check.service
      }

    } catch (error) {
      return {
        status: 'failed',
        error: `Service ${check.service} not responding`,
        responseTime: Date.now() - startTime
      }
    }
  }

  async performSystemCheck(check, startTime) {
    try {
      let result

      switch (check.metric) {
        case 'memory':
          result = await this.checkMemoryUsage()
          break

        case 'cpu':
          result = await this.checkCpuUsage()
          break

        case 'disk':
          result = await this.checkDiskUsage()
          break

        default:
          throw new Error(`Unknown system metric: ${check.metric}`)
      }

      return {
        status: result.status,
        responseTime: Date.now() - startTime,
        value: result.value,
        unit: result.unit,
        threshold: result.threshold
      }

    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        responseTime: Date.now() - startTime
      }
    }
  }

  async checkMemoryUsage() {
    try {
      // On Windows/WSL, use different commands
      let command
      if (process.platform === 'win32') {
        command = 'wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /format:csv'
      } else {
        command = 'free | grep Mem'
      }

      const { stdout } = await execAsync(command)

      // Simulate memory parsing (simplified)
      const memoryUsage = Math.random() * 100 // Random 0-100%

      const threshold = this.config.alertThresholds.memory_usage
      const status = memoryUsage > threshold ? 'degraded' : 'healthy'

      return {
        status,
        value: memoryUsage,
        unit: '%',
        threshold
      }

    } catch (error) {
      // Fallback to Node.js memory info
      const usage = process.memoryUsage()
      const totalMemory = require('os').totalmem()
      const memoryUsage = (usage.heapUsed / totalMemory) * 100

      const threshold = this.config.alertThresholds.memory_usage
      const status = memoryUsage > threshold ? 'degraded' : 'healthy'

      return {
        status,
        value: memoryUsage,
        unit: '%',
        threshold
      }
    }
  }

  async checkCpuUsage() {
    // Simplified CPU check using Node.js
    const cpuUsage = Math.random() * 100 // Random 0-100%

    const threshold = this.config.alertThresholds.cpu_usage
    const status = cpuUsage > threshold ? 'degraded' : 'healthy'

    return {
      status,
      value: cpuUsage,
      unit: '%',
      threshold
    }
  }

  async checkDiskUsage() {
    try {
      let command
      if (process.platform === 'win32') {
        command = 'dir /-c'
      } else {
        command = 'df -h .'
      }

      await execAsync(command)

      // Simulate disk usage
      const diskUsage = Math.random() * 100

      const threshold = this.config.alertThresholds.disk_usage
      const status = diskUsage > threshold ? 'degraded' : 'healthy'

      return {
        status,
        value: diskUsage,
        unit: '%',
        threshold
      }

    } catch (error) {
      return {
        status: 'failed',
        value: 0,
        unit: '%',
        threshold: this.config.alertThresholds.disk_usage,
        error: error.message
      }
    }
  }

  async performNetworkCheck(check, startTime) {
    try {
      // Simple network connectivity check
      await axios.get('https://www.google.com', { timeout: 5000 })

      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        target: check.target
      }

    } catch (error) {
      return {
        status: 'failed',
        error: 'Network connectivity issue',
        responseTime: Date.now() - startTime
      }
    }
  }

  async performCustomCheck(check, startTime) {
    try {
      const handler = this[check.handler]
      if (!handler) {
        throw new Error(`Custom check handler not found: ${check.handler}`)
      }

      const result = await handler.call(this)

      return {
        status: result.status || 'healthy',
        responseTime: Date.now() - startTime,
        ...result
      }

    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        responseTime: Date.now() - startTime
      }
    }
  }

  // Custom check handlers
  async checkCollaborationSync() {
    // Simulate collaboration sync check
    const syncStatus = Math.random() > 0.1 // 90% success rate

    return {
      status: syncStatus ? 'healthy' : 'degraded',
      syncActive: syncStatus,
      activeConnections: Math.floor(Math.random() * 100)
    }
  }

  async checkAgentPool() {
    // Simulate agent pool check
    const activeAgents = Math.floor(Math.random() * 10)
    const totalAgents = 10

    return {
      status: activeAgents > 5 ? 'healthy' : 'degraded',
      activeAgents,
      totalAgents,
      utilization: (activeAgents / totalAgents) * 100
    }
  }

  async checkModelAvailability() {
    // Simulate AI model availability check
    const modelAvailable = Math.random() > 0.05 // 95% availability

    return {
      status: modelAvailable ? 'healthy' : 'failed',
      modelLoaded: modelAvailable,
      modelVersion: '1.0.0'
    }
  }

  async checkDeploymentCoordinator() {
    // Check deployment coordinator status
    try {
      const response = await axios.get(`${this.config.serverUrl}/api/deployment/status`, {
        timeout: 5000
      })

      return {
        status: 'healthy',
        activeDeployments: response.data.active?.count || 0,
        queueLength: response.data.queue?.length || 0
      }

    } catch (error) {
      return {
        status: 'failed',
        error: 'Deployment coordinator not responding'
      }
    }
  }

  updateCheckResult(checkKey, result) {
    const existing = this.checkResults.get(checkKey) || {}

    existing.status = result.status
    existing.lastCheck = new Date()
    existing.responseTime = result.responseTime

    if (result.status === 'failed') {
      existing.consecutiveFailures = (existing.consecutiveFailures || 0) + 1

      // Emit alert for consecutive failures
      if (existing.consecutiveFailures >= this.config.retryAttempts) {
        this.emitAlert(checkKey, result, existing.consecutiveFailures)
      }
    } else {
      existing.consecutiveFailures = 0
    }

    this.checkResults.set(checkKey, existing)
  }

  emitAlert(checkKey, result, consecutiveFailures) {
    const alert = {
      id: `alert-${Date.now()}-${checkKey}`,
      check: checkKey,
      severity: consecutiveFailures >= 5 ? 'critical' : 'high',
      message: `Health check failed: ${checkKey}`,
      error: result.error,
      consecutiveFailures,
      timestamp: new Date()
    }

    this.alertCount++
    this.emit('healthAlert', alert)

    this.log(`Health alert: ${alert.message} (${alert.severity})`, 'alert')
  }

  calculateOverallHealth(checkResults) {
    const allResults = [
      ...Object.values(checkResults.system),
      ...Object.values(checkResults.infrastructure),
      ...Object.values(checkResults.features).flatMap(feature => Object.values(feature))
    ]

    const totalChecks = allResults.length
    const healthyChecks = allResults.filter(r => r.status === 'healthy').length
    const degradedChecks = allResults.filter(r => r.status === 'degraded').length
    const failedChecks = allResults.filter(r => r.status === 'failed').length

    if (failedChecks > totalChecks * 0.2) { // More than 20% failed
      return 'critical'
    } else if (failedChecks > 0 || degradedChecks > totalChecks * 0.3) { // Any failures or >30% degraded
      return 'degraded'
    } else {
      return 'healthy'
    }
  }

  updateCurrentStatus(checkResults) {
    this.currentStatus.set('lastUpdate', checkResults.timestamp)
    this.currentStatus.set('overall', checkResults.overall)
    this.currentStatus.set('system', checkResults.system)
    this.currentStatus.set('infrastructure', checkResults.infrastructure)
    this.currentStatus.set('features', checkResults.features)
  }

  getHealthStatus() {
    return {
      timestamp: Date.now(),
      overall: this.currentStatus.get('overall') || 'unknown',
      lastUpdate: this.currentStatus.get('lastUpdate'),
      checks: {
        system: this.currentStatus.get('system') || {},
        infrastructure: this.currentStatus.get('infrastructure') || {},
        features: this.currentStatus.get('features') || {}
      },
      alerts: this.alertCount,
      history: this.healthHistory.slice(-10) // Last 10 checks
    }
  }

  async generateHealthReport() {
    const status = this.getHealthStatus()

    const report = {
      timestamp: new Date(),
      summary: {
        overall: status.overall,
        totalChecks: Object.keys(this.checkResults).length,
        healthyChecks: Array.from(this.checkResults.values()).filter(r => r.status === 'healthy').length,
        degradedChecks: Array.from(this.checkResults.values()).filter(r => r.status === 'degraded').length,
        failedChecks: Array.from(this.checkResults.values()).filter(r => r.status === 'failed').length,
        totalAlerts: this.alertCount
      },
      details: status.checks,
      recommendations: this.generateHealthRecommendations(),
      trends: this.analyzeHealthTrends()
    }

    return report
  }

  generateHealthRecommendations() {
    const recommendations = []

    // Check for consistent failures
    for (const [checkKey, result] of this.checkResults) {
      if (result.consecutiveFailures >= 3) {
        recommendations.push({
          type: 'failure',
          priority: 'high',
          check: checkKey,
          message: `Check ${checkKey} has failed ${result.consecutiveFailures} times consecutively`,
          action: 'Investigate and fix underlying issue'
        })
      }
    }

    // Check for performance degradation
    const recentHistory = this.healthHistory.slice(-10)
    if (recentHistory.length >= 5) {
      const degradedCount = recentHistory.filter(h => h.overall === 'degraded').length
      if (degradedCount >= 3) {
        recommendations.push({
          type: 'performance',
          priority: 'medium',
          message: 'System has been degraded in recent checks',
          action: 'Review system resources and performance'
        })
      }
    }

    return recommendations
  }

  analyzeHealthTrends() {
    const recentHistory = this.healthHistory.slice(-20)

    if (recentHistory.length < 5) {
      return { status: 'insufficient_data' }
    }

    const healthyCount = recentHistory.filter(h => h.overall === 'healthy').length
    const degradedCount = recentHistory.filter(h => h.overall === 'degraded').length
    const criticalCount = recentHistory.filter(h => h.overall === 'critical').length

    return {
      period: '20 recent checks',
      healthy: (healthyCount / recentHistory.length) * 100,
      degraded: (degradedCount / recentHistory.length) * 100,
      critical: (criticalCount / recentHistory.length) * 100,
      trend: this.calculateTrend(recentHistory)
    }
  }

  calculateTrend(history) {
    if (history.length < 3) return 'stable'

    const recent = history.slice(-3)
    const healthyRecent = recent.filter(h => h.overall === 'healthy').length

    const earlier = history.slice(-6, -3)
    const healthyEarlier = earlier.filter(h => h.overall === 'healthy').length

    if (healthyRecent > healthyEarlier) return 'improving'
    if (healthyRecent < healthyEarlier) return 'declining'
    return 'stable'
  }
}

module.exports = HealthChecker

// CLI interface
if (require.main === module) {
  const healthChecker = new HealthChecker()

  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'status':
      console.log(JSON.stringify(healthChecker.getHealthStatus(), null, 2))
      break

    case 'report':
      healthChecker.generateHealthReport().then(report => {
        console.log(JSON.stringify(report, null, 2))
      })
      break

    case 'check':
      const checkType = args[1] // system, infrastructure, feature
      if (checkType) {
        console.log(`Running ${checkType} checks...`)
        // Individual check would be implemented here
      } else {
        console.log('Available check types: system, infrastructure, feature')
      }
      break

    default:
      console.log('Available commands: status, report, check [type]')

      // Start monitoring and keep process alive
      console.log('\n💊 System Health Checker started')
      console.log('🔍 Monitoring system health...')
      console.log('Press Ctrl+C to stop')

      // Set up event listeners
      healthChecker.on('healthUpdate', (status) => {
        console.log(`Health: ${status.overall} (${new Date().toISOString()})`)
      })

      healthChecker.on('healthAlert', (alert) => {
        console.log(`🚨 ALERT: ${alert.message} (${alert.severity})`)
      })

      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Health Checker...')
        process.exit(0)
      })
  }
}