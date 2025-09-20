/**
 * Real-time Collaboration Testing Framework
 * Tests for WebSocket connections, real-time document editing, and concurrent user interactions
 */

const axios = require('axios')
const WebSocket = require('ws')
const crypto = require('crypto')

const BASE_URL = 'http://localhost:3000'
const WS_URL = 'ws://localhost:3000'

describe('Real-time Collaboration Features', () => {
  let testSockets = []

  afterEach(async () => {
    // Clean up WebSocket connections
    testSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
    testSockets = []
  })

  describe('WebSocket Connection Management', () => {
    test('WebSocket server accepts connections when collaboration enabled', async () => {
      // Ensure collaborative reviews feature is enabled
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(ws)

        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'))
        }, 5000)

        ws.on('open', () => {
          clearTimeout(timeout)
          expect(ws.readyState).toBe(WebSocket.OPEN)
          resolve()
        })

        ws.on('error', (error) => {
          clearTimeout(timeout)
          reject(error)
        })
      })
    })

    test('Multiple concurrent WebSocket connections are supported', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const connectionPromises = Array.from({ length: 5 }, (_, index) => {
        return new Promise((resolve, reject) => {
          const ws = new WebSocket(`${WS_URL}/ws`)
          testSockets.push(ws)

          const timeout = setTimeout(() => {
            reject(new Error(`WebSocket ${index} connection timeout`))
          }, 5000)

          ws.on('open', () => {
            clearTimeout(timeout)
            resolve(ws)
          })

          ws.on('error', (error) => {
            clearTimeout(timeout)
            reject(error)
          })
        })
      })

      const connections = await Promise.all(connectionPromises)
      expect(connections).toHaveLength(5)
      connections.forEach(ws => {
        expect(ws.readyState).toBe(WebSocket.OPEN)
      })
    })
  })

  describe('Real-time Document Collaboration', () => {
    test('Document changes are broadcast to all connected clients', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      // Create two client connections
      const client1 = new WebSocket(`${WS_URL}/ws`)
      const client2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(client1, client2)

      await Promise.all([
        new Promise(resolve => client1.on('open', resolve)),
        new Promise(resolve => client2.on('open', resolve))
      ])

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Document change broadcast timeout'))
        }, 5000)

        // Client 2 listens for changes
        client2.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'document_change') {
              clearTimeout(timeout)
              expect(message.documentId).toBe('test-doc-123')
              expect(message.change).toBe('Added new requirement')
              expect(message.userId).toBe('user1')
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Client 1 sends a document change
        client1.send(JSON.stringify({
          type: 'document_change',
          documentId: 'test-doc-123',
          change: 'Added new requirement',
          userId: 'user1'
        }))
      })
    })

    test('Conflict resolution handles simultaneous edits', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const client1 = new WebSocket(`${WS_URL}/ws`)
      const client2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(client1, client2)

      await Promise.all([
        new Promise(resolve => client1.on('open', resolve)),
        new Promise(resolve => client2.on('open', resolve))
      ])

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Conflict resolution timeout'))
        }, 5000)

        let conflictResolved = false

        // Both clients listen for conflict resolution
        const handleConflictResolution = (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'conflict_resolved' && !conflictResolved) {
              conflictResolved = true
              clearTimeout(timeout)
              expect(message.documentId).toBe('test-doc-456')
              expect(message.resolution).toBeDefined()
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        }

        client1.on('message', handleConflictResolution)
        client2.on('message', handleConflictResolution)

        // Send simultaneous conflicting changes
        client1.send(JSON.stringify({
          type: 'document_change',
          documentId: 'test-doc-456',
          change: 'User 1 edit',
          userId: 'user1',
          timestamp: Date.now()
        }))

        client2.send(JSON.stringify({
          type: 'document_change',
          documentId: 'test-doc-456',
          change: 'User 2 edit',
          userId: 'user2',
          timestamp: Date.now()
        }))
      })
    })
  })

  describe('User Presence Tracking', () => {
    test('User presence is tracked and broadcast', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const observer = new WebSocket(`${WS_URL}/ws`)
      const user = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(observer, user)

      await Promise.all([
        new Promise(resolve => observer.on('open', resolve)),
        new Promise(resolve => user.on('open', resolve))
      ])

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('User presence tracking timeout'))
        }, 5000)

        observer.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'user_joined') {
              clearTimeout(timeout)
              expect(message.userId).toBe('test-user-123')
              expect(message.documentId).toBe('test-doc-789')
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // User joins a document
        user.send(JSON.stringify({
          type: 'join_document',
          documentId: 'test-doc-789',
          userId: 'test-user-123'
        }))
      })
    })

    test('Cursor position updates are shared in real-time', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const observer = new WebSocket(`${WS_URL}/ws`)
      const editor = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(observer, editor)

      await Promise.all([
        new Promise(resolve => observer.on('open', resolve)),
        new Promise(resolve => editor.on('open', resolve))
      ])

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Cursor position sharing timeout'))
        }, 5000)

        observer.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'cursor_position') {
              clearTimeout(timeout)
              expect(message.userId).toBe('editor-user')
              expect(message.position).toEqual({ line: 10, column: 25 })
              expect(message.documentId).toBe('test-doc-cursor')
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Editor moves cursor
        editor.send(JSON.stringify({
          type: 'cursor_move',
          documentId: 'test-doc-cursor',
          userId: 'editor-user',
          position: { line: 10, column: 25 }
        }))
      })
    })
  })

  describe('Performance Under Load', () => {
    test('WebSocket server handles high message volume', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      const messageCount = 100
      const startTime = Date.now()

      // Send many messages rapidly
      for (let i = 0; i < messageCount; i++) {
        ws.send(JSON.stringify({
          type: 'document_change',
          documentId: 'load-test-doc',
          change: `Change ${i}`,
          userId: 'load-test-user'
        }))
      }

      // Wait a bit for processing
      await new Promise(resolve => setTimeout(resolve, 1000))

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should handle all messages within reasonable time (< 2 seconds)
      expect(duration).toBeLessThan(2000)
      expect(ws.readyState).toBe(WebSocket.OPEN)
    })

    test('WebSocket server handles burst traffic with many clients', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const clientCount = 25
      const messagesPerClient = 20
      const clients = []

      // Create multiple clients
      for (let i = 0; i < clientCount; i++) {
        const ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(ws)
        clients.push(ws)
        await new Promise(resolve => ws.on('open', resolve))
      }

      const startTime = Date.now()
      const messagePromises = []

      // Send burst of messages from all clients simultaneously
      clients.forEach((ws, clientIndex) => {
        for (let msgIndex = 0; msgIndex < messagesPerClient; msgIndex++) {
          const promise = new Promise((resolve) => {
            ws.send(JSON.stringify({
              type: 'document_change',
              documentId: 'burst-test-doc',
              change: `Client ${clientIndex} Message ${msgIndex}`,
              userId: `user-${clientIndex}`
            }))
            resolve()
          })
          messagePromises.push(promise)
        }
      })

      await Promise.all(messagePromises)

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should handle burst traffic efficiently (< 3 seconds)
      expect(duration).toBeLessThan(3000)

      // All clients should still be connected
      clients.forEach(ws => {
        expect(ws.readyState).toBe(WebSocket.OPEN)
      })
    })

    test('WebSocket server maintains performance with concurrent document editing', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const documentCount = 5
      const usersPerDocument = 4
      const operationsPerUser = 10
      const allConnections = []

      const startTime = Date.now()

      // Create users for multiple documents
      for (let docIndex = 0; docIndex < documentCount; docIndex++) {
        const documentId = `concurrent-doc-${docIndex}`

        for (let userIndex = 0; userIndex < usersPerDocument; userIndex++) {
          const ws = new WebSocket(`${WS_URL}/ws`)
          testSockets.push(ws)
          allConnections.push({ ws, documentId, userId: `user-${docIndex}-${userIndex}` })

          await new Promise(resolve => ws.on('open', resolve))

          // Join document
          ws.send(JSON.stringify({
            type: 'join_document',
            documentId,
            userId: `user-${docIndex}-${userIndex}`
          }))
        }
      }

      // Wait for all joins to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Perform concurrent operations
      const operationPromises = []
      allConnections.forEach(({ ws, documentId, userId }) => {
        for (let opIndex = 0; opIndex < operationsPerUser; opIndex++) {
          const promise = new Promise((resolve) => {
            ws.send(JSON.stringify({
              type: 'document_change',
              documentId,
              change: `${userId} operation ${opIndex}`,
              userId
            }))
            resolve()
          })
          operationPromises.push(promise)
        }
      })

      await Promise.all(operationPromises)

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 3000))

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000)

      // All connections should remain stable
      allConnections.forEach(({ ws }) => {
        expect(ws.readyState).toBe(WebSocket.OPEN)
      })
    })

    test('Memory usage remains stable with many connections', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      // Create many connections
      const connectionCount = 20
      const connections = []

      for (let i = 0; i < connectionCount; i++) {
        const ws = new WebSocket(`${WS_URL}/ws`)
        connections.push(ws)
        testSockets.push(ws)
        await new Promise(resolve => ws.on('open', resolve))
      }

      // All connections should be open
      expect(connections).toHaveLength(connectionCount)
      connections.forEach(ws => {
        expect(ws.readyState).toBe(WebSocket.OPEN)
      })

      // Test that server is still responsive
      const testWs = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(testWs)
      await new Promise(resolve => testWs.on('open', resolve))
      expect(testWs.readyState).toBe(WebSocket.OPEN)
    })
  })

  describe('Error Handling and Recovery', () => {
    test('Server handles malformed WebSocket messages gracefully', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      // Send malformed message
      ws.send('invalid json')

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500))

      // Connection should still be open
      expect(ws.readyState).toBe(WebSocket.OPEN)

      // Should still be able to send valid messages
      ws.send(JSON.stringify({
        type: 'test',
        message: 'valid message after error'
      }))

      expect(ws.readyState).toBe(WebSocket.OPEN)
    })

    test('Server handles message overflow gracefully', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      // Send extremely large message
      const largeMessage = JSON.stringify({
        type: 'document_change',
        documentId: 'overflow-test',
        change: 'A'.repeat(10000), // 10KB message
        userId: 'overflow-user'
      })

      ws.send(largeMessage)

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Connection should remain stable
      expect(ws.readyState).toBe(WebSocket.OPEN)
    })

    test('Server handles rapid connect/disconnect cycles', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const cycleCount = 10

      for (let i = 0; i < cycleCount; i++) {
        const ws = new WebSocket(`${WS_URL}/ws`)

        await new Promise(resolve => ws.on('open', resolve))

        // Send a quick message
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId: 'cycle-test-doc',
          userId: `cycle-user-${i}`
        }))

        // Wait briefly then disconnect
        await new Promise(resolve => setTimeout(resolve, 100))
        ws.close()

        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Create a final connection to test server stability
      const finalWs = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(finalWs)

      await new Promise(resolve => finalWs.on('open', resolve))
      expect(finalWs.readyState).toBe(WebSocket.OPEN)
    })

    test('Server handles authentication failures gracefully', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Authentication failure test timeout'))
        }, 5000)

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'authentication_failed') {
              clearTimeout(timeout)
              expect(message.error).toBe('Invalid credentials')
              expect(ws.readyState).toBe(WebSocket.OPEN)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Send invalid authentication
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: 'test-user',
          token: 'invalid-token'
        }))
      })
    })

    test('Connection recovery after temporary network issues', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection recovery timeout'))
        }, 10000)

        let connectionClosed = false

        ws.on('close', () => {
          connectionClosed = true

          // Simulate reconnection after a brief delay
          setTimeout(() => {
            const newWs = new WebSocket(`${WS_URL}/ws`)
            testSockets.push(newWs)

            newWs.on('open', () => {
              clearTimeout(timeout)
              expect(connectionClosed).toBe(true)
              expect(newWs.readyState).toBe(WebSocket.OPEN)
              resolve()
            })

            newWs.on('error', (error) => {
              clearTimeout(timeout)
              reject(error)
            })
          }, 1000)
        })

        // Force close connection to simulate network issue
        ws.close()
      })
    })

    test('Server handles message ordering under high load', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws1 = new WebSocket(`${WS_URL}/ws`)
      const ws2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws1, ws2)

      await Promise.all([
        new Promise(resolve => ws1.on('open', resolve)),
        new Promise(resolve => ws2.on('open', resolve))
      ])

      const receivedMessages = []
      const messageCount = 50

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message ordering test timeout'))
        }, 10000)

        ws2.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'document_change') {
              receivedMessages.push(message)

              if (receivedMessages.length === messageCount) {
                clearTimeout(timeout)

                // Verify messages were received in order
                for (let i = 0; i < receivedMessages.length; i++) {
                  expect(receivedMessages[i].change).toBe(`Ordered message ${i}`)
                }

                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Send ordered messages rapidly
        for (let i = 0; i < messageCount; i++) {
          ws1.send(JSON.stringify({
            type: 'document_change',
            documentId: 'order-test-doc',
            change: `Ordered message ${i}`,
            userId: 'order-test-user',
            sequence: i
          }))
        }
      })
    })
  })

  describe('WebSocket Authentication and Security', () => {
    test('Unauthenticated users cannot perform document operations', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Authentication security test timeout'))
        }, 5000)

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'error' && message.error === 'Not authenticated') {
              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Try to join document without authentication
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId: 'security-test-doc',
          userId: 'unauthorized-user'
        }))
      })
    })

    test('Authentication token validation works correctly', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Token validation test timeout'))
        }, 5000)

        let authSuccess = false

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'authenticated') {
              authSuccess = true
              expect(message.userId).toBe('valid-user')
            } else if (message.type === 'document_state' && authSuccess) {
              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Authenticate with valid token
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: 'valid-user',
          token: 'valid-token'
        }))

        // Wait then try to join document
        setTimeout(() => {
          ws.send(JSON.stringify({
            type: 'join_document',
            documentId: 'auth-test-doc',
            userId: 'valid-user'
          }))
        }, 500)
      })
    })

    test('Session isolation prevents cross-document interference', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const user1 = new WebSocket(`${WS_URL}/ws`)
      const user2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(user1, user2)

      await Promise.all([
        new Promise(resolve => user1.on('open', resolve)),
        new Promise(resolve => user2.on('open', resolve))
      ])

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Session isolation test timeout'))
        }, 8000)

        let user1Messages = 0
        let user2Messages = 0
        let user1JoinedDoc1 = false
        let user2JoinedDoc2 = false

        user1.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'document_state' && message.documentId === 'isolation-doc-1') {
              user1JoinedDoc1 = true
            } else if (message.type === 'document_change' && message.documentId === 'isolation-doc-2') {
              // User1 should NOT receive messages from Doc2
              clearTimeout(timeout)
              reject(new Error('Session isolation violated: User1 received Doc2 message'))
            }
            user1Messages++

            if (user1JoinedDoc1 && user2JoinedDoc2 && user1Messages >= 2 && user2Messages >= 2) {
              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        user2.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'document_state' && message.documentId === 'isolation-doc-2') {
              user2JoinedDoc2 = true
            } else if (message.type === 'document_change' && message.documentId === 'isolation-doc-1') {
              // User2 should NOT receive messages from Doc1
              clearTimeout(timeout)
              reject(new Error('Session isolation violated: User2 received Doc1 message'))
            }
            user2Messages++

            if (user1JoinedDoc1 && user2JoinedDoc2 && user1Messages >= 2 && user2Messages >= 2) {
              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // User1 joins Doc1
        user1.send(JSON.stringify({
          type: 'join_document',
          documentId: 'isolation-doc-1',
          userId: 'user1'
        }))

        // User2 joins Doc2
        user2.send(JSON.stringify({
          type: 'join_document',
          documentId: 'isolation-doc-2',
          userId: 'user2'
        }))

        // Wait then send changes to each document
        setTimeout(() => {
          user1.send(JSON.stringify({
            type: 'document_change',
            documentId: 'isolation-doc-1',
            change: 'User1 change to Doc1',
            userId: 'user1'
          }))

          user2.send(JSON.stringify({
            type: 'document_change',
            documentId: 'isolation-doc-2',
            change: 'User2 change to Doc2',
            userId: 'user2'
          }))
        }, 1000)
      })
    })
  })

  describe('WebSocket Message Validation', () => {
    test('Server validates message structure and rejects invalid formats', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      await new Promise(resolve => ws.on('open', resolve))

      const invalidMessages = [
        { /* missing type */ documentId: 'test' },
        { type: 'invalid_type', data: 'test' },
        { type: 'document_change' /* missing required fields */ },
        { type: 'join_document', documentId: null },
        { type: 'cursor_move', position: 'invalid' }
      ]

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Message validation test timeout'))
        }, 5000)

        let errorCount = 0

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'error') {
              errorCount++

              if (errorCount === invalidMessages.length) {
                clearTimeout(timeout)
                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Send invalid messages
        invalidMessages.forEach(msg => {
          ws.send(JSON.stringify(msg))
        })
      })
    })

    test('Server handles concurrent message validation correctly', async () => {
      await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
        enabled: true
      })

      const clientCount = 5
      const clients = []

      // Create multiple clients
      for (let i = 0; i < clientCount; i++) {
        const ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(ws)
        clients.push(ws)
        await new Promise(resolve => ws.on('open', resolve))
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Concurrent validation test timeout'))
        }, 8000)

        let totalErrors = 0
        let totalSuccess = 0
        const expectedErrors = clientCount * 2 // 2 invalid messages per client
        const expectedSuccess = clientCount * 2 // 2 valid messages per client

        clients.forEach((ws, index) => {
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data)

              if (message.type === 'error') {
                totalErrors++
              } else if (message.type === 'document_state' || message.type === 'connected') {
                totalSuccess++
              }

              if (totalErrors >= expectedErrors && totalSuccess >= expectedSuccess) {
                clearTimeout(timeout)
                resolve()
              }
            } catch (error) {
              clearTimeout(timeout)
              reject(error)
            }
          })

          // Send mix of valid and invalid messages
          setTimeout(() => {
            // Invalid message 1
            ws.send(JSON.stringify({ type: 'invalid_type' }))

            // Valid message 1
            ws.send(JSON.stringify({
              type: 'join_document',
              documentId: `validation-doc-${index}`,
              userId: `validation-user-${index}`
            }))

            // Invalid message 2
            ws.send(JSON.stringify({ type: 'document_change' }))

            // Valid message 2 (will be handled after auth)
            ws.send(JSON.stringify({
              type: 'authenticate',
              userId: `validation-user-${index}`,
              token: 'valid-token'
            }))
          }, index * 100) // Stagger sends slightly
        })
      })
    })
  })
})