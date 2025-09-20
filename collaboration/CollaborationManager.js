/**
 * Enhanced Collaboration Manager
 * Coordinates advanced real-time collaboration features including user presence, document access, permissions,
 * smart conflict resolution, contextual comments, and collaborative annotations
 */

const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const DocumentSynchronizer = require('./DocumentSynchronizer');

class CollaborationManager {
  constructor() {
    this.documentSync = new DocumentSynchronizer();
    this.sessions = new Map(); // sessionId -> SessionInfo
    this.userSessions = new Map(); // userId -> Set<sessionId>
    this.documentSessions = new Map(); // documentId -> Set<sessionId>
    this.userPresence = new Map(); // userId -> PresenceInfo
    this.documentPermissions = new Map(); // documentId -> PermissionMap

    // Advanced collaboration features
    this.comments = new Map(); // documentId -> Array<Comment>
    this.annotations = new Map(); // documentId -> Array<Annotation>
    this.conflictHistory = new Map(); // documentId -> Array<ConflictEvent>
    this.collaborativeMetrics = new Map(); // documentId -> CollaborationMetrics
    this.userProfiles = new Map(); // userId -> UserProfile
    this.smartSuggestions = new Map(); // sessionId -> Array<Suggestion>

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });

    // Initialize cleanup interval
    this.startCleanupInterval();

    // Initialize AI-powered features
    this.initializeAIFeatures();
  }

  /**
   * Initialize AI-powered collaboration features
   */
  initializeAIFeatures() {
    // Initialize conflict resolution AI
    this.conflictResolver = {
      enabled: true,
      confidence_threshold: 0.85,
      auto_resolve_simple: true
    };

    // Initialize smart commenting
    this.smartCommentEngine = {
      enabled: true,
      context_analysis: true,
      sentiment_analysis: true,
      auto_categorization: true
    };

    this.logger.info('Advanced AI collaboration features initialized');
  }

  /**
   * Add contextual comment to document
   */
  addComment(sessionId, commentData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const comment = {
      id: uuidv4(),
      documentId: session.documentId,
      userId: session.userId,
      content: commentData.content,
      position: commentData.position || null,
      selection: commentData.selection || null,
      type: commentData.type || 'general', // general, suggestion, question, issue
      parentId: commentData.parentId || null, // for threaded comments
      mentions: commentData.mentions || [],
      tags: commentData.tags || [],
      context: this.extractContext(session.documentId, commentData.position, commentData.selection),
      sentiment: this.analyzeSentiment(commentData.content),
      priority: this.calculateCommentPriority(commentData),
      timestamp: Date.now(),
      resolved: false,
      reactions: new Map(),
      metadata: commentData.metadata || {}
    };

    // Store comment
    if (!this.comments.has(session.documentId)) {
      this.comments.set(session.documentId, []);
    }
    this.comments.get(session.documentId).push(comment);

    // Extract action items if this is a suggestion or issue
    if (comment.type === 'suggestion' || comment.type === 'issue') {
      comment.actionItems = this.extractActionItems(comment.content);
    }

    // Broadcast comment to all document participants
    this.broadcastToDocument(session.documentId, {
      type: 'comment_added',
      comment,
      userId: session.userId,
      timestamp: Date.now()
    });

    // Update collaboration metrics
    this.updateCollaborationMetrics(session.documentId, 'comment_added');

    this.logger.info(`Comment added: ${comment.id} by ${session.userId} on document ${session.documentId}`);
    return comment;
  }

  /**
   * Extract context around comment position
   */
  extractContext(documentId, position, selection) {
    const document = this.documentSync.getDocument(documentId);
    if (!document || !position) return null;

    const content = document.content;
    const contextRadius = 100; // characters

    const start = Math.max(0, position - contextRadius);
    const end = Math.min(content.length, (selection?.end || position) + contextRadius);

    return {
      before: content.slice(start, position),
      selected: selection ? content.slice(selection.start, selection.end) : '',
      after: content.slice(selection?.end || position, end),
      lineNumber: content.slice(0, position).split('\n').length
    };
  }

  /**
   * Analyze comment sentiment using simple keyword analysis
   */
  analyzeSentiment(content) {
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'love', 'awesome', 'brilliant'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'wrong', 'broken', 'issue', 'problem'];
    const urgentWords = ['urgent', 'critical', 'important', 'asap', 'immediately', 'blocker'];

    const words = content.toLowerCase().split(/\s+/);
    let sentiment = 'neutral';
    let urgency = 'normal';

    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    const urgentCount = words.filter(word => urgentWords.includes(word)).length;

    if (urgentCount > 0) urgency = 'high';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    return { sentiment, urgency, confidence: Math.min(0.9, (positiveCount + negativeCount + urgentCount) * 0.3) };
  }

  /**
   * Calculate comment priority based on various factors
   */
  calculateCommentPriority(commentData) {
    let priority = 1; // base priority

    // Type-based priority
    const typePriority = {
      'issue': 3,
      'suggestion': 2,
      'question': 1.5,
      'general': 1
    };
    priority *= typePriority[commentData.type] || 1;

    // Mentions increase priority
    if (commentData.mentions && commentData.mentions.length > 0) {
      priority *= 1.5;
    }

    // Tags like 'urgent', 'blocker' increase priority
    if (commentData.tags && commentData.tags.some(tag => ['urgent', 'blocker', 'critical'].includes(tag.toLowerCase()))) {
      priority *= 2;
    }

    return Math.min(5, priority); // cap at 5
  }

  /**
   * Extract action items from comment content
   */
  extractActionItems(content) {
    const actionPatterns = [
      /(?:please|could you|can you|need to|should|must)\s+(.+?)(?:\.|$)/gi,
      /(?:todo|fixme|hack):\s*(.+?)(?:\n|$)/gi,
      /\[ \]\s*(.+?)(?:\n|$)/gi // checkbox patterns
    ];

    const actionItems = [];
    for (const pattern of actionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        actionItems.push({
          id: uuidv4(),
          text: match[1].trim(),
          completed: false,
          assignee: null,
          dueDate: null,
          timestamp: Date.now()
        });
      }
    }

    return actionItems;
  }

  /**
   * Add collaborative annotation to document
   */
  addAnnotation(sessionId, annotationData) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const annotation = {
      id: uuidv4(),
      documentId: session.documentId,
      userId: session.userId,
      type: annotationData.type, // highlight, note, bookmark, change-suggestion
      position: annotationData.position,
      selection: annotationData.selection,
      content: annotationData.content || '',
      style: annotationData.style || {},
      layer: annotationData.layer || 'user', // user, system, ai
      visibility: annotationData.visibility || 'all', // all, collaborators, private
      timestamp: Date.now(),
      metadata: annotationData.metadata || {}
    };

    // Store annotation
    if (!this.annotations.has(session.documentId)) {
      this.annotations.set(session.documentId, []);
    }
    this.annotations.get(session.documentId).push(annotation);

    // Broadcast annotation to relevant users
    const message = {
      type: 'annotation_added',
      annotation,
      userId: session.userId,
      timestamp: Date.now()
    };

    if (annotation.visibility === 'all') {
      this.broadcastToDocument(session.documentId, message);
    } else if (annotation.visibility === 'collaborators') {
      this.broadcastToDocumentCollaborators(session.documentId, message);
    }

    this.logger.info(`Annotation added: ${annotation.id} by ${session.userId} on document ${session.documentId}`);
    return annotation;
  }

  /**
   * Smart conflict resolution with AI assistance
   */
  resolveConflict(documentId, conflictData) {
    const conflict = {
      id: uuidv4(),
      documentId,
      type: conflictData.type, // operational, semantic, intent
      operations: conflictData.operations,
      participants: conflictData.participants,
      severity: this.assessConflictSeverity(conflictData),
      timestamp: Date.now(),
      status: 'detected'
    };

    // Store conflict
    if (!this.conflictHistory.has(documentId)) {
      this.conflictHistory.set(documentId, []);
    }
    this.conflictHistory.get(documentId).push(conflict);

    // Attempt automatic resolution
    if (this.conflictResolver.auto_resolve_simple && conflict.severity < 3) {
      const resolution = this.attemptAutoResolution(conflict);
      if (resolution && resolution.confidence > this.conflictResolver.confidence_threshold) {
        conflict.resolution = resolution;
        conflict.status = 'auto_resolved';
        conflict.resolvedAt = Date.now();

        // Apply resolution
        this.applyConflictResolution(documentId, resolution);

        // Broadcast resolution
        this.broadcastToDocument(documentId, {
          type: 'conflict_resolved',
          conflict,
          resolution,
          timestamp: Date.now()
        });

        this.logger.info(`Conflict auto-resolved: ${conflict.id} on document ${documentId}`);
        return { success: true, conflict, resolution };
      }
    }

    // If auto-resolution failed, request human intervention
    conflict.status = 'requires_human_intervention';
    this.broadcastToDocument(documentId, {
      type: 'conflict_detected',
      conflict,
      timestamp: Date.now()
    });

    this.logger.warn(`Conflict requires human intervention: ${conflict.id} on document ${documentId}`);
    return { success: false, conflict, requiresIntervention: true };
  }

  /**
   * Assess conflict severity (1-5 scale)
   */
  assessConflictSeverity(conflictData) {
    let severity = 1;

    // Type-based severity
    const typeSeverity = {
      'operational': 2,
      'semantic': 3,
      'intent': 4
    };
    severity = typeSeverity[conflictData.type] || 1;

    // Number of participants
    if (conflictData.participants.length > 2) severity += 1;
    if (conflictData.participants.length > 4) severity += 1;

    // Operation complexity
    if (conflictData.operations.some(op => op.type === 'replace' && op.length > 100)) {
      severity += 1;
    }

    return Math.min(5, severity);
  }

  /**
   * Attempt automatic conflict resolution
   */
  attemptAutoResolution(conflict) {
    // Simple heuristics for automatic resolution
    const { operations, type } = conflict;

    if (type === 'operational' && operations.length === 2) {
      const [op1, op2] = operations;

      // Non-overlapping operations can be automatically merged
      if (!this.operationsOverlap(op1, op2)) {
        return {
          strategy: 'merge_non_overlapping',
          confidence: 0.95,
          mergedOperations: this.mergeOperations(op1, op2),
          explanation: 'Operations do not overlap and can be safely merged'
        };
      }

      // Prefer more recent operation for simple conflicts
      if (Math.abs(op1.timestamp - op2.timestamp) > 5000) { // 5 second difference
        const preferred = op1.timestamp > op2.timestamp ? op1 : op2;
        return {
          strategy: 'prefer_recent',
          confidence: 0.80,
          chosenOperation: preferred,
          explanation: 'Chose more recent operation to resolve conflict'
        };
      }
    }

    return null; // Cannot auto-resolve
  }

  /**
   * Check if two operations overlap
   */
  operationsOverlap(op1, op2) {
    const getRange = (op) => ({
      start: op.position,
      end: op.position + (op.length || op.text?.length || 0)
    });

    const range1 = getRange(op1);
    const range2 = getRange(op2);

    return !(range1.end <= range2.start || range2.end <= range1.start);
  }

  /**
   * Merge non-overlapping operations
   */
  mergeOperations(op1, op2) {
    // Order operations by position
    const [first, second] = op1.position <= op2.position ? [op1, op2] : [op2, op1];

    return [first, second]; // Return in correct order for sequential application
  }

  /**
   * Apply conflict resolution to document
   */
  applyConflictResolution(documentId, resolution) {
    switch (resolution.strategy) {
      case 'merge_non_overlapping':
        for (const operation of resolution.mergedOperations) {
          this.documentSync.applyOperation(documentId, operation, 'system');
        }
        break;
      case 'prefer_recent':
        this.documentSync.applyOperation(documentId, resolution.chosenOperation, 'system');
        break;
    }
  }

  /**
   * Update collaboration metrics
   */
  updateCollaborationMetrics(documentId, eventType) {
    if (!this.collaborativeMetrics.has(documentId)) {
      this.collaborativeMetrics.set(documentId, {
        commentsCount: 0,
        annotationsCount: 0,
        conflictsCount: 0,
        resolutionRate: 0,
        collaborationScore: 0,
        lastUpdated: Date.now()
      });
    }

    const metrics = this.collaborativeMetrics.get(documentId);

    switch (eventType) {
      case 'comment_added':
        metrics.commentsCount++;
        break;
      case 'annotation_added':
        metrics.annotationsCount++;
        break;
      case 'conflict_detected':
        metrics.conflictsCount++;
        break;
      case 'conflict_resolved':
        this.updateResolutionRate(documentId);
        break;
    }

    metrics.collaborationScore = this.calculateCollaborationScore(documentId);
    metrics.lastUpdated = Date.now();
  }

  /**
   * Calculate collaboration score (0-100)
   */
  calculateCollaborationScore(documentId) {
    const metrics = this.collaborativeMetrics.get(documentId);
    if (!metrics) return 0;

    const collaborators = this.getDocumentCollaborators(documentId);
    const activeUsers = collaborators.length;

    let score = 0;

    // Base score from user activity
    score += Math.min(40, activeUsers * 10);

    // Comments contribution
    score += Math.min(25, metrics.commentsCount * 2);

    // Conflict resolution rate
    score += metrics.resolutionRate * 25;

    // Annotation activity
    score += Math.min(10, metrics.annotationsCount);

    return Math.min(100, score);
  }

  /**
   * Update conflict resolution rate
   */
  updateResolutionRate(documentId) {
    const conflicts = this.conflictHistory.get(documentId) || [];
    const resolvedConflicts = conflicts.filter(c => c.status === 'auto_resolved' || c.status === 'resolved').length;
    const totalConflicts = conflicts.length;

    const metrics = this.collaborativeMetrics.get(documentId);
    if (metrics && totalConflicts > 0) {
      metrics.resolutionRate = resolvedConflicts / totalConflicts;
    }
  }

  /**
   * Broadcast to document collaborators only
   */
  broadcastToDocumentCollaborators(documentId, message) {
    const collaborators = this.getDocumentCollaborators(documentId);
    const collaboratorIds = new Set(collaborators.map(c => c.userId));

    const docSessions = this.documentSessions.get(documentId) || new Set();
    for (const sessionId of docSessions) {
      const session = this.sessions.get(sessionId);
      if (session && collaboratorIds.has(session.userId)) {
        this.sendToSession(sessionId, message);
      }
    }
  }

  /**
   * Get comments for a document
   */
  getDocumentComments(documentId, filters = {}) {
    const comments = this.comments.get(documentId) || [];

    let filtered = comments;

    if (filters.type) {
      filtered = filtered.filter(c => c.type === filters.type);
    }

    if (filters.resolved !== undefined) {
      filtered = filtered.filter(c => c.resolved === filters.resolved);
    }

    if (filters.userId) {
      filtered = filtered.filter(c => c.userId === filters.userId);
    }

    if (filters.priority) {
      filtered = filtered.filter(c => c.priority >= filters.priority);
    }

    // Sort by timestamp (newest first) unless specified
    const sortBy = filters.sortBy || 'timestamp';
    const sortOrder = filters.sortOrder || 'desc';

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }

  /**
   * Get annotations for a document
   */
  getDocumentAnnotations(documentId, layer = null) {
    const annotations = this.annotations.get(documentId) || [];
    if (layer) {
      return annotations.filter(a => a.layer === layer);
    }
    return annotations;
  }

  /**
   * Get collaboration analytics for a document
   */
  getCollaborationAnalytics(documentId) {
    const metrics = this.collaborativeMetrics.get(documentId);
    const comments = this.getDocumentComments(documentId);
    const annotations = this.getDocumentAnnotations(documentId);
    const conflicts = this.conflictHistory.get(documentId) || [];
    const collaborators = this.getDocumentCollaborators(documentId);

    return {
      metrics: metrics || {},
      summary: {
        totalComments: comments.length,
        unresolvedComments: comments.filter(c => !c.resolved).length,
        totalAnnotations: annotations.length,
        totalConflicts: conflicts.length,
        activeCollaborators: collaborators.length,
        lastActivity: Math.max(
          ...comments.map(c => c.timestamp),
          ...annotations.map(a => a.timestamp),
          0
        )
      },
      trends: this.calculateCollaborationTrends(documentId),
      recommendations: this.generateCollaborationRecommendations(documentId)
    };
  }

  /**
   * Calculate collaboration trends
   */
  calculateCollaborationTrends(documentId) {
    // Simplified trend calculation
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const comments = this.getDocumentComments(documentId);
    const recentComments = comments.filter(c => c.timestamp > dayAgo).length;
    const weekComments = comments.filter(c => c.timestamp > weekAgo).length;

    return {
      dailyComments: recentComments,
      weeklyComments: weekComments,
      trend: recentComments > 0 ? 'active' : 'quiet'
    };
  }

  /**
   * Generate collaboration recommendations
   */
  generateCollaborationRecommendations(documentId) {
    const analytics = this.getCollaborationAnalytics(documentId);
    const recommendations = [];

    if (analytics.summary.unresolvedComments > 5) {
      recommendations.push({
        type: 'action',
        priority: 'high',
        message: 'Consider resolving pending comments to improve collaboration flow',
        action: 'review_comments'
      });
    }

    if (analytics.summary.activeCollaborators > 5 && analytics.metrics.conflictsCount > 0) {
      recommendations.push({
        type: 'process',
        priority: 'medium',
        message: 'Large team detected. Consider implementing stricter review workflows',
        action: 'setup_workflows'
      });
    }

    if (analytics.trends.trend === 'quiet') {
      recommendations.push({
        type: 'engagement',
        priority: 'low',
        message: 'Document activity is low. Consider reaching out to stakeholders',
        action: 'increase_engagement'
      });
    }

    return recommendations;
  }

  /**
   * Create a new collaboration session
   */
  createSession(userId, documentId, permissions = ['read']) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      documentId,
      permissions: new Set(permissions),
      startTime: Date.now(),
      lastActivity: Date.now(),
      cursor: null,
      selection: null,
      isTyping: false
    };

    this.sessions.set(sessionId, session);

    // Track user sessions
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(sessionId);

    // Track document sessions
    if (!this.documentSessions.has(documentId)) {
      this.documentSessions.set(documentId, new Set());
    }
    this.documentSessions.get(documentId).add(sessionId);

    // Initialize document if needed
    if (!this.documentSync.getDocument(documentId)) {
      this.documentSync.initDocument(documentId);
    }

    // Add user to document
    this.documentSync.addUser(documentId, userId);

    // Update user presence
    this.updateUserPresence(userId, {
      status: 'active',
      documentId,
      sessionId,
      lastSeen: Date.now()
    });

    this.logger.info(`Created collaboration session: ${sessionId} for user ${userId} on document ${documentId}`);

    return session;
  }

  /**
   * End a collaboration session
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const { userId, documentId } = session;

    // Remove from tracking maps
    this.sessions.delete(sessionId);

    const userSessions = this.userSessions.get(userId);
    if (userSessions) {
      userSessions.delete(sessionId);
      if (userSessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }

    const docSessions = this.documentSessions.get(documentId);
    if (docSessions) {
      docSessions.delete(sessionId);
      if (docSessions.size === 0) {
        this.documentSessions.delete(documentId);
      }
    }

    // Remove user from document if no other sessions
    const remainingUserSessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId && s.documentId === documentId);

    if (remainingUserSessions.length === 0) {
      this.documentSync.removeUser(documentId, userId);
      this.updateUserPresence(userId, { status: 'offline' });
    }

    this.logger.info(`Ended collaboration session: ${sessionId}`);
    return true;
  }

  /**
   * Update session activity
   */
  updateSessionActivity(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      this.updateUserPresence(session.userId, {
        lastSeen: Date.now(),
        status: 'active'
      });
    }
  }

  /**
   * Update user cursor position
   */
  updateCursor(sessionId, cursor) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.cursor = cursor;
    session.lastActivity = Date.now();

    // Broadcast cursor update to other users in the document
    this.broadcastToDocument(session.documentId, {
      type: 'cursor_update',
      userId: session.userId,
      sessionId,
      cursor,
      timestamp: Date.now()
    }, sessionId);

    return true;
  }

  /**
   * Update user selection
   */
  updateSelection(sessionId, selection) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.selection = selection;
    session.lastActivity = Date.now();

    // Broadcast selection update to other users in the document
    this.broadcastToDocument(session.documentId, {
      type: 'selection_update',
      userId: session.userId,
      sessionId,
      selection,
      timestamp: Date.now()
    }, sessionId);

    return true;
  }

  /**
   * Update typing status
   */
  updateTypingStatus(sessionId, isTyping) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.isTyping = isTyping;
    session.lastActivity = Date.now();

    // Broadcast typing status to other users in the document
    this.broadcastToDocument(session.documentId, {
      type: 'typing_status',
      userId: session.userId,
      sessionId,
      isTyping,
      timestamp: Date.now()
    }, sessionId);

    return true;
  }

  /**
   * Apply document operation
   */
  applyOperation(sessionId, operation) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check write permissions
    if (!session.permissions.has('write')) {
      throw new Error('Insufficient permissions for write operation');
    }

    session.lastActivity = Date.now();

    // Apply operation through document synchronizer
    const result = this.documentSync.applyOperation(
      session.documentId,
      { ...operation, sessionId },
      session.userId
    );

    // Broadcast operation to other users in the document
    this.broadcastToDocument(session.documentId, {
      type: 'operation_applied',
      operation: result.operation,
      userId: session.userId,
      sessionId,
      document: result.document,
      timestamp: Date.now()
    }, sessionId);

    return result;
  }

  /**
   * Get document state for a session
   */
  getDocumentState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Check read permissions
    if (!session.permissions.has('read')) {
      throw new Error('Insufficient permissions for read operation');
    }

    const document = this.documentSync.getDocument(session.documentId);
    if (!document) {
      throw new Error(`Document not found: ${session.documentId}`);
    }

    return {
      document: {
        id: document.id,
        content: document.content,
        version: document.version,
        lastModified: document.lastModified,
        metadata: document.metadata
      },
      collaborators: this.getDocumentCollaborators(session.documentId),
      permissions: Array.from(session.permissions)
    };
  }

  /**
   * Get all collaborators for a document
   */
  getDocumentCollaborators(documentId) {
    const docSessions = this.documentSessions.get(documentId) || new Set();
    const collaborators = new Map();

    for (const sessionId of docSessions) {
      const session = this.sessions.get(sessionId);
      if (session) {
        const existing = collaborators.get(session.userId) || {
          userId: session.userId,
          sessions: [],
          presence: this.userPresence.get(session.userId)
        };

        existing.sessions.push({
          sessionId,
          cursor: session.cursor,
          selection: session.selection,
          isTyping: session.isTyping,
          permissions: Array.from(session.permissions),
          lastActivity: session.lastActivity
        });

        collaborators.set(session.userId, existing);
      }
    }

    return Array.from(collaborators.values());
  }

  /**
   * Update user presence information
   */
  updateUserPresence(userId, presenceInfo) {
    const current = this.userPresence.get(userId) || {};
    const updated = { ...current, ...presenceInfo, userId };
    this.userPresence.set(userId, updated);

    // Broadcast presence update to relevant documents
    const userSessions = this.userSessions.get(userId) || new Set();
    const documentIds = new Set();

    for (const sessionId of userSessions) {
      const session = this.sessions.get(sessionId);
      if (session) {
        documentIds.add(session.documentId);
      }
    }

    for (const documentId of documentIds) {
      this.broadcastToDocument(documentId, {
        type: 'presence_update',
        userId,
        presence: updated,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get user presence information
   */
  getUserPresence(userId) {
    return this.userPresence.get(userId) || { userId, status: 'offline' };
  }

  /**
   * Set document permissions
   */
  setDocumentPermissions(documentId, permissions) {
    this.documentPermissions.set(documentId, new Map(permissions));
    this.logger.info(`Updated permissions for document: ${documentId}`);
  }

  /**
   * Check if user has permission for document
   */
  hasPermission(userId, documentId, permission) {
    const docPermissions = this.documentPermissions.get(documentId);
    if (!docPermissions) {
      return false; // No permissions set, deny by default
    }

    const userPermissions = docPermissions.get(userId);
    if (!userPermissions) {
      return false; // User not found in permissions
    }

    return userPermissions.includes(permission);
  }

  /**
   * Broadcast message to all sessions in a document
   */
  broadcastToDocument(documentId, message, excludeSessionId = null) {
    const docSessions = this.documentSessions.get(documentId) || new Set();

    for (const sessionId of docSessions) {
      if (sessionId !== excludeSessionId) {
        this.sendToSession(sessionId, message);
      }
    }
  }

  /**
   * Send message to a specific session
   */
  sendToSession(sessionId, message) {
    // This would be implemented by the WebSocket server
    // For now, we'll use an event emitter pattern
    this.emit('session_message', { sessionId, message });
  }

  /**
   * Simple event emitter functionality
   */
  emit(event, data) {
    if (this.listeners && this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          this.logger.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (!this.listeners) {
      this.listeners = {};
    }
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Start cleanup interval for stale sessions
   */
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupStaleSessions();
    }, 60000); // 1 minute
  }

  /**
   * Clean up stale sessions
   */
  cleanupStaleSessions() {
    const now = Date.now();
    const staleThreshold = 300000; // 5 minutes

    const staleSessions = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > staleThreshold) {
        staleSessions.push(sessionId);
      }
    }

    for (const sessionId of staleSessions) {
      this.logger.info(`Cleaning up stale session: ${sessionId}`);
      this.endSession(sessionId);
    }
  }

  /**
   * Get collaboration statistics
   */
  getStats() {
    const activeSessions = this.sessions.size;
    const activeUsers = this.userSessions.size;
    const activeDocuments = this.documentSessions.size;

    const documentStats = new Map();
    for (const [documentId, sessions] of this.documentSessions.entries()) {
      const uniqueUsers = new Set();
      for (const sessionId of sessions) {
        const session = this.sessions.get(sessionId);
        if (session) {
          uniqueUsers.add(session.userId);
        }
      }
      documentStats.set(documentId, {
        sessions: sessions.size,
        users: uniqueUsers.size
      });
    }

    return {
      activeSessions,
      activeUsers,
      activeDocuments,
      documentStats: Object.fromEntries(documentStats),
      syncStats: this.documentSync.getStats()
    };
  }

  /**
   * Shutdown collaboration manager
   */
  shutdown() {
    this.logger.info('Shutting down collaboration manager...');

    // End all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      this.endSession(sessionId);
    }

    // Clear all data
    this.sessions.clear();
    this.userSessions.clear();
    this.documentSessions.clear();
    this.userPresence.clear();
    this.documentPermissions.clear();

    this.logger.info('Collaboration manager shut down');
  }
}

module.exports = CollaborationManager;