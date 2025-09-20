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

const AutomationControls = ({ onWorkflowCreate, onScheduleCreate }) => {
  const [activeAutomations, setActiveAutomations] = useState([]);
  const [quickActions, setQuickActions] = useState([]);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const [automationTemplates, setAutomationTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  const {
    workflows,
    scheduledJobs,
    metrics,
    executeWorkflow,
    queueWorkflow,
    getQueueStatus,
    healthCheck
  } = useAIWorkflow();

  useEffect(() => {
    initializeAutomationControls();
    loadSmartSuggestions();
  }, [workflows, scheduledJobs]);

  const initializeAutomationControls = () => {
    // Initialize automation templates
    const templates = [
      {
        id: 'auto_analysis',
        name: 'Auto Analysis',
        description: 'Automatically analyze new documents with AI',
        category: 'analysis',
        icon: '🔍',
        trigger: 'document_upload',
        workflow: 'ai-document-analysis',
        enabled: false
      },
      {
        id: 'quality_check',
        name: 'Quality Check',
        description: 'Run quality assessments on requirements',
        category: 'validation',
        icon: '✅',
        trigger: 'requirement_update',
        workflow: 'quality-assessment',
        enabled: false
      },
      {
        id: 'smart_suggestions',
        name: 'Smart Suggestions',
        description: 'Generate AI suggestions for improvements',
        category: 'enhancement',
        icon: '💡',
        trigger: 'analysis_complete',
        workflow: 'suggestion-generation',
        enabled: true
      },
      {
        id: 'compliance_check',
        name: 'Compliance Check',
        description: 'Verify compliance with standards',
        category: 'validation',
        icon: '📋',
        trigger: 'document_finalize',
        workflow: 'compliance-validation',
        enabled: false
      },
      {
        id: 'report_generation',
        name: 'Report Generation',
        description: 'Generate reports automatically',
        category: 'reporting',
        icon: '📊',
        trigger: 'schedule',
        workflow: 'report-generation',
        enabled: true
      }
    ];

    setAutomationTemplates(templates);
    setActiveAutomations(templates.filter(t => t.enabled));

    // Initialize quick actions
    const actions = [
      {
        id: 'analyze_all',
        name: 'Analyze All Documents',
        description: 'Run AI analysis on all documents',
        icon: '🔍',
        action: () => handleQuickAction('analyze_all')
      },
      {
        id: 'validate_requirements',
        name: 'Validate Requirements',
        description: 'Check all requirements for quality',
        icon: '✅',
        action: () => handleQuickAction('validate_requirements')
      },
      {
        id: 'generate_insights',
        name: 'Generate Insights',
        description: 'Create smart insights from data',
        icon: '💡',
        action: () => handleQuickAction('generate_insights')
      },
      {
        id: 'health_check',
        name: 'System Health Check',
        description: 'Check AI services health',
        icon: '🏥',
        action: () => handleQuickAction('health_check')
      }
    ];

    setQuickActions(actions);
  };

  const loadSmartSuggestions = async () => {
    // Generate smart suggestions based on current state
    const suggestions = [
      {
        id: 'suggest_1',
        type: 'automation',
        priority: 'high',
        title: 'Enable Auto Analysis',
        description: 'Your documents could benefit from automatic AI analysis. Enable this to catch issues early.',
        action: () => toggleAutomation('auto_analysis'),
        actionText: 'Enable Now'
      },
      {
        id: 'suggest_2',
        type: 'schedule',
        priority: 'medium',
        title: 'Schedule Weekly Reports',
        description: 'Consider scheduling weekly quality reports to track progress.',
        action: () => setShowQuickCreate(true),
        actionText: 'Create Schedule'
      },
      {
        id: 'suggest_3',
        type: 'optimization',
        priority: 'low',
        title: 'Optimize Workflow Performance',
        description: 'Some workflows could be optimized for better performance.',
        action: () => handleOptimizeWorkflows(),
        actionText: 'Optimize'
      }
    ];

    setSmartSuggestions(suggestions);
  };

  const handleQuickAction = async (actionId) => {
    switch (actionId) {
      case 'analyze_all':
        await executeWorkflow('ai-document-analysis', { target: 'all' });
        break;
      case 'validate_requirements':
        await executeWorkflow('quality-assessment', { scope: 'requirements' });
        break;
      case 'generate_insights':
        await executeWorkflow('insight-generation', { depth: 'comprehensive' });
        break;
      case 'health_check':
        const health = await healthCheck();
        alert(`System Health: ${health ? 'Good' : 'Issues Detected'}`);
        break;
      default:
        console.log(`Quick action: ${actionId}`);
    }
  };

  const toggleAutomation = (templateId) => {
    setAutomationTemplates(prev =>
      prev.map(template =>
        template.id === templateId
          ? { ...template, enabled: !template.enabled }
          : template
      )
    );

    setActiveAutomations(prev => {
      const template = automationTemplates.find(t => t.id === templateId);
      if (template?.enabled) {
        return prev.filter(a => a.id !== templateId);
      } else {
        return [...prev, { ...template, enabled: true }];
      }
    });
  };

  const handleOptimizeWorkflows = () => {
    alert('Workflow optimization analysis started...');
  };

  const handleCreateFromTemplate = (template) => {
    const workflowDefinition = {
      name: template.name,
      description: template.description,
      type: template.category,
      category: 'automation',
      priority: 'medium',
      enabled: true,
      steps: [
        {
          id: 'trigger_step',
          name: 'Trigger Handler',
          type: 'trigger',
          config: {
            triggerType: template.trigger,
            conditions: []
          }
        },
        {
          id: 'main_action',
          name: 'Main Action',
          type: 'ai-analysis',
          config: {
            analysisType: template.category,
            options: {}
          }
        }
      ],
      triggers: [template.trigger],
      metadata: {
        template: template.id,
        automated: true
      }
    };

    onWorkflowCreate(workflowDefinition);
  };

  const renderAutomationCard = (automation) => (
    <div key={automation.id} className="automation-card">
      <div className="automation-header">
        <div className="automation-icon">{automation.icon}</div>
        <div className="automation-info">
          <h4>{automation.name}</h4>
          <p>{automation.description}</p>
        </div>
        <div className="automation-toggle">
          <label className="switch">
            <input
              type="checkbox"
              checked={automation.enabled}
              onChange={() => toggleAutomation(automation.id)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>
      <div className="automation-meta">
        <span className="category">{automation.category}</span>
        <span className="trigger">Trigger: {automation.trigger}</span>
      </div>
      <div className="automation-actions">
        <button
          className="btn btn-small btn-secondary"
          onClick={() => handleCreateFromTemplate(automation)}
        >
          Create Workflow
        </button>
        <button className="btn btn-small btn-secondary">
          Configure
        </button>
      </div>
    </div>
  );

  const renderQuickAction = (action) => (
    <div key={action.id} className="quick-action-card" onClick={action.action}>
      <div className="action-icon">{action.icon}</div>
      <div className="action-content">
        <h4>{action.name}</h4>
        <p>{action.description}</p>
      </div>
      <div className="action-arrow">→</div>
    </div>
  );

  const renderSmartSuggestion = (suggestion) => (
    <div key={suggestion.id} className={`suggestion-card ${suggestion.priority}`}>
      <div className="suggestion-content">
        <h4>{suggestion.title}</h4>
        <p>{suggestion.description}</p>
      </div>
      <div className="suggestion-actions">
        <button
          className="btn btn-small btn-primary"
          onClick={suggestion.action}
        >
          {suggestion.actionText}
        </button>
        <button className="btn btn-small btn-secondary">
          Dismiss
        </button>
      </div>
    </div>
  );

  return (
    <div className="automation-controls">
      <div className="controls-header">
        <h2>AI Automation Controls</h2>
        <p>Manage automated workflows and AI-powered processes</p>
      </div>

      {/* Quick Actions */}
      <div className="control-section">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          {quickActions.map(renderQuickAction)}
        </div>
      </div>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <div className="control-section">
          <h3>Smart Suggestions</h3>
          <div className="suggestions-list">
            {smartSuggestions.map(renderSmartSuggestion)}
          </div>
        </div>
      )}

      {/* Active Automations */}
      <div className="control-section">
        <div className="section-header">
          <h3>Active Automations</h3>
          <span className="count-badge">{activeAutomations.length}</span>
        </div>
        <div className="automations-grid">
          {activeAutomations.map(renderAutomationCard)}
        </div>
      </div>

      {/* Available Automation Templates */}
      <div className="control-section">
        <h3>Available Automation Templates</h3>
        <div className="templates-grid">
          {automationTemplates.filter(t => !t.enabled).map(renderAutomationCard)}
        </div>
      </div>

      {/* System Status */}
      <div className="control-section">
        <h3>System Status</h3>
        <div className="status-grid">
          <div className="status-card">
            <h4>AI Services</h4>
            <div className="status-indicator healthy">●</div>
            <span>Operational</span>
          </div>
          <div className="status-card">
            <h4>Workflow Engine</h4>
            <div className="status-indicator healthy">●</div>
            <span>Running</span>
          </div>
          <div className="status-card">
            <h4>Scheduler</h4>
            <div className="status-indicator healthy">●</div>
            <span>Active</span>
          </div>
          <div className="status-card">
            <h4>Queue</h4>
            <div className="status-indicator warning">●</div>
            <span>2 Pending</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .automation-controls {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .controls-header {
          margin-bottom: 30px;
        }

        .controls-header h2 {
          color: #1f2937;
          margin-bottom: 8px;
        }

        .controls-header p {
          color: #6b7280;
          font-size: 16px;
        }

        .control-section {
          margin-bottom: 30px;
        }

        .control-section h3 {
          color: #1f2937;
          margin-bottom: 16px;
          font-size: 18px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .count-badge {
          background: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .quick-action-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .quick-action-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .action-icon {
          font-size: 24px;
          min-width: 32px;
        }

        .action-content {
          flex: 1;
        }

        .action-content h4 {
          margin: 0 0 4px 0;
          color: #1f2937;
          font-size: 14px;
        }

        .action-content p {
          margin: 0;
          color: #6b7280;
          font-size: 12px;
        }

        .action-arrow {
          color: #9ca3af;
          font-size: 18px;
        }

        .suggestions-list {
          space-y: 12px;
        }

        .suggestion-card {
          background: #fff;
          border-radius: 8px;
          padding: 16px;
          border-left: 4px solid #6b7280;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .suggestion-card.high {
          border-left-color: #ef4444;
        }

        .suggestion-card.medium {
          border-left-color: #f59e0b;
        }

        .suggestion-card.low {
          border-left-color: #10b981;
        }

        .suggestion-content {
          flex: 1;
        }

        .suggestion-content h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
        }

        .suggestion-content p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .suggestion-actions {
          display: flex;
          gap: 8px;
        }

        .automations-grid,
        .templates-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .automation-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          transition: all 0.2s;
        }

        .automation-card:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .automation-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;
        }

        .automation-icon {
          font-size: 24px;
          min-width: 32px;
        }

        .automation-info {
          flex: 1;
        }

        .automation-info h4 {
          margin: 0 0 4px 0;
          color: #1f2937;
        }

        .automation-info p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .automation-toggle {
          min-width: 44px;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #3b82f6;
        }

        input:checked + .slider:before {
          transform: translateX(20px);
        }

        .automation-meta {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
        }

        .automation-meta span {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #6b7280;
        }

        .automation-actions {
          display: flex;
          gap: 8px;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
        }

        .status-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .status-card h4 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 14px;
        }

        .status-indicator {
          font-size: 20px;
          margin-bottom: 4px;
        }

        .status-indicator.healthy {
          color: #10b981;
        }

        .status-indicator.warning {
          color: #f59e0b;
        }

        .status-indicator.error {
          color: #ef4444;
        }

        .status-card span {
          color: #6b7280;
          font-size: 12px;
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
      `}</style>
    </div>
  );
};

export default AutomationControls;