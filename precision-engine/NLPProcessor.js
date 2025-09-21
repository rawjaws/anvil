/**
 * Natural Language Processing Engine for Requirements Analysis
 * Provides semantic analysis, terminology extraction, and quality assessment
 */

class NLPProcessor {
    constructor() {
        this.terminologyDatabase = new Map();
        this.qualityRules = this.initializeQualityRules();
        this.semanticPatterns = this.initializeSemanticPatterns();
        this.initializeTerminologyDatabase();
    }

    /**
     * Initialize quality assessment rules
     */
    initializeQualityRules() {
        return {
            clarity: {
                vaguePhrases: [
                    'should be', 'might be', 'could be', 'as needed',
                    'appropriate', 'reasonable', 'sufficient', 'adequate',
                    'user-friendly', 'intuitive', 'simple', 'easy'
                ],
                weakVerbs: ['handle', 'process', 'manage', 'deal with', 'support'],
                minWordCount: 5,
                maxWordCount: 50
            },
            specificity: {
                quantifiers: ['all', 'any', 'some', 'many', 'few', 'several'],
                timeframes: ['quickly', 'soon', 'eventually', 'timely'],
                measurements: ['fast', 'slow', 'large', 'small', 'high', 'low']
            },
            completeness: {
                requiredElements: ['what', 'who', 'when', 'where', 'why', 'how'],
                criteriaKeywords: ['shall', 'must', 'will', 'should']
            },
            consistency: {
                terminology: true,
                format: true,
                structure: true
            }
        };
    }

    /**
     * Initialize semantic analysis patterns
     */
    initializeSemanticPatterns() {
        return {
            functional: /\b(shall|must|will)\s+(?:be\s+able\s+to\s+)?([^.]+)/gi,
            nonfunctional: /\b(performance|security|usability|reliability|scalability|maintainability)/gi,
            constraints: /\b(within|not\s+exceed|maximum|minimum|at\s+least|no\s+more\s+than)/gi,
            stakeholders: /\b(user|admin|system|customer|operator|manager)/gi,
            actions: /\b(create|read|update|delete|send|receive|process|validate|authenticate|authorize)/gi,
            conditions: /\b(if|when|unless|while|after|before|during)/gi
        };
    }

    /**
     * Initialize terminology database with common terms
     */
    initializeTerminologyDatabase() {
        const standardTerms = {
            'user interface': ['UI', 'interface', 'front-end'],
            'database': ['DB', 'data store', 'repository'],
            'authentication': ['auth', 'login', 'sign-in'],
            'authorization': ['access control', 'permissions', 'privileges'],
            'application programming interface': ['API', 'service interface'],
            'user experience': ['UX', 'user interaction'],
            'real-time': ['realtime', 'real time', 'live'],
            'configuration': ['config', 'settings', 'preferences']
        };

        Object.entries(standardTerms).forEach(([standard, variants]) => {
            this.terminologyDatabase.set(standard, {
                variants,
                standardForm: standard,
                category: 'technical'
            });
        });
    }

    /**
     * Analyze requirement text for quality and extract insights
     */
    async analyzeRequirement(text, options = {}) {
        const startTime = Date.now();

        try {
            // Validate input
            if (!text || typeof text !== 'string') {
                return {
                    success: false,
                    error: 'Invalid input: text must be a non-empty string'
                };
            }

            const analysis = {
                text,
                timestamp: new Date().toISOString(),
                metrics: {},
                issues: [],
                suggestions: [],
                terminology: {},
                semantic: {},
                quality: {}
            };

            // Perform parallel analysis with error handling
            const [
                clarityResults,
                specificityResults,
                completenessResults,
                terminologyResults,
                semanticResults
            ] = await Promise.all([
                this.analyzeClarityAsync(text).catch(err => ({ score: 50, issues: [], metrics: {}, error: err.message })),
                this.analyzeSpecificityAsync(text).catch(err => ({ score: 50, issues: [], metrics: {}, error: err.message })),
                this.analyzeCompletenessAsync(text).catch(err => ({ score: 50, issues: [], metrics: {}, error: err.message })),
                this.analyzeTerminologyAsync(text).catch(err => ({ terms: [], confidence: 0.5, error: err.message })),
                this.analyzeSemanticStructureAsync(text).catch(err => ({
                    stakeholders: [], actions: [], objects: [], conditions: [],
                    structure: { functional: [], nonfunctional: [], constraints: [] },
                    error: err.message
                }))
            ]);

            // Consolidate results
            analysis.quality.clarity = clarityResults;
            analysis.quality.specificity = specificityResults;
            analysis.quality.completeness = completenessResults;
            analysis.terminology = terminologyResults;
            analysis.semantic = semanticResults;

            // Calculate overall quality score
            analysis.metrics.qualityScore = this.calculateQualityScore(analysis);
            analysis.metrics.processingTime = Date.now() - startTime;

            // Generate improvement suggestions
            analysis.suggestions = this.generateSuggestions(analysis);

            return analysis;

        } catch (error) {
            // Return a valid analysis object even on error to maintain API compatibility
            return {
                text: text || '',
                timestamp: new Date().toISOString(),
                metrics: { qualityScore: 0, processingTime: Date.now() - startTime },
                issues: [{ type: 'analysis_error', severity: 'high', message: error.message }],
                suggestions: [],
                terminology: { terms: [], confidence: 0 },
                semantic: {
                    stakeholders: [], actions: [], objects: [], conditions: [],
                    structure: { functional: [], nonfunctional: [], constraints: [] }
                },
                quality: {
                    clarity: { score: 0, issues: [] },
                    specificity: { score: 0, issues: [] },
                    completeness: { score: 0, issues: [] }
                },
                error: error.message
            };
        }
    }

    /**
     * Analyze text clarity asynchronously
     */
    async analyzeClarityAsync(text) {
        return new Promise((resolve) => {
            const words = text.toLowerCase().split(/\s+/);
            const sentences = text.split(/[.!?]+/).filter(s => s.trim());

            const issues = [];
            const metrics = {
                wordCount: words.length,
                sentenceCount: sentences.length,
                avgWordsPerSentence: words.length / sentences.length
            };

            // Check for vague phrases
            this.qualityRules.clarity.vaguePhrases.forEach(phrase => {
                if (text.toLowerCase().includes(phrase)) {
                    issues.push({
                        type: 'vague_phrase',
                        phrase,
                        severity: 'medium',
                        message: `Vague phrase "${phrase}" reduces clarity`
                    });
                }
            });

            // Check for weak verbs
            this.qualityRules.clarity.weakVerbs.forEach(verb => {
                if (words.includes(verb)) {
                    issues.push({
                        type: 'weak_verb',
                        verb,
                        severity: 'low',
                        message: `Weak verb "${verb}" - consider more specific action`
                    });
                }
            });

            // Check sentence length
            if (metrics.avgWordsPerSentence > 25) {
                issues.push({
                    type: 'sentence_length',
                    severity: 'medium',
                    message: 'Sentences are too long, consider breaking them down'
                });
            }

            const score = Math.max(0, 100 - (issues.length * 10));

            resolve({ score, issues, metrics });
        });
    }

    /**
     * Analyze text specificity asynchronously
     */
    async analyzeSpecificityAsync(text) {
        return new Promise((resolve) => {
            const issues = [];
            const metrics = { specificityElements: 0 };

            // Check for vague quantifiers
            this.qualityRules.specificity.quantifiers.forEach(quantifier => {
                if (text.toLowerCase().includes(quantifier)) {
                    issues.push({
                        type: 'vague_quantifier',
                        term: quantifier,
                        severity: 'medium',
                        message: `Vague quantifier "${quantifier}" - provide specific numbers`
                    });
                }
            });

            // Check for specific measurements
            const numberPattern = /\b\d+(\.\d+)?\s*(ms|seconds?|minutes?|hours?|days?|MB|GB|%|percent)\b/gi;
            const specificMeasurements = text.match(numberPattern) || [];
            metrics.specificityElements = specificMeasurements.length;

            const score = Math.min(100, 60 + (metrics.specificityElements * 10) - (issues.length * 15));

            resolve({ score, issues, metrics });
        });
    }

    /**
     * Analyze requirement completeness asynchronously
     */
    async analyzeCompletenessAsync(text) {
        return new Promise((resolve) => {
            const issues = [];
            const metrics = { completenessElements: 0 };

            const lowerText = text.toLowerCase();

            // Check for action verbs (what)
            const hasAction = this.semanticPatterns.actions.test(text);
            if (hasAction) metrics.completenessElements++;
            else issues.push({
                type: 'missing_action',
                severity: 'high',
                message: 'Requirement lacks clear action verb'
            });

            // Check for stakeholders (who)
            const hasStakeholder = this.semanticPatterns.stakeholders.test(text);
            if (hasStakeholder) metrics.completenessElements++;
            else issues.push({
                type: 'missing_stakeholder',
                severity: 'medium',
                message: 'Requirement should specify who performs the action'
            });

            // Check for conditions (when/where)
            const hasCondition = this.semanticPatterns.conditions.test(text);
            if (hasCondition) metrics.completenessElements++;

            // Check for criteria keywords
            const hasCriteria = this.qualityRules.completeness.criteriaKeywords.some(
                keyword => lowerText.includes(keyword)
            );
            if (hasCriteria) metrics.completenessElements++;
            else issues.push({
                type: 'missing_criteria',
                severity: 'high',
                message: 'Requirement should use criteria keywords (shall, must, will)'
            });

            const score = (metrics.completenessElements / 4) * 100;

            resolve({ score, issues, metrics });
        });
    }

    /**
     * Analyze terminology consistency asynchronously
     */
    async analyzeTerminologyAsync(text) {
        return new Promise((resolve) => {
            const found = new Map();
            const issues = [];
            const suggestions = [];

            // Extract technical terms
            const words = text.toLowerCase().split(/\W+/);

            this.terminologyDatabase.forEach((termData, standardTerm) => {
                const allForms = [standardTerm, ...termData.variants];

                allForms.forEach(form => {
                    if (words.includes(form.toLowerCase())) {
                        if (!found.has(standardTerm)) {
                            found.set(standardTerm, []);
                        }
                        found.get(standardTerm).push(form);
                    }
                });
            });

            // Check for inconsistent usage
            found.forEach((forms, standardTerm) => {
                if (forms.length > 1) {
                    issues.push({
                        type: 'inconsistent_terminology',
                        term: standardTerm,
                        variants: forms,
                        severity: 'medium',
                        message: `Inconsistent terminology: use "${standardTerm}" consistently`
                    });

                    suggestions.push({
                        type: 'standardize_term',
                        standardForm: standardTerm,
                        variants: forms
                    });
                }
            });

            const score = Math.max(0, 100 - (issues.length * 20));

            resolve({
                score,
                issues,
                suggestions,
                termsFound: Array.from(found.keys()),
                metrics: { uniqueTerms: found.size }
            });
        });
    }

    /**
     * Analyze semantic structure asynchronously
     */
    async analyzeSemanticStructureAsync(text) {
        return new Promise((resolve) => {
            const structure = {
                functional: [],
                nonfunctional: [],
                constraints: [],
                stakeholders: [],
                actions: [],
                conditions: []
            };

            // Extract semantic elements
            Object.entries(this.semanticPatterns).forEach(([type, pattern]) => {
                const matches = text.match(pattern) || [];
                structure[type] = matches;
            });

            const metrics = {
                functionalRequirements: structure.functional.length,
                nonfunctionalRequirements: structure.nonfunctional.length,
                constraintsIdentified: structure.constraints.length,
                stakeholdersIdentified: structure.stakeholders.length,
                actionsIdentified: structure.actions.length,
                conditionsIdentified: structure.conditions.length
            };

            resolve({ structure, metrics });
        });
    }

    /**
     * Calculate overall quality score
     */
    calculateQualityScore(analysis) {
        const weights = {
            clarity: 0.3,
            specificity: 0.25,
            completeness: 0.35,
            terminology: 0.1
        };

        let totalScore = 0;
        Object.entries(weights).forEach(([category, weight]) => {
            if (analysis.quality[category] && analysis.quality[category].score !== undefined) {
                totalScore += analysis.quality[category].score * weight;
            }
        });

        return Math.round(totalScore);
    }

    /**
     * Generate improvement suggestions based on analysis
     */
    generateSuggestions(analysis) {
        const suggestions = [];

        // Collect suggestions from all analysis components
        Object.values(analysis.quality).forEach(qualityArea => {
            if (qualityArea.issues) {
                qualityArea.issues.forEach(issue => {
                    suggestions.push({
                        category: 'quality',
                        type: issue.type,
                        severity: issue.severity,
                        message: issue.message,
                        autoFixable: this.isAutoFixable(issue.type)
                    });
                });
            }
        });

        // Add terminology suggestions
        if (analysis.terminology.suggestions) {
            suggestions.push(...analysis.terminology.suggestions.map(s => ({
                ...s,
                category: 'terminology',
                autoFixable: true
            })));
        }

        // Sort by severity and auto-fixability
        return suggestions.sort((a, b) => {
            const severityOrder = { high: 3, medium: 2, low: 1 };
            const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            if (severityDiff !== 0) return severityDiff;
            return b.autoFixable - a.autoFixable;
        });
    }

    /**
     * Check if an issue type can be automatically fixed
     */
    isAutoFixable(issueType) {
        const autoFixableTypes = [
            'inconsistent_terminology',
            'weak_verb',
            'vague_quantifier'
        ];
        return autoFixableTypes.includes(issueType);
    }

    /**
     * Extract key terminology from text
     */
    extractTerminology(text) {
        const terms = new Set();
        const words = text.toLowerCase().split(/\W+/);

        // Extract technical terms based on patterns
        const technicalPatterns = [
            /\b[A-Z]{2,}\b/g, // Acronyms
            /\b\w+(?:API|UI|DB|SDK)\b/gi, // Technical suffixes
            /\b(?:interface|protocol|service|component|module|framework)\w*\b/gi // Technical words
        ];

        technicalPatterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(match => terms.add(match.toLowerCase()));
        });

        return Array.from(terms);
    }

    /**
     * Add custom terminology to database
     */
    addTerminology(standardTerm, variants = [], category = 'custom') {
        this.terminologyDatabase.set(standardTerm, {
            variants,
            standardForm: standardTerm,
            category
        });
    }

    /**
     * Get processing statistics
     */
    getStatistics() {
        return {
            terminologyDatabaseSize: this.terminologyDatabase.size,
            qualityRulesCount: Object.keys(this.qualityRules).length,
            semanticPatternsCount: Object.keys(this.semanticPatterns).length,
            version: '1.0.0'
        };
    }
}

module.exports = NLPProcessor;