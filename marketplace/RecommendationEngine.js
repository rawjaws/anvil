/**
 * AI-Powered Template Recommendation Engine
 * Intelligent template matching and personalized recommendations
 */

const fs = require('fs-extra');
const path = require('path');

class RecommendationEngine {
    constructor() {
        this.userProfiles = new Map();
        this.templateVectors = new Map();
        this.collaborativeFilters = new Map();
        this.contentBasedFilters = new Map();
        this.contextualFactors = new Map();
        this.learningWeights = {
            contentBased: 0.4,
            collaborative: 0.3,
            contextual: 0.2,
            popularity: 0.1
        };
    }

    /**
     * Generate personalized template recommendations
     */
    async generateRecommendations(userId, context = {}, limit = 10) {
        try {
            // Get or create user profile
            const userProfile = await this.getUserProfile(userId);

            // Update user context
            await this.updateUserContext(userId, context);

            // Get candidate templates
            const candidates = await this.getCandidateTemplates(userId, context);

            // Score templates using hybrid approach
            const scoredTemplates = await Promise.all(
                candidates.map(template => this.scoreTemplate(template, userProfile, context))
            );

            // Sort by score and apply diversity
            let recommendations = scoredTemplates
                .sort((a, b) => b.score - a.score)
                .slice(0, limit * 2); // Get more for diversity filtering

            // Apply diversity filtering
            recommendations = this.applyDiversityFiltering(recommendations, limit);

            // Add explanation for each recommendation
            recommendations = recommendations.map(rec => ({
                ...rec,
                explanation: this.generateExplanation(rec, userProfile, context)
            }));

            return recommendations;

        } catch (error) {
            throw new Error(`Recommendation generation failed: ${error.message}`);
        }
    }

    /**
     * Get or create user profile
     */
    async getUserProfile(userId) {
        if (!this.userProfiles.has(userId)) {
            const profile = {
                userId,
                preferences: {
                    industries: new Map(),
                    categories: new Map(),
                    types: new Map(),
                    complexities: new Map(),
                    tags: new Map()
                },
                behavior: {
                    downloads: [],
                    ratings: [],
                    views: [],
                    favorites: [],
                    searches: []
                },
                demographics: {
                    role: 'unknown',
                    experience: 'medium',
                    teamSize: 'unknown'
                },
                interactions: {
                    totalDownloads: 0,
                    totalRatings: 0,
                    averageRating: 0,
                    sessionCount: 0,
                    lastActive: new Date()
                },
                created: new Date(),
                lastUpdated: new Date()
            };

            this.userProfiles.set(userId, profile);
        }

        return this.userProfiles.get(userId);
    }

    /**
     * Update user context with current session information
     */
    async updateUserContext(userId, context) {
        const profile = this.userProfiles.get(userId);
        if (!profile) return;

        // Update context-based preferences
        if (context.currentProject) {
            this.updatePreference(profile.preferences.industries, context.currentProject.industry, 0.1);
            this.updatePreference(profile.preferences.categories, context.currentProject.category, 0.1);
        }

        if (context.searchQuery) {
            profile.behavior.searches.push({
                query: context.searchQuery,
                timestamp: new Date()
            });
        }

        profile.interactions.sessionCount += 1;
        profile.interactions.lastActive = new Date();
        profile.lastUpdated = new Date();
    }

    /**
     * Get candidate templates for recommendation
     */
    async getCandidateTemplates(userId, context) {
        // This would typically fetch from database
        // For now, return mock data
        return [
            {
                id: 'template-1',
                name: 'E-commerce User Authentication',
                type: 'capability',
                industry: 'e-commerce',
                category: 'security',
                complexity: 'medium',
                tags: ['authentication', 'security', 'user-management'],
                rating: 4.5,
                reviewCount: 23,
                downloads: 156,
                created: new Date('2024-01-15'),
                author: 'user-123',
                featured: true,
                verified: true
            },
            {
                id: 'template-2',
                name: 'API Gateway Configuration',
                type: 'enabler',
                industry: 'general',
                category: 'api',
                complexity: 'high',
                tags: ['api', 'gateway', 'microservices'],
                rating: 4.8,
                reviewCount: 45,
                downloads: 234,
                created: new Date('2024-02-01'),
                author: 'user-456',
                featured: false,
                verified: true
            },
            {
                id: 'template-3',
                name: 'Healthcare Data Privacy',
                type: 'capability',
                industry: 'healthcare',
                category: 'security',
                complexity: 'high',
                tags: ['privacy', 'healthcare', 'compliance', 'HIPAA'],
                rating: 4.7,
                reviewCount: 31,
                downloads: 89,
                created: new Date('2024-01-28'),
                author: 'user-789',
                featured: true,
                verified: true
            }
        ];
    }

    /**
     * Score a template for a user using hybrid approach
     */
    async scoreTemplate(template, userProfile, context) {
        const scores = {
            contentBased: await this.calculateContentBasedScore(template, userProfile),
            collaborative: await this.calculateCollaborativeScore(template, userProfile),
            contextual: await this.calculateContextualScore(template, context),
            popularity: this.calculatePopularityScore(template),
            recency: this.calculateRecencyScore(template),
            quality: this.calculateQualityScore(template)
        };

        // Weighted combination
        const finalScore =
            scores.contentBased * this.learningWeights.contentBased +
            scores.collaborative * this.learningWeights.collaborative +
            scores.contextual * this.learningWeights.contextual +
            scores.popularity * this.learningWeights.popularity +
            scores.recency * 0.05 +
            scores.quality * 0.15;

        return {
            template,
            score: Math.min(100, finalScore),
            scoreBreakdown: scores,
            confidence: this.calculateConfidence(scores, userProfile)
        };
    }

    /**
     * Calculate content-based similarity score
     */
    async calculateContentBasedScore(template, userProfile) {
        let score = 0;
        let totalWeight = 0;

        // Industry preference
        const industryWeight = this.getPreferenceWeight(userProfile.preferences.industries, template.industry);
        score += industryWeight * 25;
        totalWeight += 25;

        // Category preference
        const categoryWeight = this.getPreferenceWeight(userProfile.preferences.categories, template.category);
        score += categoryWeight * 20;
        totalWeight += 20;

        // Type preference
        const typeWeight = this.getPreferenceWeight(userProfile.preferences.types, template.type);
        score += typeWeight * 15;
        totalWeight += 15;

        // Complexity preference
        const complexityWeight = this.getPreferenceWeight(userProfile.preferences.complexities, template.complexity);
        score += complexityWeight * 10;
        totalWeight += 10;

        // Tag similarity
        const tagScore = this.calculateTagSimilarity(template.tags, userProfile.preferences.tags);
        score += tagScore * 30;
        totalWeight += 30;

        return totalWeight > 0 ? score / totalWeight : 0;
    }

    /**
     * Calculate collaborative filtering score
     */
    async calculateCollaborativeScore(template, userProfile) {
        // Find similar users based on behavior
        const similarUsers = await this.findSimilarUsers(userProfile);

        if (similarUsers.length === 0) {
            return 0; // No similar users found
        }

        let totalScore = 0;
        let totalWeight = 0;

        for (const similarUser of similarUsers) {
            const similarity = similarUser.similarity;
            const userInteraction = this.getUserTemplateInteraction(similarUser.userId, template.id);

            if (userInteraction) {
                totalScore += userInteraction.score * similarity;
                totalWeight += similarity;
            }
        }

        return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    }

    /**
     * Calculate contextual relevance score
     */
    async calculateContextualScore(template, context) {
        let score = 0;

        // Current project context
        if (context.currentProject) {
            if (template.industry === context.currentProject.industry) score += 30;
            if (template.category === context.currentProject.category) score += 25;
            if (template.type === context.currentProject.preferredType) score += 15;
        }

        // Time-based context
        const timeScore = this.calculateTimeRelevance(template, context);
        score += timeScore * 20;

        // Search context
        if (context.searchQuery) {
            const searchRelevance = this.calculateSearchRelevance(template, context.searchQuery);
            score += searchRelevance * 10;
        }

        return Math.min(100, score);
    }

    /**
     * Calculate popularity score based on downloads and ratings
     */
    calculatePopularityScore(template) {
        const downloadScore = Math.min(50, Math.log(template.downloads + 1) * 10);
        const ratingScore = (template.rating / 5) * 30;
        const reviewScore = Math.min(20, Math.log(template.reviewCount + 1) * 5);

        return downloadScore + ratingScore + reviewScore;
    }

    /**
     * Calculate recency score
     */
    calculateRecencyScore(template) {
        const daysSinceCreation = (new Date() - new Date(template.created)) / (1000 * 60 * 60 * 24);

        // Fresh templates get higher scores
        if (daysSinceCreation < 7) return 100;
        if (daysSinceCreation < 30) return 80;
        if (daysSinceCreation < 90) return 60;
        if (daysSinceCreation < 180) return 40;
        return 20;
    }

    /**
     * Calculate quality score based on various factors
     */
    calculateQualityScore(template) {
        let score = 0;

        // Verified templates get bonus
        if (template.verified) score += 20;

        // Featured templates get bonus
        if (template.featured) score += 15;

        // Rating quality
        score += (template.rating / 5) * 40;

        // Review count indicates reliability
        score += Math.min(25, Math.log(template.reviewCount + 1) * 5);

        return score;
    }

    /**
     * Calculate confidence in recommendation
     */
    calculateConfidence(scores, userProfile) {
        let confidence = 0;

        // More interactions = higher confidence
        const interactionCount = userProfile.interactions.totalDownloads +
                                userProfile.interactions.totalRatings;
        confidence += Math.min(40, interactionCount * 2);

        // Consistent scores across methods = higher confidence
        const scoreVariance = this.calculateVariance(Object.values(scores));
        confidence += Math.max(0, 40 - scoreVariance);

        // Account age = higher confidence
        const accountAge = (new Date() - new Date(userProfile.created)) / (1000 * 60 * 60 * 24);
        confidence += Math.min(20, accountAge / 7);

        return Math.min(100, confidence);
    }

    /**
     * Find similar users for collaborative filtering
     */
    async findSimilarUsers(userProfile, limit = 10) {
        const similarUsers = [];

        // This would typically query the database for users with similar behavior
        // For now, return mock similar users
        for (let i = 1; i <= limit; i++) {
            similarUsers.push({
                userId: `similar-user-${i}`,
                similarity: Math.random() * 0.8 + 0.2 // Random similarity between 0.2-1.0
            });
        }

        return similarUsers;
    }

    /**
     * Apply diversity filtering to avoid similar recommendations
     */
    applyDiversityFiltering(recommendations, limit) {
        const selected = [];
        const categories = new Set();
        const industries = new Set();

        for (const rec of recommendations) {
            const template = rec.template;

            // Prioritize diversity in categories and industries
            const categoryKey = `${template.category}-${template.type}`;
            const industryKey = template.industry;

            if (selected.length < limit) {
                // Always add if we haven't reached limit
                selected.push(rec);
                categories.add(categoryKey);
                industries.add(industryKey);
            } else {
                // Replace if this adds diversity and has higher score
                const wouldAddDiversity = !categories.has(categoryKey) || !industries.has(industryKey);
                const lowestScoreIndex = selected.reduce((minIdx, current, idx) =>
                    current.score < selected[minIdx].score ? idx : minIdx, 0);

                if (wouldAddDiversity && rec.score > selected[lowestScoreIndex].score) {
                    selected[lowestScoreIndex] = rec;
                    categories.add(categoryKey);
                    industries.add(industryKey);
                }
            }
        }

        return selected.slice(0, limit);
    }

    /**
     * Generate explanation for recommendation
     */
    generateExplanation(recommendation, userProfile, context) {
        const template = recommendation.template;
        const scores = recommendation.scoreBreakdown;
        const explanations = [];

        // Content-based explanations
        if (scores.contentBased > 60) {
            const topPreferences = this.getTopPreferences(userProfile.preferences);
            if (topPreferences.industries.includes(template.industry)) {
                explanations.push(`Matches your interest in ${template.industry}`);
            }
            if (topPreferences.categories.includes(template.category)) {
                explanations.push(`Relevant to ${template.category} category you often use`);
            }
        }

        // Contextual explanations
        if (scores.contextual > 70) {
            if (context.currentProject && template.industry === context.currentProject.industry) {
                explanations.push(`Perfect for your ${context.currentProject.industry} project`);
            }
        }

        // Quality explanations
        if (template.rating >= 4.5) {
            explanations.push(`Highly rated (${template.rating}/5) by community`);
        }

        if (template.featured) {
            explanations.push('Featured template');
        }

        if (template.verified) {
            explanations.push('Verified by experts');
        }

        // Popularity explanations
        if (template.downloads > 100) {
            explanations.push(`Popular choice (${template.downloads} downloads)`);
        }

        // Default explanation
        if (explanations.length === 0) {
            explanations.push('Based on your activity and preferences');
        }

        return explanations.slice(0, 2); // Return top 2 explanations
    }

    /**
     * Learn from user interactions to improve recommendations
     */
    async learnFromInteraction(userId, templateId, interactionType, data = {}) {
        const userProfile = await this.getUserProfile(userId);

        switch (interactionType) {
            case 'download':
                userProfile.behavior.downloads.push({
                    templateId,
                    timestamp: new Date(),
                    ...data
                });
                userProfile.interactions.totalDownloads += 1;
                this.updateTemplatePreferences(userProfile, data.template, 1.0);
                break;

            case 'rating':
                userProfile.behavior.ratings.push({
                    templateId,
                    rating: data.rating,
                    timestamp: new Date()
                });
                userProfile.interactions.totalRatings += 1;

                // Update average rating
                const totalRating = userProfile.behavior.ratings.reduce((sum, r) => sum + r.rating, 0);
                userProfile.interactions.averageRating = totalRating / userProfile.behavior.ratings.length;

                // Strong signal - adjust preferences based on rating
                const strength = (data.rating - 3) / 2; // Convert 1-5 rating to -1 to 1 scale
                this.updateTemplatePreferences(userProfile, data.template, strength);
                break;

            case 'view':
                userProfile.behavior.views.push({
                    templateId,
                    duration: data.duration || 0,
                    timestamp: new Date()
                });

                // Weak signal - only update if view duration is significant
                if (data.duration > 30) {
                    this.updateTemplatePreferences(userProfile, data.template, 0.1);
                }
                break;

            case 'favorite':
                userProfile.behavior.favorites.push({
                    templateId,
                    timestamp: new Date()
                });
                // Strong positive signal
                this.updateTemplatePreferences(userProfile, data.template, 1.5);
                break;
        }

        userProfile.lastUpdated = new Date();

        // Adapt learning weights based on user behavior
        this.adaptLearningWeights(userProfile);
    }

    /**
     * Update template preferences based on interaction
     */
    updateTemplatePreferences(userProfile, template, strength) {
        if (!template) return;

        this.updatePreference(userProfile.preferences.industries, template.industry, strength * 0.3);
        this.updatePreference(userProfile.preferences.categories, template.category, strength * 0.4);
        this.updatePreference(userProfile.preferences.types, template.type, strength * 0.2);
        this.updatePreference(userProfile.preferences.complexities, template.complexity, strength * 0.1);

        // Update tag preferences
        if (template.tags) {
            template.tags.forEach(tag => {
                this.updatePreference(userProfile.preferences.tags, tag, strength * 0.1);
            });
        }
    }

    /**
     * Update preference weight with decay
     */
    updatePreference(preferenceMap, key, delta) {
        const current = preferenceMap.get(key) || 0;
        const decayFactor = 0.95; // Slight decay over time
        const newValue = Math.max(0, Math.min(10, current * decayFactor + delta));
        preferenceMap.set(key, newValue);
    }

    /**
     * Adapt learning weights based on user behavior patterns
     */
    adaptLearningWeights(userProfile) {
        const interactionCount = userProfile.interactions.totalDownloads +
                                userProfile.interactions.totalRatings;

        if (interactionCount < 5) {
            // New users - rely more on popularity and content
            this.learningWeights.contentBased = 0.5;
            this.learningWeights.collaborative = 0.1;
            this.learningWeights.contextual = 0.2;
            this.learningWeights.popularity = 0.2;
        } else if (interactionCount < 20) {
            // Growing profile - balance all factors
            this.learningWeights.contentBased = 0.4;
            this.learningWeights.collaborative = 0.3;
            this.learningWeights.contextual = 0.2;
            this.learningWeights.popularity = 0.1;
        } else {
            // Experienced users - rely more on personalization
            this.learningWeights.contentBased = 0.3;
            this.learningWeights.collaborative = 0.4;
            this.learningWeights.contextual = 0.2;
            this.learningWeights.popularity = 0.1;
        }
    }

    /**
     * Utility functions
     */
    getPreferenceWeight(preferenceMap, key) {
        const value = preferenceMap.get(key) || 0;
        return Math.min(1, value / 5); // Normalize to 0-1 scale
    }

    calculateTagSimilarity(templateTags, userTagPreferences) {
        if (!templateTags || templateTags.length === 0) return 0;

        let totalSimilarity = 0;
        let maxPossibleSimilarity = 0;

        templateTags.forEach(tag => {
            const userPreference = userTagPreferences.get(tag) || 0;
            totalSimilarity += userPreference;
            maxPossibleSimilarity += 5; // Assuming max preference is 5
        });

        return maxPossibleSimilarity > 0 ? (totalSimilarity / maxPossibleSimilarity) * 100 : 0;
    }

    calculateTimeRelevance(template, context) {
        const now = new Date();
        const templateAge = (now - new Date(template.created)) / (1000 * 60 * 60 * 24);

        // Prefer newer templates but don't penalize too much for age
        if (templateAge < 30) return 1.0;
        if (templateAge < 90) return 0.8;
        if (templateAge < 180) return 0.6;
        return 0.4;
    }

    calculateSearchRelevance(template, searchQuery) {
        if (!searchQuery) return 0;

        const searchTerms = searchQuery.toLowerCase().split(/\s+/);
        const templateText = `${template.name} ${template.description || ''} ${template.tags.join(' ')}`.toLowerCase();

        let relevance = 0;
        searchTerms.forEach(term => {
            if (templateText.includes(term)) {
                relevance += 1;
            }
        });

        return Math.min(100, (relevance / searchTerms.length) * 100);
    }

    getUserTemplateInteraction(userId, templateId) {
        // Mock implementation - would query actual user interactions
        return {
            score: Math.random() * 100, // Random score for demo
            type: 'rating',
            timestamp: new Date()
        };
    }

    getTopPreferences(preferences) {
        return {
            industries: Array.from(preferences.industries.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([key]) => key),
            categories: Array.from(preferences.categories.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([key]) => key)
        };
    }

    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    /**
     * Get recommendation metrics for monitoring
     */
    getRecommendationMetrics(userId) {
        const userProfile = this.userProfiles.get(userId);
        if (!userProfile) return null;

        return {
            totalInteractions: userProfile.interactions.totalDownloads + userProfile.interactions.totalRatings,
            averageRating: userProfile.interactions.averageRating,
            preferenceStrength: this.calculatePreferenceStrength(userProfile.preferences),
            profileCompleteness: this.calculateProfileCompleteness(userProfile),
            lastActive: userProfile.interactions.lastActive
        };
    }

    calculatePreferenceStrength(preferences) {
        let totalStrength = 0;
        let totalPreferences = 0;

        Object.values(preferences).forEach(preferenceMap => {
            Array.from(preferenceMap.values()).forEach(value => {
                totalStrength += value;
                totalPreferences += 1;
            });
        });

        return totalPreferences > 0 ? totalStrength / totalPreferences : 0;
    }

    calculateProfileCompleteness(userProfile) {
        let completeness = 0;

        // Check various profile aspects
        if (userProfile.interactions.totalDownloads > 0) completeness += 25;
        if (userProfile.interactions.totalRatings > 0) completeness += 25;
        if (userProfile.behavior.favorites.length > 0) completeness += 20;
        if (userProfile.behavior.searches.length > 0) completeness += 15;
        if (userProfile.demographics.role !== 'unknown') completeness += 15;

        return completeness;
    }
}

module.exports = RecommendationEngine;