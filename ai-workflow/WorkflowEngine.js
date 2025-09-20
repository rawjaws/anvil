/**
 * AI Workflow Engine
 * Core engine for managing AI-powered workflow automation
 */

const EventEmitter = require('events');

class WorkflowEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    this.name = 'AI Workflow Engine';
    this.workflows = new Map();
    this.activeExecutions = new Map();
    this.config = {
      maxConcurrentWorkflows: config.maxConcurrentWorkflows || 10,
      workflowTimeout: config.workflowTimeout || 300000, // 5 minutes
      retryAttempts: config.retryAttempts || 3,
      ...config
    };

    // Performance tracking
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      executionTimes: []
    };

    this.initialize();
  }

  /**
   * Initialize the workflow engine
   */
  initialize() {
    this.emit('engine-initialized', {
      timestamp: new Date().toISOString(),
      config: this.config
    });
  }

  /**
   * Register a new workflow definition
   */
  registerWorkflow(workflowDefinition) {
    const { id, name, steps, triggers, config = {} } = workflowDefinition;

    if (!id || !name || !steps) {
      throw new Error('Workflow must have id, name, and steps');
    }

    const workflow = {
      id,
      name,
      steps: this.validateSteps(steps),
      triggers: triggers || [],
      config: {
        timeout: config.timeout || this.config.workflowTimeout,
        retryAttempts: config.retryAttempts || this.config.retryAttempts,
        autoRetry: config.autoRetry !== false,
        ...config
      },
      metadata: {
        registeredAt: new Date().toISOString(),
        version: workflowDefinition.version || '1.0.0',
        description: workflowDefinition.description || ''
      }
    };

    this.workflows.set(id, workflow);

    this.emit('workflow-registered', {
      workflowId: id,
      workflow: workflow
    });

    return workflow;
  }

  /**
   * Validate workflow steps
   */
  validateSteps(steps) {
    if (!Array.isArray(steps) || steps.length === 0) {
      throw new Error('Workflow must have at least one step');
    }

    return steps.map((step, index) => {
      if (!step.id || !step.type) {
        throw new Error(`Step ${index + 1} must have id and type`);
      }

      return {
        id: step.id,
        type: step.type,
        name: step.name || step.id,
        config: step.config || {},
        condition: step.condition || null,
        onSuccess: step.onSuccess || null,
        onFailure: step.onFailure || null,
        timeout: step.timeout || 60000, // 1 minute default
        retryConfig: step.retryConfig || null
      };
    });
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflowId, input = {}, context = {}) {
    const executionId = this.generateExecutionId();
    const startTime = Date.now();

    try {
      // Check if workflow exists
      const workflow = this.workflows.get(workflowId);
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Check concurrent execution limit
      if (this.activeExecutions.size >= this.config.maxConcurrentWorkflows) {
        throw new Error('Maximum concurrent workflows reached');
      }

      // Create execution context
      const execution = {
        id: executionId,
        workflowId,
        status: 'running',
        startTime,
        input,
        context: {
          userId: context.userId || 'system',
          sessionId: context.sessionId || null,
          priority: context.priority || 'normal',
          ...context
        },
        steps: [],
        currentStepIndex: 0,
        result: null,
        error: null
      };

      this.activeExecutions.set(executionId, execution);
      this.metrics.totalExecutions++;

      this.emit('workflow-started', {
        executionId,
        workflowId,
        input,
        context: execution.context
      });

      // Execute workflow steps
      const result = await this.executeSteps(workflow, execution);

      // Mark as completed
      execution.status = 'completed';
      execution.result = result;
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;

      // Update metrics
      this.updateMetrics(execution);

      this.emit('workflow-completed', {
        executionId,
        workflowId,
        result,
        duration: execution.duration
      });

      // Clean up active execution
      this.activeExecutions.delete(executionId);

      return {
        success: true,
        executionId,
        result,
        duration: execution.duration
      };

    } catch (error) {
      // Handle execution failure
      const execution = this.activeExecutions.get(executionId);
      if (execution) {
        execution.status = 'failed';
        execution.error = error.message;
        execution.endTime = Date.now();
        execution.duration = execution.endTime - execution.startTime;

        this.metrics.failedExecutions++;
        this.activeExecutions.delete(executionId);
      }

      this.emit('workflow-failed', {
        executionId,
        workflowId,
        error: error.message
      });

      return {
        success: false,
        executionId,
        error: error.message
      };
    }
  }

  /**
   * Execute workflow steps sequentially
   */
  async executeSteps(workflow, execution) {
    let stepResults = {};
    let currentData = execution.input;

    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      execution.currentStepIndex = i;

      try {
        // Check step condition
        if (step.condition && !this.evaluateCondition(step.condition, currentData, stepResults)) {
          this.emit('step-skipped', {
            executionId: execution.id,
            stepId: step.id,
            reason: 'condition not met'
          });
          continue;
        }

        this.emit('step-started', {
          executionId: execution.id,
          stepId: step.id,
          stepType: step.type
        });

        // Execute step with timeout
        const stepResult = await this.executeStepWithTimeout(step, currentData, execution.context);

        stepResults[step.id] = stepResult;
        currentData = { ...currentData, ...stepResult };

        execution.steps.push({
          stepId: step.id,
          status: 'completed',
          result: stepResult,
          timestamp: new Date().toISOString()
        });

        this.emit('step-completed', {
          executionId: execution.id,
          stepId: step.id,
          result: stepResult
        });

      } catch (error) {
        execution.steps.push({
          stepId: step.id,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        });

        this.emit('step-failed', {
          executionId: execution.id,
          stepId: step.id,
          error: error.message
        });

        // Handle step failure
        if (step.onFailure) {
          await this.handleStepFailure(step, error, execution);
        } else {
          throw error;
        }
      }
    }

    return currentData;
  }

  /**
   * Execute a single step with timeout
   */
  async executeStepWithTimeout(step, data, context) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Step ${step.id} timed out after ${step.timeout}ms`));
      }, step.timeout);

      try {
        const result = await this.executeStep(step, data, context);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Execute a single workflow step
   */
  async executeStep(step, data, context) {
    switch (step.type) {
      case 'ai-analysis':
        return await this.executeAIAnalysis(step, data, context);

      case 'requirements-validation':
        return await this.executeRequirementsValidation(step, data, context);

      case 'workflow-orchestration':
        return await this.executeWorkflowOrchestration(step, data, context);

      case 'notification':
        return await this.executeNotification(step, data, context);

      case 'data-transform':
        return await this.executeDataTransform(step, data, context);

      case 'conditional-branch':
        return await this.executeConditionalBranch(step, data, context);

      case 'document-generation':
        return await this.executeDocumentGeneration(step, data, context);

      case 'test-generation':
        return await this.executeTestGeneration(step, data, context);

      case 'batch-processing':
        return await this.executeBatchProcessing(step, data, context);

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  /**
   * Execute AI analysis step
   */
  async executeAIAnalysis(step, data, context) {
    // This will be implemented with AI service integration
    return {
      stepType: 'ai-analysis',
      analysis: 'AI analysis placeholder',
      suggestions: [],
      confidence: 0.85,
      processed: true
    };
  }

  /**
   * Execute requirements validation step
   */
  async executeRequirementsValidation(step, data, context) {
    // Integration with Requirements Precision Engine
    return {
      stepType: 'requirements-validation',
      validationResult: 'passed',
      issues: [],
      warnings: [],
      processed: true
    };
  }

  /**
   * Execute workflow orchestration step
   */
  async executeWorkflowOrchestration(step, data, context) {
    return {
      stepType: 'workflow-orchestration',
      orchestrated: true,
      subWorkflows: [],
      processed: true
    };
  }

  /**
   * Execute notification step
   */
  async executeNotification(step, data, context) {
    const { recipients, message, channel } = step.config;

    this.emit('notification', {
      recipients,
      message: this.interpolateMessage(message, data),
      channel: channel || 'default',
      context
    });

    return {
      stepType: 'notification',
      sent: true,
      recipients: recipients?.length || 0,
      processed: true
    };
  }

  /**
   * Execute data transformation step
   */
  async executeDataTransform(step, data, context) {
    const { transformation } = step.config;

    if (typeof transformation === 'function') {
      return transformation(data, context);
    }

    // Simple field mapping
    if (transformation && transformation.mapping) {
      const result = {};
      for (const [key, value] of Object.entries(transformation.mapping)) {
        result[key] = this.getNestedValue(data, value);
      }
      return result;
    }

    return data;
  }

  /**
   * Execute conditional branch step
   */
  async executeConditionalBranch(step, data, context) {
    const { conditions, branches } = step.config;

    for (const condition of conditions) {
      if (this.evaluateCondition(condition.expression, data, {})) {
        if (condition.workflow) {
          return await this.executeWorkflow(condition.workflow, data, context);
        }
        return condition.result || { branch: condition.name, processed: true };
      }
    }

    return { branch: 'default', processed: true };
  }

  /**
   * Execute document generation step
   */
  async executeDocumentGeneration(step, data, context) {
    const { documentType, template, content, outputFormat } = step.config;

    // Load DocumentGenerator if not already loaded
    if (!this.documentGenerator) {
      const DocumentGenerator = require('../ai-services/DocumentGenerator');
      this.documentGenerator = new DocumentGenerator();
    }

    const generationRequest = {
      type: documentType || 'generic',
      template: template || 'default',
      content: content || data.content,
      context: {
        ...context,
        ...data,
        outputFormat: outputFormat || 'markdown'
      }
    };

    const result = await this.documentGenerator.generateDocument(generationRequest);

    return {
      stepType: 'document-generation',
      documentType,
      generatedContent: result.content,
      metadata: result.metadata,
      performance: result.performance,
      processed: true
    };
  }

  /**
   * Execute test generation step
   */
  async executeTestGeneration(step, data, context) {
    const { testType, requirements, coverage } = step.config;

    // Load TestGenerator if not already loaded
    if (!this.testGenerator) {
      const TestGenerator = require('../ai-services/TestGenerator');
      this.testGenerator = new TestGenerator();
    }

    const testRequest = {
      type: testType || 'unit',
      requirements: requirements || data.requirements,
      coverage: coverage || 90,
      context: {
        ...context,
        ...data
      }
    };

    const result = await this.testGenerator.generateTests(testRequest);

    return {
      stepType: 'test-generation',
      testType,
      generatedTests: result.tests,
      coverage: result.coverage,
      edgeCases: result.edgeCases,
      metadata: result.metadata,
      processed: true
    };
  }

  /**
   * Execute batch processing step
   */
  async executeBatchProcessing(step, data, context) {
    const { operation, items, batchSize, parallel } = step.config;

    const itemsToProcess = items || data.items || [];
    const processInBatches = batchSize || 10;
    const processInParallel = parallel !== false;

    const results = [];
    const errors = [];

    for (let i = 0; i < itemsToProcess.length; i += processInBatches) {
      const batch = itemsToProcess.slice(i, i + processInBatches);

      try {
        if (processInParallel) {
          const batchPromises = batch.map(item => this.processBatchItem(operation, item, context));
          const batchResults = await Promise.allSettled(batchPromises);

          batchResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              results.push(result.value);
            } else {
              errors.push({
                item: batch[index],
                error: result.reason.message
              });
            }
          });
        } else {
          for (const item of batch) {
            try {
              const result = await this.processBatchItem(operation, item, context);
              results.push(result);
            } catch (error) {
              errors.push({
                item,
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        errors.push({
          batch: i / processInBatches + 1,
          error: error.message
        });
      }

      // Emit progress update
      this.emit('batch-progress', {
        processed: Math.min(i + processInBatches, itemsToProcess.length),
        total: itemsToProcess.length,
        percentage: Math.round((Math.min(i + processInBatches, itemsToProcess.length) / itemsToProcess.length) * 100)
      });
    }

    return {
      stepType: 'batch-processing',
      operation,
      totalItems: itemsToProcess.length,
      successfulItems: results.length,
      failedItems: errors.length,
      results,
      errors,
      processed: true
    };
  }

  /**
   * Process individual batch item
   */
  async processBatchItem(operation, item, context) {
    switch (operation) {
      case 'document-validation':
        return await this.validateDocument(item, context);

      case 'document-generation':
        if (!this.documentGenerator) {
          const DocumentGenerator = require('../ai-services/DocumentGenerator');
          this.documentGenerator = new DocumentGenerator();
        }
        return await this.documentGenerator.generateDocument(item);

      case 'test-generation':
        if (!this.testGenerator) {
          const TestGenerator = require('../ai-services/TestGenerator');
          this.testGenerator = new TestGenerator();
        }
        return await this.testGenerator.generateTests(item);

      case 'analysis':
        return await this.executeAIAnalysis({ config: {} }, item, context);

      default:
        return { item, processed: true, operation };
    }
  }

  /**
   * Validate document item
   */
  async validateDocument(item, context) {
    // Basic document validation
    const validation = {
      valid: true,
      issues: [],
      score: 100
    };

    if (!item.content || item.content.trim().length === 0) {
      validation.valid = false;
      validation.issues.push('Empty content');
      validation.score -= 50;
    }

    if (!item.title || item.title.trim().length === 0) {
      validation.valid = false;
      validation.issues.push('Missing title');
      validation.score -= 20;
    }

    return {
      item: item.id || 'unknown',
      validation,
      processed: true
    };
  }

  /**
   * Evaluate a condition expression
   */
  evaluateCondition(condition, data, stepResults) {
    if (typeof condition === 'function') {
      return condition(data, stepResults);
    }

    if (typeof condition === 'string') {
      // Simple string-based conditions
      return this.evaluateStringCondition(condition, data, stepResults);
    }

    return Boolean(condition);
  }

  /**
   * Evaluate string-based condition
   */
  evaluateStringCondition(condition, data, stepResults) {
    // Simple condition evaluation (can be extended)
    const context = { data, stepResults };

    try {
      // Replace variables in condition
      const processedCondition = condition.replace(/\$\{([^}]+)\}/g, (match, path) => {
        return this.getNestedValue(context, path);
      });

      // Evaluate simple expressions
      return eval(processedCondition);
    } catch (error) {
      console.warn('Condition evaluation failed:', error.message);
      return false;
    }
  }

  /**
   * Handle step failure
   */
  async handleStepFailure(step, error, execution) {
    if (step.onFailure.action === 'retry' && step.retryConfig) {
      const retryCount = execution.retryCount || 0;
      if (retryCount < step.retryConfig.maxAttempts) {
        execution.retryCount = retryCount + 1;

        // Wait before retry
        if (step.retryConfig.delay) {
          await this.sleep(step.retryConfig.delay);
        }

        throw new Error(`Retrying step ${step.id} (attempt ${retryCount + 1})`);
      }
    }

    if (step.onFailure.action === 'continue') {
      return { stepType: step.type, failed: true, error: error.message };
    }

    throw error;
  }

  /**
   * Interpolate message with data
   */
  interpolateMessage(message, data) {
    return message.replace(/\$\{([^}]+)\}/g, (match, path) => {
      return this.getNestedValue(data, path) || match;
    });
  }

  /**
   * Get nested value from object
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Update execution metrics
   */
  updateMetrics(execution) {
    if (execution.status === 'completed') {
      this.metrics.successfulExecutions++;
    }

    if (execution.duration) {
      this.metrics.executionTimes.push(execution.duration);

      // Keep only last 100 execution times for average calculation
      if (this.metrics.executionTimes.length > 100) {
        this.metrics.executionTimes = this.metrics.executionTimes.slice(-100);
      }

      this.metrics.averageExecutionTime =
        this.metrics.executionTimes.reduce((sum, time) => sum + time, 0) /
        this.metrics.executionTimes.length;
    }
  }

  /**
   * Generate unique execution ID
   */
  generateExecutionId() {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get workflow status
   */
  getWorkflowStatus(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return null;
    }

    const activeExecutions = Array.from(this.activeExecutions.values())
      .filter(exec => exec.workflowId === workflowId);

    return {
      workflow,
      activeExecutions: activeExecutions.length,
      isRunning: activeExecutions.length > 0
    };
  }

  /**
   * Get execution status
   */
  getExecutionStatus(executionId) {
    return this.activeExecutions.get(executionId) || null;
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(executionId) {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = 'cancelled';
    execution.endTime = Date.now();
    execution.duration = execution.endTime - execution.startTime;

    this.activeExecutions.delete(executionId);

    this.emit('workflow-cancelled', {
      executionId,
      workflowId: execution.workflowId
    });

    return true;
  }

  /**
   * Get engine metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeWorkflows: this.activeExecutions.size,
      registeredWorkflows: this.workflows.size,
      successRate: this.metrics.totalExecutions > 0 ?
        (this.metrics.successfulExecutions / this.metrics.totalExecutions) * 100 : 0
    };
  }

  /**
   * List all registered workflows
   */
  listWorkflows() {
    return Array.from(this.workflows.values());
  }

  /**
   * Remove workflow
   */
  removeWorkflow(workflowId) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      return false;
    }

    // Cancel any active executions
    const activeExecutions = Array.from(this.activeExecutions.entries())
      .filter(([_, exec]) => exec.workflowId === workflowId);

    for (const [executionId, _] of activeExecutions) {
      this.cancelExecution(executionId);
    }

    this.workflows.delete(workflowId);

    this.emit('workflow-removed', { workflowId });

    return true;
  }
}

module.exports = WorkflowEngine;