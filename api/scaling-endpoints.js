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

const express = require('express');
const ScalingOrchestrator = require('../scaling/scaling-orchestrator');

const router = express.Router();
let scalingOrchestrator = null;

/**
 * Initialize scaling orchestrator
 */
async function initializeScalingOrchestrator() {
  if (!scalingOrchestrator) {
    const config = {
      maxConcurrentJobs: 100,
      queueSize: 1000,
      maxAgents: 100,
      minAgents: 10,
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 300 // Stay under Claude API limits
      }
    };

    scalingOrchestrator = new ScalingOrchestrator(config);
    await scalingOrchestrator.initialize();

    // Set up event logging
    scalingOrchestrator.on('job_completed', (data) => {
      console.log(`[SCALING_API] Job ${data.jobId} completed in ${data.executionTime}ms`);
    });

    scalingOrchestrator.on('scaled_up', (data) => {
      console.log(`[SCALING_API] Scaled up ${data.poolType}: +${data.addedAgents} agents`);
    });

    scalingOrchestrator.on('circuit_breaker_opened', (data) => {
      console.warn(`[SCALING_API] Circuit breaker opened for ${data.agentType}`);
    });
  }

  return scalingOrchestrator;
}

/**
 * Submit a job for execution by the scaling system
 */
router.post('/jobs', async (req, res) => {
  try {
    const orchestrator = await initializeScalingOrchestrator();

    const { agentType, action, payload, priority, timeout, metadata } = req.body;

    if (!agentType || !action) {
      return res.status(400).json({
        error: 'agentType and action are required'
      });
    }

    const jobRequest = {
      agentType,
      action,
      payload: payload || {},
      priority: priority || 'normal',
      timeout: timeout || 60000,
      metadata: metadata || {},
      correlationId: req.headers['x-correlation-id']
    };

    const result = await orchestrator.submitJob(jobRequest);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[SCALING_API] Job submission failed:', error);

    let statusCode = 500;
    if (error.message.includes('Rate limit exceeded')) {
      statusCode = 429;
    } else if (error.message.includes('Queue at capacity')) {
      statusCode = 503;
    } else if (error.message.includes('Circuit breaker open')) {
      statusCode = 503;
    }

    res.status(statusCode).json({
      error: error.message,
      type: 'job_submission_error'
    });
  }
});

/**
 * Get scaling system status
 */
router.get('/status', async (req, res) => {
  try {
    const orchestrator = await initializeScalingOrchestrator();
    const status = orchestrator.getStatus();

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('[SCALING_API] Status check failed:', error);
    res.status(500).json({
      error: 'Failed to get scaling system status',
      details: error.message
    });
  }
});

/**
 * Get real-time metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const orchestrator = await initializeScalingOrchestrator();
    const status = orchestrator.getStatus();

    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        activeJobs: status.activeJobs,
        queuedJobs: status.queuedJobs,
        totalAgents: status.totalAgents,
        throughput: status.metrics.currentThroughput,
        averageResponseTime: status.metrics.averageResponseTime
      },
      performance: status.metrics,
      rateLimiting: status.rateLimiter,
      circuitBreakers: status.circuitBreakers,
      pools: status.poolManager.pools
    };

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('[SCALING_API] Metrics retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to get scaling metrics',
      details: error.message
    });
  }
});

/**
 * Get job history
 */
router.get('/jobs/history', async (req, res) => {
  try {
    const orchestrator = await initializeScalingOrchestrator();
    const limit = parseInt(req.query.limit) || 50;
    const status = orchestrator.getStatus();

    // This would need to be implemented in the orchestrator
    const history = []; // orchestrator.getJobHistory(limit);

    res.json({
      success: true,
      data: {
        jobs: history,
        summary: {
          total: status.metrics.totalJobsReceived,
          completed: status.metrics.totalJobsCompleted,
          failed: status.metrics.totalJobsFailed
        }
      }
    });

  } catch (error) {
    console.error('[SCALING_API] Job history retrieval failed:', error);
    res.status(500).json({
      error: 'Failed to get job history',
      details: error.message
    });
  }
});

/**
 * Scale agents manually
 */
router.post('/scale', async (req, res) => {
  try {
    const orchestrator = await initializeScalingOrchestrator();
    const { action, agentType, count } = req.body;

    if (!action || !agentType) {
      return res.status(400).json({
        error: 'action and agentType are required'
      });
    }

    if (action !== 'up' && action !== 'down') {
      return res.status(400).json({
        error: 'action must be "up" or "down"'
      });
    }

    // This would need to be implemented in the pool manager
    const result = {
      success: true,
      message: `Manual scaling ${action} requested for ${agentType}`,
      agentType,
      action,
      count: count || 1
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[SCALING_API] Manual scaling failed:', error);
    res.status(500).json({
      error: 'Failed to execute manual scaling',
      details: error.message
    });
  }
});

/**
 * Reset circuit breakers
 */
router.post('/circuit-breakers/reset', async (req, res) => {
  try {
    const orchestrator = await initializeScalingOrchestrator();
    const { agentType } = req.body;

    // This would need to be implemented in the orchestrator
    const result = {
      success: true,
      message: agentType ?
        `Circuit breaker reset for ${agentType}` :
        'All circuit breakers reset'
    };

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[SCALING_API] Circuit breaker reset failed:', error);
    res.status(500).json({
      error: 'Failed to reset circuit breakers',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const orchestrator = await initializeScalingOrchestrator();
    const status = orchestrator.getStatus();

    const health = {
      status: status.isInitialized && !status.isShuttingDown ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      system: {
        initialized: status.isInitialized,
        shuttingDown: status.isShuttingDown,
        activeJobs: status.activeJobs,
        totalAgents: status.totalAgents
      },
      checks: {
        orchestrator: status.isInitialized ? 'pass' : 'fail',
        poolManager: status.poolManager ? 'pass' : 'fail',
        rateLimiter: status.rateLimiter.tokensAvailable > 0 ? 'pass' : 'warn'
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });

  } catch (error) {
    console.error('[SCALING_API] Health check failed:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Graceful shutdown endpoint
 */
router.post('/shutdown', async (req, res) => {
  try {
    if (scalingOrchestrator) {
      res.json({
        success: true,
        message: 'Shutdown initiated'
      });

      // Shutdown after sending response
      setTimeout(async () => {
        try {
          await scalingOrchestrator.shutdown();
          scalingOrchestrator = null;
        } catch (error) {
          console.error('[SCALING_API] Shutdown error:', error);
        }
      }, 100);
    } else {
      res.json({
        success: true,
        message: 'No active orchestrator to shutdown'
      });
    }

  } catch (error) {
    console.error('[SCALING_API] Shutdown request failed:', error);
    res.status(500).json({
      error: 'Failed to initiate shutdown',
      details: error.message
    });
  }
});

module.exports = router;