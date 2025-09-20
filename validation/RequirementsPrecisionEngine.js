/**
 * Requirements Precision Engine
 * Advanced validation, conflict detection, and quality assurance for requirements
 */

const fs = require('fs-extra')
const path = require('path')

class RequirementsPrecisionEngine {
  constructor(config = {}) {
    this.config = {
      smartValidation: true,
      dependencyConflictDetection: true,
      impactAnalysis: true,
      traceabilityMatrix: true,
      naturalLanguageProcessing: false,
      realTimeValidation: true,
      autoFixSuggestions: true,
      validationRules: 'strict',
      // Performance optimizations
      maxConcurrentValidations: config.maxConcurrentValidations || 10,
      enableWorkerPool: config.enableWorkerPool !== false,
      cacheValidationResults: config.cacheValidationResults !== false,
      cacheTTL: config.cacheTTL || 300000, // 5 minutes
      enableBatchProcessing: config.enableBatchProcessing !== false,
      batchSize: config.batchSize || 20,
      ...config
    }

    this.validationCache = new Map()
    this.dependencyGraph = new Map()
    this.traceabilityMap = new Map()
    this.validationRules = this.initializeValidationRules()

    // Performance tracking
    this.performanceMetrics = {
      totalValidations: 0,
      cacheHits: 0,
      averageValidationTime: 0,
      batchedValidations: 0,
      concurrentValidations: 0
    }

    // Active validations tracking for concurrency control
    this.activeValidations = new Set()
  }

  /**
   * Initialize comprehensive validation rules
   */
  initializeValidationRules() {
    return {
      // Document Structure Rules
      requiredFields: {
        capability: ['id', 'title', 'description', 'status', 'priority', 'owner'],
        enabler: ['id', 'title', 'description', 'status', 'priority', 'owner', 'capabilityId'],
        functionalReq: ['reqId', 'requirement', 'description', 'priority', 'status'],
        nonFunctionalReq: ['reqId', 'type', 'requirement', 'priority', 'status', 'testApproach']
      },

      // ID Format Rules
      idPatterns: {
        capability: /^CAP-\d{4,6}$/,
        enabler: /^ENB-\d{4,6}$/,
        functionalReq: /^FR-\d{3,4}$/,
        nonFunctionalReq: /^NFR-\d{3,4}$/
      },

      // Status Validation Rules
      validStatuses: {
        capability: ['Draft', 'In Review', 'In Development', 'Testing', 'Deployed', 'Deprecated'],
        enabler: ['In Draft', 'Ready for Analysis', 'Ready for Analysis Review', 'In Analysis Review',
                 'Ready for Design', 'In Design', 'In Design Review', 'Ready to Implement',
                 'In Implementation', 'Implemented', 'Refactored'],
        requirement: ['In Draft', 'Ready for Review', 'In Review', 'Ready to Implement',
                     'In Implementation', 'Implemented', 'Refactored']
      },

      // Priority Rules
      validPriorities: ['Critical', 'High', 'Medium', 'Low'],

      // Quality Gates
      qualityGates: {
        minDescriptionLength: 20,
        maxDescriptionLength: 2000,
        requiredApprovalForImplementation: true,
        requireTestabilityForRequirements: true,
        forbiddenWords: ['TBD', 'TODO', 'FIXME', 'placeholder'],
        measurementRequiredForNFR: true
      }
    }
  }

  /**
   * Smart Requirement Validation - Comprehensive document analysis with performance optimizations
   */
  async validateDocument(document, documentType, context = {}) {
    const startTime = Date.now()
    const validationId = this.generateValidationId(document)

    // Update performance metrics
    this.performanceMetrics.totalValidations++

    // Check cache first if enabled
    if (this.config.cacheValidationResults && document.id) {
      const cached = this.getCachedValidation(document.id)
      if (cached) {
        this.performanceMetrics.cacheHits++
        return {
          ...cached,
          fromCache: true,
          processingTime: Date.now() - startTime
        }
      }
    }

    // Concurrency control
    if (this.activeValidations.size >= this.config.maxConcurrentValidations) {
      await this.waitForAvailableSlot()
    }

    this.activeValidations.add(validationId)
    this.performanceMetrics.concurrentValidations = this.activeValidations.size

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      qualityScore: 0,
      processingTime: 0,
      fromCache: false
    }

    try {
      // Optimized parallel validation checks with concurrency limiting
      const validationPromises = [
        this.validateStructure(document, documentType),
        this.validateContent(document, documentType),
        this.validateRelationships(document, documentType, context),
        this.validateQualityGates(document, documentType),
        this.validateBusinessLogic(document, documentType)
      ]

      // Execute validations with controlled concurrency
      const results = await this.executeWithConcurrencyLimit(validationPromises, 3)

      // Aggregate results
      results.forEach(result => {
        validationResults.errors.push(...(result.errors || []))
        validationResults.warnings.push(...(result.warnings || []))
        validationResults.suggestions.push(...(result.suggestions || []))
      })

      // Calculate quality score
      validationResults.qualityScore = this.calculateQualityScore(document, validationResults)
      validationResults.isValid = validationResults.errors.length === 0
      validationResults.processingTime = Date.now() - startTime

      // Update performance metrics
      this.updatePerformanceMetrics(validationResults.processingTime)

      // Cache validation results if enabled
      if (this.config.cacheValidationResults && document.id) {
        this.setCachedValidation(document.id, validationResults)
      }

      return validationResults

    } catch (error) {
      validationResults.isValid = false
      validationResults.errors.push({
        type: 'VALIDATION_ERROR',
        message: `Validation failed: ${error.message}`,
        severity: 'critical',
        field: 'document'
      })
      validationResults.processingTime = Date.now() - startTime
      return validationResults
    } finally {
      this.activeValidations.delete(validationId)
      this.performanceMetrics.concurrentValidations = this.activeValidations.size
    }
  }

  /**
   * Validate document structure and required fields
   */
  async validateStructure(document, documentType) {
    const result = { errors: [], warnings: [], suggestions: [] }
    const requiredFields = this.validationRules.requiredFields[documentType] || []

    // Check required fields
    requiredFields.forEach(field => {
      if (!document[field] || (typeof document[field] === 'string' && !document[field].trim())) {
        result.errors.push({
          type: 'MISSING_REQUIRED_FIELD',
          message: `Required field '${field}' is missing or empty`,
          severity: 'high',
          field,
          suggestion: `Please provide a value for ${field}`
        })
      }
    })

    // Validate ID format
    if (document.id) {
      const idPattern = this.validationRules.idPatterns[documentType]
      if (idPattern && !idPattern.test(document.id)) {
        result.errors.push({
          type: 'INVALID_ID_FORMAT',
          message: `ID '${document.id}' does not match required pattern`,
          severity: 'high',
          field: 'id',
          suggestion: `ID should match pattern: ${idPattern.source}`
        })
      }
    }

    // Validate status
    if (document.status) {
      const validStatuses = this.validationRules.validStatuses[documentType] || this.validationRules.validStatuses.capability
      if (!validStatuses.includes(document.status)) {
        result.errors.push({
          type: 'INVALID_STATUS',
          message: `Status '${document.status}' is not valid`,
          severity: 'medium',
          field: 'status',
          suggestion: `Valid statuses: ${validStatuses.join(', ')}`
        })
      }
    }

    // Validate priority
    if (document.priority && !this.validationRules.validPriorities.includes(document.priority)) {
      result.errors.push({
        type: 'INVALID_PRIORITY',
        message: `Priority '${document.priority}' is not valid`,
        severity: 'medium',
        field: 'priority',
        suggestion: `Valid priorities: ${this.validationRules.validPriorities.join(', ')}`
      })
    }

    return result
  }

  /**
   * Validate content quality and completeness
   */
  async validateContent(document, documentType) {
    const result = { errors: [], warnings: [], suggestions: [] }
    const { qualityGates } = this.validationRules

    // Description quality checks
    if (document.description) {
      const desc = document.description.trim()

      if (desc.length < qualityGates.minDescriptionLength) {
        result.warnings.push({
          type: 'DESCRIPTION_TOO_SHORT',
          message: `Description is too short (${desc.length} chars, minimum ${qualityGates.minDescriptionLength})`,
          severity: 'medium',
          field: 'description',
          suggestion: 'Provide more detailed description to improve clarity'
        })
      }

      if (desc.length > qualityGates.maxDescriptionLength) {
        result.warnings.push({
          type: 'DESCRIPTION_TOO_LONG',
          message: `Description is too long (${desc.length} chars, maximum ${qualityGates.maxDescriptionLength})`,
          severity: 'low',
          field: 'description',
          suggestion: 'Consider breaking down into smaller, more focused descriptions'
        })
      }

      // Check for forbidden words
      qualityGates.forbiddenWords.forEach(word => {
        if (desc.toLowerCase().includes(word.toLowerCase())) {
          result.warnings.push({
            type: 'FORBIDDEN_WORD_DETECTED',
            message: `Description contains placeholder word: '${word}'`,
            severity: 'medium',
            field: 'description',
            suggestion: `Replace '${word}' with actual content`
          })
        }
      })
    }

    // Validate requirements tables (for enablers)
    if (documentType === 'enabler') {
      if (document.functionalRequirements) {
        document.functionalRequirements.forEach((req, index) => {
          const reqResult = this.validateRequirement(req, 'functional', index)
          result.errors.push(...reqResult.errors)
          result.warnings.push(...reqResult.warnings)
          result.suggestions.push(...reqResult.suggestions)
        })
      }

      if (document.nonFunctionalRequirements) {
        document.nonFunctionalRequirements.forEach((req, index) => {
          const reqResult = this.validateRequirement(req, 'nonFunctional', index)
          result.errors.push(...reqResult.errors)
          result.warnings.push(...reqResult.warnings)
          result.suggestions.push(...reqResult.suggestions)
        })
      }
    }

    return result
  }

  /**
   * Validate individual requirement
   */
  validateRequirement(requirement, type, index) {
    const result = { errors: [], warnings: [], suggestions: [] }
    const prefix = type === 'functional' ? 'FR' : 'NFR'

    // Check required fields
    const requiredFields = this.validationRules.requiredFields[`${type}Req`] || []
    requiredFields.forEach(field => {
      if (!requirement[field] || (typeof requirement[field] === 'string' && !requirement[field].trim())) {
        result.errors.push({
          type: 'MISSING_REQUIREMENT_FIELD',
          message: `${type} requirement ${index + 1}: Missing required field '${field}'`,
          severity: 'high',
          field: `${type}Requirements[${index}].${field}`,
          suggestion: `Please provide a value for ${field}`
        })
      }
    })

    // Validate testability (for functional requirements)
    if (type === 'functional' && requirement.requirement) {
      const testabilityKeywords = ['shall', 'must', 'will', 'should', 'when', 'then', 'given']
      const hasTestableLanguage = testabilityKeywords.some(keyword =>
        requirement.requirement.toLowerCase().includes(keyword)
      )

      if (!hasTestableLanguage) {
        result.warnings.push({
          type: 'REQUIREMENT_NOT_TESTABLE',
          message: `Functional requirement ${index + 1} may not be easily testable`,
          severity: 'medium',
          field: `functionalRequirements[${index}].requirement`,
          suggestion: 'Use testable language like "shall", "must", "when...then", etc.'
        })
      }
    }

    // Validate measurement criteria (for non-functional requirements)
    if (type === 'nonFunctional' && requirement.requirement) {
      const hasMeasurableCriteria = /\d+|percentage|%|seconds?|minutes?|hours?|days?|<=|>=|<|>/.test(requirement.requirement)

      if (!hasMeasurableCriteria && requirement.type !== 'Security') {
        result.warnings.push({
          type: 'NFR_NOT_MEASURABLE',
          message: `Non-functional requirement ${index + 1} lacks measurable criteria`,
          severity: 'medium',
          field: `nonFunctionalRequirements[${index}].requirement`,
          suggestion: 'Include specific metrics, thresholds, or measurable criteria'
        })
      }
    }

    return result
  }

  /**
   * Validate relationships and dependencies
   */
  async validateRelationships(document, documentType, context) {
    const result = { errors: [], warnings: [], suggestions: [] }

    // Validate capability-enabler relationships
    if (documentType === 'enabler' && document.capabilityId) {
      if (context.capabilities) {
        const parentCapability = context.capabilities.find(cap => cap.id === document.capabilityId)
        if (!parentCapability) {
          result.errors.push({
            type: 'INVALID_CAPABILITY_REFERENCE',
            message: `Referenced capability '${document.capabilityId}' does not exist`,
            severity: 'critical',
            field: 'capabilityId',
            suggestion: 'Ensure the capability ID is correct and the capability exists'
          })
        }
      }
    }

    // Validate dependency cycles
    if (document.dependencies && document.dependencies.length > 0) {
      const cycleCheck = await this.detectDependencyCycles(document, context)
      if (cycleCheck.hasCycle) {
        result.errors.push({
          type: 'CIRCULAR_DEPENDENCY',
          message: `Circular dependency detected: ${cycleCheck.cycle.join(' → ')}`,
          severity: 'critical',
          field: 'dependencies',
          suggestion: 'Remove or restructure dependencies to eliminate circular references'
        })
      }
    }

    return result
  }

  /**
   * Validate quality gates and business logic
   */
  async validateQualityGates(document, documentType) {
    const result = { errors: [], warnings: [], suggestions: [] }
    const { qualityGates } = this.validationRules

    // Check approval requirements for implementation
    if (qualityGates.requiredApprovalForImplementation) {
      const implementationStatuses = ['In Implementation', 'Implemented', 'Deployed']
      if (implementationStatuses.includes(document.status) && document.approval !== 'Approved') {
        result.errors.push({
          type: 'MISSING_APPROVAL_FOR_IMPLEMENTATION',
          message: 'Implementation status requires approval',
          severity: 'critical',
          field: 'approval',
          suggestion: 'Obtain approval before moving to implementation status'
        })
      }
    }

    // Business logic validation
    if (documentType === 'enabler') {
      // Check for balanced requirement distribution
      const funcReqs = document.functionalRequirements?.length || 0
      const nonFuncReqs = document.nonFunctionalRequirements?.length || 0

      if (funcReqs > 0 && nonFuncReqs === 0) {
        result.suggestions.push({
          type: 'MISSING_NFR_SUGGESTIONS',
          message: 'Consider adding non-functional requirements',
          severity: 'low',
          field: 'nonFunctionalRequirements',
          suggestion: 'Add performance, security, or usability requirements'
        })
      }

      if (funcReqs === 0 && nonFuncReqs > 0) {
        result.warnings.push({
          type: 'MISSING_FUNCTIONAL_REQUIREMENTS',
          message: 'Enabler has non-functional requirements but no functional requirements',
          severity: 'medium',
          field: 'functionalRequirements',
          suggestion: 'Define what the enabler should do before defining how well it should do it'
        })
      }
    }

    return result
  }

  /**
   * Validate business logic specific to document type
   */
  async validateBusinessLogic(document, documentType) {
    const result = { errors: [], warnings: [], suggestions: [] }

    // Capability-specific validation
    if (documentType === 'capability') {
      // Check if capability has enablers
      if (document.enablers && document.enablers.length === 0) {
        result.suggestions.push({
          type: 'CAPABILITY_WITHOUT_ENABLERS',
          message: 'Capability has no enablers defined',
          severity: 'low',
          field: 'enablers',
          suggestion: 'Consider breaking down this capability into specific enablers'
        })
      }
    }

    // Enabler-specific validation
    if (documentType === 'enabler') {
      // Check for implementation plan
      if (!document.implementationPlan || !document.implementationPlan.trim()) {
        result.warnings.push({
          type: 'MISSING_IMPLEMENTATION_PLAN',
          message: 'Enabler lacks implementation plan',
          severity: 'medium',
          field: 'implementationPlan',
          suggestion: 'Provide detailed implementation steps and approach'
        })
      }

      // Check for acceptance criteria
      if (!document.acceptanceCriteria || !document.acceptanceCriteria.trim()) {
        result.warnings.push({
          type: 'MISSING_ACCEPTANCE_CRITERIA',
          message: 'Enabler lacks acceptance criteria',
          severity: 'medium',
          field: 'acceptanceCriteria',
          suggestion: 'Define clear acceptance criteria for completion verification'
        })
      }
    }

    return result
  }

  /**
   * Detect circular dependencies in document relationships
   */
  async detectDependencyCycles(document, context) {
    const visited = new Set()
    const recursionStack = new Set()
    const path = []

    const dfs = (currentId) => {
      if (recursionStack.has(currentId)) {
        // Found cycle
        const cycleStart = path.indexOf(currentId)
        return {
          hasCycle: true,
          cycle: path.slice(cycleStart).concat(currentId)
        }
      }

      if (visited.has(currentId)) {
        return { hasCycle: false }
      }

      visited.add(currentId)
      recursionStack.add(currentId)
      path.push(currentId)

      // Get dependencies for current document
      const currentDoc = this.findDocumentById(currentId, context)
      if (currentDoc && currentDoc.dependencies) {
        for (const depId of currentDoc.dependencies) {
          const result = dfs(depId)
          if (result.hasCycle) {
            return result
          }
        }
      }

      recursionStack.delete(currentId)
      path.pop()
      return { hasCycle: false }
    }

    return dfs(document.id)
  }

  /**
   * Find document by ID in context
   */
  findDocumentById(id, context) {
    if (context.capabilities) {
      const capability = context.capabilities.find(cap => cap.id === id)
      if (capability) return capability
    }

    if (context.enablers) {
      const enabler = context.enablers.find(en => en.id === id)
      if (enabler) return enabler
    }

    return null
  }

  /**
   * Calculate quality score based on validation results
   */
  calculateQualityScore(document, validationResults) {
    let score = 100

    // Deduct points for errors and warnings
    score -= validationResults.errors.length * 10
    score -= validationResults.warnings.length * 5

    // Bonus points for completeness
    if (document.description && document.description.length > 50) score += 5
    if (document.acceptanceCriteria) score += 5
    if (document.implementationPlan) score += 5

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score))
  }

  /**
   * Generate auto-fix suggestions for common issues
   */
  generateAutoFixSuggestions(validationResults) {
    const suggestions = []

    validationResults.errors.forEach(error => {
      switch (error.type) {
        case 'MISSING_REQUIRED_FIELD':
          suggestions.push({
            type: 'AUTO_FIX',
            action: 'ADD_FIELD',
            field: error.field,
            suggestedValue: this.getDefaultValueForField(error.field),
            confidence: 0.8
          })
          break

        case 'INVALID_ID_FORMAT':
          suggestions.push({
            type: 'AUTO_FIX',
            action: 'FORMAT_ID',
            field: 'id',
            suggestedValue: this.generateValidId(error.field),
            confidence: 0.9
          })
          break
      }
    })

    return suggestions
  }

  /**
   * Get default value for missing field
   */
  getDefaultValueForField(field) {
    const defaults = {
      status: 'Draft',
      priority: 'Medium',
      owner: 'Product Team',
      approval: 'Not Approved'
    }

    return defaults[field] || ''
  }

  /**
   * Generate valid ID based on document type
   */
  generateValidId(documentType) {
    const timestamp = Date.now().toString().slice(-6)
    const prefixes = {
      capability: 'CAP',
      enabler: 'ENB',
      functionalReq: 'FR',
      nonFunctionalReq: 'NFR'
    }

    const prefix = prefixes[documentType] || 'DOC'
    return `${prefix}-${timestamp}`
  }

  /**
   * Batch validate multiple documents concurrently
   */
  async batchValidate(documents, context = {}) {
    const startTime = Date.now()

    const validationPromises = documents.map(async (doc) => {
      const docType = this.detectDocumentType(doc)
      const result = await this.validateDocument(doc, docType, context)

      return {
        documentId: doc.id,
        documentType: docType,
        ...result
      }
    })

    const results = await Promise.all(validationPromises)

    return {
      results,
      summary: {
        totalDocuments: documents.length,
        validDocuments: results.filter(r => r.isValid).length,
        invalidDocuments: results.filter(r => !r.isValid).length,
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
        averageQualityScore: results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length,
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Detect document type from content
   */
  detectDocumentType(document) {
    if (document.id) {
      if (document.id.startsWith('CAP-')) return 'capability'
      if (document.id.startsWith('ENB-')) return 'enabler'
    }

    if (document.capabilityId) return 'enabler'
    if (document.enablers) return 'capability'

    return 'unknown'
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.validationCache.clear()
    this.dependencyGraph.clear()
    this.traceabilityMap.clear()
  }

  /**
   * Generate unique validation ID
   */
  generateValidationId(document) {
    return `val_${document.id || 'unknown'}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
  }

  /**
   * Wait for available validation slot
   */
  async waitForAvailableSlot() {
    while (this.activeValidations.size >= this.config.maxConcurrentValidations) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }

  /**
   * Execute promises with concurrency limit
   */
  async executeWithConcurrencyLimit(promises, limit) {
    const results = []
    const executing = []

    for (const promise of promises) {
      const p = Promise.resolve(promise).then(result => {
        executing.splice(executing.indexOf(p), 1)
        return result
      })

      results.push(p)
      executing.push(p)

      if (executing.length >= limit) {
        await Promise.race(executing)
      }
    }

    return Promise.all(results)
  }

  /**
   * Get cached validation result
   */
  getCachedValidation(documentId) {
    const cached = this.validationCache.get(documentId)
    if (!cached) return null

    // Check if cache is expired
    const isExpired = Date.now() - cached.timestamp > this.config.cacheTTL
    if (isExpired) {
      this.validationCache.delete(documentId)
      return null
    }

    return cached
  }

  /**
   * Set cached validation result
   */
  setCachedValidation(documentId, results) {
    this.validationCache.set(documentId, {
      ...results,
      timestamp: Date.now()
    })

    // Cleanup old cache entries if cache gets too large
    if (this.validationCache.size > 1000) {
      this.cleanupOldCacheEntries()
    }
  }

  /**
   * Cleanup old cache entries
   */
  cleanupOldCacheEntries() {
    const now = Date.now()
    const entriesToDelete = []

    for (const [key, value] of this.validationCache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL) {
        entriesToDelete.push(key)
      }
    }

    entriesToDelete.forEach(key => this.validationCache.delete(key))
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(processingTime) {
    const totalValidations = this.performanceMetrics.totalValidations
    this.performanceMetrics.averageValidationTime =
      ((this.performanceMetrics.averageValidationTime * (totalValidations - 1)) + processingTime) / totalValidations
  }

  /**
   * Get validation statistics including performance metrics
   */
  getValidationStats() {
    const cacheHitRate = this.performanceMetrics.totalValidations > 0
      ? this.performanceMetrics.cacheHits / this.performanceMetrics.totalValidations
      : 0

    return {
      cacheSize: this.validationCache.size,
      dependencyGraphSize: this.dependencyGraph.size,
      traceabilityMapSize: this.traceabilityMap.size,
      configuredRules: Object.keys(this.validationRules).length,
      performance: {
        ...this.performanceMetrics,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        activeValidations: this.activeValidations.size
      }
    }
  }
}

module.exports = RequirementsPrecisionEngine