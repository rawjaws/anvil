#!/usr/bin/env node

/**
 * Branch Management System for Parallel Feature Development
 * Coordinates branch creation, merging, and conflict resolution for multiple teams
 */

const fs = require('fs-extra')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const EventEmitter = require('events')

const execAsync = promisify(exec)

class BranchManager extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      repoPath: options.repoPath || process.cwd(),
      baseBranch: options.baseBranch || 'main',
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
      },
      branchProtection: {
        requirePullRequest: true,
        requireStatusChecks: true,
        requireUpToDate: true,
        restrictPushes: true
      },
      integrationStrategy: 'feature-branch-integration',
      ...options
    }

    this.activeBranches = new Map()
    this.branchHistory = []
    this.conflictTracker = new Map()

    this.init()
  }

  async init() {
    this.log('Initializing Branch Management System...', 'info')

    // Check git repository
    await this.validateRepository()

    // Load existing branches
    await this.loadExistingBranches()

    // Set up branch protection rules
    await this.setupBranchProtection()

    this.log('Branch Management System initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  🌿',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      branch: '  🔀',
      merge: '  🔄'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async validateRepository() {
    try {
      const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', { cwd: this.config.repoPath })
      if (stdout.trim() !== 'true') {
        throw new Error('Not a git repository')
      }

      // Check if base branch exists
      await execAsync(`git show-ref --verify --quiet refs/heads/${this.config.baseBranch}`, { cwd: this.config.repoPath })

      this.log(`Repository validated (base: ${this.config.baseBranch})`, 'success')
    } catch (error) {
      throw new Error(`Repository validation failed: ${error.message}`)
    }
  }

  async loadExistingBranches() {
    try {
      const { stdout } = await execAsync('git branch -a --format="%(refname:short)"', { cwd: this.config.repoPath })
      const branches = stdout.trim().split('\n').filter(b => b && !b.startsWith('origin/'))

      for (const branch of branches) {
        if (this.isFeatureBranch(branch)) {
          const team = this.getTeamFromBranch(branch)
          if (team) {
            this.activeBranches.set(branch, {
              team,
              created: await this.getBranchCreationDate(branch),
              lastCommit: await this.getLastCommitHash(branch),
              status: 'active'
            })
          }
        }
      }

      this.log(`Loaded ${this.activeBranches.size} active feature branches`, 'info')
    } catch (error) {
      this.log(`Error loading branches: ${error.message}`, 'error')
    }
  }

  isFeatureBranch(branchName) {
    return Object.values(this.config.featureTeams).some(team =>
      branchName.startsWith(team.prefix)
    )
  }

  getTeamFromBranch(branchName) {
    for (const [teamName, config] of Object.entries(this.config.featureTeams)) {
      if (branchName.startsWith(config.prefix)) {
        return teamName
      }
    }
    return null
  }

  async getBranchCreationDate(branchName) {
    try {
      const { stdout } = await execAsync(
        `git log --reverse --format="%ci" ${branchName} | head -1`,
        { cwd: this.config.repoPath }
      )
      return new Date(stdout.trim())
    } catch {
      return new Date()
    }
  }

  async getLastCommitHash(branchName) {
    try {
      const { stdout } = await execAsync(
        `git rev-parse ${branchName}`,
        { cwd: this.config.repoPath }
      )
      return stdout.trim()
    } catch {
      return null
    }
  }

  async createFeatureBranch(teamName, branchSuffix = '') {
    if (!this.config.featureTeams[teamName]) {
      throw new Error(`Unknown team: ${teamName}`)
    }

    const teamConfig = this.config.featureTeams[teamName]
    const branchName = branchSuffix
      ? `${teamConfig.prefix}-${branchSuffix}`
      : `${teamConfig.prefix}-${Date.now()}`

    try {
      // Ensure we're on the base branch
      await execAsync(`git checkout ${this.config.baseBranch}`, { cwd: this.config.repoPath })

      // Pull latest changes
      await execAsync(`git pull origin ${this.config.baseBranch}`, { cwd: this.config.repoPath })

      // Create and checkout new branch
      await execAsync(`git checkout -b ${branchName}`, { cwd: this.config.repoPath })

      // Push branch to remote
      await execAsync(`git push -u origin ${branchName}`, { cwd: this.config.repoPath })

      // Track the branch
      this.activeBranches.set(branchName, {
        team: teamName,
        created: new Date(),
        lastCommit: await this.getLastCommitHash(branchName),
        status: 'active'
      })

      this.branchHistory.push({
        action: 'created',
        branch: branchName,
        team: teamName,
        timestamp: new Date()
      })

      this.log(`Created feature branch: ${branchName} for team ${teamName}`, 'branch')
      this.emit('branchCreated', { branchName, teamName })

      return branchName

    } catch (error) {
      throw new Error(`Failed to create branch ${branchName}: ${error.message}`)
    }
  }

  async mergeBranch(branchName, targetBranch = null) {
    targetBranch = targetBranch || this.config.baseBranch

    if (!this.activeBranches.has(branchName)) {
      throw new Error(`Branch ${branchName} not tracked`)
    }

    try {
      // Pre-merge checks
      await this.performPreMergeChecks(branchName, targetBranch)

      // Switch to target branch
      await execAsync(`git checkout ${targetBranch}`, { cwd: this.config.repoPath })

      // Pull latest changes
      await execAsync(`git pull origin ${targetBranch}`, { cwd: this.config.repoPath })

      // Perform merge
      const mergeResult = await this.performMerge(branchName, targetBranch)

      if (mergeResult.conflicts) {
        this.log(`Merge conflicts detected for ${branchName}`, 'warning')
        await this.handleMergeConflicts(branchName, targetBranch, mergeResult.conflicts)
        return { success: false, conflicts: mergeResult.conflicts }
      }

      // Update branch tracking
      this.activeBranches.get(branchName).status = 'merged'

      this.branchHistory.push({
        action: 'merged',
        branch: branchName,
        target: targetBranch,
        timestamp: new Date()
      })

      this.log(`Successfully merged ${branchName} into ${targetBranch}`, 'merge')
      this.emit('branchMerged', { branchName, targetBranch })

      return { success: true }

    } catch (error) {
      throw new Error(`Merge failed for ${branchName}: ${error.message}`)
    }
  }

  async performPreMergeChecks(branchName, targetBranch) {
    const checks = []

    // Check if branch is up to date
    try {
      await execAsync(`git fetch origin`, { cwd: this.config.repoPath })
      const { stdout } = await execAsync(
        `git rev-list --count ${branchName}..origin/${branchName}`,
        { cwd: this.config.repoPath }
      )
      if (parseInt(stdout.trim()) > 0) {
        checks.push(`Branch ${branchName} is behind remote`)
      }
    } catch (error) {
      checks.push(`Cannot check branch status: ${error.message}`)
    }

    // Check for conflicts with target branch
    try {
      await execAsync(`git merge-tree $(git merge-base ${branchName} ${targetBranch}) ${branchName} ${targetBranch}`, { cwd: this.config.repoPath })
    } catch (error) {
      if (error.stdout && error.stdout.includes('<<<<<<<')) {
        checks.push(`Potential conflicts detected with ${targetBranch}`)
      }
    }

    if (checks.length > 0) {
      this.log(`Pre-merge checks failed:\n${checks.join('\n')}`, 'warning')
      return { passed: false, issues: checks }
    }

    return { passed: true }
  }

  async performMerge(branchName, targetBranch) {
    try {
      const { stdout, stderr } = await execAsync(
        `git merge --no-ff ${branchName}`,
        { cwd: this.config.repoPath }
      )

      return { success: true, output: stdout }

    } catch (error) {
      // Check if it's a merge conflict
      if (error.stdout && error.stdout.includes('CONFLICT')) {
        const conflicts = this.parseConflicts(error.stdout)
        return { success: false, conflicts }
      }

      throw error
    }
  }

  parseConflicts(mergeOutput) {
    const conflictLines = mergeOutput.split('\n').filter(line =>
      line.includes('CONFLICT')
    )

    return conflictLines.map(line => {
      const match = line.match(/CONFLICT \((.+)\): (.+)/)
      return match ? {
        type: match[1],
        file: match[2],
        line: line
      } : { raw: line }
    })
  }

  async handleMergeConflicts(branchName, targetBranch, conflicts) {
    const team = this.activeBranches.get(branchName).team
    const teamConfig = this.config.featureTeams[team]

    this.conflictTracker.set(`${branchName}-${targetBranch}`, {
      conflicts,
      team,
      timestamp: new Date(),
      resolution: teamConfig.conflictResolution
    })

    if (teamConfig.conflictResolution === 'automated-merge') {
      return await this.attemptAutomatedResolution(branchName, conflicts)
    } else {
      return await this.createManualResolutionTask(branchName, targetBranch, conflicts)
    }
  }

  async attemptAutomatedResolution(branchName, conflicts) {
    this.log(`Attempting automated conflict resolution for ${branchName}`, 'info')

    // Simple automated resolution strategies
    for (const conflict of conflicts) {
      if (conflict.type === 'content' && conflict.file) {
        await this.resolveContentConflict(conflict.file)
      }
    }

    // Try to continue merge
    try {
      await execAsync(`git add .`, { cwd: this.config.repoPath })
      await execAsync(`git commit --no-edit`, { cwd: this.config.repoPath })

      this.log(`Automated resolution successful for ${branchName}`, 'success')
      return { resolved: true, method: 'automated' }

    } catch (error) {
      this.log(`Automated resolution failed for ${branchName}`, 'error')
      return { resolved: false, method: 'automated', error: error.message }
    }
  }

  async resolveContentConflict(filePath) {
    try {
      const fullPath = path.join(this.config.repoPath, filePath)
      let content = await fs.readFile(fullPath, 'utf8')

      // Simple strategy: prefer incoming changes over current
      content = content.replace(/<<<<<<< HEAD[\s\S]*?=======\n([\s\S]*?)>>>>>>> .+\n/g, '$1')

      await fs.writeFile(fullPath, content)
      this.log(`Resolved conflict in ${filePath}`, 'info')

    } catch (error) {
      this.log(`Failed to resolve conflict in ${filePath}: ${error.message}`, 'error')
    }
  }

  async createManualResolutionTask(branchName, targetBranch, conflicts) {
    const task = {
      id: `conflict-${Date.now()}`,
      branch: branchName,
      target: targetBranch,
      conflicts,
      status: 'pending',
      created: new Date(),
      assignee: this.activeBranches.get(branchName).team
    }

    // Save task for manual resolution
    const tasksDir = path.join(__dirname, 'conflict-resolution')
    await fs.ensureDir(tasksDir)
    await fs.writeJSON(path.join(tasksDir, `${task.id}.json`), task, { spaces: 2 })

    this.log(`Created manual resolution task for ${branchName}: ${task.id}`, 'warning')
    this.emit('conflictDetected', task)

    return { resolved: false, method: 'manual', taskId: task.id }
  }

  async syncBranches() {
    this.log('Synchronizing all feature branches...', 'info')

    const syncResults = []

    for (const [branchName, branchInfo] of this.activeBranches) {
      if (branchInfo.status !== 'active') continue

      try {
        // Fetch latest changes
        await execAsync(`git fetch origin`, { cwd: this.config.repoPath })

        // Check if branch needs updates
        const { stdout } = await execAsync(
          `git rev-list --count ${branchName}..origin/${this.config.baseBranch}`,
          { cwd: this.config.repoPath }
        )

        const commitsBehind = parseInt(stdout.trim())

        if (commitsBehind > 0) {
          // Attempt to rebase or merge latest changes
          await this.updateBranch(branchName, commitsBehind)
          syncResults.push({ branch: branchName, updated: true, commitsBehind })
        } else {
          syncResults.push({ branch: branchName, updated: false, commitsBehind: 0 })
        }

      } catch (error) {
        syncResults.push({ branch: branchName, error: error.message })
        this.log(`Sync failed for ${branchName}: ${error.message}`, 'error')
      }
    }

    this.log(`Branch sync completed: ${syncResults.length} branches processed`, 'success')
    return syncResults
  }

  async updateBranch(branchName, commitsBehind) {
    await execAsync(`git checkout ${branchName}`, { cwd: this.config.repoPath })

    try {
      // Try rebase first
      await execAsync(`git rebase origin/${this.config.baseBranch}`, { cwd: this.config.repoPath })
      this.log(`Rebased ${branchName} (${commitsBehind} commits)`, 'info')
    } catch (error) {
      // If rebase fails, try merge
      await execAsync(`git merge origin/${this.config.baseBranch}`, { cwd: this.config.repoPath })
      this.log(`Merged ${branchName} (${commitsBehind} commits)`, 'info')
    }

    // Update tracking
    this.activeBranches.get(branchName).lastCommit = await this.getLastCommitHash(branchName)
  }

  getBranchStatus() {
    const status = {
      timestamp: Date.now(),
      activeBranches: this.activeBranches.size,
      branches: {},
      conflicts: this.conflictTracker.size,
      teams: {}
    }

    // Branch details
    for (const [branchName, branchInfo] of this.activeBranches) {
      status.branches[branchName] = {
        ...branchInfo,
        age: Date.now() - branchInfo.created.getTime()
      }
    }

    // Team summary
    for (const teamName of Object.keys(this.config.featureTeams)) {
      const teamBranches = Array.from(this.activeBranches.entries())
        .filter(([_, info]) => info.team === teamName)

      status.teams[teamName] = {
        activeBranches: teamBranches.length,
        branches: teamBranches.map(([name]) => name)
      }
    }

    return status
  }

  async setupBranchProtection() {
    // This would integrate with Git hosting provider APIs
    // For now, just log the intended protection rules
    this.log('Branch protection rules configured:', 'info')
    for (const [rule, enabled] of Object.entries(this.config.branchProtection)) {
      this.log(`  ${rule}: ${enabled}`, 'info')
    }
  }

  async cleanup() {
    this.log('Cleaning up merged branches...', 'info')

    let cleanedCount = 0

    for (const [branchName, branchInfo] of this.activeBranches) {
      if (branchInfo.status === 'merged') {
        try {
          // Delete local branch
          await execAsync(`git branch -d ${branchName}`, { cwd: this.config.repoPath })

          // Delete remote branch
          await execAsync(`git push origin --delete ${branchName}`, { cwd: this.config.repoPath })

          this.activeBranches.delete(branchName)
          cleanedCount++

          this.log(`Cleaned up merged branch: ${branchName}`, 'info')

        } catch (error) {
          this.log(`Failed to cleanup ${branchName}: ${error.message}`, 'error')
        }
      }
    }

    this.log(`Cleanup completed: ${cleanedCount} branches removed`, 'success')
    return cleanedCount
  }
}

module.exports = BranchManager

// CLI interface
if (require.main === module) {
  const branchManager = new BranchManager()

  // Handle CLI commands
  const args = process.argv.slice(2)
  const command = args[0]

  switch (command) {
    case 'status':
      console.log(JSON.stringify(branchManager.getBranchStatus(), null, 2))
      break

    case 'sync':
      branchManager.syncBranches().then(results => {
        console.log('Sync results:', JSON.stringify(results, null, 2))
      })
      break

    case 'create':
      const team = args[1]
      const suffix = args[2]
      if (!team) {
        console.error('Usage: node branch-manager.js create <team> [suffix]')
        process.exit(1)
      }
      branchManager.createFeatureBranch(team, suffix).then(branchName => {
        console.log(`Created branch: ${branchName}`)
      })
      break

    case 'cleanup':
      branchManager.cleanup().then(count => {
        console.log(`Cleaned up ${count} branches`)
      })
      break

    default:
      console.log('Available commands: status, sync, create, cleanup')
  }
}