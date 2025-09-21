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
const AgentPoolManager = require('./agent-pool-manager');

/**
 * Scaling Orchestrator
 * High-level orchestrator for managing 100 concurrent agents with intelligent load balancing
 */
class ScalingOrchestrator extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxConcurrentJobs: 100,
      queueSize: 1000,
      priorityLevels: ['low', 'normal', 'high', 'critical'],
      loadBalancingStrategy: 'least_connections', // round_robin, least_connections, response_time
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 300, // 5 requests per second to stay under Claude limits
        burstSize: 50
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        timeout: 30000,
        resetTimeout: 60000
      },
      ...config
    };

    this.poolManager = new AgentPoolManager(this.config);
    this.globalQueue = new Map(); // Priority-based queues
    this.activeJobs = new Map();
    this.jobHistory = [];
    this.circuits = new Map(); // Circuit breaker states

    this.metrics = {
      totalJobsReceived: 0,
      totalJobsCompleted: 0,
      totalJobsFailed: 0,
      averageResponseTime: 0,
      currentThroughput: 0,
      queueDepth: 0
    };

    this.rateLimiter = {
      tokens: this.config.rateLimiting.requestsPerMinute,
      lastRefill: Date.now(),
      maxTokens: this.config.rateLimiting.requestsPerMinute
    };

    this.isInitialized = false;
    this.isShuttingDown = false;

    this.setupEventHandlers();
  }

  /**
   * Initialize the scaling orchestrator
   */
  async initialize() {
    console.log('[SCALING_ORCHESTRATOR] Initializing...');

    try {
      // Initialize priority queues
      for (const priority of this.config.priorityLevels) {
        this.globalQueue.set(priority, []);
      }

      // Initialize pool manager
      await this.poolManager.initialize();

      // Start background processes
      this.startQueueProcessor();
      this.startMetricsCollection();
      this.startRateLimiterRefresh();

      this.isInitialized = true;
      console.log('[SCALING_ORCHESTRATOR] Initialization complete');

      this.emit('initialized', {
        maxConcurrentJobs: this.config.maxConcurrentJobs,
        totalAgents: this.poolManager.getTotalAgents()
      });

    } catch (error) {
      console.error('[SCALING_ORCHESTRATOR] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Submit a job for execution
   */
  async submitJob(jobRequest) {
    if (!this.isInitialized) {
      throw new Error('Orchestrator not initialized');
    }

    if (this.isShuttingDown) {
      throw new Error('Orchestrator is shutting down');
    }

    // Apply rate limiting
    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Validate job request
    const job = this.validateAndNormalizeJob(jobRequest);

    // Check circuit breaker
    if (!this.checkCircuitBreaker(job.agentType)) {
      throw new Error(`Circuit breaker open for agent type: ${job.agentType}`);
    }

    // Generate unique job ID
    job.id = this.generateJobId();
    job.submittedAt = Date.now();

    this.metrics.totalJobsReceived++;

    try {
      // Try immediate execution if capacity available
      if (this.activeJobs.size < this.config.maxConcurrentJobs) {
        const result = await this.executeJobImmediate(job);
        return result;
      }

      // Queue the job if at capacity
      return this.queueJob(job);

    } catch (error) {
      this.metrics.totalJobsFailed++;
      this.recordCircuitBreakerFailure(job.agentType);
      throw error;
    }
  }

  /**
   * Validate and normalize job request
   */
  validateAndNormalizeJob(jobRequest) {
    if (!jobRequest.agentType) {
      throw new Error('Job must specify agentType');
    }

    if (!jobRequest.action) {
      throw new Error('Job must specify action');
    }

    return {
      agentType: jobRequest.agentType,
      action: jobRequest.action,
      payload: jobRequest.payload || {},
      priority: jobRequest.priority || 'normal',
      timeout: jobRequest.timeout || 60000,
      retryAttempts: jobRequest.retryAttempts || 3,
      metadata: jobRequest.metadata || {},
      correlationId: jobRequest.correlationId
    };
  }

  /**
   * Execute job immediately if capacity available
   */
  async executeJobImmediate(job) {
    const startTime = Date.now();

    try {
      // Add to active jobs
      this.activeJobs.set(job.id, {
        ...job,
        status: 'executing',
        startTime
      });

      // Route to pool manager
      const result = await this.poolManager.routeJob(job);

      // Job completed successfully
      const executionTime = Date.now() - startTime;
      this.metrics.totalJobsCompleted++;
      this.updateAverageResponseTime(executionTime);

      // Remove from active jobs
      const activeJob = this.activeJobs.get(job.id);
      activeJob.status = 'completed';
      activeJob.completedAt = Date.now();
      activeJob.result = result;

      this.moveToHistory(job.id);

      this.emit('job_completed', {
        jobId: job.id,
        executionTime,
        result
      });

      return {
        success: true,
        jobId: job.id,
        result,
        executionTime
      };

    } catch (error) {
      // Job failed
      this.metrics.totalJobsFailed++;
      this.recordCircuitBreakerFailure(job.agentType);

      const activeJob = this.activeJobs.get(job.id);
      if (activeJob) {
        activeJob.status = 'failed';
        activeJob.error = error.message;
        activeJob.completedAt = Date.now();
        this.moveToHistory(job.id);
      }

      this.emit('job_failed', {
        jobId: job.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Queue a job for later execution
   */
  queueJob(job) {
    const priority = job.priority || 'normal';
    const priorityQueue = this.globalQueue.get(priority);

    if (!priorityQueue) {
      throw new Error(`Invalid priority: ${priority}`);
    }

    // Check queue capacity
    const totalQueuedJobs = this.getTotalQueuedJobs();
    if (totalQueuedJobs >= this.config.queueSize) {
      throw new Error('Queue at capacity. Please try again later.');
    }

    job.queuedAt = Date.now();
    priorityQueue.push(job);

    console.log(`[SCALING_ORCHESTRATOR] Job ${job.id} queued with priority ${priority}`);

    return {
      success: true,
      jobId: job.id,
      status: 'queued',
      queuePosition: this.calculateQueuePosition(job),
      estimatedWaitTime: this.estimateWaitTime(job)
    };
  }

  /**
   * Process the global queue continuously
   */
  startQueueProcessor() {
    setInterval(async () => {
      if (this.isShuttingDown) return;

      // Process jobs from highest to lowest priority
      for (const priority of this.config.priorityLevels.reverse()) {
        const queue = this.globalQueue.get(priority);

        while (queue.length > 0 && this.activeJobs.size < this.config.maxConcurrentJobs) {
          const job = queue.shift();

          try {
            await this.executeJobImmediate(job);
          } catch (error) {
            console.error(`[SCALING_ORCHESTRATOR] Failed to execute queued job ${job.id}:`, error);
          }
        }
      }
    }, 1000); // Process every second
  }

  /**
   * Calculate queue position for a job
   */
  calculateQueuePosition(job) {
    let position = 1;
    const jobPriority = job.priority || 'normal';
    const priorityIndex = this.config.priorityLevels.indexOf(jobPriority);

    // Count jobs with higher priority
    for (let i = priorityIndex + 1; i < this.config.priorityLevels.length; i++) {
      const higherPriorityQueue = this.globalQueue.get(this.config.priorityLevels[i]);
      position += higherPriorityQueue.length;
    }

    // Count jobs in same priority queue before this job
    const sameQueue = this.globalQueue.get(jobPriority);
    const jobIndex = sameQueue.findIndex(j => j.id === job.id);
    position += jobIndex;

    return position;
  }

  /**
   * Estimate wait time for a job
   */
  estimateWaitTime(job) {
    const queuePosition = this.calculateQueuePosition(job);
    const avgResponseTime = this.metrics.averageResponseTime || 30000;
    const concurrentCapacity = this.config.maxConcurrentJobs;

    // Estimate based on queue position and current throughput
    return Math.ceil((queuePosition / concurrentCapacity) * avgResponseTime);
  }

  /**
   * Check rate limiting
   */
  checkRateLimit() {
    if (!this.config.rateLimiting.enabled) return true;

    const now = Date.now();

    // Refill tokens based on time elapsed
    const timeElapsed = now - this.rateLimiter.lastRefill;
    const tokensToAdd = Math.floor(timeElapsed / (60000 / this.config.rateLimiting.requestsPerMinute));

    this.rateLimiter.tokens = Math.min(
      this.rateLimiter.maxTokens,
      this.rateLimiter.tokens + tokensToAdd
    );

    if (tokensToAdd > 0) {
      this.rateLimiter.lastRefill = now;
    }

    // Check if we have tokens available
    if (this.rateLimiter.tokens > 0) {
      this.rateLimiter.tokens--;
      return true;
    }

    return false;
  }

  /**
   * Start rate limiter token refresh
   */
  startRateLimiterRefresh() {
    if (!this.config.rateLimiting.enabled) return;

    setInterval(() => {
      this.rateLimiter.tokens = Math.min(
        this.rateLimiter.maxTokens,
        this.rateLimiter.tokens + 1
      );
    }, 60000 / this.config.rateLimiting.requestsPerMinute);
  }

  /**
   * Check circuit breaker status
   */
  checkCircuitBreaker(agentType) {
    if (!this.config.circuitBreaker.enabled) return true;

    const circuit = this.circuits.get(agentType);
    if (!circuit) {
      // Initialize circuit breaker for this agent type
      this.circuits.set(agentType, {
        state: 'closed',
        failures: 0,
        lastFailure: 0,
        nextAttempt: 0
      });
      return true;
    }

    const now = Date.now();

    switch (circuit.state) {
      case 'closed':
        return true;

      case 'open':
        if (now >= circuit.nextAttempt) {
          circuit.state = 'half-open';
          return true;
        }
        return false;

      case 'half-open':
        return true;

      default:
        return true;
    }
  }

  /**
   * Record circuit breaker failure
   */
  recordCircuitBreakerFailure(agentType) {
    if (!this.config.circuitBreaker.enabled) return;

    const circuit = this.circuits.get(agentType) || {
      state: 'closed',
      failures: 0,
      lastFailure: 0,
      nextAttempt: 0
    };

    circuit.failures++;
    circuit.lastFailure = Date.now();

    if (circuit.state === 'half-open') {
      // Failed during half-open, go back to open
      circuit.state = 'open';
      circuit.nextAttempt = Date.now() + this.config.circuitBreaker.resetTimeout;
    } else if (circuit.failures >= this.config.circuitBreaker.failureThreshold) {
      // Too many failures, open the circuit
      circuit.state = 'open';
      circuit.nextAttempt = Date.now() + this.config.circuitBreaker.resetTimeout;
    }

    this.circuits.set(agentType, circuit);

    this.emit('circuit_breaker_opened', {
      agentType,
      failures: circuit.failures,
      state: circuit.state
    });
  }

  /**
   * Record circuit breaker success
   */
  recordCircuitBreakerSuccess(agentType) {
    if (!this.config.circuitBreaker.enabled) return;

    const circuit = this.circuits.get(agentType);
    if (!circuit) return;

    if (circuit.state === 'half-open') {
      // Success during half-open, close the circuit
      circuit.state = 'closed';
      circuit.failures = 0;
      this.circuits.set(agentType, circuit);

      this.emit('circuit_breaker_closed', { agentType });
    }
  }

  /**
   * Generate unique job ID
   */
  generateJobId() {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get total queued jobs across all priorities
   */
  getTotalQueuedJobs() {
    let total = 0;
    for (const queue of this.globalQueue.values()) {
      total += queue.length;
    }
    return total;
  }

  /**
   * Update average response time
   */
  updateAverageResponseTime(newTime) {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = newTime;
    } else {
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime + newTime) / 2;
    }
  }

  /**
   * Move job to history
   */
  moveToHistory(jobId) {
    const job = this.activeJobs.get(jobId);
    if (job) {
      this.jobHistory.push(job);
      this.activeJobs.delete(jobId);

      // Keep only last 1000 jobs in history
      if (this.jobHistory.length > 1000) {
        this.jobHistory.shift();
      }
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      this.updateMetrics();
    }, 10000); // Update every 10 seconds
  }

  /**
   * Update metrics
   */
  updateMetrics() {
    this.metrics.queueDepth = this.getTotalQueuedJobs();
    this.metrics.currentThroughput = this.calculateCurrentThroughput();

    this.emit('metrics_updated', this.metrics);
  }

  /**
   * Calculate current throughput (jobs per second)
   */
  calculateCurrentThroughput() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentJobs = this.jobHistory.filter(job =>
      job.completedAt && job.completedAt > oneMinuteAgo
    );

    return recentJobs.length / 60; // Jobs per second
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isShuttingDown: this.isShuttingDown,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.getTotalQueuedJobs(),
      totalAgents: this.poolManager.getTotalAgents(),
      metrics: this.metrics,
      rateLimiter: {
        tokensAvailable: this.rateLimiter.tokens,
        maxTokens: this.rateLimiter.maxTokens
      },
      circuitBreakers: Array.from(this.circuits.entries()).map(([agentType, circuit]) => ({
        agentType,
        state: circuit.state,
        failures: circuit.failures
      })),
      poolManager: this.poolManager.getStatus()
    };
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.poolManager.on('scaled_up', (data) => {
      this.emit('scaled_up', data);
    });

    this.poolManager.on('scaled_down', (data) => {
      this.emit('scaled_down', data);
    });

    this.poolManager.on('metrics_updated', (metrics) => {
      this.emit('pool_metrics_updated', metrics);
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[SCALING_ORCHESTRATOR] Initiating graceful shutdown...');
    this.isShuttingDown = true;

    try {
      // Stop accepting new jobs
      this.emit('shutdown_initiated');

      // Wait for active jobs to complete (with timeout)
      await this.waitForActiveJobsCompletion(30000);

      // Shutdown pool manager
      await this.poolManager.shutdown();

      this.emit('shutdown_complete');
      console.log('[SCALING_ORCHESTRATOR] Shutdown complete');

    } catch (error) {
      console.error('[SCALING_ORCHESTRATOR] Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Wait for active jobs to complete
   */
  async waitForActiveJobsCompletion(timeout) {
    const startTime = Date.now();

    while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (this.activeJobs.size > 0) {
      console.warn(`[SCALING_ORCHESTRATOR] ${this.activeJobs.size} jobs still active after timeout`);
    }
  }
}

module.exports = ScalingOrchestrator;