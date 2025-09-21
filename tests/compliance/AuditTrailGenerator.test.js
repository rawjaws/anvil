/**
 * Test Suite for AuditTrailGenerator
 * Tests audit trail functionality and compliance documentation
 */

const fs = require('fs-extra');
const path = require('path');
const { AuditTrailGenerator } = require('../../ai-services/AuditTrailGenerator');

describe('AuditTrailGenerator', () => {
  let auditTrail;
  const testAuditPath = path.join(__dirname, '../../test-audit-logs');

  beforeEach(async () => {
    auditTrail = new AuditTrailGenerator({
      auditLogPath: testAuditPath,
      enablePersistentStorage: true,
      maxLogFileSize: 1024 * 1024, // 1MB for testing
      retentionPeriod: 7, // 7 days for testing
      realTimeAlerts: false // Disable for testing
    });
    await auditTrail.initialize();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      await fs.remove(testAuditPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(auditTrail).toBeDefined();
      expect(auditTrail.config.enablePersistentStorage).toBe(true);
      expect(auditTrail.config.auditLogPath).toBe(testAuditPath);
      expect(auditTrail.auditEntries).toBeDefined();
      expect(Array.isArray(auditTrail.auditEntries)).toBe(true);
    });

    test('should create audit directory', async () => {
      const dirExists = await fs.pathExists(testAuditPath);
      expect(dirExists).toBe(true);
    });

    test('should initialize metrics', () => {
      expect(auditTrail.auditMetrics).toBeDefined();
      expect(auditTrail.auditMetrics.totalEntries).toBe(0);
      expect(auditTrail.auditMetrics.entriesThisSession).toBe(0);
    });
  });

  describe('Compliance Check Logging', () => {
    test('should log compliance check entry', async () => {
      const checkData = {
        checkId: 'test-check-001',
        document: { id: 'ENB-001', title: 'Test Document' },
        result: {
          isCompliant: true,
          complianceScore: 85,
          applicableRegulations: ['GDPR', 'HIPAA'],
          violations: [],
          riskLevel: 'Low'
        },
        processingTime: 150
      };

      const entryId = await auditTrail.logComplianceCheck(checkData);

      expect(entryId).toBeDefined();
      expect(auditTrail.auditEntries.length).toBe(1);

      const entry = auditTrail.auditEntries[0];
      expect(entry.type).toBe('compliance_check');
      expect(entry.checkId).toBe('test-check-001');
      expect(entry.documentId).toBe('ENB-001');
      expect(entry.complianceResult.isCompliant).toBe(true);
      expect(entry.complianceResult.complianceScore).toBe(85);
      expect(entry.timestamp).toBeDefined();
    });

    test('should increment metrics on compliance check logging', async () => {
      const checkData = {
        checkId: 'metrics-test-001',
        document: { id: 'ENB-002' },
        result: { isCompliant: false, riskLevel: 'High' },
        processingTime: 200
      };

      await auditTrail.logComplianceCheck(checkData);

      expect(auditTrail.auditMetrics.totalEntries).toBe(1);
      expect(auditTrail.auditMetrics.entriesThisSession).toBe(1);
      expect(auditTrail.auditMetrics.lastEntry).toBeDefined();
    });

    test('should persist compliance check to file', async () => {
      const checkData = {
        checkId: 'persist-test-001',
        document: { id: 'ENB-003' },
        result: { isCompliant: true },
        processingTime: 100
      };

      await auditTrail.logComplianceCheck(checkData);

      // Check if log file was created
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(testAuditPath, `audit-${today}.log`);
      const fileExists = await fs.pathExists(logFile);

      expect(fileExists).toBe(true);

      // Check file content
      const content = await fs.readFile(logFile, 'utf8');
      expect(content.includes('persist-test-001')).toBe(true);
      expect(content.includes('compliance_check')).toBe(true);
    });
  });

  describe('Regulation Detection Logging', () => {
    test('should log regulation detection activity', async () => {
      const detectionData = {
        documentId: 'ENB-004',
        detectedRegulations: ['GDPR', 'ISO27001'],
        criteria: {
          industry: 'technology',
          dataTypes: ['personal'],
          geographicScope: 'EU'
        },
        confidence: 'high'
      };

      const entryId = await auditTrail.logRegulationDetection(detectionData);

      expect(entryId).toBeDefined();
      expect(auditTrail.auditEntries.length).toBe(1);

      const entry = auditTrail.auditEntries[0];
      expect(entry.type).toBe('regulation_detection');
      expect(entry.documentId).toBe('ENB-004');
      expect(entry.detectedRegulations).toEqual(['GDPR', 'ISO27001']);
      expect(entry.detectionCriteria.industry).toBe('technology');
    });
  });

  describe('System Access Logging', () => {
    test('should log system access events', async () => {
      const accessData = {
        userId: 'user-123',
        action: 'compliance_check',
        resource: '/api/compliance/check',
        ipAddress: '192.168.1.1',
        userAgent: 'test-agent',
        sessionId: 'session-456',
        success: true
      };

      const entryId = await auditTrail.logSystemAccess(accessData);

      expect(entryId).toBeDefined();

      const entry = auditTrail.auditEntries[0];
      expect(entry.type).toBe('system_access');
      expect(entry.userId).toBe('user-123');
      expect(entry.action).toBe('compliance_check');
      expect(entry.success).toBe(true);
    });
  });

  describe('Configuration Change Logging', () => {
    test('should log configuration changes', async () => {
      const changeData = {
        userId: 'admin-001',
        component: 'ComplianceEngine',
        changeType: 'configuration_update',
        previousValue: 'responseTimeTarget: 200',
        newValue: 'responseTimeTarget: 150',
        reason: 'Performance optimization',
        approvalId: 'approval-789'
      };

      const entryId = await auditTrail.logConfigurationChange(changeData);

      expect(entryId).toBeDefined();

      const entry = auditTrail.auditEntries[0];
      expect(entry.type).toBe('configuration_change');
      expect(entry.component).toBe('ComplianceEngine');
      expect(entry.changeType).toBe('configuration_update');
      expect(entry.approvalId).toBe('approval-789');
    });
  });

  describe('Compliance Report Generation', () => {
    beforeEach(async () => {
      // Add sample audit entries for report testing
      await auditTrail.logComplianceCheck({
        checkId: 'report-test-001',
        document: { id: 'ENB-REPORT-001' },
        result: {
          isCompliant: true,
          complianceScore: 90,
          applicableRegulations: ['GDPR'],
          violations: [],
          riskLevel: 'Low'
        },
        processingTime: 120
      });

      await auditTrail.logComplianceCheck({
        checkId: 'report-test-002',
        document: { id: 'ENB-REPORT-002' },
        result: {
          isCompliant: false,
          complianceScore: 60,
          applicableRegulations: ['HIPAA'],
          violations: [{ severity: 'high', type: 'missing_encryption' }],
          riskLevel: 'High'
        },
        processingTime: 180
      });

      await auditTrail.logSystemAccess({
        userId: 'user-001',
        action: 'compliance_check',
        success: true
      });
    });

    test('should generate comprehensive compliance report', async () => {
      const report = await auditTrail.generateComplianceReport({
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        endDate: new Date(),
        includeDetails: true
      });

      expect(report).toBeDefined();
      expect(report.reportMetadata).toBeDefined();
      expect(report.reportMetadata.generatedAt).toBeDefined();
      expect(report.reportMetadata.reportId).toBeDefined();
      expect(report.executiveSummary).toBeDefined();
      expect(report.complianceOverview).toBeDefined();
      expect(report.violationSummary).toBeDefined();
      expect(report.riskAssessment).toBeDefined();
      expect(report.systemActivity).toBeDefined();
      expect(report.recommendations).toBeDefined();
    });

    test('should generate executive summary with correct metrics', async () => {
      const report = await auditTrail.generateComplianceReport();

      const summary = report.executiveSummary;
      expect(summary.totalComplianceChecks).toBe(2);
      expect(summary.complianceRate).toBe(50); // 1 out of 2 compliant
      expect(summary.averageComplianceScore).toBe(75); // (90 + 60) / 2
      expect(summary.riskDistribution.High).toBe(1);
      expect(summary.riskDistribution.Low).toBe(1);
    });

    test('should generate compliance overview with regulation analysis', async () => {
      const report = await auditTrail.generateComplianceReport();

      const overview = report.complianceOverview;
      expect(overview.regulationCoverage).toBeDefined();
      expect(overview.regulationCoverage.GDPR).toBe(1);
      expect(overview.regulationCoverage.HIPAA).toBe(1);
      expect(overview.documentTypeAnalysis).toBeDefined();
    });

    test('should generate violation summary', async () => {
      const report = await auditTrail.generateComplianceReport();

      const violations = report.violationSummary;
      expect(violations.totalViolations).toBe(1);
      expect(violations.severityDistribution.high).toBe(1);
      expect(violations.violationsByRegulation.HIPAA).toBe(1);
    });

    test('should generate risk assessment', async () => {
      const report = await auditTrail.generateComplianceReport();

      const risk = report.riskAssessment;
      expect(risk.overallRiskScore).toBeDefined();
      expect(risk.highRiskFindings).toBe(1);
      expect(risk.riskTrends).toBeDefined();
    });

    test('should generate system activity summary', async () => {
      const report = await auditTrail.generateComplianceReport();

      const activity = report.systemActivity;
      expect(activity.totalSystemAccess).toBe(1);
      expect(activity.successfulAccess).toBe(1);
      expect(activity.failedAccess).toBe(0);
      expect(activity.uniqueUsers).toBe(1);
    });

    test('should generate recommendations', async () => {
      const report = await auditTrail.generateComplianceReport();

      const recommendations = report.recommendations;
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);

      // Should have critical recommendation for high-risk violation
      const criticalRec = recommendations.find(r => r.priority === 'Critical');
      expect(criticalRec).toBeDefined();
    });

    test('should save report to file when persistent storage enabled', async () => {
      const report = await auditTrail.generateComplianceReport({}, { format: 'json' });

      // Check if reports directory was created
      const reportsDir = path.join(testAuditPath, 'reports');
      const dirExists = await fs.pathExists(reportsDir);
      expect(dirExists).toBe(true);
    });
  });

  describe('Report Helper Functions', () => {
    test('should generate key findings correctly', () => {
      const entries = [
        { type: 'compliance_check', complianceResult: { isCompliant: true } },
        { type: 'compliance_check', complianceResult: { isCompliant: true } },
        { type: 'compliance_check', complianceResult: { isCompliant: false } }
      ];

      const findings = auditTrail.generateKeyFindings(entries);
      expect(Array.isArray(findings)).toBe(true);
      expect(findings.length).toBeGreaterThan(0);
    });

    test('should generate time series analysis', () => {
      const today = new Date().toISOString().split('T')[0];
      const entries = [
        {
          timestamp: new Date().toISOString(),
          complianceResult: { isCompliant: true }
        },
        {
          timestamp: new Date().toISOString(),
          complianceResult: { isCompliant: false }
        }
      ];

      const timeSeries = auditTrail.generateTimeSeriesAnalysis(entries);
      expect(Array.isArray(timeSeries)).toBe(true);
      expect(timeSeries[0]).toHaveProperty('date');
      expect(timeSeries[0]).toHaveProperty('totalChecks');
      expect(timeSeries[0]).toHaveProperty('compliantChecks');
      expect(timeSeries[0]).toHaveProperty('complianceRate');
    });

    test('should calculate overall risk level correctly', () => {
      const highRiskDistribution = { High: 3, Medium: 1, Low: 0, Minimal: 0 };
      const highRisk = auditTrail.calculateOverallRiskLevel(highRiskDistribution);
      expect(highRisk).toBe('High');

      const mediumRiskDistribution = { High: 0, Medium: 3, Low: 1, Minimal: 0 };
      const mediumRisk = auditTrail.calculateOverallRiskLevel(mediumRiskDistribution);
      expect(mediumRisk).toBe('Medium');

      const lowRiskDistribution = { High: 0, Medium: 1, Low: 2, Minimal: 1 };
      const lowRisk = auditTrail.calculateOverallRiskLevel(lowRiskDistribution);
      expect(lowRisk).toBe('Low');

      const minimalRiskDistribution = { High: 0, Medium: 0, Low: 0, Minimal: 3 };
      const minimalRisk = auditTrail.calculateOverallRiskLevel(minimalRiskDistribution);
      expect(minimalRisk).toBe('Minimal');
    });
  });

  describe('Data Persistence', () => {
    test('should persist audit entries to daily log files', async () => {
      await auditTrail.logComplianceCheck({
        checkId: 'persist-001',
        document: { id: 'ENB-PERSIST' },
        result: { isCompliant: true },
        processingTime: 100
      });

      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(testAuditPath, `audit-${today}.log`);

      const content = await fs.readFile(logFile, 'utf8');
      const lines = content.trim().split('\n');

      expect(lines.length).toBe(1);

      const entry = JSON.parse(lines[0]);
      expect(entry.type).toBe('compliance_check');
      expect(entry.checkId).toBe('persist-001');
    });

    test('should load existing audit data on initialization', async () => {
      // Create a log file with test data
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(testAuditPath, `audit-${today}.log`);

      await fs.ensureDir(path.dirname(logFile));

      const testEntry = {
        id: 'existing-001',
        type: 'compliance_check',
        timestamp: new Date().toISOString(),
        checkId: 'existing-check'
      };

      await fs.writeFile(logFile, JSON.stringify(testEntry) + '\n');

      // Create new audit trail instance to test loading
      const newAuditTrail = new AuditTrailGenerator({
        auditLogPath: testAuditPath,
        enablePersistentStorage: true
      });
      await newAuditTrail.initialize();

      expect(newAuditTrail.auditEntries.length).toBe(1);
      expect(newAuditTrail.auditEntries[0].id).toBe('existing-001');
    });

    test('should update storage metrics', async () => {
      const initialStorage = auditTrail.auditMetrics.storageUsed;

      await auditTrail.logComplianceCheck({
        checkId: 'storage-test',
        document: { id: 'ENB-STORAGE' },
        result: { isCompliant: true },
        processingTime: 50
      });

      expect(auditTrail.auditMetrics.storageUsed).toBeGreaterThan(initialStorage);
    });
  });

  describe('Maintenance and Cleanup', () => {
    test('should start periodic maintenance', () => {
      expect(auditTrail.performMaintenance).toBeDefined();
      expect(typeof auditTrail.performMaintenance).toBe('function');
    });

    test('should optimize memory usage', () => {
      // Add old entries to test cleanup
      const oldEntry = {
        id: 'old-001',
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        type: 'compliance_check'
      };

      auditTrail.auditEntries.push(oldEntry);
      expect(auditTrail.auditEntries.length).toBe(1);

      auditTrail.optimizeMemoryUsage();

      // Old entry should be removed
      expect(auditTrail.auditEntries.length).toBe(0);
    });

    test('should calculate overall risk score', () => {
      const entries = [
        { complianceResult: { riskLevel: 'High' } },
        { complianceResult: { riskLevel: 'Medium' } },
        { complianceResult: { riskLevel: 'Low' } }
      ];

      const riskScore = auditTrail.calculateOverallRiskScore(entries);
      expect(typeof riskScore).toBe('number');
      expect(riskScore).toBeGreaterThanOrEqual(0);
      expect(riskScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Utility Functions', () => {
    test('should generate unique entry IDs', () => {
      const id1 = auditTrail.generateEntryId();
      const id2 = auditTrail.generateEntryId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1.startsWith('audit_')).toBe(true);
    });

    test('should generate unique report IDs', () => {
      const id1 = auditTrail.generateReportId();
      const id2 = auditTrail.generateReportId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1.startsWith('report_')).toBe(true);
    });

    test('should generate checksums for data integrity', () => {
      const data = { test: 'data', value: 123 };
      const checksum = auditTrail.generateChecksum(data);

      expect(checksum).toBeDefined();
      expect(typeof checksum).toBe('string');
      expect(checksum.length).toBe(16);

      // Same data should produce same checksum
      const checksum2 = auditTrail.generateChecksum(data);
      expect(checksum).toBe(checksum2);
    });

    test('should detect document types correctly', () => {
      expect(auditTrail.detectDocumentType({ id: 'CAP-123' })).toBe('capability');
      expect(auditTrail.detectDocumentType({ id: 'ENB-456' })).toBe('enabler');
      expect(auditTrail.detectDocumentType({ functionalRequirements: [] })).toBe('requirements');
      expect(auditTrail.detectDocumentType({ id: 'OTHER-789' })).toBe('unknown');
    });

    test('should provide system information', () => {
      const sysInfo = auditTrail.getSystemInfo();

      expect(sysInfo).toBeDefined();
      expect(sysInfo.timestamp).toBeDefined();
      expect(sysInfo.nodeVersion).toBeDefined();
      expect(sysInfo.platform).toBeDefined();
      expect(sysInfo.pid).toBeDefined();
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should provide audit metrics', () => {
      const metrics = auditTrail.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalEntries).toBeDefined();
      expect(metrics.entriesThisSession).toBeDefined();
      expect(metrics.entriesInMemory).toBeDefined();
      expect(metrics.activeTrails).toBeDefined();
    });

    test('should track metrics correctly', async () => {
      const initialMetrics = auditTrail.getMetrics();

      await auditTrail.logComplianceCheck({
        checkId: 'metrics-test',
        document: { id: 'ENB-METRICS' },
        result: { isCompliant: true },
        processingTime: 100
      });

      const updatedMetrics = auditTrail.getMetrics();

      expect(updatedMetrics.totalEntries).toBe(initialMetrics.totalEntries + 1);
      expect(updatedMetrics.entriesThisSession).toBe(initialMetrics.entriesThisSession + 1);
      expect(updatedMetrics.entriesInMemory).toBe(initialMetrics.entriesInMemory + 1);
    });
  });

  describe('Error Handling', () => {
    test('should handle file system errors gracefully', async () => {
      // Create audit trail with invalid path
      const invalidAuditTrail = new AuditTrailGenerator({
        auditLogPath: '/invalid/path/that/does/not/exist',
        enablePersistentStorage: true
      });

      // Should not throw, but handle gracefully
      await expect(invalidAuditTrail.initialize()).resolves.toBeDefined();
    });

    test('should handle malformed log file data', async () => {
      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(testAuditPath, `audit-${today}.log`);

      await fs.ensureDir(path.dirname(logFile));
      await fs.writeFile(logFile, 'invalid json data\n{"valid": "json"}\n');

      const newAuditTrail = new AuditTrailGenerator({
        auditLogPath: testAuditPath,
        enablePersistentStorage: true
      });

      // Should handle gracefully and only load valid entries
      await newAuditTrail.initialize();
      expect(newAuditTrail.auditEntries.length).toBe(1);
    });

    test('should handle missing optional fields', async () => {
      // Test with minimal data
      const minimalData = {
        checkId: 'minimal-test',
        document: {},
        result: {},
        processingTime: 0
      };

      const entryId = await auditTrail.logComplianceCheck(minimalData);
      expect(entryId).toBeDefined();

      const entry = auditTrail.auditEntries[0];
      expect(entry.documentId).toBe('unknown');
      expect(entry.documentType).toBe('unknown');
    });
  });
});

// Performance Tests
describe('AuditTrailGenerator Performance', () => {
  let auditTrail;
  const testAuditPath = path.join(__dirname, '../../perf-audit-logs');

  beforeEach(async () => {
    auditTrail = new AuditTrailGenerator({
      auditLogPath: testAuditPath,
      enablePersistentStorage: true
    });
    await auditTrail.initialize();
  });

  afterEach(async () => {
    try {
      await fs.remove(testAuditPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  test('should handle high-volume logging efficiently', async () => {
    const startTime = Date.now();
    const logCount = 100;

    const promises = Array.from({ length: logCount }, (_, i) =>
      auditTrail.logComplianceCheck({
        checkId: `perf-test-${i}`,
        document: { id: `ENB-PERF-${i}` },
        result: { isCompliant: i % 2 === 0 },
        processingTime: 100 + i
      })
    );

    await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    const avgTimePerLog = totalTime / logCount;

    expect(auditTrail.auditEntries.length).toBe(logCount);
    expect(avgTimePerLog).toBeLessThan(10); // Should average less than 10ms per log
    expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
  });

  test('should generate reports efficiently for large datasets', async () => {
    // Add many entries for report generation testing
    const entryCount = 50;
    for (let i = 0; i < entryCount; i++) {
      await auditTrail.logComplianceCheck({
        checkId: `report-perf-${i}`,
        document: { id: `ENB-REPORT-PERF-${i}` },
        result: {
          isCompliant: i % 3 !== 0,
          complianceScore: 60 + (i % 40),
          applicableRegulations: i % 2 === 0 ? ['GDPR'] : ['HIPAA'],
          riskLevel: i % 4 === 0 ? 'High' : 'Low'
        },
        processingTime: 100 + i
      });
    }

    const startTime = Date.now();

    const report = await auditTrail.generateComplianceReport({
      includeDetails: true
    });

    const reportTime = Date.now() - startTime;

    expect(report).toBeDefined();
    expect(report.auditTrail.length).toBe(entryCount);
    expect(reportTime).toBeLessThan(1000); // Should generate within 1 second
  });

  test('should maintain performance with memory optimization', async () => {
    // Add entries that exceed memory limit to test cleanup
    const entryCount = 200;

    for (let i = 0; i < entryCount; i++) {
      await auditTrail.logComplianceCheck({
        checkId: `memory-test-${i}`,
        document: { id: `ENB-MEMORY-${i}` },
        result: { isCompliant: true },
        processingTime: 50
      });
    }

    expect(auditTrail.auditEntries.length).toBeLessThanOrEqual(entryCount);
    expect(auditTrail.auditMetrics.totalEntries).toBe(entryCount);
  });
});

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create ComplianceEngine.js with regulatory detection and validation capabilities", "status": "completed", "activeForm": "Creating ComplianceEngine.js with regulatory detection and validation capabilities"}, {"content": "Build RegulatoryDatabase with comprehensive standards knowledge base", "status": "completed", "activeForm": "Building RegulatoryDatabase with comprehensive standards knowledge base"}, {"content": "Implement real-time compliance checking integration with validation engine", "status": "completed", "activeForm": "Implementing real-time compliance checking integration with validation engine"}, {"content": "Create compliance dashboard and reporting system components", "status": "completed", "activeForm": "Creating compliance dashboard and reporting system components"}, {"content": "Build audit trail generation and documentation system", "status": "completed", "activeForm": "Building audit trail generation and documentation system"}, {"content": "Integrate ComplianceEngine with AIServiceManager and existing systems", "status": "completed", "activeForm": "Integrating ComplianceEngine with AIServiceManager and existing systems"}, {"content": "Create comprehensive test suite for all compliance features", "status": "completed", "activeForm": "Creating comprehensive test suite for all compliance features"}]