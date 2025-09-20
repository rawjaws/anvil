/**
 * Feature Configuration Utilities
 * Provides utility functions for feature flag management and validation
 */

import React from 'react'

// Feature registry - defines all available features and their structure
export const FEATURE_REGISTRY = {
  advancedAnalytics: {
    name: 'Advanced Analytics',
    description: 'Enhanced analytics dashboard with charts, metrics, and insights',
    category: 'analytics',
    requiredConfig: ['dashboardWidgets', 'exportCharts', 'realTimeMetrics'],
    dependencies: []
  },
  enhancedExporting: {
    name: 'Enhanced Exporting',
    description: 'Export capabilities to PDF, Excel, and custom formats',
    category: 'export',
    requiredConfig: ['pdfExport', 'excelExport', 'customTemplates'],
    dependencies: []
  },
  collaborativeReviews: {
    name: 'Collaborative Reviews',
    description: 'Real-time collaboration with comments, approvals, and notifications',
    category: 'collaboration',
    requiredConfig: ['realTimeComments', 'approvalWorkflows', 'notifications'],
    dependencies: []
  },
  aiWorkflowAutomation: {
    name: 'AI Workflow Automation',
    description: 'AI-powered automation for analysis, suggestions, and batch processing',
    category: 'ai',
    requiredConfig: ['autoAnalysis', 'smartSuggestions', 'batchProcessing'],
    dependencies: []
  },
  templateMarketplace: {
    name: 'Template Marketplace',
    description: 'Shareable template library with ratings and categories',
    category: 'templates',
    requiredConfig: ['sharing', 'ratings', 'categories'],
    dependencies: ['enhancedExporting']
  },
  requirementsPrecisionEngine: {
    name: 'Requirements Precision Engine',
    description: 'Advanced validation, conflict detection, and quality assurance for requirements',
    category: 'validation',
    requiredConfig: ['smartValidation', 'dependencyConflictDetection', 'impactAnalysis', 'traceabilityMatrix', 'realTimeValidation'],
    dependencies: []
  }
}

// Feature categories for organization
export const FEATURE_CATEGORIES = {
  analytics: { name: 'Analytics', icon: 'BarChart3', color: '#3b82f6' },
  export: { name: 'Export & Reporting', icon: 'Download', color: '#10b981' },
  collaboration: { name: 'Collaboration', icon: 'Users', color: '#f59e0b' },
  ai: { name: 'AI & Automation', icon: 'Bot', color: '#8b5cf6' },
  templates: { name: 'Templates', icon: 'FileText', color: '#ef4444' },
  validation: { name: 'Validation & Quality', icon: 'Shield', color: '#dc2626' }
}

/**
 * Validates feature configuration structure
 * @param {Object} features - Features configuration object
 * @returns {Object} Validation result with errors
 */
export function validateFeatureConfig(features) {
  const errors = []
  const warnings = []

  Object.entries(features).forEach(([featureId, featureConfig]) => {
    const registry = FEATURE_REGISTRY[featureId]

    if (!registry) {
      warnings.push(`Unknown feature: ${featureId}`)
      return
    }

    // Check required structure
    if (typeof featureConfig.enabled !== 'boolean') {
      errors.push(`Feature ${featureId}: 'enabled' must be boolean`)
    }

    if (!featureConfig.config || typeof featureConfig.config !== 'object') {
      errors.push(`Feature ${featureId}: 'config' must be an object`)
      return
    }

    // Check required config keys
    registry.requiredConfig.forEach(key => {
      if (!(key in featureConfig.config)) {
        warnings.push(`Feature ${featureId}: missing config key '${key}'`)
      }
    })

    // Check dependencies
    registry.dependencies.forEach(dep => {
      if (!features[dep]?.enabled) {
        warnings.push(`Feature ${featureId}: depends on ${dep} which is not enabled`)
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Gets default configuration for a feature
 * @param {string} featureId - Feature identifier
 * @returns {Object} Default feature configuration
 */
export function getDefaultFeatureConfig(featureId) {
  const registry = FEATURE_REGISTRY[featureId]
  if (!registry) return null

  const config = {}
  registry.requiredConfig.forEach(key => {
    config[key] = false // Default to disabled
  })

  return {
    enabled: false,
    config
  }
}

/**
 * Checks if feature dependencies are satisfied
 * @param {string} featureId - Feature to check
 * @param {Object} features - All features configuration
 * @returns {boolean} True if dependencies are satisfied
 */
export function checkFeatureDependencies(featureId, features) {
  const registry = FEATURE_REGISTRY[featureId]
  if (!registry) return false

  return registry.dependencies.every(dep => features[dep]?.enabled)
}

/**
 * Gets features by category
 * @param {Object} features - Features configuration
 * @param {string} category - Category to filter by
 * @returns {Array} Features in the specified category
 */
export function getFeaturesByCategory(features, category) {
  return Object.entries(features)
    .filter(([featureId]) => FEATURE_REGISTRY[featureId]?.category === category)
    .map(([featureId, config]) => ({
      id: featureId,
      ...FEATURE_REGISTRY[featureId],
      ...config
    }))
}

/**
 * Conditional component wrapper for feature flags
 * @param {Object} props - Component props
 * @param {string} props.feature - Feature ID to check
 * @param {Function} props.fallback - Fallback component if feature disabled
 * @param {Object} props.features - Features state
 * @param {React.ReactNode} props.children - Children to render if enabled
 */
export function FeatureGate({ feature, fallback = null, features, children }) {
  const enabled = features[feature]?.enabled || false
  return enabled ? children : fallback
}

/**
 * HOC for feature-gated components
 * @param {string} featureId - Feature ID to check
 * @param {React.Component} fallback - Fallback component
 */
export function withFeatureGate(featureId, fallback = null) {
  return function FeatureGatedComponent(WrappedComponent) {
    return function WithFeatureGate(props) {
      // This would use the useFeatures hook in actual component
      const enabled = props.features?.[featureId]?.enabled || false
      if (enabled) {
        return React.createElement(WrappedComponent, props)
      }
      return fallback
    }
  }
}

/**
 * Performance utilities for feature loading
 */
export const FeaturePerformance = {
  /**
   * Lazy load feature components
   * @param {Function} importFunction - Dynamic import function
   * @param {string} featureId - Feature identifier
   */
  lazyLoadFeature: (importFunction, featureId) => {
    return React.lazy(() => {
      // Only load if feature is enabled
      const shouldLoad = window.__ANVIL_FEATURES__?.[featureId]?.enabled || false
      return shouldLoad
        ? importFunction()
        : Promise.resolve({ default: () => null })
    })
  },

  /**
   * Preload feature assets when feature is enabled
   * @param {string} featureId - Feature identifier
   * @param {Array} assets - Asset URLs to preload
   */
  preloadFeatureAssets: (featureId, assets) => {
    const enabled = window.__ANVIL_FEATURES__?.[featureId]?.enabled || false
    if (!enabled) return

    assets.forEach(asset => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = asset
      link.as = asset.endsWith('.js') ? 'script' : 'style'
      document.head.appendChild(link)
    })
  }
}