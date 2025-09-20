/**
 * AI Workflow Automation System
 * Main initialization module for the AI Workflow Automation backend
 */

const WorkflowEngine = require('./WorkflowEngine');
const WorkflowScheduler = require('./WorkflowScheduler');
const RequirementsPrecisionIntegration = require('./RequirementsPrecisionIntegration');
const { AIServiceManager } = require('../ai-services/AIServiceManager');
const SmartAnalysisEngine = require('../ai-services/SmartAnalysisEngine');
const AutomationOrchestrator = require('../automation/AutomationOrchestrator');
const initializeAIWorkflowEndpoints = require('../api/ai-workflow-endpoints');

class AIWorkflowSystem {
  constructor(config = {}) {
    this.config = {
      // Workflow Engine Config
      maxConcurrentWorkflows: config.maxConcurrentWorkflows || 10,
      workflowTimeout: config.workflowTimeout || 300000,

      // Scheduler Config
      schedulerCheckInterval: config.schedulerCheckInterval || 30000,

      // AI Services Config
      aiServiceTimeout: config.aiServiceTimeout || 30000,
      maxConcurrentAIRequests: config.maxConcurrentAIRequests || 5,

      // Smart Analysis Config
      analysisDepth: config.analysisDepth || 'comprehensive',
      includeAISuggestions: config.includeAISuggestions !== false,

      // Integration Config
      enhanceWithAI: config.enhanceWithAI !== false,
      qualityThreshold: config.qualityThreshold || 70,

      // Automation Config
      autoProcessing: config.autoProcessing !== false,
      intelligentRouting: config.intelligentRouting !== false,
      adaptiveLearning: config.adaptiveLearning !== false,

      ...config
    };

    this.components = {};
    this.isInitialized = false;
    this.isRunning = false;

    this.metrics = {
      startTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      systemUptime: 0
    };
  }

  /**
   * Initialize the AI Workflow System
   */
  async initialize() {
    try {
      console.log('Initializing AI Workflow Automation System...');

      // Initialize core components
      await this.initializeComponents();

      // Setup integrations
      await this.setupIntegrations();

      // Register default workflows
      await this.registerDefaultWorkflows();

      // Setup API endpoints
      this.setupAPIEndpoints();

      this.isInitialized = true;
      console.log('AI Workflow Automation System initialized successfully');

      return {
        success: true,
        message: 'AI Workflow System initialized',
        components: Object.keys(this.components)
      };

    } catch (error) {
      console.error('Failed to initialize AI Workflow System:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize core components
   */
  async initializeComponents() {
    // Initialize Workflow Engine
    this.components.workflowEngine = new WorkflowEngine({
      maxConcurrentWorkflows: this.config.maxConcurrentWorkflows,
      workflowTimeout: this.config.workflowTimeout,
      retryAttempts: this.config.retryAttempts || 3
    });

    // Initialize AI Service Manager
    this.components.aiServiceManager = new AIServiceManager({
      timeout: this.config.aiServiceTimeout,
      maxConcurrentRequests: this.config.maxConcurrentAIRequests,
      defaultProvider: this.config.defaultAIProvider || 'claude'
    });

    // Initialize Smart Analysis Engine
    this.components.smartAnalysisEngine = new SmartAnalysisEngine(
      this.components.aiServiceManager,
      null, // Will be set in setupIntegrations
      {
        analysisDepth: this.config.analysisDepth,
        includeAISuggestions: this.config.includeAISuggestions,
        cacheResults: this.config.cacheResults !== false
      }
    );

    // Initialize Workflow Scheduler
    this.components.scheduler = new WorkflowScheduler(
      this.components.workflowEngine,
      {
        checkInterval: this.config.schedulerCheckInterval,
        maxRetries: this.config.maxRetries || 3
      }
    );

    // Initialize Requirements Precision Integration
    this.components.requirementsPrecisionIntegration = new RequirementsPrecisionIntegration(
      this.components.workflowEngine,
      this.components.aiServiceManager,
      this.components.smartAnalysisEngine,
      {
        enhanceWithAI: this.config.enhanceWithAI,
        qualityThreshold: this.config.qualityThreshold
      }
    );

    // Initialize Automation Orchestrator
    this.components.automationOrchestrator = new AutomationOrchestrator(
      this.components.workflowEngine,
      this.components.scheduler,
      this.components.aiServiceManager,
      this.components.smartAnalysisEngine,
      {
        autoProcessing: this.config.autoProcessing,
        intelligentRouting: this.config.intelligentRouting,
        adaptiveLearning: this.config.adaptiveLearning
      }
    );

    console.log('Core components initialized');
  }

  /**
   * Setup integrations between components
   */
  async setupIntegrations() {
    // Set requirements analyzer in smart analysis engine
    this.components.smartAnalysisEngine.requirementsAnalyzer =
      this.components.requirementsPrecisionIntegration.requirementsAnalyzer;

    // Setup cross-component event handlers
    this.setupEventHandlers();

    console.log('Component integrations setup completed');
  }

  /**
   * Setup event handlers for cross-component communication
   */
  setupEventHandlers() {
    // Workflow Engine events
    this.components.workflowEngine.on('workflow-completed', (event) => {
      this.metrics.successfulRequests++;
      this.handleWorkflowEvent('completed', event);
    });

    this.components.workflowEngine.on('workflow-failed', (event) => {
      this.handleWorkflowEvent('failed', event);
    });

    // AI Service Manager events
    this.components.aiServiceManager.on('ai-request-completed', (event) => {
      this.handleAIServiceEvent('completed', event);
    });

    // Smart Analysis Engine events
    this.components.smartAnalysisEngine.on('smart-analysis-completed', (event) => {
      this.handleAnalysisEvent('completed', event);
    });

    // Scheduler events
    this.components.scheduler.on('scheduled-job-completed', (event) => {
      this.handleSchedulerEvent('completed', event);
    });

    // Automation Orchestrator events
    this.components.automationOrchestrator.on('automation-rule-triggered', (event) => {
      this.handleAutomationEvent('triggered', event);
    });
  }

  /**
   * Register default workflows
   */
  async registerDefaultWorkflows() {
    const defaultWorkflows = [
      {
        id: 'basic-requirements-analysis',
        name: 'Basic Requirements Analysis',
        description: 'Standard requirements document analysis',
        steps: [
          {
            id: 'analyze',
            type: 'ai-analysis',
            name: 'Analyze Requirements',
            config: { analysisType: 'requirements' }
          },
          {
            id: 'validate',
            type: 'requirements-validation',
            name: 'Validate Requirements',
            config: { includeMetrics: true }
          },
          {
            id: 'report',
            type: 'notification',
            name: 'Send Analysis Report',
            config: {
              recipients: ['requester'],
              message: 'Requirements analysis completed: ${result.summary}'
            }
          }
        ]
      },
      {
        id: 'automated-quality-check',
        name: 'Automated Quality Check',
        description: 'Automated quality assessment workflow',
        steps: [
          {
            id: 'smart-analysis',
            type: 'ai-analysis',
            name: 'Smart Quality Analysis',
            config: {
              analysisType: 'quality-check',
              includeImprovement: true
            }
          },
          {
            id: 'quality-gate',
            type: 'conditional-branch',
            name: 'Quality Gate Check',
            config: {
              conditions: [
                {
                  name: 'high-quality',
                  expression: '${data.smart-analysis.qualityScore} >= 80',
                  result: { status: 'approved', gate: 'passed' }
                },
                {
                  name: 'needs-improvement',
                  expression: '${data.smart-analysis.qualityScore} < 80',
                  result: { status: 'needs-improvement', gate: 'failed' }
                }
              ]
            }
          },
          {
            id: 'generate-improvement-plan',
            type: 'ai-analysis',
            name: 'Generate Improvement Plan',
            condition: '${data.quality-gate.status} == "needs-improvement"',
            config: {
              analysisType: 'improvement-plan',
              prioritize: true
            }
          }
        ]
      }
    ];

    for (const workflow of defaultWorkflows) {
      try {
        this.components.workflowEngine.registerWorkflow(workflow);
        console.log(`Registered workflow: ${workflow.name}`);
      } catch (error) {
        console.warn(`Failed to register workflow ${workflow.name}:`, error.message);
      }
    }
  }

  /**
   * Setup API endpoints
   */
  setupAPIEndpoints() {
    this.apiRouter = initializeAIWorkflowEndpoints(
      this.components.workflowEngine,
      this.components.scheduler,
      this.components.aiServiceManager,
      this.components.smartAnalysisEngine
    );

    console.log('API endpoints setup completed');
  }

  /**
   * Start the AI Workflow System
   */
  async start() {
    if (!this.isInitialized) {
      throw new Error('System must be initialized before starting');
    }

    if (this.isRunning) {
      return { success: true, message: 'System already running' };
    }

    try {
      // Start scheduler
      this.components.scheduler.start();

      // Start automation orchestrator
      this.components.automationOrchestrator.start();

      this.isRunning = true;
      this.metrics.startTime = new Date();

      console.log('AI Workflow Automation System started successfully');

      return {
        success: true,
        message: 'AI Workflow System started',
        startTime: this.metrics.startTime
      };

    } catch (error) {
      console.error('Failed to start AI Workflow System:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Stop the AI Workflow System
   */
  async stop() {
    if (!this.isRunning) {
      return { success: true, message: 'System already stopped' };
    }

    try {
      // Stop scheduler
      this.components.scheduler.stop();

      // Stop automation orchestrator
      this.components.automationOrchestrator.stop();

      this.isRunning = false;

      console.log('AI Workflow Automation System stopped');

      return {
        success: true,
        message: 'AI Workflow System stopped'
      };

    } catch (error) {
      console.error('Failed to stop AI Workflow System:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Event handlers
   */
  handleWorkflowEvent(type, event) {
    this.metrics.totalRequests++;
    console.log(`Workflow ${type}:`, event.workflowId);
  }

  handleAIServiceEvent(type, event) {
    console.log(`AI Service ${type}:`, event.type);
  }

  handleAnalysisEvent(type, event) {
    console.log(`Analysis ${type}:`, event.analysisId);
  }

  handleSchedulerEvent(type, event) {
    console.log(`Scheduler ${type}:`, event.scheduleId);
  }

  handleAutomationEvent(type, event) {
    console.log(`Automation ${type}:`, event.ruleId);
  }

  /**
   * Public API methods
   */
  async analyzeCapability(documentContent, options = {}) {
    return await this.components.requirementsPrecisionIntegration.enhancedCapabilityAnalysis({
      documentId: options.documentId || `cap_${Date.now()}`,
      documentContent,
      options
    });
  }

  async analyzeEnabler(documentContent, options = {}) {
    return await this.components.requirementsPrecisionIntegration.enhancedEnablerAnalysis({
      documentId: options.documentId || `enb_${Date.now()}`,
      documentContent,
      options
    });
  }

  async performSmartAnalysis(input) {
    return await this.components.smartAnalysisEngine.performSmartAnalysis(input);
  }

  async executeWorkflow(workflowId, input, context) {
    return await this.components.workflowEngine.executeWorkflow(workflowId, input, context);
  }

  async scheduleWorkflow(scheduleConfig) {
    return this.components.scheduler.scheduleWorkflow(scheduleConfig);
  }

  /**
   * System status and metrics
   */
  getSystemStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      uptime: this.isRunning ? Date.now() - this.metrics.startTime?.getTime() : 0,
      components: {
        workflowEngine: {
          status: 'running',
          metrics: this.components.workflowEngine?.getMetrics() || {}
        },
        scheduler: {
          status: this.components.scheduler?.isRunning ? 'running' : 'stopped',
          metrics: this.components.scheduler?.getMetrics() || {}
        },
        aiServices: {
          status: 'running',
          metrics: this.components.aiServiceManager?.getMetrics() || {}
        },
        smartAnalysis: {
          status: 'running',
          metrics: this.components.smartAnalysisEngine?.getMetrics() || {}
        },
        automation: {
          status: this.components.automationOrchestrator?.isRunning ? 'running' : 'stopped',
          metrics: this.components.automationOrchestrator?.getMetrics() || {}
        }
      },
      systemMetrics: this.metrics
    };
  }

  async performHealthCheck() {
    const health = {
      overall: 'healthy',
      components: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Check AI Services
      if (this.components.aiServiceManager) {
        health.components.aiServices = await this.components.aiServiceManager.healthCheck();
      }

      // Check other components
      health.components.workflowEngine = { healthy: !!this.components.workflowEngine };
      health.components.scheduler = { healthy: this.components.scheduler?.isRunning || false };
      health.components.smartAnalysis = { healthy: !!this.components.smartAnalysisEngine };
      health.components.automation = { healthy: this.components.automationOrchestrator?.isRunning || false };

      // Determine overall health
      const unhealthyComponents = Object.entries(health.components).filter(([name, status]) => {
        if (typeof status === 'object' && status.healthy !== undefined) {
          return !status.healthy;
        }
        return false;
      });

      if (unhealthyComponents.length > 0) {
        health.overall = 'degraded';
      }

    } catch (error) {
      health.overall = 'unhealthy';
      health.error = error.message;
    }

    return health;
  }

  /**
   * Get API router for Express integration
   */
  getAPIRouter() {
    return this.apiRouter;
  }

  /**
   * Get specific component
   */
  getComponent(componentName) {
    return this.components[componentName];
  }
}

module.exports = AIWorkflowSystem;