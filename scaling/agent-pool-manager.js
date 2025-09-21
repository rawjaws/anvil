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
const { Worker } = require('worker_threads');
const path = require('path');

/**
 * Agent Pool Manager
 * Manages horizontal scaling of agent instances with load balancing and auto-scaling
 */
class AgentPoolManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxAgents: 100,
      minAgents: 10,
      poolSize: 25,
      scaleUpThreshold: 80,
      scaleDownThreshold: 20,
      scaleUpStep: 10,
      scaleDownStep: 5,
      healthCheckInterval: 30000,
      maxRetries: 3,
      ...config
    };

    this.pools = new Map();
    this.activeAgents = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      utilization: 0
    };

    this.scaling = {
      lastScaleUp: 0,
      lastScaleDown: 0,
      cooldownPeriod: 60000 // 1 minute
    };

    this.healthCheckTimer = null;
    this.metricsTimer = null;
  }

  /**
   * Initialize the agent pool manager
   */
  async initialize() {
    console.log('[POOL_MANAGER] Initializing agent pools...');

    try {
      // Create initial pools for different agent types
      const agentTypes = ['requirements-analyzer', 'design-architect', 'code-generator', 'test-automator'];

      for (const agentType of agentTypes) {
        await this.createPool(agentType, Math.ceil(this.config.minAgents / agentTypes.length));
      }

      // Start health monitoring
      this.startHealthChecks();
      this.startMetricsCollection();

      console.log(`[POOL_MANAGER] Initialized with ${this.getTotalAgents()} agents across ${this.pools.size} pools`);
      this.emit('initialized', {
        pools: this.pools.size,
        totalAgents: this.getTotalAgents()
      });

    } catch (error) {
      console.error('[POOL_MANAGER] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new agent pool for a specific agent type
   */
  async createPool(agentType, initialSize = this.config.poolSize) {
    if (this.pools.has(agentType)) {
      throw new Error(`Pool for agent type ${agentType} already exists`);
    }

    const pool = {
      type: agentType,
      agents: new Map(),
      queue: [],
      activeJobs: 0,
      maxConcurrency: Math.min(initialSize, this.config.poolSize),
      metrics: {
        processed: 0,
        errors: 0,
        avgResponseTime: 0,
        utilization: 0
      },
      lastActivity: Date.now()
    };

    // Create initial agents
    for (let i = 0; i < initialSize; i++) {
      await this.createAgent(agentType, pool);
    }

    this.pools.set(agentType, pool);
    console.log(`[POOL_MANAGER] Created pool for ${agentType} with ${initialSize} agents`);

    return pool;
  }

  /**
   * Create a new agent instance
   */
  async createAgent(agentType, pool) {
    const agentId = `${agentType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const agent = {
        id: agentId,
        type: agentType,
        status: 'idle',
        worker: null,
        currentJob: null,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        totalJobs: 0,
        errors: 0,
        responseTimeSum: 0
      };

      // Create worker thread for the agent
      agent.worker = new Worker(path.join(__dirname, 'agent-worker.js'), {
        workerData: { agentType, agentId, config: this.config }
      });

      // Set up worker event handlers
      agent.worker.on('message', (message) => {
        this.handleWorkerMessage(agentId, message);
      });

      agent.worker.on('error', (error) => {
        console.error(`[POOL_MANAGER] Worker error for agent ${agentId}:`, error);
        this.handleAgentError(agentId, error);
      });

      agent.worker.on('exit', (code) => {
        if (code !== 0) {
          console.warn(`[POOL_MANAGER] Worker for agent ${agentId} exited with code ${code}`);
          this.handleAgentExit(agentId, code);
        }
      });

      pool.agents.set(agentId, agent);
      this.activeAgents.set(agentId, agent);

      console.log(`[POOL_MANAGER] Created agent ${agentId} of type ${agentType}`);
      return agent;

    } catch (error) {
      console.error(`[POOL_MANAGER] Failed to create agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Route a job to the best available agent
   */
  async routeJob(job) {
    const { agentType, priority = 'normal' } = job;

    // Get pool for the required agent type
    const pool = this.pools.get(agentType);
    if (!pool) {
      throw new Error(`No pool available for agent type: ${agentType}`);
    }

    // Find available agent or queue the job
    const agent = this.findAvailableAgent(pool);

    if (agent) {
      return await this.executeJob(agent, job);
    } else {
      // Queue the job if no agents available
      job.queuedAt = Date.now();

      // Insert based on priority
      if (priority === 'high') {
        pool.queue.unshift(job);
      } else {
        pool.queue.push(job);
      }

      console.log(`[POOL_MANAGER] Job queued for ${agentType}, queue depth: ${pool.queue.length}`);

      // Check if we need to scale up
      await this.checkScaling(pool);

      return {
        status: 'queued',
        queuePosition: pool.queue.length,
        estimatedWaitTime: this.estimateWaitTime(pool)
      };
    }
  }

  /**
   * Find an available agent in the pool
   */
  findAvailableAgent(pool) {
    // First, try to find a completely idle agent
    for (const [agentId, agent] of pool.agents) {
      if (agent.status === 'idle') {
        return agent;
      }
    }

    // If no idle agents, return null (job will be queued)
    return null;
  }

  /**
   * Execute a job on a specific agent
   */
  async executeJob(agent, job) {
    const startTime = Date.now();

    try {
      agent.status = 'busy';
      agent.currentJob = job;
      agent.lastUsed = startTime;

      // Update pool metrics
      const pool = this.pools.get(agent.type);
      pool.activeJobs++;
      pool.lastActivity = startTime;

      // Send job to worker
      agent.worker.postMessage({
        type: 'execute',
        job: {
          ...job,
          startTime,
          agentId: agent.id
        }
      });

      // Return promise that resolves when job completes
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Job timeout after ${job.timeout || 60000}ms`));
        }, job.timeout || 60000);

        // Store resolve/reject for later use
        agent.jobResolvers = { resolve, reject, timeout };
      });

    } catch (error) {
      agent.status = 'idle';
      agent.currentJob = null;

      const pool = this.pools.get(agent.type);
      pool.activeJobs--;

      throw error;
    }
  }

  /**
   * Handle messages from worker threads
   */
  handleWorkerMessage(agentId, message) {
    const agent = this.activeAgents.get(agentId);
    if (!agent) return;

    const pool = this.pools.get(agent.type);

    switch (message.type) {
      case 'job_complete':
        this.handleJobComplete(agent, pool, message);
        break;

      case 'job_error':
        this.handleJobError(agent, pool, message);
        break;

      case 'health_check':
        agent.lastHealthCheck = Date.now();
        break;

      case 'metrics':
        this.updateAgentMetrics(agent, message.data);
        break;
    }
  }

  /**
   * Handle job completion
   */
  handleJobComplete(agent, pool, message) {
    const endTime = Date.now();
    const duration = endTime - agent.currentJob.startTime;

    // Update agent metrics
    agent.totalJobs++;
    agent.responseTimeSum += duration;
    agent.status = 'idle';
    agent.currentJob = null;

    // Update pool metrics
    pool.activeJobs--;
    pool.metrics.processed++;
    pool.metrics.avgResponseTime = (pool.metrics.avgResponseTime + duration) / 2;

    // Clear timeout and resolve promise
    if (agent.jobResolvers) {
      clearTimeout(agent.jobResolvers.timeout);
      agent.jobResolvers.resolve(message.result);
      delete agent.jobResolvers;
    }

    // Process queued jobs
    this.processQueue(pool);

    console.log(`[POOL_MANAGER] Job completed by agent ${agent.id} in ${duration}ms`);
  }

  /**
   * Handle job errors
   */
  handleJobError(agent, pool, message) {
    agent.errors++;
    agent.status = 'idle';
    agent.currentJob = null;

    pool.activeJobs--;
    pool.metrics.errors++;

    // Clear timeout and reject promise
    if (agent.jobResolvers) {
      clearTimeout(agent.jobResolvers.timeout);
      agent.jobResolvers.reject(new Error(message.error));
      delete agent.jobResolvers;
    }

    // Process queued jobs
    this.processQueue(pool);

    console.error(`[POOL_MANAGER] Job failed on agent ${agent.id}:`, message.error);
  }

  /**
   * Process queued jobs for a pool
   */
  async processQueue(pool) {
    if (pool.queue.length === 0) return;

    const agent = this.findAvailableAgent(pool);
    if (!agent) return;

    const job = pool.queue.shift();
    job.queueTime = Date.now() - job.queuedAt;

    try {
      await this.executeJob(agent, job);
    } catch (error) {
      console.error(`[POOL_MANAGER] Failed to execute queued job:`, error);
    }
  }

  /**
   * Check if scaling is needed
   */
  async checkScaling(pool) {
    const now = Date.now();
    const utilization = this.calculateUtilization(pool);

    // Scale up if utilization is high and we haven't scaled recently
    if (utilization > this.config.scaleUpThreshold &&
        now - this.scaling.lastScaleUp > this.scaling.cooldownPeriod &&
        this.getTotalAgents() < this.config.maxAgents) {

      await this.scaleUp(pool);
      this.scaling.lastScaleUp = now;
    }

    // Scale down if utilization is low and we haven't scaled recently
    else if (utilization < this.config.scaleDownThreshold &&
             now - this.scaling.lastScaleDown > this.scaling.cooldownPeriod &&
             pool.agents.size > 1) {

      await this.scaleDown(pool);
      this.scaling.lastScaleDown = now;
    }
  }

  /**
   * Scale up a pool by adding more agents
   */
  async scaleUp(pool) {
    const addCount = Math.min(this.config.scaleUpStep, this.config.maxAgents - this.getTotalAgents());

    console.log(`[POOL_MANAGER] Scaling up ${pool.type} pool by ${addCount} agents`);

    for (let i = 0; i < addCount; i++) {
      try {
        await this.createAgent(pool.type, pool);
      } catch (error) {
        console.error(`[POOL_MANAGER] Failed to create agent during scale up:`, error);
        break;
      }
    }

    this.emit('scaled_up', {
      poolType: pool.type,
      addedAgents: addCount,
      totalAgents: pool.agents.size
    });
  }

  /**
   * Scale down a pool by removing idle agents
   */
  async scaleDown(pool) {
    const removeCount = Math.min(this.config.scaleDownStep, pool.agents.size - 1);
    let removed = 0;

    console.log(`[POOL_MANAGER] Scaling down ${pool.type} pool by up to ${removeCount} agents`);

    for (const [agentId, agent] of pool.agents) {
      if (removed >= removeCount) break;

      if (agent.status === 'idle' && Date.now() - agent.lastUsed > 300000) { // 5 minutes idle
        await this.removeAgent(agentId, pool);
        removed++;
      }
    }

    if (removed > 0) {
      this.emit('scaled_down', {
        poolType: pool.type,
        removedAgents: removed,
        totalAgents: pool.agents.size
      });
    }
  }

  /**
   * Remove an agent from the pool
   */
  async removeAgent(agentId, pool) {
    const agent = pool.agents.get(agentId);
    if (!agent) return;

    try {
      // Terminate the worker
      await agent.worker.terminate();

      // Remove from pool and active agents
      pool.agents.delete(agentId);
      this.activeAgents.delete(agentId);

      console.log(`[POOL_MANAGER] Removed agent ${agentId} from ${pool.type} pool`);
    } catch (error) {
      console.error(`[POOL_MANAGER] Error removing agent ${agentId}:`, error);
    }
  }

  /**
   * Calculate utilization for a pool
   */
  calculateUtilization(pool) {
    if (pool.agents.size === 0) return 0;
    return (pool.activeJobs / pool.agents.size) * 100;
  }

  /**
   * Estimate wait time for queued jobs
   */
  estimateWaitTime(pool) {
    if (pool.queue.length === 0) return 0;

    const avgResponseTime = pool.metrics.avgResponseTime || 30000; // Default 30 seconds
    const queuePosition = pool.queue.length;
    const availableAgents = pool.agents.size - pool.activeJobs;

    if (availableAgents > 0) return 0;

    return Math.ceil((queuePosition / pool.agents.size) * avgResponseTime);
  }

  /**
   * Get total number of agents across all pools
   */
  getTotalAgents() {
    let total = 0;
    for (const pool of this.pools.values()) {
      total += pool.agents.size;
    }
    return total;
  }

  /**
   * Start health checks for all agents
   */
  startHealthChecks() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on all agents
   */
  async performHealthChecks() {
    const now = Date.now();
    const unhealthyAgents = [];

    for (const [agentId, agent] of this.activeAgents) {
      // Check if agent is responsive
      if (now - agent.lastHealthCheck > this.config.healthCheckInterval * 2) {
        unhealthyAgents.push(agentId);
      }
    }

    // Remove unhealthy agents
    for (const agentId of unhealthyAgents) {
      const agent = this.activeAgents.get(agentId);
      const pool = this.pools.get(agent.type);

      console.warn(`[POOL_MANAGER] Removing unhealthy agent ${agentId}`);
      await this.removeAgent(agentId, pool);

      // Create replacement agent
      try {
        await this.createAgent(agent.type, pool);
      } catch (error) {
        console.error(`[POOL_MANAGER] Failed to create replacement agent:`, error);
      }
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, 60000); // Update every minute
  }

  /**
   * Update overall metrics
   */
  updateMetrics() {
    let totalProcessed = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    let totalActiveJobs = 0;
    let totalAgents = 0;

    for (const pool of this.pools.values()) {
      totalProcessed += pool.metrics.processed;
      totalErrors += pool.metrics.errors;
      totalResponseTime += pool.metrics.avgResponseTime;
      totalActiveJobs += pool.activeJobs;
      totalAgents += pool.agents.size;
    }

    this.metrics = {
      totalRequests: totalProcessed + totalErrors,
      successfulRequests: totalProcessed,
      failedRequests: totalErrors,
      avgResponseTime: totalResponseTime / this.pools.size,
      utilization: totalAgents > 0 ? (totalActiveJobs / totalAgents) * 100 : 0
    };

    this.emit('metrics_updated', this.metrics);
  }

  /**
   * Get current status and metrics
   */
  getStatus() {
    const poolStats = [];

    for (const [type, pool] of this.pools) {
      poolStats.push({
        type,
        agents: pool.agents.size,
        activeJobs: pool.activeJobs,
        queueLength: pool.queue.length,
        utilization: this.calculateUtilization(pool),
        metrics: pool.metrics
      });
    }

    return {
      totalAgents: this.getTotalAgents(),
      totalPools: this.pools.size,
      overallMetrics: this.metrics,
      pools: poolStats,
      scaling: this.scaling
    };
  }

  /**
   * Shutdown the pool manager
   */
  async shutdown() {
    console.log('[POOL_MANAGER] Shutting down...');

    // Clear timers
    if (this.healthCheckTimer) clearInterval(this.healthCheckTimer);
    if (this.metricsTimer) clearInterval(this.metricsTimer);

    // Terminate all workers
    const shutdownPromises = [];
    for (const agent of this.activeAgents.values()) {
      shutdownPromises.push(agent.worker.terminate());
    }

    await Promise.all(shutdownPromises);

    // Clear all data structures
    this.pools.clear();
    this.activeAgents.clear();

    this.emit('shutdown');
    console.log('[POOL_MANAGER] Shutdown complete');
  }
}

module.exports = AgentPoolManager;