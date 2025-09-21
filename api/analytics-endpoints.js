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

const express = require('express');
const ProjectIntelligenceEngine = require('../analytics/engine');
const AnalyticsPerformanceMonitor = require('../analytics/performance-monitor');

const router = express.Router();
const intelligenceEngine = new ProjectIntelligenceEngine();
const performanceMonitor = new AnalyticsPerformanceMonitor();

/**
 * Get comprehensive project intelligence report
 * Includes health metrics, forecasts, patterns, and recommendations
 */
router.get('/intelligence', async (req, res) => {
  const timing = performanceMonitor.startTiming('intelligence-report');
  const requestTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        details: 'Intelligence report generation exceeded 4 seconds'
      });
    }
  }, 4000);

  try {
    const { activeWorkspace } = req;

    if (!activeWorkspace || !activeWorkspace.projectPaths) {
      clearTimeout(requestTimeout);
      return res.status(400).json({
        error: 'No active workspace or project paths configured'
      });
    }

    const reportPromise = intelligenceEngine.generateIntelligenceReport(activeWorkspace.projectPaths);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Intelligence report timeout')), 3500);
    });

    const report = await Promise.race([reportPromise, timeoutPromise]);
    const performance = performanceMonitor.endTiming(timing, intelligenceEngine.analysisCache.size > 0);

    clearTimeout(requestTimeout);
    if (!res.headersSent) {
      res.json({
        success: true,
        data: report,
        performance: {
          duration: performance.duration,
          cacheHit: performance.cacheHit,
          memoryDelta: Math.round(performance.memoryDelta / 1024) // KB
        }
      });
    }
  } catch (error) {
    clearTimeout(requestTimeout);
    performanceMonitor.recordError(error, 'intelligence-report');
    console.error('Error generating intelligence report:', error);

    if (!res.headersSent) {
      const status = error.message === 'Intelligence report timeout' ? 408 : 500;
      res.status(status).json({
        error: status === 408 ? 'Request timeout' : 'Failed to generate intelligence report',
        details: error.message
      });
    }
  }
});

/**
 * Get real-time project metrics
 * Lightweight endpoint for dashboard updates
 */
router.get('/metrics', async (req, res) => {
  const requestTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        details: 'Metrics request exceeded 2 seconds'
      });
    }
  }, 2000);

  try {
    const { activeWorkspace } = req;

    if (!activeWorkspace || !activeWorkspace.projectPaths) {
      clearTimeout(requestTimeout);
      return res.status(400).json({
        error: 'No active workspace or project paths configured'
      });
    }

    const metricsPromise = intelligenceEngine.getProjectMetrics(activeWorkspace.projectPaths);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Metrics timeout')), 1500);
    });

    const metrics = await Promise.race([metricsPromise, timeoutPromise]);

    clearTimeout(requestTimeout);
    if (!res.headersSent) {
      res.json({
        success: true,
        data: metrics
      });
    }
  } catch (error) {
    clearTimeout(requestTimeout);
    console.error('Error getting project metrics:', error);

    if (!res.headersSent) {
      const status = error.message === 'Metrics timeout' ? 408 : 500;
      res.status(status).json({
        error: status === 408 ? 'Request timeout' : 'Failed to get project metrics',
        details: error.message
      });
    }
  }
});

/**
 * Get project health overview
 * Returns health scores and status summaries
 */
router.get('/health', async (req, res) => {
  const requestTimeout = setTimeout(() => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        details: 'Health check exceeded 3 seconds'
      });
    }
  }, 3000);

  try {
    const { activeWorkspace } = req;

    if (!activeWorkspace || !activeWorkspace.projectPaths) {
      clearTimeout(requestTimeout);
      return res.status(400).json({
        error: 'No active workspace or project paths configured'
      });
    }

    const healthPromise = (async () => {
      const documents = await intelligenceEngine.loadProjectDocuments(activeWorkspace.projectPaths);
      return intelligenceEngine.calculateProjectHealth(documents);
    })();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), 2500);
    });

    const health = await Promise.race([healthPromise, timeoutPromise]);

    clearTimeout(requestTimeout);
    if (!res.headersSent) {
      res.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          health
        }
      });
    }
  } catch (error) {
    clearTimeout(requestTimeout);
    console.error('Error getting project health:', error);

    if (!res.headersSent) {
      const status = error.message === 'Health check timeout' ? 408 : 500;
      res.status(status).json({
        error: status === 408 ? 'Request timeout' : 'Failed to get project health',
        details: error.message
      });
    }
  }
});

/**
 * Get timeline forecast
 * Returns predictive timeline analysis and risk assessment
 */
router.get('/forecast', async (req, res) => {
  try {
    const { activeWorkspace } = req;

    if (!activeWorkspace || !activeWorkspace.projectPaths) {
      return res.status(400).json({
        error: 'No active workspace or project paths configured'
      });
    }

    const documents = await intelligenceEngine.loadProjectDocuments(activeWorkspace.projectPaths);
    const forecast = intelligenceEngine.generateTimelineForecast(documents);

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        forecast
      }
    });
  } catch (error) {
    console.error('Error getting timeline forecast:', error);
    res.status(500).json({
      error: 'Failed to get timeline forecast',
      details: error.message
    });
  }
});

/**
 * Get development patterns and anomalies
 * Returns velocity trends, approval patterns, and quality indicators
 */
router.get('/patterns', async (req, res) => {
  try {
    const { activeWorkspace } = req;

    if (!activeWorkspace || !activeWorkspace.projectPaths) {
      return res.status(400).json({
        error: 'No active workspace or project paths configured'
      });
    }

    const documents = await intelligenceEngine.loadProjectDocuments(activeWorkspace.projectPaths);
    const patterns = intelligenceEngine.detectPatterns(documents);

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        patterns
      }
    });
  } catch (error) {
    console.error('Error getting development patterns:', error);
    res.status(500).json({
      error: 'Failed to get development patterns',
      details: error.message
    });
  }
});

/**
 * Get smart recommendations
 * Returns AI-generated recommendations for project improvement
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { activeWorkspace } = req;

    if (!activeWorkspace || !activeWorkspace.projectPaths) {
      return res.status(400).json({
        error: 'No active workspace or project paths configured'
      });
    }

    const documents = await intelligenceEngine.loadProjectDocuments(activeWorkspace.projectPaths);
    const health = intelligenceEngine.calculateProjectHealth(documents);
    const forecast = intelligenceEngine.generateTimelineForecast(documents);
    const patterns = intelligenceEngine.detectPatterns(documents);
    const recommendations = intelligenceEngine.generateRecommendations(health, forecast, patterns);

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        recommendations
      }
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
});

/**
 * Get document analysis
 * Returns detailed analysis of specific documents or document types
 */
router.get('/documents', async (req, res) => {
  try {
    const { activeWorkspace } = req;
    const { type, status, priority } = req.query;

    if (!activeWorkspace || !activeWorkspace.projectPaths) {
      return res.status(400).json({
        error: 'No active workspace or project paths configured'
      });
    }

    const documents = await intelligenceEngine.loadProjectDocuments(activeWorkspace.projectPaths);

    let filteredDocs = [...documents.capabilities, ...documents.enablers];

    // Apply filters
    if (type) {
      filteredDocs = filteredDocs.filter(doc => doc.metadata.type?.toLowerCase() === type.toLowerCase());
    }
    if (status) {
      filteredDocs = filteredDocs.filter(doc => doc.metadata.status?.toLowerCase().includes(status.toLowerCase()));
    }
    if (priority) {
      filteredDocs = filteredDocs.filter(doc => doc.metadata.priority?.toLowerCase() === priority.toLowerCase());
    }

    // Analyze filtered documents
    const analysis = {
      total: filteredDocs.length,
      byStatus: {},
      byPriority: {},
      byOwner: {},
      averageAge: 0,
      recentUpdates: 0
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let totalAge = 0;

    filteredDocs.forEach(doc => {
      // Status analysis
      const status = doc.metadata.status || 'Unknown';
      analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1;

      // Priority analysis
      const priority = doc.metadata.priority || 'Unknown';
      analysis.byPriority[priority] = (analysis.byPriority[priority] || 0) + 1;

      // Owner analysis
      const owner = doc.metadata.owner || 'Unknown';
      analysis.byOwner[owner] = (analysis.byOwner[owner] || 0) + 1;

      // Age analysis
      const age = now - doc.lastModified;
      totalAge += age;

      // Recent updates
      if (doc.lastModified > sevenDaysAgo) {
        analysis.recentUpdates++;
      }
    });

    analysis.averageAge = filteredDocs.length > 0 ?
      Math.round(totalAge / filteredDocs.length / (24 * 60 * 60 * 1000)) : 0;

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        filters: { type, status, priority },
        analysis,
        documents: filteredDocs.map(doc => ({
          filename: doc.filename,
          id: doc.metadata.id,
          name: doc.metadata.name,
          type: doc.metadata.type,
          status: doc.metadata.status,
          priority: doc.metadata.priority,
          owner: doc.metadata.owner,
          lastModified: doc.lastModified,
          requirementCount: doc.requirements.functional.length + doc.requirements.nonFunctional.length
        }))
      }
    });
  } catch (error) {
    console.error('Error getting document analysis:', error);
    res.status(500).json({
      error: 'Failed to get document analysis',
      details: error.message
    });
  }
});

/**
 * Clear analytics cache
 * Forces refresh of all cached analytics data
 */
router.post('/cache/clear', (req, res) => {
  try {
    intelligenceEngine.clearCache();

    res.json({
      success: true,
      message: 'Analytics cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
    res.status(500).json({
      error: 'Failed to clear analytics cache',
      details: error.message
    });
  }
});

/**
 * Get cache status
 * Returns information about current cache state
 */
router.get('/cache/status', (req, res) => {
  try {
    const status = {
      cached: intelligenceEngine.analysisCache.size,
      lastUpdate: intelligenceEngine.lastCacheUpdate,
      timeout: intelligenceEngine.cacheTimeout
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting cache status:', error);
    res.status(500).json({
      error: 'Failed to get cache status',
      details: error.message
    });
  }
});

/**
 * Get performance monitoring statistics
 * Returns detailed analytics engine performance metrics
 */
router.get('/performance', (req, res) => {
  try {
    const detailed = req.query.detailed === 'true';
    const stats = detailed ?
      performanceMonitor.getDetailedAnalysis() :
      performanceMonitor.getPerformanceStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting performance stats:', error);
    res.status(500).json({
      error: 'Failed to get performance statistics',
      details: error.message
    });
  }
});

/**
 * Reset performance monitoring metrics
 * Clears all collected performance data
 */
router.post('/performance/reset', (req, res) => {
  try {
    performanceMonitor.reset();

    res.json({
      success: true,
      message: 'Performance metrics reset successfully'
    });
  } catch (error) {
    console.error('Error resetting performance metrics:', error);
    res.status(500).json({
      error: 'Failed to reset performance metrics',
      details: error.message
    });
  }
});

module.exports = router;