/**
 * Frontend Performance Benchmarks
 * Tests for measuring frontend component and application performance
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.ANVIL_URL || 'http://localhost:3000'
const RESULTS_DIR = path.join(__dirname, 'results')

class FrontendBenchmarks {
  constructor() {
    this.browser = null
    this.page = null
    this.results = {
      timestamp: new Date().toISOString(),
      url: BASE_URL,
      pageLoad: {},
      componentRendering: {},
      interactivity: {},
      resourceLoading: {}
    }
  }

  log(message, type = 'info') {
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      perf: '  📊'
    }[type]
    console.log(`${prefix} ${message}`)
  }

  async setup() {
    this.log('Launching browser...')
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    this.page = await this.browser.newPage()

    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 })

    // Enable performance metrics
    await this.page._client.send('Performance.enable')
  }

  async measurePageLoad() {
    this.log('Measuring page load performance...')

    const startTime = Date.now()

    // Navigate to the main page
    const response = await this.page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    const loadTime = Date.now() - startTime

    // Get performance metrics
    const performanceMetrics = await this.page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0]

      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')?.startTime || 0,
        domInteractive: perfData.domInteractive - perfData.navigationStart,
        totalLoadTime: perfData.loadEventEnd - perfData.navigationStart
      }
    })

    // Get resource loading metrics
    const resourceMetrics = await this.page.evaluate(() => {
      const resources = performance.getEntriesByType('resource')

      const byType = resources.reduce((acc, resource) => {
        const type = resource.initiatorType || 'other'
        if (!acc[type]) acc[type] = []
        acc[type].push(resource.duration)
        return acc
      }, {})

      const stats = {}
      for (const [type, durations] of Object.entries(byType)) {
        stats[type] = {
          count: durations.length,
          totalTime: durations.reduce((sum, d) => sum + d, 0),
          averageTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
          maxTime: Math.max(...durations)
        }
      }

      return stats
    })

    this.results.pageLoad = {
      totalLoadTime: loadTime,
      performanceMetrics,
      resourceMetrics,
      statusCode: response.status()
    }

    this.log(`Page load time: ${loadTime}ms`, 'perf')
    this.log(`First contentful paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`, 'perf')
  }

  async measureComponentRendering() {
    this.log('Measuring component rendering performance...')

    // Test feature toggle rendering time
    const featureToggleTime = await this.page.evaluate(async () => {
      const start = performance.now()

      // Simulate feature data loading
      const response = await fetch('/api/features')
      const data = await response.json()

      // Simulate React re-render time (approximation)
      const renderStart = performance.now()

      // Create a temporary DOM element to measure render impact
      const testDiv = document.createElement('div')
      testDiv.innerHTML = `
        <div class="feature-grid">
          ${Object.entries(data.features).map(([id, feature]) => `
            <div class="feature-card">
              <h3>${id}</h3>
              <label>
                <input type="checkbox" ${feature.enabled ? 'checked' : ''}>
                Enabled
              </label>
            </div>
          `).join('')}
        </div>
      `
      document.body.appendChild(testDiv)

      const renderEnd = performance.now()
      document.body.removeChild(testDiv)

      return {
        totalTime: renderEnd - start,
        renderTime: renderEnd - renderStart,
        dataFetchTime: renderStart - start
      }
    })

    // Test navigation performance
    const navigationTime = await this.page.evaluate(() => {
      const start = performance.now()

      // Simulate route change
      history.pushState({}, '', '/features')
      history.pushState({}, '', '/')

      return performance.now() - start
    })

    this.results.componentRendering = {
      featureToggle: featureToggleTime,
      navigation: navigationTime
    }

    this.log(`Feature toggle render: ${featureToggleTime.totalTime.toFixed(2)}ms`, 'perf')
    this.log(`Navigation time: ${navigationTime.toFixed(2)}ms`, 'perf')
  }

  async measureInteractivity() {
    this.log('Measuring interactivity performance...')

    // Test button click response time
    const clickResponseTime = await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const testButton = document.createElement('button')
        testButton.textContent = 'Test Button'
        document.body.appendChild(testButton)

        const start = performance.now()

        testButton.addEventListener('click', () => {
          const responseTime = performance.now() - start
          document.body.removeChild(testButton)
          resolve(responseTime)
        })

        testButton.click()
      })
    })

    // Test input field responsiveness
    const inputResponseTime = await this.page.evaluate(() => {
      const testInput = document.createElement('input')
      testInput.type = 'text'
      document.body.appendChild(testInput)

      const start = performance.now()

      testInput.focus()
      testInput.value = 'test input'

      const inputEvent = new Event('input', { bubbles: true })
      testInput.dispatchEvent(inputEvent)

      const responseTime = performance.now() - start
      document.body.removeChild(testInput)

      return responseTime
    })

    this.results.interactivity = {
      clickResponse: clickResponseTime,
      inputResponse: inputResponseTime
    }

    this.log(`Click response: ${clickResponseTime.toFixed(2)}ms`, 'perf')
    this.log(`Input response: ${inputResponseTime.toFixed(2)}ms`, 'perf')
  }

  async measureMemoryUsage() {
    this.log('Measuring memory usage...')

    const memoryInfo = await this.page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        }
      }
      return null
    })

    if (memoryInfo) {
      this.results.memory = memoryInfo
      this.log(`JS Heap used: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`, 'perf')
    }
  }

  generateBaseline() {
    return {
      timestamp: this.results.timestamp,
      thresholds: {
        pageLoad: {
          totalLoadTime: 3000,        // 3 seconds
          firstContentfulPaint: 1500, // 1.5 seconds
          domInteractive: 2000        // 2 seconds
        },
        componentRendering: {
          featureToggleTotal: 500,    // 500ms
          navigation: 100             // 100ms
        },
        interactivity: {
          clickResponse: 100,         // 100ms
          inputResponse: 50           // 50ms
        },
        memory: {
          maxHeapSize: 50 * 1024 * 1024 // 50MB
        }
      },
      actual: this.results
    }
  }

  checkPerformanceRegression(baseline) {
    const issues = []
    const warnings = []

    // Check page load performance
    if (this.results.pageLoad.totalLoadTime > baseline.thresholds.pageLoad.totalLoadTime) {
      issues.push(`Page load time (${this.results.pageLoad.totalLoadTime}ms) exceeds threshold (${baseline.thresholds.pageLoad.totalLoadTime}ms)`)
    }

    if (this.results.pageLoad.performanceMetrics.firstContentfulPaint > baseline.thresholds.pageLoad.firstContentfulPaint) {
      issues.push(`First contentful paint (${this.results.pageLoad.performanceMetrics.firstContentfulPaint.toFixed(2)}ms) exceeds threshold (${baseline.thresholds.pageLoad.firstContentfulPaint}ms)`)
    }

    // Check component rendering
    if (this.results.componentRendering.featureToggle.totalTime > baseline.thresholds.componentRendering.featureToggleTotal) {
      warnings.push(`Feature toggle render time (${this.results.componentRendering.featureToggle.totalTime.toFixed(2)}ms) exceeds target (${baseline.thresholds.componentRendering.featureToggleTotal}ms)`)
    }

    // Check interactivity
    if (this.results.interactivity.clickResponse > baseline.thresholds.interactivity.clickResponse) {
      issues.push(`Click response time (${this.results.interactivity.clickResponse.toFixed(2)}ms) exceeds threshold (${baseline.thresholds.interactivity.clickResponse}ms)`)
    }

    // Check memory usage
    if (this.results.memory && this.results.memory.usedJSHeapSize > baseline.thresholds.memory.maxHeapSize) {
      warnings.push(`JS heap usage (${(this.results.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB) exceeds target (${baseline.thresholds.memory.maxHeapSize / 1024 / 1024}MB)`)
    }

    return { issues, warnings }
  }

  saveResults() {
    const filename = `frontend-performance-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const filepath = path.join(RESULTS_DIR, filename)

    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true })
    }

    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2))

    // Also save as latest
    const latestPath = path.join(RESULTS_DIR, 'frontend-latest.json')
    fs.writeFileSync(latestPath, JSON.stringify(this.results, null, 2))

    this.log(`Results saved to: ${filepath}`, 'success')
    return filepath
  }

  generateReport() {
    this.log('\n📊 Frontend Performance Report')

    if (this.results.pageLoad.totalLoadTime) {
      this.log(`Page Load: ${this.results.pageLoad.totalLoadTime}ms`)
      this.log(`First Contentful Paint: ${this.results.pageLoad.performanceMetrics.firstContentfulPaint.toFixed(2)}ms`)
    }

    if (this.results.componentRendering.featureToggle) {
      this.log(`Feature Toggle Render: ${this.results.componentRendering.featureToggle.totalTime.toFixed(2)}ms`)
    }

    if (this.results.interactivity.clickResponse) {
      this.log(`Click Response: ${this.results.interactivity.clickResponse.toFixed(2)}ms`)
      this.log(`Input Response: ${this.results.interactivity.inputResponse.toFixed(2)}ms`)
    }

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
      this.log(`\n✅ All frontend performance metrics within acceptable ranges!`, 'success')
    }

    return {
      passed: regressionCheck.issues.length === 0,
      warnings: regressionCheck.warnings.length,
      issues: regressionCheck.issues.length
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close()
    }
  }

  async run() {
    console.log('🎨 Frontend Performance Testing Suite')
    console.log(`🌐 Testing against: ${BASE_URL}`)
    console.log('='.repeat(60))

    try {
      await this.setup()
      await this.measurePageLoad()
      await this.measureComponentRendering()
      await this.measureInteractivity()
      await this.measureMemoryUsage()

      const filepath = this.saveResults()
      const report = this.generateReport()

      this.log(`\n📁 Detailed results saved to: ${filepath}`)

      return report.passed

    } catch (error) {
      this.log(`Frontend test error: ${error.message}`, 'error')
      return false
    } finally {
      await this.cleanup()
    }
  }
}

// Note: This would require puppeteer to be installed
// For now, this is a framework for when puppeteer is available
if (require.main === module) {
  console.log('⚠️  Frontend benchmarks require puppeteer to be installed')
  console.log('Run: npm install puppeteer')
  console.log('Then run this script again to test frontend performance')
}

module.exports = FrontendBenchmarks