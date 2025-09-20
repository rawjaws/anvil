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

const WorkflowConfigurationModal = ({
  isOpen,
  onClose,
  onSave,
  workflow = null,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'analysis',
    category: 'general',
    priority: 'medium',
    timeout: 300, // 5 minutes default
    retryCount: 3,
    enabled: true,
    steps: [],
    triggers: [],
    conditions: [],
    notifications: {
      onSuccess: false,
      onFailure: true,
      onStart: false,
      recipients: []
    },
    metadata: {}
  });

  const [currentStep, setCurrentStep] = useState({
    id: '',
    name: '',
    type: 'ai-analysis',
    config: {},
    dependencies: []
  });

  const [showStepModal, setShowStepModal] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState(-1);

  const workflowTypes = [
    { value: 'analysis', label: 'Analysis Workflow' },
    { value: 'automation', label: 'Automation Workflow' },
    { value: 'validation', label: 'Validation Workflow' },
    { value: 'reporting', label: 'Reporting Workflow' },
    { value: 'integration', label: 'Integration Workflow' }
  ];

  const stepTypes = [
    { value: 'ai-analysis', label: 'AI Analysis' },
    { value: 'data-transform', label: 'Data Transform' },
    { value: 'validation', label: 'Validation' },
    { value: 'notification', label: 'Notification' },
    { value: 'api-call', label: 'API Call' },
    { value: 'condition', label: 'Conditional' },
    { value: 'delay', label: 'Delay' }
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];

  useEffect(() => {
    if (workflow && mode === 'edit') {
      setFormData({
        ...workflow,
        steps: workflow.steps || [],
        triggers: workflow.triggers || [],
        conditions: workflow.conditions || [],
        notifications: workflow.notifications || {
          onSuccess: false,
          onFailure: true,
          onStart: false,
          recipients: []
        }
      });
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        type: 'analysis',
        category: 'general',
        priority: 'medium',
        timeout: 300,
        retryCount: 3,
        enabled: true,
        steps: [],
        triggers: [],
        conditions: [],
        notifications: {
          onSuccess: false,
          onFailure: true,
          onStart: false,
          recipients: []
        },
        metadata: {}
      });
    }
  }, [workflow, mode, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleAddStep = () => {
    setCurrentStep({
      id: '',
      name: '',
      type: 'ai-analysis',
      config: {},
      dependencies: []
    });
    setEditingStepIndex(-1);
    setShowStepModal(true);
  };

  const handleEditStep = (index) => {
    setCurrentStep(formData.steps[index]);
    setEditingStepIndex(index);
    setShowStepModal(true);
  };

  const handleSaveStep = () => {
    if (!currentStep.name || !currentStep.type) {
      alert('Step name and type are required');
      return;
    }

    const stepWithId = {
      ...currentStep,
      id: currentStep.id || `step_${Date.now()}`
    };

    if (editingStepIndex >= 0) {
      // Edit existing step
      const updatedSteps = [...formData.steps];
      updatedSteps[editingStepIndex] = stepWithId;
      setFormData(prev => ({ ...prev, steps: updatedSteps }));
    } else {
      // Add new step
      setFormData(prev => ({
        ...prev,
        steps: [...prev.steps, stepWithId]
      }));
    }

    setShowStepModal(false);
  };

  const handleRemoveStep = (index) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      alert('Workflow name and type are required');
      return;
    }

    if (formData.steps.length === 0) {
      alert('At least one step is required');
      return;
    }

    const workflowDefinition = {
      ...formData,
      id: workflow?.id || `workflow_${Date.now()}`,
      version: workflow?.version || '1.0.0',
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(workflowDefinition);
  };

  const renderStepModal = () => (
    showStepModal && (
      <div className="modal-overlay">
        <div className="modal-content step-modal">
          <div className="modal-header">
            <h3>{editingStepIndex >= 0 ? 'Edit Step' : 'Add Step'}</h3>
            <button
              className="modal-close"
              onClick={() => setShowStepModal(false)}
            >
              ×
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Step Name</label>
              <input
                type="text"
                value={currentStep.name}
                onChange={(e) => setCurrentStep(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter step name"
              />
            </div>

            <div className="form-group">
              <label>Step Type</label>
              <select
                value={currentStep.type}
                onChange={(e) => setCurrentStep(prev => ({ ...prev, type: e.target.value }))}
              >
                {stepTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Configuration (JSON)</label>
              <textarea
                value={JSON.stringify(currentStep.config, null, 2)}
                onChange={(e) => {
                  try {
                    const config = JSON.parse(e.target.value);
                    setCurrentStep(prev => ({ ...prev, config }));
                  } catch (error) {
                    // Invalid JSON, ignore for now
                  }
                }}
                rows="6"
                placeholder="{}"
              />
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowStepModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveStep}
              >
                {editingStepIndex >= 0 ? 'Update Step' : 'Add Step'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content workflow-config-modal">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Workflow' : 'Create Workflow'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="config-sections">
              {/* Basic Information */}
              <div className="config-section">
                <h3>Basic Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Workflow Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter workflow name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      required
                    >
                      {workflowTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                    >
                      {priorities.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      placeholder="general"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="3"
                    placeholder="Describe what this workflow does..."
                  />
                </div>
              </div>

              {/* Execution Settings */}
              <div className="config-section">
                <h3>Execution Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Timeout (seconds)</label>
                    <input
                      type="number"
                      value={formData.timeout}
                      onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
                      min="1"
                      max="3600"
                    />
                  </div>

                  <div className="form-group">
                    <label>Retry Count</label>
                    <input
                      type="number"
                      value={formData.retryCount}
                      onChange={(e) => handleInputChange('retryCount', parseInt(e.target.value))}
                      min="0"
                      max="10"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={(e) => handleInputChange('enabled', e.target.checked)}
                      />
                      Enabled
                    </label>
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="config-section">
                <div className="section-header">
                  <h3>Workflow Steps</h3>
                  <button
                    type="button"
                    className="btn btn-primary btn-small"
                    onClick={handleAddStep}
                  >
                    Add Step
                  </button>
                </div>

                <div className="steps-list">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="step-item">
                      <div className="step-info">
                        <span className="step-number">{index + 1}</span>
                        <div className="step-details">
                          <h4>{step.name}</h4>
                          <p>{step.type}</p>
                        </div>
                      </div>
                      <div className="step-actions">
                        <button
                          type="button"
                          className="btn btn-small btn-secondary"
                          onClick={() => handleEditStep(index)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-small btn-danger"
                          onClick={() => handleRemoveStep(index)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {formData.steps.length === 0 && (
                    <div className="empty-state">
                      <p>No steps defined. Add at least one step to continue.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notifications */}
              <div className="config-section">
                <h3>Notifications</h3>
                <div className="notification-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifications.onStart}
                      onChange={(e) => handleNestedInputChange('notifications', 'onStart', e.target.checked)}
                    />
                    Notify on start
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifications.onSuccess}
                      onChange={(e) => handleNestedInputChange('notifications', 'onSuccess', e.target.checked)}
                    />
                    Notify on success
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifications.onFailure}
                      onChange={(e) => handleNestedInputChange('notifications', 'onFailure', e.target.checked)}
                    />
                    Notify on failure
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {mode === 'edit' ? 'Update Workflow' : 'Create Workflow'}
              </button>
            </div>
          </form>
        </div>

        {renderStepModal()}

        <style jsx>{`
          .workflow-config-modal {
            width: 800px;
            max-width: 95vw;
            max-height: 90vh;
            overflow-y: auto;
          }

          .config-sections {
            space-y: 24px;
          }

          .config-section {
            margin-bottom: 24px;
          }

          .config-section h3 {
            color: #1f2937;
            margin-bottom: 16px;
            font-size: 18px;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
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
          .form-group select,
          .form-group textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 14px;
          }

          .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .checkbox-group input[type="checkbox"] {
            width: auto;
          }

          .steps-list {
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            overflow: hidden;
          }

          .step-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px;
            border-bottom: 1px solid #e5e7eb;
          }

          .step-item:last-child {
            border-bottom: none;
          }

          .step-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background: #3b82f6;
            color: white;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 600;
          }

          .step-details h4 {
            margin: 0;
            color: #1f2937;
            font-size: 14px;
          }

          .step-details p {
            margin: 2px 0 0 0;
            color: #6b7280;
            font-size: 12px;
          }

          .step-actions {
            display: flex;
            gap: 8px;
          }

          .empty-state {
            padding: 40px;
            text-align: center;
            color: #6b7280;
          }

          .notification-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .notification-options label {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .notification-options input[type="checkbox"] {
            width: auto;
          }

          .step-modal {
            width: 600px;
          }

          .btn {
            padding: 8px 16px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
          }

          .btn-small {
            padding: 6px 12px;
            font-size: 12px;
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

          .modal-header h2,
          .modal-header h3 {
            margin: 0;
            color: #1f2937;
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

          .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
        `}</style>
      </div>
    </div>
  );
};

export default WorkflowConfigurationModal;