/**
 * Writing Assistant API Endpoints
 * Provides endpoints for AI writing assistance functionality
 */

const express = require('express');
const router = express.Router();

// Import AI service components
const WritingAssistant = require('../ai-services/WritingAssistant');
const SmartAutocomplete = require('../ai-services/SmartAutocomplete');
const QualityAnalysisEngine = require('../ai-services/QualityAnalysisEngine');
const TemplateRecommendationEngine = require('../ai-services/TemplateRecommendationEngine');
const RequirementsNLPEngine = require('../precision-engine/RequirementsNLPEngine');

// Initialize services
const writingAssistant = new WritingAssistant();
const smartAutocomplete = new SmartAutocomplete();
const qualityAnalysis = new QualityAnalysisEngine();
const templateEngine = new TemplateRecommendationEngine();
const nlpEngine = new RequirementsNLPEngine();

/**
 * Real-time writing assistance
 * Provides live suggestions as user types
 */
router.post('/real-time', async (req, res) => {
  try {
    const { text, cursorPosition, context, settings } = req.body;

    if (!text || text.length < 3) {
      return res.json({
        success: true,
        result: {
          suggestions: [],
          quickQuality: { score: 0, issues: [], isGood: false },
          templates: { recommendations: [] }
        }
      });
    }

    const result = await writingAssistant.processRealTimeAssistance(
      text,
      cursorPosition,
      {
        ...context,
        userId: req.user?.id,
        sessionId: req.sessionID
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Real-time assistance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to provide real-time assistance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Smart autocomplete suggestions
 * Provides contextual autocomplete suggestions
 */
router.post('/autocomplete', async (req, res) => {
  try {
    const { text, cursorPosition, context } = req.body;

    if (!text || cursorPosition === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Text and cursor position are required'
      });
    }

    const result = await smartAutocomplete.getSuggestions(text, cursorPosition, {
      ...context,
      userId: req.user?.id
    });

    res.json(result);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate autocomplete suggestions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Quality analysis
 * Analyzes writing quality and provides improvement suggestions
 */
router.post('/quality-analysis', async (req, res) => {
  try {
    const { text, options = {} } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text is required for quality analysis'
      });
    }

    const result = await qualityAnalysis.analyzeQuality(text, {
      ...options,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('Quality analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text quality',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Template recommendations
 * Suggests relevant templates based on context
 */
router.post('/template-recommendations', async (req, res) => {
  try {
    const { context = {}, partialText = '' } = req.body;

    const result = await templateEngine.getRecommendations({
      ...context,
      userId: req.user?.id
    }, partialText);

    res.json(result);
  } catch (error) {
    console.error('Template recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate template recommendations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * NLP conversion
 * Converts natural language to structured requirements
 */
router.post('/nlp-converter', async (req, res) => {
  try {
    const { input, options = {} } = req.body;

    if (!input || input.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Input text is required for NLP conversion'
      });
    }

    const result = await nlpEngine.convertToRequirement(input, {
      ...options,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });

    res.json(result);
  } catch (error) {
    console.error('NLP conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert natural language',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Record user feedback
 * Records user interactions for learning and improvement
 */
router.post('/feedback', async (req, res) => {
  try {
    const { suggestion, action, context } = req.body;

    if (!suggestion || !action) {
      return res.status(400).json({
        success: false,
        error: 'Suggestion and action are required'
      });
    }

    const feedbackContext = {
      ...context,
      userId: req.user?.id,
      sessionId: req.sessionID,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent')
    };

    // Record feedback with appropriate service
    if (action === 'accept') {
      // Record acceptance
      if (suggestion.type === 'autocomplete' || suggestion.source === 'autocomplete') {
        smartAutocomplete.recordSuggestionAcceptance(suggestion, feedbackContext);
      } else if (suggestion.type === 'template' || suggestion.source === 'template') {
        templateEngine.recordTemplateUsage(suggestion.templateId || suggestion.id, feedbackContext);
      }
    } else if (action === 'reject') {
      // Record rejection
      if (suggestion.type === 'autocomplete' || suggestion.source === 'autocomplete') {
        smartAutocomplete.recordSuggestionRejection(suggestion, feedbackContext);
      } else if (suggestion.type === 'template' || suggestion.source === 'template') {
        templateEngine.recordTemplateRejection(suggestion.templateId || suggestion.id, feedbackContext);
      }
    }

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  } catch (error) {
    console.error('Feedback recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Get writing assistant metrics
 * Provides performance and usage metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      writingAssistant: writingAssistant.getMetrics(),
      autocomplete: smartAutocomplete.getMetrics(),
      qualityAnalysis: qualityAnalysis.getMetrics(),
      templateEngine: templateEngine.getMetrics(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
});

/**
 * Health check for writing assistant services
 */
router.get('/health', async (req, res) => {
  try {
    const healthChecks = await Promise.all([
      writingAssistant.healthCheck(),
      smartAutocomplete.healthCheck(),
      qualityAnalysis.healthCheck(),
      templateEngine.healthCheck()
    ]);

    const overallHealth = healthChecks.every(check => check.healthy);

    res.json({
      success: true,
      healthy: overallHealth,
      services: {
        writingAssistant: healthChecks[0],
        smartAutocomplete: healthChecks[1],
        qualityAnalysis: healthChecks[2],
        templateEngine: healthChecks[3]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      healthy: false,
      error: 'Health check failed'
    });
  }
});

/**
 * Custom template management
 */
router.post('/templates/custom', async (req, res) => {
  try {
    const { templateData } = req.body;

    if (!templateData || !templateData.name || !templateData.template) {
      return res.status(400).json({
        success: false,
        error: 'Template name and template text are required'
      });
    }

    const templateId = templateEngine.addCustomTemplate(templateData, req.user?.id);

    res.json({
      success: true,
      templateId,
      message: 'Custom template created successfully'
    });
  } catch (error) {
    console.error('Custom template creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create custom template'
    });
  }
});

/**
 * Template search
 */
router.get('/templates/search', async (req, res) => {
  try {
    const { query, category, complexity, domain } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const filters = {};
    if (category) filters.category = category;
    if (complexity) filters.complexity = complexity;
    if (domain) filters.domain = domain;

    const results = templateEngine.searchTemplates(query, filters);

    res.json({
      success: true,
      results,
      query,
      filters
    });
  } catch (error) {
    console.error('Template search error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search templates'
    });
  }
});

/**
 * Template rating
 */
router.post('/templates/:templateId/rate', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be between 1 and 5'
      });
    }

    const success = templateEngine.rateTemplate(templateId, rating, req.user?.id);

    if (success) {
      res.json({
        success: true,
        message: 'Template rated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }
  } catch (error) {
    console.error('Template rating error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to rate template'
    });
  }
});

/**
 * User preferences management
 */
router.post('/preferences', async (req, res) => {
  try {
    const { preferences } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Store user preferences (this would typically go to a database)
    // For now, we'll just acknowledge the request
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

/**
 * Bulk quality analysis
 * Analyzes multiple texts in batch
 */
router.post('/bulk-analysis', async (req, res) => {
  try {
    const { texts, options = {} } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Array of texts is required'
      });
    }

    if (texts.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 50 texts allowed per batch'
      });
    }

    const results = await Promise.all(
      texts.map(async (text, index) => {
        try {
          const analysis = await qualityAnalysis.analyzeQuality(text, {
            ...options,
            userId: req.user?.id,
            batchIndex: index
          });
          return { index, ...analysis };
        } catch (error) {
          return {
            index,
            success: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      results,
      totalTexts: texts.length,
      successfulAnalyses: results.filter(r => r.success).length
    });
  } catch (error) {
    console.error('Bulk analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk analysis'
    });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Writing Assistant API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

module.exports = router;