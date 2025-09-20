/**
 * Workflow Scheduler
 * Handles scheduling and orchestration of AI workflows
 */

const EventEmitter = require('events');

class WorkflowScheduler extends EventEmitter {
  constructor(workflowEngine, config = {}) {
    super();
    this.workflowEngine = workflowEngine;
    this.scheduledJobs = new Map();
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30 seconds
      maxRetries: config.maxRetries || 3,
      defaultPriority: config.defaultPriority || 'normal',
      ...config
    };

    this.isRunning = false;
    this.checkTimer = null;

    // Priority queue for workflow execution
    this.priorityQueue = {
      high: [],
      normal: [],
      low: []
    };

    this.initialize();
  }

  /**
   * Initialize the scheduler
   */
  initialize() {
    this.emit('scheduler-initialized', {
      timestamp: new Date().toISOString(),
      config: this.config
    });
  }

  /**
   * Start the scheduler
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.checkTimer = setInterval(() => {
      this.processScheduledJobs();
      this.processPriorityQueue();
    }, this.config.checkInterval);

    this.emit('scheduler-started', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    this.emit('scheduler-stopped', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Schedule a workflow to run at a specific time
   */
  scheduleWorkflow(schedule) {
    const {
      id,
      workflowId,
      name,
      schedule: scheduleConfig,
      input = {},
      context = {},
      priority = this.config.defaultPriority,
      enabled = true
    } = schedule;

    if (!id || !workflowId || !scheduleConfig) {
      throw new Error('Schedule must have id, workflowId, and schedule configuration');
    }

    const scheduledJob = {
      id,
      workflowId,
      name: name || `Scheduled ${workflowId}`,
      schedule: this.parseScheduleConfig(scheduleConfig),
      input,
      context,
      priority,
      enabled,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: this.calculateNextRun(scheduleConfig),
      runCount: 0,
      failureCount: 0,
      metadata: schedule.metadata || {}
    };

    this.scheduledJobs.set(id, scheduledJob);

    this.emit('workflow-scheduled', {
      scheduleId: id,
      workflowId,
      nextRun: scheduledJob.nextRun
    });

    return scheduledJob;
  }

  /**
   * Parse schedule configuration
   */
  parseScheduleConfig(scheduleConfig) {
    if (typeof scheduleConfig === 'string') {
      return this.parseCronExpression(scheduleConfig);
    }

    if (typeof scheduleConfig === 'object') {
      return {
        type: scheduleConfig.type || 'interval',
        interval: scheduleConfig.interval,
        cron: scheduleConfig.cron,
        startTime: scheduleConfig.startTime,
        endTime: scheduleConfig.endTime,
        maxRuns: scheduleConfig.maxRuns,
        timezone: scheduleConfig.timezone || 'UTC'
      };
    }

    throw new Error('Invalid schedule configuration');
  }

  /**
   * Parse cron expression
   */
  parseCronExpression(cronExpression) {
    // Simple cron parser (can be extended with a proper cron library)
    const parts = cronExpression.split(' ');
    if (parts.length !== 5) {
      throw new Error('Invalid cron expression format');
    }

    return {
      type: 'cron',
      cron: cronExpression,
      minute: parts[0],
      hour: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4]
    };
  }

  /**
   * Calculate next run time
   */
  calculateNextRun(scheduleConfig) {
    const now = new Date();

    if (typeof scheduleConfig === 'string') {
      // Treat as cron expression
      return this.calculateNextCronRun(scheduleConfig, now);
    }

    if (scheduleConfig.type === 'interval') {
      const interval = scheduleConfig.interval;
      return new Date(now.getTime() + interval);
    }

    if (scheduleConfig.type === 'once') {
      return new Date(scheduleConfig.runAt);
    }

    if (scheduleConfig.cron) {
      return this.calculateNextCronRun(scheduleConfig.cron, now);
    }

    return null;
  }

  /**
   * Calculate next cron run time (simplified)
   */
  calculateNextCronRun(cronExpression, fromTime) {
    // This is a simplified implementation
    // In production, use a proper cron library like 'node-cron'

    const parts = cronExpression.split(' ');
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    const nextRun = new Date(fromTime);
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);

    // Handle simple cases
    if (minute !== '*') {
      nextRun.setMinutes(parseInt(minute));
    }

    if (hour !== '*') {
      nextRun.setHours(parseInt(hour));
    }

    // If the calculated time is in the past, add a day
    if (nextRun <= fromTime) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * Process scheduled jobs
   */
  async processScheduledJobs() {
    const now = new Date();

    for (const [scheduleId, job] of this.scheduledJobs) {
      if (!job.enabled || !job.nextRun) {
        continue;
      }

      if (now >= job.nextRun) {
        try {
          await this.executeScheduledJob(job);
        } catch (error) {
          this.emit('scheduled-job-failed', {
            scheduleId,
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Execute a scheduled job
   */
  async executeScheduledJob(job) {
    job.lastRun = new Date().toISOString();
    job.runCount++;

    this.emit('scheduled-job-started', {
      scheduleId: job.id,
      workflowId: job.workflowId,
      runCount: job.runCount
    });

    try {
      const result = await this.workflowEngine.executeWorkflow(
        job.workflowId,
        job.input,
        {
          ...job.context,
          scheduledExecution: true,
          scheduleId: job.id
        }
      );

      if (result.success) {
        // Calculate next run time
        job.nextRun = this.calculateNextRun(job.schedule);

        // Check if max runs reached
        if (job.schedule.maxRuns && job.runCount >= job.schedule.maxRuns) {
          job.enabled = false;
          job.nextRun = null;
        }

        this.emit('scheduled-job-completed', {
          scheduleId: job.id,
          workflowId: job.workflowId,
          result: result.result,
          nextRun: job.nextRun
        });

      } else {
        job.failureCount++;

        // Disable if too many failures
        if (job.failureCount >= this.config.maxRetries) {
          job.enabled = false;
          job.nextRun = null;
        } else {
          // Retry with backoff
          job.nextRun = new Date(Date.now() + (job.failureCount * 60000)); // Exponential backoff
        }

        throw new Error(result.error);
      }

    } catch (error) {
      job.failureCount++;

      this.emit('scheduled-job-failed', {
        scheduleId: job.id,
        workflowId: job.workflowId,
        error: error.message,
        failureCount: job.failureCount
      });

      throw error;
    }
  }

  /**
   * Queue workflow for priority execution
   */
  queueWorkflow(queueItem) {
    const {
      workflowId,
      input = {},
      context = {},
      priority = this.config.defaultPriority,
      delay = 0
    } = queueItem;

    const queueEntry = {
      id: this.generateQueueId(),
      workflowId,
      input,
      context,
      priority,
      queuedAt: new Date().toISOString(),
      executeAt: delay > 0 ? new Date(Date.now() + delay) : new Date(),
      attempts: 0
    };

    this.priorityQueue[priority].push(queueEntry);

    // Sort by executeAt time
    this.priorityQueue[priority].sort((a, b) => new Date(a.executeAt) - new Date(b.executeAt));

    this.emit('workflow-queued', {
      queueId: queueEntry.id,
      workflowId,
      priority,
      executeAt: queueEntry.executeAt
    });

    return queueEntry.id;
  }

  /**
   * Process priority queue
   */
  async processPriorityQueue() {
    const now = new Date();
    const priorities = ['high', 'normal', 'low'];

    for (const priority of priorities) {
      const queue = this.priorityQueue[priority];

      while (queue.length > 0) {
        const item = queue[0];

        if (new Date(item.executeAt) > now) {
          break; // Not time yet
        }

        // Remove from queue
        queue.shift();

        try {
          await this.executeQueuedWorkflow(item);
        } catch (error) {
          this.emit('queued-workflow-failed', {
            queueId: item.id,
            error: error.message
          });
        }

        // Process only one item per cycle to avoid blocking
        break;
      }
    }
  }

  /**
   * Execute queued workflow
   */
  async executeQueuedWorkflow(queueItem) {
    queueItem.attempts++;

    this.emit('queued-workflow-started', {
      queueId: queueItem.id,
      workflowId: queueItem.workflowId,
      priority: queueItem.priority
    });

    try {
      const result = await this.workflowEngine.executeWorkflow(
        queueItem.workflowId,
        queueItem.input,
        {
          ...queueItem.context,
          queuedExecution: true,
          queueId: queueItem.id,
          priority: queueItem.priority
        }
      );

      if (result.success) {
        this.emit('queued-workflow-completed', {
          queueId: queueItem.id,
          workflowId: queueItem.workflowId,
          result: result.result
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      // Retry logic
      if (queueItem.attempts < this.config.maxRetries) {
        // Re-queue with delay
        queueItem.executeAt = new Date(Date.now() + (queueItem.attempts * 30000)); // 30s * attempts
        this.priorityQueue[queueItem.priority].push(queueItem);
        this.priorityQueue[queueItem.priority].sort((a, b) => new Date(a.executeAt) - new Date(b.executeAt));
      }

      throw error;
    }
  }

  /**
   * Cancel scheduled job
   */
  cancelScheduledJob(scheduleId) {
    const job = this.scheduledJobs.get(scheduleId);
    if (!job) {
      return false;
    }

    job.enabled = false;
    job.nextRun = null;

    this.emit('scheduled-job-cancelled', {
      scheduleId,
      workflowId: job.workflowId
    });

    return true;
  }

  /**
   * Remove scheduled job
   */
  removeScheduledJob(scheduleId) {
    const removed = this.scheduledJobs.delete(scheduleId);

    if (removed) {
      this.emit('scheduled-job-removed', { scheduleId });
    }

    return removed;
  }

  /**
   * Get scheduled job status
   */
  getScheduledJobStatus(scheduleId) {
    return this.scheduledJobs.get(scheduleId) || null;
  }

  /**
   * List all scheduled jobs
   */
  listScheduledJobs() {
    return Array.from(this.scheduledJobs.values());
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      high: this.priorityQueue.high.length,
      normal: this.priorityQueue.normal.length,
      low: this.priorityQueue.low.length,
      total: this.priorityQueue.high.length +
             this.priorityQueue.normal.length +
             this.priorityQueue.low.length
    };
  }

  /**
   * Generate unique queue ID
   */
  generateQueueId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Pause scheduled job
   */
  pauseScheduledJob(scheduleId) {
    const job = this.scheduledJobs.get(scheduleId);
    if (!job) {
      return false;
    }

    job.enabled = false;
    return true;
  }

  /**
   * Resume scheduled job
   */
  resumeScheduledJob(scheduleId) {
    const job = this.scheduledJobs.get(scheduleId);
    if (!job) {
      return false;
    }

    job.enabled = true;
    job.nextRun = this.calculateNextRun(job.schedule);
    return true;
  }

  /**
   * Get scheduler metrics
   */
  getMetrics() {
    const scheduledJobs = Array.from(this.scheduledJobs.values());
    const totalRuns = scheduledJobs.reduce((sum, job) => sum + job.runCount, 0);
    const totalFailures = scheduledJobs.reduce((sum, job) => sum + job.failureCount, 0);

    return {
      scheduledJobs: scheduledJobs.length,
      enabledJobs: scheduledJobs.filter(job => job.enabled).length,
      totalRuns,
      totalFailures,
      successRate: totalRuns > 0 ? ((totalRuns - totalFailures) / totalRuns) * 100 : 0,
      queueStatus: this.getQueueStatus(),
      isRunning: this.isRunning
    };
  }
}

module.exports = WorkflowScheduler;