/**
 * Document Synchronization Engine
 * Handles real-time document synchronization, operational transforms, and collaborative editing
 */

const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

class DocumentSynchronizer {
  constructor() {
    this.documents = new Map(); // documentId -> DocumentState
    this.operations = new Map(); // documentId -> Array<Operation>
    this.subscribers = new Map(); // documentId -> Set<callback>
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  /**
   * Initialize a document for synchronization
   */
  initDocument(documentId, initialContent = '', metadata = {}) {
    if (this.documents.has(documentId)) {
      return this.documents.get(documentId);
    }

    const documentState = {
      id: documentId,
      content: initialContent,
      version: 0,
      lastModified: Date.now(),
      metadata,
      activeUsers: new Set(),
      pendingOperations: [],
      history: []
    };

    this.documents.set(documentId, documentState);
    this.operations.set(documentId, []);
    this.subscribers.set(documentId, new Set());

    this.logger.info(`Initialized document: ${documentId}`);
    return documentState;
  }

  /**
   * Subscribe to document changes
   */
  subscribe(documentId, callback) {
    if (!this.subscribers.has(documentId)) {
      this.subscribers.set(documentId, new Set());
    }
    this.subscribers.get(documentId).add(callback);

    return () => {
      const subs = this.subscribers.get(documentId);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  /**
   * Apply an operation to a document
   */
  applyOperation(documentId, operation, userId) {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Create operation with metadata
    const enrichedOperation = {
      ...operation,
      id: uuidv4(),
      userId,
      timestamp: Date.now(),
      version: document.version + 1
    };

    // Validate operation
    if (!this.validateOperation(enrichedOperation, document)) {
      throw new Error('Invalid operation');
    }

    // Apply operational transform if needed
    const transformedOperation = this.transformOperation(enrichedOperation, document);

    // Apply the operation to the document
    const result = this.executeOperation(transformedOperation, document);

    // Update document state
    document.content = result.content;
    document.version = transformedOperation.version;
    document.lastModified = Date.now();

    // Store operation in history
    const operations = this.operations.get(documentId);
    operations.push(transformedOperation);

    // Keep only recent operations (last 1000)
    if (operations.length > 1000) {
      operations.splice(0, operations.length - 1000);
    }

    // Add to document history
    document.history.push({
      operation: transformedOperation,
      contentSnapshot: document.content,
      timestamp: Date.now()
    });

    // Keep only recent history (last 100 snapshots)
    if (document.history.length > 100) {
      document.history.splice(0, document.history.length - 100);
    }

    // Notify subscribers
    this.notifySubscribers(documentId, {
      type: 'operation_applied',
      operation: transformedOperation,
      document: {
        id: documentId,
        content: document.content,
        version: document.version,
        lastModified: document.lastModified
      }
    });

    return {
      success: true,
      operation: transformedOperation,
      document: {
        id: documentId,
        content: document.content,
        version: document.version
      }
    };
  }

  /**
   * Validate an operation
   */
  validateOperation(operation, document) {
    if (!operation.type) return false;
    if (!operation.userId) return false;

    switch (operation.type) {
      case 'insert':
        return this.validateInsertOperation(operation, document);
      case 'delete':
        return this.validateDeleteOperation(operation, document);
      case 'replace':
        return this.validateReplaceOperation(operation, document);
      default:
        return false;
    }
  }

  /**
   * Validate insert operation
   */
  validateInsertOperation(operation, document) {
    const { position, text } = operation;
    if (typeof position !== 'number' || position < 0) return false;
    if (position > document.content.length) return false;
    if (typeof text !== 'string') return false;
    return true;
  }

  /**
   * Validate delete operation
   */
  validateDeleteOperation(operation, document) {
    const { position, length } = operation;
    if (typeof position !== 'number' || position < 0) return false;
    if (typeof length !== 'number' || length <= 0) return false;
    if (position + length > document.content.length) return false;
    return true;
  }

  /**
   * Validate replace operation
   */
  validateReplaceOperation(operation, document) {
    const { position, length, text } = operation;
    if (typeof position !== 'number' || position < 0) return false;
    if (typeof length !== 'number' || length < 0) return false;
    if (position + length > document.content.length) return false;
    if (typeof text !== 'string') return false;
    return true;
  }

  /**
   * Transform operation using Operational Transform
   */
  transformOperation(operation, document) {
    // Get all operations after the base version of the incoming operation
    const operations = this.operations.get(document.id) || [];
    const baseVersion = operation.baseVersion || document.version;

    const concurrentOps = operations.filter(op => op.version > baseVersion);

    if (concurrentOps.length === 0) {
      return { ...operation, version: document.version + 1 };
    }

    // Apply operational transform
    let transformedOp = { ...operation };

    for (const concurrentOp of concurrentOps) {
      transformedOp = this.transform(transformedOp, concurrentOp);
    }

    transformedOp.version = document.version + 1;
    return transformedOp;
  }

  /**
   * Transform two operations using Operational Transform algorithm
   */
  transform(op1, op2) {
    // Simplified OT - in production, use a robust OT library
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2);
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      return this.transformDeleteInsert(op1, op2);
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2);
    }

    // Default: return original operation
    return op1;
  }

  /**
   * Transform insert-insert operations
   */
  transformInsertInsert(op1, op2) {
    if (op1.position <= op2.position) {
      return op1; // No transformation needed
    } else {
      return {
        ...op1,
        position: op1.position + op2.text.length
      };
    }
  }

  /**
   * Transform insert-delete operations
   */
  transformInsertDelete(op1, op2) {
    if (op1.position <= op2.position) {
      return op1;
    } else if (op1.position >= op2.position + op2.length) {
      return {
        ...op1,
        position: op1.position - op2.length
      };
    } else {
      // Insert position is within deleted range
      return {
        ...op1,
        position: op2.position
      };
    }
  }

  /**
   * Transform delete-insert operations
   */
  transformDeleteInsert(op1, op2) {
    if (op2.position <= op1.position) {
      return {
        ...op1,
        position: op1.position + op2.text.length
      };
    } else if (op2.position >= op1.position + op1.length) {
      return op1;
    } else {
      // Insert is within delete range - split delete
      return {
        ...op1,
        length: op1.length + op2.text.length
      };
    }
  }

  /**
   * Transform delete-delete operations
   */
  transformDeleteDelete(op1, op2) {
    if (op1.position + op1.length <= op2.position) {
      return op1; // No overlap
    } else if (op2.position + op2.length <= op1.position) {
      return {
        ...op1,
        position: op1.position - op2.length
      };
    } else {
      // Overlapping deletes - complex case
      const start1 = op1.position;
      const end1 = op1.position + op1.length;
      const start2 = op2.position;
      const end2 = op2.position + op2.length;

      const newStart = Math.min(start1, start2);
      const newEnd = Math.max(end1, end2) - Math.max(0, Math.min(end1, end2) - Math.max(start1, start2));

      return {
        ...op1,
        position: newStart,
        length: newEnd - newStart
      };
    }
  }

  /**
   * Execute an operation on the document
   */
  executeOperation(operation, document) {
    let content = document.content;

    switch (operation.type) {
      case 'insert':
        content = content.slice(0, operation.position) +
                 operation.text +
                 content.slice(operation.position);
        break;

      case 'delete':
        content = content.slice(0, operation.position) +
                 content.slice(operation.position + operation.length);
        break;

      case 'replace':
        content = content.slice(0, operation.position) +
                 operation.text +
                 content.slice(operation.position + operation.length);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    return { content };
  }

  /**
   * Get document state
   */
  getDocument(documentId) {
    return this.documents.get(documentId);
  }

  /**
   * Get document operations history
   */
  getOperations(documentId, fromVersion = 0) {
    const operations = this.operations.get(documentId) || [];
    return operations.filter(op => op.version > fromVersion);
  }

  /**
   * Add user to document
   */
  addUser(documentId, userId) {
    const document = this.documents.get(documentId);
    if (document) {
      document.activeUsers.add(userId);
      this.notifySubscribers(documentId, {
        type: 'user_joined',
        userId,
        activeUsers: Array.from(document.activeUsers)
      });
    }
  }

  /**
   * Remove user from document
   */
  removeUser(documentId, userId) {
    const document = this.documents.get(documentId);
    if (document) {
      document.activeUsers.delete(userId);
      this.notifySubscribers(documentId, {
        type: 'user_left',
        userId,
        activeUsers: Array.from(document.activeUsers)
      });

      // Clean up document if no active users
      if (document.activeUsers.size === 0) {
        this.cleanupDocument(documentId);
      }
    }
  }

  /**
   * Notify all subscribers of document changes
   */
  notifySubscribers(documentId, event) {
    const subscribers = this.subscribers.get(documentId);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          this.logger.error('Error notifying subscriber:', error);
        }
      });
    }
  }

  /**
   * Clean up document resources
   */
  cleanupDocument(documentId) {
    // Keep document in memory for a short time in case users reconnect
    setTimeout(() => {
      const document = this.documents.get(documentId);
      if (document && document.activeUsers.size === 0) {
        this.documents.delete(documentId);
        this.operations.delete(documentId);
        this.subscribers.delete(documentId);
        this.logger.info(`Cleaned up document: ${documentId}`);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Create a snapshot of the document
   */
  createSnapshot(documentId) {
    const document = this.documents.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    return {
      id: documentId,
      content: document.content,
      version: document.version,
      lastModified: document.lastModified,
      metadata: document.metadata,
      activeUsers: Array.from(document.activeUsers),
      timestamp: Date.now()
    };
  }

  /**
   * Restore document from snapshot
   */
  restoreSnapshot(snapshot) {
    const document = {
      id: snapshot.id,
      content: snapshot.content,
      version: snapshot.version,
      lastModified: snapshot.lastModified,
      metadata: snapshot.metadata || {},
      activeUsers: new Set(snapshot.activeUsers || []),
      pendingOperations: [],
      history: []
    };

    this.documents.set(snapshot.id, document);
    this.operations.set(snapshot.id, []);
    this.subscribers.set(snapshot.id, new Set());

    this.logger.info(`Restored document from snapshot: ${snapshot.id}`);
    return document;
  }

  /**
   * Get synchronization statistics
   */
  getStats() {
    const documents = Array.from(this.documents.values());
    const totalOperations = Array.from(this.operations.values())
      .reduce((sum, ops) => sum + ops.length, 0);

    return {
      documentsCount: documents.length,
      totalActiveUsers: documents.reduce((sum, doc) => sum + doc.activeUsers.size, 0),
      totalOperations,
      averageOperationsPerDocument: documents.length > 0 ? totalOperations / documents.length : 0,
      documents: documents.map(doc => ({
        id: doc.id,
        version: doc.version,
        activeUsers: doc.activeUsers.size,
        lastModified: doc.lastModified,
        contentSize: doc.content.length
      }))
    };
  }
}

module.exports = DocumentSynchronizer;