#!/usr/bin/env node

/**
 * Feature Performance Monitor
 * Monitors performance impact of new features and prevents regressions
 */

const fs = require('fs')
const path = require('path')
const axios = require('axios')

const BASE_URL = 'http://localhost:3000'

class FeaturePerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      baselineFile: path.join(__dirname, 'baselines/feature-baseline.json'),
      reportFile: path.join(__dirname, 'reports/feature-performance-report.json'),
      thresholds: {
        maxResponseTimeIncrease: 20, // Max 20% increase
        maxMemoryIncrease: 15,       // Max 15% increase
        minThroughputDecrease: -10   // Max 10% decrease
      },
      ...options
    }
    this.results = {
      timestamp: new Date().toISOString(),
      baseline: null,
      current: null,
      comparisons: [],
      violations: [],
      passed: true
    }
  }

  async runPerformanceMonitoring() {
    console.log('📊 Starting Feature Performance Monitoring...\n')

    // Load baseline
    await this.loadBaseline()

    // Run current performance tests
    await this.runCurrentTests()

    // Compare results
    this.comparePerformance()

    // Generate report
    this.generateReport()

    return this.results
  }

  async loadBaseline() {
    try {
      if (fs.existsSync(this.options.baselineFile)) {
        this.results.baseline = JSON.parse(fs.readFileSync(this.options.baselineFile, 'utf8'))
        console.log('✅ Baseline loaded successfully')
      } else {
        console.log('⚠️  No baseline found. Creating new baseline...')
        await this.createBaseline()
      }
    } catch (error) {
      console.log('❌ Error loading baseline:', error.message)
      throw error
    }
  }

  async createBaseline() {
    const baseline = await this.runPerformanceTests('baseline')

    // Ensure baseline directory exists
    const baselineDir = path.dirname(this.options.baselineFile)
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true })
    }

    fs.writeFileSync(this.options.baselineFile, JSON.stringify(baseline, null, 2))
    this.results.baseline = baseline
    console.log('✅ Baseline created and saved')
  }

  async runCurrentTests() {
    console.log('🔍 Running current performance tests...')
    this.results.current = await this.runPerformanceTests('current')
    console.log('✅ Current tests completed')
  }

  async runPerformanceTests(context) {
    const startTime = Date.now()
    const results = {
      context,
      timestamp: new Date().toISOString(),
      features: {},
      overall: {}
    }

    try {
      // Get list of features
      const featuresResponse = await axios.get(`${BASE_URL}/api/features`)
      const features = Object.keys(featuresResponse.data.features)

      // Test each feature's performance impact
      for (const featureId of features) {
        results.features[featureId] = await this.testFeaturePerformance(featureId)
      }

      // Test overall system performance
      results.overall = await this.testOverallPerformance()

      const endTime = Date.now()
      results.totalDuration = endTime - startTime

      return results

    } catch (error) {
      console.error(`Error running performance tests: ${error.message}`)
      throw error
    }
  }

  async testFeaturePerformance(featureId) {
    const metrics = {
      featureId,
      enabled: {},
      disabled: {},
      impact: {}
    }

    try {
      // Get current feature state
      const currentState = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      const wasEnabled = currentState.data.feature.enabled

      // Test with feature enabled
      await axios.put(`${BASE_URL}/api/features/${featureId}`, { enabled: true })
      metrics.enabled = await this.measureEndpointPerformance()

      // Test with feature disabled
      await axios.put(`${BASE_URL}/api/features/${featureId}`, { enabled: false })
      metrics.disabled = await this.measureEndpointPerformance()

      // Calculate impact
      metrics.impact = this.calculateImpact(metrics.enabled, metrics.disabled)

      // Restore original state
      await axios.put(`${BASE_URL}/api/features/${featureId}`, { enabled: wasEnabled })

      return metrics

    } catch (error) {
      console.error(`Error testing feature ${featureId}: ${error.message}`)
      return {
        featureId,
        error: error.message
      }
    }
  }

  async measureEndpointPerformance() {
    const endpoints = [
      '/api/features',
      '/api/features/status'
    ]

    const measurements = {
      endpoints: {},
      overall: {}
    }

    let totalRequests = 0
    let totalTime = 0
    let totalMemoryStart = process.memoryUsage().heapUsed

    for (const endpoint of endpoints) {
      const endpointMetrics = await this.measureSingleEndpoint(endpoint)
      measurements.endpoints[endpoint] = endpointMetrics
      totalRequests += endpointMetrics.requestCount
      totalTime += endpointMetrics.totalTime
    }

    let totalMemoryEnd = process.memoryUsage().heapUsed

    measurements.overall = {
      avgResponseTime: totalTime / totalRequests,
      requestsPerSecond: totalRequests / (totalTime / 1000),
      memoryUsed: totalMemoryEnd - totalMemoryStart,
      totalRequests
    }

    return measurements
  }

  async measureSingleEndpoint(endpoint) {
    const requestCount = 10
    const measurements = []

    for (let i = 0; i < requestCount; i++) {
      const startTime = Date.now()

      try {
        const response = await axios.get(`${BASE_URL}${endpoint}`)
        const endTime = Date.now()

        measurements.push({
          duration: endTime - startTime,
          status: response.status,
          size: JSON.stringify(response.data).length
        })
      } catch (error) {
        measurements.push({
          duration: 0,
          status: error.response?.status || 0,
          error: error.message
        })
      }
    }

    const successfulRequests = measurements.filter(m => m.status === 200)
    const totalTime = measurements.reduce((sum, m) => sum + m.duration, 0)
    const avgTime = successfulRequests.length > 0
      ? successfulRequests.reduce((sum, m) => sum + m.duration, 0) / successfulRequests.length
      : 0

    return {
      endpoint,
      requestCount,
      successfulRequests: successfulRequests.length,
      avgResponseTime: avgTime,
      minResponseTime: Math.min(...successfulRequests.map(m => m.duration)),
      maxResponseTime: Math.max(...successfulRequests.map(m => m.duration)),
      totalTime,
      errorRate: ((requestCount - successfulRequests.length) / requestCount) * 100
    }
  }

  async testOverallPerformance() {
    console.log('📈 Testing overall system performance...')

    const concurrentUsers = 5
    const requestsPerUser = 20
    const startTime = Date.now()

    const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
      const userMetrics = []

      for (let i = 0; i < requestsPerUser; i++) {
        const requestStart = Date.now()

        try {
          await axios.get(`${BASE_URL}/api/features`)
          const requestEnd = Date.now()
          userMetrics.push(requestEnd - requestStart)
        } catch (error) {
          userMetrics.push(-1) // Mark as error
        }
      }

      return userMetrics
    })

    const allUserMetrics = await Promise.all(userPromises)
    const endTime = Date.now()

    const allRequests = allUserMetrics.flat()
    const successfulRequests = allRequests.filter(time => time > 0)
    const totalDuration = endTime - startTime

    return {
      concurrentUsers,
      requestsPerUser,
      totalRequests: allRequests.length,
      successfulRequests: successfulRequests.length,
      avgResponseTime: successfulRequests.reduce((sum, time) => sum + time, 0) / successfulRequests.length,
      requestsPerSecond: successfulRequests.length / (totalDuration / 1000),
      errorRate: ((allRequests.length - successfulRequests.length) / allRequests.length) * 100,
      totalDuration
    }
  }

  calculateImpact(enabled, disabled) {
    if (!enabled.overall || !disabled.overall) {
      return { error: 'Insufficient data for impact calculation' }
    }

    return {
      responseTimeChange: this.calculatePercentageChange(
        disabled.overall.avgResponseTime,
        enabled.overall.avgResponseTime
      ),
      throughputChange: this.calculatePercentageChange(
        disabled.overall.requestsPerSecond,
        enabled.overall.requestsPerSecond
      ),
      memoryChange: this.calculatePercentageChange(
        disabled.overall.memoryUsed,
        enabled.overall.memoryUsed
      )
    }
  }

  calculatePercentageChange(baseline, current) {
    if (baseline === 0) return current === 0 ? 0 : 100
    return ((current - baseline) / baseline) * 100
  }

  comparePerformance() {
    if (!this.results.baseline || !this.results.current) {
      console.log('⚠️  Cannot compare performance: missing baseline or current data')
      return
    }

    console.log('🔍 Comparing performance with baseline...')

    // Compare overall performance
    this.compareOverallPerformance()

    // Compare individual features
    this.compareFeaturePerformance()

    console.log(`✅ Performance comparison completed. ${this.results.violations.length} violations found.`)
  }

  compareOverallPerformance() {
    const baseline = this.results.baseline.overall
    const current = this.results.current.overall

    if (!baseline || !current) return

    const comparison = {
      type: 'overall',
      metrics: {
        responseTime: {
          baseline: baseline.avgResponseTime,
          current: current.avgResponseTime,
          change: this.calculatePercentageChange(baseline.avgResponseTime, current.avgResponseTime)
        },
        throughput: {
          baseline: baseline.requestsPerSecond,
          current: current.requestsPerSecond,
          change: this.calculatePercentageChange(baseline.requestsPerSecond, current.requestsPerSecond)
        }
      }
    }

    this.results.comparisons.push(comparison)

    // Check for violations
    if (comparison.metrics.responseTime.change > this.options.thresholds.maxResponseTimeIncrease) {
      this.results.violations.push({
        type: 'response_time_regression',
        severity: 'high',
        metric: 'avgResponseTime',
        baseline: baseline.avgResponseTime,
        current: current.avgResponseTime,
        change: comparison.metrics.responseTime.change,
        threshold: this.options.thresholds.maxResponseTimeIncrease
      })
      this.results.passed = false
    }

    if (comparison.metrics.throughput.change < this.options.thresholds.minThroughputDecrease) {
      this.results.violations.push({
        type: 'throughput_regression',
        severity: 'high',
        metric: 'requestsPerSecond',
        baseline: baseline.requestsPerSecond,
        current: current.requestsPerSecond,
        change: comparison.metrics.throughput.change,
        threshold: this.options.thresholds.minThroughputDecrease
      })
      this.results.passed = false
    }
  }

  compareFeaturePerformance() {
    const baselineFeatures = this.results.baseline.features
    const currentFeatures = this.results.current.features

    for (const featureId of Object.keys(currentFeatures)) {
      if (!baselineFeatures[featureId]) continue

      const baselineImpact = baselineFeatures[featureId].impact
      const currentImpact = currentFeatures[featureId].impact

      if (!baselineImpact || !currentImpact || baselineImpact.error || currentImpact.error) continue

      // Check if feature impact has worsened
      const impactChange = {
        responseTime: currentImpact.responseTimeChange - baselineImpact.responseTimeChange,
        throughput: currentImpact.throughputChange - baselineImpact.throughputChange,
        memory: currentImpact.memoryChange - baselineImpact.memoryChange
      }

      const comparison = {
        type: 'feature',
        featureId,
        baselineImpact,
        currentImpact,
        impactChange
      }

      this.results.comparisons.push(comparison)

      // Check for violations
      if (impactChange.responseTime > this.options.thresholds.maxResponseTimeIncrease) {
        this.results.violations.push({
          type: 'feature_response_time_regression',
          severity: 'medium',
          featureId,
          metric: 'responseTimeImpact',
          baseline: baselineImpact.responseTimeChange,
          current: currentImpact.responseTimeChange,
          change: impactChange.responseTime,
          threshold: this.options.thresholds.maxResponseTimeIncrease
        })
        this.results.passed = false
      }
    }
  }

  generateReport() {
    console.log('\n📊 Performance Monitoring Report')
    console.log('=' .repeat(60))

    if (this.results.passed) {
      console.log('✅ No performance regressions detected!')
    } else {
      console.log(`❌ ${this.results.violations.length} performance violations found:`)
      this.results.violations.forEach((violation, index) => {
        console.log(`\n${index + 1}. ${violation.type.toUpperCase()}`)
        console.log(`   Feature: ${violation.featureId || 'Overall System'}`)
        console.log(`   Metric: ${violation.metric}`)
        console.log(`   Baseline: ${violation.baseline.toFixed(2)}`)
        console.log(`   Current: ${violation.current.toFixed(2)}`)
        console.log(`   Change: ${violation.change.toFixed(2)}% (threshold: ${violation.threshold}%)`)
        console.log(`   Severity: ${violation.severity}`)
      })
    }

    if (this.results.current?.overall) {
      console.log('\n📈 Current Performance Metrics:')
      console.log(`   Average Response Time: ${this.results.current.overall.avgResponseTime.toFixed(2)}ms`)
      console.log(`   Requests per Second: ${this.results.current.overall.requestsPerSecond.toFixed(2)}`)
      console.log(`   Error Rate: ${this.results.current.overall.errorRate.toFixed(2)}%`)
    }

    // Save detailed report
    const reportDir = path.dirname(this.options.reportFile)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(this.options.reportFile, JSON.stringify(this.results, null, 2))
    console.log(`\n📝 Detailed report saved to: ${this.options.reportFile}`)

    return this.results.passed
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {}

  if (args.includes('--create-baseline')) {
    // Force baseline creation
    const baselineFile = path.join(__dirname, 'baselines/feature-baseline.json')
    if (fs.existsSync(baselineFile)) {
      fs.unlinkSync(baselineFile)
    }
  }

  const monitor = new FeaturePerformanceMonitor(options)

  monitor.runPerformanceMonitoring()
    .then(results => {
      process.exit(results.passed ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Performance monitoring failed:', error.message)
      process.exit(1)
    })
}

module.exports = FeaturePerformanceMonitor