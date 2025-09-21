/*
 * Copyright 2025 Darcy Davidson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Performance monitoring for the Analytics Engine
 * Tracks response times, memory usage, and optimization metrics
 */
class AnalyticsPerformanceMonitor {
  constructor() {
    this.metrics = {
      apiResponseTimes: [],
      cacheHitRates: [],
      memoryUsage: [],
      documentProcessingTimes: [],
      concurrentRequests: 0,
      totalRequests: 0,
      errors: 0
    };

    this.startTime = Date.now();
    this.performanceThresholds = {
      maxResponseTime: 5000, // 5 seconds
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      minCacheHitRate: 0.7, // 70%
      maxConcurrentRequests: 10
    };
  }

  /**
   * Start timing an operation
   */
  startTiming(operationId) {
    const timing = {
      id: operationId,
      startTime: Date.now(),
      startMemory: process.memoryUsage()
    };

    this.metrics.concurrentRequests++;
    this.metrics.totalRequests++;

    return timing;
  }

  /**
   * End timing an operation and record metrics
   */
  endTiming(timing, cacheHit = false) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - timing.startTime;

    this.metrics.concurrentRequests--;
    this.metrics.apiResponseTimes.push({
      operationId: timing.id,
      duration,
      timestamp: endTime
    });

    // Track memory usage
    this.metrics.memoryUsage.push({
      heapUsed: endMemory.heapUsed,
      heapTotal: endMemory.heapTotal,
      external: endMemory.external,
      timestamp: endTime
    });

    // Track cache performance
    this.metrics.cacheHitRates.push({
      hit: cacheHit,
      timestamp: endTime
    });

    // Cleanup old metrics (keep last 1000 entries)
    this.cleanupMetrics();

    return {
      duration,
      memoryDelta: endMemory.heapUsed - timing.startMemory.heapUsed,
      cacheHit
    };
  }

  /**
   * Record an error
   */
  recordError(error, operationId) {
    this.metrics.errors++;
    console.error(`Analytics performance error in ${operationId}:`, error);
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats() {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate averages for recent data (last 100 operations)
    const recentResponseTimes = this.metrics.apiResponseTimes.slice(-100);
    const recentCacheHits = this.metrics.cacheHitRates.slice(-100);
    const recentMemoryUsage = this.metrics.memoryUsage.slice(-100);

    const avgResponseTime = recentResponseTimes.length > 0 ?
      recentResponseTimes.reduce((sum, metric) => sum + metric.duration, 0) / recentResponseTimes.length : 0;

    const cacheHitRate = recentCacheHits.length > 0 ?
      recentCacheHits.filter(hit => hit.hit).length / recentCacheHits.length : 0;

    const currentMemory = process.memoryUsage();
    const avgMemoryUsage = recentMemoryUsage.length > 0 ?
      recentMemoryUsage.reduce((sum, metric) => sum + metric.heapUsed, 0) / recentMemoryUsage.length : 0;

    // Health indicators
    const health = {
      responseTime: avgResponseTime < this.performanceThresholds.maxResponseTime ? 'good' : 'warning',
      memoryUsage: currentMemory.heapUsed < this.performanceThresholds.maxMemoryUsage ? 'good' : 'warning',
      cacheHitRate: cacheHitRate > this.performanceThresholds.minCacheHitRate ? 'good' : 'poor',
      concurrency: this.metrics.concurrentRequests < this.performanceThresholds.maxConcurrentRequests ? 'good' : 'high'
    };

    const overallHealth = Object.values(health).every(status => status === 'good') ? 'excellent' :
      Object.values(health).some(status => status === 'warning') ? 'good' : 'needs-attention';

    return {
      uptime,
      totalRequests: this.metrics.totalRequests,
      concurrentRequests: this.metrics.concurrentRequests,
      errorRate: this.metrics.totalRequests > 0 ? this.metrics.errors / this.metrics.totalRequests : 0,
      averageResponseTime: Math.round(avgResponseTime),
      cacheHitRate: Math.round(cacheHitRate * 100),
      memoryUsage: {
        current: Math.round(currentMemory.heapUsed / 1024 / 1024), // MB
        average: Math.round(avgMemoryUsage / 1024 / 1024), // MB
        total: Math.round(currentMemory.heapTotal / 1024 / 1024) // MB
      },
      health,
      overallHealth,
      thresholds: this.performanceThresholds
    };
  }

  /**
   * Get detailed performance analysis
   */
  getDetailedAnalysis() {
    const stats = this.getPerformanceStats();
    const now = Date.now();

    // Response time percentiles
    const sortedResponseTimes = this.metrics.apiResponseTimes
      .slice(-500) // Last 500 requests
      .map(metric => metric.duration)
      .sort((a, b) => a - b);

    const percentiles = {
      p50: this.getPercentile(sortedResponseTimes, 50),
      p90: this.getPercentile(sortedResponseTimes, 90),
      p95: this.getPercentile(sortedResponseTimes, 95),
      p99: this.getPercentile(sortedResponseTimes, 99)
    };

    // Trend analysis (last hour)
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentMetrics = this.metrics.apiResponseTimes.filter(
      metric => metric.timestamp > oneHourAgo
    );

    const trend = this.calculateTrend(recentMetrics);

    // Performance recommendations
    const recommendations = this.generateRecommendations(stats, percentiles);

    return {
      ...stats,
      percentiles,
      trend,
      recommendations,
      dataPoints: {
        responseTimeSamples: this.metrics.apiResponseTimes.length,
        memoryUsageSamples: this.metrics.memoryUsage.length,
        cacheHitSamples: this.metrics.cacheHitRates.length
      }
    };
  }

  /**
   * Calculate percentile from sorted array
   */
  getPercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  /**
   * Calculate performance trend
   */
  calculateTrend(metrics) {
    if (metrics.length < 10) {
      return { direction: 'stable', confidence: 'low' };
    }

    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics.slice(0, midpoint);
    const secondHalf = metrics.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.duration, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.duration, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    let direction = 'stable';
    let confidence = 'low';

    if (Math.abs(change) > 20) {
      direction = change > 0 ? 'degrading' : 'improving';
      confidence = 'high';
    } else if (Math.abs(change) > 10) {
      direction = change > 0 ? 'degrading' : 'improving';
      confidence = 'medium';
    }

    return { direction, confidence, changePercent: Math.round(change) };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(stats, percentiles) {
    const recommendations = [];

    if (stats.averageResponseTime > 3000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High Response Times',
        description: 'Average response time is above 3 seconds',
        suggestions: [
          'Optimize document parsing algorithms',
          'Implement more aggressive caching',
          'Consider pagination for large datasets'
        ]
      });
    }

    if (stats.cacheHitRate < 50) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        title: 'Low Cache Hit Rate',
        description: 'Cache hit rate is below 50%',
        suggestions: [
          'Review cache invalidation strategy',
          'Increase cache timeout for stable data',
          'Implement warming strategies for frequently accessed data'
        ]
      });
    }

    if (stats.memoryUsage.current > 300) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        title: 'High Memory Usage',
        description: 'Memory usage is above 300MB',
        suggestions: [
          'Implement document streaming for large files',
          'Clear unused data from cache more frequently',
          'Optimize data structures for memory efficiency'
        ]
      });
    }

    if (percentiles.p95 > 10000) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Poor 95th Percentile Performance',
        description: '95% of requests take longer than 10 seconds',
        suggestions: [
          'Implement request timeout mechanisms',
          'Add circuit breakers for external dependencies',
          'Optimize worst-case scenarios in analytics algorithms'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupMetrics() {
    const maxEntries = 1000;

    if (this.metrics.apiResponseTimes.length > maxEntries) {
      this.metrics.apiResponseTimes = this.metrics.apiResponseTimes.slice(-maxEntries);
    }

    if (this.metrics.memoryUsage.length > maxEntries) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-maxEntries);
    }

    if (this.metrics.cacheHitRates.length > maxEntries) {
      this.metrics.cacheHitRates = this.metrics.cacheHitRates.slice(-maxEntries);
    }
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {
      apiResponseTimes: [],
      cacheHitRates: [],
      memoryUsage: [],
      documentProcessingTimes: [],
      concurrentRequests: 0,
      totalRequests: 0,
      errors: 0
    };
    this.startTime = Date.now();
  }
}

module.exports = AnalyticsPerformanceMonitor;