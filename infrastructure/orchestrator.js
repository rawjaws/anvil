#!/usr/bin/env node

/**
 * Infrastructure Orchestrator
 * Main coordinator for all infrastructure systems supporting parallel feature development
 */

const fs = require('fs-extra')
const path = require('path')
const EventEmitter = require('events')

const BranchManager = require('./branch-manager')
const HealthChecker = require('./health-checker')
const QualityIntegration = require('./quality-integration')
const DeploymentCoordinator = require('../scripts/deploy-coordinator')
const FeatureTeamMonitor = require('../monitoring/feature-team-monitor')

class InfrastructureOrchestrator extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      orchestrationMode: 'parallel-teams',
      autoStart: true,
      coordinationInterval: 30000, // 30 seconds
      teams: ['realtime-collaboration', 'ai-workflow'],
      environments: ['development', 'staging', 'production'],
      ...options
    }

    this.components = new Map()
    this.coordinationStatus = {
      initialized: false,
      componentsLoaded: 0,
      totalComponents: 5,
      lastCoordination: null,
      activeTeams: new Set(),
      activeDeployments: new Map(),
      systemHealth: 'unknown'
    }

    this.orchestrationEvents = []
    this.performanceMetrics = {
      coordinations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      averageResponseTime: 0
    }

    this.init()
  }

  async init() {
    this.log('🎯 Initializing Infrastructure Orchestrator for Parallel Feature Teams...', 'info')

    try {
      // Initialize all infrastructure components
      await this.initializeComponents()

      // Set up component coordination
      this.setupComponentCoordination()

      // Start orchestration
      if (this.config.autoStart) {
        this.startOrchestration()
      }

      this.coordinationStatus.initialized = true
      this.log('✅ Infrastructure Orchestrator fully initialized', 'success')

    } catch (error) {
      this.log(`❌ Orchestrator initialization failed: ${error.message}`, 'error')
      throw error
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  🎯',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      orchestration: '  🎼',
      coordination: '  🤝'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async initializeComponents() {
    this.log('Initializing infrastructure components...', 'info')

    // Initialize Branch Manager
    try {
      const branchManager = new BranchManager({
        featureTeams: {
          'realtime-collaboration': {
            prefix: 'feature/realtime',
            lead: 'realtime-team',
            dependencies: ['api', 'client', 'monitoring'],
            conflictResolution: 'automated-merge'
          },
          'ai-workflow': {
            prefix: 'feature/ai-workflow',
            lead: 'ai-team',
            dependencies: ['api', 'agents', 'validation'],
            conflictResolution: 'manual-review'
          }
        }
      })

      this.components.set('branchManager', branchManager)
      this.coordinationStatus.componentsLoaded++
      this.log('Branch Manager initialized', 'success')

    } catch (error) {
      this.log(`Branch Manager initialization failed: ${error.message}`, 'error')
    }

    // Initialize Health Checker
    try {
      const healthChecker = new HealthChecker({
        checkInterval: 30000,
        featureChecks: {
          'realtime-collaboration': {
            category: 'feature',
            checks: [
              { name: 'websocket_connection', type: 'websocket', endpoint: '/ws' },
              { name: 'realtime_api', type: 'http', endpoint: '/api/realtime/health' },
              { name: 'collaboration_sync', type: 'custom', handler: 'checkCollaborationSync' }
            ]
          },
          'ai-workflow': {
            category: 'feature',
            checks: [
              { name: 'ai_service', type: 'http', endpoint: '/api/ai/health' },
              { name: 'workflow_engine', type: 'http', endpoint: '/api/workflow/status' },
              { name: 'agent_pool', type: 'custom', handler: 'checkAgentPool' }
            ]
          }
        }
      })

      this.components.set('healthChecker', healthChecker)
      this.coordinationStatus.componentsLoaded++
      this.log('Health Checker initialized', 'success')

    } catch (error) {
      this.log(`Health Checker initialization failed: ${error.message}`, 'error')
    }

    // Initialize Feature Team Monitor
    try {
      const featureMonitor = new FeatureTeamMonitor({
        monitoringInterval: 15000,
        featureTeams: {
          'realtime-collaboration': {
            namespace: 'realtime',
            endpoints: ['/api/realtime/health', '/api/collaboration/status'],
            metrics: ['active_connections', 'message_latency', 'sync_conflicts']
          },
          'ai-workflow': {
            namespace: 'ai-workflow',
            endpoints: ['/api/ai/health', '/api/workflow/status'],
            metrics: ['active_workflows', 'ai_response_time', 'agent_utilization']
          }
        }
      })

      this.components.set('featureMonitor', featureMonitor)
      this.coordinationStatus.componentsLoaded++
      this.log('Feature Team Monitor initialized', 'success')

    } catch (error) {
      this.log(`Feature Team Monitor initialization failed: ${error.message}`, 'error')
    }

    // Initialize Deployment Coordinator
    try {
      const deploymentCoordinator = new DeploymentCoordinator({
        deploymentStrategy: 'blue-green',
        featureTeams: {
          'realtime-collaboration': {
            deploymentSlots: ['slot-1', 'slot-2'],
            healthChecks: ['/api/realtime/health', '/api/collaboration/status'],
            rollbackStrategy: 'instant'
          },
          'ai-workflow': {
            deploymentSlots: ['slot-3', 'slot-4'],
            healthChecks: ['/api/ai/health', '/api/workflow/status'],
            rollbackStrategy: 'gradual'
          }
        }
      })

      this.components.set('deploymentCoordinator', deploymentCoordinator)
      this.coordinationStatus.componentsLoaded++
      this.log('Deployment Coordinator initialized', 'success')

    } catch (error) {
      this.log(`Deployment Coordinator initialization failed: ${error.message}`, 'error')
    }

    // Initialize Quality Integration
    try {
      const qualityIntegration = new QualityIntegration({
        integrationInterval: 60000
      })

      this.components.set('qualityIntegration', qualityIntegration)
      this.coordinationStatus.componentsLoaded++
      this.log('Quality Integration initialized', 'success')

    } catch (error) {
      this.log(`Quality Integration initialization failed: ${error.message}`, 'error')
    }

    this.log(`✅ Loaded ${this.coordinationStatus.componentsLoaded}/${this.coordinationStatus.totalComponents} components`, 'success')
  }

  setupComponentCoordination() {
    this.log('Setting up component coordination...', 'coordination')

    // Set up event forwarding and coordination between components
    for (const [componentName, component] of this.components) {
      // Forward all events to orchestrator for coordination
      component.on('*', (...args) => {
        this.emit(`${componentName}Event`, ...args)
      })

      // Specific event handlers for coordination
      this.setupComponentEventHandlers(componentName, component)
    }

    // Set up cross-component coordination
    this.setupCrossComponentCoordination()

    this.log('Component coordination configured', 'success')
  }

  setupComponentEventHandlers(componentName, component) {
    switch (componentName) {
      case 'branchManager':
        component.on('branchCreated', (event) => {
          this.handleBranchCreated(event)
        })
        component.on('branchMerged', (event) => {
          this.handleBranchMerged(event)
        })
        component.on('conflictDetected', (event) => {
          this.handleBranchConflict(event)
        })
        break

      case 'healthChecker':
        component.on('healthAlert', (alert) => {
          this.handleHealthAlert(alert)
        })
        component.on('healthUpdate', (status) => {
          this.coordinationStatus.systemHealth = status.overall
        })
        break

      case 'featureMonitor':
        component.on('metricAlert', (alert) => {
          this.handleFeatureAlert(alert)
        })
        component.on('conflictsDetected', (conflicts) => {
          this.handleFeatureConflicts(conflicts)
        })
        break

      case 'deploymentCoordinator':
        component.on('deploymentStarted', (deployment) => {
          this.handleDeploymentStarted(deployment)
        })
        component.on('deploymentCompleted', (deployment) => {
          this.handleDeploymentCompleted(deployment)
        })
        component.on('deploymentFailed', (deployment) => {
          this.handleDeploymentFailed(deployment)
        })
        break

      case 'qualityIntegration':
        component.on('infrastructureAlert', (alert) => {
          this.handleInfrastructureAlert(alert)
        })
        break
    }
  }

  setupCrossComponentCoordination() {
    // When a branch is created, start monitoring for that team
    this.on('branchCreated', async (event) => {
      const featureMonitor = this.components.get('featureMonitor')
      if (featureMonitor) {
        this.coordinationStatus.activeTeams.add(event.teamName)
      }
    })

    // When deployment starts, increase health check frequency
    this.on('deploymentStarted', async (deployment) => {
      const healthChecker = this.components.get('healthChecker')
      if (healthChecker) {
        // Could implement dynamic health check frequency
        this.log(`Increased monitoring for deployment: ${deployment.id}`, 'coordination')
      }
    })

    // When health alert occurs during deployment, consider rollback
    this.on('healthAlert', async (alert) => {
      if (alert.severity === 'critical') {
        const deploymentCoordinator = this.components.get('deploymentCoordinator')
        if (deploymentCoordinator) {
          // Check if there are active deployments
          const deploymentStatus = deploymentCoordinator.getDeploymentStatus()
          if (deploymentStatus.active.count > 0) {
            this.log('Critical health alert during deployment - considering rollback', 'warning')
            this.emit('criticalAlertDuringDeployment', { alert, deployments: deploymentStatus.active })
          }
        }
      }
    })

    // Coordinate feature conflicts with deployment blocking
    this.on('featureConflicts', async (conflicts) => {
      const deploymentCoordinator = this.components.get('deploymentCoordinator')
      if (deploymentCoordinator && conflicts.total > 0) {
        this.log(`Blocking deployments for team ${conflicts.team} due to conflicts`, 'warning')
        // Could implement deployment blocking logic
      }
    })
  }

  startOrchestration() {
    this.log('🎼 Starting infrastructure orchestration...', 'orchestration')

    // Start coordination cycle
    this.startCoordinationCycle()

    // Start performance tracking
    this.startPerformanceTracking()

    // Emit orchestration started event
    this.emit('orchestrationStarted', {
      timestamp: new Date(),
      components: Array.from(this.components.keys()),
      teams: this.config.teams
    })

    this.log('Infrastructure orchestration active', 'success')
  }

  startCoordinationCycle() {
    const performCoordination = async () => {
      const startTime = Date.now()

      try {
        await this.coordinateComponents()
        this.performanceMetrics.successfulOperations++
        this.coordinationStatus.lastCoordination = new Date()
      } catch (error) {
        this.performanceMetrics.failedOperations++
        this.log(`Coordination cycle failed: ${error.message}`, 'error')
      }

      const duration = Date.now() - startTime
      this.updatePerformanceMetrics(duration)
      this.performanceMetrics.coordinations++
    }

    // Run coordination immediately
    performCoordination()

    // Set up coordination interval
    setInterval(performCoordination, this.config.coordinationInterval)

    this.log('Coordination cycle started', 'success')
  }

  async coordinateComponents() {
    // Gather status from all components
    const componentStatuses = await this.gatherComponentStatuses()

    // Perform coordination logic
    await this.performCoordinationLogic(componentStatuses)

    // Update orchestration events
    this.orchestrationEvents.push({
      timestamp: new Date(),
      type: 'coordination',
      statuses: componentStatuses
    })

    // Keep only last 100 events
    if (this.orchestrationEvents.length > 100) {
      this.orchestrationEvents = this.orchestrationEvents.slice(-100)
    }
  }

  async gatherComponentStatuses() {
    const statuses = {}

    for (const [componentName, component] of this.components) {
      try {
        switch (componentName) {
          case 'branchManager':
            statuses.branches = component.getBranchStatus()
            break
          case 'healthChecker':
            statuses.health = component.getHealthStatus()
            break
          case 'featureMonitor':
            statuses.features = component.getOverallStatus()
            break
          case 'deploymentCoordinator':
            statuses.deployments = component.getDeploymentStatus()
            break
          case 'qualityIntegration':
            statuses.quality = component.getIntegrationStatus()
            break
        }
      } catch (error) {
        this.log(`Failed to get status from ${componentName}: ${error.message}`, 'error')
        statuses[componentName] = { error: error.message }
      }
    }

    return statuses
  }

  async performCoordinationLogic(statuses) {
    // Check for system-wide issues
    if (statuses.health?.overall === 'critical') {
      await this.handleCriticalSystemState(statuses)
    }

    // Coordinate parallel team activities
    await this.coordinateParallelTeams(statuses)

    // Optimize resource allocation
    await this.optimizeResourceAllocation(statuses)

    // Validate integration points
    await this.validateIntegrationPoints(statuses)
  }

  async handleCriticalSystemState(statuses) {
    this.log('🚨 Critical system state detected - initiating emergency procedures', 'error')

    // Pause new deployments
    if (statuses.deployments?.queue?.length > 0) {
      this.log('Pausing deployment queue due to critical system state', 'warning')
      // Implementation would pause the deployment queue
    }

    // Increase monitoring frequency
    this.log('Increasing monitoring frequency', 'info')

    // Notify quality integration
    const qualityIntegration = this.components.get('qualityIntegration')
    if (qualityIntegration) {
      qualityIntegration.handleInfrastructureAlert({
        id: `critical-system-${Date.now()}`,
        severity: 'critical',
        message: 'System in critical state',
        details: statuses
      })
    }
  }

  async coordinateParallelTeams(statuses) {
    // Ensure team isolation
    if (statuses.features?.teams) {
      for (const [teamName, teamStatus] of Object.entries(statuses.features.teams)) {
        if (teamStatus.conflicts > 0) {
          this.log(`Team ${teamName} has ${teamStatus.conflicts} conflicts - coordinating resolution`, 'warning')
        }
      }
    }

    // Balance resource usage between teams
    if (statuses.features?.teamsMonitored > 1) {
      // Could implement resource balancing logic
      this.log('Coordinating resource allocation between parallel teams', 'coordination')
    }
  }

  async optimizeResourceAllocation(statuses) {
    // Monitor for resource contention
    if (statuses.health?.checks?.system) {
      const systemChecks = statuses.health.checks.system

      if (systemChecks.memory_usage?.status === 'degraded') {
        this.log('High memory usage detected - optimizing allocation', 'warning')
      }

      if (systemChecks.cpu_usage?.status === 'degraded') {
        this.log('High CPU usage detected - optimizing allocation', 'warning')
      }
    }
  }

  async validateIntegrationPoints(statuses) {
    // Validate component integration health
    const integrationIssues = []

    if (!statuses.quality?.status?.qualityAgentConnected) {
      integrationIssues.push('Quality Agent connection lost')
    }

    if (statuses.deployments?.active?.count > 0 && statuses.health?.overall !== 'healthy') {
      integrationIssues.push('Deployment active with degraded health')
    }

    if (integrationIssues.length > 0) {
      this.log(`Integration issues detected: ${integrationIssues.join(', ')}`, 'warning')
    }
  }

  startPerformanceTracking() {
    setInterval(() => {
      this.emit('performanceMetrics', this.performanceMetrics)
    }, 60000) // Every minute
  }

  updatePerformanceMetrics(duration) {
    const count = this.performanceMetrics.coordinations
    const currentAvg = this.performanceMetrics.averageResponseTime

    this.performanceMetrics.averageResponseTime =
      ((currentAvg * count) + duration) / (count + 1)
  }

  // Event handlers
  handleBranchCreated(event) {
    this.log(`Branch created: ${event.branchName} for team ${event.teamName}`, 'info')
    this.coordinationStatus.activeTeams.add(event.teamName)
    this.emit('branchCreated', event)
  }

  handleBranchMerged(event) {
    this.log(`Branch merged: ${event.branchName} for team ${event.teamName}`, 'info')
    this.emit('branchMerged', event)

    // Trigger post-merge validation
    setTimeout(() => {
      this.performPostMergeValidation(event)
    }, 5000)
  }

  handleBranchConflict(event) {
    this.log(`Branch conflict detected: ${event.branch}`, 'warning')
    this.emit('branchConflict', event)
  }

  handleHealthAlert(alert) {
    this.log(`Health alert: ${alert.message} (${alert.severity})`, 'warning')
    this.emit('healthAlert', alert)
  }

  handleFeatureAlert(alert) {
    this.log(`Feature alert: ${alert.team} - ${alert.metric} = ${alert.value}`, 'warning')
    this.emit('featureAlert', alert)
  }

  handleFeatureConflicts(conflicts) {
    this.log(`Feature conflicts for team ${conflicts.team}: ${conflicts.total} conflicts`, 'warning')
    this.emit('featureConflicts', conflicts)
  }

  handleDeploymentStarted(deployment) {
    this.log(`Deployment started: ${deployment.id} (${deployment.team} -> ${deployment.environment})`, 'info')
    this.coordinationStatus.activeDeployments.set(deployment.id, deployment)
    this.emit('deploymentStarted', deployment)
  }

  handleDeploymentCompleted(deployment) {
    this.log(`Deployment completed: ${deployment.id}`, 'success')
    this.coordinationStatus.activeDeployments.delete(deployment.id)
    this.emit('deploymentCompleted', deployment)
  }

  handleDeploymentFailed(deployment) {
    this.log(`Deployment failed: ${deployment.id} - ${deployment.error}`, 'error')
    this.coordinationStatus.activeDeployments.delete(deployment.id)
    this.emit('deploymentFailed', deployment)
  }

  handleInfrastructureAlert(alert) {
    this.log(`Infrastructure alert: ${alert.message}`, 'warning')
    this.emit('infrastructureAlert', alert)
  }

  async performPostMergeValidation(event) {
    this.log(`Performing post-merge validation for ${event.branchName}`, 'info')

    const qualityIntegration = this.components.get('qualityIntegration')
    if (qualityIntegration) {
      const validation = await qualityIntegration.validateDeployment({
        team: event.teamName,
        branch: event.branchName,
        environment: 'development'
      })

      if (!validation.passed) {
        this.log(`Post-merge validation failed: ${validation.failures.join(', ')}`, 'error')
        this.emit('postMergeValidationFailed', { event, validation })
      } else {
        this.log(`Post-merge validation passed for ${event.branchName}`, 'success')
      }
    }
  }

  // Public API methods
  async createFeatureBranch(teamName, branchSuffix) {
    const branchManager = this.components.get('branchManager')
    if (!branchManager) {
      throw new Error('Branch Manager not available')
    }

    return await branchManager.createFeatureBranch(teamName, branchSuffix)
  }

  async deployFeature(teamName, branchName, environment) {
    const deploymentCoordinator = this.components.get('deploymentCoordinator')
    if (!deploymentCoordinator) {
      throw new Error('Deployment Coordinator not available')
    }

    return await deploymentCoordinator.queueDeployment(teamName, branchName, environment)
  }

  async getTeamReport(teamName) {
    const featureMonitor = this.components.get('featureMonitor')
    if (!featureMonitor) {
      throw new Error('Feature Monitor not available')
    }

    return await featureMonitor.generateTeamReport(teamName)
  }

  getOrchestrationStatus() {
    return {
      timestamp: Date.now(),
      status: this.coordinationStatus,
      performance: this.performanceMetrics,
      events: this.orchestrationEvents.slice(-10), // Last 10 events
      components: Array.from(this.components.keys()),
      activeTeams: Array.from(this.coordinationStatus.activeTeams),
      activeDeployments: Array.from(this.coordinationStatus.activeDeployments.keys())
    }
  }

  async generateOrchestrationReport() {
    const componentStatuses = await this.gatherComponentStatuses()

    return {
      timestamp: new Date(),
      orchestrator: this.getOrchestrationStatus(),
      components: componentStatuses,
      summary: {
        systemHealth: this.coordinationStatus.systemHealth,
        activeTeams: this.coordinationStatus.activeTeams.size,
        activeDeployments: this.coordinationStatus.activeDeployments.size,
        totalCoordinations: this.performanceMetrics.coordinations,
        successRate: (this.performanceMetrics.successfulOperations /
                     (this.performanceMetrics.successfulOperations + this.performanceMetrics.failedOperations)) * 100
      },
      recommendations: this.generateOrchestrationRecommendations(componentStatuses)
    }
  }

  generateOrchestrationRecommendations(statuses) {
    const recommendations = []

    // System health recommendations
    if (statuses.health?.overall !== 'healthy') {
      recommendations.push({
        type: 'health',
        priority: 'high',
        message: 'System health is not optimal',
        action: 'Review health check failures and resolve issues'
      })
    }

    // Team coordination recommendations
    if (this.coordinationStatus.activeTeams.size > 1) {
      let totalConflicts = 0
      if (statuses.features?.teams) {
        totalConflicts = Object.values(statuses.features.teams)
          .reduce((sum, team) => sum + (team.conflicts || 0), 0)
      }

      if (totalConflicts > 0) {
        recommendations.push({
          type: 'coordination',
          priority: 'medium',
          message: `${totalConflicts} conflicts detected across teams`,
          action: 'Coordinate conflict resolution between teams'
        })
      }
    }

    // Performance recommendations
    if (this.performanceMetrics.averageResponseTime > 1000) {
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: 'High coordination response time',
        action: 'Optimize component coordination efficiency'
      })
    }

    return recommendations
  }
}

module.exports = InfrastructureOrchestrator

// CLI interface
if (require.main === module) {
  const orchestrator = new InfrastructureOrchestrator()

  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'status':
      console.log(JSON.stringify(orchestrator.getOrchestrationStatus(), null, 2))
      break

    case 'report':
      orchestrator.generateOrchestrationReport().then(report => {
        console.log(JSON.stringify(report, null, 2))
      })
      break

    case 'create-branch':
      const team = args[1]
      const suffix = args[2]
      if (!team) {
        console.error('Usage: node orchestrator.js create-branch <team> [suffix]')
        process.exit(1)
      }
      orchestrator.createFeatureBranch(team, suffix).then(branchName => {
        console.log(`Created branch: ${branchName}`)
      }).catch(error => {
        console.error(`Failed to create branch: ${error.message}`)
        process.exit(1)
      })
      break

    case 'deploy':
      const deployTeam = args[1]
      const branch = args[2]
      const environment = args[3]
      if (!deployTeam || !branch || !environment) {
        console.error('Usage: node orchestrator.js deploy <team> <branch> <environment>')
        process.exit(1)
      }
      orchestrator.deployFeature(deployTeam, branch, environment).then(deploymentId => {
        console.log(`Deployment queued: ${deploymentId}`)
      }).catch(error => {
        console.error(`Deployment failed: ${error.message}`)
        process.exit(1)
      })
      break

    case 'team-report':
      const reportTeam = args[1]
      if (!reportTeam) {
        console.error('Usage: node orchestrator.js team-report <team>')
        process.exit(1)
      }
      orchestrator.getTeamReport(reportTeam).then(report => {
        console.log(JSON.stringify(report, null, 2))
      }).catch(error => {
        console.error(`Report failed: ${error.message}`)
        process.exit(1)
      })
      break

    default:
      console.log('Available commands:')
      console.log('  status                              - Show orchestration status')
      console.log('  report                              - Generate comprehensive report')
      console.log('  create-branch <team> [suffix]       - Create feature branch')
      console.log('  deploy <team> <branch> <environment> - Deploy feature')
      console.log('  team-report <team>                  - Get team report')

      if (!command) {
        // Start orchestration and keep process alive
        console.log('\n🎯 Infrastructure Orchestrator started for Parallel Feature Development')
        console.log('🎼 Coordinating all infrastructure systems...')
        console.log('👥 Supporting teams: realtime-collaboration, ai-workflow')
        console.log('Press Ctrl+C to stop')

        // Set up event listeners for CLI output
        orchestrator.on('branchCreated', (event) => {
          console.log(`🌿 Branch created: ${event.branchName} (${event.teamName})`)
        })

        orchestrator.on('deploymentStarted', (deployment) => {
          console.log(`🚀 Deployment started: ${deployment.id} (${deployment.team})`)
        })

        orchestrator.on('healthAlert', (alert) => {
          console.log(`🚨 Health Alert: ${alert.message} (${alert.severity})`)
        })

        orchestrator.on('featureConflicts', (conflicts) => {
          console.log(`⚡ Feature Conflicts: ${conflicts.team} has ${conflicts.total} conflicts`)
        })

        process.on('SIGINT', () => {
          console.log('\n🛑 Shutting down Infrastructure Orchestrator...')
          process.exit(0)
        })
      }
  }
}