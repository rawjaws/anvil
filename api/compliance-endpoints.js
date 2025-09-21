/**
 * Compliance API Endpoints
 * RESTful API for compliance checking, reporting, and audit trail management
 */

const express = require('express');
const router = express.Router();
const { AIServiceManager } = require('../ai-services/AIServiceManager');

// Initialize AI Service Manager for compliance operations
let aiServiceManager;

const initializeAIServiceManager = () => {
  if (!aiServiceManager) {
    aiServiceManager = new AIServiceManager({
      compliance: {
        realTimeValidation: true,
        responseTimeTarget: 200,
        accuracyTarget: 95,
        enableAuditTrail: true,
        autoDetection: true
      }
    });
  }
  return aiServiceManager;
};

/**
 * Check compliance for a single document
 * POST /api/compliance/check
 */
router.post('/check', async (req, res) => {
  try {
    const { document, context = {} } = req.body;

    if (!document) {
      return res.status(400).json({
        success: false,
        error: 'Document is required'
      });
    }

    const aiManager = initializeAIServiceManager();
    const result = await aiManager.checkCompliance(document, {
      ...context,
      requestId: req.headers['x-request-id'],
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Compliance check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during compliance check',
      details: error.message
    });
  }
});

/**
 * Bulk compliance check for multiple documents
 * POST /api/compliance/bulk-check
 */
router.post('/bulk-check', async (req, res) => {
  try {
    const { documents, context = {} } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Documents array is required and must not be empty'
      });
    }

    if (documents.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 100 documents allowed per bulk check'
      });
    }

    const aiManager = initializeAIServiceManager();
    const result = await aiManager.bulkComplianceCheck(documents, {
      ...context,
      requestId: req.headers['x-request-id'],
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Bulk compliance check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during bulk compliance check',
      details: error.message
    });
  }
});

/**
 * Detect applicable regulations for a document
 * POST /api/compliance/detect-regulations
 */
router.post('/detect-regulations', async (req, res) => {
  try {
    const { document, context = {} } = req.body;

    if (!document) {
      return res.status(400).json({
        success: false,
        error: 'Document is required'
      });
    }

    const aiManager = initializeAIServiceManager();
    const result = await aiManager.detectRegulations(document, {
      ...context,
      requestId: req.headers['x-request-id'],
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Regulation detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during regulation detection',
      details: error.message
    });
  }
});

/**
 * Generate comprehensive compliance report
 * POST /api/compliance/report
 */
router.post('/report', async (req, res) => {
  try {
    const {
      scope = 'all',
      format = 'json',
      timeRange = '30d',
      regulations = [],
      includeDetails = true
    } = req.body;

    // Validate format
    const allowedFormats = ['json', 'csv', 'pdf'];
    if (!allowedFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Allowed formats: ${allowedFormats.join(', ')}`
      });
    }

    const aiManager = initializeAIServiceManager();
    const result = await aiManager.generateComplianceReport(scope, {
      format,
      timeRange,
      regulations,
      includeDetails,
      requestId: req.headers['x-request-id'],
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    // Set appropriate headers based on format
    if (format === 'json') {
      res.json({
        success: true,
        data: result
      });
    } else if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${Date.now()}.csv"`);
      res.send(result.csvData || 'CSV export not implemented');
    } else if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${Date.now()}.pdf"`);
      res.send(result.pdfData || 'PDF export not implemented');
    }

  } catch (error) {
    console.error('Compliance report generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during report generation',
      details: error.message
    });
  }
});

/**
 * Get compliance dashboard data
 * POST /api/compliance/dashboard
 */
router.post('/dashboard', async (req, res) => {
  try {
    const { timeRange = '7d', regulation = 'all' } = req.body;

    const aiManager = initializeAIServiceManager();

    // Get comprehensive dashboard data
    const [overviewReport, auditTrail] = await Promise.all([
      aiManager.generateComplianceReport('all', {
        timeRange,
        regulation: regulation !== 'all' ? [regulation] : [],
        includeDetails: false
      }),
      aiManager.getAuditTrail({
        limit: 10,
        timeRange
      })
    ]);

    // Extract key metrics and format for dashboard
    const dashboardData = {
      overview: {
        complianceRate: overviewReport.executiveSummary?.complianceRate || 0,
        averageComplianceScore: overviewReport.executiveSummary?.averageComplianceScore || 0,
        totalComplianceChecks: overviewReport.executiveSummary?.totalComplianceChecks || 0,
        overallRiskLevel: overviewReport.executiveSummary?.overallRiskLevel || 'Unknown',
        riskDistribution: overviewReport.executiveSummary?.riskDistribution || {},
        keyFindings: overviewReport.executiveSummary?.keyFindings || []
      },
      recentChecks: auditTrail.entries?.filter(entry => entry.type === 'compliance_check').slice(0, 5) || [],
      violations: extractViolations(overviewReport),
      metrics: overviewReport.systemActivity || {},
      trends: generateTrendData(overviewReport),
      timeRange,
      regulation
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching dashboard data',
      details: error.message
    });
  }
});

/**
 * Get audit trail entries
 * GET /api/compliance/audit-trail
 */
router.get('/audit-trail', async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      type = 'all',
      startDate,
      endDate
    } = req.query;

    const aiManager = initializeAIServiceManager();
    const result = await aiManager.getAuditTrail({
      limit: parseInt(limit),
      offset: parseInt(offset),
      type: type !== 'all' ? type : undefined,
      startDate,
      endDate,
      requestId: req.headers['x-request-id'],
      userId: req.user?.id
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching audit trail',
      details: error.message
    });
  }
});

/**
 * Get compliance metrics and statistics
 * GET /api/compliance/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const aiManager = initializeAIServiceManager();

    // Get metrics from compliance service
    const complianceService = aiManager.services.get('compliance');
    if (!complianceService || !complianceService.instance) {
      return res.status(503).json({
        success: false,
        error: 'Compliance service not available'
      });
    }

    const metrics = complianceService.instance.getMetrics();
    const healthCheck = await complianceService.instance.healthCheck();

    res.json({
      success: true,
      data: {
        performance: metrics,
        health: healthCheck,
        serviceInfo: {
          name: complianceService.instance.name,
          version: complianceService.instance.version,
          registeredAt: complianceService.registeredAt,
          isEnabled: complianceService.isEnabled
        }
      }
    });

  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching metrics',
      details: error.message
    });
  }
});

/**
 * Get supported regulations
 * GET /api/compliance/regulations
 */
router.get('/regulations', async (req, res) => {
  try {
    const aiManager = initializeAIServiceManager();
    const complianceService = aiManager.services.get('compliance');

    if (!complianceService || !complianceService.instance) {
      return res.status(503).json({
        success: false,
        error: 'Compliance service not available'
      });
    }

    const regulations = await complianceService.instance.regulatoryDatabase.getSupportedRegulations();
    const stats = complianceService.instance.regulatoryDatabase.getComplianceStatistics();

    res.json({
      success: true,
      data: {
        supportedRegulations: regulations,
        statistics: stats
      }
    });

  } catch (error) {
    console.error('Regulations error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching regulations',
      details: error.message
    });
  }
});

/**
 * Search regulations by keyword
 * GET /api/compliance/regulations/search
 */
router.get('/regulations/search', async (req, res) => {
  try {
    const { q: keyword } = req.query;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search keyword must be at least 2 characters long'
      });
    }

    const aiManager = initializeAIServiceManager();
    const complianceService = aiManager.services.get('compliance');

    if (!complianceService || !complianceService.instance) {
      return res.status(503).json({
        success: false,
        error: 'Compliance service not available'
      });
    }

    const results = await complianceService.instance.regulatoryDatabase.searchRegulations(keyword.trim());

    res.json({
      success: true,
      data: {
        keyword: keyword.trim(),
        results
      }
    });

  } catch (error) {
    console.error('Regulation search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during regulation search',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 * GET /api/compliance/health
 */
router.get('/health', async (req, res) => {
  try {
    const aiManager = initializeAIServiceManager();
    const healthResults = await aiManager.healthCheck();

    const complianceHealth = healthResults.compliance || { healthy: false };

    res.json({
      success: true,
      data: {
        status: complianceHealth.healthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: healthResults
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during health check',
      details: error.message
    });
  }
});

/**
 * Helper functions for data processing
 */

// Extract violations from compliance report
function extractViolations(report) {
  const violations = [];

  if (report.violationSummary && report.auditTrail) {
    // Extract violations from audit trail entries
    report.auditTrail.forEach(entry => {
      if (entry.type === 'compliance_check' && entry.complianceResult && !entry.complianceResult.isCompliant) {
        // Add violation entries
        if (entry.complianceResult.violations) {
          entry.complianceResult.violations.forEach(violation => {
            violations.push({
              ...violation,
              timestamp: entry.timestamp,
              documentId: entry.documentId,
              checkId: entry.checkId
            });
          });
        }
      }
    });
  }

  return violations;
}

// Generate trend data for dashboard
function generateTrendData(report) {
  // This would typically involve more complex time-series analysis
  // For now, return basic trend structure
  return {
    complianceRate: report.complianceOverview?.timeSeriesAnalysis || [],
    violationsByRegulation: report.violationSummary?.violationsByRegulation || {},
    riskTrends: report.riskAssessment?.riskTrends || []
  };
}

/**
 * Middleware for request logging and validation
 */
router.use((req, res, next) => {
  // Log compliance API requests for audit purposes
  console.log(`Compliance API: ${req.method} ${req.path}`, {
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    requestId: req.headers['x-request-id'],
    userAgent: req.headers['user-agent'],
    ip: req.ip
  });

  next();
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  console.error('Compliance API Error:', error);

  res.status(500).json({
    success: false,
    error: 'Internal server error in compliance system',
    requestId: req.headers['x-request-id'],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;