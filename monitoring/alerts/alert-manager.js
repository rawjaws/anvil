#!/usr/bin/env node

/**
 * Resource Monitoring and Alert Management System
 * Provides intelligent alerting, escalation, and notification management
 */

const fs = require('fs-extra')
const path = require('path')
const EventEmitter = require('events')

class AlertManager extends EventEmitter {
  constructor(options = {}) {
    super()

    this.config = {
      alertsDir: path.join(__dirname, 'generated'),
      rulesDir: path.join(__dirname, 'rules'),
      notificationChannels: {
        console: true,
        file: true,
        email: false,
        webhook: false
      },
      escalationTimeouts: {
        warning: 5 * 60 * 1000,  // 5 minutes
        critical: 2 * 60 * 1000, // 2 minutes
        fatal: 30 * 1000         // 30 seconds
      },
      suppressionWindow: 10 * 60 * 1000, // 10 minutes
      maxAlertsPerHour: 50,
      ...options
    }

    this.activeAlerts = new Map()
    this.alertHistory = []
    this.suppressedAlerts = new Set()
    this.alertRules = []
    this.notificationQueue = []
    this.alertStats = {
      totalAlerts: 0,
      byLevel: { info: 0, warning: 0, critical: 0, fatal: 0 },
      byCategory: {},
      resolved: 0,
      suppressed: 0
    }

    this.init()
  }

  async init() {
    await this.ensureDirectories()
    await this.loadAlertRules()
    await this.loadAlertHistory()
    this.startAlertProcessor()
    this.log('Alert Manager initialized', 'success')
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '  ℹ️',
      success: '  ✅',
      warning: '  ⚠️',
      error: '  ❌',
      alert: '  🚨',
      resolved: '  ✅'
    }[level]

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async ensureDirectories() {
    await fs.ensureDir(this.config.alertsDir)
    await fs.ensureDir(this.config.rulesDir)

    // Create default rules file if it doesn't exist
    const defaultRulesPath = path.join(this.config.rulesDir, 'default-rules.json')
    if (!(await fs.pathExists(defaultRulesPath))) {
      await this.createDefaultRules()
    }
  }

  async createDefaultRules() {
    const defaultRules = [
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        description: 'Triggers when memory usage exceeds threshold',
        category: 'system',
        condition: {
          metric: 'memory.usagePercent',
          operator: '>',
          threshold: 85,
          duration: 60000 // 1 minute
        },
        severity: 'warning',
        enabled: true
      },
      {
        id: 'critical-memory-usage',
        name: 'Critical Memory Usage',
        description: 'Triggers when memory usage reaches critical levels',
        category: 'system',
        condition: {
          metric: 'memory.usagePercent',
          operator: '>',
          threshold: 95,
          duration: 30000 // 30 seconds
        },
        severity: 'critical',
        enabled: true
      },
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        description: 'Triggers when CPU usage is consistently high',
        category: 'system',
        condition: {
          metric: 'cpu.usage',
          operator: '>',
          threshold: 80,
          duration: 120000 // 2 minutes
        },
        severity: 'warning',
        enabled: true
      },
      {
        id: 'api-response-time',
        name: 'Slow API Response',
        description: 'Triggers when API response time is too slow',
        category: 'api',
        condition: {
          metric: 'api.responseTime',
          operator: '>',
          threshold: 2000, // 2 seconds
          duration: 60000
        },
        severity: 'warning',
        enabled: true
      },
      {
        id: 'api-error-rate',
        name: 'High API Error Rate',
        description: 'Triggers when API error rate exceeds threshold',
        category: 'api',
        condition: {
          metric: 'api.errorRate',
          operator: '>',
          threshold: 5, // 5%
          duration: 60000
        },
        severity: 'critical',
        enabled: true
      },
      {
        id: 'cache-miss-rate',
        name: 'High Cache Miss Rate',
        description: 'Triggers when cache efficiency drops',
        category: 'performance',
        condition: {
          metric: 'cache.hitRate',
          operator: '<',
          threshold: 70, // Below 70%
          duration: 300000 // 5 minutes
        },
        severity: 'warning',
        enabled: true
      },
      {
        id: 'build-failure',
        name: 'Build Failure',
        description: 'Triggers when build process fails',
        category: 'build',
        condition: {
          metric: 'build.success',
          operator: '==',
          threshold: false,
          duration: 0
        },
        severity: 'critical',
        enabled: true
      }
    ]

    await fs.writeJSON(
      path.join(this.config.rulesDir, 'default-rules.json'),
      defaultRules,
      { spaces: 2 }
    )

    this.log('Created default alert rules', 'success')
  }

  async loadAlertRules() {
    try {
      const rulesFiles = await fs.readdir(this.config.rulesDir)

      for (const file of rulesFiles) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.config.rulesDir, file)
          const rules = await fs.readJSON(filePath)

          if (Array.isArray(rules)) {
            this.alertRules.push(...rules.filter(rule => rule.enabled))
          }
        }
      }

      this.log(`Loaded ${this.alertRules.length} alert rules`, 'success')
    } catch (error) {
      this.log(`Error loading alert rules: ${error.message}`, 'error')
    }
  }

  async loadAlertHistory() {
    try {
      const historyPath = path.join(this.config.alertsDir, 'alert-history.json')

      if (await fs.pathExists(historyPath)) {
        const history = await fs.readJSON(historyPath)
        this.alertHistory = history.alerts || []
        this.alertStats = history.stats || this.alertStats

        this.log(`Loaded ${this.alertHistory.length} alerts from history`, 'success')
      }
    } catch (error) {
      this.log(`Error loading alert history: ${error.message}`, 'warning')
    }
  }

  async saveAlertHistory() {
    try {
      const historyData = {
        timestamp: Date.now(),
        alerts: this.alertHistory.slice(-1000), // Keep last 1000 alerts
        stats: this.alertStats
      }

      await fs.writeJSON(
        path.join(this.config.alertsDir, 'alert-history.json'),
        historyData,
        { spaces: 2 }
      )
    } catch (error) {
      this.log(`Error saving alert history: ${error.message}`, 'error')
    }
  }

  evaluateMetrics(metrics) {
    if (!metrics || typeof metrics !== 'object') {
      return
    }

    for (const rule of this.alertRules) {
      try {
        this.evaluateRule(rule, metrics)
      } catch (error) {
        this.log(`Error evaluating rule ${rule.id}: ${error.message}`, 'error')
      }
    }
  }

  evaluateRule(rule, metrics) {
    const metricValue = this.getMetricValue(metrics, rule.condition.metric)

    if (metricValue === null || metricValue === undefined) {
      return // Metric not available
    }

    const conditionMet = this.evaluateCondition(metricValue, rule.condition)
    const alertKey = `${rule.id}-${rule.category}`

    if (conditionMet) {
      if (!this.activeAlerts.has(alertKey)) {
        // New alert condition
        const alert = this.createAlert(rule, metricValue, metrics)
        this.activeAlerts.set(alertKey, alert)

        // Check if alert should be suppressed
        if (!this.isAlertSuppressed(alertKey)) {
          this.triggerAlert(alert)
        }
      } else {
        // Update existing alert
        const existingAlert = this.activeAlerts.get(alertKey)
        existingAlert.lastSeen = Date.now()
        existingAlert.occurrences++
        existingAlert.currentValue = metricValue
      }
    } else {
      // Condition no longer met, resolve alert if it exists
      if (this.activeAlerts.has(alertKey)) {
        const alert = this.activeAlerts.get(alertKey)
        this.resolveAlert(alert)
        this.activeAlerts.delete(alertKey)
      }
    }
  }

  getMetricValue(metrics, metricPath) {
    const parts = metricPath.split('.')
    let value = metrics

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return null
      }
    }

    return value
  }

  evaluateCondition(value, condition) {
    const { operator, threshold } = condition

    switch (operator) {
      case '>':
        return value > threshold
      case '>=':
        return value >= threshold
      case '<':
        return value < threshold
      case '<=':
        return value <= threshold
      case '==':
        return value === threshold
      case '!=':
        return value !== threshold
      default:
        return false
    }
  }

  createAlert(rule, currentValue, fullMetrics) {
    const alert = {
      id: this.generateAlertId(),
      ruleId: rule.id,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      severity: rule.severity,
      timestamp: Date.now(),
      lastSeen: Date.now(),
      currentValue,
      threshold: rule.condition.threshold,
      operator: rule.condition.operator,
      occurrences: 1,
      status: 'active',
      context: this.extractRelevantContext(fullMetrics, rule.category)
    }

    return alert
  }

  generateAlertId() {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  extractRelevantContext(metrics, category) {
    const context = { timestamp: Date.now() }

    // Extract relevant context based on category
    switch (category) {
      case 'system':
        if (metrics.system) {
          context.system = {
            memory: metrics.system.memory,
            cpu: metrics.system.cpu,
            uptime: metrics.system.uptime
          }
        }
        break

      case 'api':
        if (metrics.api) {
          context.api = {
            responseTime: metrics.api.responseTime,
            errorRate: metrics.api.errorRate,
            overview: metrics.api.overview
          }
        }
        break

      case 'performance':
        context.performance = {
          cache: metrics.api?.cache,
          pool: metrics.api?.pool
        }
        break

      case 'build':
        if (metrics.build) {
          context.build = metrics.build
        }
        break
    }

    return context
  }

  isAlertSuppressed(alertKey) {
    const suppressionKey = alertKey.split('-')[0] // Use rule ID for suppression

    if (this.suppressedAlerts.has(suppressionKey)) {
      this.alertStats.suppressed++
      return true
    }

    // Check rate limiting
    const recentAlerts = this.alertHistory.filter(
      alert => Date.now() - alert.timestamp < 60 * 60 * 1000 // Last hour
    ).length

    if (recentAlerts >= this.config.maxAlertsPerHour) {
      this.log('Alert rate limit exceeded, suppressing alerts', 'warning')
      return true
    }

    return false
  }

  triggerAlert(alert) {
    this.log(`🚨 ALERT: ${alert.name} - ${alert.description}`, 'alert')
    this.log(`   Value: ${alert.currentValue} ${alert.operator} ${alert.threshold}`, 'alert')
    this.log(`   Severity: ${alert.severity.toUpperCase()}`, 'alert')

    // Update statistics
    this.alertStats.totalAlerts++
    this.alertStats.byLevel[alert.severity] = (this.alertStats.byLevel[alert.severity] || 0) + 1
    this.alertStats.byCategory[alert.category] = (this.alertStats.byCategory[alert.category] || 0) + 1

    // Add to history
    this.alertHistory.push({
      ...alert,
      action: 'triggered'
    })

    // Add to notification queue
    this.queueNotification(alert)

    // Set up escalation if needed
    this.scheduleEscalation(alert)

    // Emit event for external listeners
    this.emit('alert', alert)

    // Save alert to file
    this.saveAlert(alert)

    // Add to suppression list to prevent spam
    this.suppressAlert(alert.ruleId)
  }

  resolveAlert(alert) {
    this.log(`✅ RESOLVED: ${alert.name}`, 'resolved')

    alert.status = 'resolved'
    alert.resolvedAt = Date.now()
    alert.duration = alert.resolvedAt - alert.timestamp

    // Update statistics
    this.alertStats.resolved++

    // Add to history
    this.alertHistory.push({
      ...alert,
      action: 'resolved'
    })

    // Remove from suppression
    this.suppressedAlerts.delete(alert.ruleId)

    // Emit event
    this.emit('alertResolved', alert)

    // Save resolved alert
    this.saveAlert(alert)
  }

  suppressAlert(ruleId) {
    this.suppressedAlerts.add(ruleId)

    // Auto-remove from suppression after window
    setTimeout(() => {
      this.suppressedAlerts.delete(ruleId)
    }, this.config.suppressionWindow)
  }

  queueNotification(alert) {
    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      alert,
      timestamp: Date.now(),
      channels: this.determineNotificationChannels(alert),
      status: 'pending'
    }

    this.notificationQueue.push(notification)
  }

  determineNotificationChannels(alert) {
    const channels = []

    // Always use console for immediate feedback
    if (this.config.notificationChannels.console) {
      channels.push('console')
    }

    // Use file logging
    if (this.config.notificationChannels.file) {
      channels.push('file')
    }

    // Critical alerts might need additional channels
    if (alert.severity === 'critical' || alert.severity === 'fatal') {
      if (this.config.notificationChannels.email) {
        channels.push('email')
      }
      if (this.config.notificationChannels.webhook) {
        channels.push('webhook')
      }
    }

    return channels
  }

  scheduleEscalation(alert) {
    const timeout = this.config.escalationTimeouts[alert.severity]

    if (timeout && alert.severity !== 'info') {
      setTimeout(() => {
        if (this.activeAlerts.has(`${alert.ruleId}-${alert.category}`)) {
          this.escalateAlert(alert)
        }
      }, timeout)
    }
  }

  escalateAlert(alert) {
    const escalatedSeverity = this.getEscalatedSeverity(alert.severity)

    if (escalatedSeverity !== alert.severity) {
      this.log(`🔥 ESCALATED: ${alert.name} from ${alert.severity} to ${escalatedSeverity}`, 'alert')

      alert.severity = escalatedSeverity
      alert.escalated = true
      alert.escalatedAt = Date.now()

      // Trigger new notification with escalated severity
      this.queueNotification(alert)
      this.emit('alertEscalated', alert)
    }
  }

  getEscalatedSeverity(currentSeverity) {
    const severityLevels = ['info', 'warning', 'critical', 'fatal']
    const currentIndex = severityLevels.indexOf(currentSeverity)

    if (currentIndex < severityLevels.length - 1) {
      return severityLevels[currentIndex + 1]
    }

    return currentSeverity
  }

  async saveAlert(alert) {
    try {
      const timestamp = new Date(alert.timestamp).toISOString().replace(/[:.]/g, '-')
      const filename = `alert-${alert.id}-${timestamp}.json`
      const filepath = path.join(this.config.alertsDir, filename)

      await fs.writeJSON(filepath, alert, { spaces: 2 })

      // Also save as latest
      if (alert.status === 'active') {
        await fs.writeJSON(
          path.join(this.config.alertsDir, 'latest-alerts.json'),
          Array.from(this.activeAlerts.values()),
          { spaces: 2 }
        )
      }
    } catch (error) {
      this.log(`Error saving alert: ${error.message}`, 'error')
    }
  }

  startAlertProcessor() {
    // Process notification queue every 5 seconds
    setInterval(() => {
      this.processNotificationQueue()
    }, 5000)

    // Save alert history every minute
    setInterval(() => {
      this.saveAlertHistory()
    }, 60000)

    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts()
    }, 60 * 60 * 1000)

    this.log('Alert processor started', 'success')
  }

  async processNotificationQueue() {
    const pendingNotifications = this.notificationQueue.filter(n => n.status === 'pending')

    for (const notification of pendingNotifications) {
      try {
        await this.sendNotification(notification)
        notification.status = 'sent'
        notification.sentAt = Date.now()
      } catch (error) {
        this.log(`Error sending notification ${notification.id}: ${error.message}`, 'error')
        notification.status = 'failed'
        notification.error = error.message
      }
    }

    // Clean up old notifications
    this.notificationQueue = this.notificationQueue.filter(
      n => Date.now() - n.timestamp < 24 * 60 * 60 * 1000 // Keep for 24 hours
    )
  }

  async sendNotification(notification) {
    const { alert, channels } = notification

    for (const channel of channels) {
      switch (channel) {
        case 'console':
          // Already logged in triggerAlert
          break

        case 'file':
          await this.sendFileNotification(alert)
          break

        case 'email':
          await this.sendEmailNotification(alert)
          break

        case 'webhook':
          await this.sendWebhookNotification(alert)
          break
      }
    }
  }

  async sendFileNotification(alert) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: alert.severity,
      alert: alert.name,
      message: alert.description,
      value: alert.currentValue,
      threshold: alert.threshold
    }

    const logFile = path.join(this.config.alertsDir, 'alert-notifications.log')
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n')
  }

  async sendEmailNotification(alert) {
    // Placeholder for email notification
    this.log(`📧 Email notification would be sent for: ${alert.name}`, 'info')
  }

  async sendWebhookNotification(alert) {
    // Placeholder for webhook notification
    this.log(`🌐 Webhook notification would be sent for: ${alert.name}`, 'info')
  }

  async cleanupOldAlerts() {
    try {
      const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days

      // Clean up alert files
      const alertFiles = await fs.readdir(this.config.alertsDir)

      for (const file of alertFiles) {
        if (file.startsWith('alert-') && file.endsWith('.json')) {
          const filePath = path.join(this.config.alertsDir, file)
          const stats = await fs.stat(filePath)

          if (stats.mtime.getTime() < cutoffTime) {
            await fs.remove(filePath)
          }
        }
      }

      // Clean up alert history
      this.alertHistory = this.alertHistory.filter(
        alert => alert.timestamp > cutoffTime
      )

      this.log('Old alerts cleaned up', 'info')
    } catch (error) {
      this.log(`Error cleaning up old alerts: ${error.message}`, 'error')
    }
  }

  getActiveAlerts() {
    return Array.from(this.activeAlerts.values())
  }

  getAlertStats() {
    return {
      ...this.alertStats,
      activeAlerts: this.activeAlerts.size,
      suppressedCount: this.suppressedAlerts.size,
      queueLength: this.notificationQueue.length
    }
  }

  generateAlertReport() {
    const activeAlerts = this.getActiveAlerts()
    const recentAlerts = this.alertHistory
      .filter(alert => Date.now() - alert.timestamp < 24 * 60 * 60 * 1000)
      .slice(-50)

    return {
      timestamp: Date.now(),
      summary: {
        activeAlerts: activeAlerts.length,
        recentAlerts: recentAlerts.length,
        stats: this.getAlertStats()
      },
      activeAlerts,
      recentAlerts,
      rules: this.alertRules.length,
      recommendations: this.generateAlertRecommendations()
    }
  }

  generateAlertRecommendations() {
    const recommendations = []
    const stats = this.getAlertStats()

    if (stats.activeAlerts > 10) {
      recommendations.push({
        type: 'high_alert_volume',
        message: 'High number of active alerts detected',
        suggestion: 'Review alert thresholds and consider adjusting sensitivity'
      })
    }

    if (stats.suppressedCount > 5) {
      recommendations.push({
        type: 'high_suppression',
        message: 'Many alerts are being suppressed',
        suggestion: 'Review suppression rules and alert frequency'
      })
    }

    const criticalAlerts = this.getActiveAlerts().filter(a => a.severity === 'critical' || a.severity === 'fatal')
    if (criticalAlerts.length > 0) {
      recommendations.push({
        type: 'critical_alerts',
        message: `${criticalAlerts.length} critical alerts require immediate attention`,
        suggestion: 'Address critical alerts to prevent system issues'
      })
    }

    return recommendations
  }
}

module.exports = AlertManager

// CLI interface
if (require.main === module) {
  const alertManager = new AlertManager()

  // Example metrics for testing
  const testMetrics = {
    system: {
      memory: { usagePercent: 90 },
      cpu: { usage: 85 }
    },
    api: {
      responseTime: { '/api/status': 3000 },
      errorRate: 8
    }
  }

  // Test alert evaluation
  console.log('🧪 Testing alert system with sample metrics...')
  alertManager.evaluateMetrics(testMetrics)

  // Generate report after a brief delay
  setTimeout(() => {
    const report = alertManager.generateAlertReport()
    console.log('\n📊 Alert Report:')
    console.log(JSON.stringify(report, null, 2))
  }, 1000)

  // Keep process alive for testing
  setTimeout(() => {
    console.log('\n🛑 Alert Manager test complete')
    process.exit(0)
  }, 5000)
}