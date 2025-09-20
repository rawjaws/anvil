/**
 * AI Workflow API Endpoints
 * REST API endpoints for AI workflow automation backend
 */

const express = require('express');
const router = express.Router();

/**
 * Initialize AI Workflow endpoints with dependencies
 */
function initializeAIWorkflowEndpoints(workflowEngine, scheduler, aiServiceManager, smartAnalysisEngine) {

  // ============================================================================
  // WORKFLOW MANAGEMENT ENDPOINTS
  // ============================================================================

  /**
   * POST /api/ai-workflow/workflows
   * Register a new workflow definition
   */
  router.post('/workflows', async (req, res) => {
    try {
      const { workflowDefinition } = req.body;

      if (!workflowDefinition) {
        return res.status(400).json({
          success: false,
          error: 'Workflow definition is required'
        });
      }

      const workflow = workflowEngine.registerWorkflow(workflowDefinition);

      res.status(201).json({
        success: true,
        workflow,
        message: 'Workflow registered successfully'
      });

    } catch (error) {
      console.error('Error registering workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/workflows
   * List all registered workflows
   */
  router.get('/workflows', async (req, res) => {
    try {
      const workflows = workflowEngine.listWorkflows();

      res.json({
        success: true,
        workflows,
        count: workflows.length
      });

    } catch (error) {
      console.error('Error listing workflows:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/workflows/:workflowId
   * Get workflow status and details
   */
  router.get('/workflows/:workflowId', async (req, res) => {
    try {
      const { workflowId } = req.params;
      const status = workflowEngine.getWorkflowStatus(workflowId);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      res.json({
        success: true,
        workflowId,
        status
      });

    } catch (error) {
      console.error('Error getting workflow status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/ai-workflow/workflows/:workflowId
   * Remove a workflow
   */
  router.delete('/workflows/:workflowId', async (req, res) => {
    try {
      const { workflowId } = req.params;
      const removed = workflowEngine.removeWorkflow(workflowId);

      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found'
        });
      }

      res.json({
        success: true,
        message: 'Workflow removed successfully'
      });

    } catch (error) {
      console.error('Error removing workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // WORKFLOW EXECUTION ENDPOINTS
  // ============================================================================

  /**
   * POST /api/ai-workflow/execute
   * Execute a workflow
   */
  router.post('/execute', async (req, res) => {
    try {
      const { workflowId, input = {}, context = {} } = req.body;

      if (!workflowId) {
        return res.status(400).json({
          success: false,
          error: 'Workflow ID is required'
        });
      }

      // Add request metadata to context
      const executionContext = {
        ...context,
        requestId: req.headers['x-request-id'] || `req_${Date.now()}`,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        timestamp: new Date().toISOString()
      };

      const result = await workflowEngine.executeWorkflow(workflowId, input, executionContext);

      if (result.success) {
        res.json({
          success: true,
          executionId: result.executionId,
          result: result.result,
          duration: result.duration,
          message: 'Workflow executed successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          executionId: result.executionId,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Error executing workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/executions/:executionId
   * Get execution status
   */
  router.get('/executions/:executionId', async (req, res) => {
    try {
      const { executionId } = req.params;
      const execution = workflowEngine.getExecutionStatus(executionId);

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
      }

      res.json({
        success: true,
        execution
      });

    } catch (error) {
      console.error('Error getting execution status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/executions/:executionId/cancel
   * Cancel workflow execution
   */
  router.post('/executions/:executionId/cancel', async (req, res) => {
    try {
      const { executionId } = req.params;
      const cancelled = await workflowEngine.cancelExecution(executionId);

      if (!cancelled) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found or already completed'
        });
      }

      res.json({
        success: true,
        message: 'Execution cancelled successfully'
      });

    } catch (error) {
      console.error('Error cancelling execution:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // SCHEDULING ENDPOINTS
  // ============================================================================

  /**
   * POST /api/ai-workflow/schedule
   * Schedule a workflow
   */
  router.post('/schedule', async (req, res) => {
    try {
      const scheduleConfig = req.body;

      if (!scheduleConfig.id || !scheduleConfig.workflowId || !scheduleConfig.schedule) {
        return res.status(400).json({
          success: false,
          error: 'Schedule must have id, workflowId, and schedule configuration'
        });
      }

      const scheduledJob = scheduler.scheduleWorkflow(scheduleConfig);

      res.status(201).json({
        success: true,
        scheduledJob,
        message: 'Workflow scheduled successfully'
      });

    } catch (error) {
      console.error('Error scheduling workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/schedule
   * List scheduled jobs
   */
  router.get('/schedule', async (req, res) => {
    try {
      const scheduledJobs = scheduler.listScheduledJobs();

      res.json({
        success: true,
        scheduledJobs,
        count: scheduledJobs.length
      });

    } catch (error) {
      console.error('Error listing scheduled jobs:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/schedule/:scheduleId
   * Get scheduled job status
   */
  router.get('/schedule/:scheduleId', async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const job = scheduler.getScheduledJobStatus(scheduleId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Scheduled job not found'
        });
      }

      res.json({
        success: true,
        scheduledJob: job
      });

    } catch (error) {
      console.error('Error getting scheduled job:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/schedule/:scheduleId/pause
   * Pause scheduled job
   */
  router.post('/schedule/:scheduleId/pause', async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const paused = scheduler.pauseScheduledJob(scheduleId);

      if (!paused) {
        return res.status(404).json({
          success: false,
          error: 'Scheduled job not found'
        });
      }

      res.json({
        success: true,
        message: 'Scheduled job paused successfully'
      });

    } catch (error) {
      console.error('Error pausing scheduled job:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/schedule/:scheduleId/resume
   * Resume scheduled job
   */
  router.post('/schedule/:scheduleId/resume', async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const resumed = scheduler.resumeScheduledJob(scheduleId);

      if (!resumed) {
        return res.status(404).json({
          success: false,
          error: 'Scheduled job not found'
        });
      }

      res.json({
        success: true,
        message: 'Scheduled job resumed successfully'
      });

    } catch (error) {
      console.error('Error resuming scheduled job:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/ai-workflow/schedule/:scheduleId
   * Remove scheduled job
   */
  router.delete('/schedule/:scheduleId', async (req, res) => {
    try {
      const { scheduleId } = req.params;
      const removed = scheduler.removeScheduledJob(scheduleId);

      if (!removed) {
        return res.status(404).json({
          success: false,
          error: 'Scheduled job not found'
        });
      }

      res.json({
        success: true,
        message: 'Scheduled job removed successfully'
      });

    } catch (error) {
      console.error('Error removing scheduled job:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/queue
   * Queue workflow for priority execution
   */
  router.post('/queue', async (req, res) => {
    try {
      const queueItem = req.body;

      if (!queueItem.workflowId) {
        return res.status(400).json({
          success: false,
          error: 'Workflow ID is required'
        });
      }

      const queueId = scheduler.queueWorkflow(queueItem);

      res.status(201).json({
        success: true,
        queueId,
        message: 'Workflow queued successfully'
      });

    } catch (error) {
      console.error('Error queuing workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // AI SERVICE ENDPOINTS
  // ============================================================================

  /**
   * POST /api/ai-workflow/ai/analyze
   * Perform AI analysis
   */
  router.post('/ai/analyze', async (req, res) => {
    try {
      const { content, type, options = {} } = req.body;

      if (!content || !type) {
        return res.status(400).json({
          success: false,
          error: 'Content and type are required'
        });
      }

      const result = await aiServiceManager.processRequest({
        type: `${type}-analysis`,
        content,
        options
      });

      res.json(result);

    } catch (error) {
      console.error('Error performing AI analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/ai/smart-analysis
   * Perform comprehensive smart analysis
   */
  router.post('/ai/smart-analysis', async (req, res) => {
    try {
      const { content, type, documentId, options = {} } = req.body;

      if (!content || !type) {
        return res.status(400).json({
          success: false,
          error: 'Content and type are required'
        });
      }

      const input = {
        content,
        type,
        documentId: documentId || `doc_${Date.now()}`,
        ...options
      };

      const result = await smartAnalysisEngine.performSmartAnalysis(input);

      res.json(result);

    } catch (error) {
      console.error('Error performing smart analysis:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/ai/suggestions
   * Generate AI suggestions
   */
  router.post('/ai/suggestions', async (req, res) => {
    try {
      const { analysisResult, context = {} } = req.body;

      if (!analysisResult) {
        return res.status(400).json({
          success: false,
          error: 'Analysis result is required'
        });
      }

      const result = await aiServiceManager.generateSuggestions(analysisResult, context);

      res.json(result);

    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/ai/services
   * List AI services
   */
  router.get('/ai/services', async (req, res) => {
    try {
      const services = aiServiceManager.listServices();

      res.json({
        success: true,
        services
      });

    } catch (error) {
      console.error('Error listing AI services:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/ai/services/:serviceName/health
   * Check AI service health
   */
  router.get('/ai/services/:serviceName/health', async (req, res) => {
    try {
      const { serviceName } = req.params;
      const status = aiServiceManager.getServiceStatus(serviceName);

      if (!status) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.json({
        success: true,
        serviceName,
        status
      });

    } catch (error) {
      console.error('Error checking service health:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/ai/services/:serviceName/enable
   * Enable AI service
   */
  router.post('/ai/services/:serviceName/enable', async (req, res) => {
    try {
      const { serviceName } = req.params;
      const enabled = aiServiceManager.enableService(serviceName);

      if (!enabled) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.json({
        success: true,
        message: `Service ${serviceName} enabled successfully`
      });

    } catch (error) {
      console.error('Error enabling service:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/ai-workflow/ai/services/:serviceName/disable
   * Disable AI service
   */
  router.post('/ai/services/:serviceName/disable', async (req, res) => {
    try {
      const { serviceName } = req.params;
      const disabled = aiServiceManager.disableService(serviceName);

      if (!disabled) {
        return res.status(404).json({
          success: false,
          error: 'Service not found'
        });
      }

      res.json({
        success: true,
        message: `Service ${serviceName} disabled successfully`
      });

    } catch (error) {
      console.error('Error disabling service:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // METRICS AND MONITORING ENDPOINTS
  // ============================================================================

  /**
   * GET /api/ai-workflow/metrics
   * Get comprehensive metrics
   */
  router.get('/metrics', async (req, res) => {
    try {
      const metrics = {
        workflowEngine: workflowEngine.getMetrics(),
        scheduler: scheduler.getMetrics(),
        aiServices: aiServiceManager.getMetrics(),
        smartAnalysis: smartAnalysisEngine.getMetrics(),
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        metrics
      });

    } catch (error) {
      console.error('Error getting metrics:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/health
   * Health check for all components
   */
  router.get('/health', async (req, res) => {
    try {
      const health = {
        workflowEngine: { healthy: true, activeWorkflows: workflowEngine.getMetrics().activeWorkflows },
        scheduler: { healthy: scheduler.isRunning, queueStatus: scheduler.getQueueStatus() },
        aiServices: await aiServiceManager.healthCheck(),
        smartAnalysis: { healthy: true, cacheSize: smartAnalysisEngine.getMetrics().cacheSize },
        timestamp: new Date().toISOString()
      };

      const allHealthy = Object.values(health).every(component =>
        component.healthy !== false && !Object.values(component.aiServices || {}).some(service => !service.healthy)
      );

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        health
      });

    } catch (error) {
      console.error('Error performing health check:', error);
      res.status(503).json({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/ai-workflow/queue/status
   * Get queue status
   */
  router.get('/queue/status', async (req, res) => {
    try {
      const queueStatus = scheduler.getQueueStatus();

      res.json({
        success: true,
        queueStatus
      });

    } catch (error) {
      console.error('Error getting queue status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ============================================================================
  // UTILITY ENDPOINTS
  // ============================================================================

  /**
   * POST /api/ai-workflow/test
   * Test endpoint for development
   */
  router.post('/test', async (req, res) => {
    try {
      const { testType = 'basic', ...testData } = req.body;

      let result;

      switch (testType) {
        case 'workflow':
          result = await testWorkflowExecution(testData);
          break;
        case 'ai-analysis':
          result = await testAIAnalysis(testData);
          break;
        case 'smart-analysis':
          result = await testSmartAnalysis(testData);
          break;
        default:
          result = { message: 'Basic test successful', timestamp: new Date().toISOString() };
      }

      res.json({
        success: true,
        testType,
        result
      });

    } catch (error) {
      console.error('Error running test:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Helper functions for testing
  async function testWorkflowExecution(testData) {
    // Test workflow execution
    return { message: 'Workflow test completed', data: testData };
  }

  async function testAIAnalysis(testData) {
    // Test AI analysis
    return { message: 'AI analysis test completed', data: testData };
  }

  async function testSmartAnalysis(testData) {
    // Test smart analysis
    return { message: 'Smart analysis test completed', data: testData };
  }

  return router;
}

module.exports = initializeAIWorkflowEndpoints;