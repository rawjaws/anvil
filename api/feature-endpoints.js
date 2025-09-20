/**
 * Feature Management API Endpoints
 * Handles feature flag configuration and management
 */

const fs = require('fs-extra')
const path = require('path')

// Cache for configuration data
let configCache = null
let configCacheTime = 0
const CONFIG_CACHE_TTL = 30000 // 30 seconds

// Helper to load and save config with caching
async function loadConfig() {
  const now = Date.now()

  // Return cached config if still valid
  if (configCache && (now - configCacheTime) < CONFIG_CACHE_TTL) {
    return configCache
  }

  const configPath = path.join(__dirname, '../config.json')
  const localConfigPath = path.join(__dirname, '../config.local.json')

  try {
    // Load configurations concurrently
    const [mainConfig, localConfigExists] = await Promise.all([
      fs.readJson(configPath),
      fs.pathExists(localConfigPath)
    ])

    let config = mainConfig

    if (localConfigExists) {
      const localConfig = await fs.readJson(localConfigPath)
      // Merge configs, with local taking precedence except for features
      config = {
        ...mainConfig,
        ...localConfig,
        // Always use features from main config, but allow local overrides
        features: {
          ...mainConfig.features,
          ...localConfig.features
        }
      }
    }

    const result = { config, isLocal: localConfigExists }

    // Cache the result
    configCache = result
    configCacheTime = now

    return result
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error.message}`)
  }
}

async function saveConfig(config, useLocal = true) {
  const configPath = path.join(__dirname, useLocal ? '../config.local.json' : '../config.json')
  await fs.writeJson(configPath, config, { spaces: 2 })

  // Invalidate cache when config is saved
  configCache = null
  configCacheTime = 0
}

/**
 * Feature API Routes
 */
function setupFeatureRoutes(app) {

  // GET /api/features - Get all feature configurations
  app.get('/api/features', async (req, res) => {
    try {
      const { config } = await loadConfig()
      res.json({
        success: true,
        features: config.features || {},
        metadata: {
          totalFeatures: Object.keys(config.features || {}).length,
          enabledFeatures: Object.values(config.features || {}).filter(f => f.enabled).length
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // GET /api/features/status - Get feature system status and health (MUST come before /:featureId)
  app.get('/api/features/status', async (req, res) => {
    try {
      const { config, isLocal } = await loadConfig()
      const features = config.features || {}

      const status = {
        configSource: isLocal ? 'local' : 'global',
        totalFeatures: Object.keys(features).length,
        enabledFeatures: Object.values(features).filter(f => f.enabled).length,
        disabledFeatures: Object.values(features).filter(f => !f.enabled).length,
        featureCategories: {},
        lastModified: new Date().toISOString()
      }

      // Import server-compatible feature registry for categorization
      try {
        const { FEATURE_REGISTRY, FEATURE_CATEGORIES } = require('../utils/server-feature-registry.js')

        Object.entries(features).forEach(([featureId, feature]) => {
          const registry = FEATURE_REGISTRY[featureId]
          if (registry) {
            const category = registry.category
            if (!status.featureCategories[category]) {
              status.featureCategories[category] = {
                name: FEATURE_CATEGORIES[category]?.name || category,
                total: 0,
                enabled: 0
              }
            }
            status.featureCategories[category].total++
            if (feature.enabled) {
              status.featureCategories[category].enabled++
            }
          }
        })
      } catch (error) {
        // Feature registry not available, skip categorization
        console.warn('Feature registry not available for status categorization:', error.message)
      }

      res.json({
        success: true,
        status
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // GET /api/features/:featureId - Get specific feature configuration
  app.get('/api/features/:featureId', async (req, res) => {
    try {
      const { featureId } = req.params
      const { config } = await loadConfig()

      const feature = config.features?.[featureId]
      if (!feature) {
        return res.status(404).json({
          success: false,
          error: `Feature '${featureId}' not found`
        })
      }

      res.json({
        success: true,
        feature: {
          id: featureId,
          ...feature
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // PUT /api/features/:featureId - Update feature configuration
  app.put('/api/features/:featureId', async (req, res) => {
    try {
      const { featureId } = req.params
      const { enabled, config: featureConfig } = req.body

      const { config, isLocal } = await loadConfig()

      if (!config.features) {
        config.features = {}
      }

      if (!config.features[featureId]) {
        return res.status(404).json({
          success: false,
          error: `Feature '${featureId}' not found`
        })
      }

      // Update feature configuration
      if (typeof enabled === 'boolean') {
        config.features[featureId].enabled = enabled
      }

      if (featureConfig && typeof featureConfig === 'object') {
        config.features[featureId].config = {
          ...config.features[featureId].config,
          ...featureConfig
        }
      }

      await saveConfig(config, true) // Always save to local config

      res.json({
        success: true,
        feature: {
          id: featureId,
          ...config.features[featureId]
        },
        message: `Feature '${featureId}' updated successfully`
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // POST /api/features/:featureId/toggle - Toggle feature enabled/disabled
  app.post('/api/features/:featureId/toggle', async (req, res) => {
    try {
      const { featureId } = req.params
      const { config, isLocal } = await loadConfig()

      if (!config.features?.[featureId]) {
        return res.status(404).json({
          success: false,
          error: `Feature '${featureId}' not found`
        })
      }

      // Toggle the enabled state
      config.features[featureId].enabled = !config.features[featureId].enabled

      await saveConfig(config, true)

      res.json({
        success: true,
        feature: {
          id: featureId,
          ...config.features[featureId]
        },
        message: `Feature '${featureId}' ${config.features[featureId].enabled ? 'enabled' : 'disabled'}`
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // POST /api/features/batch-update - Update multiple features at once
  app.post('/api/features/batch-update', async (req, res) => {
    try {
      const { updates } = req.body // { featureId: { enabled, config }, ... }

      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Updates object is required'
        })
      }

      const { config, isLocal } = await loadConfig()
      const results = []
      const errors = []

      // Process updates concurrently
      const updatePromises = Object.entries(updates).map(async ([featureId, update]) => {
        try {
          if (!config.features?.[featureId]) {
            errors.push(`Feature '${featureId}' not found`)
            return
          }

          if (typeof update.enabled === 'boolean') {
            config.features[featureId].enabled = update.enabled
          }

          if (update.config && typeof update.config === 'object') {
            config.features[featureId].config = {
              ...config.features[featureId].config,
              ...update.config
            }
          }

          results.push({
            featureId,
            success: true,
            feature: config.features[featureId]
          })
        } catch (error) {
          errors.push(`Failed to update ${featureId}: ${error.message}`)
        }
      })

      await Promise.all(updatePromises)

      if (results.length > 0) {
        await saveConfig(config, true)
      }

      res.json({
        success: errors.length === 0,
        results,
        errors,
        message: `Updated ${results.length} features${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // POST /api/features/reset - Reset features to default configuration
  app.post('/api/features/reset', async (req, res) => {
    try {
      const { featureIds } = req.body // Optional array of specific features to reset

      const { config } = await loadConfig()
      const mainConfigPath = path.join(__dirname, '../config.json')
      const mainConfig = await fs.readJson(mainConfigPath)

      if (featureIds && Array.isArray(featureIds)) {
        // Reset specific features
        featureIds.forEach(featureId => {
          if (mainConfig.features?.[featureId] && config.features?.[featureId]) {
            config.features[featureId] = { ...mainConfig.features[featureId] }
          }
        })
      } else {
        // Reset all features
        config.features = { ...mainConfig.features }
      }

      await saveConfig(config, true)

      res.json({
        success: true,
        message: featureIds
          ? `Reset ${featureIds.length} features to defaults`
          : 'All features reset to defaults',
        features: config.features
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })
}

module.exports = { setupFeatureRoutes }