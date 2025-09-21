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
 * Budget-Optimized Scaling Configuration
 * Designed for Claude Max Plan ($200/month) constraints
 * Target: 8-12 concurrent agents within rate limits
 */

const BUDGET_SCALING_CONFIG = {
  // Agent Pool Configuration
  agents: {
    maxConcurrent: 2,         // Max 2 agents within Claude Max plan limits
    minConcurrent: 1,         // Always maintain minimum capacity
    scaleUpThreshold: 85,     // Scale up at 85% capacity
    scaleDownThreshold: 30,   // Scale down at 30% utilization
    cooldownPeriod: 300000    // 5 minute cooldown between scaling events
  },

  // Rate Limiting (Strict adherence to Claude limits)
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 45,    // 45/50 to leave safety buffer
    burstSize: 8,             // Small burst allowance
    queueTimeout: 30000,      // 30 second queue timeout
    backoffMultiplier: 1.5,   // Exponential backoff on rate limits
    maxRetries: 3
  },

  // Queue Management
  queue: {
    maxSize: 200,             // Reduced from 1000 to manage memory
    priorityLevels: ['high', 'normal', 'low'],
    timeoutThresholds: {
      high: 45000,            // 45 seconds for high priority
      normal: 90000,          // 90 seconds for normal
      low: 180000             // 3 minutes for low priority
    }
  },

  // Token Management (Critical for budget control)
  tokenOptimization: {
    enabled: true,
    maxInputTokensPerRequest: 8000,   // Conservative limit
    maxOutputTokensPerRequest: 2000,  // Keep responses concise
    compressionEnabled: true,
    cachingEnabled: true,
    batchSimilarRequests: true
  },

  // Usage Controls (Claude Max Plan has no overage charges)
  usageControls: {
    dailyRequestLimit: 3840,  // Max requests per day within plan limits
    hourlyRequestLimit: 480,  // Max requests per hour (spread evenly)
    alertThresholds: {
      warning: 70,            // 70% of daily limit
      critical: 85,           // 85% of daily limit
      emergency: 95           // 95% triggers throttling
    },
    autoThrottleOnLimit: true // Throttle instead of shutdown
  },

  // Model Selection Strategy
  modelSelection: {
    strategy: 'cost_optimized',
    models: {
      simple: 'claude-3-haiku',        // For basic tasks
      moderate: 'claude-3-sonnet',     // For standard tasks
      complex: 'claude-3-opus',        // Only for critical tasks
    },
    autoDowngrade: true,      // Downgrade models under pressure
    complexityThreshold: 0.7  // Threshold for model selection
  },

  // Health and Performance
  health: {
    checkInterval: 60000,     // Check every minute
    failureThreshold: 3,      // Mark unhealthy after 3 failures
    recoveryThreshold: 2,     // Mark healthy after 2 successes
    memoryLimit: 512,         // 512MB per worker
    cpuThreshold: 80          // 80% CPU threshold
  },

  // Circuit Breaker Configuration
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,      // Open after 5 failures
    timeout: 60000,           // 1 minute timeout
    resetTimeout: 300000,     // 5 minute reset timeout
    halfOpenMaxCalls: 3       // Max calls in half-open state
  }
};

/**
 * Budget-optimized job processing strategy
 */
const BUDGET_JOB_STRATEGY = {
  // Job Classification
  classify: (job) => {
    const complexity = calculateJobComplexity(job);

    if (complexity < 0.3) return 'simple';
    if (complexity < 0.7) return 'moderate';
    return 'complex';
  },

  // Token Estimation
  estimateTokens: (job) => {
    const baseTokens = 100;
    const payloadSize = JSON.stringify(job.payload || {}).length;
    return baseTokens + Math.ceil(payloadSize / 4); // Rough estimate
  },

  // Cost Prediction
  predictCost: (job, model) => {
    const tokens = BUDGET_JOB_STRATEGY.estimateTokens(job);
    const rates = {
      'claude-3-haiku': 0.00025,    // $0.25 per 1K tokens
      'claude-3-sonnet': 0.003,     // $3 per 1K tokens
      'claude-3-opus': 0.015        // $15 per 1K tokens
    };

    return (tokens / 1000) * (rates[model] || rates['claude-3-sonnet']);
  }
};

/**
 * Calculate job complexity score (0-1)
 */
function calculateJobComplexity(job) {
  let complexity = 0.3; // Base complexity

  // Factor in payload size
  const payloadSize = JSON.stringify(job.payload || {}).length;
  complexity += Math.min(payloadSize / 10000, 0.3);

  // Factor in action type
  const complexActions = ['analyze', 'createDesign', 'generateTests'];
  if (complexActions.includes(job.action)) {
    complexity += 0.2;
  }

  // Factor in priority
  if (job.priority === 'high') {
    complexity += 0.1;
  }

  return Math.min(complexity, 1.0);
}

module.exports = {
  BUDGET_SCALING_CONFIG,
  BUDGET_JOB_STRATEGY,
  calculateJobComplexity
};