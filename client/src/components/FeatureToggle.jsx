import React, { useState, memo, useMemo, useCallback } from 'react'
import { useFeatures } from '../contexts/FeatureContext'
import { FEATURE_REGISTRY, FEATURE_CATEGORIES } from '../utils/featureUtils'
import './FeatureToggle.css'

// Individual Feature Toggle Component
export const FeatureToggle = memo(function FeatureToggle({ featureId, showConfig = false, compact = false }) {
  const { features, updateFeature, loading } = useFeatures()
  const [updating, setUpdating] = useState(false)

  const feature = features[featureId]
  const registry = FEATURE_REGISTRY[featureId]

  if (!feature || !registry) return null

  const handleToggle = useCallback(async () => {
    if (updating || loading) return

    setUpdating(true)
    try {
      await updateFeature(featureId, { enabled: !feature.enabled })
    } catch (error) {
      console.error(`Failed to toggle ${featureId}:`, error)
    } finally {
      setUpdating(false)
    }
  }, [updating, loading, updateFeature, featureId, feature.enabled])

  const handleConfigUpdate = useCallback(async (configKey, value) => {
    if (updating || loading) return

    setUpdating(true)
    try {
      await updateFeature(featureId, {
        config: { ...feature.config, [configKey]: value }
      })
    } catch (error) {
      console.error(`Failed to update ${featureId} config:`, error)
    } finally {
      setUpdating(false)
    }
  }, [updating, loading, updateFeature, featureId, feature.config])

  if (compact) {
    return (
      <div className={`feature-toggle-compact ${feature.enabled ? 'enabled' : 'disabled'}`}>
        <button
          className="toggle-switch"
          onClick={handleToggle}
          disabled={updating || loading}
          title={feature.enabled ? 'Disable feature' : 'Enable feature'}
        >
          <span className="toggle-slider" />
        </button>
        <span className="feature-name">{registry.name}</span>
      </div>
    )
  }

  return (
    <div className={`feature-toggle ${feature.enabled ? 'enabled' : 'disabled'}`}>
      <div className="feature-header">
        <div className="feature-info">
          <h3 className="feature-name">{registry.name}</h3>
          <p className="feature-description">{registry.description}</p>
          {registry.dependencies && registry.dependencies.length > 0 && (
            <div className="feature-dependencies">
              <small>Depends on: {registry.dependencies.join(', ')}</small>
            </div>
          )}
        </div>
        <button
          className={`toggle-switch ${feature.enabled ? 'on' : 'off'}`}
          onClick={handleToggle}
          disabled={updating || loading}
        >
          <span className="toggle-slider" />
          <span className="toggle-label">
            {updating ? 'Updating...' : feature.enabled ? 'On' : 'Off'}
          </span>
        </button>
      </div>

      {showConfig && feature.enabled && registry.requiredConfig && (
        <div className="feature-config">
          <h4>Configuration</h4>
          <div className="config-options">
            {registry.requiredConfig.map(configKey => (
              <div key={configKey} className="config-option">
                <label>
                  <input
                    type="checkbox"
                    checked={feature.config[configKey] || false}
                    onChange={(e) => handleConfigUpdate(configKey, e.target.checked)}
                    disabled={updating || loading}
                  />
                  <span className="config-label">
                    {configKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

// Feature Category Group Component
export const FeatureCategoryGroup = memo(function FeatureCategoryGroup({ category, features, showConfig = false }) {
  const categoryInfo = FEATURE_CATEGORIES[category]

  const categoryFeatures = useMemo(() =>
    Object.entries(features).filter(
      ([featureId]) => FEATURE_REGISTRY[featureId]?.category === category
    ),
    [features, category]
  )

  const enabledCount = useMemo(() =>
    categoryFeatures.filter(([, feature]) => feature.enabled).length,
    [categoryFeatures]
  )

  if (categoryFeatures.length === 0) return null

  return (
    <div className="feature-category-group">
      <div className="category-header">
        <div className="category-info">
          <h2 className="category-name">
            <span className="category-icon" style={{ color: categoryInfo.color }}>
              {/* Icon would be rendered here based on categoryInfo.icon */}
            </span>
            {categoryInfo.name}
          </h2>
          <span className="category-count">
            {enabledCount} of {categoryFeatures.length} enabled
          </span>
        </div>
      </div>
      <div className="category-features">
        {categoryFeatures.map(([featureId]) => (
          <FeatureToggle
            key={featureId}
            featureId={featureId}
            showConfig={showConfig}
          />
        ))}
      </div>
    </div>
  )
})

// Feature Management Dashboard
export const FeatureManagementDashboard = memo(function FeatureManagementDashboard() {
  const { features, loading, error, getFeatureStatus } = useFeatures()
  const [showConfig, setShowConfig] = useState(false)
  const [statusData, setStatusData] = useState(null)

  const loadStatus = useCallback(async () => {
    try {
      const status = await getFeatureStatus()
      setStatusData(status.status)
    } catch (error) {
      console.error('Failed to load feature status:', error)
    }
  }, [getFeatureStatus])

  React.useEffect(() => {
    loadStatus()
  }, [loadStatus, features])

  if (loading) {
    return <div className="feature-dashboard loading">Loading features...</div>
  }

  if (error) {
    return <div className="feature-dashboard error">Error: {error}</div>
  }

  const categories = useMemo(() => Object.keys(FEATURE_CATEGORIES), [])

  return (
    <div className="feature-management-dashboard">
      <div className="dashboard-header">
        <h1>Feature Management</h1>
        <div className="dashboard-controls">
          <label className="config-toggle">
            <input
              type="checkbox"
              checked={showConfig}
              onChange={(e) => setShowConfig(e.target.checked)}
            />
            Show Configuration Options
          </label>
        </div>
      </div>

      {statusData && (
        <div className="feature-status-summary">
          <div className="status-grid">
            <div className="status-item">
              <span className="status-value">{statusData.totalFeatures}</span>
              <span className="status-label">Total Features</span>
            </div>
            <div className="status-item">
              <span className="status-value">{statusData.enabledFeatures}</span>
              <span className="status-label">Enabled</span>
            </div>
            <div className="status-item">
              <span className="status-value">{statusData.disabledFeatures}</span>
              <span className="status-label">Disabled</span>
            </div>
            <div className="status-item">
              <span className="status-value">{statusData.configSource}</span>
              <span className="status-label">Config Source</span>
            </div>
          </div>
        </div>
      )}

      <div className="feature-categories">
        {categories.map(category => (
          <FeatureCategoryGroup
            key={category}
            category={category}
            features={features}
            showConfig={showConfig}
          />
        ))}
      </div>
    </div>
  )
})

// Quick Feature Toggles for Header/Sidebar
export const QuickFeatureToggles = memo(function QuickFeatureToggles({ featureIds, orientation = 'horizontal' }) {
  const { features } = useFeatures()

  return (
    <div className={`quick-feature-toggles ${orientation}`}>
      {featureIds.map(featureId => (
        <FeatureToggle
          key={featureId}
          featureId={featureId}
          compact={true}
        />
      ))}
    </div>
  )
})