/**
 * Performance Regression Detection System
 * Advanced monitoring for performance degradation and automated alerts
 *
 * Features:
 * - Real-time performance baseline tracking
 * - Statistical regression analysis
 * - Automated alert system
 * - Performance trend analysis
 * - Memory leak detection
 * - Throughput monitoring
 */

const fs = require('fs-extra')
const path = require('path')
const { performance } = require('perf_hooks')
const axios = require('axios')

class PerformanceRegressionDetector {
  constructor(options = {}) {
    this.config = {
      baselineFile: path.join(__dirname, '../tests/performance/baselines/feature-baseline.json'),
      alertThresholds: {
        responseTime: 0.20, // 20% increase
        throughput: 0.15, // 15% decrease
        errorRate: 0.001, // 0.1% absolute
        memoryIncrease: 0.25, // 25% increase
        cpuIncrease: 0.30 // 30% increase
      },
      sampleSize: 100, // Number of samples for statistical analysis
      confidenceLevel: 0.95, // Statistical confidence level
      monitoringInterval: 10000, // 10 seconds
      ...options
    }

    this.currentBaseline = null
    this.performanceHistory = []
    this.regressionAlerts = []
    this.isMonitoring = false

    this.statisticalAnalysis = {
      samples: [],
      mean: 0,
      standardDeviation: 0,
      trend: 'stable'
    }
  }

  /**
   * Start performance monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('📊 Performance monitoring already active')
      return
    }

    console.log('🚀 Starting Performance Regression Detection')

    // Load baseline data
    await this.loadBaseline()

    this.isMonitoring = true

    // Start monitoring loops
    this.performanceMonitoringLoop()
    this.regressionAnalysisLoop()
    this.memoryLeakDetection()

    console.log('✅ Performance regression detection active')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false
    console.log('🛑 Performance monitoring stopped')
  }

  /**
   * Load performance baseline
   */
  async loadBaseline() {
    try {
      if (await fs.pathExists(this.config.baselineFile)) {
        this.currentBaseline = await fs.readJson(this.config.baselineFile)
        console.log('📊 Performance baseline loaded:', {
          responseTime: this.currentBaseline.responseTime,
          throughput: this.currentBaseline.throughput,
          updatedAt: this.currentBaseline.updatedAt
        })
      } else {
        console.log('⚠️  No baseline found - will establish baseline from current measurements')
        await this.establishBaseline()
      }
    } catch (error) {
      console.error('❌ Failed to load baseline:', error.message)
      await this.establishBaseline()
    }
  }

  /**
   * Establish new performance baseline
   */
  async establishBaseline() {
    console.log('📊 Establishing new performance baseline...')

    const samples = []
    const sampleCount = 20

    for (let i = 0; i < sampleCount; i++) {
      try {
        const measurement = await this.takePerfMeasurement()
        samples.push(measurement)
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.warn(`Baseline sample ${i + 1} failed:`, error.message)
      }
    }

    if (samples.length < sampleCount / 2) {
      throw new Error('Insufficient samples to establish baseline')
    }

    this.currentBaseline = this.calculateBaselineFromSamples(samples)

    // Save baseline
    await fs.ensureDir(path.dirname(this.config.baselineFile))
    await fs.writeJson(this.config.baselineFile, this.currentBaseline, { spaces: 2 })

    console.log('✅ Baseline established:', {
      responseTime: this.currentBaseline.responseTime,
      throughput: this.currentBaseline.throughput,
      samples: samples.length
    })
  }

  /**
   * Calculate baseline metrics from samples
   */
  calculateBaselineFromSamples(samples) {
    const validSamples = samples.filter(s => s.success)

    const responseTime = this.calculatePercentile(validSamples.map(s => s.responseTime), 50)
    const throughput = this.calculatePercentile(validSamples.map(s => s.throughput), 50)
    const errorRate = validSamples.reduce((sum, s) => sum + s.errorRate, 0) / validSamples.length

    return {
      responseTime,
      throughput,
      errorRate,
      memoryUsage: this.calculatePercentile(validSamples.map(s => s.memoryUsage || 0), 50),
      cpuUsage: this.calculatePercentile(validSamples.map(s => s.cpuUsage || 0), 50),
      timestamp: new Date().toISOString(),
      sampleCount: validSamples.length,
      updatedAt: new Date().toISOString()
    }
  }

  /**
   * Performance monitoring loop
   */
  async performanceMonitoringLoop() {
    while (this.isMonitoring) {
      try {
        const measurement = await this.takePerfMeasurement()

        // Add to history
        this.performanceHistory.push(measurement)

        // Keep only recent history
        if (this.performanceHistory.length > this.config.sampleSize) {
          this.performanceHistory = this.performanceHistory.slice(-this.config.sampleSize)
        }

        // Update statistical analysis
        this.updateStatisticalAnalysis(measurement)

        // Check for immediate regressions
        await this.checkForRegressions(measurement)

      } catch (error) {
        console.error('❌ Performance measurement error:', error.message)
      }

      await new Promise(resolve => setTimeout(resolve, this.config.monitoringInterval))
    }
  }

  /**
   * Take a performance measurement
   */
  async takePerfMeasurement() {
    const measurement = {
      timestamp: new Date().toISOString(),
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      success: false
    }

    try {
      // Measure response time and throughput
      const performanceTest = await this.runPerformanceTest()

      measurement.responseTime = performanceTest.averageResponseTime
      measurement.throughput = performanceTest.requestsPerSecond
      measurement.errorRate = performanceTest.errorRate
      measurement.success = true

      // Get system metrics (simulated for now)
      measurement.memoryUsage = await this.getMemoryUsage()
      measurement.cpuUsage = await this.getCpuUsage()

    } catch (error) {
      console.warn('Performance measurement failed:', error.message)
      measurement.errorRate = 1.0 // High error rate indicates failure
    }

    return measurement
  }

  /**
   * Run performance test
   */
  async runPerformanceTest() {
    const testDuration = 3000 // 3 seconds
    const concurrentRequests = 5
    const results = {
      totalRequests: 0,
      successfulRequests: 0,
      responseTimes: []
    }

    const startTime = Date.now()
    const promises = []

    while (Date.now() - startTime < testDuration) {
      for (let i = 0; i < concurrentRequests; i++) {
        const requestPromise = (async () => {
          const requestStart = performance.now()
          try {
            await axios.get('http://localhost:3000/api/features', { timeout: 5000 })
            const requestEnd = performance.now()

            results.totalRequests++
            results.successfulRequests++
            results.responseTimes.push(requestEnd - requestStart)
          } catch (error) {
            results.totalRequests++
          }
        })()

        promises.push(requestPromise)
      }

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    await Promise.allSettled(promises)

    const averageResponseTime = results.responseTimes.length > 0
      ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
      : 0

    const errorRate = results.totalRequests > 0
      ? (results.totalRequests - results.successfulRequests) / results.totalRequests
      : 1

    const requestsPerSecond = results.successfulRequests / (testDuration / 1000)

    return {
      averageResponseTime,
      requestsPerSecond,
      errorRate,
      totalRequests: results.totalRequests,
      successfulRequests: results.successfulRequests
    }
  }

  /**
   * Get memory usage (simulated)
   */
  async getMemoryUsage() {
    // In real implementation, this would use process.memoryUsage()
    return Math.random() * 200 + 100 // 100-300 MB simulated
  }

  /**
   * Get CPU usage (simulated)
   */
  async getCpuUsage() {
    // In real implementation, this would use system CPU monitoring
    return Math.random() * 50 + 10 // 10-60% simulated
  }

  /**
   * Update statistical analysis
   */
  updateStatisticalAnalysis(measurement) {
    if (!measurement.success) return

    // Add to samples
    this.statisticalAnalysis.samples.push(measurement.responseTime)

    // Keep only recent samples
    if (this.statisticalAnalysis.samples.length > this.config.sampleSize) {
      this.statisticalAnalysis.samples = this.statisticalAnalysis.samples.slice(-this.config.sampleSize)
    }

    // Calculate mean and standard deviation
    const samples = this.statisticalAnalysis.samples
    this.statisticalAnalysis.mean = samples.reduce((a, b) => a + b, 0) / samples.length

    if (samples.length > 1) {
      const variance = samples.reduce((sum, x) => sum + Math.pow(x - this.statisticalAnalysis.mean, 2), 0) / (samples.length - 1)
      this.statisticalAnalysis.standardDeviation = Math.sqrt(variance)
    }

    // Calculate trend
    this.statisticalAnalysis.trend = this.calculateTrend(samples)
  }

  /**
   * Calculate performance trend
   */
  calculateTrend(samples) {
    if (samples.length < 10) return 'insufficient_data'

    const recentSamples = samples.slice(-10)
    const earlierSamples = samples.slice(-20, -10)

    if (earlierSamples.length === 0) return 'stable'

    const recentMean = recentSamples.reduce((a, b) => a + b, 0) / recentSamples.length
    const earlierMean = earlierSamples.reduce((a, b) => a + b, 0) / earlierSamples.length

    const changePercent = (recentMean - earlierMean) / earlierMean

    if (changePercent > 0.10) return 'degrading'
    if (changePercent < -0.10) return 'improving'
    return 'stable'
  }

  /**
   * Check for performance regressions
   */
  async checkForRegressions(measurement) {
    if (!this.currentBaseline || !measurement.success) return

    const regressions = []

    // Response time regression
    if (measurement.responseTime > this.currentBaseline.responseTime * (1 + this.config.alertThresholds.responseTime)) {
      regressions.push({
        type: 'response_time',
        severity: this.calculateSeverity('response_time', measurement.responseTime, this.currentBaseline.responseTime),
        current: measurement.responseTime,
        baseline: this.currentBaseline.responseTime,
        increase: ((measurement.responseTime - this.currentBaseline.responseTime) / this.currentBaseline.responseTime * 100).toFixed(2) + '%'
      })
    }

    // Throughput regression
    if (measurement.throughput < this.currentBaseline.throughput * (1 - this.config.alertThresholds.throughput)) {
      regressions.push({
        type: 'throughput',
        severity: this.calculateSeverity('throughput', measurement.throughput, this.currentBaseline.throughput),
        current: measurement.throughput,
        baseline: this.currentBaseline.throughput,
        decrease: ((this.currentBaseline.throughput - measurement.throughput) / this.currentBaseline.throughput * 100).toFixed(2) + '%'
      })
    }

    // Error rate regression
    if (measurement.errorRate > this.config.alertThresholds.errorRate) {
      regressions.push({
        type: 'error_rate',
        severity: 'critical',
        current: measurement.errorRate,
        baseline: this.currentBaseline.errorRate || 0,
        message: 'Error rate exceeds acceptable threshold'
      })
    }

    // Memory regression
    if (measurement.memoryUsage > this.currentBaseline.memoryUsage * (1 + this.config.alertThresholds.memoryIncrease)) {
      regressions.push({
        type: 'memory_usage',
        severity: this.calculateSeverity('memory', measurement.memoryUsage, this.currentBaseline.memoryUsage),
        current: measurement.memoryUsage,
        baseline: this.currentBaseline.memoryUsage,
        increase: ((measurement.memoryUsage - this.currentBaseline.memoryUsage) / this.currentBaseline.memoryUsage * 100).toFixed(2) + '%'
      })
    }

    // Process regressions
    if (regressions.length > 0) {
      await this.handleRegressions(regressions, measurement)
    }
  }

  /**
   * Calculate regression severity
   */
  calculateSeverity(type, current, baseline) {
    const ratio = type === 'throughput' ? baseline / current : current / baseline
    const increase = ratio - 1

    if (increase > 1.0) return 'critical' // 100%+ increase/decrease
    if (increase > 0.5) return 'high' // 50%+ increase/decrease
    if (increase > 0.25) return 'medium' // 25%+ increase/decrease
    return 'low'
  }

  /**
   * Handle performance regressions
   */
  async handleRegressions(regressions, measurement) {
    const alert = {
      timestamp: new Date().toISOString(),
      type: 'performance_regression',
      regressions,
      measurement,
      statisticalAnalysis: { ...this.statisticalAnalysis },
      severity: this.getMaxSeverity(regressions)
    }

    // Add to alerts
    this.regressionAlerts.push(alert)

    // Keep only recent alerts
    if (this.regressionAlerts.length > 100) {
      this.regressionAlerts = this.regressionAlerts.slice(-100)
    }

    // Log alert
    console.error(`🚨 PERFORMANCE REGRESSION DETECTED`)
    console.error(`   Severity: ${alert.severity}`)
    console.error(`   Regressions: ${regressions.length}`)

    for (const regression of regressions) {
      console.error(`   - ${regression.type}: ${regression.severity}`)
    }

    // Save alert to file
    await this.saveAlert(alert)

    // Trigger notifications based on severity
    await this.sendRegressionAlert(alert)
  }

  /**
   * Get maximum severity from regressions
   */
  getMaxSeverity(regressions) {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 }
    return regressions.reduce((max, reg) => {
      return severityOrder[reg.severity] > severityOrder[max] ? reg.severity : max
    }, 'low')
  }

  /**
   * Regression analysis loop
   */
  async regressionAnalysisLoop() {
    while (this.isMonitoring) {
      try {
        if (this.performanceHistory.length >= 10) {
          await this.performStatisticalAnalysis()
        }
      } catch (error) {
        console.error('❌ Statistical analysis error:', error.message)
      }

      await new Promise(resolve => setTimeout(resolve, 30000)) // Every 30 seconds
    }
  }

  /**
   * Perform statistical analysis for trend detection
   */
  async performStatisticalAnalysis() {
    const recentMeasurements = this.performanceHistory.slice(-20)
    const responseTimes = recentMeasurements.filter(m => m.success).map(m => m.responseTime)

    if (responseTimes.length < 10) return

    // Detect statistical anomalies
    const anomalies = this.detectAnomalies(responseTimes)

    if (anomalies.length > 0) {
      console.log(`📊 Statistical anomalies detected: ${anomalies.length}`)

      const alert = {
        timestamp: new Date().toISOString(),
        type: 'statistical_anomaly',
        anomalies,
        trend: this.statisticalAnalysis.trend,
        severity: anomalies.length > 3 ? 'high' : 'medium'
      }

      await this.saveAlert(alert)
    }
  }

  /**
   * Detect statistical anomalies using z-score
   */
  detectAnomalies(data, threshold = 2.5) {
    const mean = data.reduce((a, b) => a + b, 0) / data.length
    const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (data.length - 1)
    const stdDev = Math.sqrt(variance)

    const anomalies = []

    data.forEach((value, index) => {
      const zScore = Math.abs((value - mean) / stdDev)
      if (zScore > threshold) {
        anomalies.push({
          index,
          value,
          zScore: zScore.toFixed(2),
          deviation: ((value - mean) / mean * 100).toFixed(2) + '%'
        })
      }
    })

    return anomalies
  }

  /**
   * Memory leak detection
   */
  async memoryLeakDetection() {
    const memorySnapshots = []

    while (this.isMonitoring) {
      try {
        const memoryUsage = await this.getMemoryUsage()
        memorySnapshots.push({
          timestamp: new Date().toISOString(),
          usage: memoryUsage
        })

        // Keep only last 50 snapshots
        if (memorySnapshots.length > 50) {
          memorySnapshots.shift()
        }

        // Check for memory leaks (consistent upward trend)
        if (memorySnapshots.length >= 20) {
          const leakDetected = this.detectMemoryLeak(memorySnapshots)

          if (leakDetected) {
            const alert = {
              timestamp: new Date().toISOString(),
              type: 'memory_leak',
              severity: 'high',
              trend: leakDetected.trend,
              growth: leakDetected.growth
            }

            console.error('🚨 MEMORY LEAK DETECTED')
            console.error(`   Growth rate: ${leakDetected.growth}% over ${leakDetected.duration}`)

            await this.saveAlert(alert)
          }
        }

      } catch (error) {
        console.error('❌ Memory leak detection error:', error.message)
      }

      await new Promise(resolve => setTimeout(resolve, 60000)) // Every minute
    }
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeak(snapshots) {
    const recent = snapshots.slice(-10) // Last 10 snapshots
    const earlier = snapshots.slice(-20, -10) // Previous 10 snapshots

    if (earlier.length === 0) return null

    const recentAvg = recent.reduce((sum, s) => sum + s.usage, 0) / recent.length
    const earlierAvg = earlier.reduce((sum, s) => sum + s.usage, 0) / earlier.length

    const growth = ((recentAvg - earlierAvg) / earlierAvg) * 100

    // Consider it a leak if memory increased by more than 20% consistently
    if (growth > 20) {
      return {
        trend: 'increasing',
        growth: growth.toFixed(2),
        duration: '10 minutes',
        recentAvg: recentAvg.toFixed(2),
        earlierAvg: earlierAvg.toFixed(2)
      }
    }

    return null
  }

  /**
   * Save alert to file
   */
  async saveAlert(alert) {
    try {
      const alertsFile = path.join(__dirname, 'performance-alerts.json')
      let alerts = []

      if (await fs.pathExists(alertsFile)) {
        alerts = await fs.readJson(alertsFile)
      }

      alerts.push(alert)

      // Keep only last 500 alerts
      if (alerts.length > 500) {
        alerts = alerts.slice(-500)
      }

      await fs.writeJson(alertsFile, alerts, { spaces: 2 })

    } catch (error) {
      console.error('Failed to save alert:', error.message)
    }
  }

  /**
   * Send regression alert
   */
  async sendRegressionAlert(alert) {
    // In a real implementation, this would send notifications via various channels
    console.log(`📢 Performance Alert: ${alert.severity.toUpperCase()}`)
    console.log(`   Time: ${alert.timestamp}`)
    console.log(`   Regressions: ${alert.regressions.length}`)
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(data, percentile) {
    const sorted = [...data].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const recentMeasurements = this.performanceHistory.slice(-10)
    const successfulMeasurements = recentMeasurements.filter(m => m.success)

    return {
      timestamp: new Date().toISOString(),
      baseline: this.currentBaseline,
      current: {
        responseTime: successfulMeasurements.length > 0
          ? successfulMeasurements.reduce((sum, m) => sum + m.responseTime, 0) / successfulMeasurements.length
          : 0,
        throughput: successfulMeasurements.length > 0
          ? successfulMeasurements.reduce((sum, m) => sum + m.throughput, 0) / successfulMeasurements.length
          : 0,
        errorRate: recentMeasurements.length > 0
          ? recentMeasurements.reduce((sum, m) => sum + m.errorRate, 0) / recentMeasurements.length
          : 0
      },
      trend: this.statisticalAnalysis.trend,
      alerts: this.regressionAlerts.slice(-5), // Last 5 alerts
      isMonitoring: this.isMonitoring
    }
  }
}

module.exports = PerformanceRegressionDetector