/**
 * Smart Document Generator API Routes
 * RESTful API endpoints for advanced document generation with AI
 */

const express = require('express');
const router = express.Router();
const SmartDocumentGenerator = require('../../ai-services/SmartDocumentGenerator');
const AIServiceManager = require('../../ai-services/AIServiceManager');

// Initialize Smart Document Generator
const smartDocGenerator = new SmartDocumentGenerator({
  expansionDepth: 'comprehensive',
  qualityThreshold: 80,
  marketInsights: true,
  templateCaching: true,
  outputFormats: ['markdown', 'html', 'json', 'pdf']
});

/**
 * Get available document types
 */
router.get('/types', async (req, res) => {
  try {
    const types = [
      {
        id: 'requirements',
        name: 'Requirements Document',
        description: 'Comprehensive software requirements specification',
        icon: '📋',
        sections: 6,
        category: 'technical',
        preview: 'Structured requirements with functional, non-functional, and acceptance criteria sections'
      },
      {
        id: 'user-stories',
        name: 'User Stories Collection',
        description: 'Agile user stories with acceptance criteria',
        icon: '👤',
        sections: 5,
        category: 'agile',
        preview: 'Epic overview, personas, user stories, and acceptance criteria'
      },
      {
        id: 'test-cases',
        name: 'Test Case Specification',
        description: 'Comprehensive test case documentation',
        icon: '🧪',
        sections: 5,
        category: 'quality',
        preview: 'Test strategy, scenarios, detailed test cases, and automation strategy'
      },
      {
        id: 'architecture',
        name: 'Architecture Documentation',
        description: 'System architecture and design documentation',
        icon: '🏗️',
        sections: 6,
        category: 'design',
        preview: 'Architecture overview, components, interfaces, deployment, and security'
      },
      {
        id: 'product-spec',
        name: 'Product Specification',
        description: 'Comprehensive product specification and roadmap',
        icon: '🚀',
        sections: 5,
        category: 'product',
        preview: 'Product vision, market analysis, feature specifications, and roadmap'
      },
      {
        id: 'api-documentation',
        name: 'API Documentation',
        description: 'RESTful API documentation with examples',
        icon: '🔗',
        sections: 6,
        category: 'technical',
        preview: 'API overview, authentication, endpoints, examples, and error handling'
      },
      {
        id: 'project-plan',
        name: 'Project Plan',
        description: 'Comprehensive project planning document',
        icon: '📊',
        sections: 6,
        category: 'management',
        preview: 'Project charter, scope, timeline, resources, and risk management'
      }
    ];

    res.json({
      success: true,
      types,
      count: types.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get available templates
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = smartDocGenerator.templateEngine.getAvailableTemplates();

    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get available output formats
 */
router.get('/formats', async (req, res) => {
  try {
    const formats = [
      {
        id: 'markdown',
        name: 'Markdown',
        extension: '.md',
        description: 'Lightweight markup language with rich formatting',
        features: ['tables', 'code-blocks', 'links', 'images']
      },
      {
        id: 'html',
        name: 'HTML',
        extension: '.html',
        description: 'Web-ready HTML with CSS styling',
        features: ['styling', 'interactive-elements', 'responsive-design']
      },
      {
        id: 'json',
        name: 'JSON',
        extension: '.json',
        description: 'Structured data format for API integration',
        features: ['structured-data', 'api-compatible', 'machine-readable']
      },
      {
        id: 'pdf',
        name: 'PDF',
        extension: '.pdf',
        description: 'Professional document format for sharing',
        features: ['print-ready', 'professional-layout', 'universal-format']
      },
      {
        id: 'docx',
        name: 'Word Document',
        extension: '.docx',
        description: 'Microsoft Word compatible document',
        features: ['editable', 'collaborative', 'office-compatible']
      }
    ];

    res.json({
      success: true,
      formats,
      count: formats.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Analyze input content
 */
router.post('/analyze', async (req, res) => {
  try {
    const { input } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Input content is required'
      });
    }

    const analysis = await smartDocGenerator.contextAnalyzer.analyzeInput(input);

    // Generate suggestions based on analysis
    const suggestions = [];

    if (analysis.domain && analysis.domain !== 'general') {
      suggestions.push({
        text: `Focus on ${analysis.domain}-specific requirements`,
        confidence: 0.8,
        type: 'domain'
      });
    }

    if (analysis.complexity === 'high') {
      suggestions.push({
        text: 'Consider breaking into multiple documents',
        confidence: 0.7,
        type: 'structure'
      });
    }

    if (analysis.entities.technologies.length > 0) {
      suggestions.push({
        text: `Include technology stack: ${analysis.entities.technologies.join(', ')}`,
        confidence: 0.9,
        type: 'technical'
      });
    }

    // Suggest document type
    let suggestedType = null;
    let confidence = 0;

    if (input.toLowerCase().includes('requirement') || input.toLowerCase().includes('spec')) {
      suggestedType = 'requirements';
      confidence = 0.85;
    } else if (input.toLowerCase().includes('user story') || input.toLowerCase().includes('epic')) {
      suggestedType = 'user-stories';
      confidence = 0.9;
    } else if (input.toLowerCase().includes('test') || input.toLowerCase().includes('qa')) {
      suggestedType = 'test-cases';
      confidence = 0.8;
    } else if (input.toLowerCase().includes('architecture') || input.toLowerCase().includes('design')) {
      suggestedType = 'architecture';
      confidence = 0.85;
    } else if (input.toLowerCase().includes('api') || input.toLowerCase().includes('endpoint')) {
      suggestedType = 'api-documentation';
      confidence = 0.9;
    }

    res.json({
      success: true,
      context: analysis,
      suggestions,
      suggestedType,
      confidence,
      analysisTime: Date.now()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Suggest templates based on document type and context
 */
router.post('/suggest-templates', async (req, res) => {
  try {
    const { documentType, context } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }

    const allTemplates = smartDocGenerator.templateEngine.getAvailableTemplates();
    const relevantTemplates = allTemplates.filter(template =>
      template.category === documentType
    );

    // Score templates based on context
    const suggestions = relevantTemplates.map(template => ({
      ...template,
      relevanceScore: calculateTemplateRelevance(template, context),
      reason: generateRecommendationReason(template, context)
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 3), // Top 3 suggestions
      count: suggestions.length
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Generate document
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      input,
      documentType,
      context = {},
      options = {},
      formats = ['markdown'],
      selectedTemplate = 'auto'
    } = req.body;

    // Validation
    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Input content is required'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        error: 'Document type is required'
      });
    }

    if (!Array.isArray(formats) || formats.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one output format is required'
      });
    }

    // Prepare generation options
    const generationOptions = {
      type: documentType,
      formats,
      template: selectedTemplate,
      includeTableOfContents: options.includeTableOfContents || false,
      includeExecutiveSummary: options.includeExecutiveSummary || false,
      includeMarketInsights: options.includeMarketInsights || false,
      enableWritingAssistant: options.enableWritingAssistant !== false,
      expansionLevel: options.expansionLevel || 50,
      qualitySpeed: options.qualitySpeed || 50,
      theme: options.theme || 'default',
      responsive: options.responsive !== false,
      ...context
    };

    // Generate document
    const result = await smartDocGenerator.generateDocument(input, generationOptions);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Return results
    res.json({
      success: true,
      result: result.result,
      metadata: {
        generationTime: result.result.metadata.generationTime,
        documentType,
        formats: formats.length,
        qualityScore: result.result.metadata.quality.overallScore,
        sectionsGenerated: result.result.insights.expandedSections,
        wordsGenerated: result.result.metadata.quality.wordCount || 0
      }
    });

  } catch (error) {
    console.error('Document generation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * Generate document variations
 */
router.post('/generate-variations', async (req, res) => {
  try {
    const { input, options = {}, variations = 3 } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input content is required'
      });
    }

    const result = await smartDocGenerator.generateVariations(input, {
      ...options,
      variations
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Quick generation for rapid prototyping
 */
router.post('/quick-generate', async (req, res) => {
  try {
    const { input, type } = req.body;

    if (!input || !type) {
      return res.status(400).json({
        success: false,
        error: 'Input content and document type are required'
      });
    }

    const result = await smartDocGenerator.quickGenerate(input, type);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Enhance existing document
 */
router.post('/enhance', async (req, res) => {
  try {
    const { document, enhancementType = 'comprehensive' } = req.body;

    if (!document) {
      return res.status(400).json({
        success: false,
        error: 'Document content is required'
      });
    }

    const result = await smartDocGenerator.enhanceDocument(document, enhancementType);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get generator metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = smartDocGenerator.getMetrics();

    res.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 */
router.get('/health', async (req, res) => {
  try {
    const health = await smartDocGenerator.healthCheck();

    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper functions
 */
function calculateTemplateRelevance(template, context) {
  let score = 0.5; // Base score

  // Context matching
  if (context.domain && template.name.toLowerCase().includes(context.domain)) {
    score += 0.3;
  }

  if (context.complexity === 'high' && template.sections > 5) {
    score += 0.2;
  }

  if (context.audience && context.audience.includes('technical') &&
      template.category === 'technical') {
    score += 0.2;
  }

  return Math.min(score, 1.0);
}

function generateRecommendationReason(template, context) {
  const reasons = [];

  if (context.domain) {
    reasons.push(`Suitable for ${context.domain} domain`);
  }

  if (context.complexity === 'high') {
    reasons.push('Comprehensive structure for complex requirements');
  }

  if (context.audience) {
    reasons.push(`Appropriate for ${context.audience.join(', ')} audience`);
  }

  return reasons.length > 0 ? reasons.join(', ') : 'General template recommendation';
}

module.exports = router;