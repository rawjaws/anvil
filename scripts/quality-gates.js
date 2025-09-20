#!/usr/bin/env node

/**
 * Quality Gates Script
 * Validates branch quality before merge and ensures no regressions
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const axios = require('axios')

const BASE_URL = 'http://localhost:3000'

class QualityGateValidator {
  constructor(options = {}) {
    this.options = {
      strict: false,
      skipPerformanceTests: false,
      skipIntegrationTests: false,
      ...options
    }
    this.results = {
      gates: [],
      passed: 0,
      failed: 0,
      warnings: 0,
      summary: '',
      timestamp: new Date().toISOString()
    }
  }

  async runAllGates() {
    console.log('🚀 Running Quality Gates for Branch Validation...\n')

    const gates = [
      { name: 'Code Quality', fn: this.validateCodeQuality.bind(this) },
      { name: 'Integration Tests', fn: this.validateIntegrationTests.bind(this) },
      { name: 'Feature Isolation', fn: this.validateFeatureIsolation.bind(this) },
      { name: 'Performance Baseline', fn: this.validatePerformanceBaseline.bind(this) },
      { name: 'Concurrent Development Safety', fn: this.validateConcurrentSafety.bind(this) },
      { name: 'API Contract Compliance', fn: this.validateApiContracts.bind(this) },
      { name: 'Feature Flag Compatibility', fn: this.validateFeatureFlags.bind(this) }
    ]

    for (const gate of gates) {
      await this.runGate(gate.name, gate.fn)
    }

    this.generateReport()
    return this.results
  }

  async runGate(name, validationFn) {
    console.log(`🔍 Running ${name} gate...`)
    const startTime = Date.now()

    try {
      const result = await validationFn()
      const endTime = Date.now()

      const gateResult = {
        name,
        status: result.passed ? 'PASSED' : 'FAILED',
        duration: endTime - startTime,
        details: result.details || '',
        warnings: result.warnings || [],
        metrics: result.metrics || {}
      }

      this.results.gates.push(gateResult)

      if (result.passed) {
        this.results.passed++
        console.log(`✅ ${name}: PASSED (${gateResult.duration}ms)`)
      } else {
        this.results.failed++
        console.log(`❌ ${name}: FAILED (${gateResult.duration}ms)`)
        console.log(`   ${result.details}`)
      }

      if (result.warnings && result.warnings.length > 0) {
        this.results.warnings += result.warnings.length
        result.warnings.forEach(warning => {
          console.log(`⚠️  Warning: ${warning}`)
        })
      }

    } catch (error) {
      const endTime = Date.now()
      this.results.failed++
      this.results.gates.push({
        name,
        status: 'ERROR',
        duration: endTime - startTime,
        error: error.message,
        details: `Unexpected error during validation: ${error.message}`
      })
      console.log(`💥 ${name}: ERROR - ${error.message}`)
    }

    console.log('')
  }

  async validateCodeQuality() {
    const warnings = []

    // Check ESLint
    try {
      execSync('npm run lint', { stdio: 'pipe' })
    } catch (error) {
      return {
        passed: false,
        details: 'ESLint violations found. Run npm run lint:fix to resolve.'
      }
    }

    // Check for TODO/FIXME comments in new code
    try {
      const gitDiff = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
      const changedFiles = gitDiff.trim().split('\n').filter(f => f.endsWith('.js') || f.endsWith('.jsx'))

      for (const file of changedFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8')
          const todoMatches = content.match(/(TODO|FIXME|XXX|HACK)/gi)
          if (todoMatches) {
            warnings.push(`${file} contains ${todoMatches.length} TODO/FIXME comments`)
          }
        }
      }
    } catch (error) {
      // Ignore git diff errors (might be initial commit)
    }

    return {
      passed: true,
      warnings,
      metrics: {
        warnings: warnings.length
      }
    }
  }

  async validateIntegrationTests() {
    if (this.options.skipIntegrationTests) {
      return { passed: true, details: 'Integration tests skipped by option' }
    }

    try {
      // Run existing integration tests
      execSync('npm run test:integration', { stdio: 'pipe' })

      // Run parallel development tests
      execSync('npx jest tests/integration/parallel-development/ --verbose', { stdio: 'pipe' })

      return {
        passed: true,
        details: 'All integration tests passed',
        metrics: {
          testSuites: 2
        }
      }
    } catch (error) {
      return {
        passed: false,
        details: `Integration tests failed: ${error.message}`
      }
    }
  }

  async validateFeatureIsolation() {
    try {
      // Test that new features don't interfere with existing ones
      const response = await axios.get(`${BASE_URL}/api/features`)

      if (response.status !== 200) {
        return {
          passed: false,
          details: 'Feature API not responding correctly'
        }
      }

      const features = response.data.features

      // Check that core features are still present
      const coreFeatures = [
        'advancedAnalytics',
        'enhancedExporting',
        'collaborativeReviews',
        'aiWorkflowAutomation',
        'templateMarketplace',
        'requirementsPrecisionEngine'
      ]

      const missingFeatures = coreFeatures.filter(f => !features[f])

      if (missingFeatures.length > 0) {
        return {
          passed: false,
          details: `Missing core features: ${missingFeatures.join(', ')}`
        }
      }

      // Test feature isolation by toggling features
      const testFeature = 'advancedAnalytics'
      const originalState = features[testFeature].enabled

      // Toggle feature
      await axios.put(`${BASE_URL}/api/features/${testFeature}`, {
        enabled: !originalState
      })

      // Check other features weren't affected
      const afterToggle = await axios.get(`${BASE_URL}/api/features`)
      const otherFeatures = Object.entries(afterToggle.data.features)
        .filter(([id]) => id !== testFeature)

      let isolationViolation = false
      for (const [featureId, feature] of otherFeatures) {
        if (feature.enabled !== features[featureId].enabled) {
          isolationViolation = true
          break
        }
      }

      // Restore original state
      await axios.put(`${BASE_URL}/api/features/${testFeature}`, {
        enabled: originalState
      })

      if (isolationViolation) {
        return {
          passed: false,
          details: 'Feature isolation violation: toggling one feature affected others'
        }
      }

      return {
        passed: true,
        details: 'Feature isolation validated successfully',
        metrics: {
          featuresChecked: coreFeatures.length
        }
      }

    } catch (error) {
      return {
        passed: false,
        details: `Feature isolation validation failed: ${error.message}`
      }
    }
  }

  async validatePerformanceBaseline() {
    if (this.options.skipPerformanceTests) {
      return { passed: true, details: 'Performance tests skipped by option' }
    }

    try {
      // Run performance regression detector
      const regressionResult = execSync('npm run test:regression', { encoding: 'utf8' })

      // Check if baseline file exists
      const baselinePath = path.join(__dirname, '../tests/performance/baselines/current.json')
      if (!fs.existsSync(baselinePath)) {
        return {
          passed: false,
          details: 'Performance baseline file missing. Run npm run performance:baseline first.'
        }
      }

      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))

      // Basic performance thresholds
      const warnings = []
      if (baseline.avgResponseTime > 50) {
        warnings.push(`Average response time ${baseline.avgResponseTime}ms exceeds 50ms threshold`)
      }

      if (baseline.requestsPerSecond < 500) {
        warnings.push(`Requests per second ${baseline.requestsPerSecond} below 500 threshold`)
      }

      return {
        passed: true,
        warnings,
        details: 'Performance baseline validation completed',
        metrics: {
          avgResponseTime: baseline.avgResponseTime,
          requestsPerSecond: baseline.requestsPerSecond,
          memoryUsage: baseline.memoryUsage
        }
      }

    } catch (error) {
      return {
        passed: false,
        details: `Performance validation failed: ${error.message}`
      }
    }
  }

  async validateConcurrentSafety() {
    try {
      // Run concurrent feature development safety tests
      execSync('npx jest tests/integration/parallel-development/concurrent-features.test.js --verbose', { stdio: 'pipe' })

      // Test multiple simultaneous API calls
      const concurrentRequests = Array.from({ length: 5 }, () =>
        axios.get(`${BASE_URL}/api/features`)
      )

      const responses = await Promise.all(concurrentRequests)

      // All requests should succeed
      const allSuccessful = responses.every(r => r.status === 200)

      if (!allSuccessful) {
        return {
          passed: false,
          details: 'Concurrent API requests failed'
        }
      }

      // Responses should be consistent
      const firstResponse = responses[0].data
      const allConsistent = responses.every(r =>
        JSON.stringify(r.data) === JSON.stringify(firstResponse)
      )

      if (!allConsistent) {
        return {
          passed: false,
          details: 'Concurrent API responses are inconsistent'
        }
      }

      return {
        passed: true,
        details: 'Concurrent development safety validated',
        metrics: {
          concurrentRequests: responses.length
        }
      }

    } catch (error) {
      return {
        passed: false,
        details: `Concurrent safety validation failed: ${error.message}`
      }
    }
  }

  async validateApiContracts() {
    try {
      const endpoints = [
        { path: '/api/features', method: 'GET' },
        { path: '/api/features/status', method: 'GET' }
      ]

      for (const endpoint of endpoints) {
        const response = await axios.get(`${BASE_URL}${endpoint.path}`)

        if (response.status !== 200) {
          return {
            passed: false,
            details: `API endpoint ${endpoint.path} returned status ${response.status}`
          }
        }

        // Validate response structure
        if (!response.data.success) {
          return {
            passed: false,
            details: `API endpoint ${endpoint.path} missing success field`
          }
        }
      }

      return {
        passed: true,
        details: 'API contracts validated successfully',
        metrics: {
          endpointsChecked: endpoints.length
        }
      }

    } catch (error) {
      return {
        passed: false,
        details: `API contract validation failed: ${error.message}`
      }
    }
  }

  async validateFeatureFlags() {
    try {
      const response = await axios.get(`${BASE_URL}/api/features`)
      const features = response.data.features

      // Validate each feature has proper flag structure
      for (const [featureId, feature] of Object.entries(features)) {
        if (typeof feature.enabled !== 'boolean') {
          return {
            passed: false,
            details: `Feature ${featureId} has invalid enabled flag`
          }
        }

        if (!feature.config || typeof feature.config !== 'object') {
          return {
            passed: false,
            details: `Feature ${featureId} missing or invalid config object`
          }
        }
      }

      // Test feature flag toggling
      const testFeature = Object.keys(features)[0]
      const originalValue = features[testFeature].enabled

      // Toggle feature
      await axios.put(`${BASE_URL}/api/features/${testFeature}`, {
        enabled: !originalValue
      })

      // Verify change
      const updatedResponse = await axios.get(`${BASE_URL}/api/features/${testFeature}`)
      if (updatedResponse.data.feature.enabled === originalValue) {
        return {
          passed: false,
          details: 'Feature flag toggle not working correctly'
        }
      }

      // Restore original value
      await axios.put(`${BASE_URL}/api/features/${testFeature}`, {
        enabled: originalValue
      })

      return {
        passed: true,
        details: 'Feature flag system validated successfully',
        metrics: {
          featuresValidated: Object.keys(features).length
        }
      }

    } catch (error) {
      return {
        passed: false,
        details: `Feature flag validation failed: ${error.message}`
      }
    }
  }

  generateReport() {
    const totalGates = this.results.gates.length
    const passRate = (this.results.passed / totalGates) * 100

    console.log('\n📊 Quality Gates Summary')
    console.log('=' .repeat(50))
    console.log(`Total Gates: ${totalGates}`)
    console.log(`Passed: ${this.results.passed}`)
    console.log(`Failed: ${this.results.failed}`)
    console.log(`Warnings: ${this.results.warnings}`)
    console.log(`Pass Rate: ${passRate.toFixed(1)}%`)

    if (this.results.failed === 0) {
      this.results.summary = `✅ All quality gates passed! Branch is ready for merge.`
      console.log(`\n${this.results.summary}`)
    } else {
      this.results.summary = `❌ ${this.results.failed} quality gate(s) failed. Fix issues before merging.`
      console.log(`\n${this.results.summary}`)
    }

    // Save detailed report
    const reportPath = path.join(__dirname, '../tests/quality-gates-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
    console.log(`\n📝 Detailed report saved to: ${reportPath}`)

    return this.results.failed === 0
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {
    strict: args.includes('--strict'),
    skipPerformanceTests: args.includes('--skip-performance'),
    skipIntegrationTests: args.includes('--skip-integration')
  }

  const validator = new QualityGateValidator(options)

  validator.runAllGates()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1)
    })
    .catch(error => {
      console.error('💥 Quality gate validation failed:', error.message)
      process.exit(1)
    })
}

module.exports = QualityGateValidator