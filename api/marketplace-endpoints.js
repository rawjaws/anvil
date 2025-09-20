/**
 * Marketplace API Endpoints
 * RESTful API for template marketplace functionality
 */

const express = require('express');
const { marketplaceManager } = require('../marketplace/index');

const router = express.Router();

/**
 * Generate AI-powered template
 * POST /api/marketplace/generate
 */
router.post('/generate', async (req, res) => {
    try {
        const options = {
            type: req.body.type || 'capability',
            industry: req.body.industry || 'general',
            category: req.body.category || 'general',
            name: req.body.name,
            description: req.body.description,
            complexity: req.body.complexity || 'medium',
            customRequirements: req.body.customRequirements || [],
            dependencies: req.body.dependencies || {},
            targetAudience: req.body.targetAudience || 'technical'
        };

        const result = await marketplaceManager.generateTemplate(options);

        res.json({
            success: true,
            data: result,
            message: 'Template generated successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Save generated template
 * POST /api/marketplace/templates/save
 */
router.post('/templates/save', async (req, res) => {
    try {
        const { templateId, content, metadata } = req.body;

        if (!templateId || !content) {
            return res.status(400).json({
                success: false,
                error: 'Template ID and content are required'
            });
        }

        const filepath = await marketplaceManager.templateEngine.saveTemplate(templateId, content, metadata);

        res.json({
            success: true,
            data: { filepath, templateId },
            message: 'Template saved successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Load saved template
 * GET /api/marketplace/templates/:templateId
 */
router.get('/templates/:templateId', async (req, res) => {
    try {
        const { templateId } = req.params;
        const result = await marketplaceManager.templateEngine.loadTemplate(templateId);

        res.json({
            success: true,
            data: result,
            message: 'Template loaded successfully'
        });

    } catch (error) {
        res.status(404).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Submit template to marketplace
 * POST /api/marketplace/submit
 */
router.post('/submit', async (req, res) => {
    try {
        const templateData = {
            name: req.body.name,
            description: req.body.description,
            content: req.body.content,
            type: req.body.type,
            category: req.body.category || 'general',
            industry: req.body.industry || 'general',
            complexity: req.body.complexity || 'medium',
            tags: req.body.tags || []
        };

        const authorId = req.body.authorId || 'anonymous';

        const result = await marketplaceManager.submitTemplate(templateData, authorId);

        res.json({
            success: true,
            data: result,
            message: 'Template submitted to marketplace'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Search marketplace templates
 * GET /api/marketplace/search
 */
router.get('/search', async (req, res) => {
    try {
        const query = req.query.q || '';
        const filters = {
            category: req.query.category,
            industry: req.query.industry,
            type: req.query.type,
            complexity: req.query.complexity,
            minRating: parseFloat(req.query.minRating) || undefined,
            featured: req.query.featured === 'true',
            verified: req.query.verified === 'true',
            sortBy: req.query.sortBy || 'relevance',
            page: parseInt(req.query.page) || 1,
            pageSize: parseInt(req.query.pageSize) || 20
        };

        // Remove undefined values
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === '') {
                delete filters[key];
            }
        });

        const results = await marketplaceManager.searchTemplates(query, filters);

        res.json({
            success: true,
            data: results,
            message: 'Search completed successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get template recommendations
 * GET /api/marketplace/recommendations/:userId
 */
router.get('/recommendations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        const recommendations = await marketplaceManager.getRecommendations(userId, {}, limit);

        res.json({
            success: true,
            data: recommendations,
            message: 'Recommendations generated successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Rate a template
 * POST /api/marketplace/templates/:templateId/rate
 */
router.post('/templates/:templateId/rate', async (req, res) => {
    try {
        const { templateId } = req.params;
        const { userId, rating, review } = req.body;

        if (!userId || !rating) {
            return res.status(400).json({
                success: false,
                error: 'User ID and rating are required'
            });
        }

        const result = await marketplaceManager.rateTemplate(templateId, userId, rating, review);

        res.json({
            success: true,
            data: result,
            message: 'Rating submitted successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Download a template
 * GET /api/marketplace/templates/:templateId/download
 */
router.get('/templates/:templateId/download', async (req, res) => {
    try {
        const { templateId } = req.params;
        const userId = req.query.userId || 'anonymous';

        const result = await marketplaceManager.downloadTemplate(templateId, userId);

        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${result.metadata.name.replace(/[^a-zA-Z0-9]/g, '_')}.md"`);

        res.json({
            success: true,
            data: result,
            message: 'Template downloaded successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Add template to favorites
 * POST /api/marketplace/templates/:templateId/favorite
 */
router.post('/templates/:templateId/favorite', async (req, res) => {
    try {
        const { templateId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const result = await marketplaceManager.addToFavorites(templateId, userId);

        res.json({
            success: true,
            data: result,
            message: 'Added to favorites successfully'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get marketplace statistics
 * GET /api/marketplace/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = marketplaceManager.getStats();

        res.json({
            success: true,
            data: stats,
            message: 'Statistics retrieved successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get template categories
 * GET /api/marketplace/categories
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = marketplaceManager.getCategories();

        res.json({
            success: true,
            data: categories,
            message: 'Categories retrieved successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get template recommendations based on current project
 * POST /api/marketplace/smart-recommendations
 */
router.post('/smart-recommendations', async (req, res) => {
    try {
        const userContext = {
            industry: req.body.industry || 'general',
            currentProject: req.body.currentProject || {},
            preferredComplexity: req.body.preferredComplexity || 'medium',
            recentActivity: req.body.recentActivity || []
        };

        const recommendations = await marketplaceManager.getRecommendations('smart-user', userContext, 10);

        res.json({
            success: true,
            data: recommendations,
            message: 'Smart recommendations generated successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Validate template content
 * POST /api/marketplace/validate
 */
router.post('/validate', async (req, res) => {
    try {
        const template = {
            name: req.body.name,
            description: req.body.description,
            content: req.body.content,
            type: req.body.type,
            category: req.body.category
        };

        const validation = await marketplaceManager.validateTemplate(template);

        res.json({
            success: true,
            data: validation,
            message: 'Template validation completed'
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Get template by ID (detailed view)
 * GET /api/marketplace/templates/:templateId/details
 */
router.get('/templates/:templateId/details', async (req, res) => {
    try {
        const { templateId } = req.params;
        const templateDetails = marketplaceManager.getTemplateDetails(templateId);

        res.json({
            success: true,
            data: templateDetails,
            message: 'Template details retrieved successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Health check endpoint
 * GET /api/marketplace/health
 */
router.get('/health', (req, res) => {
    res.json({
        success: true,
        data: marketplaceManager.getHealthStatus(),
        message: 'Marketplace API is healthy'
    });
});

module.exports = router;