#!/usr/bin/env node

/**
 * Performance Testing Script
 * Comprehensive performance benchmarks for Anvil backend API and frontend components
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.ANVIL_URL || 'http://localhost:3000'
const PERFORMANCE_RESULTS_DIR = path.join(__dirname, '../tests/performance/results')

class PerformanceTester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      api: {},
      frontend: {},
      summary: {}
    }

    // Ensure results directory exists
    if (!fs.existsSync(PERFORMANCE_RESULTS_DIR)) {
      fs.mkdirSync(PERFORMANCE_RESULTS_DIR, { recursive: true })
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      perf: '  📊'
    }[type]
    console.log(`${prefix} ${message}`)
  }

  async measureResponseTime(url, method = 'GET', data = null, iterations = 10) {
    const times = []

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint()

      try {
        if (method === 'GET') {
          await axios.get(url)
        } else if (method === 'PUT') {
          await axios.put(url, data)
        } else if (method === 'POST') {
          await axios.post(url, data)
        }

        const end = process.hrtime.bigint()
        const duration = Number(end - start) / 1000000 // Convert to milliseconds
        times.push(duration)
      } catch (error) {
        this.log(`Error in iteration ${i + 1}: ${error.message}`, 'error')
        throw error
      }
    }

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
      p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)],
      times: times
    }
  }

  async loadTest(url, concurrent = 5, totalRequests = 50) {
    const requestsPerWorker = Math.floor(totalRequests / concurrent)
    const workers = []

    this.log(`Starting load test: ${concurrent} concurrent workers, ${totalRequests} total requests`)

    const startTime = process.hrtime.bigint()

    for (let i = 0; i < concurrent; i++) {
      workers.push(this.workerLoadTest(url, requestsPerWorker))
    }

    const results = await Promise.all(workers)
    const endTime = process.hrtime.bigint()

    const totalTime = Number(endTime - startTime) / 1000000000 // Convert to seconds
    const allTimes = results.flat()

    return {
      totalTime: totalTime,
      requestsPerSecond: totalRequests / totalTime,
      averageResponseTime: allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length,
      minResponseTime: Math.min(...allTimes),
      maxResponseTime: Math.max(...allTimes),
      p95ResponseTime: allTimes.sort((a, b) => a - b)[Math.floor(allTimes.length * 0.95)],
      concurrent: concurrent,
      totalRequests: totalRequests
    }
  }

  async workerLoadTest(url, requests) {
    const times = []

    for (let i = 0; i < requests; i++) {
      const start = process.hrtime.bigint()

      try {
        await axios.get(url)
        const end = process.hrtime.bigint()
        const duration = Number(end - start) / 1000000 // Convert to milliseconds
        times.push(duration)
      } catch (error) {
        this.log(`Worker request failed: ${error.message}`, 'error')
      }
    }

    return times
  }

  async testApiPerformance() {
    this.log('\n📊 API Performance Testing')

    // Test individual endpoint response times
    this.log('Testing /api/features endpoint response time...')
    const featuresPerf = await this.measureResponseTime(`${BASE_URL}/api/features`)
    this.results.api.features = featuresPerf
    this.log(`Features endpoint - Avg: ${featuresPerf.average.toFixed(2)}ms, P95: ${featuresPerf.p95.toFixed(2)}ms`, 'perf')

    this.log('Testing /api/features/status endpoint response time...')
    const statusPerf = await this.measureResponseTime(`${BASE_URL}/api/features/status`)
    this.results.api.status = statusPerf
    this.log(`Status endpoint - Avg: ${statusPerf.average.toFixed(2)}ms, P95: ${statusPerf.p95.toFixed(2)}ms`, 'perf')

    // Test individual feature endpoint
    this.log('Testing individual feature endpoint response time...')
    const singleFeaturePerf = await this.measureResponseTime(`${BASE_URL}/api/features/advancedAnalytics`)
    this.results.api.singleFeature = singleFeaturePerf
    this.log(`Single feature endpoint - Avg: ${singleFeaturePerf.average.toFixed(2)}ms, P95: ${singleFeaturePerf.p95.toFixed(2)}ms`, 'perf')

    // Load testing
    this.log('Running load test on /api/features...')
    const featuresLoad = await this.loadTest(`${BASE_URL}/api/features`, 5, 50)
    this.results.api.featuresLoad = featuresLoad
    this.log(`Features load test - ${featuresLoad.requestsPerSecond.toFixed(2)} req/s, Avg: ${featuresLoad.averageResponseTime.toFixed(2)}ms`, 'perf')

    this.log('Running concurrent load test on /api/features...')
    const concurrentLoad = await this.loadTest(`${BASE_URL}/api/features`, 10, 100)
    this.results.api.concurrentLoad = concurrentLoad
    this.log(`Concurrent load test - ${concurrentLoad.requestsPerSecond.toFixed(2)} req/s, Avg: ${concurrentLoad.averageResponseTime.toFixed(2)}ms`, 'perf')

    // Test update performance
    this.log('Testing feature update performance...')
    const updateTimes = []
    for (let i = 0; i < 5; i++) {
      const start = process.hrtime.bigint()
      await axios.put(`${BASE_URL}/api/features/advancedAnalytics`, { enabled: i % 2 === 0 })
      const end = process.hrtime.bigint()
      updateTimes.push(Number(end - start) / 1000000)
    }

    const updatePerf = {
      average: updateTimes.reduce((sum, time) => sum + time, 0) / updateTimes.length,
      min: Math.min(...updateTimes),
      max: Math.max(...updateTimes),
      times: updateTimes
    }
    this.results.api.update = updatePerf
    this.log(`Update performance - Avg: ${updatePerf.average.toFixed(2)}ms`, 'perf')
  }

  async testMemoryUsage() {
    this.log('\n🧠 Memory Usage Analysis')

    const initialMemory = process.memoryUsage()
    this.log(`Initial memory usage: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`)

    // Perform memory-intensive operations
    const responses = []
    for (let i = 0; i < 20; i++) {
      const response = await axios.get(`${BASE_URL}/api/features`)
      responses.push(response.data)
    }

    const afterMemory = process.memoryUsage()
    this.log(`Memory after 20 requests: ${(afterMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`)

    this.results.memory = {
      initial: initialMemory,
      after20Requests: afterMemory,
      difference: afterMemory.heapUsed - initialMemory.heapUsed
    }

    // Cleanup
    responses.length = 0
    if (global.gc) {
      global.gc()
      const afterGC = process.memoryUsage()
      this.log(`Memory after GC: ${(afterGC.heapUsed / 1024 / 1024).toFixed(2)} MB`)
      this.results.memory.afterGC = afterGC
    }
  }

  generateBaseline() {
    const baseline = {
      timestamp: this.results.timestamp,
      thresholds: {
        api: {
          features: {
            averageResponseTime: 100, // ms
            p95ResponseTime: 200     // ms
          },
          status: {
            averageResponseTime: 50,  // ms
            p95ResponseTime: 100     // ms
          },
          singleFeature: {
            averageResponseTime: 50,  // ms
            p95ResponseTime: 100     // ms
          },
          update: {
            averageResponseTime: 150, // ms
          },
          load: {
            requestsPerSecond: 50,    // req/s minimum
            averageResponseTime: 200  // ms maximum
          }
        },
        memory: {
          maxHeapIncrease: 50 * 1024 * 1024 // 50MB maximum increase
        }
      },
      actual: {
        api: this.results.api,
        memory: this.results.memory
      }
    }

    return baseline
  }

  checkPerformanceRegression(baseline) {
    const issues = []
    const warnings = []

    // Check API performance
    if (this.results.api.features?.average > baseline.thresholds.api.features.averageResponseTime) {
      issues.push(`Features endpoint average response time (${this.results.api.features.average.toFixed(2)}ms) exceeds threshold (${baseline.thresholds.api.features.averageResponseTime}ms)`)
    }

    if (this.results.api.features?.p95 > baseline.thresholds.api.features.p95ResponseTime) {
      issues.push(`Features endpoint P95 response time (${this.results.api.features.p95.toFixed(2)}ms) exceeds threshold (${baseline.thresholds.api.features.p95ResponseTime}ms)`)
    }

    if (this.results.api.featuresLoad?.requestsPerSecond < baseline.thresholds.api.load.requestsPerSecond) {
      warnings.push(`Load test requests per second (${this.results.api.featuresLoad.requestsPerSecond.toFixed(2)}) below target (${baseline.thresholds.api.load.requestsPerSecond})`)
    }

    // Check memory usage
    if (this.results.memory?.difference > baseline.thresholds.memory.maxHeapIncrease) {
      issues.push(`Memory usage increase (${(this.results.memory.difference / 1024 / 1024).toFixed(2)}MB) exceeds threshold (${baseline.thresholds.memory.maxHeapIncrease / 1024 / 1024}MB)`)
    }

    return { issues, warnings }
  }

  saveResults() {
    const filename = `performance-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const filepath = path.join(PERFORMANCE_RESULTS_DIR, filename)

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2))
    this.log(`Results saved to: ${filepath}`, 'success')

    // Also save as latest for easy access
    const latestPath = path.join(PERFORMANCE_RESULTS_DIR, 'latest.json')
    fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2))

    return filepath
  }

  generateReport() {
    this.log('\n📊 Performance Test Report')
    this.log(`Test completed at: ${this.results.timestamp}`)

    if (this.results.api.features) {
      this.log(`\nAPI Performance:`)
      this.log(`  Features endpoint: ${this.results.api.features.average.toFixed(2)}ms avg, ${this.results.api.features.p95.toFixed(2)}ms P95`)
      this.log(`  Status endpoint: ${this.results.api.status.average.toFixed(2)}ms avg, ${this.results.api.status.p95.toFixed(2)}ms P95`)
      this.log(`  Single feature: ${this.results.api.singleFeature.average.toFixed(2)}ms avg, ${this.results.api.singleFeature.p95.toFixed(2)}ms P95`)
      this.log(`  Update performance: ${this.results.api.update.average.toFixed(2)}ms avg`)
    }

    if (this.results.api.featuresLoad) {
      this.log(`\nLoad Test Results:`)
      this.log(`  Basic load: ${this.results.api.featuresLoad.requestsPerSecond.toFixed(2)} req/s`)
      this.log(`  Concurrent load: ${this.results.api.concurrentLoad.requestsPerSecond.toFixed(2)} req/s`)
    }

    if (this.results.memory) {
      this.log(`\nMemory Usage:`)
      this.log(`  Memory increase: ${(this.results.memory.difference / 1024 / 1024).toFixed(2)} MB`)
    }

    // Generate baseline and check for regressions
    const baseline = this.generateBaseline()
    const regressionCheck = this.checkPerformanceRegression(baseline)

    if (regressionCheck.issues.length > 0) {
      this.log(`\n❌ Performance Issues Found:`, 'error')
      regressionCheck.issues.forEach(issue => this.log(`  • ${issue}`, 'error'))
    }

    if (regressionCheck.warnings.length > 0) {
      this.log(`\n⚠️ Performance Warnings:`, 'warning')
      regressionCheck.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'))
    }

    if (regressionCheck.issues.length === 0 && regressionCheck.warnings.length === 0) {
      this.log(`\n✅ All performance metrics within acceptable ranges!`, 'success')
    }

    return {
      passed: regressionCheck.issues.length === 0,
      warnings: regressionCheck.warnings.length,
      issues: regressionCheck.issues.length
    }
  }

  async run() {
    console.log('🚀 Anvil Performance Testing Suite')
    console.log(`🌐 Testing against: ${BASE_URL}`)
    console.log('='.repeat(60))

    try {
      // Wait for server to be available
      this.log('Waiting for server to be available...')
      await axios.get(`${BASE_URL}/api/features`)
      this.log('Server is available', 'success')

      await this.testApiPerformance()
      await this.testMemoryUsage()

      const filepath = this.saveResults()
      const report = this.generateReport()

      this.log(`\n📁 Detailed results saved to: ${filepath}`)

      return report.passed

    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error')
      return false
    }
  }
}

// Run performance tests if called directly
if (require.main === module) {
  const tester = new PerformanceTester()
  tester.run().then(success => {
    process.exit(success ? 0 : 1)
  }).catch(error => {
    console.error('Performance test failed:', error)
    process.exit(1)
  })
}

module.exports = PerformanceTester