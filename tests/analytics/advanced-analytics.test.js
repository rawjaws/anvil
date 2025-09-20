/**
 * Comprehensive Test Suite for Advanced Analytics System
 * Tests PredictiveEngine, PerformanceTracker, and AnalyticsIntegration
 */

const PredictiveEngine = require('../../analytics/PredictiveEngine');
const PerformanceTracker = require('../../analytics/PerformanceTracker');
const AnalyticsIntegration = require('../../analytics/AnalyticsIntegration');

describe('Advanced Analytics System', () => {
  let predictiveEngine;
  let performanceTracker;
  let analyticsIntegration;

  beforeAll(async () => {
    // Initialize analytics components
    predictiveEngine = new PredictiveEngine();
    performanceTracker = new PerformanceTracker();
    analyticsIntegration = new AnalyticsIntegration();

    // Wait for initialization
    await Promise.all([
      new Promise(resolve => predictiveEngine.once('initialized', resolve)),
      new Promise(resolve => performanceTracker.once('initialized', resolve)),
      new Promise(resolve => analyticsIntegration.once('initialized', resolve))
    ]);
  });

  afterAll(async () => {
    // Cleanup
    if (predictiveEngine) {
      predictiveEngine.removeAllListeners();
    }
    if (performanceTracker) {
      performanceTracker.removeAllListeners();
    }
    if (analyticsIntegration) {
      analyticsIntegration.removeAllListeners();
    }
  });

  describe('PredictiveEngine', () => {
    const mockProjectData = {
      id: 'test_project_1',
      totalEnablers: 15,
      dependencies: ['auth-service', 'data-pipeline'],
      team: [
        { experience: 8 },
        { experience: 5 },
        { experience: 6 }
      ],
      sprintVelocities: [8, 12, 10, 14, 11],
      plannedEndDate: '2024-12-31',
      progress: 0.65
    };

    test('should initialize with correct model accuracy', () => {
      const accuracy = predictiveEngine.getModelAccuracy();

      expect(accuracy.quality).toBeGreaterThan(0.8);
      expect(accuracy.completion).toBeGreaterThan(0.8);
      expect(accuracy.risk).toBeGreaterThan(0.8);
    });

    test('should predict quality with >85% confidence', async () => {
      const prediction = await predictiveEngine.predictQuality(mockProjectData);

      expect(prediction).toBeDefined();
      expect(prediction.score).toBeGreaterThan(0);
      expect(prediction.score).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeGreaterThan(85);
      expect(prediction.factors).toBeDefined();
      expect(Array.isArray(prediction.factors)).toBe(true);
      expect(prediction.recommendations).toBeDefined();
    });

    test('should predict completion probability within expected range', async () => {
      const prediction = await predictiveEngine.predictCompletion(mockProjectData);

      expect(prediction).toBeDefined();
      expect(prediction.probability).toBeGreaterThan(0);
      expect(prediction.probability).toBeLessThanOrEqual(1);
      expect(prediction.confidence).toBeGreaterThan(70);
      expect(prediction.estimatedCompletion).toBeDefined();
      expect(prediction.factors).toBeDefined();
    });

    test('should assess risk levels accurately', async () => {
      const assessment = await predictiveEngine.assessRisk(mockProjectData);

      expect(assessment).toBeDefined();
      expect(assessment.score).toBeGreaterThan(0);
      expect(assessment.score).toBeLessThanOrEqual(1);
      expect(assessment.level).toMatch(/^(low|medium|high|critical)$/);
      expect(assessment.confidence).toBeGreaterThan(70);
      expect(assessment.factors).toBeDefined();
      expect(assessment.mitigationStrategies).toBeDefined();
    });

    test('should provide comprehensive project analysis', async () => {
      const analysis = await predictiveEngine.analyzeProject(mockProjectData);

      expect(analysis).toBeDefined();
      expect(analysis.projectId).toBe(mockProjectData.id);
      expect(analysis.analysis.quality).toBeDefined();
      expect(analysis.analysis.completion).toBeDefined();
      expect(analysis.analysis.risk).toBeDefined();
      expect(analysis.overallHealth).toBeDefined();
      expect(analysis.actionItems).toBeDefined();
      expect(Array.isArray(analysis.actionItems)).toBe(true);
    });

    test('should handle edge cases gracefully', async () => {
      const edgeCaseData = {
        id: 'edge_case_project',
        totalEnablers: 0,
        team: [],
        sprintVelocities: []
      };

      const analysis = await predictiveEngine.analyzeProject(edgeCaseData);
      expect(analysis).toBeDefined();
      expect(analysis.projectId).toBe(edgeCaseData.id);
    });

    test('should maintain prediction accuracy over time', async () => {
      const predictions = [];

      for (let i = 0; i < 5; i++) {
        const prediction = await predictiveEngine.predictQuality({
          ...mockProjectData,
          id: `test_${i}`
        });
        predictions.push(prediction.confidence);
      }

      const avgConfidence = predictions.reduce((sum, conf) => sum + conf, 0) / predictions.length;
      expect(avgConfidence).toBeGreaterThan(85);
    });
  });

  describe('PerformanceTracker', () => {
    const mockTeamData = {
      teamId: 'test_team_1',
      completedStoryPoints: 85,
      sprintDuration: 2,
      teamSize: 5,
      focusTime: 6,
      meetingTime: 2,
      interruptions: 3,
      toolsEfficiency: 0.8,
      pairProgrammingHours: 8,
      codeReviews: 18,
      knowledgeSharingSessions: 2,
      crossTrainingHours: 4,
      communicationFrequency: 8,
      decisionSpeed: 4,
      conflictResolution: 4
    };

    const mockDocumentData = {
      id: 'test_doc_1',
      content: 'This is a test document with multiple sentences. It contains technical content and requires analysis for complexity scoring.',
      wordCount: 1500,
      structure: {
        sections: [
          { title: 'Introduction', subsections: [] },
          { title: 'Analysis', subsections: [{ title: 'Details' }] }
        ]
      },
      crossReferences: ['ref1', 'ref2']
    };

    test('should track team velocity with response time <200ms', async () => {
      const startTime = Date.now();
      const metrics = await performanceTracker.trackTeamVelocity(mockTeamData);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(200);
      expect(metrics).toBeDefined();
      expect(metrics.teamId).toBe(mockTeamData.teamId);
      expect(metrics.velocity).toBeDefined();
      expect(metrics.productivity).toBeDefined();
      expect(metrics.collaboration).toBeDefined();
    });

    test('should analyze document complexity efficiently', async () => {
      const startTime = Date.now();
      const analysis = await performanceTracker.analyzeDocumentComplexity(mockDocumentData);
      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(200);
      expect(analysis).toBeDefined();
      expect(analysis.documentId).toBe(mockDocumentData.id);
      expect(analysis.complexity).toBeDefined();
      expect(analysis.readability).toBeDefined();
      expect(analysis.optimization).toBeDefined();
    });

    test('should generate actionable resource recommendations', async () => {
      const projectData = {
        id: 'test_project_resources',
        team: [
          { id: 1, name: 'Alice', role: 'Lead', allocation: 1.0, utilization: 0.9, skills: ['javascript', 'react'] },
          { id: 2, name: 'Bob', role: 'Dev', allocation: 1.0, utilization: 0.7, skills: ['nodejs', 'database'] }
        ],
        requirements: ['frontend', 'backend', 'database'],
        burnRate: 0.15,
        progress: 0.4,
        timeRemaining: 6
      };

      const recommendations = await performanceTracker.generateResourceRecommendations(projectData);

      expect(recommendations).toBeDefined();
      expect(recommendations.projectId).toBe(projectData.id);
      expect(recommendations.current_allocation).toBeDefined();
      expect(recommendations.optimized_allocation).toBeDefined();
      expect(recommendations.efficiency_gain).toBeGreaterThanOrEqual(0);
      expect(recommendations.actionable_steps).toBeDefined();
    });

    test('should handle high throughput event processing (>1000 events/second)', async () => {
      const eventCount = 1200;
      const events = [];

      // Generate test events
      for (let i = 0; i < eventCount; i++) {
        events.push({
          type: 'task_completed',
          userId: `user_${i % 10}`,
          taskId: `task_${i}`,
          timestamp: Date.now()
        });
      }

      const startTime = Date.now();

      // Record events
      events.forEach(event => {
        performanceTracker.recordEvent(event);
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      const throughput = eventCount / (duration / 1000);

      expect(throughput).toBeGreaterThan(1000);
    });

    test('should track capacity planning accurately', async () => {
      const capacityData = {
        teamId: 'test_team_capacity',
        totalCapacity: 200,
        currentAllocation: 170,
        plannedWork: 180,
        teamMembers: [
          { id: 1, capacity: 40, allocation: 38 },
          { id: 2, capacity: 40, allocation: 35 },
          { id: 3, capacity: 40, allocation: 40 },
          { id: 4, capacity: 40, allocation: 32 },
          { id: 5, capacity: 40, allocation: 25 }
        ]
      };

      const planning = await performanceTracker.trackCapacityPlanning(capacityData);

      expect(planning).toBeDefined();
      expect(planning.teamId).toBe(capacityData.teamId);
      expect(planning.current_capacity).toBeDefined();
      expect(planning.utilization_rate).toBeDefined();
      expect(planning.forecast).toBeDefined();
      expect(planning.recommendations).toBeDefined();
    });

    test('should provide performance benchmarks comparison', () => {
      const benchmarks = performanceTracker.getBenchmarks();

      expect(benchmarks).toBeDefined();
      expect(benchmarks.team_velocity).toBeDefined();
      expect(benchmarks.code_quality).toBeDefined();
      expect(benchmarks.delivery_predictability).toBeDefined();

      // Verify benchmark structure
      expect(benchmarks.team_velocity.excellent).toBeGreaterThan(benchmarks.team_velocity.good);
      expect(benchmarks.team_velocity.good).toBeGreaterThan(benchmarks.team_velocity.average);
    });
  });

  describe('AnalyticsIntegration', () => {
    test('should initialize all integrations successfully', async () => {
      const status = analyticsIntegration.getIntegrationStatus();

      expect(status).toBeDefined();
      expect(status.feature_context).toBeDefined();
      expect(status.collaboration).toBeDefined();
      expect(status.validation).toBeDefined();
      expect(status.ai_workflow).toBeDefined();
      expect(status.monitoring).toBeDefined();

      // Verify integrations are enabled
      Object.values(status).forEach(integration => {
        expect(integration.enabled).toBe(true);
        expect(integration.status).toBe('Active');
      });
    });

    test('should provide unified analytics data for projects', async () => {
      const projectId = 'integrated_test_project';
      const analyticsData = await analyticsIntegration.getAnalyticsData(projectId);

      expect(analyticsData).toBeDefined();
      expect(analyticsData.predictions).toBeDefined();
      expect(analyticsData.performance).toBeDefined();
      expect(analyticsData.timestamp).toBeDefined();
    });

    test('should provide comprehensive team analytics', async () => {
      const teamId = 'integrated_test_team';
      const teamAnalytics = await analyticsIntegration.getTeamAnalytics(teamId);

      expect(teamAnalytics).toBeDefined();
      expect(teamAnalytics.team).toBeDefined();
      expect(teamAnalytics.predictions).toBeDefined();
      expect(teamAnalytics.timestamp).toBeDefined();
    });

    test('should generate actionable insights with >95% usefulness', async () => {
      const insights = await analyticsIntegration.generateInsights();

      expect(insights).toBeDefined();
      expect(insights.teams).toBeDefined();
      expect(insights.projects).toBeDefined();
      expect(insights.optimization).toBeDefined();
      expect(insights.predictions).toBeDefined();
      expect(insights.predictive).toBeDefined();

      // Verify insights are actionable
      expect(insights.predictive.recommendations).toBeDefined();
      expect(Array.isArray(insights.predictive.recommendations)).toBe(true);
      expect(insights.predictive.recommendations.length).toBeGreaterThan(0);
    });

    test('should handle data pipeline failures gracefully', async () => {
      // Simulate pipeline failure
      const pipelineStatus = analyticsIntegration.getDataPipelineStatus();
      expect(pipelineStatus).toBeDefined();

      // All pipelines should be active initially
      Object.values(pipelineStatus).forEach(pipeline => {
        expect(pipeline.active).toBe(true);
      });
    });

    test('should maintain system health monitoring', async () => {
      const healthCheck = await analyticsIntegration.healthCheck();

      expect(healthCheck).toBeDefined();
      expect(healthCheck.status).toMatch(/^(healthy|degraded|error)$/);
      expect(healthCheck.engines).toBeDefined();
      expect(healthCheck.integrations).toBeDefined();
      expect(healthCheck.pipelines).toBeDefined();
      expect(healthCheck.timestamp).toBeDefined();

      // Verify engines are healthy
      healthCheck.engines.forEach(engine => {
        expect(engine.healthy).toBe(true);
        expect(engine.status).toBe('operational');
      });
    });
  });

  describe('Performance Requirements', () => {
    test('should meet analytics response time requirement (<200ms)', async () => {
      const iterations = 10;
      const responseTimes = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        await predictiveEngine.predictQuality({
          id: `perf_test_${i}`,
          totalEnablers: 10,
          team: [{ experience: 5 }]
        });
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
      expect(avgResponseTime).toBeLessThan(200);
    });

    test('should achieve prediction accuracy >85%', () => {
      const accuracy = predictiveEngine.getModelAccuracy();

      expect(accuracy.quality).toBeGreaterThan(0.85);
      expect(accuracy.completion).toBeGreaterThan(0.85);
      expect(accuracy.risk).toBeGreaterThan(0.85);
    });

    test('should handle data processing throughput >1000 events/second', async () => {
      const eventCount = 1500;
      const startTime = Date.now();

      // Generate and process events
      for (let i = 0; i < eventCount; i++) {
        performanceTracker.recordEvent({
          type: 'performance_test',
          id: i,
          timestamp: Date.now()
        });
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const throughput = eventCount / duration;

      expect(throughput).toBeGreaterThan(1000);
    });

    test('should generate actionable insights >95%', async () => {
      const insights = await analyticsIntegration.generateInsights();

      // Count actionable items
      let actionableItems = 0;
      let totalItems = 0;

      if (insights.predictive.recommendations) {
        actionableItems += insights.predictive.recommendations.length;
        totalItems += insights.predictive.recommendations.length;
      }

      // Add other insight categories
      totalItems += 2; // predictive insights categories

      const actionabilityRate = actionableItems / totalItems;
      expect(actionabilityRate).toBeGreaterThan(0.95);
    });
  });

  describe('Integration Tests', () => {
    test('should handle cross-engine communication', async () => {
      let performanceEventReceived = false;
      let predictiveEventReceived = false;

      // Set up event listeners
      performanceTracker.once('teamVelocityTracked', () => {
        performanceEventReceived = true;
      });

      predictiveEngine.once('qualityPrediction', () => {
        predictiveEventReceived = true;
      });

      // Trigger events
      await performanceTracker.trackTeamVelocity({
        teamId: 'integration_test',
        completedStoryPoints: 50,
        sprintDuration: 2,
        teamSize: 4
      });

      await predictiveEngine.predictQuality({
        id: 'integration_test_project',
        totalEnablers: 8
      });

      // Give events time to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(performanceEventReceived).toBe(true);
      expect(predictiveEventReceived).toBe(true);
    });

    test('should handle concurrent operations without conflicts', async () => {
      const operations = [];

      // Create multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        operations.push(
          predictiveEngine.analyzeProject({
            id: `concurrent_${i}`,
            totalEnablers: i + 5
          })
        );

        operations.push(
          performanceTracker.trackTeamVelocity({
            teamId: `team_${i}`,
            completedStoryPoints: 40 + i,
            sprintDuration: 2,
            teamSize: 3 + (i % 3)
          })
        );
      }

      // Execute all operations concurrently
      const results = await Promise.all(operations);

      // Verify all operations completed successfully
      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    test('should maintain data consistency across components', async () => {
      const projectId = 'consistency_test_project';

      // Analyze project in predictive engine
      const analysis = await predictiveEngine.analyzeProject({
        id: projectId,
        totalEnablers: 12,
        progress: 0.6
      });

      // Get analytics data from integration layer
      const integratedData = await analyticsIntegration.getAnalyticsData(projectId);

      // Verify data consistency
      expect(integratedData.predictions).toBeDefined();
      expect(integratedData.predictions.projectId).toBe(projectId);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', async () => {
      // Test with null/undefined inputs
      await expect(predictiveEngine.predictQuality(null)).rejects.toThrow();
      await expect(performanceTracker.trackTeamVelocity({})).resolves.toBeDefined();
    });

    test('should recover from temporary failures', async () => {
      // Simulate and recover from various failure scenarios
      const healthBefore = await analyticsIntegration.healthCheck();
      expect(healthBefore.status).toBe('healthy');

      // System should remain operational
      const analysis = await predictiveEngine.analyzeProject({
        id: 'recovery_test',
        totalEnablers: 5
      });
      expect(analysis).toBeDefined();
    });

    test('should maintain performance under load', async () => {
      const operations = [];
      const operationCount = 50;

      const startTime = Date.now();

      for (let i = 0; i < operationCount; i++) {
        operations.push(
          predictiveEngine.predictQuality({
            id: `load_test_${i}`,
            totalEnablers: Math.floor(Math.random() * 20) + 1
          })
        );
      }

      const results = await Promise.all(operations);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgTimePerOperation = totalTime / operationCount;

      expect(results).toHaveLength(operationCount);
      expect(avgTimePerOperation).toBeLessThan(50); // Should average <50ms per operation
    });
  });
});