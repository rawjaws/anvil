/**
 * Template Marketplace Module
 * Main entry point for marketplace functionality
 */

const TemplateEngine = require('./TemplateEngine');
const CommunityManager = require('./CommunityManager');
const RecommendationEngine = require('./RecommendationEngine');

class MarketplaceManager {
    constructor() {
        this.templateEngine = new TemplateEngine();
        this.communityManager = new CommunityManager();
        this.recommendationEngine = new RecommendationEngine();
        this.initialized = false;
    }

    /**
     * Initialize the marketplace system
     */
    async initialize() {
        try {
            console.log('[MARKETPLACE] Initializing Template Marketplace...');

            // Initialize components
            await this.initializeComponents();

            // Set up cross-component integrations
            await this.setupIntegrations();

            // Load existing data if available
            await this.loadExistingData();

            this.initialized = true;
            console.log('[MARKETPLACE] Template Marketplace initialized successfully');
            return true;
        } catch (error) {
            console.error('[MARKETPLACE] Failed to initialize marketplace:', error);
            return false;
        }
    }

    /**
     * Initialize individual components
     */
    async initializeComponents() {
        // Template Engine - already initialized in constructor

        // Community Manager - set up default categories if needed
        await this.setupDefaultCategories();

        // Recommendation Engine - initialize user profiles cache
        await this.initializeRecommendationEngine();
    }

    /**
     * Set up default categories for the marketplace
     */
    async setupDefaultCategories() {
        // Categories are initialized in CommunityManager constructor
        console.log('[MARKETPLACE] Default categories configured');
    }

    /**
     * Initialize recommendation engine with any cached data
     */
    async initializeRecommendationEngine() {
        console.log('[MARKETPLACE] Recommendation engine ready');
    }

    /**
     * Set up integrations between components
     */
    async setupIntegrations() {
        // Connect template engine with community manager for AI-generated submissions
        this.templateEngine.setCommunityManager(this.communityManager);

        // Connect community manager with recommendation engine for learning
        this.communityManager.setRecommendationEngine(this.recommendationEngine);

        // Set up event listeners for cross-component communication
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for component communication
     */
    setupEventListeners() {
        // When a template is downloaded, inform recommendation engine
        this.communityManager.on('template_downloaded', (data) => {
            this.recommendationEngine.learnFromInteraction(
                data.userId,
                data.templateId,
                'download',
                { template: data.template }
            );
        });

        // When a template is rated, inform recommendation engine
        this.communityManager.on('template_rated', (data) => {
            this.recommendationEngine.learnFromInteraction(
                data.userId,
                data.templateId,
                'rating',
                { rating: data.rating, template: data.template }
            );
        });

        // When a template is viewed, inform recommendation engine
        this.communityManager.on('template_viewed', (data) => {
            this.recommendationEngine.learnFromInteraction(
                data.userId,
                data.templateId,
                'view',
                { duration: data.duration, template: data.template }
            );
        });

        // When a template is favorited, inform recommendation engine
        this.communityManager.on('template_favorited', (data) => {
            this.recommendationEngine.learnFromInteraction(
                data.userId,
                data.templateId,
                'favorite',
                { template: data.template }
            );
        });
    }

    /**
     * Load existing marketplace data
     */
    async loadExistingData() {
        try {
            // In a production environment, this would load from database
            // For now, we'll populate with some sample data
            await this.loadSampleData();
        } catch (error) {
            console.warn('[MARKETPLACE] Could not load existing data:', error.message);
        }
    }

    /**
     * Load sample data for demonstration
     */
    async loadSampleData() {
        const sampleTemplates = [
            {
                name: 'E-commerce User Authentication',
                description: 'Comprehensive user authentication system for e-commerce platforms with OAuth2 support, session management, and security features.',
                content: `# E-commerce User Authentication

## Metadata
- **Name**: E-commerce User Authentication
- **Type**: Capability
- **ID**: CAP-ECOM-AUTH-001
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: High
- **Analysis Review**: Required
- **Owner**: Security Team
- **Created Date**: 2024-01-15
- **Last Updated**: 2024-01-15
- **Version**: 1.0

## Technical Overview
### Purpose
Provides secure user authentication and authorization for e-commerce platforms.

### Key Features
- OAuth2 integration
- Multi-factor authentication
- Session management
- Password security policies
- Account lockout protection

## Enablers
| Enabler ID | Name | Description | Status | Approval | Priority |
|------------|------|-------------|--------|----------|----------|
| ENB-AUTH-001 | OAuth2 Provider | OAuth2 authentication service | In Draft | Not Approved | High |
| ENB-AUTH-002 | Session Manager | User session management | In Draft | Not Approved | High |
| ENB-AUTH-003 | Security Validator | Password and security validation | In Draft | Not Approved | Medium |

## Technical Specifications
[Implementation details for authentication system]`,
                type: 'capability',
                category: 'security',
                industry: 'e-commerce',
                complexity: 'high',
                tags: ['authentication', 'security', 'oauth2', 'e-commerce'],
                rating: 4.7,
                reviewCount: 23,
                downloads: 156,
                featured: true,
                verified: true
            },
            {
                name: 'Healthcare Data Privacy Enabler',
                description: 'HIPAA-compliant data privacy and encryption enabler for healthcare applications.',
                content: `# Healthcare Data Privacy Enabler

## Metadata
- **Name**: Healthcare Data Privacy Enabler
- **Type**: Enabler
- **ID**: ENB-HEALTH-PRIV-001
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: High
- **Analysis Review**: Required
- **Owner**: Healthcare Team
- **Created Date**: 2024-01-28
- **Last Updated**: 2024-01-28
- **Version**: 1.0

## Technical Overview
### Purpose
Ensures HIPAA compliance and data privacy for healthcare applications.

## Functional Requirements
| ID | Name | Requirement | Priority | Status | Approval |
|----|------|-------------|----------|--------|----------|
| FR-001 | Data Encryption | All PHI must be encrypted at rest and in transit | High | In Draft | Not Approved |
| FR-002 | Access Logging | All data access must be logged and auditable | High | In Draft | Not Approved |
| FR-003 | Data Anonymization | Support for data anonymization and de-identification | Medium | In Draft | Not Approved |

## Non-Functional Requirements
| ID | Name | Type | Requirement | Priority | Status | Approval |
|----|------|------|-------------|----------|--------|----------|
| NFR-001 | HIPAA Compliance | Compliance | Must meet all HIPAA requirements | High | In Draft | Not Approved |
| NFR-002 | Performance | Performance | Encryption/decryption < 100ms | Medium | In Draft | Not Approved |

## Technical Specifications
[HIPAA compliance implementation details]`,
                type: 'enabler',
                category: 'security',
                industry: 'healthcare',
                complexity: 'high',
                tags: ['healthcare', 'privacy', 'HIPAA', 'encryption'],
                rating: 4.9,
                reviewCount: 31,
                downloads: 89,
                featured: true,
                verified: true
            },
            {
                name: 'API Gateway Configuration',
                description: 'Microservices API gateway configuration template with load balancing, rate limiting, and monitoring.',
                content: `# API Gateway Configuration

## Metadata
- **Name**: API Gateway Configuration
- **Type**: Enabler
- **ID**: ENB-API-GW-001
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: Medium
- **Analysis Review**: Required
- **Owner**: Platform Team
- **Created Date**: 2024-02-01
- **Last Updated**: 2024-02-01
- **Version**: 1.0

## Technical Overview
### Purpose
Provides a centralized API gateway for microservices architecture.

## Functional Requirements
| ID | Name | Requirement | Priority | Status | Approval |
|----|------|-------------|----------|--------|----------|
| FR-001 | Load Balancing | Distribute requests across service instances | High | In Draft | Not Approved |
| FR-002 | Rate Limiting | Implement rate limiting per client | High | In Draft | Not Approved |
| FR-003 | Health Monitoring | Monitor service health and availability | Medium | In Draft | Not Approved |

## Technical Specifications
[API Gateway implementation details]`,
                type: 'enabler',
                category: 'api',
                industry: 'general',
                complexity: 'medium',
                tags: ['api', 'gateway', 'microservices', 'load-balancing'],
                rating: 4.5,
                reviewCount: 45,
                downloads: 234,
                featured: false,
                verified: true
            }
        ];

        // Submit sample templates
        for (const templateData of sampleTemplates) {
            try {
                const result = await this.communityManager.submitTemplate(templateData, 'system');

                // Approve the template for demo purposes
                const template = this.communityManager.templates.get(result.templateId);
                template.status = 'approved';
                template.rating = templateData.rating;
                template.reviewCount = templateData.reviewCount;
                template.downloads = templateData.downloads;
                template.featured = templateData.featured;
                template.verified = templateData.verified;

                console.log(`[MARKETPLACE] Loaded sample template: ${templateData.name}`);
            } catch (error) {
                console.warn(`[MARKETPLACE] Failed to load sample template ${templateData.name}:`, error.message);
            }
        }
    }

    /**
     * Get marketplace health status
     */
    getHealthStatus() {
        return {
            status: this.initialized ? 'healthy' : 'initializing',
            components: {
                templateEngine: this.templateEngine ? 'operational' : 'error',
                communityManager: this.communityManager ? 'operational' : 'error',
                recommendationEngine: this.recommendationEngine ? 'operational' : 'error'
            },
            metrics: this.initialized ? this.getMetrics() : null,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get marketplace metrics
     */
    getMetrics() {
        const stats = this.communityManager.getMarketplaceStats();
        return {
            totalTemplates: stats.totalTemplates,
            totalDownloads: stats.totalDownloads,
            totalRatings: stats.totalRatings,
            averageRating: stats.averageRating,
            activeUsers: this.recommendationEngine.userProfiles.size,
            cacheSize: this.templateEngine.templateCache.size
        };
    }

    /**
     * Generate a template using AI
     */
    async generateTemplate(options) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        return await this.templateEngine.generateTemplate(options);
    }

    /**
     * Submit template to community
     */
    async submitTemplate(templateData, authorId) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        return await this.communityManager.submitTemplate(templateData, authorId);
    }

    /**
     * Search templates
     */
    async searchTemplates(query, filters) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        return await this.communityManager.searchTemplates(query, filters);
    }

    /**
     * Get personalized recommendations
     */
    async getRecommendations(userId, context, limit) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        return await this.recommendationEngine.generateRecommendations(userId, context, limit);
    }

    /**
     * Download template
     */
    async downloadTemplate(templateId, userId) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        const result = await this.communityManager.downloadTemplate(templateId, userId);

        // Emit event for recommendation learning
        this.communityManager.emit('template_downloaded', {
            userId,
            templateId,
            template: this.communityManager.templates.get(templateId)
        });

        return result;
    }

    /**
     * Rate template
     */
    async rateTemplate(templateId, userId, rating, review) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        const result = await this.communityManager.rateTemplate(templateId, userId, rating, review);

        // Emit event for recommendation learning
        this.communityManager.emit('template_rated', {
            userId,
            templateId,
            rating,
            template: this.communityManager.templates.get(templateId)
        });

        return result;
    }

    /**
     * Add template to favorites
     */
    async addToFavorites(templateId, userId) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        const result = await this.communityManager.addToFavorites(templateId, userId);

        // Emit event for recommendation learning
        this.communityManager.emit('template_favorited', {
            userId,
            templateId,
            template: this.communityManager.templates.get(templateId)
        });

        return result;
    }

    /**
     * Get marketplace statistics
     */
    getStats() {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        return this.communityManager.getMarketplaceStats();
    }

    /**
     * Get template categories
     */
    getCategories() {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        return Array.from(this.communityManager.categories.entries()).map(([id, category]) => ({
            id,
            name: category.name,
            description: category.description,
            templateCount: category.templateCount,
            featured: category.featured
        }));
    }

    /**
     * Validate template
     */
    async validateTemplate(template) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        return await this.communityManager.validateTemplate(template);
    }

    /**
     * Get template details
     */
    getTemplateDetails(templateId) {
        if (!this.initialized) {
            throw new Error('Marketplace not initialized');
        }

        const template = this.communityManager.templates.get(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        const ratings = this.communityManager.ratings.get(templateId) || [];
        const recentRatings = ratings
            .sort((a, b) => new Date(b.created) - new Date(a.created))
            .slice(0, 10);

        return {
            ...this.communityManager.formatTemplateForSearch(template),
            content: template.content,
            recentRatings: recentRatings.map(rating => ({
                id: rating.id,
                rating: rating.rating,
                review: rating.review,
                created: rating.created,
                helpful: rating.helpful
            })),
            ratingDistribution: this.getRatingDistribution(ratings)
        };
    }

    /**
     * Helper function to get rating distribution
     */
    getRatingDistribution(ratings) {
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        ratings.forEach(rating => {
            distribution[rating.rating] = (distribution[rating.rating] || 0) + 1;
        });
        return distribution;
    }

    /**
     * Cleanup marketplace resources
     */
    async cleanup() {
        console.log('[MARKETPLACE] Cleaning up marketplace resources...');
        this.initialized = false;
    }
}

// Create singleton instance
const marketplaceManager = new MarketplaceManager();

module.exports = {
    MarketplaceManager,
    marketplaceManager,
    TemplateEngine,
    CommunityManager,
    RecommendationEngine
};