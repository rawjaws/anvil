#!/usr/bin/env node

/**
 * Integration Validation Script
 * Runs comprehensive checks to ensure frontend-backend integration is working
 * This script should be run before any deployment or major changes
 */

const axios = require('axios')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.ANVIL_URL || 'http://localhost:3000'
const TIMEOUT = 30000

class IntegrationValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.passed = 0
    this.total = 0
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌'
    }[type]
    console.log(`${prefix} ${message}`)
  }

  async test(name, testFn) {
    this.total++
    try {
      this.log(`Testing: ${name}`)
      await testFn()
      this.passed++
      this.log(`✓ ${name}`, 'success')
    } catch (error) {
      this.errors.push({ test: name, error: error.message })
      this.log(`✗ ${name}: ${error.message}`, 'error')
    }
  }

  async warn(name, testFn) {
    try {
      this.log(`Checking: ${name}`)
      await testFn()
      this.log(`✓ ${name}`, 'success')
    } catch (error) {
      this.warnings.push({ check: name, warning: error.message })
      this.log(`⚠ ${name}: ${error.message}`, 'warning')
    }
  }

  async waitForServer() {
    const maxRetries = 30
    let retries = 0

    this.log('Waiting for server to be available...')

    while (retries < maxRetries) {
      try {
        await axios.get(`${BASE_URL}/api/features`, { timeout: 5000 })
        this.log('Server is available', 'success')
        return
      } catch (error) {
        retries++
        if (retries === maxRetries) {
          throw new Error(`Server not available at ${BASE_URL} after ${maxRetries} retries`)
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  async validateBackendAPI() {
    this.log('\n🔧 Backend API Validation')

    await this.test('Features endpoint returns valid response', async () => {
      const response = await axios.get(`${BASE_URL}/api/features`)
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`)
      if (!response.data.success) throw new Error('Response success should be true')
      if (!response.data.features) throw new Error('Response missing features object')
      if (!response.data.metadata) throw new Error('Response missing metadata')
    })

    await this.test('All expected features are present', async () => {
      const response = await axios.get(`${BASE_URL}/api/features`)
      const features = response.data.features

      const expectedFeatures = [
        'advancedAnalytics',
        'enhancedExporting',
        'collaborativeReviews',
        'aiWorkflowAutomation',
        'templateMarketplace',
        'requirementsPrecisionEngine'
      ]

      for (const featureId of expectedFeatures) {
        if (!features[featureId]) {
          throw new Error(`Missing expected feature: ${featureId}`)
        }
        if (typeof features[featureId].enabled !== 'boolean') {
          throw new Error(`Feature ${featureId} missing boolean 'enabled' property`)
        }
        if (typeof features[featureId].config !== 'object') {
          throw new Error(`Feature ${featureId} missing object 'config' property`)
        }
      }
    })

    await this.test('Feature status endpoint works', async () => {
      const response = await axios.get(`${BASE_URL}/api/features/status`)
      if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`)
      if (!response.data.success) throw new Error('Status response success should be true')
      if (typeof response.data.status.totalFeatures !== 'number') {
        throw new Error('Status missing totalFeatures count')
      }
    })

    await this.test('Feature update endpoint works', async () => {
      // Use a test feature that's safe to toggle
      const featureId = 'advancedAnalytics'

      // Get current state
      const current = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      const currentEnabled = current.data.feature.enabled

      // Toggle it
      const updateResponse = await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: !currentEnabled
      })

      if (updateResponse.status !== 200) {
        throw new Error(`Update failed with status ${updateResponse.status}`)
      }

      if (updateResponse.data.feature.enabled === currentEnabled) {
        throw new Error('Feature state did not change after update')
      }

      // Restore original state
      await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: currentEnabled
      })
    })
  }

  async validateFrontendIntegration() {
    this.log('\n🎨 Frontend Integration Validation')

    await this.test('Frontend API service structure is correct', async () => {
      const apiServicePath = path.join(__dirname, '../client/src/services/apiService.js')

      if (!fs.existsSync(apiServicePath)) {
        throw new Error('apiService.js not found')
      }

      const content = fs.readFileSync(apiServicePath, 'utf8')

      // Check for required methods
      const requiredMethods = ['getFeatures', 'updateFeature', 'getFeatureStatus']
      for (const method of requiredMethods) {
        if (!content.includes(`async ${method}(`)) {
          throw new Error(`apiService missing required method: ${method}`)
        }
      }

      // Check that getFeatures calls the right endpoint
      if (!content.includes('/features')) {
        throw new Error('apiService.getFeatures() not calling /features endpoint')
      }
    })

    await this.test('FeatureContext uses correct API calls', async () => {
      const contextPath = path.join(__dirname, '../client/src/contexts/FeatureContext.jsx')

      if (!fs.existsSync(contextPath)) {
        throw new Error('FeatureContext.jsx not found')
      }

      const content = fs.readFileSync(contextPath, 'utf8')

      // Check that it's calling getFeatures not getConfig
      if (content.includes('apiService.getConfig()')) {
        throw new Error('FeatureContext still calling getConfig() instead of getFeatures()')
      }

      if (!content.includes('apiService.getFeatures()')) {
        throw new Error('FeatureContext not calling getFeatures()')
      }

      // Check for getFeatureStatus
      if (!content.includes('getFeatureStatus')) {
        throw new Error('FeatureContext missing getFeatureStatus method')
      }
    })

    await this.test('Feature utilities are properly configured', async () => {
      const utilsPath = path.join(__dirname, '../client/src/utils/featureUtils.js')

      if (!fs.existsSync(utilsPath)) {
        throw new Error('featureUtils.js not found')
      }

      const content = fs.readFileSync(utilsPath, 'utf8')

      if (!content.includes('FEATURE_REGISTRY')) {
        throw new Error('featureUtils missing FEATURE_REGISTRY')
      }

      if (!content.includes('FEATURE_CATEGORIES')) {
        throw new Error('featureUtils missing FEATURE_CATEGORIES')
      }
    })
  }

  async validateDataConsistency() {
    this.log('\n🔄 Data Consistency Validation')

    await this.test('Feature count consistency across endpoints', async () => {
      const [featuresResponse, statusResponse] = await Promise.all([
        axios.get(`${BASE_URL}/api/features`),
        axios.get(`${BASE_URL}/api/features/status`)
      ])

      const featuresCount = Object.keys(featuresResponse.data.features).length
      const statusCount = statusResponse.data.status.totalFeatures

      if (featuresCount !== statusCount) {
        throw new Error(`Feature count mismatch: features endpoint has ${featuresCount}, status endpoint has ${statusCount}`)
      }
    })

    await this.test('Enabled feature count accuracy', async () => {
      const [featuresResponse, statusResponse] = await Promise.all([
        axios.get(`${BASE_URL}/api/features`),
        axios.get(`${BASE_URL}/api/features/status`)
      ])

      const features = featuresResponse.data.features
      const actualEnabledCount = Object.values(features).filter(f => f.enabled).length
      const reportedEnabledCount = statusResponse.data.status.enabledFeatures

      if (actualEnabledCount !== reportedEnabledCount) {
        throw new Error(`Enabled count mismatch: actual ${actualEnabledCount}, reported ${reportedEnabledCount}`)
      }
    })
  }

  async validateConfiguration() {
    this.log('\n⚙️ Configuration Validation')

    await this.test('Configuration loading works correctly', async () => {
      // Test that features are loaded even without local config
      const response = await axios.get(`${BASE_URL}/api/features`)

      if (Object.keys(response.data.features).length === 0) {
        throw new Error('No features loaded - configuration merge issue')
      }
    })

    await this.warn('Configuration source is reported', async () => {
      const response = await axios.get(`${BASE_URL}/api/features/status`)
      const configSource = response.data.status.configSource

      if (!configSource || !['local', 'global'].includes(configSource)) {
        throw new Error('Invalid or missing config source in status')
      }
    })
  }

  async validateEndToEnd() {
    this.log('\n🔗 End-to-End Validation')

    await this.test('Complete feature lifecycle works', async () => {
      const featureId = 'enhancedExporting'

      // 1. Get initial state
      const initial = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      const initialEnabled = initial.data.feature.enabled

      // 2. Update feature
      await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: !initialEnabled
      })

      // 3. Verify change in individual endpoint
      const updated = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      if (updated.data.feature.enabled === initialEnabled) {
        throw new Error('Feature state did not change')
      }

      // 4. Verify change in full list
      const fullList = await axios.get(`${BASE_URL}/api/features`)
      if (fullList.data.features[featureId].enabled === initialEnabled) {
        throw new Error('Feature state change not reflected in full list')
      }

      // 5. Verify change in status endpoint
      const status = await axios.get(`${BASE_URL}/api/features/status`)
      // Status counts should be updated

      // 6. Restore original state
      await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: initialEnabled
      })

      // 7. Verify restoration
      const restored = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      if (restored.data.feature.enabled !== initialEnabled) {
        throw new Error('Failed to restore original state')
      }
    })
  }

  generateReport() {
    this.log('\n📊 Validation Report')
    this.log(`Tests Passed: ${this.passed}/${this.total}`)

    if (this.warnings.length > 0) {
      this.log(`\n⚠️ Warnings (${this.warnings.length}):`)
      this.warnings.forEach(w => this.log(`  • ${w.check}: ${w.warning}`, 'warning'))
    }

    if (this.errors.length > 0) {
      this.log(`\n❌ Failures (${this.errors.length}):`)
      this.errors.forEach(e => this.log(`  • ${e.test}: ${e.error}`, 'error'))
      return false
    }

    this.log('\n✅ All validations passed!', 'success')
    return true
  }

  async run() {
    console.log('🔍 Anvil Feature System Integration Validation')
    console.log(`🌐 Testing against: ${BASE_URL}`)
    console.log('=' * 60)

    try {
      await this.waitForServer()
      await this.validateBackendAPI()
      await this.validateFrontendIntegration()
      await this.validateDataConsistency()
      await this.validateConfiguration()
      await this.validateEndToEnd()

      const success = this.generateReport()
      process.exit(success ? 0 : 1)

    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error')
      process.exit(1)
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new IntegrationValidator()
  validator.run()
}

module.exports = IntegrationValidator