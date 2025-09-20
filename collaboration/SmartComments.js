/**
 * Smart Comments System
 * Provides context-aware commenting with intelligent analysis, categorization, and workflow integration
 */

const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

class SmartComments {
  constructor(collaborationManager) {
    this.collaboration = collaborationManager;
    this.commentThreads = new Map(); // threadId -> CommentThread
    this.commentAnalytics = new Map(); // documentId -> CommentAnalytics
    this.smartFilters = new Map(); // userId -> FilterPreferences
    this.commentTemplates = new Map(); // templateId -> CommentTemplate
    this.autoTagging = new Map(); // tag -> TaggingRule
    this.mentionIndex = new Map(); // userId -> Set<commentId>

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    // Initialize smart features
    this.initializeSmartFeatures();
  }

  /**
   * Initialize smart commenting features
   */
  initializeSmartFeatures() {
    // Initialize comment templates
    this.initializeCommentTemplates();

    // Initialize auto-tagging rules
    this.initializeAutoTagging();

    // Initialize smart filters
    this.initializeSmartFilters();

    this.logger.info('Smart Comments system initialized');
  }

  /**
   * Initialize predefined comment templates
   */
  initializeCommentTemplates() {
    const templates = [
      {
        id: 'code_review',
        name: 'Code Review',
        category: 'review',
        template: 'Consider: ${suggestion}\n\nReason: ${reason}\n\nPriority: ${priority}',
        fields: ['suggestion', 'reason', 'priority'],
        tags: ['code-review', 'improvement']
      },
      {
        id: 'bug_report',
        name: 'Bug Report',
        category: 'issue',
        template: 'Bug Description: ${description}\n\nSteps to Reproduce:\n1. ${step1}\n2. ${step2}\n3. ${step3}\n\nExpected: ${expected}\nActual: ${actual}',
        fields: ['description', 'step1', 'step2', 'step3', 'expected', 'actual'],
        tags: ['bug', 'issue']
      },
      {
        id: 'feature_request',
        name: 'Feature Request',
        category: 'suggestion',
        template: 'Feature: ${feature}\n\nJustification: ${justification}\n\nAcceptance Criteria:\n- ${criteria1}\n- ${criteria2}\n\nPriority: ${priority}',
        fields: ['feature', 'justification', 'criteria1', 'criteria2', 'priority'],
        tags: ['feature', 'enhancement']
      },
      {
        id: 'clarification',
        name: 'Clarification Request',
        category: 'question',
        template: 'Question: ${question}\n\nContext: ${context}\n\nBlocked: ${blocked}',
        fields: ['question', 'context', 'blocked'],
        tags: ['question', 'clarification']
      }
    ];

    templates.forEach(template => {
      this.commentTemplates.set(template.id, template);
    });
  }

  /**
   * Initialize auto-tagging rules
   */
  initializeAutoTagging() {
    const taggingRules = [
      {
        tag: 'urgent',
        patterns: [/urgent/i, /asap/i, /critical/i, /blocker/i, /immediately/i],
        weight: 2.0
      },
      {
        tag: 'bug',
        patterns: [/bug/i, /error/i, /broken/i, /failing/i, /crash/i],
        weight: 1.5
      },
      {
        tag: 'performance',
        patterns: [/slow/i, /performance/i, /optimization/i, /speed/i, /latency/i],
        weight: 1.2
      },
      {
        tag: 'security',
        patterns: [/security/i, /vulnerability/i, /auth/i, /permission/i, /access/i],
        weight: 1.8
      },
      {
        tag: 'ui-ux',
        patterns: [/ui/i, /ux/i, /interface/i, /design/i, /user experience/i],
        weight: 1.0
      },
      {
        tag: 'documentation',
        patterns: [/docs/i, /documentation/i, /readme/i, /comment/i, /explain/i],
        weight: 0.8
      },
      {
        tag: 'testing',
        patterns: [/test/i, /testing/i, /coverage/i, /unit test/i, /integration/i],
        weight: 1.1
      }
    ];

    taggingRules.forEach(rule => {
      this.autoTagging.set(rule.tag, rule);
    });
  }

  /**
   * Initialize smart filter presets
   */
  initializeSmartFilters() {
    const filterPresets = [
      {
        id: 'my_comments',
        name: 'My Comments',
        filter: (comment, userId) => comment.userId === userId
      },
      {
        id: 'mentions_me',
        name: 'Mentions Me',
        filter: (comment, userId) => comment.mentions.includes(userId)
      },
      {
        id: 'urgent_items',
        name: 'Urgent Items',
        filter: (comment) => comment.tags.includes('urgent') || comment.priority >= 4
      },
      {
        id: 'unresolved_issues',
        name: 'Unresolved Issues',
        filter: (comment) => !comment.resolved && (comment.type === 'issue' || comment.tags.includes('bug'))
      },
      {
        id: 'recent_activity',
        name: 'Recent Activity',
        filter: (comment) => (Date.now() - comment.timestamp) < 24 * 60 * 60 * 1000 // 24 hours
      },
      {
        id: 'needs_attention',
        name: 'Needs Attention',
        filter: (comment) => comment.actionItems && comment.actionItems.length > 0 && !comment.resolved
      }
    ];

    this.filterPresets = new Map(filterPresets.map(preset => [preset.id, preset]));
  }

  /**
   * Create a smart comment with intelligent analysis
   */
  createSmartComment(sessionId, commentData) {
    // Enhance comment data with smart analysis
    const enhancedCommentData = this.enhanceCommentData(commentData);

    // Create the comment through collaboration manager
    const comment = this.collaboration.addComment(sessionId, enhancedCommentData);

    // Perform post-creation analysis
    this.performPostCreationAnalysis(comment);

    // Update comment threads
    this.updateCommentThreads(comment);

    // Update analytics
    this.updateCommentAnalytics(comment);

    // Check for auto-workflows
    this.checkAutoWorkflows(comment);

    return comment;
  }

  /**
   * Enhance comment data with intelligent analysis
   */
  enhanceCommentData(commentData) {
    const enhanced = { ...commentData };

    // Auto-detect comment type if not specified
    if (!enhanced.type) {
      enhanced.type = this.detectCommentType(enhanced.content);
    }

    // Auto-generate tags
    enhanced.tags = enhanced.tags || [];
    const autoTags = this.generateAutoTags(enhanced.content);
    enhanced.tags.push(...autoTags);

    // Remove duplicates
    enhanced.tags = [...new Set(enhanced.tags)];

    // Extract mentions
    enhanced.mentions = enhanced.mentions || [];
    const autoMentions = this.extractMentions(enhanced.content);
    enhanced.mentions.push(...autoMentions);
    enhanced.mentions = [...new Set(enhanced.mentions)];

    // Detect intent and context
    enhanced.intent = this.detectIntent(enhanced.content);
    enhanced.complexity = this.assessComplexity(enhanced.content);

    // Add smart metadata
    enhanced.metadata = enhanced.metadata || {};
    enhanced.metadata.wordCount = enhanced.content.split(/\s+/).length;
    enhanced.metadata.hasQuestions = /\?/.test(enhanced.content);
    enhanced.metadata.hasCodeBlocks = /```/.test(enhanced.content);
    enhanced.metadata.hasLinks = /https?:\/\//.test(enhanced.content);

    return enhanced;
  }

  /**
   * Detect comment type based on content analysis
   */
  detectCommentType(content) {
    const typePatterns = [
      { type: 'issue', patterns: [/bug/i, /error/i, /problem/i, /broken/i, /failing/i], weight: 2 },
      { type: 'suggestion', patterns: [/suggest/i, /recommend/i, /improve/i, /better/i, /consider/i], weight: 1.5 },
      { type: 'question', patterns: [/\?/, /how/i, /why/i, /what/i, /when/i, /where/i], weight: 1.2 },
      { type: 'general', patterns: [/note/i, /fyi/i, /info/i, /update/i], weight: 0.8 }
    ];

    let bestMatch = { type: 'general', score: 0 };

    for (const pattern of typePatterns) {
      let score = 0;
      for (const regex of pattern.patterns) {
        const matches = content.match(regex);
        if (matches) {
          score += matches.length * pattern.weight;
        }
      }

      if (score > bestMatch.score) {
        bestMatch = { type: pattern.type, score };
      }
    }

    return bestMatch.type;
  }

  /**
   * Generate auto-tags based on content analysis
   */
  generateAutoTags(content) {
    const tags = [];

    for (const [tag, rule] of this.autoTagging.entries()) {
      let matches = 0;
      for (const pattern of rule.patterns) {
        const patternMatches = content.match(pattern);
        if (patternMatches) {
          matches += patternMatches.length;
        }
      }

      if (matches > 0) {
        const confidence = Math.min(1.0, matches * rule.weight * 0.1);
        if (confidence > 0.3) { // Threshold for auto-tagging
          tags.push(tag);
        }
      }
    }

    return tags;
  }

  /**
   * Extract user mentions from content
   */
  extractMentions(content) {
    const mentionPattern = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  /**
   * Detect intent behind the comment
   */
  detectIntent(content) {
    const intentPatterns = [
      { intent: 'request_action', patterns: [/please/i, /could you/i, /can you/i, /need to/i], confidence: 0.8 },
      { intent: 'provide_feedback', patterns: [/think/i, /feel/i, /opinion/i, /feedback/i], confidence: 0.7 },
      { intent: 'ask_question', patterns: [/\?/, /wonder/i, /curious/i, /clarify/i], confidence: 0.9 },
      { intent: 'report_issue', patterns: [/issue/i, /problem/i, /bug/i, /error/i], confidence: 0.8 },
      { intent: 'suggest_improvement', patterns: [/suggest/i, /improve/i, /better/i, /enhancement/i], confidence: 0.7 },
      { intent: 'share_information', patterns: [/fyi/i, /note/i, /info/i, /update/i], confidence: 0.6 }
    ];

    let bestIntent = { intent: 'general', confidence: 0 };

    for (const pattern of intentPatterns) {
      let matches = 0;
      for (const regex of pattern.patterns) {
        if (regex.test(content)) {
          matches++;
        }
      }

      if (matches > 0) {
        const confidence = pattern.confidence * (matches / pattern.patterns.length);
        if (confidence > bestIntent.confidence) {
          bestIntent = { intent: pattern.intent, confidence };
        }
      }
    }

    return bestIntent;
  }

  /**
   * Assess comment complexity
   */
  assessComplexity(content) {
    let complexity = 1;

    // Length-based complexity
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 100) complexity += 1;
    if (wordCount > 200) complexity += 1;

    // Technical content indicators
    if (/```/.test(content)) complexity += 1; // Code blocks
    if (/https?:\/\//.test(content)) complexity += 0.5; // Links
    if (/\d+\.\s/.test(content)) complexity += 0.5; // Numbered lists
    if (/@\w+/.test(content)) complexity += 0.5; // Mentions

    // Multiple questions or requests
    const questionCount = (content.match(/\?/g) || []).length;
    if (questionCount > 1) complexity += questionCount * 0.3;

    return Math.min(5, complexity);
  }

  /**
   * Perform post-creation analysis
   */
  performPostCreationAnalysis(comment) {
    // Update mention index
    if (comment.mentions && comment.mentions.length > 0) {
      for (const userId of comment.mentions) {
        if (!this.mentionIndex.has(userId)) {
          this.mentionIndex.set(userId, new Set());
        }
        this.mentionIndex.get(userId).add(comment.id);
      }
    }

    // Check for follow-up patterns
    this.checkFollowUpPatterns(comment);

    // Analyze context relevance
    this.analyzeContextRelevance(comment);
  }

  /**
   * Check for follow-up patterns
   */
  checkFollowUpPatterns(comment) {
    const followUpPatterns = [
      /follow.?up/i,
      /check back/i,
      /remind me/i,
      /schedule/i,
      /in \d+ (day|week|hour)s?/i
    ];

    const hasFollowUp = followUpPatterns.some(pattern => pattern.test(comment.content));

    if (hasFollowUp) {
      comment.metadata.requiresFollowUp = true;
      comment.metadata.followUpDetected = Date.now();
    }
  }

  /**
   * Analyze context relevance
   */
  analyzeContextRelevance(comment) {
    if (!comment.context) return;

    const contextKeywords = this.extractKeywords(comment.context.selected || comment.context.before + comment.context.after);
    const commentKeywords = this.extractKeywords(comment.content);

    const relevanceScore = this.calculateKeywordOverlap(contextKeywords, commentKeywords);
    comment.metadata.contextRelevance = relevanceScore;
  }

  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);

    return text.toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Calculate keyword overlap score
   */
  calculateKeywordOverlap(keywords1, keywords2) {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Update comment threads
   */
  updateCommentThreads(comment) {
    let threadId;

    if (comment.parentId) {
      // Find existing thread
      threadId = this.findThreadByCommentId(comment.parentId);
    } else {
      // Create new thread
      threadId = uuidv4();
    }

    if (!this.commentThreads.has(threadId)) {
      this.commentThreads.set(threadId, {
        id: threadId,
        documentId: comment.documentId,
        rootCommentId: comment.parentId || comment.id,
        comments: [],
        participants: new Set(),
        status: 'open',
        priority: comment.priority,
        tags: new Set(comment.tags),
        createdAt: Date.now(),
        lastActivity: Date.now()
      });
    }

    const thread = this.commentThreads.get(threadId);
    thread.comments.push(comment.id);
    thread.participants.add(comment.userId);
    thread.lastActivity = Date.now();

    // Update thread priority and tags
    thread.priority = Math.max(thread.priority, comment.priority);
    comment.tags.forEach(tag => thread.tags.add(tag));

    comment.threadId = threadId;
  }

  /**
   * Find thread by comment ID
   */
  findThreadByCommentId(commentId) {
    for (const [threadId, thread] of this.commentThreads.entries()) {
      if (thread.comments.includes(commentId)) {
        return threadId;
      }
    }
    return null;
  }

  /**
   * Update comment analytics
   */
  updateCommentAnalytics(comment) {
    if (!this.commentAnalytics.has(comment.documentId)) {
      this.commentAnalytics.set(comment.documentId, {
        totalComments: 0,
        typeDistribution: new Map(),
        tagDistribution: new Map(),
        sentimentDistribution: new Map(),
        participantActivity: new Map(),
        timeSeriesData: [],
        averageResponseTime: 0,
        resolutionRate: 0
      });
    }

    const analytics = this.commentAnalytics.get(comment.documentId);

    // Update counts
    analytics.totalComments++;

    // Update type distribution
    analytics.typeDistribution.set(comment.type, (analytics.typeDistribution.get(comment.type) || 0) + 1);

    // Update tag distribution
    comment.tags.forEach(tag => {
      analytics.tagDistribution.set(tag, (analytics.tagDistribution.get(tag) || 0) + 1);
    });

    // Update sentiment distribution
    if (comment.sentiment) {
      analytics.sentimentDistribution.set(comment.sentiment.sentiment,
        (analytics.sentimentDistribution.get(comment.sentiment.sentiment) || 0) + 1);
    }

    // Update participant activity
    analytics.participantActivity.set(comment.userId,
      (analytics.participantActivity.get(comment.userId) || 0) + 1);

    // Add to time series
    analytics.timeSeriesData.push({
      timestamp: comment.timestamp,
      type: comment.type,
      sentiment: comment.sentiment?.sentiment || 'neutral'
    });

    // Keep only last 100 data points
    if (analytics.timeSeriesData.length > 100) {
      analytics.timeSeriesData = analytics.timeSeriesData.slice(-100);
    }
  }

  /**
   * Check for auto-workflows
   */
  checkAutoWorkflows(comment) {
    // Auto-escalate urgent issues
    if (comment.tags.includes('urgent') || comment.priority >= 4) {
      this.triggerAutoWorkflow('escalate_urgent', comment);
    }

    // Auto-assign based on mentions
    if (comment.mentions.length > 0) {
      this.triggerAutoWorkflow('auto_assign_mentions', comment);
    }

    // Auto-create tasks for action items
    if (comment.actionItems && comment.actionItems.length > 0) {
      this.triggerAutoWorkflow('create_tasks', comment);
    }

    // Auto-notify stakeholders for security issues
    if (comment.tags.includes('security')) {
      this.triggerAutoWorkflow('security_notification', comment);
    }
  }

  /**
   * Trigger auto-workflow
   */
  triggerAutoWorkflow(workflowType, comment) {
    const workflowData = {
      type: workflowType,
      triggeredBy: comment.id,
      documentId: comment.documentId,
      timestamp: Date.now(),
      metadata: {
        commentType: comment.type,
        priority: comment.priority,
        tags: comment.tags,
        mentions: comment.mentions
      }
    };

    // Emit workflow event
    this.collaboration.emit('auto_workflow_triggered', workflowData);

    this.logger.info(`Auto-workflow triggered: ${workflowType} for comment ${comment.id}`);
  }

  /**
   * Get smart filtered comments
   */
  getFilteredComments(documentId, filters = {}, userId = null) {
    const allComments = this.collaboration.getDocumentComments(documentId);
    let filtered = [...allComments];

    // Apply preset filters
    if (filters.preset && this.filterPresets.has(filters.preset)) {
      const preset = this.filterPresets.get(filters.preset);
      filtered = filtered.filter(comment => preset.filter(comment, userId));
    }

    // Apply custom filters
    if (filters.type) {
      filtered = filtered.filter(comment => comment.type === filters.type);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(comment =>
        filters.tags.some(tag => comment.tags.includes(tag))
      );
    }

    if (filters.priority) {
      filtered = filtered.filter(comment => comment.priority >= filters.priority);
    }

    if (filters.resolved !== undefined) {
      filtered = filtered.filter(comment => comment.resolved === filters.resolved);
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(comment =>
        comment.timestamp >= start && comment.timestamp <= end
      );
    }

    if (filters.participants && filters.participants.length > 0) {
      filtered = filtered.filter(comment =>
        filters.participants.includes(comment.userId)
      );
    }

    // Apply intelligent sorting
    if (filters.smartSort) {
      filtered = this.applySmartSorting(filtered, filters.smartSort, userId);
    }

    return filtered;
  }

  /**
   * Apply smart sorting to comments
   */
  applySmartSorting(comments, sortType, userId) {
    switch (sortType) {
      case 'relevance':
        return this.sortByRelevance(comments, userId);
      case 'priority':
        return comments.sort((a, b) => b.priority - a.priority);
      case 'engagement':
        return this.sortByEngagement(comments);
      case 'recency':
        return comments.sort((a, b) => b.timestamp - a.timestamp);
      default:
        return comments;
    }
  }

  /**
   * Sort comments by relevance to user
   */
  sortByRelevance(comments, userId) {
    return comments.sort((a, b) => {
      let scoreA = 0, scoreB = 0;

      // User's own comments get higher relevance
      if (a.userId === userId) scoreA += 10;
      if (b.userId === userId) scoreB += 10;

      // Comments mentioning user get higher relevance
      if (a.mentions.includes(userId)) scoreA += 8;
      if (b.mentions.includes(userId)) scoreB += 8;

      // Priority-based scoring
      scoreA += a.priority * 2;
      scoreB += b.priority * 2;

      // Recency bonus
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if ((now - a.timestamp) < dayMs) scoreA += 5;
      if ((now - b.timestamp) < dayMs) scoreB += 5;

      // Unresolved items get bonus
      if (!a.resolved) scoreA += 3;
      if (!b.resolved) scoreB += 3;

      return scoreB - scoreA;
    });
  }

  /**
   * Sort comments by engagement level
   */
  sortByEngagement(comments) {
    return comments.sort((a, b) => {
      let engagementA = 0, engagementB = 0;

      // Count reactions
      engagementA += a.reactions ? a.reactions.size : 0;
      engagementB += b.reactions ? b.reactions.size : 0;

      // Count action items
      engagementA += a.actionItems ? a.actionItems.length * 2 : 0;
      engagementB += b.actionItems ? b.actionItems.length * 2 : 0;

      // Word count as engagement indicator
      engagementA += Math.min(5, (a.metadata?.wordCount || 0) / 20);
      engagementB += Math.min(5, (b.metadata?.wordCount || 0) / 20);

      // Number of mentions
      engagementA += a.mentions.length;
      engagementB += b.mentions.length;

      return engagementB - engagementA;
    });
  }

  /**
   * Get comment analytics for dashboard
   */
  getCommentAnalytics(documentId) {
    const analytics = this.commentAnalytics.get(documentId);
    if (!analytics) {
      return this.getEmptyAnalytics();
    }

    return {
      summary: {
        totalComments: analytics.totalComments,
        typeDistribution: Object.fromEntries(analytics.typeDistribution),
        tagDistribution: Object.fromEntries(analytics.tagDistribution),
        sentimentDistribution: Object.fromEntries(analytics.sentimentDistribution),
        participantActivity: Object.fromEntries(analytics.participantActivity),
        averageResponseTime: analytics.averageResponseTime,
        resolutionRate: analytics.resolutionRate
      },
      trends: this.calculateCommentTrends(analytics.timeSeriesData),
      insights: this.generateCommentInsights(analytics)
    };
  }

  /**
   * Get empty analytics structure
   */
  getEmptyAnalytics() {
    return {
      summary: {
        totalComments: 0,
        typeDistribution: {},
        tagDistribution: {},
        sentimentDistribution: {},
        participantActivity: {},
        averageResponseTime: 0,
        resolutionRate: 0
      },
      trends: [],
      insights: []
    };
  }

  /**
   * Calculate comment trends
   */
  calculateCommentTrends(timeSeriesData) {
    if (timeSeriesData.length < 2) return [];

    const trends = [];
    const now = Date.now();
    const intervals = [
      { name: '24h', duration: 24 * 60 * 60 * 1000 },
      { name: '7d', duration: 7 * 24 * 60 * 60 * 1000 },
      { name: '30d', duration: 30 * 24 * 60 * 60 * 1000 }
    ];

    for (const interval of intervals) {
      const cutoff = now - interval.duration;
      const recentData = timeSeriesData.filter(d => d.timestamp > cutoff);

      trends.push({
        period: interval.name,
        count: recentData.length,
        types: this.getDistribution(recentData, 'type'),
        sentiment: this.getDistribution(recentData, 'sentiment')
      });
    }

    return trends;
  }

  /**
   * Get distribution for a field
   */
  getDistribution(data, field) {
    const distribution = {};
    data.forEach(item => {
      const value = item[field];
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Generate comment insights
   */
  generateCommentInsights(analytics) {
    const insights = [];

    // Most active participant
    let maxActivity = 0;
    let mostActiveUser = null;
    for (const [userId, count] of analytics.participantActivity.entries()) {
      if (count > maxActivity) {
        maxActivity = count;
        mostActiveUser = userId;
      }
    }

    if (mostActiveUser) {
      insights.push({
        type: 'participant',
        title: 'Most Active Commenter',
        description: `${mostActiveUser} has contributed ${maxActivity} comments`,
        value: mostActiveUser,
        metric: maxActivity
      });
    }

    // Most common type
    let maxTypeCount = 0;
    let mostCommonType = null;
    for (const [type, count] of analytics.typeDistribution.entries()) {
      if (count > maxTypeCount) {
        maxTypeCount = count;
        mostCommonType = type;
      }
    }

    if (mostCommonType) {
      insights.push({
        type: 'pattern',
        title: 'Most Common Comment Type',
        description: `${mostCommonType} comments make up ${Math.round((maxTypeCount / analytics.totalComments) * 100)}% of all comments`,
        value: mostCommonType,
        metric: maxTypeCount
      });
    }

    // Sentiment analysis
    const negativeCount = analytics.sentimentDistribution.get('negative') || 0;
    const totalWithSentiment = Array.from(analytics.sentimentDistribution.values()).reduce((a, b) => a + b, 0);

    if (totalWithSentiment > 0) {
      const negativeRatio = negativeCount / totalWithSentiment;
      if (negativeRatio > 0.3) {
        insights.push({
          type: 'sentiment',
          title: 'High Negative Sentiment',
          description: `${Math.round(negativeRatio * 100)}% of comments have negative sentiment`,
          value: 'negative',
          metric: negativeRatio
        });
      }
    }

    return insights;
  }

  /**
   * Create comment from template
   */
  createFromTemplate(templateId, templateData) {
    const template = this.commentTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let content = template.template;

    // Replace template variables
    for (const field of template.fields) {
      const value = templateData[field] || `[${field}]`;
      content = content.replace(new RegExp(`\\$\\{${field}\\}`, 'g'), value);
    }

    return {
      content,
      type: template.category,
      tags: [...template.tags],
      metadata: {
        templateId,
        templateName: template.name,
        generatedFrom: 'template'
      }
    };
  }

  /**
   * Get available templates
   */
  getTemplates(category = null) {
    const templates = Array.from(this.commentTemplates.values());
    if (category) {
      return templates.filter(t => t.category === category);
    }
    return templates;
  }

  /**
   * Get filter presets
   */
  getFilterPresets() {
    return Array.from(this.filterPresets.values());
  }

  /**
   * Get comment threads for document
   */
  getCommentThreads(documentId) {
    const threads = [];

    for (const thread of this.commentThreads.values()) {
      if (thread.documentId === documentId) {
        const threadData = {
          ...thread,
          tags: Array.from(thread.tags),
          participants: Array.from(thread.participants)
        };
        threads.push(threadData);
      }
    }

    return threads.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  /**
   * Shutdown smart comments system
   */
  shutdown() {
    this.commentThreads.clear();
    this.commentAnalytics.clear();
    this.smartFilters.clear();
    this.mentionIndex.clear();

    this.logger.info('Smart Comments system shut down');
  }
}

module.exports = SmartComments;