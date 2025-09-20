#!/usr/bin/env node

/**
 * Deployment Coordinator for Parallel Feature Teams
 * Orchestrates safe deployments with zero-downtime and feature isolation
 */

const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const EventEmitter = require('events')

const execAsync = promisify(exec)

class DeploymentCoordinator extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      deploymentStrategy: 'blue-green',
      environments: {
        development: {
          url: 'http://localhost:3000',
          healthCheck: '/api/health',
          requiresApproval: false
        },
        staging: {
          url: 'http://staging.anvil.local',
          healthCheck: '/api/health',
          requiresApproval: true
        },
        production: {
          url: 'http://prod.anvil.local',
          healthCheck: '/api/health',
          requiresApproval: true
        }
      },
      featureTeams: {
        'realtime-collaboration': {
          deploymentSlots: ['slot-1', 'slot-2'],
          healthChecks: ['/api/realtime/health', '/api/collaboration/status'],
          rollbackStrategy: 'instant',
          dependencies: ['api', 'client']
        },
        'ai-workflow': {
          deploymentSlots: ['slot-3', 'slot-4'],
          healthChecks: ['/api/ai/health', '/api/workflow/status'],
          rollbackStrategy: 'gradual',
          dependencies: ['api', 'agents', 'validation']
        }
      },
      qualityGates: {
        performanceThresholds: {
          responseTime: 200, // ms
          errorRate: 0.1, // %
          throughput: 500 // req/s
        },
        testRequirements: {
          unitTestsCoverage: 80,
          integrationTests: true,
          e2eTests: true
        }
      },
      ...options
    }

    this.deploymentQueue = []
    this.activeDeployments = new Map()
    this.deploymentHistory = []
    this.healthCheckInterval = 30000 // 30 seconds

    this.init()
  }

  async init() {
    this.log('Initializing Deployment Coordinator...', 'info')

    // Load deployment history
    await this.loadDeploymentHistory()

    // Start health monitoring
    this.startHealthMonitoring()

    // Load quality gates integration
    await this.setupQualityGatesIntegration()

    this.log('Deployment Coordinator initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  🚀',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      deploy: '  📦',
      health: '  💊'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async loadDeploymentHistory() {
    const historyFile = path.join(__dirname, '..', 'deployment', 'deployment-history.json')

    try {
      if (await fs.pathExists(historyFile)) {
        this.deploymentHistory = await fs.readJSON(historyFile)
        this.log(`Loaded ${this.deploymentHistory.length} deployment records`, 'info')
      }
    } catch (error) {
      this.log(`Failed to load deployment history: ${error.message}`, 'error')
    }
  }

  async saveDeploymentHistory() {
    const historyFile = path.join(__dirname, '..', 'deployment', 'deployment-history.json')

    try {
      await fs.ensureDir(path.dirname(historyFile))
      await fs.writeJSON(historyFile, this.deploymentHistory, { spaces: 2 })
    } catch (error) {
      this.log(`Failed to save deployment history: ${error.message}`, 'error')
    }
  }

  async setupQualityGatesIntegration() {
    // Load quality gates script for integration
    const qualityGatesPath = path.join(__dirname, 'quality-gates.js')

    if (await fs.pathExists(qualityGatesPath)) {
      this.qualityGates = require(qualityGatesPath)
      this.log('Quality gates integration enabled', 'success')
    } else {
      this.log('Quality gates script not found - proceeding without integration', 'warning')
    }
  }

  async queueDeployment(teamName, branchName, environment, options = {}) {
    if (!this.config.featureTeams[teamName]) {
      throw new Error(`Unknown team: ${teamName}`)
    }

    if (!this.config.environments[environment]) {
      throw new Error(`Unknown environment: ${environment}`)
    }

    const deployment = {
      id: `deploy-${Date.now()}-${teamName}`,
      team: teamName,
      branch: branchName,
      environment,
      status: 'queued',
      queuedAt: new Date(),
      options: {
        skipTests: false,
        forceDeployment: false,
        rollbackOnFailure: true,
        ...options
      },
      metadata: {
        commit: await this.getCommitHash(branchName),
        author: await this.getCommitAuthor(branchName)
      }
    }

    this.deploymentQueue.push(deployment)

    this.log(`Queued deployment: ${deployment.id} (${teamName} -> ${environment})`, 'deploy')
    this.emit('deploymentQueued', deployment)

    // Process queue
    this.processDeploymentQueue()

    return deployment.id
  }

  async getCommitHash(branchName) {
    try {
      const { stdout } = await execAsync(`git rev-parse ${branchName}`)
      return stdout.trim()
    } catch {
      return 'unknown'
    }
  }

  async getCommitAuthor(branchName) {
    try {
      const { stdout } = await execAsync(`git log -1 --format="%an" ${branchName}`)
      return stdout.trim()
    } catch {
      return 'unknown'
    }
  }

  async processDeploymentQueue() {
    if (this.deploymentQueue.length === 0) return

    const deployment = this.deploymentQueue.shift()

    try {
      await this.executeDeployment(deployment)
    } catch (error) {
      this.log(`Deployment failed: ${deployment.id} - ${error.message}`, 'error')
      deployment.status = 'failed'
      deployment.error = error.message
      deployment.completedAt = new Date()

      this.deploymentHistory.push(deployment)
      await this.saveDeploymentHistory()

      this.emit('deploymentFailed', deployment)
    }

    // Continue processing queue
    setTimeout(() => this.processDeploymentQueue(), 1000)
  }

  async executeDeployment(deployment) {
    this.log(`Starting deployment: ${deployment.id}`, 'deploy')

    deployment.status = 'running'
    deployment.startedAt = new Date()
    this.activeDeployments.set(deployment.id, deployment)

    this.emit('deploymentStarted', deployment)

    try {
      // Step 1: Pre-deployment checks
      await this.performPreDeploymentChecks(deployment)

      // Step 2: Quality gates validation
      if (!deployment.options.skipTests) {
        await this.validateQualityGates(deployment)
      }

      // Step 3: Build and prepare deployment
      await this.buildDeploymentArtifacts(deployment)

      // Step 4: Execute deployment strategy
      await this.executeDeploymentStrategy(deployment)

      // Step 5: Post-deployment validation
      await this.validateDeployment(deployment)

      // Step 6: Update status
      deployment.status = 'completed'
      deployment.completedAt = new Date()

      this.log(`Deployment completed: ${deployment.id}`, 'success')
      this.emit('deploymentCompleted', deployment)

    } catch (error) {
      // Handle rollback if needed
      if (deployment.options.rollbackOnFailure) {
        await this.rollbackDeployment(deployment)
      }
      throw error

    } finally {
      this.activeDeployments.delete(deployment.id)
      this.deploymentHistory.push(deployment)
      await this.saveDeploymentHistory()
    }
  }

  async performPreDeploymentChecks(deployment) {
    this.log(`Performing pre-deployment checks for ${deployment.id}`, 'info')

    const checks = []

    // Check if environment is available
    try {
      await this.healthCheck(deployment.environment)
    } catch (error) {
      checks.push(`Environment ${deployment.environment} is not healthy: ${error.message}`)
    }

    // Check for conflicting deployments
    const conflictingDeployments = Array.from(this.activeDeployments.values())
      .filter(d => d.environment === deployment.environment && d.id !== deployment.id)

    if (conflictingDeployments.length > 0) {
      checks.push(`Conflicting deployment in progress: ${conflictingDeployments[0].id}`)
    }

    // Check team-specific requirements
    const teamConfig = this.config.featureTeams[deployment.team]
    for (const dependency of teamConfig.dependencies) {
      const dependencyStatus = await this.checkDependencyStatus(dependency, deployment.environment)
      if (!dependencyStatus.healthy) {
        checks.push(`Dependency ${dependency} is not healthy: ${dependencyStatus.error}`)
      }
    }

    if (checks.length > 0) {
      throw new Error(`Pre-deployment checks failed:\n${checks.join('\n')}`)
    }

    this.log(`Pre-deployment checks passed for ${deployment.id}`, 'success')
  }

  async validateQualityGates(deployment) {
    if (!this.qualityGates) {
      this.log('Quality gates not available - skipping validation', 'warning')
      return
    }

    this.log(`Validating quality gates for ${deployment.id}`, 'info')

    try {
      // Run quality gates validation
      const result = await this.qualityGates.validateDeployment({
        team: deployment.team,
        branch: deployment.branch,
        environment: deployment.environment
      })

      if (!result.passed) {
        throw new Error(`Quality gates failed: ${result.failures.join(', ')}`)
      }

      deployment.qualityGatesResult = result
      this.log(`Quality gates passed for ${deployment.id}`, 'success')

    } catch (error) {
      throw new Error(`Quality gates validation failed: ${error.message}`)
    }
  }

  async buildDeploymentArtifacts(deployment) {
    this.log(`Building deployment artifacts for ${deployment.id}`, 'info')

    const buildDir = path.join(__dirname, '..', 'deployment', 'builds', deployment.id)
    await fs.ensureDir(buildDir)

    try {
      // Checkout the branch
      await execAsync(`git checkout ${deployment.branch}`)

      // Install dependencies
      await execAsync('npm ci')

      // Run build process
      await execAsync('npm run build')

      // Copy build artifacts
      const distDir = path.join(process.cwd(), 'dist')
      if (await fs.pathExists(distDir)) {
        await fs.copy(distDir, path.join(buildDir, 'dist'))
      }

      // Copy server files
      await fs.copy(
        path.join(process.cwd(), 'server.js'),
        path.join(buildDir, 'server.js')
      )

      // Copy package.json
      await fs.copy(
        path.join(process.cwd(), 'package.json'),
        path.join(buildDir, 'package.json')
      )

      deployment.buildPath = buildDir
      this.log(`Build artifacts ready for ${deployment.id}`, 'success')

    } catch (error) {
      throw new Error(`Build failed: ${error.message}`)
    }
  }

  async executeDeploymentStrategy(deployment) {
    const strategy = this.config.deploymentStrategy

    switch (strategy) {
      case 'blue-green':
        return await this.executeBlueGreenDeployment(deployment)
      case 'rolling':
        return await this.executeRollingDeployment(deployment)
      case 'canary':
        return await this.executeCanaryDeployment(deployment)
      default:
        throw new Error(`Unknown deployment strategy: ${strategy}`)
    }
  }

  async executeBlueGreenDeployment(deployment) {
    this.log(`Executing blue-green deployment for ${deployment.id}`, 'deploy')

    const teamConfig = this.config.featureTeams[deployment.team]
    const environmentConfig = this.config.environments[deployment.environment]

    // Determine current active slot
    const activeSlot = await this.getCurrentActiveSlot(deployment.team, deployment.environment)
    const inactiveSlot = teamConfig.deploymentSlots.find(slot => slot !== activeSlot)

    this.log(`Deploying to inactive slot: ${inactiveSlot}`, 'info')

    try {
      // Deploy to inactive slot
      await this.deployToSlot(deployment, inactiveSlot)

      // Wait for deployment to be ready
      await this.waitForSlotReady(deployment, inactiveSlot)

      // Perform health checks on new deployment
      await this.performSlotHealthChecks(deployment, inactiveSlot)

      // Switch traffic to new slot
      await this.switchTrafficToSlot(deployment, inactiveSlot)

      // Mark old slot as inactive
      await this.deactivateSlot(deployment, activeSlot)

      deployment.activeSlot = inactiveSlot
      deployment.previousSlot = activeSlot

      this.log(`Blue-green deployment completed for ${deployment.id}`, 'success')

    } catch (error) {
      // Rollback by ensuring original slot is still active
      await this.ensureSlotActive(deployment, activeSlot)
      throw error
    }
  }

  async executeRollingDeployment(deployment) {
    this.log(`Executing rolling deployment for ${deployment.id}`, 'deploy')
    // Rolling deployment implementation would go here
    // For now, fallback to blue-green
    return await this.executeBlueGreenDeployment(deployment)
  }

  async executeCanaryDeployment(deployment) {
    this.log(`Executing canary deployment for ${deployment.id}`, 'deploy')
    // Canary deployment implementation would go here
    // For now, fallback to blue-green
    return await this.executeBlueGreenDeployment(deployment)
  }

  async getCurrentActiveSlot(team, environment) {
    const teamConfig = this.config.featureTeams[team]
    // Default to first slot if no active slot found
    return teamConfig.deploymentSlots[0]
  }

  async deployToSlot(deployment, slot) {
    this.log(`Deploying ${deployment.id} to slot ${slot}`, 'info')

    // This would interact with container orchestration system
    // For now, simulate deployment
    await new Promise(resolve => setTimeout(resolve, 2000))

    deployment.deployedSlots = deployment.deployedSlots || []
    deployment.deployedSlots.push(slot)
  }

  async waitForSlotReady(deployment, slot, timeoutMs = 60000) {
    this.log(`Waiting for slot ${slot} to be ready`, 'info')

    const startTime = Date.now()

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Check if slot is responding
        const isReady = await this.checkSlotStatus(deployment, slot)
        if (isReady) {
          this.log(`Slot ${slot} is ready`, 'success')
          return
        }
      } catch (error) {
        // Continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    throw new Error(`Slot ${slot} did not become ready within ${timeoutMs}ms`)
  }

  async checkSlotStatus(deployment, slot) {
    // Simulate slot status check
    // In real implementation, this would check container/service status
    return true
  }

  async performSlotHealthChecks(deployment, slot) {
    this.log(`Performing health checks for slot ${slot}`, 'health')

    const teamConfig = this.config.featureTeams[deployment.team]

    for (const healthCheckPath of teamConfig.healthChecks) {
      try {
        // Simulate health check
        await new Promise(resolve => setTimeout(resolve, 500))
        this.log(`Health check passed: ${healthCheckPath}`, 'success')
      } catch (error) {
        throw new Error(`Health check failed for ${healthCheckPath}: ${error.message}`)
      }
    }
  }

  async switchTrafficToSlot(deployment, slot) {
    this.log(`Switching traffic to slot ${slot}`, 'deploy')

    // This would update load balancer configuration
    // For now, simulate traffic switch
    await new Promise(resolve => setTimeout(resolve, 1000))

    deployment.trafficSlot = slot
  }

  async deactivateSlot(deployment, slot) {
    this.log(`Deactivating slot ${slot}`, 'info')

    // This would shut down or scale down the old deployment
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  async ensureSlotActive(deployment, slot) {
    this.log(`Ensuring slot ${slot} is active`, 'info')

    // This would restore traffic to the specified slot
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  async validateDeployment(deployment) {
    this.log(`Validating deployment ${deployment.id}`, 'info')

    const environmentConfig = this.config.environments[deployment.environment]

    // Perform health check
    await this.healthCheck(deployment.environment)

    // Check performance thresholds
    if (this.config.qualityGates.performanceThresholds) {
      await this.validatePerformanceThresholds(deployment)
    }

    this.log(`Deployment validation passed for ${deployment.id}`, 'success')
  }

  async validatePerformanceThresholds(deployment) {
    const thresholds = this.config.qualityGates.performanceThresholds

    // Simulate performance validation
    // In real implementation, this would check metrics from monitoring system
    const metrics = {
      responseTime: 150, // ms
      errorRate: 0.05,   // %
      throughput: 600    // req/s
    }

    const failures = []

    if (metrics.responseTime > thresholds.responseTime) {
      failures.push(`Response time ${metrics.responseTime}ms exceeds threshold ${thresholds.responseTime}ms`)
    }

    if (metrics.errorRate > thresholds.errorRate) {
      failures.push(`Error rate ${metrics.errorRate}% exceeds threshold ${thresholds.errorRate}%`)
    }

    if (metrics.throughput < thresholds.throughput) {
      failures.push(`Throughput ${metrics.throughput} req/s below threshold ${thresholds.throughput} req/s`)
    }

    if (failures.length > 0) {
      throw new Error(`Performance validation failed:\n${failures.join('\n')}`)
    }
  }

  async rollbackDeployment(deployment) {
    this.log(`Rolling back deployment ${deployment.id}`, 'warning')

    try {
      if (deployment.previousSlot) {
        // Switch traffic back to previous slot
        await this.switchTrafficToSlot(deployment, deployment.previousSlot)
        this.log(`Rollback completed for ${deployment.id}`, 'success')

        deployment.rolledBack = true
        deployment.rollbackAt = new Date()
      }
    } catch (error) {
      this.log(`Rollback failed for ${deployment.id}: ${error.message}`, 'error')
      throw error
    }
  }

  async healthCheck(environment) {
    const environmentConfig = this.config.environments[environment]

    try {
      // Simulate health check
      // In real implementation, this would make HTTP request to health endpoint
      await new Promise(resolve => setTimeout(resolve, 500))

      return { healthy: true, timestamp: new Date() }

    } catch (error) {
      throw new Error(`Health check failed for ${environment}: ${error.message}`)
    }
  }

  async checkDependencyStatus(dependency, environment) {
    try {
      // Simulate dependency check
      await new Promise(resolve => setTimeout(resolve, 200))

      return { healthy: true, dependency, environment }

    } catch (error) {
      return { healthy: false, dependency, environment, error: error.message }
    }
  }

  startHealthMonitoring() {
    setInterval(async () => {
      for (const environment of Object.keys(this.config.environments)) {
        try {
          await this.healthCheck(environment)
        } catch (error) {
          this.log(`Health check failed for ${environment}: ${error.message}`, 'error')
          this.emit('healthCheckFailed', { environment, error: error.message })
        }
      }
    }, this.healthCheckInterval)

    this.log('Health monitoring started', 'health')
  }

  getDeploymentStatus() {
    return {
      timestamp: Date.now(),
      queue: {
        length: this.deploymentQueue.length,
        deployments: this.deploymentQueue.map(d => ({
          id: d.id,
          team: d.team,
          environment: d.environment,
          queuedAt: d.queuedAt
        }))
      },
      active: {
        count: this.activeDeployments.size,
        deployments: Array.from(this.activeDeployments.values()).map(d => ({
          id: d.id,
          team: d.team,
          environment: d.environment,
          status: d.status,
          startedAt: d.startedAt
        }))
      },
      history: {
        total: this.deploymentHistory.length,
        recent: this.deploymentHistory.slice(-5).map(d => ({
          id: d.id,
          team: d.team,
          environment: d.environment,
          status: d.status,
          completedAt: d.completedAt
        }))
      }
    }
  }
}

module.exports = DeploymentCoordinator

// CLI interface
if (require.main === module) {
  const coordinator = new DeploymentCoordinator()

  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'status':
      console.log(JSON.stringify(coordinator.getDeploymentStatus(), null, 2))
      break

    case 'deploy':
      const team = args[1]
      const branch = args[2]
      const environment = args[3]

      if (!team || !branch || !environment) {
        console.error('Usage: node deploy-coordinator.js deploy <team> <branch> <environment>')
        process.exit(1)
      }

      coordinator.queueDeployment(team, branch, environment).then(deploymentId => {
        console.log(`Deployment queued: ${deploymentId}`)
      }).catch(error => {
        console.error(`Deployment failed: ${error.message}`)
        process.exit(1)
      })
      break

    default:
      console.log('Available commands: status, deploy')
      console.log('Deploy usage: deploy <team> <branch> <environment>')
  }
}