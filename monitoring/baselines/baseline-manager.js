#!/usr/bin/env node

/**
 * Infrastructure Performance Baseline Manager
 * Creates, manages, and maintains performance baselines for infrastructure monitoring
 */

const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')

class BaselineManager {
  constructor(options = {}) {
    this.config = {
      baselinesDir: path.join(__dirname, 'data'),
      metricsRetention: 30 * 24 * 60 * 60 * 1000, // 30 days
      baselineWindow: 7 * 24 * 60 * 60 * 1000,    // 7 days for baseline calculation
      updateInterval: 24 * 60 * 60 * 1000,        // Update baselines daily
      confidenceThreshold: 0.95,                   // 95% confidence interval
      minimumSamples: 100,                         // Minimum samples needed for baseline
      ...options
    }

    this.baselines = new Map()
    this.historicalData = new Map()
    this.statistics = {
      totalBaselines: 0,
      lastUpdate: null,
      nextUpdate: null,
      dataPoints: 0,
      averageDeviation: 0
    }

    this.init()
  }

  async init() {
    await this.ensureDirectories()
    await this.loadExistingBaselines()
    await this.loadHistoricalData()
    this.scheduleBaselineUpdates()
    this.log('Baseline Manager initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      baseline: '  📊',
      update: '  🔄'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async ensureDirectories() {
    await fs.ensureDir(this.config.baselinesDir)
    await fs.ensureDir(path.join(this.config.baselinesDir, 'current'))
    await fs.ensureDir(path.join(this.config.baselinesDir, 'historical'))
    await fs.ensureDir(path.join(this.config.baselinesDir, 'analysis'))
  }

  async loadExistingBaselines() {
    try {
      const baselinesPath = path.join(this.config.baselinesDir, 'current', 'baselines.json')

      if (await fs.pathExists(baselinesPath)) {
        const data = await fs.readJSON(baselinesPath)

        for (const [key, baseline] of Object.entries(data.baselines || {})) {
          this.baselines.set(key, baseline)
        }

        this.statistics = { ...this.statistics, ...(data.statistics || {}) }
        this.log(`Loaded ${this.baselines.size} existing baselines`, 'success')
      }
    } catch (error) {
      this.log(`Error loading baselines: ${error.message}`, 'error')
    }
  }

  async loadHistoricalData() {
    try {
      const dataPath = path.join(this.config.baselinesDir, 'historical', 'metrics-data.json')

      if (await fs.pathExists(dataPath)) {
        const data = await fs.readJSON(dataPath)

        for (const [key, values] of Object.entries(data)) {
          this.historicalData.set(key, values)
        }

        this.log(`Loaded historical data for ${this.historicalData.size} metrics`, 'success')
      }
    } catch (error) {
      this.log(`Error loading historical data: ${error.message}`, 'warning')
    }
  }

  async saveBaselines() {
    try {
      const data = {
        timestamp: Date.now(),
        version: '1.0.0',
        baselines: Object.fromEntries(this.baselines),
        statistics: this.statistics
      }

      await fs.writeJSON(
        path.join(this.config.baselinesDir, 'current', 'baselines.json'),
        data,
        { spaces: 2 }
      )

      // Also save timestamped version
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      await fs.writeJSON(
        path.join(this.config.baselinesDir, 'historical', `baselines-${timestamp}.json`),
        data,
        { spaces: 2 }
      )

      this.log('Baselines saved successfully', 'success')
    } catch (error) {
      this.log(`Error saving baselines: ${error.message}`, 'error')
    }
  }

  async saveHistoricalData() {
    try {
      const data = Object.fromEntries(this.historicalData)

      await fs.writeJSON(
        path.join(this.config.baselinesDir, 'historical', 'metrics-data.json'),
        data,
        { spaces: 2 }
      )
    } catch (error) {
      this.log(`Error saving historical data: ${error.message}`, 'error')
    }
  }

  addMetricData(metricName, value, timestamp = Date.now()) {
    if (typeof value !== 'number' || isNaN(value)) {
      return // Invalid metric value
    }

    if (!this.historicalData.has(metricName)) {
      this.historicalData.set(metricName, [])
    }

    const data = this.historicalData.get(metricName)
    data.push({ value, timestamp })

    // Remove old data points
    const cutoffTime = timestamp - this.config.metricsRetention
    const filteredData = data.filter(point => point.timestamp > cutoffTime)
    this.historicalData.set(metricName, filteredData)

    this.statistics.dataPoints++
  }

  addSystemMetrics(systemMetrics) {
    if (!systemMetrics || typeof systemMetrics !== 'object') {
      return
    }

    const timestamp = Date.now()

    // Memory metrics
    if (systemMetrics.memory) {
      this.addMetricData('system.memory.usagePercent', systemMetrics.memory.usagePercent, timestamp)
      this.addMetricData('system.memory.used', systemMetrics.memory.used, timestamp)
      this.addMetricData('system.memory.free', systemMetrics.memory.free, timestamp)
    }

    // CPU metrics
    if (systemMetrics.cpu) {
      this.addMetricData('system.cpu.usage', systemMetrics.cpu.usage, timestamp)

      if (systemMetrics.cpu.loadAverage && Array.isArray(systemMetrics.cpu.loadAverage)) {
        this.addMetricData('system.cpu.loadAverage1', systemMetrics.cpu.loadAverage[0], timestamp)
        this.addMetricData('system.cpu.loadAverage5', systemMetrics.cpu.loadAverage[1], timestamp)
        this.addMetricData('system.cpu.loadAverage15', systemMetrics.cpu.loadAverage[2], timestamp)
      }
    }

    // Uptime
    if (systemMetrics.uptime) {
      this.addMetricData('system.uptime', systemMetrics.uptime, timestamp)
    }
  }

  addApiMetrics(apiMetrics) {
    if (!apiMetrics || typeof apiMetrics !== 'object') {
      return
    }

    const timestamp = Date.now()

    // Response time metrics
    if (apiMetrics.responseTime) {
      for (const [endpoint, responseTime] of Object.entries(apiMetrics.responseTime)) {
        if (typeof responseTime === 'number') {
          this.addMetricData(`api.responseTime.${this.sanitizeMetricName(endpoint)}`, responseTime, timestamp)
        }
      }
    }

    // Error rate
    if (typeof apiMetrics.errorRate === 'number') {
      this.addMetricData('api.errorRate', apiMetrics.errorRate, timestamp)
    }

    // Cache metrics
    if (apiMetrics.cache && apiMetrics.cache.stats) {
      const stats = apiMetrics.cache.stats
      if (typeof stats.hitRate === 'number') {
        this.addMetricData('api.cache.hitRate', stats.hitRate, timestamp)
      }
      if (typeof stats.size === 'number') {
        this.addMetricData('api.cache.size', stats.size, timestamp)
      }
    }

    // Pool metrics
    if (apiMetrics.pool && apiMetrics.pool.stats) {
      const stats = apiMetrics.pool.stats
      if (typeof stats.utilization === 'number') {
        this.addMetricData('api.pool.utilization', stats.utilization, timestamp)
      }
      if (typeof stats.activeRequests === 'number') {
        this.addMetricData('api.pool.activeRequests', stats.activeRequests, timestamp)
      }
    }
  }

  addBuildMetrics(buildMetrics) {
    if (!buildMetrics || typeof buildMetrics !== 'object') {
      return
    }

    const timestamp = Date.now()

    if (typeof buildMetrics.duration === 'number') {
      this.addMetricData('build.duration', buildMetrics.duration, timestamp)
    }

    if (typeof buildMetrics.success === 'boolean') {
      this.addMetricData('build.successRate', buildMetrics.success ? 1 : 0, timestamp)
    }

    if (buildMetrics.stats && buildMetrics.stats.bundleSize) {
      for (const [category, size] of Object.entries(buildMetrics.stats.bundleSize)) {
        if (typeof size.totalSize === 'number') {
          this.addMetricData(`build.bundleSize.${category}`, size.totalSize, timestamp)
        }
      }
    }
  }

  sanitizeMetricName(name) {
    return name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  }

  calculateBaseline(metricName) {
    const data = this.historicalData.get(metricName)

    if (!data || data.length < this.config.minimumSamples) {
      return null
    }

    // Use recent data within baseline window
    const cutoffTime = Date.now() - this.config.baselineWindow
    const recentData = data.filter(point => point.timestamp > cutoffTime)

    if (recentData.length < this.config.minimumSamples) {
      return null
    }

    const values = recentData.map(point => point.value)
    const stats = this.calculateStatistics(values)

    const baseline = {
      metricName,
      timestamp: Date.now(),
      sampleCount: values.length,
      timeRange: {
        start: Math.min(...recentData.map(p => p.timestamp)),
        end: Math.max(...recentData.map(p => p.timestamp))
      },
      statistics: stats,
      thresholds: this.calculateThresholds(stats),
      version: '1.0.0'
    }

    return baseline
  }

  calculateStatistics(values) {
    if (values.length === 0) {
      return null
    }

    const sorted = [...values].sort((a, b) => a - b)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length

    // Calculate variance and standard deviation
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)

    // Calculate percentiles
    const percentiles = this.calculatePercentiles(sorted)

    return {
      count: values.length,
      mean: mean,
      median: percentiles.p50,
      mode: this.calculateMode(values),
      min: Math.min(...values),
      max: Math.max(...values),
      range: Math.max(...values) - Math.min(...values),
      variance: variance,
      standardDeviation: stdDev,
      coefficientOfVariation: mean !== 0 ? (stdDev / Math.abs(mean)) : 0,
      percentiles: percentiles,
      outliers: this.detectOutliers(values, mean, stdDev)
    }
  }

  calculatePercentiles(sortedValues) {
    const length = sortedValues.length

    const getPercentile = (p) => {
      const index = (p / 100) * (length - 1)
      const lower = Math.floor(index)
      const upper = Math.ceil(index)

      if (lower === upper) {
        return sortedValues[lower]
      }

      return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower)
    }

    return {
      p1: getPercentile(1),
      p5: getPercentile(5),
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50), // median
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99)
    }
  }

  calculateMode(values) {
    const frequency = {}
    let maxFreq = 0
    let mode = null

    for (const value of values) {
      frequency[value] = (frequency[value] || 0) + 1
      if (frequency[value] > maxFreq) {
        maxFreq = frequency[value]
        mode = value
      }
    }

    return mode
  }

  detectOutliers(values, mean, stdDev) {
    const threshold = 2.5 // 2.5 standard deviations
    const outliers = []

    for (const value of values) {
      const zScore = Math.abs((value - mean) / stdDev)
      if (zScore > threshold) {
        outliers.push({ value, zScore })
      }
    }

    return outliers
  }

  calculateThresholds(stats) {
    if (!stats) return null

    // Calculate adaptive thresholds based on statistics
    return {
      // Warning thresholds (2 standard deviations)
      warning: {
        upper: stats.mean + (2 * stats.standardDeviation),
        lower: Math.max(0, stats.mean - (2 * stats.standardDeviation))
      },
      // Critical thresholds (3 standard deviations)
      critical: {
        upper: stats.mean + (3 * stats.standardDeviation),
        lower: Math.max(0, stats.mean - (3 * stats.standardDeviation))
      },
      // Percentile-based thresholds
      percentile: {
        warning: {
          upper: stats.percentiles.p95,
          lower: stats.percentiles.p5
        },
        critical: {
          upper: stats.percentiles.p99,
          lower: stats.percentiles.p1
        }
      },
      // Adaptive thresholds based on coefficient of variation
      adaptive: {
        high_variability: stats.coefficientOfVariation > 0.5,
        threshold_multiplier: Math.max(1.0, Math.min(3.0, stats.coefficientOfVariation * 2))
      }
    }
  }

  updateBaselines() {
    this.log('Updating performance baselines...', 'update')

    let updatedCount = 0
    let newCount = 0

    for (const metricName of this.historicalData.keys()) {
      const newBaseline = this.calculateBaseline(metricName)

      if (newBaseline) {
        const existing = this.baselines.get(metricName)

        if (existing) {
          // Check if update is needed
          if (this.shouldUpdateBaseline(existing, newBaseline)) {
            this.baselines.set(metricName, newBaseline)
            updatedCount++
          }
        } else {
          this.baselines.set(metricName, newBaseline)
          newCount++
        }
      }
    }

    this.statistics.totalBaselines = this.baselines.size
    this.statistics.lastUpdate = Date.now()
    this.statistics.nextUpdate = Date.now() + this.config.updateInterval

    this.log(`Baselines updated: ${newCount} new, ${updatedCount} updated`, 'success')

    // Save updated baselines
    this.saveBaselines()
    this.saveHistoricalData()
  }

  shouldUpdateBaseline(oldBaseline, newBaseline) {
    // Update if the new baseline represents a significant change
    const oldMean = oldBaseline.statistics.mean
    const newMean = newBaseline.statistics.mean

    // Consider coefficient of variation for adaptive updating
    const changeThreshold = Math.max(0.1, oldBaseline.statistics.coefficientOfVariation * 0.5)
    const meanChange = Math.abs((newMean - oldMean) / oldMean)

    return meanChange > changeThreshold
  }

  compareToBaseline(metricName, currentValue) {
    const baseline = this.baselines.get(metricName)

    if (!baseline) {
      return {
        status: 'no_baseline',
        message: 'No baseline available for this metric'
      }
    }

    const stats = baseline.statistics
    const thresholds = baseline.thresholds

    // Calculate deviation
    const deviation = currentValue - stats.mean
    const normalizedDeviation = deviation / stats.standardDeviation

    // Determine status
    let status = 'normal'
    let severity = 'info'

    if (currentValue > thresholds.critical.upper || currentValue < thresholds.critical.lower) {
      status = 'critical'
      severity = 'critical'
    } else if (currentValue > thresholds.warning.upper || currentValue < thresholds.warning.lower) {
      status = 'warning'
      severity = 'warning'
    }

    return {
      status,
      severity,
      currentValue,
      baseline: {
        mean: stats.mean,
        median: stats.median,
        standardDeviation: stats.standardDeviation
      },
      deviation: {
        absolute: deviation,
        normalized: normalizedDeviation,
        percentage: (deviation / stats.mean) * 100
      },
      thresholds: thresholds,
      percentile: this.calculateCurrentPercentile(currentValue, baseline),
      interpretation: this.interpretDeviation(normalizedDeviation, status)
    }
  }

  calculateCurrentPercentile(value, baseline) {
    const percentiles = baseline.statistics.percentiles

    for (const [percentile, threshold] of Object.entries(percentiles)) {
      if (value <= threshold) {
        return parseInt(percentile.substring(1)) // Remove 'p' prefix
      }
    }

    return 100 // Above 99th percentile
  }

  interpretDeviation(normalizedDeviation, status) {
    const absDeviation = Math.abs(normalizedDeviation)

    if (status === 'critical') {
      return `Extreme deviation (${absDeviation.toFixed(2)}σ) - immediate attention required`
    } else if (status === 'warning') {
      return `Significant deviation (${absDeviation.toFixed(2)}σ) - monitoring recommended`
    } else if (absDeviation > 1) {
      return `Moderate deviation (${absDeviation.toFixed(2)}σ) - within acceptable range`
    } else {
      return `Normal variation (${absDeviation.toFixed(2)}σ) - typical behavior`
    }
  }

  scheduleBaselineUpdates() {
    // Update baselines at startup
    setTimeout(() => {
      this.updateBaselines()
    }, 5000) // Wait 5 seconds for initial data

    // Schedule regular updates
    setInterval(() => {
      this.updateBaselines()
    }, this.config.updateInterval)

    this.log(`Baseline updates scheduled every ${this.config.updateInterval / (60 * 60 * 1000)} hours`, 'info')
  }

  getBaselineStatus() {
    return {
      totalBaselines: this.baselines.size,
      totalMetrics: this.historicalData.size,
      lastUpdate: this.statistics.lastUpdate,
      nextUpdate: this.statistics.nextUpdate,
      dataPoints: this.statistics.dataPoints,
      oldestData: this.getOldestDataPoint(),
      newestData: this.getNewestDataPoint()
    }
  }

  getOldestDataPoint() {
    let oldest = Date.now()

    for (const data of this.historicalData.values()) {
      if (data.length > 0) {
        const firstPoint = Math.min(...data.map(p => p.timestamp))
        oldest = Math.min(oldest, firstPoint)
      }
    }

    return oldest
  }

  getNewestDataPoint() {
    let newest = 0

    for (const data of this.historicalData.values()) {
      if (data.length > 0) {
        const lastPoint = Math.max(...data.map(p => p.timestamp))
        newest = Math.max(newest, lastPoint)
      }
    }

    return newest
  }

  generateBaselineReport() {
    const report = {
      timestamp: Date.now(),
      summary: this.getBaselineStatus(),
      baselines: {},
      analysis: {
        coverage: {},
        quality: {},
        recommendations: []
      }
    }

    // Add baseline details
    for (const [metricName, baseline] of this.baselines) {
      report.baselines[metricName] = {
        lastUpdated: baseline.timestamp,
        sampleCount: baseline.sampleCount,
        statistics: baseline.statistics,
        thresholds: baseline.thresholds
      }
    }

    // Analyze coverage
    const totalMetrics = this.historicalData.size
    const baselinedMetrics = this.baselines.size
    report.analysis.coverage = {
      totalMetrics,
      baselinedMetrics,
      coveragePercentage: totalMetrics > 0 ? (baselinedMetrics / totalMetrics) * 100 : 0,
      missingBaselines: this.getMissingBaselines()
    }

    // Analyze quality
    report.analysis.quality = this.analyzeBaselineQuality()

    // Generate recommendations
    report.analysis.recommendations = this.generateBaselineRecommendations()

    return report
  }

  getMissingBaselines() {
    const missing = []

    for (const metricName of this.historicalData.keys()) {
      if (!this.baselines.has(metricName)) {
        const dataPoints = this.historicalData.get(metricName).length
        missing.push({
          metric: metricName,
          dataPoints,
          reason: dataPoints < this.config.minimumSamples ? 'insufficient_data' : 'calculation_failed'
        })
      }
    }

    return missing
  }

  analyzeBaselineQuality() {
    const quality = {
      high: 0,
      medium: 0,
      low: 0,
      averageConfidence: 0,
      averageSampleCount: 0
    }

    let totalConfidence = 0
    let totalSamples = 0

    for (const baseline of this.baselines.values()) {
      const sampleCount = baseline.sampleCount
      const cv = baseline.statistics.coefficientOfVariation

      totalSamples += sampleCount

      // Determine quality based on sample count and variability
      let confidence = 0
      if (sampleCount >= this.config.minimumSamples * 5 && cv < 0.3) {
        quality.high++
        confidence = 0.95
      } else if (sampleCount >= this.config.minimumSamples * 2 && cv < 0.5) {
        quality.medium++
        confidence = 0.8
      } else {
        quality.low++
        confidence = 0.6
      }

      totalConfidence += confidence
    }

    const totalBaselines = this.baselines.size
    if (totalBaselines > 0) {
      quality.averageConfidence = totalConfidence / totalBaselines
      quality.averageSampleCount = totalSamples / totalBaselines
    }

    return quality
  }

  generateBaselineRecommendations() {
    const recommendations = []
    const status = this.getBaselineStatus()
    const quality = this.analyzeBaselineQuality()

    // Coverage recommendations
    if (status.totalBaselines < status.totalMetrics * 0.8) {
      recommendations.push({
        type: 'coverage',
        priority: 'medium',
        message: 'Low baseline coverage detected',
        suggestion: 'Collect more data for metrics without baselines'
      })
    }

    // Quality recommendations
    if (quality.low > quality.high) {
      recommendations.push({
        type: 'quality',
        priority: 'medium',
        message: 'Many baselines have low confidence',
        suggestion: 'Increase data collection duration for more reliable baselines'
      })
    }

    // Data freshness recommendations
    const dataAge = Date.now() - status.newestData
    if (dataAge > 24 * 60 * 60 * 1000) { // 24 hours
      recommendations.push({
        type: 'freshness',
        priority: 'high',
        message: 'Baseline data is stale',
        suggestion: 'Ensure continuous data collection is functioning'
      })
    }

    return recommendations
  }
}

module.exports = BaselineManager

// CLI interface
if (require.main === module) {
  const baselineManager = new BaselineManager()

  // Test with sample data
  console.log('🧪 Testing baseline manager with sample data...')

  // Add sample system metrics
  for (let i = 0; i < 200; i++) {
    const timestamp = Date.now() - (i * 60 * 1000) // Every minute going back
    baselineManager.addSystemMetrics({
      memory: {
        usagePercent: 70 + Math.random() * 20, // 70-90%
        used: 8000000000 + Math.random() * 2000000000,
        free: 2000000000 + Math.random() * 1000000000
      },
      cpu: {
        usage: 20 + Math.random() * 40, // 20-60%
        loadAverage: [1.2, 1.5, 1.8]
      },
      uptime: 86400 + i * 60
    })
  }

  // Add sample API metrics
  for (let i = 0; i < 150; i++) {
    const timestamp = Date.now() - (i * 120 * 1000) // Every 2 minutes
    baselineManager.addApiMetrics({
      responseTime: {
        '/api/status': 50 + Math.random() * 100,
        '/api/features': 100 + Math.random() * 200
      },
      errorRate: Math.random() * 2, // 0-2%
      cache: {
        stats: {
          hitRate: 85 + Math.random() * 10, // 85-95%
          size: 1000 + Math.random() * 500
        }
      }
    })
  }

  // Wait a moment then update baselines
  setTimeout(() => {
    baselineManager.updateBaselines()

    // Test comparison
    setTimeout(() => {
      const comparison = baselineManager.compareToBaseline('system.memory.usagePercent', 95)
      console.log('\n📊 Baseline comparison test:')
      console.log(JSON.stringify(comparison, null, 2))

      // Generate report
      const report = baselineManager.generateBaselineReport()
      console.log('\n📋 Baseline Report:')
      console.log(JSON.stringify(report, null, 2))

      console.log('\n✅ Baseline Manager test complete')
    }, 2000)
  }, 3000)
}