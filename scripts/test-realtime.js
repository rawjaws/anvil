#!/usr/bin/env node

/**
 * Automated Real-time Collaboration Testing Script
 * Comprehensive testing runner for all real-time collaboration features
 */

const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const axios = require('axios')

const BASE_URL = 'http://localhost:3000'
const TEST_RESULTS_DIR = path.join(__dirname, '../test-results/realtime')
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-')

class RealtimeTestRunner {
  constructor() {
    this.results = {
      startTime: new Date(),
      endTime: null,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      testSuites: [],
      coverage: {},
      performance: {},
      errors: []
    }

    this.testSuites = [
      {
        name: 'WebSocket Connection Tests',
        path: 'tests/feature-teams/realtime-collaboration/websocket-tests.test.js',
        category: 'connectivity',
        timeout: 60000
      },
      {
        name: 'Collaborative Editing Tests',
        path: 'tests/feature-teams/realtime-collaboration/collaborative-editing.test.js',
        category: 'editing',
        timeout: 90000
      },
      {
        name: 'Operational Transform Edge Cases',
        path: 'tests/feature-teams/realtime-collaboration/operational-transform-edge-cases.test.js',
        category: 'operational-transform',
        timeout: 120000
      },
      {
        name: 'User Presence Tests',
        path: 'tests/feature-teams/realtime-collaboration/user-presence-tests.test.js',
        category: 'presence',
        timeout: 90000
      },
      {
        name: 'Frontend-Backend Integration',
        path: 'tests/realtime-integration/frontend-backend-integration.test.js',
        category: 'integration',
        timeout: 120000
      },
      {
        name: 'WebSocket Performance Tests',
        path: 'tests/realtime-integration/websocket-performance.test.js',
        category: 'performance',
        timeout: 180000
      }
    ]

    this.configureEnvironment()
  }

  configureEnvironment() {
    // Ensure test results directory exists
    if (!fs.existsSync(TEST_RESULTS_DIR)) {
      fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true })
    }

    // Set environment variables for testing
    process.env.NODE_ENV = 'test'
    process.env.JEST_TIMEOUT = '300000' // 5 minutes default timeout
    process.env.REALTIME_TEST_MODE = 'true'
  }

  async checkServerHealth() {
    console.log('🔍 Checking server health...')

    try {
      const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 })
      if (response.status === 200) {
        console.log('✅ Server is healthy')
        return true
      } else {
        console.log('❌ Server health check failed')
        return false
      }
    } catch (error) {
      console.log('❌ Server is not responding:', error.message)
      return false
    }
  }

  async enableCollaborativeFeatures() {
    console.log('🔧 Enabling collaborative features...')

    try {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })
      console.log('✅ Collaborative features enabled')
    } catch (error) {
      console.log('⚠️  Could not enable collaborative features:', error.message)
    }
  }

  async runTestSuite(testSuite, index, total) {
    const { name, path: testPath, category, timeout } = testSuite

    console.log(`\\n[${index + 1}/${total}] 🧪 Running ${name}...`)
    console.log(`📁 Path: ${testPath}`)
    console.log(`🏷️  Category: ${category}`)

    const startTime = Date.now()
    const suiteResult = {
      name,
      category,
      path: testPath,
      startTime: new Date(),
      endTime: null,
      duration: 0,
      status: 'running',
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      output: '',
      errors: []
    }

    return new Promise((resolve) => {
      const jestArgs = [
        testPath,
        '--json',
        '--verbose',
        '--detectOpenHandles',
        '--forceExit',
        `--testTimeout=${timeout}`,
        '--maxWorkers=1', // Run serially to avoid port conflicts
        '--runInBand'
      ]

      console.log(`📝 Command: npx jest ${jestArgs.join(' ')}`)

      const jestProcess = spawn('npx', ['jest', ...jestArgs], {
        cwd: path.join(__dirname, '..'),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      })

      let stdout = ''
      let stderr = ''

      jestProcess.stdout.on('data', (data) => {
        const output = data.toString()
        stdout += output
        process.stdout.write(output)
      })

      jestProcess.stderr.on('data', (data) => {
        const output = data.toString()
        stderr += output
        process.stderr.write(output)
      })

      jestProcess.on('close', (code) => {
        const endTime = Date.now()
        suiteResult.endTime = new Date()
        suiteResult.duration = endTime - startTime
        suiteResult.output = stdout

        try {
          // Parse Jest JSON output
          const jsonOutput = stdout.split('\\n').find(line => line.startsWith('{'))
          if (jsonOutput) {
            const jestResult = JSON.parse(jsonOutput)

            suiteResult.tests = jestResult.numTotalTests || 0
            suiteResult.passed = jestResult.numPassedTests || 0
            suiteResult.failed = jestResult.numFailedTests || 0
            suiteResult.skipped = jestResult.numSkippedTests || 0

            if (jestResult.testResults && jestResult.testResults[0]) {
              const testResult = jestResult.testResults[0]
              if (testResult.assertionResults) {
                testResult.assertionResults.forEach(assertion => {
                  if (assertion.status === 'failed') {
                    suiteResult.errors.push({
                      test: assertion.title,
                      message: assertion.failureMessages?.join('\\n') || 'Unknown error'
                    })
                  }
                })
              }
            }
          }
        } catch (parseError) {
          console.log('⚠️  Could not parse Jest output:', parseError.message)
          // Fallback: estimate results from exit code
          if (code === 0) {
            suiteResult.status = 'passed'
            suiteResult.passed = 1
            suiteResult.tests = 1
          } else {
            suiteResult.status = 'failed'
            suiteResult.failed = 1
            suiteResult.tests = 1
            suiteResult.errors.push({
              test: 'Suite execution',
              message: stderr || 'Test suite failed'
            })
          }
        }

        if (code === 0) {
          console.log(`✅ ${name} completed successfully`)
          suiteResult.status = 'passed'
        } else {
          console.log(`❌ ${name} failed with exit code ${code}`)
          suiteResult.status = 'failed'
        }

        console.log(`⏱️  Duration: ${(suiteResult.duration / 1000).toFixed(2)}s`)
        console.log(`📊 Tests: ${suiteResult.tests}, Passed: ${suiteResult.passed}, Failed: ${suiteResult.failed}, Skipped: ${suiteResult.skipped}`)

        this.results.testSuites.push(suiteResult)
        this.results.totalTests += suiteResult.tests
        this.results.passedTests += suiteResult.passed
        this.results.failedTests += suiteResult.failed
        this.results.skippedTests += suiteResult.skipped

        resolve(suiteResult)
      })

      // Handle timeout
      setTimeout(() => {
        if (!jestProcess.killed) {
          console.log(`⏰ ${name} timed out after ${timeout}ms`)
          jestProcess.kill('SIGKILL')
        }
      }, timeout + 5000) // Extra 5 seconds grace period
    })
  }

  async runAllTests() {
    console.log('🚀 Starting Real-time Collaboration Test Suite')
    console.log(`📅 Timestamp: ${TIMESTAMP}`)
    console.log(`📁 Results will be saved to: ${TEST_RESULTS_DIR}`)

    // Pre-flight checks
    const serverHealthy = await this.checkServerHealth()
    if (!serverHealthy) {
      console.log('❌ Cannot proceed without healthy server. Please start the server and try again.')
      process.exit(1)
    }

    await this.enableCollaborativeFeatures()

    console.log(`\\n🧪 Running ${this.testSuites.length} test suites...`)

    // Run test suites sequentially to avoid conflicts
    for (let i = 0; i < this.testSuites.length; i++) {
      const testSuite = this.testSuites[i]

      try {
        await this.runTestSuite(testSuite, i, this.testSuites.length)

        // Small delay between test suites to ensure cleanup
        if (i < this.testSuites.length - 1) {
          console.log('⏸️  Waiting 3 seconds before next suite...')
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      } catch (error) {
        console.log(`💥 Error running ${testSuite.name}:`, error.message)
        this.results.errors.push({
          suite: testSuite.name,
          error: error.message
        })
      }
    }

    this.results.endTime = new Date()
    await this.generateReport()
  }

  async generateReport() {
    console.log('\\n📊 Generating test report...')

    const totalDuration = this.results.endTime - this.results.startTime
    const successRate = this.results.totalTests > 0
      ? ((this.results.passedTests / this.results.totalTests) * 100).toFixed(2)
      : 0

    // Console summary
    console.log('\\n' + '='.repeat(80))
    console.log('🎯 REAL-TIME COLLABORATION TEST SUMMARY')
    console.log('='.repeat(80))
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`)
    console.log(`🧪 Total Tests: ${this.results.totalTests}`)
    console.log(`✅ Passed: ${this.results.passedTests}`)
    console.log(`❌ Failed: ${this.results.failedTests}`)
    console.log(`⏭️  Skipped: ${this.results.skippedTests}`)
    console.log(`📈 Success Rate: ${successRate}%`)

    // Suite breakdown
    console.log('\\n📋 Suite Breakdown:')
    this.results.testSuites.forEach(suite => {
      const suiteSuccessRate = suite.tests > 0
        ? ((suite.passed / suite.tests) * 100).toFixed(1)
        : 0
      const statusIcon = suite.status === 'passed' ? '✅' : '❌'

      console.log(`${statusIcon} ${suite.name}: ${suite.passed}/${suite.tests} (${suiteSuccessRate}%) - ${(suite.duration / 1000).toFixed(1)}s`)
    })

    // Failed tests details
    if (this.results.failedTests > 0) {
      console.log('\\n💥 Failed Tests:')
      this.results.testSuites.forEach(suite => {
        if (suite.errors.length > 0) {
          console.log(`\\n📁 ${suite.name}:`)
          suite.errors.forEach(error => {
            console.log(`  ❌ ${error.test}: ${error.message.split('\\n')[0]}`)
          })
        }
      })
    }

    // Generate detailed JSON report
    const reportPath = path.join(TEST_RESULTS_DIR, `realtime-test-report-${TIMESTAMP}.json`)
    const detailedReport = {
      ...this.results,
      meta: {
        timestamp: TIMESTAMP,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        environment: process.env.NODE_ENV,
        baseUrl: BASE_URL
      },
      summary: {
        totalDuration: totalDuration,
        successRate: parseFloat(successRate),
        averageTestDuration: this.results.totalTests > 0
          ? totalDuration / this.results.totalTests
          : 0
      }
    }

    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2))
    console.log(`\\n📄 Detailed report saved: ${reportPath}`)

    // Generate HTML report
    await this.generateHtmlReport(detailedReport)

    // Exit with appropriate code
    const exitCode = this.results.failedTests > 0 ? 1 : 0
    console.log(`\\n🏁 Test run ${exitCode === 0 ? 'PASSED' : 'FAILED'}`)

    return exitCode
  }

  async generateHtmlReport(detailedReport) {
    const htmlPath = path.join(TEST_RESULTS_DIR, `realtime-test-report-${TIMESTAMP}.html`)

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Real-time Collaboration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #2196F3; }
        .metric-label { color: #666; margin-top: 5px; }
        .success { color: #4CAF50; }
        .error { color: #F44336; }
        .warning { color: #FF9800; }
        .suite { border: 1px solid #ddd; border-radius: 6px; margin-bottom: 20px; }
        .suite-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #ddd; }
        .suite-content { padding: 15px; }
        .test-item { padding: 8px 0; border-bottom: 1px solid #eee; }
        .test-item:last-child { border-bottom: none; }
        .status-passed { color: #4CAF50; }
        .status-failed { color: #F44336; }
        .status-skipped { color: #FF9800; }
        .error-details { background: #ffebee; border-left: 4px solid #F44336; padding: 10px; margin: 10px 0; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔄 Real-time Collaboration Test Report</h1>
            <p class="timestamp">Generated: ${detailedReport.meta.timestamp}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <div class="metric-value ${detailedReport.summary.successRate >= 90 ? 'success' : detailedReport.summary.successRate >= 70 ? 'warning' : 'error'}">${detailedReport.summary.successRate}%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${detailedReport.totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${detailedReport.passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value error">${detailedReport.failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(detailedReport.summary.totalDuration / 1000).toFixed(1)}s</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>

        <h2>📋 Test Suites</h2>
        ${detailedReport.testSuites.map(suite => `
            <div class="suite">
                <div class="suite-header">
                    <h3>${suite.status === 'passed' ? '✅' : '❌'} ${suite.name}</h3>
                    <p><strong>Category:</strong> ${suite.category} | <strong>Duration:</strong> ${(suite.duration / 1000).toFixed(1)}s | <strong>Tests:</strong> ${suite.tests}</p>
                </div>
                <div class="suite-content">
                    <div class="test-item">
                        <span class="status-passed">✅ Passed: ${suite.passed}</span> |
                        <span class="status-failed">❌ Failed: ${suite.failed}</span> |
                        <span class="status-skipped">⏭️ Skipped: ${suite.skipped}</span>
                    </div>
                    ${suite.errors.length > 0 ? `
                        <h4>❌ Errors:</h4>
                        ${suite.errors.map(error => `
                            <div class="error-details">
                                <strong>${error.test}</strong><br>
                                <code>${error.message}</code>
                            </div>
                        `).join('')}
                    ` : ''}
                </div>
            </div>
        `).join('')}

        <h2>🔧 Environment</h2>
        <ul>
            <li><strong>Node Version:</strong> ${detailedReport.meta.nodeVersion}</li>
            <li><strong>Platform:</strong> ${detailedReport.meta.platform} (${detailedReport.meta.arch})</li>
            <li><strong>Environment:</strong> ${detailedReport.meta.environment}</li>
            <li><strong>Base URL:</strong> ${detailedReport.meta.baseUrl}</li>
        </ul>
    </div>
</body>
</html>
    `

    fs.writeFileSync(htmlPath, html)
    console.log(`📊 HTML report saved: ${htmlPath}`)
  }
}

// CLI execution
if (require.main === module) {
  const runner = new RealtimeTestRunner()

  runner.runAllTests()
    .then((exitCode) => {
      process.exit(exitCode)
    })
    .catch((error) => {
      console.error('💥 Test runner failed:', error)
      process.exit(1)
    })
}

module.exports = RealtimeTestRunner