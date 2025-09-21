/**
 * Quality Analysis Engine
 * Advanced writing quality analysis and improvement suggestions for requirements
 */

const EventEmitter = require('events');
const RequirementsNLPEngine = require('../precision-engine/RequirementsNLPEngine');

class QualityAnalysisEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      qualityThreshold: config.qualityThreshold || 75,
      maxSuggestions: config.maxSuggestions || 10,
      enableRealTime: config.enableRealTime || true,
      analysisDepth: config.analysisDepth || 'comprehensive', // basic, standard, comprehensive
      autoFixEnabled: config.autoFixEnabled || true,
      ...config
    };

    this.nlpEngine = new RequirementsNLPEngine();
    this.qualityRules = this.initializeQualityRules();
    this.improvementTemplates = this.initializeImprovementTemplates();
    this.grammarRules = this.initializeGrammarRules();
    this.styleGuides = this.initializeStyleGuides();

    this.metrics = {
      totalAnalyses: 0,
      averageQualityScore: 0,
      improvementsGenerated: 0,
      autoFixesApplied: 0,
      qualityScores: []
    };

    this.initialize();
  }

  /**
   * Initialize quality analysis engine
   */
  initialize() {
    this.emit('quality-engine-initialized', {
      timestamp: new Date().toISOString(),
      rulesLoaded: Object.keys(this.qualityRules).length,
      templatesLoaded: this.improvementTemplates.size
    });
  }

  /**
   * Initialize comprehensive quality rules
   */
  initializeQualityRules() {
    return {
      // Language clarity rules
      clarity: {
        vaguePhrases: {
          patterns: [
            'user-friendly', 'intuitive', 'easy to use', 'simple', 'efficient',
            'fast', 'quick', 'robust', 'flexible', 'scalable', 'reliable',
            'appropriate', 'reasonable', 'sufficient', 'adequate', 'proper',
            'as needed', 'as required', 'as necessary', 'if needed'
          ],
          severity: 'medium',
          message: 'Avoid vague terminology',
          suggestion: 'Replace with specific, measurable criteria'
        },

        weakVerbs: {
          patterns: ['handle', 'manage', 'deal with', 'take care of', 'work with'],
          severity: 'low',
          message: 'Use more specific action verbs',
          suggestion: 'Specify exactly what action is performed'
        },

        ambiguousPronouns: {
          patterns: [/\b(it|this|that|they|them)\b(?!\s+(shall|must|will|should))/gi],
          severity: 'medium',
          message: 'Ambiguous pronoun reference',
          suggestion: 'Replace pronoun with specific noun'
        },

        passiveVoice: {
          patterns: [/\b(is|are|was|were|been|being)\s+\w+ed\b/gi],
          severity: 'low',
          message: 'Consider using active voice',
          suggestion: 'Rewrite in active voice for clarity'
        }
      },

      // Specificity and precision rules
      specificity: {
        quantifiers: {
          patterns: [
            'all', 'any', 'some', 'many', 'few', 'several', 'most', 'various',
            'multiple', 'numerous', 'a lot of', 'plenty of'
          ],
          severity: 'high',
          message: 'Vague quantifier found',
          suggestion: 'Provide specific numbers or ranges'
        },

        timeframes: {
          patterns: [
            'quickly', 'soon', 'eventually', 'timely', 'promptly', 'immediately',
            'as soon as possible', 'ASAP', 'in a timely manner'
          ],
          severity: 'high',
          message: 'Vague timeframe',
          suggestion: 'Specify exact time requirements (e.g., "within 2 seconds")'
        },

        measurements: {
          patterns: [
            'large', 'small', 'big', 'little', 'huge', 'tiny',
            'high', 'low', 'fast', 'slow', 'heavy', 'light'
          ],
          severity: 'medium',
          message: 'Vague measurement term',
          suggestion: 'Provide specific measurements with units'
        },

        locations: {
          patterns: [
            'somewhere', 'anywhere', 'everywhere', 'here', 'there',
            'nearby', 'close', 'far', 'around'
          ],
          severity: 'medium',
          message: 'Vague location reference',
          suggestion: 'Specify exact location or component'
        }
      },

      // Completeness rules
      completeness: {
        missingStakeholder: {
          check: (text) => {
            const stakeholderPattern = /\b(user|admin|system|operator|customer|manager|actor)\b/i;
            return !stakeholderPattern.test(text);
          },
          severity: 'high',
          message: 'Missing stakeholder identification',
          suggestion: 'Specify who performs the action or is affected'
        },

        missingAction: {
          check: (text) => {
            const actionPattern = /\b(create|read|update|delete|validate|process|send|receive|display|calculate|generate|transform|authenticate|authorize)\b/i;
            return !actionPattern.test(text);
          },
          severity: 'high',
          message: 'Missing clear action verb',
          suggestion: 'Specify what action is performed'
        },

        missingCriteria: {
          check: (text) => {
            const criteriaPattern = /\b(shall|must|will|should|may|can)\b/i;
            return !criteriaPattern.test(text);
          },
          severity: 'medium',
          message: 'Missing requirement criteria',
          suggestion: 'Use "shall", "must", or "will" to indicate requirement level'
        },

        missingConditions: {
          check: (text) => {
            const conditionPattern = /\b(when|if|while|after|before|during|unless|provided that)\b/i;
            const hasCondition = conditionPattern.test(text);
            const isComplex = text.split(' ').length > 15;
            return isComplex && !hasCondition;
          },
          severity: 'low',
          message: 'Consider adding conditions or constraints',
          suggestion: 'Specify when or under what conditions this requirement applies'
        }
      },

      // Consistency rules
      consistency: {
        terminology: {
          check: (text, context) => {
            // Check for inconsistent terminology within document
            const terms = this.extractTerminology(text);
            return this.findTerminologyInconsistencies(terms, context);
          },
          severity: 'medium',
          message: 'Inconsistent terminology',
          suggestion: 'Use consistent terms throughout the document'
        },

        format: {
          check: (text) => {
            // Check requirement format consistency
            const sentences = text.split(/[.!?]+/).filter(s => s.trim());
            return this.checkFormatConsistency(sentences);
          },
          severity: 'low',
          message: 'Inconsistent requirement format',
          suggestion: 'Follow a consistent requirement format structure'
        }
      },

      // Verifiability rules
      verifiability: {
        testability: {
          check: (text) => {
            const testableKeywords = ['verify', 'test', 'measure', 'validate', 'check', 'confirm', 'demonstrate'];
            const hasTestableElements = testableKeywords.some(keyword =>
              text.toLowerCase().includes(keyword)
            );
            const hasMeasurableElements = /\b\d+(\.\d+)?\s*(ms|seconds?|minutes?|hours?|days?|MB|GB|%|percent)\b/i.test(text);

            return !(hasTestableElements || hasMeasurableElements);
          },
          severity: 'medium',
          message: 'Requirement may not be easily testable',
          suggestion: 'Add measurable criteria or verification methods'
        },

        acceptance: {
          check: (text) => {
            const acceptanceKeywords = ['success', 'failure', 'error', 'exception', 'valid', 'invalid'];
            return !acceptanceKeywords.some(keyword => text.toLowerCase().includes(keyword));
          },
          severity: 'low',
          message: 'Consider adding acceptance criteria',
          suggestion: 'Define what constitutes successful completion'
        }
      },

      // Implementation independence rules
      implementation: {
        designDetails: {
          patterns: [
            'database', 'table', 'column', 'index', 'SQL', 'query',
            'class', 'method', 'function', 'variable', 'algorithm',
            'framework', 'library', 'technology', 'platform', 'tool',
            'button', 'dropdown', 'textbox', 'checkbox', 'menu'
          ],
          severity: 'medium',
          message: 'Avoid implementation details in requirements',
          suggestion: 'Focus on what needs to be done, not how'
        },

        technicalJargon: {
          patterns: [
            'API', 'REST', 'SOAP', 'JSON', 'XML', 'HTTP', 'HTTPS',
            'TCP', 'UDP', 'FTP', 'SMTP', 'OAuth', 'JWT'
          ],
          severity: 'low',
          message: 'Technical implementation detail detected',
          suggestion: 'Consider if this technical detail is necessary for the requirement'
        }
      }
    };
  }

  /**
   * Initialize improvement templates
   */
  initializeImprovementTemplates() {
    const templates = new Map();

    // Clarity improvements
    templates.set('vague_phrase', {
      pattern: /\b(user-friendly|intuitive|easy|simple|fast|quick)\b/gi,
      replacement: (match) => {
        const replacements = {
          'user-friendly': 'accessible and requiring minimal training',
          'intuitive': 'requiring no more than [X] steps to complete',
          'easy': 'completed within [X] clicks/actions',
          'simple': 'with [specify simplicity criteria]',
          'fast': 'within [X] seconds/milliseconds',
          'quick': 'within [X] time units'
        };
        return replacements[match.toLowerCase()] || `[specify ${match} criteria]`;
      },
      confidence: 0.8
    });

    // Specificity improvements
    templates.set('vague_quantifier', {
      pattern: /\b(many|few|several|some|all|any)\b/gi,
      replacement: (match) => {
        const replacements = {
          'many': 'at least [X] or more than [Y]',
          'few': 'no more than [X]',
          'several': 'between [X] and [Y]',
          'some': '[X] or more',
          'all': 'every [specify scope]',
          'any': 'one or more [specify type]'
        };
        return replacements[match.toLowerCase()] || `[specify quantity for ${match}]`;
      },
      confidence: 0.9
    });

    // Action strengthening
    templates.set('weak_verb', {
      pattern: /\b(handle|manage|deal with|process)\b/gi,
      replacement: (match, context) => {
        const replacements = {
          'handle': 'validate and process',
          'manage': 'create, update, and monitor',
          'deal with': 'respond to and resolve',
          'process': 'receive, validate, and transform'
        };
        return replacements[match.toLowerCase()] || `[specify action for ${match}]`;
      },
      confidence: 0.7
    });

    return templates;
  }

  /**
   * Initialize grammar rules
   */
  initializeGrammarRules() {
    return {
      // Subject-verb agreement
      subjectVerb: {
        patterns: [
          { pattern: /\b(The\s+system|The\s+application)\s+(are|were)\b/gi, message: 'Subject-verb disagreement', fix: 'is/was' },
          { pattern: /\b(Users|Operators)\s+(is|was)\b/gi, message: 'Subject-verb disagreement', fix: 'are/were' }
        ]
      },

      // Article usage
      articles: {
        patterns: [
          { pattern: /\buser\b(?!\s+(interface|experience|account|story))/gi, message: 'Missing article', fix: 'the user' },
          { pattern: /\bsystem\b(?!\s+(shall|must|will|requirements?))/gi, message: 'Missing article', fix: 'the system' }
        ]
      },

      // Sentence structure
      structure: {
        patterns: [
          { pattern: /^[a-z]/g, message: 'Sentence should start with capital letter', fix: 'Capitalize first letter' },
          { pattern: /\s{2,}/g, message: 'Multiple spaces', fix: 'Single space' },
          { pattern: /\.\s*$/g, missing: true, message: 'Missing period', fix: 'Add period at end' }
        ]
      }
    };
  }

  /**
   * Initialize style guides
   */
  initializeStyleGuides() {
    return {
      ieee830: {
        name: 'IEEE 830 Standard',
        rules: {
          imperativeLanguage: {
            required: ['shall', 'must', 'will'],
            discouraged: ['should', 'may', 'can', 'might'],
            message: 'Use imperative language (shall, must, will)'
          },
          uniqueIdentification: {
            pattern: /^REQ-\d+/,
            message: 'Requirements should have unique identifiers'
          },
          atomicity: {
            maxConjunctions: 1,
            conjunctions: ['and', 'or'],
            message: 'Each requirement should address a single need'
          }
        }
      },

      agile: {
        name: 'Agile User Stories',
        rules: {
          userStoryFormat: {
            pattern: /^As\s+a\s+.+,\s*I\s+want\s+.+\s+so\s+that\s+.+/i,
            message: 'User stories should follow "As a [role], I want [goal] so that [benefit]" format'
          },
          acceptanceCriteria: {
            pattern: /Given\s+.+,?\s*when\s+.+,?\s*then\s+.+/i,
            message: 'Include acceptance criteria in Given-When-Then format'
          }
        }
      },

      lean: {
        name: 'Lean Requirements',
        rules: {
          businessValue: {
            keywords: ['value', 'benefit', 'outcome', 'impact', 'goal'],
            message: 'Link requirement to business value'
          },
          minimalism: {
            maxWords: 25,
            message: 'Keep requirements concise and focused'
          }
        }
      }
    };
  }

  /**
   * Perform comprehensive quality analysis
   */
  async analyzeQuality(text, options = {}) {
    const startTime = Date.now();

    try {
      this.metrics.totalAnalyses++;

      const analysis = {
        text,
        timestamp: new Date().toISOString(),
        overallScore: 0,
        category: options.category || 'functional',
        styleGuide: options.styleGuide || 'ieee830',
        issues: [],
        suggestions: [],
        autoFixes: [],
        metrics: {},
        recommendations: []
      };

      // Perform different levels of analysis based on configuration
      const analysisResults = await this.performAnalysis(text, analysis.category, options);

      // Basic quality checks
      const basicQuality = this.performBasicQualityChecks(text);
      analysis.issues.push(...basicQuality.issues);
      analysis.suggestions.push(...basicQuality.suggestions);

      // Advanced NLP analysis
      if (this.config.analysisDepth !== 'basic') {
        const nlpAnalysis = await this.nlpEngine.analyzeRequirementQuality(text, options);
        analysis.nlpAnalysis = nlpAnalysis;
        analysis.issues.push(...this.extractIssuesFromNLP(nlpAnalysis));
        analysis.suggestions.push(...this.extractSuggestionsFromNLP(nlpAnalysis));
      }

      // Grammar and style analysis
      if (this.config.analysisDepth === 'comprehensive') {
        const grammarAnalysis = this.performGrammarAnalysis(text);
        analysis.issues.push(...grammarAnalysis.issues);
        analysis.autoFixes.push(...grammarAnalysis.autoFixes);

        const styleAnalysis = this.performStyleAnalysis(text, analysis.styleGuide);
        analysis.issues.push(...styleAnalysis.issues);
        analysis.suggestions.push(...styleAnalysis.suggestions);
      }

      // Generate improvement recommendations
      analysis.recommendations = this.generateRecommendations(analysis);

      // Calculate overall quality score
      analysis.overallScore = this.calculateOverallScore(analysis);

      // Generate auto-fixes if enabled
      if (this.config.autoFixEnabled) {
        analysis.autoFixedText = this.generateAutoFixedText(text, analysis.autoFixes);
      }

      const processingTime = Date.now() - startTime;
      analysis.processingTime = processingTime;

      this.updateMetrics(analysis.overallScore, analysis.suggestions.length);

      this.emit('quality-analysis-completed', {
        overallScore: analysis.overallScore,
        issuesFound: analysis.issues.length,
        suggestionsGenerated: analysis.suggestions.length,
        processingTime
      });

      return {
        success: true,
        analysis
      };

    } catch (error) {
      this.emit('quality-analysis-failed', {
        error: error.message,
        text: text.substring(0, 100)
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Perform analysis based on depth setting
   */
  async performAnalysis(text, category, options) {
    const results = {
      basicChecks: null,
      nlpAnalysis: null,
      grammarAnalysis: null,
      styleAnalysis: null
    };

    // Always perform basic checks
    results.basicChecks = this.performBasicQualityChecks(text);

    // Add NLP analysis for standard and comprehensive
    if (this.config.analysisDepth !== 'basic') {
      results.nlpAnalysis = await this.nlpEngine.analyzeRequirementQuality(text, options);
    }

    // Add grammar and style for comprehensive
    if (this.config.analysisDepth === 'comprehensive') {
      results.grammarAnalysis = this.performGrammarAnalysis(text);
      results.styleAnalysis = this.performStyleAnalysis(text, options.styleGuide || 'ieee830');
    }

    return results;
  }

  /**
   * Perform basic quality checks
   */
  performBasicQualityChecks(text) {
    const issues = [];
    const suggestions = [];

    // Check each quality rule category
    Object.entries(this.qualityRules).forEach(([category, rules]) => {
      Object.entries(rules).forEach(([ruleName, rule]) => {
        if (rule.patterns) {
          // Pattern-based rules
          rule.patterns.forEach(pattern => {
            let matches;
            if (typeof pattern === 'string') {
              matches = text.toLowerCase().includes(pattern.toLowerCase()) ? [pattern] : [];
            } else {
              matches = text.match(pattern) || [];
            }

            matches.forEach(match => {
              issues.push({
                type: ruleName,
                category,
                severity: rule.severity,
                message: rule.message,
                suggestion: rule.suggestion,
                match,
                position: text.indexOf(match),
                autoFixable: this.isAutoFixable(ruleName, match)
              });
            });
          });
        } else if (rule.check) {
          // Function-based rules
          const checkResult = rule.check(text);
          if (checkResult === true || (Array.isArray(checkResult) && checkResult.length > 0)) {
            issues.push({
              type: ruleName,
              category,
              severity: rule.severity,
              message: rule.message,
              suggestion: rule.suggestion,
              details: Array.isArray(checkResult) ? checkResult : null,
              autoFixable: false
            });
          }
        }
      });
    });

    // Generate suggestions based on issues
    issues.forEach(issue => {
      if (issue.autoFixable) {
        suggestions.push({
          type: 'auto-fix',
          category: issue.category,
          message: `Auto-fix available: ${issue.message}`,
          originalIssue: issue,
          confidence: 0.8
        });
      } else {
        suggestions.push({
          type: 'manual-improvement',
          category: issue.category,
          message: issue.suggestion,
          originalIssue: issue,
          confidence: 0.7
        });
      }
    });

    return { issues, suggestions };
  }

  /**
   * Perform grammar analysis
   */
  performGrammarAnalysis(text) {
    const issues = [];
    const autoFixes = [];

    Object.entries(this.grammarRules).forEach(([category, rules]) => {
      if (rules.patterns) {
        rules.patterns.forEach(rule => {
          const matches = text.match(rule.pattern) || [];
          matches.forEach(match => {
            issues.push({
              type: 'grammar',
              category,
              severity: 'low',
              message: rule.message,
              match,
              position: text.indexOf(match)
            });

            if (rule.fix) {
              autoFixes.push({
                type: 'grammar-fix',
                original: match,
                replacement: rule.fix,
                position: text.indexOf(match),
                confidence: 0.9
              });
            }
          });
        });
      }
    });

    return { issues, autoFixes };
  }

  /**
   * Perform style analysis based on style guide
   */
  performStyleAnalysis(text, styleGuideName) {
    const issues = [];
    const suggestions = [];

    const styleGuide = this.styleGuides[styleGuideName];
    if (!styleGuide) {
      return { issues, suggestions };
    }

    Object.entries(styleGuide.rules).forEach(([ruleName, rule]) => {
      if (rule.pattern) {
        const matches = rule.pattern.test(text);
        if (!matches) {
          issues.push({
            type: 'style',
            category: ruleName,
            severity: 'medium',
            message: rule.message,
            styleGuide: styleGuideName
          });
        }
      }

      if (rule.required) {
        const hasRequired = rule.required.some(keyword =>
          text.toLowerCase().includes(keyword)
        );
        if (!hasRequired) {
          issues.push({
            type: 'style',
            category: ruleName,
            severity: 'medium',
            message: rule.message,
            styleGuide: styleGuideName
          });
        }
      }

      if (rule.discouraged) {
        rule.discouraged.forEach(keyword => {
          if (text.toLowerCase().includes(keyword)) {
            issues.push({
              type: 'style',
              category: ruleName,
              severity: 'low',
              message: `Discouraged word "${keyword}" found. ${rule.message}`,
              styleGuide: styleGuideName
            });
          }
        });
      }

      if (rule.maxWords && text.split(/\s+/).length > rule.maxWords) {
        issues.push({
          type: 'style',
          category: ruleName,
          severity: 'medium',
          message: rule.message,
          styleGuide: styleGuideName
        });
      }

      if (rule.keywords) {
        const hasKeywords = rule.keywords.some(keyword =>
          text.toLowerCase().includes(keyword)
        );
        if (!hasKeywords) {
          suggestions.push({
            type: 'style-improvement',
            category: ruleName,
            message: rule.message,
            styleGuide: styleGuideName,
            confidence: 0.6
          });
        }
      }
    });

    return { issues, suggestions };
  }

  /**
   * Extract issues from NLP analysis
   */
  extractIssuesFromNLP(nlpAnalysis) {
    const issues = [];

    if (nlpAnalysis.suggestions) {
      nlpAnalysis.suggestions.forEach(suggestion => {
        issues.push({
          type: 'nlp',
          category: suggestion.type || 'quality',
          severity: suggestion.severity || 'medium',
          message: suggestion.message,
          suggestion: suggestion.suggestion,
          autoFixable: suggestion.autoFixable || false,
          source: 'nlp-engine'
        });
      });
    }

    return issues;
  }

  /**
   * Extract suggestions from NLP analysis
   */
  extractSuggestionsFromNLP(nlpAnalysis) {
    const suggestions = [];

    if (nlpAnalysis.suggestions) {
      nlpAnalysis.suggestions.forEach(nlpSuggestion => {
        suggestions.push({
          type: 'nlp-improvement',
          category: nlpSuggestion.type || 'quality',
          message: nlpSuggestion.suggestion,
          confidence: 0.8,
          source: 'nlp-engine',
          originalIssue: nlpSuggestion
        });
      });
    }

    return suggestions;
  }

  /**
   * Generate comprehensive recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    // Priority-based recommendations
    const highPriorityIssues = analysis.issues.filter(issue => issue.severity === 'high');
    if (highPriorityIssues.length > 0) {
      recommendations.push({
        type: 'priority',
        title: 'Critical Issues to Address',
        description: `${highPriorityIssues.length} high-priority issues found that significantly impact requirement quality.`,
        items: highPriorityIssues.slice(0, 3),
        actionRequired: true
      });
    }

    // Quick wins (auto-fixable issues)
    const autoFixableIssues = analysis.issues.filter(issue => issue.autoFixable);
    if (autoFixableIssues.length > 0) {
      recommendations.push({
        type: 'quick-wins',
        title: 'Quick Improvements Available',
        description: `${autoFixableIssues.length} issues can be automatically fixed.`,
        items: autoFixableIssues.slice(0, 5),
        actionRequired: false
      });
    }

    // Quality score improvement
    if (analysis.overallScore < this.config.qualityThreshold) {
      recommendations.push({
        type: 'quality-improvement',
        title: 'Quality Enhancement Needed',
        description: `Current quality score (${analysis.overallScore}%) is below threshold (${this.config.qualityThreshold}%).`,
        items: this.getTopImprovements(analysis),
        actionRequired: true
      });
    }

    // Best practices
    recommendations.push({
      type: 'best-practices',
      title: 'Best Practice Recommendations',
      description: 'Suggestions to align with industry standards and best practices.',
      items: this.getBestPracticeRecommendations(analysis),
      actionRequired: false
    });

    return recommendations;
  }

  /**
   * Get top improvements for quality enhancement
   */
  getTopImprovements(analysis) {
    const improvements = [];

    // Specificity improvements
    const vagueQuantifiers = analysis.issues.filter(issue =>
      issue.type === 'quantifiers' || issue.type === 'timeframes'
    );
    if (vagueQuantifiers.length > 0) {
      improvements.push({
        area: 'Specificity',
        description: 'Replace vague terms with specific, measurable criteria',
        impact: 'High',
        examples: vagueQuantifiers.slice(0, 2)
      });
    }

    // Clarity improvements
    const clarityIssues = analysis.issues.filter(issue =>
      issue.category === 'clarity'
    );
    if (clarityIssues.length > 0) {
      improvements.push({
        area: 'Clarity',
        description: 'Improve language clarity and remove ambiguity',
        impact: 'Medium',
        examples: clarityIssues.slice(0, 2)
      });
    }

    // Completeness improvements
    const completenessIssues = analysis.issues.filter(issue =>
      issue.category === 'completeness'
    );
    if (completenessIssues.length > 0) {
      improvements.push({
        area: 'Completeness',
        description: 'Add missing information to make requirement complete',
        impact: 'High',
        examples: completenessIssues.slice(0, 2)
      });
    }

    return improvements.slice(0, 3);
  }

  /**
   * Get best practice recommendations
   */
  getBestPracticeRecommendations(analysis) {
    const recommendations = [];

    // Testability
    const testabilityIssues = analysis.issues.filter(issue =>
      issue.type === 'testability'
    );
    if (testabilityIssues.length > 0) {
      recommendations.push({
        practice: 'Make Requirements Testable',
        description: 'Add measurable criteria and verification methods',
        benefit: 'Enables effective testing and validation',
        priority: 'High'
      });
    }

    // Atomicity
    const hasConjunctions = /\b(and|or)\b/gi.test(analysis.text);
    if (hasConjunctions) {
      recommendations.push({
        practice: 'Ensure Atomic Requirements',
        description: 'Break compound requirements into separate, single-purpose requirements',
        benefit: 'Improves traceability and testing',
        priority: 'Medium'
      });
    }

    // Implementation independence
    const implementationIssues = analysis.issues.filter(issue =>
      issue.category === 'implementation'
    );
    if (implementationIssues.length > 0) {
      recommendations.push({
        practice: 'Maintain Implementation Independence',
        description: 'Focus on what needs to be done, not how it will be implemented',
        benefit: 'Preserves design flexibility and reduces technical debt',
        priority: 'Medium'
      });
    }

    return recommendations;
  }

  /**
   * Generate auto-fixed text
   */
  generateAutoFixedText(text, autoFixes) {
    let fixedText = text;

    // Apply simple word replacements for common improvements first
    const wordReplacements = [
      { from: /\bcan\b/gi, to: 'shall', confidence: 0.9 },
      { from: /\bmay\b/gi, to: 'should', confidence: 0.8 },
      { from: /\bwill\b(?!\s+be)/gi, to: 'shall', confidence: 0.9 },
      { from: /\buser-friendly\b/gi, to: 'accessible and requiring minimal training', confidence: 0.8 },
      { from: /\beasy\b/gi, to: 'completed within [X] steps', confidence: 0.8 },
      { from: /\bfast\b/gi, to: 'within [X] seconds', confidence: 0.8 }
    ];

    wordReplacements.forEach(replacement => {
      if (replacement.confidence > 0.7) {
        fixedText = fixedText.replace(replacement.from, replacement.to);
      }
    });

    // Filter and validate auto-fixes
    const validFixes = autoFixes.filter(fix =>
      fix.confidence > 0.7 &&
      (fix.type === 'vague_phrase' || fix.type === 'weak_verb') &&
      this.improvementTemplates.has(fix.type)
    );

    // Sort auto-fixes by position (reverse order to maintain positions)
    const sortedFixes = validFixes.sort((a, b) => (b.position || 0) - (a.position || 0));

    sortedFixes.forEach(fix => {
      const template = this.improvementTemplates.get(fix.type);
      if (template && template.replacement && typeof template.replacement === 'function') {
        // Apply template-based replacements carefully
        try {
          fixedText = fixedText.replace(template.pattern, template.replacement);
          this.metrics.autoFixesApplied++;
        } catch (error) {
          // Skip this fix if it causes an error
          console.warn('Auto-fix failed:', error.message);
        }
      }
    });

    // Ensure text ends with period if it doesn't already
    if (!fixedText.match(/[.!?]\s*$/)) {
      fixedText = fixedText.trim() + '.';
    }

    // Clean up any malformed text
    fixedText = fixedText.replace(/\s+/g, ' ').trim();

    return fixedText;
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallScore(analysis) {
    const weights = {
      clarity: 0.3,
      specificity: 0.25,
      completeness: 0.25,
      consistency: 0.1,
      verifiability: 0.1
    };

    let score = 85; // Start with a good baseline score for IEEE 830 style text

    // Check for positive quality indicators first
    const hasShall = analysis.text.toLowerCase().includes('shall');
    const hasStakeholder = /\b(user|system|application|component)\b/i.test(analysis.text);
    const hasAction = /\b(be able to|create|read|update|delete|validate|process|provide|support|enable)\b/i.test(analysis.text);

    // Bonus for good structure
    if (hasShall) score += 5;
    if (hasStakeholder) score += 5;
    if (hasAction) score += 5;

    // Deduct points for issues, but be less harsh
    analysis.issues.forEach(issue => {
      const deduction = Math.min(this.getScoreDeduction(issue), 5); // Cap deductions at 5 points
      score -= deduction;
    });

    // Bonus for NLP quality if available
    if (analysis.nlpAnalysis && analysis.nlpAnalysis.overallRequirementsScore) {
      score = Math.max(score, analysis.nlpAnalysis.overallRequirementsScore);
    }

    return Math.max(60, Math.min(100, Math.round(score)));
  }

  /**
   * Get score deduction for an issue
   */
  getScoreDeduction(issue) {
    const severityMultipliers = {
      high: 8,
      medium: 5,
      low: 2
    };

    const categoryMultipliers = {
      clarity: 1.2,
      specificity: 1.1,
      completeness: 1.3,
      consistency: 0.8,
      verifiability: 0.9,
      grammar: 0.5,
      style: 0.3
    };

    const basePenalty = severityMultipliers[issue.severity] || 3;
    const categoryMultiplier = categoryMultipliers[issue.category] || 1;

    return basePenalty * categoryMultiplier;
  }

  /**
   * Check if an issue is auto-fixable
   */
  isAutoFixable(issueType, match) {
    const autoFixableTypes = [
      'vague_phrase', 'vague_quantifier', 'weak_verb',
      'ambiguousPronouns', 'passiveVoice'
    ];

    return autoFixableTypes.includes(issueType) &&
           this.improvementTemplates.has(issueType);
  }

  /**
   * Extract terminology from text
   */
  extractTerminology(text) {
    const terms = [];
    const words = text.split(/\W+/);

    // Simple terminology extraction
    words.forEach(word => {
      if (word.length > 3 && /^[A-Z]/.test(word)) {
        terms.push(word.toLowerCase());
      }
    });

    return [...new Set(terms)];
  }

  /**
   * Find terminology inconsistencies
   */
  findTerminologyInconsistencies(terms, context) {
    // Placeholder for terminology consistency checking
    // Would need document context to properly implement
    return [];
  }

  /**
   * Check format consistency
   */
  checkFormatConsistency(sentences) {
    const formats = sentences.map(sentence => {
      if (/^The\s+(system|user|application)\s+shall\b/i.test(sentence)) return 'functional';
      if (/^Given\s+.+,?\s*when\s+.+,?\s*then\s+/i.test(sentence)) return 'acceptance';
      if (/^As\s+a\s+.+,\s*I\s+want\s+/i.test(sentence)) return 'user-story';
      return 'other';
    });

    const uniqueFormats = [...new Set(formats)];
    return uniqueFormats.length > 2; // Inconsistent if more than 2 different formats
  }

  /**
   * Update metrics
   */
  updateMetrics(qualityScore, suggestionCount) {
    this.metrics.qualityScores.push(qualityScore);
    this.metrics.improvementsGenerated += suggestionCount;

    // Keep only last 100 scores for average calculation
    if (this.metrics.qualityScores.length > 100) {
      this.metrics.qualityScores = this.metrics.qualityScores.slice(-100);
    }

    this.metrics.averageQualityScore =
      this.metrics.qualityScores.reduce((sum, score) => sum + score, 0) /
      this.metrics.qualityScores.length;
  }

  /**
   * Get quality metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      qualityRulesCount: Object.keys(this.qualityRules).length,
      improvementTemplatesCount: this.improvementTemplates.size,
      styleGuidesCount: Object.keys(this.styleGuides).length,
      autoFixSuccessRate: this.metrics.totalAnalyses > 0 ?
        (this.metrics.autoFixesApplied / this.metrics.totalAnalyses) * 100 : 0
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Test quality analysis
      const testText = 'The user shall be able to create documents quickly.';
      const result = await this.analyzeQuality(testText, { category: 'functional' });

      return {
        healthy: result.success,
        service: 'quality-analysis-engine',
        timestamp: new Date().toISOString(),
        metrics: this.getMetrics(),
        testResult: result.success ? 'passed' : 'failed'
      };
    } catch (error) {
      return {
        healthy: false,
        service: 'quality-analysis-engine',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Add custom quality rule
   */
  addCustomRule(category, ruleName, rule) {
    if (!this.qualityRules[category]) {
      this.qualityRules[category] = {};
    }

    this.qualityRules[category][ruleName] = rule;

    this.emit('custom-rule-added', { category, ruleName });
  }

  /**
   * Add custom improvement template
   */
  addImprovementTemplate(templateId, template) {
    this.improvementTemplates.set(templateId, template);

    this.emit('improvement-template-added', { templateId });
  }

  /**
   * Update style guide
   */
  updateStyleGuide(styleGuideName, rules) {
    if (!this.styleGuides[styleGuideName]) {
      this.styleGuides[styleGuideName] = { name: styleGuideName, rules: {} };
    }

    Object.assign(this.styleGuides[styleGuideName].rules, rules);

    this.emit('style-guide-updated', { styleGuideName });
  }
}

module.exports = QualityAnalysisEngine;