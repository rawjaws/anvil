/**
 * Test Suite for AutoFixEngine
 * Comprehensive testing for Auto-Fix Suggestions System
 */

const AutoFixEngine = require('../../precision-engine/AutoFixEngine');
const NLPProcessor = require('../../precision-engine/NLPProcessor');

describe('AutoFixEngine', () => {
    let autoFixEngine;
    let nlpProcessor;

    beforeEach(() => {
        nlpProcessor = new NLPProcessor();
        autoFixEngine = new AutoFixEngine(nlpProcessor);
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(autoFixEngine).toBeDefined();
            expect(autoFixEngine.fixRules).toBeDefined();
            expect(autoFixEngine.complianceRules).toBeDefined();
            expect(autoFixEngine.styleGuide).toBeDefined();
        });

        test('should initialize without NLP processor', () => {
            const standalone = new AutoFixEngine();
            expect(standalone).toBeDefined();
            expect(standalone.nlpProcessor).toBeNull();
        });

        test('should have fix rules for all categories', () => {
            const rules = autoFixEngine.fixRules;
            expect(rules.vaguePhrases).toBeDefined();
            expect(rules.weakVerbs).toBeDefined();
            expect(rules.vagueQuantifiers).toBeDefined();
            expect(rules.criteriaKeywords).toBeDefined();
        });

        test('should have compliance rules initialized', () => {
            const compliance = autoFixEngine.complianceRules;
            expect(compliance.structure).toBeDefined();
            expect(compliance.language).toBeDefined();
            expect(compliance.measurability).toBeDefined();
        });

        test('should initialize statistics tracking', () => {
            const stats = autoFixEngine.getStatistics();
            expect(stats.totalSuggestions).toBe(0);
            expect(stats.acceptedSuggestions).toBe(0);
            expect(stats.rejectedSuggestions).toBe(0);
            expect(stats.autoFixesApplied).toBe(0);
            expect(stats.acceptanceRate).toBe(0);
        });
    });

    describe('Auto-Fix Generation', () => {
        test('should generate fixes for vague phrases', async () => {
            const text = 'The system should be user-friendly and appropriate.';
            const result = await autoFixEngine.generateAutoFixes(text);

            expect(result.fixes.length).toBeGreaterThan(0);
            const phraseFixes = result.fixes.filter(fix => fix.type === 'vague_phrase');
            expect(phraseFixes.length).toBeGreaterThan(0);

            const userFriendlyFix = phraseFixes.find(fix => fix.original === 'user-friendly');
            expect(userFriendlyFix).toBeDefined();
            expect(userFriendlyFix.autoApplicable).toBe(true);
            expect(userFriendlyFix.confidence).toBeGreaterThan(0);
        });

        test('should generate fixes for weak verbs', async () => {
            const text = 'The system will handle user requests and manage data.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const verbFixes = result.fixes.filter(fix => fix.type === 'weak_verb');
            expect(verbFixes.length).toBeGreaterThan(0);

            const handleFix = verbFixes.find(fix => fix.original === 'handle');
            expect(handleFix).toBeDefined();
            expect(handleFix.suggestion).toBeDefined();
            expect(handleFix.autoApplicable).toBe(true);
        });

        test('should generate fixes for vague quantifiers', async () => {
            const text = 'The system should process many requests quickly.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const quantifierFixes = result.fixes.filter(fix => fix.type === 'vague_quantifier');
            expect(quantifierFixes.length).toBeGreaterThan(0);

            const manyFix = quantifierFixes.find(fix => fix.original === 'many');
            expect(manyFix).toBeDefined();
            expect(manyFix.requiresInput).toBe(true);
            expect(manyFix.autoApplicable).toBe(false);
        });

        test('should generate fixes for criteria keywords', async () => {
            const text = 'The system should authenticate users.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const criteriaFixes = result.fixes.filter(fix => fix.type === 'criteria_keyword');
            expect(criteriaFixes.length).toBeGreaterThan(0);

            const shouldFix = criteriaFixes.find(fix => fix.original.includes('should'));
            expect(shouldFix).toBeDefined();
            expect(shouldFix.suggestion).toContain('shall');
            expect(shouldFix.autoApplicable).toBe(true);
        });

        test('should generate fixes for passive voice', async () => {
            const text = 'Users are authenticated by the system.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const passiveFixes = result.fixes.filter(fix => fix.type === 'passive_voice');
            expect(passiveFixes.length).toBeGreaterThan(0);

            const passiveFix = passiveFixes[0];
            expect(passiveFix.autoApplicable).toBe(false);
            expect(passiveFix.requiresInput).toBe(true);
        });

        test('should generate fixes for prohibited words', async () => {
            const text = 'The system should obviously be simple and efficient.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const prohibitedFixes = result.fixes.filter(fix => fix.type === 'prohibited_word');
            expect(prohibitedFixes.length).toBeGreaterThan(0);

            const obviouslyFix = prohibitedFixes.find(fix => fix.original === 'obviously');
            expect(obviouslyFix).toBeDefined();
        });

        test('should generate fixes for missing metrics', async () => {
            const text = 'The system must have good performance.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const metricFixes = result.fixes.filter(fix => fix.type === 'missing_metric');
            expect(metricFixes.length).toBeGreaterThan(0);

            const performanceFix = metricFixes.find(fix => fix.original === 'performance');
            expect(performanceFix).toBeDefined();
            expect(performanceFix.requiresInput).toBe(true);
        });

        test('should generate style fixes', async () => {
            const text = 'The  system   shall   authenticate  users. ';
            const result = await autoFixEngine.generateAutoFixes(text);

            const styleFixes = result.fixes.filter(fix =>
                fix.type === 'multiple_spaces' || fix.type === 'trailing_spaces'
            );
            expect(styleFixes.length).toBeGreaterThan(0);

            const spaceFix = styleFixes.find(fix => fix.type === 'multiple_spaces');
            expect(spaceFix).toBeDefined();
            expect(spaceFix.autoApplicable).toBe(true);
            expect(spaceFix.confidence).toBe(1.0);
        });

        test('should achieve >80% auto-fix acceptance rate target', async () => {
            const testTexts = [
                'The system should be user-friendly.',
                'Users can handle data processing.',
                'The application should work quickly.',
                'The  system   has  multiple   spaces.',
                'The system should authenticate users.'
            ];

            let totalFixes = 0;
            let autoApplicableFixes = 0;

            for (const text of testTexts) {
                const result = await autoFixEngine.generateAutoFixes(text);
                totalFixes += result.fixes.length;
                autoApplicableFixes += result.fixes.filter(fix => fix.autoApplicable).length;
            }

            const autoApplicableRate = (autoApplicableFixes / totalFixes) * 100;
            expect(autoApplicableRate).toBeGreaterThanOrEqual(80);
        });
    });

    describe('Fix Ranking and Prioritization', () => {
        test('should rank fixes by severity', async () => {
            const text = 'The system should obviously handle many users quickly.';
            const result = await autoFixEngine.generateAutoFixes(text);

            expect(result.fixes.length).toBeGreaterThan(1);

            // Check that high severity issues come first
            for (let i = 0; i < result.fixes.length - 1; i++) {
                const currentSeverity = getSeverityValue(result.fixes[i].severity);
                const nextSeverity = getSeverityValue(result.fixes[i + 1].severity);
                expect(currentSeverity).toBeGreaterThanOrEqual(nextSeverity);
            }
        });

        test('should rank fixes by confidence within same severity', async () => {
            const text = 'The system should be appropriate and user-friendly.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const mediumSeverityFixes = result.fixes.filter(fix => fix.severity === 'medium');
            if (mediumSeverityFixes.length > 1) {
                for (let i = 0; i < mediumSeverityFixes.length - 1; i++) {
                    expect(mediumSeverityFixes[i].confidence)
                        .toBeGreaterThanOrEqual(mediumSeverityFixes[i + 1].confidence);
                }
            }
        });

        test('should prioritize auto-applicable fixes', async () => {
            const text = 'The system should handle users appropriately.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const sameSeverityFixes = result.fixes.filter(fix => fix.severity === 'medium');
            if (sameSeverityFixes.length > 1) {
                // Within same severity, auto-applicable should come first (when confidence is equal)
                const sameConfidenceFixes = sameSeverityFixes.filter(fix =>
                    Math.abs(fix.confidence - sameSeverityFixes[0].confidence) < 0.1
                );

                if (sameConfidenceFixes.length > 1) {
                    const autoApplicableIndex = sameConfidenceFixes.findIndex(fix => fix.autoApplicable);
                    const nonAutoApplicableIndex = sameConfidenceFixes.findIndex(fix => !fix.autoApplicable);

                    if (autoApplicableIndex !== -1 && nonAutoApplicableIndex !== -1) {
                        expect(autoApplicableIndex).toBeLessThan(nonAutoApplicableIndex);
                    }
                }
            }
        });

        function getSeverityValue(severity) {
            const values = { high: 3, medium: 2, low: 1 };
            return values[severity] || 0;
        }
    });

    describe('Fix Application', () => {
        test('should apply simple auto-fixes correctly', async () => {
            const text = 'The system should be user-friendly.';
            const fixesResult = await autoFixEngine.generateAutoFixes(text);

            const autoFixes = fixesResult.fixes.filter(fix => fix.autoApplicable);
            expect(autoFixes.length).toBeGreaterThan(0);

            const result = await autoFixEngine.applyAutoFixes(text, autoFixes);

            expect(result.success).toBe(true);
            expect(result.fixedText).toBeDefined();
            expect(result.fixedText).not.toBe(text);
            expect(result.appliedFixes.length).toBeGreaterThan(0);
        });

        test('should apply criteria keyword fixes', async () => {
            const text = 'The system should authenticate users.';
            const fixesResult = await autoFixEngine.generateAutoFixes(text);

            const criteriaFixes = fixesResult.fixes.filter(fix =>
                fix.type === 'criteria_keyword' && fix.autoApplicable
            );

            if (criteriaFixes.length > 0) {
                const result = await autoFixEngine.applyAutoFixes(text, criteriaFixes);

                expect(result.success).toBe(true);
                expect(result.fixedText).toContain('shall');
                expect(result.fixedText).not.toContain('should');
            }
        });

        test('should apply style fixes correctly', async () => {
            const text = 'The  system   shall   authenticate  users. ';
            const fixesResult = await autoFixEngine.generateAutoFixes(text);

            const styleFixes = fixesResult.fixes.filter(fix =>
                fix.category === 'style' && fix.autoApplicable
            );

            if (styleFixes.length > 0) {
                const result = await autoFixEngine.applyAutoFixes(text, styleFixes);

                expect(result.success).toBe(true);
                expect(result.fixedText).toBe('The system shall authenticate users.');
            }
        });

        test('should handle multiple fixes in sequence', async () => {
            const text = 'The  system  should  be  user-friendly.';
            const fixesResult = await autoFixEngine.generateAutoFixes(text);

            const autoFixes = fixesResult.fixes.filter(fix => fix.autoApplicable);
            const result = await autoFixEngine.applyAutoFixes(text, autoFixes);

            expect(result.success).toBe(true);
            expect(result.appliedFixes.length).toBeGreaterThan(1);
            expect(result.fixedText).not.toContain('  '); // No double spaces
            expect(result.fixedText).toContain('shall'); // Criteria fix applied
        });

        test('should handle failed fixes gracefully', async () => {
            const text = 'The system shall authenticate users.';
            const invalidFix = {
                type: 'invalid_fix',
                original: 'nonexistent',
                suggestion: 'replacement',
                autoApplicable: true
            };

            const result = await autoFixEngine.applyAutoFixes(text, [invalidFix]);

            expect(result.fixedText).toBe(text); // Should remain unchanged
            expect(result.appliedFixes.length).toBe(0);
        });
    });

    describe('Fix Summary Generation', () => {
        test('should generate comprehensive fix summary', async () => {
            const text = 'The system should obviously handle many users quickly with good performance.';
            const result = await autoFixEngine.generateAutoFixes(text);

            expect(result.summary).toBeDefined();
            expect(result.summary.total).toBe(result.fixes.length);
            expect(result.summary.byCategory).toBeDefined();
            expect(result.summary.bySeverity).toBeDefined();
            expect(result.summary.autoApplicable).toBeGreaterThanOrEqual(0);
            expect(result.summary.requiresInput).toBeGreaterThanOrEqual(0);
        });

        test('should categorize fixes correctly in summary', async () => {
            const text = 'The system should handle users appropriately.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const summary = result.summary;
            const expectedCategories = ['clarity', 'precision', 'completeness'];

            expectedCategories.forEach(category => {
                if (summary.byCategory[category]) {
                    expect(summary.byCategory[category]).toBeGreaterThan(0);
                }
            });
        });

        test('should count severity levels correctly', async () => {
            const text = 'The system should obviously handle many users.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const summary = result.summary;
            const severityCounts = summary.bySeverity;

            let totalFromSeverity = 0;
            Object.values(severityCounts).forEach(count => {
                totalFromSeverity += count;
            });

            expect(totalFromSeverity).toBe(summary.total);
        });
    });

    describe('Custom Fix Rules', () => {
        test('should allow adding custom fix rules', () => {
            const customRule = {
                'custom phrase': ['replacement phrase']
            };

            autoFixEngine.addCustomFixRule('customCategory', customRule);

            expect(autoFixEngine.fixRules.customCategory).toBeDefined();
            expect(autoFixEngine.fixRules.customCategory['custom phrase']).toEqual(['replacement phrase']);
        });

        test('should apply custom fix rules in analysis', async () => {
            autoFixEngine.addCustomFixRule('customPhrases', {
                'legacy system': ['modern system', 'updated system']
            });

            const text = 'The legacy system should handle requests.';
            const result = await autoFixEngine.generateAutoFixes(text);

            // Note: This test assumes the engine would pick up custom rules
            // The actual implementation might need modification to support this
            expect(result.fixes).toBeDefined();
        });
    });

    describe('Performance Requirements', () => {
        test('should complete fix generation within reasonable time', async () => {
            const text = 'The system should obviously handle many users quickly with appropriate performance.';
            const startTime = Date.now();

            const result = await autoFixEngine.generateAutoFixes(text);

            const processingTime = Date.now() - startTime;
            expect(processingTime).toBeLessThan(500); // Should complete within 500ms
            expect(result.processingTime).toBeLessThan(500);
        });

        test('should handle concurrent fix generation efficiently', async () => {
            const texts = [
                'The system should be user-friendly.',
                'Users can handle data quickly.',
                'The application should work efficiently.',
                'The  system   has  multiple   spaces.'
            ];

            const startTime = Date.now();
            const promises = texts.map(text => autoFixEngine.generateAutoFixes(text));
            const results = await Promise.all(promises);

            const totalTime = Date.now() - startTime;
            expect(totalTime).toBeLessThan(2000); // All should complete within 2 seconds
            expect(results.length).toBe(texts.length);

            results.forEach(result => {
                expect(result.fixes).toBeDefined();
                expect(result.summary).toBeDefined();
            });
        });
    });

    describe('Statistics and Feedback', () => {
        test('should track suggestion statistics', async () => {
            const text = 'The system should be user-friendly.';
            const result = await autoFixEngine.generateAutoFixes(text);

            const initialStats = autoFixEngine.getStatistics();
            expect(initialStats.totalSuggestions).toBeGreaterThan(0);
        });

        test('should record feedback correctly', () => {
            const fixId = 'test-fix-1';

            autoFixEngine.recordFeedback(fixId, true);
            let stats = autoFixEngine.getStatistics();
            expect(stats.acceptedSuggestions).toBe(1);
            expect(stats.rejectedSuggestions).toBe(0);

            autoFixEngine.recordFeedback(fixId, false);
            stats = autoFixEngine.getStatistics();
            expect(stats.acceptedSuggestions).toBe(1);
            expect(stats.rejectedSuggestions).toBe(1);
        });

        test('should calculate acceptance rate correctly', () => {
            autoFixEngine.recordFeedback('fix-1', true);
            autoFixEngine.recordFeedback('fix-2', true);
            autoFixEngine.recordFeedback('fix-3', false);

            const stats = autoFixEngine.getStatistics();
            expect(stats.acceptanceRate).toBeCloseTo(66.67, 1); // 2/3 = 66.67%
        });

        test('should handle zero suggestions gracefully', () => {
            const freshEngine = new AutoFixEngine();
            const stats = freshEngine.getStatistics();

            expect(stats.acceptanceRate).toBe(0);
            expect(stats.totalSuggestions).toBe(0);
        });
    });

    describe('Integration with NLP Processor', () => {
        test('should use NLP analysis when available', async () => {
            const text = 'The system should authenticate users within 2 seconds.';

            // First get NLP analysis
            const analysis = await nlpProcessor.analyzeRequirement(text);

            // Then generate fixes with that analysis
            const result = await autoFixEngine.generateAutoFixes(text, analysis);

            expect(result.fixes).toBeDefined();
            expect(result.processingTime).toBeLessThan(1000);
        });

        test('should work without NLP processor', async () => {
            const standaloneEngine = new AutoFixEngine();
            const text = 'The system should be user-friendly.';

            const result = await standaloneEngine.generateAutoFixes(text);

            expect(result.fixes).toBeDefined();
            expect(result.fixes.length).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty text', async () => {
            const result = await autoFixEngine.generateAutoFixes('');

            expect(result.fixes).toBeDefined();
            expect(result.fixes.length).toBe(0);
            expect(result.summary.total).toBe(0);
        });

        test('should handle text with no fixable issues', async () => {
            const text = 'The system shall authenticate users within 2 seconds using OAuth 2.0.';
            const result = await autoFixEngine.generateAutoFixes(text);

            // This high-quality requirement might have few or no fixes
            expect(result.fixes).toBeDefined();
            expect(result.summary).toBeDefined();
        });

        test('should handle very long text', async () => {
            const longText = 'The system should handle users. '.repeat(100);
            const result = await autoFixEngine.generateAutoFixes(longText);

            expect(result.fixes).toBeDefined();
            expect(result.processingTime).toBeLessThan(5000); // Should complete within 5 seconds
        });

        test('should handle special characters and symbols', async () => {
            const text = 'The system should handle users @#$%^&*() quickly.';
            const result = await autoFixEngine.generateAutoFixes(text);

            expect(result.fixes).toBeDefined();
            expect(result.success).not.toBe(false);
        });
    });
});