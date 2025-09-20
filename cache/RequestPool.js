/**
 * Advanced Request Pooling and Connection Optimization
 * Manages concurrent requests, connection pooling, and resource optimization
 */

const EventEmitter = require('events')

class RequestPool extends EventEmitter {
  constructor(config = {}) {
    super()

    this.config = {
      maxConcurrent: config.maxConcurrent || 50,
      maxQueueSize: config.maxQueueSize || 1000,
      requestTimeout: config.requestTimeout || 30000,
      priorityLevels: config.priorityLevels || 3,
      enableBatching: config.enableBatching !== false,
      batchInterval: config.batchInterval || 10, // ms
      batchSize: config.batchSize || 10,
      enableDeduplication: config.enableDeduplication !== false,
      ...config
    }

    // Active request tracking
    this.activeRequests = new Map()
    this.activeCount = 0

    // Request queues by priority (0 = highest priority)
    this.queues = Array.from({ length: this.config.priorityLevels }, () => [])

    // Batch processing
    this.batchQueues = new Map()
    this.batchTimers = new Map()

    // Deduplication
    this.pendingRequests = new Map()

    // Statistics
    this.stats = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      queuedRequests: 0,
      batchedRequests: 0,
      deduplicatedRequests: 0,
      averageProcessingTime: 0,
      maxQueueTime: 0,
      currentLoad: 0
    }

    // Start processing loop
    this.processingLoop()
  }

  /**
   * Execute a request with pooling and optimization
   */
  async execute(requestFn, options = {}) {
    const request = {
      id: this.generateRequestId(),
      fn: requestFn,
      priority: options.priority || 1,
      timeout: options.timeout || this.config.requestTimeout,
      batchKey: options.batchKey,
      dedupeKey: options.dedupeKey,
      metadata: options.metadata || {},
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    }

    this.stats.totalRequests++

    // Handle deduplication
    if (this.config.enableDeduplication && request.dedupeKey) {
      const existingRequest = this.pendingRequests.get(request.dedupeKey)
      if (existingRequest) {
        this.stats.deduplicatedRequests++
        return existingRequest.promise
      }
    }

    // Create promise for request
    const promise = new Promise((resolve, reject) => {
      request.resolve = resolve
      request.reject = reject

      // Set timeout
      request.timeoutHandle = setTimeout(() => {
        this.handleTimeout(request)
      }, request.timeout)
    })

    request.promise = promise

    // Add to deduplication map if enabled
    if (this.config.enableDeduplication && request.dedupeKey) {
      this.pendingRequests.set(request.dedupeKey, request)
    }

    // Handle batching
    if (this.config.enableBatching && request.batchKey) {
      this.addToBatch(request)
    } else {
      this.addToQueue(request)
    }

    return promise
  }

  /**
   * Add request to appropriate priority queue
   */
  addToQueue(request) {
    const queueIndex = Math.min(request.priority, this.config.priorityLevels - 1)
    const queue = this.queues[queueIndex]

    if (this.getTotalQueueSize() >= this.config.maxQueueSize) {
      this.handleQueueOverflow(request)
      return
    }

    queue.push(request)
    this.stats.queuedRequests++

    this.emit('requestQueued', {
      requestId: request.id,
      priority: request.priority,
      queueSize: this.getTotalQueueSize()
    })
  }

  /**
   * Add request to batch queue
   */
  addToBatch(request) {
    const { batchKey } = request

    if (!this.batchQueues.has(batchKey)) {
      this.batchQueues.set(batchKey, [])
    }

    const batchQueue = this.batchQueues.get(batchKey)
    batchQueue.push(request)
    this.stats.batchedRequests++

    // Schedule batch processing
    if (!this.batchTimers.has(batchKey)) {
      this.batchTimers.set(batchKey, setTimeout(() => {
        this.processBatch(batchKey)
      }, this.config.batchInterval))
    }

    // Process immediately if batch is full
    if (batchQueue.length >= this.config.batchSize) {
      clearTimeout(this.batchTimers.get(batchKey))
      this.batchTimers.delete(batchKey)
      this.processBatch(batchKey)
    }
  }

  /**
   * Process a batch of requests
   */
  async processBatch(batchKey) {
    const batchQueue = this.batchQueues.get(batchKey)
    if (!batchQueue || batchQueue.length === 0) {
      return
    }

    this.batchQueues.delete(batchKey)
    this.batchTimers.delete(batchKey)

    // Create a combined batch request
    const batchRequest = {
      id: this.generateRequestId(),
      requests: batchQueue,
      priority: Math.min(...batchQueue.map(r => r.priority)),
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    }

    // Add batch to queue
    this.addToQueue(batchRequest)
  }

  /**
   * Main processing loop
   */
  async processingLoop() {
    while (true) {
      try {
        // Check if we can process more requests
        if (this.activeCount >= this.config.maxConcurrent) {
          await this.wait(1) // Wait 1ms before checking again
          continue
        }

        // Get next request from highest priority queue
        const request = this.getNextRequest()
        if (!request) {
          await this.wait(1)
          continue
        }

        // Process request
        this.processRequest(request)

      } catch (error) {
        console.error('Processing loop error:', error)
        await this.wait(10)
      }
    }
  }

  /**
   * Get next request from priority queues
   */
  getNextRequest() {
    for (let i = 0; i < this.config.priorityLevels; i++) {
      const queue = this.queues[i]
      if (queue.length > 0) {
        this.stats.queuedRequests--
        return queue.shift()
      }
    }
    return null
  }

  /**
   * Process a single request
   */
  async processRequest(request) {
    this.activeCount++
    this.activeRequests.set(request.id, request)
    request.startedAt = Date.now()

    this.updateStats()

    this.emit('requestStarted', {
      requestId: request.id,
      queueTime: request.startedAt - request.createdAt,
      activeCount: this.activeCount
    })

    try {
      let result

      // Handle batch requests
      if (request.requests) {
        result = await this.executeBatch(request)
      } else {
        result = await request.fn()
      }

      this.completeRequest(request, result)

    } catch (error) {
      this.failRequest(request, error)
    }
  }

  /**
   * Execute a batch of requests
   */
  async executeBatch(batchRequest) {
    const { requests } = batchRequest

    // Execute all requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          return await request.fn()
        } catch (error) {
          throw error
        }
      })
    )

    // Resolve individual requests
    requests.forEach((request, index) => {
      const result = results[index]

      if (result.status === 'fulfilled') {
        this.completeRequest(request, result.value, false) // Don't update stats yet
      } else {
        this.failRequest(request, result.reason, false)
      }
    })

    return results
  }

  /**
   * Complete a request successfully
   */
  completeRequest(request, result, updateStats = true) {
    request.completedAt = Date.now()

    // Clear timeout
    if (request.timeoutHandle) {
      clearTimeout(request.timeoutHandle)
    }

    // Remove from deduplication map
    if (request.dedupeKey) {
      this.pendingRequests.delete(request.dedupeKey)
    }

    // Resolve promise
    if (request.resolve) {
      request.resolve(result)
    }

    // Update stats
    if (updateStats) {
      this.stats.completedRequests++
      this.updateProcessingTime(request)
      this.finalizeRequest(request)
    }

    this.emit('requestCompleted', {
      requestId: request.id,
      processingTime: request.completedAt - request.startedAt,
      totalTime: request.completedAt - request.createdAt
    })
  }

  /**
   * Fail a request
   */
  failRequest(request, error, updateStats = true) {
    request.completedAt = Date.now()

    // Clear timeout
    if (request.timeoutHandle) {
      clearTimeout(request.timeoutHandle)
    }

    // Remove from deduplication map
    if (request.dedupeKey) {
      this.pendingRequests.delete(request.dedupeKey)
    }

    // Reject promise
    if (request.reject) {
      request.reject(error)
    }

    // Update stats
    if (updateStats) {
      this.stats.failedRequests++
      this.finalizeRequest(request)
    }

    this.emit('requestFailed', {
      requestId: request.id,
      error: error.message,
      processingTime: request.startedAt ? request.completedAt - request.startedAt : 0
    })
  }

  /**
   * Handle request timeout
   */
  handleTimeout(request) {
    const error = new Error(`Request timeout after ${request.timeout}ms`)
    error.code = 'REQUEST_TIMEOUT'
    this.failRequest(request, error)
  }

  /**
   * Handle queue overflow
   */
  handleQueueOverflow(request) {
    const error = new Error('Request queue is full')
    error.code = 'QUEUE_OVERFLOW'
    this.failRequest(request, error, false) // Don't count as active request
  }

  /**
   * Finalize request cleanup
   */
  finalizeRequest(request) {
    this.activeRequests.delete(request.id)
    this.activeCount--
    this.updateStats()
  }

  /**
   * Update processing time statistics
   */
  updateProcessingTime(request) {
    const processingTime = request.completedAt - request.startedAt
    const queueTime = request.startedAt - request.createdAt

    // Update average processing time
    const totalCompleted = this.stats.completedRequests
    this.stats.averageProcessingTime =
      ((this.stats.averageProcessingTime * (totalCompleted - 1)) + processingTime) / totalCompleted

    // Update max queue time
    this.stats.maxQueueTime = Math.max(this.stats.maxQueueTime, queueTime)
  }

  /**
   * Update current statistics
   */
  updateStats() {
    this.stats.currentLoad = this.activeCount / this.config.maxConcurrent
  }

  /**
   * Get total queue size across all priorities
   */
  getTotalQueueSize() {
    return this.queues.reduce((total, queue) => total + queue.length, 0)
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Wait utility
   */
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeRequests: this.activeCount,
      queuedRequests: this.getTotalQueueSize(),
      maxConcurrent: this.config.maxConcurrent,
      utilizationPercent: Math.round(this.stats.currentLoad * 100)
    }
  }

  /**
   * Get detailed status
   */
  getStatus() {
    return {
      stats: this.getStats(),
      queues: this.queues.map((queue, index) => ({
        priority: index,
        size: queue.length
      })),
      batches: Array.from(this.batchQueues.entries()).map(([key, queue]) => ({
        batchKey: key,
        size: queue.length
      })),
      config: this.config
    }
  }

  /**
   * Destroy the pool and cleanup resources
   */
  destroy() {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer)
    }

    // Clear all queues
    this.queues.forEach(queue => queue.length = 0)
    this.batchQueues.clear()
    this.batchTimers.clear()
    this.pendingRequests.clear()
    this.activeRequests.clear()

    this.removeAllListeners()
  }
}

module.exports = RequestPool