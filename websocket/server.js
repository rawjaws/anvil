/**
 * WebSocket Server for Real-time Collaboration
 * Handles real-time document synchronization, user presence, and collaborative editing
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({ filename: 'logs/websocket.log' })
  ]
});

class RealtimeCollaborationServer {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // clientId -> { ws, userId, documentId, metadata }
    this.documents = new Map(); // documentId -> { users: Set, content: string, version: number }
    this.userPresence = new Map(); // userId -> { documentId, lastActivity, cursorPosition }
    this.messageQueue = new Map(); // clientId -> Array of queued messages
    this.conflictResolution = new ConflictResolver();
  }

  /**
   * Initialize WebSocket server
   */
  init(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      perMessageDeflate: {
        zlibDeflateOptions: {
          threshold: 1024,
          concurrencyLimit: 10,
        },
        zlibInflateOptions: {
          chunkSize: 1024,
        },
        threshold: 1024,
        concurrencyLimit: 10,
        clientMaxNoContextTakeover: false,
        serverMaxNoContextTakeover: false,
        serverMaxWindowBits: 15,
        clientMaxWindowBits: 15,
      }
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));

    // Cleanup interval for stale connections
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000); // 30 seconds

    logger.info('WebSocket server initialized');
    return this.wss;
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = uuidv4();
    const clientInfo = {
      ws,
      userId: null,
      documentId: null,
      lastActivity: Date.now(),
      authenticated: false
    };

    this.clients.set(clientId, clientInfo);
    this.messageQueue.set(clientId, []);

    logger.info(`Client connected: ${clientId}`);

    // Set up client event handlers
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => this.handleClientError(clientId, error));
    ws.on('pong', () => this.handlePong(clientId));

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      clientId,
      timestamp: Date.now()
    });

    // Start ping interval for this client
    this.startPingInterval(clientId);
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data);
      const client = this.clients.get(clientId);

      if (!client) {
        logger.warn(`Message from unknown client: ${clientId}`);
        return;
      }

      client.lastActivity = Date.now();

      // Route message based on type
      switch (message.type) {
        case 'authenticate':
          this.handleAuthentication(clientId, message);
          break;
        case 'join_document':
          this.handleJoinDocument(clientId, message);
          break;
        case 'leave_document':
          this.handleLeaveDocument(clientId, message);
          break;
        case 'document_change':
          this.handleDocumentChange(clientId, message);
          break;
        case 'cursor_move':
          this.handleCursorMove(clientId, message);
          break;
        case 'user_typing':
          this.handleUserTyping(clientId, message);
          break;
        case 'request_document_state':
          this.handleDocumentStateRequest(clientId, message);
          break;
        default:
          logger.warn(`Unknown message type: ${message.type} from client ${clientId}`);
      }
    } catch (error) {
      logger.error(`Error parsing message from client ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Invalid message format',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle client authentication
   */
  handleAuthentication(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Simple authentication - in production, validate token/credentials
    if (message.userId && message.token) {
      client.userId = message.userId;
      client.authenticated = true;

      this.sendToClient(clientId, {
        type: 'authenticated',
        userId: message.userId,
        timestamp: Date.now()
      });

      logger.info(`Client ${clientId} authenticated as user ${message.userId}`);
    } else {
      this.sendToClient(clientId, {
        type: 'authentication_failed',
        error: 'Invalid credentials',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle user joining a document
   */
  handleJoinDocument(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Not authenticated',
        timestamp: Date.now()
      });
      return;
    }

    const { documentId } = message;
    client.documentId = documentId;

    // Initialize document if it doesn't exist
    if (!this.documents.has(documentId)) {
      this.documents.set(documentId, {
        users: new Set(),
        content: '',
        version: 0,
        lastModified: Date.now()
      });
    }

    const document = this.documents.get(documentId);
    document.users.add(client.userId);

    // Update user presence
    this.userPresence.set(client.userId, {
      documentId,
      lastActivity: Date.now(),
      cursorPosition: null
    });

    // Notify other users
    this.broadcastToDocument(documentId, {
      type: 'user_joined',
      userId: client.userId,
      documentId,
      timestamp: Date.now()
    }, client.userId);

    // Send current document state to joining user
    this.sendToClient(clientId, {
      type: 'document_state',
      documentId,
      content: document.content,
      version: document.version,
      users: Array.from(document.users),
      timestamp: Date.now()
    });

    logger.info(`User ${client.userId} joined document ${documentId}`);
  }

  /**
   * Handle user leaving a document
   */
  handleLeaveDocument(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { documentId } = message;
    this.removeUserFromDocument(client.userId, documentId);
  }

  /**
   * Handle document changes
   */
  handleDocumentChange(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated || !client.documentId) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Not authorized to edit document',
        timestamp: Date.now()
      });
      return;
    }

    const { documentId, change, version, position } = message;

    if (documentId !== client.documentId) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Document mismatch',
        timestamp: Date.now()
      });
      return;
    }

    const document = this.documents.get(documentId);
    if (!document) {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Document not found',
        timestamp: Date.now()
      });
      return;
    }

    // Check for version conflicts
    if (version && version !== document.version) {
      // Handle conflict resolution
      const resolution = this.conflictResolution.resolve(
        document.content,
        change,
        document.version,
        version
      );

      if (resolution.hasConflict) {
        this.broadcastToDocument(documentId, {
          type: 'conflict_detected',
          documentId,
          originalChange: change,
          resolution: resolution.resolvedContent,
          conflictDetails: resolution.conflicts,
          timestamp: Date.now()
        });

        document.content = resolution.resolvedContent;
        document.version += 1;
      } else {
        document.content = resolution.resolvedContent;
        document.version += 1;
      }
    } else {
      // Apply change directly
      document.content = this.applyChange(document.content, change, position);
      document.version += 1;
    }

    document.lastModified = Date.now();

    // Broadcast change to all users in document
    this.broadcastToDocument(documentId, {
      type: 'document_change',
      documentId,
      change,
      userId: client.userId,
      version: document.version,
      position,
      timestamp: Date.now()
    }, client.userId);

    logger.info(`Document ${documentId} updated by user ${client.userId}, version ${document.version}`);
  }

  /**
   * Handle cursor movement
   */
  handleCursorMove(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated || !client.documentId) return;

    const { documentId, position } = message;

    // Update user presence
    const presence = this.userPresence.get(client.userId);
    if (presence) {
      presence.cursorPosition = position;
      presence.lastActivity = Date.now();
    }

    // Broadcast cursor position to other users
    this.broadcastToDocument(documentId, {
      type: 'cursor_position',
      userId: client.userId,
      documentId,
      position,
      timestamp: Date.now()
    }, client.userId);
  }

  /**
   * Handle user typing indicator
   */
  handleUserTyping(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated || !client.documentId) return;

    const { documentId, isTyping } = message;

    this.broadcastToDocument(documentId, {
      type: 'user_typing',
      userId: client.userId,
      documentId,
      isTyping,
      timestamp: Date.now()
    }, client.userId);
  }

  /**
   * Handle document state request
   */
  handleDocumentStateRequest(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    const { documentId } = message;
    const document = this.documents.get(documentId);

    if (document) {
      this.sendToClient(clientId, {
        type: 'document_state',
        documentId,
        content: document.content,
        version: document.version,
        users: Array.from(document.users),
        timestamp: Date.now()
      });
    } else {
      this.sendToClient(clientId, {
        type: 'error',
        error: 'Document not found',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      if (client.userId && client.documentId) {
        this.removeUserFromDocument(client.userId, client.documentId);
      }
      this.clients.delete(clientId);
      this.messageQueue.delete(clientId);
    }

    logger.info(`Client disconnected: ${clientId}`);
  }

  /**
   * Remove user from document and notify others
   */
  removeUserFromDocument(userId, documentId) {
    const document = this.documents.get(documentId);
    if (document) {
      document.users.delete(userId);

      // Notify other users
      this.broadcastToDocument(documentId, {
        type: 'user_left',
        userId,
        documentId,
        timestamp: Date.now()
      }, userId);

      // Clean up empty documents
      if (document.users.size === 0) {
        this.documents.delete(documentId);
        logger.info(`Document ${documentId} cleaned up (no active users)`);
      }
    }

    // Remove from presence tracking
    this.userPresence.delete(userId);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        logger.error(`Error sending message to client ${clientId}:`, error);
        this.handleDisconnection(clientId);
        return false;
      }
    } else {
      // Queue message if client is not ready
      const queue = this.messageQueue.get(clientId);
      if (queue) {
        queue.push(message);
      }
      return false;
    }
  }

  /**
   * Broadcast message to all users in a document
   */
  broadcastToDocument(documentId, message, excludeUserId = null) {
    const document = this.documents.get(documentId);
    if (!document) return;

    for (const [clientId, client] of this.clients.entries()) {
      if (client.documentId === documentId &&
          client.userId !== excludeUserId &&
          client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message);
      }
    }
  }

  /**
   * Apply text change to document content
   */
  applyChange(content, change, position) {
    if (!position) return content;

    const { start, end, text } = change;
    return content.slice(0, start) + text + content.slice(end);
  }

  /**
   * Start ping interval for client
   */
  startPingInterval(clientId) {
    const interval = setInterval(() => {
      const client = this.clients.get(clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }

      try {
        client.ws.ping();
      } catch (error) {
        logger.error(`Error pinging client ${clientId}:`, error);
        clearInterval(interval);
        this.handleDisconnection(clientId);
      }
    }, 30000); // 30 seconds
  }

  /**
   * Handle pong response
   */
  handlePong(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastActivity = Date.now();
    }
  }

  /**
   * Clean up stale connections
   */
  cleanupStaleConnections() {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute

    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastActivity > staleThreshold) {
        logger.info(`Cleaning up stale connection: ${clientId}`);
        client.ws.terminate();
        this.handleDisconnection(clientId);
      }
    }
  }

  /**
   * Handle server errors
   */
  handleServerError(error) {
    logger.error('WebSocket server error:', error);
  }

  /**
   * Handle client errors
   */
  handleClientError(clientId, error) {
    logger.error(`Client ${clientId} error:`, error);
    this.handleDisconnection(clientId);
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      activeConnections: this.clients.size,
      activeDocuments: this.documents.size,
      activeUsers: this.userPresence.size,
      documents: Array.from(this.documents.entries()).map(([id, doc]) => ({
        id,
        userCount: doc.users.size,
        version: doc.version,
        lastModified: doc.lastModified
      }))
    };
  }

  /**
   * Shutdown server gracefully
   */
  shutdown() {
    logger.info('Shutting down WebSocket server...');

    // Close all client connections
    for (const [clientId, client] of this.clients.entries()) {
      client.ws.close(1001, 'Server shutting down');
    }

    // Close server
    if (this.wss) {
      this.wss.close();
    }

    logger.info('WebSocket server shut down');
  }
}

/**
 * Conflict Resolution Engine
 */
class ConflictResolver {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * Resolve conflicts between document versions
   */
  resolve(currentContent, incomingChange, currentVersion, incomingVersion) {
    // Simple conflict resolution strategy
    // In production, implement more sophisticated algorithms (e.g., Operational Transform, CRDTs)

    const hasConflict = Math.abs(currentVersion - incomingVersion) > 0;

    if (!hasConflict) {
      return {
        hasConflict: false,
        resolvedContent: this.applyChange(currentContent, incomingChange),
        conflicts: []
      };
    }

    // Simple merge strategy: timestamp-based resolution
    this.logger.info(`Resolving conflict: current v${currentVersion}, incoming v${incomingVersion}`);

    return {
      hasConflict: true,
      resolvedContent: this.mergeChanges(currentContent, incomingChange),
      conflicts: [{
        type: 'version_mismatch',
        currentVersion,
        incomingVersion,
        resolution: 'merged'
      }]
    };
  }

  /**
   * Apply a single change to content
   */
  applyChange(content, change) {
    if (!change || !change.position) return content;

    const { start, end, text } = change.position;
    return content.slice(0, start) + text + content.slice(end);
  }

  /**
   * Merge conflicting changes
   */
  mergeChanges(content, change) {
    // Simple merge: append changes with conflict markers
    if (!change.text) return content;

    return content + '\n<<<< CONFLICT >>>>\n' + change.text + '\n<<<< END CONFLICT >>>>\n';
  }
}

module.exports = RealtimeCollaborationServer;