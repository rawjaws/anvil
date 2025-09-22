/**
 * Community Marketplace Platform
 * Manages template sharing, rating, and community features
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class CommunityManager extends EventEmitter {
    constructor() {
        super(); // Call EventEmitter constructor
        this.templates = new Map();
        this.users = new Map();
        this.ratings = new Map();
        this.reviews = new Map();
        this.categories = new Map();
        this.downloads = new Map();
        this.favorites = new Map();
        this.searchIndex = new Map();
        this.initializeDefaultCategories();
    }

    /**
     * Initialize default template categories
     */
    initializeDefaultCategories() {
        const defaultCategories = [
            { id: 'automotive', name: 'Automotive', description: 'Vehicle systems and automotive industry templates' },
            { id: 'healthcare', name: 'Healthcare', description: 'Medical and healthcare system templates' },
            { id: 'fintech', name: 'Financial Technology', description: 'Banking and financial service templates' },
            { id: 'e-commerce', name: 'E-Commerce', description: 'Online retail and marketplace templates' },
            { id: 'iot', name: 'Internet of Things', description: 'IoT and connected device templates' },
            { id: 'saas', name: 'Software as a Service', description: 'SaaS platform and service templates' },
            { id: 'mobile', name: 'Mobile Applications', description: 'Mobile app and service templates' },
            { id: 'web', name: 'Web Applications', description: 'Web platform and service templates' },
            { id: 'api', name: 'API Services', description: 'API and microservice templates' },
            { id: 'data', name: 'Data & Analytics', description: 'Data processing and analytics templates' },
            { id: 'security', name: 'Security & Privacy', description: 'Security and privacy-focused templates' },
            { id: 'compliance', name: 'Compliance & Governance', description: 'Regulatory compliance templates' }
        ];

        defaultCategories.forEach(category => {
            this.categories.set(category.id, {
                ...category,
                templateCount: 0,
                created: new Date(),
                featured: false
            });
        });
    }

    /**
     * Submit a template to the marketplace
     */
    async submitTemplate(templateData, authorId) {
        try {
            const templateId = uuidv4();
            const submission = {
                id: templateId,
                ...templateData,
                author: authorId,
                status: 'pending_review',
                submitted: new Date(),
                lastUpdated: new Date(),
                downloads: 0,
                rating: 0,
                reviewCount: 0,
                featured: false,
                verified: false,
                version: '1.0.0',
                tags: templateData.tags || [],
                category: templateData.category || 'general',
                industry: templateData.industry || 'general',
                complexity: templateData.complexity || 'medium'
            };

            // Validate template content
            const validation = await this.validateTemplate(submission);
            if (!validation.isValid) {
                throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
            }

            // Add quality score
            submission.qualityScore = await this.calculateQualityScore(submission);

            this.templates.set(templateId, submission);
            this.updateSearchIndex(submission);

            // Update category count
            const category = this.categories.get(submission.category);
            if (category) {
                category.templateCount += 1;
            }

            return {
                templateId,
                status: 'submitted',
                message: 'Template submitted for review',
                qualityScore: submission.qualityScore
            };

        } catch (error) {
            throw new Error(`Template submission failed: ${error.message}`);
        }
    }

    /**
     * Validate template content and metadata
     */
    async validateTemplate(template) {
        const errors = [];
        const warnings = [];

        // Required fields validation
        if (!template.name || template.name.trim().length < 3) {
            errors.push('Template name must be at least 3 characters long');
        }

        if (!template.description || template.description.trim().length < 20) {
            errors.push('Template description must be at least 20 characters long');
        }

        if (!template.content || template.content.trim().length < 100) {
            errors.push('Template content must be at least 100 characters long');
        }

        if (!template.type || !['capability', 'enabler'].includes(template.type)) {
            errors.push('Template type must be either "capability" or "enabler"');
        }

        // Content quality validation
        const contentValidation = this.validateTemplateContent(template.content);
        if (!contentValidation.isValid) {
            warnings.push(...contentValidation.warnings);
            if (contentValidation.errors.length > 0) {
                errors.push(...contentValidation.errors);
            }
        }

        // Category validation
        if (!this.categories.has(template.category)) {
            errors.push('Invalid category specified');
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            score: this.calculateValidationScore(errors, warnings)
        };
    }

    /**
     * Validate template content structure
     */
    validateTemplateContent(content) {
        const errors = [];
        const warnings = [];

        // Check for required sections
        const requiredSections = ['# ', '## Metadata', '## Technical Overview'];
        requiredSections.forEach(section => {
            if (!content.includes(section)) {
                errors.push(`Missing required section: ${section}`);
            }
        });

        // Check for table formats
        if (!content.includes('|') || !content.includes('---')) {
            warnings.push('Template should include properly formatted tables');
        }

        // Check for placeholder content
        const placeholders = ['[', 'XXXXX', 'TODO', 'TBD'];
        const placeholderCount = placeholders.reduce((count, placeholder) => {
            const matches = content.match(new RegExp(placeholder, 'gi'));
            return count + (matches ? matches.length : 0);
        }, 0);

        if (placeholderCount > 10) {
            warnings.push('Template contains many placeholders - consider providing more specific content');
        }

        // Check for mermaid diagrams
        if (content.includes('```mermaid')) {
            // Basic mermaid syntax validation
            const mermaidBlocks = content.match(/```mermaid[\s\S]*?```/g);
            if (mermaidBlocks) {
                mermaidBlocks.forEach((block, index) => {
                    if (!block.includes('flowchart') && !block.includes('graph')) {
                        warnings.push(`Mermaid diagram ${index + 1} may have syntax issues`);
                    }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Calculate template quality score
     */
    async calculateQualityScore(template) {
        let score = 0;

        // Content completeness (30 points)
        const contentScore = Math.min(30, template.content.length / 100);
        score += contentScore;

        // Description quality (20 points)
        const descriptionScore = Math.min(20, template.description.length / 10);
        score += descriptionScore;

        // Metadata completeness (20 points)
        let metadataScore = 0;
        if (template.tags && template.tags.length > 0) metadataScore += 5;
        if (template.category && template.category !== 'general') metadataScore += 5;
        if (template.industry && template.industry !== 'general') metadataScore += 5;
        if (template.complexity) metadataScore += 5;
        score += metadataScore;

        // Content structure (20 points)
        const structureScore = this.analyzeContentStructure(template.content);
        score += structureScore;

        // Uniqueness (10 points)
        const uniquenessScore = await this.calculateUniquenessScore(template);
        score += uniquenessScore;

        return Math.min(100, Math.round(score));
    }

    /**
     * Analyze content structure for quality scoring
     */
    analyzeContentStructure(content) {
        let score = 0;

        // Headers structure
        const headerLevels = content.match(/^#{1,6}\s/gm);
        if (headerLevels && headerLevels.length >= 5) score += 5;

        // Tables present
        if (content.includes('|') && content.includes('---')) score += 5;

        // Code blocks or diagrams
        if (content.includes('```')) score += 5;

        // Lists present
        if (content.includes('- ') || content.includes('1. ')) score += 3;

        // Proper markdown links
        if (content.includes('[') && content.includes('](')) score += 2;

        return score;
    }

    /**
     * Calculate uniqueness score compared to existing templates
     */
    async calculateUniquenessScore(template) {
        let uniquenessScore = 10; // Default high uniqueness

        // Compare with existing templates in same category
        const categoryTemplates = Array.from(this.templates.values())
            .filter(t => t.category === template.category && t.status === 'approved');

        for (const existingTemplate of categoryTemplates) {
            const similarity = this.calculateContentSimilarity(template.content, existingTemplate.content);
            if (similarity > 0.8) {
                uniquenessScore -= 5; // Highly similar template exists
            } else if (similarity > 0.6) {
                uniquenessScore -= 3; // Moderately similar template exists
            }
        }

        return Math.max(0, uniquenessScore);
    }

    /**
     * Calculate content similarity between two templates
     */
    calculateContentSimilarity(content1, content2) {
        // Simple similarity based on common words
        const words1 = content1.toLowerCase().match(/\w+/g) || [];
        const words2 = content2.toLowerCase().match(/\w+/g) || [];

        const set1 = new Set(words1);
        const set2 = new Set(words2);

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    }

    /**
     * Rate a template
     */
    async rateTemplate(templateId, userId, rating, review = null) {
        try {
            if (!this.templates.has(templateId)) {
                throw new Error('Template not found');
            }

            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }

            const ratingId = uuidv4();
            const ratingData = {
                id: ratingId,
                templateId,
                userId,
                rating,
                review: review ? review.trim() : null,
                created: new Date(),
                helpful: 0,
                flagged: false
            };

            // Store the rating
            if (!this.ratings.has(templateId)) {
                this.ratings.set(templateId, []);
            }
            this.ratings.get(templateId).push(ratingData);

            // Update template's overall rating
            await this.updateTemplateRating(templateId);

            return {
                ratingId,
                message: 'Rating submitted successfully'
            };

        } catch (error) {
            throw new Error(`Rating submission failed: ${error.message}`);
        }
    }

    /**
     * Update template's overall rating
     */
    async updateTemplateRating(templateId) {
        const template = this.templates.get(templateId);
        const ratings = this.ratings.get(templateId) || [];

        if (ratings.length === 0) {
            template.rating = 0;
            template.reviewCount = 0;
            return;
        }

        const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / ratings.length;

        template.rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
        template.reviewCount = ratings.length;
        template.lastUpdated = new Date();
    }

    /**
     * Search templates with advanced filtering
     */
    async searchTemplates(query, filters = {}) {
        try {
            let results = Array.from(this.templates.values())
                .filter(template => template.status === 'approved');

            // Text search
            if (query && query.trim()) {
                const searchTerms = query.toLowerCase().trim().split(/\s+/);
                results = results.filter(template => {
                    const searchableText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
                    return searchTerms.every(term => searchableText.includes(term));
                });
            }

            // Apply filters
            if (filters.category) {
                results = results.filter(template => template.category === filters.category);
            }

            if (filters.industry) {
                results = results.filter(template => template.industry === filters.industry);
            }

            if (filters.type) {
                results = results.filter(template => template.type === filters.type);
            }

            if (filters.complexity) {
                results = results.filter(template => template.complexity === filters.complexity);
            }

            if (filters.minRating) {
                results = results.filter(template => template.rating >= filters.minRating);
            }

            if (filters.featured) {
                results = results.filter(template => template.featured);
            }

            if (filters.verified) {
                results = results.filter(template => template.verified);
            }

            // Sort results
            const sortBy = filters.sortBy || 'relevance';
            results = this.sortSearchResults(results, sortBy, query);

            // Pagination
            const page = filters.page || 1;
            const pageSize = filters.pageSize || 20;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;

            const paginatedResults = results.slice(startIndex, endIndex);

            return {
                templates: paginatedResults.map(template => this.formatTemplateForSearch(template)),
                totalCount: results.length,
                page,
                pageSize,
                totalPages: Math.ceil(results.length / pageSize),
                hasNextPage: endIndex < results.length,
                hasPreviousPage: page > 1
            };

        } catch (error) {
            throw new Error(`Search failed: ${error.message}`);
        }
    }

    /**
     * Sort search results
     */
    sortSearchResults(results, sortBy, query) {
        switch (sortBy) {
            case 'rating':
                return results.sort((a, b) => b.rating - a.rating);
            case 'downloads':
                return results.sort((a, b) => b.downloads - a.downloads);
            case 'newest':
                return results.sort((a, b) => new Date(b.submitted) - new Date(a.submitted));
            case 'oldest':
                return results.sort((a, b) => new Date(a.submitted) - new Date(b.submitted));
            case 'name':
                return results.sort((a, b) => a.name.localeCompare(b.name));
            case 'relevance':
            default:
                return this.sortByRelevance(results, query);
        }
    }

    /**
     * Sort by relevance to search query
     */
    sortByRelevance(results, query) {
        if (!query) {
            return results.sort((a, b) => b.qualityScore - a.qualityScore);
        }

        const searchTerms = query.toLowerCase().trim().split(/\s+/);

        return results.sort((a, b) => {
            const scoreA = this.calculateRelevanceScore(a, searchTerms);
            const scoreB = this.calculateRelevanceScore(b, searchTerms);
            return scoreB - scoreA;
        });
    }

    /**
     * Calculate relevance score for search
     */
    calculateRelevanceScore(template, searchTerms) {
        let score = 0;

        const name = template.name.toLowerCase();
        const description = template.description.toLowerCase();
        const tags = template.tags.join(' ').toLowerCase();

        searchTerms.forEach(term => {
            // Name matches are weighted highest
            if (name.includes(term)) score += 10;

            // Description matches
            if (description.includes(term)) score += 5;

            // Tag matches
            if (tags.includes(term)) score += 7;
        });

        // Boost score based on template quality
        score += template.qualityScore * 0.1;
        score += template.rating * 2;
        score += Math.log(template.downloads + 1);

        return score;
    }

    /**
     * Format template for search results
     */
    formatTemplateForSearch(template) {
        return {
            id: template.id,
            name: template.name,
            description: template.description,
            type: template.type,
            category: template.category,
            industry: template.industry,
            complexity: template.complexity,
            rating: template.rating,
            reviewCount: template.reviewCount,
            downloads: template.downloads,
            tags: template.tags,
            author: template.author,
            submitted: template.submitted,
            featured: template.featured,
            verified: template.verified,
            qualityScore: template.qualityScore,
            version: template.version
        };
    }

    /**
     * Get template recommendations for a user
     */
    async getRecommendations(userId, limit = 10) {
        try {
            const userPreferences = await this.getUserPreferences(userId);
            const userFavorites = this.favorites.get(userId) || [];
            const userDownloads = await this.getUserDownloads(userId);

            let recommendations = Array.from(this.templates.values())
                .filter(template =>
                    template.status === 'approved' &&
                    !userDownloads.includes(template.id)
                );

            // Score recommendations based on user preferences
            recommendations = recommendations.map(template => ({
                ...template,
                recommendationScore: this.calculateRecommendationScore(
                    template,
                    userPreferences,
                    userFavorites
                )
            }));

            // Sort by recommendation score
            recommendations.sort((a, b) => b.recommendationScore - a.recommendationScore);

            return recommendations.slice(0, limit).map(template => ({
                ...this.formatTemplateForSearch(template),
                recommendationScore: template.recommendationScore,
                reason: this.getRecommendationReason(template, userPreferences)
            }));

        } catch (error) {
            throw new Error(`Failed to get recommendations: ${error.message}`);
        }
    }

    /**
     * Calculate recommendation score
     */
    calculateRecommendationScore(template, userPreferences, userFavorites) {
        let score = template.qualityScore;

        // Preference matching
        if (userPreferences.categories.includes(template.category)) score += 20;
        if (userPreferences.industries.includes(template.industry)) score += 15;
        if (userPreferences.types.includes(template.type)) score += 10;
        if (userPreferences.complexities.includes(template.complexity)) score += 5;

        // Popular templates boost
        score += template.rating * 5;
        score += Math.log(template.downloads + 1) * 2;

        // Trending boost (recently popular)
        const daysSinceSubmission = (new Date() - new Date(template.submitted)) / (1000 * 60 * 60 * 24);
        if (daysSinceSubmission < 30 && template.downloads > 10) {
            score += 10;
        }

        // Featured and verified boost
        if (template.featured) score += 15;
        if (template.verified) score += 10;

        return score;
    }

    /**
     * Get recommendation reason
     */
    getRecommendationReason(template, userPreferences) {
        const reasons = [];

        if (userPreferences.categories.includes(template.category)) {
            reasons.push(`Matches your interest in ${template.category}`);
        }
        if (userPreferences.industries.includes(template.industry)) {
            reasons.push(`Relevant to ${template.industry} industry`);
        }
        if (template.rating >= 4.5) {
            reasons.push('Highly rated by community');
        }
        if (template.featured) {
            reasons.push('Featured template');
        }
        if (template.downloads > 100) {
            reasons.push('Popular in community');
        }

        return reasons.length > 0 ? reasons[0] : 'Based on your activity';
    }

    /**
     * Get user preferences based on activity
     */
    async getUserPreferences(userId) {
        // In a real implementation, this would analyze user's download/favorite history
        // For now, return default preferences
        return {
            categories: ['general', 'web', 'api'],
            industries: ['general', 'saas'],
            types: ['capability', 'enabler'],
            complexities: ['medium', 'high']
        };
    }

    /**
     * Get user's download history
     */
    async getUserDownloads(userId) {
        const userDownloads = Array.from(this.downloads.entries())
            .filter(([templateId, downloads]) =>
                downloads.some(download => download.userId === userId)
            )
            .map(([templateId]) => templateId);

        return userDownloads;
    }

    /**
     * Download a template
     */
    async downloadTemplate(templateId, userId) {
        try {
            const template = this.templates.get(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            if (template.status !== 'approved') {
                throw new Error('Template is not available for download');
            }

            // Record download
            if (!this.downloads.has(templateId)) {
                this.downloads.set(templateId, []);
            }

            this.downloads.get(templateId).push({
                userId,
                timestamp: new Date(),
                version: template.version
            });

            // Update download count
            template.downloads += 1;
            template.lastUpdated = new Date();

            return {
                content: template.content,
                metadata: {
                    name: template.name,
                    type: template.type,
                    version: template.version,
                    downloadedAt: new Date()
                }
            };

        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    /**
     * Add template to favorites
     */
    async addToFavorites(templateId, userId) {
        try {
            if (!this.templates.has(templateId)) {
                throw new Error('Template not found');
            }

            if (!this.favorites.has(userId)) {
                this.favorites.set(userId, []);
            }

            const userFavorites = this.favorites.get(userId);
            if (!userFavorites.includes(templateId)) {
                userFavorites.push(templateId);
            }

            return { message: 'Added to favorites' };

        } catch (error) {
            throw new Error(`Failed to add to favorites: ${error.message}`);
        }
    }

    /**
     * Get marketplace statistics
     */
    getMarketplaceStats() {
        const templates = Array.from(this.templates.values());
        const approvedTemplates = templates.filter(t => t.status === 'approved');

        const totalDownloads = approvedTemplates.reduce((sum, t) => sum + t.downloads, 0);
        const totalRatings = Array.from(this.ratings.values()).flat().length;

        const categoryStats = {};
        this.categories.forEach((category, id) => {
            categoryStats[id] = {
                name: category.name,
                templateCount: approvedTemplates.filter(t => t.category === id).length,
                averageRating: this.getCategoryAverageRating(id, approvedTemplates)
            };
        });

        return {
            totalTemplates: approvedTemplates.length,
            totalDownloads,
            totalRatings,
            averageRating: this.getOverallAverageRating(approvedTemplates),
            categoryStats,
            topRatedTemplates: this.getTopRatedTemplates(5),
            mostDownloadedTemplates: this.getMostDownloadedTemplates(5)
        };
    }

    /**
     * Get category average rating
     */
    getCategoryAverageRating(categoryId, templates) {
        const categoryTemplates = templates.filter(t => t.category === categoryId);
        if (categoryTemplates.length === 0) return 0;

        const totalRating = categoryTemplates.reduce((sum, t) => sum + t.rating, 0);
        return Math.round((totalRating / categoryTemplates.length) * 10) / 10;
    }

    /**
     * Get overall average rating
     */
    getOverallAverageRating(templates) {
        const templatesWithRatings = templates.filter(t => t.reviewCount > 0);
        if (templatesWithRatings.length === 0) return 0;

        const totalRating = templatesWithRatings.reduce((sum, t) => sum + t.rating, 0);
        return Math.round((totalRating / templatesWithRatings.length) * 10) / 10;
    }

    /**
     * Get top rated templates
     */
    getTopRatedTemplates(limit = 5) {
        return Array.from(this.templates.values())
            .filter(t => t.status === 'approved' && t.reviewCount >= 3)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, limit)
            .map(t => this.formatTemplateForSearch(t));
    }

    /**
     * Get most downloaded templates
     */
    getMostDownloadedTemplates(limit = 5) {
        return Array.from(this.templates.values())
            .filter(t => t.status === 'approved')
            .sort((a, b) => b.downloads - a.downloads)
            .slice(0, limit)
            .map(t => this.formatTemplateForSearch(t));
    }

    /**
     * Update search index for a template
     */
    updateSearchIndex(template) {
        const searchableText = `${template.name} ${template.description} ${template.tags.join(' ')}`.toLowerCase();
        const words = searchableText.match(/\w+/g) || [];

        words.forEach(word => {
            if (!this.searchIndex.has(word)) {
                this.searchIndex.set(word, new Set());
            }
            this.searchIndex.get(word).add(template.id);
        });
    }

    /**
     * Calculate validation score
     */
    calculateValidationScore(errors, warnings) {
        let score = 100;
        score -= errors.length * 20;
        score -= warnings.length * 5;
        return Math.max(0, score);
    }

    /**
     * Set recommendation engine for integration
     */
    setRecommendationEngine(recommendationEngine) {
        this.recommendationEngine = recommendationEngine;
    }
}

module.exports = CommunityManager;