/**
 * Real-time Collaboration API Endpoints
 * REST API endpoints for managing real-time collaboration features
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const CollaborationManager = require('../collaboration/CollaborationManager');

const router = express.Router();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

// Initialize collaboration manager
const collaborationManager = new CollaborationManager();

/**
 * Middleware to validate authentication
 */
function authenticateUser(req, res, next) {
  // Simple authentication - in production, use proper JWT validation
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Extract user info from token (simplified)
  const token = authHeader.substring(7);
  try {
    // In production, verify JWT token here
    req.user = { id: token, name: `User ${token}` };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Middleware to validate document access
 */
function validateDocumentAccess(req, res, next) {
  const { documentId } = req.params;
  const userId = req.user.id;

  // Check if user has access to document
  if (!collaborationManager.hasPermission(userId, documentId, 'read')) {
    return res.status(403).json({ error: 'Access denied to document' });
  }

  next();
}

/**
 * Create a new collaboration session
 * POST /api/realtime/sessions
 */
router.post('/sessions', authenticateUser, (req, res) => {
  try {
    const { documentId, permissions = ['read'] } = req.body;
    const userId = req.user.id;

    if (!documentId) {
      return res.status(400).json({ error: 'Document ID is required' });
    }

    // Validate permissions
    const validPermissions = ['read', 'write', 'admin'];
    const filteredPermissions = permissions.filter(p => validPermissions.includes(p));

    const session = collaborationManager.createSession(userId, documentId, filteredPermissions);

    res.status(201).json({
      success: true,
      session: {
        id: session.id,
        documentId: session.documentId,
        permissions: Array.from(session.permissions),
        startTime: session.startTime
      }
    });

    logger.info(`Created session ${session.id} for user ${userId} on document ${documentId}`);
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * End a collaboration session
 * DELETE /api/realtime/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', authenticateUser, (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = collaborationManager.endSession(sessionId);

    if (success) {
      res.json({ success: true, message: 'Session ended successfully' });
      logger.info(`Ended session ${sessionId}`);
    } else {
      res.status(404).json({ error: 'Session not found' });
    }
  } catch (error) {
    logger.error('Error ending session:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

/**
 * Get document state for collaboration
 * GET /api/realtime/documents/:documentId
 */
router.get('/documents/:documentId', authenticateUser, validateDocumentAccess, (req, res) => {
  try {
    const { documentId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const documentState = collaborationManager.getDocumentState(sessionId);

    res.json({
      success: true,
      ...documentState
    });
  } catch (error) {
    logger.error('Error getting document state:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('permissions')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get document state' });
    }
  }
});

/**
 * Apply an operation to a document
 * POST /api/realtime/documents/:documentId/operations
 */
router.post('/documents/:documentId/operations', authenticateUser, validateDocumentAccess, (req, res) => {
  try {
    const { documentId } = req.params;
    const { sessionId, operation } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!operation || !operation.type) {
      return res.status(400).json({ error: 'Valid operation is required' });
    }

    const result = collaborationManager.applyOperation(sessionId, operation);

    res.json({
      success: true,
      operation: result.operation,
      document: result.document
    });

    logger.info(`Applied operation ${operation.type} to document ${documentId}`);
  } catch (error) {
    logger.error('Error applying operation:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('permissions')) {
      res.status(403).json({ error: error.message });
    } else if (error.message.includes('Invalid operation')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to apply operation' });
    }
  }
});

/**
 * Update cursor position
 * PUT /api/realtime/sessions/:sessionId/cursor
 */
router.put('/sessions/:sessionId/cursor', authenticateUser, (req, res) => {
  try {
    const { sessionId } = req.params;
    const { cursor } = req.body;

    if (!cursor || typeof cursor.line !== 'number' || typeof cursor.column !== 'number') {
      return res.status(400).json({ error: 'Valid cursor position is required' });
    }

    collaborationManager.updateCursor(sessionId, cursor);

    res.json({ success: true, message: 'Cursor updated successfully' });
  } catch (error) {
    logger.error('Error updating cursor:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update cursor' });
    }
  }
});

/**
 * Update text selection
 * PUT /api/realtime/sessions/:sessionId/selection
 */
router.put('/sessions/:sessionId/selection', authenticateUser, (req, res) => {
  try {
    const { sessionId } = req.params;
    const { selection } = req.body;

    if (!selection || typeof selection.start !== 'number' || typeof selection.end !== 'number') {
      return res.status(400).json({ error: 'Valid selection range is required' });
    }

    collaborationManager.updateSelection(sessionId, selection);

    res.json({ success: true, message: 'Selection updated successfully' });
  } catch (error) {
    logger.error('Error updating selection:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update selection' });
    }
  }
});

/**
 * Update typing status
 * PUT /api/realtime/sessions/:sessionId/typing
 */
router.put('/sessions/:sessionId/typing', authenticateUser, (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isTyping } = req.body;

    if (typeof isTyping !== 'boolean') {
      return res.status(400).json({ error: 'Valid typing status is required' });
    }

    collaborationManager.updateTypingStatus(sessionId, isTyping);

    res.json({ success: true, message: 'Typing status updated successfully' });
  } catch (error) {
    logger.error('Error updating typing status:', error);
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update typing status' });
    }
  }
});

/**
 * Get document collaborators
 * GET /api/realtime/documents/:documentId/collaborators
 */
router.get('/documents/:documentId/collaborators', authenticateUser, validateDocumentAccess, (req, res) => {
  try {
    const { documentId } = req.params;
    const collaborators = collaborationManager.getDocumentCollaborators(documentId);

    res.json({
      success: true,
      collaborators
    });
  } catch (error) {
    logger.error('Error getting collaborators:', error);
    res.status(500).json({ error: 'Failed to get collaborators' });
  }
});

/**
 * Get user presence information
 * GET /api/realtime/users/:userId/presence
 */
router.get('/users/:userId/presence', authenticateUser, (req, res) => {
  try {
    const { userId } = req.params;
    const presence = collaborationManager.getUserPresence(userId);

    res.json({
      success: true,
      presence
    });
  } catch (error) {
    logger.error('Error getting user presence:', error);
    res.status(500).json({ error: 'Failed to get user presence' });
  }
});

/**
 * Set document permissions
 * PUT /api/realtime/documents/:documentId/permissions
 */
router.put('/documents/:documentId/permissions', authenticateUser, (req, res) => {
  try {
    const { documentId } = req.params;
    const { permissions } = req.body;
    const userId = req.user.id;

    // Check if user has admin permissions on the document
    if (!collaborationManager.hasPermission(userId, documentId, 'admin')) {
      return res.status(403).json({ error: 'Admin permissions required' });
    }

    if (!permissions || typeof permissions !== 'object') {
      return res.status(400).json({ error: 'Valid permissions object is required' });
    }

    collaborationManager.setDocumentPermissions(documentId, Object.entries(permissions));

    res.json({ success: true, message: 'Permissions updated successfully' });
    logger.info(`Updated permissions for document ${documentId}`);
  } catch (error) {
    logger.error('Error setting permissions:', error);
    res.status(500).json({ error: 'Failed to set permissions' });
  }
});

/**
 * Get collaboration statistics
 * GET /api/realtime/stats
 */
router.get('/stats', authenticateUser, (req, res) => {
  try {
    const stats = collaborationManager.getStats();

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * Health check endpoint
 * GET /api/realtime/health
 */
router.get('/health', (req, res) => {
  try {
    const stats = collaborationManager.getStats();
    const health = {
      status: 'healthy',
      timestamp: Date.now(),
      activeConnections: stats.activeSessions,
      activeDocuments: stats.activeDocuments,
      activeUsers: stats.activeUsers
    };

    res.json(health);
  } catch (error) {
    logger.error('Error getting health status:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: Date.now(),
      error: 'Failed to get health status'
    });
  }
});

/**
 * Error handling middleware
 */
router.use((error, req, res, next) => {
  logger.error('Unhandled error in realtime API:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Export the router and collaboration manager for integration
module.exports = {
  router,
  collaborationManager
};