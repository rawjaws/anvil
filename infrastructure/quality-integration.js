#!/usr/bin/env node

/**
 * Quality Integration System
 * Coordinates between Infrastructure Agent and Quality Agent testing systems
 */

const fs = require('fs-extra')
const path = require('path')
const axios = require('axios')
const EventEmitter = require('events')

class QualityIntegration extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      qualityAgentEndpoint: options.qualityAgentEndpoint || 'http://localhost:3000/api/quality',
      healthCheckerPath: path.join(__dirname, 'health-checker.js'),
      featureMonitorPath: path.join(__dirname, '..', 'monitoring', 'feature-team-monitor.js'),
      deploymentCoordinatorPath: path.join(__dirname, '..', 'scripts', 'deploy-coordinator.js'),
      branchManagerPath: path.join(__dirname, 'branch-manager.js'),
      qualityGatesPath: path.join(__dirname, '..', 'scripts', 'quality-gates.js'),
      integrationInterval: 60000, // 1 minute
      retryAttempts: 3,
      ...options
    }

    this.integrationStatus = {
      lastSync: null,
      qualityAgentConnected: false,
      infrastructureHealthy: false,
      activeIntegrations: new Map(),
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      }
    }

    this.qualityReports = []
    this.infrastructureAlerts = []

    this.init()
  }

  async init() {
    this.log('Initializing Quality Integration System...', 'info')

    // Test connection to Quality Agent
    await this.testQualityAgentConnection()

    // Load infrastructure components
    await this.loadInfrastructureComponents()

    // Set up integration listeners
    this.setupIntegrationListeners()

    // Start integration monitoring
    this.startIntegrationMonitoring()

    this.log('Quality Integration System initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  🔗',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      integration: '  🤝',
      quality: '  🎯'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async testQualityAgentConnection() {
    try {
      const response = await axios.get(`${this.config.qualityAgentEndpoint}/status`, {
        timeout: 5000
      })

      if (response.status === 200) {
        this.integrationStatus.qualityAgentConnected = true
        this.log('Quality Agent connection established', 'success')
      }

    } catch (error) {
      this.integrationStatus.qualityAgentConnected = false
      this.log(`Quality Agent connection failed: ${error.message}`, 'warning')
    }
  }

  async loadInfrastructureComponents() {
    try {
      // Load Quality Gates module for validation integration
      if (await fs.pathExists(this.config.qualityGatesPath)) {
        const QualityGates = require(this.config.qualityGatesPath)
        this.qualityGates = new QualityGates()
        this.log('Quality Gates component loaded', 'success')
      }

      // Load Health Checker
      if (await fs.pathExists(this.config.healthCheckerPath)) {
        const HealthChecker = require(this.config.healthCheckerPath)
        this.healthChecker = new HealthChecker()
        this.log('Health Checker component loaded', 'success')
      }

      // Load Feature Team Monitor
      if (await fs.pathExists(this.config.featureMonitorPath)) {
        const FeatureTeamMonitor = require(this.config.featureMonitorPath)
        this.featureMonitor = new FeatureTeamMonitor()
        this.log('Feature Team Monitor component loaded', 'success')
      }

      // Load Branch Manager
      if (await fs.pathExists(this.config.branchManagerPath)) {
        const BranchManager = require(this.config.branchManagerPath)
        this.branchManager = new BranchManager()
        this.log('Branch Manager component loaded', 'success')
      }

      // Load Deployment Coordinator
      if (await fs.pathExists(this.config.deploymentCoordinatorPath)) {
        const DeploymentCoordinator = require(this.config.deploymentCoordinatorPath)
        this.deploymentCoordinator = new DeploymentCoordinator()
        this.log('Deployment Coordinator component loaded', 'success')
      }

      this.integrationStatus.infrastructureHealthy = true

    } catch (error) {
      this.log(`Failed to load infrastructure components: ${error.message}`, 'error')
      this.integrationStatus.infrastructureHealthy = false
    }
  }

  setupIntegrationListeners() {
    // Health Checker events
    if (this.healthChecker) {
      this.healthChecker.on('healthAlert', (alert) => {
        this.handleInfrastructureAlert(alert)
      })

      this.healthChecker.on('healthUpdate', (status) => {
        this.handleHealthUpdate(status)
      })
    }

    // Feature Monitor events
    if (this.featureMonitor) {
      this.featureMonitor.on('metricAlert', (alert) => {
        this.handleFeatureAlert(alert)
      })

      this.featureMonitor.on('conflictsDetected', (conflicts) => {
        this.handleFeatureConflicts(conflicts)
      })
    }

    // Branch Manager events
    if (this.branchManager) {
      this.branchManager.on('branchCreated', (event) => {
        this.handleBranchEvent('created', event)
      })

      this.branchManager.on('branchMerged', (event) => {
        this.handleBranchEvent('merged', event)
      })

      this.branchManager.on('conflictDetected', (event) => {
        this.handleBranchConflict(event)
      })
    }

    // Deployment Coordinator events
    if (this.deploymentCoordinator) {
      this.deploymentCoordinator.on('deploymentStarted', (deployment) => {
        this.handleDeploymentEvent('started', deployment)
      })

      this.deploymentCoordinator.on('deploymentCompleted', (deployment) => {
        this.handleDeploymentEvent('completed', deployment)
      })

      this.deploymentCoordinator.on('deploymentFailed', (deployment) => {
        this.handleDeploymentEvent('failed', deployment)
      })
    }

    this.log('Integration event listeners configured', 'success')
  }

  startIntegrationMonitoring() {
    const performIntegrationSync = async () => {
      try {
        await this.syncWithQualityAgent()
        this.integrationStatus.lastSync = new Date()
      } catch (error) {
        this.log(`Integration sync failed: ${error.message}`, 'error')
      }
    }

    // Run immediately
    performIntegrationSync()

    // Set up interval
    setInterval(performIntegrationSync, this.config.integrationInterval)

    this.log('Integration monitoring started', 'success')
  }

  async syncWithQualityAgent() {
    if (!this.integrationStatus.qualityAgentConnected) {
      await this.testQualityAgentConnection()
      if (!this.integrationStatus.qualityAgentConnected) {
        throw new Error('Quality Agent not available')
      }
    }

    this.integrationStatus.metrics.totalRequests++

    try {
      // Send infrastructure status to Quality Agent
      const infrastructureData = await this.gatherInfrastructureData()
      await this.sendToQualityAgent('/infrastructure/status', infrastructureData)

      // Get quality requirements from Quality Agent
      const qualityRequirements = await this.getFromQualityAgent('/requirements')
      await this.processQualityRequirements(qualityRequirements)

      // Send quality reports
      if (this.qualityReports.length > 0) {
        await this.sendToQualityAgent('/reports', {
          reports: this.qualityReports.slice(-10) // Last 10 reports
        })
      }

      this.integrationStatus.metrics.successfulRequests++

    } catch (error) {
      this.integrationStatus.metrics.failedRequests++
      throw error
    }
  }

  async gatherInfrastructureData() {
    const data = {
      timestamp: new Date(),
      health: null,
      features: null,
      branches: null,
      deployments: null,
      alerts: this.infrastructureAlerts.slice(-20) // Last 20 alerts
    }

    // Gather health status
    if (this.healthChecker) {
      try {
        data.health = this.healthChecker.getHealthStatus()
      } catch (error) {
        this.log(`Failed to gather health data: ${error.message}`, 'error')
      }
    }

    // Gather feature monitoring data
    if (this.featureMonitor) {
      try {
        data.features = this.featureMonitor.getOverallStatus()
      } catch (error) {
        this.log(`Failed to gather feature data: ${error.message}`, 'error')
      }
    }

    // Gather branch status
    if (this.branchManager) {
      try {
        data.branches = this.branchManager.getBranchStatus()
      } catch (error) {
        this.log(`Failed to gather branch data: ${error.message}`, 'error')
      }
    }

    // Gather deployment status
    if (this.deploymentCoordinator) {
      try {
        data.deployments = this.deploymentCoordinator.getDeploymentStatus()
      } catch (error) {
        this.log(`Failed to gather deployment data: ${error.message}`, 'error')
      }
    }

    return data
  }

  async sendToQualityAgent(endpoint, data) {
    const url = `${this.config.qualityAgentEndpoint}${endpoint}`

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await axios.post(url, data, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Infrastructure-Agent': 'true'
          }
        })

        this.log(`Sent data to Quality Agent: ${endpoint}`, 'integration')
        return response.data

      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw new Error(`Failed to send to Quality Agent after ${attempt} attempts: ${error.message}`)
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  async getFromQualityAgent(endpoint) {
    const url = `${this.config.qualityAgentEndpoint}${endpoint}`

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'X-Infrastructure-Agent': 'true'
        }
      })

      this.log(`Received data from Quality Agent: ${endpoint}`, 'integration')
      return response.data

    } catch (error) {
      throw new Error(`Failed to get from Quality Agent: ${error.message}`)
    }
  }

  async processQualityRequirements(requirements) {
    if (!requirements || !requirements.requirements) {
      return
    }

    for (const requirement of requirements.requirements) {
      switch (requirement.type) {
        case 'health_check':
          await this.processHealthCheckRequirement(requirement)
          break

        case 'performance_validation':
          await this.processPerformanceRequirement(requirement)
          break

        case 'deployment_validation':
          await this.processDeploymentRequirement(requirement)
          break

        case 'feature_isolation':
          await this.processFeatureIsolationRequirement(requirement)
          break

        default:
          this.log(`Unknown requirement type: ${requirement.type}`, 'warning')
      }
    }
  }

  async processHealthCheckRequirement(requirement) {
    if (this.healthChecker) {
      try {
        const report = await this.healthChecker.generateHealthReport()
        await this.sendQualityReport('health_check', report, requirement.id)
      } catch (error) {
        this.log(`Health check requirement failed: ${error.message}`, 'error')
      }
    }
  }

  async processPerformanceRequirement(requirement) {
    if (this.featureMonitor) {
      try {
        const teams = requirement.teams || Object.keys(this.featureMonitor.config.featureTeams)
        const reports = {}

        for (const team of teams) {
          reports[team] = await this.featureMonitor.generateTeamReport(team)
        }

        await this.sendQualityReport('performance_validation', reports, requirement.id)
      } catch (error) {
        this.log(`Performance requirement failed: ${error.message}`, 'error')
      }
    }
  }

  async processDeploymentRequirement(requirement) {
    if (this.deploymentCoordinator) {
      try {
        const status = this.deploymentCoordinator.getDeploymentStatus()
        await this.sendQualityReport('deployment_validation', status, requirement.id)
      } catch (error) {
        this.log(`Deployment requirement failed: ${error.message}`, 'error')
      }
    }
  }

  async processFeatureIsolationRequirement(requirement) {
    if (this.featureMonitor) {
      try {
        const isolationReport = {}
        const teams = requirement.teams || Object.keys(this.featureMonitor.config.featureTeams)

        for (const team of teams) {
          const report = await this.featureMonitor.generateTeamReport(team)
          isolationReport[team] = {
            isolation: report.isolation,
            conflicts: report.conflicts
          }
        }

        await this.sendQualityReport('feature_isolation', isolationReport, requirement.id)
      } catch (error) {
        this.log(`Feature isolation requirement failed: ${error.message}`, 'error')
      }
    }
  }

  async sendQualityReport(type, data, requirementId = null) {
    const report = {
      id: `report-${Date.now()}-${type}`,
      type,
      requirementId,
      timestamp: new Date(),
      data,
      source: 'infrastructure-agent'
    }

    this.qualityReports.push(report)

    try {
      await this.sendToQualityAgent('/reports/submit', report)
      this.log(`Quality report sent: ${type}`, 'quality')
    } catch (error) {
      this.log(`Failed to send quality report: ${error.message}`, 'error')
    }
  }

  // Event handlers
  handleInfrastructureAlert(alert) {
    this.infrastructureAlerts.push({
      ...alert,
      source: 'health-checker',
      timestamp: new Date()
    })

    // Send critical alerts immediately
    if (alert.severity === 'critical') {
      this.sendToQualityAgent('/alerts/immediate', {
        alert,
        source: 'infrastructure'
      }).catch(error => {
        this.log(`Failed to send immediate alert: ${error.message}`, 'error')
      })
    }

    this.emit('infrastructureAlert', alert)
  }

  handleHealthUpdate(status) {
    // Monitor for degraded health
    if (status.overall === 'degraded' || status.overall === 'critical') {
      this.handleInfrastructureAlert({
        id: `health-${Date.now()}`,
        severity: status.overall === 'critical' ? 'critical' : 'high',
        message: `System health is ${status.overall}`,
        details: status
      })
    }

    this.emit('healthUpdate', status)
  }

  handleFeatureAlert(alert) {
    this.infrastructureAlerts.push({
      ...alert,
      source: 'feature-monitor',
      timestamp: new Date()
    })

    this.emit('featureAlert', alert)
  }

  handleFeatureConflicts(conflicts) {
    this.infrastructureAlerts.push({
      id: `conflicts-${Date.now()}`,
      source: 'feature-monitor',
      severity: 'high',
      message: `Feature conflicts detected for team ${conflicts.team}`,
      details: conflicts,
      timestamp: new Date()
    })

    this.emit('featureConflicts', conflicts)
  }

  handleBranchEvent(eventType, event) {
    this.log(`Branch ${eventType}: ${event.branchName} (${event.teamName})`, 'info')

    // Trigger quality validation for new merges
    if (eventType === 'merged' && this.qualityGates) {
      this.validateBranchQuality(event.branchName, event.teamName)
    }

    this.emit('branchEvent', { type: eventType, ...event })
  }

  handleBranchConflict(event) {
    this.infrastructureAlerts.push({
      ...event,
      source: 'branch-manager',
      severity: 'medium',
      timestamp: new Date()
    })

    this.emit('branchConflict', event)
  }

  handleDeploymentEvent(eventType, deployment) {
    this.log(`Deployment ${eventType}: ${deployment.id} (${deployment.team})`, 'info')

    // Trigger health checks for completed deployments
    if (eventType === 'completed' && this.healthChecker) {
      setTimeout(() => {
        this.validatePostDeploymentHealth(deployment)
      }, 30000) // Wait 30 seconds for deployment to settle
    }

    this.emit('deploymentEvent', { type: eventType, ...deployment })
  }

  async validateBranchQuality(branchName, teamName) {
    try {
      this.log(`Validating branch quality: ${branchName}`, 'quality')

      const result = await this.qualityGates.runAllGates()

      await this.sendQualityReport('branch_validation', {
        branch: branchName,
        team: teamName,
        result
      })

      if (!result.passed) {
        this.handleInfrastructureAlert({
          id: `branch-quality-${Date.now()}`,
          severity: 'high',
          message: `Branch quality validation failed: ${branchName}`,
          details: result
        })
      }

    } catch (error) {
      this.log(`Branch quality validation failed: ${error.message}`, 'error')
    }
  }

  async validatePostDeploymentHealth(deployment) {
    try {
      this.log(`Validating post-deployment health: ${deployment.id}`, 'quality')

      const healthReport = await this.healthChecker.generateHealthReport()

      await this.sendQualityReport('post_deployment_health', {
        deployment: deployment.id,
        team: deployment.team,
        environment: deployment.environment,
        health: healthReport
      })

      if (healthReport.summary.overall !== 'healthy') {
        this.handleInfrastructureAlert({
          id: `post-deploy-health-${Date.now()}`,
          severity: 'high',
          message: `Post-deployment health check failed: ${deployment.id}`,
          details: healthReport
        })
      }

    } catch (error) {
      this.log(`Post-deployment health validation failed: ${error.message}`, 'error')
    }
  }

  // API methods for external integration
  async validateDeployment(deploymentParams) {
    try {
      const validationResult = {
        timestamp: new Date(),
        deployment: deploymentParams,
        passed: true,
        failures: []
      }

      // Run quality gates if available
      if (this.qualityGates) {
        const gateResult = await this.qualityGates.runAllGates()
        if (gateResult.failed > 0) {
          validationResult.passed = false
          validationResult.failures.push('Quality gates failed')
        }
        validationResult.qualityGates = gateResult
      }

      // Check health status
      if (this.healthChecker) {
        const healthStatus = this.healthChecker.getHealthStatus()
        if (healthStatus.overall !== 'healthy') {
          validationResult.passed = false
          validationResult.failures.push('System health not optimal')
        }
        validationResult.health = healthStatus
      }

      // Check for feature conflicts
      if (this.featureMonitor && deploymentParams.team) {
        const teamReport = await this.featureMonitor.generateTeamReport(deploymentParams.team)
        if (teamReport.conflicts.total > 0) {
          validationResult.passed = false
          validationResult.failures.push('Feature conflicts detected')
        }
        validationResult.featureStatus = teamReport
      }

      return validationResult

    } catch (error) {
      return {
        timestamp: new Date(),
        deployment: deploymentParams,
        passed: false,
        failures: [`Validation error: ${error.message}`],
        error: error.message
      }
    }
  }

  getIntegrationStatus() {
    return {
      timestamp: Date.now(),
      status: this.integrationStatus,
      components: {
        healthChecker: !!this.healthChecker,
        featureMonitor: !!this.featureMonitor,
        branchManager: !!this.branchManager,
        deploymentCoordinator: !!this.deploymentCoordinator,
        qualityGates: !!this.qualityGates
      },
      alerts: {
        total: this.infrastructureAlerts.length,
        recent: this.infrastructureAlerts.slice(-5)
      },
      reports: {
        total: this.qualityReports.length,
        recent: this.qualityReports.slice(-3)
      }
    }
  }
}

module.exports = QualityIntegration

// CLI interface
if (require.main === module) {
  const integration = new QualityIntegration()

  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'status':
      console.log(JSON.stringify(integration.getIntegrationStatus(), null, 2))
      break

    case 'validate':
      const team = args[1]
      const branch = args[2]
      const environment = args[3]

      if (!team || !branch || !environment) {
        console.error('Usage: node quality-integration.js validate <team> <branch> <environment>')
        process.exit(1)
      }

      integration.validateDeployment({ team, branch, environment }).then(result => {
        console.log(JSON.stringify(result, null, 2))
        process.exit(result.passed ? 0 : 1)
      }).catch(error => {
        console.error(`Validation failed: ${error.message}`)
        process.exit(1)
      })
      break

    default:
      console.log('Available commands: status, validate <team> <branch> <environment>')

      // Start integration and keep process alive
      console.log('\n🤝 Quality Integration System started')
      console.log('🔗 Coordinating with Quality Agent...')
      console.log('Press Ctrl+C to stop')

      // Set up event listeners for CLI output
      integration.on('infrastructureAlert', (alert) => {
        console.log(`🚨 Infrastructure Alert: ${alert.message} (${alert.severity})`)
      })

      integration.on('deploymentEvent', (event) => {
        console.log(`📦 Deployment ${event.type}: ${event.id}`)
      })

      integration.on('branchEvent', (event) => {
        console.log(`🌿 Branch ${event.type}: ${event.branchName}`)
      })

      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Quality Integration System...')
        process.exit(0)
      })
  }
}