/**
 * Requirements Precision Engine Tests
 * Tests for AI-powered requirement refinement, precision scoring, and quality enhancement
 */

const axios = require('axios')

const BASE_URL = 'http://localhost:3000'

describe('Requirements Precision Engine', () => {
  beforeEach(async () => {
    // Ensure requirements precision engine is enabled
    await axios.put(`${BASE_URL}/api/features/requirementsPrecisionEngine`, {
      enabled: true
    })
  })

  describe('Precision Scoring Engine', () => {
    test('Engine calculates accurate precision scores for requirements', async () => {
      const testRequirements = [
        {
          id: 'precise-req',
          text: 'The system must authenticate users within 2 seconds using OAuth 2.0 protocol, supporting Google and Microsoft providers, with JWT tokens valid for 24 hours.'
        },
        {
          id: 'vague-req',
          text: 'The system should be fast and secure.'
        },
        {
          id: 'moderate-req',
          text: 'Users can upload files up to 10MB in PDF or DOCX format through a drag-and-drop interface.'
        }
      ]

      const scoringResponse = await axios.post(`${BASE_URL}/api/precision-engine/score-requirements`, {
        requirements: testRequirements
      })

      expect(scoringResponse.status).toBe(200)
      expect(scoringResponse.data.scores).toBeDefined()
      expect(scoringResponse.data.scores).toHaveLength(3)

      const [preciseScore, vagueScore, moderateScore] = scoringResponse.data.scores

      // Precise requirement should score highest
      expect(preciseScore.score).toBeGreaterThan(vagueScore.score)
      expect(preciseScore.score).toBeGreaterThan(moderateScore.score)
      expect(preciseScore.score).toBeGreaterThan(70)

      // Vague requirement should score lowest
      expect(vagueScore.score).toBeLessThan(30)

      // Each score should have detailed breakdown
      expect(preciseScore.breakdown).toBeDefined()
      expect(preciseScore.breakdown.specificity).toBeDefined()
      expect(preciseScore.breakdown.measurability).toBeDefined()
      expect(preciseScore.breakdown.testability).toBeDefined()
    })

    test('Precision engine identifies missing elements in requirements', async () => {
      const incompleteRequirement = {
        text: 'Users can search for products.',
        context: 'e-commerce application'
      }

      const analysisResponse = await axios.post(`${BASE_URL}/api/precision-engine/analyze-completeness`, {
        requirement: incompleteRequirement
      })

      expect(analysisResponse.status).toBe(200)
      expect(analysisResponse.data.missingElements).toBeDefined()
      expect(Array.isArray(analysisResponse.data.missingElements)).toBe(true)

      const missingElements = analysisResponse.data.missingElements
      expect(missingElements).toContain('search criteria')
      expect(missingElements).toContain('response time')
      expect(missingElements).toContain('search results format')
      expect(missingElements).toContain('error handling')
    })

    test('Engine provides actionable improvement suggestions', async () => {
      const improvableRequirement = {
        text: 'The system should handle user input validation.',
        domain: 'web application'
      }

      const improvementResponse = await axios.post(`${BASE_URL}/api/precision-engine/suggest-improvements`, {
        requirement: improvableRequirement
      })

      expect(improvementResponse.status).toBe(200)
      expect(improvementResponse.data.suggestions).toBeDefined()
      expect(Array.isArray(improvementResponse.data.suggestions)).toBe(true)

      const suggestions = improvementResponse.data.suggestions
      expect(suggestions.length).toBeGreaterThan(0)

      suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('type')
        expect(suggestion).toHaveProperty('description')
        expect(suggestion).toHaveProperty('example')
        expect(suggestion).toHaveProperty('impact')
        expect(['high', 'medium', 'low']).toContain(suggestion.impact)
      })
    })
  })

  describe('Smart Requirement Enhancement', () => {
    test('Engine automatically enhances vague requirements', async () => {
      const vagueRequirement = {
        text: 'System needs to be responsive.',
        context: {
          applicationtype: 'mobile app',
          users: 'general public',
          criticalPath: true
        }
      }

      const enhancementResponse = await axios.post(`${BASE_URL}/api/precision-engine/enhance-requirement`, {
        requirement: vagueRequirement
      })

      expect(enhancementResponse.status).toBe(200)
      expect(enhancementResponse.data.enhanced).toBeDefined()
      expect(enhancementResponse.data.enhanced.text).not.toBe(vagueRequirement.text)
      expect(enhancementResponse.data.enhanced.text.length).toBeGreaterThan(vagueRequirement.text.length)

      // Enhanced version should mention specific metrics
      const enhancedText = enhancementResponse.data.enhanced.text.toLowerCase()
      expect(enhancedText).toMatch(/\d+/)  // Should contain numbers
      expect(enhancedText).toMatch(/(seconds?|ms|milliseconds?)/)  // Should mention time units
    })

    test('Engine preserves intent while adding precision', async () => {
      const originalRequirement = {
        text: 'Users want to easily find their previous orders.',
        userStory: true
      }

      const enhancementResponse = await axios.post(`${BASE_URL}/api/precision-engine/enhance-requirement`, {
        requirement: originalRequirement,
        preserveIntent: true
      })

      expect(enhancementResponse.status).toBe(200)

      const enhanced = enhancementResponse.data.enhanced
      expect(enhanced.intentPreserved).toBe(true)
      expect(enhanced.originalIntent).toContain('find previous orders')
      expect(enhanced.text).toContain('orders')
      expect(enhanced.addedPrecision).toBeDefined()
      expect(Array.isArray(enhanced.addedPrecision)).toBe(true)
    })

    test('Engine handles domain-specific terminology correctly', async () => {
      const domainRequirement = {
        text: 'The trading system must execute orders quickly.',
        domain: 'financial trading',
        terminology: 'financial'
      }

      const enhancementResponse = await axios.post(`${BASE_URL}/api/precision-engine/enhance-requirement`, {
        requirement: domainRequirement
      })

      expect(enhancementResponse.status).toBe(200)

      const enhanced = enhancementResponse.data.enhanced.text.toLowerCase()
      // Should include financial trading specific terms
      expect(enhanced).toMatch(/(latency|milliseconds?|market data|order book)/)
      expect(enhanced).toMatch(/\d+\s*(ms|milliseconds?|microseconds?)/)
    })
  })

  describe('Quality Metrics and Validation', () => {
    test('Engine calculates comprehensive quality metrics', async () => {
      const requirement = {
        text: 'The payment processing system must securely process credit card transactions within 3 seconds, supporting Visa, MasterCard, and American Express, with PCI DSS compliance and fraud detection capabilities.',
        type: 'functional'
      }

      const metricsResponse = await axios.post(`${BASE_URL}/api/precision-engine/calculate-metrics`, {
        requirement
      })

      expect(metricsResponse.status).toBe(200)
      expect(metricsResponse.data.metrics).toBeDefined()

      const metrics = metricsResponse.data.metrics
      expect(metrics.overallScore).toBeGreaterThan(70)
      expect(metrics.specificity).toBeDefined()
      expect(metrics.measurability).toBeDefined()
      expect(metrics.testability).toBeDefined()
      expect(metrics.feasibility).toBeDefined()
      expect(metrics.clarity).toBeDefined()
      expect(metrics.completeness).toBeDefined()

      // All metrics should be between 0 and 100
      Object.values(metrics).forEach(score => {
        if (typeof score === 'number') {
          expect(score).toBeGreaterThanOrEqual(0)
          expect(score).toBeLessThanOrEqual(100)
        }
      })
    })

    test('Engine validates SMART criteria compliance', async () => {
      const smartRequirement = {
        text: 'The mobile app must load the home screen within 2 seconds on devices with 2GB RAM, measured using automated testing tools, by Q2 2024.',
        criteria: 'SMART'
      }

      const validationResponse = await axios.post(`${BASE_URL}/api/precision-engine/validate-smart`, {
        requirement: smartRequirement
      })

      expect(validationResponse.status).toBe(200)
      expect(validationResponse.data.smartCompliance).toBeDefined()

      const compliance = validationResponse.data.smartCompliance
      expect(compliance.specific).toBe(true)
      expect(compliance.measurable).toBe(true)
      expect(compliance.achievable).toBeDefined()
      expect(compliance.relevant).toBeDefined()
      expect(compliance.timeBound).toBe(true)
      expect(compliance.overallCompliance).toBeGreaterThan(0.8)
    })

    test('Engine identifies ambiguous language', async () => {
      const ambiguousRequirement = {
        text: 'The system should be reasonably fast, quite secure, and fairly user-friendly for most users in typical scenarios.'
      }

      const ambiguityResponse = await axios.post(`${BASE_URL}/api/precision-engine/detect-ambiguity`, {
        requirement: ambiguousRequirement
      })

      expect(ambiguityResponse.status).toBe(200)
      expect(ambiguityResponse.data.ambiguousTerms).toBeDefined()
      expect(Array.isArray(ambiguityResponse.data.ambiguousTerms)).toBe(true)

      const ambiguousTerms = ambiguityResponse.data.ambiguousTerms
      expect(ambiguousTerms).toContain('reasonably fast')
      expect(ambiguousTerms).toContain('quite secure')
      expect(ambiguousTerms).toContain('fairly user-friendly')
      expect(ambiguousTerms).toContain('most users')
      expect(ambiguousTerms).toContain('typical scenarios')

      expect(ambiguityResponse.data.replacementSuggestions).toBeDefined()
    })
  })

  describe('Bulk Processing and Performance', () => {
    test('Engine processes multiple requirements efficiently', async () => {
      const requirements = Array.from({ length: 20 }, (_, i) => ({
        id: `req-${i}`,
        text: `Requirement ${i}: The system must process ${i * 10} requests per second.`
      }))

      const startTime = Date.now()

      const bulkResponse = await axios.post(`${BASE_URL}/api/precision-engine/bulk-process`, {
        requirements,
        operations: ['score', 'enhance', 'validate']
      })

      const endTime = Date.now()
      const processingTime = endTime - startTime

      expect(bulkResponse.status).toBe(200)
      expect(processingTime).toBeLessThan(10000) // Should complete within 10 seconds
      expect(bulkResponse.data.results).toHaveLength(20)

      bulkResponse.data.results.forEach((result, index) => {
        expect(result.id).toBe(`req-${index}`)
        expect(result.score).toBeDefined()
        expect(result.enhanced).toBeDefined()
        expect(result.validation).toBeDefined()
      })
    })

    test('Engine maintains accuracy under load', async () => {
      const testRequirement = {
        text: 'The API must respond to GET requests within 200ms with 99.9% uptime.'
      }

      // Send multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, () =>
        axios.post(`${BASE_URL}/api/precision-engine/score-requirements`, {
          requirements: [testRequirement]
        })
      )

      const responses = await Promise.all(concurrentRequests)

      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.data.scores[0].score).toBeGreaterThan(80)
      })

      // All responses should have similar scores (within 5 points)
      const scores = responses.map(r => r.data.scores[0].score)
      const minScore = Math.min(...scores)
      const maxScore = Math.max(...scores)
      expect(maxScore - minScore).toBeLessThan(5)
    })
  })

  describe('Integration and API Consistency', () => {
    test('Precision engine integrates with feature flag system', async () => {
      // Disable precision engine
      await axios.put(`${BASE_URL}/api/features/requirementsPrecisionEngine`, {
        enabled: false
      })

      const disabledResponse = await axios.post(`${BASE_URL}/api/precision-engine/score-requirements`, {
        requirements: [{ text: 'Test requirement' }]
      })

      expect(disabledResponse.status).toBe(200)
      expect(disabledResponse.data.engineEnabled).toBe(false)
      expect(disabledResponse.data.fallbackMode).toBe(true)

      // Re-enable for cleanup
      await axios.put(`${BASE_URL}/api/features/requirementsPrecisionEngine`, {
        enabled: true
      })
    })

    test('Engine provides consistent API responses', async () => {
      const requirement = {
        text: 'Users must be able to reset their password via email.'
      }

      const [scoreResponse, enhanceResponse, validateResponse] = await Promise.all([
        axios.post(`${BASE_URL}/api/precision-engine/score-requirements`, {
          requirements: [requirement]
        }),
        axios.post(`${BASE_URL}/api/precision-engine/enhance-requirement`, {
          requirement
        }),
        axios.post(`${BASE_URL}/api/precision-engine/validate-smart`, {
          requirement
        })
      ])

      // All responses should follow consistent structure
      [scoreResponse, enhanceResponse, validateResponse].forEach(response => {
        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
        expect(response.data.processingTime).toBeDefined()
        expect(response.data.engineVersion).toBeDefined()
      })
    })
  })
})