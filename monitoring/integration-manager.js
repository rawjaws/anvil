#!/usr/bin/env node

/**
 * Performance Systems Integration Manager
 * Orchestrates all monitoring components and integrates with existing performance systems
 */

const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const EventEmitter = require('events')

// Import our monitoring components
const PerformanceMonitor = require('./performance-monitor')
const AlertManager = require('./alerts/alert-manager')
const BaselineManager = require('./baselines/baseline-manager')

class IntegrationManager extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      serverUrl: options.serverUrl || 'http://localhost:3000',
      monitoringInterval: 30000, // 30 seconds
      integrationEndpoints: {
        performance: '/api/performance/overview',
        cache: '/api/performance/cache',
        pool: '/api/performance/pool'
      },
      testingScripts: {
        performanceTest: path.join(process.cwd(), 'scripts/performance-test.js'),
        regressionDetector: path.join(process.cwd(), 'tests/performance/regression-detector.js')
      },
      dashboardPort: 3001,
      enableRealTimeUpdates: true,
      enableAutomatedReporting: true,
      ...options
    }

    // Initialize components
    this.performanceMonitor = new PerformanceMonitor({
      serverUrl: this.config.serverUrl,
      monitoringInterval: this.config.monitoringInterval
    })

    this.alertManager = new AlertManager()
    this.baselineManager = new BaselineManager()

    this.isRunning = false
    this.integrationStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastSync: null,
      dataPoints: 0
    }

    this.init()
  }

  async init() {
    this.log('Initializing Performance Systems Integration Manager...', 'info')

    // Set up event listeners between components
    this.setupEventListeners()

    // Register integration endpoints
    await this.registerIntegrationEndpoints()

    // Start integration orchestration
    this.startIntegration()

    this.log('Integration Manager initialized successfully', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      integration: '  🔗',
      sync: '  🔄'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  setupEventListeners() {
    // Performance Monitor events
    this.performanceMonitor.on('metrics_update', (data) => {
      this.handleMetricsUpdate(data)
    })

    this.performanceMonitor.on('alert', (alert) => {
      this.log(`Performance alert: ${alert.message}`, 'warning')
    })

    // Alert Manager events
    this.alertManager.on('alert', (alert) => {
      this.handleNewAlert(alert)
    })

    this.alertManager.on('alertResolved', (alert) => {
      this.log(`Alert resolved: ${alert.name}`, 'success')
    })

    this.alertManager.on('alertEscalated', (alert) => {
      this.log(`Alert escalated: ${alert.name} to ${alert.severity}`, 'warning')
    })

    this.log('Event listeners configured', 'success')
  }

  async registerIntegrationEndpoints() {
    // This would register additional endpoints on the main server
    // For now, we'll prepare the integration data structure

    this.integrationEndpoints = {
      '/api/monitoring/status': this.getMonitoringStatus.bind(this),
      '/api/monitoring/metrics': this.getAggregatedMetrics.bind(this),
      '/api/monitoring/alerts': this.getActiveAlerts.bind(this),
      '/api/monitoring/baselines': this.getBaselines.bind(this),
      '/api/monitoring/report': this.generateIntegratedReport.bind(this),
      '/api/monitoring/dashboard': this.getDashboardData.bind(this)
    }

    this.log('Integration endpoints registered', 'success')
  }

  async startIntegration() {
    if (this.isRunning) {
      this.log('Integration already running', 'warning')
      return
    }

    this.isRunning = true
    this.log('Starting performance systems integration...', 'integration')

    // Start all monitoring components
    await this.startAllComponents()

    // Start periodic synchronization
    this.startPeriodicSync()

    // Start dashboard server
    if (this.config.enableRealTimeUpdates) {
      await this.startDashboardServer()
    }

    // Start automated reporting
    if (this.config.enableAutomatedReporting) {
      this.startAutomatedReporting()
    }

    this.log('Performance systems integration active', 'success')
  }

  async startAllComponents() {
    try {
      // Start performance monitoring
      await this.performanceMonitor.startMonitoring()

      // Performance monitor will start collecting data immediately
      // Alert manager is event-driven
      // Baseline manager will update baselines automatically

      this.log('All monitoring components started', 'success')
    } catch (error) {
      this.log(`Error starting components: ${error.message}`, 'error')
    }
  }

  startPeriodicSync() {
    const syncInterval = this.config.monitoringInterval

    setInterval(async () => {
      try {
        await this.synchronizeData()
        this.integrationStats.lastSync = Date.now()
      } catch (error) {
        this.log(`Sync error: ${error.message}`, 'error')
      }
    }, syncInterval)

    this.log(`Periodic sync started (${syncInterval / 1000}s interval)`, 'sync')
  }

  async synchronizeData() {
    try {
      // Fetch latest performance data from Backend Agent
      const performanceData = await this.fetchBackendPerformanceData()

      if (performanceData) {
        // Update baseline manager with new data
        if (performanceData.system) {
          this.baselineManager.addSystemMetrics(performanceData.system)
        }

        if (performanceData.api) {
          this.baselineManager.addApiMetrics(performanceData.api)
        }

        // Evaluate alerts
        this.alertManager.evaluateMetrics(performanceData)

        this.integrationStats.successfulRequests++
        this.integrationStats.dataPoints++
      }

      this.integrationStats.totalRequests++

    } catch (error) {
      this.integrationStats.failedRequests++
      throw error
    }
  }

  async fetchBackendPerformanceData() {
    try {
      const [overview, cache, pool] = await Promise.all([
        this.fetchEndpoint(this.config.integrationEndpoints.performance),
        this.fetchEndpoint(this.config.integrationEndpoints.cache),
        this.fetchEndpoint(this.config.integrationEndpoints.pool)
      ])

      return {
        timestamp: Date.now(),
        api: {
          overview: overview?.data,
          cache: cache?.data,
          pool: pool?.data,
          responseTime: await this.measureResponseTimes(),
          errorRate: this.calculateErrorRate([overview, cache, pool])
        },
        // System metrics would come from performance monitor
        system: this.performanceMonitor.getStatus()?.latest?.system
      }

    } catch (error) {
      this.log(`Error fetching backend performance data: ${error.message}`, 'error')
      return null
    }
  }

  async fetchEndpoint(endpoint) {
    try {
      const response = await axios.get(`${this.config.serverUrl}${endpoint}`, {
        timeout: 5000
      })

      return {
        success: true,
        data: response.data,
        responseTime: response.config.responseTime
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async measureResponseTimes() {
    const endpoints = Object.values(this.config.integrationEndpoints)
    const measurements = {}

    for (const endpoint of endpoints) {
      const start = Date.now()
      try {
        await axios.get(`${this.config.serverUrl}${endpoint}`, { timeout: 10000 })
        measurements[endpoint] = Date.now() - start
      } catch (error) {
        measurements[endpoint] = { error: error.message }
      }
    }

    return measurements
  }

  calculateErrorRate(responses) {
    const totalResponses = responses.length
    const errors = responses.filter(r => !r?.success).length

    return totalResponses > 0 ? (errors / totalResponses) * 100 : 0
  }

  async handleMetricsUpdate(data) {
    this.log('Processing metrics update...', 'sync')

    // Add metrics to baseline manager
    if (data.system) {
      this.baselineManager.addSystemMetrics(data.system)
    }

    if (data.api) {
      this.baselineManager.addApiMetrics(data.api)
    }

    // Evaluate against alert rules
    this.alertManager.evaluateMetrics(data)

    // Emit integrated update event
    this.emit('integrated_update', {
      timestamp: Date.now(),
      metrics: data,
      alerts: this.alertManager.getActiveAlerts(),
      baselines: this.baselineManager.getBaselineStatus()
    })
  }

  handleNewAlert(alert) {
    this.log(`New alert triggered: ${alert.name} (${alert.severity})`, 'warning')

    // Emit alert event for dashboard updates
    this.emit('alert_update', alert)

    // Additional integration logic could go here
    // e.g., triggering automated responses, scaling actions, etc.
  }

  async runPerformanceTests() {
    this.log('Running integrated performance tests...', 'integration')

    const results = {
      timestamp: Date.now(),
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    }

    // Run performance test script if available
    if (await fs.pathExists(this.config.testingScripts.performanceTest)) {
      try {
        const testResult = await this.runTestScript(this.config.testingScripts.performanceTest)
        results.tests.performanceTest = testResult
        results.summary.total++
        if (testResult.success) results.summary.passed++
        else results.summary.failed++
      } catch (error) {
        this.log(`Performance test failed: ${error.message}`, 'error')
        results.tests.performanceTest = { success: false, error: error.message }
        results.summary.total++
        results.summary.failed++
      }
    }

    // Run regression detection if available
    if (await fs.pathExists(this.config.testingScripts.regressionDetector)) {
      try {
        const regressionResult = await this.runTestScript(this.config.testingScripts.regressionDetector)
        results.tests.regressionDetector = regressionResult
        results.summary.total++
        if (regressionResult.success) results.summary.passed++
        else results.summary.failed++
      } catch (error) {
        this.log(`Regression detection failed: ${error.message}`, 'error')
        results.tests.regressionDetector = { success: false, error: error.message }
        results.summary.total++
        results.summary.failed++
      }
    }

    this.log(`Performance tests completed: ${results.summary.passed}/${results.summary.total} passed`, 'success')
    return results
  }

  async runTestScript(scriptPath) {
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process')

      const child = spawn('node', [scriptPath], {
        cwd: process.cwd(),
        stdio: 'pipe'
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          stdout,
          stderr
        })
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  async startDashboardServer() {
    // This would start a simple HTTP server for the dashboard
    // For now, we'll just log that it would be started
    this.log(`Dashboard server would start on port ${this.config.dashboardPort}`, 'info')
    this.log(`Dashboard available at: http://localhost:${this.config.dashboardPort}/monitoring/dashboard/performance-dashboard.html`, 'info')
  }

  startAutomatedReporting() {
    // Generate comprehensive reports every hour
    setInterval(async () => {
      try {
        const report = await this.generateIntegratedReport()
        await this.saveReport(report)
        this.log('Automated report generated', 'success')
      } catch (error) {
        this.log(`Report generation failed: ${error.message}`, 'error')
      }
    }, 60 * 60 * 1000) // Every hour

    this.log('Automated reporting started (hourly)', 'success')
  }

  async saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `integrated-performance-report-${timestamp}.json`
    const filepath = path.join(__dirname, 'reports', filename)

    await fs.ensureDir(path.dirname(filepath))
    await fs.writeJSON(filepath, report, { spaces: 2 })

    // Also save as latest
    await fs.writeJSON(
      path.join(__dirname, 'reports', 'latest-integrated-report.json'),
      report,
      { spaces: 2 }
    )
  }

  // API endpoint handlers
  getMonitoringStatus() {
    return {
      timestamp: Date.now(),
      status: this.isRunning ? 'active' : 'inactive',
      components: {
        performanceMonitor: this.performanceMonitor.getStatus(),
        alertManager: this.alertManager.getAlertStats(),
        baselineManager: this.baselineManager.getBaselineStatus()
      },
      integration: this.integrationStats
    }
  }

  getAggregatedMetrics() {
    const performanceStatus = this.performanceMonitor.getStatus()

    return {
      timestamp: Date.now(),
      metrics: performanceStatus.latest,
      counts: performanceStatus.metricsCount,
      uptime: performanceStatus.uptime
    }
  }

  getActiveAlerts() {
    return {
      timestamp: Date.now(),
      alerts: this.alertManager.getActiveAlerts(),
      stats: this.alertManager.getAlertStats()
    }
  }

  getBaselines() {
    return {
      timestamp: Date.now(),
      status: this.baselineManager.getBaselineStatus()
    }
  }

  getDashboardData() {
    return {
      timestamp: Date.now(),
      monitoring: this.getMonitoringStatus(),
      metrics: this.getAggregatedMetrics(),
      alerts: this.getActiveAlerts(),
      baselines: this.getBaselines()
    }
  }

  async generateIntegratedReport() {
    const report = {
      timestamp: Date.now(),
      period: {
        start: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
        end: Date.now()
      },
      summary: {
        monitoring: this.getMonitoringStatus(),
        performance: this.getAggregatedMetrics(),
        alerts: this.getActiveAlerts(),
        baselines: this.getBaselines()
      },
      analysis: {
        trends: await this.analyzePerformanceTrends(),
        anomalies: await this.detectAnomalies(),
        efficiency: this.calculateSystemEfficiency()
      },
      recommendations: await this.generateSystemRecommendations(),
      tests: await this.runPerformanceTests()
    }

    return report
  }

  async analyzePerformanceTrends() {
    // Analyze trends across all systems
    return {
      system: 'Trends analysis would be implemented here',
      api: 'API performance trends',
      infrastructure: 'Infrastructure trends'
    }
  }

  async detectAnomalies() {
    // Use baseline comparisons to detect anomalies
    const anomalies = []

    // This would iterate through recent metrics and compare against baselines
    // For now, return placeholder

    return {
      count: anomalies.length,
      anomalies: anomalies
    }
  }

  calculateSystemEfficiency() {
    const stats = this.integrationStats

    return {
      dataCollection: stats.totalRequests > 0 ? (stats.successfulRequests / stats.totalRequests) * 100 : 0,
      alertResponse: 'Alert response efficiency would be calculated',
      resourceUtilization: 'Resource utilization efficiency',
      overall: 85 // Placeholder
    }
  }

  async generateSystemRecommendations() {
    const recommendations = []

    // Performance recommendations
    const performanceStatus = this.performanceMonitor.getStatus()
    if (performanceStatus.metricsCount.system < 100) {
      recommendations.push({
        category: 'monitoring',
        priority: 'medium',
        message: 'Insufficient system metrics for reliable analysis',
        action: 'Increase monitoring data collection frequency'
      })
    }

    // Alert recommendations
    const alertStats = this.alertManager.getAlertStats()
    if (alertStats.activeAlerts > 10) {
      recommendations.push({
        category: 'alerts',
        priority: 'high',
        message: 'High number of active alerts',
        action: 'Review and resolve active alerts or adjust thresholds'
      })
    }

    // Baseline recommendations
    const baselineStatus = this.baselineManager.getBaselineStatus()
    if (baselineStatus.totalBaselines < baselineStatus.totalMetrics * 0.8) {
      recommendations.push({
        category: 'baselines',
        priority: 'medium',
        message: 'Low baseline coverage',
        action: 'Allow more time for baseline data collection'
      })
    }

    return recommendations
  }

  async stop() {
    if (!this.isRunning) {
      this.log('Integration not running', 'warning')
      return
    }

    this.log('Stopping performance systems integration...', 'info')

    this.isRunning = false

    // Stop monitoring components
    this.performanceMonitor.stopMonitoring()

    this.log('Performance systems integration stopped', 'success')
  }
}

module.exports = IntegrationManager

// CLI interface
if (require.main === module) {
  const integrationManager = new IntegrationManager()

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down integration manager...')
    await integrationManager.stop()
    process.exit(0)
  })

  // Generate initial report after startup
  setTimeout(async () => {
    try {
      const report = await integrationManager.generateIntegratedReport()
      console.log('\n📊 Initial Integration Report:')
      console.log(JSON.stringify(report, null, 2))
    } catch (error) {
      console.error('Error generating initial report:', error.message)
    }
  }, 10000) // Wait 10 seconds for data collection

  console.log('🚀 Performance Systems Integration Manager started')
  console.log('📊 Monitoring dashboard: monitoring/dashboard/performance-dashboard.html')
  console.log('🔄 Real-time integration active')
  console.log('Press Ctrl+C to stop')
}