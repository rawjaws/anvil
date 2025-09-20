/**
 * Requirements Precision Engine API Endpoints
 * Provides validation, conflict detection, and quality assurance services
 */

const RequirementsPrecisionEngine = require('../validation/RequirementsPrecisionEngine')
const fs = require('fs-extra')
const path = require('path')

// Global engine instance
let precisionEngine = null

/**
 * Initialize the precision engine with configuration
 */
async function initializePrecisionEngine() {
  try {
    const configPath = path.join(__dirname, '../config.json')
    const localConfigPath = path.join(__dirname, '../config.local.json')

    // Load configuration
    const configExists = await fs.pathExists(localConfigPath)
    const config = await fs.readJson(configExists ? localConfigPath : configPath)

    const engineConfig = config.features?.requirementsPrecisionEngine?.config || {}
    precisionEngine = new RequirementsPrecisionEngine(engineConfig)

    console.log('[PRECISION-ENGINE] Requirements Precision Engine initialized successfully')
    return true
  } catch (error) {
    console.error('[PRECISION-ENGINE] Failed to initialize:', error)
    return false
  }
}

/**
 * Get or initialize precision engine
 */
function getPrecisionEngine() {
  if (!precisionEngine) {
    console.warn('[PRECISION-ENGINE] Engine not initialized, creating default instance')
    precisionEngine = new RequirementsPrecisionEngine()
  }
  return precisionEngine
}

/**
 * Load documents from workspace for context
 */
async function loadDocumentContext() {
  try {
    const configPath = path.join(__dirname, '../config.json')
    const localConfigPath = path.join(__dirname, '../config.local.json')

    const configExists = await fs.pathExists(localConfigPath)
    const config = await fs.readJson(configExists ? localConfigPath : configPath)

    // Get active workspace
    const activeWorkspace = config.workspaces?.find(ws => ws.isActive) || config.workspaces?.[0]
    if (!activeWorkspace) {
      return { capabilities: [], enablers: [] }
    }

    const capabilities = []
    const enablers = []

    // Load documents from all project paths
    for (const pathConfig of activeWorkspace.projectPaths) {
      const projectPath = typeof pathConfig === 'string' ? pathConfig : pathConfig.path
      const fullPath = path.resolve(__dirname, '..', projectPath)

      if (await fs.pathExists(fullPath)) {
        const files = await fs.readdir(fullPath)

        for (const file of files) {
          if (file.endsWith('.md')) {
            try {
              const filePath = path.join(fullPath, file)
              const content = await fs.readFile(filePath, 'utf8')

              // Parse document metadata and content
              const document = parseDocumentFromMarkdown(content, file)

              if (document.id?.startsWith('CAP-')) {
                capabilities.push(document)
              } else if (document.id?.startsWith('ENB-')) {
                enablers.push(document)
              }
            } catch (error) {
              console.warn(`[PRECISION-ENGINE] Failed to load document ${file}:`, error.message)
            }
          }
        }
      }
    }

    return { capabilities, enablers }
  } catch (error) {
    console.error('[PRECISION-ENGINE] Failed to load document context:', error)
    return { capabilities: [], enablers: [] }
  }
}

/**
 * Parse document from markdown content
 */
function parseDocumentFromMarkdown(content, filename) {
  const document = { filename }

  // Extract metadata section
  const metadataMatch = content.match(/## Metadata\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (metadataMatch) {
    const metadataSection = metadataMatch[1]

    // Parse metadata fields
    const fieldMatches = metadataSection.match(/- \*\*([^*]+)\*\*:\s*(.+)/g) || []
    fieldMatches.forEach(match => {
      const fieldMatch = match.match(/- \*\*([^*]+)\*\*:\s*(.+)/)
      if (fieldMatch) {
        const key = fieldMatch[1].toLowerCase().replace(/\s+/g, '')
        const value = fieldMatch[2].trim()
        document[key] = value
      }
    })
  }

  // Extract title
  const titleMatch = content.match(/^#\s+(.+)/m)
  if (titleMatch) {
    document.title = titleMatch[1].trim()
  }

  // Extract description
  const descMatch = content.match(/## Overview\s*\n([\s\S]*?)(?=\n##|\n#|$)/i) ||
                   content.match(/## Description\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (descMatch) {
    document.description = descMatch[1].trim()
  }

  // Extract functional requirements (for enablers)
  const funcReqMatch = content.match(/## Functional Requirements\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (funcReqMatch) {
    document.functionalRequirements = parseRequirementsTable(funcReqMatch[1])
  }

  // Extract non-functional requirements (for enablers)
  const nonFuncReqMatch = content.match(/## Non-Functional Requirements\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (nonFuncReqMatch) {
    document.nonFunctionalRequirements = parseRequirementsTable(nonFuncReqMatch[1])
  }

  // Extract implementation plan
  const implPlanMatch = content.match(/## Implementation Plan\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (implPlanMatch) {
    document.implementationPlan = implPlanMatch[1].trim()
  }

  // Extract acceptance criteria
  const acceptanceMatch = content.match(/## Acceptance Criteria\s*\n([\s\S]*?)(?=\n##|\n#|$)/i)
  if (acceptanceMatch) {
    document.acceptanceCriteria = acceptanceMatch[1].trim()
  }

  return document
}

/**
 * Parse requirements table from markdown
 */
function parseRequirementsTable(tableContent) {
  const requirements = []
  const lines = tableContent.split('\n').filter(line => line.trim())

  // Find table rows (skip header and separator)
  const dataRows = lines.slice(2).filter(line => line.includes('|'))

  dataRows.forEach(row => {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell)
    if (cells.length >= 4) {
      requirements.push({
        reqId: cells[0],
        requirement: cells[1],
        description: cells[2] || '',
        priority: cells[3],
        status: cells[4] || 'In Draft',
        approval: cells[5] || 'Not Approved'
      })
    }
  })

  return requirements
}

/**
 * Setup validation API routes
 */
function setupValidationRoutes(app) {

  // POST /api/validation/document - Validate single document
  app.post('/api/validation/document', async (req, res) => {
    try {
      const { document, documentType, includeContext = true } = req.body

      if (!document) {
        return res.status(400).json({
          success: false,
          error: 'Document is required'
        })
      }

      const engine = getPrecisionEngine()
      let context = {}

      if (includeContext) {
        context = await loadDocumentContext()
      }

      const validationResult = await engine.validateDocument(document, documentType, context)

      res.json({
        success: true,
        validation: validationResult,
        context: {
          documentsInContext: (context.capabilities?.length || 0) + (context.enablers?.length || 0),
          processingTime: validationResult.processingTime
        }
      })

    } catch (error) {
      console.error('[VALIDATION-API] Document validation error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // POST /api/validation/batch - Validate multiple documents
  app.post('/api/validation/batch', async (req, res) => {
    try {
      const { documents, includeContext = true } = req.body

      if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({
          success: false,
          error: 'Documents array is required'
        })
      }

      const engine = getPrecisionEngine()
      let context = {}

      if (includeContext) {
        context = await loadDocumentContext()
      }

      const batchResult = await engine.batchValidate(documents, context)

      res.json({
        success: true,
        batchValidation: batchResult,
        context: {
          documentsInContext: (context.capabilities?.length || 0) + (context.enablers?.length || 0)
        }
      })

    } catch (error) {
      console.error('[VALIDATION-API] Batch validation error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // POST /api/validation/workspace - Validate entire workspace
  app.post('/api/validation/workspace', async (req, res) => {
    try {
      const engine = getPrecisionEngine()
      const context = await loadDocumentContext()

      const allDocuments = [...context.capabilities, ...context.enablers]

      if (allDocuments.length === 0) {
        return res.json({
          success: true,
          message: 'No documents found in workspace',
          workspaceValidation: {
            results: [],
            summary: {
              totalDocuments: 0,
              validDocuments: 0,
              invalidDocuments: 0,
              totalErrors: 0,
              totalWarnings: 0,
              averageQualityScore: 0,
              processingTime: 0
            }
          }
        })
      }

      const workspaceResult = await engine.batchValidate(allDocuments, context)

      res.json({
        success: true,
        workspaceValidation: workspaceResult,
        workspace: {
          totalCapabilities: context.capabilities.length,
          totalEnablers: context.enablers.length
        }
      })

    } catch (error) {
      console.error('[VALIDATION-API] Workspace validation error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // GET /api/validation/rules - Get validation rules and configuration
  app.get('/api/validation/rules', async (req, res) => {
    try {
      const engine = getPrecisionEngine()

      res.json({
        success: true,
        rules: engine.validationRules,
        config: engine.config,
        stats: engine.getValidationStats()
      })

    } catch (error) {
      console.error('[VALIDATION-API] Rules retrieval error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // POST /api/validation/auto-fix - Generate auto-fix suggestions
  app.post('/api/validation/auto-fix', async (req, res) => {
    try {
      const { validationResults } = req.body

      if (!validationResults) {
        return res.status(400).json({
          success: false,
          error: 'Validation results are required'
        })
      }

      const engine = getPrecisionEngine()
      const autoFixSuggestions = engine.generateAutoFixSuggestions(validationResults)

      res.json({
        success: true,
        autoFixSuggestions,
        suggestionsCount: autoFixSuggestions.length
      })

    } catch (error) {
      console.error('[VALIDATION-API] Auto-fix error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // DELETE /api/validation/cache - Clear validation cache
  app.delete('/api/validation/cache', async (req, res) => {
    try {
      const engine = getPrecisionEngine()
      engine.clearCache()

      res.json({
        success: true,
        message: 'Validation cache cleared successfully'
      })

    } catch (error) {
      console.error('[VALIDATION-API] Cache clear error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  // GET /api/validation/health - Get validation engine health status
  app.get('/api/validation/health', async (req, res) => {
    try {
      const engine = getPrecisionEngine()
      const context = await loadDocumentContext()

      res.json({
        success: true,
        health: {
          engineInitialized: !!precisionEngine,
          config: engine.config,
          stats: engine.getValidationStats(),
          contextStats: {
            capabilities: context.capabilities.length,
            enablers: context.enablers.length,
            totalDocuments: context.capabilities.length + context.enablers.length
          },
          timestamp: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('[VALIDATION-API] Health check error:', error)
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  })

  console.log('[VALIDATION-API] Validation endpoints registered successfully')
}

module.exports = {
  setupValidationRoutes,
  initializePrecisionEngine,
  getPrecisionEngine
}