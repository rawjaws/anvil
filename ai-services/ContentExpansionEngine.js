/**
 * Advanced Content Expansion Engine for Smart Document Generator
 * Transforms brief inputs into comprehensive, detailed documentation
 */

const EventEmitter = require('events');

class ContentExpansionEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      expansionDepth: config.expansionDepth || 'comprehensive',
      maxExpansionRatio: config.maxExpansionRatio || 20, // 20x expansion
      minSectionLength: config.minSectionLength || 100,
      maxSectionLength: config.maxSectionLength || 2000,
      includeExamples: config.includeExamples !== false,
      includeBestPractices: config.includeBestPractices !== false,
      ...config
    };

    this.expansionStrategies = new Map();
    this.contentPatterns = new Map();
    this.knowledgeBase = new Map();
    this.expansionRules = new Map();

    this.metrics = {
      totalExpansions: 0,
      averageExpansionRatio: 0,
      averageProcessingTime: 0,
      successfulExpansions: 0,
      expansionsByType: {}
    };

    this.initialize();
  }

  /**
   * Initialize content expansion engine
   */
  initialize() {
    this.initializeExpansionStrategies();
    this.initializeContentPatterns();
    this.initializeKnowledgeBase();
    this.initializeExpansionRules();

    this.emit('content-expansion-engine-initialized', {
      strategies: this.expansionStrategies.size,
      patterns: this.contentPatterns.size,
      knowledgeBase: this.knowledgeBase.size
    });
  }

  /**
   * Initialize expansion strategies for different content types
   */
  initializeExpansionStrategies() {
    // Requirements expansion strategy
    this.expansionStrategies.set('requirements', {
      name: 'Requirements Expansion',
      phases: [
        'analyze-intent',
        'extract-entities',
        'generate-functional-requirements',
        'generate-non-functional-requirements',
        'add-constraints',
        'create-acceptance-criteria',
        'add-traceability'
      ],
      expansionRules: {
        minRequirements: 5,
        maxRequirements: 25,
        includeNonFunctional: true,
        includeConstraints: true,
        detailLevel: 'high'
      }
    });

    // User stories expansion strategy
    this.expansionStrategies.set('user-stories', {
      name: 'User Stories Expansion',
      phases: [
        'identify-personas',
        'extract-user-goals',
        'generate-epics',
        'break-down-stories',
        'create-acceptance-criteria',
        'add-story-details',
        'prioritize-stories'
      ],
      expansionRules: {
        minStories: 8,
        maxStories: 20,
        includePersonas: true,
        includeEpics: true,
        detailLevel: 'medium'
      }
    });

    // Test cases expansion strategy
    this.expansionStrategies.set('test-cases', {
      name: 'Test Cases Expansion',
      phases: [
        'analyze-test-scope',
        'identify-test-scenarios',
        'generate-positive-tests',
        'generate-negative-tests',
        'add-edge-cases',
        'create-test-data',
        'define-automation-strategy'
      ],
      expansionRules: {
        minTestCases: 15,
        maxTestCases: 50,
        includeEdgeCases: true,
        includeAutomation: true,
        detailLevel: 'high'
      }
    });

    // Architecture expansion strategy
    this.expansionStrategies.set('architecture', {
      name: 'Architecture Expansion',
      phases: [
        'analyze-system-context',
        'identify-components',
        'define-interfaces',
        'design-data-flow',
        'add-security-layer',
        'define-deployment',
        'create-diagrams'
      ],
      expansionRules: {
        minComponents: 5,
        maxComponents: 15,
        includeSecurityDesign: true,
        includeDeployment: true,
        detailLevel: 'high'
      }
    });

    // Product specification expansion strategy
    this.expansionStrategies.set('product-spec', {
      name: 'Product Specification Expansion',
      phases: [
        'define-product-vision',
        'analyze-market-context',
        'identify-features',
        'create-roadmap',
        'define-success-metrics',
        'add-competitive-analysis',
        'create-go-to-market'
      ],
      expansionRules: {
        minFeatures: 10,
        maxFeatures: 30,
        includeMarketAnalysis: true,
        includeRoadmap: true,
        detailLevel: 'medium'
      }
    });

    // API documentation expansion strategy
    this.expansionStrategies.set('api-documentation', {
      name: 'API Documentation Expansion',
      phases: [
        'analyze-api-scope',
        'define-authentication',
        'document-endpoints',
        'create-examples',
        'add-error-handling',
        'define-rate-limiting',
        'create-sdk-guides'
      ],
      expansionRules: {
        minEndpoints: 8,
        maxEndpoints: 25,
        includeExamples: true,
        includeSDK: true,
        detailLevel: 'high'
      }
    });

    // Project plan expansion strategy
    this.expansionStrategies.set('project-plan', {
      name: 'Project Plan Expansion',
      phases: [
        'define-project-charter',
        'analyze-scope',
        'create-work-breakdown',
        'estimate-timeline',
        'allocate-resources',
        'identify-risks',
        'create-communication-plan'
      ],
      expansionRules: {
        minMilestones: 5,
        maxMilestones: 12,
        includeRiskAnalysis: true,
        includeResourcePlan: true,
        detailLevel: 'medium'
      }
    });
  }

  /**
   * Initialize content patterns for intelligent expansion
   */
  initializeContentPatterns() {
    // Functional requirement patterns
    this.contentPatterns.set('functional-requirement', {
      templates: [
        'The {stakeholder} shall be able to {action} {object} {conditions}',
        'The system shall {capability} when {trigger} occurs',
        'Upon {event}, the system shall {response} within {timeframe}',
        'The {component} must {function} to ensure {outcome}'
      ],
      entities: {
        stakeholders: ['user', 'system', 'administrator', 'operator', 'customer', 'manager'],
        actions: ['create', 'read', 'update', 'delete', 'process', 'validate', 'authenticate', 'authorize'],
        objects: ['data', 'records', 'reports', 'transactions', 'notifications', 'configurations'],
        conditions: ['when authenticated', 'during business hours', 'with valid permissions', 'in real-time']
      },
      expansionHints: [
        'Consider access control requirements',
        'Define input validation rules',
        'Specify error handling behavior',
        'Include audit trail requirements'
      ]
    });

    // Non-functional requirement patterns
    this.contentPatterns.set('non-functional-requirement', {
      templates: [
        'The system shall achieve {metric} of {target} under {conditions}',
        'Response time shall not exceed {timeframe} for {operations}',
        'The system shall support {capacity} concurrent {entities}',
        'Data shall be backed up {frequency} with {retention} retention'
      ],
      categories: ['performance', 'security', 'usability', 'reliability', 'scalability', 'maintainability'],
      metrics: {
        performance: ['response time', 'throughput', 'latency', 'cpu utilization', 'memory usage'],
        security: ['encryption strength', 'authentication methods', 'access control', 'audit logging'],
        usability: ['user satisfaction', 'task completion time', 'error rates', 'learning curve'],
        reliability: ['uptime', 'mtbf', 'recovery time', 'data integrity', 'error handling']
      }
    });

    // User story patterns
    this.contentPatterns.set('user-story', {
      templates: [
        'As a {persona}, I want to {goal} so that {benefit}',
        'As a {persona}, I need to {action} in order to {outcome}',
        'When I am {context}, I want to {capability} to achieve {result}'
      ],
      personas: ['end user', 'administrator', 'power user', 'guest user', 'customer', 'manager'],
      goals: ['accomplish tasks efficiently', 'access information quickly', 'complete workflows', 'manage data'],
      benefits: ['save time', 'reduce errors', 'improve productivity', 'make informed decisions'],
      contexts: ['on mobile', 'in offline mode', 'during peak hours', 'with limited permissions']
    });

    // Test case patterns
    this.contentPatterns.set('test-case', {
      templates: [
        'Given {precondition}, when {action}, then {expected_result}',
        'Verify that {condition} results in {outcome}',
        'Test {functionality} with {test_data} expects {result}'
      ],
      categories: ['positive', 'negative', 'boundary', 'integration', 'performance', 'security'],
      testTypes: ['unit', 'integration', 'system', 'acceptance', 'regression', 'performance']
    });
  }

  /**
   * Initialize knowledge base with domain expertise
   */
  initializeKnowledgeBase() {
    // Software development best practices
    this.knowledgeBase.set('software-development', {
      principles: [
        'SOLID principles',
        'DRY (Don\'t Repeat Yourself)',
        'KISS (Keep It Simple, Stupid)',
        'YAGNI (You Aren\'t Gonna Need It)',
        'Separation of Concerns'
      ],
      patterns: [
        'Model-View-Controller (MVC)',
        'Repository Pattern',
        'Observer Pattern',
        'Factory Pattern',
        'Singleton Pattern'
      ],
      practices: [
        'Code reviews',
        'Automated testing',
        'Continuous integration',
        'Documentation as code',
        'Version control'
      ]
    });

    // Security best practices
    this.knowledgeBase.set('security', {
      principles: [
        'Defense in depth',
        'Principle of least privilege',
        'Fail securely',
        'Zero trust architecture',
        'Security by design'
      ],
      controls: [
        'Authentication and authorization',
        'Data encryption',
        'Input validation',
        'Audit logging',
        'Access controls'
      ],
      threats: [
        'SQL injection',
        'Cross-site scripting (XSS)',
        'Cross-site request forgery (CSRF)',
        'Authentication bypass',
        'Data breaches'
      ]
    });

    // Project management methodologies
    this.knowledgeBase.set('project-management', {
      methodologies: ['Agile', 'Scrum', 'Kanban', 'Waterfall', 'Lean'],
      phases: ['Initiation', 'Planning', 'Execution', 'Monitoring', 'Closure'],
      artifacts: ['Charter', 'Work Breakdown Structure', 'Risk Register', 'Communication Plan'],
      roles: ['Project Manager', 'Product Owner', 'Scrum Master', 'Team Lead', 'Stakeholder']
    });

    // Quality assurance practices
    this.knowledgeBase.set('quality-assurance', {
      strategies: ['Risk-based testing', 'Exploratory testing', 'Automated testing', 'Performance testing'],
      techniques: ['Equivalence partitioning', 'Boundary value analysis', 'Decision table testing'],
      tools: ['Test management tools', 'Automation frameworks', 'Performance testing tools']
    });
  }

  /**
   * Initialize expansion rules for different document types
   */
  initializeExpansionRules() {
    this.expansionRules.set('requirements', {
      sections: {
        'functional-requirements': {
          minItems: 5,
          maxItems: 20,
          itemTemplate: 'functional-requirement',
          expansionFactors: ['stakeholder-diversity', 'complexity-level', 'integration-points']
        },
        'non-functional-requirements': {
          minItems: 3,
          maxItems: 10,
          itemTemplate: 'non-functional-requirement',
          categories: ['performance', 'security', 'usability', 'reliability']
        },
        'constraints': {
          minItems: 2,
          maxItems: 8,
          types: ['technical', 'business', 'regulatory', 'resource']
        }
      }
    });

    this.expansionRules.set('user-stories', {
      sections: {
        'epics': {
          minItems: 2,
          maxItems: 5,
          expansionBased: 'feature-complexity'
        },
        'stories': {
          minItems: 8,
          maxItems: 25,
          itemTemplate: 'user-story',
          expansionFactors: ['user-types', 'feature-breadth', 'interaction-complexity']
        },
        'acceptance-criteria': {
          minPerStory: 2,
          maxPerStory: 6,
          itemTemplate: 'acceptance-criteria'
        }
      }
    });
  }

  /**
   * Main content expansion method
   */
  async expandContent(input, documentType, structure, context) {
    const startTime = Date.now();
    this.metrics.totalExpansions++;

    try {
      // Get expansion strategy for document type
      const strategy = this.expansionStrategies.get(documentType);
      if (!strategy) {
        throw new Error(`No expansion strategy found for document type: ${documentType}`);
      }

      // Analyze input to understand intent and extract key information
      const analysis = await this.analyzeInput(input, context);

      // Execute expansion phases
      const expandedSections = [];
      for (const phase of strategy.phases) {
        const phaseResult = await this.executeExpansionPhase(
          phase,
          input,
          analysis,
          strategy,
          context,
          expandedSections
        );
        if (phaseResult) {
          expandedSections.push(...phaseResult);
        }
      }

      // Apply quality enhancements
      const enhancedSections = await this.enhanceContentQuality(
        expandedSections,
        documentType,
        context
      );

      // Calculate expansion metrics
      const originalWordCount = input.split(/\s+/).length;
      const expandedWordCount = this.calculateWordCount(enhancedSections);
      const expansionRatio = expandedWordCount / originalWordCount;

      const processingTime = Date.now() - startTime;
      this.updateMetrics(documentType, expansionRatio, processingTime);

      this.emit('content-expanded', {
        documentType,
        originalWordCount,
        expandedWordCount,
        expansionRatio,
        sectionsGenerated: enhancedSections.length,
        processingTime
      });

      return {
        success: true,
        originalInput: input,
        documentType,
        sections: enhancedSections,
        metadata: {
          expansionLevel: this.config.expansionDepth,
          expansionRatio,
          sectionsGenerated: enhancedSections.length,
          wordsGenerated: expandedWordCount,
          processingTime,
          strategy: strategy.name,
          phasesExecuted: strategy.phases
        }
      };

    } catch (error) {
      this.emit('content-expansion-failed', {
        documentType,
        input: input.substring(0, 100),
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        documentType,
        originalInput: input
      };
    }
  }

  /**
   * Analyze input to extract intent and key information
   */
  async analyzeInput(input, context) {
    const analysis = {
      originalInput: input,
      wordCount: input.split(/\s+/).length,
      complexity: this.assessComplexity(input),
      domain: this.identifyDomain(input, context),
      entities: this.extractEntities(input),
      intent: this.analyzeIntent(input),
      scope: this.assessScope(input, context),
      techStack: this.identifyTechnology(input),
      businessContext: this.extractBusinessContext(input, context)
    };

    return analysis;
  }

  /**
   * Execute specific expansion phase
   */
  async executeExpansionPhase(phase, input, analysis, strategy, context, existingSections) {
    const phaseHandlers = {
      'analyze-intent': () => this.analyzeIntentPhase(input, analysis),
      'extract-entities': () => this.extractEntitiesPhase(input, analysis),
      'generate-functional-requirements': () => this.generateFunctionalRequirements(input, analysis, context),
      'generate-non-functional-requirements': () => this.generateNonFunctionalRequirements(analysis, context),
      'add-constraints': () => this.generateConstraints(analysis, context),
      'create-acceptance-criteria': () => this.generateAcceptanceCriteria(analysis, existingSections),
      'identify-personas': () => this.generatePersonas(input, analysis, context),
      'generate-epics': () => this.generateEpics(input, analysis, context),
      'break-down-stories': () => this.generateUserStories(input, analysis, context),
      'analyze-test-scope': () => this.analyzeTestScope(input, analysis, existingSections),
      'generate-positive-tests': () => this.generatePositiveTestCases(analysis, existingSections),
      'generate-negative-tests': () => this.generateNegativeTestCases(analysis, existingSections),
      'add-edge-cases': () => this.generateEdgeCaseTests(analysis, existingSections),
      'identify-components': () => this.generateSystemComponents(input, analysis, context),
      'define-interfaces': () => this.generateInterfaceSpecifications(analysis, existingSections),
      'add-security-layer': () => this.generateSecurityRequirements(analysis, context),
      'define-product-vision': () => this.generateProductVision(input, analysis, context),
      'analyze-market-context': () => this.generateMarketAnalysis(analysis, context),
      'identify-features': () => this.generateFeatureSpecifications(input, analysis, context)
    };

    const handler = phaseHandlers[phase];
    if (handler) {
      return await handler();
    }

    return null;
  }

  /**
   * Generate functional requirements from input analysis
   */
  generateFunctionalRequirements(input, analysis, context) {
    const requirements = [];
    const strategy = this.expansionStrategies.get('requirements');
    const rules = strategy.expansionRules;

    // Determine number of requirements based on complexity and scope
    const baseCount = Math.min(rules.minRequirements, 5);
    const complexityMultiplier = analysis.complexity === 'high' ? 2 : analysis.complexity === 'medium' ? 1.5 : 1;
    const targetCount = Math.floor(baseCount * complexityMultiplier);

    // Generate core requirements from input
    const coreRequirements = this.extractCoreRequirements(input, analysis);
    requirements.push(...coreRequirements);

    // Generate additional requirements based on patterns
    while (requirements.length < targetCount) {
      const additionalReq = this.generateAdditionalRequirement(analysis, requirements, context);
      if (additionalReq) {
        requirements.push(additionalReq);
      } else {
        break; // Avoid infinite loop
      }
    }

    return [{
      id: 'functional-requirements',
      type: 'functional-requirements',
      title: 'Functional Requirements',
      content: this.formatRequirements(requirements),
      order: 2,
      requirements: requirements
    }];
  }

  /**
   * Extract core requirements from input
   */
  extractCoreRequirements(input, analysis) {
    const requirements = [];
    let reqId = 1;

    // Generate primary requirement from main input
    const primaryReq = {
      id: `REQ-${String(reqId).padStart(3, '0')}`,
      title: this.generateRequirementTitle(input),
      priority: 'High',
      category: 'Core Functionality',
      description: this.generateRequirementDescription(input, analysis),
      acceptanceCriteria: this.generateBasicAcceptanceCriteria(input),
      status: 'Draft',
      source: 'User Input'
    };
    requirements.push(primaryReq);
    reqId++;

    // Generate supporting requirements based on entities
    if (analysis.entities.actions && analysis.entities.actions.length > 0) {
      analysis.entities.actions.slice(0, 3).forEach(action => {
        const req = {
          id: `REQ-${String(reqId).padStart(3, '0')}`,
          title: `${action.charAt(0).toUpperCase() + action.slice(1)} Capability`,
          priority: 'Medium',
          category: 'Supporting Functionality',
          description: `The system shall provide the capability to ${action} ${analysis.entities.objects?.[0] || 'data'} efficiently and accurately.`,
          acceptanceCriteria: [
            `User can ${action} ${analysis.entities.objects?.[0] || 'data'} successfully`,
            `${action.charAt(0).toUpperCase() + action.slice(1)} operation completes within acceptable time`,
            'Appropriate feedback is provided to the user'
          ],
          status: 'Draft',
          source: 'Entity Analysis'
        };
        requirements.push(req);
        reqId++;
      });
    }

    return requirements;
  }

  /**
   * Generate non-functional requirements
   */
  generateNonFunctionalRequirements(analysis, context) {
    const nfRequirements = [];
    const categories = ['performance', 'security', 'usability', 'reliability'];

    categories.forEach((category, index) => {
      const req = this.generateNFRequirement(category, analysis, context, index + 1);
      nfRequirements.push(req);
    });

    return [{
      id: 'non-functional-requirements',
      type: 'non-functional-requirements',
      title: 'Non-Functional Requirements',
      content: this.formatNonFunctionalRequirements(nfRequirements),
      order: 3,
      requirements: nfRequirements
    }];
  }

  /**
   * Generate a specific non-functional requirement
   */
  generateNFRequirement(category, analysis, context, index) {
    const patterns = this.contentPatterns.get('non-functional-requirement');
    const metrics = patterns.metrics[category] || [];

    const requirements = {
      performance: {
        id: `NFR-${String(index).padStart(3, '0')}`,
        title: 'System Performance',
        category: 'Performance',
        description: 'The system shall respond to user requests within 2 seconds under normal load conditions.',
        metrics: ['Response time < 2 seconds', 'Throughput > 1000 requests/minute', 'CPU utilization < 70%'],
        testCriteria: 'Performance testing with simulated load'
      },
      security: {
        id: `NFR-${String(index).padStart(3, '0')}`,
        title: 'Security Requirements',
        category: 'Security',
        description: 'The system shall implement appropriate security controls to protect data and ensure authorized access.',
        metrics: ['All data encrypted in transit and at rest', 'Multi-factor authentication required', 'Access logs maintained'],
        testCriteria: 'Security penetration testing and vulnerability assessment'
      },
      usability: {
        id: `NFR-${String(index).padStart(3, '0')}`,
        title: 'Usability Requirements',
        category: 'Usability',
        description: 'The system shall provide an intuitive user interface that enables efficient task completion.',
        metrics: ['Task completion time < 5 minutes', 'User satisfaction score > 80%', 'Error rate < 5%'],
        testCriteria: 'User acceptance testing and usability studies'
      },
      reliability: {
        id: `NFR-${String(index).padStart(3, '0')}`,
        title: 'System Reliability',
        category: 'Reliability',
        description: 'The system shall maintain high availability and recover gracefully from failures.',
        metrics: ['Uptime > 99.5%', 'Recovery time < 15 minutes', 'Data integrity maintained'],
        testCriteria: 'Reliability testing and disaster recovery testing'
      }
    };

    return requirements[category];
  }

  /**
   * Generate user stories from input
   */
  generateUserStories(input, analysis, context) {
    const stories = [];
    const personas = ['End User', 'Administrator', 'Manager'];
    const baseActions = analysis.entities.actions || ['view', 'create', 'update', 'manage'];

    let storyId = 1;

    // Generate stories for each persona and main actions
    personas.forEach(persona => {
      baseActions.slice(0, 3).forEach(action => {
        const story = {
          id: `US-${String(storyId).padStart(3, '0')}`,
          title: `${persona} ${action} functionality`,
          persona: persona,
          goal: `${action} ${analysis.entities.objects?.[0] || 'information'} efficiently`,
          benefit: this.generateStoryBenefit(action, persona),
          priority: storyId <= 3 ? 'High' : storyId <= 6 ? 'Medium' : 'Low',
          storyPoints: this.estimateStoryPoints(action, persona),
          acceptanceCriteria: this.generateStoryAcceptanceCriteria(action, persona),
          notes: `Story generated based on ${action} capability for ${persona.toLowerCase()}`
        };
        stories.push(story);
        storyId++;
      });
    });

    return [{
      id: 'user-stories-list',
      type: 'user-stories',
      title: 'User Stories',
      content: this.formatUserStories(stories),
      order: 3,
      stories: stories
    }];
  }

  /**
   * Generate test cases from requirements and user stories
   */
  generatePositiveTestCases(analysis, existingSections) {
    const testCases = [];
    let testId = 1;

    // Find requirements from existing sections
    const requirementsSection = existingSections.find(s => s.type === 'functional-requirements');
    const requirements = requirementsSection?.requirements || [];

    // Generate positive test cases for each requirement
    requirements.slice(0, 5).forEach(req => {
      const testCase = {
        id: `TC-${String(testId).padStart(3, '0')}`,
        title: `Verify ${req.title}`,
        objective: `Test that ${req.title.toLowerCase()} works as expected`,
        priority: req.priority,
        category: 'Positive',
        type: 'Functional',
        preconditions: this.generateTestPreconditions(req),
        steps: this.generateTestSteps(req, 'positive'),
        expectedResult: `${req.title} functions correctly and meets acceptance criteria`,
        testData: this.generateTestData(req),
        postconditions: ['System state is consistent', 'No errors logged']
      };
      testCases.push(testCase);
      testId++;
    });

    return [{
      id: 'positive-test-cases',
      type: 'test-cases',
      title: 'Positive Test Cases',
      content: this.formatTestCases(testCases),
      order: 2,
      testCases: testCases
    }];
  }

  /**
   * Generate system components for architecture
   */
  generateSystemComponents(input, analysis, context) {
    const components = [];

    // Core components based on functionality
    const coreComponents = [
      {
        name: 'User Interface Layer',
        type: 'Presentation',
        responsibility: 'Handle user interactions and display information',
        description: 'Provides the front-end interface for user interactions, including web and mobile interfaces.',
        interfaces: [
          { name: 'REST API', description: 'Communication with backend services', protocol: 'HTTPS' },
          { name: 'WebSocket', description: 'Real-time updates', protocol: 'WSS' }
        ],
        dependencies: ['Application Services', 'Authentication Service'],
        technology: analysis.techStack?.frontend || 'React/Angular'
      },
      {
        name: 'Application Services',
        type: 'Business Logic',
        responsibility: 'Implement core business logic and orchestrate operations',
        description: 'Contains the main business logic and coordinates between different system components.',
        interfaces: [
          { name: 'Service API', description: 'Internal service communication', protocol: 'HTTP/gRPC' },
          { name: 'Event Bus', description: 'Asynchronous communication', protocol: 'Message Queue' }
        ],
        dependencies: ['Data Access Layer', 'External Services'],
        technology: analysis.techStack?.backend || 'Node.js/Java'
      },
      {
        name: 'Data Access Layer',
        type: 'Data',
        responsibility: 'Manage data persistence and retrieval operations',
        description: 'Handles all database operations and data management functionality.',
        interfaces: [
          { name: 'Database Connection', description: 'Database access', protocol: 'SQL/NoSQL' },
          { name: 'Cache Interface', description: 'Caching operations', protocol: 'Redis/Memcached' }
        ],
        dependencies: ['Database', 'Caching Layer'],
        technology: analysis.techStack?.database || 'PostgreSQL/MongoDB'
      }
    ];

    components.push(...coreComponents);

    // Add domain-specific components
    if (analysis.domain === 'ecommerce') {
      components.push({
        name: 'Payment Processing',
        type: 'Integration',
        responsibility: 'Handle payment transactions and financial operations',
        description: 'Manages payment processing, refunds, and financial transaction security.',
        interfaces: [
          { name: 'Payment Gateway API', description: 'External payment processing', protocol: 'HTTPS' }
        ],
        dependencies: ['Payment Gateway', 'Fraud Detection Service'],
        technology: 'Payment Gateway SDK'
      });
    }

    return [{
      id: 'system-components',
      type: 'architecture',
      title: 'System Components',
      content: this.formatSystemComponents(components),
      order: 2,
      components: components
    }];
  }

  /**
   * Analyze intent phase - extract and enhance intent understanding
   */
  analyzeIntentPhase(input, analysis) {
    const intentAnalysis = {
      primaryIntent: analysis.intent,
      secondaryIntents: this.extractSecondaryIntents(input),
      intentConfidence: this.calculateIntentConfidence(input, analysis),
      suggestedApproach: this.suggestDocumentationApproach(analysis.intent),
      contextualFactors: this.identifyContextualFactors(input, analysis)
    };

    return [{
      id: 'intent-analysis',
      type: 'intent-analysis',
      title: 'Intent Analysis',
      content: this.formatIntentAnalysis(intentAnalysis),
      order: 1,
      analysis: intentAnalysis
    }];
  }

  /**
   * Extract entities phase - enhanced entity extraction
   */
  extractEntitiesPhase(input, analysis) {
    const enhancedEntities = {
      ...analysis.entities,
      relationships: this.identifyEntityRelationships(analysis.entities),
      priorities: this.prioritizeEntities(analysis.entities, input),
      missingEntities: this.identifyMissingEntities(input, analysis.entities)
    };

    return [{
      id: 'entity-extraction',
      type: 'entity-extraction',
      title: 'Entity Analysis',
      content: this.formatEntityAnalysis(enhancedEntities),
      order: 1,
      entities: enhancedEntities
    }];
  }

  /**
   * Generate constraints from analysis
   */
  generateConstraints(analysis, context) {
    const constraints = [];
    let constraintId = 1;

    // Technical constraints
    if (analysis.techStack) {
      Object.entries(analysis.techStack).forEach(([category, tech]) => {
        constraints.push({
          id: `CONST-${String(constraintId).padStart(3, '0')}`,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Technology Constraint`,
          category: 'Technical',
          type: 'technology',
          description: `The system must be implemented using ${tech} technology stack for ${category} components.`,
          impact: 'Medium',
          rationale: `Organizational standard for ${category} development`
        });
        constraintId++;
      });
    }

    // Domain-specific constraints
    if (analysis.domain !== 'general') {
      const domainConstraints = this.getDomainSpecificConstraints(analysis.domain);
      domainConstraints.forEach(constraint => {
        constraints.push({
          id: `CONST-${String(constraintId).padStart(3, '0')}`,
          ...constraint
        });
        constraintId++;
      });
    }

    // Business constraints
    if (context.budget || context.timeline) {
      constraints.push({
        id: `CONST-${String(constraintId).padStart(3, '0')}`,
        title: 'Resource Constraints',
        category: 'Business',
        type: 'resource',
        description: `Project must be completed within ${context.timeline || 'specified timeline'} and ${context.budget || 'allocated budget'}.`,
        impact: 'High',
        rationale: 'Business requirements and resource allocation'
      });
    }

    return [{
      id: 'constraints',
      type: 'constraints',
      title: 'Constraints and Limitations',
      content: this.formatConstraints(constraints),
      order: 4,
      constraints: constraints
    }];
  }

  /**
   * Generate acceptance criteria for existing sections
   */
  generateAcceptanceCriteria(analysis, existingSections) {
    const acceptanceCriteria = [];
    let criteriaId = 1;

    // Find requirements or stories from existing sections
    const requirementsSection = existingSections.find(s => s.type === 'functional-requirements');
    const storiesSection = existingSections.find(s => s.type === 'user-stories');

    if (requirementsSection && requirementsSection.requirements) {
      requirementsSection.requirements.forEach(req => {
        req.acceptanceCriteria.forEach(criteria => {
          acceptanceCriteria.push({
            id: `AC-${String(criteriaId).padStart(3, '0')}`,
            requirementId: req.id,
            title: `Acceptance Criteria for ${req.title}`,
            criteria: criteria,
            testable: true,
            priority: req.priority
          });
          criteriaId++;
        });
      });
    }

    if (storiesSection && storiesSection.stories) {
      storiesSection.stories.forEach(story => {
        story.acceptanceCriteria.forEach(criteria => {
          acceptanceCriteria.push({
            id: `AC-${String(criteriaId).padStart(3, '0')}`,
            storyId: story.id,
            title: `Acceptance Criteria for ${story.title}`,
            given: criteria.given,
            when: criteria.when,
            then: criteria.then,
            testable: true,
            priority: story.priority
          });
          criteriaId++;
        });
      });
    }

    return [{
      id: 'acceptance-criteria-list',
      type: 'acceptance-criteria',
      title: 'Acceptance Criteria',
      content: this.formatAcceptanceCriteria(acceptanceCriteria),
      order: 5,
      criteria: acceptanceCriteria
    }];
  }

  /**
   * Generate personas for user stories
   */
  generatePersonas(input, analysis, context) {
    const personas = [];
    const basePersonas = this.getBasePersonas(analysis.domain);
    let personaId = 1;

    basePersonas.forEach(basePersona => {
      const persona = {
        id: `PERSONA-${String(personaId).padStart(2, '0')}`,
        name: basePersona.name,
        role: basePersona.role,
        description: basePersona.description,
        goals: basePersona.goals,
        painPoints: basePersona.painPoints,
        technicalProficiency: basePersona.technicalProficiency,
        context: this.getPersonaContext(basePersona, analysis, context)
      };
      personas.push(persona);
      personaId++;
    });

    return [{
      id: 'personas',
      type: 'personas',
      title: 'User Personas',
      content: this.formatPersonas(personas),
      order: 1,
      personas: personas
    }];
  }

  /**
   * Generate epics from input analysis
   */
  generateEpics(input, analysis, context) {
    const epics = [];
    const epicThemes = this.identifyEpicThemes(input, analysis);
    let epicId = 1;

    epicThemes.forEach(theme => {
      const epic = {
        id: `EPIC-${String(epicId).padStart(2, '0')}`,
        title: theme.title,
        description: theme.description,
        businessValue: theme.businessValue,
        acceptanceCriteria: theme.acceptanceCriteria,
        estimatedStories: theme.estimatedStories,
        priority: theme.priority,
        dependencies: theme.dependencies || []
      };
      epics.push(epic);
      epicId++;
    });

    return [{
      id: 'epics',
      type: 'epics',
      title: 'Epics Overview',
      content: this.formatEpics(epics),
      order: 2,
      epics: epics
    }];
  }

  /**
   * Analyze test scope from requirements
   */
  analyzeTestScope(input, analysis, existingSections) {
    const testScope = {
      scopeAreas: this.identifyTestScopeAreas(analysis, existingSections),
      testLevels: ['unit', 'integration', 'system', 'acceptance'],
      testTypes: this.determineApplicableTestTypes(analysis),
      riskAreas: this.identifyHighRiskAreas(analysis, existingSections),
      testingApproach: this.recommendTestingApproach(analysis),
      estimatedTestCases: this.estimateTestCaseCount(analysis, existingSections)
    };

    return [{
      id: 'test-scope-analysis',
      type: 'test-scope',
      title: 'Test Scope Analysis',
      content: this.formatTestScope(testScope),
      order: 1,
      scope: testScope
    }];
  }

  /**
   * Generate negative test cases
   */
  generateNegativeTestCases(analysis, existingSections) {
    const testCases = [];
    let testId = 50; // Start after positive tests

    // Find requirements from existing sections
    const requirementsSection = existingSections.find(s => s.type === 'functional-requirements');
    const requirements = requirementsSection?.requirements || [];

    requirements.slice(0, 5).forEach(req => {
      // Generate boundary test cases
      const boundaryTest = {
        id: `TC-${String(testId).padStart(3, '0')}`,
        title: `Boundary Test for ${req.title}`,
        objective: `Test boundary conditions for ${req.title.toLowerCase()}`,
        priority: req.priority,
        category: 'Negative',
        type: 'Boundary',
        preconditions: this.generateTestPreconditions(req),
        steps: this.generateTestSteps(req, 'boundary'),
        expectedResult: 'System handles boundary conditions gracefully with appropriate error messages',
        testData: this.generateBoundaryTestData(req),
        postconditions: ['System state remains consistent', 'Appropriate error logged']
      };
      testCases.push(boundaryTest);
      testId++;

      // Generate invalid input test cases
      const invalidInputTest = {
        id: `TC-${String(testId).padStart(3, '0')}`,
        title: `Invalid Input Test for ${req.title}`,
        objective: `Test ${req.title.toLowerCase()} with invalid inputs`,
        priority: req.priority,
        category: 'Negative',
        type: 'Invalid Input',
        preconditions: this.generateTestPreconditions(req),
        steps: this.generateTestSteps(req, 'invalid'),
        expectedResult: 'System rejects invalid input with clear error message',
        testData: this.generateInvalidTestData(req),
        postconditions: ['No data corruption', 'Error logged with details']
      };
      testCases.push(invalidInputTest);
      testId++;
    });

    return [{
      id: 'negative-test-cases',
      type: 'test-cases',
      title: 'Negative Test Cases',
      content: this.formatTestCases(testCases),
      order: 3,
      testCases: testCases
    }];
  }

  /**
   * Generate edge case tests
   */
  generateEdgeCaseTests(analysis, existingSections) {
    const edgeCases = [];
    let testId = 100; // Start after negative tests

    // Identify edge cases based on system complexity
    const edgeCaseScenarios = this.identifyEdgeCaseScenarios(analysis, existingSections);

    edgeCaseScenarios.forEach(scenario => {
      const edgeTest = {
        id: `TC-${String(testId).padStart(3, '0')}`,
        title: scenario.title,
        objective: scenario.objective,
        priority: 'Medium',
        category: 'Edge Case',
        type: scenario.type,
        preconditions: scenario.preconditions,
        steps: scenario.steps,
        expectedResult: scenario.expectedResult,
        testData: scenario.testData,
        postconditions: scenario.postconditions,
        notes: `Edge case identified based on ${scenario.source}`
      };
      edgeCases.push(edgeTest);
      testId++;
    });

    return [{
      id: 'edge-case-tests',
      type: 'test-cases',
      title: 'Edge Case Tests',
      content: this.formatTestCases(edgeCases),
      order: 4,
      testCases: edgeCases
    }];
  }

  /**
   * Generate interface specifications
   */
  generateInterfaceSpecifications(analysis, existingSections) {
    const interfaces = [];
    const componentsSection = existingSections.find(s => s.type === 'architecture');
    const components = componentsSection?.components || [];

    components.forEach((component, index) => {
      if (component.interfaces) {
        component.interfaces.forEach((iface, ifaceIndex) => {
          const interfaceSpec = {
            id: `INT-${String(index + 1).padStart(2, '0')}-${String(ifaceIndex + 1).padStart(2, '0')}`,
            name: iface.name,
            component: component.name,
            protocol: iface.protocol,
            description: iface.description,
            methods: this.generateInterfaceMethods(iface, component),
            dataFormats: this.getInterfaceDataFormats(iface.protocol),
            securityRequirements: this.getInterfaceSecurityRequirements(iface),
            errorHandling: this.getInterfaceErrorHandling(iface)
          };
          interfaces.push(interfaceSpec);
        });
      }
    });

    return [{
      id: 'interface-specifications',
      type: 'interface-specs',
      title: 'Interface Specifications',
      content: this.formatInterfaceSpecs(interfaces),
      order: 3,
      interfaces: interfaces
    }];
  }

  /**
   * Generate security requirements
   */
  generateSecurityRequirements(analysis, context) {
    const securityReqs = [];
    let reqId = 1;

    // Authentication requirements
    securityReqs.push({
      id: `SEC-${String(reqId).padStart(3, '0')}`,
      title: 'Authentication Requirements',
      category: 'Authentication',
      description: 'The system shall implement secure authentication mechanisms for all user access.',
      requirements: [
        'Multi-factor authentication for administrative access',
        'Strong password policies enforcement',
        'Session timeout and management',
        'Account lockout after failed attempts'
      ],
      compliance: this.getComplianceRequirements(analysis.domain)
    });
    reqId++;

    // Authorization requirements
    securityReqs.push({
      id: `SEC-${String(reqId).padStart(3, '0')}`,
      title: 'Authorization Requirements',
      category: 'Authorization',
      description: 'The system shall implement role-based access control for all system resources.',
      requirements: [
        'Role-based access control (RBAC)',
        'Principle of least privilege',
        'Regular access reviews',
        'Audit logging of access decisions'
      ]
    });
    reqId++;

    // Data protection requirements
    securityReqs.push({
      id: `SEC-${String(reqId).padStart(3, '0')}`,
      title: 'Data Protection Requirements',
      category: 'Data Protection',
      description: 'The system shall protect sensitive data through encryption and access controls.',
      requirements: [
        'Encryption of data at rest and in transit',
        'Data classification and handling procedures',
        'Secure data backup and recovery',
        'Data retention and disposal policies'
      ]
    });

    return [{
      id: 'security-requirements',
      type: 'security-requirements',
      title: 'Security Requirements',
      content: this.formatSecurityRequirements(securityReqs),
      order: 5,
      requirements: securityReqs
    }];
  }

  /**
   * Generate product vision
   */
  generateProductVision(input, analysis, context) {
    const vision = {
      visionStatement: this.createVisionStatement(input, analysis),
      problemStatement: this.identifyProblemStatement(input, analysis),
      targetMarket: this.identifyTargetMarket(analysis, context),
      keyBenefits: this.identifyKeyBenefits(input, analysis),
      successMetrics: this.defineSuccessMetrics(analysis, context),
      competitiveAdvantage: this.identifyCompetitiveAdvantage(input, analysis)
    };

    return [{
      id: 'product-vision',
      type: 'product-vision',
      title: 'Product Vision',
      content: this.formatProductVision(vision),
      order: 1,
      vision: vision
    }];
  }

  /**
   * Generate market analysis
   */
  generateMarketAnalysis(analysis, context) {
    const marketAnalysis = {
      marketSize: this.estimateMarketSize(analysis.domain),
      targetSegments: this.identifyTargetSegments(analysis, context),
      competitorAnalysis: this.generateCompetitorAnalysis(analysis.domain),
      marketTrends: this.identifyMarketTrends(analysis.domain),
      opportunities: this.identifyMarketOpportunities(analysis),
      threats: this.identifyMarketThreats(analysis.domain)
    };

    return [{
      id: 'market-analysis',
      type: 'market-analysis',
      title: 'Market Analysis',
      content: this.formatMarketAnalysis(marketAnalysis),
      order: 2,
      analysis: marketAnalysis
    }];
  }

  /**
   * Generate feature specifications
   */
  generateFeatureSpecifications(input, analysis, context) {
    const features = [];
    const coreFeatures = this.identifyCoreFeatures(input, analysis);
    let featureId = 1;

    coreFeatures.forEach(feature => {
      const featureSpec = {
        id: `FEAT-${String(featureId).padStart(3, '0')}`,
        name: feature.name,
        description: feature.description,
        priority: feature.priority,
        complexity: feature.complexity,
        dependencies: feature.dependencies,
        acceptanceCriteria: feature.acceptanceCriteria,
        technicalRequirements: feature.technicalRequirements,
        businessValue: feature.businessValue,
        effort: feature.effort
      };
      features.push(featureSpec);
      featureId++;
    });

    return [{
      id: 'feature-specifications',
      type: 'feature-specs',
      title: 'Feature Specifications',
      content: this.formatFeatureSpecs(features),
      order: 3,
      features: features
    }];
  }

  /**
   * Generate additional requirements based on analysis
   */
  generateAdditionalRequirement(analysis, existingRequirements, context) {
    const existingTitles = existingRequirements.map(req => req.title.toLowerCase());
    const additionalReqTypes = [
      'error handling',
      'logging and monitoring',
      'backup and recovery',
      'integration',
      'configuration management'
    ];

    // Find a requirement type that hasn't been covered
    const uncoveredType = additionalReqTypes.find(type =>
      !existingTitles.some(title => title.includes(type))
    );

    if (!uncoveredType) return null;

    const reqId = existingRequirements.length + 1;
    return {
      id: `REQ-${String(reqId).padStart(3, '0')}`,
      title: `${uncoveredType.charAt(0).toUpperCase() + uncoveredType.slice(1)} Capability`,
      priority: 'Medium',
      category: 'Supporting Functionality',
      description: `The system shall provide comprehensive ${uncoveredType} capabilities to ensure reliable operation.`,
      acceptanceCriteria: [
        `${uncoveredType.charAt(0).toUpperCase() + uncoveredType.slice(1)} functionality is implemented`,
        'Functionality meets industry standards',
        'Appropriate documentation is provided'
      ],
      status: 'Draft',
      source: 'Gap Analysis'
    };
  }

  /**
   * Helper methods for content generation
   */
  generateRequirementTitle(input) {
    const words = input.split(' ').slice(0, 5);
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Capability';
  }

  generateRequirementDescription(input, analysis) {
    const entities = analysis.entities;
    const stakeholder = entities.stakeholders?.[0] || 'user';
    const action = entities.actions?.[0] || 'interact with';
    const object = entities.objects?.[0] || 'the system';

    return `The system shall enable the ${stakeholder} to ${action} ${object} in accordance with business requirements and user expectations. This capability supports the core functionality described in: "${input.substring(0, 100)}${input.length > 100 ? '...' : ''}".`;
  }

  generateBasicAcceptanceCriteria(input) {
    return [
      'Functionality is accessible to authorized users',
      'Operations complete successfully under normal conditions',
      'Appropriate feedback is provided to users',
      'Error handling is implemented for edge cases'
    ];
  }

  generateStoryBenefit(action, persona) {
    const benefits = {
      'view': 'I can access the information I need quickly and efficiently',
      'create': 'I can add new data to support my work processes',
      'update': 'I can modify existing information to keep it current',
      'delete': 'I can remove outdated or incorrect information',
      'manage': 'I can oversee and control system operations effectively'
    };

    return benefits[action] || 'I can accomplish my tasks more effectively';
  }

  estimateStoryPoints(action, persona) {
    const complexity = {
      'view': 2,
      'create': 3,
      'update': 5,
      'delete': 3,
      'manage': 8
    };

    const personaMultiplier = persona === 'Administrator' ? 1.5 : 1;
    return Math.ceil((complexity[action] || 3) * personaMultiplier);
  }

  generateStoryAcceptanceCriteria(action, persona) {
    return [
      {
        given: `I am an authenticated ${persona.toLowerCase()}`,
        when: `I attempt to ${action} information`,
        then: `The system allows me to ${action} successfully`
      },
      {
        given: 'The system is functioning normally',
        when: `I complete the ${action} operation`,
        then: 'I receive confirmation of the successful operation'
      }
    ];
  }

  generateTestPreconditions(requirement) {
    return [
      'System is running and accessible',
      'Test user has appropriate permissions',
      'Test data is available and configured',
      'Network connectivity is stable'
    ];
  }

  generateTestSteps(requirement, testType) {
    const baseSteps = [
      { stepNumber: 1, action: 'Navigate to the application', expectedResult: 'Application loads successfully' },
      { stepNumber: 2, action: 'Authenticate with valid credentials', expectedResult: 'User is logged in' },
      { stepNumber: 3, action: `Access ${requirement.title.toLowerCase()} feature`, expectedResult: 'Feature is accessible' },
      { stepNumber: 4, action: `Execute ${requirement.title.toLowerCase()} operation`, expectedResult: 'Operation completes successfully' }
    ];

    if (testType === 'negative') {
      baseSteps[3] = {
        stepNumber: 4,
        action: `Execute ${requirement.title.toLowerCase()} with invalid data`,
        expectedResult: 'Appropriate error message is displayed'
      };
    }

    return baseSteps;
  }

  generateTestData(requirement) {
    return [
      { name: 'Valid Test User', value: 'testuser@example.com' },
      { name: 'Test Password', value: 'TestPass123!' },
      { name: 'Sample Data', value: 'Valid test data for the operation' }
    ];
  }

  /**
   * Content quality enhancement
   */
  async enhanceContentQuality(sections, documentType, context) {
    const enhanced = sections.map(section => {
      const enhancedSection = { ...section };

      // Add examples if configured
      if (this.config.includeExamples) {
        enhancedSection.examples = this.generateExamples(section, documentType);
      }

      // Add best practices if configured
      if (this.config.includeBestPractices) {
        enhancedSection.bestPractices = this.generateBestPractices(section, documentType);
      }

      // Ensure minimum content length
      if (section.content && section.content.length < this.config.minSectionLength) {
        enhancedSection.content = this.expandSectionContent(section.content, section.type);
      }

      return enhancedSection;
    });

    return enhanced;
  }

  generateExamples(section, documentType) {
    const exampleGenerators = {
      'functional-requirements': () => [
        'Example: User registration with email validation',
        'Example: Automated data backup every 24 hours',
        'Example: Real-time notification system'
      ],
      'user-stories': () => [
        'Example: As a customer, I want to track my order status',
        'Example: As an admin, I want to generate reports',
        'Example: As a user, I want to reset my password'
      ],
      'test-cases': () => [
        'Example: Verify login with valid credentials',
        'Example: Test form validation with empty fields',
        'Example: Verify data persistence after save operation'
      ]
    };

    const generator = exampleGenerators[section.type];
    return generator ? generator() : [];
  }

  generateBestPractices(section, documentType) {
    const practiceGenerators = {
      'functional-requirements': () => [
        'Use clear, unambiguous language',
        'Include measurable acceptance criteria',
        'Maintain traceability to business objectives'
      ],
      'user-stories': () => [
        'Follow the INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable)',
        'Include clear acceptance criteria',
        'Prioritize stories based on business value'
      ],
      'test-cases': () => [
        'Write test cases that are independent of each other',
        'Include both positive and negative test scenarios',
        'Maintain test data separately from test logic'
      ]
    };

    const generator = practiceGenerators[section.type];
    return generator ? generator() : [];
  }

  expandSectionContent(content, sectionType) {
    const additionalContent = {
      'functional-requirements': '\n\nThese requirements form the foundation of the system functionality and should be reviewed regularly to ensure they continue to meet business needs.',
      'user-stories': '\n\nThese user stories should be refined during sprint planning and updated based on stakeholder feedback.',
      'test-cases': '\n\nTest cases should be executed in the specified order and results should be documented for traceability.'
    };

    return content + (additionalContent[sectionType] || '\n\nAdditional details and considerations should be reviewed during implementation.');
  }

  /**
   * Format methods for different content types
   */
  formatRequirements(requirements) {
    return requirements.map(req => `
### ${req.id}: ${req.title}

**Priority:** ${req.priority}
**Category:** ${req.category}
**Status:** ${req.status}

**Description:**
${req.description}

**Acceptance Criteria:**
${req.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}

**Source:** ${req.source}

---
`).join('\n');
  }

  formatNonFunctionalRequirements(requirements) {
    return requirements.map(req => `
### ${req.id}: ${req.title}

**Category:** ${req.category}

**Description:**
${req.description}

**Success Metrics:**
${req.metrics.map(metric => `- ${metric}`).join('\n')}

**Test Criteria:** ${req.testCriteria}

---
`).join('\n');
  }

  formatUserStories(stories) {
    return stories.map(story => `
### Story ${story.id}: ${story.title}

**As a** ${story.persona},
**I want** to ${story.goal},
**So that** ${story.benefit}.

**Priority:** ${story.priority}
**Story Points:** ${story.storyPoints}

**Acceptance Criteria:**
${story.acceptanceCriteria.map(criteria =>
  `- **Given** ${criteria.given}  \n  **When** ${criteria.when}  \n  **Then** ${criteria.then}`
).join('\n')}

**Notes:** ${story.notes}

---
`).join('\n');
  }

  formatTestCases(testCases) {
    return testCases.map(tc => `
### Test Case ${tc.id}: ${tc.title}

**Objective:** ${tc.objective}
**Priority:** ${tc.priority}
**Category:** ${tc.category}
**Type:** ${tc.type}

**Preconditions:**
${tc.preconditions.map(pre => `- ${pre}`).join('\n')}

**Test Steps:**
| Step | Action | Expected Result |
|------|--------|-----------------|
${tc.steps.map(step => `| ${step.stepNumber} | ${step.action} | ${step.expectedResult} |`).join('\n')}

**Test Data:**
${tc.testData.map(data => `- **${data.name}:** ${data.value}`).join('\n')}

**Expected Result:** ${tc.expectedResult}

**Postconditions:**
${tc.postconditions.map(post => `- ${post}`).join('\n')}

---
`).join('\n');
  }

  formatSystemComponents(components) {
    return components.map(comp => `
### ${comp.name}

**Type:** ${comp.type}
**Technology:** ${comp.technology}

**Responsibility:**
${comp.responsibility}

**Description:**
${comp.description}

**Interfaces:**
${comp.interfaces.map(iface => `- **${iface.name}:** ${iface.description} (${iface.protocol})`).join('\n')}

**Dependencies:**
${comp.dependencies.map(dep => `- ${dep}`).join('\n')}

---
`).join('\n');
  }

  /**
   * Analysis helper methods
   */
  assessComplexity(input) {
    const words = input.split(/\s+/).length;
    const indicators = ['integrate', 'complex', 'enterprise', 'scalable', 'distributed', 'microservice'];
    const hasComplexityIndicators = indicators.some(indicator => input.toLowerCase().includes(indicator));

    if (words > 50 || hasComplexityIndicators) return 'high';
    if (words > 20) return 'medium';
    return 'low';
  }

  identifyDomain(input, context) {
    const domains = {
      'healthcare': ['patient', 'medical', 'clinical', 'hospital', 'diagnosis'],
      'finance': ['payment', 'banking', 'financial', 'transaction', 'account'],
      'ecommerce': ['shop', 'cart', 'checkout', 'product', 'order'],
      'education': ['student', 'course', 'learning', 'education', 'academic'],
      'manufacturing': ['production', 'inventory', 'supply', 'manufacturing', 'warehouse']
    };

    const inputLower = input.toLowerCase();
    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        return domain;
      }
    }

    return context.domain || 'general';
  }

  extractEntities(input) {
    const words = input.toLowerCase().split(/\W+/);

    return {
      stakeholders: words.filter(word => ['user', 'admin', 'customer', 'manager', 'operator'].includes(word)),
      actions: words.filter(word => ['create', 'read', 'update', 'delete', 'manage', 'process', 'generate'].includes(word)),
      objects: words.filter(word => ['data', 'report', 'document', 'record', 'file', 'information'].includes(word)),
      technologies: words.filter(word => ['api', 'database', 'web', 'mobile', 'cloud', 'microservice'].includes(word))
    };
  }

  analyzeIntent(input) {
    const intentPatterns = {
      'create': /create|build|develop|generate|make/i,
      'manage': /manage|administer|control|oversee/i,
      'process': /process|handle|execute|perform/i,
      'analyze': /analyze|report|track|monitor/i,
      'integrate': /integrate|connect|interface|sync/i
    };

    for (const [intent, pattern] of Object.entries(intentPatterns)) {
      if (pattern.test(input)) {
        return intent;
      }
    }

    return 'general';
  }

  assessScope(input, context) {
    const scopeIndicators = {
      'enterprise': ['enterprise', 'organization-wide', 'company', 'corporate'],
      'department': ['department', 'team', 'group', 'division'],
      'project': ['project', 'application', 'system', 'solution'],
      'feature': ['feature', 'functionality', 'capability', 'component']
    };

    const inputLower = input.toLowerCase();
    for (const [scope, indicators] of Object.entries(scopeIndicators)) {
      if (indicators.some(indicator => inputLower.includes(indicator))) {
        return scope;
      }
    }

    return 'project';
  }

  identifyTechnology(input) {
    const techKeywords = {
      frontend: ['react', 'angular', 'vue', 'javascript', 'html', 'css'],
      backend: ['node', 'java', 'python', 'c#', 'php', 'ruby'],
      database: ['sql', 'mysql', 'postgresql', 'mongodb', 'database'],
      cloud: ['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker']
    };

    const inputLower = input.toLowerCase();
    const identified = {};

    for (const [category, keywords] of Object.entries(techKeywords)) {
      const found = keywords.filter(keyword => inputLower.includes(keyword));
      if (found.length > 0) {
        identified[category] = found[0];
      }
    }

    return identified;
  }

  extractBusinessContext(input, context) {
    return {
      budget: context.budget || 'unspecified',
      timeline: context.timeline || 'unspecified',
      stakeholders: context.stakeholders || [],
      businessObjectives: context.businessObjectives || [],
      successMetrics: context.successMetrics || []
    };
  }

  /**
   * Helper methods for new phase implementations
   */
  extractSecondaryIntents(input) {
    const intents = [];
    const inputLower = input.toLowerCase();

    if (inputLower.includes('integrate') || inputLower.includes('connect')) intents.push('integration');
    if (inputLower.includes('secure') || inputLower.includes('protect')) intents.push('security');
    if (inputLower.includes('scale') || inputLower.includes('performance')) intents.push('scalability');
    if (inputLower.includes('maintain') || inputLower.includes('support')) intents.push('maintainability');

    return intents;
  }

  calculateIntentConfidence(input, analysis) {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on keyword density
    const keywords = analysis.intent === 'create' ? ['create', 'build', 'develop'] :
                    analysis.intent === 'manage' ? ['manage', 'control', 'administer'] : [];

    const keywordCount = keywords.reduce((count, keyword) =>
      count + (input.toLowerCase().split(keyword).length - 1), 0);

    confidence += Math.min(keywordCount * 0.1, 0.4);

    return Math.min(confidence, 1.0);
  }

  suggestDocumentationApproach(intent) {
    const approaches = {
      'create': 'Requirements-driven approach with detailed specifications',
      'manage': 'Process-focused approach with workflows and procedures',
      'analyze': 'Data-driven approach with metrics and KPIs',
      'integrate': 'Architecture-focused approach with interface specifications'
    };

    return approaches[intent] || 'Comprehensive documentation approach';
  }

  identifyContextualFactors(input, analysis) {
    return {
      urgency: analysis.urgency || 'medium',
      complexity: analysis.complexity,
      domain: analysis.domain,
      stakeholderCount: analysis.entities.stakeholders.length,
      technicalScope: analysis.entities.technologies.length
    };
  }

  formatIntentAnalysis(intentAnalysis) {
    return `## Intent Analysis

**Primary Intent:** ${intentAnalysis.primaryIntent}
**Confidence Level:** ${Math.round(intentAnalysis.intentConfidence * 100)}%

**Secondary Intents:**
${intentAnalysis.secondaryIntents.map(intent => `- ${intent}`).join('\n')}

**Suggested Approach:** ${intentAnalysis.suggestedApproach}

**Contextual Factors:**
${Object.entries(intentAnalysis.contextualFactors).map(([key, value]) => `- **${key}:** ${value}`).join('\n')}`;
  }

  identifyEntityRelationships(entities) {
    const relationships = [];

    entities.stakeholders.forEach(stakeholder => {
      entities.actions.forEach(action => {
        entities.objects.forEach(object => {
          relationships.push({
            stakeholder,
            action,
            object,
            type: 'performs'
          });
        });
      });
    });

    return relationships.slice(0, 10); // Limit to top 10
  }

  prioritizeEntities(entities, input) {
    const priorities = {};
    const inputLower = input.toLowerCase();

    // Priority based on frequency in input
    Object.entries(entities).forEach(([category, items]) => {
      priorities[category] = items.map(item => ({
        entity: item,
        priority: inputLower.split(item).length - 1
      })).sort((a, b) => b.priority - a.priority);
    });

    return priorities;
  }

  identifyMissingEntities(input, entities) {
    const commonMissing = {
      stakeholders: ['system administrator', 'end user', 'guest'],
      actions: ['validate', 'authenticate', 'backup'],
      objects: ['configuration', 'logs', 'metrics'],
      technologies: ['database', 'api', 'security']
    };

    const missing = {};
    Object.entries(commonMissing).forEach(([category, commonItems]) => {
      missing[category] = commonItems.filter(item =>
        !entities[category].includes(item) && input.toLowerCase().includes(item.split(' ')[0])
      );
    });

    return missing;
  }

  formatEntityAnalysis(entities) {
    return `## Entity Analysis

**Stakeholders:** ${entities.stakeholders.join(', ')}
**Actions:** ${entities.actions.join(', ')}
**Objects:** ${entities.objects.join(', ')}
**Technologies:** ${entities.technologies.join(', ')}

**Key Relationships:**
${entities.relationships.slice(0, 5).map(rel =>
  `- ${rel.stakeholder} ${rel.action}s ${rel.object}`
).join('\n')}

**Missing Entities:**
${Object.entries(entities.missingEntities).map(([category, items]) =>
  items.length > 0 ? `- **${category}:** ${items.join(', ')}` : ''
).filter(Boolean).join('\n')}`;
  }

  getDomainSpecificConstraints(domain) {
    const constraintMap = {
      'healthcare': [
        {
          title: 'HIPAA Compliance',
          category: 'Regulatory',
          type: 'compliance',
          description: 'System must comply with HIPAA privacy and security requirements.',
          impact: 'High',
          rationale: 'Legal requirement for healthcare data protection'
        },
        {
          title: 'Data Retention',
          category: 'Regulatory',
          type: 'data-management',
          description: 'Patient data must be retained for minimum 7 years.',
          impact: 'Medium',
          rationale: 'Healthcare industry standard'
        }
      ],
      'finance': [
        {
          title: 'SOX Compliance',
          category: 'Regulatory',
          type: 'compliance',
          description: 'System must maintain audit trails for financial transactions.',
          impact: 'High',
          rationale: 'Sarbanes-Oxley Act requirement'
        },
        {
          title: 'PCI DSS Compliance',
          category: 'Security',
          type: 'compliance',
          description: 'Payment processing must comply with PCI DSS standards.',
          impact: 'High',
          rationale: 'Required for credit card processing'
        }
      ]
    };

    return constraintMap[domain] || [];
  }

  formatConstraints(constraints) {
    return constraints.map(constraint => `
### ${constraint.id}: ${constraint.title}

**Category:** ${constraint.category}
**Type:** ${constraint.type}
**Impact:** ${constraint.impact}

**Description:**
${constraint.description}

**Rationale:** ${constraint.rationale}

---
`).join('\n');
  }

  formatAcceptanceCriteria(criteria) {
    return criteria.map(ac => `
### ${ac.id}: ${ac.title}

${ac.given ? `**Given:** ${ac.given}\\n**When:** ${ac.when}\\n**Then:** ${ac.then}` : `**Criteria:** ${ac.criteria}`}

**Priority:** ${ac.priority}
**Testable:** ${ac.testable ? 'Yes' : 'No'}

---
`).join('\n');
  }

  getBasePersonas(domain) {
    const personaMap = {
      'healthcare': [
        {
          name: 'Dr. Sarah Johnson',
          role: 'Physician',
          description: 'Primary care physician who needs quick access to patient information',
          goals: ['Access patient records quickly', 'Update treatment plans', 'Communicate with patients'],
          painPoints: ['Slow system response', 'Complex navigation', 'Data entry burden'],
          technicalProficiency: 'Medium'
        },
        {
          name: 'Nurse Manager Lisa',
          role: 'Nurse Manager',
          description: 'Oversees nursing staff and patient care coordination',
          goals: ['Monitor patient care', 'Manage staff schedules', 'Ensure compliance'],
          painPoints: ['Manual reporting', 'Communication gaps', 'Administrative overhead'],
          technicalProficiency: 'High'
        }
      ],
      'ecommerce': [
        {
          name: 'Customer Jane',
          role: 'Online Shopper',
          description: 'Regular customer who shops online for convenience',
          goals: ['Find products quickly', 'Complete purchase easily', 'Track orders'],
          painPoints: ['Complicated checkout', 'Poor search results', 'Delivery delays'],
          technicalProficiency: 'Medium'
        },
        {
          name: 'Store Manager Mike',
          role: 'Store Manager',
          description: 'Manages online store operations and inventory',
          goals: ['Monitor sales', 'Manage inventory', 'Analyze customer behavior'],
          painPoints: ['Manual inventory updates', 'Limited analytics', 'System downtime'],
          technicalProficiency: 'High'
        }
      ]
    };

    return personaMap[domain] || [
      {
        name: 'End User',
        role: 'System User',
        description: 'Primary user of the system',
        goals: ['Accomplish tasks efficiently', 'Access information easily'],
        painPoints: ['System complexity', 'Slow performance'],
        technicalProficiency: 'Medium'
      },
      {
        name: 'Administrator',
        role: 'System Admin',
        description: 'Manages system configuration and users',
        goals: ['Maintain system health', 'Manage user access'],
        painPoints: ['Complex configuration', 'Limited monitoring'],
        technicalProficiency: 'High'
      }
    ];
  }

  getPersonaContext(persona, analysis, context) {
    return {
      domain: analysis.domain,
      systemComplexity: analysis.complexity,
      userCount: context.expectedUsers || 'unknown',
      primaryUseCase: analysis.intent
    };
  }

  formatPersonas(personas) {
    return personas.map(persona => `
### ${persona.id}: ${persona.name}

**Role:** ${persona.role}
**Technical Proficiency:** ${persona.technicalProficiency}

**Description:**
${persona.description}

**Goals:**
${persona.goals.map(goal => `- ${goal}`).join('\n')}

**Pain Points:**
${persona.painPoints.map(pain => `- ${pain}`).join('\n')}

---
`).join('\n');
  }

  identifyEpicThemes(input, analysis) {
    const themes = [];
    const inputLower = input.toLowerCase();

    // Core functionality epic
    themes.push({
      title: 'Core Functionality',
      description: 'Primary system capabilities and features',
      businessValue: 'High - Essential for system operation',
      acceptanceCriteria: ['All core features implemented', 'System meets performance requirements'],
      estimatedStories: '8-12',
      priority: 'High',
      dependencies: []
    });

    // User management epic (if mentioned)
    if (inputLower.includes('user') || inputLower.includes('account')) {
      themes.push({
        title: 'User Management',
        description: 'User registration, authentication, and profile management',
        businessValue: 'High - Required for user access control',
        acceptanceCriteria: ['User registration works', 'Authentication is secure', 'Profile management available'],
        estimatedStories: '5-8',
        priority: 'High',
        dependencies: ['Core Functionality']
      });
    }

    // Integration epic (if mentioned)
    if (inputLower.includes('integrat') || inputLower.includes('api')) {
      themes.push({
        title: 'System Integration',
        description: 'Integration with external systems and APIs',
        businessValue: 'Medium - Enhances system capabilities',
        acceptanceCriteria: ['APIs are functional', 'Data synchronization works', 'Error handling implemented'],
        estimatedStories: '4-6',
        priority: 'Medium',
        dependencies: ['Core Functionality']
      });
    }

    return themes;
  }

  formatEpics(epics) {
    return epics.map(epic => `
### ${epic.id}: ${epic.title}

**Description:** ${epic.description}
**Business Value:** ${epic.businessValue}
**Priority:** ${epic.priority}
**Estimated Stories:** ${epic.estimatedStories}

**Acceptance Criteria:**
${epic.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}

**Dependencies:** ${epic.dependencies.length > 0 ? epic.dependencies.join(', ') : 'None'}

---
`).join('\n');
  }

  calculateWordCount(sections) {
    return sections.reduce((total, section) => {
      const content = section.content || '';
      return total + content.split(/\s+/).length;
    }, 0);
  }

  updateMetrics(documentType, expansionRatio, processingTime) {
    // Update average expansion ratio
    const totalExpansions = this.metrics.totalExpansions;
    this.metrics.averageExpansionRatio =
      ((this.metrics.averageExpansionRatio * (totalExpansions - 1)) + expansionRatio) / totalExpansions;

    // Update average processing time
    this.metrics.averageProcessingTime =
      ((this.metrics.averageProcessingTime * (totalExpansions - 1)) + processingTime) / totalExpansions;

    // Update document type metrics
    this.metrics.expansionsByType[documentType] = (this.metrics.expansionsByType[documentType] || 0) + 1;

    this.metrics.successfulExpansions++;
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      healthy: true,
      service: 'content-expansion-engine',
      strategies: this.expansionStrategies.size,
      patterns: this.contentPatterns.size,
      knowledgeBase: this.knowledgeBase.size,
      metrics: this.metrics
    };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      strategiesLoaded: this.expansionStrategies.size,
      patternsLoaded: this.contentPatterns.size,
      knowledgeBaseSize: this.knowledgeBase.size,
      successRate: this.metrics.totalExpansions > 0 ?
        (this.metrics.successfulExpansions / this.metrics.totalExpansions) * 100 : 0
    };
  }
}

// Add initialization timeout protection
const originalInitialize = ContentExpansionEngine.prototype.initialize;
ContentExpansionEngine.prototype.initialize = function() {
  try {
    const startTime = Date.now();
    originalInitialize.call(this);
    const initTime = Date.now() - startTime;

    this.emit('initialization-completed', {
      initializationTime: initTime,
      strategiesLoaded: this.expansionStrategies.size,
      patternsLoaded: this.contentPatterns.size,
      knowledgeBaseLoaded: this.knowledgeBase.size
    });
  } catch (error) {
    this.emit('initialization-failed', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};

module.exports = ContentExpansionEngine;