/**
 * AI Workflow Automation Engine Tests
 * Tests for AI-powered workflow automation, requirement analysis, and intelligent suggestions
 */

const axios = require('axios')

const BASE_URL = 'http://localhost:3000'

describe('AI Workflow Automation Features', () => {
  beforeEach(async () => {
    // Ensure AI workflow automation feature is enabled
    await axios.put(`${BASE_URL}/api/features/aiWorkflowAutomation`, {
      enabled: true
    })

    // Ensure requirements precision engine is enabled
    await axios.put(`${BASE_URL}/api/features/requirementsPrecisionEngine`, {
      enabled: true
    })
  })

  describe('AI-Powered Requirement Analysis', () => {
    test('AI analyzes requirement quality and completeness', async () => {
      const requirementText = `
        As a user, I want to be able to login.
        The system should be fast.
        It needs to work on mobile.
      `

      const analysisResponse = await axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
        text: requirementText,
        analysisType: 'quality'
      })

      expect(analysisResponse.status).toBe(200)
      expect(analysisResponse.data.success).toBe(true)
      expect(analysisResponse.data.analysis).toBeDefined()
      expect(analysisResponse.data.analysis.completenessScore).toBeGreaterThanOrEqual(0)
      expect(analysisResponse.data.analysis.completenessScore).toBeLessThanOrEqual(100)
      expect(analysisResponse.data.suggestions).toBeDefined()
      expect(Array.isArray(analysisResponse.data.suggestions)).toBe(true)
    })

    test('AI identifies missing acceptance criteria', async () => {
      const incompleteRequirement = `
        User should be able to upload files.
      `

      const analysisResponse = await axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
        text: incompleteRequirement,
        analysisType: 'acceptance_criteria'
      })

      expect(analysisResponse.status).toBe(200)
      expect(analysisResponse.data.missingCriteria).toBeDefined()
      expect(analysisResponse.data.missingCriteria.length).toBeGreaterThan(0)
      expect(analysisResponse.data.suggestedCriteria).toBeDefined()
      expect(Array.isArray(analysisResponse.data.suggestedCriteria)).toBe(true)
    })

    test('AI detects conflicting requirements', async () => {
      const conflictingRequirements = `
        The system must respond within 100ms.
        The system should perform complex calculations that take 5 seconds.
        All operations must complete in under 50ms.
      `

      const conflictResponse = await axios.post(`${BASE_URL}/api/ai/detect-conflicts`, {
        text: conflictingRequirements
      })

      expect(conflictResponse.status).toBe(200)
      expect(conflictResponse.data.conflicts).toBeDefined()
      expect(Array.isArray(conflictResponse.data.conflicts)).toBe(true)
      expect(conflictResponse.data.conflicts.length).toBeGreaterThan(0)

      conflictResponse.data.conflicts.forEach(conflict => {
        expect(conflict).toHaveProperty('type')
        expect(conflict).toHaveProperty('description')
        expect(conflict).toHaveProperty('severity')
        expect(conflict).toHaveProperty('suggestedResolution')
      })
    })
  })

  describe('Intelligent Workflow Automation', () => {
    test('AI suggests workflow optimizations', async () => {
      const workflowData = {
        steps: [
          { id: 1, name: 'Requirement Gathering', duration: 5, dependencies: [] },
          { id: 2, name: 'Design', duration: 8, dependencies: [1] },
          { id: 3, name: 'Development', duration: 15, dependencies: [2] },
          { id: 4, name: 'Testing', duration: 10, dependencies: [3] },
          { id: 5, name: 'Deployment', duration: 2, dependencies: [4] }
        ]
      }

      const optimizationResponse = await axios.post(`${BASE_URL}/api/ai/optimize-workflow`, {
        workflow: workflowData
      })

      expect(optimizationResponse.status).toBe(200)
      expect(optimizationResponse.data.optimizations).toBeDefined()
      expect(optimizationResponse.data.estimatedTimeSaving).toBeGreaterThanOrEqual(0)
      expect(optimizationResponse.data.parallelizableSteps).toBeDefined()
      expect(Array.isArray(optimizationResponse.data.parallelizableSteps)).toBe(true)
    })

    test('AI automates task prioritization', async () => {
      const tasks = [
        { id: 1, title: 'Critical bug fix', type: 'bug', priority: 'high', effort: 2 },
        { id: 2, title: 'New feature development', type: 'feature', priority: 'medium', effort: 8 },
        { id: 3, title: 'Documentation update', type: 'docs', priority: 'low', effort: 1 },
        { id: 4, title: 'Security vulnerability fix', type: 'security', priority: 'critical', effort: 4 }
      ]

      const prioritizationResponse = await axios.post(`${BASE_URL}/api/ai/prioritize-tasks`, {
        tasks,
        context: {
          sprintCapacity: 15,
          teamSize: 3,
          deadline: '2024-01-15'
        }
      })

      expect(prioritizationResponse.status).toBe(200)
      expect(prioritizationResponse.data.prioritizedTasks).toBeDefined()
      expect(Array.isArray(prioritizationResponse.data.prioritizedTasks)).toBe(true)
      expect(prioritizationResponse.data.reasoning).toBeDefined()

      // Security and critical items should be prioritized
      const firstTask = prioritizationResponse.data.prioritizedTasks[0]
      expect(['security', 'critical']).toContain(firstTask.type || firstTask.priority)
    })

    test('AI generates automated testing strategies', async () => {
      const requirementDoc = {
        title: 'User Authentication System',
        requirements: [
          'Users can register with email and password',
          'Users can login with valid credentials',
          'Users can reset forgotten passwords',
          'System locks account after 3 failed attempts'
        ]
      }

      const testingResponse = await axios.post(`${BASE_URL}/api/ai/generate-test-strategy`, {
        document: requirementDoc
      })

      expect(testingResponse.status).toBe(200)
      expect(testingResponse.data.testStrategy).toBeDefined()
      expect(testingResponse.data.testCases).toBeDefined()
      expect(Array.isArray(testingResponse.data.testCases)).toBe(true)
      expect(testingResponse.data.coverageAreas).toBeDefined()

      testingResponse.data.testCases.forEach(testCase => {
        expect(testCase).toHaveProperty('title')
        expect(testCase).toHaveProperty('steps')
        expect(testCase).toHaveProperty('expectedResult')
        expect(testCase).toHaveProperty('testType')
      })
    })
  })

  describe('AI Learning and Adaptation', () => {
    test('AI learns from project patterns and improves suggestions', async () => {
      // Submit project data for learning
      const projectData = {
        id: 'learning-project-1',
        requirements: ['Requirement 1', 'Requirement 2'],
        outcomes: {
          completionTime: 45,
          qualityScore: 85,
          clientSatisfaction: 90
        },
        workflows: [
          { step: 'Analysis', duration: 5 },
          { step: 'Design', duration: 10 },
          { step: 'Development', duration: 25 },
          { step: 'Testing', duration: 5 }
        ]
      }

      const learningResponse = await axios.post(`${BASE_URL}/api/ai/learn-from-project`, {
        projectData
      })

      expect(learningResponse.status).toBe(200)
      expect(learningResponse.data.learningApplied).toBe(true)

      // Get improved suggestions based on learning
      const improvedSuggestions = await axios.get(`${BASE_URL}/api/ai/suggestions/improved`)

      expect(improvedSuggestions.status).toBe(200)
      expect(improvedSuggestions.data.suggestions).toBeDefined()
      expect(improvedSuggestions.data.confidenceScore).toBeGreaterThan(0)
    })

    test('AI adapts to team-specific patterns', async () => {
      const teamMetrics = {
        teamId: 'team-alpha',
        metrics: {
          averageVelocity: 25,
          preferredTaskSize: 3,
          strongAreas: ['frontend', 'testing'],
          improvementAreas: ['documentation', 'planning']
        }
      }

      const adaptationResponse = await axios.post(`${BASE_URL}/api/ai/adapt-to-team`, {
        teamMetrics
      })

      expect(adaptationResponse.status).toBe(200)
      expect(adaptationResponse.data.adaptationApplied).toBe(true)

      // Get team-specific recommendations
      const teamSuggestions = await axios.get(`${BASE_URL}/api/ai/team-suggestions/team-alpha`)

      expect(teamSuggestions.status).toBe(200)
      expect(teamSuggestions.data.customizedSuggestions).toBeDefined()
      expect(teamSuggestions.data.teamOptimizations).toBeDefined()
    })
  })

  describe('AI Performance and Reliability', () => {
    test('AI response times meet performance requirements', async () => {
      const startTime = Date.now()

      const quickAnalysis = await axios.post(`${BASE_URL}/api/ai/quick-analysis`, {
        text: 'Simple requirement for speed test',
        priority: 'high'
      })

      const endTime = Date.now()
      const responseTime = endTime - startTime

      expect(quickAnalysis.status).toBe(200)
      expect(responseTime).toBeLessThan(2000) // Should respond within 2 seconds
      expect(quickAnalysis.data.analysis).toBeDefined()
    })

    test('AI handles high request volume gracefully', async () => {
      const requestCount = 10
      const requests = []

      for (let i = 0; i < requestCount; i++) {
        requests.push(
          axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
            text: `Test requirement ${i}`,
            analysisType: 'basic'
          })
        )
      }

      const responses = await Promise.all(requests)

      responses.forEach((response, index) => {
        expect(response.status).toBe(200)
        expect(response.data.success).toBe(true)
      })
    })

    test('AI fallback mechanisms work when primary AI unavailable', async () => {
      // Simulate AI service unavailable
      const fallbackResponse = await axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
        text: 'Test requirement for fallback',
        forceSimulation: 'ai_unavailable'
      })

      expect(fallbackResponse.status).toBe(200)
      expect(fallbackResponse.data.fallbackUsed).toBe(true)
      expect(fallbackResponse.data.analysis).toBeDefined()
      expect(fallbackResponse.data.analysis.source).toBe('rule-based')
    })
  })

  describe('AI Integration with Existing Features', () => {
    test('AI integrates with feature flag system', async () => {
      // Disable AI feature and verify graceful degradation
      await axios.put(`${BASE_URL}/api/features/aiWorkflowAutomation`, {
        enabled: false
      })

      const disabledResponse = await axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
        text: 'Test with AI disabled'
      })

      expect(disabledResponse.status).toBe(200)
      expect(disabledResponse.data.aiEnabled).toBe(false)
      expect(disabledResponse.data.fallbackMode).toBe(true)

      // Re-enable for cleanup
      await axios.put(`${BASE_URL}/api/features/aiWorkflowAutomation`, {
        enabled: true
      })
    })

    test('AI works with collaborative editing features', async () => {
      // Enable both AI and collaboration features
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const combinedResponse = await axios.post(`${BASE_URL}/api/ai/collaborative-analysis`, {
        documentId: 'test-collab-doc',
        collaborators: ['user1', 'user2'],
        analysisType: 'real-time'
      })

      expect(combinedResponse.status).toBe(200)
      expect(combinedResponse.data.collaborativeInsights).toBeDefined()
      expect(combinedResponse.data.userSpecificSuggestions).toBeDefined()
      expect(Object.keys(combinedResponse.data.userSpecificSuggestions)).toContain('user1')
      expect(Object.keys(combinedResponse.data.userSpecificSuggestions)).toContain('user2')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    test('AI handles malformed input gracefully', async () => {
      const malformedResponse = await axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
        text: null,
        analysisType: 'invalid'
      })

      expect(malformedResponse.status).toBe(400)
      expect(malformedResponse.data.error).toBeDefined()
      expect(malformedResponse.data.errorType).toBe('invalid_input')
    })

    test('AI provides meaningful error messages', async () => {
      try {
        await axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
          // Missing required text field
          analysisType: 'quality'
        })
      } catch (error) {
        expect(error.response.status).toBe(400)
        expect(error.response.data.error).toContain('text')
        expect(error.response.data.helpText).toBeDefined()
      }
    })

    test('AI handles very large input documents', async () => {
      const largeText = 'Large requirement text. '.repeat(1000) // ~25KB of text

      const largeDocResponse = await axios.post(`${BASE_URL}/api/ai/analyze-requirements`, {
        text: largeText,
        analysisType: 'quality'
      })

      expect(largeDocResponse.status).toBe(200)
      expect(largeDocResponse.data.analysis).toBeDefined()
      expect(largeDocResponse.data.processingTime).toBeDefined()
    })
  })
})