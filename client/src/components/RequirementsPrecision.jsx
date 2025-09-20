import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'
import { useFeatures } from '../contexts/FeatureContext'
import { apiService } from '../services/apiService'
import { AlertCircle, CheckCircle, Clock, Zap, FileText, TrendingUp, Target, RefreshCw } from 'lucide-react'
import './RequirementsPrecision.css'

// Custom hook for precision engine features
const useRequirementsPrecision = () => {
  const { isFeatureEnabled, getFeatureConfig } = useFeatures()
  return {
    enabled: isFeatureEnabled('requirementsPrecisionEngine'),
    config: getFeatureConfig('requirementsPrecisionEngine')
  }
}

// Individual validation result component
const ValidationResult = memo(function ValidationResult({ result, onAutoFix }) {
  const [expanded, setExpanded] = useState(false)

  const getSeverityColor = useMemo(() => {
    const colors = {
      critical: '#dc2626',
      high: '#ea580c',
      medium: '#d97706',
      low: '#65a30d'
    }
    return (severity) => colors[severity] || '#6b7280'
  }, [])

  const statusIcon = useMemo(() => {
    if (result.isValid && result.errors.length === 0) {
      return <CheckCircle className="status-icon valid" />
    }
    if (result.errors.length > 0) {
      return <AlertCircle className="status-icon error" />
    }
    return <AlertCircle className="status-icon warning" />
  }, [result.isValid, result.errors.length])

  return (
    <div className={`validation-result ${result.isValid ? 'valid' : 'invalid'}`}>
      <div className="result-header" onClick={() => setExpanded(!expanded)}>
        <div className="result-summary">
          {statusIcon}
          <div className="result-info">
            <h3>{result.documentId || 'Document'}</h3>
            <span className="result-stats">
              Quality: {result.qualityScore}% |
              Errors: {result.errors.length} |
              Warnings: {result.warnings.length}
            </span>
          </div>
        </div>
        <div className="result-actions">
          <span className="processing-time">
            <Clock size={14} />
            {result.processingTime}ms
          </span>
          <button
            className="expand-button"
            title={expanded ? 'Collapse details' : 'Expand details'}
          >
            {expanded ? '−' : '+'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="result-details">
          {result.errors.length > 0 && (
            <div className="issues-section errors">
              <h4>
                <AlertCircle size={16} />
                Errors ({result.errors.length})
              </h4>
              {result.errors.map((error, index) => (
                <div
                  key={index}
                  className="issue-item error"
                  style={{ borderLeftColor: getSeverityColor(error.severity) }}
                >
                  <div className="issue-header">
                    <span className="issue-type">{error.type}</span>
                    <span className={`issue-severity ${error.severity}`}>
                      {error.severity}
                    </span>
                  </div>
                  <p className="issue-message">{error.message}</p>
                  {error.field && (
                    <span className="issue-field">Field: {error.field}</span>
                  )}
                  {error.suggestion && (
                    <div className="issue-suggestion">
                      <strong>Suggestion:</strong> {error.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="issues-section warnings">
              <h4>
                <AlertCircle size={16} />
                Warnings ({result.warnings.length})
              </h4>
              {result.warnings.map((warning, index) => (
                <div
                  key={index}
                  className="issue-item warning"
                  style={{ borderLeftColor: getSeverityColor(warning.severity) }}
                >
                  <div className="issue-header">
                    <span className="issue-type">{warning.type}</span>
                    <span className={`issue-severity ${warning.severity}`}>
                      {warning.severity}
                    </span>
                  </div>
                  <p className="issue-message">{warning.message}</p>
                  {warning.field && (
                    <span className="issue-field">Field: {warning.field}</span>
                  )}
                  {warning.suggestion && (
                    <div className="issue-suggestion">
                      <strong>Suggestion:</strong> {warning.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div className="issues-section suggestions">
              <h4>
                <TrendingUp size={16} />
                Suggestions ({result.suggestions.length})
              </h4>
              {result.suggestions.map((suggestion, index) => (
                <div key={index} className="issue-item suggestion">
                  <div className="issue-header">
                    <span className="issue-type">{suggestion.type}</span>
                  </div>
                  <p className="issue-message">{suggestion.message}</p>
                  {suggestion.suggestion && (
                    <div className="issue-suggestion">
                      <strong>Suggestion:</strong> {suggestion.suggestion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {(result.errors.length > 0 || result.warnings.length > 0) && onAutoFix && (
            <div className="auto-fix-section">
              <button
                className="auto-fix-button"
                onClick={() => onAutoFix(result)}
              >
                <Zap size={16} />
                Generate Auto-Fix Suggestions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

// Workspace validation dashboard
const WorkspaceValidationDashboard = memo(function WorkspaceValidationDashboard() {
  const [validationResults, setValidationResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const runWorkspaceValidation = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/validation/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        setValidationResults(data.workspaceValidation)
      } else {
        setError(data.error || 'Validation failed')
      }
    } catch (err) {
      setError(`Failed to validate workspace: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAutoFix = async (result) => {
    try {
      const response = await fetch('/api/validation/auto-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationResults: result })
      })

      const data = await response.json()

      if (data.success) {
        // Show auto-fix suggestions in a modal or notification
        console.log('Auto-fix suggestions:', data.autoFixSuggestions)
        // TODO: Implement auto-fix UI
      }
    } catch (err) {
      console.error('Auto-fix failed:', err)
    }
  }

  useEffect(() => {
    runWorkspaceValidation()
  }, [runWorkspaceValidation])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runWorkspaceValidation, 30000) // Every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, runWorkspaceValidation])

  if (loading && !validationResults) {
    return (
      <div className="validation-loading">
        <div className="loading-spinner">
          <RefreshCw className="spinning" />
        </div>
        <p>Analyzing workspace requirements...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="validation-error">
        <AlertCircle />
        <h3>Validation Error</h3>
        <p>{error}</p>
        <button onClick={runWorkspaceValidation}>Retry</button>
      </div>
    )
  }

  return (
    <div className="workspace-validation-dashboard">
      <div className="dashboard-header">
        <h2>Workspace Validation Results</h2>
        <div className="dashboard-controls">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button
            className="refresh-button"
            onClick={runWorkspaceValidation}
            disabled={loading}
          >
            <RefreshCw className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {validationResults && (
        <>
          <div className="validation-summary">
            <div className="summary-cards">
              <div className="summary-card">
                <FileText className="card-icon" />
                <div className="card-content">
                  <h3>{validationResults.summary.totalDocuments}</h3>
                  <p>Total Documents</p>
                </div>
              </div>
              <div className="summary-card valid">
                <CheckCircle className="card-icon" />
                <div className="card-content">
                  <h3>{validationResults.summary.validDocuments}</h3>
                  <p>Valid Documents</p>
                </div>
              </div>
              <div className="summary-card invalid">
                <AlertCircle className="card-icon" />
                <div className="card-content">
                  <h3>{validationResults.summary.invalidDocuments}</h3>
                  <p>Invalid Documents</p>
                </div>
              </div>
              <div className="summary-card quality">
                <Target className="card-icon" />
                <div className="card-content">
                  <h3>{Math.round(validationResults.summary.averageQualityScore)}%</h3>
                  <p>Average Quality</p>
                </div>
              </div>
            </div>

            <div className="processing-stats">
              <span>
                Processing Time: {validationResults.summary.processingTime}ms
              </span>
              <span>
                Total Errors: {validationResults.summary.totalErrors}
              </span>
              <span>
                Total Warnings: {validationResults.summary.totalWarnings}
              </span>
            </div>
          </div>

          <div className="validation-results">
            <h3>Document Validation Details</h3>
            {validationResults.results.map((result, index) => (
              <ValidationResult
                key={result.documentId || index}
                result={result}
                onAutoFix={handleAutoFix}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
})

// Main Requirements Precision component
const RequirementsPrecision = memo(function RequirementsPrecision() {
  const { enabled, config } = useRequirementsPrecision()
  const [activeTab, setActiveTab] = useState('workspace')
  const [engineHealth, setEngineHealth] = useState(null)

  const checkEngineHealth = useCallback(async () => {
    if (!enabled) return

    try {
      const res = await fetch('/api/validation/health')
      const data = await res.json()
      if (data.success) {
        setEngineHealth(data.health)
      }
    } catch (err) {
      console.error('Failed to check engine health:', err)
    }
  }, [enabled])

  useEffect(() => {
    checkEngineHealth()
  }, [checkEngineHealth])

  if (!enabled) {
    return (
      <div className="precision-disabled">
        <h2>Requirements Precision Engine</h2>
        <p>
          This feature is currently disabled. Enable it in Feature Management
          to access advanced validation, conflict detection, and quality assurance.
        </p>
      </div>
    )
  }

  return (
    <div className="requirements-precision">
      <div className="precision-header">
        <h1>Requirements Precision Engine</h1>
        <div className="precision-status">
          {engineHealth && (
            <div className="engine-status">
              <div className="status-indicator healthy" />
              <span>Engine Active</span>
              <span className="context-info">
                {engineHealth.contextStats.totalDocuments} documents in context
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="precision-tabs">
        <button
          className={`tab-button ${activeTab === 'workspace' ? 'active' : ''}`}
          onClick={() => setActiveTab('workspace')}
        >
          Workspace Validation
        </button>
        <button
          className={`tab-button ${activeTab === 'realtime' ? 'active' : ''}`}
          onClick={() => setActiveTab('realtime')}
        >
          Real-time Validation
        </button>
        <button
          className={`tab-button ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          Validation Rules
        </button>
      </div>

      <div className="precision-content">
        {activeTab === 'workspace' && <WorkspaceValidationDashboard />}
        {activeTab === 'realtime' && (
          <div className="coming-soon">
            <h3>Real-time Validation</h3>
            <p>Coming soon: Live validation as you type and edit documents.</p>
          </div>
        )}
        {activeTab === 'rules' && (
          <div className="coming-soon">
            <h3>Validation Rules Management</h3>
            <p>Coming soon: Configure and customize validation rules.</p>
          </div>
        )}
      </div>
    </div>
  )
})

export default RequirementsPrecision