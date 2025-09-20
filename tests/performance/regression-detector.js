#!/usr/bin/env node

/**
 * Performance Regression Detection Framework
 * Automatically detects performance regressions by comparing current results with historical baselines
 */

const fs = require('fs')
const path = require('path')
const PerformanceTester = require('../../scripts/performance-test')

const RESULTS_DIR = path.join(__dirname, 'results')
const BASELINES_DIR = path.join(__dirname, 'baselines')
const REPORTS_DIR = path.join(__dirname, 'reports')

class RegressionDetector {
  constructor() {
    this.currentResults = null
    this.baseline = null
    this.regressions = []
    this.improvements = []
    this.warnings = []

    // Ensure directories exist
    const dirs = [RESULTS_DIR, BASELINES_DIR, REPORTS_DIR]
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  log(message, type = 'info') {
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      regression: '  📉',
      improvement: '  📈'
    }[type]
    console.log(`${prefix} ${message}`)
  }

  loadBaseline() {
    const baselinePath = path.join(BASELINES_DIR, 'baseline.json')

    if (!fs.existsSync(baselinePath)) {
      this.log('No baseline found. Creating new baseline...', 'warning')
      return null
    }

    try {
      this.baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
      this.log(`Loaded baseline from ${this.baseline.timestamp}`, 'success')
      return this.baseline
    } catch (error) {
      this.log(`Error loading baseline: ${error.message}`, 'error')
      return null
    }
  }

  async runCurrentTests() {
    this.log('Running current performance tests...')

    const tester = new PerformanceTester()
    const success = await tester.run()

    // Load the latest results
    const latestPath = path.join(RESULTS_DIR, 'latest.json')
    if (fs.existsSync(latestPath)) {
      this.currentResults = JSON.parse(fs.readFileSync(latestPath, 'utf8'))
      this.log('Current test results loaded', 'success')
    }

    return success
  }

  compareMetrics(current, baseline, metric, threshold = 0.1) {
    if (!current || !baseline) return null

    const change = ((current - baseline) / baseline) * 100
    const isRegression = change > threshold * 100
    const isImprovement = change < -threshold * 100

    return {
      current,
      baseline,
      change: change.toFixed(2),
      isRegression,
      isImprovement,
      metric
    }
  }

  analyzeApiPerformance() {
    if (!this.currentResults?.api || !this.baseline?.actual?.api) {
      this.log('Insufficient API performance data for comparison', 'warning')
      return
    }

    const current = this.currentResults.api
    const baseline = this.baseline.actual.api

    // Compare response times
    const metrics = [
      { path: 'features.average', name: 'Features endpoint average response time', threshold: 0.2 },
      { path: 'features.p95', name: 'Features endpoint P95 response time', threshold: 0.2 },
      { path: 'status.average', name: 'Status endpoint average response time', threshold: 0.2 },
      { path: 'singleFeature.average', name: 'Single feature endpoint average response time', threshold: 0.2 },
      { path: 'update.average', name: 'Update endpoint average response time', threshold: 0.2 },
      { path: 'featuresLoad.requestsPerSecond', name: 'Load test requests per second', threshold: -0.1, invert: true },
      { path: 'concurrentLoad.requestsPerSecond', name: 'Concurrent load requests per second', threshold: -0.1, invert: true }
    ]

    metrics.forEach(({ path, name, threshold, invert }) => {
      const currentValue = this.getNestedValue(current, path)
      const baselineValue = this.getNestedValue(baseline, path)

      if (currentValue !== null && baselineValue !== null) {
        const comparison = this.compareMetrics(currentValue, baselineValue, name, Math.abs(threshold))

        if (comparison) {
          // For inverted metrics (like requests per second), regression is when current < baseline
          if (invert) {
            comparison.isRegression = comparison.change < threshold * 100
            comparison.isImprovement = comparison.change > -threshold * 100
          }

          if (comparison.isRegression) {
            this.regressions.push({
              type: 'api',
              metric: name,
              ...comparison
            })
          } else if (comparison.isImprovement) {
            this.improvements.push({
              type: 'api',
              metric: name,
              ...comparison
            })
          }
        }
      }
    })
  }

  analyzeMemoryPerformance() {
    if (!this.currentResults?.memory || !this.baseline?.actual?.memory) {
      this.log('Insufficient memory data for comparison', 'warning')
      return
    }

    const current = this.currentResults.memory
    const baseline = this.baseline.actual.memory

    if (current.difference && baseline.difference) {
      const comparison = this.compareMetrics(current.difference, baseline.difference, 'Memory usage difference', 0.5)

      if (comparison?.isRegression) {
        this.regressions.push({
          type: 'memory',
          metric: 'Memory usage increase',
          ...comparison
        })
      } else if (comparison?.isImprovement) {
        this.improvements.push({
          type: 'memory',
          metric: 'Memory usage improvement',
          ...comparison
        })
      }
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  generateRegressionReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRegressions: this.regressions.length,
        totalImprovements: this.improvements.length,
        totalWarnings: this.warnings.length
      },
      baseline: {
        timestamp: this.baseline?.timestamp,
        source: 'baseline.json'
      },
      current: {
        timestamp: this.currentResults?.timestamp
      },
      regressions: this.regressions,
      improvements: this.improvements,
      warnings: this.warnings
    }

    return report
  }

  saveReport(report) {
    const filename = `regression-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const filepath = path.join(REPORTS_DIR, filename)

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))

    // Save as latest
    const latestPath = path.join(REPORTS_DIR, 'latest-regression-report.json')
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2))

    this.log(`Regression report saved to: ${filepath}`, 'success')
    return filepath
  }

  createNewBaseline() {
    if (!this.currentResults) {
      this.log('No current results to create baseline from', 'error')
      return false
    }

    const baseline = {
      timestamp: this.currentResults.timestamp,
      version: '1.0.0',
      thresholds: {
        api: {
          features: {
            averageResponseTime: 50,    // ms
            p95ResponseTime: 100       // ms
          },
          status: {
            averageResponseTime: 30,   // ms
            p95ResponseTime: 60        // ms
          },
          singleFeature: {
            averageResponseTime: 30,   // ms
            p95ResponseTime: 60        // ms
          },
          update: {
            averageResponseTime: 100,  // ms
          },
          load: {
            requestsPerSecond: 300,    // req/s minimum
            averageResponseTime: 50    // ms maximum
          }
        },
        memory: {
          maxHeapIncrease: 10 * 1024 * 1024 // 10MB maximum increase
        }
      },
      actual: this.currentResults
    }

    const baselinePath = path.join(BASELINES_DIR, 'baseline.json')
    fs.writeFileSync(baselinePath, JSON.stringify(baseline, null, 2))

    this.log(`New baseline created: ${baselinePath}`, 'success')
    return true
  }

  printReport(report) {
    this.log('\n📊 Performance Regression Detection Report')
    this.log(`Report generated: ${report.timestamp}`)

    if (report.baseline.timestamp) {
      this.log(`Baseline from: ${report.baseline.timestamp}`)
    }

    this.log(`\nSummary:`)
    this.log(`  Regressions: ${report.summary.totalRegressions}`)
    this.log(`  Improvements: ${report.summary.totalImprovements}`)
    this.log(`  Warnings: ${report.summary.totalWarnings}`)

    if (report.regressions.length > 0) {
      this.log(`\n📉 Performance Regressions Detected:`, 'regression')
      report.regressions.forEach(regression => {
        this.log(`  • ${regression.metric}: ${regression.change}% change (${regression.baseline} → ${regression.current})`, 'regression')
      })
    }

    if (report.improvements.length > 0) {
      this.log(`\n📈 Performance Improvements Detected:`, 'improvement')
      report.improvements.forEach(improvement => {
        this.log(`  • ${improvement.metric}: ${improvement.change}% improvement (${improvement.baseline} → ${improvement.current})`, 'improvement')
      })
    }

    if (report.warnings.length > 0) {
      this.log(`\n⚠️ Warnings:`, 'warning')
      report.warnings.forEach(warning => {
        this.log(`  • ${warning}`, 'warning')
      })
    }

    if (report.summary.totalRegressions === 0 && report.summary.totalWarnings === 0) {
      this.log(`\n✅ No performance regressions detected!`, 'success')
    }

    return report.summary.totalRegressions === 0
  }

  async run() {
    console.log('🔍 Performance Regression Detection')
    console.log('='.repeat(50))

    try {
      // Load existing baseline
      this.loadBaseline()

      // Run current performance tests
      const testSuccess = await this.runCurrentTests()

      if (!testSuccess) {
        this.log('Current performance tests failed', 'error')
        return false
      }

      // If no baseline exists, create one
      if (!this.baseline) {
        this.createNewBaseline()
        this.log('Baseline created. Run again to detect regressions.', 'success')
        return true
      }

      // Analyze for regressions
      this.analyzeApiPerformance()
      this.analyzeMemoryPerformance()

      // Generate and save report
      const report = this.generateRegressionReport()
      const reportPath = this.saveReport(report)

      // Print results
      const success = this.printReport(report)

      this.log(`\n📁 Detailed report saved to: ${reportPath}`)

      return success

    } catch (error) {
      this.log(`Regression detection failed: ${error.message}`, 'error')
      return false
    }
  }
}

// CLI interface
if (require.main === module) {
  const detector = new RegressionDetector()

  if (process.argv.includes('--create-baseline')) {
    detector.runCurrentTests().then(() => {
      detector.createNewBaseline()
    })
  } else {
    detector.run().then(success => {
      process.exit(success ? 0 : 1)
    }).catch(error => {
      console.error('Regression detection error:', error)
      process.exit(1)
    })
  }
}

module.exports = RegressionDetector