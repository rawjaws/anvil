#!/usr/bin/env node

/**
 * Comprehensive Performance Monitoring System
 * Integrates with Backend Agent's performance endpoints and Testing Agent's scripts
 * Provides real-time monitoring, alerting, and performance baselines
 */

const os = require('os')
const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const EventEmitter = require('events')

class PerformanceMonitor extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      serverUrl: options.serverUrl || 'http://localhost:3000',
      monitoringInterval: options.monitoringInterval || 30000, // 30 seconds
      alertThresholds: {
        responseTime: 500, // ms
        memoryUsage: 85, // percentage
        cpuUsage: 80, // percentage
        errorRate: 5, // percentage
        requestsPerSecond: 10 // minimum
      },
      baselineWindow: options.baselineWindow || 24 * 60 * 60 * 1000, // 24 hours
      ...options
    }

    this.metrics = {
      system: [],
      api: [],
      frontend: [],
      errors: []
    }

    this.alerts = []
    this.baselines = null
    this.isMonitoring = false
    this.monitoringTimer = null

    this.metricsDir = path.join(__dirname, 'metrics')
    this.alertsDir = path.join(__dirname, 'alerts')
    this.baselinesDir = path.join(__dirname, 'baselines')
    this.dashboardDir = path.join(__dirname, 'dashboard')

    this.ensureDirectories()
    this.loadBaselines()
  }

  async ensureDirectories() {
    const dirs = [this.metricsDir, this.alertsDir, this.baselinesDir, this.dashboardDir]
    for (const dir of dirs) {
      await fs.ensureDir(dir)
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      alert: '  🚨',
      metrics: '  📊'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)

    // Emit event for dashboard updates
    this.emit('log', { timestamp, level, message })
  }

  async collectSystemMetrics() {
    const metrics = {
      timestamp: Date.now(),
      cpu: {
        usage: await this.getCpuUsage(),
        loadAverage: os.loadavg()
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
      },
      disk: await this.getDiskUsage(),
      network: await this.getNetworkStats(),
      uptime: os.uptime()
    }

    this.metrics.system.push(metrics)
    this.trimMetrics('system')

    return metrics
  }

  async getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage()

      setTimeout(() => {
        const endMeasure = this.cpuAverage()
        const idleDifference = endMeasure.idle - startMeasure.idle
        const totalDifference = endMeasure.total - startMeasure.total
        const usage = 100 - ~~(100 * idleDifference / totalDifference)
        resolve(usage)
      }, 1000)
    })
  }

  cpuAverage() {
    const cpus = os.cpus()
    let totalIdle = 0
    let totalTick = 0

    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type]
      }
      totalIdle += cpu.times.idle
    }

    return {
      idle: totalIdle / cpus.length,
      total: totalTick / cpus.length
    }
  }

  async getDiskUsage() {
    try {
      const stats = await fs.stat(process.cwd())
      return {
        path: process.cwd(),
        // Note: Getting actual disk usage requires platform-specific commands
        // This is a placeholder - in production, use platform-specific tools
        available: 'N/A',
        used: 'N/A',
        total: 'N/A'
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  async getNetworkStats() {
    const interfaces = os.networkInterfaces()
    const stats = {}

    for (const [name, interface] of Object.entries(interfaces)) {
      stats[name] = interface.filter(addr => !addr.internal)
    }

    return stats
  }

  async collectApiMetrics() {
    try {
      // Collect metrics from Backend Agent's performance endpoints
      const [cacheStats, poolStats, overviewStats] = await Promise.all([
        this.fetchApiMetrics('/api/performance/cache'),
        this.fetchApiMetrics('/api/performance/pool'),
        this.fetchApiMetrics('/api/performance/overview')
      ])

      const metrics = {
        timestamp: Date.now(),
        cache: cacheStats,
        pool: poolStats,
        overview: overviewStats,
        responseTime: await this.measureApiResponseTime(),
        errorRate: await this.calculateErrorRate()
      }

      this.metrics.api.push(metrics)
      this.trimMetrics('api')

      return metrics
    } catch (error) {
      this.log(`Error collecting API metrics: ${error.message}`, 'error')
      return null
    }
  }

  async fetchApiMetrics(endpoint) {
    try {
      const response = await axios.get(`${this.config.serverUrl}${endpoint}`, {
        timeout: 5000
      })
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch ${endpoint}: ${error.message}`)
    }
  }

  async measureApiResponseTime() {
    const endpoints = [
      '/api/status',
      '/api/features',
      '/api/performance/overview'
    ]

    const measurements = {}

    for (const endpoint of endpoints) {
      try {
        const start = Date.now()
        await axios.get(`${this.config.serverUrl}${endpoint}`, { timeout: 10000 })
        const responseTime = Date.now() - start
        measurements[endpoint] = responseTime
      } catch (error) {
        measurements[endpoint] = { error: error.message }
      }
    }

    return measurements
  }

  async calculateErrorRate() {
    // Sample recent API metrics to calculate error rate
    const recentMetrics = this.metrics.api.slice(-10)
    if (recentMetrics.length === 0) return 0

    const errors = recentMetrics.filter(metric =>
      metric.responseTime && Object.values(metric.responseTime).some(val =>
        typeof val === 'object' && val.error
      )
    ).length

    return (errors / recentMetrics.length) * 100
  }

  async collectFrontendMetrics() {
    // Collect frontend performance metrics
    // This would typically come from browser performance API or Real User Monitoring
    const metrics = {
      timestamp: Date.now(),
      bundleSize: await this.getBundleSize(),
      renderTimes: await this.getRenderTimes(),
      vitals: await this.getWebVitals()
    }

    this.metrics.frontend.push(metrics)
    this.trimMetrics('frontend')

    return metrics
  }

  async getBundleSize() {
    try {
      const distPath = path.join(process.cwd(), 'dist')
      if (!(await fs.pathExists(distPath))) return null

      const files = await fs.readdir(distPath)
      const jsFiles = files.filter(file => file.endsWith('.js'))

      let totalSize = 0
      for (const file of jsFiles) {
        const stats = await fs.stat(path.join(distPath, file))
        totalSize += stats.size
      }

      return {
        totalSize,
        fileCount: jsFiles.length,
        averageFileSize: totalSize / jsFiles.length
      }
    } catch (error) {
      return { error: error.message }
    }
  }

  async getRenderTimes() {
    // Placeholder for render time collection
    // In a real implementation, this would collect data from the frontend
    return {
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      timeToInteractive: null
    }
  }

  async getWebVitals() {
    // Placeholder for Web Vitals collection
    return {
      cumulativeLayoutShift: null,
      firstInputDelay: null,
      timeToFirstByte: null
    }
  }

  trimMetrics(category) {
    const maxEntries = 1000 // Keep last 1000 entries
    if (this.metrics[category].length > maxEntries) {
      this.metrics[category] = this.metrics[category].slice(-maxEntries)
    }
  }

  analyzeMetrics() {
    const analysis = {
      timestamp: Date.now(),
      alerts: [],
      trends: {},
      recommendations: []
    }

    // Analyze system metrics
    const latestSystem = this.metrics.system[this.metrics.system.length - 1]
    if (latestSystem) {
      if (latestSystem.memory.usagePercent > this.config.alertThresholds.memoryUsage) {
        analysis.alerts.push({
          type: 'memory',
          severity: 'warning',
          message: `High memory usage: ${latestSystem.memory.usagePercent.toFixed(2)}%`,
          value: latestSystem.memory.usagePercent,
          threshold: this.config.alertThresholds.memoryUsage
        })
      }

      if (latestSystem.cpu.usage > this.config.alertThresholds.cpuUsage) {
        analysis.alerts.push({
          type: 'cpu',
          severity: 'warning',
          message: `High CPU usage: ${latestSystem.cpu.usage}%`,
          value: latestSystem.cpu.usage,
          threshold: this.config.alertThresholds.cpuUsage
        })
      }
    }

    // Analyze API metrics
    const latestApi = this.metrics.api[this.metrics.api.length - 1]
    if (latestApi && latestApi.responseTime) {
      for (const [endpoint, responseTime] of Object.entries(latestApi.responseTime)) {
        if (typeof responseTime === 'number' && responseTime > this.config.alertThresholds.responseTime) {
          analysis.alerts.push({
            type: 'api_response_time',
            severity: 'warning',
            message: `Slow API response: ${endpoint} took ${responseTime}ms`,
            value: responseTime,
            threshold: this.config.alertThresholds.responseTime,
            endpoint
          })
        }
      }

      if (latestApi.errorRate > this.config.alertThresholds.errorRate) {
        analysis.alerts.push({
          type: 'api_error_rate',
          severity: 'error',
          message: `High API error rate: ${latestApi.errorRate.toFixed(2)}%`,
          value: latestApi.errorRate,
          threshold: this.config.alertThresholds.errorRate
        })
      }
    }

    // Calculate trends
    analysis.trends = this.calculateTrends()

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis)

    return analysis
  }

  calculateTrends() {
    const trends = {}

    // Calculate system trends
    if (this.metrics.system.length >= 2) {
      const recent = this.metrics.system.slice(-10)
      const memoryTrend = this.calculateTrend(recent.map(m => m.memory.usagePercent))
      const cpuTrend = this.calculateTrend(recent.map(m => m.cpu.usage))

      trends.system = { memory: memoryTrend, cpu: cpuTrend }
    }

    // Calculate API trends
    if (this.metrics.api.length >= 2) {
      const recent = this.metrics.api.slice(-10)
      const errorRateTrend = this.calculateTrend(recent.map(m => m.errorRate || 0))

      trends.api = { errorRate: errorRateTrend }
    }

    return trends
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable'

    const recent = values.slice(-5)
    const earlier = values.slice(-10, -5)

    if (recent.length === 0 || earlier.length === 0) return 'stable'

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length

    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100

    if (change > 10) return 'increasing'
    if (change < -10) return 'decreasing'
    return 'stable'
  }

  generateRecommendations(analysis) {
    const recommendations = []

    // Memory recommendations
    const memoryAlerts = analysis.alerts.filter(a => a.type === 'memory')
    if (memoryAlerts.length > 0) {
      recommendations.push({
        category: 'memory',
        priority: 'high',
        message: 'Consider optimizing memory usage or scaling resources',
        actions: [
          'Review memory leaks in application code',
          'Optimize cache sizes',
          'Consider increasing server memory'
        ]
      })
    }

    // API performance recommendations
    const apiAlerts = analysis.alerts.filter(a => a.type.startsWith('api_'))
    if (apiAlerts.length > 0) {
      recommendations.push({
        category: 'api',
        priority: 'medium',
        message: 'API performance issues detected',
        actions: [
          'Review slow endpoints and optimize queries',
          'Implement additional caching layers',
          'Consider request rate limiting'
        ]
      })
    }

    return recommendations
  }

  async saveMetrics() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    try {
      // Save current metrics snapshot
      const snapshot = {
        timestamp: Date.now(),
        system: this.metrics.system.slice(-100), // Last 100 entries
        api: this.metrics.api.slice(-100),
        frontend: this.metrics.frontend.slice(-100)
      }

      await fs.writeJSON(
        path.join(this.metricsDir, `metrics-${timestamp}.json`),
        snapshot,
        { spaces: 2 }
      )

      // Save latest snapshot
      await fs.writeJSON(
        path.join(this.metricsDir, 'latest-metrics.json'),
        snapshot,
        { spaces: 2 }
      )

      this.log('Metrics saved successfully', 'success')
    } catch (error) {
      this.log(`Error saving metrics: ${error.message}`, 'error')
    }
  }

  async saveAlert(alert) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    try {
      await fs.writeJSON(
        path.join(this.alertsDir, `alert-${timestamp}.json`),
        { ...alert, timestamp: Date.now() },
        { spaces: 2 }
      )

      this.log(`Alert saved: ${alert.message}`, 'alert')
      this.emit('alert', alert)
    } catch (error) {
      this.log(`Error saving alert: ${error.message}`, 'error')
    }
  }

  async loadBaselines() {
    try {
      const baselinePath = path.join(this.baselinesDir, 'performance-baselines.json')
      if (await fs.pathExists(baselinePath)) {
        this.baselines = await fs.readJSON(baselinePath)
        this.log('Performance baselines loaded', 'success')
      } else {
        this.log('No baselines found, will create new ones', 'info')
      }
    } catch (error) {
      this.log(`Error loading baselines: ${error.message}`, 'error')
    }
  }

  async createBaselines() {
    if (this.metrics.system.length === 0 || this.metrics.api.length === 0) {
      this.log('Insufficient data to create baselines', 'warning')
      return
    }

    const systemMetrics = this.metrics.system.slice(-50) // Last 50 entries
    const apiMetrics = this.metrics.api.slice(-50)

    this.baselines = {
      timestamp: Date.now(),
      system: {
        memory: {
          average: systemMetrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / systemMetrics.length,
          max: Math.max(...systemMetrics.map(m => m.memory.usagePercent)),
          min: Math.min(...systemMetrics.map(m => m.memory.usagePercent))
        },
        cpu: {
          average: systemMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / systemMetrics.length,
          max: Math.max(...systemMetrics.map(m => m.cpu.usage)),
          min: Math.min(...systemMetrics.map(m => m.cpu.usage))
        }
      },
      api: {
        errorRate: {
          average: apiMetrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / apiMetrics.length,
          max: Math.max(...apiMetrics.map(m => m.errorRate || 0))
        }
      }
    }

    try {
      await fs.writeJSON(
        path.join(this.baselinesDir, 'performance-baselines.json'),
        this.baselines,
        { spaces: 2 }
      )

      this.log('Performance baselines created', 'success')
    } catch (error) {
      this.log(`Error saving baselines: ${error.message}`, 'error')
    }
  }

  async startMonitoring() {
    if (this.isMonitoring) {
      this.log('Monitoring already active', 'warning')
      return
    }

    this.isMonitoring = true
    this.log(`Starting performance monitoring (interval: ${this.config.monitoringInterval}ms)`, 'success')

    const monitor = async () => {
      try {
        // Collect all metrics
        const [systemMetrics, apiMetrics, frontendMetrics] = await Promise.all([
          this.collectSystemMetrics(),
          this.collectApiMetrics(),
          this.collectFrontendMetrics()
        ])

        // Analyze for alerts
        const analysis = this.analyzeMetrics()

        // Save new alerts
        for (const alert of analysis.alerts) {
          await this.saveAlert(alert)
        }

        // Emit metrics update for real-time dashboard
        this.emit('metrics_update', {
          system: systemMetrics,
          api: apiMetrics,
          frontend: frontendMetrics,
          analysis
        })

        // Log summary
        this.log(`Metrics collected - Mem: ${systemMetrics?.memory?.usagePercent?.toFixed(1)}%, CPU: ${systemMetrics?.cpu?.usage}%, Alerts: ${analysis.alerts.length}`, 'metrics')

        // Save metrics periodically
        if (this.metrics.system.length % 10 === 0) {
          await this.saveMetrics()
        }

        // Create baselines if they don't exist and we have enough data
        if (!this.baselines && this.metrics.system.length >= 50) {
          await this.createBaselines()
        }

      } catch (error) {
        this.log(`Monitoring cycle error: ${error.message}`, 'error')
      }

      // Schedule next monitoring cycle
      if (this.isMonitoring) {
        this.monitoringTimer = setTimeout(monitor, this.config.monitoringInterval)
      }
    }

    // Start first monitoring cycle
    monitor()
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      this.log('Monitoring not active', 'warning')
      return
    }

    this.isMonitoring = false

    if (this.monitoringTimer) {
      clearTimeout(this.monitoringTimer)
      this.monitoringTimer = null
    }

    this.log('Performance monitoring stopped', 'success')
  }

  getStatus() {
    const latest = {
      system: this.metrics.system[this.metrics.system.length - 1],
      api: this.metrics.api[this.metrics.api.length - 1],
      frontend: this.metrics.frontend[this.metrics.frontend.length - 1]
    }

    return {
      isMonitoring: this.isMonitoring,
      uptime: process.uptime(),
      metricsCount: {
        system: this.metrics.system.length,
        api: this.metrics.api.length,
        frontend: this.metrics.frontend.length
      },
      latest,
      baselines: this.baselines ? {
        timestamp: this.baselines.timestamp,
        hasSystemBaseline: !!this.baselines.system,
        hasApiBaseline: !!this.baselines.api
      } : null
    }
  }

  async generateReport() {
    const analysis = this.analyzeMetrics()
    const status = this.getStatus()

    const report = {
      timestamp: Date.now(),
      summary: {
        monitoringStatus: this.isMonitoring ? 'active' : 'inactive',
        totalAlerts: analysis.alerts.length,
        dataPoints: status.metricsCount,
        uptime: status.uptime
      },
      alerts: analysis.alerts,
      trends: analysis.trends,
      recommendations: analysis.recommendations,
      performance: {
        system: status.latest.system,
        api: status.latest.api,
        frontend: status.latest.frontend
      },
      baselines: this.baselines
    }

    // Save report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await fs.writeJSON(
      path.join(this.metricsDir, `performance-report-${timestamp}.json`),
      report,
      { spaces: 2 }
    )

    return report
  }
}

module.exports = PerformanceMonitor

// CLI interface
if (require.main === module) {
  const monitor = new PerformanceMonitor()

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down performance monitor...')
    monitor.stopMonitoring()
    process.exit(0)
  })

  // Start monitoring
  monitor.startMonitoring()

  // Generate report every 5 minutes
  setInterval(async () => {
    try {
      const report = await monitor.generateReport()
      console.log(`📊 Performance report generated with ${report.summary.totalAlerts} alerts`)
    } catch (error) {
      console.error('Error generating report:', error.message)
    }
  }, 5 * 60 * 1000)

  console.log('🚀 Performance Monitor started. Press Ctrl+C to stop.')
}