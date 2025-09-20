/**
 * Test Suite for Precision Engine API Endpoints
 * Comprehensive testing for the precision engine REST API
 */

const request = require('supertest');
const express = require('express');

// Mock the precision engine modules
jest.mock('../../precision-engine/NLPProcessor', () => {
    return jest.fn().mockImplementation(() => ({
        analyzeRequirement: jest.fn().mockResolvedValue({
            text: 'test',
            metrics: { qualityScore: 85, processingTime: 50 },
            quality: {
                clarity: { score: 80 },
                specificity: { score: 90 },
                completeness: { score: 85 },
                terminology: { score: 70 }
            },
            suggestions: []
        }),
        getStatistics: jest.fn().mockReturnValue({
            terminologyDatabaseSize: 10,
            version: '1.0.0'
        }),
        addTerminology: jest.fn()
    }));
});

jest.mock('../../precision-engine/AutoFixEngine', () => {
    return jest.fn().mockImplementation(() => ({
        generateAutoFixes: jest.fn().mockResolvedValue({
            fixes: [
                {
                    type: 'vague_phrase',
                    autoApplicable: true,
                    confidence: 0.8,
                    suggestion: 'specific phrase'
                }
            ],
            summary: {
                total: 1,
                autoApplicable: 1,
                requiresInput: 0,
                byCategory: { clarity: 1 },
                bySeverity: { medium: 1 }
            }
        }),
        applyAutoFixes: jest.fn().mockResolvedValue({
            success: true,
            fixedText: 'fixed text',
            appliedFixes: [],
            failedFixes: []
        }),
        recordFeedback: jest.fn(),
        getStatistics: jest.fn().mockReturnValue({
            totalSuggestions: 0,
            acceptedSuggestions: 0,
            rejectedSuggestions: 0,
            autoFixesApplied: 0,
            acceptanceRate: 0
        })
    }));
});

const precisionEngineRoutes = require('../../api/precision-engine-endpoints');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/precision-engine', precisionEngineRoutes);

describe('Precision Engine API Endpoints', () => {

    describe('POST /api/precision-engine/analyze', () => {
        test('should analyze a valid requirement', async () => {
            const requestBody = {
                text: 'The system shall authenticate users within 2 seconds.'
            };

            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.analysis).toBeDefined();
            expect(response.body.analysis.metrics.qualityScore).toBeGreaterThanOrEqual(0);
            expect(response.body.analysis.metrics.qualityScore).toBeLessThanOrEqual(100);
            expect(response.body.metadata).toBeDefined();
            expect(response.body.metadata.processingTime).toBeGreaterThan(0);
            expect(response.headers['x-processing-time']).toBeDefined();
        });

        test('should include auto-fixes by default', async () => {
            const requestBody = {
                text: 'The system should be user-friendly.'
            };

            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.autoFixes).toBeDefined();
            expect(response.body.autoFixes.fixes).toBeDefined();
            expect(response.body.autoFixes.summary).toBeDefined();
        });

        test('should exclude auto-fixes when requested', async () => {
            const requestBody = {
                text: 'The system shall authenticate users.',
                options: {
                    includeAutoFixes: false
                }
            };

            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.autoFixes).toBeNull();
        });

        test('should validate required text parameter', async () => {
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({})
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid text parameter');
        });

        test('should validate text parameter type', async () => {
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: 123 })
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid text parameter');
        });

        test('should reject empty text', async () => {
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: '   ' })
                .expect(400);

            expect(response.body.error).toBe('Empty text');
        });

        test('should reject text that is too long', async () => {
            const longText = 'a'.repeat(10001);
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: longText })
                .expect(400);

            expect(response.body.error).toBe('Text too long');
        });

        test('should complete analysis within performance requirements', async () => {
            const requestBody = {
                text: 'The system shall authenticate users within 2 seconds using secure protocols.'
            };

            const startTime = Date.now();
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send(requestBody)
                .expect(200);

            const totalTime = Date.now() - startTime;
            expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
            expect(response.body.metadata.processingTime).toBeLessThan(500); // Processing should be under 500ms
        });

        test('should handle custom options', async () => {
            const requestBody = {
                text: 'The system shall authenticate users.',
                options: {
                    includeTerminology: true,
                    includeSemantic: true,
                    customRules: []
                }
            };

            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.analysis).toBeDefined();
        });
    });

    describe('POST /api/precision-engine/apply-fixes', () => {
        test('should apply valid fixes', async () => {
            // First get some fixes
            const analyzeResponse = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: 'The system should be user-friendly.' })
                .expect(200);

            const autoFixes = analyzeResponse.body.autoFixes.fixes.filter(fix => fix.autoApplicable);

            if (autoFixes.length > 0) {
                const applyResponse = await request(app)
                    .post('/api/precision-engine/apply-fixes')
                    .send({
                        text: 'The system should be user-friendly.',
                        fixes: autoFixes
                    })
                    .expect(200);

                expect(applyResponse.body.success).toBe(true);
                expect(applyResponse.body.fixedText).toBeDefined();
                expect(applyResponse.body.appliedFixes).toBeDefined();
                expect(applyResponse.body.metadata).toBeDefined();
            }
        });

        test('should validate required text parameter', async () => {
            const response = await request(app)
                .post('/api/precision-engine/apply-fixes')
                .send({ fixes: [] })
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid text parameter');
        });

        test('should validate required fixes parameter', async () => {
            const response = await request(app)
                .post('/api/precision-engine/apply-fixes')
                .send({ text: 'The system shall authenticate users.' })
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid fixes parameter');
        });

        test('should validate fixes parameter type', async () => {
            const response = await request(app)
                .post('/api/precision-engine/apply-fixes')
                .send({
                    text: 'The system shall authenticate users.',
                    fixes: 'not an array'
                })
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid fixes parameter');
        });

        test('should handle empty fixes array', async () => {
            const response = await request(app)
                .post('/api/precision-engine/apply-fixes')
                .send({
                    text: 'The system shall authenticate users.',
                    fixes: []
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.fixedText).toBe('The system shall authenticate users.');
            expect(response.body.appliedFixes).toEqual([]);
        });
    });

    describe('POST /api/precision-engine/batch-analyze', () => {
        test('should analyze multiple requirements', async () => {
            const requestBody = {
                requirements: [
                    'The system shall authenticate users.',
                    'Users should be able to view their profile.',
                    'The application must process requests quickly.'
                ]
            };

            const response = await request(app)
                .post('/api/precision-engine/batch-analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.results).toBeDefined();
            expect(response.body.results.length).toBe(3);
            expect(response.body.summary).toBeDefined();
            expect(response.body.summary.total).toBe(3);
            expect(response.body.summary.successful).toBeGreaterThanOrEqual(0);
            expect(response.body.summary.failed).toBeGreaterThanOrEqual(0);
        });

        test('should handle requirements with IDs', async () => {
            const requestBody = {
                requirements: [
                    { id: 'REQ-001', text: 'The system shall authenticate users.' },
                    { id: 'REQ-002', text: 'Users should view profiles.' }
                ]
            };

            const response = await request(app)
                .post('/api/precision-engine/batch-analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.results[0].id).toBe('REQ-001');
            expect(response.body.results[1].id).toBe('REQ-002');
        });

        test('should validate requirements parameter', async () => {
            const response = await request(app)
                .post('/api/precision-engine/batch-analyze')
                .send({})
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid requirements parameter');
        });

        test('should reject empty requirements array', async () => {
            const response = await request(app)
                .post('/api/precision-engine/batch-analyze')
                .send({ requirements: [] })
                .expect(400);

            expect(response.body.error).toBe('Empty requirements array');
        });

        test('should reject too many requirements', async () => {
            const manyRequirements = Array(51).fill('The system shall work.');
            const response = await request(app)
                .post('/api/precision-engine/batch-analyze')
                .send({ requirements: manyRequirements })
                .expect(400);

            expect(response.body.error).toBe('Too many requirements');
        });

        test('should handle mixed success/failure results', async () => {
            const requestBody = {
                requirements: [
                    'The system shall authenticate users.',
                    '', // This should fail
                    'Valid requirement text.'
                ]
            };

            const response = await request(app)
                .post('/api/precision-engine/batch-analyze')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.summary.successful).toBeGreaterThan(0);
            expect(response.body.summary.failed).toBeGreaterThan(0);
        });

        test('should complete batch analysis efficiently', async () => {
            const requirements = Array(10).fill().map((_, i) =>
                `The system shall process requirement ${i + 1}.`
            );

            const startTime = Date.now();
            const response = await request(app)
                .post('/api/precision-engine/batch-analyze')
                .send({ requirements })
                .expect(200);

            const totalTime = Date.now() - startTime;
            expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(response.body.summary.processingTime).toBeLessThan(5000);
        });
    });

    describe('GET /api/precision-engine/terminology', () => {
        test('should return terminology information', async () => {
            const response = await request(app)
                .get('/api/precision-engine/terminology')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.terminology).toBeDefined();
            expect(response.body.terminology.databaseSize).toBeGreaterThan(0);
            expect(response.body.terminology.categories).toBeDefined();
            expect(response.body.terminology.version).toBeDefined();
        });
    });

    describe('POST /api/precision-engine/terminology', () => {
        test('should add custom terminology', async () => {
            const requestBody = {
                standardTerm: 'artificial intelligence',
                variants: ['AI', 'machine learning'],
                category: 'technical'
            };

            const response = await request(app)
                .post('/api/precision-engine/terminology')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.terminology.standardTerm).toBe('artificial intelligence');
            expect(response.body.terminology.variants).toEqual(['AI', 'machine learning']);
            expect(response.body.terminology.category).toBe('technical');
        });

        test('should validate required standardTerm parameter', async () => {
            const response = await request(app)
                .post('/api/precision-engine/terminology')
                .send({ variants: ['AI'] })
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid standardTerm parameter');
        });

        test('should validate variants parameter type', async () => {
            const response = await request(app)
                .post('/api/precision-engine/terminology')
                .send({
                    standardTerm: 'artificial intelligence',
                    variants: 'not an array'
                })
                .expect(400);

            expect(response.body.error).toBe('Variants must be an array');
        });

        test('should use default category when not provided', async () => {
            const response = await request(app)
                .post('/api/precision-engine/terminology')
                .send({
                    standardTerm: 'test term',
                    variants: ['test']
                })
                .expect(200);

            expect(response.body.terminology.category).toBe('custom');
        });
    });

    describe('GET /api/precision-engine/statistics', () => {
        test('should return comprehensive statistics', async () => {
            const response = await request(app)
                .get('/api/precision-engine/statistics')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.statistics).toBeDefined();
            expect(response.body.statistics.nlp).toBeDefined();
            expect(response.body.statistics.autoFix).toBeDefined();
            expect(response.body.statistics.system).toBeDefined();
            expect(response.body.statistics.system.uptime).toBeGreaterThan(0);
            expect(response.body.statistics.system.memoryUsage).toBeDefined();
            expect(response.body.statistics.system.nodeVersion).toBeDefined();
        });
    });

    describe('POST /api/precision-engine/feedback', () => {
        test('should record positive feedback', async () => {
            const requestBody = {
                fixId: 'test-fix-001',
                accepted: true,
                comments: 'This fix was very helpful'
            };

            const response = await request(app)
                .post('/api/precision-engine/feedback')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Feedback recorded successfully');
        });

        test('should record negative feedback', async () => {
            const requestBody = {
                fixId: 'test-fix-002',
                accepted: false,
                comments: 'This fix was not appropriate'
            };

            const response = await request(app)
                .post('/api/precision-engine/feedback')
                .send(requestBody)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        test('should validate required fixId parameter', async () => {
            const response = await request(app)
                .post('/api/precision-engine/feedback')
                .send({ accepted: true })
                .expect(400);

            expect(response.body.error).toBe('Missing fixId parameter');
        });

        test('should validate required accepted parameter', async () => {
            const response = await request(app)
                .post('/api/precision-engine/feedback')
                .send({ fixId: 'test-fix' })
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid accepted parameter (must be boolean)');
        });

        test('should validate accepted parameter type', async () => {
            const response = await request(app)
                .post('/api/precision-engine/feedback')
                .send({
                    fixId: 'test-fix',
                    accepted: 'true' // String instead of boolean
                })
                .expect(400);

            expect(response.body.error).toBe('Missing or invalid accepted parameter (must be boolean)');
        });

        test('should handle optional comments', async () => {
            const response = await request(app)
                .post('/api/precision-engine/feedback')
                .send({
                    fixId: 'test-fix-003',
                    accepted: true
                    // No comments field
                })
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/precision-engine/health', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/api/precision-engine/health')
                .expect(200);

            expect(response.body.status).toBe('healthy');
            expect(response.body.components).toBeDefined();
            expect(response.body.components.nlpProcessor).toBe('operational');
            expect(response.body.components.autoFixEngine).toBe('operational');
            expect(response.body.metadata).toBeDefined();
            expect(response.body.metadata.uptime).toBeGreaterThan(0);
            expect(response.body.metadata.version).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle malformed JSON gracefully', async () => {
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send('{"malformed": json}')
                .set('Content-Type', 'application/json')
                .expect(400);

            // Express should handle JSON parsing errors
        });

        test('should handle request timeout scenarios', async () => {
            // This test would require mocking to simulate timeout
            // For now, we'll test that normal requests complete quickly
            const text = 'The system shall authenticate users.';
            const startTime = Date.now();

            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text })
                .expect(200);

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(5000); // Should not timeout
        });

        test('should provide meaningful error messages', async () => {
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: null })
                .expect(400);

            expect(response.body.error).toBeDefined();
            expect(response.body.message).toBeDefined();
            expect(response.body.timestamp).toBeDefined();
        });
    });

    describe('Performance Requirements', () => {
        test('should meet 100ms response time requirement', async () => {
            const text = 'The system shall authenticate users.';
            const startTime = Date.now();

            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text })
                .expect(200);

            const responseTime = Date.now() - startTime;

            // Note: This includes network overhead, so we allow more than 100ms for the full request
            expect(responseTime).toBeLessThan(500);

            // The actual processing time should be under 100ms
            expect(response.body.metadata.processingTime).toBeLessThan(100);
        });

        test('should handle concurrent requests efficiently', async () => {
            const requests = Array(5).fill().map(() =>
                request(app)
                    .post('/api/precision-engine/analyze')
                    .send({ text: 'The system shall process concurrent requests.' })
            );

            const startTime = Date.now();
            const responses = await Promise.all(requests);
            const totalTime = Date.now() - startTime;

            // All requests should complete successfully
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
            });

            // Total time should be reasonable for concurrent processing
            expect(totalTime).toBeLessThan(2000);
        });
    });

    describe('Integration Requirements', () => {
        test('should maintain consistent API response format', async () => {
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: 'The system shall authenticate users.' })
                .expect(200);

            // Verify consistent response structure
            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('analysis');
            expect(response.body).toHaveProperty('metadata');
            expect(response.body.metadata).toHaveProperty('timestamp');
            expect(response.body.metadata).toHaveProperty('version');
        });

        test('should provide proper HTTP status codes', async () => {
            // Success case
            await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: 'Valid requirement text.' })
                .expect(200);

            // Bad request case
            await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: '' })
                .expect(400);

            // Health check
            await request(app)
                .get('/api/precision-engine/health')
                .expect(200);
        });

        test('should include proper response headers', async () => {
            const response = await request(app)
                .post('/api/precision-engine/analyze')
                .send({ text: 'The system shall authenticate users.' })
                .expect(200);

            expect(response.headers['content-type']).toMatch(/application\/json/);
            expect(response.headers['x-processing-time']).toBeDefined();
        });
    });
});