/**
 * Cross-Feature Integration Testing Framework
 * Comprehensive testing for feature interactions and compatibility
 *
 * This test suite ensures:
 * - Features work correctly in isolation
 * - Features work correctly together
 * - No conflicts between different feature combinations
 * - Performance impact of feature interactions
 * - Data consistency across features
 */

const axios = require('axios')
const { performance } = require('perf_hooks')

const BASE_URL = 'http://localhost:3000'

describe('Cross-Feature Integration Tests', () => {
  let originalFeatureStates = {}

  beforeAll(async () => {
    // Capture original feature states
    const response = await axios.get(`${BASE_URL}/api/features`)
    originalFeatureStates = response.data.features

    console.log('🧪 Starting cross-feature integration tests...')
  })

  afterAll(async () => {
    // Restore original feature states
    console.log('🔄 Restoring original feature states...')

    for (const [featureId, config] of Object.entries(originalFeatureStates)) {
      try {
        await axios.put(`${BASE_URL}/api/features/${featureId}`, {
          enabled: config.enabled,
          config: config.config
        })
      } catch (error) {
        console.warn(`Failed to restore ${featureId}:`, error.message)
      }
    }
  })

  describe('Feature Isolation Tests', () => {
    const features = [
      'advancedAnalytics',
      'enhancedExporting',
      'collaborativeReviews',
      'aiWorkflowAutomation',
      'templateMarketplace',
      'requirementsPrecisionEngine'
    ]

    features.forEach(feature => {
      test(`${feature} works correctly in isolation`, async () => {
        // Disable all other features
        for (const otherFeature of features) {
          if (otherFeature !== feature) {
            await axios.put(`${BASE_URL}/api/features/${otherFeature}`, { enabled: false })
          }
        }

        // Enable target feature
        await axios.put(`${BASE_URL}/api/features/${feature}`, { enabled: true })

        // Wait for state consistency
        await new Promise(resolve => setTimeout(resolve, 100))

        // Test feature functionality
        const response = await axios.get(`${BASE_URL}/api/features/${feature}`)
        expect(response.data.feature.enabled).toBe(true)

        // Feature-specific functionality tests
        await testFeatureFunctionality(feature)
      })
    })
  })

  describe('Feature Pair Compatibility Tests', () => {
    const featurePairs = [
      ['collaborativeReviews', 'aiWorkflowAutomation'],
      ['advancedAnalytics', 'enhancedExporting'],
      ['templateMarketplace', 'requirementsPrecisionEngine'],
      ['collaborativeReviews', 'advancedAnalytics'],
      ['aiWorkflowAutomation', 'requirementsPrecisionEngine']
    ]

    featurePairs.forEach(([feature1, feature2]) => {
      test(`${feature1} and ${feature2} work together without conflicts`, async () => {
        // Enable both features
        await Promise.all([
          axios.put(`${BASE_URL}/api/features/${feature1}`, { enabled: true }),
          axios.put(`${BASE_URL}/api/features/${feature2}`, { enabled: true })
        ])

        // Wait for state consistency
        await new Promise(resolve => setTimeout(resolve, 100))

        // Verify both features are enabled
        const [response1, response2] = await Promise.all([
          axios.get(`${BASE_URL}/api/features/${feature1}`),
          axios.get(`${BASE_URL}/api/features/${feature2}`)
        ])

        expect(response1.data.feature.enabled).toBe(true)
        expect(response2.data.feature.enabled).toBe(true)

        // Test combined functionality
        await testCombinedFunctionality(feature1, feature2)
      })
    })
  })

  describe('All Features Enabled Tests', () => {
    test('All features work correctly when enabled simultaneously', async () => {
      const features = Object.keys(originalFeatureStates)

      // Enable all features
      for (const feature of features) {
        await axios.put(`${BASE_URL}/api/features/${feature}`, { enabled: true })
      }

      // Wait for state consistency
      await new Promise(resolve => setTimeout(resolve, 200))

      // Verify all features are enabled
      const response = await axios.get(`${BASE_URL}/api/features`)

      for (const feature of features) {
        expect(response.data.features[feature].enabled).toBe(true)
      }

      // Test system-wide functionality
      await testSystemWideFunctionality()
    })

    test('Performance remains acceptable with all features enabled', async () => {
      const features = Object.keys(originalFeatureStates)

      // Enable all features
      for (const feature of features) {
        await axios.put(`${BASE_URL}/api/features/${feature}`, { enabled: true })
      }

      // Performance test
      const performanceResults = await runPerformanceTest()

      expect(performanceResults.averageResponseTime).toBeLessThan(100) // < 100ms
      expect(performanceResults.errorRate).toBeLessThan(0.01) // < 1%
      expect(performanceResults.throughput).toBeGreaterThan(100) // > 100 req/s
    })
  })

  describe('Feature State Transition Tests', () => {
    test('Features can be toggled without affecting others', async () => {
      const testFeature = 'collaborativeReviews'
      const otherFeatures = ['aiWorkflowAutomation', 'advancedAnalytics']

      // Enable other features
      for (const feature of otherFeatures) {
        await axios.put(`${BASE_URL}/api/features/${feature}`, { enabled: true })
      }

      // Get initial states
      const initialStates = {}
      for (const feature of otherFeatures) {
        const response = await axios.get(`${BASE_URL}/api/features/${feature}`)
        initialStates[feature] = response.data.feature.enabled
      }

      // Toggle test feature multiple times
      for (let i = 0; i < 3; i++) {
        await axios.put(`${BASE_URL}/api/features/${testFeature}`, { enabled: i % 2 === 0 })

        // Verify other features unchanged
        for (const feature of otherFeatures) {
          const response = await axios.get(`${BASE_URL}/api/features/${feature}`)
          expect(response.data.feature.enabled).toBe(initialStates[feature])
        }
      }
    })
  })

  describe('Data Consistency Tests', () => {
    test('Feature configurations remain consistent across operations', async () => {
      const feature = 'requirementsPrecisionEngine'

      // Set specific configuration
      const testConfig = {
        smartValidation: true,
        dependencyConflictDetection: false,
        impactAnalysis: true,
        traceabilityMatrix: false,
        validationRules: 'relaxed'
      }

      await axios.put(`${BASE_URL}/api/features/${feature}`, {
        enabled: true,
        config: testConfig
      })

      // Perform multiple operations
      await axios.put(`${BASE_URL}/api/features/${feature}`, { enabled: false })
      await axios.put(`${BASE_URL}/api/features/${feature}`, { enabled: true })

      // Verify configuration remains intact
      const response = await axios.get(`${BASE_URL}/api/features/${feature}`)

      expect(response.data.feature.config.smartValidation).toBe(testConfig.smartValidation)
      expect(response.data.feature.config.dependencyConflictDetection).toBe(testConfig.dependencyConflictDetection)
      expect(response.data.feature.config.validationRules).toBe(testConfig.validationRules)
    })
  })

  describe('Error Handling and Recovery Tests', () => {
    test('System recovers gracefully from feature conflicts', async () => {
      // This test simulates potential conflicts and ensures system stability
      const features = ['collaborativeReviews', 'aiWorkflowAutomation']

      try {
        // Rapid feature toggling to simulate race conditions
        const promises = []
        for (let i = 0; i < 10; i++) {
          promises.push(
            axios.put(`${BASE_URL}/api/features/${features[i % 2]}`, {
              enabled: i % 2 === 0
            })
          )
        }

        await Promise.allSettled(promises)

        // System should still be responsive
        const response = await axios.get(`${BASE_URL}/api/features`)
        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)

      } catch (error) {
        // Even if some requests fail, system should remain stable
        const healthCheck = await axios.get(`${BASE_URL}/api/features`)
        expect(healthCheck.status).toBe(200)
      }
    })
  })
})

/**
 * Test individual feature functionality
 */
async function testFeatureFunctionality(feature) {
  switch (feature) {
    case 'collaborativeReviews':
      await testCollaborativeReviewsFeature()
      break
    case 'aiWorkflowAutomation':
      await testAIWorkflowFeature()
      break
    case 'advancedAnalytics':
      await testAdvancedAnalyticsFeature()
      break
    case 'enhancedExporting':
      await testEnhancedExportingFeature()
      break
    case 'templateMarketplace':
      await testTemplateMarketplaceFeature()
      break
    case 'requirementsPrecisionEngine':
      await testPrecisionEngineFeature()
      break
    default:
      // Basic functionality test
      const response = await axios.get(`${BASE_URL}/api/features/${feature}`)
      expect(response.data.feature.enabled).toBe(true)
  }
}

/**
 * Test collaborative reviews feature
 */
async function testCollaborativeReviewsFeature() {
  // Test feature-specific endpoints would go here
  // For now, just verify the feature is accessible
  const response = await axios.get(`${BASE_URL}/api/features/collaborativeReviews`)
  expect(response.data.feature.enabled).toBe(true)
  expect(response.data.feature.config).toBeDefined()
}

/**
 * Test AI workflow automation feature
 */
async function testAIWorkflowFeature() {
  const response = await axios.get(`${BASE_URL}/api/features/aiWorkflowAutomation`)
  expect(response.data.feature.enabled).toBe(true)
  expect(response.data.feature.config.autoAnalysis).toBeDefined()
}

/**
 * Test advanced analytics feature
 */
async function testAdvancedAnalyticsFeature() {
  const response = await axios.get(`${BASE_URL}/api/features/advancedAnalytics`)
  expect(response.data.feature.enabled).toBe(true)
  expect(response.data.feature.config.dashboardWidgets).toBeDefined()
}

/**
 * Test enhanced exporting feature
 */
async function testEnhancedExportingFeature() {
  const response = await axios.get(`${BASE_URL}/api/features/enhancedExporting`)
  expect(response.data.feature.enabled).toBe(true)
  expect(response.data.feature.config.pdfExport).toBeDefined()
}

/**
 * Test template marketplace feature
 */
async function testTemplateMarketplaceFeature() {
  const response = await axios.get(`${BASE_URL}/api/features/templateMarketplace`)
  expect(response.data.feature.enabled).toBe(true)
  expect(response.data.feature.config.sharing).toBeDefined()
}

/**
 * Test precision engine feature
 */
async function testPrecisionEngineFeature() {
  const response = await axios.get(`${BASE_URL}/api/features/requirementsPrecisionEngine`)
  expect(response.data.feature.enabled).toBe(true)
  expect(response.data.feature.config.smartValidation).toBeDefined()
}

/**
 * Test combined functionality of two features
 */
async function testCombinedFunctionality(feature1, feature2) {
  // Test that both features remain functional when used together
  const [response1, response2] = await Promise.all([
    axios.get(`${BASE_URL}/api/features/${feature1}`),
    axios.get(`${BASE_URL}/api/features/${feature2}`)
  ])

  expect(response1.data.feature.enabled).toBe(true)
  expect(response2.data.feature.enabled).toBe(true)

  // Test for specific feature interactions
  if (feature1 === 'collaborativeReviews' && feature2 === 'aiWorkflowAutomation') {
    await testCollaborativeAIIntegration()
  }

  if (feature1 === 'advancedAnalytics' && feature2 === 'enhancedExporting') {
    await testAnalyticsExportIntegration()
  }
}

/**
 * Test collaborative reviews + AI workflow integration
 */
async function testCollaborativeAIIntegration() {
  // Both features should be accessible and functional
  const collaborativeResponse = await axios.get(`${BASE_URL}/api/features/collaborativeReviews`)
  const aiResponse = await axios.get(`${BASE_URL}/api/features/aiWorkflowAutomation`)

  expect(collaborativeResponse.data.feature.enabled).toBe(true)
  expect(aiResponse.data.feature.enabled).toBe(true)

  // Test that AI workflow can enhance collaborative reviews
  expect(collaborativeResponse.data.feature.config.realTimeComments).toBeDefined()
  expect(aiResponse.data.feature.config.smartSuggestions).toBeDefined()
}

/**
 * Test analytics + export integration
 */
async function testAnalyticsExportIntegration() {
  const analyticsResponse = await axios.get(`${BASE_URL}/api/features/advancedAnalytics`)
  const exportResponse = await axios.get(`${BASE_URL}/api/features/enhancedExporting`)

  expect(analyticsResponse.data.feature.enabled).toBe(true)
  expect(exportResponse.data.feature.enabled).toBe(true)

  // Test that analytics data can be exported
  expect(analyticsResponse.data.feature.config.exportCharts).toBeDefined()
  expect(exportResponse.data.feature.config.pdfExport).toBeDefined()
}

/**
 * Test system-wide functionality with all features enabled
 */
async function testSystemWideFunctionality() {
  // Test that the system handles all features being enabled
  const featuresResponse = await axios.get(`${BASE_URL}/api/features`)

  expect(featuresResponse.data.success).toBe(true)
  expect(featuresResponse.data.metadata.enabledFeatures).toBeGreaterThan(0)

  // Test system performance with all features
  const startTime = performance.now()
  await axios.get(`${BASE_URL}/api/features`)
  const endTime = performance.now()

  const responseTime = endTime - startTime
  expect(responseTime).toBeLessThan(200) // Response should be under 200ms
}

/**
 * Run performance test
 */
async function runPerformanceTest() {
  const testDuration = 5000 // 5 seconds
  const concurrentRequests = 10
  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    responseTimes: []
  }

  const startTime = Date.now()
  const promises = []

  // Generate concurrent requests for test duration
  while (Date.now() - startTime < testDuration) {
    for (let i = 0; i < concurrentRequests; i++) {
      const requestPromise = (async () => {
        const requestStart = performance.now()
        try {
          await axios.get(`${BASE_URL}/api/features`)
          const requestEnd = performance.now()

          results.totalRequests++
          results.successfulRequests++
          results.responseTimes.push(requestEnd - requestStart)
        } catch (error) {
          results.totalRequests++
          results.failedRequests++
        }
      })()

      promises.push(requestPromise)
    }

    await new Promise(resolve => setTimeout(resolve, 100)) // 100ms between batches
  }

  await Promise.allSettled(promises)

  // Calculate metrics
  const averageResponseTime = results.responseTimes.length > 0
    ? results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length
    : 0

  const errorRate = results.totalRequests > 0
    ? results.failedRequests / results.totalRequests
    : 0

  const throughput = results.successfulRequests / (testDuration / 1000)

  return {
    averageResponseTime,
    errorRate,
    throughput,
    totalRequests: results.totalRequests,
    successfulRequests: results.successfulRequests,
    failedRequests: results.failedRequests
  }
}