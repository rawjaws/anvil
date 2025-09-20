/**
 * Performance Testing Script for Anvil Optimizations
 * Tests cache performance, request pooling, and validation engine optimizations
 */

const http = require('http')
const { performance } = require('perf_hooks')

class PerformanceTester {
  constructor(config = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3000',
      concurrentRequests: config.concurrentRequests || 20,
      testDuration: config.testDuration || 30000, // 30 seconds
      warmupRequests: config.warmupRequests || 10,
      ...config
    }

    this.metrics = {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimeP95: 0,
      requestsPerSecond: 0,
      errors: []
    }

    this.responseTimes = []
  }

  /**
   * Make HTTP request and measure response time
   */
  async makeRequest(path = '/api/health') {
    return new Promise((resolve, reject) => {
      const startTime = performance.now()

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }

      const req = http.request(options, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          const endTime = performance.now()
          const responseTime = endTime - startTime

          resolve({
            statusCode: res.statusCode,
            responseTime,
            data,
            headers: res.headers
          })
        })
      })

      req.on('error', (error) => {
        const endTime = performance.now()
        const responseTime = endTime - startTime

        reject({
          error,
          responseTime
        })
      })

      req.setTimeout(10000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
  }

  /**
   * Test API endpoint performance
   */
  async testEndpoint(path, iterations = 100) {
    console.log(`\nTesting endpoint: ${path}`)
    console.log(`Iterations: ${iterations}`)

    const results = []
    const startTime = performance.now()

    // Warmup requests
    console.log('Warming up...')
    for (let i = 0; i < Math.min(this.config.warmupRequests, 5); i++) {
      try {
        await this.makeRequest(path)
      } catch (error) {
        // Ignore warmup errors
      }
    }

    // Actual test
    console.log('Running test...')
    const promises = []

    for (let i = 0; i < iterations; i++) {
      promises.push(
        this.makeRequest(path)
          .then(result => {
            this.metrics.requests++
            this.metrics.successfulRequests++
            this.metrics.totalResponseTime += result.responseTime
            this.responseTimes.push(result.responseTime)

            this.metrics.minResponseTime = Math.min(this.metrics.minResponseTime, result.responseTime)
            this.metrics.maxResponseTime = Math.max(this.metrics.maxResponseTime, result.responseTime)

            return result
          })
          .catch(error => {
            this.metrics.requests++
            this.metrics.failedRequests++
            this.metrics.errors.push(error)
            return { error: true, ...error }
          })
      )
    }

    const testResults = await Promise.all(promises)
    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Calculate metrics
    this.metrics.requestsPerSecond = (iterations / totalTime) * 1000
    this.metrics.averageResponseTime = this.metrics.totalResponseTime / this.metrics.successfulRequests || 0

    // Calculate P95
    if (this.responseTimes.length > 0) {
      this.responseTimes.sort((a, b) => a - b)
      const p95Index = Math.floor(this.responseTimes.length * 0.95)
      this.metrics.responseTimeP95 = this.responseTimes[p95Index] || 0
    }

    return {
      endpoint: path,
      iterations,
      totalTime,
      metrics: { ...this.metrics },
      successRate: (this.metrics.successfulRequests / this.metrics.requests) * 100
    }
  }

  /**
   * Test cache performance
   */
  async testCachePerformance() {
    console.log('\n=== CACHE PERFORMANCE TEST ===')

    // Test cache miss (first request)
    const cacheMissResult = await this.testEndpoint('/api/features', 1)

    // Reset metrics for cache hit test
    this.resetMetrics()

    // Test cache hit (subsequent requests)
    const cacheHitResult = await this.testEndpoint('/api/features', 50)

    // Get cache statistics
    try {
      const cacheStats = await this.makeRequest('/api/performance/cache')
      console.log('\nCache Statistics:', JSON.parse(cacheStats.data))
    } catch (error) {
      console.log('Could not retrieve cache statistics')
    }

    return {
      cacheMiss: cacheMissResult,
      cacheHit: cacheHitResult
    }
  }

  /**
   * Test concurrent request handling
   */
  async testConcurrency() {
    console.log('\n=== CONCURRENCY TEST ===')

    const concurrentTests = []
    const paths = [
      '/api/health',
      '/api/features',
      '/api/features/status',
      '/api/performance/overview'
    ]

    this.resetMetrics()

    for (let i = 0; i < this.config.concurrentRequests; i++) {
      const path = paths[i % paths.length]
      concurrentTests.push(this.makeRequest(path))
    }

    const startTime = performance.now()
    const results = await Promise.allSettled(concurrentTests)
    const endTime = performance.now()

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return {
      totalRequests: this.config.concurrentRequests,
      successful,
      failed,
      successRate: (successful / this.config.concurrentRequests) * 100,
      totalTime: endTime - startTime,
      requestsPerSecond: (this.config.concurrentRequests / (endTime - startTime)) * 1000
    }
  }

  /**
   * Test request pooling
   */
  async testRequestPooling() {
    console.log('\n=== REQUEST POOLING TEST ===')

    try {
      const poolStats = await this.makeRequest('/api/performance/pool')
      console.log('Request Pool Statistics:', JSON.parse(poolStats.data))
    } catch (error) {
      console.log('Could not retrieve pool statistics')
    }

    // Test high-load scenario
    this.resetMetrics()
    const highLoadResult = await this.testEndpoint('/api/health', 100)

    return highLoadResult
  }

  /**
   * Reset metrics for new test
   */
  resetMetrics() {
    this.metrics = {
      requests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimeP95: 0,
      requestsPerSecond: 0,
      errors: []
    }
    this.responseTimes = []
  }

  /**
   * Run complete performance test suite
   */
  async runFullTest() {
    console.log('🚀 Starting Anvil Performance Test Suite')
    console.log(`Base URL: ${this.config.baseUrl}`)
    console.log(`Test Configuration:`)
    console.log(`  - Concurrent Requests: ${this.config.concurrentRequests}`)
    console.log(`  - Warmup Requests: ${this.config.warmupRequests}`)

    try {
      // Health check first
      console.log('\n=== HEALTH CHECK ===')
      const healthCheck = await this.makeRequest('/api/health')
      console.log('Server Status:', JSON.parse(healthCheck.data).status)

      // Test cache performance
      const cacheResults = await this.testCachePerformance()

      // Test concurrency
      const concurrencyResults = await this.testConcurrency()

      // Test request pooling
      const poolingResults = await this.testRequestPooling()

      // Summary
      console.log('\n=== PERFORMANCE TEST SUMMARY ===')
      console.log('Cache Performance:')
      console.log(`  - Cache Miss Avg Response: ${cacheResults.cacheMiss.metrics.averageResponseTime?.toFixed(2)}ms`)
      console.log(`  - Cache Hit Avg Response: ${cacheResults.cacheHit.metrics.averageResponseTime?.toFixed(2)}ms`)
      console.log(`  - Cache Hit Improvement: ${((cacheResults.cacheMiss.metrics.averageResponseTime - cacheResults.cacheHit.metrics.averageResponseTime) / cacheResults.cacheMiss.metrics.averageResponseTime * 100).toFixed(1)}%`)

      console.log('\nConcurrency Performance:')
      console.log(`  - Success Rate: ${concurrencyResults.successRate?.toFixed(1)}%`)
      console.log(`  - Requests/Second: ${concurrencyResults.requestsPerSecond?.toFixed(1)}`)

      console.log('\nRequest Pooling:')
      console.log(`  - Avg Response Time: ${poolingResults.metrics.averageResponseTime?.toFixed(2)}ms`)
      console.log(`  - P95 Response Time: ${poolingResults.metrics.responseTimeP95?.toFixed(2)}ms`)
      console.log(`  - Success Rate: ${poolingResults.successRate?.toFixed(1)}%`)

      return {
        cache: cacheResults,
        concurrency: concurrencyResults,
        pooling: poolingResults
      }

    } catch (error) {
      console.error('Performance test failed:', error.message)
      throw error
    }
  }
}

// Export for use as module
module.exports = PerformanceTester

// Run test if called directly
if (require.main === module) {
  const tester = new PerformanceTester()
  tester.runFullTest()
    .then(results => {
      console.log('\n✅ Performance test completed successfully')
      process.exit(0)
    })
    .catch(error => {
      console.error('\n❌ Performance test failed:', error.message)
      process.exit(1)
    })
}