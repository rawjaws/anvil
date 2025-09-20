/**
 * Collaborative Editing Integration Tests
 * Tests for real-time document editing, version control, and conflict resolution
 */

const axios = require('axios')
const crypto = require('crypto')

const BASE_URL = 'http://localhost:3000'

describe('Collaborative Editing Features', () => {
  beforeEach(async () => {
    // Ensure collaborative reviews feature is enabled for all tests
    await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
      enabled: true
    })
  })

  describe('Document Version Control', () => {
    test('Document versions are tracked during collaborative editing', async () => {
      // This test simulates the document versioning system
      const documentId = 'test-collab-doc-1'

      // Simulate initial document creation
      const createResponse = await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        title: 'Collaborative Test Document',
        content: 'Initial content',
        author: 'user1'
      })

      expect(createResponse.status).toBe(200)
      expect(createResponse.data.version).toBe(1)

      // Simulate collaborative edit by user2
      const editResponse = await axios.put(`${BASE_URL}/api/documents/${documentId}`, {
        content: 'Initial content\n\nAdded by user2',
        editor: 'user2'
      })

      expect(editResponse.status).toBe(200)
      expect(editResponse.data.version).toBe(2)
      expect(editResponse.data.editors).toContain('user2')

      // Clean up
      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Concurrent edits create proper version branches', async () => {
      const documentId = 'test-collab-doc-2'

      // Create base document
      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        title: 'Concurrent Edit Test',
        content: 'Base content',
        author: 'user1'
      })

      // Simulate two users editing simultaneously
      const [edit1, edit2] = await Promise.all([
        axios.put(`${BASE_URL}/api/documents/${documentId}`, {
          content: 'Base content\n\nUser 1 addition',
          editor: 'user1',
          baseVersion: 1
        }),
        axios.put(`${BASE_URL}/api/documents/${documentId}`, {
          content: 'Base content\n\nUser 2 addition',
          editor: 'user2',
          baseVersion: 1
        })
      ])

      // Both edits should succeed with different version numbers
      expect(edit1.status).toBe(200)
      expect(edit2.status).toBe(200)
      expect(edit1.data.version).not.toBe(edit2.data.version)

      // Clean up
      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Operational Transform Implementation', () => {
    test('Text insertions are properly transformed', async () => {
      const documentId = 'test-transform-doc'

      // Create document with known content
      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        title: 'Transform Test',
        content: 'Hello World',
        author: 'user1'
      })

      // Simulate two insertions at different positions
      const operations = [
        {
          type: 'insert',
          position: 5,
          text: ' Beautiful',
          userId: 'user1'
        },
        {
          type: 'insert',
          position: 11,
          text: '!',
          userId: 'user2'
        }
      ]

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations
      })

      expect(transformResponse.status).toBe(200)
      expect(transformResponse.data.finalContent).toBe('Hello Beautiful World!')

      // Clean up
      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Text deletions are properly transformed', async () => {
      const documentId = 'test-delete-transform'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Hello Beautiful Amazing World',
        author: 'user1'
      })

      const operations = [
        {
          type: 'delete',
          position: 6,
          length: 10, // Delete "Beautiful "
          userId: 'user1'
        },
        {
          type: 'delete',
          position: 16,
          length: 8,  // Delete "Amazing " (position adjusted for first deletion)
          userId: 'user2'
        }
      ]

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations
      })

      expect(transformResponse.status).toBe(200)
      expect(transformResponse.data.finalContent).toBe('Hello World')

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Conflict Resolution Strategies', () => {
    test('Last-writer-wins conflict resolution', async () => {
      const documentId = 'test-lww-conflict'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Original content',
        author: 'user1'
      })

      // Simulate conflicting edits with timestamps
      const now = Date.now()

      const [conflict1, conflict2] = await Promise.all([
        axios.put(`${BASE_URL}/api/documents/${documentId}/conflict-resolve`, {
          content: 'User 1 version',
          userId: 'user1',
          timestamp: now,
          strategy: 'last-writer-wins'
        }),
        axios.put(`${BASE_URL}/api/documents/${documentId}/conflict-resolve`, {
          content: 'User 2 version',
          userId: 'user2',
          timestamp: now + 100, // Slightly later
          strategy: 'last-writer-wins'
        })
      ])

      // Later timestamp should win
      const finalDoc = await axios.get(`${BASE_URL}/api/documents/${documentId}`)
      expect(finalDoc.data.content).toBe('User 2 version')

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Merge-based conflict resolution', async () => {
      const documentId = 'test-merge-conflict'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Line 1\nLine 2\nLine 3',
        author: 'user1'
      })

      const mergeResponse = await axios.put(`${BASE_URL}/api/documents/${documentId}/conflict-resolve`, {
        conflicts: [
          {
            userId: 'user1',
            change: 'Line 1 - edited by user1\nLine 2\nLine 3'
          },
          {
            userId: 'user2',
            change: 'Line 1\nLine 2\nLine 3 - edited by user2'
          }
        ],
        strategy: 'merge'
      })

      expect(mergeResponse.status).toBe(200)
      expect(mergeResponse.data.content).toBe('Line 1 - edited by user1\nLine 2\nLine 3 - edited by user2')

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Real-time Collaboration API', () => {
    test('Active collaborators endpoint returns current users', async () => {
      const documentId = 'test-collaborators-doc'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Collaboration test',
        author: 'user1'
      })

      // Simulate users joining collaboration session
      await axios.post(`${BASE_URL}/api/documents/${documentId}/join`, {
        userId: 'user1'
      })

      await axios.post(`${BASE_URL}/api/documents/${documentId}/join`, {
        userId: 'user2'
      })

      const collaboratorsResponse = await axios.get(`${BASE_URL}/api/documents/${documentId}/collaborators`)

      expect(collaboratorsResponse.status).toBe(200)
      expect(collaboratorsResponse.data.activeUsers).toContain('user1')
      expect(collaboratorsResponse.data.activeUsers).toContain('user2')
      expect(collaboratorsResponse.data.count).toBe(2)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Collaboration session cleanup when users leave', async () => {
      const documentId = 'test-cleanup-doc'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Cleanup test',
        author: 'user1'
      })

      // Users join
      await axios.post(`${BASE_URL}/api/documents/${documentId}/join`, {
        userId: 'user1'
      })
      await axios.post(`${BASE_URL}/api/documents/${documentId}/join`, {
        userId: 'user2'
      })

      // User 1 leaves
      await axios.post(`${BASE_URL}/api/documents/${documentId}/leave`, {
        userId: 'user1'
      })

      const collaboratorsResponse = await axios.get(`${BASE_URL}/api/documents/${documentId}/collaborators`)

      expect(collaboratorsResponse.data.activeUsers).not.toContain('user1')
      expect(collaboratorsResponse.data.activeUsers).toContain('user2')
      expect(collaboratorsResponse.data.count).toBe(1)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Permission and Access Control', () => {
    test('Read-only users cannot edit documents', async () => {
      const documentId = 'test-readonly-doc'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Read-only test',
        author: 'owner',
        permissions: {
          'readonly-user': 'read'
        }
      })

      try {
        await axios.put(`${BASE_URL}/api/documents/${documentId}`, {
          content: 'Attempted edit',
          editor: 'readonly-user'
        })
        fail('Should have thrown an error')
      } catch (error) {
        expect(error.response.status).toBe(403)
        expect(error.response.data.error).toContain('permission')
      }

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Editor permissions allow content changes', async () => {
      const documentId = 'test-editor-doc'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Editor test',
        author: 'owner',
        permissions: {
          'editor-user': 'edit'
        }
      })

      const editResponse = await axios.put(`${BASE_URL}/api/documents/${documentId}`, {
        content: 'Successfully edited',
        editor: 'editor-user'
      })

      expect(editResponse.status).toBe(200)
      expect(editResponse.data.content).toBe('Successfully edited')

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Document Synchronization Edge Cases', () => {
    test('Handle document synchronization when network is unstable', async () => {
      const documentId = 'test-network-sync'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Base content for network testing',
        author: 'user1'
      })

      // Simulate network instability with delayed operations
      const delayedOps = [
        {
          operation: {
            type: 'insert',
            position: 0,
            text: 'Delayed: '
          },
          delay: 500,
          userId: 'user1'
        },
        {
          operation: {
            type: 'insert',
            position: 5,
            text: 'Quick: '
          },
          delay: 100,
          userId: 'user2'
        },
        {
          operation: {
            type: 'insert',
            position: 10,
            text: 'Medium: '
          },
          delay: 300,
          userId: 'user3'
        }
      ]

      const syncResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/sync-with-delays`, {
        operations: delayedOps,
        networkSimulation: true
      })

      expect(syncResponse.status).toBe(200)
      expect(syncResponse.data.synchronizationEvents).toBeDefined()
      expect(syncResponse.data.operationOrder).toBeDefined()
      expect(syncResponse.data.finalConsistency).toBe(true)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Document state recovery after partial failures', async () => {
      const documentId = 'test-recovery-sync'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Recovery test content',
        author: 'user1'
      })

      // Simulate partial failure scenario
      const failureScenario = {
        operations: [
          { type: 'insert', position: 0, text: 'Success1: ', userId: 'user1', shouldSucceed: true },
          { type: 'insert', position: 5, text: 'Failure: ', userId: 'user2', shouldSucceed: false },
          { type: 'insert', position: 10, text: 'Success2: ', userId: 'user3', shouldSucceed: true }
        ],
        failureMode: 'partial'
      }

      const recoveryResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/test-recovery`, {
        scenario: failureScenario
      })

      expect(recoveryResponse.status).toBe(200)
      expect(recoveryResponse.data.failedOperations).toHaveLength(1)
      expect(recoveryResponse.data.successfulOperations).toHaveLength(2)
      expect(recoveryResponse.data.recoveryStrategy).toBeDefined()
      expect(recoveryResponse.data.documentIntegrity).toBe(true)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Large document synchronization performance', async () => {
      const documentId = 'test-large-sync'

      // Create a large document (simulate 1MB content)
      const largeContent = 'Lorem ipsum '.repeat(100000) // ~1MB of text

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: largeContent,
        author: 'user1'
      })

      const startTime = Date.now()

      const bulkOperations = []
      for (let i = 0; i < 50; i++) {
        bulkOperations.push({
          type: 'insert',
          position: i * 1000,
          text: `Insert ${i}: `,
          userId: `user${i % 5 + 1}`
        })
      }

      const syncResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/bulk-sync`, {
        operations: bulkOperations,
        performanceMode: true
      })

      const endTime = Date.now()
      const duration = endTime - startTime

      expect(syncResponse.status).toBe(200)
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(syncResponse.data.optimizations).toBeDefined()
      expect(syncResponse.data.operationsPerSecond).toBeGreaterThan(5)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Concurrent user limit and graceful degradation', async () => {
      const documentId = 'test-concurrent-limit'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Concurrent user test',
        author: 'user1'
      })

      // Simulate many concurrent users
      const userCount = 100
      const concurrentOperations = []

      for (let i = 0; i < userCount; i++) {
        concurrentOperations.push({
          userId: `user${i}`,
          operation: {
            type: 'insert',
            position: i,
            text: `${i},`
          },
          timestamp: Date.now() + i
        })
      }

      const concurrentResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/concurrent-stress`, {
        operations: concurrentOperations,
        maxConcurrentUsers: 50, // Test limit enforcement
        degradationMode: 'graceful'
      })

      expect(concurrentResponse.status).toBe(200)
      expect(concurrentResponse.data.processedOperations).toBeLessThanOrEqual(userCount)
      expect(concurrentResponse.data.queuedOperations).toBeDefined()
      expect(concurrentResponse.data.degradationActivated).toBeDefined()

      if (concurrentResponse.data.degradationActivated) {
        expect(concurrentResponse.data.degradationStrategy).toBeTruthy()
      }

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })
})