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

const SchedulingModal = ({
  isOpen,
  onClose,
  onSave,
  workflows = [],
  scheduledJob = null,
  mode = 'create' // 'create' or 'edit'
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    workflowId: '',
    workflowName: '',
    schedule: {
      type: 'cron', // 'cron', 'interval', 'once'
      expression: '0 9 * * 1-5', // Default: 9 AM weekdays
      interval: 3600, // 1 hour in seconds
      datetime: '', // For 'once' type
      timezone: 'UTC'
    },
    input: {},
    context: {},
    enabled: true,
    maxRuns: null, // null for unlimited
    description: '',
    notifications: {
      onStart: false,
      onSuccess: false,
      onFailure: true,
      onMaxRuns: true,
      recipients: []
    }
  });

  const [previewNextRuns, setPreviewNextRuns] = useState([]);
  const [cronHelp, setCronHelp] = useState(false);

  const scheduleTypes = [
    { value: 'cron', label: 'Cron Expression (Advanced)' },
    { value: 'interval', label: 'Fixed Interval' },
    { value: 'once', label: 'Run Once' }
  ];

  const commonCronExpressions = [
    { label: 'Every minute', value: '* * * * *' },
    { label: 'Every 5 minutes', value: '*/5 * * * *' },
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every day at 9 AM', value: '0 9 * * *' },
    { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5' },
    { label: 'Weekly on Monday at 9 AM', value: '0 9 * * 1' },
    { label: 'Monthly on 1st at 9 AM', value: '0 9 1 * *' }
  ];

  const intervalOptions = [
    { label: '1 minute', value: 60 },
    { label: '5 minutes', value: 300 },
    { label: '15 minutes', value: 900 },
    { label: '30 minutes', value: 1800 },
    { label: '1 hour', value: 3600 },
    { label: '2 hours', value: 7200 },
    { label: '6 hours', value: 21600 },
    { label: '12 hours', value: 43200 },
    { label: '24 hours', value: 86400 }
  ];

  useEffect(() => {
    if (scheduledJob && mode === 'edit') {
      setFormData({
        ...scheduledJob,
        schedule: scheduledJob.schedule || {
          type: 'cron',
          expression: '0 9 * * 1-5',
          interval: 3600,
          datetime: '',
          timezone: 'UTC'
        },
        notifications: scheduledJob.notifications || {
          onStart: false,
          onSuccess: false,
          onFailure: true,
          onMaxRuns: true,
          recipients: []
        }
      });
    } else {
      // Reset form for create mode
      setFormData({
        id: '',
        name: '',
        workflowId: '',
        workflowName: '',
        schedule: {
          type: 'cron',
          expression: '0 9 * * 1-5',
          interval: 3600,
          datetime: '',
          timezone: 'UTC'
        },
        input: {},
        context: {},
        enabled: true,
        maxRuns: null,
        description: '',
        notifications: {
          onStart: false,
          onSuccess: false,
          onFailure: true,
          onMaxRuns: true,
          recipients: []
        }
      });
    }
  }, [scheduledJob, mode, isOpen]);

  useEffect(() => {
    if (formData.schedule.type === 'cron' && formData.schedule.expression) {
      generateNextRunsPreview();
    }
  }, [formData.schedule.expression, formData.schedule.type]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScheduleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [field]: value
      }
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

  const handleWorkflowSelect = (workflowId) => {
    const workflow = workflows.find(w => w.id === workflowId);
    setFormData(prev => ({
      ...prev,
      workflowId,
      workflowName: workflow ? workflow.name : ''
    }));
  };

  const generateNextRunsPreview = () => {
    // This would integrate with a cron parser library in a real implementation
    // For now, we'll show a simple preview
    const mockNextRuns = [
      new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Three days
      new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // Four days
      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)  // Five days
    ];
    setPreviewNextRuns(mockNextRuns);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name || !formData.workflowId) {
      alert('Schedule name and workflow are required');
      return;
    }

    if (formData.schedule.type === 'cron' && !formData.schedule.expression) {
      alert('Cron expression is required');
      return;
    }

    if (formData.schedule.type === 'once' && !formData.schedule.datetime) {
      alert('Date and time are required for one-time execution');
      return;
    }

    const scheduleConfig = {
      ...formData,
      id: formData.id || `schedule_${Date.now()}`,
      createdAt: scheduledJob?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(scheduleConfig);
  };

  const renderScheduleConfig = () => {
    switch (formData.schedule.type) {
      case 'cron':
        return (
          <div className="schedule-config">
            <div className="form-group">
              <div className="label-with-help">
                <label>Cron Expression</label>
                <button
                  type="button"
                  className="help-button"
                  onClick={() => setCronHelp(!cronHelp)}
                >
                  ?
                </button>
              </div>
              <input
                type="text"
                value={formData.schedule.expression}
                onChange={(e) => handleScheduleChange('expression', e.target.value)}
                placeholder="0 9 * * 1-5"
              />
              {cronHelp && (
                <div className="cron-help">
                  <p>Format: minute hour day month weekday</p>
                  <p>* = any value, */5 = every 5, 1-5 = range</p>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Common Expressions</label>
              <select
                value=""
                onChange={(e) => handleScheduleChange('expression', e.target.value)}
              >
                <option value="">Select a common pattern...</option>
                {commonCronExpressions.map(expr => (
                  <option key={expr.value} value={expr.value}>
                    {expr.label} ({expr.value})
                  </option>
                ))}
              </select>
            </div>

            {previewNextRuns.length > 0 && (
              <div className="next-runs-preview">
                <h4>Next 5 Scheduled Runs:</h4>
                <ul>
                  {previewNextRuns.map((date, index) => (
                    <li key={index}>{date.toLocaleString()}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 'interval':
        return (
          <div className="schedule-config">
            <div className="form-group">
              <label>Interval</label>
              <select
                value={formData.schedule.interval}
                onChange={(e) => handleScheduleChange('interval', parseInt(e.target.value))}
              >
                {intervalOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="interval-info">
              <p>Workflow will run every {intervalOptions.find(o => o.value === formData.schedule.interval)?.label}</p>
            </div>
          </div>
        );

      case 'once':
        return (
          <div className="schedule-config">
            <div className="form-group">
              <label>Date and Time</label>
              <input
                type="datetime-local"
                value={formData.schedule.datetime}
                onChange={(e) => handleScheduleChange('datetime', e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content scheduling-modal">
        <div className="modal-header">
          <h2>{mode === 'edit' ? 'Edit Scheduled Job' : 'Schedule Workflow'}</h2>
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
                    <label>Schedule Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter schedule name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Workflow *</label>
                    <select
                      value={formData.workflowId}
                      onChange={(e) => handleWorkflowSelect(e.target.value)}
                      required
                    >
                      <option value="">Select a workflow...</option>
                      {workflows.map(workflow => (
                        <option key={workflow.id} value={workflow.id}>
                          {workflow.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows="2"
                    placeholder="Describe this scheduled job..."
                  />
                </div>
              </div>

              {/* Schedule Configuration */}
              <div className="config-section">
                <h3>Schedule Configuration</h3>
                <div className="form-group">
                  <label>Schedule Type</label>
                  <select
                    value={formData.schedule.type}
                    onChange={(e) => handleScheduleChange('type', e.target.value)}
                  >
                    {scheduleTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {renderScheduleConfig()}

                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={formData.schedule.timezone}
                    onChange={(e) => handleScheduleChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Berlin">Berlin</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>
              </div>

              {/* Execution Settings */}
              <div className="config-section">
                <h3>Execution Settings</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Max Runs (optional)</label>
                    <input
                      type="number"
                      value={formData.maxRuns || ''}
                      onChange={(e) => handleInputChange('maxRuns', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Unlimited"
                      min="1"
                    />
                    <small>Leave empty for unlimited runs</small>
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

                <div className="form-group">
                  <label>Workflow Input (JSON)</label>
                  <textarea
                    value={JSON.stringify(formData.input, null, 2)}
                    onChange={(e) => {
                      try {
                        const input = JSON.parse(e.target.value);
                        handleInputChange('input', input);
                      } catch (error) {
                        // Invalid JSON, ignore for now
                      }
                    }}
                    rows="4"
                    placeholder="{}"
                  />
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
                    Notify when execution starts
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifications.onSuccess}
                      onChange={(e) => handleNestedInputChange('notifications', 'onSuccess', e.target.checked)}
                    />
                    Notify on successful completion
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifications.onFailure}
                      onChange={(e) => handleNestedInputChange('notifications', 'onFailure', e.target.checked)}
                    />
                    Notify on failure
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.notifications.onMaxRuns}
                      onChange={(e) => handleNestedInputChange('notifications', 'onMaxRuns', e.target.checked)}
                    />
                    Notify when max runs reached
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {mode === 'edit' ? 'Update Schedule' : 'Create Schedule'}
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          .scheduling-modal {
            width: 700px;
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

          .form-group small {
            display: block;
            margin-top: 4px;
            color: #6b7280;
            font-size: 12px;
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

          .label-with-help {
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .help-button {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 1px solid #d1d5db;
            background: #f9fafb;
            color: #6b7280;
            cursor: pointer;
            font-size: 12px;
          }

          .help-button:hover {
            background: #e5e7eb;
          }

          .schedule-config {
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            margin-top: 12px;
          }

          .cron-help {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 4px;
            padding: 8px;
            margin-top: 8px;
            font-size: 12px;
            color: #1e40af;
          }

          .cron-help p {
            margin: 0;
            line-height: 1.4;
          }

          .next-runs-preview {
            margin-top: 16px;
            padding: 12px;
            background: #ecfdf5;
            border-radius: 4px;
          }

          .next-runs-preview h4 {
            margin: 0 0 8px 0;
            color: #065f46;
            font-size: 14px;
          }

          .next-runs-preview ul {
            margin: 0;
            padding-left: 16px;
            color: #047857;
            font-size: 12px;
          }

          .interval-info {
            margin-top: 12px;
            padding: 8px;
            background: #eff6ff;
            border-radius: 4px;
            color: #1e40af;
            font-size: 14px;
          }

          .interval-info p {
            margin: 0;
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

          .modal-header h2 {
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

export default SchedulingModal;