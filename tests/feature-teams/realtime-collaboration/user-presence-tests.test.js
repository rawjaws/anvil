/**
 * User Presence and Collaborative Features Tests
 * Comprehensive tests for user presence tracking, collaborative indicators, and real-time user interactions
 */

const axios = require('axios')
const WebSocket = require('ws')

const BASE_URL = 'http://localhost:3000'
const WS_URL = 'ws://localhost:3000'

describe('User Presence and Collaborative Features', () => {
  let testSockets = []

  beforeEach(async () => {
    // Ensure collaborative reviews feature is enabled for all tests
    await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
      enabled: true
    })
  })

  afterEach(async () => {
    // Clean up WebSocket connections
    testSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
    testSockets = []
  })

  describe('User Presence Tracking', () => {
    test('User presence is accurately tracked across multiple sessions', async () => {
      const documentId = 'test-presence-tracking'
      const users = ['alice', 'bob', 'charlie']
      const connections = []

      // Create multiple user connections
      for (const userId of users) {
        const ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(ws)
        connections.push({ ws, userId })

        await new Promise(resolve => ws.on('open', resolve))

        // Authenticate and join document
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId,
          token: 'valid-token'
        }))

        await new Promise(resolve => setTimeout(resolve, 100))

        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Presence tracking test timeout'))
        }, 8000)

        let presenceUpdates = 0
        const expectedUpdates = users.length * (users.length - 1) // Each user sees others join

        connections.forEach(({ ws, userId }) => {
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data)
              if (message.type === 'user_joined' && message.userId !== userId) {
                presenceUpdates++

                if (presenceUpdates >= expectedUpdates) {
                  clearTimeout(timeout)
                  resolve()
                }
              }
            } catch (error) {
              clearTimeout(timeout)
              reject(error)
            }
          })
        })
      })
    })

    test('User presence updates when users become active/inactive', async () => {
      const documentId = 'test-presence-activity'

      const user1 = new WebSocket(`${WS_URL}/ws`)
      const user2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(user1, user2)

      await Promise.all([
        new Promise(resolve => user1.on('open', resolve)),
        new Promise(resolve => user2.on('open', resolve))
      ])

      // Authenticate users
      user1.send(JSON.stringify({
        type: 'authenticate',
        userId: 'active-user',
        token: 'valid-token'
      }))

      user2.send(JSON.stringify({
        type: 'authenticate',
        userId: 'observer-user',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      // Both join document
      user1.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'active-user'
      }))

      user2.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'observer-user'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Activity presence test timeout'))
        }, 6000)

        let activityUpdatesReceived = 0

        user2.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'presence_update' && message.userId === 'active-user') {
              activityUpdatesReceived++

              if (activityUpdatesReceived >= 2) { // Active then inactive
                clearTimeout(timeout)
                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Simulate activity patterns
        setTimeout(() => {
          // Send activity update
          user1.send(JSON.stringify({
            type: 'user_activity',
            documentId,
            userId: 'active-user',
            activity: 'typing',
            timestamp: Date.now()
          }))
        }, 500)

        setTimeout(() => {
          // Send inactivity update
          user1.send(JSON.stringify({
            type: 'user_activity',
            documentId,
            userId: 'active-user',
            activity: 'idle',
            timestamp: Date.now()
          }))
        }, 2000)
      })
    })

    test('Presence information includes cursor position and selection', async () => {
      const documentId = 'test-presence-cursor'

      const editor = new WebSocket(`${WS_URL}/ws`)
      const observer = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(editor, observer)

      await Promise.all([
        new Promise(resolve => editor.on('open', resolve)),
        new Promise(resolve => observer.on('open', resolve))
      ])

      // Setup users
      editor.send(JSON.stringify({
        type: 'authenticate',
        userId: 'editor',
        token: 'valid-token'
      }))

      observer.send(JSON.stringify({
        type: 'authenticate',
        userId: 'observer',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      editor.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'editor'
      }))

      observer.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'observer'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Cursor presence test timeout'))
        }, 5000)

        let cursorUpdatesReceived = 0

        observer.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'cursor_position' && message.userId === 'editor') {
              cursorUpdatesReceived++
              expect(message.position).toBeDefined()
              expect(message.position.line).toBeDefined()
              expect(message.position.column).toBeDefined()

              if (cursorUpdatesReceived >= 2) {
                clearTimeout(timeout)
                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Send cursor movements
        setTimeout(() => {
          editor.send(JSON.stringify({
            type: 'cursor_move',
            documentId,
            userId: 'editor',
            position: { line: 1, column: 10 }
          }))
        }, 500)

        setTimeout(() => {
          editor.send(JSON.stringify({
            type: 'cursor_move',
            documentId,
            userId: 'editor',
            position: { line: 3, column: 25 }
          }))
        }, 1500)
      })
    })
  })

  describe('Collaborative Indicators', () => {
    test('Real-time typing indicators work correctly', async () => {
      const documentId = 'test-typing-indicators'

      const typist = new WebSocket(`${WS_URL}/ws`)
      const observer = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(typist, observer)

      await Promise.all([
        new Promise(resolve => typist.on('open', resolve)),
        new Promise(resolve => observer.on('open', resolve))
      ])

      // Setup connections
      typist.send(JSON.stringify({
        type: 'authenticate',
        userId: 'typist',
        token: 'valid-token'
      }))

      observer.send(JSON.stringify({
        type: 'authenticate',
        userId: 'observer',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      typist.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'typist'
      }))

      observer.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'observer'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Typing indicators test timeout'))
        }, 6000)

        let typingStates = []

        observer.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'user_typing' && message.userId === 'typist') {
              typingStates.push(message.isTyping)

              // We expect: true, false (start typing, stop typing)
              if (typingStates.length >= 2) {
                expect(typingStates[0]).toBe(true)
                expect(typingStates[1]).toBe(false)
                clearTimeout(timeout)
                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Simulate typing start and stop
        setTimeout(() => {
          typist.send(JSON.stringify({
            type: 'user_typing',
            documentId,
            userId: 'typist',
            isTyping: true
          }))
        }, 500)

        setTimeout(() => {
          typist.send(JSON.stringify({
            type: 'user_typing',
            documentId,
            userId: 'typist',
            isTyping: false
          }))
        }, 2000)
      })
    })

    test('Selection sharing across users', async () => {
      const documentId = 'test-selection-sharing'

      const selector = new WebSocket(`${WS_URL}/ws`)
      const observer = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(selector, observer)

      await Promise.all([
        new Promise(resolve => selector.on('open', resolve)),
        new Promise(resolve => observer.on('open', resolve))
      ])

      // Setup connections
      selector.send(JSON.stringify({
        type: 'authenticate',
        userId: 'selector',
        token: 'valid-token'
      }))

      observer.send(JSON.stringify({
        type: 'authenticate',
        userId: 'observer',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      selector.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'selector'
      }))

      observer.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'observer'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Selection sharing test timeout'))
        }, 5000)

        observer.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'selection_update' && message.userId === 'selector') {
              expect(message.selection).toBeDefined()
              expect(message.selection.start).toBeDefined()
              expect(message.selection.end).toBeDefined()
              expect(message.selection.start.line).toBe(2)
              expect(message.selection.start.column).toBe(5)
              expect(message.selection.end.line).toBe(2)
              expect(message.selection.end.column).toBe(15)

              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Send selection update
        setTimeout(() => {
          selector.send(JSON.stringify({
            type: 'selection_update',
            documentId,
            userId: 'selector',
            selection: {
              start: { line: 2, column: 5 },
              end: { line: 2, column: 15 }
            }
          }))
        }, 500)
      })
    })

    test('User avatar and metadata sharing', async () => {
      const documentId = 'test-user-metadata'

      const user1 = new WebSocket(`${WS_URL}/ws`)
      const user2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(user1, user2)

      await Promise.all([
        new Promise(resolve => user1.on('open', resolve)),
        new Promise(resolve => user2.on('open', resolve))
      ])

      // Authenticate with metadata
      user1.send(JSON.stringify({
        type: 'authenticate',
        userId: 'user-with-metadata',
        token: 'valid-token',
        metadata: {
          displayName: 'Alice Developer',
          avatar: 'https://example.com/avatar1.jpg',
          role: 'senior-developer',
          color: '#FF6B6B'
        }
      }))

      user2.send(JSON.stringify({
        type: 'authenticate',
        userId: 'metadata-observer',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      user1.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'user-with-metadata'
      }))

      user2.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'metadata-observer'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('User metadata test timeout'))
        }, 5000)

        user2.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'user_joined' && message.userId === 'user-with-metadata') {
              expect(message.userMetadata).toBeDefined()
              expect(message.userMetadata.displayName).toBe('Alice Developer')
              expect(message.userMetadata.avatar).toBe('https://example.com/avatar1.jpg')
              expect(message.userMetadata.role).toBe('senior-developer')
              expect(message.userMetadata.color).toBe('#FF6B6B')

              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })
      })
    })
  })

  describe('Collaborative Document State', () => {
    test('Document state synchronization across multiple users', async () => {
      const documentId = 'test-state-sync'

      // Create initial document
      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        title: 'Collaboration Test',
        content: 'Initial collaborative content',
        author: 'creator'
      })

      const users = ['sync-user-1', 'sync-user-2', 'sync-user-3']
      const connections = []

      // Setup multiple users
      for (const userId of users) {
        const ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(ws)
        connections.push({ ws, userId })

        await new Promise(resolve => ws.on('open', resolve))

        ws.send(JSON.stringify({
          type: 'authenticate',
          userId,
          token: 'valid-token'
        }))

        await new Promise(resolve => setTimeout(resolve, 100))

        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('State sync test timeout'))
        }, 8000)

        let stateReceived = 0
        const expectedStates = users.length

        connections.forEach(({ ws, userId }) => {
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data)

              if (message.type === 'document_state') {
                expect(message.documentId).toBe(documentId)
                expect(message.content).toBe('Initial collaborative content')
                expect(message.version).toBeDefined()
                expect(message.users).toContain(userId)

                stateReceived++

                if (stateReceived >= expectedStates) {
                  clearTimeout(timeout)
                  resolve()
                }
              }
            } catch (error) {
              clearTimeout(timeout)
              reject(error)
            }
          })
        })
      })
    })

    test('Conflict-free collaborative editing session', async () => {
      const documentId = 'test-conflict-free'

      const user1 = new WebSocket(`${WS_URL}/ws`)
      const user2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(user1, user2)

      await Promise.all([
        new Promise(resolve => user1.on('open', resolve)),
        new Promise(resolve => user2.on('open', resolve))
      ])

      // Setup users
      user1.send(JSON.stringify({
        type: 'authenticate',
        userId: 'editor-1',
        token: 'valid-token'
      }))

      user2.send(JSON.stringify({
        type: 'authenticate',
        userId: 'editor-2',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      user1.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'editor-1'
      }))

      user2.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'editor-2'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Conflict-free editing test timeout'))
        }, 10000)

        let changesReceived = 0
        let conflictsDetected = 0

        const handleMessage = (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'document_change') {
              changesReceived++
            } else if (message.type === 'conflict_detected') {
              conflictsDetected++
            }

            // After receiving both changes, verify no conflicts
            if (changesReceived >= 2) {
              setTimeout(() => {
                expect(conflictsDetected).toBe(0) // No conflicts should be detected
                clearTimeout(timeout)
                resolve()
              }, 1000)
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        }

        user1.on('message', handleMessage)
        user2.on('message', handleMessage)

        // Send non-conflicting changes
        setTimeout(() => {
          user1.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: {
              type: 'insert',
              position: 0,
              text: 'User1: '
            },
            userId: 'editor-1'
          }))
        }, 1000)

        setTimeout(() => {
          user2.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: {
              type: 'insert',
              position: 100,
              text: ' :User2'
            },
            userId: 'editor-2'
          }))
        }, 2000)
      })
    })
  })

  describe('Advanced Collaborative Features', () => {
    test('Collaborative undo/redo functionality', async () => {
      const documentId = 'test-collaborative-undo'

      const editor = new WebSocket(`${WS_URL}/ws`)
      const observer = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(editor, observer)

      await Promise.all([
        new Promise(resolve => editor.on('open', resolve)),
        new Promise(resolve => observer.on('open', resolve))
      ])

      // Setup connections
      editor.send(JSON.stringify({
        type: 'authenticate',
        userId: 'undo-editor',
        token: 'valid-token'
      }))

      observer.send(JSON.stringify({
        type: 'authenticate',
        userId: 'undo-observer',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      editor.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'undo-editor'
      }))

      observer.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'undo-observer'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Collaborative undo test timeout'))
        }, 8000)

        let operationsReceived = 0

        observer.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'operation_applied' || message.type === 'operation_undone') {
              operationsReceived++

              if (operationsReceived >= 3) { // Edit, undo, redo
                clearTimeout(timeout)
                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Perform edit, undo, redo sequence
        setTimeout(() => {
          editor.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: {
              type: 'insert',
              position: 0,
              text: 'Test edit'
            },
            userId: 'undo-editor'
          }))
        }, 500)

        setTimeout(() => {
          editor.send(JSON.stringify({
            type: 'undo_operation',
            documentId,
            userId: 'undo-editor'
          }))
        }, 1500)

        setTimeout(() => {
          editor.send(JSON.stringify({
            type: 'redo_operation',
            documentId,
            userId: 'undo-editor'
          }))
        }, 2500)
      })
    })

    test('Collaborative comments and annotations', async () => {
      const documentId = 'test-collaborative-comments'

      const commenter = new WebSocket(`${WS_URL}/ws`)
      const reader = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(commenter, reader)

      await Promise.all([
        new Promise(resolve => commenter.on('open', resolve)),
        new Promise(resolve => reader.on('open', resolve))
      ])

      // Setup connections
      commenter.send(JSON.stringify({
        type: 'authenticate',
        userId: 'commenter',
        token: 'valid-token'
      }))

      reader.send(JSON.stringify({
        type: 'authenticate',
        userId: 'reader',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      commenter.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'commenter'
      }))

      reader.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'reader'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Collaborative comments test timeout'))
        }, 6000)

        reader.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'comment_added') {
              expect(message.comment).toBeDefined()
              expect(message.comment.text).toBe('This needs clarification')
              expect(message.comment.position).toBeDefined()
              expect(message.comment.author).toBe('commenter')
              expect(message.comment.timestamp).toBeDefined()

              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Add a comment
        setTimeout(() => {
          commenter.send(JSON.stringify({
            type: 'add_comment',
            documentId,
            comment: {
              text: 'This needs clarification',
              position: { line: 5, column: 10 },
              author: 'commenter',
              timestamp: Date.now()
            },
            userId: 'commenter'
          }))
        }, 500)
      })
    })

    test('Real-time collaborative permissions', async () => {
      const documentId = 'test-collaborative-permissions'

      const admin = new WebSocket(`${WS_URL}/ws`)
      const editor = new WebSocket(`${WS_URL}/ws`)
      const viewer = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(admin, editor, viewer)

      await Promise.all([
        new Promise(resolve => admin.on('open', resolve)),
        new Promise(resolve => editor.on('open', resolve)),
        new Promise(resolve => viewer.on('open', resolve))
      ])

      // Setup with different permission levels
      admin.send(JSON.stringify({
        type: 'authenticate',
        userId: 'admin-user',
        token: 'valid-token',
        permissions: ['read', 'write', 'admin']
      }))

      editor.send(JSON.stringify({
        type: 'authenticate',
        userId: 'editor-user',
        token: 'valid-token',
        permissions: ['read', 'write']
      }))

      viewer.send(JSON.stringify({
        type: 'authenticate',
        userId: 'viewer-user',
        token: 'valid-token',
        permissions: ['read']
      }))

      await new Promise(resolve => setTimeout(resolve, 300))

      admin.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'admin-user'
      }))

      editor.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'editor-user'
      }))

      viewer.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'viewer-user'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Collaborative permissions test timeout'))
        }, 8000)

        let permissionTestsCompleted = 0

        viewer.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'error' && message.error === 'Insufficient permissions') {
              permissionTestsCompleted++

              if (permissionTestsCompleted >= 1) {
                clearTimeout(timeout)
                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Test permission enforcement
        setTimeout(() => {
          // Viewer tries to edit (should fail)
          viewer.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: {
              type: 'insert',
              position: 0,
              text: 'Unauthorized edit'
            },
            userId: 'viewer-user'
          }))
        }, 1000)
      })
    })
  })

  describe('Presence Performance and Scalability', () => {
    test('Handle large number of concurrent users', async () => {
      const documentId = 'test-presence-scale'
      const userCount = 25
      const connections = []

      // Create many concurrent connections
      for (let i = 0; i < userCount; i++) {
        const ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(ws)
        connections.push({ ws, userId: `scale-user-${i}` })

        await new Promise(resolve => ws.on('open', resolve))

        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: `scale-user-${i}`,
          token: 'valid-token'
        }))

        await new Promise(resolve => setTimeout(resolve, 50))

        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `scale-user-${i}`
        }))
      }

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Presence scale test timeout'))
        }, 15000)

        let allConnected = false
        let presenceUpdatesReceived = 0

        // Check that presence updates are efficiently handled
        connections.forEach(({ ws, userId }, index) => {
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data)

              if (message.type === 'document_state') {
                if (message.users && message.users.length >= userCount) {
                  allConnected = true
                }
              } else if (message.type === 'user_joined') {
                presenceUpdatesReceived++
              }

              // Once all users are connected and we've received presence updates
              if (allConnected && presenceUpdatesReceived > userCount * 5) {
                clearTimeout(timeout)
                resolve()
              }
            } catch (error) {
              clearTimeout(timeout)
              reject(error)
            }
          })
        })
      })
    })

    test('Presence update rate limiting', async () => {
      const documentId = 'test-presence-rate-limit'

      const rapidUser = new WebSocket(`${WS_URL}/ws`)
      const observer = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(rapidUser, observer)

      await Promise.all([
        new Promise(resolve => rapidUser.on('open', resolve)),
        new Promise(resolve => observer.on('open', resolve))
      ])

      // Setup connections
      rapidUser.send(JSON.stringify({
        type: 'authenticate',
        userId: 'rapid-user',
        token: 'valid-token'
      }))

      observer.send(JSON.stringify({
        type: 'authenticate',
        userId: 'rate-observer',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      rapidUser.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'rapid-user'
      }))

      observer.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'rate-observer'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Rate limiting test timeout'))
        }, 8000)

        let updateCount = 0
        const startTime = Date.now()

        observer.on('message', (data) => {
          try {
            const message = JSON.parse(data)

            if (message.type === 'cursor_position' && message.userId === 'rapid-user') {
              updateCount++
            }

            // Check rate limiting after 3 seconds
            if (Date.now() - startTime > 3000) {
              // Should be rate limited (expect fewer than 100 updates in 3 seconds)
              expect(updateCount).toBeLessThan(100)
              clearTimeout(timeout)
              resolve()
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        })

        // Send rapid cursor updates
        let position = 0
        const rapidInterval = setInterval(() => {
          if (Date.now() - startTime > 3000) {
            clearInterval(rapidInterval)
            return
          }

          rapidUser.send(JSON.stringify({
            type: 'cursor_move',
            documentId,
            userId: 'rapid-user',
            position: { line: 1, column: position++ }
          }))
        }, 10) // Very rapid updates (every 10ms)
      })
    })
  })
})