/**
 * AI Workflow Automation Backend Tests
 * Comprehensive test suite for AI workflow automation functionality
 */

const AIWorkflowSystem = require('../ai-workflow/index');

class AIWorkflowTester {
  constructor() {
    this.system = null;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  /**
   * Run comprehensive test suite
   */
  async runAllTests() {
    console.log('Starting AI Workflow Automation Backend Tests...\n');

    try {
      // Initialize system for testing
      await this.initializeTestSystem();

      // Run test suites
      await this.testSystemInitialization();
      await this.testWorkflowEngine();
      await this.testAIServiceManager();
      await this.testSmartAnalysisEngine();
      await this.testWorkflowScheduler();
      await this.testAutomationOrchestrator();
      await this.testRequirementsPrecisionIntegration();
      await this.testAPIEndpoints();
      await this.testSystemHealthAndMetrics();

      // Cleanup
      await this.cleanupTestSystem();

    } catch (error) {
      console.error('Test suite failed:', error);
      this.recordTest('Test Suite Execution', false, error.message);
    }

    this.printTestResults();
    return this.testResults;
  }

  /**
   * Initialize test system
   */
  async initializeTestSystem() {
    console.log('🔧 Initializing test system...');

    try {
      this.system = new AIWorkflowSystem({
        maxConcurrentWorkflows: 5,
        schedulerCheckInterval: 1000, // Faster for testing
        aiServiceTimeout: 5000,
        analysisDepth: 'basic' // Faster for testing
      });

      const result = await this.system.initialize();
      this.recordTest('System Initialization', result.success, result.error);

      if (result.success) {
        console.log('✅ Test system initialized successfully\n');
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('❌ Failed to initialize test system:', error.message);
      throw error;
    }
  }

  /**
   * Test system initialization
   */
  async testSystemInitialization() {
    console.log('📋 Testing System Initialization...');

    // Test component initialization
    const components = [
      'workflowEngine',
      'aiServiceManager',
      'smartAnalysisEngine',
      'scheduler',
      'requirementsPrecisionIntegration',
      'automationOrchestrator'
    ];

    for (const component of components) {
      const exists = !!this.system.getComponent(component);
      this.recordTest(`Component ${component} initialized`, exists, exists ? null : 'Component not found');
    }

    // Test system start/stop
    const startResult = await this.system.start();
    this.recordTest('System Start', startResult.success, startResult.error);

    const stopResult = await this.system.stop();
    this.recordTest('System Stop', stopResult.success, stopResult.error);

    console.log('✅ System initialization tests completed\n');
  }

  /**
   * Test workflow engine functionality
   */
  async testWorkflowEngine() {
    console.log('⚙️ Testing Workflow Engine...');

    const workflowEngine = this.system.getComponent('workflowEngine');

    // Test workflow registration
    try {
      const testWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        steps: [
          {
            id: 'step1',
            type: 'data-transform',
            name: 'Transform Data',
            config: {
              transformation: {
                mapping: {
                  'output': 'input.message'
                }
              }
            }
          },
          {
            id: 'step2',
            type: 'notification',
            name: 'Send Notification',
            config: {
              recipients: ['test@example.com'],
              message: 'Test workflow completed: ${output}'
            }
          }
        ]
      };

      const workflow = workflowEngine.registerWorkflow(testWorkflow);
      this.recordTest('Workflow Registration', !!workflow, workflow ? null : 'Failed to register workflow');

      // Test workflow execution
      const executionResult = await workflowEngine.executeWorkflow('test-workflow', { message: 'Hello World' });
      this.recordTest('Workflow Execution', executionResult.success, executionResult.error);

      // Test workflow status
      const status = workflowEngine.getWorkflowStatus('test-workflow');
      this.recordTest('Workflow Status Retrieval', !!status, status ? null : 'Status not found');

      // Test workflow metrics
      const metrics = workflowEngine.getMetrics();
      this.recordTest('Workflow Metrics', metrics.totalExecutions > 0,
                     metrics.totalExecutions > 0 ? null : 'No executions recorded');

    } catch (error) {
      this.recordTest('Workflow Engine Test', false, error.message);
    }

    console.log('✅ Workflow engine tests completed\n');
  }

  /**
   * Test AI Service Manager
   */
  async testAIServiceManager() {
    console.log('🤖 Testing AI Service Manager...');

    const aiServiceManager = this.system.getComponent('aiServiceManager');

    try {
      // Test service listing
      const services = aiServiceManager.listServices();
      this.recordTest('AI Services Listed', services.length > 0,
                     services.length > 0 ? null : 'No services found');

      // Test AI request processing
      const analysisRequest = {
        type: 'requirements-analysis',
        content: 'Test requirement document content',
        options: { includeMetrics: true }
      };

      const result = await aiServiceManager.processRequest(analysisRequest);
      this.recordTest('AI Request Processing', result.success, result.error);

      // Test service health check
      const healthCheck = await aiServiceManager.healthCheck();
      const allHealthy = Object.values(healthCheck).every(service => service.healthy);
      this.recordTest('AI Services Health Check', allHealthy,
                     allHealthy ? null : 'Some services unhealthy');

      // Test AI service metrics
      const metrics = aiServiceManager.getMetrics();
      this.recordTest('AI Service Metrics', metrics.totalRequests >= 0, null);

    } catch (error) {
      this.recordTest('AI Service Manager Test', false, error.message);
    }

    console.log('✅ AI Service Manager tests completed\n');
  }

  /**
   * Test Smart Analysis Engine
   */
  async testSmartAnalysisEngine() {
    console.log('🧠 Testing Smart Analysis Engine...');

    const smartAnalysisEngine = this.system.getComponent('smartAnalysisEngine');

    try {
      // Test smart analysis
      const analysisInput = {
        content: `
# Test Capability Document

## Metadata
- **Type**: Capability
- **ID**: CAP-TEST-001
- **Status**: Draft
- **Priority**: High

## Description
This is a test capability for validating the smart analysis engine.

## Functional Requirements
| ID | Requirement | Description | Priority |
|----|-------------|-------------|----------|
| REQ-001 | User Authentication | System shall provide secure user authentication | High |
| REQ-002 | Data Processing | System shall process data efficiently | Medium |

## Enablers
| ID | Name | Description | Status |
|----|------|-------------|--------|
| ENB-001 | Auth Service | Authentication enabler | Draft |
        `,
        type: 'capability',
        documentId: 'test-cap-001'
      };

      const analysisResult = await smartAnalysisEngine.performSmartAnalysis(analysisInput);
      this.recordTest('Smart Analysis Execution', analysisResult.success, analysisResult.error);

      if (analysisResult.success) {
        const hasLayers = analysisResult.result.detailed &&
                         Object.keys(analysisResult.result.detailed).length > 0;
        this.recordTest('Analysis Layers Generated', hasLayers,
                       hasLayers ? null : 'No analysis layers found');

        const hasMetrics = analysisResult.result.metrics &&
                          typeof analysisResult.result.metrics === 'object';
        this.recordTest('Analysis Metrics Generated', hasMetrics,
                       hasMetrics ? null : 'No metrics found');
      }

      // Test analysis metrics
      const metrics = smartAnalysisEngine.getMetrics();
      this.recordTest('Smart Analysis Metrics', metrics.totalAnalyses >= 0, null);

    } catch (error) {
      this.recordTest('Smart Analysis Engine Test', false, error.message);
    }

    console.log('✅ Smart Analysis Engine tests completed\n');
  }

  /**
   * Test Workflow Scheduler
   */
  async testWorkflowScheduler() {
    console.log('📅 Testing Workflow Scheduler...');

    const scheduler = this.system.getComponent('scheduler');

    try {
      // Start scheduler for testing
      scheduler.start();

      // Test workflow scheduling
      const scheduleConfig = {
        id: 'test-schedule',
        workflowId: 'test-workflow',
        name: 'Test Scheduled Workflow',
        schedule: {
          type: 'once',
          runAt: new Date(Date.now() + 2000) // 2 seconds from now
        },
        input: { message: 'Scheduled execution' },
        enabled: true
      };

      const scheduledJob = scheduler.scheduleWorkflow(scheduleConfig);
      this.recordTest('Workflow Scheduling', !!scheduledJob,
                     scheduledJob ? null : 'Failed to schedule workflow');

      // Test priority queue
      const queueItem = {
        workflowId: 'test-workflow',
        input: { message: 'Queued execution' },
        priority: 'high'
      };

      const queueId = scheduler.queueWorkflow(queueItem);
      this.recordTest('Workflow Queuing', !!queueId, queueId ? null : 'Failed to queue workflow');

      // Test scheduler metrics
      const metrics = scheduler.getMetrics();
      this.recordTest('Scheduler Metrics', metrics.scheduledJobs >= 0, null);

      // Test queue status
      const queueStatus = scheduler.getQueueStatus();
      this.recordTest('Queue Status', typeof queueStatus.total === 'number', null);

      // Stop scheduler
      scheduler.stop();

    } catch (error) {
      this.recordTest('Workflow Scheduler Test', false, error.message);
    }

    console.log('✅ Workflow Scheduler tests completed\n');
  }

  /**
   * Test Automation Orchestrator
   */
  async testAutomationOrchestrator() {
    console.log('🔄 Testing Automation Orchestrator...');

    const orchestrator = this.system.getComponent('automationOrchestrator');

    try {
      // Test automation rule addition
      const testRule = {
        id: 'test-automation-rule',
        name: 'Test Automation Rule',
        trigger: {
          type: 'workflow-completed',
          conditions: ['workflowId == "test-workflow"']
        },
        actions: [
          {
            type: 'notification',
            config: {
              recipients: ['admin@example.com'],
              message: 'Test workflow completed successfully'
            }
          }
        ],
        enabled: true
      };

      const rule = orchestrator.addAutomationRule(testRule);
      this.recordTest('Automation Rule Addition', !!rule,
                     rule ? null : 'Failed to add automation rule');

      // Test rule listing
      const rules = orchestrator.listRules();
      this.recordTest('Automation Rules Listing', rules.length > 0,
                     rules.length > 0 ? null : 'No rules found');

      // Test orchestrator metrics
      const metrics = orchestrator.getMetrics();
      this.recordTest('Orchestrator Metrics', metrics.rulesCount >= 0, null);

      // Test rule management
      const enableResult = orchestrator.enableRule('test-automation-rule');
      this.recordTest('Rule Enable/Disable', enableResult,
                     enableResult ? null : 'Failed to enable rule');

    } catch (error) {
      this.recordTest('Automation Orchestrator Test', false, error.message);
    }

    console.log('✅ Automation Orchestrator tests completed\n');
  }

  /**
   * Test Requirements Precision Integration
   */
  async testRequirementsPrecisionIntegration() {
    console.log('🔗 Testing Requirements Precision Integration...');

    const integration = this.system.getComponent('requirementsPrecisionIntegration');

    try {
      // Test enhanced capability analysis
      const capabilityContent = `
# Test Capability Document

## Metadata
- **Type**: Capability
- **ID**: CAP-INT-001
- **Status**: Draft
- **Priority**: High
- **Owner**: Test Team

## Description
Test capability for integration testing.

## Functional Requirements
| ID | Requirement | Description | Priority | Status | Approval |
|----|-------------|-------------|----------|--------|----------|
| REQ-001 | User Management | System shall provide user management | High | Draft | Not Approved |
| REQ-002 | Data Storage | System shall store data securely | Medium | Draft | Not Approved |

## Enablers
| ID | Name | Description | Status | Priority |
|----|------|-------------|--------|----------|
| ENB-001 | User Service | User management service | Draft | High |
| ENB-002 | Database Service | Data storage service | Draft | Medium |

## Dependencies
### Internal Dependencies
- Authentication system
- Database infrastructure

### External Dependencies
- Third-party identity provider
      `;

      const capabilityResult = await integration.enhancedCapabilityAnalysis({
        documentId: 'test-cap-int-001',
        documentContent: capabilityContent
      });

      this.recordTest('Enhanced Capability Analysis', capabilityResult.success, capabilityResult.error);

      if (capabilityResult.success) {
        const hasTraditional = !!capabilityResult.analysis.traditional;
        this.recordTest('Traditional Analysis Present', hasTraditional,
                       hasTraditional ? null : 'Traditional analysis missing');

        const hasSynthesis = !!capabilityResult.analysis.synthesis;
        this.recordTest('Analysis Synthesis Present', hasSynthesis,
                       hasSynthesis ? null : 'Synthesis missing');
      }

      // Test enabler analysis
      const enablerContent = `
# Test Enabler Document

## Metadata
- **Type**: Enabler
- **ID**: ENB-INT-001
- **Status**: Draft
- **Priority**: High
- **Capability ID**: CAP-INT-001

## Description
Test enabler for integration testing.

## Functional Requirements
| ID | Requirement | Description | Priority | Status | Approval |
|----|-------------|-------------|----------|--------|----------|
| REQ-ENB-001 | API Endpoint | Provide REST API endpoint | High | Draft | Not Approved |
| REQ-ENB-002 | Data Validation | Validate input data | Medium | Draft | Not Approved |

## Implementation Plan
### Task 1: Setup Infrastructure
- Configure database
- Setup API framework

### Task 2: Implement Features
- Create user endpoints
- Add data validation
      `;

      const enablerResult = await integration.enhancedEnablerAnalysis({
        documentId: 'test-enb-int-001',
        documentContent: enablerContent
      });

      this.recordTest('Enhanced Enabler Analysis', enablerResult.success, enablerResult.error);

      // Test integration metrics
      const metrics = integration.getMetrics();
      this.recordTest('Integration Metrics', metrics.totalAnalyses >= 0, null);

    } catch (error) {
      this.recordTest('Requirements Precision Integration Test', false, error.message);
    }

    console.log('✅ Requirements Precision Integration tests completed\n');
  }

  /**
   * Test API endpoints (simulated)
   */
  async testAPIEndpoints() {
    console.log('🌐 Testing API Endpoints...');

    try {
      // Get API router
      const apiRouter = this.system.getAPIRouter();
      this.recordTest('API Router Available', !!apiRouter,
                     apiRouter ? null : 'API router not found');

      // Test public API methods
      const capabilityAnalysis = await this.system.analyzeCapability(`
# Sample Capability
## Metadata
- **Type**: Capability
- **ID**: CAP-API-001
      `);

      this.recordTest('Public API Capability Analysis', capabilityAnalysis.success, capabilityAnalysis.error);

      const smartAnalysis = await this.system.performSmartAnalysis({
        content: 'Test content for smart analysis',
        type: 'generic',
        documentId: 'test-doc-001'
      });

      this.recordTest('Public API Smart Analysis', smartAnalysis.success, smartAnalysis.error);

    } catch (error) {
      this.recordTest('API Endpoints Test', false, error.message);
    }

    console.log('✅ API Endpoints tests completed\n');
  }

  /**
   * Test system health and metrics
   */
  async testSystemHealthAndMetrics() {
    console.log('📊 Testing System Health and Metrics...');

    try {
      // Test system status
      const status = this.system.getSystemStatus();
      this.recordTest('System Status', !!status && status.isInitialized,
                     status ? null : 'System status not available');

      // Test health check
      const health = await this.system.performHealthCheck();
      this.recordTest('System Health Check', health.overall !== 'unhealthy',
                     health.overall === 'unhealthy' ? health.error : null);

      // Test component metrics
      const components = ['workflowEngine', 'scheduler', 'aiServices', 'smartAnalysis', 'automation'];
      for (const component of components) {
        const hasMetrics = status.components[component] && status.components[component].metrics;
        this.recordTest(`${component} Metrics Available`, !!hasMetrics,
                       hasMetrics ? null : 'Metrics not found');
      }

    } catch (error) {
      this.recordTest('System Health and Metrics Test', false, error.message);
    }

    console.log('✅ System Health and Metrics tests completed\n');
  }

  /**
   * Cleanup test system
   */
  async cleanupTestSystem() {
    console.log('🧹 Cleaning up test system...');

    try {
      if (this.system && this.system.isRunning) {
        await this.system.stop();
      }
      console.log('✅ Test system cleanup completed\n');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }

  /**
   * Record test result
   */
  recordTest(testName, passed, error = null) {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }

    this.testResults.tests.push({
      name: testName,
      passed,
      error,
      timestamp: new Date().toISOString()
    });

    const status = passed ? '✅' : '❌';
    const errorMsg = error ? ` - ${error}` : '';
    console.log(`  ${status} ${testName}${errorMsg}`);
  }

  /**
   * Print test results summary
   */
  printTestResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 AI WORKFLOW AUTOMATION BACKEND TEST RESULTS');
    console.log('='.repeat(60));

    console.log(`📊 Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);

    const successRate = this.testResults.total > 0 ?
      (this.testResults.passed / this.testResults.total * 100).toFixed(1) : 0;
    console.log(`📈 Success Rate: ${successRate}%`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }

    console.log('\n' + '='.repeat(60));

    if (successRate >= 90) {
      console.log('🎉 EXCELLENT! AI Workflow Automation Backend is working properly!');
    } else if (successRate >= 75) {
      console.log('👍 GOOD! AI Workflow Automation Backend is mostly functional.');
    } else if (successRate >= 50) {
      console.log('⚠️ FAIR! AI Workflow Automation Backend has some issues.');
    } else {
      console.log('❌ POOR! AI Workflow Automation Backend needs significant fixes.');
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests...\n');

    try {
      await this.system.start();

      // Test concurrent workflow executions
      const concurrentTests = [];
      const startTime = Date.now();

      for (let i = 0; i < 5; i++) {
        concurrentTests.push(
          this.system.executeWorkflow('test-workflow', { message: `Concurrent test ${i}` })
        );
      }

      const results = await Promise.all(concurrentTests);
      const endTime = Date.now();

      const allSuccessful = results.every(result => result.success);
      const duration = endTime - startTime;

      this.recordTest('Concurrent Workflow Execution', allSuccessful,
                     allSuccessful ? null : 'Some workflows failed');

      this.recordTest('Performance - 5 Workflows under 10s', duration < 10000,
                     duration >= 10000 ? `Took ${duration}ms` : null);

      await this.system.stop();

    } catch (error) {
      this.recordTest('Performance Tests', false, error.message);
    }

    console.log('✅ Performance tests completed\n');
  }
}

/**
 * Main test runner
 */
async function runAIWorkflowTests() {
  const tester = new AIWorkflowTester();

  try {
    // Run main test suite
    await tester.runAllTests();

    // Run performance tests
    await tester.runPerformanceTests();

    return tester.testResults;

  } catch (error) {
    console.error('Test execution failed:', error);
    return {
      success: false,
      error: error.message,
      results: tester.testResults
    };
  }
}

// Export for use in other modules
module.exports = {
  AIWorkflowTester,
  runAIWorkflowTests
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAIWorkflowTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}