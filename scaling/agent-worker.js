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

const { parentPort, workerData } = require('worker_threads');
const path = require('path');

/**
 * Agent Worker Thread
 * Handles individual agent execution in isolated worker threads
 */
class AgentWorker {
  constructor(agentType, agentId, config) {
    this.agentType = agentType;
    this.agentId = agentId;
    this.config = config;
    this.agent = null;
    this.currentJob = null;
    this.metrics = {
      jobsProcessed: 0,
      errors: 0,
      totalExecutionTime: 0
    };

    this.initialize();
  }

  /**
   * Initialize the agent worker
   */
  async initialize() {
    try {
      // Load the appropriate agent class
      const agentModule = this.loadAgentModule(this.agentType);
      this.agent = new agentModule();

      // Set up health check interval
      setInterval(() => {
        this.sendHealthCheck();
      }, 30000);

      this.sendMessage('worker_ready', { agentId: this.agentId, agentType: this.agentType });

    } catch (error) {
      this.sendMessage('worker_error', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Load the agent module based on type
   */
  loadAgentModule(agentType) {
    const moduleMap = {
      'requirements-analyzer': '../agents/requirements/analyzer',
      'design-architect': '../agents/design/architect',
      'code-generator': '../agents/codegen/generator',
      'test-automator': '../agents/testing/test-generator',
      'documentation-generator': '../agents/documentation/doc-generator'
    };

    const modulePath = moduleMap[agentType];
    if (!modulePath) {
      throw new Error(`Unknown agent type: ${agentType}`);
    }

    try {
      return require(path.resolve(__dirname, modulePath));
    } catch (error) {
      // Fallback to a mock agent for testing
      return class MockAgent {
        async analyze(input) {
          await this.simulateWork();
          return { success: true, data: `Analyzed: ${JSON.stringify(input)}` };
        }

        async createDesign(input) {
          await this.simulateWork();
          return { success: true, data: `Design: ${JSON.stringify(input)}` };
        }

        async generate(input) {
          await this.simulateWork();
          return { success: true, data: `Generated: ${JSON.stringify(input)}` };
        }

        async generateTests(input) {
          await this.simulateWork();
          return { success: true, data: `Tests: ${JSON.stringify(input)}` };
        }

        async generateDocs(input) {
          await this.simulateWork();
          return { success: true, data: `Docs: ${JSON.stringify(input)}` };
        }

        async simulateWork() {
          // Simulate processing time between 1-5 seconds
          const processingTime = Math.random() * 4000 + 1000;
          await new Promise(resolve => setTimeout(resolve, processingTime));
        }

        getCapabilities() {
          return ['analyze', 'createDesign', 'generate', 'generateTests', 'generateDocs'];
        }
      };
    }
  }

  /**
   * Execute a job
   */
  async executeJob(job) {
    const startTime = Date.now();
    this.currentJob = job;

    try {
      // Validate job parameters
      if (!job.action || !this.agent[job.action]) {
        throw new Error(`Invalid action: ${job.action} for agent type: ${this.agentType}`);
      }

      // Execute the job with timeout
      const result = await Promise.race([
        this.agent[job.action](job.payload || job.input),
        this.createTimeoutPromise(job.timeout || 60000)
      ]);

      const executionTime = Date.now() - startTime;

      // Update metrics
      this.metrics.jobsProcessed++;
      this.metrics.totalExecutionTime += executionTime;

      this.sendMessage('job_complete', {
        jobId: job.id,
        result,
        executionTime,
        agentId: this.agentId
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.metrics.errors++;

      this.sendMessage('job_error', {
        jobId: job.id,
        error: error.message,
        executionTime,
        agentId: this.agentId
      });

    } finally {
      this.currentJob = null;
    }
  }

  /**
   * Create a timeout promise
   */
  createTimeoutPromise(timeout) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Job timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Send health check
   */
  sendHealthCheck() {
    this.sendMessage('health_check', {
      agentId: this.agentId,
      status: this.currentJob ? 'busy' : 'idle',
      metrics: this.metrics,
      memoryUsage: process.memoryUsage()
    });
  }

  /**
   * Send message to parent process
   */
  sendMessage(type, data) {
    if (parentPort) {
      parentPort.postMessage({
        type,
        agentId: this.agentId,
        timestamp: Date.now(),
        data
      });
    }
  }

  /**
   * Handle graceful shutdown
   */
  async shutdown() {
    // Cancel current job if any
    if (this.currentJob) {
      this.sendMessage('job_cancelled', {
        jobId: this.currentJob.id,
        reason: 'Worker shutdown'
      });
    }

    this.sendMessage('worker_shutdown', { agentId: this.agentId });
  }
}

// Initialize worker
if (workerData) {
  const { agentType, agentId, config } = workerData;
  const worker = new AgentWorker(agentType, agentId, config);

  // Handle messages from parent
  if (parentPort) {
    parentPort.on('message', async (message) => {
      try {
        switch (message.type) {
          case 'execute':
            await worker.executeJob(message.job);
            break;

          case 'shutdown':
            await worker.shutdown();
            process.exit(0);
            break;

          case 'health_check':
            worker.sendHealthCheck();
            break;

          default:
            console.warn(`[WORKER] Unknown message type: ${message.type}`);
        }
      } catch (error) {
        worker.sendMessage('worker_error', { error: error.message });
      }
    });
  }

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    worker.sendMessage('worker_error', { error: error.message, type: 'uncaught_exception' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    worker.sendMessage('worker_error', {
      error: reason.toString(),
      type: 'unhandled_rejection',
      promise: promise.toString()
    });
    process.exit(1);
  });
}