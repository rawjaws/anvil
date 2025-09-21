/*
 * Copyright 2025 Darcy Davidson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const EventEmitter = require('events');
const { BUDGET_SCALING_CONFIG, BUDGET_JOB_STRATEGY } = require('./budget-scaling-config');
const AgentPoolManager = require('./agent-pool-manager');

/**
 * Budget-Optimized Scaling Orchestrator
 * Designed for Claude Max Plan constraints (8-12 agents, $200/month)
 */
class BudgetOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = { ...BUDGET_SCALING_CONFIG, ...config };
    this.isInitialized = false;
    this.isShuttingDown = false;

    // Core components
    this.poolManager = null;
    this.jobQueue = [];
    this.activeJobs = new Map();

    // Metrics and monitoring
    this.metrics = {
      totalJobsReceived: 0,
      totalJobsCompleted: 0,
      totalJobsFailed: 0,
      totalSpend: 0,
      dailySpend: 0,
      currentThroughput: 0,
      averageResponseTime: 0,
      lastSpendReset: Date.now()
    };

    // Rate limiting and cost tracking
    this.rateLimiter = {
      tokens: this.config.rateLimiting.requestsPerMinute,
      lastRefill: Date.now(),
      requestQueue: []
    };

    this.costTracker = {
      hourlySpend: 0,
      dailySpend: 0,
      lastHourReset: Date.now(),
      lastDayReset: Date.now()
    };
  }

  /**
   * Initialize the budget orchestrator
   */
  async initialize() {
    try {
      console.log('[BUDGET_ORCHESTRATOR] Initializing budget-optimized orchestrator...');

      // Initialize agent pool manager with budget constraints
      this.poolManager = new AgentPoolManager({
        ...this.config.agents,
        tokenOptimization: this.config.tokenOptimization
      });

      await this.poolManager.initialize();

      // Start monitoring and maintenance tasks
      this.startRateLimiter();
      this.startCostMonitoring();
      this.startMetricsCollection();
      this.startJobProcessor();

      this.isInitialized = true;
      this.emit('initialized', { timestamp: Date.now() });

      console.log(`[BUDGET_ORCHESTRATOR] Initialized with ${this.config.agents.maxConcurrent} max agents`);

    } catch (error) {
      console.error('[BUDGET_ORCHESTRATOR] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Submit a job for processing
   */
  async submitJob(jobRequest) {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    if (this.isShuttingDown) {
      throw new Error('Orchestrator is shutting down');
    }

    // Check cost limits
    this.checkCostLimits();

    // Enhance job with budget optimizations
    const job = this.enhanceJobForBudget(jobRequest);

    // Check queue capacity
    if (this.jobQueue.length >= this.config.queue.maxSize) {
      throw new Error('Queue at capacity');
    }

    // Add to queue with priority
    this.jobQueue.push(job);
    this.sortJobsByPriority();

    this.metrics.totalJobsReceived++;
    this.emit('job_queued', { jobId: job.id, queueSize: this.jobQueue.length });

    return {
      jobId: job.id,
      queuePosition: this.getJobPosition(job.id),
      estimatedCost: job.estimatedCost,
      selectedModel: job.selectedModel
    };
  }

  /**
   * Enhance job with budget optimizations
   */
  enhanceJobForBudget(jobRequest) {
    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...jobRequest,
      submittedAt: Date.now(),
      attempts: 0
    };

    // Classify job complexity
    job.complexity = BUDGET_JOB_STRATEGY.classify(job);

    // Select optimal model based on complexity and budget
    job.selectedModel = this.selectOptimalModel(job);

    // Estimate tokens and cost
    job.estimatedTokens = BUDGET_JOB_STRATEGY.estimateTokens(job);
    job.estimatedCost = BUDGET_JOB_STRATEGY.predictCost(job, job.selectedModel);

    // Set timeout based on priority
    job.timeout = this.config.queue.timeoutThresholds[job.priority] || 90000;

    return job;
  }

  /**
   * Select optimal model based on complexity and budget constraints
   */
  selectOptimalModel(job) {
    const { models } = this.config.modelSelection;

    // Check if we're over budget - force cheapest model
    if (this.costTracker.hourlySpend > this.config.costControls.hourlySpendLimit * 0.8) {
      return models.simple;
    }

    // Select based on complexity
    switch (job.complexity) {
      case 'simple':
        return models.simple;
      case 'moderate':
        return models.moderate;
      case 'complex':
        return models.complex;
      default:
        return models.moderate;
    }
  }

  /**
   * Process job queue
   */
  async processJob(job) {
    if (!this.canProcessJob()) {
      return false;
    }

    try {
      // Wait for rate limit token
      await this.waitForRateLimit();

      // Mark job as active
      this.activeJobs.set(job.id, { ...job, startedAt: Date.now() });

      // Find available agent
      const agent = await this.poolManager.getAvailableAgent(job.agentType);
      if (!agent) {
        throw new Error('No available agents');
      }

      // Execute job
      const startTime = Date.now();
      const result = await agent.executeJob(job);
      const executionTime = Date.now() - startTime;

      // Track cost
      this.trackJobCost(job);

      // Update metrics
      this.metrics.totalJobsCompleted++;
      this.updateResponseTimeMetrics(executionTime);

      // Clean up
      this.activeJobs.delete(job.id);

      this.emit('job_completed', {
        jobId: job.id,
        result,
        executionTime,
        cost: job.estimatedCost
      });

      return result;

    } catch (error) {
      console.error(`[BUDGET_ORCHESTRATOR] Job ${job.id} failed:`, error);

      this.metrics.totalJobsFailed++;
      this.activeJobs.delete(job.id);

      this.emit('job_failed', {
        jobId: job.id,
        error: error.message,
        attempts: job.attempts
      });

      throw error;
    }
  }

  /**
   * Check if we can process more jobs based on constraints
   */
  canProcessJob() {
    // Check active job limit
    if (this.activeJobs.size >= this.config.agents.maxConcurrent) {
      return false;
    }

    // Check cost limits
    if (this.costTracker.hourlySpend >= this.config.costControls.hourlySpendLimit) {
      return false;
    }

    // Check rate limiting
    if (this.rateLimiter.tokens <= 0) {
      return false;
    }

    return true;
  }

  /**
   * Track job cost and update spending metrics
   */
  trackJobCost(job) {
    const cost = job.estimatedCost || 0;

    this.costTracker.hourlySpend += cost;
    this.costTracker.dailySpend += cost;
    this.metrics.totalSpend += cost;

    // Check for cost alerts
    const dailyPercentage = (this.costTracker.dailySpend / this.config.costControls.dailySpendLimit) * 100;

    if (dailyPercentage >= this.config.costControls.alertThresholds.emergency) {
      this.emit('cost_alert', { level: 'emergency', percentage: dailyPercentage });
      if (this.config.costControls.autoShutdownOnOverspend) {
        this.emergencyShutdown('Cost limit exceeded');
      }
    } else if (dailyPercentage >= this.config.costControls.alertThresholds.critical) {
      this.emit('cost_alert', { level: 'critical', percentage: dailyPercentage });
    } else if (dailyPercentage >= this.config.costControls.alertThresholds.warning) {
      this.emit('cost_alert', { level: 'warning', percentage: dailyPercentage });
    }
  }

  /**
   * Start rate limiting system
   */
  startRateLimiter() {
    setInterval(() => {
      const now = Date.now();
      const timeSinceRefill = now - this.rateLimiter.lastRefill;

      if (timeSinceRefill >= 60000) { // Refill every minute
        this.rateLimiter.tokens = this.config.rateLimiting.requestsPerMinute;
        this.rateLimiter.lastRefill = now;
      }
    }, 1000);
  }

  /**
   * Start cost monitoring
   */
  startCostMonitoring() {
    setInterval(() => {
      const now = Date.now();

      // Reset hourly spend
      if (now - this.costTracker.lastHourReset >= 3600000) {
        this.costTracker.hourlySpend = 0;
        this.costTracker.lastHourReset = now;
      }

      // Reset daily spend
      if (now - this.costTracker.lastDayReset >= 86400000) {
        this.costTracker.dailySpend = 0;
        this.costTracker.lastDayReset = now;
      }
    }, 60000); // Check every minute
  }

  /**
   * Start job processor
   */
  startJobProcessor() {
    setInterval(async () => {
      if (this.jobQueue.length > 0 && this.canProcessJob()) {
        const job = this.jobQueue.shift();
        this.processJob(job).catch(error => {
          console.error('[BUDGET_ORCHESTRATOR] Job processing error:', error);
        });
      }
    }, 1000); // Process every second
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isShuttingDown: this.isShuttingDown,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.jobQueue.length,
      totalAgents: this.poolManager ? this.poolManager.getTotalAgents() : 0,
      metrics: this.metrics,
      costTracker: this.costTracker,
      rateLimiter: {
        tokensAvailable: this.rateLimiter.tokens,
        requestsPerMinute: this.config.rateLimiting.requestsPerMinute
      }
    };
  }

  /**
   * Wait for rate limit token
   */
  async waitForRateLimit() {
    return new Promise((resolve) => {
      const checkToken = () => {
        if (this.rateLimiter.tokens > 0) {
          this.rateLimiter.tokens--;
          resolve();
        } else {
          setTimeout(checkToken, 100);
        }
      };
      checkToken();
    });
  }

  /**
   * Emergency shutdown
   */
  async emergencyShutdown(reason) {
    console.warn(`[BUDGET_ORCHESTRATOR] Emergency shutdown: ${reason}`);
    this.isShuttingDown = true;
    this.emit('emergency_shutdown', { reason, timestamp: Date.now() });

    // Clear job queue
    this.jobQueue = [];

    // Stop accepting new jobs
    setTimeout(() => {
      this.shutdown();
    }, 5000);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[BUDGET_ORCHESTRATOR] Initiating graceful shutdown...');
    this.isShuttingDown = true;

    // Wait for active jobs to complete (max 30 seconds)
    const maxWait = 30000;
    const startTime = Date.now();

    while (this.activeJobs.size > 0 && (Date.now() - startTime) < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.poolManager) {
      await this.poolManager.shutdown();
    }

    this.emit('shutdown_complete', { timestamp: Date.now() });
    console.log('[BUDGET_ORCHESTRATOR] Shutdown complete');
  }

  // Helper methods
  sortJobsByPriority() {
    const priority = { high: 3, normal: 2, low: 1 };
    this.jobQueue.sort((a, b) => {
      return (priority[b.priority] || 2) - (priority[a.priority] || 2);
    });
  }

  getJobPosition(jobId) {
    return this.jobQueue.findIndex(job => job.id === jobId) + 1;
  }

  updateResponseTimeMetrics(executionTime) {
    // Simple moving average
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * 0.9) + (executionTime * 0.1);
  }

  checkCostLimits() {
    if (this.costTracker.dailySpend >= this.config.costControls.dailySpendLimit) {
      throw new Error('Daily spend limit exceeded');
    }

    if (this.costTracker.hourlySpend >= this.config.costControls.hourlySpendLimit) {
      throw new Error('Hourly spend limit exceeded');
    }
  }

  startMetricsCollection() {
    setInterval(() => {
      const completedInLastMinute = this.metrics.totalJobsCompleted; // Simplified
      this.metrics.currentThroughput = completedInLastMinute / 60;
    }, 60000);
  }
}

module.exports = BudgetOrchestrator;