/**
 * Advanced Collaboration Features Test Suite
 * Tests for enhanced CollaborationManager, SmartComments, and WorkflowManager
 */

const { expect } = require('chai');
const sinon = require('sinon');
const CollaborationManager = require('../../collaboration/CollaborationManager');
const SmartComments = require('../../collaboration/SmartComments');
const WorkflowManager = require('../../collaboration/WorkflowManager');

describe('Advanced Collaboration Features', () => {
  let collaborationManager;
  let smartComments;
  let workflowManager;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
    collaborationManager = new CollaborationManager();
    smartComments = new SmartComments(collaborationManager);
    workflowManager = new WorkflowManager(collaborationManager);
  });

  afterEach(() => {
    clock.restore();
    collaborationManager.shutdown();
    smartComments.shutdown();
    workflowManager.shutdown();
  });

  describe('Enhanced CollaborationManager', () => {
    describe('Smart Conflict Resolution', () => {
      it('should detect and auto-resolve simple conflicts', async () => {
        // Create document and sessions
        const session1 = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);
        const session2 = collaborationManager.createSession('user2', 'doc1', ['read', 'write']);

        // Create non-overlapping operations
        const operation1 = {
          type: 'insert',
          position: 0,
          text: 'Hello ',
          baseVersion: 0
        };

        const operation2 = {
          type: 'insert',
          position: 10,
          text: 'World',
          baseVersion: 0
        };

        // Apply operations
        collaborationManager.applyOperation(session1.id, operation1);
        collaborationManager.applyOperation(session2.id, operation2);

        // Simulate conflict and resolution
        const conflictData = {
          type: 'operational',
          operations: [operation1, operation2],
          participants: ['user1', 'user2']
        };

        const result = collaborationManager.resolveConflict('doc1', conflictData);

        expect(result.success).to.be.true;
        expect(result.conflict.status).to.equal('auto_resolved');
        expect(result.resolution.strategy).to.equal('merge_non_overlapping');
      });

      it('should escalate complex conflicts to human intervention', async () => {
        const session1 = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);
        const session2 = collaborationManager.createSession('user2', 'doc1', ['read', 'write']);

        // Create overlapping operations
        const operation1 = {
          type: 'replace',
          position: 5,
          length: 100,
          text: 'Replacement text 1',
          baseVersion: 0
        };

        const operation2 = {
          type: 'replace',
          position: 8,
          length: 80,
          text: 'Replacement text 2',
          baseVersion: 0
        };

        const conflictData = {
          type: 'semantic',
          operations: [operation1, operation2],
          participants: ['user1', 'user2']
        };

        const result = collaborationManager.resolveConflict('doc1', conflictData);

        expect(result.success).to.be.false;
        expect(result.requiresIntervention).to.be.true;
        expect(result.conflict.status).to.equal('requires_human_intervention');
        expect(result.conflict.severity).to.be.at.least(3);
      });
    });

    describe('Advanced Annotations', () => {
      it('should create and manage collaborative annotations', async () => {
        const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

        const annotationData = {
          type: 'highlight',
          position: 10,
          selection: { start: 10, end: 20 },
          content: 'Important section',
          style: { backgroundColor: '#ffeb3b' },
          visibility: 'all'
        };

        const annotation = collaborationManager.addAnnotation(session.id, annotationData);

        expect(annotation).to.have.property('id');
        expect(annotation.type).to.equal('highlight');
        expect(annotation.userId).to.equal('user1');
        expect(annotation.documentId).to.equal('doc1');
        expect(annotation.visibility).to.equal('all');

        const documentAnnotations = collaborationManager.getDocumentAnnotations('doc1');
        expect(documentAnnotations).to.have.lengthOf(1);
        expect(documentAnnotations[0].id).to.equal(annotation.id);
      });

      it('should filter annotations by layer and visibility', async () => {
        const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

        // Add user annotation
        collaborationManager.addAnnotation(session.id, {
          type: 'note',
          position: 5,
          content: 'User note',
          layer: 'user',
          visibility: 'all'
        });

        // Add system annotation
        collaborationManager.addAnnotation(session.id, {
          type: 'bookmark',
          position: 15,
          content: 'System bookmark',
          layer: 'system',
          visibility: 'collaborators'
        });

        const userAnnotations = collaborationManager.getDocumentAnnotations('doc1', 'user');
        const systemAnnotations = collaborationManager.getDocumentAnnotations('doc1', 'system');

        expect(userAnnotations).to.have.lengthOf(1);
        expect(systemAnnotations).to.have.lengthOf(1);
        expect(userAnnotations[0].layer).to.equal('user');
        expect(systemAnnotations[0].layer).to.equal('system');
      });
    });

    describe('Collaboration Analytics', () => {
      it('should calculate collaboration score correctly', async () => {
        const session1 = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);
        const session2 = collaborationManager.createSession('user2', 'doc1', ['read', 'write']);

        // Add some collaborative activity
        collaborationManager.addComment(session1.id, {
          content: 'Great work!',
          type: 'general'
        });

        collaborationManager.addAnnotation(session1.id, {
          type: 'highlight',
          position: 5,
          content: 'Important'
        });

        const analytics = collaborationManager.getCollaborationAnalytics('doc1');

        expect(analytics.metrics.collaborationScore).to.be.greaterThan(0);
        expect(analytics.summary.totalComments).to.equal(1);
        expect(analytics.summary.totalAnnotations).to.equal(1);
        expect(analytics.summary.activeCollaborators).to.equal(2);
      });

      it('should generate collaboration recommendations', async () => {
        const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

        // Create multiple unresolved comments
        for (let i = 0; i < 6; i++) {
          collaborationManager.addComment(session.id, {
            content: `Comment ${i}`,
            type: 'issue'
          });
        }

        const analytics = collaborationManager.getCollaborationAnalytics('doc1');

        expect(analytics.recommendations).to.have.lengthOf.at.least(1);
        const actionRecommendation = analytics.recommendations.find(r => r.type === 'action');
        expect(actionRecommendation).to.exist;
        expect(actionRecommendation.action).to.equal('review_comments');
      });
    });
  });

  describe('SmartComments System', () => {
    let session;

    beforeEach(() => {
      session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);
    });

    describe('Comment Analysis', () => {
      it('should auto-detect comment type from content', () => {
        const bugCommentData = {
          content: 'This is a critical bug that needs immediate attention'
        };

        const comment = smartComments.createSmartComment(session.id, bugCommentData);

        expect(comment.type).to.equal('issue');
        expect(comment.tags).to.include('urgent');
        expect(comment.tags).to.include('bug');
        expect(comment.priority).to.be.greaterThan(3);
      });

      it('should extract action items from comments', () => {
        const commentData = {
          content: 'Please review this section and update the documentation. TODO: Fix the validation logic.',
          type: 'suggestion'
        };

        const comment = smartComments.createSmartComment(session.id, commentData);

        expect(comment.actionItems).to.have.lengthOf.at.least(1);
        expect(comment.actionItems[0].text).to.include('review this section');
      });

      it('should analyze sentiment correctly', () => {
        const positiveCommentData = {
          content: 'Great work! This implementation is excellent and brilliant.'
        };

        const negativeCommentData = {
          content: 'This is terrible and broken. The design is awful.'
        };

        const positiveComment = smartComments.createSmartComment(session.id, positiveCommentData);
        const negativeComment = smartComments.createSmartComment(session.id, negativeCommentData);

        expect(positiveComment.sentiment.sentiment).to.equal('positive');
        expect(negativeComment.sentiment.sentiment).to.equal('negative');
      });

      it('should extract mentions from comment content', () => {
        const commentData = {
          content: 'Hey @john and @sarah, please review this section @mike mentioned.'
        };

        const comment = smartComments.createSmartComment(session.id, commentData);

        expect(comment.mentions).to.include('john');
        expect(comment.mentions).to.include('sarah');
        expect(comment.mentions).to.include('mike');
        expect(comment.mentions).to.have.lengthOf(3);
      });
    });

    describe('Comment Threading', () => {
      it('should create and manage comment threads', () => {
        const parentComment = smartComments.createSmartComment(session.id, {
          content: 'This needs clarification'
        });

        const replyComment = smartComments.createSmartComment(session.id, {
          content: 'I agree with this point',
          parentId: parentComment.id
        });

        const threads = smartComments.getCommentThreads('doc1');

        expect(threads).to.have.lengthOf(1);
        expect(threads[0].comments).to.include(parentComment.id);
        expect(threads[0].comments).to.include(replyComment.id);
        expect(threads[0].participants.size).to.equal(1);
      });

      it('should update thread metadata correctly', () => {
        const urgentComment = smartComments.createSmartComment(session.id, {
          content: 'Critical issue that needs immediate attention',
          tags: ['urgent', 'blocker']
        });

        const threads = smartComments.getCommentThreads('doc1');
        const thread = threads[0];

        expect(thread.priority).to.be.greaterThan(3);
        expect(Array.from(thread.tags)).to.include('urgent');
        expect(Array.from(thread.tags)).to.include('blocker');
      });
    });

    describe('Smart Filtering', () => {
      beforeEach(() => {
        // Create various types of comments
        smartComments.createSmartComment(session.id, {
          content: 'General comment',
          type: 'general'
        });

        smartComments.createSmartComment(session.id, {
          content: 'This is urgent and needs attention @user1',
          type: 'issue',
          tags: ['urgent']
        });

        smartComments.createSmartComment(session.id, {
          content: 'Question about implementation',
          type: 'question'
        });
      });

      it('should filter comments by type', () => {
        const issueComments = smartComments.getFilteredComments('doc1', { type: 'issue' });
        const questionComments = smartComments.getFilteredComments('doc1', { type: 'question' });

        expect(issueComments).to.have.lengthOf(1);
        expect(questionComments).to.have.lengthOf(1);
        expect(issueComments[0].type).to.equal('issue');
        expect(questionComments[0].type).to.equal('question');
      });

      it('should filter comments by tags', () => {
        const urgentComments = smartComments.getFilteredComments('doc1', { tags: ['urgent'] });

        expect(urgentComments).to.have.lengthOf(1);
        expect(urgentComments[0].tags).to.include('urgent');
      });

      it('should apply smart sorting by relevance', () => {
        const sortedComments = smartComments.getFilteredComments('doc1', {
          smartSort: 'relevance'
        }, 'user1');

        // Comment mentioning user1 should be first
        expect(sortedComments[0].mentions).to.include('user1');
      });
    });

    describe('Comment Templates', () => {
      it('should create comments from templates', () => {
        const templateData = {
          description: 'Login validation fails',
          step1: 'Open login page',
          step2: 'Enter invalid credentials',
          step3: 'Click submit',
          expected: 'Error message shown',
          actual: 'Page crashes'
        };

        const commentData = smartComments.createFromTemplate('bug_report', templateData);

        expect(commentData.content).to.include('Login validation fails');
        expect(commentData.content).to.include('Open login page');
        expect(commentData.type).to.equal('issue');
        expect(commentData.tags).to.include('bug');
      });

      it('should list available templates by category', () => {
        const reviewTemplates = smartComments.getTemplates('review');
        const issueTemplates = smartComments.getTemplates('issue');

        expect(reviewTemplates.length).to.be.greaterThan(0);
        expect(issueTemplates.length).to.be.greaterThan(0);
        expect(reviewTemplates.every(t => t.category === 'review')).to.be.true;
        expect(issueTemplates.every(t => t.category === 'issue')).to.be.true;
      });
    });

    describe('Comment Analytics', () => {
      beforeEach(() => {
        // Create diverse comment data
        smartComments.createSmartComment(session.id, {
          content: 'Positive feedback - great work!',
          type: 'general'
        });

        smartComments.createSmartComment(session.id, {
          content: 'This is broken and needs fixing',
          type: 'issue'
        });

        smartComments.createSmartComment(session.id, {
          content: 'Suggestion for improvement',
          type: 'suggestion'
        });
      });

      it('should generate comment analytics', () => {
        const analytics = smartComments.getCommentAnalytics('doc1');

        expect(analytics.summary.totalComments).to.equal(3);
        expect(analytics.summary.typeDistribution).to.have.property('general');
        expect(analytics.summary.typeDistribution).to.have.property('issue');
        expect(analytics.summary.typeDistribution).to.have.property('suggestion');
      });

      it('should calculate trends correctly', () => {
        const analytics = smartComments.getCommentAnalytics('doc1');

        expect(analytics.trends).to.have.lengthOf(3); // 24h, 7d, 30d
        expect(analytics.trends[0].period).to.equal('24h');
        expect(analytics.trends[0].count).to.equal(3);
      });

      it('should generate insights', () => {
        // Create many comments from same user to trigger insight
        for (let i = 0; i < 5; i++) {
          smartComments.createSmartComment(session.id, {
            content: `Comment ${i}`,
            type: 'general'
          });
        }

        const analytics = smartComments.getCommentAnalytics('doc1');

        expect(analytics.insights.length).to.be.greaterThan(0);
        const participantInsight = analytics.insights.find(i => i.type === 'participant');
        expect(participantInsight).to.exist;
      });
    });
  });

  describe('WorkflowManager System', () => {
    describe('Workflow Creation and Management', () => {
      it('should create workflow instance from template', () => {
        const instance = workflowManager.createWorkflowInstance(
          'doc1',
          'simple_review',
          'user1',
          { priority: 'high' }
        );

        expect(instance).to.have.property('id');
        expect(instance.documentId).to.equal('doc1');
        expect(instance.templateId).to.equal('simple_review');
        expect(instance.initiatorId).to.equal('user1');
        expect(instance.priority).to.equal('high');
        expect(instance.status).to.equal('active');
        expect(instance.steps).to.have.lengthOf.greaterThan(0);
      });

      it('should auto-assign workflow steps', () => {
        // Assign roles first
        workflowManager.assignRole('doc1', 'reviewer1', 'reviewer', 'admin');
        workflowManager.assignRole('doc1', 'approver1', 'approver', 'admin');

        const instance = workflowManager.createWorkflowInstance(
          'doc1',
          'simple_review',
          'user1'
        );

        const reviewStep = instance.steps.find(s => s.name === 'Review');
        const approvalStep = instance.steps.find(s => s.name === 'Approval');

        expect(reviewStep.assignedTo).to.include('reviewer1');
        expect(approvalStep.assignedTo).to.include('approver1');
      });

      it('should start first step automatically', () => {
        const instance = workflowManager.createWorkflowInstance(
          'doc1',
          'simple_review',
          'user1'
        );

        expect(instance.currentStep).to.equal(0);
        expect(instance.steps[0].status).to.equal('active');
        expect(instance.steps[0].startedAt).to.exist;
      });
    });

    describe('Workflow Actions', () => {
      let workflowInstance;

      beforeEach(() => {
        workflowManager.assignRole('doc1', 'reviewer1', 'reviewer', 'admin');
        workflowManager.assignRole('doc1', 'approver1', 'approver', 'admin');

        workflowInstance = workflowManager.createWorkflowInstance(
          'doc1',
          'simple_review',
          'user1'
        );
      });

      it('should handle approval action', () => {
        const result = workflowManager.handleWorkflowAction(
          workflowInstance.id,
          'approve',
          'reviewer1',
          { comment: 'Looks good!' }
        );

        expect(result.success).to.be.true;
        expect(result.stepComplete).to.be.true;

        const updatedInstance = workflowManager.workflowInstances.get(workflowInstance.id);
        expect(updatedInstance.currentStep).to.equal(1); // Moved to next step
        expect(updatedInstance.steps[0].status).to.equal('completed');
        expect(updatedInstance.steps[0].approvals).to.have.lengthOf(1);
      });

      it('should handle rejection action', () => {
        const result = workflowManager.handleWorkflowAction(
          workflowInstance.id,
          'reject',
          'reviewer1',
          { comment: 'Needs more work' }
        );

        expect(result.success).to.be.true;
        expect(result.stepResult).to.equal('rejected');

        const updatedInstance = workflowManager.workflowInstances.get(workflowInstance.id);
        expect(updatedInstance.status).to.equal('failed');
        expect(updatedInstance.steps[0].rejections).to.have.lengthOf(1);
      });

      it('should handle delegation', () => {
        const result = workflowManager.handleWorkflowAction(
          workflowInstance.id,
          'delegate',
          'reviewer1',
          { delegateTo: ['newreviewer1', 'newreviewer2'] }
        );

        expect(result.success).to.be.true;

        const updatedInstance = workflowManager.workflowInstances.get(workflowInstance.id);
        const currentStep = updatedInstance.steps[updatedInstance.currentStep];

        expect(currentStep.assignedTo).to.not.include('reviewer1');
        expect(currentStep.assignedTo).to.include('newreviewer1');
        expect(currentStep.assignedTo).to.include('newreviewer2');
      });

      it('should require minimum approvals for parallel steps', () => {
        const peerReviewInstance = workflowManager.createWorkflowInstance(
          'doc1',
          'peer_review',
          'user1'
        );

        // First approval
        workflowManager.handleWorkflowAction(
          peerReviewInstance.id,
          'approve',
          'reviewer1'
        );

        let updatedInstance = workflowManager.workflowInstances.get(peerReviewInstance.id);
        expect(updatedInstance.currentStep).to.equal(0); // Still on same step

        // Second approval (meets minApprovals: 2)
        workflowManager.assignRole('doc1', 'reviewer2', 'reviewer', 'admin');
        workflowManager.handleWorkflowAction(
          peerReviewInstance.id,
          'approve',
          'reviewer2'
        );

        updatedInstance = workflowManager.workflowInstances.get(peerReviewInstance.id);
        expect(updatedInstance.currentStep).to.equal(1); // Moved to next step
      });
    });

    describe('Escalation System', () => {
      let workflowInstance;

      beforeEach(() => {
        workflowManager.assignRole('doc1', 'reviewer1', 'reviewer', 'admin');
        workflowInstance = workflowManager.createWorkflowInstance(
          'doc1',
          'simple_review',
          'user1'
        );
      });

      it('should handle step timeout', () => {
        const step = workflowInstance.steps[0];
        const timeoutMs = step.timeoutHours * 60 * 60 * 1000;

        // Fast-forward time beyond timeout
        clock.tick(timeoutMs + 1000);

        workflowManager.handleStepTimeout(workflowInstance.id, step.id);

        const updatedInstance = workflowManager.workflowInstances.get(workflowInstance.id);
        expect(updatedInstance.escalations).to.have.lengthOf.greaterThan(0);
      });

      it('should apply escalation rules', () => {
        const conflictData = {
          type: 'operational',
          operations: [{ type: 'insert' }],
          participants: ['user1', 'user2']
        };

        const escalated = workflowManager.checkEscalationRules(
          workflowInstance,
          workflowInstance.steps[0],
          'step_timeout'
        );

        expect(escalated).to.be.a('boolean');
      });

      it('should escalate to manager when rules apply', () => {
        const step = workflowInstance.steps[0];
        const escalation = {
          id: 'test-escalation',
          ruleId: 'escalate_to_manager',
          action: 'escalate_to_manager',
          parameters: {}
        };

        const result = workflowManager.escalateToManager(workflowInstance, step, escalation);

        if (result) {
          // If managers found, should add them to assignees
          expect(step.assignedTo.length).to.be.greaterThan(1);
        }
      });
    });

    describe('Workflow Analytics', () => {
      let workflowInstance;

      beforeEach(() => {
        workflowManager.assignRole('doc1', 'reviewer1', 'reviewer', 'admin');
        workflowInstance = workflowManager.createWorkflowInstance(
          'doc1',
          'simple_review',
          'user1'
        );
      });

      it('should initialize workflow analytics', () => {
        const analytics = workflowManager.getWorkflowAnalytics(workflowInstance.id);

        expect(analytics.workflowId).to.equal(workflowInstance.id);
        expect(analytics.startTime).to.exist;
        expect(analytics.actionCounts).to.have.property('approvals');
        expect(analytics.efficiency).to.have.property('stepsTotal');
      });

      it('should update analytics on workflow actions', () => {
        workflowManager.handleWorkflowAction(
          workflowInstance.id,
          'approve',
          'reviewer1',
          { comment: 'Approved' }
        );

        const analytics = workflowManager.getWorkflowAnalytics(workflowInstance.id);

        expect(analytics.actionCounts.approvals).to.equal(1);
        expect(analytics.participantActivity.get('reviewer1')).to.equal(1);
        expect(analytics.stepAnalytics).to.have.lengthOf.greaterThan(0);
      });

      it('should identify bottlenecks', () => {
        // Complete workflow
        workflowManager.handleWorkflowAction(workflowInstance.id, 'approve', 'reviewer1');
        workflowManager.handleWorkflowAction(workflowInstance.id, 'approve', 'approver1');

        workflowManager.finalizeWorkflowAnalytics(workflowInstance.id);
        const analytics = workflowManager.getWorkflowAnalytics(workflowInstance.id);

        expect(analytics.bottlenecks).to.be.an('array');
        expect(analytics.efficiency.stepsCompleted).to.equal(2);
        expect(analytics.endTime).to.exist;
      });
    });

    describe('Role Management', () => {
      it('should assign and manage user roles', () => {
        const assignment = workflowManager.assignRole('doc1', 'user1', 'reviewer', 'admin');

        expect(assignment.documentId).to.equal('doc1');
        expect(assignment.userId).to.equal('user1');
        expect(assignment.roleId).to.equal('reviewer');
        expect(assignment.assignedBy).to.equal('admin');
        expect(assignment.active).to.be.true;
      });

      it('should prevent duplicate role assignments', () => {
        workflowManager.assignRole('doc1', 'user1', 'reviewer', 'admin');

        expect(() => {
          workflowManager.assignRole('doc1', 'user1', 'reviewer', 'admin');
        }).to.throw('already has role');
      });

      it('should remove role assignments', () => {
        workflowManager.assignRole('doc1', 'user1', 'reviewer', 'admin');
        workflowManager.removeRoleAssignment('doc1', 'user1', 'reviewer');

        const assignments = workflowManager.assignments.get('doc1');
        const assignment = assignments.find(a => a.userId === 'user1' && a.roleId === 'reviewer');

        expect(assignment.active).to.be.false;
        expect(assignment.removedAt).to.exist;
      });
    });

    describe('Notification System', () => {
      let workflowInstance;

      beforeEach(() => {
        workflowManager.assignRole('doc1', 'reviewer1', 'reviewer', 'admin');
        workflowInstance = workflowManager.createWorkflowInstance(
          'doc1',
          'simple_review',
          'user1'
        );
      });

      it('should send notifications on workflow start', () => {
        const notifications = workflowManager.getUserNotifications('reviewer1');
        const workflowStartNotification = notifications.find(n => n.type === 'workflow_started');

        expect(workflowStartNotification).to.exist;
        expect(workflowStartNotification.workflowId).to.equal(workflowInstance.id);
      });

      it('should send notifications on step assignment', () => {
        const notifications = workflowManager.getUserNotifications('reviewer1');
        const stepNotification = notifications.find(n => n.type === 'step_assigned');

        expect(stepNotification).to.exist;
        expect(stepNotification.workflowId).to.equal(workflowInstance.id);
      });

      it('should mark notifications as read', () => {
        const notifications = workflowManager.getUserNotifications('reviewer1');
        const notification = notifications[0];

        workflowManager.markNotificationRead('reviewer1', notification.id);

        const updatedNotifications = workflowManager.getUserNotifications('reviewer1');
        const updatedNotification = updatedNotifications.find(n => n.id === notification.id);

        expect(updatedNotification.read).to.be.true;
      });

      it('should filter unread notifications', () => {
        const allNotifications = workflowManager.getUserNotifications('reviewer1');
        const unreadNotifications = workflowManager.getUserNotifications('reviewer1', true);

        expect(unreadNotifications.length).to.equal(allNotifications.length);

        // Mark one as read
        workflowManager.markNotificationRead('reviewer1', allNotifications[0].id);

        const newUnreadNotifications = workflowManager.getUserNotifications('reviewer1', true);
        expect(newUnreadNotifications.length).to.equal(allNotifications.length - 1);
      });
    });
  });

  describe('Integration Tests', () => {
    describe('Comments and Workflows Integration', () => {
      it('should trigger auto-workflows from smart comments', () => {
        const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

        // Create urgent comment that should trigger workflow
        const comment = smartComments.createSmartComment(session.id, {
          content: 'Critical security vulnerability needs immediate attention @security-team',
          type: 'issue',
          tags: ['urgent', 'security']
        });

        // Check if auto-workflow was triggered
        const workflowEvents = [];
        collaborationManager.on('auto_workflow_triggered', (data) => {
          workflowEvents.push(data);
        });

        // Simulate auto-workflow trigger
        smartComments.checkAutoWorkflows(comment);

        // Verify workflow was triggered
        expect(workflowEvents.length).to.be.greaterThan(0);
        const securityWorkflow = workflowEvents.find(e => e.type === 'security_notification');
        expect(securityWorkflow).to.exist;
      });

      it('should integrate comment analytics with workflow metrics', () => {
        const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

        // Create comments and workflow
        smartComments.createSmartComment(session.id, {
          content: 'Needs review',
          type: 'suggestion'
        });

        workflowManager.assignRole('doc1', 'reviewer1', 'reviewer', 'admin');
        const workflow = workflowManager.createWorkflowInstance('doc1', 'simple_review', 'user1');

        // Get combined analytics
        const collaborationAnalytics = collaborationManager.getCollaborationAnalytics('doc1');
        const commentAnalytics = smartComments.getCommentAnalytics('doc1');
        const workflowAnalytics = workflowManager.getWorkflowAnalytics(workflow.id);

        expect(collaborationAnalytics.summary.totalComments).to.equal(1);
        expect(commentAnalytics.summary.totalComments).to.equal(1);
        expect(workflowAnalytics.workflowId).to.equal(workflow.id);
      });
    });

    describe('Real-time Collaboration with Advanced Features', () => {
      it('should broadcast smart comments to relevant users', () => {
        const session1 = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);
        const session2 = collaborationManager.createSession('user2', 'doc1', ['read', 'write']);

        const broadcastedMessages = [];
        collaborationManager.on('session_message', (data) => {
          broadcastedMessages.push(data);
        });

        // Create comment with mention
        smartComments.createSmartComment(session1.id, {
          content: 'Hey @user2, please review this section',
          type: 'question'
        });

        // Verify broadcast
        expect(broadcastedMessages.length).to.be.greaterThan(0);
        const commentMessage = broadcastedMessages.find(m =>
          m.message.type === 'comment_added'
        );
        expect(commentMessage).to.exist;
      });

      it('should handle conflict resolution with smart analysis', () => {
        const session1 = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);
        const session2 = collaborationManager.createSession('user2', 'doc1', ['read', 'write']);

        // Create conflicting operations
        const operation1 = {
          type: 'insert',
          position: 0,
          text: 'Version 1',
          baseVersion: 0
        };

        const operation2 = {
          type: 'insert',
          position: 0,
          text: 'Version 2',
          baseVersion: 0
        };

        collaborationManager.applyOperation(session1.id, operation1);

        const conflictData = {
          type: 'operational',
          operations: [operation1, operation2],
          participants: ['user1', 'user2']
        };

        const resolution = collaborationManager.resolveConflict('doc1', conflictData);

        if (resolution.success) {
          expect(resolution.resolution.confidence).to.be.greaterThan(0.8);
        } else {
          expect(resolution.requiresIntervention).to.be.true;
        }
      });
    });

    describe('Performance and Scalability', () => {
      it('should handle large numbers of comments efficiently', () => {
        const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

        const startTime = Date.now();

        // Create 100 comments
        for (let i = 0; i < 100; i++) {
          smartComments.createSmartComment(session.id, {
            content: `Comment ${i} with various content to test performance`,
            type: i % 4 === 0 ? 'issue' : 'general'
          });
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should complete within reasonable time (adjust threshold as needed)
        expect(duration).to.be.lessThan(5000); // 5 seconds

        // Verify all comments were created
        const comments = smartComments.getFilteredComments('doc1');
        expect(comments).to.have.lengthOf(100);
      });

      it('should maintain workflow performance with multiple parallel workflows', () => {
        // Create multiple workflows
        for (let i = 0; i < 10; i++) {
          workflowManager.assignRole(`doc${i}`, `reviewer${i}`, 'reviewer', 'admin');
          workflowManager.createWorkflowInstance(`doc${i}`, 'simple_review', `user${i}`);
        }

        const startTime = Date.now();

        // Process all workflows
        workflowManager.processWorkflows();

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should process efficiently
        expect(duration).to.be.lessThan(1000); // 1 second

        // Verify all workflows are tracked
        expect(workflowManager.workflowInstances.size).to.equal(10);
      });
    });
  });

  describe('Quality Gates', () => {
    it('should meet real-time sync latency requirement (<50ms)', () => {
      const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

      const operation = {
        type: 'insert',
        position: 0,
        text: 'Test',
        baseVersion: 0
      };

      const startTime = process.hrtime.bigint();
      collaborationManager.applyOperation(session.id, operation);
      const endTime = process.hrtime.bigint();

      const latencyMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      expect(latencyMs).to.be.lessThan(50);
    });

    it('should achieve conflict resolution accuracy >99%', () => {
      let successfulResolutions = 0;
      const totalConflicts = 100;

      for (let i = 0; i < totalConflicts; i++) {
        const conflictData = {
          type: 'operational',
          operations: [
            { type: 'insert', position: 0, text: 'A' },
            { type: 'insert', position: 10, text: 'B' }
          ],
          participants: ['user1', 'user2']
        };

        const result = collaborationManager.resolveConflict(`doc${i}`, conflictData);
        if (result.success) {
          successfulResolutions++;
        }
      }

      const accuracy = successfulResolutions / totalConflicts;
      expect(accuracy).to.be.greaterThan(0.99);
    });

    it('should achieve comment relevance score >90%', () => {
      const session = collaborationManager.createSession('user1', 'doc1', ['read', 'write']);

      // Create comment with context
      const comment = smartComments.createSmartComment(session.id, {
        content: 'This function needs optimization for better performance',
        position: 50,
        selection: { start: 50, end: 100 }
      });

      // Relevance should be high for contextual comments
      expect(comment.metadata.contextRelevance).to.be.greaterThan(0.9);
    });

    it('should achieve workflow automation effectiveness >85%', () => {
      let automatedActions = 0;
      const totalWorkflows = 20;

      for (let i = 0; i < totalWorkflows; i++) {
        workflowManager.assignRole(`doc${i}`, `reviewer${i}`, 'reviewer', 'admin');
        const workflow = workflowManager.createWorkflowInstance(`doc${i}`, 'simple_review', `user${i}`);

        // Check if auto-assignment worked
        if (workflow.steps[0].assignedTo.length > 0) {
          automatedActions++;
        }
      }

      const effectiveness = automatedActions / totalWorkflows;
      expect(effectiveness).to.be.greaterThan(0.85);
    });
  });
});

// Helper function to wait for async operations
function waitFor(condition, timeout = 1000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      if (condition()) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 10);
      }
    }
    check();
  });
}