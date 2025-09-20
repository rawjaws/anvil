/**
 * Frontend-Backend Real-time Integration Tests
 * Comprehensive integration tests for real-time collaboration between frontend and backend components
 */

const axios = require('axios')
const WebSocket = require('ws')
const { JSDOM } = require('jsdom')

const BASE_URL = 'http://localhost:3000'
const WS_URL = 'ws://localhost:3000'

// Mock DOM environment for frontend integration testing
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = window
global.document = window.document
global.navigator = window.navigator

describe('Frontend-Backend Real-time Integration', () => {
  let testSockets = []
  let mockFrontendClients = []

  beforeEach(async () => {
    // Ensure collaborative reviews feature is enabled
    await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
      enabled: true
    })

    // Clear mock clients
    mockFrontendClients = []
  })

  afterEach(async () => {
    // Cleanup WebSocket connections
    testSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
    testSockets = []

    // Cleanup mock frontend clients
    mockFrontendClients.forEach(client => {
      if (client.cleanup) {
        client.cleanup()
      }
    })
    mockFrontendClients = []
  })

  describe('WebSocket Client-Server Integration', () => {
    test('Frontend WebSocket client connects and synchronizes with backend', async () => {
      const documentId = 'integration-test-doc-1'

      // Simulate frontend WebSocket client
      const mockFrontendClient = {
        connectionState: 'disconnected',
        documentState: null,
        collaborators: [],
        operations: [],

        connect: function() {
          this.ws = new WebSocket(`${WS_URL}/ws`)
          testSockets.push(this.ws)

          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Frontend client connection timeout'))
            }, 5000)

            this.ws.on('open', () => {
              this.connectionState = 'connected'
              clearTimeout(timeout)
              resolve()
            })

            this.ws.on('message', (data) => {
              try {
                const message = JSON.parse(data)
                this.handleMessage(message)
              } catch (error) {
                console.error('Frontend client message parsing error:', error)
              }
            })

            this.ws.on('close', () => {
              this.connectionState = 'disconnected'
            })

            this.ws.on('error', (error) => {
              clearTimeout(timeout)
              reject(error)
            })
          })
        },

        handleMessage: function(message) {
          switch (message.type) {
            case 'connected':
              this.clientId = message.clientId
              break
            case 'document_state':
              this.documentState = message
              break
            case 'user_joined':
              this.collaborators.push(message.userId)
              break
            case 'user_left':
              this.collaborators = this.collaborators.filter(id => id !== message.userId)
              break
            case 'document_change':
              this.operations.push(message)
              break
          }
        },

        authenticate: function(userId) {
          return new Promise((resolve) => {
            this.ws.send(JSON.stringify({
              type: 'authenticate',
              userId,
              token: 'valid-token'
            }))

            const handler = (data) => {
              const message = JSON.parse(data)
              if (message.type === 'authenticated') {
                this.ws.off('message', handler)
                resolve()
              }
            }

            this.ws.on('message', handler)
          })
        },

        joinDocument: function(documentId, userId) {
          this.ws.send(JSON.stringify({
            type: 'join_document',
            documentId,
            userId
          }))
        },

        sendOperation: function(documentId, operation, userId) {
          this.ws.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: operation,
            userId
          }))
        }
      }

      mockFrontendClients.push(mockFrontendClient)

      // Test the integration flow
      await mockFrontendClient.connect()
      expect(mockFrontendClient.connectionState).toBe('connected')

      await mockFrontendClient.authenticate('integration-user-1')
      mockFrontendClient.joinDocument(documentId, 'integration-user-1')

      // Wait for document state synchronization
      await new Promise(resolve => setTimeout(resolve, 1000))

      expect(mockFrontendClient.documentState).toBeTruthy()
      expect(mockFrontendClient.documentState.documentId).toBe(documentId)
    })

    test('Multiple frontend clients synchronize operations in real-time', async () => {
      const documentId = 'integration-test-doc-multi'

      // Create multiple frontend clients
      const clients = []
      for (let i = 0; i < 3; i++) {
        const client = createMockFrontendClient()
        mockFrontendClients.push(client)
        clients.push(client)

        await client.connect()
        await client.authenticate(`multi-user-${i}`)
        client.joinDocument(documentId, `multi-user-${i}`)
      }

      // Wait for all clients to sync
      await new Promise(resolve => setTimeout(resolve, 1000))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Multi-client sync timeout'))
        }, 8000)

        let operationsReceived = 0
        const expectedOperations = 6 // 3 operations * 2 other clients each

        clients.forEach((client, index) => {
          const originalHandler = client.handleMessage
          client.handleMessage = function(message) {
            originalHandler.call(this, message)

            if (message.type === 'document_change' && message.userId !== `multi-user-${index}`) {
              operationsReceived++

              if (operationsReceived >= expectedOperations) {
                clearTimeout(timeout)
                resolve()
              }
            }
          }
        })

        // Send operations from each client
        setTimeout(() => {
          clients.forEach((client, index) => {
            client.sendOperation(documentId, {
              type: 'insert',
              position: index * 10,
              text: `Client ${index} text`
            }, `multi-user-${index}`)
          })
        }, 500)
      })
    })
  })

  describe('HTTP API and WebSocket Integration', () => {
    test('HTTP document creation triggers WebSocket notifications', async () => {
      const documentId = 'http-ws-integration-doc'

      // Setup WebSocket client to monitor notifications
      const client = createMockFrontendClient()
      mockFrontendClients.push(client)

      await client.connect()
      await client.authenticate('http-ws-user')

      return new Promise(async (resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HTTP-WS integration timeout'))
        }, 6000)

        client.handleMessage = function(message) {
          if (message.type === 'document_created' && message.documentId === documentId) {
            expect(message.documentId).toBe(documentId)
            expect(message.author).toBe('http-creator')
            clearTimeout(timeout)
            resolve()
          }
        }

        // Create document via HTTP API
        await axios.post(`${BASE_URL}/api/documents`, {
          id: documentId,
          title: 'HTTP-WS Integration Test',
          content: 'Content created via HTTP',
          author: 'http-creator'
        })

        // Subscribe to document notifications
        client.joinDocument(documentId, 'http-ws-user')
      })
    })

    test('WebSocket operations persist through HTTP API', async () => {
      const documentId = 'ws-http-persist-doc'

      // Create document via WebSocket
      const client = createMockFrontendClient()
      mockFrontendClients.push(client)

      await client.connect()
      await client.authenticate('ws-http-user')
      client.joinDocument(documentId, 'ws-http-user')

      // Send operations via WebSocket
      const operations = [
        { type: 'insert', position: 0, text: 'WebSocket: ' },
        { type: 'insert', position: 10, text: 'Real-time ' },
        { type: 'insert', position: 20, text: 'Collaboration' }
      ]

      for (const op of operations) {
        client.sendOperation(documentId, op, 'ws-http-user')
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Wait for operations to process
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify persistence via HTTP API
      const response = await axios.get(`${BASE_URL}/api/documents/${documentId}`)
      expect(response.status).toBe(200)
      expect(response.data.content).toContain('WebSocket:')
      expect(response.data.content).toContain('Real-time')
      expect(response.data.content).toContain('Collaboration')
    })

    test('HTTP API permissions affect WebSocket operations', async () => {
      const documentId = 'permission-integration-doc'

      // Create document with specific permissions via HTTP
      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        title: 'Permission Test',
        content: 'Initial content',
        author: 'owner',
        permissions: {
          'readonly-user': 'read',
          'editor-user': 'write'
        }
      })

      // Test WebSocket operations with different permission levels
      const readonlyClient = createMockFrontendClient()
      const editorClient = createMockFrontendClient()
      mockFrontendClients.push(readonlyClient, editorClient)

      await readonlyClient.connect()
      await editorClient.connect()

      await readonlyClient.authenticate('readonly-user')
      await editorClient.authenticate('editor-user')

      readonlyClient.joinDocument(documentId, 'readonly-user')
      editorClient.joinDocument(documentId, 'editor-user')

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Permission integration timeout'))
        }, 6000)

        let permissionErrorReceived = false
        let editorOperationReceived = false

        readonlyClient.handleMessage = function(message) {
          if (message.type === 'error' && message.error.includes('permission')) {
            permissionErrorReceived = true
          }
          if (message.type === 'document_change' && message.userId === 'editor-user') {
            editorOperationReceived = true
          }

          if (permissionErrorReceived && editorOperationReceived) {
            clearTimeout(timeout)
            resolve()
          }
        }

        editorClient.handleMessage = function(message) {
          if (message.type === 'document_change' && message.userId === 'editor-user') {
            editorOperationReceived = true
          }

          if (permissionErrorReceived && editorOperationReceived) {
            clearTimeout(timeout)
            resolve()
          }
        }

        setTimeout(() => {
          // Readonly user attempts to edit (should fail)
          readonlyClient.sendOperation(documentId, {
            type: 'insert',
            position: 0,
            text: 'Unauthorized: '
          }, 'readonly-user')

          // Editor user edits (should succeed)
          editorClient.sendOperation(documentId, {
            type: 'insert',
            position: 0,
            text: 'Authorized: '
          }, 'editor-user')
        }, 500)
      })
    })
  })

  describe('Frontend State Management Integration', () => {
    test('Frontend state synchronizes with backend document state', async () => {
      const documentId = 'state-sync-doc'

      // Mock frontend state manager
      const mockStateManager = {
        state: {
          document: null,
          collaborators: [],
          operations: [],
          cursor: null,
          selection: null
        },

        updateDocument: function(documentData) {
          this.state.document = documentData
        },

        addCollaborator: function(userId, metadata) {
          this.state.collaborators.push({ userId, metadata })
        },

        removeCollaborator: function(userId) {
          this.state.collaborators = this.state.collaborators.filter(c => c.userId !== userId)
        },

        applyOperation: function(operation) {
          this.state.operations.push(operation)
          // Mock applying operation to document content
          if (this.state.document && operation.type === 'insert') {
            this.state.document.content = this.state.document.content || ''
            const pos = operation.position || 0
            this.state.document.content =
              this.state.document.content.slice(0, pos) +
              operation.text +
              this.state.document.content.slice(pos)
          }
        },

        updateCursor: function(userId, cursor) {
          const collaborator = this.state.collaborators.find(c => c.userId === userId)
          if (collaborator) {
            collaborator.cursor = cursor
          }
        }
      }

      const client = createMockFrontendClient()
      mockFrontendClients.push(client)

      // Integrate state manager with WebSocket client
      const originalHandler = client.handleMessage
      client.handleMessage = function(message) {
        originalHandler.call(this, message)

        switch (message.type) {
          case 'document_state':
            mockStateManager.updateDocument(message)
            break
          case 'user_joined':
            mockStateManager.addCollaborator(message.userId, message.userMetadata)
            break
          case 'user_left':
            mockStateManager.removeCollaborator(message.userId)
            break
          case 'document_change':
            mockStateManager.applyOperation(message.change)
            break
          case 'cursor_position':
            mockStateManager.updateCursor(message.userId, message.position)
            break
        }
      }

      await client.connect()
      await client.authenticate('state-sync-user')
      client.joinDocument(documentId, 'state-sync-user')

      // Wait for initial synchronization
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Verify state synchronization
      expect(mockStateManager.state.document).toBeTruthy()
      expect(mockStateManager.state.document.documentId).toBe(documentId)

      // Send operation and verify state update
      client.sendOperation(documentId, {
        type: 'insert',
        position: 0,
        text: 'State sync test: '
      }, 'state-sync-user')

      await new Promise(resolve => setTimeout(resolve, 500))

      expect(mockStateManager.state.operations.length).toBeGreaterThan(0)
      expect(mockStateManager.state.document.content).toContain('State sync test:')
    })

    test('Frontend optimistic updates with server reconciliation', async () => {
      const documentId = 'optimistic-update-doc'

      const mockOptimisticManager = {
        pendingOperations: [],
        acknowledgedOperations: [],

        applyOptimistically: function(operation) {
          operation.id = Date.now() + Math.random()
          operation.pending = true
          this.pendingOperations.push(operation)
          return operation.id
        },

        acknowledgeOperation: function(operationId) {
          const opIndex = this.pendingOperations.findIndex(op => op.id === operationId)
          if (opIndex !== -1) {
            const op = this.pendingOperations.splice(opIndex, 1)[0]
            op.pending = false
            this.acknowledgedOperations.push(op)
          }
        },

        rollbackOperation: function(operationId) {
          const opIndex = this.pendingOperations.findIndex(op => op.id === operationId)
          if (opIndex !== -1) {
            this.pendingOperations.splice(opIndex, 1)
          }
        }
      }

      const client = createMockFrontendClient()
      mockFrontendClients.push(client)

      await client.connect()
      await client.authenticate('optimistic-user')
      client.joinDocument(documentId, 'optimistic-user')

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Optimistic update timeout'))
        }, 5000)

        let operationAcknowledged = false

        client.handleMessage = function(message) {
          if (message.type === 'operation_acknowledged' && message.operationId) {
            mockOptimisticManager.acknowledgeOperation(message.operationId)
            operationAcknowledged = true

            expect(mockOptimisticManager.acknowledgedOperations.length).toBe(1)
            expect(mockOptimisticManager.pendingOperations.length).toBe(0)

            clearTimeout(timeout)
            resolve()
          }
        }

        // Apply optimistic update
        const operationId = mockOptimisticManager.applyOptimistically({
          type: 'insert',
          position: 0,
          text: 'Optimistic: '
        })

        expect(mockOptimisticManager.pendingOperations.length).toBe(1)

        // Send to server
        client.sendOperation(documentId, {
          type: 'insert',
          position: 0,
          text: 'Optimistic: ',
          clientOperationId: operationId
        }, 'optimistic-user')
      })
    })
  })

  describe('Error Handling and Recovery Integration', () => {
    test('Frontend gracefully handles backend disconnection and reconnection', async () => {
      const documentId = 'reconnection-test-doc'

      const mockReconnectManager = {
        isConnected: false,
        reconnectAttempts: 0,
        maxReconnectAttempts: 3,
        queuedOperations: [],

        onDisconnect: function() {
          this.isConnected = false
        },

        onReconnect: function() {
          this.isConnected = true
          this.reconnectAttempts = 0
        },

        queueOperation: function(operation) {
          this.queuedOperations.push(operation)
        },

        flushQueue: function() {
          const operations = [...this.queuedOperations]
          this.queuedOperations = []
          return operations
        }
      }

      const client = createMockFrontendClient()
      mockFrontendClients.push(client)

      await client.connect()
      mockReconnectManager.isConnected = true

      const originalClose = client.ws.close
      client.ws.close = function() {
        mockReconnectManager.onDisconnect()
        originalClose.call(this)
      }

      // Simulate disconnection
      client.ws.close()

      expect(mockReconnectManager.isConnected).toBe(false)

      // Queue operation while disconnected
      mockReconnectManager.queueOperation({
        type: 'insert',
        position: 0,
        text: 'Queued operation'
      })

      expect(mockReconnectManager.queuedOperations.length).toBe(1)

      // Simulate reconnection
      await client.connect()
      mockReconnectManager.onReconnect()

      expect(mockReconnectManager.isConnected).toBe(true)

      // Flush queued operations
      const queuedOps = mockReconnectManager.flushQueue()
      expect(queuedOps.length).toBe(1)
      expect(mockReconnectManager.queuedOperations.length).toBe(0)
    })

    test('Frontend handles server-side operation conflicts', async () => {
      const documentId = 'conflict-resolution-doc'

      const mockConflictResolver = {
        conflicts: [],
        resolutions: [],

        handleConflict: function(conflict) {
          this.conflicts.push(conflict)

          // Mock conflict resolution strategy
          const resolution = {
            conflictId: conflict.id,
            strategy: 'server-wins',
            resolvedContent: conflict.serverVersion
          }

          this.resolutions.push(resolution)
          return resolution
        }
      }

      const client = createMockFrontendClient()
      mockFrontendClients.push(client)

      await client.connect()
      await client.authenticate('conflict-user')
      client.joinDocument(documentId, 'conflict-user')

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Conflict resolution timeout'))
        }, 5000)

        client.handleMessage = function(message) {
          if (message.type === 'conflict_detected') {
            const resolution = mockConflictResolver.handleConflict({
              id: message.conflictId,
              clientVersion: message.clientVersion,
              serverVersion: message.serverVersion
            })

            expect(mockConflictResolver.conflicts.length).toBe(1)
            expect(mockConflictResolver.resolutions.length).toBe(1)
            expect(resolution.strategy).toBe('server-wins')

            clearTimeout(timeout)
            resolve()
          }
        }

        // Send operation that might conflict
        client.sendOperation(documentId, {
          type: 'insert',
          position: 0,
          text: 'Potential conflict',
          version: 1 // Outdated version to trigger conflict
        }, 'conflict-user')
      })
    })
  })

  // Helper function to create mock frontend client
  function createMockFrontendClient() {
    return {
      connectionState: 'disconnected',
      documentState: null,
      collaborators: [],
      operations: [],

      connect: function() {
        this.ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(this.ws)

        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Frontend client connection timeout'))
          }, 5000)

          this.ws.on('open', () => {
            this.connectionState = 'connected'
            clearTimeout(timeout)
            resolve()
          })

          this.ws.on('message', (data) => {
            try {
              const message = JSON.parse(data)
              this.handleMessage(message)
            } catch (error) {
              console.error('Frontend client message parsing error:', error)
            }
          })

          this.ws.on('close', () => {
            this.connectionState = 'disconnected'
          })

          this.ws.on('error', (error) => {
            clearTimeout(timeout)
            reject(error)
          })
        })
      },

      handleMessage: function(message) {
        switch (message.type) {
          case 'connected':
            this.clientId = message.clientId
            break
          case 'document_state':
            this.documentState = message
            break
          case 'user_joined':
            this.collaborators.push(message.userId)
            break
          case 'user_left':
            this.collaborators = this.collaborators.filter(id => id !== message.userId)
            break
          case 'document_change':
            this.operations.push(message)
            break
        }
      },

      authenticate: function(userId) {
        return new Promise((resolve) => {
          this.ws.send(JSON.stringify({
            type: 'authenticate',
            userId,
            token: 'valid-token'
          }))

          const handler = (data) => {
            const message = JSON.parse(data)
            if (message.type === 'authenticated') {
              this.ws.off('message', handler)
              resolve()
            }
          }

          this.ws.on('message', handler)
        })
      },

      joinDocument: function(documentId, userId) {
        this.ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId
        }))
      },

      sendOperation: function(documentId, operation, userId) {
        this.ws.send(JSON.stringify({
          type: 'document_change',
          documentId,
          change: operation,
          userId
        }))
      },

      cleanup: function() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.close()
        }
      }
    }
  }
})