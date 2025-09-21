/**
 * Compliance Dashboard - Real-time compliance monitoring and management interface
 * Provides comprehensive view of regulatory compliance status across the system
 */

import React, { useState, useEffect, useCallback } from 'react';
import './ComplianceDashboard.css';

const ComplianceDashboard = () => {
  const [complianceData, setComplianceData] = useState({
    overview: null,
    recentChecks: [],
    violations: [],
    metrics: null,
    trends: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedRegulation, setSelectedRegulation] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch compliance data
  const fetchComplianceData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compliance/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeRange: selectedTimeRange,
          regulation: selectedRegulation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch compliance data');
      }

      const data = await response.json();
      setComplianceData(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedTimeRange, selectedRegulation]);

  // Initial load and periodic updates
  useEffect(() => {
    fetchComplianceData();
    const interval = setInterval(fetchComplianceData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchComplianceData]);

  // Generate compliance report
  const generateReport = async (format = 'json') => {
    try {
      const response = await fetch('/api/compliance/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'all',
          format,
          timeRange: selectedTimeRange
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(`Report generation failed: ${err.message}`);
    }
  };

  if (loading && !complianceData.overview) {
    return (
      <div className="compliance-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="compliance-dashboard error">
        <div className="error-message">
          <h3>Error Loading Compliance Data</h3>
          <p>{error}</p>
          <button onClick={fetchComplianceData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="compliance-dashboard">
      <div className="dashboard-header">
        <h1>Compliance Dashboard</h1>
        <div className="dashboard-controls">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <select
            value={selectedRegulation}
            onChange={(e) => setSelectedRegulation(e.target.value)}
            className="regulation-selector"
          >
            <option value="all">All Regulations</option>
            <option value="GDPR">GDPR</option>
            <option value="HIPAA">HIPAA</option>
            <option value="SOX">SOX</option>
            <option value="PCI-DSS">PCI-DSS</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="NIST">NIST</option>
          </select>
          <button
            onClick={() => generateReport('json')}
            className="generate-report-button"
          >
            Generate Report
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'violations' ? 'active' : ''}`}
          onClick={() => setActiveTab('violations')}
        >
          Violations
        </button>
        <button
          className={`tab ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          Trends
        </button>
        <button
          className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Trail
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <ComplianceOverview data={complianceData} />
        )}
        {activeTab === 'violations' && (
          <ViolationsView data={complianceData.violations} />
        )}
        {activeTab === 'trends' && (
          <TrendsView data={complianceData.trends} />
        )}
        {activeTab === 'audit' && (
          <AuditTrailView />
        )}
      </div>
    </div>
  );
};

// Compliance Overview Component
const ComplianceOverview = ({ data }) => {
  if (!data.overview) return <div>No overview data available</div>;

  const { overview, metrics } = data;

  return (
    <div className="compliance-overview">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{overview.complianceRate}%</div>
          <div className="metric-label">Overall Compliance Rate</div>
          <div className={`metric-trend ${overview.complianceRate >= 80 ? 'positive' : 'negative'}`}>
            {overview.complianceRate >= 80 ? '✓ Good' : '⚠ Needs Attention'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{overview.averageComplianceScore}</div>
          <div className="metric-label">Average Compliance Score</div>
          <div className="metric-trend">
            Score out of 100
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{overview.totalComplianceChecks}</div>
          <div className="metric-label">Total Checks</div>
          <div className="metric-trend">
            Last {data.timeRange || '7 days'}
          </div>
        </div>

        <div className="metric-card">
          <div className={`metric-value risk-${overview.overallRiskLevel?.toLowerCase()}`}>
            {overview.overallRiskLevel}
          </div>
          <div className="metric-label">Risk Level</div>
          <div className="metric-trend">
            Current assessment
          </div>
        </div>
      </div>

      <div className="risk-distribution">
        <h3>Risk Distribution</h3>
        <div className="risk-bars">
          {Object.entries(overview.riskDistribution || {}).map(([level, count]) => (
            <div key={level} className="risk-bar">
              <div className="risk-label">{level}</div>
              <div className="risk-bar-container">
                <div
                  className={`risk-bar-fill risk-${level.toLowerCase()}`}
                  style={{
                    width: `${(count / overview.totalComplianceChecks) * 100}%`
                  }}
                ></div>
              </div>
              <div className="risk-count">{count}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="recent-activity">
        <h3>Recent Compliance Checks</h3>
        <div className="activity-list">
          {data.recentChecks?.slice(0, 5).map((check, index) => (
            <div key={index} className="activity-item">
              <div className={`activity-status ${check.isCompliant ? 'compliant' : 'non-compliant'}`}>
                {check.isCompliant ? '✓' : '✗'}
              </div>
              <div className="activity-details">
                <div className="activity-document">{check.documentId}</div>
                <div className="activity-regulations">
                  {check.applicableRegulations?.join(', ')}
                </div>
                <div className="activity-time">{check.timestamp}</div>
              </div>
              <div className="activity-score">{check.complianceScore}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Violations View Component
const ViolationsView = ({ data }) => {
  const [sortBy, setSortBy] = useState('severity');

  if (!data || data.length === 0) {
    return (
      <div className="violations-view empty">
        <div className="empty-state">
          <h3>No Violations Found</h3>
          <p>All compliance checks are passing within the selected time range.</p>
        </div>
      </div>
    );
  }

  const sortedViolations = [...data].sort((a, b) => {
    if (sortBy === 'severity') {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    }
    if (sortBy === 'regulation') {
      return a.regulation.localeCompare(b.regulation);
    }
    if (sortBy === 'timestamp') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }
    return 0;
  });

  return (
    <div className="violations-view">
      <div className="violations-header">
        <h3>Compliance Violations</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sort-selector"
        >
          <option value="severity">Sort by Severity</option>
          <option value="regulation">Sort by Regulation</option>
          <option value="timestamp">Sort by Date</option>
        </select>
      </div>

      <div className="violations-list">
        {sortedViolations.map((violation, index) => (
          <ViolationCard key={index} violation={violation} />
        ))}
      </div>
    </div>
  );
};

// Individual Violation Card
const ViolationCard = ({ violation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`violation-card severity-${violation.severity}`}>
      <div className="violation-header" onClick={() => setExpanded(!expanded)}>
        <div className="violation-main">
          <div className={`severity-badge ${violation.severity}`}>
            {violation.severity.toUpperCase()}
          </div>
          <div className="violation-title">{violation.title}</div>
          <div className="violation-regulation">{violation.regulation}</div>
        </div>
        <div className="violation-meta">
          <div className="violation-timestamp">{violation.timestamp}</div>
          <div className="expand-icon">{expanded ? '▼' : '▶'}</div>
        </div>
      </div>

      {expanded && (
        <div className="violation-details">
          <div className="violation-message">{violation.message}</div>
          {violation.article && (
            <div className="violation-article">
              <strong>Article:</strong> {violation.article}
            </div>
          )}
          {violation.remediation && (
            <div className="violation-remediation">
              <strong>Remediation:</strong> {violation.remediation}
            </div>
          )}
          {violation.auditEvidence && (
            <div className="violation-evidence">
              <strong>Required Evidence:</strong> {violation.auditEvidence}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Trends View Component
const TrendsView = ({ data }) => {
  if (!data) {
    return (
      <div className="trends-view">
        <p>Trend data not available</p>
      </div>
    );
  }

  return (
    <div className="trends-view">
      <h3>Compliance Trends</h3>
      <div className="trends-charts">
        <div className="chart-placeholder">
          <h4>Compliance Rate Over Time</h4>
          <p>Chart visualization would be implemented here using a charting library like D3.js or Chart.js</p>
        </div>
        <div className="chart-placeholder">
          <h4>Violations by Regulation</h4>
          <p>Breakdown of violations by regulatory framework</p>
        </div>
      </div>
    </div>
  );
};

// Audit Trail View Component
const AuditTrailView = () => {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditTrail = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/compliance/audit-trail');
      if (response.ok) {
        const data = await response.json();
        setAuditData(data.entries || []);
      }
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, []);

  return (
    <div className="audit-trail-view">
      <div className="audit-header">
        <h3>Audit Trail</h3>
        <button onClick={fetchAuditTrail} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="audit-entries">
        {auditData.map((entry, index) => (
          <div key={entry.id || index} className="audit-entry">
            <div className="audit-timestamp">{entry.timestamp}</div>
            <div className="audit-type">{entry.type}</div>
            <div className="audit-details">{entry.message || entry.description}</div>
            <div className="audit-user">{entry.userId || 'System'}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComplianceDashboard;