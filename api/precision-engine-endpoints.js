/**
 * Precision Engine API Endpoints
 * Advanced NLP and validation API for requirements analysis
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// Import precision engine components
const NLPProcessor = require('../precision-engine/NLPProcessor');
const AutoFixEngine = require('../precision-engine/AutoFixEngine');

// Initialize components
const nlpProcessor = new NLPProcessor();
const autoFixEngine = new AutoFixEngine(nlpProcessor);

// Middleware for request validation
const validateAnalysisRequest = (req, res, next) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({
            error: 'Missing or invalid text parameter',
            message: 'Request body must include a "text" field with string content'
        });
    }

    if (text.trim().length === 0) {
        return res.status(400).json({
            error: 'Empty text',
            message: 'Text parameter cannot be empty'
        });
    }

    if (text.length > 10000) {
        return res.status(400).json({
            error: 'Text too long',
            message: 'Text parameter cannot exceed 10,000 characters'
        });
    }

    next();
};

// Error handling middleware
const handleAsyncError = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * POST /api/precision-engine/analyze
 * Analyze requirement text for quality and extract insights
 */
router.post('/analyze', validateAnalysisRequest, handleAsyncError(async (req, res) => {
    const startTime = Date.now();
    const { text, options = {} } = req.body;

    try {
        // Perform NLP analysis
        const analysis = await nlpProcessor.analyzeRequirement(text, {
            includeTerminology: options.includeTerminology !== false,
            includeSemantic: options.includeSemantic !== false,
            customRules: options.customRules || []
        });

        // Generate auto-fixes if requested
        let autoFixes = null;
        if (options.includeAutoFixes !== false) {
            autoFixes = await autoFixEngine.generateAutoFixes(text, analysis);
        }

        // Prepare response
        const response = {
            success: true,
            analysis,
            autoFixes,
            metadata: {
                processingTime: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                textLength: text.length
            }
        };

        // Add performance metrics header
        res.set('X-Processing-Time', `${response.metadata.processingTime}ms`);

        res.json(response);

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}));

/**
 * POST /api/precision-engine/apply-fixes
 * Apply selected auto-fixes to requirement text
 */
router.post('/apply-fixes', handleAsyncError(async (req, res) => {
    const { text, fixes } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({
            error: 'Missing or invalid text parameter'
        });
    }

    if (!fixes || !Array.isArray(fixes)) {
        return res.status(400).json({
            error: 'Missing or invalid fixes parameter'
        });
    }

    try {
        const result = await autoFixEngine.applyAutoFixes(text, fixes);

        // Record fix feedback for statistics
        fixes.forEach(fix => {
            autoFixEngine.recordFeedback(fix.id || 'unknown', true);
        });

        res.json({
            success: result.success,
            originalText: result.originalText,
            fixedText: result.fixedText,
            appliedFixes: result.appliedFixes,
            failedFixes: result.failedFixes,
            metadata: {
                timestamp: new Date().toISOString(),
                fixesApplied: result.appliedFixes.length,
                fixesFailed: result.failedFixes.length
            }
        });

    } catch (error) {
        console.error('Auto-fix error:', error);
        res.status(500).json({
            error: 'Auto-fix failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}));

/**
 * POST /api/precision-engine/batch-analyze
 * Analyze multiple requirements in batch
 */
router.post('/batch-analyze', handleAsyncError(async (req, res) => {
    const { requirements, options = {} } = req.body;

    if (!requirements || !Array.isArray(requirements)) {
        return res.status(400).json({
            error: 'Missing or invalid requirements parameter',
            message: 'Request body must include a "requirements" array'
        });
    }

    if (requirements.length === 0) {
        return res.status(400).json({
            error: 'Empty requirements array'
        });
    }

    if (requirements.length > 50) {
        return res.status(400).json({
            error: 'Too many requirements',
            message: 'Batch analysis is limited to 50 requirements at once'
        });
    }

    try {
        const startTime = Date.now();
        const results = [];

        // Process requirements in parallel with concurrency limit
        const batchSize = 5;
        for (let i = 0; i < requirements.length; i += batchSize) {
            const batch = requirements.slice(i, i + batchSize);
            const batchPromises = batch.map(async (req, index) => {
                const actualIndex = i + index;
                try {
                    const analysis = await nlpProcessor.analyzeRequirement(req.text || req, options);

                    let autoFixes = null;
                    if (options.includeAutoFixes !== false) {
                        autoFixes = await autoFixEngine.generateAutoFixes(req.text || req, analysis);
                    }

                    return {
                        index: actualIndex,
                        id: req.id || `req_${actualIndex}`,
                        success: true,
                        analysis,
                        autoFixes
                    };
                } catch (error) {
                    return {
                        index: actualIndex,
                        id: req.id || `req_${actualIndex}`,
                        success: false,
                        error: error.message
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }

        const processingTime = Date.now() - startTime;

        // Calculate aggregate statistics
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        const averageQuality = successful.length > 0
            ? successful.reduce((sum, r) => sum + (r.analysis?.metrics?.qualityScore || 0), 0) / successful.length
            : 0;

        res.json({
            success: true,
            results,
            summary: {
                total: requirements.length,
                successful: successful.length,
                failed: failed.length,
                averageQualityScore: Math.round(averageQuality),
                processingTime
            },
            metadata: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        });

    } catch (error) {
        console.error('Batch analysis error:', error);
        res.status(500).json({
            error: 'Batch analysis failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
}));

/**
 * GET /api/precision-engine/terminology
 * Get standard terminology database
 */
router.get('/terminology', (req, res) => {
    try {
        const statistics = nlpProcessor.getStatistics();

        res.json({
            success: true,
            terminology: {
                databaseSize: statistics.terminologyDatabaseSize,
                categories: ['technical', 'business', 'custom'],
                version: statistics.version
            },
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Terminology error:', error);
        res.status(500).json({
            error: 'Failed to retrieve terminology',
            message: error.message
        });
    }
});

/**
 * POST /api/precision-engine/terminology
 * Add custom terminology to database
 */
router.post('/terminology', handleAsyncError(async (req, res) => {
    const { standardTerm, variants = [], category = 'custom' } = req.body;

    if (!standardTerm || typeof standardTerm !== 'string') {
        return res.status(400).json({
            error: 'Missing or invalid standardTerm parameter'
        });
    }

    if (!Array.isArray(variants)) {
        return res.status(400).json({
            error: 'Variants must be an array'
        });
    }

    try {
        nlpProcessor.addTerminology(standardTerm, variants, category);

        res.json({
            success: true,
            message: 'Terminology added successfully',
            terminology: {
                standardTerm,
                variants,
                category
            },
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Add terminology error:', error);
        res.status(500).json({
            error: 'Failed to add terminology',
            message: error.message
        });
    }
}));

/**
 * GET /api/precision-engine/statistics
 * Get precision engine statistics and performance metrics
 */
router.get('/statistics', (req, res) => {
    try {
        const nlpStats = nlpProcessor.getStatistics();
        const autoFixStats = autoFixEngine.getStatistics();

        res.json({
            success: true,
            statistics: {
                nlp: nlpStats,
                autoFix: autoFixStats,
                system: {
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version
                }
            },
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Statistics error:', error);
        res.status(500).json({
            error: 'Failed to retrieve statistics',
            message: error.message
        });
    }
});

/**
 * POST /api/precision-engine/feedback
 * Record user feedback on suggestions and fixes
 */
router.post('/feedback', handleAsyncError(async (req, res) => {
    const { fixId, accepted, comments } = req.body;

    if (fixId === undefined) {
        return res.status(400).json({
            error: 'Missing fixId parameter'
        });
    }

    if (typeof accepted !== 'boolean') {
        return res.status(400).json({
            error: 'Missing or invalid accepted parameter (must be boolean)'
        });
    }

    try {
        autoFixEngine.recordFeedback(fixId, accepted);

        // Log feedback for analysis
        console.log('User feedback received:', {
            fixId,
            accepted,
            comments,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Feedback recorded successfully',
            metadata: {
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({
            error: 'Failed to record feedback',
            message: error.message
        });
    }
}));

/**
 * GET /api/precision-engine/health
 * Health check endpoint for monitoring
 */
router.get('/health', (req, res) => {
    try {
        const healthStatus = {
            status: 'healthy',
            components: {
                nlpProcessor: 'operational',
                autoFixEngine: 'operational'
            },
            metadata: {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: '1.0.0'
            }
        };

        res.json(healthStatus);

    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
    console.error('Precision Engine API Error:', error);

    // Handle specific error types
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }

    if (error.name === 'TimeoutError') {
        return res.status(408).json({
            error: 'Request Timeout',
            message: 'Analysis took too long to complete',
            timestamp: new Date().toISOString()
        });
    }

    // Generic error response
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;