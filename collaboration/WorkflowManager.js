/**
 * Workflow Manager
 * Manages customizable approval processes, role-based review assignments,
 * automated escalation, and workflow analytics
 */

const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

class WorkflowManager {
  constructor(collaborationManager) {
    this.collaboration = collaborationManager;
    this.workflows = new Map(); // workflowId -> WorkflowDefinition
    this.workflowInstances = new Map(); // instanceId -> WorkflowInstance
    this.workflowTemplates = new Map(); // templateId -> WorkflowTemplate
    this.roles = new Map(); // roleId -> RoleDefinition
    this.assignments = new Map(); // documentId -> Array<Assignment>
    this.escalationRules = new Map(); // ruleId -> EscalationRule
    this.workflowAnalytics = new Map(); // workflowId -> Analytics
    this.notifications = new Map(); // userId -> Array<Notification>

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    // Initialize workflow system
    this.initializeWorkflowSystem();
  }

  /**
   * Initialize workflow system with default templates and roles
   */
  initializeWorkflowSystem() {
    // Initialize default roles
    this.initializeDefaultRoles();

    // Initialize workflow templates
    this.initializeWorkflowTemplates();

    // Initialize escalation rules
    this.initializeEscalationRules();

    // Start workflow processing
    this.startWorkflowProcessor();

    this.logger.info('Workflow Manager initialized');
  }

  /**
   * Initialize default roles
   */
  initializeDefaultRoles() {
    const defaultRoles = [
      {
        id: 'author',
        name: 'Author',
        description: 'Document author with full edit permissions',
        permissions: ['read', 'write', 'comment', 'approve_own'],
        level: 1
      },
      {
        id: 'reviewer',
        name: 'Reviewer',
        description: 'Reviews documents and provides feedback',
        permissions: ['read', 'comment', 'suggest', 'request_changes'],
        level: 2
      },
      {
        id: 'approver',
        name: 'Approver',
        description: 'Can approve or reject documents',
        permissions: ['read', 'comment', 'approve', 'reject'],
        level: 3
      },
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full administrative access',
        permissions: ['read', 'write', 'comment', 'approve', 'reject', 'manage_workflows', 'assign_roles'],
        level: 4
      },
      {
        id: 'stakeholder',
        name: 'Stakeholder',
        description: 'Interested party with read and comment access',
        permissions: ['read', 'comment'],
        level: 1
      }
    ];

    defaultRoles.forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * Initialize workflow templates
   */
  initializeWorkflowTemplates() {
    const templates = [
      {
        id: 'simple_review',
        name: 'Simple Review',
        description: 'Basic review workflow with single approver',
        steps: [
          {
            id: 'review',
            name: 'Review',
            type: 'review',
            assignees: ['reviewer'],
            parallel: false,
            required: true,
            timeoutHours: 48
          },
          {
            id: 'approve',
            name: 'Approval',
            type: 'approval',
            assignees: ['approver'],
            parallel: false,
            required: true,
            timeoutHours: 24
          }
        ],
        triggers: ['document_created', 'major_changes'],
        autoAssign: true
      },
      {
        id: 'peer_review',
        name: 'Peer Review',
        description: 'Multiple reviewers with consensus requirement',
        steps: [
          {
            id: 'peer_review',
            name: 'Peer Review',
            type: 'review',
            assignees: ['reviewer'],
            parallel: true,
            required: true,
            minApprovals: 2,
            timeoutHours: 72
          },
          {
            id: 'final_approval',
            name: 'Final Approval',
            type: 'approval',
            assignees: ['approver'],
            parallel: false,
            required: true,
            timeoutHours: 24
          }
        ],
        triggers: ['document_created', 'significant_changes'],
        autoAssign: true
      },
      {
        id: 'stakeholder_review',
        name: 'Stakeholder Review',
        description: 'Multi-stage review including stakeholders',
        steps: [
          {
            id: 'technical_review',
            name: 'Technical Review',
            type: 'review',
            assignees: ['reviewer'],
            parallel: true,
            required: true,
            minApprovals: 1,
            timeoutHours: 48
          },
          {
            id: 'stakeholder_review',
            name: 'Stakeholder Review',
            type: 'review',
            assignees: ['stakeholder'],
            parallel: true,
            required: false,
            timeoutHours: 120
          },
          {
            id: 'final_approval',
            name: 'Final Approval',
            type: 'approval',
            assignees: ['approver'],
            parallel: false,
            required: true,
            timeoutHours: 24
          }
        ],
        triggers: ['document_created', 'stakeholder_changes'],
        autoAssign: true
      },
      {
        id: 'emergency_approval',
        name: 'Emergency Approval',
        description: 'Fast-track approval for urgent changes',
        steps: [
          {
            id: 'emergency_review',
            name: 'Emergency Review',
            type: 'review',
            assignees: ['approver'],
            parallel: false,
            required: true,
            timeoutHours: 4
          }
        ],
        triggers: ['emergency_changes'],
        autoAssign: true,
        priority: 'high'
      }
    ];

    templates.forEach(template => {
      this.workflowTemplates.set(template.id, template);
    });
  }

  /**
   * Initialize escalation rules
   */
  initializeEscalationRules() {
    const escalationRules = [
      {
        id: 'timeout_escalation',
        name: 'Timeout Escalation',
        description: 'Escalate when step times out',
        condition: 'step_timeout',
        action: 'escalate_to_manager',
        parameters: {
          escalateAfterHours: 24,
          notifyStakeholders: true
        }
      },
      {
        id: 'priority_escalation',
        name: 'Priority Escalation',
        description: 'Escalate high priority items faster',
        condition: 'high_priority',
        action: 'reduce_timeout',
        parameters: {
          timeoutMultiplier: 0.5,
          additionalNotifications: true
        }
      },
      {
        id: 'blocking_escalation',
        name: 'Blocking Issue Escalation',
        description: 'Escalate when workflow is blocked',
        condition: 'workflow_blocked',
        action: 'emergency_override',
        parameters: {
          allowOverride: true,
          requiresJustification: true
        }
      },
      {
        id: 'stakeholder_escalation',
        name: 'Stakeholder Escalation',
        description: 'Escalate to stakeholders for important decisions',
        condition: 'significant_changes',
        action: 'notify_stakeholders',
        parameters: {
          includeChangesSummary: true,
          requestFeedback: true
        }
      }
    ];

    escalationRules.forEach(rule => {
      this.escalationRules.set(rule.id, rule);
    });
  }

  /**
   * Create a workflow instance for a document
   */
  createWorkflowInstance(documentId, templateId, initiatorId, options = {}) {
    const template = this.workflowTemplates.get(templateId);
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`);
    }

    const instanceId = uuidv4();
    const instance = {
      id: instanceId,
      documentId,
      templateId,
      templateName: template.name,
      initiatorId,
      status: 'active',
      currentStep: 0,
      steps: template.steps.map(step => ({
        ...step,
        id: uuidv4(),
        status: 'pending',
        assignedTo: [],
        startedAt: null,
        completedAt: null,
        approvals: [],
        rejections: [],
        comments: []
      })),
      priority: options.priority || template.priority || 'normal',
      dueDate: options.dueDate || this.calculateDueDate(template),
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        autoAssigned: template.autoAssign,
        originalTemplate: template,
        ...options.metadata
      },
      notifications: [],
      escalations: []
    };

    this.workflowInstances.set(instanceId, instance);

    // Auto-assign if enabled
    if (template.autoAssign) {
      this.autoAssignWorkflow(instance);
    }

    // Start first step
    this.startNextStep(instance);

    // Initialize analytics
    this.initializeWorkflowAnalytics(instanceId);

    this.logger.info(`Workflow instance created: ${instanceId} for document ${documentId}`);

    // Notify relevant parties
    this.notifyWorkflowStart(instance);

    return instance;
  }

  /**
   * Calculate due date based on template
   */
  calculateDueDate(template) {
    const totalHours = template.steps.reduce((total, step) => total + (step.timeoutHours || 24), 0);
    return Date.now() + (totalHours * 60 * 60 * 1000);
  }

  /**
   * Auto-assign workflow based on document and roles
   */
  autoAssignWorkflow(instance) {
    const documentAssignments = this.assignments.get(instance.documentId) || [];

    for (const step of instance.steps) {
      const assignees = [];

      for (const roleId of step.assignees) {
        // Find users with this role for this document
        const roleAssignments = documentAssignments.filter(a => a.roleId === roleId);

        if (roleAssignments.length > 0) {
          assignees.push(...roleAssignments.map(a => a.userId));
        } else {
          // Fallback: assign to available users with this role
          const availableUsers = this.findUsersWithRole(roleId);
          if (availableUsers.length > 0) {
            assignees.push(availableUsers[0]); // Assign to first available
          }
        }
      }

      step.assignedTo = [...new Set(assignees)]; // Remove duplicates
    }

    this.logger.info(`Auto-assigned workflow ${instance.id} to ${instance.steps.map(s => s.assignedTo).flat().length} users`);
  }

  /**
   * Find users with specific role
   */
  findUsersWithRole(roleId) {
    // This would typically query a user database
    // For now, return a simplified list
    const roleUsers = {
      'reviewer': ['reviewer1', 'reviewer2'],
      'approver': ['approver1'],
      'admin': ['admin1'],
      'stakeholder': ['stakeholder1', 'stakeholder2']
    };

    return roleUsers[roleId] || [];
  }

  /**
   * Start the next step in workflow
   */
  startNextStep(instance) {
    if (instance.currentStep >= instance.steps.length) {
      this.completeWorkflow(instance);
      return;
    }

    const step = instance.steps[instance.currentStep];
    step.status = 'active';
    step.startedAt = Date.now();

    // Set timeout
    if (step.timeoutHours) {
      const timeoutMs = step.timeoutHours * 60 * 60 * 1000;
      setTimeout(() => {
        this.handleStepTimeout(instance.id, step.id);
      }, timeoutMs);
    }

    instance.metadata.updatedAt = Date.now();

    // Notify assignees
    this.notifyStepAssignees(instance, step);

    this.logger.info(`Started step ${step.name} for workflow ${instance.id}`);
  }

  /**
   * Handle workflow action (approve, reject, comment, etc.)
   */
  handleWorkflowAction(instanceId, action, userId, data = {}) {
    const instance = this.workflowInstances.get(instanceId);
    if (!instance) {
      throw new Error(`Workflow instance not found: ${instanceId}`);
    }

    if (instance.status !== 'active') {
      throw new Error(`Workflow is not active: ${instance.status}`);
    }

    const currentStep = instance.steps[instance.currentStep];
    if (!currentStep || currentStep.status !== 'active') {
      throw new Error('No active step found');
    }

    // Verify user is assigned to this step
    if (!currentStep.assignedTo.includes(userId)) {
      throw new Error(`User ${userId} is not assigned to current step`);
    }

    const actionRecord = {
      id: uuidv4(),
      userId,
      action,
      timestamp: Date.now(),
      data: data.data || {},
      comment: data.comment || null
    };

    switch (action) {
      case 'approve':
        return this.handleApproval(instance, currentStep, actionRecord);
      case 'reject':
        return this.handleRejection(instance, currentStep, actionRecord);
      case 'request_changes':
        return this.handleChangeRequest(instance, currentStep, actionRecord);
      case 'comment':
        return this.handleWorkflowComment(instance, currentStep, actionRecord);
      case 'delegate':
        return this.handleDelegation(instance, currentStep, actionRecord, data.delegateTo);
      default:
        throw new Error(`Unknown workflow action: ${action}`);
    }
  }

  /**
   * Handle approval action
   */
  handleApproval(instance, step, actionRecord) {
    step.approvals.push(actionRecord);

    // Check if step is complete
    const requiredApprovals = step.minApprovals || 1;
    const currentApprovals = step.approvals.length;

    if (currentApprovals >= requiredApprovals) {
      this.completeStep(instance, step, 'approved');
    }

    // Update analytics
    this.updateWorkflowAnalytics(instance.id, 'approval', actionRecord);

    this.logger.info(`Approval recorded for workflow ${instance.id}, step ${step.name} by ${actionRecord.userId}`);

    return { success: true, stepComplete: currentApprovals >= requiredApprovals };
  }

  /**
   * Handle rejection action
   */
  handleRejection(instance, step, actionRecord) {
    step.rejections.push(actionRecord);

    // Single rejection usually fails the step
    this.completeStep(instance, step, 'rejected');

    // Update analytics
    this.updateWorkflowAnalytics(instance.id, 'rejection', actionRecord);

    this.logger.info(`Rejection recorded for workflow ${instance.id}, step ${step.name} by ${actionRecord.userId}`);

    return { success: true, stepComplete: true, stepResult: 'rejected' };
  }

  /**
   * Handle change request
   */
  handleChangeRequest(instance, step, actionRecord) {
    step.comments.push({ ...actionRecord, type: 'change_request' });

    // Mark step as requiring changes
    step.status = 'changes_requested';
    step.completedAt = Date.now();

    // Notify document author
    this.notifyChangeRequest(instance, actionRecord);

    // Update analytics
    this.updateWorkflowAnalytics(instance.id, 'change_request', actionRecord);

    this.logger.info(`Change request recorded for workflow ${instance.id}, step ${step.name} by ${actionRecord.userId}`);

    return { success: true, stepComplete: true, stepResult: 'changes_requested' };
  }

  /**
   * Handle workflow comment
   */
  handleWorkflowComment(instance, step, actionRecord) {
    step.comments.push({ ...actionRecord, type: 'comment' });

    // Comments don't complete steps
    instance.metadata.updatedAt = Date.now();

    // Update analytics
    this.updateWorkflowAnalytics(instance.id, 'comment', actionRecord);

    this.logger.info(`Comment added to workflow ${instance.id}, step ${step.name} by ${actionRecord.userId}`);

    return { success: true, stepComplete: false };
  }

  /**
   * Handle delegation
   */
  handleDelegation(instance, step, actionRecord, delegateTo) {
    if (!delegateTo || !Array.isArray(delegateTo)) {
      throw new Error('Invalid delegation target');
    }

    // Remove delegating user and add new assignees
    step.assignedTo = step.assignedTo.filter(userId => userId !== actionRecord.userId);
    step.assignedTo.push(...delegateTo);

    step.comments.push({ ...actionRecord, type: 'delegation', delegatedTo: delegateTo });

    // Notify new assignees
    this.notifyDelegation(instance, step, actionRecord.userId, delegateTo);

    this.logger.info(`Workflow ${instance.id}, step ${step.name} delegated by ${actionRecord.userId} to ${delegateTo.join(', ')}`);

    return { success: true, stepComplete: false };
  }

  /**
   * Complete a workflow step
   */
  completeStep(instance, step, result) {
    step.status = 'completed';
    step.completedAt = Date.now();
    step.result = result;

    if (result === 'approved') {
      // Move to next step
      instance.currentStep++;
      this.startNextStep(instance);
    } else if (result === 'rejected') {
      // Workflow fails
      this.failWorkflow(instance, `Step ${step.name} was rejected`);
    } else if (result === 'changes_requested') {
      // Workflow paused for changes
      instance.status = 'changes_requested';
      instance.metadata.updatedAt = Date.now();
    }

    // Notify completion
    this.notifyStepCompletion(instance, step, result);
  }

  /**
   * Complete entire workflow
   */
  completeWorkflow(instance) {
    instance.status = 'completed';
    instance.completedAt = Date.now();
    instance.metadata.updatedAt = Date.now();

    // Finalize analytics
    this.finalizeWorkflowAnalytics(instance.id);

    // Notify completion
    this.notifyWorkflowCompletion(instance);

    this.logger.info(`Workflow completed: ${instance.id} for document ${instance.documentId}`);
  }

  /**
   * Fail workflow
   */
  failWorkflow(instance, reason) {
    instance.status = 'failed';
    instance.failedAt = Date.now();
    instance.failureReason = reason;
    instance.metadata.updatedAt = Date.now();

    // Update analytics
    this.updateWorkflowAnalytics(instance.id, 'workflow_failed', { reason });

    // Notify failure
    this.notifyWorkflowFailure(instance, reason);

    this.logger.warn(`Workflow failed: ${instance.id} - ${reason}`);
  }

  /**
   * Handle step timeout
   */
  handleStepTimeout(instanceId, stepId) {
    const instance = this.workflowInstances.get(instanceId);
    if (!instance || instance.status !== 'active') {
      return; // Workflow no longer active
    }

    const step = instance.steps.find(s => s.id === stepId);
    if (!step || step.status !== 'active') {
      return; // Step no longer active
    }

    // Check escalation rules
    const escalated = this.checkEscalationRules(instance, step, 'step_timeout');

    if (!escalated) {
      // Default timeout handling
      this.escalateStep(instance, step, 'timeout');
    }

    this.logger.warn(`Step timeout: ${step.name} in workflow ${instanceId}`);
  }

  /**
   * Check and apply escalation rules
   */
  checkEscalationRules(instance, step, condition) {
    let escalated = false;

    for (const rule of this.escalationRules.values()) {
      if (rule.condition === condition || rule.condition === 'any') {
        escalated = this.applyEscalationRule(instance, step, rule) || escalated;
      }
    }

    return escalated;
  }

  /**
   * Apply escalation rule
   */
  applyEscalationRule(instance, step, rule) {
    const escalation = {
      id: uuidv4(),
      ruleId: rule.id,
      ruleName: rule.name,
      action: rule.action,
      timestamp: Date.now(),
      parameters: rule.parameters
    };

    instance.escalations.push(escalation);

    switch (rule.action) {
      case 'escalate_to_manager':
        return this.escalateToManager(instance, step, escalation);
      case 'reduce_timeout':
        return this.reduceTimeout(instance, step, escalation);
      case 'emergency_override':
        return this.emergencyOverride(instance, step, escalation);
      case 'notify_stakeholders':
        return this.notifyStakeholders(instance, step, escalation);
      default:
        this.logger.warn(`Unknown escalation action: ${rule.action}`);
        return false;
    }
  }

  /**
   * Escalate to manager
   */
  escalateToManager(instance, step, escalation) {
    // Find managers of current assignees
    const managers = this.findManagers(step.assignedTo);

    if (managers.length > 0) {
      step.assignedTo.push(...managers);
      this.notifyEscalation(instance, step, escalation, managers);
      return true;
    }

    return false;
  }

  /**
   * Find managers for users (simplified implementation)
   */
  findManagers(userIds) {
    // This would typically query an organizational structure
    // For now, return a simplified mapping
    const managerMapping = {
      'reviewer1': 'manager1',
      'reviewer2': 'manager1',
      'approver1': 'admin1'
    };

    const managers = [];
    for (const userId of userIds) {
      if (managerMapping[userId]) {
        managers.push(managerMapping[userId]);
      }
    }

    return [...new Set(managers)]; // Remove duplicates
  }

  /**
   * Reduce timeout for urgent items
   */
  reduceTimeout(instance, step, escalation) {
    const multiplier = escalation.parameters.timeoutMultiplier || 0.5;
    step.timeoutHours = Math.max(1, step.timeoutHours * multiplier);

    this.logger.info(`Timeout reduced for step ${step.name} in workflow ${instance.id}`);
    return true;
  }

  /**
   * Emergency override
   */
  emergencyOverride(instance, step, escalation) {
    if (escalation.parameters.allowOverride) {
      // Allow workflow to bypass this step
      step.status = 'overridden';
      step.completedAt = Date.now();
      instance.currentStep++;
      this.startNextStep(instance);

      this.logger.warn(`Emergency override applied to step ${step.name} in workflow ${instance.id}`);
      return true;
    }

    return false;
  }

  /**
   * Notify stakeholders
   */
  notifyStakeholders(instance, step, escalation) {
    const stakeholders = this.findStakeholders(instance.documentId);

    if (stakeholders.length > 0) {
      this.sendNotification(stakeholders, {
        type: 'stakeholder_escalation',
        workflowId: instance.id,
        documentId: instance.documentId,
        stepName: step.name,
        escalationReason: escalation.ruleName,
        includeChangesSummary: escalation.parameters.includeChangesSummary
      });
      return true;
    }

    return false;
  }

  /**
   * Find stakeholders for document
   */
  findStakeholders(documentId) {
    const assignments = this.assignments.get(documentId) || [];
    return assignments
      .filter(a => a.roleId === 'stakeholder')
      .map(a => a.userId);
  }

  /**
   * Assign role to user for document
   */
  assignRole(documentId, userId, roleId, assignedBy) {
    if (!this.roles.has(roleId)) {
      throw new Error(`Role not found: ${roleId}`);
    }

    if (!this.assignments.has(documentId)) {
      this.assignments.set(documentId, []);
    }

    const assignments = this.assignments.get(documentId);

    // Check if assignment already exists
    const existing = assignments.find(a => a.userId === userId && a.roleId === roleId);
    if (existing) {
      throw new Error(`User ${userId} already has role ${roleId} on document ${documentId}`);
    }

    const assignment = {
      id: uuidv4(),
      documentId,
      userId,
      roleId,
      assignedBy,
      assignedAt: Date.now(),
      active: true
    };

    assignments.push(assignment);

    this.logger.info(`Role ${roleId} assigned to user ${userId} on document ${documentId} by ${assignedBy}`);

    return assignment;
  }

  /**
   * Remove role assignment
   */
  removeRoleAssignment(documentId, userId, roleId) {
    const assignments = this.assignments.get(documentId) || [];
    const index = assignments.findIndex(a => a.userId === userId && a.roleId === roleId && a.active);

    if (index === -1) {
      throw new Error(`Assignment not found: ${userId} with role ${roleId} on document ${documentId}`);
    }

    assignments[index].active = false;
    assignments[index].removedAt = Date.now();

    this.logger.info(`Role ${roleId} removed from user ${userId} on document ${documentId}`);
  }

  /**
   * Get workflow instances for document
   */
  getDocumentWorkflows(documentId, status = null) {
    const workflows = [];

    for (const instance of this.workflowInstances.values()) {
      if (instance.documentId === documentId) {
        if (!status || instance.status === status) {
          workflows.push(instance);
        }
      }
    }

    return workflows.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);
  }

  /**
   * Get workflow analytics
   */
  getWorkflowAnalytics(workflowId) {
    return this.workflowAnalytics.get(workflowId) || this.getEmptyAnalytics();
  }

  /**
   * Initialize workflow analytics
   */
  initializeWorkflowAnalytics(workflowId) {
    this.workflowAnalytics.set(workflowId, {
      workflowId,
      startTime: Date.now(),
      endTime: null,
      totalDuration: null,
      stepAnalytics: [],
      actionCounts: {
        approvals: 0,
        rejections: 0,
        comments: 0,
        delegations: 0
      },
      participantActivity: new Map(),
      escalationEvents: [],
      bottlenecks: [],
      efficiency: {
        onTime: true,
        timeToComplete: null,
        stepsCompleted: 0,
        stepsTotal: 0
      }
    });
  }

  /**
   * Update workflow analytics
   */
  updateWorkflowAnalytics(workflowId, eventType, eventData) {
    const analytics = this.workflowAnalytics.get(workflowId);
    if (!analytics) return;

    // Update action counts
    if (analytics.actionCounts.hasOwnProperty(eventType + 's')) {
      analytics.actionCounts[eventType + 's']++;
    }

    // Update participant activity
    if (eventData.userId) {
      const current = analytics.participantActivity.get(eventData.userId) || 0;
      analytics.participantActivity.set(eventData.userId, current + 1);
    }

    // Record event timing
    analytics.stepAnalytics.push({
      timestamp: Date.now(),
      eventType,
      eventData
    });
  }

  /**
   * Finalize workflow analytics
   */
  finalizeWorkflowAnalytics(workflowId) {
    const analytics = this.workflowAnalytics.get(workflowId);
    const instance = this.workflowInstances.get(workflowId);

    if (!analytics || !instance) return;

    analytics.endTime = Date.now();
    analytics.totalDuration = analytics.endTime - analytics.startTime;
    analytics.efficiency.timeToComplete = analytics.totalDuration;
    analytics.efficiency.stepsCompleted = instance.steps.filter(s => s.status === 'completed').length;
    analytics.efficiency.stepsTotal = instance.steps.length;

    // Check if completed on time
    if (instance.dueDate) {
      analytics.efficiency.onTime = analytics.endTime <= instance.dueDate;
    }

    // Identify bottlenecks
    analytics.bottlenecks = this.identifyBottlenecks(instance);
  }

  /**
   * Identify bottlenecks in workflow
   */
  identifyBottlenecks(instance) {
    const bottlenecks = [];

    for (const step of instance.steps) {
      if (step.startedAt && step.completedAt) {
        const duration = step.completedAt - step.startedAt;
        const expectedDuration = (step.timeoutHours || 24) * 60 * 60 * 1000;

        if (duration > expectedDuration * 0.8) { // 80% of timeout
          bottlenecks.push({
            stepId: step.id,
            stepName: step.name,
            duration,
            expectedDuration,
            delayRatio: duration / expectedDuration,
            assignees: step.assignedTo
          });
        }
      }
    }

    return bottlenecks.sort((a, b) => b.delayRatio - a.delayRatio);
  }

  /**
   * Get empty analytics structure
   */
  getEmptyAnalytics() {
    return {
      workflowId: null,
      startTime: null,
      endTime: null,
      totalDuration: null,
      stepAnalytics: [],
      actionCounts: {
        approvals: 0,
        rejections: 0,
        comments: 0,
        delegations: 0
      },
      participantActivity: new Map(),
      escalationEvents: [],
      bottlenecks: [],
      efficiency: {
        onTime: true,
        timeToComplete: null,
        stepsCompleted: 0,
        stepsTotal: 0
      }
    };
  }

  /**
   * Send notification to users
   */
  sendNotification(userIds, notification) {
    const notificationId = uuidv4();
    const fullNotification = {
      id: notificationId,
      ...notification,
      timestamp: Date.now(),
      read: false
    };

    for (const userId of userIds) {
      if (!this.notifications.has(userId)) {
        this.notifications.set(userId, []);
      }
      this.notifications.get(userId).push(fullNotification);
    }

    // Emit notification event
    this.collaboration.emit('workflow_notification', {
      userIds,
      notification: fullNotification
    });
  }

  /**
   * Notification methods
   */
  notifyWorkflowStart(instance) {
    const assignees = instance.steps[0]?.assignedTo || [];
    this.sendNotification(assignees, {
      type: 'workflow_started',
      workflowId: instance.id,
      workflowName: instance.templateName,
      documentId: instance.documentId,
      initiator: instance.initiatorId,
      dueDate: instance.dueDate
    });
  }

  notifyStepAssignees(instance, step) {
    this.sendNotification(step.assignedTo, {
      type: 'step_assigned',
      workflowId: instance.id,
      stepId: step.id,
      stepName: step.name,
      documentId: instance.documentId,
      dueDate: step.timeoutHours ? Date.now() + (step.timeoutHours * 60 * 60 * 1000) : null
    });
  }

  notifyStepCompletion(instance, step, result) {
    const allParticipants = new Set();
    instance.steps.forEach(s => s.assignedTo.forEach(u => allParticipants.add(u)));

    this.sendNotification([...allParticipants], {
      type: 'step_completed',
      workflowId: instance.id,
      stepId: step.id,
      stepName: step.name,
      result,
      documentId: instance.documentId
    });
  }

  notifyWorkflowCompletion(instance) {
    const allParticipants = new Set();
    instance.steps.forEach(s => s.assignedTo.forEach(u => allParticipants.add(u)));
    allParticipants.add(instance.initiatorId);

    this.sendNotification([...allParticipants], {
      type: 'workflow_completed',
      workflowId: instance.id,
      workflowName: instance.templateName,
      documentId: instance.documentId,
      completedAt: instance.completedAt
    });
  }

  notifyWorkflowFailure(instance, reason) {
    const allParticipants = new Set();
    instance.steps.forEach(s => s.assignedTo.forEach(u => allParticipants.add(u)));
    allParticipants.add(instance.initiatorId);

    this.sendNotification([...allParticipants], {
      type: 'workflow_failed',
      workflowId: instance.id,
      workflowName: instance.templateName,
      documentId: instance.documentId,
      reason,
      failedAt: instance.failedAt
    });
  }

  notifyChangeRequest(instance, actionRecord) {
    this.sendNotification([instance.initiatorId], {
      type: 'changes_requested',
      workflowId: instance.id,
      documentId: instance.documentId,
      requestedBy: actionRecord.userId,
      comment: actionRecord.comment,
      timestamp: actionRecord.timestamp
    });
  }

  notifyDelegation(instance, step, delegatingUser, newAssignees) {
    this.sendNotification(newAssignees, {
      type: 'step_delegated',
      workflowId: instance.id,
      stepId: step.id,
      stepName: step.name,
      delegatedBy: delegatingUser,
      documentId: instance.documentId
    });
  }

  notifyEscalation(instance, step, escalation, escalatedTo) {
    this.sendNotification(escalatedTo, {
      type: 'workflow_escalated',
      workflowId: instance.id,
      stepId: step.id,
      stepName: step.name,
      escalationReason: escalation.ruleName,
      documentId: instance.documentId
    });
  }

  /**
   * Start workflow processor (handles background tasks)
   */
  startWorkflowProcessor() {
    // Check for timeouts and escalations every minute
    setInterval(() => {
      this.processWorkflows();
    }, 60000);
  }

  /**
   * Process all active workflows
   */
  processWorkflows() {
    for (const instance of this.workflowInstances.values()) {
      if (instance.status === 'active') {
        this.processWorkflowInstance(instance);
      }
    }
  }

  /**
   * Process a single workflow instance
   */
  processWorkflowInstance(instance) {
    const currentStep = instance.steps[instance.currentStep];
    if (!currentStep || currentStep.status !== 'active') {
      return;
    }

    // Check for timeouts
    if (currentStep.timeoutHours && currentStep.startedAt) {
      const timeoutMs = currentStep.timeoutHours * 60 * 60 * 1000;
      if (Date.now() - currentStep.startedAt > timeoutMs) {
        this.handleStepTimeout(instance.id, currentStep.id);
      }
    }

    // Check escalation conditions
    this.checkEscalationRules(instance, currentStep, 'periodic_check');
  }

  /**
   * Get workflow templates
   */
  getWorkflowTemplates() {
    return Array.from(this.workflowTemplates.values());
  }

  /**
   * Get available roles
   */
  getRoles() {
    return Array.from(this.roles.values());
  }

  /**
   * Get user notifications
   */
  getUserNotifications(userId, unreadOnly = false) {
    const notifications = this.notifications.get(userId) || [];
    if (unreadOnly) {
      return notifications.filter(n => !n.read);
    }
    return notifications.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(userId, notificationId) {
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Shutdown workflow manager
   */
  shutdown() {
    this.workflows.clear();
    this.workflowInstances.clear();
    this.assignments.clear();
    this.workflowAnalytics.clear();
    this.notifications.clear();

    this.logger.info('Workflow Manager shut down');
  }
}

module.exports = WorkflowManager;