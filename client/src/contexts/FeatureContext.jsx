import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react'
import { apiService } from '../services/apiService'

const FeatureContext = createContext()

const initialState = {
  features: {},
  loading: false,
  error: null
}

function featureReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }

    case 'SET_FEATURES':
      return {
        ...state,
        features: action.payload,
        loading: false,
        error: null
      }

    case 'UPDATE_FEATURE':
      return {
        ...state,
        features: {
          ...state.features,
          [action.payload.featureId]: {
            ...state.features[action.payload.featureId],
            ...action.payload.updates
          }
        }
      }

    default:
      return state
  }
}

export function FeatureProvider({ children }) {
  const [state, dispatch] = useReducer(featureReducer, initialState)

  const loadFeatures = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await apiService.getFeatures()
      dispatch({ type: 'SET_FEATURES', payload: response.features || {} })
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
    }
  }, [])

  const updateFeature = useCallback(async (featureId, updates) => {
    try {
      dispatch({ type: 'UPDATE_FEATURE', payload: { featureId, updates } })
      await apiService.updateFeature(featureId, updates)
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message })
      // Reload features on error to sync state
      loadFeatures()
    }
  }, [loadFeatures])

  const isFeatureEnabled = useCallback((featureId) => {
    return state.features[featureId]?.enabled || false
  }, [state.features])

  const getFeatureConfig = useCallback((featureId) => {
    return state.features[featureId]?.config || {}
  }, [state.features])

  const getFeatureFlag = useCallback((featureId, flagName) => {
    return state.features[featureId]?.config?.[flagName] || false
  }, [state.features])

  const getFeatureStatus = useCallback(async () => {
    try {
      return await apiService.getFeatureStatus()
    } catch (error) {
      throw new Error(`Failed to get feature status: ${error.message}`)
    }
  }, [])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    loadFeatures,
    updateFeature,
    isFeatureEnabled,
    getFeatureConfig,
    getFeatureFlag,
    getFeatureStatus
  }), [
    state,
    loadFeatures,
    updateFeature,
    isFeatureEnabled,
    getFeatureConfig,
    getFeatureFlag,
    getFeatureStatus
  ])

  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  )
}

export function useFeatures() {
  const context = useContext(FeatureContext)
  if (!context) {
    throw new Error('useFeatures must be used within a FeatureProvider')
  }
  return context
}

// Custom hooks for specific features
export function useAdvancedAnalytics() {
  const { isFeatureEnabled, getFeatureConfig } = useFeatures()
  return {
    enabled: isFeatureEnabled('advancedAnalytics'),
    config: getFeatureConfig('advancedAnalytics')
  }
}

export function useEnhancedExporting() {
  const { isFeatureEnabled, getFeatureConfig } = useFeatures()
  return {
    enabled: isFeatureEnabled('enhancedExporting'),
    config: getFeatureConfig('enhancedExporting')
  }
}

export function useCollaborativeReviews() {
  const { isFeatureEnabled, getFeatureConfig } = useFeatures()
  return {
    enabled: isFeatureEnabled('collaborativeReviews'),
    config: getFeatureConfig('collaborativeReviews')
  }
}

export function useAIWorkflowAutomation() {
  const { isFeatureEnabled, getFeatureConfig } = useFeatures()
  return {
    enabled: isFeatureEnabled('aiWorkflowAutomation'),
    config: getFeatureConfig('aiWorkflowAutomation')
  }
}

export function useTemplateMarketplace() {
  const { isFeatureEnabled, getFeatureConfig } = useFeatures()
  return {
    enabled: isFeatureEnabled('templateMarketplace'),
    config: getFeatureConfig('templateMarketplace')
  }
}