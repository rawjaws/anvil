/**
 * Template Marketplace Test Suite
 * Comprehensive tests for marketplace functionality
 */

const request = require('supertest');
const TemplateEngine = require('../../marketplace/TemplateEngine');
const CommunityManager = require('../../marketplace/CommunityManager');
const RecommendationEngine = require('../../marketplace/RecommendationEngine');

describe('Template Marketplace System', () => {
    let templateEngine;
    let communityManager;
    let recommendationEngine;

    beforeEach(() => {
        templateEngine = new TemplateEngine();
        communityManager = new CommunityManager();
        recommendationEngine = new RecommendationEngine();
    });

    describe('TemplateEngine', () => {
        describe('generateTemplate', () => {
            it('should generate a capability template with basic options', async () => {
                const options = {
                    type: 'capability',
                    industry: 'automotive',
                    category: 'safety',
                    name: 'Vehicle Safety System',
                    description: 'A comprehensive safety system for modern vehicles',
                    complexity: 'high'
                };

                const result = await templateEngine.generateTemplate(options);

                expect(result).toHaveProperty('templateId');
                expect(result).toHaveProperty('template');
                expect(result).toHaveProperty('metadata');
                expect(result.metadata.type).toBe('capability');
                expect(result.metadata.industry).toBe('automotive');
                expect(result.metadata.relevanceScore).toBeGreaterThan(80);
                expect(result.template).toContain('Vehicle Safety System');
                expect(result.template).toContain('## Metadata');
                expect(result.template).toContain('## Technical Overview');
            });

            it('should generate an enabler template with custom requirements', async () => {
                const options = {
                    type: 'enabler',
                    industry: 'healthcare',
                    category: 'data',
                    name: 'Patient Data Processor',
                    description: 'Processes and validates patient data according to HIPAA requirements',
                    complexity: 'medium',
                    customRequirements: [
                        {
                            name: 'HIPAA Compliance',
                            description: 'Must comply with HIPAA privacy requirements',
                            type: 'non-functional',
                            priority: 'high'
                        }
                    ]
                };

                const result = await templateEngine.generateTemplate(options);

                expect(result.metadata.type).toBe('enabler');
                expect(result.metadata.industry).toBe('healthcare');
                expect(result.template).toContain('Patient Data Processor');
                expect(result.template).toContain('HIPAA Compliance');
                expect(result.template).toContain('## Functional Requirements');
                expect(result.template).toContain('## Non-Functional Requirements');
            });

            it('should handle invalid options gracefully', async () => {
                const options = {
                    type: 'invalid-type',
                    name: '', // Empty name
                    description: 'Short' // Too short description
                };

                await expect(templateEngine.generateTemplate(options))
                    .rejects.toThrow('Template generation failed');
            });

            it('should generate unique template IDs', async () => {
                const options = {
                    type: 'capability',
                    name: 'Test Template',
                    description: 'A test template for ID uniqueness validation'
                };

                const result1 = await templateEngine.generateTemplate(options);
                const result2 = await templateEngine.generateTemplate(options);

                expect(result1.templateId).not.toBe(result2.templateId);
            });
        });

        describe('saveTemplate and loadTemplate', () => {
            it('should save and load templates correctly', async () => {
                const templateId = 'TEST-001';
                const content = '# Test Template\n\nThis is a test template.';
                const metadata = { type: 'capability', industry: 'general' };

                const savePath = await templateEngine.saveTemplate(templateId, content, metadata);
                expect(savePath).toBeTruthy();

                const loaded = await templateEngine.loadTemplate(templateId);
                expect(loaded.content).toBe(content);
                expect(loaded.metadata).toEqual(metadata);
            });

            it('should handle non-existent templates', async () => {
                await expect(templateEngine.loadTemplate('NON-EXISTENT'))
                    .rejects.toThrow('Failed to load template');
            });
        });

        describe('getTemplateRecommendations', () => {
            it('should return recommendations based on user context', () => {
                const userContext = {
                    industry: 'automotive',
                    preferredComplexity: 'medium'
                };

                const recommendations = templateEngine.getTemplateRecommendations(userContext);

                expect(Array.isArray(recommendations)).toBe(true);
                expect(recommendations.length).toBeGreaterThan(0);
                recommendations.forEach(rec => {
                    expect(rec).toHaveProperty('type');
                    expect(rec).toHaveProperty('industry');
                    expect(rec).toHaveProperty('relevanceScore');
                });
            });
        });
    });

    describe('CommunityManager', () => {
        describe('submitTemplate', () => {
            it('should submit a valid template successfully', async () => {
                const templateData = {
                    name: 'Test Community Template',
                    description: 'A test template for community submission validation',
                    content: '# Test Template\n\n## Overview\nThis is a test template with proper structure.',
                    type: 'capability',
                    category: 'general',
                    industry: 'general',
                    tags: ['test', 'community']
                };

                const result = await communityManager.submitTemplate(templateData, 'test-user');

                expect(result).toHaveProperty('templateId');
                expect(result.status).toBe('submitted');
                expect(result).toHaveProperty('qualityScore');
                expect(result.qualityScore).toBeGreaterThan(0);
            });

            it('should reject templates with insufficient content', async () => {
                const templateData = {
                    name: 'Bad Template',
                    description: 'Too short',
                    content: 'Not enough content',
                    type: 'capability'
                };

                await expect(communityManager.submitTemplate(templateData, 'test-user'))
                    .rejects.toThrow('Template validation failed');
            });
        });

        describe('searchTemplates', () => {
            beforeEach(async () => {
                // Add some test templates
                const template1 = {
                    name: 'E-commerce User Management',
                    description: 'User management system for e-commerce platforms',
                    content: '# User Management Template\n\n## Overview\nComprehensive user management...',
                    type: 'capability',
                    category: 'user',
                    industry: 'e-commerce',
                    tags: ['user', 'management', 'e-commerce']
                };

                const template2 = {
                    name: 'API Security Gateway',
                    description: 'Security gateway for API endpoints',
                    content: '# API Security Template\n\n## Overview\nSecure API gateway implementation...',
                    type: 'enabler',
                    category: 'security',
                    industry: 'general',
                    tags: ['api', 'security', 'gateway']
                };

                await communityManager.submitTemplate(template1, 'user1');
                await communityManager.submitTemplate(template2, 'user2');

                // Approve templates for search
                const templates = Array.from(communityManager.templates.values());
                templates.forEach(template => {
                    template.status = 'approved';
                });
            });

            it('should search templates by query', async () => {
                const results = await communityManager.searchTemplates('user management');

                expect(results.templates.length).toBeGreaterThan(0);
                expect(results.totalCount).toBeGreaterThan(0);
                expect(results.templates[0].name).toContain('User Management');
            });

            it('should filter templates by category', async () => {
                const results = await communityManager.searchTemplates('', {
                    category: 'security'
                });

                expect(results.templates.length).toBeGreaterThan(0);
                results.templates.forEach(template => {
                    expect(template.category).toBe('security');
                });
            });

            it('should handle pagination correctly', async () => {
                const page1 = await communityManager.searchTemplates('', {
                    page: 1,
                    pageSize: 1
                });

                expect(page1.page).toBe(1);
                expect(page1.templates.length).toBeLessThanOrEqual(1);
                expect(page1.totalPages).toBeGreaterThanOrEqual(1);
            });

            it('should sort templates by different criteria', async () => {
                const byRating = await communityManager.searchTemplates('', {
                    sortBy: 'rating'
                });

                const byDownloads = await communityManager.searchTemplates('', {
                    sortBy: 'downloads'
                });

                expect(byRating.templates).toBeDefined();
                expect(byDownloads.templates).toBeDefined();
            });
        });

        describe('rateTemplate', () => {
            let templateId;

            beforeEach(async () => {
                const templateData = {
                    name: 'Rateable Template',
                    description: 'A template that can be rated for testing',
                    content: '# Rateable Template\n\n## Overview\nThis template can be rated...',
                    type: 'capability',
                    category: 'general'
                };

                const result = await communityManager.submitTemplate(templateData, 'test-user');
                templateId = result.templateId;

                // Approve template
                const template = communityManager.templates.get(templateId);
                template.status = 'approved';
            });

            it('should accept valid ratings', async () => {
                const result = await communityManager.rateTemplate(templateId, 'user1', 5, 'Excellent template!');

                expect(result).toHaveProperty('ratingId');
                expect(result.message).toBe('Rating submitted successfully');

                const template = communityManager.templates.get(templateId);
                expect(template.rating).toBeGreaterThan(0);
                expect(template.reviewCount).toBe(1);
            });

            it('should reject invalid ratings', async () => {
                await expect(communityManager.rateTemplate(templateId, 'user1', 6))
                    .rejects.toThrow('Rating must be between 1 and 5');

                await expect(communityManager.rateTemplate(templateId, 'user1', 0))
                    .rejects.toThrow('Rating must be between 1 and 5');
            });

            it('should update template average rating correctly', async () => {
                await communityManager.rateTemplate(templateId, 'user1', 5);
                await communityManager.rateTemplate(templateId, 'user2', 3);

                const template = communityManager.templates.get(templateId);
                expect(template.rating).toBe(4.0); // (5 + 3) / 2
                expect(template.reviewCount).toBe(2);
            });
        });

        describe('downloadTemplate', () => {
            let templateId;

            beforeEach(async () => {
                const templateData = {
                    name: 'Downloadable Template',
                    description: 'A template that can be downloaded for testing',
                    content: '# Downloadable Template\n\n## Overview\nThis template can be downloaded...',
                    type: 'capability'
                };

                const result = await communityManager.submitTemplate(templateData, 'test-user');
                templateId = result.templateId;

                // Approve template
                const template = communityManager.templates.get(templateId);
                template.status = 'approved';
            });

            it('should download approved templates', async () => {
                const result = await communityManager.downloadTemplate(templateId, 'user1');

                expect(result).toHaveProperty('content');
                expect(result).toHaveProperty('metadata');
                expect(result.content).toContain('Downloadable Template');

                const template = communityManager.templates.get(templateId);
                expect(template.downloads).toBe(1);
            });

            it('should reject download of non-approved templates', async () => {
                // Reset template status
                const template = communityManager.templates.get(templateId);
                template.status = 'pending_review';

                await expect(communityManager.downloadTemplate(templateId, 'user1'))
                    .rejects.toThrow('Template is not available for download');
            });
        });

        describe('getMarketplaceStats', () => {
            beforeEach(async () => {
                // Add and approve some test templates
                const templates = [
                    {
                        name: 'Stats Template 1',
                        description: 'First template for stats testing',
                        content: '# Template 1',
                        type: 'capability',
                        category: 'general'
                    },
                    {
                        name: 'Stats Template 2',
                        description: 'Second template for stats testing',
                        content: '# Template 2',
                        type: 'enabler',
                        category: 'api'
                    }
                ];

                for (const templateData of templates) {
                    const result = await communityManager.submitTemplate(templateData, 'test-user');
                    const template = communityManager.templates.get(result.templateId);
                    template.status = 'approved';
                }
            });

            it('should return comprehensive marketplace statistics', () => {
                const stats = communityManager.getMarketplaceStats();

                expect(stats).toHaveProperty('totalTemplates');
                expect(stats).toHaveProperty('totalDownloads');
                expect(stats).toHaveProperty('totalRatings');
                expect(stats).toHaveProperty('averageRating');
                expect(stats).toHaveProperty('categoryStats');
                expect(stats).toHaveProperty('topRatedTemplates');
                expect(stats).toHaveProperty('mostDownloadedTemplates');

                expect(stats.totalTemplates).toBeGreaterThanOrEqual(2);
                expect(typeof stats.categoryStats).toBe('object');
            });
        });
    });

    describe('RecommendationEngine', () => {
        describe('generateRecommendations', () => {
            it('should generate personalized recommendations', async () => {
                const userId = 'test-user-123';
                const context = {
                    currentProject: {
                        industry: 'healthcare',
                        category: 'security'
                    }
                };

                const recommendations = await recommendationEngine.generateRecommendations(userId, context, 5);

                expect(Array.isArray(recommendations)).toBe(true);
                expect(recommendations.length).toBeLessThanOrEqual(5);

                recommendations.forEach(rec => {
                    expect(rec).toHaveProperty('template');
                    expect(rec).toHaveProperty('score');
                    expect(rec).toHaveProperty('confidence');
                    expect(rec).toHaveProperty('explanation');
                    expect(rec.score).toBeGreaterThanOrEqual(0);
                    expect(rec.score).toBeLessThanOrEqual(100);
                });
            });

            it('should adapt recommendations based on user profile', async () => {
                const userId = 'experienced-user';

                // Simulate user interactions to build profile
                await recommendationEngine.learnFromInteraction(userId, 'template-1', 'download', {
                    template: { industry: 'automotive', category: 'safety', type: 'capability' }
                });
                await recommendationEngine.learnFromInteraction(userId, 'template-2', 'rating', {
                    rating: 5,
                    template: { industry: 'automotive', category: 'safety', type: 'capability' }
                });

                const recommendations = await recommendationEngine.generateRecommendations(userId, {}, 3);

                expect(recommendations.length).toBeGreaterThan(0);

                // Should have some automotive/safety related recommendations
                const relevantRecs = recommendations.filter(rec =>
                    rec.template.industry === 'automotive' || rec.template.category === 'safety'
                );
                expect(relevantRecs.length).toBeGreaterThan(0);
            });
        });

        describe('learnFromInteraction', () => {
            it('should update user profile from downloads', async () => {
                const userId = 'learning-user';
                const template = {
                    industry: 'fintech',
                    category: 'security',
                    type: 'capability',
                    tags: ['finance', 'security']
                };

                await recommendationEngine.learnFromInteraction(userId, 'template-1', 'download', { template });

                const userProfile = await recommendationEngine.getUserProfile(userId);
                expect(userProfile.interactions.totalDownloads).toBe(1);
                expect(userProfile.behavior.downloads.length).toBe(1);
                expect(userProfile.preferences.industries.get('fintech')).toBeGreaterThan(0);
            });

            it('should update preferences based on ratings', async () => {
                const userId = 'rating-user';
                const template = {
                    industry: 'healthcare',
                    category: 'data',
                    type: 'enabler'
                };

                await recommendationEngine.learnFromInteraction(userId, 'template-1', 'rating', {
                    rating: 5,
                    template
                });

                const userProfile = await recommendationEngine.getUserProfile(userId);
                expect(userProfile.interactions.totalRatings).toBe(1);
                expect(userProfile.interactions.averageRating).toBe(5);
                expect(userProfile.preferences.industries.get('healthcare')).toBeGreaterThan(0);
            });

            it('should handle negative ratings appropriately', async () => {
                const userId = 'negative-rating-user';
                const template = {
                    industry: 'automotive',
                    category: 'control',
                    type: 'capability'
                };

                await recommendationEngine.learnFromInteraction(userId, 'template-1', 'rating', {
                    rating: 1,
                    template
                });

                const userProfile = await recommendationEngine.getUserProfile(userId);
                // Negative rating should decrease preferences
                const industryPreference = userProfile.preferences.industries.get('automotive') || 0;
                expect(industryPreference).toBeLessThan(0.5); // Should be negative or very low
            });
        });

        describe('getRecommendationMetrics', () => {
            it('should return user recommendation metrics', async () => {
                const userId = 'metrics-user';

                // Build some user activity
                await recommendationEngine.learnFromInteraction(userId, 'template-1', 'download', {
                    template: { industry: 'general', category: 'api', type: 'enabler' }
                });
                await recommendationEngine.learnFromInteraction(userId, 'template-2', 'rating', {
                    rating: 4,
                    template: { industry: 'general', category: 'api', type: 'enabler' }
                });

                const metrics = recommendationEngine.getRecommendationMetrics(userId);

                expect(metrics).toHaveProperty('totalInteractions');
                expect(metrics).toHaveProperty('averageRating');
                expect(metrics).toHaveProperty('preferenceStrength');
                expect(metrics).toHaveProperty('profileCompleteness');
                expect(metrics).toHaveProperty('lastActive');

                expect(metrics.totalInteractions).toBe(2);
                expect(metrics.averageRating).toBe(4);
                expect(metrics.profileCompleteness).toBeGreaterThan(0);
            });

            it('should return null for non-existent users', () => {
                const metrics = recommendationEngine.getRecommendationMetrics('non-existent-user');
                expect(metrics).toBeNull();
            });
        });
    });

    describe('Integration Tests', () => {
        it('should integrate template generation with community submission', async () => {
            // Generate a template
            const options = {
                type: 'capability',
                industry: 'iot',
                category: 'integration',
                name: 'IoT Device Manager',
                description: 'Manages IoT devices and their communications'
            };

            const generated = await templateEngine.generateTemplate(options);

            // Submit to community
            const submissionData = {
                name: generated.metadata.name || options.name,
                description: options.description,
                content: generated.template,
                type: generated.metadata.type,
                category: generated.metadata.category,
                industry: generated.metadata.industry
            };

            const submission = await communityManager.submitTemplate(submissionData, 'integration-user');

            expect(submission.templateId).toBeTruthy();
            expect(submission.status).toBe('submitted');
            expect(submission.qualityScore).toBeGreaterThan(70); // AI-generated should have high quality
        });

        it('should generate recommendations after community interactions', async () => {
            const userId = 'integration-user';

            // Submit and approve a template
            const templateData = {
                name: 'Integration Test Template',
                description: 'A template for integration testing between components',
                content: '# Integration Template\n\n## Overview\nThis template is for testing...',
                type: 'capability',
                category: 'integration',
                industry: 'general'
            };

            const submission = await communityManager.submitTemplate(templateData, 'author-user');
            const template = communityManager.templates.get(submission.templateId);
            template.status = 'approved';

            // User interacts with template
            await communityManager.downloadTemplate(submission.templateId, userId);
            await communityManager.rateTemplate(submission.templateId, userId, 5);

            // Learn from interactions
            await recommendationEngine.learnFromInteraction(userId, submission.templateId, 'download', { template });
            await recommendationEngine.learnFromInteraction(userId, submission.templateId, 'rating', {
                rating: 5,
                template
            });

            // Generate recommendations
            const recommendations = await recommendationEngine.generateRecommendations(userId, {}, 3);

            expect(recommendations.length).toBeGreaterThan(0);

            // Should show preference for integration category
            const integrationRecs = recommendations.filter(rec =>
                rec.template.category === 'integration'
            );

            // At least one recommendation should be related to user's interests
            expect(recommendations.some(rec =>
                rec.template.category === 'integration' ||
                rec.explanation.some(exp => exp.includes('integration'))
            )).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle malformed template data gracefully', async () => {
            const malformedData = {
                // Missing required fields
                name: null,
                content: undefined
            };

            await expect(communityManager.submitTemplate(malformedData, 'test-user'))
                .rejects.toThrow();
        });

        it('should handle recommendation engine failures gracefully', async () => {
            // Test with invalid user context
            const invalidContext = {
                currentProject: null,
                invalidField: 'test'
            };

            const recommendations = await recommendationEngine.generateRecommendations(
                'test-user',
                invalidContext,
                5
            );

            // Should still return recommendations, even with invalid context
            expect(Array.isArray(recommendations)).toBe(true);
        });

        it('should validate template content structure', async () => {
            const templateData = {
                name: 'Poorly Structured Template',
                description: 'This template lacks proper markdown structure and required sections',
                content: 'Just some plain text without proper markdown structure',
                type: 'capability'
            };

            await expect(communityManager.submitTemplate(templateData, 'test-user'))
                .rejects.toThrow('Template validation failed');
        });
    });

    describe('Performance Tests', () => {
        it('should generate recommendations efficiently', async () => {
            const startTime = Date.now();

            const recommendations = await recommendationEngine.generateRecommendations(
                'performance-user',
                {},
                10
            );

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
            expect(recommendations.length).toBeLessThanOrEqual(10);
        });

        it('should handle multiple concurrent template generations', async () => {
            const options = {
                type: 'capability',
                name: 'Performance Test Template',
                description: 'Testing concurrent template generation performance'
            };

            const promises = Array(5).fill().map(() =>
                templateEngine.generateTemplate(options)
            );

            const results = await Promise.all(promises);

            expect(results.length).toBe(5);
            results.forEach(result => {
                expect(result).toHaveProperty('templateId');
                expect(result).toHaveProperty('template');
            });

            // All template IDs should be unique
            const templateIds = results.map(r => r.templateId);
            const uniqueIds = new Set(templateIds);
            expect(uniqueIds.size).toBe(templateIds.length);
        });
    });
});