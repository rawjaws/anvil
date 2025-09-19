/**
 * State Field Listener Infrastructure
 * 
 * This module provides infrastructure for listening to state changes in
 * Capabilities, Enablers, and Requirements. It allows registering listeners
 * that will be triggered when specific fields change state.
 */

// Event types for state changes
export const STATE_CHANGE_EVENTS = {
  CAPABILITY_STATUS_CHANGE: 'capability_status_change',
  CAPABILITY_APPROVAL_CHANGE: 'capability_approval_change',
  ENABLER_STATUS_CHANGE: 'enabler_status_change',
  ENABLER_APPROVAL_CHANGE: 'enabler_approval_change',
  REQUIREMENT_STATUS_CHANGE: 'requirement_status_change',
  REQUIREMENT_APPROVAL_CHANGE: 'requirement_approval_change'
}

// Global listener registry
class StateListenerRegistry {
  constructor() {
    this.listeners = new Map()
  }

  /**
   * Register a listener for a specific event type
   * @param {string} eventType - The event type to listen for
   * @param {Function} listener - The listener function
   * @param {string} listenerId - Unique identifier for the listener
   */
  register(eventType, listener, listenerId) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Map())
    }
    
    this.listeners.get(eventType).set(listenerId, listener)
    console.log(`Registered listener ${listenerId} for event ${eventType}`)
  }

  /**
   * Unregister a listener
   * @param {string} eventType - The event type
   * @param {string} listenerId - The listener identifier
   */
  unregister(eventType, listenerId) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(listenerId)
      console.log(`Unregistered listener ${listenerId} for event ${eventType}`)
    }
  }

  /**
   * Trigger all listeners for a specific event
   * @param {string} eventType - The event type to trigger
   * @param {Object} eventData - Data to pass to listeners
   */
  trigger(eventType, eventData) {
    if (this.listeners.has(eventType)) {
      const eventListeners = this.listeners.get(eventType)
      console.log(`Triggering ${eventListeners.size} listeners for event ${eventType}`, eventData)
      
      eventListeners.forEach((listener, listenerId) => {
        try {
          listener(eventData)
        } catch (error) {
          console.error(`Error in listener ${listenerId} for event ${eventType}:`, error)
        }
      })
    }
  }

  /**
   * Get all registered listeners (for debugging)
   */
  getListeners() {
    const result = {}
    this.listeners.forEach((listeners, eventType) => {
      result[eventType] = Array.from(listeners.keys())
    })
    return result
  }
}

// Global instance
export const stateListenerRegistry = new StateListenerRegistry()

/**
 * Capability State Change Detector
 */
export class CapabilityStateListener {
  constructor(capabilityId) {
    this.capabilityId = capabilityId
    this.previousState = {}
  }

  /**
   * Check for state changes and trigger appropriate events
   * @param {Object} currentData - Current capability data
   */
  checkForChanges(currentData) {
    const currentStatus = currentData.status
    const currentApproval = currentData.approval

    // Check status change
    if (this.previousState.status !== currentStatus) {
      const eventData = {
        capabilityId: this.capabilityId,
        previousStatus: this.previousState.status,
        newStatus: currentStatus,
        timestamp: new Date().toISOString(),
        capabilityData: currentData
      }
      
      stateListenerRegistry.trigger(STATE_CHANGE_EVENTS.CAPABILITY_STATUS_CHANGE, eventData)
    }

    // Check approval change
    if (this.previousState.approval !== currentApproval) {
      const eventData = {
        capabilityId: this.capabilityId,
        previousApproval: this.previousState.approval,
        newApproval: currentApproval,
        timestamp: new Date().toISOString(),
        capabilityData: currentData
      }
      
      stateListenerRegistry.trigger(STATE_CHANGE_EVENTS.CAPABILITY_APPROVAL_CHANGE, eventData)
    }

    // Update previous state
    this.previousState = {
      status: currentStatus,
      approval: currentApproval
    }
  }
}

/**
 * Enabler State Change Detector
 */
export class EnablerStateListener {
  constructor(enablerId) {
    this.enablerId = enablerId
    this.previousState = {}
  }

  /**
   * Check for state changes and trigger appropriate events
   * @param {Object} currentData - Current enabler data
   */
  checkForChanges(currentData) {
    const currentStatus = currentData.status
    const currentApproval = currentData.approval

    // Check status change
    if (this.previousState.status !== currentStatus) {
      const eventData = {
        enablerId: this.enablerId,
        capabilityId: currentData.capabilityId,
        previousStatus: this.previousState.status,
        newStatus: currentStatus,
        timestamp: new Date().toISOString(),
        enablerData: currentData
      }
      
      stateListenerRegistry.trigger(STATE_CHANGE_EVENTS.ENABLER_STATUS_CHANGE, eventData)
    }

    // Check approval change
    if (this.previousState.approval !== currentApproval) {
      const eventData = {
        enablerId: this.enablerId,
        capabilityId: currentData.capabilityId,
        previousApproval: this.previousState.approval,
        newApproval: currentApproval,
        timestamp: new Date().toISOString(),
        enablerData: currentData
      }
      
      stateListenerRegistry.trigger(STATE_CHANGE_EVENTS.ENABLER_APPROVAL_CHANGE, eventData)
    }

    // Update previous state
    this.previousState = {
      status: currentStatus,
      approval: currentApproval
    }
  }
}

/**
 * Requirements State Change Detector
 */
export class RequirementStateListener {
  constructor(requirementId, requirementType, parentEnablerId) {
    this.requirementId = requirementId
    this.requirementType = requirementType // 'functional' or 'nonFunctional'
    this.parentEnablerId = parentEnablerId
    this.previousState = {}
  }

  /**
   * Check for state changes and trigger appropriate events
   * @param {Object} currentData - Current requirement data
   */
  checkForChanges(currentData) {
    const currentStatus = currentData.status
    const currentApproval = currentData.approval

    // Check status change
    if (this.previousState.status !== currentStatus) {
      const eventData = {
        requirementId: this.requirementId,
        requirementType: this.requirementType,
        parentEnablerId: this.parentEnablerId,
        previousStatus: this.previousState.status,
        newStatus: currentStatus,
        timestamp: new Date().toISOString(),
        requirementData: currentData
      }
      
      stateListenerRegistry.trigger(STATE_CHANGE_EVENTS.REQUIREMENT_STATUS_CHANGE, eventData)
    }

    // Check approval change
    if (this.previousState.approval !== currentApproval) {
      const eventData = {
        requirementId: this.requirementId,
        requirementType: this.requirementType,
        parentEnablerId: this.parentEnablerId,
        previousApproval: this.previousState.approval,
        newApproval: currentApproval,
        timestamp: new Date().toISOString(),
        requirementData: currentData
      }
      
      stateListenerRegistry.trigger(STATE_CHANGE_EVENTS.REQUIREMENT_APPROVAL_CHANGE, eventData)
    }

    // Update previous state
    this.previousState = {
      status: currentStatus,
      approval: currentApproval
    }
  }
}

/**
 * Helper function to create and manage state listeners
 */
export class StateListenerManager {
  constructor() {
    this.listeners = new Map()
  }

  /**
   * Create or get capability listener
   * @param {string} capabilityId 
   * @returns {CapabilityStateListener}
   */
  getCapabilityListener(capabilityId) {
    const key = `capability_${capabilityId}`
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new CapabilityStateListener(capabilityId))
    }
    return this.listeners.get(key)
  }

  /**
   * Create or get enabler listener
   * @param {string} enablerId 
   * @returns {EnablerStateListener}
   */
  getEnablerListener(enablerId) {
    const key = `enabler_${enablerId}`
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new EnablerStateListener(enablerId))
    }
    return this.listeners.get(key)
  }

  /**
   * Create or get requirement listener
   * @param {string} requirementId 
   * @param {string} requirementType 
   * @param {string} parentEnablerId 
   * @returns {RequirementStateListener}
   */
  getRequirementListener(requirementId, requirementType, parentEnablerId) {
    const key = `requirement_${requirementId}_${requirementType}_${parentEnablerId}`
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new RequirementStateListener(requirementId, requirementType, parentEnablerId))
    }
    return this.listeners.get(key)
  }

  /**
   * Clean up listeners for removed items
   * @param {string} listenerId 
   */
  removeListener(listenerId) {
    this.listeners.delete(listenerId)
  }
}

// Global state listener manager
export const stateListenerManager = new StateListenerManager()

/**
 * Automation Triggers
 * 
 * Automation behaviors are now implemented directly in form components
 * for simpler and more reliable operation.
 */