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

import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  MoreVertical,
  Plus,
  Filter,
  BarChart3,
  Settings,
  Zap,
  MessageSquare,
  Users,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import './WorkflowDashboard.css';

export default function WorkflowDashboard({
  documentId,
  workflows,
  conflicts,
  currentUserId,
  onWorkflowUpdate
}) {
  // State
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [workflowAnalytics, setWorkflowAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [actionComment, setActionComment] = useState('');
  const [delegateUsers, setDelegateUsers] = useState([]);
  const [showDelegateForm, setShowDelegateForm] = useState(null);

  useEffect(() => {
    loadWorkflowTemplates();
    loadWorkflowAnalytics();
    if (workflows.length > 0) {
      setActiveWorkflow(workflows[0]);
    }
  }, [documentId, workflows]);

  // Load workflow templates
  const loadWorkflowTemplates = async () => {
    try {
      const response = await fetch('/api/workflows/templates');
      const templates = await response.json();
      setWorkflowTemplates(templates);
    } catch (error) {
      console.error('Failed to load workflow templates:', error);
    }
  };

  // Load workflow analytics
  const loadWorkflowAnalytics = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/workflows/analytics`);
      const analytics = await response.json();
      setWorkflowAnalytics(analytics);
    } catch (error) {
      console.error('Failed to load workflow analytics:', error);
    }
  };

  // Create new workflow
  const handleCreateWorkflow = async (e) => {
    e.preventDefault();

    if (!selectedTemplate) {
      toast.error('Please select a workflow template');
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          initiatorId: currentUserId
        })
      });

      const newWorkflow = await response.json();

      setShowCreateForm(false);
      setSelectedTemplate('');
      onWorkflowUpdate();

      toast.success('Workflow created successfully');
    } catch (error) {
      toast.error('Failed to create workflow');
    }
  };

  // Handle workflow action
  const handleWorkflowAction = async (workflowId, action, data = {}) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: currentUserId,
          data: {
            ...data,
            comment: actionComment
          }
        })
      });

      const result = await response.json();

      setActionComment('');
      onWorkflowUpdate();

      toast.success(`Workflow ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} workflow`);
    }
  };

  // Handle delegation
  const handleDelegate = async (workflowId, stepId, delegateTo) => {
    try {
      await handleWorkflowAction(workflowId, 'delegate', {
        stepId,
        delegateTo
      });

      setShowDelegateForm(null);
      setDelegateUsers([]);
    } catch (error) {
      toast.error('Failed to delegate workflow step');
    }
  };

  // Resolve conflict
  const handleResolveConflict = async (conflictId, resolution) => {
    try {
      const response = await fetch(`/api/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution,
          resolvedBy: currentUserId
        })
      });

      onWorkflowUpdate();
      toast.success('Conflict resolved');
    } catch (error) {
      toast.error('Failed to resolve conflict');
    }
  };

  // Render workflow status badge
  const renderWorkflowStatus = (status) => {
    const statusConfig = {
      active: { icon: Clock, className: 'status-active', label: 'Active' },
      completed: { icon: CheckCircle, className: 'status-completed', label: 'Completed' },
      failed: { icon: XCircle, className: 'status-failed', label: 'Failed' },
      changes_requested: { icon: AlertTriangle, className: 'status-changes', label: 'Changes Requested' }
    };

    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`workflow-status ${config.className}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  // Render step status
  const renderStepStatus = (step) => {
    const statusConfig = {
      pending: { icon: Clock, className: 'step-pending' },
      active: { icon: Activity, className: 'step-active' },
      completed: { icon: CheckCircle, className: 'step-completed' },
      rejected: { icon: XCircle, className: 'step-rejected' },
      changes_requested: { icon: AlertTriangle, className: 'step-changes' }
    };

    const config = statusConfig[step.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`step-status ${config.className}`}>
        <Icon size={16} />
      </div>
    );
  };

  // Render workflow progress
  const renderWorkflowProgress = (workflow) => {
    const totalSteps = workflow.steps.length;
    const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
    const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

    return (
      <div className="workflow-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text">
          {completedSteps}/{totalSteps} steps completed
        </span>
      </div>
    );
  };

  // Render current step actions
  const renderStepActions = (workflow) => {
    if (workflow.status !== 'active') return null;

    const currentStep = workflow.steps[workflow.currentStep];
    if (!currentStep || currentStep.status !== 'active') return null;

    const isAssigned = currentStep.assignedTo.includes(currentUserId);
    if (!isAssigned) return null;

    return (
      <div className="step-actions">
        <h4>Required Action</h4>
        <p>Step: <strong>{currentStep.name}</strong></p>

        <div className="action-form">
          <textarea
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            placeholder="Add a comment (optional)"
            className="action-comment"
            rows="2"
          />

          <div className="action-buttons">
            <button
              className="btn btn-success btn-sm"
              onClick={() => handleWorkflowAction(workflow.id, 'approve')}
            >
              <CheckCircle size={14} />
              Approve
            </button>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleWorkflowAction(workflow.id, 'reject')}
            >
              <XCircle size={14} />
              Reject
            </button>

            <button
              className="btn btn-warning btn-sm"
              onClick={() => handleWorkflowAction(workflow.id, 'request_changes')}
            >
              <AlertTriangle size={14} />
              Request Changes
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => setShowDelegateForm(currentStep.id)}
            >
              <Users size={14} />
              Delegate
            </button>
          </div>
        </div>

        {showDelegateForm === currentStep.id && (
          <div className="delegate-form">
            <h5>Delegate to:</h5>
            <div className="delegate-users">
              <input
                type="text"
                placeholder="Enter user IDs (comma-separated)"
                value={delegateUsers.join(', ')}
                onChange={(e) => setDelegateUsers(e.target.value.split(',').map(u => u.trim()).filter(u => u))}
                className="delegate-input"
              />
            </div>
            <div className="delegate-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleDelegate(workflow.id, currentStep.id, delegateUsers)}
                disabled={delegateUsers.length === 0}
              >
                Delegate
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowDelegateForm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render conflicts section
  const renderConflicts = () => {
    if (conflicts.length === 0) return null;

    return (
      <div className="conflicts-section">
        <h4>
          <AlertTriangle className="text-orange-500" size={18} />
          Conflicts ({conflicts.length})
        </h4>

        {conflicts.map(conflict => (
          <div key={conflict.id} className="conflict-item">
            <div className="conflict-header">
              <span className="conflict-type">{conflict.type}</span>
              <span className="conflict-severity">
                Severity: {conflict.severity}/5
              </span>
            </div>

            <div className="conflict-description">
              <p>Conflict between {conflict.participants.join(' and ')}</p>
              <small>
                {new Date(conflict.timestamp).toLocaleString()}
              </small>
            </div>

            <div className="conflict-actions">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => handleResolveConflict(conflict.id, 'auto')}
              >
                Auto Resolve
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleResolveConflict(conflict.id, 'manual')}
              >
                Manual Resolve
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render analytics
  const renderAnalytics = () => {
    if (!showAnalytics || !workflowAnalytics) return null;

    return (
      <div className="workflow-analytics">
        <div className="analytics-header">
          <h4>
            <BarChart3 size={16} />
            Workflow Analytics
          </h4>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowAnalytics(false)}
          >
            ×
          </button>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card">
            <h5>Efficiency</h5>
            <div className="metric-large">
              {workflowAnalytics.efficiency?.onTime ? (
                <span className="text-green-600">On Time</span>
              ) : (
                <span className="text-red-600">Delayed</span>
              )}
            </div>
            <small>
              {workflowAnalytics.efficiency?.stepsCompleted || 0}/
              {workflowAnalytics.efficiency?.stepsTotal || 0} steps
            </small>
          </div>

          <div className="analytics-card">
            <h5>Activity</h5>
            <div className="metric-large">
              {workflowAnalytics.actionCounts?.approvals || 0}
            </div>
            <small>Approvals</small>
          </div>

          <div className="analytics-card">
            <h5>Participants</h5>
            <div className="metric-large">
              {workflowAnalytics.participantActivity?.size || 0}
            </div>
            <small>Active users</small>
          </div>

          <div className="analytics-card">
            <h5>Escalations</h5>
            <div className="metric-large">
              {workflowAnalytics.escalationEvents?.length || 0}
            </div>
            <small>Events</small>
          </div>
        </div>

        {workflowAnalytics.bottlenecks?.length > 0 && (
          <div className="bottlenecks-section">
            <h5>Bottlenecks</h5>
            {workflowAnalytics.bottlenecks.map((bottleneck, index) => (
              <div key={index} className="bottleneck-item">
                <strong>{bottleneck.stepName}</strong>
                <span className="delay-ratio">
                  {Math.round(bottleneck.delayRatio * 100)}% over expected time
                </span>
                <small>Assignees: {bottleneck.assignees.join(', ')}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="workflow-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h3>
          <GitBranch size={18} />
          Workflows
          {workflows.length > 0 && (
            <span className="workflow-count">{workflows.length}</span>
          )}
        </h3>

        <div className="header-actions">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowAnalytics(!showAnalytics)}
            title="View Analytics"
          >
            <TrendingUp size={16} />
          </button>

          <button
            className="btn btn-sm btn-primary"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus size={16} />
            New Workflow
          </button>
        </div>
      </div>

      {/* Analytics */}
      {renderAnalytics()}

      {/* Conflicts */}
      {renderConflicts()}

      {/* Create Workflow Form */}
      {showCreateForm && (
        <div className="create-workflow-form">
          <h4>Create New Workflow</h4>
          <form onSubmit={handleCreateWorkflow}>
            <div className="form-group">
              <label>Workflow Template:</label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="form-control"
                required
              >
                <option value="">Select a template...</option>
                {workflowTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} - {template.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Workflow
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workflows List */}
      <div className="workflows-list">
        {workflows.length === 0 ? (
          <div className="no-workflows">
            <GitBranch size={48} className="text-gray-300" />
            <h4>No Active Workflows</h4>
            <p>Create a workflow to start the review and approval process.</p>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={16} />
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="workflow-tabs">
            <div className="tab-headers">
              {workflows.map(workflow => (
                <button
                  key={workflow.id}
                  className={`tab-header ${activeWorkflow?.id === workflow.id ? 'active' : ''}`}
                  onClick={() => setActiveWorkflow(workflow)}
                >
                  {workflow.templateName}
                  {renderWorkflowStatus(workflow.status)}
                </button>
              ))}
            </div>

            {activeWorkflow && (
              <div className="workflow-content">
                <div className="workflow-overview">
                  <div className="workflow-header">
                    <h4>{activeWorkflow.templateName}</h4>
                    {renderWorkflowStatus(activeWorkflow.status)}
                    <span className="workflow-priority priority-{activeWorkflow.priority}">
                      {activeWorkflow.priority}
                    </span>
                  </div>

                  {renderWorkflowProgress(activeWorkflow)}

                  <div className="workflow-meta">
                    <div className="meta-item">
                      <User size={14} />
                      <span>Initiated by {activeWorkflow.initiatorId}</span>
                    </div>
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>
                        Created {new Date(activeWorkflow.metadata.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {activeWorkflow.dueDate && (
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>
                          Due {new Date(activeWorkflow.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className="workflow-steps">
                  <h5>Steps</h5>
                  {activeWorkflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`workflow-step ${step.status} ${
                        index === activeWorkflow.currentStep ? 'current' : ''
                      }`}
                    >
                      <div className="step-header">
                        {renderStepStatus(step)}
                        <div className="step-info">
                          <h6>{step.name}</h6>
                          <div className="step-assignees">
                            <Users size={12} />
                            {step.assignedTo.join(', ')}
                          </div>
                        </div>
                        <div className="step-timing">
                          {step.startedAt && (
                            <small>
                              Started: {new Date(step.startedAt).toLocaleString()}
                            </small>
                          )}
                          {step.completedAt && (
                            <small>
                              Completed: {new Date(step.completedAt).toLocaleString()}
                            </small>
                          )}
                        </div>
                      </div>

                      {step.comments.length > 0 && (
                        <div className="step-comments">
                          <h6>Comments:</h6>
                          {step.comments.map((comment, i) => (
                            <div key={i} className="step-comment">
                              <strong>{comment.userId}:</strong> {comment.comment}
                              <small>{new Date(comment.timestamp).toLocaleString()}</small>
                            </div>
                          ))}
                        </div>
                      )}

                      {step.result && (
                        <div className={`step-result result-${step.result}`}>
                          Result: {step.result}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Current Step Actions */}
                {renderStepActions(activeWorkflow)}

                {/* Escalations */}
                {activeWorkflow.escalations.length > 0 && (
                  <div className="workflow-escalations">
                    <h5>
                      <Zap size={16} />
                      Escalations
                    </h5>
                    {activeWorkflow.escalations.map(escalation => (
                      <div key={escalation.id} className="escalation-item">
                        <strong>{escalation.ruleName}</strong>
                        <p>{escalation.action}</p>
                        <small>
                          {new Date(escalation.timestamp).toLocaleString()}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}