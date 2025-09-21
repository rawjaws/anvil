/**
 * Smart Document Generator for Anvil Phase 5
 * Implements intelligent document generation from natural language with context-awareness
 * Generates requirements, user stories, test cases, architecture docs, and more
 */

const EventEmitter = require('events');
const WritingAssistant = require('./WritingAssistant');
const PreCogMarketEngine = require('./PreCogMarketEngine');
const DocumentTemplateEngine = require('./DocumentTemplateEngine');
const ContentExpansionEngine = require('./ContentExpansionEngine');
const MultiFormatDocumentProcessor = require('./MultiFormatDocumentProcessor');

class SmartDocumentGenerator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    this.name = 'Smart Document Generator';
    this.config = {
      maxGenerationTime: config.maxGenerationTime || 30000, // 30 seconds
      qualityThreshold: config.qualityThreshold || 80,
      expansionDepth: config.expansionDepth || 'comprehensive',
      templateCaching: config.templateCaching !== false,
      marketInsights: config.marketInsights !== false,
      ...config
    };

    // Initialize AI service dependencies
    this.writingAssistant = new WritingAssistant(config.writingAssistant);
    this.preCogEngine = config.marketInsights ? new PreCogMarketEngine.PreCogMarketEngine(config.preCog) : null;

    // Advanced AI engines for document generation
    this.templateEngine = new DocumentTemplateEngine(this.config);
    this.contentExpander = new ContentExpansionEngine(this.config);
    this.multiFormatProcessor = new MultiFormatDocumentProcessor(this.config);

    // Initialize internal helper classes
    this.qualityValidator = new QualityValidator(this.config);
    this.contextAnalyzer = new ContextAnalyzer(this.config);

    // Caching and metrics
    this.generationCache = new Map();
    this.templateCache = new Map();
    this.metrics = {
      totalGenerations: 0,
      successfulGenerations: 0,
      averageGenerationTime: 0,
      qualityScores: [],
      documentTypes: {},
      generationHistory: []
    };

    this.initialize();
  }

  /**
   * Initialize Smart Document Generator
   */
  initialize() {
    this.initializeDocumentTypes();
    this.initializeTemplateLibrary();
    this.initializeContentPatterns();

    this.emit('smart-document-generator-initialized', {
      timestamp: new Date().toISOString(),
      version: this.version,
      supportedTypes: Object.keys(this.documentTypes),
      templatesLoaded: this.templateCache.size
    });
  }

  /**
   * Initialize template library
   */
  initializeTemplateLibrary() {
    // Initialize template cache with basic templates
    this.templateCache.set('basic-template', {
      id: 'basic-template',
      name: 'Basic Template',
      content: 'Basic template content'
    });
  }

  /**
   * Initialize content patterns for intelligent content generation
   */
  initializeContentPatterns() {
    // Initialize content patterns for different document types
    this.contentPatterns = {
      requirements: {
        patterns: ['shall', 'must', 'should'],
        structure: ['overview', 'functional', 'non-functional', 'constraints']
      },
      userStories: {
        patterns: ['as a', 'i want', 'so that'],
        structure: ['epic', 'stories', 'acceptance-criteria']
      },
      testCases: {
        patterns: ['given', 'when', 'then'],
        structure: ['strategy', 'scenarios', 'cases']
      }
    };
  }

  /**
   * Initialize supported document types with their characteristics
   */
  initializeDocumentTypes() {
    this.documentTypes = {
      'requirements': {
        name: 'Requirements Document',
        category: 'technical',
        structure: ['overview', 'functional-requirements', 'non-functional-requirements', 'constraints'],
        templates: ['functional-requirement', 'non-functional-requirement', 'constraint-requirement'],
        expansionRules: {
          minSections: 3,
          maxSections: 8,
          detailLevel: 'high',
          includeExamples: true
        }
      },
      'user-stories': {
        name: 'User Stories',
        category: 'agile',
        structure: ['epic', 'stories', 'acceptance-criteria', 'definition-of-done'],
        templates: ['user-story', 'acceptance-criteria', 'epic'],
        expansionRules: {
          minStories: 5,
          maxStories: 15,
          detailLevel: 'medium',
          includePersonas: true
        }
      },
      'test-cases': {
        name: 'Test Cases',
        category: 'quality',
        structure: ['test-strategy', 'test-scenarios', 'test-cases', 'test-data'],
        templates: ['test-case', 'test-scenario', 'test-strategy'],
        expansionRules: {
          minCases: 10,
          maxCases: 50,
          detailLevel: 'high',
          includeAutomation: true
        }
      },
      'architecture': {
        name: 'Architecture Documentation',
        category: 'design',
        structure: ['overview', 'components', 'interfaces', 'deployment', 'security'],
        templates: ['component-design', 'interface-spec', 'deployment-model'],
        expansionRules: {
          minComponents: 3,
          maxComponents: 12,
          detailLevel: 'high',
          includeDiagrams: true
        }
      },
      'product-spec': {
        name: 'Product Specification',
        category: 'product',
        structure: ['vision', 'features', 'roadmap', 'metrics', 'market-analysis'],
        templates: ['feature-spec', 'roadmap-item', 'metric-definition'],
        expansionRules: {
          minFeatures: 5,
          maxFeatures: 20,
          detailLevel: 'medium',
          includeMarketData: true
        }
      },
      'api-documentation': {
        name: 'API Documentation',
        category: 'technical',
        structure: ['overview', 'authentication', 'endpoints', 'examples', 'sdk'],
        templates: ['endpoint-spec', 'request-response', 'code-example'],
        expansionRules: {
          minEndpoints: 5,
          maxEndpoints: 30,
          detailLevel: 'high',
          includeExamples: true
        }
      },
      'project-plan': {
        name: 'Project Plan',
        category: 'management',
        structure: ['objectives', 'scope', 'timeline', 'resources', 'risks'],
        templates: ['milestone', 'deliverable', 'risk-item'],
        expansionRules: {
          minMilestones: 3,
          maxMilestones: 10,
          detailLevel: 'medium',
          includeGantt: true
        }
      }
    };
  }

  /**
   * Generate complete document from brief input
   */
  async generateDocument(input, options = {}) {
    const startTime = Date.now();
    const generationId = this.generateId();

    try {
      this.metrics.totalGenerations++;

      // Step 1: Analyze input and determine context
      const context = await this.contextAnalyzer.analyzeInput(input, options);

      // Step 2: Determine document type and structure
      const documentType = options.type || await this.determineDocumentType(input, context);
      const documentStructure = this.getDocumentStructure(documentType, context);

      // Step 3: Expand content using AI and templates
      const expandedContent = await this.contentExpander.expandContent(
        input,
        documentType,
        documentStructure,
        context
      );

      // Step 4: Apply templates and formatting
      const formattedDocument = await this.templateEngine.applyTemplates(
        expandedContent,
        documentType,
        context
      );

      // Step 5: Enhance with market insights (if enabled)
      let enhancedDocument = formattedDocument;
      if (this.preCogEngine && this.shouldIncludeMarketInsights(documentType)) {
        enhancedDocument = await this.enhanceWithMarketInsights(
          formattedDocument,
          documentType,
          context
        );
      }

      // Step 6: Quality validation and improvement
      const qualityReport = await this.qualityValidator.validateDocument(
        enhancedDocument,
        documentType
      );

      // Step 7: Apply quality improvements
      const improvedDocument = await this.applyQualityImprovements(
        enhancedDocument,
        qualityReport
      );

      // Step 8: Generate multi-format outputs
      const formats = options.formats || ['markdown'];
      const multiFormatResult = await this.multiFormatProcessor.processDocument(
        improvedDocument,
        formats,
        {
          includeTableOfContents: options.includeTableOfContents,
          includeNavigation: options.includeNavigation,
          theme: options.theme || 'default',
          responsive: options.responsive !== false
        }
      );

      const finalDocument = {
        ...improvedDocument,
        multiFormat: multiFormatResult.success ? multiFormatResult.results : null,
        formatMetadata: multiFormatResult.metadata
      };

      const generationTime = Date.now() - startTime;
      this.updateMetrics(documentType, qualityReport.overallScore, generationTime);

      const result = {
        generationId,
        document: finalDocument,
        metadata: {
          type: documentType,
          structure: documentStructure,
          quality: qualityReport,
          context: context,
          generationTime,
          timestamp: new Date().toISOString(),
          version: this.version
        },
        insights: {
          expandedSections: expandedContent.sections.length,
          templatesApplied: formattedDocument.templatesUsed?.length || 0,
          marketInsightsIncluded: !!enhancedDocument.marketInsights,
          qualityScore: qualityReport.overallScore
        }
      };

      // Cache successful generation
      if (this.config.templateCaching && qualityReport.overallScore >= this.config.qualityThreshold) {
        this.cacheGeneration(input, result);
      }

      this.metrics.successfulGenerations++;
      this.emit('document-generated', {
        generationId,
        type: documentType,
        qualityScore: qualityReport.overallScore,
        generationTime
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      this.emit('document-generation-failed', {
        generationId,
        input: input.substring(0, 100),
        error: error.message,
        generationTime: Date.now() - startTime
      });

      return {
        success: false,
        error: error.message,
        generationId
      };
    }
  }

  /**
   * Generate multiple document variations
   */
  async generateVariations(input, options = {}) {
    const { variations = 3, type, style = 'diverse' } = options;
    const results = [];

    for (let i = 0; i < variations; i++) {
      const variationOptions = {
        ...options,
        variationSeed: i,
        style: this.getVariationStyle(style, i)
      };

      const result = await this.generateDocument(input, variationOptions);
      if (result.success) {
        results.push({
          variation: i + 1,
          style: variationOptions.style,
          document: result.result
        });
      }
    }

    return {
      success: results.length > 0,
      input,
      variations: results,
      count: results.length
    };
  }

  /**
   * Quick generation for rapid prototyping
   */
  async quickGenerate(input, type) {
    const quickOptions = {
      type,
      expansionDepth: 'minimal',
      qualityThreshold: 60,
      skipMarketInsights: true,
      skipQualityValidation: false
    };

    const result = await this.generateDocument(input, quickOptions);

    if (result.success) {
      return {
        success: true,
        document: this.extractQuickSummary(result.result.document),
        metadata: {
          type,
          generationTime: result.result.metadata.generationTime,
          qualityScore: result.result.metadata.quality.overallScore
        }
      };
    }

    return result;
  }

  /**
   * Enhance existing document with AI suggestions
   */
  async enhanceDocument(existingDocument, enhancementType = 'comprehensive') {
    const startTime = Date.now();

    try {
      // Analyze existing document
      const analysis = await this.contextAnalyzer.analyzeExistingDocument(existingDocument);

      // Determine enhancement opportunities
      const opportunities = await this.identifyEnhancementOpportunities(
        existingDocument,
        analysis,
        enhancementType
      );

      // Apply enhancements
      const enhancedDocument = await this.applyEnhancements(
        existingDocument,
        opportunities,
        analysis
      );

      // Validate improvements
      const qualityComparison = await this.compareDocumentQuality(
        existingDocument,
        enhancedDocument
      );

      return {
        success: true,
        originalDocument: existingDocument,
        enhancedDocument,
        enhancements: opportunities,
        qualityImprovement: qualityComparison,
        enhancementTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine document type from input
   */
  async determineDocumentType(input, context) {
    const inputLower = input.toLowerCase();
    const scores = {};

    // Analyze input for document type indicators
    Object.entries(this.documentTypes).forEach(([type, config]) => {
      scores[type] = this.calculateTypeScore(inputLower, config, context, type);
    });

    // Get highest scoring type
    const bestType = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    // Use writing assistant for additional analysis if score is low
    if (scores[bestType] < 0.6) {
      const aiAnalysis = await this.writingAssistant.convertNaturalLanguage(input);
      if (aiAnalysis.success) {
        const suggestedType = this.mapRequirementTypeToDocumentType(
          aiAnalysis.result.requirementType
        );
        if (suggestedType && scores[suggestedType] > 0.4) {
          return suggestedType;
        }
      }
    }

    return bestType;
  }

  /**
   * Calculate type score based on keywords and patterns
   */
  calculateTypeScore(input, typeConfig, context, documentType = null) {
    let score = 0.2; // Base score

    // Keyword matching
    const keywords = this.getTypeKeywords(typeConfig, documentType);
    keywords.forEach(keyword => {
      if (input.includes(keyword)) {
        score += 0.15;
      }
    });

    // Context clues
    if (context.domain && this.isDomainRelevant(context.domain, typeConfig.category)) {
      score += 0.2;
    }

    // Pattern matching
    const patterns = this.getTypePatterns(typeConfig, documentType);
    patterns.forEach(pattern => {
      if (pattern.test(input)) {
        score += 0.1;
      }
    });

    return Math.min(score, 1.0);
  }

  /**
   * Get document structure based on type and context
   */
  getDocumentStructure(documentType, context) {
    const typeConfig = this.documentTypes[documentType];
    if (!typeConfig) {
      throw new Error(`Unsupported document type: ${documentType}`);
    }

    const structure = {
      type: documentType,
      sections: [...typeConfig.structure],
      templates: [...typeConfig.templates],
      expansionRules: { ...typeConfig.expansionRules },
      customizations: this.getContextualCustomizations(typeConfig, context)
    };

    return structure;
  }

  /**
   * Get contextual customizations based on context
   */
  getContextualCustomizations(typeConfig, context) {
    const customizations = {};

    // Domain-specific customizations
    if (context.domain) {
      customizations.domain = context.domain;
      if (context.domain === 'healthcare') {
        customizations.complianceRequirements = ['HIPAA', 'FDA'];
      } else if (context.domain === 'finance') {
        customizations.complianceRequirements = ['SOX', 'PCI-DSS'];
      }
    }

    // Complexity customizations
    if (context.complexity) {
      if (context.complexity === 'high') {
        customizations.additionalSections = ['risk-analysis', 'dependencies'];
      }
    }

    // Audience customizations
    if (context.audience) {
      customizations.audience = context.audience;
      if (context.audience.includes('executive')) {
        customizations.includeExecutiveSummary = true;
      }
    }

    return customizations;
  }

  /**
   * Enhance document with market insights
   */
  async enhanceWithMarketInsights(document, documentType, context) {
    if (!this.preCogEngine) {
      return document;
    }

    try {
      // Generate market intelligence request based on document content
      const marketRequest = this.createMarketIntelligenceRequest(document, context);

      // Get market insights
      const marketInsights = await this.preCogEngine.process(marketRequest);

      if (marketInsights.success) {
        // Integrate insights into document
        return this.integrateMarketInsights(document, marketInsights.result, documentType);
      }
    } catch (error) {
      this.emit('market-insights-failed', {
        documentType,
        error: error.message
      });
    }

    return document;
  }

  /**
   * Create market intelligence request from document
   */
  createMarketIntelligenceRequest(document, context) {
    return {
      type: 'market-precognition',
      market: context.market || 'general',
      timeframe: 180, // 6 months
      analysisDepth: 'standard',
      focusAreas: this.extractMarketFocusAreas(document)
    };
  }

  /**
   * Extract market focus areas from document content
   */
  extractMarketFocusAreas(document) {
    const focusAreas = [];

    // Analyze document content for market-relevant keywords
    const content = JSON.stringify(document).toLowerCase();

    if (content.includes('compet')) focusAreas.push('competitive-analysis');
    if (content.includes('market') || content.includes('customer')) focusAreas.push('market-trends');
    if (content.includes('risk')) focusAreas.push('risk-assessment');
    if (content.includes('growth') || content.includes('scale')) focusAreas.push('growth-potential');

    return focusAreas.length > 0 ? focusAreas : ['general-market'];
  }

  /**
   * Integrate market insights into document
   */
  integrateMarketInsights(document, insights, documentType) {
    const enhancedDocument = { ...document };

    // Add market insights section
    enhancedDocument.marketInsights = {
      overview: insights.intelligence.marketOutlook,
      competitive: insights.intelligence.competitiveLandscape,
      risks: insights.intelligence.riskProfile,
      opportunities: insights.intelligence.contrarianInsights,
      confidence: insights.confidence,
      generatedAt: insights.generatedAt
    };

    // Enhance existing sections with market data
    if (enhancedDocument.sections) {
      enhancedDocument.sections = enhancedDocument.sections.map(section => {
        if (section.type === 'market-analysis' || section.title.toLowerCase().includes('market')) {
          return {
            ...section,
            marketData: insights.intelligence.marketOutlook,
            competitiveAnalysis: insights.intelligence.competitiveLandscape
          };
        }
        return section;
      });
    }

    return enhancedDocument;
  }

  /**
   * Apply quality improvements to document
   */
  async applyQualityImprovements(document, qualityReport) {
    if (qualityReport.overallScore >= this.config.qualityThreshold) {
      return document;
    }

    let improvedDocument = { ...document };

    // Apply writing assistant improvements
    for (const improvement of qualityReport.improvements || []) {
      if (improvement.autoFixable) {
        improvedDocument = await this.applyAutoFix(improvedDocument, improvement);
      }
    }

    // Enhance with writing assistant if quality is still low
    if (qualityReport.overallScore < 70) {
      improvedDocument = await this.enhanceWithWritingAssistant(improvedDocument);
    }

    return improvedDocument;
  }

  /**
   * Apply automatic fixes for common issues
   */
  async applyAutoFix(document, improvement) {
    switch (improvement.type) {
      case 'clarity':
        return this.improveClarityAutomatic(document, improvement);
      case 'structure':
        return this.improveStructureAutomatic(document, improvement);
      case 'completeness':
        return this.improveCompletenessAutomatic(document, improvement);
      default:
        return document;
    }
  }

  /**
   * Enhance document with writing assistant
   */
  async enhanceWithWritingAssistant(document) {
    // Extract text content from document
    const textContent = this.extractTextContent(document);

    // Get writing quality analysis
    const qualityAnalysis = await this.writingAssistant.analyzeWritingQuality(textContent);

    if (qualityAnalysis.success && qualityAnalysis.result.improvements) {
      // Apply improvements to document
      return this.applyWritingImprovements(document, qualityAnalysis.result.improvements);
    }

    return document;
  }

  /**
   * Cache generation for future use
   */
  cacheGeneration(input, result) {
    const cacheKey = this.generateCacheKey(input, result.metadata.type);
    this.generationCache.set(cacheKey, {
      input,
      result,
      timestamp: new Date().toISOString(),
      hits: 0
    });

    // Clean cache if it gets too large
    if (this.generationCache.size > 1000) {
      this.cleanCache();
    }
  }

  /**
   * Check cache for similar generations
   */
  checkCache(input, options = {}) {
    const cacheKey = this.generateCacheKey(input, options.type);
    const cached = this.generationCache.get(cacheKey);

    if (cached) {
      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - new Date(cached.timestamp).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        cached.hits++;
        return cached.result;
      } else {
        this.generationCache.delete(cacheKey);
      }
    }

    return null;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(input, type) {
    const normalized = input.toLowerCase().replace(/\s+/g, ' ').trim();
    return `${type || 'auto'}_${this.hashString(normalized)}`;
  }

  /**
   * Simple string hash function
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Helper methods
   */
  generateId() {
    return `sdg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getTypeKeywords(typeConfig, documentType = null) {
    const keywordMap = {
      'requirements': ['requirement', 'spec', 'specification', 'shall', 'must', 'function', 'functional'],
      'user-stories': ['user story', 'story', 'epic', 'acceptance', 'persona', 'as a'],
      'test-cases': ['test', 'testing', 'qa', 'quality', 'verify', 'validate'],
      'architecture': ['architecture', 'design', 'component', 'system', 'technical'],
      'product-spec': ['product', 'feature', 'roadmap', 'vision', 'strategy'],
      'api-documentation': ['api', 'endpoint', 'rest', 'graphql', 'documentation'],
      'project-plan': ['project', 'plan', 'timeline', 'milestone', 'resource']
    };

    // First try to match by document type directly
    if (documentType && keywordMap[documentType]) {
      return keywordMap[documentType];
    }

    // Fallback to category-based lookup for backward compatibility
    return keywordMap[typeConfig.category] || [];
  }

  getTypePatterns(typeConfig, documentType = null) {
    const patternMap = {
      'requirements': [/the system shall/i, /must be able to/i, /requirement.*:/i, /functional.*requirement/i],
      'user-stories': [/as a.*i want/i, /given.*when.*then/i, /story.*:/i],
      'test-cases': [/test.*case/i, /verify.*that/i, /should.*when/i],
      'architecture': [/component.*diagram/i, /system.*design/i, /architecture.*overview/i],
      'product-spec': [/product.*specification/i, /feature.*spec/i, /product.*vision/i],
      'api-documentation': [/api.*documentation/i, /rest.*api/i, /endpoint.*spec/i],
      'project-plan': [/project.*plan/i, /timeline.*milestone/i, /resource.*allocation/i]
    };

    // First try to match by document type directly
    if (documentType && patternMap[documentType]) {
      return patternMap[documentType];
    }

    // Fallback to category-based lookup
    return patternMap[typeConfig.category] || [];
  }

  isDomainRelevant(domain, category) {
    const relevanceMap = {
      'healthcare': ['technical', 'quality'],
      'finance': ['technical', 'quality', 'design'],
      'ecommerce': ['product', 'agile', 'technical'],
      'saas': ['product', 'technical', 'agile']
    };

    return relevanceMap[domain]?.includes(category) || false;
  }

  mapRequirementTypeToDocumentType(requirementType) {
    const mapping = {
      'functional-requirement': 'requirements',
      'non-functional-requirement': 'requirements',
      'acceptance-criteria': 'user-stories',
      'constraint-requirement': 'requirements'
    };

    return mapping[requirementType];
  }

  shouldIncludeMarketInsights(documentType) {
    return ['product-spec', 'requirements', 'project-plan'].includes(documentType);
  }

  getVariationStyle(baseStyle, variation) {
    const styles = {
      'diverse': ['formal', 'casual', 'technical'][variation % 3],
      'formal': 'formal',
      'technical': 'technical',
      'agile': ['agile', 'lean', 'scrum'][variation % 3]
    };

    return styles[baseStyle] || 'standard';
  }

  extractQuickSummary(document) {
    return {
      title: document.title || 'Generated Document',
      summary: document.summary || document.overview || 'Document generated successfully',
      keyPoints: document.keyPoints || document.sections?.slice(0, 3).map(s => s.title) || [],
      structure: document.sections?.map(s => s.title) || []
    };
  }

  extractTextContent(document) {
    if (typeof document === 'string') return document;

    let text = '';
    if (document.content) text += document.content + ' ';
    if (document.sections) {
      document.sections.forEach(section => {
        if (section.content) text += section.content + ' ';
      });
    }

    return text.trim();
  }

  applyWritingImprovements(document, improvements) {
    // Simplified improvement application
    let improvedDocument = { ...document };

    improvements.forEach(improvement => {
      if (improvement.type === 'clarity' && improvement.autoFixable) {
        // Apply clarity improvements
        improvedDocument.qualityEnhancements = improvedDocument.qualityEnhancements || [];
        improvedDocument.qualityEnhancements.push(improvement);
      }
    });

    return improvedDocument;
  }

  improveClarityAutomatic(document, improvement) {
    // Implement automatic clarity improvements
    return { ...document, clarityEnhanced: true };
  }

  improveStructureAutomatic(document, improvement) {
    // Implement automatic structure improvements
    return { ...document, structureEnhanced: true };
  }

  improveCompletenessAutomatic(document, improvement) {
    // Implement automatic completeness improvements
    return { ...document, completenessEnhanced: true };
  }

  identifyEnhancementOpportunities(document, analysis, enhancementType) {
    // Mock enhancement opportunities identification
    return [
      { type: 'content-expansion', priority: 'medium', description: 'Add more detailed examples' },
      { type: 'structure-improvement', priority: 'low', description: 'Reorganize sections for better flow' }
    ];
  }

  applyEnhancements(document, opportunities, analysis) {
    // Mock enhancement application
    return { ...document, enhanced: true, enhancements: opportunities };
  }

  compareDocumentQuality(original, enhanced) {
    // Mock quality comparison
    return {
      originalScore: 75,
      enhancedScore: 85,
      improvement: 10,
      areas: ['clarity', 'completeness']
    };
  }

  cleanCache() {
    const entries = Array.from(this.generationCache.entries());
    entries.sort((a, b) => a[1].hits - b[1].hits); // Sort by hits (ascending)

    // Remove least used 25%
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.generationCache.delete(entries[i][0]);
    }
  }

  updateMetrics(documentType, qualityScore, generationTime) {
    this.metrics.qualityScores.push(qualityScore);
    this.metrics.documentTypes[documentType] = (this.metrics.documentTypes[documentType] || 0) + 1;

    // Update average generation time
    const totalTime = this.metrics.averageGenerationTime * (this.metrics.totalGenerations - 1) + generationTime;
    this.metrics.averageGenerationTime = totalTime / this.metrics.totalGenerations;

    // Keep only last 100 quality scores
    if (this.metrics.qualityScores.length > 100) {
      this.metrics.qualityScores = this.metrics.qualityScores.slice(-100);
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics() {
    const avgQuality = this.metrics.qualityScores.length > 0 ?
      this.metrics.qualityScores.reduce((sum, score) => sum + score, 0) / this.metrics.qualityScores.length :
      0;

    return {
      version: this.version,
      totalGenerations: this.metrics.totalGenerations,
      successfulGenerations: this.metrics.successfulGenerations,
      successRate: this.metrics.totalGenerations > 0 ?
        (this.metrics.successfulGenerations / this.metrics.totalGenerations) * 100 : 0,
      averageGenerationTime: Math.round(this.metrics.averageGenerationTime),
      averageQualityScore: Math.round(avgQuality),
      documentTypes: this.metrics.documentTypes,
      cacheSize: this.generationCache.size,
      supportedTypes: Object.keys(this.documentTypes),
      templatesLoaded: this.templateCache.size
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const checks = {
        writingAssistant: await this.writingAssistant.healthCheck(),
        preCogEngine: this.preCogEngine ? await this.preCogEngine.healthCheck() : { healthy: true, service: 'disabled' },
        templateEngine: this.templateEngine.healthCheck(),
        contentExpander: this.contentExpander.healthCheck(),
        qualityValidator: this.qualityValidator.healthCheck(),
        contextAnalyzer: this.contextAnalyzer.healthCheck()
      };

      const overallHealth = Object.values(checks).every(check => check.healthy);

      return {
        healthy: overallHealth,
        service: 'smart-document-generator',
        version: this.version,
        components: checks,
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'smart-document-generator',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Process method for AI Service Manager integration
   */
  async process(request) {
    try {
      switch (request.type) {
        case 'generate-document':
          return await this.generateDocument(request.input, request.options);

        case 'generate-variations':
          return await this.generateVariations(request.input, request.options);

        case 'quick-generate':
          return await this.quickGenerate(request.input, request.documentType);

        case 'enhance-document':
          return await this.enhanceDocument(request.document, request.enhancementType);

        case 'get-supported-types':
          return {
            success: true,
            types: Object.keys(this.documentTypes),
            details: this.documentTypes
          };

        default:
          throw new Error(`Unsupported request type: ${request.type}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        requestType: request.type
      };
    }
  }
}

/**
 * Template Engine - Manages document templates and formatting
 */
class TemplateEngine {
  constructor(config) {
    this.config = config;
    this.templates = new Map();
    this.initializeTemplates();
  }

  initializeTemplates() {
    // Initialize with basic templates - will be expanded
    this.templates.set('functional-requirement', {
      pattern: 'The {stakeholder} shall be able to {action} {object} {conditions}.',
      sections: ['overview', 'details', 'acceptance-criteria'],
      formatting: 'formal'
    });

    this.templates.set('user-story', {
      pattern: 'As a {persona}, I want to {goal} so that {benefit}.',
      sections: ['story', 'acceptance-criteria', 'notes'],
      formatting: 'agile'
    });

    this.templates.set('test-case', {
      pattern: 'Given {precondition}, when {action}, then {expected-result}.',
      sections: ['setup', 'execution', 'verification'],
      formatting: 'structured'
    });
  }

  async applyTemplates(content, documentType, context) {
    // Mock template application
    return {
      ...content,
      templatesUsed: ['basic-template'],
      formatted: true,
      documentType
    };
  }

  healthCheck() {
    return {
      healthy: true,
      service: 'template-engine',
      templatesLoaded: this.templates.size
    };
  }
}

/**
 * Content Expander - Expands brief content into comprehensive documents
 */
class ContentExpander {
  constructor(config) {
    this.config = config;
    this.expansionRules = new Map();
    this.initializeExpansionRules();
  }

  initializeExpansionRules() {
    // Initialize expansion rules for different content types
    this.expansionRules.set('requirements', {
      minSections: 5,
      maxSections: 10,
      detailLevel: 'high',
      includeExamples: true
    });
  }

  async expandContent(input, documentType, structure, context) {
    // Mock content expansion
    const sections = structure.sections.map((sectionType, index) => ({
      id: `section_${index}`,
      type: sectionType,
      title: this.generateSectionTitle(sectionType),
      content: this.generateSectionContent(sectionType, input),
      order: index
    }));

    return {
      originalInput: input,
      documentType,
      sections,
      metadata: {
        expansionLevel: this.config.expansionDepth,
        sectionsGenerated: sections.length,
        wordsGenerated: sections.reduce((total, section) =>
          total + (section.content ? section.content.split(' ').length : 0), 0
        )
      }
    };
  }

  generateSectionTitle(sectionType) {
    const titleMap = {
      'overview': 'Overview',
      'functional-requirements': 'Functional Requirements',
      'non-functional-requirements': 'Non-Functional Requirements',
      'constraints': 'Constraints and Limitations',
      'epic': 'Epic Overview',
      'stories': 'User Stories',
      'acceptance-criteria': 'Acceptance Criteria',
      'definition-of-done': 'Definition of Done'
    };

    return titleMap[sectionType] || sectionType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  generateSectionContent(sectionType, input) {
    // Mock content generation based on section type
    const contentTemplates = {
      'overview': `This document provides a comprehensive overview of the requirements derived from: "${input}". The following sections detail the functional and non-functional requirements, constraints, and acceptance criteria.`,
      'functional-requirements': 'The system shall provide the following functional capabilities:\n1. Primary functionality as described\n2. Supporting features and operations\n3. User interaction capabilities',
      'non-functional-requirements': 'The system must meet the following non-functional requirements:\n1. Performance requirements\n2. Security requirements\n3. Scalability requirements',
      'constraints': 'The following constraints apply to this system:\n1. Technical constraints\n2. Business constraints\n3. Regulatory constraints'
    };

    return contentTemplates[sectionType] || `Content for ${sectionType} section based on: ${input}`;
  }

  healthCheck() {
    return {
      healthy: true,
      service: 'content-expander',
      expansionRules: this.expansionRules.size
    };
  }
}

/**
 * Quality Validator - Validates and scores document quality
 */
class QualityValidator {
  constructor(config) {
    this.config = config;
    this.qualityChecks = [
      'completeness',
      'clarity',
      'consistency',
      'structure',
      'specificity'
    ];
  }

  async validateDocument(document, documentType) {
    const scores = {};
    const improvements = [];

    // Perform quality checks
    for (const check of this.qualityChecks) {
      const result = await this.performQualityCheck(document, check);
      scores[check] = result.score;
      if (result.improvements) {
        improvements.push(...result.improvements);
      }
    }

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / this.qualityChecks.length;

    return {
      overallScore: Math.round(overallScore),
      detailedScores: scores,
      improvements,
      qualityGrade: this.getQualityGrade(overallScore),
      validationTimestamp: new Date().toISOString()
    };
  }

  async performQualityCheck(document, checkType) {
    // Mock quality check implementation
    const baseScore = 70 + Math.random() * 25; // 70-95 range

    const result = {
      score: Math.round(baseScore),
      improvements: []
    };

    if (baseScore < 80) {
      result.improvements.push({
        type: checkType,
        severity: baseScore < 70 ? 'high' : 'medium',
        message: `${checkType} could be improved`,
        autoFixable: checkType === 'structure' || checkType === 'consistency'
      });
    }

    return result;
  }

  getQualityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  healthCheck() {
    return {
      healthy: true,
      service: 'quality-validator',
      checksAvailable: this.qualityChecks
    };
  }
}

/**
 * Context Analyzer - Analyzes input context and requirements
 */
class ContextAnalyzer {
  constructor(config) {
    this.config = config;
    this.contextPatterns = this.initializeContextPatterns();
  }

  initializeContextPatterns() {
    return {
      domains: {
        'healthcare': ['patient', 'medical', 'clinical', 'hipaa', 'fda'],
        'finance': ['payment', 'banking', 'financial', 'sox', 'pci'],
        'ecommerce': ['shop', 'cart', 'checkout', 'product', 'customer'],
        'saas': ['subscription', 'tenant', 'api', 'dashboard', 'analytics']
      },
      complexity: {
        'high': ['enterprise', 'complex', 'integration', 'scalable', 'distributed'],
        'medium': ['system', 'application', 'workflow', 'process'],
        'low': ['simple', 'basic', 'minimal', 'quick']
      },
      audience: {
        'technical': ['developer', 'engineer', 'technical', 'api', 'code'],
        'business': ['business', 'stakeholder', 'user', 'customer', 'manager'],
        'executive': ['executive', 'strategy', 'roi', 'business case', 'investment']
      }
    };
  }

  async analyzeInput(input, options = {}) {
    const inputLower = input.toLowerCase();

    const context = {
      originalInput: input,
      length: input.length,
      wordCount: input.split(/\s+/).length,
      domain: this.detectDomain(inputLower),
      complexity: this.detectComplexity(inputLower),
      audience: this.detectAudience(inputLower),
      tone: this.detectTone(inputLower),
      urgency: this.detectUrgency(inputLower),
      scope: this.detectScope(inputLower),
      keywords: this.extractKeywords(inputLower),
      entities: await this.extractEntities(input),
      options
    };

    return context;
  }

  async analyzeExistingDocument(document) {
    const content = this.extractDocumentContent(document);
    return this.analyzeInput(content, { existingDocument: true });
  }

  detectDomain(input) {
    for (const [domain, keywords] of Object.entries(this.contextPatterns.domains)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return domain;
      }
    }
    return 'general';
  }

  detectComplexity(input) {
    for (const [complexity, keywords] of Object.entries(this.contextPatterns.complexity)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        return complexity;
      }
    }
    return 'medium';
  }

  detectAudience(input) {
    const audiences = [];
    for (const [audience, keywords] of Object.entries(this.contextPatterns.audience)) {
      if (keywords.some(keyword => input.includes(keyword))) {
        audiences.push(audience);
      }
    }
    return audiences.length > 0 ? audiences : ['general'];
  }

  detectTone(input) {
    if (input.includes('shall') || input.includes('must')) return 'formal';
    if (input.includes('need') || input.includes('want')) return 'casual';
    if (input.includes('system') || input.includes('technical')) return 'technical';
    return 'neutral';
  }

  detectUrgency(input) {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency'];
    if (urgentWords.some(word => input.includes(word))) return 'high';

    const normalWords = ['soon', 'quickly', 'fast'];
    if (normalWords.some(word => input.includes(word))) return 'medium';

    return 'low';
  }

  detectScope(input) {
    if (input.includes('enterprise') || input.includes('organization')) return 'enterprise';
    if (input.includes('team') || input.includes('department')) return 'team';
    if (input.includes('personal') || input.includes('individual')) return 'individual';
    return 'project';
  }

  extractKeywords(input) {
    const words = input.split(/\W+/).filter(word => word.length > 3);
    const stopWords = ['that', 'this', 'with', 'from', 'they', 'have', 'been', 'will'];
    return words.filter(word => !stopWords.includes(word)).slice(0, 10);
  }

  async extractEntities(input) {
    // Mock entity extraction
    return {
      stakeholders: ['user', 'system', 'admin'],
      actions: ['create', 'read', 'update', 'delete'],
      objects: ['document', 'data', 'report'],
      technologies: ['web', 'mobile', 'api']
    };
  }

  extractDocumentContent(document) {
    if (typeof document === 'string') return document;

    let content = '';
    if (document.title) content += document.title + ' ';
    if (document.content) content += document.content + ' ';
    if (document.sections) {
      document.sections.forEach(section => {
        if (section.title) content += section.title + ' ';
        if (section.content) content += section.content + ' ';
      });
    }

    return content.trim();
  }

  healthCheck() {
    return {
      healthy: true,
      service: 'context-analyzer',
      patternsLoaded: Object.keys(this.contextPatterns).length
    };
  }
}

module.exports = SmartDocumentGenerator;