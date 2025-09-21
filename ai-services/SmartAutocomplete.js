/**
 * Smart Autocomplete System with Context Awareness
 * Provides intelligent autocomplete suggestions for requirement writing
 */

const EventEmitter = require('events');

class SmartAutocomplete extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxSuggestions: config.maxSuggestions || 8,
      responseTimeout: config.responseTimeout || 150, // 150ms for real-time feel
      minTriggerLength: config.minTriggerLength || 2,
      contextWindow: config.contextWindow || 100, // Characters to consider for context
      enableLearning: config.enableLearning || true,
      ...config
    };

    this.suggestionDatabase = new Map();
    this.contextPatterns = new Map();
    this.userPreferences = new Map();
    this.learningData = new Map();

    this.metrics = {
      totalSuggestions: 0,
      acceptedSuggestions: 0,
      rejectedSuggestions: 0,
      averageResponseTime: 0,
      responseTimes: []
    };

    this.initialize();
  }

  /**
   * Initialize autocomplete with patterns and suggestions
   */
  initialize() {
    this.initializeSuggestionDatabase();
    this.initializeContextPatterns();
    this.initializeCompletionRules();

    this.emit('autocomplete-initialized', {
      timestamp: new Date().toISOString(),
      suggestionsLoaded: this.suggestionDatabase.size,
      patternsLoaded: this.contextPatterns.size
    });
  }

  /**
   * Initialize suggestion database with common patterns
   */
  initializeSuggestionDatabase() {
    const suggestions = {
      // Requirement starters
      starters: [
        { text: 'The system shall', category: 'functional', priority: 0.9, context: ['functional'] },
        { text: 'The user shall be able to', category: 'functional', priority: 0.95, context: ['user-story'] },
        { text: 'The application shall', category: 'functional', priority: 0.85, context: ['functional'] },
        { text: 'Given that', category: 'acceptance', priority: 0.9, context: ['acceptance-criteria'] },
        { text: 'When the user', category: 'acceptance', priority: 0.85, context: ['acceptance-criteria'] },
        { text: 'Then the system', category: 'acceptance', priority: 0.8, context: ['acceptance-criteria'] },
        { text: 'The component must not', category: 'constraint', priority: 0.8, context: ['constraint'] },
        { text: 'The system shall comply with', category: 'compliance', priority: 0.75, context: ['compliance'] }
      ],

      // Actions for functional requirements
      actions: [
        { text: 'be able to create', category: 'action', priority: 0.9, context: ['crud'] },
        { text: 'be able to read', category: 'action', priority: 0.9, context: ['crud'] },
        { text: 'be able to update', category: 'action', priority: 0.9, context: ['crud'] },
        { text: 'be able to delete', category: 'action', priority: 0.9, context: ['crud'] },
        { text: 'validate the input', category: 'action', priority: 0.85, context: ['validation'] },
        { text: 'authenticate the user', category: 'action', priority: 0.8, context: ['security'] },
        { text: 'authorize access to', category: 'action', priority: 0.8, context: ['security'] },
        { text: 'process the request', category: 'action', priority: 0.75, context: ['processing'] },
        { text: 'display the information', category: 'action', priority: 0.8, context: ['ui'] },
        { text: 'send a notification', category: 'action', priority: 0.75, context: ['communication'] }
      ],

      // Performance criteria
      performance: [
        { text: 'within 2 seconds', category: 'performance', priority: 0.9, context: ['time'] },
        { text: 'within 500 milliseconds', category: 'performance', priority: 0.85, context: ['time'] },
        { text: 'under normal load conditions', category: 'performance', priority: 0.8, context: ['conditions'] },
        { text: 'with 99.9% uptime', category: 'performance', priority: 0.85, context: ['availability'] },
        { text: 'supporting up to 1000 concurrent users', category: 'performance', priority: 0.8, context: ['capacity'] },
        { text: 'without data loss', category: 'performance', priority: 0.75, context: ['reliability'] }
      ],

      // Common objects
      objects: [
        { text: 'user account', category: 'object', priority: 0.9, context: ['user-management'] },
        { text: 'document', category: 'object', priority: 0.85, context: ['document'] },
        { text: 'data record', category: 'object', priority: 0.8, context: ['data'] },
        { text: 'report', category: 'object', priority: 0.8, context: ['reporting'] },
        { text: 'configuration settings', category: 'object', priority: 0.75, context: ['configuration'] },
        { text: 'user interface', category: 'object', priority: 0.8, context: ['ui'] },
        { text: 'database', category: 'object', priority: 0.7, context: ['technical'] },
        { text: 'file', category: 'object', priority: 0.85, context: ['file-management'] }
      ],

      // Conditions and constraints
      conditions: [
        { text: 'when authenticated', category: 'condition', priority: 0.9, context: ['security'] },
        { text: 'if the user has permission', category: 'condition', priority: 0.85, context: ['authorization'] },
        { text: 'during business hours', category: 'condition', priority: 0.8, context: ['time'] },
        { text: 'in case of system failure', category: 'condition', priority: 0.75, context: ['error-handling'] },
        { text: 'while maintaining data integrity', category: 'condition', priority: 0.8, context: ['data-integrity'] },
        { text: 'without compromising security', category: 'condition', priority: 0.8, context: ['security'] }
      ],

      // Completions for common patterns
      completions: [
        { text: ' and provide confirmation', trigger: 'successfully', category: 'completion', priority: 0.8 },
        { text: ' to the user', trigger: 'display', category: 'completion', priority: 0.85 },
        { text: ' in the system', trigger: 'stored', category: 'completion', priority: 0.8 },
        { text: ' for future reference', trigger: 'logged', category: 'completion', priority: 0.75 },
        { text: ' according to business rules', trigger: 'validated', category: 'completion', priority: 0.8 }
      ]
    };

    // Load suggestions into database
    Object.entries(suggestions).forEach(([category, items]) => {
      items.forEach(item => {
        const key = `${category}:${item.text.toLowerCase()}`;
        this.suggestionDatabase.set(key, {
          ...item,
          category: category,
          usageCount: 0,
          lastUsed: null,
          userRating: 0
        });
      });
    });
  }

  /**
   * Initialize context patterns for intelligent suggestions
   */
  initializeContextPatterns() {
    const patterns = [
      // Functional requirement patterns
      {
        pattern: /the\s+(system|application|user)\s+shall\s*$/i,
        suggestions: ['be able to', 'provide', 'support', 'enable', 'ensure'],
        category: 'functional-continuation',
        priority: 0.95
      },

      {
        pattern: /the\s+(system|application|user)\s+shall\s+be\s+able\s+to\s*$/i,
        suggestions: ['create', 'read', 'update', 'delete', 'view', 'manage', 'access', 'process'],
        category: 'functional-action',
        priority: 0.9
      },

      // User story patterns
      {
        pattern: /as\s+a\s+([\w\s]+),?\s*i\s+want\s+to\s*$/i,
        suggestions: ['create', 'view', 'edit', 'delete', 'access', 'manage'],
        category: 'user-story-action',
        priority: 0.9
      },

      // Performance requirement patterns
      {
        pattern: /shall\s+(respond|process|complete|execute)\s+([\w\s]+)\s+within\s*$/i,
        suggestions: ['2 seconds', '500 milliseconds', '1 second', '5 seconds'],
        category: 'performance-time',
        priority: 0.9
      },

      // Acceptance criteria patterns
      {
        pattern: /given\s+([\w\s]+),?\s*when\s*$/i,
        suggestions: ['the user', 'the system', 'a valid', 'an invalid'],
        category: 'acceptance-when',
        priority: 0.85
      },

      {
        pattern: /when\s+([\w\s]+[^,\s])(?!\s*,?\s*then)\s*$/i,
        suggestions: [', then', ', then the system shall', ', then the user should see'],
        category: 'acceptance-continuation',
        priority: 0.9
      },

      {
        pattern: /when\s+([\w\s]+),?\s*then\s*$/i,
        suggestions: ['the system shall', 'the user should see', 'an error message', 'the data is'],
        category: 'acceptance-then',
        priority: 0.85
      },

      // Security patterns
      {
        pattern: /shall\s+(authenticate|authorize|encrypt|secure)\s*$/i,
        suggestions: ['the user', 'all data', 'sensitive information', 'user credentials'],
        category: 'security-object',
        priority: 0.8
      },

      // Validation patterns
      {
        pattern: /shall\s+validate\s+(that\s+)?$/i,
        suggestions: ['all input data', 'user credentials', 'the format', 'business rules'],
        category: 'validation-object',
        priority: 0.8
      },

      // Error handling patterns
      {
        pattern: /in\s+case\s+of\s+([\w\s]+)\s*$/i,
        suggestions: ['error', 'failure', 'timeout', 'invalid input', 'system unavailability'],
        category: 'error-handling',
        priority: 0.75
      }
    ];

    patterns.forEach((pattern, index) => {
      this.contextPatterns.set(`pattern_${index}`, pattern);
    });
  }

  /**
   * Initialize completion rules for smart text completion
   */
  initializeCompletionRules() {
    this.completionRules = {
      // Article completion
      articles: {
        pattern: /\b(a|an|the)\s+$/i,
        suggestions: ['system', 'user', 'application', 'component', 'interface']
      },

      // Modal verb completion
      modals: {
        pattern: /\b(shall|must|will|should|can|may)\s+$/i,
        suggestions: ['be able to', 'provide', 'ensure', 'support', 'validate']
      },

      // Preposition completion
      prepositions: {
        pattern: /\b(in|on|at|with|for|to|from|by)\s+$/i,
        suggestions: ['the system', 'the user', 'the application', 'the database', 'the interface']
      },

      // Conjunction completion
      conjunctions: {
        pattern: /\b(and|or|but|while|when|if)\s+$/i,
        suggestions: ['the system', 'the user', 'authenticated', 'authorized', 'valid']
      }
    };
  }

  /**
   * Get autocomplete suggestions based on current context
   */
  async getSuggestions(text, cursorPosition, context = {}) {
    const startTime = Date.now();

    try {
      this.metrics.totalSuggestions++;

      // Extract current context
      const analysisContext = this.analyzeContext(text, cursorPosition, context);

      // Get current word being typed
      const currentWord = this.getCurrentWord(text, cursorPosition);

      // Generate suggestions from multiple sources
      const suggestions = [];

      // 1. Pattern-based suggestions
      const patternSuggestions = this.getPatternSuggestions(analysisContext);
      suggestions.push(...patternSuggestions);

      // 2. Database suggestions
      const databaseSuggestions = this.getDatabaseSuggestions(currentWord, analysisContext);
      suggestions.push(...databaseSuggestions);

      // 3. Context-aware completions
      const contextCompletions = this.getContextCompletions(analysisContext);
      suggestions.push(...contextCompletions);

      // 4. Smart predictions
      const predictions = this.getSmartPredictions(analysisContext);
      suggestions.push(...predictions);

      // 5. Learned suggestions (if enabled)
      if (this.config.enableLearning) {
        const learnedSuggestions = this.getLearnedSuggestions(currentWord, analysisContext);
        suggestions.push(...learnedSuggestions);
      }

      // Rank and filter suggestions
      const rankedSuggestions = this.rankSuggestions(suggestions, analysisContext, currentWord);
      const finalSuggestions = this.filterSuggestions(rankedSuggestions, currentWord);

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime);

      this.emit('suggestions-generated', {
        suggestionsCount: finalSuggestions.length,
        processingTime,
        context: context.documentType || 'unknown'
      });

      return {
        success: true,
        suggestions: finalSuggestions.slice(0, this.config.maxSuggestions),
        context: analysisContext,
        processingTime
      };

    } catch (error) {
      this.emit('suggestions-failed', {
        error: error.message,
        context: context.documentType || 'unknown'
      });

      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Analyze current context for intelligent suggestions
   */
  analyzeContext(text, cursorPosition, userContext) {
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);

    // Get surrounding context
    const contextWindow = Math.min(this.config.contextWindow, beforeCursor.length);
    const localContext = beforeCursor.substring(beforeCursor.length - contextWindow);

    // Analyze text structure
    const currentLine = this.getCurrentLine(beforeCursor);
    const currentSentence = this.getCurrentSentence(beforeCursor);
    const previousSentences = this.getPreviousSentences(beforeCursor, 2);

    // Detect patterns and document type
    const documentType = this.detectDocumentType(text, userContext);
    const requirementType = this.detectRequirementType(currentSentence);
    const semanticContext = this.detectSemanticContext(localContext);

    // Analyze position in requirement
    const positionContext = this.analyzePositionInRequirement(currentLine, currentSentence);

    return {
      beforeCursor,
      afterCursor,
      localContext,
      currentLine,
      currentSentence,
      previousSentences,
      documentType,
      requirementType,
      semanticContext,
      positionContext,
      userContext,
      cursorPosition,
      textLength: text.length
    };
  }

  /**
   * Get current word being typed
   */
  getCurrentWord(text, cursorPosition) {
    const beforeCursor = text.substring(0, cursorPosition);
    const words = beforeCursor.split(/\s+/);
    return words[words.length - 1] || '';
  }

  /**
   * Get current line
   */
  getCurrentLine(textBeforeCursor) {
    const lines = textBeforeCursor.split('\n');
    return lines[lines.length - 1];
  }

  /**
   * Get current sentence
   */
  getCurrentSentence(textBeforeCursor) {
    const sentences = textBeforeCursor.split(/[.!?]+/);
    return sentences[sentences.length - 1].trim();
  }

  /**
   * Get previous sentences for context
   */
  getPreviousSentences(textBeforeCursor, count) {
    const sentences = textBeforeCursor.split(/[.!?]+/).filter(s => s.trim());
    return sentences.slice(-count - 1, -1);
  }

  /**
   * Detect document type from content
   */
  detectDocumentType(text, userContext) {
    if (userContext.documentType) {
      return userContext.documentType;
    }

    const lowerText = text.toLowerCase();

    // Check for acceptance criteria indicators
    if (lowerText.includes('given') && lowerText.includes('when') && lowerText.includes('then')) {
      return 'acceptance-criteria';
    }

    // Check for user story indicators
    if (lowerText.includes('as a') && lowerText.includes('i want') && lowerText.includes('so that')) {
      return 'user-story';
    }

    // Check for constraint indicators
    if (lowerText.includes('must not') || lowerText.includes('constraint') || lowerText.includes('limitation')) {
      return 'constraint';
    }

    // Check for performance indicators
    if (lowerText.includes('performance') || lowerText.includes('response time') || lowerText.includes('within')) {
      return 'performance';
    }

    // Default to functional requirements
    return 'functional';
  }

  /**
   * Detect specific requirement type
   */
  detectRequirementType(sentence) {
    const lowerSentence = sentence.toLowerCase();

    if (lowerSentence.includes('shall') || lowerSentence.includes('must')) {
      return 'imperative';
    }

    if (lowerSentence.includes('given') || lowerSentence.includes('when') || lowerSentence.includes('then')) {
      return 'scenario';
    }

    if (lowerSentence.includes('as a') || lowerSentence.includes('i want')) {
      return 'user-story';
    }

    return 'descriptive';
  }

  /**
   * Detect semantic context
   */
  detectSemanticContext(localContext) {
    const context = {
      domain: 'general',
      focus: 'action',
      entities: []
    };

    const lowerContext = localContext.toLowerCase();

    // Detect domain
    if (lowerContext.includes('security') || lowerContext.includes('authentication') || lowerContext.includes('authorization')) {
      context.domain = 'security';
    } else if (lowerContext.includes('performance') || lowerContext.includes('response') || lowerContext.includes('time')) {
      context.domain = 'performance';
    } else if (lowerContext.includes('user') || lowerContext.includes('interface') || lowerContext.includes('display')) {
      context.domain = 'ui';
    } else if (lowerContext.includes('data') || lowerContext.includes('database') || lowerContext.includes('storage')) {
      context.domain = 'data';
    }

    // Detect focus
    if (lowerContext.includes('shall') || lowerContext.includes('must')) {
      context.focus = 'action';
    } else if (lowerContext.includes('when') || lowerContext.includes('if')) {
      context.focus = 'condition';
    } else if (lowerContext.includes('within') || lowerContext.includes('under')) {
      context.focus = 'constraint';
    }

    return context;
  }

  /**
   * Analyze position in requirement for context-aware suggestions
   */
  analyzePositionInRequirement(currentLine, currentSentence) {
    const position = {
      stage: 'beginning',
      needsSubject: false,
      needsAction: false,
      needsObject: false,
      needsCondition: false
    };

    const lowerLine = currentLine.toLowerCase();
    const lowerSentence = currentSentence.toLowerCase();

    // Determine stage in requirement
    if (lowerSentence.includes('the') && (lowerSentence.includes('shall') || lowerSentence.includes('must'))) {
      if (!lowerSentence.includes('be able to') && !this.hasAction(lowerSentence)) {
        position.stage = 'action';
        position.needsAction = true;
      } else if (!this.hasObject(lowerSentence)) {
        position.stage = 'object';
        position.needsObject = true;
      } else {
        position.stage = 'condition';
        position.needsCondition = true;
      }
    } else if (lowerSentence.includes('given') || lowerSentence.includes('when')) {
      position.stage = 'scenario';
    } else if (lowerSentence.length < 10) {
      position.stage = 'beginning';
      position.needsSubject = true;
    }

    return position;
  }

  /**
   * Check if sentence has an action
   */
  hasAction(sentence) {
    const actionWords = ['create', 'read', 'update', 'delete', 'validate', 'process', 'send', 'receive', 'display', 'authenticate'];
    return actionWords.some(action => sentence.includes(action));
  }

  /**
   * Check if sentence has an object
   */
  hasObject(sentence) {
    const objectWords = ['data', 'information', 'user', 'document', 'record', 'file', 'report', 'account'];
    return objectWords.some(object => sentence.includes(object));
  }

  /**
   * Get pattern-based suggestions
   */
  getPatternSuggestions(context) {
    const suggestions = [];

    this.contextPatterns.forEach((pattern, key) => {
      const match = context.localContext.match(pattern.pattern);
      if (match) {
        pattern.suggestions.forEach(suggestion => {
          suggestions.push({
            text: suggestion,
            type: 'pattern',
            category: pattern.category,
            priority: pattern.priority,
            source: 'pattern-match',
            description: `Complete ${pattern.category}`,
            confidence: 0.9
          });
        });
      }
    });

    return suggestions;
  }

  /**
   * Get database suggestions
   */
  getDatabaseSuggestions(currentWord, context) {
    const suggestions = [];

    if (currentWord.length < this.config.minTriggerLength) {
      return suggestions;
    }

    const lowerCurrentWord = currentWord.toLowerCase();

    this.suggestionDatabase.forEach((item, key) => {
      if (item.text.toLowerCase().startsWith(lowerCurrentWord)) {
        // Check context relevance
        const relevanceScore = this.calculateRelevance(item, context);

        if (relevanceScore > 0.3) {
          suggestions.push({
            text: item.text,
            type: 'database',
            category: item.category,
            priority: item.priority * relevanceScore,
            source: 'database',
            description: `${item.category} suggestion`,
            confidence: relevanceScore,
            usageCount: item.usageCount,
            userRating: item.userRating
          });
        }
      }
    });

    return suggestions;
  }

  /**
   * Calculate relevance of suggestion to current context
   */
  calculateRelevance(item, context) {
    let relevance = 0.5; // Base relevance

    // Context matching
    if (item.context && context.semanticContext) {
      const contextMatch = item.context.some(ctx =>
        ctx === context.semanticContext.domain ||
        ctx === context.documentType ||
        ctx === context.requirementType
      );

      if (contextMatch) {
        relevance += 0.3;
      }
    }

    // Position matching
    if (context.positionContext) {
      if (item.category === 'starters' && context.positionContext.stage === 'beginning') {
        relevance += 0.2;
      } else if (item.category === 'action' && context.positionContext.needsAction) {
        relevance += 0.2;
      } else if (item.category === 'object' && context.positionContext.needsObject) {
        relevance += 0.2;
      }
    }

    // Usage-based relevance
    if (item.usageCount > 0) {
      relevance += Math.min(0.1, item.usageCount * 0.01);
    }

    // User rating
    if (item.userRating > 0) {
      relevance += item.userRating * 0.05;
    }

    return Math.min(1.0, relevance);
  }

  /**
   * Get context-aware completions
   */
  getContextCompletions(context) {
    const suggestions = [];

    // Check completion rules
    Object.entries(this.completionRules).forEach(([ruleType, rule]) => {
      if (rule.pattern.test(context.localContext)) {
        rule.suggestions.forEach(suggestion => {
          suggestions.push({
            text: suggestion,
            type: 'completion',
            category: ruleType,
            priority: 0.8,
            source: 'completion-rule',
            description: `Complete ${ruleType}`,
            confidence: 0.8
          });
        });
      }
    });

    return suggestions;
  }

  /**
   * Get smart predictions based on context
   */
  getSmartPredictions(context) {
    const suggestions = [];

    // Predict based on document type
    if (context.documentType === 'acceptance-criteria') {
      if (context.currentSentence.toLowerCase().includes('given') && !context.currentSentence.includes('when')) {
        suggestions.push({
          text: ', when ',
          type: 'prediction',
          category: 'acceptance-flow',
          priority: 0.95,
          source: 'smart-prediction',
          description: 'Continue acceptance criteria',
          confidence: 0.9
        });
      } else if (context.currentSentence.toLowerCase().includes('when') && !context.currentSentence.includes('then')) {
        suggestions.push({
          text: ', then ',
          type: 'prediction',
          category: 'acceptance-flow',
          priority: 0.95,
          source: 'smart-prediction',
          description: 'Complete acceptance criteria',
          confidence: 0.9
        });
      }
    }

    // Predict based on requirement structure
    if (context.currentSentence.toLowerCase().includes('the user shall') && !context.currentSentence.includes('be able to')) {
      suggestions.push({
        text: 'be able to ',
        type: 'prediction',
        category: 'functional-structure',
        priority: 0.9,
        source: 'smart-prediction',
        description: 'Complete functional requirement',
        confidence: 0.85
      });
    }

    return suggestions;
  }

  /**
   * Get learned suggestions based on user behavior
   */
  getLearnedSuggestions(currentWord, context) {
    const suggestions = [];

    if (!this.config.enableLearning || currentWord.length < this.config.minTriggerLength) {
      return suggestions;
    }

    // Get patterns from learning data
    const userPatterns = this.getUserPatterns(context.userContext.userId);

    if (userPatterns) {
      userPatterns.forEach(pattern => {
        if (pattern.trigger.startsWith(currentWord.toLowerCase())) {
          suggestions.push({
            text: pattern.completion,
            type: 'learned',
            category: 'user-pattern',
            priority: 0.7 + (pattern.frequency * 0.2),
            source: 'learning-engine',
            description: 'Based on your usage',
            confidence: pattern.confidence,
            frequency: pattern.frequency
          });
        }
      });
    }

    return suggestions;
  }

  /**
   * Get user patterns from learning data
   */
  getUserPatterns(userId) {
    if (!userId) return [];

    const userKey = `user_${userId}`;
    return this.learningData.get(userKey) || [];
  }

  /**
   * Rank suggestions by relevance and priority
   */
  rankSuggestions(suggestions, context, currentWord) {
    return suggestions.sort((a, b) => {
      // Calculate composite score
      const scoreA = this.calculateSuggestionScore(a, context, currentWord);
      const scoreB = this.calculateSuggestionScore(b, context, currentWord);

      return scoreB - scoreA;
    });
  }

  /**
   * Calculate suggestion score for ranking
   */
  calculateSuggestionScore(suggestion, context, currentWord) {
    let score = suggestion.priority || 0.5;

    // Confidence boost
    score += (suggestion.confidence || 0.5) * 0.2;

    // Exact prefix match boost
    if (suggestion.text.toLowerCase().startsWith(currentWord.toLowerCase())) {
      score += 0.3;
    }

    // Type-based adjustments
    switch (suggestion.type) {
      case 'pattern':
        score += 0.1;
        break;
      case 'prediction':
        score += 0.2;
        break;
      case 'learned':
        score += (suggestion.frequency || 0) * 0.1;
        break;
      case 'completion':
        score += 0.05;
        break;
    }

    // Usage-based boost
    if (suggestion.usageCount > 0) {
      score += Math.min(0.1, suggestion.usageCount * 0.01);
    }

    // User rating boost
    if (suggestion.userRating > 0) {
      score += suggestion.userRating * 0.05;
    }

    return score;
  }

  /**
   * Filter suggestions to remove duplicates and low-quality items
   */
  filterSuggestions(suggestions, currentWord) {
    const filtered = [];
    const seen = new Set();

    suggestions.forEach(suggestion => {
      // Remove duplicates
      if (seen.has(suggestion.text.toLowerCase())) {
        return;
      }

      // Filter out suggestions that don't make sense with current word
      if (currentWord && !this.isRelevantToCurrentWord(suggestion.text, currentWord)) {
        return;
      }

      // Filter out low-confidence suggestions
      if ((suggestion.confidence || 0.5) < 0.3) {
        return;
      }

      seen.add(suggestion.text.toLowerCase());
      filtered.push(suggestion);
    });

    return filtered;
  }

  /**
   * Check if suggestion is relevant to current word
   */
  isRelevantToCurrentWord(suggestionText, currentWord) {
    if (!currentWord || currentWord.length < 2) {
      return true;
    }

    const lowerSuggestion = suggestionText.toLowerCase();
    const lowerCurrentWord = currentWord.toLowerCase();

    // Should start with or contain the current word
    return lowerSuggestion.startsWith(lowerCurrentWord) ||
           lowerSuggestion.includes(lowerCurrentWord) ||
           this.isSemanticallySimilar(lowerSuggestion, lowerCurrentWord);
  }

  /**
   * Check semantic similarity (simple implementation)
   */
  isSemanticallySimilar(text1, text2) {
    // Simple similarity check based on common words
    const similarityMappings = {
      'user': ['person', 'actor', 'stakeholder'],
      'system': ['application', 'component', 'service'],
      'create': ['add', 'insert', 'generate'],
      'delete': ['remove', 'purge', 'destroy'],
      'update': ['modify', 'edit', 'change']
    };

    for (const [word, similar] of Object.entries(similarityMappings)) {
      if ((text1.includes(word) && similar.some(s => text2.includes(s))) ||
          (text2.includes(word) && similar.some(s => text1.includes(s)))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Record suggestion acceptance for learning
   */
  recordSuggestionAcceptance(suggestion, context) {
    if (!this.config.enableLearning) return;

    this.metrics.acceptedSuggestions++;

    // Update suggestion usage
    const key = `${suggestion.category}:${suggestion.text.toLowerCase()}`;
    if (this.suggestionDatabase.has(key)) {
      const item = this.suggestionDatabase.get(key);
      item.usageCount++;
      item.lastUsed = new Date().toISOString();
    }

    // Learn user patterns
    if (context.userContext && context.userContext.userId) {
      this.learnUserPattern(context.userContext.userId, suggestion, context);
    }

    this.emit('suggestion-accepted', {
      suggestion: suggestion.text,
      type: suggestion.type,
      category: suggestion.category
    });
  }

  /**
   * Record suggestion rejection for learning
   */
  recordSuggestionRejection(suggestion, context) {
    this.metrics.rejectedSuggestions++;

    // Lower the priority slightly for this suggestion type
    const key = `${suggestion.category}:${suggestion.text.toLowerCase()}`;
    if (this.suggestionDatabase.has(key)) {
      const item = this.suggestionDatabase.get(key);
      item.userRating = Math.max(-1, (item.userRating || 0) - 0.1);
    }

    this.emit('suggestion-rejected', {
      suggestion: suggestion.text,
      type: suggestion.type,
      category: suggestion.category
    });
  }

  /**
   * Learn user patterns for personalized suggestions
   */
  learnUserPattern(userId, suggestion, context) {
    const userKey = `user_${userId}`;
    const patterns = this.learningData.get(userKey) || [];

    // Extract pattern from context
    const trigger = context.currentWord || '';
    const completion = suggestion.text;

    // Find existing pattern or create new one
    let pattern = patterns.find(p => p.trigger === trigger && p.completion === completion);

    if (pattern) {
      pattern.frequency++;
      pattern.confidence = Math.min(1.0, pattern.confidence + 0.1);
      pattern.lastUsed = new Date().toISOString();
    } else {
      patterns.push({
        trigger,
        completion,
        frequency: 1,
        confidence: 0.6,
        context: context.semanticContext.domain,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      });
    }

    // Keep only top patterns to avoid memory bloat
    patterns.sort((a, b) => b.frequency - a.frequency);
    if (patterns.length > 50) {
      patterns.splice(50);
    }

    this.learningData.set(userKey, patterns);
  }

  /**
   * Add custom suggestion to database
   */
  addCustomSuggestion(text, category, context = [], priority = 0.7) {
    const key = `custom:${text.toLowerCase()}`;
    this.suggestionDatabase.set(key, {
      text,
      category: 'custom',
      priority,
      context,
      usageCount: 0,
      lastUsed: null,
      userRating: 0,
      isCustom: true
    });

    this.emit('custom-suggestion-added', { text, category });
  }

  /**
   * Remove suggestion from database
   */
  removeSuggestion(text, category = null) {
    const keysToRemove = [];

    this.suggestionDatabase.forEach((item, key) => {
      if (item.text.toLowerCase() === text.toLowerCase() &&
          (!category || item.category === category)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => {
      this.suggestionDatabase.delete(key);
    });

    this.emit('suggestion-removed', { text, category });
  }

  /**
   * Update metrics
   */
  updateMetrics(processingTime) {
    this.metrics.responseTimes.push(processingTime);

    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-100);
    }

    this.metrics.averageResponseTime =
      this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
      this.metrics.responseTimes.length;
  }

  /**
   * Get autocomplete metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      suggestionsInDatabase: this.suggestionDatabase.size,
      contextPatternsLoaded: this.contextPatterns.size,
      learningDataSize: this.learningData.size,
      acceptanceRate: this.metrics.totalSuggestions > 0 ?
        (this.metrics.acceptedSuggestions / this.metrics.totalSuggestions) * 100 : 0,
      rejectionRate: this.metrics.totalSuggestions > 0 ?
        (this.metrics.rejectedSuggestions / this.metrics.totalSuggestions) * 100 : 0
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Test autocomplete functionality
      const testResult = await this.getSuggestions('The user shall', 13, { documentType: 'functional' });

      return {
        healthy: testResult.success,
        service: 'smart-autocomplete',
        timestamp: new Date().toISOString(),
        metrics: this.getMetrics(),
        testResult: testResult.success ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'smart-autocomplete',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Clear learning data
   */
  clearLearningData(userId = null) {
    if (userId) {
      const userKey = `user_${userId}`;
      this.learningData.delete(userKey);
    } else {
      this.learningData.clear();
    }

    this.emit('learning-data-cleared', { userId });
  }

  /**
   * Export user learning data
   */
  exportLearningData(userId) {
    const userKey = `user_${userId}`;
    return this.learningData.get(userKey) || [];
  }

  /**
   * Import user learning data
   */
  importLearningData(userId, patterns) {
    const userKey = `user_${userId}`;
    this.learningData.set(userKey, patterns);

    this.emit('learning-data-imported', { userId, patternsCount: patterns.length });
  }
}

module.exports = SmartAutocomplete;