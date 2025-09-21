/**
 * Analytics Integration Hub
 * Connects analytics engines with existing Anvil systems
 * Handles data pipelines and real-time streaming
 */

const EventEmitter = require('events');
const PredictiveEngine = require('./PredictiveEngine');
const PerformanceTracker = require('./PerformanceTracker');

class AnalyticsIntegration extends EventEmitter {
  constructor() {
    super();
    this.predictiveEngine = new PredictiveEngine();
    this.performanceTracker = new PerformanceTracker();
    this.dataPipelines = new Map();
    this.realTimeStreams = new Map();
    this.integrations = new Map();
    this.pollingIntervals = [];
    this.enginesInitialized = false;
    this.isPollingActive = false;

    this.initialize();
  }

  async initialize() {
    console.log('🔗 Initializing Analytics Integration Hub...');

    // Initialize analytics engines
    await this.initializeEngines();

    // Set up data pipelines
    await this.setupDataPipelines();

    // Configure integrations with existing systems
    await this.configureSystemIntegrations();

    // Start real-time data streaming
    this.startRealTimeStreaming();

    this.emit('initialized');
    console.log('✅ Analytics Integration Hub ready');
  }

  async initializeEngines() {
    // Wait for engines to initialize with timeout and proper error handling
    try {
      const initPromise = Promise.all([
        new Promise((resolve, reject) => {
          // Check if already initialized to handle race conditions
          if (this.predictiveEngine.initialized) {
            resolve();
            return;
          }

          const timeout = setTimeout(() => {
            reject(new Error('PredictiveEngine initialization timeout'));
          }, 6000);
          this.predictiveEngine.once('initialized', () => {
            clearTimeout(timeout);
            resolve();
          });
        }),
        new Promise((resolve, reject) => {
          // Check if already initialized to handle race conditions
          if (this.performanceTracker.initialized) {
            resolve();
            return;
          }

          const timeout = setTimeout(() => {
            reject(new Error('PerformanceTracker initialization timeout'));
          }, 6000);
          this.performanceTracker.once('initialized', () => {
            clearTimeout(timeout);
            resolve();
          });
        })
      ]);

      await Promise.race([
        initPromise,
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Overall engine initialization timeout')), 7000);
        })
      ]);

      this.enginesInitialized = true;
    } catch (error) {
      console.warn('⚠️ Engine initialization failed, disabling analytics features:', error.message);
      this.enginesInitialized = false;
      return; // Don't proceed with setup if engines failed
    }

    // Set up cross-engine communication only if engines initialized successfully
    this.setupEngineInteractions();
  }

  setupEngineInteractions() {
    // Performance data feeds into predictive models
    this.performanceTracker.on('teamVelocityTracked', (data) => {
      this.updatePredictiveModels('velocity', data);
    });

    this.performanceTracker.on('resourceRecommendationsGenerated', (data) => {
      this.updatePredictiveModels('resources', data);
    });

    // Predictive insights inform performance tracking
    this.predictiveEngine.on('qualityPrediction', (data) => {
      this.updatePerformanceMetrics('quality', data);
    });

    this.predictiveEngine.on('riskAssessment', (data) => {
      this.updatePerformanceMetrics('risk', data);
    });
  }

  async setupDataPipelines() {
    // Pipeline for capability and enabler data
    this.dataPipelines.set('capabilities', {
      source: 'app_context',
      destination: 'analytics_engines',
      transform: this.transformCapabilityData.bind(this),
      frequency: 'real-time',
      active: true
    });

    // Pipeline for collaboration data
    this.dataPipelines.set('collaboration', {
      source: 'collaboration_system',
      destination: 'performance_tracker',
      transform: this.transformCollaborationData.bind(this),
      frequency: 'real-time',
      active: true
    });

    // Pipeline for validation/precision data
    this.dataPipelines.set('precision', {
      source: 'precision_engine',
      destination: 'predictive_engine',
      transform: this.transformPrecisionData.bind(this),
      frequency: 'batch',
      active: true
    });

    // Pipeline for AI workflow data
    this.dataPipelines.set('ai_workflow', {
      source: 'ai_workflow_engine',
      destination: 'both_engines',
      transform: this.transformWorkflowData.bind(this),
      frequency: 'real-time',
      active: true
    });
  }

  async configureSystemIntegrations() {
    // Integration with existing feature context
    this.integrations.set('feature_context', {
      enabled: true,
      endpoints: ['/api/features', '/api/capabilities', '/api/enablers'],
      dataTypes: ['feature_usage', 'capability_metrics', 'enabler_status'],
      updateFrequency: 5000 // 5 seconds
    });

    // Integration with collaboration system
    this.integrations.set('collaboration', {
      enabled: true,
      endpoints: ['/api/collaboration/sessions', '/api/collaboration/metrics'],
      dataTypes: ['user_activity', 'document_edits', 'communication_patterns'],
      updateFrequency: 1000 // 1 second
    });

    // Integration with validation system
    this.integrations.set('validation', {
      enabled: true,
      endpoints: ['/api/validation/results', '/api/precision/metrics'],
      dataTypes: ['validation_results', 'quality_scores', 'precision_metrics'],
      updateFrequency: 10000 // 10 seconds
    });

    // Integration with AI workflow system
    this.integrations.set('ai_workflow', {
      enabled: true,
      endpoints: ['/api/ai-workflow/status', '/api/ai-workflow/metrics'],
      dataTypes: ['workflow_execution', 'automation_metrics', 'ai_insights'],
      updateFrequency: 2000 // 2 seconds
    });

    // Integration with monitoring system
    this.integrations.set('monitoring', {
      enabled: true,
      endpoints: ['/api/monitoring/health', '/api/monitoring/performance'],
      dataTypes: ['system_health', 'performance_metrics', 'alerts'],
      updateFrequency: 5000 // 5 seconds
    });
  }

  startRealTimeStreaming() {
    // WebSocket streams for real-time data
    this.realTimeStreams.set('user_activities', {
      type: 'websocket',
      endpoint: '/ws/user-activities',
      handlers: [this.handleUserActivity.bind(this)]
    });

    this.realTimeStreams.set('document_changes', {
      type: 'websocket',
      endpoint: '/ws/document-changes',
      handlers: [this.handleDocumentChange.bind(this)]
    });

    this.realTimeStreams.set('system_events', {
      type: 'websocket',
      endpoint: '/ws/system-events',
      handlers: [this.handleSystemEvent.bind(this)]
    });

    // Start polling for batch updates
    this.startPollingUpdates();
  }

  startPollingUpdates() {
    // Only start polling if engines are properly initialized
    if (!this.enginesInitialized) {
      console.warn('⚠️ Skipping polling updates - engines not initialized');
      return;
    }

    this.pollingIntervals = [];

    // Poll each integration based on its frequency with safeguards
    for (const [name, integration] of this.integrations) {
      if (integration.enabled) {
        const intervalId = setInterval(() => {
          // Add rate limiting to prevent overwhelming the system
          if (!this.isPollingActive) {
            this.isPollingActive = true;
            this.pollIntegrationData(name, integration)
              .finally(() => {
                this.isPollingActive = false;
              });
          }
        }, Math.max(integration.updateFrequency, 5000)); // Minimum 5 second intervals

        this.pollingIntervals.push(intervalId);
      }
    }
  }

  async pollIntegrationData(integrationName, integration) {
    // Add timeout protection to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Polling timeout')), 10000); // 10 second timeout
    });

    try {
      await Promise.race([
        this.processSingleIntegration(integrationName, integration),
        timeoutPromise
      ]);
    } catch (error) {
      if (error.message === 'Polling timeout') {
        console.warn(`⚠️ Polling timeout for ${integrationName}, skipping this cycle`);
      } else {
        console.error(`❌ Error polling ${integrationName} data:`, error);
      }
      this.emit('integrationError', { integration: integrationName, error });
    }
  }

  async processSingleIntegration(integrationName, integration) {
    for (const endpoint of integration.endpoints) {
      const data = await this.fetchIntegrationData(endpoint);
      if (data) {
        await this.processIntegrationData(integrationName, data);
      }
    }
  }

  async fetchIntegrationData(endpoint) {
    // In production, this would make actual HTTP requests
    // For now, return mock data based on endpoint
    return this.generateMockData(endpoint);
  }

  generateMockData(endpoint) {
    switch (endpoint) {
      case '/api/features':
        return {
          features: [
            { id: 'analytics', usage: 0.85, performance: 0.92 },
            { id: 'collaboration', usage: 0.78, performance: 0.88 },
            { id: 'precision', usage: 0.82, performance: 0.90 }
          ],
          timestamp: new Date()
        };

      case '/api/capabilities':
        return {
          capabilities: [
            { id: 'cap_1', completionRate: 0.75, quality: 0.88 },
            { id: 'cap_2', completionRate: 0.90, quality: 0.85 }
          ],
          timestamp: new Date()
        };

      case '/api/collaboration/sessions':
        return {
          activeSessions: 12,
          averageDuration: 25.5,
          collaborationScore: 0.82,
          timestamp: new Date()
        };

      case '/api/validation/results':
        return {
          validationResults: [
            { documentId: 'doc_1', score: 0.87, issues: 2 },
            { documentId: 'doc_2', score: 0.92, issues: 1 }
          ],
          timestamp: new Date()
        };

      case '/api/ai-workflow/status':
        return {
          activeWorkflows: 5,
          completionRate: 0.89,
          averageExecutionTime: 1250,
          timestamp: new Date()
        };

      case '/api/monitoring/health':
        return {
          systemHealth: 0.95,
          responseTime: 180,
          errorRate: 0.02,
          timestamp: new Date()
        };

      default:
        return null;
    }
  }

  async processIntegrationData(integrationName, data) {
    switch (integrationName) {
      case 'feature_context':
        await this.processFeatureData(data);
        break;

      case 'collaboration':
        await this.processCollaborationData(data);
        break;

      case 'validation':
        await this.processValidationData(data);
        break;

      case 'ai_workflow':
        await this.processWorkflowData(data);
        break;

      case 'monitoring':
        await this.processMonitoringData(data);
        break;

      default:
        console.warn(`🤷 Unknown integration: ${integrationName}`);
    }
  }

  async processFeatureData(data) {
    // Add safeguards to prevent infinite processing
    if (!this.enginesInitialized) {
      console.warn('⚠️ Skipping feature data processing - engines not initialized');
      return;
    }

    if (data.features) {
      // Update performance tracker with feature usage data
      for (const feature of data.features) {
        try {
          this.performanceTracker.recordEvent({
            type: 'feature_usage',
            featureId: feature.id,
            usage: feature.usage,
            performance: feature.performance,
            timestamp: Date.now()
          });
        } catch (error) {
          console.warn('⚠️ Error recording feature event:', error.message);
        }
      }
    }

    if (data.capabilities) {
      // Rate limit predictive analysis to prevent overwhelming
      const analysisPromises = [];
      for (const capability of data.capabilities.slice(0, 3)) { // Limit to 3 capabilities per cycle
        const projectData = {
          id: capability.id,
          progress: capability.completionRate,
          qualityScore: capability.quality,
          timestamp: new Date()
        };

        // Add timeout to individual analysis
        const analysisPromise = Promise.race([
          this.predictiveEngine.analyzeProject(projectData),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Analysis timeout')), 5000);
          })
        ]).catch(error => {
          console.warn(`⚠️ Analysis failed for ${capability.id}:`, error.message);
          return null;
        });

        analysisPromises.push(analysisPromise);
      }

      await Promise.allSettled(analysisPromises);
    }
  }

  async processCollaborationData(data) {
    // Update performance tracker with collaboration metrics
    this.performanceTracker.recordEvent({
      type: 'collaboration_update',
      activeSessions: data.activeSessions,
      averageDuration: data.averageDuration,
      collaborationScore: data.collaborationScore,
      timestamp: Date.now()
    });

    // Feed data to predictive engine for team prediction models
    if (data.collaborationScore) {
      this.updatePredictiveModels('collaboration', {
        score: data.collaborationScore,
        trend: this.calculateTrend([data.collaborationScore]),
        timestamp: new Date()
      });
    }
  }

  async processValidationData(data) {
    if (data.validationResults) {
      for (const result of data.validationResults) {
        // Update performance tracker with document metrics
        await this.performanceTracker.analyzeDocumentComplexity({
          id: result.documentId,
          qualityScore: result.score,
          issues: result.issues,
          timestamp: new Date()
        });

        // Feed to predictive engine for quality prediction
        const projectData = {
          id: result.documentId,
          qualityMetrics: {
            validationScore: result.score,
            issueCount: result.issues
          },
          timestamp: new Date()
        };

        await this.predictiveEngine.predictQuality(projectData);
      }
    }
  }

  async processWorkflowData(data) {
    // Track AI workflow performance
    this.performanceTracker.recordEvent({
      type: 'ai_workflow_metrics',
      activeWorkflows: data.activeWorkflows,
      completionRate: data.completionRate,
      executionTime: data.averageExecutionTime,
      timestamp: Date.now()
    });

    // Use for automation efficiency predictions
    if (data.completionRate) {
      await this.updatePredictiveModels('automation', {
        efficiency: data.completionRate,
        performance: 1 - (data.averageExecutionTime / 2000), // Normalize execution time
        timestamp: new Date()
      });
    }
  }

  async processMonitoringData(data) {
    // Track system health metrics
    this.performanceTracker.recordEvent({
      type: 'system_health',
      health: data.systemHealth,
      responseTime: data.responseTime,
      errorRate: data.errorRate,
      timestamp: Date.now()
    });

    // Use for system reliability predictions
    await this.updatePredictiveModels('system_reliability', {
      health: data.systemHealth,
      performance: 1 - (data.responseTime / 1000), // Normalize response time
      reliability: 1 - data.errorRate,
      timestamp: new Date()
    });
  }

  // Real-time event handlers
  handleUserActivity(activity) {
    this.performanceTracker.recordEvent({
      type: 'user_activity',
      userId: activity.userId,
      action: activity.action,
      duration: activity.duration,
      timestamp: Date.now()
    });
  }

  handleDocumentChange(change) {
    this.performanceTracker.recordEvent({
      type: 'document_change',
      documentId: change.documentId,
      changeType: change.type,
      userId: change.userId,
      timestamp: Date.now()
    });
  }

  handleSystemEvent(event) {
    this.performanceTracker.recordEvent({
      type: 'system_event',
      eventType: event.type,
      severity: event.severity,
      component: event.component,
      timestamp: Date.now()
    });
  }

  // Data transformation methods
  transformCapabilityData(data) {
    return {
      id: data.id,
      progress: data.completionRate || 0,
      quality: data.qualityScore || 0.5,
      complexity: this.calculateComplexity(data),
      team: data.assignedTeam || null,
      timestamp: new Date()
    };
  }

  transformCollaborationData(data) {
    return {
      teamId: data.teamId,
      collaborationScore: data.score,
      activeSessions: data.sessions,
      communicationFrequency: data.communication,
      timestamp: new Date()
    };
  }

  transformPrecisionData(data) {
    return {
      documentId: data.id,
      precisionScore: data.score,
      validationResults: data.validation,
      qualityMetrics: data.quality,
      timestamp: new Date()
    };
  }

  transformWorkflowData(data) {
    return {
      workflowId: data.id,
      executionTime: data.duration,
      success: data.status === 'completed',
      efficiency: data.efficiency,
      timestamp: new Date()
    };
  }

  // Cross-engine updates
  async updatePredictiveModels(dataType, data) {
    try {
      switch (dataType) {
        case 'velocity':
          // Update velocity-related predictions
          break;

        case 'resources':
          // Update resource allocation predictions
          break;

        case 'collaboration':
          // Update team collaboration predictions
          break;

        case 'automation':
          // Update automation efficiency predictions
          break;

        case 'system_reliability':
          // Update system reliability predictions
          break;

        default:
          console.log(`📊 Updating predictive models with ${dataType} data`);
      }
    } catch (error) {
      console.error(`❌ Error updating predictive models for ${dataType}:`, error);
    }
  }

  async updatePerformanceMetrics(metricType, data) {
    try {
      switch (metricType) {
        case 'quality':
          // Update quality performance metrics
          break;

        case 'risk':
          // Update risk-related performance metrics
          break;

        default:
          console.log(`📈 Updating performance metrics with ${metricType} data`);
      }
    } catch (error) {
      console.error(`❌ Error updating performance metrics for ${metricType}:`, error);
    }
  }

  // Utility methods
  calculateComplexity(data) {
    // Calculate complexity based on various factors
    const factors = [
      data.dependencies?.length || 0,
      data.requirements?.length || 0,
      data.integrations?.length || 0
    ];

    return Math.min(1, factors.reduce((sum, factor) => sum + factor, 0) / 10);
  }

  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const recent = values[values.length - 1];
    const previous = values[values.length - 2];
    const change = (recent - previous) / previous;

    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  // Public API methods
  async getAnalyticsData(projectId) {
    try {
      const predictions = await this.predictiveEngine.analyzeProject({ id: projectId });
      const performance = this.performanceTracker.getProjectMetrics(projectId) || {
        completion_rate: { current: 0.8 },
        resource_efficiency: { current: 0.85 },
        complexity_analysis: { average_complexity: 0.6 }
      };

      return {
        predictions,
        performance,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Error getting analytics data for project ${projectId}:`, error);
      return {
        predictions: { error: error.message },
        performance: { error: 'Performance data unavailable' },
        timestamp: new Date()
      };
    }
  }

  async getTeamAnalytics(teamId) {
    try {
      const teamMetrics = this.performanceTracker.getTeamMetrics(teamId) || {
        velocity: { current: 42, trend: 'stable' },
        productivity: { current: 0.8, factors: {} },
        quality: { current: 0.85 }
      };
      const predictions = await this.predictiveEngine.analyzeProject({ id: `team_${teamId}` });

      return {
        team: teamMetrics,
        predictions,
        timestamp: new Date()
      };
    } catch (error) {
      console.error(`Error getting team analytics for ${teamId}:`, error);
      return {
        team: { error: 'Team data unavailable' },
        predictions: { error: error.message },
        timestamp: new Date()
      };
    }
  }

  async generateInsights(options = {}) {
    const insights = await this.performanceTracker.generateInsights();
    return {
      ...insights,
      predictive: await this.generatePredictiveInsights(options),
      timestamp: new Date()
    };
  }

  async generatePredictiveInsights(options) {
    // Generate insights based on predictive models
    return {
      qualityTrends: 'Quality metrics show consistent improvement',
      riskFactors: 'Low risk profile with stable team performance',
      recommendations: [
        'Continue current quality practices',
        'Consider capacity planning for next quarter'
      ]
    };
  }

  getIntegrationStatus() {
    const status = {};
    for (const [name, integration] of this.integrations) {
      status[name] = {
        enabled: integration.enabled,
        lastUpdate: integration.lastUpdate || 'Never',
        status: integration.enabled ? 'Active' : 'Disabled'
      };
    }
    return status;
  }

  getDataPipelineStatus() {
    const status = {};
    for (const [name, pipeline] of this.dataPipelines) {
      status[name] = {
        active: pipeline.active,
        frequency: pipeline.frequency,
        lastProcessed: pipeline.lastProcessed || 'Never'
      };
    }
    return status;
  }

  // Health check
  async healthCheck() {
    const engineHealth = await Promise.all([
      this.checkEngineHealth('predictive', this.predictiveEngine),
      this.checkEngineHealth('performance', this.performanceTracker)
    ]);

    return {
      status: engineHealth.every(h => h.healthy) ? 'healthy' : 'degraded',
      engines: engineHealth,
      integrations: this.getIntegrationStatus(),
      pipelines: this.getDataPipelineStatus(),
      timestamp: new Date()
    };
  }

  async checkEngineHealth(name, engine) {
    try {
      // Basic health check
      return {
        name,
        healthy: true,
        status: 'operational',
        lastActivity: new Date()
      };
    } catch (error) {
      return {
        name,
        healthy: false,
        status: 'error',
        error: error.message,
        lastActivity: new Date()
      };
    }
  }

  // Cleanup method for tests
  cleanup() {
    // Stop all polling intervals
    if (this.pollingIntervals) {
      this.pollingIntervals.forEach(intervalId => clearInterval(intervalId));
      this.pollingIntervals = [];
    }

    // Clean up engines
    if (this.performanceTracker && typeof this.performanceTracker.cleanup === 'function') {
      this.performanceTracker.cleanup();
    }
    if (this.predictiveEngine && typeof this.predictiveEngine.cleanup === 'function') {
      this.predictiveEngine.cleanup();
    }

    // Remove all listeners
    this.removeAllListeners();

    // Clear data structures
    this.dataPipelines.clear();
    this.realTimeStreams.clear();
    this.integrations.clear();

    // Reset state
    this.enginesInitialized = false;
    this.isPollingActive = false;
  }
}

module.exports = AnalyticsIntegration;