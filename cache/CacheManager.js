/**
 * Advanced Cache Manager with Memory and Disk Caching
 * Provides intelligent caching for API responses and validation results
 */

const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')

class CacheManager {
  constructor(config = {}) {
    this.config = {
      memoryLimit: config.memoryLimit || 100 * 1024 * 1024, // 100MB default
      diskCacheDir: config.diskCacheDir || path.join(__dirname, '.cache'),
      defaultTTL: config.defaultTTL || 300000, // 5 minutes default
      maxMemoryEntries: config.maxMemoryEntries || 1000,
      enableDiskCache: config.enableDiskCache !== false,
      enableCompression: config.enableCompression !== false,
      ...config
    }

    // In-memory cache with LRU eviction
    this.memoryCache = new Map()
    this.accessOrder = new Map() // Track access order for LRU
    this.memoryUsage = 0

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      diskHits: 0,
      evictions: 0,
      errors: 0
    }

    // Initialize disk cache directory
    if (this.config.enableDiskCache) {
      this.initializeDiskCache()
    }

    // Cleanup interval for expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries()
    }, 60000) // Check every minute
  }

  /**
   * Initialize disk cache directory
   */
  async initializeDiskCache() {
    try {
      await fs.ensureDir(this.config.diskCacheDir)
    } catch (error) {
      console.warn('Failed to initialize disk cache:', error.message)
      this.config.enableDiskCache = false
    }
  }

  /**
   * Generate cache key from input
   */
  generateKey(input) {
    if (typeof input === 'string') {
      return crypto.createHash('md5').update(input).digest('hex')
    }
    return crypto.createHash('md5').update(JSON.stringify(input)).digest('hex')
  }

  /**
   * Get cached value with intelligent fallback
   */
  async get(key) {
    const cacheKey = this.generateKey(key)

    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(cacheKey)
      if (memoryEntry) {
        if (this.isExpired(memoryEntry)) {
          this.memoryCache.delete(cacheKey)
          this.accessOrder.delete(cacheKey)
        } else {
          // Update access order for LRU
          this.updateAccessOrder(cacheKey)
          this.stats.hits++
          this.stats.memoryHits++
          return memoryEntry.value
        }
      }

      // Check disk cache if enabled
      if (this.config.enableDiskCache) {
        const diskValue = await this.getDiskCache(cacheKey)
        if (diskValue !== null) {
          // Promote to memory cache
          await this.setMemoryCache(cacheKey, diskValue, memoryEntry?.ttl || this.config.defaultTTL)
          this.stats.hits++
          this.stats.diskHits++
          return diskValue
        }
      }

      this.stats.misses++
      return null
    } catch (error) {
      this.stats.errors++
      console.warn('Cache get error:', error.message)
      return null
    }
  }

  /**
   * Set cached value with intelligent storage
   */
  async set(key, value, ttl = this.config.defaultTTL) {
    const cacheKey = this.generateKey(key)

    try {
      // Always set in memory cache
      await this.setMemoryCache(cacheKey, value, ttl)

      // Set in disk cache if enabled and value is significant
      if (this.config.enableDiskCache && this.shouldDiskCache(value)) {
        await this.setDiskCache(cacheKey, value, ttl)
      }
    } catch (error) {
      this.stats.errors++
      console.warn('Cache set error:', error.message)
    }
  }

  /**
   * Set value in memory cache with LRU eviction
   */
  async setMemoryCache(key, value, ttl) {
    const entry = {
      value,
      expiry: Date.now() + ttl,
      size: this.calculateSize(value),
      ttl
    }

    // Check if we need to evict entries
    if (this.memoryCache.size >= this.config.maxMemoryEntries ||
        this.memoryUsage + entry.size > this.config.memoryLimit) {
      await this.evictLRU(entry.size)
    }

    this.memoryCache.set(key, entry)
    this.updateAccessOrder(key)
    this.memoryUsage += entry.size
  }

  /**
   * Get value from disk cache
   */
  async getDiskCache(key) {
    try {
      const filePath = path.join(this.config.diskCacheDir, `${key}.json`)
      const exists = await fs.pathExists(filePath)

      if (!exists) {
        return null
      }

      const data = await fs.readJson(filePath)

      if (this.isExpired(data)) {
        await fs.remove(filePath).catch(() => {}) // Silent cleanup
        return null
      }

      return data.value
    } catch (error) {
      return null
    }
  }

  /**
   * Set value in disk cache
   */
  async setDiskCache(key, value, ttl) {
    try {
      const filePath = path.join(this.config.diskCacheDir, `${key}.json`)
      const data = {
        value,
        expiry: Date.now() + ttl,
        created: Date.now()
      }

      await fs.writeJson(filePath, data, { spaces: 0 })
    } catch (error) {
      // Silent fail for disk cache
    }
  }

  /**
   * Evict least recently used entries
   */
  async evictLRU(requiredSpace = 0) {
    const entries = Array.from(this.accessOrder.entries())
      .sort((a, b) => a[1] - b[1]) // Sort by access time (oldest first)

    let freedSpace = 0
    let evicted = 0

    for (const [key] of entries) {
      if (this.memoryCache.size <= this.config.maxMemoryEntries / 2 &&
          this.memoryUsage + requiredSpace <= this.config.memoryLimit) {
        break
      }

      const entry = this.memoryCache.get(key)
      if (entry) {
        this.memoryCache.delete(key)
        this.accessOrder.delete(key)
        this.memoryUsage -= entry.size
        freedSpace += entry.size
        evicted++
      }
    }

    this.stats.evictions += evicted
  }

  /**
   * Update access order for LRU tracking
   */
  updateAccessOrder(key) {
    this.accessOrder.set(key, Date.now())
  }

  /**
   * Check if cache entry is expired
   */
  isExpired(entry) {
    return entry.expiry && Date.now() > entry.expiry
  }

  /**
   * Calculate memory size of value
   */
  calculateSize(value) {
    return JSON.stringify(value).length * 2 // Rough estimate in bytes
  }

  /**
   * Determine if value should be disk cached
   */
  shouldDiskCache(value) {
    const size = this.calculateSize(value)
    return size > 1024 // Cache to disk if > 1KB
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpiredEntries() {
    const now = Date.now()
    const expiredKeys = []

    // Clean memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      const entry = this.memoryCache.get(key)
      this.memoryCache.delete(key)
      this.accessOrder.delete(key)
      if (entry) {
        this.memoryUsage -= entry.size
      }
    }

    // Clean disk cache if enabled
    if (this.config.enableDiskCache) {
      try {
        const files = await fs.readdir(this.config.diskCacheDir)
        const cleanupPromises = files.map(async (file) => {
          if (!file.endsWith('.json')) return

          const filePath = path.join(this.config.diskCacheDir, file)
          try {
            const data = await fs.readJson(filePath)
            if (this.isExpired(data)) {
              await fs.remove(filePath)
            }
          } catch (error) {
            // Remove corrupted files
            await fs.remove(filePath).catch(() => {})
          }
        })

        await Promise.all(cleanupPromises)
      } catch (error) {
        // Silent fail for cleanup
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage: this.memoryUsage,
      memoryEntries: this.memoryCache.size,
      memoryUsagePercent: Math.round((this.memoryUsage / this.config.memoryLimit) * 100)
    }
  }

  /**
   * Clear all caches
   */
  async clear() {
    // Clear memory cache
    this.memoryCache.clear()
    this.accessOrder.clear()
    this.memoryUsage = 0

    // Clear disk cache
    if (this.config.enableDiskCache) {
      try {
        await fs.emptyDir(this.config.diskCacheDir)
      } catch (error) {
        console.warn('Failed to clear disk cache:', error.message)
      }
    }

    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      memoryHits: 0,
      diskHits: 0,
      evictions: 0,
      errors: 0
    }
  }

  /**
   * Destroy cache manager and cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.memoryCache.clear()
    this.accessOrder.clear()
    this.memoryUsage = 0
  }
}

module.exports = CacheManager