/**
 * Audit Trail Generator - Comprehensive compliance documentation and audit trail system
 * Generates audit-ready documentation for regulatory compliance
 */

const fs = require('fs-extra');
const path = require('path');

class AuditTrailGenerator {
  constructor(config = {}) {
    this.config = {
      enablePersistentStorage: config.enablePersistentStorage !== false,
      auditLogPath: config.auditLogPath || './audit-logs',
      maxLogFileSize: config.maxLogFileSize || 10485760, // 10MB
      retentionPeriod: config.retentionPeriod || 2555, // 7 years in days
      compressionEnabled: config.compressionEnabled !== false,
      encryptionEnabled: config.encryptionEnabled || false,
      realTimeAlerts: config.realTimeAlerts !== false,
      ...config
    };

    this.auditEntries = [];
    this.activeTrails = new Map();
    this.auditMetrics = {
      totalEntries: 0,
      entriesThisSession: 0,
      lastEntry: null,
      alertsSent: 0,
      storageUsed: 0
    };

    this.initialize();
  }

  /**
   * Initialize audit trail generator
   */
  async initialize() {
    if (this.config.enablePersistentStorage) {
      await this.ensureAuditDirectory();
      await this.loadExistingAuditData();
    }

    this.startPeriodicMaintenance();
  }

  /**
   * Log a compliance check entry
   */
  async logComplianceCheck(checkData) {
    const auditEntry = {
      id: this.generateEntryId(),
      type: 'compliance_check',
      timestamp: new Date().toISOString(),
      checkId: checkData.checkId,
      documentId: checkData.document.id || 'unknown',
      documentType: this.detectDocumentType(checkData.document),
      complianceResult: {
        isCompliant: checkData.result.isCompliant,
        complianceScore: checkData.result.complianceScore,
        applicableRegulations: checkData.result.applicableRegulations,
        violationCount: checkData.result.violations?.length || 0,
        riskLevel: checkData.result.riskLevel
      },
      processingTime: checkData.processingTime,
      systemInfo: this.getSystemInfo(),
      checksumValidation: this.generateChecksum(checkData)
    };

    await this.addAuditEntry(auditEntry);

    // Generate alerts for high-risk findings
    if (checkData.result.riskLevel === 'High' && this.config.realTimeAlerts) {
      await this.generateComplianceAlert(auditEntry, checkData.result);
    }

    return auditEntry.id;
  }

  /**
   * Log regulation detection activity
   */
  async logRegulationDetection(detectionData) {
    const auditEntry = {
      id: this.generateEntryId(),
      type: 'regulation_detection',
      timestamp: new Date().toISOString(),
      documentId: detectionData.documentId,
      detectedRegulations: detectionData.detectedRegulations,
      detectionCriteria: detectionData.criteria,
      confidence: detectionData.confidence || 'unknown',
      systemInfo: this.getSystemInfo(),
      checksumValidation: this.generateChecksum(detectionData)
    };

    await this.addAuditEntry(auditEntry);
    return auditEntry.id;
  }

  /**
   * Log system access and authentication events
   */
  async logSystemAccess(accessData) {
    const auditEntry = {
      id: this.generateEntryId(),
      type: 'system_access',
      timestamp: new Date().toISOString(),
      userId: accessData.userId || 'unknown',
      action: accessData.action,
      resourceAccessed: accessData.resource,
      ipAddress: accessData.ipAddress,
      userAgent: accessData.userAgent,
      sessionId: accessData.sessionId,
      success: accessData.success,
      systemInfo: this.getSystemInfo(),
      checksumValidation: this.generateChecksum(accessData)
    };

    await this.addAuditEntry(auditEntry);
    return auditEntry.id;
  }

  /**
   * Log configuration changes
   */
  async logConfigurationChange(changeData) {
    const auditEntry = {
      id: this.generateEntryId(),
      type: 'configuration_change',
      timestamp: new Date().toISOString(),
      userId: changeData.userId || 'system',
      component: changeData.component,
      changeType: changeData.changeType,
      previousValue: changeData.previousValue,
      newValue: changeData.newValue,
      reason: changeData.reason,
      approvalId: changeData.approvalId,
      systemInfo: this.getSystemInfo(),
      checksumValidation: this.generateChecksum(changeData)
    };

    await this.addAuditEntry(auditEntry);
    return auditEntry.id;
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(reportOptions = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate = new Date(),
      regulations = [],
      includeDetails = true,
      format = 'json'
    } = reportOptions;

    const filteredEntries = this.auditEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      const dateInRange = entryDate >= startDate && entryDate <= endDate;

      if (!dateInRange) return false;

      if (regulations.length > 0 && entry.type === 'compliance_check') {
        return entry.complianceResult.applicableRegulations.some(reg =>
          regulations.includes(reg)
        );
      }

      return true;
    });

    const report = {
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        reportPeriod: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        totalEntries: filteredEntries.length,
        reportId: this.generateReportId(),
        generatedBy: 'Anvil Compliance Engine',
        version: '1.0.0'
      },
      executiveSummary: this.generateExecutiveSummary(filteredEntries),
      complianceOverview: this.generateComplianceOverview(filteredEntries),
      regulationAnalysis: this.generateRegulationAnalysis(filteredEntries),
      violationSummary: this.generateViolationSummary(filteredEntries),
      riskAssessment: this.generateRiskAssessment(filteredEntries),
      systemActivity: this.generateSystemActivitySummary(filteredEntries),
      recommendations: this.generateRecommendations(filteredEntries),
      auditTrail: includeDetails ? filteredEntries : []
    };

    // Save report to file if persistent storage is enabled
    if (this.config.enablePersistentStorage) {
      await this.saveReport(report, format);
    }

    return report;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(entries) {
    const complianceEntries = entries.filter(e => e.type === 'compliance_check');
    const totalChecks = complianceEntries.length;
    const compliantChecks = complianceEntries.filter(e => e.complianceResult.isCompliant).length;
    const averageScore = totalChecks > 0 ?
      complianceEntries.reduce((sum, e) => sum + (e.complianceResult.complianceScore || 0), 0) / totalChecks : 0;

    const riskDistribution = {
      High: complianceEntries.filter(e => e.complianceResult.riskLevel === 'High').length,
      Medium: complianceEntries.filter(e => e.complianceResult.riskLevel === 'Medium').length,
      Low: complianceEntries.filter(e => e.complianceResult.riskLevel === 'Low').length,
      Minimal: complianceEntries.filter(e => e.complianceResult.riskLevel === 'Minimal').length
    };

    return {
      totalComplianceChecks: totalChecks,
      complianceRate: totalChecks > 0 ? Math.round((compliantChecks / totalChecks) * 100) : 0,
      averageComplianceScore: Math.round(averageScore),
      riskDistribution,
      keyFindings: this.generateKeyFindings(entries),
      overallRiskLevel: this.calculateOverallRiskLevel(riskDistribution)
    };
  }

  /**
   * Generate compliance overview
   */
  generateComplianceOverview(entries) {
    const complianceEntries = entries.filter(e => e.type === 'compliance_check');
    const regulationCounts = {};
    const documentTypeCounts = {};

    complianceEntries.forEach(entry => {
      // Count regulations
      entry.complianceResult.applicableRegulations.forEach(reg => {
        regulationCounts[reg] = (regulationCounts[reg] || 0) + 1;
      });

      // Count document types
      documentTypeCounts[entry.documentType] = (documentTypeCounts[entry.documentType] || 0) + 1;
    });

    return {
      regulationCoverage: regulationCounts,
      documentTypeAnalysis: documentTypeCounts,
      timeSeriesAnalysis: this.generateTimeSeriesAnalysis(complianceEntries),
      complianceByRegulation: this.generateComplianceByRegulation(complianceEntries)
    };
  }

  /**
   * Generate regulation analysis
   */
  generateRegulationAnalysis(entries) {
    const regulationMap = {};
    const complianceEntries = entries.filter(e => e.type === 'compliance_check');

    complianceEntries.forEach(entry => {
      entry.complianceResult.applicableRegulations.forEach(regulation => {
        if (!regulationMap[regulation]) {
          regulationMap[regulation] = {
            name: regulation,
            totalChecks: 0,
            compliantChecks: 0,
            violations: 0,
            averageScore: 0,
            scores: []
          };
        }

        const regData = regulationMap[regulation];
        regData.totalChecks++;
        regData.scores.push(entry.complianceResult.complianceScore || 0);

        if (entry.complianceResult.isCompliant) {
          regData.compliantChecks++;
        } else {
          regData.violations += entry.complianceResult.violationCount || 0;
        }
      });
    });

    // Calculate averages
    Object.values(regulationMap).forEach(reg => {
      reg.averageScore = reg.scores.length > 0 ?
        Math.round(reg.scores.reduce((sum, score) => sum + score, 0) / reg.scores.length) : 0;
      reg.complianceRate = reg.totalChecks > 0 ?
        Math.round((reg.compliantChecks / reg.totalChecks) * 100) : 0;
      delete reg.scores; // Remove raw scores from final report
    });

    return Object.values(regulationMap);
  }

  /**
   * Generate violation summary
   */
  generateViolationSummary(entries) {
    const complianceEntries = entries.filter(e => e.type === 'compliance_check');
    const violations = complianceEntries.filter(e => !e.complianceResult.isCompliant);

    const severityDistribution = {
      high: 0,
      medium: 0,
      low: 0
    };

    const violationsByRegulation = {};
    const violationsByDocumentType = {};

    violations.forEach(entry => {
      // Count by risk level (proxy for severity)
      const riskLevel = entry.complianceResult.riskLevel?.toLowerCase();
      if (riskLevel === 'high') severityDistribution.high++;
      else if (riskLevel === 'medium') severityDistribution.medium++;
      else severityDistribution.low++;

      // Count by regulation
      entry.complianceResult.applicableRegulations.forEach(reg => {
        violationsByRegulation[reg] = (violationsByRegulation[reg] || 0) + entry.complianceResult.violationCount;
      });

      // Count by document type
      violationsByDocumentType[entry.documentType] =
        (violationsByDocumentType[entry.documentType] || 0) + entry.complianceResult.violationCount;
    });

    return {
      totalViolations: violations.length,
      severityDistribution,
      violationsByRegulation,
      violationsByDocumentType,
      trendAnalysis: this.generateViolationTrends(violations)
    };
  }

  /**
   * Generate risk assessment
   */
  generateRiskAssessment(entries) {
    const complianceEntries = entries.filter(e => e.type === 'compliance_check');
    const highRiskItems = complianceEntries.filter(e => e.complianceResult.riskLevel === 'High');
    const mediumRiskItems = complianceEntries.filter(e => e.complianceResult.riskLevel === 'Medium');

    return {
      overallRiskScore: this.calculateOverallRiskScore(complianceEntries),
      highRiskFindings: highRiskItems.length,
      mediumRiskFindings: mediumRiskItems.length,
      riskTrends: this.generateRiskTrends(complianceEntries),
      criticalActions: this.generateCriticalActions(highRiskItems),
      riskMitigation: this.generateRiskMitigation(complianceEntries)
    };
  }

  /**
   * Generate system activity summary
   */
  generateSystemActivitySummary(entries) {
    const accessEntries = entries.filter(e => e.type === 'system_access');
    const configEntries = entries.filter(e => e.type === 'configuration_change');

    return {
      totalSystemAccess: accessEntries.length,
      successfulAccess: accessEntries.filter(e => e.success).length,
      failedAccess: accessEntries.filter(e => !e.success).length,
      configurationChanges: configEntries.length,
      uniqueUsers: new Set(accessEntries.map(e => e.userId)).size,
      accessPatterns: this.analyzeAccessPatterns(accessEntries)
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(entries) {
    const recommendations = [];
    const complianceEntries = entries.filter(e => e.type === 'compliance_check');

    // Analyze compliance patterns
    const complianceRate = complianceEntries.length > 0 ?
      complianceEntries.filter(e => e.complianceResult.isCompliant).length / complianceEntries.length : 1;

    if (complianceRate < 0.8) {
      recommendations.push({
        priority: 'High',
        category: 'Compliance',
        recommendation: 'Improve overall compliance rate',
        description: `Current compliance rate is ${Math.round(complianceRate * 100)}%. Target should be >80%.`,
        actionItems: [
          'Review and address recurring violations',
          'Implement additional training',
          'Strengthen compliance procedures'
        ]
      });
    }

    // Check for high-risk patterns
    const highRiskCount = complianceEntries.filter(e => e.complianceResult.riskLevel === 'High').length;
    if (highRiskCount > 0) {
      recommendations.push({
        priority: 'Critical',
        category: 'Risk Management',
        recommendation: 'Address high-risk compliance issues',
        description: `${highRiskCount} high-risk compliance issues identified.`,
        actionItems: [
          'Immediate review of high-risk findings',
          'Implement corrective actions',
          'Increase monitoring frequency'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Helper methods for report generation
   */
  generateKeyFindings(entries) {
    const findings = [];
    const complianceEntries = entries.filter(e => e.type === 'compliance_check');

    if (complianceEntries.length === 0) {
      findings.push('No compliance checks performed in this period');
      return findings;
    }

    const complianceRate = complianceEntries.filter(e => e.complianceResult.isCompliant).length / complianceEntries.length;

    if (complianceRate === 1.0) {
      findings.push('100% compliance rate achieved');
    } else if (complianceRate >= 0.9) {
      findings.push('High compliance rate maintained');
    } else if (complianceRate >= 0.7) {
      findings.push('Moderate compliance rate - improvement needed');
    } else {
      findings.push('Low compliance rate - immediate action required');
    }

    return findings;
  }

  generateTimeSeriesAnalysis(entries) {
    const timeSeriesData = {};

    entries.forEach(entry => {
      const date = entry.timestamp.split('T')[0]; // Get date only
      if (!timeSeriesData[date]) {
        timeSeriesData[date] = { total: 0, compliant: 0 };
      }
      timeSeriesData[date].total++;
      if (entry.complianceResult.isCompliant) {
        timeSeriesData[date].compliant++;
      }
    });

    return Object.entries(timeSeriesData).map(([date, data]) => ({
      date,
      totalChecks: data.total,
      compliantChecks: data.compliant,
      complianceRate: Math.round((data.compliant / data.total) * 100)
    }));
  }

  /**
   * Utility methods
   */
  async addAuditEntry(entry) {
    this.auditEntries.push(entry);
    this.auditMetrics.totalEntries++;
    this.auditMetrics.entriesThisSession++;
    this.auditMetrics.lastEntry = entry.timestamp;

    if (this.config.enablePersistentStorage) {
      await this.persistAuditEntry(entry);
    }

    // Trim in-memory entries if they exceed limit
    if (this.auditEntries.length > 10000) {
      this.auditEntries = this.auditEntries.slice(-5000);
    }
  }

  async persistAuditEntry(entry) {
    const logFile = this.getCurrentLogFile();
    const logEntry = JSON.stringify(entry) + '\n';

    try {
      await fs.appendFile(logFile, logEntry);
      this.auditMetrics.storageUsed += logEntry.length;
    } catch (error) {
      console.error('Error persisting audit entry:', error);
    }
  }

  getCurrentLogFile() {
    const today = new Date().toISOString().split('T')[0];
    return path.join(this.config.auditLogPath, `audit-${today}.log`);
  }

  async ensureAuditDirectory() {
    await fs.ensureDir(this.config.auditLogPath);
  }

  async loadExistingAuditData() {
    // Load recent audit data from files
    try {
      const files = await fs.readdir(this.config.auditLogPath);
      const logFiles = files.filter(f => f.startsWith('audit-') && f.endsWith('.log'));

      // Load the most recent files
      const recentFiles = logFiles.sort().slice(-7); // Last 7 days

      for (const file of recentFiles) {
        const filePath = path.join(this.config.auditLogPath, file);
        const content = await fs.readFile(filePath, 'utf8');
        const lines = content.trim().split('\n').filter(line => line.trim());

        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            this.auditEntries.push(entry);
            this.auditMetrics.totalEntries++;
          } catch (error) {
            console.error('Error parsing audit entry:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error loading existing audit data:', error);
    }
  }

  generateEntryId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateReportId() {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateChecksum(data) {
    // Simple checksum for data integrity
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }

  detectDocumentType(document) {
    if (document.id?.startsWith('CAP-')) return 'capability';
    if (document.id?.startsWith('ENB-')) return 'enabler';
    if (document.functionalRequirements) return 'requirements';
    return 'unknown';
  }

  getSystemInfo() {
    return {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    };
  }

  calculateOverallRiskLevel(riskDistribution) {
    if (riskDistribution.High > 0) return 'High';
    if (riskDistribution.Medium > 2) return 'Medium';
    if (riskDistribution.Medium > 0 || riskDistribution.Low > 0) return 'Low';
    return 'Minimal';
  }

  async saveReport(report, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `compliance-report-${timestamp}.${format}`;
    const filepath = path.join(this.config.auditLogPath, 'reports', filename);

    await fs.ensureDir(path.dirname(filepath));

    if (format === 'json') {
      await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    } else if (format === 'csv') {
      // Convert to CSV format (simplified)
      const csv = this.convertToCSV(report);
      await fs.writeFile(filepath, csv);
    }

    return filepath;
  }

  startPeriodicMaintenance() {
    // Run maintenance every hour
    setInterval(async () => {
      await this.performMaintenance();
    }, 3600000);
  }

  async performMaintenance() {
    // Clean up old log files based on retention period
    if (this.config.enablePersistentStorage) {
      await this.cleanupOldLogs();
    }

    // Optimize in-memory storage
    this.optimizeMemoryUsage();
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.config.auditLogPath);
      const cutoffDate = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('audit-') && file.endsWith('.log')) {
          const filePath = path.join(this.config.auditLogPath, file);
          const stats = await fs.stat(filePath);

          if (stats.mtime < cutoffDate) {
            await fs.remove(filePath);
            console.log(`Cleaned up old audit log: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error during log cleanup:', error);
    }
  }

  optimizeMemoryUsage() {
    // Keep only recent entries in memory
    const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

    this.auditEntries = this.auditEntries.filter(entry =>
      new Date(entry.timestamp) > cutoffTime
    );
  }

  // Additional helper methods for complex analysis
  calculateOverallRiskScore(entries) {
    if (entries.length === 0) return 0;

    const weights = { High: 3, Medium: 2, Low: 1, Minimal: 0 };
    const totalWeight = entries.reduce((sum, entry) =>
      sum + (weights[entry.complianceResult.riskLevel] || 0), 0);

    return Math.round((totalWeight / (entries.length * 3)) * 100);
  }

  generateRiskTrends(entries) {
    // Analyze risk trends over time
    const trends = {};
    entries.forEach(entry => {
      const date = entry.timestamp.split('T')[0];
      if (!trends[date]) {
        trends[date] = { High: 0, Medium: 0, Low: 0, Minimal: 0 };
      }
      trends[date][entry.complianceResult.riskLevel] =
        (trends[date][entry.complianceResult.riskLevel] || 0) + 1;
    });

    return Object.entries(trends).map(([date, risks]) => ({
      date,
      ...risks
    }));
  }

  generateCriticalActions(highRiskItems) {
    return highRiskItems.slice(0, 5).map(item => ({
      documentId: item.documentId,
      timestamp: item.timestamp,
      regulations: item.complianceResult.applicableRegulations,
      action: 'Immediate review and remediation required'
    }));
  }

  generateComplianceByRegulation(complianceEntries) {
    const regulationStats = {};

    complianceEntries.forEach(entry => {
      entry.complianceResult.applicableRegulations.forEach(regulation => {
        if (!regulationStats[regulation]) {
          regulationStats[regulation] = {
            totalChecks: 0,
            compliantChecks: 0,
            complianceRate: 0
          };
        }

        regulationStats[regulation].totalChecks++;
        if (entry.complianceResult.isCompliant) {
          regulationStats[regulation].compliantChecks++;
        }
      });
    });

    // Calculate compliance rates
    Object.keys(regulationStats).forEach(regulation => {
      const stats = regulationStats[regulation];
      stats.complianceRate = stats.totalChecks > 0 ?
        Math.round((stats.compliantChecks / stats.totalChecks) * 100) : 0;
    });

    return regulationStats;
  }

  generateViolationTrends(violations) {
    const trends = {};

    violations.forEach(entry => {
      const date = entry.timestamp.split('T')[0];
      if (!trends[date]) {
        trends[date] = 0;
      }
      trends[date] += entry.complianceResult.violationCount || 1;
    });

    return Object.entries(trends).map(([date, count]) => ({
      date,
      violationCount: count
    }));
  }

  generateRiskMitigation(complianceEntries) {
    const riskCounts = {
      High: complianceEntries.filter(e => e.complianceResult.riskLevel === 'High').length,
      Medium: complianceEntries.filter(e => e.complianceResult.riskLevel === 'Medium').length,
      Low: complianceEntries.filter(e => e.complianceResult.riskLevel === 'Low').length
    };

    const mitigationStrategies = [];

    if (riskCounts.High > 0) {
      mitigationStrategies.push({
        priority: 'Critical',
        strategy: 'Immediate remediation of high-risk findings',
        timeframe: '24-48 hours',
        resources: 'Senior compliance team, legal review'
      });
    }

    if (riskCounts.Medium > 3) {
      mitigationStrategies.push({
        priority: 'High',
        strategy: 'Systematic review of medium-risk items',
        timeframe: '1-2 weeks',
        resources: 'Compliance team, process improvement'
      });
    }

    return {
      riskCounts,
      mitigationStrategies,
      overallRiskLevel: riskCounts.High > 0 ? 'High' :
                        riskCounts.Medium > 2 ? 'Medium' : 'Low'
    };
  }

  analyzeAccessPatterns(accessEntries) {
    const patterns = {
      peakHours: {},
      userActivity: {},
      failurePatterns: {}
    };

    accessEntries.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      patterns.peakHours[hour] = (patterns.peakHours[hour] || 0) + 1;

      patterns.userActivity[entry.userId] = (patterns.userActivity[entry.userId] || 0) + 1;

      if (!entry.success) {
        const failureKey = `${entry.userId}-${entry.action}`;
        patterns.failurePatterns[failureKey] = (patterns.failurePatterns[failureKey] || 0) + 1;
      }
    });

    return patterns;
  }

  convertToCSV(report) {
    // Basic CSV conversion for compliance report
    const headers = ['Date', 'Type', 'Document ID', 'Compliance Status', 'Risk Level', 'Violations'];
    const rows = [headers.join(',')];

    if (report.auditTrail && report.auditTrail.length > 0) {
      report.auditTrail.forEach(entry => {
        if (entry.type === 'compliance_check') {
          const row = [
            entry.timestamp.split('T')[0],
            entry.type,
            entry.documentId || 'unknown',
            entry.complianceResult.isCompliant ? 'Compliant' : 'Non-Compliant',
            entry.complianceResult.riskLevel || 'Unknown',
            entry.complianceResult.violationCount || 0
          ];
          rows.push(row.join(','));
        }
      });
    }

    return rows.join('\n');
  }

  /**
   * Generate compliance alert for high-risk findings
   */
  async generateComplianceAlert(auditEntry, complianceResult) {
    const alert = {
      id: this.generateEntryId(),
      type: 'compliance_alert',
      timestamp: new Date().toISOString(),
      alertLevel: 'high',
      checkId: auditEntry.checkId,
      documentId: auditEntry.documentId,
      riskLevel: complianceResult.riskLevel,
      violations: complianceResult.violations || [],
      applicableRegulations: complianceResult.applicableRegulations || [],
      message: `High-risk compliance issues detected in document ${auditEntry.documentId}`,
      recommendations: complianceResult.recommendations || [],
      requiresImmediateAction: true
    };

    // Log the alert as an audit entry
    await this.addAuditEntry(alert);

    // Update alert metrics
    this.auditMetrics.alertsSent++;

    // In a real implementation, this could trigger notifications, emails, etc.
    console.warn(`COMPLIANCE ALERT: ${alert.message}`, {
      documentId: alert.documentId,
      riskLevel: alert.riskLevel,
      violationCount: alert.violations.length
    });

    return alert;
  }

  getMetrics() {
    return {
      ...this.auditMetrics,
      entriesInMemory: this.auditEntries.length,
      activeTrails: this.activeTrails.size
    };
  }
}

module.exports = { AuditTrailGenerator };