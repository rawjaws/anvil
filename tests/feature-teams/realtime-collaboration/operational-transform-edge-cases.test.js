/**
 * Operational Transform Edge Cases Tests
 * Comprehensive tests for complex operational transform scenarios and edge cases
 */

const axios = require('axios')
const WebSocket = require('ws')

const BASE_URL = 'http://localhost:3000'
const WS_URL = 'ws://localhost:3000'

describe('Operational Transform Edge Cases', () => {
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

  describe('Complex Overlapping Operations', () => {
    test('Multiple overlapping insert operations at same position', async () => {
      const documentId = 'test-overlapping-inserts'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Hello World',
        author: 'user1'
      })

      // Multiple users insert at exactly the same position
      const overlappingOps = [
        {
          type: 'insert',
          position: 5,
          text: ' Beautiful',
          userId: 'user1',
          timestamp: Date.now()
        },
        {
          type: 'insert',
          position: 5,
          text: ' Amazing',
          userId: 'user2',
          timestamp: Date.now() + 1
        },
        {
          type: 'insert',
          position: 5,
          text: ' Wonderful',
          userId: 'user3',
          timestamp: Date.now() + 2
        }
      ]

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: overlappingOps,
        strategy: 'timestamp-priority'
      })

      expect(transformResponse.status).toBe(200)
      expect(transformResponse.data.transformedOperations).toHaveLength(3)
      expect(transformResponse.data.positionAdjustments).toBeDefined()
      expect(transformResponse.data.finalContent).toContain('Beautiful')
      expect(transformResponse.data.finalContent).toContain('Amazing')
      expect(transformResponse.data.finalContent).toContain('Wonderful')

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Overlapping delete operations with partial intersection', async () => {
      const documentId = 'test-overlapping-deletes'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'The quick brown fox jumps over the lazy dog',
        author: 'user1'
      })

      const overlappingDeletes = [
        {
          type: 'delete',
          position: 4,
          length: 11, // Delete 'quick brown'
          userId: 'user1'
        },
        {
          type: 'delete',
          position: 10,
          length: 9, // Delete 'brown fox' (overlaps with first)
          userId: 'user2'
        }
      ]

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: overlappingDeletes,
        conflictResolution: 'merge-ranges'
      })

      expect(transformResponse.status).toBe(200)
      expect(transformResponse.data.rangeConflicts).toBeDefined()
      expect(transformResponse.data.mergedRanges).toBeDefined()
      // Should handle overlapping deletes without corruption
      expect(transformResponse.data.finalContent.length).toBeLessThan(43)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Complex chain of dependent operations', async () => {
      const documentId = 'test-dependent-chain'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'ABCDEFGH',
        author: 'user1'
      })

      // Chain where each operation depends on the previous one
      const dependentOps = [
        {
          type: 'insert',
          position: 2,
          text: 'X',
          userId: 'user1',
          dependsOn: null
        },
        {
          type: 'insert',
          position: 4, // Position after first insert
          text: 'Y',
          userId: 'user2',
          dependsOn: 0
        },
        {
          type: 'delete',
          position: 6, // Position after both inserts
          length: 2,
          userId: 'user3',
          dependsOn: 1
        },
        {
          type: 'replace',
          position: 1,
          oldText: 'B',
          newText: 'Z',
          userId: 'user4',
          dependsOn: 2
        }
      ]

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: dependentOps,
        resolveDependencies: true
      })

      expect(transformResponse.status).toBe(200)
      expect(transformResponse.data.dependencyChain).toBeDefined()
      expect(transformResponse.data.executionOrder).toBeDefined()
      expect(transformResponse.data.finalContent).toBeTruthy()

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Unicode and Multi-byte Character Handling', () => {
    test('Operations on multi-byte unicode characters', async () => {
      const documentId = 'test-unicode-multibyte'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: '👨‍👩‍👧‍👦 family 👍🏽 emoji 🌈 test',
        author: 'user1'
      })

      const unicodeOps = [
        {
          type: 'insert',
          position: 8, // After family emoji
          text: ' happy',
          userId: 'user1'
        },
        {
          type: 'replace',
          position: 15,
          oldText: '👍🏽',
          newText: '👎🏽',
          userId: 'user2'
        },
        {
          type: 'delete',
          position: 20,
          length: 1, // Should handle emoji properly
          userId: 'user3'
        }
      ]

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: unicodeOps,
        encoding: 'utf8',
        handleMultibyte: true
      })

      expect(transformResponse.status).toBe(200)
      expect(transformResponse.data.unicodeWarnings).toBeDefined()
      expect(transformResponse.data.finalContent).toContain('👨‍👩‍👧‍👦')
      expect(transformResponse.data.finalContent).toContain('👎🏽')

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Concurrent operations on different unicode planes', async () => {
      const documentId = 'test-unicode-planes'

      // Mix of different Unicode planes
      const content = 'ASCII text ñ latin ሀ ethiopic 𝕌 mathematical 💯 emoji'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content,
        author: 'user1'
      })

      const planeOps = [
        {
          type: 'insert',
          position: 10,
          text: ' (modified)',
          userId: 'user1'
        },
        {
          type: 'replace',
          position: 21,
          oldText: 'ñ',
          newText: 'Ñ',
          userId: 'user2'
        },
        {
          type: 'insert',
          position: 30,
          text: ' script',
          userId: 'user3'
        }
      ]

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: planeOps,
        unicodePlaneHandling: true
      })

      expect(transformResponse.status).toBe(200)
      expect(transformResponse.data.planeConflicts).toBeDefined()
      expect(transformResponse.data.characterBoundaryChecks).toBeDefined()

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Large Scale Operational Transform', () => {
    test('Massive concurrent operation set', async () => {
      const documentId = 'test-massive-ops'

      // Create large document
      const largeContent = Array(1000).fill('Line of text. ').join('')

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: largeContent,
        author: 'user1'
      })

      // Generate 200 concurrent operations
      const massiveOps = []
      for (let i = 0; i < 200; i++) {
        const opType = ['insert', 'delete', 'replace'][i % 3]
        const position = Math.floor(Math.random() * largeContent.length)

        if (opType === 'insert') {
          massiveOps.push({
            type: 'insert',
            position,
            text: `[${i}]`,
            userId: `user${i % 10}`,
            timestamp: Date.now() + i
          })
        } else if (opType === 'delete') {
          massiveOps.push({
            type: 'delete',
            position,
            length: Math.min(5, largeContent.length - position),
            userId: `user${i % 10}`,
            timestamp: Date.now() + i
          })
        } else {
          massiveOps.push({
            type: 'replace',
            position,
            oldText: 'text',
            newText: `TEXT${i}`,
            userId: `user${i % 10}`,
            timestamp: Date.now() + i
          })
        }
      }

      const startTime = Date.now()

      const transformResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: massiveOps,
        batchOptimization: true,
        performanceMode: true
      })

      const duration = Date.now() - startTime

      expect(transformResponse.status).toBe(200)
      expect(duration).toBeLessThan(15000) // Should complete within 15 seconds
      expect(transformResponse.data.processedOperations).toBeDefined()
      expect(transformResponse.data.optimizations).toBeDefined()
      expect(transformResponse.data.performanceMetrics).toBeDefined()

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('Memory-efficient handling of operation history', async () => {
      const documentId = 'test-memory-efficient'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Base content',
        author: 'user1'
      })

      // Build up large operation history
      const historyOps = []
      for (let i = 0; i < 1000; i++) {
        historyOps.push({
          type: 'insert',
          position: 4,
          text: `${i}`,
          userId: 'user1',
          timestamp: Date.now() + i
        })
      }

      const memoryResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/memory-test`, {
        operations: historyOps,
        memoryOptimization: true,
        compactHistory: true
      })

      expect(memoryResponse.status).toBe(200)
      expect(memoryResponse.data.memoryUsage).toBeDefined()
      expect(memoryResponse.data.historyCompaction).toBeDefined()
      expect(memoryResponse.data.operationCount).toBe(1000)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Real-time WebSocket Operational Transform', () => {
    test('WebSocket-based operational transform with multiple clients', async () => {
      const documentId = 'test-websocket-ot'

      // Create multiple WebSocket connections
      const clients = []
      for (let i = 0; i < 3; i++) {
        const ws = new WebSocket(`${WS_URL}/ws`)
        testSockets.push(ws)
        clients.push(ws)
        await new Promise(resolve => ws.on('open', resolve))

        // Authenticate and join document
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId: `ot-user-${i}`,
          token: 'valid-token'
        }))

        await new Promise(resolve => setTimeout(resolve, 100))

        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `ot-user-${i}`
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 500))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket OT test timeout'))
        }, 10000)

        let transformationsReceived = 0
        const expectedTransformations = 6 // 3 operations * 2 other clients each

        clients.forEach((ws, index) => {
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data)
              if (message.type === 'document_change' || message.type === 'operation_transformed') {
                transformationsReceived++

                if (transformationsReceived >= expectedTransformations) {
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

        // Send concurrent operations from all clients
        setTimeout(() => {
          clients.forEach((ws, index) => {
            ws.send(JSON.stringify({
              type: 'document_change',
              documentId,
              change: {
                type: 'insert',
                position: index * 2,
                text: `User${index}: `
              },
              userId: `ot-user-${index}`,
              timestamp: Date.now() + index
            }))
          })
        }, 1000)
      })
    })

    test('Operational transform with network latency simulation', async () => {
      const documentId = 'test-latency-ot'

      const client1 = new WebSocket(`${WS_URL}/ws`)
      const client2 = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(client1, client2)

      await Promise.all([
        new Promise(resolve => client1.on('open', resolve)),
        new Promise(resolve => client2.on('open', resolve))
      ])

      // Authenticate clients
      client1.send(JSON.stringify({
        type: 'authenticate',
        userId: 'latency-user-1',
        token: 'valid-token'
      }))

      client2.send(JSON.stringify({
        type: 'authenticate',
        userId: 'latency-user-2',
        token: 'valid-token'
      }))

      await new Promise(resolve => setTimeout(resolve, 200))

      // Join same document
      client1.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'latency-user-1'
      }))

      client2.send(JSON.stringify({
        type: 'join_document',
        documentId,
        userId: 'latency-user-2'
      }))

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Latency OT test timeout'))
        }, 8000)

        let operationsProcessed = 0

        const handleMessage = (data) => {
          try {
            const message = JSON.parse(data)
            if (message.type === 'document_change' || message.type === 'conflict_resolved') {
              operationsProcessed++

              if (operationsProcessed >= 4) { // 2 operations from each client
                clearTimeout(timeout)
                resolve()
              }
            }
          } catch (error) {
            clearTimeout(timeout)
            reject(error)
          }
        }

        client1.on('message', handleMessage)
        client2.on('message', handleMessage)

        // Send operations with simulated delays
        setTimeout(() => {
          client1.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: {
              type: 'insert',
              position: 0,
              text: 'Client1 Fast: '
            },
            userId: 'latency-user-1',
            timestamp: Date.now()
          }))
        }, 500)

        setTimeout(() => {
          client2.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: {
              type: 'insert',
              position: 0,
              text: 'Client2 Slow: '
            },
            userId: 'latency-user-2',
            timestamp: Date.now() - 1000, // Earlier timestamp but arrives later
            networkDelay: true
          }))
        }, 1500) // Delayed arrival
      })
    })
  })

  describe('Operational Transform Error Recovery', () => {
    test('Recovery from malformed operation', async () => {
      const documentId = 'test-malformed-op'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Test content',
        author: 'user1'
      })

      const malformedOps = [
        {
          type: 'insert',
          position: 5,
          text: 'Valid op',
          userId: 'user1'
        },
        {
          type: 'invalid_type',
          position: 'not_a_number',
          text: null,
          userId: 'user2'
        },
        {
          type: 'insert',
          position: 10,
          text: 'Another valid op',
          userId: 'user3'
        }
      ]

      const recoveryResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: malformedOps,
        errorRecovery: true,
        skipInvalidOperations: true
      })

      expect(recoveryResponse.status).toBe(200)
      expect(recoveryResponse.data.validOperations).toHaveLength(2)
      expect(recoveryResponse.data.invalidOperations).toHaveLength(1)
      expect(recoveryResponse.data.recoveryActions).toBeDefined()
      expect(recoveryResponse.data.finalContent).toContain('Valid op')

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })

    test('State consistency verification after transform', async () => {
      const documentId = 'test-consistency-check'

      await axios.post(`${BASE_URL}/api/documents`, {
        id: documentId,
        content: 'Consistency test content',
        author: 'user1'
      })

      const consistencyOps = [
        {
          type: 'delete',
          position: 0,
          length: 11, // Delete 'Consistency'
          userId: 'user1'
        },
        {
          type: 'insert',
          position: 0,
          text: 'Verification',
          userId: 'user2'
        },
        {
          type: 'replace',
          position: 13,
          oldText: 'test',
          newText: 'check',
          userId: 'user3'
        }
      ]

      const consistencyResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
        operations: consistencyOps,
        verifyConsistency: true,
        checksumValidation: true
      })

      expect(consistencyResponse.status).toBe(200)
      expect(consistencyResponse.data.consistencyChecks).toBeDefined()
      expect(consistencyResponse.data.checksumValid).toBe(true)
      expect(consistencyResponse.data.stateIntegrity).toBe(true)

      await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
    })
  })

  describe('Performance Benchmarks', () => {
    test('Operational transform performance under various loads', async () => {
      const scenarios = [
        { operationCount: 10, description: 'Light load' },
        { operationCount: 100, description: 'Medium load' },
        { operationCount: 500, description: 'Heavy load' }
      ]

      const benchmarkResults = []

      for (const scenario of scenarios) {
        const documentId = `test-perf-${scenario.operationCount}`

        await axios.post(`${BASE_URL}/api/documents`, {
          id: documentId,
          content: 'Performance test document content',
          author: 'user1'
        })

        const operations = []
        for (let i = 0; i < scenario.operationCount; i++) {
          operations.push({
            type: 'insert',
            position: i,
            text: `Op${i}`,
            userId: `user${i % 5}`,
            timestamp: Date.now() + i
          })
        }

        const startTime = Date.now()

        const perfResponse = await axios.post(`${BASE_URL}/api/documents/${documentId}/transform`, {
          operations,
          performanceBenchmark: true
        })

        const duration = Date.now() - startTime

        expect(perfResponse.status).toBe(200)
        expect(duration).toBeLessThan(scenario.operationCount * 50) // Max 50ms per operation

        benchmarkResults.push({
          scenario: scenario.description,
          operationCount: scenario.operationCount,
          duration,
          opsPerSecond: scenario.operationCount / (duration / 1000)
        })

        await axios.delete(`${BASE_URL}/api/documents/${documentId}`)
      }

      // Verify performance doesn't degrade significantly
      expect(benchmarkResults[0].opsPerSecond).toBeGreaterThan(20)
      expect(benchmarkResults[1].opsPerSecond).toBeGreaterThan(10)
      expect(benchmarkResults[2].opsPerSecond).toBeGreaterThan(5)
    })
  })
})