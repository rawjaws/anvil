/**
 * Template Recommendation Engine
 * Intelligent template recommendations based on project context and content analysis
 */

const EventEmitter = require('events');

class TemplateRecommendationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      maxRecommendations: config.maxRecommendations || 5,
      relevanceThreshold: config.relevanceThreshold || 0.3,
      learningEnabled: config.learningEnabled || true,
      contextWeights: config.contextWeights || {
        documentType: 0.3,
        projectDomain: 0.25,
        userRole: 0.2,
        previousUsage: 0.15,
        contentAnalysis: 0.1
      },
      ...config
    };

    this.templateLibrary = new Map();
    this.contextPatterns = new Map();
    this.usageHistory = new Map();
    this.userPreferences = new Map();
    this.domainMappings = new Map();

    this.metrics = {
      totalRecommendations: 0,
      acceptedRecommendations: 0,
      rejectedRecommendations: 0,
      averageRelevanceScore: 0,
      templatesUsed: new Set()
    };

    this.initialize();
  }

  /**
   * Initialize template recommendation engine
   */
  initialize() {
    this.initializeTemplateLibrary();
    this.initializeContextPatterns();
    this.initializeDomainMappings();

    this.emit('template-engine-initialized', {
      timestamp: new Date().toISOString(),
      templatesLoaded: this.templateLibrary.size,
      contextPatternsLoaded: this.contextPatterns.size
    });
  }

  /**
   * Initialize comprehensive template library
   */
  initializeTemplateLibrary() {
    const templates = [
      // Functional Requirements Templates
      {
        id: 'functional-basic',
        name: 'Basic Functional Requirement',
        category: 'functional',
        subcategory: 'basic',
        template: 'The {stakeholder} shall be able to {action} {object} {conditions}.',
        description: 'Standard functional requirement template',
        fields: [
          { name: 'stakeholder', type: 'select', options: ['user', 'system', 'administrator', 'operator'] },
          { name: 'action', type: 'text', placeholder: 'create, read, update, delete, validate...' },
          { name: 'object', type: 'text', placeholder: 'data, document, account...' },
          { name: 'conditions', type: 'text', placeholder: 'when authenticated, if authorized...' }
        ],
        examples: [
          'The user shall be able to create new documents when authenticated.',
          'The system shall be able to validate input data before processing.',
          'The administrator shall be able to configure system settings.'
        ],
        keywords: ['functional', 'shall', 'user', 'system', 'action'],
        domains: ['general', 'software', 'web', 'mobile'],
        complexity: 'basic',
        usageCount: 0,
        rating: 4.5,
        tags: ['functional', 'basic', 'crud', 'user-action']
      },

      {
        id: 'functional-conditional',
        name: 'Conditional Functional Requirement',
        category: 'functional',
        subcategory: 'conditional',
        template: 'When {condition}, the {stakeholder} shall {action} {object} {additional_conditions}.',
        description: 'Functional requirement with conditional logic',
        fields: [
          { name: 'condition', type: 'text', placeholder: 'user is authenticated, data is valid...' },
          { name: 'stakeholder', type: 'select', options: ['user', 'system', 'administrator'] },
          { name: 'action', type: 'text', placeholder: 'create, process, validate...' },
          { name: 'object', type: 'text', placeholder: 'request, data, notification...' },
          { name: 'additional_conditions', type: 'text', placeholder: 'within 2 seconds, with confirmation...' }
        ],
        examples: [
          'When the user is authenticated, the system shall process payment requests within 5 seconds.',
          'When invalid data is detected, the system shall display appropriate error messages.',
          'When the session expires, the user shall be redirected to the login page.'
        ],
        keywords: ['when', 'if', 'conditional', 'trigger', 'event'],
        domains: ['software', 'web', 'mobile', 'api'],
        complexity: 'intermediate',
        usageCount: 0,
        rating: 4.3,
        tags: ['functional', 'conditional', 'logic', 'event-driven']
      },

      // Non-Functional Requirements Templates
      {
        id: 'performance-response',
        name: 'Performance Response Time',
        category: 'non-functional',
        subcategory: 'performance',
        template: 'The {component} shall {action} within {timeframe} under {load_conditions}.',
        description: 'Performance requirement for response times',
        fields: [
          { name: 'component', type: 'text', placeholder: 'system, application, API...' },
          { name: 'action', type: 'text', placeholder: 'respond to requests, process data...' },
          { name: 'timeframe', type: 'text', placeholder: '2 seconds, 500ms, 1 minute...' },
          { name: 'load_conditions', type: 'text', placeholder: 'normal load, peak hours, 1000 concurrent users...' }
        ],
        examples: [
          'The system shall respond to user requests within 2 seconds under normal load conditions.',
          'The API shall process data requests within 500 milliseconds under peak load.',
          'The application shall start up within 10 seconds on standard hardware.'
        ],
        keywords: ['performance', 'response', 'time', 'speed', 'latency'],
        domains: ['software', 'web', 'mobile', 'api', 'system'],
        complexity: 'intermediate',
        usageCount: 0,
        rating: 4.7,
        tags: ['non-functional', 'performance', 'timing', 'speed']
      },

      {
        id: 'security-authentication',
        name: 'Security Authentication',
        category: 'non-functional',
        subcategory: 'security',
        template: 'The {component} shall {security_action} {protected_resource} using {method} {additional_requirements}.',
        description: 'Security requirement for authentication and authorization',
        fields: [
          { name: 'component', type: 'text', placeholder: 'system, application, service...' },
          { name: 'security_action', type: 'select', options: ['authenticate', 'authorize', 'encrypt', 'validate'] },
          { name: 'protected_resource', type: 'text', placeholder: 'user credentials, sensitive data, API endpoints...' },
          { name: 'method', type: 'text', placeholder: 'multi-factor authentication, role-based access control...' },
          { name: 'additional_requirements', type: 'text', placeholder: 'according to industry standards, with audit logging...' }
        ],
        examples: [
          'The system shall authenticate users using multi-factor authentication before granting access.',
          'The application shall encrypt all sensitive data using AES-256 encryption.',
          'The API shall authorize requests using role-based access control with audit logging.'
        ],
        keywords: ['security', 'authentication', 'authorization', 'encryption', 'access'],
        domains: ['software', 'web', 'mobile', 'api', 'enterprise'],
        complexity: 'advanced',
        usageCount: 0,
        rating: 4.6,
        tags: ['non-functional', 'security', 'authentication', 'protection']
      },

      // User Stories Templates
      {
        id: 'user-story-basic',
        name: 'Basic User Story',
        category: 'user-story',
        subcategory: 'basic',
        template: 'As a {role}, I want to {goal} so that {benefit}.',
        description: 'Standard user story format',
        fields: [
          { name: 'role', type: 'text', placeholder: 'customer, administrator, registered user...' },
          { name: 'goal', type: 'text', placeholder: 'create an account, view my orders, update my profile...' },
          { name: 'benefit', type: 'text', placeholder: 'I can access personalized features, track my purchases...' }
        ],
        examples: [
          'As a customer, I want to create an account so that I can access personalized features.',
          'As an administrator, I want to view user analytics so that I can make informed decisions.',
          'As a registered user, I want to save my preferences so that I have a customized experience.'
        ],
        keywords: ['user story', 'as a', 'I want', 'so that', 'role', 'goal'],
        domains: ['agile', 'software', 'web', 'mobile', 'product'],
        complexity: 'basic',
        usageCount: 0,
        rating: 4.8,
        tags: ['user-story', 'agile', 'persona', 'goal-oriented']
      },

      {
        id: 'user-story-detailed',
        name: 'Detailed User Story with Acceptance Criteria',
        category: 'user-story',
        subcategory: 'detailed',
        template: 'As a {role}, I want to {goal} so that {benefit}.\n\nAcceptance Criteria:\n- Given {precondition}, when {action}, then {expected_result}\n- {additional_criteria}',
        description: 'User story with detailed acceptance criteria',
        fields: [
          { name: 'role', type: 'text', placeholder: 'customer, admin, user...' },
          { name: 'goal', type: 'text', placeholder: 'search for products, manage inventory...' },
          { name: 'benefit', type: 'text', placeholder: 'I can find what I need quickly...' },
          { name: 'precondition', type: 'text', placeholder: 'I am on the search page...' },
          { name: 'action', type: 'text', placeholder: 'I enter search terms...' },
          { name: 'expected_result', type: 'text', placeholder: 'relevant results are displayed...' },
          { name: 'additional_criteria', type: 'textarea', placeholder: 'Additional acceptance criteria...' }
        ],
        examples: [
          'As a customer, I want to search for products so that I can find items to purchase.\n\nAcceptance Criteria:\n- Given I am on the search page, when I enter search terms, then relevant products are displayed\n- Search results should be sorted by relevance\n- No more than 20 results per page'
        ],
        keywords: ['user story', 'acceptance criteria', 'given when then', 'detailed'],
        domains: ['agile', 'software', 'web', 'mobile', 'product'],
        complexity: 'intermediate',
        usageCount: 0,
        rating: 4.7,
        tags: ['user-story', 'detailed', 'acceptance-criteria', 'gherkin']
      },

      // Acceptance Criteria Templates
      {
        id: 'acceptance-gherkin',
        name: 'Gherkin Style Acceptance Criteria',
        category: 'acceptance-criteria',
        subcategory: 'gherkin',
        template: 'Given {precondition}\nWhen {action}\nThen {expected_result}\nAnd {additional_result}',
        description: 'Acceptance criteria using Gherkin syntax',
        fields: [
          { name: 'precondition', type: 'text', placeholder: 'a user is logged in, the system is online...' },
          { name: 'action', type: 'text', placeholder: 'the user clicks submit, a request is made...' },
          { name: 'expected_result', type: 'text', placeholder: 'the form is processed, data is saved...' },
          { name: 'additional_result', type: 'text', placeholder: 'a confirmation message is shown...' }
        ],
        examples: [
          'Given a user is logged in\nWhen the user submits a valid form\nThen the data is saved to the database\nAnd a success message is displayed',
          'Given the shopping cart has items\nWhen the user proceeds to checkout\nThen the payment page is displayed\nAnd the cart total is calculated correctly'
        ],
        keywords: ['given', 'when', 'then', 'and', 'gherkin', 'BDD'],
        domains: ['testing', 'agile', 'software', 'quality-assurance'],
        complexity: 'intermediate',
        usageCount: 0,
        rating: 4.4,
        tags: ['acceptance-criteria', 'gherkin', 'BDD', 'testing']
      },

      // Constraint Templates
      {
        id: 'constraint-limitation',
        name: 'System Constraint',
        category: 'constraint',
        subcategory: 'limitation',
        template: 'The {component} shall not {restricted_action} {restriction_details}.',
        description: 'Constraint defining system limitations',
        fields: [
          { name: 'component', type: 'text', placeholder: 'system, application, user interface...' },
          { name: 'restricted_action', type: 'text', placeholder: 'exceed, allow, store, process...' },
          { name: 'restriction_details', type: 'text', placeholder: '100MB file size, unauthorized access, sensitive data in logs...' }
        ],
        examples: [
          'The system shall not store sensitive data in plain text format.',
          'The application shall not allow file uploads exceeding 100MB.',
          'The user interface shall not display sensitive information without proper authorization.'
        ],
        keywords: ['shall not', 'must not', 'cannot', 'restriction', 'limitation'],
        domains: ['security', 'compliance', 'system', 'software'],
        complexity: 'intermediate',
        usageCount: 0,
        rating: 4.2,
        tags: ['constraint', 'limitation', 'restriction', 'compliance']
      },

      // Business Rules Templates
      {
        id: 'business-rule-policy',
        name: 'Business Rule Policy',
        category: 'business-rule',
        subcategory: 'policy',
        template: 'The {business_entity} policy states that {rule_description} {enforcement_action}.',
        description: 'Business rule defining organizational policies',
        fields: [
          { name: 'business_entity', type: 'text', placeholder: 'company, organization, department...' },
          { name: 'rule_description', type: 'text', placeholder: 'all transactions must be approved, data retention is 7 years...' },
          { name: 'enforcement_action', type: 'text', placeholder: 'and violations will be logged, with automatic escalation...' }
        ],
        examples: [
          'The company policy states that all financial transactions above $10,000 must be approved by a manager.',
          'The data retention policy states that customer data must be retained for 7 years and then securely deleted.',
          'The security policy states that password changes are required every 90 days.'
        ],
        keywords: ['policy', 'business rule', 'organizational', 'compliance'],
        domains: ['business', 'compliance', 'governance', 'enterprise'],
        complexity: 'intermediate',
        usageCount: 0,
        rating: 4.1,
        tags: ['business-rule', 'policy', 'governance', 'compliance']
      },

      // API Requirements Templates
      {
        id: 'api-endpoint',
        name: 'API Endpoint Requirement',
        category: 'api',
        subcategory: 'endpoint',
        template: 'The {api_name} API shall provide a {http_method} endpoint at {endpoint_path} that {functionality} and returns {response_format}.',
        description: 'Requirement for API endpoint functionality',
        fields: [
          { name: 'api_name', type: 'text', placeholder: 'REST, GraphQL, user management...' },
          { name: 'http_method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          { name: 'endpoint_path', type: 'text', placeholder: '/api/users, /api/orders/{id}...' },
          { name: 'functionality', type: 'text', placeholder: 'retrieves user data, creates new orders...' },
          { name: 'response_format', type: 'text', placeholder: 'JSON with user details, XML with status code...' }
        ],
        examples: [
          'The REST API shall provide a GET endpoint at /api/users that retrieves user data and returns JSON with user details.',
          'The order API shall provide a POST endpoint at /api/orders that creates new orders and returns JSON with order confirmation.',
          'The authentication API shall provide a POST endpoint at /api/auth/login that validates credentials and returns JWT token.'
        ],
        keywords: ['API', 'endpoint', 'REST', 'HTTP', 'response'],
        domains: ['api', 'web-services', 'integration', 'microservices'],
        complexity: 'advanced',
        usageCount: 0,
        rating: 4.5,
        tags: ['api', 'endpoint', 'web-service', 'integration']
      }
    ];

    // Load templates into library
    templates.forEach(template => {
      this.templateLibrary.set(template.id, {
        ...template,
        createdAt: new Date().toISOString(),
        lastUsed: null,
        userRatings: [],
        adaptations: []
      });
    });
  }

  /**
   * Initialize context patterns for template matching
   */
  initializeContextPatterns() {
    const patterns = [
      // Functional requirement patterns
      {
        id: 'functional-crud',
        pattern: /\b(create|read|update|delete|add|remove|modify|view|display)\b/gi,
        templates: ['functional-basic', 'functional-conditional'],
        weight: 0.8
      },

      // Performance patterns
      {
        id: 'performance-timing',
        pattern: /\b(within|seconds|milliseconds|response\s+time|latency|performance|speed|fast)\b/gi,
        templates: ['performance-response'],
        weight: 0.9
      },

      // Security patterns
      {
        id: 'security-auth',
        pattern: /\b(authenticate|authorization|encrypt|secure|password|login|access\s+control|security)\b/gi,
        templates: ['security-authentication'],
        weight: 0.85
      },

      // User story patterns
      {
        id: 'user-story-format',
        pattern: /\b(as\s+a|i\s+want|so\s+that|user\s+story|persona|role)\b/gi,
        templates: ['user-story-basic', 'user-story-detailed'],
        weight: 0.95
      },

      // Acceptance criteria patterns
      {
        id: 'acceptance-gherkin',
        pattern: /\b(given|when|then|and|but|acceptance\s+criteria|scenario)\b/gi,
        templates: ['acceptance-gherkin'],
        weight: 0.9
      },

      // Constraint patterns
      {
        id: 'constraint-negative',
        pattern: /\b(shall\s+not|must\s+not|cannot|should\s+not|restriction|limitation|constraint)\b/gi,
        templates: ['constraint-limitation'],
        weight: 0.8
      },

      // API patterns
      {
        id: 'api-endpoint',
        pattern: /\b(API|endpoint|REST|HTTP|GET|POST|PUT|DELETE|web\s+service|microservice)\b/gi,
        templates: ['api-endpoint'],
        weight: 0.85
      },

      // Business rule patterns
      {
        id: 'business-rule',
        pattern: /\b(policy|business\s+rule|governance|compliance|organizational|procedure)\b/gi,
        templates: ['business-rule-policy'],
        weight: 0.7
      }
    ];

    patterns.forEach(pattern => {
      this.contextPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * Initialize domain mappings
   */
  initializeDomainMappings() {
    const mappings = [
      {
        domain: 'web-application',
        keywords: ['web', 'browser', 'HTML', 'CSS', 'JavaScript', 'responsive'],
        templates: ['functional-basic', 'user-story-basic', 'performance-response', 'security-authentication']
      },
      {
        domain: 'mobile-application',
        keywords: ['mobile', 'iOS', 'Android', 'app', 'touch', 'gesture'],
        templates: ['user-story-basic', 'functional-basic', 'performance-response']
      },
      {
        domain: 'api-development',
        keywords: ['API', 'REST', 'GraphQL', 'microservice', 'endpoint', 'integration'],
        templates: ['api-endpoint', 'functional-conditional', 'security-authentication']
      },
      {
        domain: 'enterprise-software',
        keywords: ['enterprise', 'ERP', 'CRM', 'business', 'workflow', 'compliance'],
        templates: ['business-rule-policy', 'functional-basic', 'security-authentication', 'constraint-limitation']
      },
      {
        domain: 'e-commerce',
        keywords: ['e-commerce', 'shopping', 'cart', 'payment', 'order', 'customer'],
        templates: ['user-story-basic', 'functional-basic', 'acceptance-gherkin', 'business-rule-policy']
      },
      {
        domain: 'healthcare',
        keywords: ['healthcare', 'medical', 'patient', 'HIPAA', 'clinical', 'diagnosis'],
        templates: ['security-authentication', 'constraint-limitation', 'business-rule-policy', 'functional-basic']
      },
      {
        domain: 'financial',
        keywords: ['financial', 'banking', 'payment', 'transaction', 'compliance', 'audit'],
        templates: ['security-authentication', 'business-rule-policy', 'constraint-limitation', 'functional-conditional']
      }
    ];

    mappings.forEach(mapping => {
      this.domainMappings.set(mapping.domain, mapping);
    });
  }

  /**
   * Get template recommendations based on context
   */
  async getRecommendations(context = {}, partialText = '') {
    const startTime = Date.now();

    try {
      this.metrics.totalRecommendations++;

      // Analyze context and content
      const analysisContext = this.analyzeContext(context, partialText);

      // Get candidate templates
      const candidates = this.getCandidateTemplates(analysisContext);

      // Score and rank templates
      const scoredTemplates = this.scoreTemplates(candidates, analysisContext);

      // Filter by relevance threshold
      const relevantTemplates = scoredTemplates.filter(
        template => template.relevanceScore >= this.config.relevanceThreshold
      );

      // Apply user preferences if available
      const personalizedTemplates = this.applyUserPreferences(relevantTemplates, context.userId);

      // Sort by score and limit results
      const finalRecommendations = personalizedTemplates
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, this.config.maxRecommendations);

      // Add usage metadata
      const recommendationsWithMetadata = finalRecommendations.map(template => ({
        ...template,
        confidence: template.relevanceScore,
        reasoning: this.generateRecommendationReasoning(template, analysisContext),
        customization: this.generateCustomizationSuggestions(template, analysisContext)
      }));

      const processingTime = Date.now() - startTime;

      this.emit('recommendations-generated', {
        recommendationsCount: recommendationsWithMetadata.length,
        context: analysisContext.documentType,
        processingTime
      });

      return {
        success: true,
        recommendations: recommendationsWithMetadata,
        context: analysisContext,
        processingTime
      };

    } catch (error) {
      this.emit('recommendations-failed', {
        error: error.message,
        context: context.documentType || 'unknown'
      });

      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  /**
   * Analyze context for template recommendations
   */
  analyzeContext(context, partialText) {
    return {
      // Document context
      documentType: context.documentType || this.detectDocumentType(partialText),
      projectDomain: context.projectDomain || this.detectProjectDomain(context, partialText),

      // User context
      userRole: context.userRole || 'analyst',
      userId: context.userId,
      teamPreferences: context.teamPreferences || {},

      // Content analysis
      contentKeywords: this.extractKeywords(partialText),
      detectedPatterns: this.detectPatterns(partialText),
      complexity: this.estimateComplexity(partialText, context),

      // Technical context
      targetAudience: context.targetAudience || 'technical',
      complianceRequirements: context.complianceRequirements || [],

      // Project context
      projectPhase: context.projectPhase || 'requirements',
      methodologyPreference: context.methodologyPreference || 'agile',

      // Historical context
      previousTemplates: this.getPreviousTemplates(context.userId, context.projectId),
      usageHistory: this.getUsageHistory(context.userId)
    };
  }

  /**
   * Detect document type from partial text
   */
  detectDocumentType(text) {
    if (!text) return 'functional';

    const lowerText = text.toLowerCase();

    // User story detection
    if (lowerText.includes('as a') && lowerText.includes('i want')) {
      return 'user-story';
    }

    // Acceptance criteria detection
    if (lowerText.includes('given') && (lowerText.includes('when') || lowerText.includes('then'))) {
      return 'acceptance-criteria';
    }

    // API documentation detection
    if (lowerText.includes('api') || lowerText.includes('endpoint') || lowerText.includes('rest')) {
      return 'api';
    }

    // Business rule detection
    if (lowerText.includes('policy') || lowerText.includes('business rule')) {
      return 'business-rule';
    }

    // Constraint detection
    if (lowerText.includes('shall not') || lowerText.includes('must not') || lowerText.includes('constraint')) {
      return 'constraint';
    }

    // Performance requirement detection
    if (lowerText.includes('performance') || lowerText.includes('response time') || lowerText.includes('within')) {
      return 'non-functional';
    }

    // Default to functional
    return 'functional';
  }

  /**
   * Detect project domain from context and text
   */
  detectProjectDomain(context, text) {
    if (context.projectDomain) {
      return context.projectDomain;
    }

    const combinedText = `${context.projectName || ''} ${context.projectDescription || ''} ${text}`.toLowerCase();

    // Check domain mappings
    for (const [domain, mapping] of this.domainMappings) {
      const keywordMatches = mapping.keywords.filter(keyword =>
        combinedText.includes(keyword.toLowerCase())
      );

      if (keywordMatches.length >= 2) {
        return domain;
      }
    }

    return 'general';
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    if (!text) return [];

    const keywords = [];
    const words = text.toLowerCase().split(/\W+/).filter(word => word.length > 3);

    // Technical terms
    const technicalTerms = ['api', 'rest', 'http', 'json', 'xml', 'database', 'server', 'client'];
    keywords.push(...words.filter(word => technicalTerms.includes(word)));

    // Business terms
    const businessTerms = ['user', 'customer', 'admin', 'manager', 'account', 'order', 'payment'];
    keywords.push(...words.filter(word => businessTerms.includes(word)));

    // Action words
    const actionWords = ['create', 'read', 'update', 'delete', 'validate', 'process', 'authenticate'];
    keywords.push(...words.filter(word => actionWords.includes(word)));

    return [...new Set(keywords)];
  }

  /**
   * Detect patterns in text
   */
  detectPatterns(text) {
    const detectedPatterns = [];

    this.contextPatterns.forEach((pattern, id) => {
      const matches = text.match(pattern.pattern);
      if (matches && matches.length > 0) {
        detectedPatterns.push({
          id,
          matches: matches.length,
          weight: pattern.weight,
          templates: pattern.templates
        });
      }
    });

    return detectedPatterns.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Estimate complexity based on text and context
   */
  estimateComplexity(text, context) {
    let complexity = 'basic';

    // Text-based complexity indicators
    if (text) {
      const wordCount = text.split(/\s+/).length;
      const hasConditionals = /\b(if|when|unless|while|provided\s+that)\b/i.test(text);
      const hasTechnicalTerms = /\b(api|database|algorithm|protocol|encryption)\b/i.test(text);
      const hasMultipleCriteria = (text.match(/\band\b/gi) || []).length > 2;

      if (wordCount > 50 || hasMultipleCriteria) {
        complexity = 'intermediate';
      }

      if (hasTechnicalTerms || hasConditionals || wordCount > 100) {
        complexity = 'advanced';
      }
    }

    // Context-based complexity
    if (context.complianceRequirements?.length > 0) {
      complexity = complexity === 'basic' ? 'intermediate' : 'advanced';
    }

    if (context.projectDomain === 'enterprise-software' || context.projectDomain === 'financial') {
      complexity = complexity === 'basic' ? 'intermediate' : complexity;
    }

    return complexity;
  }

  /**
   * Get candidate templates based on context
   */
  getCandidateTemplates(context) {
    const candidates = [];

    // Get all templates
    this.templateLibrary.forEach((template, templateId) => {
      candidates.push({
        templateId,
        template: { ...template }
      });
    });

    return candidates;
  }

  /**
   * Score templates based on context relevance
   */
  scoreTemplates(candidates, context) {
    return candidates.map(candidate => {
      const template = candidate.template;
      let score = 0;

      // Document type match
      if (template.category === context.documentType) {
        score += this.config.contextWeights.documentType;
      }

      // Domain match
      if (template.domains.includes(context.projectDomain)) {
        score += this.config.contextWeights.projectDomain;
      }

      // Complexity match
      if (template.complexity === context.complexity) {
        score += 0.1;
      } else if (
        (template.complexity === 'basic' && context.complexity === 'intermediate') ||
        (template.complexity === 'intermediate' && context.complexity === 'basic')
      ) {
        score += 0.05;
      }

      // Keyword match
      const keywordMatches = context.contentKeywords.filter(keyword =>
        template.keywords.some(templateKeyword =>
          templateKeyword.toLowerCase().includes(keyword) ||
          keyword.includes(templateKeyword.toLowerCase())
        )
      );
      score += (keywordMatches.length / Math.max(template.keywords.length, 1)) * 0.15;

      // Pattern match
      context.detectedPatterns.forEach(pattern => {
        if (pattern.templates.includes(template.id)) {
          score += pattern.weight * 0.1;
        }
      });

      // Usage history boost
      if (context.previousTemplates.includes(template.id)) {
        score += this.config.contextWeights.previousUsage;
      }

      // Template rating
      score += (template.rating / 5) * 0.05;

      // Methodology preference
      if (context.methodologyPreference === 'agile' && template.tags.includes('agile')) {
        score += 0.05;
      }

      return {
        ...candidate,
        relevanceScore: Math.min(1.0, score)
      };
    });
  }

  /**
   * Apply user preferences to template recommendations
   */
  applyUserPreferences(templates, userId) {
    if (!userId || !this.userPreferences.has(userId)) {
      return templates;
    }

    const preferences = this.userPreferences.get(userId);

    return templates.map(template => {
      let adjustedScore = template.relevanceScore;

      // Preferred categories
      if (preferences.preferredCategories?.includes(template.template.category)) {
        adjustedScore += 0.1;
      }

      // Preferred complexity
      if (preferences.preferredComplexity === template.template.complexity) {
        adjustedScore += 0.05;
      }

      // Frequently used templates
      if (preferences.frequentlyUsed?.includes(template.template.id)) {
        adjustedScore += 0.08;
      }

      // Recently rejected templates (penalty)
      if (preferences.recentlyRejected?.includes(template.template.id)) {
        adjustedScore -= 0.15;
      }

      return {
        ...template,
        relevanceScore: Math.max(0, Math.min(1.0, adjustedScore))
      };
    });
  }

  /**
   * Generate reasoning for recommendation
   */
  generateRecommendationReasoning(template, context) {
    const reasons = [];

    // Category match
    if (template.template.category === context.documentType) {
      reasons.push(`Matches document type: ${context.documentType}`);
    }

    // Domain match
    if (template.template.domains.includes(context.projectDomain)) {
      reasons.push(`Suitable for ${context.projectDomain} domain`);
    }

    // Keyword matches
    const keywordMatches = context.contentKeywords.filter(keyword =>
      template.template.keywords.some(templateKeyword =>
        templateKeyword.toLowerCase().includes(keyword)
      )
    );
    if (keywordMatches.length > 0) {
      reasons.push(`Contains relevant keywords: ${keywordMatches.slice(0, 3).join(', ')}`);
    }

    // Complexity match
    if (template.template.complexity === context.complexity) {
      reasons.push(`Appropriate complexity level: ${context.complexity}`);
    }

    // Popular template
    if (template.template.rating > 4.5) {
      reasons.push('Highly rated by users');
    }

    // Methodology fit
    if (context.methodologyPreference === 'agile' && template.template.tags.includes('agile')) {
      reasons.push('Fits agile methodology');
    }

    return reasons.length > 0 ? reasons : ['General template recommendation'];
  }

  /**
   * Generate customization suggestions
   */
  generateCustomizationSuggestions(template, context) {
    const suggestions = [];

    // Field value suggestions based on context
    template.template.fields?.forEach(field => {
      const fieldSuggestions = this.getFieldSuggestions(field, context);
      if (fieldSuggestions.length > 0) {
        suggestions.push({
          field: field.name,
          suggestions: fieldSuggestions,
          reasoning: `Based on ${context.projectDomain} domain context`
        });
      }
    });

    // Template adaptations
    if (context.complianceRequirements.length > 0) {
      suggestions.push({
        type: 'compliance',
        suggestion: 'Consider adding compliance-specific clauses',
        requirements: context.complianceRequirements
      });
    }

    return suggestions;
  }

  /**
   * Get field suggestions based on context
   */
  getFieldSuggestions(field, context) {
    const suggestions = [];

    switch (field.name) {
      case 'stakeholder':
        if (context.projectDomain === 'e-commerce') {
          suggestions.push('customer', 'merchant', 'administrator');
        } else if (context.projectDomain === 'healthcare') {
          suggestions.push('patient', 'physician', 'nurse', 'administrator');
        } else {
          suggestions.push('user', 'system', 'administrator');
        }
        break;

      case 'action':
        if (context.contentKeywords.includes('create')) {
          suggestions.push('create', 'add', 'register');
        } else if (context.contentKeywords.includes('view')) {
          suggestions.push('view', 'display', 'show');
        }
        break;

      case 'timeframe':
        if (context.projectDomain === 'web-application') {
          suggestions.push('2 seconds', '500 milliseconds', '1 second');
        } else if (context.projectDomain === 'mobile-application') {
          suggestions.push('1 second', '300 milliseconds', '500 milliseconds');
        }
        break;
    }

    return suggestions;
  }

  /**
   * Get previous templates used by user/project
   */
  getPreviousTemplates(userId, projectId) {
    const key = userId || projectId;
    if (!key) return [];

    const history = this.usageHistory.get(key);
    return history ? history.templates : [];
  }

  /**
   * Get usage history for user
   */
  getUsageHistory(userId) {
    if (!userId) return { templates: [], frequency: {} };

    return this.usageHistory.get(userId) || { templates: [], frequency: {} };
  }

  /**
   * Record template usage
   */
  recordTemplateUsage(templateId, context) {
    // Update template usage count
    const template = this.templateLibrary.get(templateId);
    if (template) {
      template.usageCount++;
      template.lastUsed = new Date().toISOString();
      this.metrics.templatesUsed.add(templateId);
    }

    // Update user usage history
    if (context.userId) {
      const userHistory = this.usageHistory.get(context.userId) || { templates: [], frequency: {} };

      userHistory.templates.push(templateId);
      userHistory.frequency[templateId] = (userHistory.frequency[templateId] || 0) + 1;

      // Keep only last 50 templates
      if (userHistory.templates.length > 50) {
        userHistory.templates = userHistory.templates.slice(-50);
      }

      this.usageHistory.set(context.userId, userHistory);
    }

    this.metrics.acceptedRecommendations++;

    this.emit('template-used', {
      templateId,
      userId: context.userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record template rejection
   */
  recordTemplateRejection(templateId, context, reason = '') {
    this.metrics.rejectedRecommendations++;

    // Update user preferences to avoid this template temporarily
    if (context.userId) {
      const preferences = this.userPreferences.get(context.userId) || {};

      if (!preferences.recentlyRejected) {
        preferences.recentlyRejected = [];
      }

      preferences.recentlyRejected.push(templateId);

      // Keep only last 10 rejections
      if (preferences.recentlyRejected.length > 10) {
        preferences.recentlyRejected = preferences.recentlyRejected.slice(-10);
      }

      this.userPreferences.set(context.userId, preferences);
    }

    this.emit('template-rejected', {
      templateId,
      userId: context.userId,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Add custom template
   */
  addCustomTemplate(templateData, userId = null) {
    const templateId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const template = {
      id: templateId,
      ...templateData,
      category: templateData.category || 'custom',
      complexity: templateData.complexity || 'basic',
      domains: templateData.domains || ['general'],
      keywords: templateData.keywords || [],
      tags: [...(templateData.tags || []), 'custom'],
      usageCount: 0,
      rating: 4.0,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      lastUsed: null,
      userRatings: [],
      adaptations: []
    };

    this.templateLibrary.set(templateId, template);

    this.emit('custom-template-added', {
      templateId,
      userId,
      template: template.name
    });

    return templateId;
  }

  /**
   * Rate template
   */
  rateTemplate(templateId, rating, userId = null) {
    const template = this.templateLibrary.get(templateId);
    if (!template) return false;

    template.userRatings.push({
      rating: Math.max(1, Math.min(5, rating)),
      userId,
      timestamp: new Date().toISOString()
    });

    // Recalculate average rating
    const totalRating = template.userRatings.reduce((sum, r) => sum + r.rating, 0);
    template.rating = totalRating / template.userRatings.length;

    this.emit('template-rated', {
      templateId,
      rating,
      userId,
      newAverageRating: template.rating
    });

    return true;
  }

  /**
   * Get template by ID
   */
  getTemplate(templateId) {
    return this.templateLibrary.get(templateId);
  }

  /**
   * Search templates
   */
  searchTemplates(query, filters = {}) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    this.templateLibrary.forEach((template, templateId) => {
      let matches = false;

      // Text search
      if (template.name.toLowerCase().includes(lowerQuery) ||
          template.description.toLowerCase().includes(lowerQuery) ||
          template.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))) {
        matches = true;
      }

      // Apply filters
      if (matches && filters.category && template.category !== filters.category) {
        matches = false;
      }

      if (matches && filters.complexity && template.complexity !== filters.complexity) {
        matches = false;
      }

      if (matches && filters.domain && !template.domains.includes(filters.domain)) {
        matches = false;
      }

      if (matches) {
        results.push({
          templateId,
          template,
          relevanceScore: this.calculateSearchRelevance(template, lowerQuery)
        });
      }
    });

    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate search relevance
   */
  calculateSearchRelevance(template, query) {
    let score = 0;

    // Name match
    if (template.name.toLowerCase().includes(query)) {
      score += 0.5;
    }

    // Keyword matches
    const keywordMatches = template.keywords.filter(keyword =>
      keyword.toLowerCase().includes(query)
    );
    score += keywordMatches.length * 0.2;

    // Description match
    if (template.description.toLowerCase().includes(query)) {
      score += 0.3;
    }

    // Usage popularity
    score += (template.usageCount / 100) * 0.1;

    // Rating
    score += (template.rating / 5) * 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Get recommendation metrics
   */
  getMetrics() {
    const totalRecommendations = this.metrics.totalRecommendations;

    return {
      ...this.metrics,
      templatesInLibrary: this.templateLibrary.size,
      contextPatternsCount: this.contextPatterns.size,
      domainMappingsCount: this.domainMappings.size,
      acceptanceRate: totalRecommendations > 0 ?
        (this.metrics.acceptedRecommendations / totalRecommendations) * 100 : 0,
      rejectionRate: totalRecommendations > 0 ?
        (this.metrics.rejectedRecommendations / totalRecommendations) * 100 : 0,
      uniqueTemplatesUsed: this.metrics.templatesUsed.size
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const testContext = {
        documentType: 'functional',
        projectDomain: 'web-application',
        userRole: 'analyst'
      };

      const result = await this.getRecommendations(testContext, 'The user shall be able to create');

      return {
        healthy: result.success,
        service: 'template-recommendation-engine',
        timestamp: new Date().toISOString(),
        metrics: this.getMetrics(),
        testResult: result.success ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'template-recommendation-engine',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Export template library
   */
  exportTemplateLibrary() {
    const templates = [];
    this.templateLibrary.forEach((template, templateId) => {
      templates.push({ templateId, ...template });
    });
    return templates;
  }

  /**
   * Import template library
   */
  importTemplateLibrary(templates) {
    templates.forEach(templateData => {
      const { templateId, ...template } = templateData;
      this.templateLibrary.set(templateId, template);
    });

    this.emit('template-library-imported', {
      templatesCount: templates.length,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = TemplateRecommendationEngine;