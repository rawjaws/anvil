/**
 * React Hook for State Field Listeners
 * 
 * This hook provides a convenient way to integrate state listeners
 * into React components for Capabilities, Enablers, and Requirements.
 */

import { useEffect, useRef } from 'react'
import { stateListenerManager, stateListenerRegistry, STATE_CHANGE_EVENTS } from '../utils/stateListeners'

/**
 * Hook for managing capability state listeners
 * @param {string} capabilityId - The capability ID
 * @param {Object} capabilityData - Current capability data
 * @returns {Object} - Listener registration functions
 */
export function useCapabilityStateListener(capabilityId, capabilityData) {
  const listenerRef = useRef(null)

  useEffect(() => {
    if (capabilityId) {
      listenerRef.current = stateListenerManager.getCapabilityListener(capabilityId)
      // Initialize with current state
      if (capabilityData) {
        listenerRef.current.checkForChanges(capabilityData)
      }
    }
  }, [capabilityId])

  // Check for state changes when relevant data updates
  useEffect(() => {
    if (listenerRef.current && capabilityId && capabilityData) {
      listenerRef.current.checkForChanges(capabilityData)
    }
  }, [capabilityData?.status, capabilityData?.approval])

  return {
    /**
     * Register a listener for capability status changes
     * @param {Function} callback - Callback function
     * @param {string} listenerId - Unique listener ID
     */
    onStatusChange: (callback, listenerId) => {
      stateListenerRegistry.register(STATE_CHANGE_EVENTS.CAPABILITY_STATUS_CHANGE, callback, listenerId)
    },

    /**
     * Register a listener for capability approval changes
     * @param {Function} callback - Callback function
     * @param {string} listenerId - Unique listener ID
     */
    onApprovalChange: (callback, listenerId) => {
      stateListenerRegistry.register(STATE_CHANGE_EVENTS.CAPABILITY_APPROVAL_CHANGE, callback, listenerId)
    }
  }
}

/**
 * Hook for managing enabler state listeners
 * @param {string} enablerId - The enabler ID
 * @param {Object} enablerData - Current enabler data
 * @returns {Object} - Listener registration functions
 */
export function useEnablerStateListener(enablerId, enablerData) {
  const listenerRef = useRef(null)

  useEffect(() => {
    if (enablerId) {
      listenerRef.current = stateListenerManager.getEnablerListener(enablerId)
      // Initialize with current state
      if (enablerData) {
        listenerRef.current.checkForChanges(enablerData)
      }
    }
  }, [enablerId])

  // Check for state changes when relevant data updates
  useEffect(() => {
    if (listenerRef.current && enablerId && enablerData) {
      listenerRef.current.checkForChanges(enablerData)
    }
  }, [enablerData?.status, enablerData?.approval])

  return {
    /**
     * Register a listener for enabler status changes
     * @param {Function} callback - Callback function
     * @param {string} listenerId - Unique listener ID
     */
    onStatusChange: (callback, listenerId) => {
      stateListenerRegistry.register(STATE_CHANGE_EVENTS.ENABLER_STATUS_CHANGE, callback, listenerId)
    },

    /**
     * Register a listener for enabler approval changes
     * @param {Function} callback - Callback function
     * @param {string} listenerId - Unique listener ID
     */
    onApprovalChange: (callback, listenerId) => {
      stateListenerRegistry.register(STATE_CHANGE_EVENTS.ENABLER_APPROVAL_CHANGE, callback, listenerId)
    }
  }
}

/**
 * Hook for managing requirement state listeners
 * @param {Array} requirements - Array of requirements
 * @param {string} requirementType - 'functional' or 'nonFunctional'
 * @param {string} parentEnablerId - Parent enabler ID
 * @returns {Object} - Listener registration functions
 */
export function useRequirementStateListeners(requirements, requirementType, parentEnablerId) {
  const listenersRef = useRef(new Map())

  useEffect(() => {
    if (parentEnablerId && requirements) {
      requirements.forEach((req) => {
        if (req.id) {
          const listener = stateListenerManager.getRequirementListener(req.id, requirementType, parentEnablerId)
          listenersRef.current.set(req.id, listener)
          listener.checkForChanges(req)
        }
      })
    }
  }, [requirements?.length, requirementType, parentEnablerId])

  // Check for state changes when requirements update
  useEffect(() => {
    if (requirements && parentEnablerId) {
      requirements.forEach((req) => {
        if (req.id) {
          const listener = listenersRef.current.get(req.id)
          if (listener) {
            listener.checkForChanges(req)
          }
        }
      })
    }
  }, [requirements])

  return {
    /**
     * Register a listener for requirement status changes
     * @param {Function} callback - Callback function
     * @param {string} listenerId - Unique listener ID
     */
    onStatusChange: (callback, listenerId) => {
      stateListenerRegistry.register(STATE_CHANGE_EVENTS.REQUIREMENT_STATUS_CHANGE, callback, listenerId)
    },

    /**
     * Register a listener for requirement approval changes
     * @param {Function} callback - Callback function
     * @param {string} listenerId - Unique listener ID
     */
    onApprovalChange: (callback, listenerId) => {
      stateListenerRegistry.register(STATE_CHANGE_EVENTS.REQUIREMENT_APPROVAL_CHANGE, callback, listenerId)
    }
  }
}

/**
 * Hook for registering general state change listeners
 * @returns {Object} - Registration and cleanup functions
 */
export function useStateChangeListeners() {
  const registeredListeners = useRef(new Set())

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      registeredListeners.current.forEach(({ eventType, listenerId }) => {
        stateListenerRegistry.unregister(eventType, listenerId)
      })
    }
  }, [])

  return {
    /**
     * Register a listener and track it for cleanup
     * @param {string} eventType - Event type
     * @param {Function} callback - Callback function
     * @param {string} listenerId - Unique listener ID
     */
    register: (eventType, callback, listenerId) => {
      stateListenerRegistry.register(eventType, callback, listenerId)
      registeredListeners.current.add({ eventType, listenerId })
    },

    /**
     * Unregister a specific listener
     * @param {string} eventType - Event type
     * @param {string} listenerId - Unique listener ID
     */
    unregister: (eventType, listenerId) => {
      stateListenerRegistry.unregister(eventType, listenerId)
      registeredListeners.current.delete({ eventType, listenerId })
    },

    /**
     * Get current listener registry state (for debugging)
     */
    getListeners: () => stateListenerRegistry.getListeners()
  }
}