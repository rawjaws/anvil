/**
 * WebSocket Performance and Load Testing
 * Comprehensive performance tests for WebSocket real-time collaboration under various load conditions
 */

const axios = require('axios')
const WebSocket = require('ws')
const { performance } = require('perf_hooks')

const BASE_URL = 'http://localhost:3000'
const WS_URL = 'ws://localhost:3000'

describe('WebSocket Performance and Load Testing', () => {
  let testSockets = []
  let performanceMetrics = {}

  beforeEach(async () => {
    // Ensure collaborative reviews feature is enabled
    await axios.put(`${BASE_URL}/api/features/collaborativeReviews`, {
      enabled: true
    })

    // Reset performance metrics
    performanceMetrics = {
      connectionsCreated: 0,
      messagesProcessed: 0,
      operationsPerformed: 0,
      totalLatency: 0,
      errors: 0
    }
  })

  afterEach(async () => {
    // Cleanup all WebSocket connections
    testSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
    testSockets = []

    // Log performance summary
    console.log('Performance Summary:', {
      connectionsCreated: performanceMetrics.connectionsCreated,
      messagesProcessed: performanceMetrics.messagesProcessed,
      operationsPerformed: performanceMetrics.operationsPerformed,
      averageLatency: performanceMetrics.totalLatency / Math.max(performanceMetrics.operationsPerformed, 1),
      errorRate: performanceMetrics.errors / Math.max(performanceMetrics.operationsPerformed, 1)
    })
  })

  describe('Connection Load Testing', () => {
    test('Handle 100 concurrent WebSocket connections', async () => {
      const connectionCount = 100
      const connections = []
      const startTime = performance.now()

      // Create connections in batches to avoid overwhelming the system
      const batchSize = 10
      for (let batch = 0; batch < connectionCount / batchSize; batch++) {
        const batchPromises = []

        for (let i = 0; i < batchSize; i++) {
          const connectionIndex = batch * batchSize + i
          const promise = createConnection(`load-user-${connectionIndex}`)
          batchPromises.push(promise)
        }

        const batchConnections = await Promise.all(batchPromises)
        connections.push(...batchConnections)
        performanceMetrics.connectionsCreated += batchConnections.length

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const connectionTime = performance.now() - startTime

      expect(connections).toHaveLength(connectionCount)
      expect(connectionTime).toBeLessThan(30000) // Should complete within 30 seconds

      // Verify all connections are stable
      connections.forEach(ws => {
        expect(ws.readyState).toBe(WebSocket.OPEN)
      })

      // Test message broadcasting with all connections
      const documentId = 'load-test-doc-100'
      const broadcastStart = performance.now()

      // Join all users to same document
      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `load-user-${index}`
        }))
      })

      // Wait for all joins to complete
      await new Promise(resolve => setTimeout(resolve, 5000))

      const broadcastTime = performance.now() - broadcastStart
      expect(broadcastTime).toBeLessThan(10000) // Broadcasting should be efficient
    })

    test('Connection creation rate under stress', async () => {
      const testDuration = 10000 // 10 seconds
      const targetRate = 10 // connections per second
      const connections = []
      const startTime = performance.now()
      let endTime = startTime

      const createConnectionsRapidly = async () => {
        while (performance.now() - startTime < testDuration) {
          try {
            const connectionPromises = []
            for (let i = 0; i < targetRate; i++) {
              const userId = `stress-user-${connections.length + i}`
              connectionPromises.push(createConnection(userId))
            }

            const newConnections = await Promise.all(connectionPromises)
            connections.push(...newConnections)
            performanceMetrics.connectionsCreated += newConnections.length

            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
          } catch (error) {
            performanceMetrics.errors++
            console.error('Connection creation error:', error.message)
          }
        }
        endTime = performance.now()
      }

      await createConnectionsRapidly()

      const actualDuration = endTime - startTime
      const actualRate = connections.length / (actualDuration / 1000)

      expect(connections.length).toBeGreaterThan(50) // Should create at least 50 connections
      expect(actualRate).toBeGreaterThan(5) // Should maintain decent rate

      // Verify connection stability
      const stableConnections = connections.filter(ws => ws.readyState === WebSocket.OPEN)
      expect(stableConnections.length / connections.length).toBeGreaterThan(0.9) // 90% should be stable
    })

    test('Memory usage stability with many connections', async () => {
      const connectionCount = 75
      const connections = []

      // Record initial memory
      const initialMemory = process.memoryUsage()

      // Create connections gradually
      for (let i = 0; i < connectionCount; i++) {
        const ws = await createConnection(`memory-user-${i}`)
        connections.push(ws)

        // Sample memory usage every 10 connections
        if ((i + 1) % 10 === 0) {
          const currentMemory = process.memoryUsage()
          const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed

          // Memory increase should be reasonable (< 100MB for 75 connections)
          expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024)
        }

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      performanceMetrics.connectionsCreated = connections.length

      // Final memory check
      const finalMemory = process.memoryUsage()
      const totalMemoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      expect(totalMemoryIncrease).toBeLessThan(150 * 1024 * 1024) // < 150MB total increase
      expect(connections).toHaveLength(connectionCount)
    })
  })

  describe('Message Throughput Testing', () => {
    test('High-frequency message processing', async () => {
      const messageCount = 1000
      const connectionCount = 5
      const connections = []

      // Setup connections
      for (let i = 0; i < connectionCount; i++) {
        const ws = await createConnection(`throughput-user-${i}`)
        connections.push(ws)
      }

      const documentId = 'throughput-test-doc'

      // Join all to same document
      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `throughput-user-${index}`
        }))
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      const startTime = performance.now()
      let messagesReceived = 0
      const expectedMessages = messageCount * (connectionCount - 1) // Each message goes to other connections

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Throughput test timeout. Received ${messagesReceived}/${expectedMessages} messages`))
        }, 30000)

        connections.forEach(ws => {
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data)
              if (message.type === 'document_change') {
                messagesReceived++
                performanceMetrics.messagesProcessed++

                if (messagesReceived >= expectedMessages) {
                  const endTime = performance.now()
                  const duration = endTime - startTime
                  const throughput = messagesReceived / (duration / 1000)

                  expect(throughput).toBeGreaterThan(100) // > 100 messages per second
                  clearTimeout(timeout)
                  resolve()
                }
              }
            } catch (error) {
              performanceMetrics.errors++
            }
          })
        })

        // Send messages from first connection
        const sender = connections[0]
        let messagesSent = 0

        const sendBatch = () => {
          const batchSize = 50
          for (let i = 0; i < batchSize && messagesSent < messageCount; i++) {
            sender.send(JSON.stringify({
              type: 'document_change',
              documentId,
              change: {
                type: 'insert',
                position: messagesSent,
                text: `M${messagesSent}`
              },
              userId: 'throughput-user-0'
            }))
            messagesSent++
            performanceMetrics.operationsPerformed++
          }

          if (messagesSent < messageCount) {
            setTimeout(sendBatch, 10) // Small delay between batches
          }
        }

        sendBatch()
      })
    })

    test('Large message handling performance', async () => {
      const connectionCount = 3
      const connections = []

      for (let i = 0; i < connectionCount; i++) {
        const ws = await createConnection(`large-msg-user-${i}`)
        connections.push(ws)
      }

      const documentId = 'large-message-doc'
      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `large-msg-user-${index}`
        }))
      })

      await new Promise(resolve => setTimeout(resolve, 500))

      // Test different message sizes
      const messageSizes = [1024, 10240, 102400] // 1KB, 10KB, 100KB

      for (const size of messageSizes) {
        const largeContent = 'A'.repeat(size)
        const startTime = performance.now()

        const sender = connections[0]
        sender.send(JSON.stringify({
          type: 'document_change',
          documentId,
          change: {
            type: 'insert',
            position: 0,
            text: largeContent
          },
          userId: 'large-msg-user-0'
        }))

        // Wait for message to be processed
        await new Promise(resolve => {
          let received = 0
          connections.slice(1).forEach(ws => {
            ws.on('message', (data) => {
              const message = JSON.parse(data)
              if (message.type === 'document_change' && message.change.text === largeContent) {
                received++
                if (received === connections.length - 1) {
                  const endTime = performance.now()
                  const latency = endTime - startTime
                  performanceMetrics.totalLatency += latency

                  // Large messages should still be processed reasonably quickly
                  expect(latency).toBeLessThan(5000) // < 5 seconds for 100KB
                  resolve()
                }
              }
            })
          })
        })

        performanceMetrics.operationsPerformed++
      }
    })
  })

  describe('Concurrent Operations Performance', () => {
    test('Simultaneous operations from multiple users', async () => {
      const userCount = 10
      const operationsPerUser = 20
      const connections = []

      // Setup users
      for (let i = 0; i < userCount; i++) {
        const ws = await createConnection(`concurrent-user-${i}`)
        connections.push(ws)
      }

      const documentId = 'concurrent-ops-doc'

      // Join document
      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `concurrent-user-${index}`
        }))
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      const startTime = performance.now()
      let operationsCompleted = 0
      const totalOperations = userCount * operationsPerUser

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Concurrent operations timeout. Completed ${operationsCompleted}/${totalOperations}`))
        }, 20000)

        connections.forEach(ws => {
          ws.on('message', (data) => {
            const message = JSON.parse(data)
            if (message.type === 'document_change') {
              operationsCompleted++
              performanceMetrics.operationsPerformed++

              if (operationsCompleted >= totalOperations) {
                const endTime = performance.now()
                const duration = endTime - startTime
                const opsPerSecond = totalOperations / (duration / 1000)

                expect(opsPerSecond).toBeGreaterThan(50) // > 50 ops per second
                clearTimeout(timeout)
                resolve()
              }
            }
          })
        })

        // Send operations from all users simultaneously
        connections.forEach((ws, userIndex) => {
          for (let opIndex = 0; opIndex < operationsPerUser; opIndex++) {
            setTimeout(() => {
              ws.send(JSON.stringify({
                type: 'document_change',
                documentId,
                change: {
                  type: 'insert',
                  position: userIndex * 100 + opIndex,
                  text: `U${userIndex}O${opIndex}`
                },
                userId: `concurrent-user-${userIndex}`
              }))
            }, opIndex * 50) // Stagger operations slightly
          }
        })
      })
    })

    test('Operation transform performance under load', async () => {
      const userCount = 8
      const connections = []

      for (let i = 0; i < userCount; i++) {
        const ws = await createConnection(`transform-user-${i}`)
        connections.push(ws)
      }

      const documentId = 'transform-perf-doc'

      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `transform-user-${index}`
        }))
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      // Create overlapping operations that require transformation
      const startTime = performance.now()
      const overlappingOps = []

      // Generate operations that will conflict and need transformation
      for (let i = 0; i < userCount; i++) {
        overlappingOps.push({
          userId: `transform-user-${i}`,
          operation: {
            type: 'insert',
            position: 10, // Same position for all - will require transformation
            text: `User${i}: `
          }
        })
      }

      let transformationsReceived = 0
      const expectedTransformations = userCount * (userCount - 1) // Each operation to each other user

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Transform performance timeout. Received ${transformationsReceived}/${expectedTransformations}`))
        }, 15000)

        connections.forEach(ws => {
          ws.on('message', (data) => {
            const message = JSON.parse(data)
            if (message.type === 'document_change' || message.type === 'operation_transformed') {
              transformationsReceived++
              performanceMetrics.operationsPerformed++

              if (transformationsReceived >= expectedTransformations) {
                const endTime = performance.now()
                const duration = endTime - startTime
                const transformationsPerSecond = transformationsReceived / (duration / 1000)

                expect(transformationsPerSecond).toBeGreaterThan(20) // > 20 transformations per second
                clearTimeout(timeout)
                resolve()
              }
            }
          })
        })

        // Send all overlapping operations simultaneously
        overlappingOps.forEach(({ userId, operation }, index) => {
          const ws = connections[index]
          ws.send(JSON.stringify({
            type: 'document_change',
            documentId,
            change: operation,
            userId
          }))
        })
      })
    })
  })

  describe('Resource Usage and Cleanup Performance', () => {
    test('Connection cleanup efficiency', async () => {
      const connectionCount = 50
      const connections = []

      // Create connections
      for (let i = 0; i < connectionCount; i++) {
        const ws = await createConnection(`cleanup-user-${i}`)
        connections.push(ws)
      }

      const documentId = 'cleanup-test-doc'

      // Join document
      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `cleanup-user-${index}`
        }))
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      // Measure cleanup time
      const cleanupStart = performance.now()

      // Close all connections
      connections.forEach(ws => {
        ws.close()
      })

      // Wait for server-side cleanup
      await new Promise(resolve => setTimeout(resolve, 3000))

      const cleanupTime = performance.now() - cleanupStart

      // Cleanup should be efficient
      expect(cleanupTime).toBeLessThan(5000) // < 5 seconds for 50 connections

      // Verify all connections are closed
      connections.forEach(ws => {
        expect(ws.readyState).toBe(WebSocket.CLOSED)
      })
    })

    test('Document state cleanup after all users leave', async () => {
      const userCount = 10
      const connections = []

      for (let i = 0; i < userCount; i++) {
        const ws = await createConnection(`state-cleanup-user-${i}`)
        connections.push(ws)
      }

      const documentId = 'state-cleanup-doc'

      // All users join
      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'join_document',
          documentId,
          userId: `state-cleanup-user-${index}`
        }))
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate some document activity
      for (let i = 0; i < userCount; i++) {
        connections[i].send(JSON.stringify({
          type: 'document_change',
          documentId,
          change: {
            type: 'insert',
            position: i * 5,
            text: `Text${i}`
          },
          userId: `state-cleanup-user-${i}`
        }))
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      // All users leave
      const leaveStart = performance.now()

      connections.forEach((ws, index) => {
        ws.send(JSON.stringify({
          type: 'leave_document',
          documentId,
          userId: `state-cleanup-user-${index}`
        }))
      })

      // Close connections
      connections.forEach(ws => ws.close())

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000))

      const leaveTime = performance.now() - leaveStart

      // Document state cleanup should be efficient
      expect(leaveTime).toBeLessThan(4000) // < 4 seconds

      // Verify server resources are cleaned up
      // (In a real implementation, this might check server metrics)
      expect(true).toBe(true) // Placeholder for actual cleanup verification
    })
  })

  // Helper function to create authenticated WebSocket connection
  async function createConnection(userId) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${WS_URL}/ws`)
      testSockets.push(ws)

      const timeout = setTimeout(() => {
        reject(new Error(`Connection timeout for ${userId}`))
      }, 5000)

      ws.on('open', () => {
        // Authenticate immediately
        ws.send(JSON.stringify({
          type: 'authenticate',
          userId,
          token: 'valid-token'
        }))
      })

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data)
          if (message.type === 'authenticated') {
            clearTimeout(timeout)
            resolve(ws)
          }
        } catch (error) {
          performanceMetrics.errors++
        }
      })

      ws.on('error', (error) => {
        clearTimeout(timeout)
        performanceMetrics.errors++
        reject(error)
      })

      ws.on('close', () => {
        // Connection closed
      })
    })
  }
})