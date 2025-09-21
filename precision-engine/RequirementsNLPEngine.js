/**
 * Requirements-focused NLP Engine
 * Advanced natural language processing specifically for requirements engineering
 */

const NLPProcessor = require('./NLPProcessor');

class RequirementsNLPEngine extends NLPProcessor {
  constructor() {
    super();
    this.requirementsPatterns = this.initializeRequirementsPatterns();
    this.entityExtractors = this.initializeEntityExtractors();
    this.conversionRules = this.initializeConversionRules();
    this.qualityMetrics = this.initializeQualityMetrics();
  }

  /**
   * Initialize requirements-specific patterns
   */
  initializeRequirementsPatterns() {
    return {
      // Functional requirement patterns
      functional: {
        basic: /(?:the\s+)?([\w\s]+?)\s+(?:shall|must|will|should)\s+(?:be\s+able\s+to\s+)?([^.]+)/gi,
        conditional: /(?:when|if)\s+([^,]+),\s*(?:the\s+)?([\w\s]+?)\s+(?:shall|must|will)\s+([^.]+)/gi,
        capability: /(?:the\s+)?system\s+(?:shall|must)\s+(?:provide|support|enable)\s+([^.]+)/gi
      },

      // Non-functional requirement patterns
      nonfunctional: {
        performance: /(?:the\s+)?([\w\s]+?)\s+(?:shall|must)\s+(?:respond|process|complete)\s+([^.]+?)\s+(?:within|in\s+less\s+than|under)\s+([\d.]+\s*\w+)/gi,
        capacity: /(?:the\s+)?([\w\s]+?)\s+(?:shall|must)\s+(?:support|handle|accommodate)\s+(?:up\s+to\s+|at\s+least\s+)?([\d,]+\s*\w*)/gi,
        availability: /(?:the\s+)?([\w\s]+?)\s+(?:shall|must)\s+(?:be\s+available|maintain\s+uptime)\s+([^.]+)/gi,
        security: /(?:the\s+)?([\w\s]+?)\s+(?:shall|must)\s+(?:encrypt|authenticate|authorize|secure)\s+([^.]+)/gi
      },

      // Acceptance criteria patterns
      acceptance: {
        gherkin: /given\s+([^,]+),?\s*when\s+([^,]+),?\s*then\s+([^.]+)/gi,
        condition: /(?:if|when)\s+([^,]+),\s*(?:then\s+)?([^.]+)/gi,
        verification: /(?:the\s+)?(?:result|outcome|system)\s+(?:shall|must|should)\s+([^.]+)/gi
      },

      // Constraint patterns
      constraints: {
        limitation: /(?:the\s+)?([\w\s]+?)\s+(?:must\s+not|shall\s+not|cannot)\s+([^.]+)/gi,
        compliance: /(?:the\s+)?([\w\s]+?)\s+(?:shall|must)\s+comply\s+with\s+([^.]+)/gi,
        boundary: /(?:the\s+)?([\w\s]+?)\s+(?:shall|must)\s+(?:not\s+exceed|be\s+limited\s+to|stay\s+within)\s+([^.]+)/gi
      },

      // Business rule patterns
      businessRules: {
        rule: /(?:if|when)\s+([^,]+),?\s*(?:then\s+)?(?:the\s+)?([\w\s]+?)\s+(?:shall|must|will)\s+([^.]+)/gi,
        policy: /(?:the\s+)?([\w\s]+?)\s+policy\s+(?:states|requires|mandates)\s+(?:that\s+)?([^.]+)/gi,
        workflow: /(?:the\s+)?([\w\s]+?)\s+process\s+(?:shall|must)\s+([^.]+)/gi
      }
    };
  }

  /**
   * Initialize entity extractors for requirements
   */
  initializeEntityExtractors() {
    return {
      stakeholders: {
        actors: /\b(user|admin|administrator|operator|customer|client|manager|supervisor|analyst|developer|tester|auditor)\b/gi,
        systems: /\b(system|application|service|component|module|interface|database|server|platform)\b/gi,
        roles: /\b([\w\s]+?)\s+(?:role|actor|persona|stakeholder)\b/gi
      },

      actions: {
        crud: /\b(create|add|insert|read|view|display|show|update|modify|edit|change|delete|remove|purge)\b/gi,
        process: /\b(process|validate|verify|calculate|compute|generate|transform|convert|parse|analyze)\b/gi,
        communication: /\b(send|receive|transmit|broadcast|notify|alert|inform|communicate|sync|upload|download)\b/gi,
        control: /\b(start|stop|pause|resume|restart|enable|disable|activate|deactivate|configure|setup)\b/gi
      },

      objects: {
        data: /\b(data|information|record|document|file|report|message|notification|alert|log|entry)\b/gi,
        ui: /\b(screen|page|form|dialog|window|panel|menu|button|field|input|output|display)\b/gi,
        technical: /\b(api|endpoint|service|protocol|interface|connection|session|token|key|certificate)\b/gi
      },

      conditions: {
        temporal: /\b(when|while|after|before|during|until|as\s+soon\s+as|immediately|within\s+\d+)\b/gi,
        logical: /\b(if|unless|provided\s+that|in\s+case\s+of|depending\s+on|based\s+on)\b/gi,
        state: /\b(authenticated|authorized|logged\s+in|active|inactive|enabled|disabled|valid|invalid)\b/gi
      },

      measurements: {
        time: /\b(\d+(?:\.\d+)?)\s*(ms|milliseconds?|seconds?|minutes?|hours?|days?|weeks?|months?|years?)\b/gi,
        size: /\b(\d+(?:\.\d+)?)\s*(bytes?|kb|mb|gb|tb|b|bits?)\b/gi,
        count: /\b(\d+(?:\.\d+)?)\s*(users?|items?|records?|requests?|transactions?|operations?|concurrent|simultaneous)\b/gi,
        percentage: /\b(\d+(?:\.\d+)?)\s*(%|percent|percentage)\b/gi
      },

      priorities: {
        must: /\b(critical|essential|mandatory|required|must|shall)\b/gi,
        should: /\b(important|recommended|should|preferred|desired)\b/gi,
        could: /\b(optional|nice\s+to\s+have|could|might|may)\b/gi
      }
    };
  }

  /**
   * Initialize conversion rules for natural language to structured requirements
   */
  initializeConversionRules() {
    return {
      templates: {
        functional: {
          actor_action_object: 'The {actor} shall be able to {action} {object} {conditions}.',
          system_capability: 'The system shall {capability} {conditions}.',
          user_story: 'As a {actor}, I want to {action} {object} so that {benefit}.'
        },
        nonfunctional: {
          performance: 'The {component} shall {action} within {timeframe} under {conditions}.',
          capacity: 'The {component} shall support {quantity} {conditions}.',
          availability: 'The {component} shall maintain {availability_level} availability {conditions}.',
          security: 'The {component} shall {security_action} {conditions}.'
        },
        acceptance: {
          scenario: 'Given {precondition}, when {action}, then {expected_result}.',
          verification: 'Verify that {condition} results in {expected_outcome}.',
          validation: 'The {component} shall validate that {criteria} is met.'
        },
        constraint: {
          limitation: 'The {component} shall not {restricted_action} {conditions}.',
          compliance: 'The {component} shall comply with {standard} {conditions}.',
          boundary: 'The {component} shall not exceed {limit} {conditions}.'
        }
      },

      transformations: {
        // Convert informal to formal language
        informalize: {
          'need to': 'shall',
          'has to': 'shall',
          'must be able to': 'shall',
          'is required to': 'shall',
          'should be capable of': 'shall be able to',
          'can': 'shall be able to',
          'will': 'shall',
          'user wants': 'user shall be able',
          'system needs': 'system shall'
        },

        // Strengthen weak language
        strengthen: {
          'might': 'shall',
          'could': 'should',
          'may': 'should',
          'possibly': '',
          'maybe': '',
          'probably': '',
          'user-friendly': 'intuitive and easy to use',
          'fast': 'within [specify time]',
          'quickly': 'within [specify time]',
          'efficiently': 'optimally',
          'properly': 'correctly'
        },

        // Add specificity
        specify: {
          'users': '[specify user types]',
          'data': '[specify data types]',
          'information': '[specify information types]',
          'quickly': '[specify time requirement]',
          'large amounts': '[specify quantity]',
          'many': '[specify number]',
          'appropriate': '[specify criteria]',
          'sufficient': '[specify requirements]'
        }
      }
    };
  }

  /**
   * Initialize quality metrics for requirements
   */
  initializeQualityMetrics() {
    return {
      // IEEE 830 standard quality attributes
      ieee830: {
        correct: { weight: 0.2, criteria: ['factual_accuracy', 'stakeholder_validation'] },
        unambiguous: { weight: 0.2, criteria: ['single_interpretation', 'clear_language'] },
        complete: { weight: 0.15, criteria: ['all_requirements', 'missing_info'] },
        consistent: { weight: 0.15, criteria: ['terminology', 'format', 'conflicts'] },
        ranked: { weight: 0.1, criteria: ['priority', 'importance'] },
        verifiable: { weight: 0.1, criteria: ['testable', 'measurable'] },
        modifiable: { weight: 0.05, criteria: ['structure', 'cross_references'] },
        traceable: { weight: 0.05, criteria: ['unique_id', 'origin', 'dependencies'] }
      },

      // SMART criteria for requirements
      smart: {
        specific: { weight: 0.25, keywords: ['exactly', 'precisely', 'specifically'] },
        measurable: { weight: 0.25, patterns: [/\d+/g, /within/gi, /exactly/gi] },
        achievable: { weight: 0.2, indicators: ['realistic', 'feasible', 'possible'] },
        relevant: { weight: 0.15, context: ['business_value', 'stakeholder_need'] },
        timeBound: { weight: 0.15, patterns: [/\d+\s*(ms|seconds?|minutes?|hours?|days?)/gi] }
      },

      // Requirements engineering best practices
      bestPractices: {
        atomicity: { single_requirement: true, no_compound_statements: true },
        implementation_free: { no_design_details: true, what_not_how: true },
        user_centered: { clear_stakeholder: true, user_benefit: true },
        positive_statements: { avoid_negatives: true, state_what_system_does: true }
      }
    };
  }

  /**
   * Convert natural language input to structured requirement
   */
  async convertToRequirement(input, options = {}) {
    const startTime = Date.now();

    try {
      // Step 1: Preprocess input
      const preprocessed = this.preprocessInput(input);

      // Step 2: Classify requirement type
      const classification = this.classifyRequirement(preprocessed);

      // Step 3: Extract entities
      const entities = this.extractRequirementEntities(preprocessed);

      // Step 4: Apply conversion rules
      const structured = this.applyConversionRules(preprocessed, classification, entities);

      // Step 5: Quality analysis
      const qualityAnalysis = await this.analyzeRequirement(structured.text);

      // Step 6: Generate improvements
      const improvements = this.generateRequirementImprovements(structured, qualityAnalysis);

      const result = {
        originalInput: input,
        preprocessed,
        classification,
        entities,
        structured,
        qualityAnalysis,
        improvements,
        confidence: this.calculateConversionConfidence(classification, entities, qualityAnalysis),
        processingTime: Date.now() - startTime
      };

      return {
        success: true,
        result
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Preprocess input text for better analysis
   */
  preprocessInput(input) {
    let processed = input.trim();

    // Normalize whitespace
    processed = processed.replace(/\s+/g, ' ');

    // Fix common grammatical issues
    processed = processed.replace(/\bi\s+am\s+able\s+to\b/gi, 'I can');
    processed = processed.replace(/\bthe\s+user\s+can\b/gi, 'the user shall be able to');
    processed = processed.replace(/\bit\s+should\b/gi, 'the system shall');

    // Ensure proper sentence structure
    if (!processed.match(/[.!?]$/)) {
      processed += '.';
    }

    // Capitalize first letter
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);

    return processed;
  }

  /**
   * Classify requirement type
   */
  classifyRequirement(text) {
    const classification = {
      primary: 'functional',
      secondary: [],
      confidence: 0.5,
      indicators: []
    };

    const lowerText = text.toLowerCase();

    // Check for functional requirement indicators
    const functionalScore = this.scorePatternMatches(text, this.requirementsPatterns.functional);

    // Check for non-functional requirement indicators
    const nonfunctionalScore = this.scorePatternMatches(text, this.requirementsPatterns.nonfunctional);

    // Check for acceptance criteria indicators
    const acceptanceScore = this.scorePatternMatches(text, this.requirementsPatterns.acceptance);

    // Check for constraint indicators
    const constraintScore = this.scorePatternMatches(text, this.requirementsPatterns.constraints);

    // Determine primary classification
    const scores = {
      functional: functionalScore,
      nonfunctional: nonfunctionalScore,
      acceptance: acceptanceScore,
      constraint: constraintScore
    };

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore > 0) {
      classification.primary = Object.keys(scores).find(key => scores[key] === maxScore);
      classification.confidence = Math.min(0.95, 0.5 + maxScore * 0.1);
    }

    // Add secondary classifications
    Object.entries(scores).forEach(([type, score]) => {
      if (type !== classification.primary && score > 0.3) {
        classification.secondary.push(type);
      }
    });

    // Add specific indicators
    if (lowerText.includes('performance') || lowerText.includes('response time')) {
      classification.indicators.push('performance');
    }
    if (lowerText.includes('security') || lowerText.includes('authenticate')) {
      classification.indicators.push('security');
    }
    if (lowerText.includes('usability') || lowerText.includes('user experience')) {
      classification.indicators.push('usability');
    }

    return classification;
  }

  /**
   * Score pattern matches for classification
   */
  scorePatternMatches(text, patterns) {
    let score = 0;
    let totalPatterns = 0;

    Object.values(patterns).forEach(pattern => {
      totalPatterns++;
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        score += matches.length;
      }
    });

    return totalPatterns > 0 ? score / totalPatterns : 0;
  }

  /**
   * Extract entities specific to requirements
   */
  extractRequirementEntities(text) {
    const entities = {
      stakeholders: {
        actors: [],
        systems: [],
        roles: []
      },
      actions: {
        crud: [],
        process: [],
        communication: [],
        control: []
      },
      objects: {
        data: [],
        ui: [],
        technical: []
      },
      conditions: {
        temporal: [],
        logical: [],
        state: []
      },
      measurements: {
        time: [],
        size: [],
        count: [],
        percentage: []
      },
      priorities: {
        must: [],
        should: [],
        could: []
      }
    };

    // Extract entities using patterns
    Object.entries(this.entityExtractors).forEach(([category, subcategories]) => {
      Object.entries(subcategories).forEach(([subcategory, pattern]) => {
        const matches = text.match(pattern) || [];
        if (entities[category] && entities[category][subcategory]) {
          entities[category][subcategory] = [...new Set(matches.map(match => match.toLowerCase()))];
        }
      });
    });

    return entities;
  }

  /**
   * Apply conversion rules to generate structured requirement
   */
  applyConversionRules(text, classification, entities) {
    let structuredText = text;

    // Apply transformations
    Object.entries(this.conversionRules.transformations).forEach(([type, rules]) => {
      Object.entries(rules).forEach(([from, to]) => {
        const regex = new RegExp(from, 'gi');
        structuredText = structuredText.replace(regex, to);
      });
    });

    // Select appropriate template
    const template = this.selectBestTemplate(classification, entities);

    // Fill template if available
    if (template) {
      const filledTemplate = this.fillTemplate(template, entities, structuredText);
      if (filledTemplate.completeness > 0.5) {
        structuredText = filledTemplate.text;
      }
    }

    // Ensure proper format
    structuredText = this.ensureProperFormat(structuredText, classification);

    return {
      text: structuredText,
      template: template ? template.id : null,
      transformationsApplied: this.getAppliedTransformations(text, structuredText),
      formatCorrections: this.getFormatCorrections(text, structuredText)
    };
  }

  /**
   * Select best template for the requirement
   */
  selectBestTemplate(classification, entities) {
    const templates = this.conversionRules.templates[classification.primary];
    if (!templates) return null;

    let bestTemplate = null;
    let bestScore = 0;

    Object.entries(templates).forEach(([templateId, templateText]) => {
      const score = this.scoreTemplateMatch(templateText, entities);
      if (score > bestScore) {
        bestScore = score;
        bestTemplate = {
          id: templateId,
          text: templateText,
          score
        };
      }
    });

    return bestTemplate;
  }

  /**
   * Score how well a template matches the extracted entities
   */
  scoreTemplateMatch(template, entities) {
    let score = 0;
    const placeholders = template.match(/{[^}]+}/g) || [];

    placeholders.forEach(placeholder => {
      const field = placeholder.replace(/[{}]/g, '');

      // Check if we have entities that could fill this placeholder
      if (this.hasEntityForField(field, entities)) {
        score += 1;
      }
    });

    return placeholders.length > 0 ? score / placeholders.length : 0;
  }

  /**
   * Check if entities exist for a template field
   */
  hasEntityForField(field, entities) {
    const fieldMappings = {
      'actor': () => entities.stakeholders.actors.length > 0 || entities.stakeholders.roles.length > 0,
      'action': () => Object.values(entities.actions).some(actions => actions.length > 0),
      'object': () => Object.values(entities.objects).some(objects => objects.length > 0),
      'conditions': () => Object.values(entities.conditions).some(conditions => conditions.length > 0),
      'timeframe': () => entities.measurements.time.length > 0,
      'component': () => entities.stakeholders.systems.length > 0,
      'capability': () => Object.values(entities.actions).some(actions => actions.length > 0)
    };

    const mapping = fieldMappings[field.toLowerCase()];
    return mapping ? mapping() : false;
  }

  /**
   * Fill template with extracted entities
   */
  fillTemplate(template, entities, originalText) {
    let filledText = template.text;
    let fieldsSet = 0;
    let totalFields = 0;

    const placeholders = template.text.match(/{[^}]+}/g) || [];

    placeholders.forEach(placeholder => {
      totalFields++;
      const field = placeholder.replace(/[{}]/g, '');
      const value = this.getEntityValueForField(field, entities, originalText);

      if (value) {
        filledText = filledText.replace(placeholder, value);
        fieldsSet++;
      }
    });

    return {
      text: filledText,
      completeness: totalFields > 0 ? fieldsSet / totalFields : 0,
      fieldsSet,
      totalFields
    };
  }

  /**
   * Get entity value for a template field
   */
  getEntityValueForField(field, entities, originalText) {
    const fieldMappings = {
      'actor': () => entities.stakeholders.actors[0] || entities.stakeholders.roles[0] || 'user',
      'action': () => this.getBestAction(entities.actions) || 'perform',
      'object': () => this.getBestObject(entities.objects) || 'operation',
      'conditions': () => this.getBestCondition(entities.conditions) || '',
      'timeframe': () => entities.measurements.time[0] || '[specify timeframe]',
      'component': () => entities.stakeholders.systems[0] || 'system',
      'capability': () => this.getBestAction(entities.actions) || 'provide functionality'
    };

    const mapping = fieldMappings[field.toLowerCase()];
    return mapping ? mapping() : `[${field}]`;
  }

  /**
   * Get best action from extracted actions
   */
  getBestAction(actions) {
    // Prioritize CRUD operations, then process actions
    if (actions.crud.length > 0) return actions.crud[0];
    if (actions.process.length > 0) return actions.process[0];
    if (actions.communication.length > 0) return actions.communication[0];
    if (actions.control.length > 0) return actions.control[0];
    return null;
  }

  /**
   * Get best object from extracted objects
   */
  getBestObject(objects) {
    // Prioritize data objects, then UI objects
    if (objects.data.length > 0) return objects.data[0];
    if (objects.ui.length > 0) return objects.ui[0];
    if (objects.technical.length > 0) return objects.technical[0];
    return null;
  }

  /**
   * Get best condition from extracted conditions
   */
  getBestCondition(conditions) {
    // Prioritize logical conditions, then temporal
    if (conditions.logical.length > 0) return `when ${conditions.logical[0]}`;
    if (conditions.temporal.length > 0) return conditions.temporal[0];
    if (conditions.state.length > 0) return `when ${conditions.state[0]}`;
    return null;
  }

  /**
   * Ensure proper requirement format
   */
  ensureProperFormat(text, classification) {
    let formatted = text;

    // Ensure starts with proper article
    if (!formatted.match(/^(The|A|An)\s+/)) {
      formatted = 'The ' + formatted.toLowerCase();
    }

    // Ensure has imperative language
    if (!formatted.toLowerCase().includes('shall') &&
        !formatted.toLowerCase().includes('must') &&
        !formatted.toLowerCase().includes('will')) {
      formatted = formatted.replace(/\b(should|can|may)\b/gi, 'shall');
    }

    // Ensure proper punctuation
    if (!formatted.match(/[.!?]$/)) {
      formatted += '.';
    }

    // Capitalize first letter after article
    formatted = formatted.replace(/^(The|A|An)\s+(\w)/, (match, article, firstLetter) =>
      `${article} ${firstLetter.toLowerCase()}`
    );

    return formatted;
  }

  /**
   * Generate improvements for requirements
   */
  generateRequirementImprovements(structured, qualityAnalysis) {
    const improvements = [];

    // Add quality-based improvements
    if (qualityAnalysis.suggestions) {
      improvements.push(...qualityAnalysis.suggestions);
    }

    // Add structure-specific improvements
    if (structured.text.includes('[') && structured.text.includes(']')) {
      improvements.push({
        type: 'incomplete_template',
        severity: 'high',
        message: 'Template has unfilled placeholders',
        suggestion: 'Specify missing information in brackets',
        autoFixable: false
      });
    }

    // Check for weak language
    const weakTerms = ['user-friendly', 'easy', 'simple', 'fast', 'efficient'];
    weakTerms.forEach(term => {
      if (structured.text.toLowerCase().includes(term)) {
        improvements.push({
          type: 'weak_language',
          term,
          severity: 'medium',
          message: `Avoid vague term "${term}"`,
          suggestion: `Replace "${term}" with specific, measurable criteria`,
          autoFixable: false
        });
      }
    });

    // Check for missing acceptance criteria
    if (structured.text.includes('shall') && !structured.text.match(/\b(verify|test|measure|validate)\b/i)) {
      improvements.push({
        type: 'missing_verification',
        severity: 'medium',
        message: 'Requirement lacks verification criteria',
        suggestion: 'Add how this requirement will be tested or verified',
        autoFixable: false
      });
    }

    return improvements.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    });
  }

  /**
   * Calculate confidence in the conversion
   */
  calculateConversionConfidence(classification, entities, qualityAnalysis) {
    let confidence = 0.3; // Base confidence

    // Classification confidence (30%)
    confidence += classification.confidence * 0.3;

    // Entity extraction success (30%)
    const totalEntities = Object.values(entities).reduce((total, category) => {
      return total + Object.values(category).reduce((subTotal, items) =>
        subTotal + (Array.isArray(items) ? items.length : 0), 0);
    }, 0);

    const entityScore = Math.min(1.0, totalEntities / 5); // Normalize to max 5 entities
    confidence += entityScore * 0.3;

    // Quality score (40%)
    if (qualityAnalysis.metrics && qualityAnalysis.metrics.qualityScore) {
      confidence += (qualityAnalysis.metrics.qualityScore / 100) * 0.4;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Get applied transformations
   */
  getAppliedTransformations(original, transformed) {
    const transformations = [];

    Object.entries(this.conversionRules.transformations).forEach(([type, rules]) => {
      Object.entries(rules).forEach(([from, to]) => {
        if (original.toLowerCase().includes(from.toLowerCase()) &&
            transformed.toLowerCase().includes(to.toLowerCase())) {
          transformations.push({
            type,
            from,
            to,
            description: `Transformed "${from}" to "${to}"`
          });
        }
      });
    });

    return transformations;
  }

  /**
   * Get format corrections
   */
  getFormatCorrections(original, formatted) {
    const corrections = [];

    if (!original.match(/^(The|A|An)\s+/) && formatted.match(/^(The|A|An)\s+/)) {
      corrections.push('Added proper article');
    }

    if (!original.toLowerCase().includes('shall') && formatted.toLowerCase().includes('shall')) {
      corrections.push('Added imperative language (shall)');
    }

    if (!original.match(/[.!?]$/) && formatted.match(/[.!?]$/)) {
      corrections.push('Added proper punctuation');
    }

    return corrections;
  }

  /**
   * Analyze requirement quality using enhanced metrics
   */
  async analyzeRequirementQuality(text, options = {}) {
    // Use base NLP analysis
    const baseAnalysis = await this.analyzeRequirement(text, options);

    // Add requirements-specific quality metrics
    const requirementsQuality = this.analyzeRequirementsSpecificQuality(text);

    // Calculate IEEE 830 compliance
    const ieee830Compliance = this.calculateIEEE830Compliance(text, baseAnalysis);

    // Calculate SMART criteria compliance
    const smartCompliance = this.calculateSMARTCompliance(text, baseAnalysis);

    return {
      ...baseAnalysis,
      requirementsQuality,
      ieee830Compliance,
      smartCompliance,
      overallRequirementsScore: this.calculateOverallRequirementsScore(
        baseAnalysis,
        requirementsQuality,
        ieee830Compliance,
        smartCompliance
      )
    };
  }

  /**
   * Analyze requirements-specific quality aspects
   */
  analyzeRequirementsSpecificQuality(text) {
    const quality = {
      atomicity: this.checkAtomicity(text),
      implementationFree: this.checkImplementationFree(text),
      userCentered: this.checkUserCentered(text),
      positiveStatements: this.checkPositiveStatements(text),
      verifiability: this.checkVerifiability(text)
    };

    return quality;
  }

  /**
   * Check if requirement is atomic (single requirement)
   */
  checkAtomicity(text) {
    const conjunctions = ['and', 'or', 'also', 'in addition', 'furthermore', 'moreover'];
    const foundConjunctions = conjunctions.filter(conj =>
      text.toLowerCase().includes(` ${conj} `)
    );

    return {
      isAtomic: foundConjunctions.length === 0,
      violations: foundConjunctions,
      score: foundConjunctions.length === 0 ? 100 : Math.max(0, 100 - foundConjunctions.length * 25)
    };
  }

  /**
   * Check if requirement avoids implementation details
   */
  checkImplementationFree(text) {
    const implementationTerms = [
      'database', 'sql', 'table', 'column', 'index',
      'algorithm', 'function', 'method', 'class',
      'button', 'dropdown', 'checkbox', 'textbox',
      'framework', 'library', 'technology', 'platform'
    ];

    const foundTerms = implementationTerms.filter(term =>
      text.toLowerCase().includes(term)
    );

    return {
      isImplementationFree: foundTerms.length === 0,
      violations: foundTerms,
      score: foundTerms.length === 0 ? 100 : Math.max(0, 100 - foundTerms.length * 15)
    };
  }

  /**
   * Check if requirement is user-centered
   */
  checkUserCentered(text) {
    const stakeholderTerms = this.entityExtractors.stakeholders.actors;
    const hasStakeholder = stakeholderTerms.test(text);

    const userBenefitIndicators = ['so that', 'in order to', 'to enable', 'to allow'];
    const hasBenefit = userBenefitIndicators.some(indicator =>
      text.toLowerCase().includes(indicator)
    );

    return {
      hasStakeholder,
      hasBenefit,
      isUserCentered: hasStakeholder,
      score: hasStakeholder ? (hasBenefit ? 100 : 80) : 40
    };
  }

  /**
   * Check for positive statements
   */
  checkPositiveStatements(text) {
    const negativePatterns = ['shall not', 'must not', 'cannot', 'will not', 'should not'];
    const hasNegatives = negativePatterns.some(pattern =>
      text.toLowerCase().includes(pattern)
    );

    return {
      isPositive: !hasNegatives,
      negativePatterns: negativePatterns.filter(pattern =>
        text.toLowerCase().includes(pattern)
      ),
      score: hasNegatives ? 60 : 100
    };
  }

  /**
   * Check verifiability of requirement
   */
  checkVerifiability(text) {
    const verificationTerms = ['test', 'verify', 'validate', 'measure', 'check', 'confirm'];
    const measurableTerms = this.entityExtractors.measurements;

    const hasVerificationMethod = verificationTerms.some(term =>
      text.toLowerCase().includes(term)
    );

    const hasMeasurableElements = Object.values(measurableTerms).some(pattern =>
      pattern.test(text)
    );

    return {
      hasVerificationMethod,
      hasMeasurableElements,
      isVerifiable: hasVerificationMethod || hasMeasurableElements,
      score: (hasVerificationMethod ? 60 : 0) + (hasMeasurableElements ? 40 : 0)
    };
  }

  /**
   * Calculate IEEE 830 compliance score
   */
  calculateIEEE830Compliance(text, baseAnalysis) {
    const criteria = this.qualityMetrics.ieee830;
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(criteria).forEach(([criterion, config]) => {
      let score = 0;

      switch (criterion) {
        case 'correct':
          score = 80; // Assume correct unless proven otherwise
          break;
        case 'unambiguous':
          score = baseAnalysis.quality.clarity.score;
          break;
        case 'complete':
          score = baseAnalysis.quality.completeness.score;
          break;
        case 'consistent':
          score = baseAnalysis.quality.specificity.score;
          break;
        case 'verifiable':
          score = this.checkVerifiability(text).score;
          break;
        default:
          score = 70; // Default score for other criteria
      }

      totalScore += score * config.weight;
      totalWeight += config.weight;
    });

    return {
      score: totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0,
      criteria: criteria
    };
  }

  /**
   * Calculate SMART criteria compliance
   */
  calculateSMARTCompliance(text, baseAnalysis) {
    const criteria = this.qualityMetrics.smart;
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(criteria).forEach(([criterion, config]) => {
      let score = 0;

      switch (criterion) {
        case 'specific':
          score = baseAnalysis.quality.specificity.score;
          break;
        case 'measurable':
          const measurements = Object.values(this.entityExtractors.measurements);
          const hasMeasurements = measurements.some(pattern => pattern.test(text));
          score = hasMeasurements ? 90 : 30;
          break;
        case 'achievable':
          score = 75; // Assume achievable unless proven otherwise
          break;
        case 'relevant':
          score = this.checkUserCentered(text).score;
          break;
        case 'timeBound':
          const hasTimebound = this.entityExtractors.measurements.time.test(text);
          score = hasTimebound ? 90 : 20;
          break;
      }

      totalScore += score * config.weight;
      totalWeight += config.weight;
    });

    return {
      score: totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0,
      criteria: criteria
    };
  }

  /**
   * Calculate overall requirements score
   */
  calculateOverallRequirementsScore(baseAnalysis, requirementsQuality, ieee830, smart) {
    const weights = {
      nlpQuality: 0.3,
      requirementsQuality: 0.3,
      ieee830: 0.25,
      smart: 0.15
    };

    let score = 0;

    // NLP quality score
    if (baseAnalysis.metrics && baseAnalysis.metrics.qualityScore) {
      score += baseAnalysis.metrics.qualityScore * weights.nlpQuality;
    }

    // Requirements-specific quality
    const reqQualityScore = Object.values(requirementsQuality)
      .reduce((sum, metric) => sum + (metric.score || 0), 0) /
      Object.keys(requirementsQuality).length;
    score += reqQualityScore * weights.requirementsQuality;

    // IEEE 830 compliance
    score += ieee830.score * weights.ieee830;

    // SMART compliance
    score += smart.score * weights.smart;

    return Math.round(score);
  }

  /**
   * Get processing statistics
   */
  getStatistics() {
    const baseStats = super.getStatistics();

    return {
      ...baseStats,
      requirementsPatternsCount: Object.keys(this.requirementsPatterns).length,
      entityExtractorsCount: Object.keys(this.entityExtractors).length,
      conversionRulesCount: Object.keys(this.conversionRules.templates).length,
      qualityMetricsCount: Object.keys(this.qualityMetrics).length,
      version: '2.0.0'
    };
  }
}

module.exports = RequirementsNLPEngine;