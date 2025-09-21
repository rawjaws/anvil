/**
 * AI Writing Assistant for Anvil Phase 5
 * Provides intelligent requirements writing assistance with NLP, autocomplete, and quality analysis
 */

const EventEmitter = require('events');
const NLPProcessor = require('../precision-engine/NLPProcessor');

class WritingAssistant extends EventEmitter {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    this.name = 'AI Writing Assistant';
    this.config = {
      responseTimeout: config.responseTimeout || 200, // 200ms for autocomplete
      qualityThreshold: config.qualityThreshold || 70,
      maxSuggestions: config.maxSuggestions || 5,
      enableRealTime: config.enableRealTime || true,
      ...config
    };

    this.nlpProcessor = new NLPProcessor();
    this.templateLibrary = new Map();
    this.contextCache = new Map();
    this.processingQueue = [];
    this.isProcessing = false;

    this.metrics = {
      totalRequests: 0,
      autocompleteRequests: 0,
      qualityAnalysisRequests: 0,
      templateRecommendations: 0,
      nlpConversions: 0,
      averageProcessingTime: 0,
      processingTimes: []
    };

    this.initialize();
  }

  /**
   * Initialize Writing Assistant with templates and patterns
   */
  initialize() {
    this.initializeTemplateLibrary();
    this.initializeContextPatterns();

    this.emit('writing-assistant-initialized', {
      timestamp: new Date().toISOString(),
      version: this.version,
      templatesLoaded: this.templateLibrary.size
    });
  }

  /**
   * Initialize template library for different requirement types
   */
  initializeTemplateLibrary() {
    const templates = [
      {
        id: 'functional-requirement',
        name: 'Functional Requirement',
        category: 'functional',
        template: 'The {stakeholder} shall be able to {action} {object} {conditions}.',
        fields: ['stakeholder', 'action', 'object', 'conditions'],
        examples: [
          'The user shall be able to create new documents when authenticated.',
          'The system shall be able to validate input data before processing.'
        ],
        keywords: ['shall', 'must', 'will', 'function', 'capability']
      },
      {
        id: 'non-functional-requirement',
        name: 'Non-Functional Requirement',
        category: 'non-functional',
        template: 'The {component} shall {performance_criteria} within {timeframe} under {conditions}.',
        fields: ['component', 'performance_criteria', 'timeframe', 'conditions'],
        examples: [
          'The system shall respond to user requests within 2 seconds under normal load.',
          'The application shall maintain 99.9% uptime during business hours.'
        ],
        keywords: ['performance', 'security', 'usability', 'reliability', 'scalability']
      },
      {
        id: 'acceptance-criteria',
        name: 'Acceptance Criteria',
        category: 'criteria',
        template: 'Given {context}, when {action}, then {expected_result}.',
        fields: ['context', 'action', 'expected_result'],
        examples: [
          'Given a valid user login, when accessing the dashboard, then all user data is displayed.',
          'Given invalid input data, when submitting a form, then appropriate error messages are shown.'
        ],
        keywords: ['given', 'when', 'then', 'criteria', 'acceptance']
      },
      {
        id: 'constraint-requirement',
        name: 'Constraint Requirement',
        category: 'constraint',
        template: 'The {component} must not {restriction} and shall comply with {standards}.',
        fields: ['component', 'restriction', 'standards'],
        examples: [
          'The system must not store sensitive data in plain text and shall comply with GDPR.',
          'The application must not exceed 5MB memory usage and shall comply with performance standards.'
        ],
        keywords: ['must not', 'constraint', 'limitation', 'comply', 'standard']
      }
    ];

    templates.forEach(template => {
      this.templateLibrary.set(template.id, template);
    });
  }

  /**
   * Initialize context patterns for intelligent assistance
   */
  initializeContextPatterns() {
    this.contextPatterns = {
      documentTypes: {
        'requirements': {
          keywords: ['requirement', 'shall', 'must', 'function'],
          suggestedTemplates: ['functional-requirement', 'non-functional-requirement']
        },
        'acceptance': {
          keywords: ['acceptance', 'criteria', 'given', 'when', 'then'],
          suggestedTemplates: ['acceptance-criteria']
        },
        'constraints': {
          keywords: ['constraint', 'limitation', 'comply', 'standard'],
          suggestedTemplates: ['constraint-requirement']
        }
      },
      stakeholders: ['user', 'system', 'administrator', 'operator', 'customer', 'manager'],
      actions: ['create', 'read', 'update', 'delete', 'validate', 'process', 'authenticate', 'authorize'],
      qualityIndicators: ['specific', 'measurable', 'achievable', 'relevant', 'time-bound']
    };
  }

  /**
   * Convert natural language to structured requirement
   */
  async convertNaturalLanguage(input, options = {}) {
    const startTime = Date.now();

    try {
      // Validate input
      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        return {
          success: false,
          error: 'Input text is required and cannot be empty'
        };
      }

      this.metrics.nlpConversions++;

      // Analyze input text
      const analysis = await this.nlpProcessor.analyzeRequirement(input);

      // Determine requirement type
      const requirementType = this.determineRequirementType(input, analysis);

      // Extract entities
      const entities = this.extractEntities(input, analysis);

      // Generate structured requirement
      const structuredRequirement = this.generateStructuredRequirement(
        requirementType,
        entities,
        input
      );

      // Validate and improve
      const validation = await this.validateRequirement(structuredRequirement.text);

      const result = {
        originalInput: input,
        requirementType,
        entities,
        structuredRequirement,
        validation,
        confidence: this.calculateConfidence(analysis, entities),
        suggestions: this.generateImprovementSuggestions(validation, analysis),
        processingTime: Date.now() - startTime
      };

      this.updateMetrics(Date.now() - startTime);

      this.emit('nlp-conversion-completed', {
        inputLength: input.length,
        confidence: result.confidence,
        processingTime: result.processingTime
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      this.emit('nlp-conversion-failed', {
        input: input.substring(0, 100),
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Provide smart autocomplete suggestions
   */
  async getAutocompleteSuggestions(text, cursorPosition, context = {}) {
    const startTime = Date.now();

    try {
      this.metrics.autocompleteRequests++;

      // Extract current context
      const textBeforeCursor = text.substring(0, cursorPosition);
      const textAfterCursor = text.substring(cursorPosition);
      const currentLine = this.getCurrentLine(textBeforeCursor);
      const currentWord = this.getCurrentWord(textBeforeCursor);

      // Generate suggestions based on context
      const suggestions = [];

      // Template-based suggestions
      const templateSuggestions = this.getTemplateSuggestions(currentLine, context);
      suggestions.push(...templateSuggestions);

      // Context-aware word suggestions
      const wordSuggestions = this.getContextualWordSuggestions(currentWord, currentLine, context);
      suggestions.push(...wordSuggestions);

      // Structure completion suggestions
      const structureSuggestions = this.getStructureCompletionSuggestions(textBeforeCursor, context);
      suggestions.push(...structureSuggestions);

      // Sort by relevance and limit
      const sortedSuggestions = this.rankSuggestions(suggestions, currentWord, context)
        .slice(0, this.config.maxSuggestions);

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);

      this.emit('autocomplete-provided', {
        suggestionsCount: sortedSuggestions.length,
        processingTime,
        context: context.documentType || 'unknown'
      });

      return {
        success: true,
        suggestions: sortedSuggestions,
        processingTime
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Analyze writing quality and provide suggestions
   */
  async analyzeWritingQuality(text, options = {}) {
    const startTime = Date.now();

    try {
      this.metrics.qualityAnalysisRequests++;

      // Perform NLP analysis
      const nlpAnalysis = await this.nlpProcessor.analyzeRequirement(text, options);

      // Additional writing-specific analysis
      const writingAnalysis = this.performWritingAnalysis(text);

      // Generate improvement suggestions
      const improvements = this.generateWritingImprovements(nlpAnalysis, writingAnalysis);

      // Calculate overall writing score
      const writingScore = this.calculateWritingScore(nlpAnalysis, writingAnalysis);

      const result = {
        overallScore: writingScore,
        nlpAnalysis,
        writingAnalysis,
        improvements,
        metrics: {
          readabilityScore: writingAnalysis.readability.score,
          clarityScore: nlpAnalysis.quality.clarity.score,
          completenessScore: nlpAnalysis.quality.completeness.score,
          consistencyScore: nlpAnalysis.quality.specificity.score
        },
        processingTime: Date.now() - startTime
      };

      this.updateMetrics(Date.now() - startTime);

      this.emit('quality-analysis-completed', {
        textLength: text.length,
        overallScore: writingScore,
        improvementsCount: improvements.length
      });

      return {
        success: true,
        result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Recommend templates based on context
   */
  async recommendTemplates(context, partialText = '') {
    try {
      this.metrics.templateRecommendations++;

      const recommendations = [];

      // Analyze partial text for context clues
      const contextClues = this.extractContextClues(partialText);

      // Score templates based on relevance
      for (const [templateId, template] of this.templateLibrary) {
        const relevanceScore = this.calculateTemplateRelevance(
          template,
          context,
          contextClues,
          partialText
        );

        if (relevanceScore > 0.3) { // Threshold for relevance
          recommendations.push({
            templateId,
            template,
            relevanceScore,
            reason: this.generateRecommendationReason(template, context, contextClues)
          });
        }
      }

      // Sort by relevance score
      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);

      this.emit('templates-recommended', {
        recommendationsCount: recommendations.length,
        context: context.documentType || 'unknown'
      });

      return {
        success: true,
        recommendations: recommendations.slice(0, 3), // Top 3 recommendations
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  /**
   * Process real-time writing assistance
   */
  async processRealTimeAssistance(text, cursorPosition, context = {}) {
    if (!this.config.enableRealTime) {
      return { success: false, message: 'Real-time assistance disabled' };
    }

    // Queue processing to avoid overwhelming the system
    return new Promise((resolve) => {
      this.processingQueue.push({
        text,
        cursorPosition,
        context,
        resolve,
        timestamp: Date.now()
      });

      this.processQueue();
    });
  }

  /**
   * Process queued real-time requests
   */
  async processQueue() {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process most recent request (debouncing)
      const latestRequest = this.processingQueue.pop();
      this.processingQueue.length = 0; // Clear queue

      // Get autocomplete suggestions
      const autocomplete = await this.getAutocompleteSuggestions(
        latestRequest.text,
        latestRequest.cursorPosition,
        latestRequest.context
      );

      // Quick quality check (lightweight)
      const quickQuality = this.performQuickQualityCheck(latestRequest.text);

      // Template recommendations if context suggests
      let templates = { recommendations: [] };
      if (this.shouldRecommendTemplates(latestRequest.text, latestRequest.context)) {
        templates = await this.recommendTemplates(latestRequest.context, latestRequest.text);
      }

      latestRequest.resolve({
        success: true,
        autocomplete,
        quickQuality,
        templates,
        processingTime: Date.now() - latestRequest.timestamp
      });

    } catch (error) {
      // Resolve any remaining requests with error
      this.processingQueue.forEach(request => {
        request.resolve({
          success: false,
          error: error.message
        });
      });
      this.processingQueue.length = 0;
    }

    this.isProcessing = false;
  }

  /**
   * Determine requirement type from input text
   */
  determineRequirementType(input, analysis) {
    const lowerInput = input.toLowerCase();

    // Check for functional requirement patterns
    if (analysis.semantic.structure.functional.length > 0 ||
        lowerInput.includes('shall') || lowerInput.includes('must')) {
      return 'functional-requirement';
    }

    // Check for non-functional patterns
    if (analysis.semantic.structure.nonfunctional.length > 0) {
      return 'non-functional-requirement';
    }

    // Check for acceptance criteria patterns
    if (lowerInput.includes('given') && lowerInput.includes('when') && lowerInput.includes('then')) {
      return 'acceptance-criteria';
    }

    // Check for constraint patterns
    if (lowerInput.includes('must not') || lowerInput.includes('constraint') ||
        lowerInput.includes('comply')) {
      return 'constraint-requirement';
    }

    // Default to functional requirement
    return 'functional-requirement';
  }

  /**
   * Extract entities from input text
   */
  extractEntities(input, analysis) {
    const entities = {
      stakeholders: [],
      actions: [],
      objects: [],
      conditions: [],
      measurements: []
    };

    // Extract stakeholders
    entities.stakeholders = analysis.semantic.structure.stakeholders || [];

    // Extract actions
    entities.actions = analysis.semantic.structure.actions || [];

    // Extract conditions
    entities.conditions = analysis.semantic.structure.conditions || [];

    // Extract measurements (numbers with units)
    const measurementPattern = /\b\d+(\.\d+)?\s*(ms|seconds?|minutes?|hours?|days?|MB|GB|%|percent)\b/gi;
    entities.measurements = input.match(measurementPattern) || [];

    // Extract objects (nouns that aren't stakeholders or actions)
    const words = input.split(/\W+/).filter(word => word.length > 2);
    entities.objects = words.filter(word =>
      !entities.stakeholders.includes(word.toLowerCase()) &&
      !entities.actions.includes(word.toLowerCase()) &&
      this.isLikelyObject(word)
    );

    return entities;
  }

  /**
   * Generate structured requirement from entities
   */
  generateStructuredRequirement(type, entities, originalInput) {
    const template = this.templateLibrary.get(type);

    if (!template) {
      return {
        text: originalInput,
        confidence: 0.5,
        template: null
      };
    }

    // Fill template with extracted entities
    let structuredText = template.template;

    // Replace placeholders with entities
    if (entities.stakeholders.length > 0) {
      structuredText = structuredText.replace('{stakeholder}', entities.stakeholders[0]);
    }

    if (entities.actions.length > 0) {
      structuredText = structuredText.replace('{action}', entities.actions[0]);
    }

    if (entities.objects.length > 0) {
      structuredText = structuredText.replace('{object}', entities.objects[0]);
    }

    if (entities.conditions.length > 0) {
      structuredText = structuredText.replace('{conditions}', entities.conditions[0]);
    }

    // Clean up any remaining placeholders
    structuredText = structuredText.replace(/{[^}]+}/g, '[to be specified]');

    return {
      text: structuredText,
      confidence: this.calculateStructuringConfidence(entities, template),
      template: template.id,
      entities
    };
  }

  /**
   * Validate requirement quality
   */
  async validateRequirement(text) {
    return await this.nlpProcessor.analyzeRequirement(text);
  }

  /**
   * Calculate confidence score for NLP conversion
   */
  calculateConfidence(analysis, entities) {
    let confidence = 0.5; // Base confidence

    // Quality score contribution (30%)
    if (analysis.metrics.qualityScore) {
      confidence += (analysis.metrics.qualityScore / 100) * 0.3;
    }

    // Entity extraction success (40%)
    const totalEntities = Object.values(entities).flat().length;
    if (totalEntities > 0) {
      confidence += Math.min(totalEntities / 5, 1) * 0.4; // Up to 5 entities for full score
    }

    // Semantic structure completeness (30%)
    const semanticElements = Object.values(analysis.semantic.structure).flat().length;
    if (semanticElements > 0) {
      confidence += Math.min(semanticElements / 3, 1) * 0.3; // Up to 3 elements for full score
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate improvement suggestions
   */
  generateImprovementSuggestions(validation, analysis) {
    const suggestions = [];

    // Add NLP-based suggestions
    if (analysis.suggestions) {
      suggestions.push(...analysis.suggestions);
    }

    // Add validation-based suggestions
    if (validation.suggestions) {
      suggestions.push(...validation.suggestions);
    }

    // Add writing-specific suggestions
    if (validation.metrics.qualityScore < this.config.qualityThreshold) {
      suggestions.push({
        type: 'quality_improvement',
        priority: 'high',
        message: 'Consider improving overall requirement quality',
        suggestion: 'Review for clarity, specificity, and completeness'
      });
    }

    return suggestions.slice(0, this.config.maxSuggestions);
  }

  /**
   * Get current line from text
   */
  getCurrentLine(textBeforeCursor) {
    const lines = textBeforeCursor.split('\n');
    return lines[lines.length - 1];
  }

  /**
   * Get current word from text
   */
  getCurrentWord(textBeforeCursor) {
    const words = textBeforeCursor.split(/\W+/);
    return words[words.length - 1] || '';
  }

  /**
   * Get template-based suggestions
   */
  getTemplateSuggestions(currentLine, context) {
    const suggestions = [];

    // If line is empty or short, suggest templates
    if (currentLine.trim().length < 10) {
      for (const [templateId, template] of this.templateLibrary) {
        if (this.isTemplateRelevant(template, context)) {
          suggestions.push({
            type: 'template',
            text: template.template,
            description: `${template.name} template`,
            category: template.category,
            priority: 0.8
          });
        }
      }
    }

    return suggestions;
  }

  /**
   * Get contextual word suggestions
   */
  getContextualWordSuggestions(currentWord, currentLine, context) {
    const suggestions = [];
    const lowerWord = currentWord.toLowerCase();
    const lowerLine = currentLine.toLowerCase();

    // Stakeholder suggestions
    if (this.needsStakeholder(lowerLine)) {
      this.contextPatterns.stakeholders
        .filter(stakeholder => stakeholder.startsWith(lowerWord))
        .forEach(stakeholder => {
          suggestions.push({
            type: 'stakeholder',
            text: stakeholder,
            description: 'Stakeholder',
            priority: 0.9
          });
        });
    }

    // Action suggestions
    if (this.needsAction(lowerLine)) {
      this.contextPatterns.actions
        .filter(action => action.startsWith(lowerWord))
        .forEach(action => {
          suggestions.push({
            type: 'action',
            text: action,
            description: 'Action verb',
            priority: 0.9
          });
        });
    }

    return suggestions;
  }

  /**
   * Get structure completion suggestions
   */
  getStructureCompletionSuggestions(textBeforeCursor, context) {
    const suggestions = [];
    const text = textBeforeCursor.toLowerCase();

    // Complete common patterns
    if (text.includes('the user shall') && !text.includes('be able to')) {
      suggestions.push({
        type: 'completion',
        text: 'be able to ',
        description: 'Complete functional requirement pattern',
        priority: 0.95
      });
    }

    if (text.includes('given') && !text.includes('when')) {
      suggestions.push({
        type: 'completion',
        text: ', when ',
        description: 'Continue acceptance criteria pattern',
        priority: 0.95
      });
    }

    if (text.includes('when') && !text.includes('then')) {
      suggestions.push({
        type: 'completion',
        text: ', then ',
        description: 'Complete acceptance criteria pattern',
        priority: 0.95
      });
    }

    return suggestions;
  }

  /**
   * Rank suggestions by relevance
   */
  rankSuggestions(suggestions, currentWord, context) {
    return suggestions.sort((a, b) => {
      let scoreA = a.priority || 0.5;
      let scoreB = b.priority || 0.5;

      // Boost exact matches
      if (a.text.toLowerCase().startsWith(currentWord.toLowerCase())) {
        scoreA += 0.2;
      }
      if (b.text.toLowerCase().startsWith(currentWord.toLowerCase())) {
        scoreB += 0.2;
      }

      // Boost context-relevant suggestions
      if (context.documentType && a.category === context.documentType) {
        scoreA += 0.1;
      }
      if (context.documentType && b.category === context.documentType) {
        scoreB += 0.1;
      }

      return scoreB - scoreA;
    });
  }

  /**
   * Perform additional writing analysis
   */
  performWritingAnalysis(text) {
    const words = text.split(/\W+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      averageWordsPerSentence: words.length / sentences.length || 0,
      readability: this.calculateReadability(text),
      structure: this.analyzeStructure(text),
      tone: this.analyzeTone(text)
    };
  }

  /**
   * Calculate readability score
   */
  calculateReadability(text) {
    const words = text.split(/\W+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const syllables = words.reduce((count, word) => count + this.countSyllables(word), 0);

    // Simplified Flesch Reading Ease
    if (sentences.length === 0 || words.length === 0) {
      return { score: 50, level: 'unknown' };
    }

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;

    const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      level: this.getReadabilityLevel(score)
    };
  }

  /**
   * Count syllables in a word (simplified)
   */
  countSyllables(word) {
    const vowels = 'aeiouy';
    let count = 0;
    let previousWasVowel = false;

    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }

    return Math.max(1, count);
  }

  /**
   * Get readability level from score
   */
  getReadabilityLevel(score) {
    if (score >= 90) return 'very easy';
    if (score >= 80) return 'easy';
    if (score >= 70) return 'fairly easy';
    if (score >= 60) return 'standard';
    if (score >= 50) return 'fairly difficult';
    if (score >= 30) return 'difficult';
    return 'very difficult';
  }

  /**
   * Analyze text structure
   */
  analyzeStructure(text) {
    return {
      hasIntroduction: this.hasIntroduction(text),
      hasConclusion: this.hasConclusion(text),
      paragraphCount: text.split(/\n\s*\n/).length,
      listItems: (text.match(/^\s*[-*+•]\s/gm) || []).length,
      numberedItems: (text.match(/^\s*\d+\.\s/gm) || []).length
    };
  }

  /**
   * Analyze text tone
   */
  analyzeTone(text) {
    const lowerText = text.toLowerCase();

    const toneIndicators = {
      formal: ['shall', 'must', 'will', 'requirements', 'specifications'],
      technical: ['system', 'component', 'interface', 'protocol', 'algorithm'],
      procedural: ['step', 'process', 'procedure', 'method', 'workflow'],
      descriptive: ['description', 'overview', 'summary', 'details', 'characteristics']
    };

    const scores = {};
    Object.entries(toneIndicators).forEach(([tone, indicators]) => {
      scores[tone] = indicators.reduce((count, indicator) => {
        return count + (lowerText.split(indicator).length - 1);
      }, 0);
    });

    const dominantTone = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return {
      scores,
      dominant: dominantTone,
      confidence: scores[dominantTone] / (text.split(/\W+/).length || 1)
    };
  }

  /**
   * Generate writing improvements
   */
  generateWritingImprovements(nlpAnalysis, writingAnalysis) {
    const improvements = [];

    // Readability improvements
    if (writingAnalysis.readability.score < 60) {
      improvements.push({
        type: 'readability',
        severity: 'medium',
        message: 'Text may be difficult to read',
        suggestion: 'Consider shorter sentences and simpler vocabulary',
        autoFixable: false
      });
    }

    // Sentence length improvements
    if (writingAnalysis.averageWordsPerSentence > 25) {
      improvements.push({
        type: 'sentence_length',
        severity: 'medium',
        message: 'Sentences are too long',
        suggestion: 'Break long sentences into shorter, clearer statements',
        autoFixable: false
      });
    }

    // Structure improvements
    if (writingAnalysis.structure.paragraphCount === 1 && writingAnalysis.wordCount > 100) {
      improvements.push({
        type: 'structure',
        severity: 'low',
        message: 'Consider breaking text into paragraphs',
        suggestion: 'Organize content into logical paragraphs for better readability',
        autoFixable: false
      });
    }

    // Add NLP improvements
    if (nlpAnalysis.suggestions) {
      improvements.push(...nlpAnalysis.suggestions);
    }

    return improvements.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  /**
   * Calculate overall writing score
   */
  calculateWritingScore(nlpAnalysis, writingAnalysis) {
    const weights = {
      nlpQuality: 0.4,
      readability: 0.3,
      structure: 0.2,
      tone: 0.1
    };

    let score = 0;

    // NLP quality score
    if (nlpAnalysis.metrics.qualityScore) {
      score += nlpAnalysis.metrics.qualityScore * weights.nlpQuality;
    }

    // Readability score
    score += (writingAnalysis.readability.score / 100) * 100 * weights.readability;

    // Structure score (simplified)
    const structureScore = Math.min(100, (writingAnalysis.structure.paragraphCount > 1 ? 80 : 60) +
      (writingAnalysis.averageWordsPerSentence < 20 ? 20 : 0));
    score += structureScore * weights.structure;

    // Tone consistency score
    const toneScore = Math.min(100, writingAnalysis.tone.confidence * 100);
    score += toneScore * weights.tone;

    return Math.round(score);
  }

  /**
   * Extract context clues from partial text
   */
  extractContextClues(text) {
    const clues = {
      keywords: [],
      patterns: [],
      domain: 'general'
    };

    const lowerText = text.toLowerCase();

    // Extract keywords
    Object.entries(this.contextPatterns.documentTypes).forEach(([type, config]) => {
      config.keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          clues.keywords.push(keyword);
          clues.domain = type;
        }
      });
    });

    // Extract patterns
    if (lowerText.includes('shall') || lowerText.includes('must')) {
      clues.patterns.push('imperative');
    }
    if (lowerText.includes('given') && lowerText.includes('when')) {
      clues.patterns.push('scenario');
    }

    return clues;
  }

  /**
   * Calculate template relevance score
   */
  calculateTemplateRelevance(template, context, contextClues, partialText) {
    let score = 0.3; // Base relevance

    // Context type match
    if (context.documentType && template.category === context.documentType) {
      score += 0.4;
    }

    // Keyword match
    const keywordMatches = template.keywords.filter(keyword =>
      contextClues.keywords.includes(keyword) || partialText.toLowerCase().includes(keyword)
    );
    score += (keywordMatches.length / template.keywords.length) * 0.3;

    // Pattern match
    if (contextClues.patterns.length > 0) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Generate recommendation reason
   */
  generateRecommendationReason(template, context, contextClues) {
    const reasons = [];

    if (context.documentType === template.category) {
      reasons.push(`Matches document type: ${template.category}`);
    }

    if (contextClues.keywords.some(keyword => template.keywords.includes(keyword))) {
      reasons.push('Contains relevant keywords');
    }

    if (contextClues.patterns.length > 0) {
      reasons.push('Matches detected patterns');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'General template recommendation';
  }

  /**
   * Perform quick quality check for real-time assistance
   */
  performQuickQualityCheck(text) {
    const issues = [];
    const lowerText = text.toLowerCase();

    // Quick checks
    if (text.split(/\W+/).length < 5) {
      issues.push({ type: 'too_short', severity: 'low', message: 'Requirement may be too brief' });
    }

    if (!lowerText.includes('shall') && !lowerText.includes('must') && !lowerText.includes('will')) {
      issues.push({ type: 'weak_imperative', severity: 'medium', message: 'Consider using stronger imperative language' });
    }

    if (lowerText.includes('user-friendly') || lowerText.includes('easy') || lowerText.includes('simple')) {
      issues.push({ type: 'vague_term', severity: 'medium', message: 'Avoid vague terms like "user-friendly"' });
    }

    return {
      score: Math.max(0, 100 - (issues.length * 20)),
      issues,
      isGood: issues.length === 0
    };
  }

  /**
   * Check if should recommend templates
   */
  shouldRecommendTemplates(text, context) {
    return text.trim().length < 50 ||
           (context.documentType && text.trim().length < 100);
  }

  /**
   * Helper methods for context analysis
   */
  needsStakeholder(line) {
    return line.includes('the ') && !this.contextPatterns.stakeholders.some(s => line.includes(s));
  }

  needsAction(line) {
    return (line.includes('shall') || line.includes('must')) &&
           !this.contextPatterns.actions.some(a => line.includes(a));
  }

  isTemplateRelevant(template, context) {
    return !context.documentType || template.category === context.documentType || template.category === 'general';
  }

  isLikelyObject(word) {
    const commonObjects = ['document', 'file', 'data', 'information', 'report', 'system', 'component'];
    return commonObjects.includes(word.toLowerCase()) || word.length > 4;
  }

  calculateStructuringConfidence(entities, template) {
    const totalFields = template.fields.length;
    const filledFields = template.fields.filter(field => {
      return Object.values(entities).flat().length > 0;
    }).length;

    return Math.min(1.0, 0.5 + (filledFields / totalFields) * 0.5);
  }

  hasIntroduction(text) {
    const introWords = ['overview', 'introduction', 'purpose', 'objective'];
    return introWords.some(word => text.toLowerCase().includes(word));
  }

  hasConclusion(text) {
    const conclusionWords = ['conclusion', 'summary', 'finally', 'in summary'];
    return conclusionWords.some(word => text.toLowerCase().includes(word));
  }

  /**
   * Update metrics
   */
  updateMetrics(processingTime) {
    this.metrics.totalRequests++;
    this.metrics.processingTimes.push(processingTime);

    // Keep only last 100 processing times
    if (this.metrics.processingTimes.length > 100) {
      this.metrics.processingTimes = this.metrics.processingTimes.slice(-100);
    }

    this.metrics.averageProcessingTime =
      this.metrics.processingTimes.reduce((sum, time) => sum + time, 0) /
      this.metrics.processingTimes.length;
  }

  /**
   * Get metrics and statistics
   */
  getMetrics() {
    return {
      ...this.metrics,
      templatesAvailable: this.templateLibrary.size,
      contextPatternsLoaded: Object.keys(this.contextPatterns).length,
      cacheSize: this.contextCache.size,
      queueLength: this.processingQueue.length,
      successRate: this.metrics.totalRequests > 0 ?
        ((this.metrics.totalRequests - 0) / this.metrics.totalRequests) * 100 : 0, // Assuming no failures tracked separately
      version: this.version
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Test NLP processor
      await this.nlpProcessor.analyzeRequirement('Test requirement for health check');

      return {
        healthy: true,
        service: 'writing-assistant',
        timestamp: new Date().toISOString(),
        version: this.version,
        metrics: this.getMetrics()
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'writing-assistant',
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
        case 'nlp-conversion':
          return await this.convertNaturalLanguage(request.input, request.options);

        case 'autocomplete':
          return await this.getAutocompleteSuggestions(
            request.text,
            request.cursorPosition,
            request.context
          );

        case 'quality-analysis':
          return await this.analyzeWritingQuality(request.text, request.options);

        case 'template-recommendation':
          return await this.recommendTemplates(request.context, request.partialText);

        case 'real-time-assistance':
          return await this.processRealTimeAssistance(
            request.text,
            request.cursorPosition,
            request.context
          );

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

module.exports = WritingAssistant;