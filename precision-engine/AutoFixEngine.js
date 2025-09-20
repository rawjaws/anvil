/**
 * Auto-Fix Suggestions Engine for Requirements Improvement
 * Provides smart error correction, style improvements, and compliance checking
 */

class AutoFixEngine {
    constructor(nlpProcessor = null) {
        this.nlpProcessor = nlpProcessor;
        this.fixRules = this.initializeFixRules();
        this.complianceRules = this.initializeComplianceRules();
        this.styleGuide = this.initializeStyleGuide();
        this.statistics = {
            totalSuggestions: 0,
            acceptedSuggestions: 0,
            rejectedSuggestions: 0,
            autoFixesApplied: 0
        };
    }

    /**
     * Initialize fix rules for common issues
     */
    initializeFixRules() {
        return {
            vaguePhrases: {
                'should be': ['must be', 'shall be', 'will be'],
                'might be': ['may be', 'could be'],
                'user-friendly': ['intuitive', 'accessible', 'easy to use'],
                'appropriate': ['suitable', 'relevant', 'applicable'],
                'reasonable': ['acceptable', 'practical', 'feasible'],
                'sufficient': ['adequate', 'enough'],
                'as needed': ['when required', 'on demand'],
                'handle': ['process', 'manage', 'execute'],
                'deal with': ['process', 'manage', 'handle']
            },
            weakVerbs: {
                'process': ['execute', 'perform', 'compute'],
                'handle': ['manage', 'process', 'execute'],
                'manage': ['control', 'coordinate', 'oversee'],
                'support': ['enable', 'facilitate', 'provide'],
                'deal with': ['process', 'handle', 'manage']
            },
            vagueQuantifiers: {
                'many': ['X number of', 'at least N', 'up to N'],
                'few': ['2-3', 'limited number of', 'minimal'],
                'some': ['specific number of', 'certain'],
                'several': ['multiple', '3-5', 'a defined set of'],
                'quickly': ['within X seconds', 'in real-time', 'immediately'],
                'soon': ['within X timeframe', 'promptly'],
                'fast': ['within X milliseconds', 'high-performance'],
                'slow': ['with latency of X', 'delayed by X']
            },
            criteriaKeywords: {
                patterns: [
                    {
                        from: /the system should/gi,
                        to: 'The system shall'
                    },
                    {
                        from: /users can/gi,
                        to: 'Users shall be able to'
                    },
                    {
                        from: /the application will/gi,
                        to: 'The application shall'
                    },
                    {
                        from: /it should/gi,
                        to: 'It shall'
                    }
                ]
            }
        };
    }

    /**
     * Initialize compliance rules for best practices
     */
    initializeComplianceRules() {
        return {
            structure: {
                requirementFormat: /^[A-Z][^.]*\.(?: [A-Z][^.]*\.)*$/,
                minLength: 10,
                maxLength: 200,
                mustContainAction: true,
                mustContainCriteria: true
            },
            language: {
                prohibitedWords: [
                    'obviously', 'clearly', 'simply', 'just', 'easy',
                    'quickly', 'efficiently', 'effectively'
                ],
                recommendedStructure: [
                    'stakeholder', 'action', 'object', 'condition', 'criteria'
                ]
            },
            measurability: {
                requiresMetrics: [
                    'performance', 'speed', 'accuracy', 'reliability',
                    'availability', 'capacity', 'scalability'
                ],
                metricPatterns: [
                    /\d+\s*(ms|seconds?|minutes?|hours?)/gi,
                    /\d+\s*(MB|GB|KB)/gi,
                    /\d+\s*(%|percent)/gi,
                    /\d+\s*(users?|requests?|transactions?)/gi
                ]
            }
        };
    }

    /**
     * Initialize style guide rules
     */
    initializeStyleGuide() {
        return {
            formatting: {
                sentenceCase: true,
                noTrailingSpaces: true,
                singleSpaceAfterPeriod: true,
                noMultipleSpaces: true
            },
            terminology: {
                standardize: true,
                acronymDefinition: true,
                consistentCapitalization: true
            },
            structure: {
                activeVoice: true,
                presentTense: true,
                clearSubject: true,
                specificVerbs: true
            }
        };
    }

    /**
     * Generate auto-fix suggestions for given text
     */
    async generateAutoFixes(text, analysisResults = null) {
        const fixes = [];
        const startTime = Date.now();

        try {
            // Use existing analysis or perform new one
            const analysis = analysisResults || (this.nlpProcessor ?
                await this.nlpProcessor.analyzeRequirement(text) :
                this.performBasicAnalysis(text));

            // Generate fixes based on different categories
            const [
                phraseFixes,
                verbFixes,
                quantifierFixes,
                criteriaFixes,
                structureFixes,
                complianceFixes,
                styleFixes
            ] = await Promise.all([
                this.generatePhraseFixes(text),
                this.generateVerbFixes(text),
                this.generateQuantifierFixes(text),
                this.generateCriteriaFixes(text),
                this.generateStructureFixes(text, analysis),
                this.generateComplianceFixes(text, analysis),
                this.generateStyleFixes(text)
            ]);

            // Consolidate all fixes
            fixes.push(
                ...phraseFixes,
                ...verbFixes,
                ...quantifierFixes,
                ...criteriaFixes,
                ...structureFixes,
                ...complianceFixes,
                ...styleFixes
            );

            // Rank fixes by impact and confidence
            const rankedFixes = this.rankFixes(fixes);

            // Update statistics
            this.statistics.totalSuggestions += rankedFixes.length;

            return {
                originalText: text,
                fixes: rankedFixes,
                summary: this.generateFixSummary(rankedFixes),
                processingTime: Date.now() - startTime,
                totalFixes: rankedFixes.length,
                autoApplicable: rankedFixes.filter(f => f.autoApplicable).length
            };

        } catch (error) {
            throw new Error(`Auto-fix generation failed: ${error.message}`);
        }
    }

    /**
     * Generate fixes for vague phrases
     */
    async generatePhraseFixes(text) {
        const fixes = [];

        Object.entries(this.fixRules.vaguePhrases).forEach(([vague, alternatives]) => {
            const regex = new RegExp(`\\b${vague}\\b`, 'gi');
            const matches = text.match(regex);

            if (matches) {
                matches.forEach(() => {
                    alternatives.forEach((alternative, index) => {
                        fixes.push({
                            type: 'vague_phrase',
                            category: 'clarity',
                            severity: 'medium',
                            original: vague,
                            suggestion: alternative,
                            confidence: 0.8 - (index * 0.1),
                            autoApplicable: index === 0, // Only auto-apply best suggestion
                            reason: `Replace vague phrase "${vague}" with more specific "${alternative}"`,
                            impact: 'Improves clarity and precision',
                            beforeText: text,
                            afterText: text.replace(regex, alternative),
                            position: text.toLowerCase().indexOf(vague.toLowerCase())
                        });
                    });
                });
            }
        });

        return fixes;
    }

    /**
     * Generate fixes for weak verbs
     */
    async generateVerbFixes(text) {
        const fixes = [];

        Object.entries(this.fixRules.weakVerbs).forEach(([weak, stronger]) => {
            const regex = new RegExp(`\\b${weak}\\b`, 'gi');
            const matches = text.match(regex);

            if (matches) {
                stronger.forEach((strongVerb, index) => {
                    fixes.push({
                        type: 'weak_verb',
                        category: 'precision',
                        severity: 'low',
                        original: weak,
                        suggestion: strongVerb,
                        confidence: 0.7 - (index * 0.1),
                        autoApplicable: index === 0,
                        reason: `Replace weak verb "${weak}" with more precise "${strongVerb}"`,
                        impact: 'Increases precision and clarity of action',
                        beforeText: text,
                        afterText: text.replace(regex, strongVerb),
                        position: text.toLowerCase().indexOf(weak.toLowerCase())
                    });
                });
            }
        });

        return fixes;
    }

    /**
     * Generate fixes for vague quantifiers
     */
    async generateQuantifierFixes(text) {
        const fixes = [];

        Object.entries(this.fixRules.vagueQuantifiers).forEach(([vague, specific]) => {
            const regex = new RegExp(`\\b${vague}\\b`, 'gi');
            const matches = text.match(regex);

            if (matches) {
                specific.forEach((specificTerm, index) => {
                    fixes.push({
                        type: 'vague_quantifier',
                        category: 'specificity',
                        severity: 'medium',
                        original: vague,
                        suggestion: specificTerm,
                        confidence: 0.6 - (index * 0.1),
                        autoApplicable: false, // Requires human decision for numbers
                        reason: `Replace vague quantifier "${vague}" with specific "${specificTerm}"`,
                        impact: 'Provides measurable criteria',
                        beforeText: text,
                        afterText: text.replace(regex, specificTerm),
                        position: text.toLowerCase().indexOf(vague.toLowerCase()),
                        requiresInput: true,
                        inputType: 'number'
                    });
                });
            }
        });

        return fixes;
    }

    /**
     * Generate fixes for criteria keywords
     */
    async generateCriteriaFixes(text) {
        const fixes = [];

        this.fixRules.criteriaKeywords.patterns.forEach(pattern => {
            const matches = text.match(pattern.from);

            if (matches) {
                fixes.push({
                    type: 'criteria_keyword',
                    category: 'completeness',
                    severity: 'high',
                    original: matches[0],
                    suggestion: pattern.to,
                    confidence: 0.9,
                    autoApplicable: true,
                    reason: `Use definitive criteria keyword for requirements`,
                    impact: 'Ensures requirement is testable and binding',
                    beforeText: text,
                    afterText: text.replace(pattern.from, pattern.to),
                    position: text.search(pattern.from)
                });
            }
        });

        return fixes;
    }

    /**
     * Generate structural fixes
     */
    async generateStructureFixes(text, analysis) {
        const fixes = [];

        // Check sentence structure
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());

        sentences.forEach((sentence, index) => {
            const trimmed = sentence.trim();

            // Check for passive voice
            const passivePatterns = [
                /\bis\s+\w+ed\b/gi,
                /\bare\s+\w+ed\b/gi,
                /\bwas\s+\w+ed\b/gi,
                /\bwere\s+\w+ed\b/gi,
                /\bbeen\s+\w+ed\b/gi
            ];

            passivePatterns.forEach(pattern => {
                if (pattern.test(trimmed)) {
                    fixes.push({
                        type: 'passive_voice',
                        category: 'structure',
                        severity: 'medium',
                        original: trimmed,
                        suggestion: 'Convert to active voice',
                        confidence: 0.7,
                        autoApplicable: false,
                        reason: 'Active voice is clearer and more direct',
                        impact: 'Improves readability and accountability',
                        requiresInput: true,
                        inputType: 'text'
                    });
                }
            });

            // Check sentence length
            const words = trimmed.split(/\s+/).length;
            if (words > 25) {
                fixes.push({
                    type: 'sentence_length',
                    category: 'structure',
                    severity: 'medium',
                    original: trimmed,
                    suggestion: 'Break into shorter sentences',
                    confidence: 0.8,
                    autoApplicable: false,
                    reason: 'Long sentences reduce readability',
                    impact: 'Improves comprehension and clarity',
                    requiresInput: true,
                    inputType: 'text'
                });
            }
        });

        return fixes;
    }

    /**
     * Generate compliance fixes
     */
    async generateComplianceFixes(text, analysis) {
        const fixes = [];

        // Check for prohibited words
        this.complianceRules.language.prohibitedWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            if (regex.test(text)) {
                fixes.push({
                    type: 'prohibited_word',
                    category: 'compliance',
                    severity: 'medium',
                    original: word,
                    suggestion: 'Remove or replace with objective language',
                    confidence: 0.9,
                    autoApplicable: false,
                    reason: `"${word}" is subjective and should be avoided`,
                    impact: 'Ensures objective, measurable requirements',
                    requiresInput: true,
                    inputType: 'text'
                });
            }
        });

        // Check for missing metrics in performance requirements
        const lowerText = text.toLowerCase();
        this.complianceRules.measurability.requiresMetrics.forEach(term => {
            if (lowerText.includes(term)) {
                const hasMetric = this.complianceRules.measurability.metricPatterns.some(
                    pattern => pattern.test(text)
                );

                if (!hasMetric) {
                    fixes.push({
                        type: 'missing_metric',
                        category: 'compliance',
                        severity: 'high',
                        original: term,
                        suggestion: `Add specific metric for ${term}`,
                        confidence: 0.95,
                        autoApplicable: false,
                        reason: `${term} requirements must be measurable`,
                        impact: 'Makes requirement testable and verifiable',
                        requiresInput: true,
                        inputType: 'metric'
                    });
                }
            }
        });

        return fixes;
    }

    /**
     * Generate style fixes
     */
    async generateStyleFixes(text) {
        const fixes = [];

        // Fix multiple spaces
        if (/\s{2,}/.test(text)) {
            fixes.push({
                type: 'multiple_spaces',
                category: 'style',
                severity: 'low',
                original: text,
                suggestion: text.replace(/\s+/g, ' '),
                confidence: 1.0,
                autoApplicable: true,
                reason: 'Remove extra spaces',
                impact: 'Improves formatting consistency'
            });
        }

        // Fix trailing spaces
        if (/\s+$/.test(text)) {
            fixes.push({
                type: 'trailing_spaces',
                category: 'style',
                severity: 'low',
                original: text,
                suggestion: text.trimEnd(),
                confidence: 1.0,
                autoApplicable: true,
                reason: 'Remove trailing spaces',
                impact: 'Clean formatting'
            });
        }

        return fixes;
    }

    /**
     * Rank fixes by impact and confidence
     */
    rankFixes(fixes) {
        return fixes.sort((a, b) => {
            // Sort by severity first
            const severityOrder = { high: 3, medium: 2, low: 1 };
            const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
            if (severityDiff !== 0) return severityDiff;

            // Then by confidence
            const confidenceDiff = (b.confidence || 0) - (a.confidence || 0);
            if (confidenceDiff !== 0) return confidenceDiff;

            // Finally by auto-applicability
            return (b.autoApplicable ? 1 : 0) - (a.autoApplicable ? 1 : 0);
        });
    }

    /**
     * Generate summary of fixes
     */
    generateFixSummary(fixes) {
        const summary = {
            total: fixes.length,
            byCategory: {},
            bySeverity: {},
            autoApplicable: 0,
            requiresInput: 0
        };

        fixes.forEach(fix => {
            // By category
            summary.byCategory[fix.category] = (summary.byCategory[fix.category] || 0) + 1;

            // By severity
            summary.bySeverity[fix.severity] = (summary.bySeverity[fix.severity] || 0) + 1;

            // Count auto-applicable
            if (fix.autoApplicable) summary.autoApplicable++;

            // Count requiring input
            if (fix.requiresInput) summary.requiresInput++;
        });

        return summary;
    }

    /**
     * Apply auto-fixes to text
     */
    async applyAutoFixes(text, selectedFixes = []) {
        let result = text;
        const applied = [];
        const failed = [];

        for (const fix of selectedFixes) {
            try {
                if (fix.autoApplicable && fix.afterText) {
                    result = fix.afterText;
                    applied.push(fix);
                    this.statistics.autoFixesApplied++;
                } else if (fix.suggestion && typeof fix.suggestion === 'string') {
                    // Simple text replacement
                    const regex = new RegExp(this.escapeRegex(fix.original), 'gi');
                    result = result.replace(regex, fix.suggestion);
                    applied.push(fix);
                    this.statistics.autoFixesApplied++;
                }
            } catch (error) {
                failed.push({ fix, error: error.message });
            }
        }

        return {
            originalText: text,
            fixedText: result,
            appliedFixes: applied,
            failedFixes: failed,
            success: failed.length === 0
        };
    }

    /**
     * Perform basic analysis without NLP processor
     */
    performBasicAnalysis(text) {
        return {
            text,
            metrics: {
                wordCount: text.split(/\s+/).length,
                sentenceCount: text.split(/[.!?]+/).filter(s => s.trim()).length
            },
            quality: {},
            issues: []
        };
    }

    /**
     * Escape regex special characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Record fix acceptance/rejection
     */
    recordFeedback(fixId, accepted) {
        if (accepted) {
            this.statistics.acceptedSuggestions++;
        } else {
            this.statistics.rejectedSuggestions++;
        }
    }

    /**
     * Get engine statistics
     */
    getStatistics() {
        const acceptance = this.statistics.totalSuggestions > 0
            ? (this.statistics.acceptedSuggestions / this.statistics.totalSuggestions) * 100
            : 0;

        return {
            ...this.statistics,
            acceptanceRate: Math.round(acceptance * 100) / 100,
            version: '1.0.0'
        };
    }

    /**
     * Add custom fix rule
     */
    addCustomFixRule(category, rule) {
        if (!this.fixRules[category]) {
            this.fixRules[category] = {};
        }
        Object.assign(this.fixRules[category], rule);
    }
}

module.exports = AutoFixEngine;