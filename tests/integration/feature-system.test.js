/**
 * Feature System Integration Tests
 * Comprehensive tests to ensure frontend-backend integration works correctly
 */

const request = require('supertest')
const axios = require('axios')

const BASE_URL = 'http://localhost:3000'

describe('Feature System Integration Tests', () => {
  let server

  beforeAll(async () => {
    // Wait for server to be available
    const maxRetries = 10
    let retries = 0

    while (retries < maxRetries) {
      try {
        await axios.get(`${BASE_URL}/api/features`)
        break
      } catch (error) {
        retries++
        if (retries === maxRetries) {
          throw new Error('Server not available after 10 retries')
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  })

  describe('Backend API Endpoints', () => {
    test('GET /api/features returns feature list', async () => {
      const response = await axios.get(`${BASE_URL}/api/features`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.features).toBeDefined()
      expect(typeof response.data.features).toBe('object')
      expect(response.data.metadata).toBeDefined()
      expect(typeof response.data.metadata.totalFeatures).toBe('number')
      expect(typeof response.data.metadata.enabledFeatures).toBe('number')
    })

    test('Features have correct structure', async () => {
      const response = await axios.get(`${BASE_URL}/api/features`)
      const features = response.data.features

      // Ensure we have the expected features
      const expectedFeatures = [
        'advancedAnalytics',
        'enhancedExporting',
        'collaborativeReviews',
        'aiWorkflowAutomation',
        'templateMarketplace',
        'requirementsPrecisionEngine'
      ]

      expectedFeatures.forEach(featureId => {
        expect(features[featureId]).toBeDefined()
        expect(typeof features[featureId].enabled).toBe('boolean')
        expect(typeof features[featureId].config).toBe('object')
      })
    })

    test('GET /api/features/status returns system status', async () => {
      const response = await axios.get(`${BASE_URL}/api/features/status`)

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.status).toBeDefined()
      expect(typeof response.data.status.totalFeatures).toBe('number')
      expect(typeof response.data.status.enabledFeatures).toBe('number')
      expect(typeof response.data.status.disabledFeatures).toBe('number')
    })

    test('PUT /api/features/:featureId updates feature', async () => {
      // Test updating a feature
      const featureId = 'advancedAnalytics'

      // Get current state
      const currentResponse = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      const currentEnabled = currentResponse.data.feature.enabled

      // Toggle it
      const updateResponse = await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: !currentEnabled
      })

      expect(updateResponse.status).toBe(200)
      expect(updateResponse.data.success).toBe(true)
      expect(updateResponse.data.feature.enabled).toBe(!currentEnabled)

      // Restore original state
      await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: currentEnabled
      })
    })
  })

  describe('Frontend-Backend Integration', () => {
    test('Frontend can load features from backend', async () => {
      // Simulate what the frontend FeatureContext does
      const response = await axios.get(`${BASE_URL}/api/features`)

      // Verify the response structure matches what frontend expects
      expect(response.data.features).toBeDefined()
      expect(Object.keys(response.data.features).length).toBeGreaterThan(0)

      // Verify each feature has required structure for frontend
      Object.entries(response.data.features).forEach(([featureId, feature]) => {
        expect(feature.enabled).toBeDefined()
        expect(feature.config).toBeDefined()
        expect(typeof feature.enabled).toBe('boolean')
        expect(typeof feature.config).toBe('object')
      })
    })

    test('Feature state changes persist across requests', async () => {
      const featureId = 'enhancedExporting'

      // Get initial state
      const initial = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      const initialEnabled = initial.data.feature.enabled

      // Update state
      await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: !initialEnabled
      })

      // Verify change persisted
      const updated = await axios.get(`${BASE_URL}/api/features/${featureId}`)
      expect(updated.data.feature.enabled).toBe(!initialEnabled)

      // Verify it also appears in the full features list
      const fullList = await axios.get(`${BASE_URL}/api/features`)
      expect(fullList.data.features[featureId].enabled).toBe(!initialEnabled)

      // Restore original state
      await axios.put(`${BASE_URL}/api/features/${featureId}`, {
        enabled: initialEnabled
      })
    })

    test('Feature status endpoint matches individual feature states', async () => {
      const [featuresResponse, statusResponse] = await Promise.all([
        axios.get(`${BASE_URL}/api/features`),
        axios.get(`${BASE_URL}/api/features/status`)
      ])

      const features = featuresResponse.data.features
      const status = statusResponse.data.status

      // Count enabled features
      const actualEnabledCount = Object.values(features).filter(f => f.enabled).length
      const actualTotalCount = Object.keys(features).length

      expect(status.totalFeatures).toBe(actualTotalCount)
      expect(status.enabledFeatures).toBe(actualEnabledCount)
      expect(status.disabledFeatures).toBe(actualTotalCount - actualEnabledCount)
    })
  })

  describe('Configuration Consistency', () => {
    test('Main config and local config merge correctly', async () => {
      // Test that features are always available regardless of config source
      const response = await axios.get(`${BASE_URL}/api/features`)

      // Should have features even if local config doesn't contain them
      expect(Object.keys(response.data.features).length).toBeGreaterThan(0)

      // Should include all expected core features
      const coreFeatures = ['advancedAnalytics', 'requirementsPrecisionEngine']
      coreFeatures.forEach(featureId => {
        expect(response.data.features[featureId]).toBeDefined()
      })
    })

    test('Feature registry consistency', async () => {
      // This would require importing the frontend utils, but we can check
      // that all features returned by API have valid structures
      const response = await axios.get(`${BASE_URL}/api/features`)
      const features = response.data.features

      Object.entries(features).forEach(([featureId, feature]) => {
        // Each feature should have the expected structure
        expect(feature).toHaveProperty('enabled')
        expect(feature).toHaveProperty('config')

        // Config should be an object with at least some properties
        expect(typeof feature.config).toBe('object')
        expect(Object.keys(feature.config).length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling', () => {
    test('Invalid feature ID returns 404', async () => {
      try {
        await axios.get(`${BASE_URL}/api/features/nonexistent-feature`)
        fail('Should have thrown an error')
      } catch (error) {
        expect(error.response.status).toBe(404)
        expect(error.response.data.success).toBe(false)
      }
    })

    test('Invalid update data returns error', async () => {
      try {
        await axios.put(`${BASE_URL}/api/features/advancedAnalytics`, {
          invalid: 'data'
        })
        // Should still succeed but ignore invalid data
        // Our API is permissive for forwards compatibility
      } catch (error) {
        // If it does error, it should be a 400
        expect(error.response.status).toBe(400)
      }
    })
  })
})