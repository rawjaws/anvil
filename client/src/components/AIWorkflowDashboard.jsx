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
import { useAIWorkflow } from '../hooks/useAIWorkflow';
import SmartAnalysis from './SmartAnalysis';

const AIWorkflowDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    workflows,
    scheduledJobs,
    executions,
    metrics,
    loading,
    error,
    executeWorkflow,
    createWorkflow,
    scheduleWorkflow,
    cancelExecution,
    refreshData
  } = useAIWorkflow();

  useEffect(() => {
    refreshData();
  }, []);

  const handleExecuteWorkflow = async (workflowId, input = {}) => {
    try {
      const result = await executeWorkflow(workflowId, input);
      if (result.success) {
        setActiveTab('executions');
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    }
  };

  const renderOverview = () => (
    <div className="ai-workflow-overview">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Active Workflows</h3>
          <div className="metric-value">{metrics?.workflowEngine?.activeWorkflows || 0}</div>
        </div>
        <div className="metric-card">
          <h3>Scheduled Jobs</h3>
          <div className="metric-value">{scheduledJobs?.length || 0}</div>
        </div>
        <div className="metric-card">
          <h3>Recent Executions</h3>
          <div className="metric-value">{executions?.length || 0}</div>
        </div>
        <div className="metric-card">
          <h3>AI Services</h3>
          <div className="metric-value">{metrics?.aiServices?.activeServices || 0}</div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Workflow
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('workflows')}
          >
            Manage Workflows
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setActiveTab('smart-analysis')}
          >
            Smart Analysis
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          {executions?.slice(0, 5).map(execution => (
            <div key={execution.id} className="activity-item">
              <div className="activity-info">
                <span className="workflow-name">{execution.workflowName}</span>
                <span className="execution-time">{new Date(execution.startTime).toLocaleString()}</span>
              </div>
              <div className={`execution-status status-${execution.status}`}>
                {execution.status}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWorkflows = () => (
    <div className="workflows-section">
      <div className="section-header">
        <h3>Registered Workflows</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create New Workflow
        </button>
      </div>

      <div className="workflows-grid">
        {workflows?.map(workflow => (
          <div key={workflow.id} className="workflow-card">
            <div className="workflow-header">
              <h4>{workflow.name}</h4>
              <div className="workflow-actions">
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleExecuteWorkflow(workflow.id)}
                >
                  Execute
                </button>
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => setSelectedWorkflow(workflow)}
                >
                  Details
                </button>
              </div>
            </div>
            <p className="workflow-description">{workflow.description}</p>
            <div className="workflow-meta">
              <span className="workflow-type">{workflow.type}</span>
              <span className="workflow-status">{workflow.status}</span>
            </div>
            <div className="workflow-stats">
              <span>Executions: {workflow.executionCount || 0}</span>
              <span>Success Rate: {workflow.successRate || '100%'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExecutions = () => (
    <div className="executions-section">
      <div className="section-header">
        <h3>Workflow Executions</h3>
        <button className="btn btn-secondary" onClick={refreshData}>
          Refresh
        </button>
      </div>

      <div className="executions-table">
        <table>
          <thead>
            <tr>
              <th>Execution ID</th>
              <th>Workflow</th>
              <th>Status</th>
              <th>Start Time</th>
              <th>Duration</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {executions?.map(execution => (
              <tr key={execution.id}>
                <td>{execution.id}</td>
                <td>{execution.workflowName}</td>
                <td>
                  <span className={`status-badge status-${execution.status}`}>
                    {execution.status}
                  </span>
                </td>
                <td>{new Date(execution.startTime).toLocaleString()}</td>
                <td>{execution.duration || '-'}</td>
                <td>
                  {execution.status === 'running' && (
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => cancelExecution(execution.id)}
                    >
                      Cancel
                    </button>
                  )}
                  <button className="btn btn-small btn-secondary">
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="schedule-section">
      <div className="section-header">
        <h3>Scheduled Jobs</h3>
        <button className="btn btn-primary">
          Schedule New Job
        </button>
      </div>

      <div className="scheduled-jobs">
        {scheduledJobs?.map(job => (
          <div key={job.id} className="scheduled-job-card">
            <div className="job-header">
              <h4>{job.name}</h4>
              <div className="job-status">
                <span className={`status-indicator ${job.enabled ? 'active' : 'paused'}`}></span>
                {job.enabled ? 'Active' : 'Paused'}
              </div>
            </div>
            <div className="job-details">
              <p>Workflow: {job.workflowName}</p>
              <p>Schedule: {job.schedule}</p>
              <p>Next Run: {job.nextRun ? new Date(job.nextRun).toLocaleString() : 'N/A'}</p>
            </div>
            <div className="job-actions">
              <button className="btn btn-small btn-secondary">
                {job.enabled ? 'Pause' : 'Resume'}
              </button>
              <button className="btn btn-small btn-secondary">Edit</button>
              <button className="btn btn-small btn-danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCreateModal = () => (
    showCreateModal && (
      <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Create New Workflow</h3>
            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <form onSubmit={(e) => {
              e.preventDefault();
              // Handle form submission
              setShowCreateModal(false);
            }}>
              <div className="form-group">
                <label>Workflow Name</label>
                <input type="text" required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows="3"></textarea>
              </div>
              <div className="form-group">
                <label>Type</label>
                <select>
                  <option value="analysis">Analysis</option>
                  <option value="automation">Automation</option>
                  <option value="validation">Validation</option>
                  <option value="reporting">Reporting</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Workflow
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  if (loading) {
    return (
      <div className="ai-workflow-loading">
        <div className="loading-spinner"></div>
        <p>Loading AI Workflow Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-workflow-error">
        <h3>Error Loading Dashboard</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={refreshData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="ai-workflow-dashboard">
      <div className="dashboard-header">
        <h1>AI Workflow Automation</h1>
        <p>Manage and monitor AI-powered workflows and automation tasks</p>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          Workflows
        </button>
        <button
          className={`tab ${activeTab === 'executions' ? 'active' : ''}`}
          onClick={() => setActiveTab('executions')}
        >
          Executions
        </button>
        <button
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          Schedule
        </button>
        <button
          className={`tab ${activeTab === 'smart-analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('smart-analysis')}
        >
          Smart Analysis
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'workflows' && renderWorkflows()}
        {activeTab === 'executions' && renderExecutions()}
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'smart-analysis' && (
          <SmartAnalysis />
        )}
      </div>

      {renderCreateModal()}

      <style jsx>{`
        .ai-workflow-dashboard {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          margin-bottom: 30px;
        }

        .dashboard-header h1 {
          color: #1f2937;
          margin-bottom: 8px;
        }

        .dashboard-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .dashboard-tabs {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 30px;
        }

        .tab {
          padding: 12px 24px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #3b82f6;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #3b82f6;
        }

        .metric-card h3 {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-size: 32px;
          font-weight: bold;
          color: #1f2937;
        }

        .quick-actions {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .btn {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #d1d5db;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
        }

        .btn-small {
          padding: 6px 12px;
          font-size: 12px;
        }

        .workflows-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .workflow-card {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .workflow-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .workflow-header h4 {
          margin: 0;
          color: #1f2937;
        }

        .workflow-actions {
          display: flex;
          gap: 8px;
        }

        .workflow-meta {
          display: flex;
          gap: 12px;
          margin: 12px 0;
        }

        .workflow-meta span {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .workflow-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
          font-size: 12px;
          color: #6b7280;
        }

        .executions-table {
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .executions-table table {
          width: 100%;
          border-collapse: collapse;
        }

        .executions-table th,
        .executions-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .executions-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }

        .status-running {
          background: #dbeafe;
          color: #1e40af;
        }

        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }

        .scheduled-jobs {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .scheduled-job-card {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .job-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.active {
          background: #10b981;
        }

        .status-indicator.paused {
          background: #f59e0b;
        }

        .job-details p {
          margin: 4px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .job-actions {
          display: flex;
          gap: 8px;
          margin-top: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #fff;
          border-radius: 8px;
          width: 500px;
          max-width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .ai-workflow-loading,
        .ai-workflow-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AIWorkflowDashboard;