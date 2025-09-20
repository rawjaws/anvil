/**
 * Server-Compatible Feature Registry
 * Node.js compatible version without React dependencies
 */

// Feature registry - defines all available features and their structure
const FEATURE_REGISTRY = {
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
};

// Feature categories for organization
const FEATURE_CATEGORIES = {
  analytics: { name: 'Analytics', icon: 'BarChart3', color: '#3b82f6' },
  export: { name: 'Export & Reporting', icon: 'Download', color: '#10b981' },
  collaboration: { name: 'Collaboration', icon: 'Users', color: '#f59e0b' },
  ai: { name: 'AI & Automation', icon: 'Bot', color: '#8b5cf6' },
  templates: { name: 'Templates', icon: 'FileText', color: '#ef4444' },
  validation: { name: 'Validation & Quality', icon: 'Shield', color: '#dc2626' }
};

/**
 * Validates feature configuration structure
 * @param {Object} features - Features configuration object
 * @returns {Object} Validation result with errors
 */
function validateFeatureConfig(features) {
  const errors = [];
  const warnings = [];

  Object.entries(features).forEach(([featureId, featureConfig]) => {
    const registry = FEATURE_REGISTRY[featureId];

    if (!registry) {
      warnings.push(`Unknown feature: ${featureId}`);
      return;
    }

    // Check required structure
    if (typeof featureConfig.enabled !== 'boolean') {
      errors.push(`Feature ${featureId}: 'enabled' must be boolean`);
    }

    if (!featureConfig.config || typeof featureConfig.config !== 'object') {
      errors.push(`Feature ${featureId}: 'config' must be an object`);
      return;
    }

    // Check required config keys
    registry.requiredConfig.forEach(key => {
      if (!(key in featureConfig.config)) {
        warnings.push(`Feature ${featureId}: missing config key '${key}'`);
      }
    });

    // Check dependencies
    registry.dependencies.forEach(dep => {
      if (!features[dep]?.enabled) {
        warnings.push(`Feature ${featureId}: depends on ${dep} which is not enabled`);
      }
    });
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Gets default configuration for a feature
 * @param {string} featureId - Feature identifier
 * @returns {Object} Default feature configuration
 */
function getDefaultFeatureConfig(featureId) {
  const registry = FEATURE_REGISTRY[featureId];
  if (!registry) return null;

  const config = {};
  registry.requiredConfig.forEach(key => {
    config[key] = false; // Default to disabled
  });

  return {
    enabled: false,
    config
  };
}

/**
 * Checks if feature dependencies are satisfied
 * @param {string} featureId - Feature to check
 * @param {Object} features - All features configuration
 * @returns {boolean} True if dependencies are satisfied
 */
function checkFeatureDependencies(featureId, features) {
  const registry = FEATURE_REGISTRY[featureId];
  if (!registry) return false;

  return registry.dependencies.every(dep => features[dep]?.enabled);
}

/**
 * Gets features by category
 * @param {Object} features - Features configuration
 * @param {string} category - Category to filter by
 * @returns {Array} Features in the specified category
 */
function getFeaturesByCategory(features, category) {
  return Object.entries(features)
    .filter(([featureId]) => FEATURE_REGISTRY[featureId]?.category === category)
    .map(([featureId, config]) => ({
      id: featureId,
      ...FEATURE_REGISTRY[featureId],
      ...config
    }));
}

module.exports = {
  FEATURE_REGISTRY,
  FEATURE_CATEGORIES,
  validateFeatureConfig,
  getDefaultFeatureConfig,
  checkFeatureDependencies,
  getFeaturesByCategory
};