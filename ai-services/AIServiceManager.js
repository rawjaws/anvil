/**
 * AI Service Manager
 * Manages integration with various AI services and providers
 */

const EventEmitter = require('events');
const { PreCogMarketEngine } = require('./PreCogMarketEngine');
const { ComplianceEngine } = require('./ComplianceEngine');

class AIServiceManager extends EventEmitter {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    this.name = 'AI Service Manager';
    this.services = new Map();
    this.config = {
      defaultProvider: config.defaultProvider || 'claude',
      timeout: config.timeout || 30000,
      retryAttempts: config.retryAttempts || 3,
      maxConcurrentRequests: config.maxConcurrentRequests || 5,
      ...config
    };

    this.activeRequests = new Set();
    this.requestQueue = [];
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: []
    };

    this.initialize();
  }

  /**
   * Initialize AI Service Manager
   */
  initialize() {
    // Register default AI services
    this.registerService('claude', new ClaudeAIService(this.config.claude || {}));
    this.registerService('analysis', new AnalysisAIService(this.config.analysis || {}));
    this.registerService('suggestions', new SuggestionsAIService(this.config.suggestions || {}));

    // Register PreCog Market Intelligence Engine
    this.registerService('precog-market', new PreCogMarketEngine(this.config.precog || {}));

    // Register Compliance Engine
    this.registerService('compliance', new ComplianceEngine(this.config.compliance || {}));

    this.emit('ai-service-manager-initialized', {
      timestamp: new Date().toISOString(),
      services: Array.from(this.services.keys())
    });
  }

  /**
   * Register an AI service
   */
  registerService(name, service) {
    if (!service || typeof service.process !== 'function') {
      throw new Error('Service must implement process method');
    }

    this.services.set(name, {
      instance: service,
      isEnabled: true,
      metrics: {
        requests: 0,
        successes: 0,
        failures: 0,
        averageResponseTime: 0
      },
      registeredAt: new Date().toISOString()
    });

    this.emit('service-registered', {
      serviceName: name,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Process AI request
   */
  async processRequest(request) {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Validate request
      if (!request || !request.type) {
        throw new Error('Request must have a type');
      }

      // Check concurrent request limit
      if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
        return await this.queueRequest(request);
      }

      this.activeRequests.add(requestId);
      this.metrics.totalRequests++;

      const service = this.getServiceForRequest(request);
      if (!service) {
        throw new Error(`No service available for request type: ${request.type}`);
      }

      this.emit('ai-request-started', {
        requestId,
        type: request.type,
        serviceName: service.name
      });

      // Process with timeout
      const result = await this.processWithTimeout(service, request);

      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(service.name, responseTime, true);

      this.emit('ai-request-completed', {
        requestId,
        type: request.type,
        serviceName: service.name,
        responseTime
      });

      return {
        success: true,
        requestId,
        result,
        responseTime,
        serviceName: service.name
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(null, responseTime, false);

      this.emit('ai-request-failed', {
        requestId,
        type: request.type,
        error: error.message,
        responseTime
      });

      return {
        success: false,
        requestId,
        error: error.message,
        responseTime
      };

    } finally {
      this.activeRequests.delete(requestId);
      this.processQueue();
    }
  }

  /**
   * Get appropriate service for request
   */
  getServiceForRequest(request) {
    // Determine service based on request type
    let serviceName;

    switch (request.type) {
      case 'requirements-analysis':
      case 'capability-analysis':
      case 'enabler-analysis':
        serviceName = 'analysis';
        break;

      case 'suggestions':
      case 'recommendations':
      case 'improvements':
        serviceName = 'suggestions';
        break;

      // PreCog Market Intelligence requests
      case 'market-precognition':
      case 'prevision-analysis':
      case 'oracle-intelligence':
      case 'precrime-detection':
      case 'future-sight':
      case 'minority-report':
      case 'vision-chamber-analysis':
        serviceName = 'precog-market';
        break;

      // Compliance Engine requests
      case 'compliance-check':
      case 'bulk-compliance-check':
      case 'regulation-detection':
      case 'compliance-report':
      case 'audit-trail':
        serviceName = 'compliance';
        break;

      case 'general':
      case 'chat':
      default:
        serviceName = request.serviceName || this.config.defaultProvider;
        break;
    }

    const service = this.services.get(serviceName);
    if (!service || !service.isEnabled) {
      // Fallback to default provider
      const fallback = this.services.get(this.config.defaultProvider);
      return fallback && fallback.isEnabled ? { name: this.config.defaultProvider, ...fallback } : null;
    }

    return { name: serviceName, ...service };
  }

  /**
   * Process request with timeout
   */
  async processWithTimeout(service, request) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`AI request timed out after ${this.config.timeout}ms`));
      }, this.config.timeout);

      try {
        const result = await service.instance.process(request);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Queue request when at capacity
   */
  async queueRequest(request) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request,
        resolve,
        reject,
        queuedAt: Date.now()
      });

      // Set timeout for queued request
      setTimeout(() => {
        const index = this.requestQueue.findIndex(item => item.request === request);
        if (index !== -1) {
          this.requestQueue.splice(index, 1);
          reject(new Error('Queued request timed out'));
        }
      }, this.config.timeout * 2); // Longer timeout for queued requests
    });
  }

  /**
   * Process queued requests
   */
  async processQueue() {
    while (this.requestQueue.length > 0 && this.activeRequests.size < this.config.maxConcurrentRequests) {
      const queuedItem = this.requestQueue.shift();

      try {
        const result = await this.processRequest(queuedItem.request);
        queuedItem.resolve(result);
      } catch (error) {
        queuedItem.reject(error);
      }
    }
  }

  /**
   * Analyze requirements document
   */
  async analyzeRequirements(documentContent, options = {}) {
    return await this.processRequest({
      type: 'requirements-analysis',
      content: documentContent,
      options: {
        includeMetrics: true,
        includeSuggestions: true,
        validateStructure: true,
        ...options
      }
    });
  }

  /**
   * Analyze capability document
   */
  async analyzeCapability(documentContent, options = {}) {
    return await this.processRequest({
      type: 'capability-analysis',
      content: documentContent,
      options: {
        includeEnablers: true,
        validateDependencies: true,
        includeMetrics: true,
        ...options
      }
    });
  }

  /**
   * Generate suggestions for improvement
   */
  async generateSuggestions(analysisResult, context = {}) {
    return await this.processRequest({
      type: 'suggestions',
      analysisResult,
      context: {
        documentType: context.documentType || 'unknown',
        currentPhase: context.currentPhase || 'development',
        priority: context.priority || 'medium',
        ...context
      }
    });
  }

  /**
   * Process smart analysis
   */
  async processSmartAnalysis(input) {
    const analysisRequest = {
      type: 'smart-analysis',
      input,
      analysis: {
        structuralAnalysis: true,
        contentAnalysis: true,
        qualityAnalysis: true,
        complianceCheck: true
      }
    };

    return await this.processRequest(analysisRequest);
  }

  /**
   * PreCog Market Intelligence Methods
   */
  async performMarketPrecognition(market, timeframe = 90, options = {}) {
    return await this.processRequest({
      type: 'market-precognition',
      market,
      timeframe,
      analysisDepth: options.depth || 'comprehensive',
      ...options
    });
  }

  async analyzeMarketTrends(market, timeframe = 90) {
    return await this.processRequest({
      type: 'prevision-analysis',
      market,
      timeframe
    });
  }

  async gatherCompetitiveIntelligence(market, depth = 'standard') {
    return await this.processRequest({
      type: 'oracle-intelligence',
      market,
      depth
    });
  }

  async detectMarketRisks(market, sensitivity = 'high') {
    return await this.processRequest({
      type: 'precrime-detection',
      market,
      sensitivity
    });
  }

  async calculateSuccessProbability(market, timeframe = 90, factors = []) {
    return await this.processRequest({
      type: 'future-sight',
      market,
      timeframe,
      factors
    });
  }

  async findContrarianOpportunities(market, riskTolerance = 'medium') {
    return await this.processRequest({
      type: 'minority-report',
      market,
      riskTolerance
    });
  }

  async performVisionChamberAnalysis(market, analysisType = 'comprehensive') {
    return await this.processRequest({
      type: 'vision-chamber-analysis',
      market,
      analysisType
    });
  }

  /**
   * Compliance Engine Methods
   */
  async checkCompliance(document, context = {}) {
    return await this.processRequest({
      type: 'compliance-check',
      document,
      context
    });
  }

  async bulkComplianceCheck(documents, context = {}) {
    return await this.processRequest({
      type: 'bulk-compliance-check',
      documents,
      context
    });
  }

  async detectRegulations(document, context = {}) {
    return await this.processRequest({
      type: 'regulation-detection',
      document,
      context
    });
  }

  async generateComplianceReport(scope = 'all', options = {}) {
    return await this.processRequest({
      type: 'compliance-report',
      scope,
      options
    });
  }

  async getAuditTrail(filters = {}) {
    return await this.processRequest({
      type: 'audit-trail',
      filters
    });
  }

  /**
   * Update service metrics
   */
  updateMetrics(serviceName, responseTime, success) {
    // Update global metrics
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    this.metrics.responseTimes.push(responseTime);

    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-100);
    }

    this.metrics.averageResponseTime =
      this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
      this.metrics.responseTimes.length;

    // Update service-specific metrics
    if (serviceName && this.services.has(serviceName)) {
      const service = this.services.get(serviceName);
      service.metrics.requests++;

      if (success) {
        service.metrics.successes++;
      } else {
        service.metrics.failures++;
      }

      // Update service average response time
      const serviceResponseTimes = service.metrics.responseTimes || [];
      serviceResponseTimes.push(responseTime);

      if (serviceResponseTimes.length > 50) {
        serviceResponseTimes.splice(0, serviceResponseTimes.length - 50);
      }

      service.metrics.responseTimes = serviceResponseTimes;
      service.metrics.averageResponseTime =
        serviceResponseTimes.reduce((sum, time) => sum + time, 0) / serviceResponseTimes.length;
    }
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `ai_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable AI service
   */
  enableService(serviceName) {
    const service = this.services.get(serviceName);
    if (service) {
      service.isEnabled = true;
      this.emit('service-enabled', { serviceName });
      return true;
    }
    return false;
  }

  /**
   * Disable AI service
   */
  disableService(serviceName) {
    const service = this.services.get(serviceName);
    if (service) {
      service.isEnabled = false;
      this.emit('service-disabled', { serviceName });
      return true;
    }
    return false;
  }

  /**
   * Get service status
   */
  getServiceStatus(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return null;
    }

    return {
      name: serviceName,
      isEnabled: service.isEnabled,
      metrics: service.metrics,
      registeredAt: service.registeredAt,
      isHealthy: service.instance.isHealthy ? service.instance.isHealthy() : true
    };
  }

  /**
   * List all services
   */
  listServices() {
    return Array.from(this.services.entries()).map(([name, service]) => ({
      name,
      isEnabled: service.isEnabled,
      metrics: service.metrics,
      registeredAt: service.registeredAt
    }));
  }

  /**
   * Get manager metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      successRate: this.metrics.totalRequests > 0 ?
        (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 : 0,
      services: this.listServices()
    };
  }

  /**
   * Health check for all services
   */
  async healthCheck() {
    const results = {};

    for (const [name, service] of this.services) {
      try {
        if (service.instance.healthCheck) {
          results[name] = await service.instance.healthCheck();
        } else {
          results[name] = { healthy: true, message: 'No health check available' };
        }
      } catch (error) {
        results[name] = { healthy: false, error: error.message };
      }
    }

    return results;
  }
}

/**
 * Claude AI Service Implementation
 */
class ClaudeAIService {
  constructor(config = {}) {
    this.config = config;
    this.name = 'Claude AI Service';
  }

  async process(request) {
    // Simulate Claude AI processing
    await this.sleep(100 + Math.random() * 200);

    return {
      type: request.type,
      response: `Claude AI processed: ${request.type}`,
      confidence: 0.85 + Math.random() * 0.15,
      metadata: {
        model: 'claude-3',
        processingTime: Date.now(),
        tokens: Math.floor(Math.random() * 1000) + 100
      }
    };
  }

  async healthCheck() {
    return { healthy: true, service: 'claude', timestamp: new Date().toISOString() };
  }

  isHealthy() {
    return true;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Analysis AI Service Implementation
 */
class AnalysisAIService {
  constructor(config = {}) {
    this.config = config;
    this.name = 'Analysis AI Service';
  }

  async process(request) {
    await this.sleep(150 + Math.random() * 300);

    const analysisResult = {
      type: request.type,
      structuralAnalysis: {
        completeness: Math.floor(Math.random() * 30) + 70,
        clarity: Math.floor(Math.random() * 30) + 70,
        consistency: Math.floor(Math.random() * 30) + 70
      },
      contentAnalysis: {
        qualityScore: Math.floor(Math.random() * 30) + 70,
        readabilityScore: Math.floor(Math.random() * 30) + 70,
        technicalAccuracy: Math.floor(Math.random() * 30) + 70
      },
      issues: [],
      warnings: [],
      recommendations: []
    };

    // Generate random issues/warnings
    if (Math.random() > 0.7) {
      analysisResult.issues.push({
        type: 'missing-requirement',
        severity: 'medium',
        description: 'Some functional requirements may be missing'
      });
    }

    if (Math.random() > 0.8) {
      analysisResult.warnings.push({
        type: 'clarity',
        description: 'Some sections could be more clearly defined'
      });
    }

    return analysisResult;
  }

  async healthCheck() {
    return { healthy: true, service: 'analysis', timestamp: new Date().toISOString() };
  }

  isHealthy() {
    return true;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Suggestions AI Service Implementation
 */
class SuggestionsAIService {
  constructor(config = {}) {
    this.config = config;
    this.name = 'Suggestions AI Service';
  }

  async process(request) {
    await this.sleep(200 + Math.random() * 400);

    const suggestions = [
      {
        type: 'improvement',
        category: 'structure',
        priority: 'high',
        suggestion: 'Consider adding more detailed implementation steps',
        impact: 'Improves implementability and reduces ambiguity'
      },
      {
        type: 'enhancement',
        category: 'content',
        priority: 'medium',
        suggestion: 'Add success criteria for better validation',
        impact: 'Enables better testing and validation'
      },
      {
        type: 'optimization',
        category: 'process',
        priority: 'low',
        suggestion: 'Consider adding approval checkpoints',
        impact: 'Improves quality control and stakeholder alignment'
      }
    ];

    return {
      type: request.type,
      suggestions: suggestions.slice(0, Math.floor(Math.random() * 3) + 1),
      confidence: 0.80 + Math.random() * 0.15,
      metadata: {
        generatedAt: new Date().toISOString(),
        context: request.context
      }
    };
  }

  async healthCheck() {
    return { healthy: true, service: 'suggestions', timestamp: new Date().toISOString() };
  }

  isHealthy() {
    return true;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = {
  AIServiceManager,
  ClaudeAIService,
  AnalysisAIService,
  SuggestionsAIService
};