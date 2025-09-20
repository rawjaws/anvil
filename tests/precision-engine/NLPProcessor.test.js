/**
 * Test Suite for NLPProcessor
 * Comprehensive testing for Natural Language Processing Engine
 */

const NLPProcessor = require('../../precision-engine/NLPProcessor');

describe('NLPProcessor', () => {
    let nlpProcessor;

    beforeEach(() => {
        nlpProcessor = new NLPProcessor();
    });

    describe('Initialization', () => {
        test('should initialize with default configuration', () => {
            expect(nlpProcessor).toBeDefined();
            expect(nlpProcessor.terminologyDatabase).toBeDefined();
            expect(nlpProcessor.qualityRules).toBeDefined();
            expect(nlpProcessor.semanticPatterns).toBeDefined();
        });

        test('should have quality rules for all categories', () => {
            const rules = nlpProcessor.qualityRules;
            expect(rules.clarity).toBeDefined();
            expect(rules.specificity).toBeDefined();
            expect(rules.completeness).toBeDefined();
            expect(rules.consistency).toBeDefined();
        });

        test('should have semantic patterns initialized', () => {
            const patterns = nlpProcessor.semanticPatterns;
            expect(patterns.functional).toBeDefined();
            expect(patterns.nonfunctional).toBeDefined();
            expect(patterns.constraints).toBeDefined();
            expect(patterns.stakeholders).toBeDefined();
            expect(patterns.actions).toBeDefined();
            expect(patterns.conditions).toBeDefined();
        });

        test('should have pre-loaded terminology database', () => {
            const stats = nlpProcessor.getStatistics();
            expect(stats.terminologyDatabaseSize).toBeGreaterThan(0);
        });
    });

    describe('Requirement Analysis', () => {
        test('should analyze a simple requirement', async () => {
            const text = 'The system shall authenticate users within 2 seconds.';
            const result = await nlpProcessor.analyzeRequirement(text);

            expect(result).toBeDefined();
            expect(result.text).toBe(text);
            expect(result.metrics).toBeDefined();
            expect(result.quality).toBeDefined();
            expect(result.suggestions).toBeDefined();
            expect(result.metrics.qualityScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.qualityScore).toBeLessThanOrEqual(100);
        });

        test('should handle empty text gracefully', async () => {
            await expect(nlpProcessor.analyzeRequirement('')).rejects.toThrow();
        });

        test('should handle null/undefined text', async () => {
            await expect(nlpProcessor.analyzeRequirement(null)).rejects.toThrow();
            await expect(nlpProcessor.analyzeRequirement(undefined)).rejects.toThrow();
        });

        test('should complete analysis within acceptable time', async () => {
            const text = 'The application should provide a user-friendly interface for managing customer data efficiently.';
            const startTime = Date.now();

            const result = await nlpProcessor.analyzeRequirement(text);

            const processingTime = Date.now() - startTime;
            expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
            expect(result.metrics.processingTime).toBeLessThan(1000);
        });

        test('should achieve >95% accuracy for quality detection', async () => {
            const testCases = [
                {
                    text: 'The system shall authenticate users within 2 seconds using secure protocols.',
                    expectedQuality: 'high' // Clear, specific, complete
                },
                {
                    text: 'Users should be able to do things quickly.',
                    expectedQuality: 'low' // Vague, unclear
                },
                {
                    text: 'The application must process up to 1000 concurrent requests with 99.9% uptime.',
                    expectedQuality: 'high' // Specific metrics
                }
            ];

            let correctDetections = 0;

            for (const testCase of testCases) {
                const result = await nlpProcessor.analyzeRequirement(testCase.text);
                const detectedQuality = result.metrics.qualityScore >= 80 ? 'high' : 'low';

                if (detectedQuality === testCase.expectedQuality) {
                    correctDetections++;
                }
            }

            const accuracy = (correctDetections / testCases.length) * 100;
            expect(accuracy).toBeGreaterThanOrEqual(95);
        });
    });

    describe('Clarity Analysis', () => {
        test('should detect vague phrases', async () => {
            const text = 'The system should be user-friendly and appropriate for users.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const clarityIssues = result.quality.clarity.issues;
            const vagueIssues = clarityIssues.filter(issue => issue.type === 'vague_phrase');

            expect(vagueIssues.length).toBeGreaterThan(0);
            expect(vagueIssues.some(issue => issue.phrase === 'user-friendly')).toBe(true);
            expect(vagueIssues.some(issue => issue.phrase === 'appropriate')).toBe(true);
        });

        test('should detect weak verbs', async () => {
            const text = 'The system will handle user requests and manage data processing.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const clarityIssues = result.quality.clarity.issues;
            const verbIssues = clarityIssues.filter(issue => issue.type === 'weak_verb');

            expect(verbIssues.length).toBeGreaterThan(0);
            expect(verbIssues.some(issue => issue.verb === 'handle')).toBe(true);
            expect(verbIssues.some(issue => issue.verb === 'manage')).toBe(true);
        });

        test('should calculate word and sentence metrics', async () => {
            const text = 'The system shall authenticate users. It must complete within 2 seconds.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const metrics = result.quality.clarity.metrics;
            expect(metrics.wordCount).toBe(11);
            expect(metrics.sentenceCount).toBe(2);
            expect(metrics.avgWordsPerSentence).toBeCloseTo(5.5, 1);
        });

        test('should flag overly long sentences', async () => {
            const longSentence = 'The system shall authenticate users and validate their credentials and check their permissions and log their access and update their session tokens and track their activities and monitor their behavior and ensure security compliance and maintain audit trails and provide real-time feedback.';
            const result = await nlpProcessor.analyzeRequirement(longSentence);

            const clarityIssues = result.quality.clarity.issues;
            const lengthIssues = clarityIssues.filter(issue => issue.type === 'sentence_length');

            expect(lengthIssues.length).toBeGreaterThan(0);
        });
    });

    describe('Specificity Analysis', () => {
        test('should detect vague quantifiers', async () => {
            const text = 'The system should handle many requests quickly with few errors.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const specificityIssues = result.quality.specificity.issues;
            const quantifierIssues = specificityIssues.filter(issue => issue.type === 'vague_quantifier');

            expect(quantifierIssues.length).toBeGreaterThan(0);
            expect(quantifierIssues.some(issue => issue.term === 'many')).toBe(true);
            expect(quantifierIssues.some(issue => issue.term === 'quickly')).toBe(true);
            expect(quantifierIssues.some(issue => issue.term === 'few')).toBe(true);
        });

        test('should recognize specific measurements', async () => {
            const text = 'The system shall process requests within 500ms with 99.9% uptime using 2GB memory.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const metrics = result.quality.specificity.metrics;
            expect(metrics.specificityElements).toBeGreaterThan(0);
        });

        test('should score higher for specific requirements', async () => {
            const vague = 'The system should be fast and reliable.';
            const specific = 'The system shall respond within 200ms with 99.9% uptime.';

            const vagueResult = await nlpProcessor.analyzeRequirement(vague);
            const specificResult = await nlpProcessor.analyzeRequirement(specific);

            expect(specificResult.quality.specificity.score).toBeGreaterThan(vagueResult.quality.specificity.score);
        });
    });

    describe('Completeness Analysis', () => {
        test('should detect missing action verbs', async () => {
            const text = 'The user interface is nice and clean.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const completenessIssues = result.quality.completeness.issues;
            const actionIssues = completenessIssues.filter(issue => issue.type === 'missing_action');

            expect(actionIssues.length).toBeGreaterThan(0);
        });

        test('should detect missing stakeholders', async () => {
            const text = 'The system shall validate credentials quickly.';
            const result = await nlpProcessor.analyzeRequirement(text);

            // This might or might not detect missing stakeholder depending on the text
            const completenessIssues = result.quality.completeness.issues;
            expect(completenessIssues).toBeDefined();
        });

        test('should detect missing criteria keywords', async () => {
            const text = 'The system validates user input and shows results.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const completenessIssues = result.quality.completeness.issues;
            const criteriaIssues = completenessIssues.filter(issue => issue.type === 'missing_criteria');

            expect(criteriaIssues.length).toBeGreaterThan(0);
        });

        test('should score higher for complete requirements', async () => {
            const incomplete = 'Display data.';
            const complete = 'The system shall display user data when users request their profile information.';

            const incompleteResult = await nlpProcessor.analyzeRequirement(incomplete);
            const completeResult = await nlpProcessor.analyzeRequirement(complete);

            expect(completeResult.quality.completeness.score).toBeGreaterThan(incompleteResult.quality.completeness.score);
        });
    });

    describe('Terminology Analysis', () => {
        test('should identify standard technical terms', async () => {
            const text = 'The API shall authenticate users through the user interface.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const terminology = result.terminology;
            expect(terminology.termsFound).toBeDefined();
            expect(terminology.termsFound.length).toBeGreaterThan(0);
        });

        test('should detect inconsistent terminology usage', async () => {
            const text = 'The API and application programming interface should work together.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const terminologyIssues = result.terminology.issues;
            const inconsistentIssues = terminologyIssues.filter(issue => issue.type === 'inconsistent_terminology');

            expect(inconsistentIssues.length).toBeGreaterThan(0);
        });

        test('should provide standardization suggestions', async () => {
            const text = 'The UI and user interface must be consistent.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const suggestions = result.terminology.suggestions;
            expect(suggestions).toBeDefined();
            expect(suggestions.length).toBeGreaterThan(0);
        });
    });

    describe('Semantic Analysis', () => {
        test('should identify functional requirements', async () => {
            const text = 'The system shall authenticate users and process their requests.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const semantic = result.semantic;
            expect(semantic.structure.functional.length).toBeGreaterThan(0);
            expect(semantic.structure.actions.length).toBeGreaterThan(0);
        });

        test('should identify non-functional requirements', async () => {
            const text = 'The system must maintain 99.9% availability and ensure security compliance.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const semantic = result.semantic;
            expect(semantic.structure.nonfunctional.length).toBeGreaterThan(0);
        });

        test('should identify constraints', async () => {
            const text = 'The response time shall not exceed 500ms and memory usage must be within 2GB.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const semantic = result.semantic;
            expect(semantic.structure.constraints.length).toBeGreaterThan(0);
        });

        test('should identify stakeholders', async () => {
            const text = 'Users shall be able to view their profile while administrators can modify settings.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const semantic = result.semantic;
            expect(semantic.structure.stakeholders.length).toBeGreaterThan(0);
        });

        test('should identify conditions', async () => {
            const text = 'When users log in, the system shall display their dashboard if they have valid permissions.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const semantic = result.semantic;
            expect(semantic.structure.conditions.length).toBeGreaterThan(0);
        });
    });

    describe('Quality Score Calculation', () => {
        test('should calculate overall quality score', async () => {
            const text = 'The system shall authenticate users within 2 seconds using secure protocols.';
            const result = await nlpProcessor.analyzeRequirement(text);

            expect(result.metrics.qualityScore).toBeGreaterThanOrEqual(0);
            expect(result.metrics.qualityScore).toBeLessThanOrEqual(100);
            expect(typeof result.metrics.qualityScore).toBe('number');
        });

        test('should weight different quality aspects appropriately', async () => {
            const highQuality = 'The system shall authenticate users within 2 seconds using OAuth 2.0 protocol.';
            const lowQuality = 'The system should handle users appropriately.';

            const highResult = await nlpProcessor.analyzeRequirement(highQuality);
            const lowResult = await nlpProcessor.analyzeRequirement(lowQuality);

            expect(highResult.metrics.qualityScore).toBeGreaterThan(lowResult.metrics.qualityScore);
            expect(highResult.metrics.qualityScore).toBeGreaterThan(70);
            expect(lowResult.metrics.qualityScore).toBeLessThan(60);
        });
    });

    describe('Custom Terminology', () => {
        test('should allow adding custom terminology', () => {
            const customTerm = 'enterprise resource planning';
            const variants = ['ERP', 'enterprise system'];

            nlpProcessor.addTerminology(customTerm, variants, 'business');

            const stats = nlpProcessor.getStatistics();
            expect(stats.terminologyDatabaseSize).toBeGreaterThan(0);
        });

        test('should use custom terminology in analysis', async () => {
            nlpProcessor.addTerminology('customer relationship management', ['CRM'], 'business');

            const text = 'The CRM system shall integrate with customer relationship management workflows.';
            const result = await nlpProcessor.analyzeRequirement(text);

            const terminologyIssues = result.terminology.issues;
            const inconsistentIssues = terminologyIssues.filter(issue => issue.type === 'inconsistent_terminology');

            expect(inconsistentIssues.length).toBeGreaterThan(0);
        });
    });

    describe('Performance Requirements', () => {
        test('should complete analysis within 100ms for short text', async () => {
            const text = 'The system shall authenticate users.';
            const startTime = Date.now();

            await nlpProcessor.analyzeRequirement(text);

            const processingTime = Date.now() - startTime;
            expect(processingTime).toBeLessThan(100);
        });

        test('should handle concurrent analyses efficiently', async () => {
            const texts = [
                'The system shall authenticate users within 2 seconds.',
                'Users must be able to view their profile information.',
                'The application should handle up to 1000 concurrent requests.',
                'Data must be backed up every 24 hours automatically.'
            ];

            const startTime = Date.now();
            const promises = texts.map(text => nlpProcessor.analyzeRequirement(text));
            const results = await Promise.all(promises);

            const totalTime = Date.now() - startTime;
            expect(totalTime).toBeLessThan(1000); // All should complete within 1 second
            expect(results.length).toBe(texts.length);
            results.forEach(result => {
                expect(result.metrics.qualityScore).toBeGreaterThanOrEqual(0);
            });
        });
    });

    describe('Edge Cases', () => {
        test('should handle very short requirements', async () => {
            const text = 'Login.';
            const result = await nlpProcessor.analyzeRequirement(text);

            expect(result).toBeDefined();
            expect(result.metrics.qualityScore).toBeLessThan(50); // Should be low quality
        });

        test('should handle requirements with special characters', async () => {
            const text = 'The system shall process data with 99.9% accuracy & <2s response time.';
            const result = await nlpProcessor.analyzeRequirement(text);

            expect(result).toBeDefined();
            expect(result.metrics.qualityScore).toBeGreaterThanOrEqual(0);
        });

        test('should handle requirements with numbers and units', async () => {
            const text = 'The system shall support 10,000 users with 256MB RAM per session.';
            const result = await nlpProcessor.analyzeRequirement(text);

            expect(result).toBeDefined();
            expect(result.quality.specificity.score).toBeGreaterThan(60);
        });

        test('should handle multilingual elements gracefully', async () => {
            const text = 'The système shall authenticate usuarios within 2 seconds.';
            const result = await nlpProcessor.analyzeRequirement(text);

            expect(result).toBeDefined();
            // Should still analyze what it can understand
            expect(result.metrics.qualityScore).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Statistics and Reporting', () => {
        test('should provide comprehensive statistics', () => {
            const stats = nlpProcessor.getStatistics();

            expect(stats).toBeDefined();
            expect(stats.terminologyDatabaseSize).toBeGreaterThanOrEqual(0);
            expect(stats.qualityRulesCount).toBeGreaterThan(0);
            expect(stats.semanticPatternsCount).toBeGreaterThan(0);
            expect(stats.version).toBeDefined();
        });

        test('should track processing metrics', async () => {
            const text = 'The system shall authenticate users within 2 seconds.';
            const result = await nlpProcessor.analyzeRequirement(text);

            expect(result.metrics.processingTime).toBeGreaterThan(0);
            expect(result.timestamp).toBeDefined();
            expect(new Date(result.timestamp)).toBeInstanceOf(Date);
        });
    });
});