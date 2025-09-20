#!/usr/bin/env node

/**
 * Build Process Optimization Tool
 * Optimizes build processes, monitors build performance, and provides intelligent caching
 */

const fs = require('fs-extra')
const path = require('path')
const crypto = require('crypto')
const { exec, spawn } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

class BuildOptimizer {
  constructor(options = {}) {
    this.config = {
      projectRoot: process.cwd(),
      cacheDir: path.join(process.cwd(), '.build-cache'),
      buildScript: 'npm run build',
      cleanCommand: 'npm run clean',
      maxCacheSize: 500 * 1024 * 1024, // 500MB
      enableParallelBuilds: true,
      enableIncrementalBuilds: true,
      enableBundleAnalysis: true,
      ...options
    }

    this.buildStats = {
      totalBuilds: 0,
      successfulBuilds: 0,
      failedBuilds: 0,
      averageBuildTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    }

    this.currentBuild = null
    this.buildHistory = []
    this.dependencyGraph = new Map()

    this.init()
  }

  async init() {
    await this.ensureCacheDirectory()
    await this.loadBuildStats()
    await this.analyzeDependencies()
    this.log('Build optimizer initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      build: '  🔨',
      cache: '  💾',
      optimize: '  ⚡'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async ensureCacheDirectory() {
    await fs.ensureDir(this.config.cacheDir)
    await fs.ensureDir(path.join(this.config.cacheDir, 'builds'))
    await fs.ensureDir(path.join(this.config.cacheDir, 'dependencies'))
    await fs.ensureDir(path.join(this.config.cacheDir, 'artifacts'))
  }

  async loadBuildStats() {
    const statsPath = path.join(this.config.cacheDir, 'build-stats.json')

    try {
      if (await fs.pathExists(statsPath)) {
        this.buildStats = await fs.readJSON(statsPath)
        this.log(`Loaded build statistics: ${this.buildStats.totalBuilds} total builds`, 'cache')
      }
    } catch (error) {
      this.log(`Error loading build stats: ${error.message}`, 'warning')
    }
  }

  async saveBuildStats() {
    const statsPath = path.join(this.config.cacheDir, 'build-stats.json')

    try {
      await fs.writeJSON(statsPath, this.buildStats, { spaces: 2 })
    } catch (error) {
      this.log(`Error saving build stats: ${error.message}`, 'error')
    }
  }

  async analyzeDependencies() {
    this.log('Analyzing project dependencies...', 'info')

    try {
      // Analyze package.json dependencies
      const packagePath = path.join(this.config.projectRoot, 'package.json')
      if (await fs.pathExists(packagePath)) {
        const packageJson = await fs.readJSON(packagePath)
        this.dependencyGraph.set('package.json', {
          dependencies: Object.keys(packageJson.dependencies || {}),
          devDependencies: Object.keys(packageJson.devDependencies || {}),
          hash: await this.getFileHash(packagePath)
        })
      }

      // Analyze lock files
      const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']
      for (const lockFile of lockFiles) {
        const lockPath = path.join(this.config.projectRoot, lockFile)
        if (await fs.pathExists(lockPath)) {
          this.dependencyGraph.set(lockFile, {
            hash: await this.getFileHash(lockPath)
          })
        }
      }

      // Analyze source files
      await this.analyzeSourceFiles()

      this.log(`Dependency analysis complete: ${this.dependencyGraph.size} tracked files`, 'success')
    } catch (error) {
      this.log(`Error analyzing dependencies: ${error.message}`, 'error')
    }
  }

  async analyzeSourceFiles() {
    const sourcePatterns = [
      'src/**/*.{js,jsx,ts,tsx,vue}',
      'client/**/*.{js,jsx,ts,tsx,vue}',
      '*.config.{js,ts}',
      'vite.config.{js,ts}',
      'webpack.config.{js,ts}'
    ]

    for (const pattern of sourcePatterns) {
      try {
        const { globby } = await import('globby')
        const files = await globby(pattern, { cwd: this.config.projectRoot })

        for (const file of files.slice(0, 100)) { // Limit to prevent memory issues
          const filePath = path.join(this.config.projectRoot, file)
          this.dependencyGraph.set(file, {
            hash: await this.getFileHash(filePath),
            size: (await fs.stat(filePath)).size
          })
        }
      } catch (error) {
        // globby might not be available, continue without it
        this.log(`Could not analyze pattern ${pattern}: ${error.message}`, 'warning')
      }
    }
  }

  async getFileHash(filePath) {
    try {
      const content = await fs.readFile(filePath)
      return crypto.createHash('md5').update(content).digest('hex')
    } catch (error) {
      return null
    }
  }

  async calculateProjectHash() {
    const hashes = []

    for (const [file, info] of this.dependencyGraph) {
      if (info.hash) {
        hashes.push(`${file}:${info.hash}`)
      }
    }

    return crypto.createHash('md5').update(hashes.sort().join('|')).digest('hex')
  }

  async checkBuildCache() {
    if (!this.config.enableIncrementalBuilds) {
      return null
    }

    const currentHash = await this.calculateProjectHash()
    const cacheFile = path.join(this.config.cacheDir, 'builds', `${currentHash}.json`)

    if (await fs.pathExists(cacheFile)) {
      try {
        const cacheEntry = await fs.readJSON(cacheFile)

        // Verify cache artifacts still exist
        const artifactsExist = await Promise.all(
          cacheEntry.artifacts.map(artifact => fs.pathExists(artifact))
        )

        if (artifactsExist.every(exists => exists)) {
          this.buildStats.cacheHits++
          this.log(`Build cache hit: ${currentHash.substring(0, 8)}`, 'cache')
          return cacheEntry
        } else {
          this.log('Cache artifacts missing, will rebuild', 'warning')
        }
      } catch (error) {
        this.log(`Error reading cache: ${error.message}`, 'warning')
      }
    }

    this.buildStats.cacheMisses++
    return null
  }

  async saveBuildCache(buildResult) {
    if (!this.config.enableIncrementalBuilds || !buildResult.success) {
      return
    }

    const currentHash = await this.calculateProjectHash()
    const cacheFile = path.join(this.config.cacheDir, 'builds', `${currentHash}.json`)

    const cacheEntry = {
      hash: currentHash,
      timestamp: Date.now(),
      buildTime: buildResult.duration,
      artifacts: buildResult.artifacts || [],
      stats: buildResult.stats
    }

    try {
      await fs.writeJSON(cacheFile, cacheEntry, { spaces: 2 })
      this.log(`Build cache saved: ${currentHash.substring(0, 8)}`, 'cache')
    } catch (error) {
      this.log(`Error saving build cache: ${error.message}`, 'error')
    }
  }

  async cleanBuildCache() {
    this.log('Cleaning build cache...', 'info')

    try {
      const cacheBuildsDir = path.join(this.config.cacheDir, 'builds')
      const files = await fs.readdir(cacheBuildsDir)

      // Get file stats and sort by modification time
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(cacheBuildsDir, file)
          const stats = await fs.stat(filePath)
          return { file, filePath, mtime: stats.mtime, size: stats.size }
        })
      )

      fileStats.sort((a, b) => b.mtime - a.mtime) // Newest first

      let totalSize = fileStats.reduce((sum, file) => sum + file.size, 0)
      let deletedCount = 0

      // Delete oldest files if cache is too large
      for (const fileInfo of fileStats.reverse()) { // Start with oldest
        if (totalSize <= this.config.maxCacheSize) {
          break
        }

        await fs.remove(fileInfo.filePath)
        totalSize -= fileInfo.size
        deletedCount++
      }

      if (deletedCount > 0) {
        this.log(`Cleaned ${deletedCount} old cache entries`, 'success')
      }
    } catch (error) {
      this.log(`Error cleaning cache: ${error.message}`, 'error')
    }
  }

  async optimizeBuild() {
    this.log('Starting optimized build process...', 'build')

    const startTime = Date.now()
    let buildResult = {
      success: false,
      duration: 0,
      cached: false,
      artifacts: [],
      stats: {}
    }

    try {
      // Check for cached build
      const cachedBuild = await this.checkBuildCache()
      if (cachedBuild) {
        this.log('Using cached build artifacts', 'cache')
        buildResult = {
          ...buildResult,
          success: true,
          cached: true,
          duration: cachedBuild.buildTime,
          artifacts: cachedBuild.artifacts
        }

        this.updateBuildStats(buildResult)
        return buildResult
      }

      // Clean previous artifacts if needed
      if (this.config.cleanCommand) {
        this.log('Cleaning previous build artifacts...', 'build')
        await execAsync(this.config.cleanCommand)
      }

      // Run optimized build
      buildResult = await this.runOptimizedBuild()

      // Analyze build output
      if (buildResult.success && this.config.enableBundleAnalysis) {
        buildResult.stats = await this.analyzeBuildOutput()
      }

      // Cache successful build
      if (buildResult.success) {
        await this.saveBuildCache(buildResult)
      }

    } catch (error) {
      this.log(`Build optimization failed: ${error.message}`, 'error')
      buildResult.error = error.message
    }

    buildResult.duration = Date.now() - startTime
    this.updateBuildStats(buildResult)

    return buildResult
  }

  async runOptimizedBuild() {
    return new Promise((resolve, reject) => {
      this.log(`Executing: ${this.config.buildScript}`, 'build')

      const startTime = Date.now()
      const child = spawn('npm', ['run', 'build'], {
        cwd: this.config.projectRoot,
        stdio: 'pipe',
        shell: true
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
        // Stream output for real-time feedback
        process.stdout.write(data)
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
        process.stderr.write(data)
      })

      child.on('close', (code) => {
        const duration = Date.now() - startTime
        const success = code === 0

        if (success) {
          this.log(`Build completed successfully in ${duration}ms`, 'success')
        } else {
          this.log(`Build failed with exit code ${code}`, 'error')
        }

        resolve({
          success,
          duration,
          exitCode: code,
          stdout,
          stderr,
          artifacts: success ? this.detectBuildArtifacts() : []
        })
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  detectBuildArtifacts() {
    const possibleDirs = ['dist', 'build', 'out', '.next', 'public']
    const artifacts = []

    for (const dir of possibleDirs) {
      const dirPath = path.join(this.config.projectRoot, dir)
      if (fs.existsSync(dirPath)) {
        artifacts.push(dirPath)
      }
    }

    return artifacts
  }

  async analyzeBuildOutput() {
    this.log('Analyzing build output...', 'optimize')

    const stats = {
      timestamp: Date.now(),
      bundleSize: {},
      dependencies: {},
      performance: {}
    }

    try {
      // Analyze dist/build directory
      const artifacts = this.detectBuildArtifacts()

      for (const artifactPath of artifacts) {
        if (await fs.pathExists(artifactPath)) {
          const dirStats = await this.analyzeBuildDirectory(artifactPath)
          stats.bundleSize[path.basename(artifactPath)] = dirStats
        }
      }

      // Analyze package.json for dependency insights
      const packagePath = path.join(this.config.projectRoot, 'package.json')
      if (await fs.pathExists(packagePath)) {
        const packageJson = await fs.readJSON(packagePath)
        stats.dependencies = {
          total: Object.keys(packageJson.dependencies || {}).length,
          dev: Object.keys(packageJson.devDependencies || {}).length
        }
      }

    } catch (error) {
      this.log(`Error analyzing build output: ${error.message}`, 'warning')
    }

    return stats
  }

  async analyzeBuildDirectory(dirPath) {
    const stats = {
      totalSize: 0,
      fileCount: 0,
      jsSize: 0,
      cssSize: 0,
      assetSize: 0,
      largestFiles: []
    }

    try {
      const files = await this.getAllFiles(dirPath)

      for (const file of files) {
        const fileStat = await fs.stat(file)
        const ext = path.extname(file).toLowerCase()

        stats.totalSize += fileStat.size
        stats.fileCount++

        // Categorize by file type
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
          stats.jsSize += fileStat.size
        } else if (['.css', '.scss', '.sass'].includes(ext)) {
          stats.cssSize += fileStat.size
        } else {
          stats.assetSize += fileStat.size
        }

        // Track largest files
        stats.largestFiles.push({
          file: path.relative(dirPath, file),
          size: fileStat.size
        })
      }

      // Keep only top 10 largest files
      stats.largestFiles.sort((a, b) => b.size - a.size)
      stats.largestFiles = stats.largestFiles.slice(0, 10)

    } catch (error) {
      this.log(`Error analyzing directory ${dirPath}: ${error.message}`, 'warning')
    }

    return stats
  }

  async getAllFiles(dirPath) {
    const files = []

    async function scanDirectory(currentPath) {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          await scanDirectory(fullPath)
        } else {
          files.push(fullPath)
        }
      }
    }

    await scanDirectory(dirPath)
    return files
  }

  updateBuildStats(buildResult) {
    this.buildStats.totalBuilds++

    if (buildResult.success) {
      this.buildStats.successfulBuilds++
    } else {
      this.buildStats.failedBuilds++
    }

    // Update average build time (excluding cached builds)
    if (!buildResult.cached && buildResult.duration) {
      const totalTime = this.buildStats.averageBuildTime * (this.buildStats.totalBuilds - 1) + buildResult.duration
      this.buildStats.averageBuildTime = Math.round(totalTime / this.buildStats.totalBuilds)
    }

    // Add to build history
    this.buildHistory.push({
      timestamp: Date.now(),
      success: buildResult.success,
      duration: buildResult.duration,
      cached: buildResult.cached,
      stats: buildResult.stats
    })

    // Keep only last 50 builds in history
    if (this.buildHistory.length > 50) {
      this.buildHistory = this.buildHistory.slice(-50)
    }

    this.saveBuildStats()
  }

  generateOptimizationReport() {
    const report = {
      timestamp: Date.now(),
      summary: {
        totalBuilds: this.buildStats.totalBuilds,
        successRate: this.buildStats.totalBuilds > 0
          ? (this.buildStats.successfulBuilds / this.buildStats.totalBuilds * 100).toFixed(1) + '%'
          : '0%',
        averageBuildTime: this.buildStats.averageBuildTime,
        cacheEfficiency: this.buildStats.totalBuilds > 0
          ? (this.buildStats.cacheHits / this.buildStats.totalBuilds * 100).toFixed(1) + '%'
          : '0%'
      },
      performance: {
        cacheHits: this.buildStats.cacheHits,
        cacheMisses: this.buildStats.cacheMisses,
        buildHistory: this.buildHistory.slice(-10) // Last 10 builds
      },
      recommendations: this.generateRecommendations()
    }

    return report
  }

  generateRecommendations() {
    const recommendations = []

    // Cache efficiency recommendations
    const cacheEfficiency = this.buildStats.totalBuilds > 0
      ? this.buildStats.cacheHits / this.buildStats.totalBuilds
      : 0

    if (cacheEfficiency < 0.3) {
      recommendations.push({
        category: 'caching',
        priority: 'medium',
        message: 'Low cache efficiency detected',
        suggestion: 'Consider enabling incremental builds or reviewing dependency management'
      })
    }

    // Build time recommendations
    if (this.buildStats.averageBuildTime > 60000) { // > 1 minute
      recommendations.push({
        category: 'performance',
        priority: 'high',
        message: 'Long build times detected',
        suggestion: 'Consider enabling parallel builds, tree shaking, or build optimization'
      })
    }

    // Success rate recommendations
    const successRate = this.buildStats.totalBuilds > 0
      ? this.buildStats.successfulBuilds / this.buildStats.totalBuilds
      : 1

    if (successRate < 0.9) {
      recommendations.push({
        category: 'reliability',
        priority: 'high',
        message: 'Low build success rate',
        suggestion: 'Review build errors and consider improving dependency management'
      })
    }

    return recommendations
  }

  async watchBuild() {
    this.log('Starting build optimization in watch mode...', 'build')

    // Use chokidar for file watching if available
    try {
      const chokidar = require('chokidar')

      const watchPaths = [
        'src/**/*',
        'client/**/*',
        'package.json',
        '*.config.js'
      ]

      const watcher = chokidar.watch(watchPaths, {
        cwd: this.config.projectRoot,
        ignored: ['node_modules', '.git', 'dist', 'build']
      })

      watcher.on('change', async (path) => {
        this.log(`File changed: ${path}`, 'info')

        // Debounce builds (wait 1 second for additional changes)
        clearTimeout(this.buildTimeout)
        this.buildTimeout = setTimeout(async () => {
          await this.optimizeBuild()
        }, 1000)
      })

      this.log('File watcher started', 'success')

    } catch (error) {
      this.log('File watching not available, using polling mode', 'warning')

      // Fallback to periodic builds
      setInterval(async () => {
        await this.optimizeBuild()
      }, 30000) // Every 30 seconds
    }
  }

  async clean() {
    this.log('Cleaning build cache and artifacts...', 'info')

    try {
      await fs.remove(this.config.cacheDir)
      await this.ensureCacheDirectory()

      this.buildStats = {
        totalBuilds: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
        averageBuildTime: 0,
        cacheHits: 0,
        cacheMisses: 0
      }

      this.buildHistory = []

      this.log('Build cache cleaned successfully', 'success')
    } catch (error) {
      this.log(`Error cleaning cache: ${error.message}`, 'error')
    }
  }
}

module.exports = BuildOptimizer

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2)
  const command = args[0] || 'build'

  const optimizer = new BuildOptimizer()

  async function main() {
    try {
      switch (command) {
        case 'build':
          const result = await optimizer.optimizeBuild()
          console.log('\n📊 Build Result:')
          console.log(JSON.stringify(result, null, 2))
          process.exit(result.success ? 0 : 1)
          break

        case 'watch':
          await optimizer.watchBuild()
          // Keep process alive
          process.on('SIGINT', () => {
            console.log('\n🛑 Stopping build optimization...')
            process.exit(0)
          })
          break

        case 'report':
          const report = optimizer.generateOptimizationReport()
          console.log('\n📊 Build Optimization Report:')
          console.log(JSON.stringify(report, null, 2))
          break

        case 'clean':
          await optimizer.clean()
          break

        case 'cache':
          await optimizer.cleanBuildCache()
          break

        default:
          console.log('Usage: build-optimize.js [build|watch|report|clean|cache]')
          process.exit(1)
      }
    } catch (error) {
      console.error('Build optimization error:', error.message)
      process.exit(1)
    }
  }

  main()
}