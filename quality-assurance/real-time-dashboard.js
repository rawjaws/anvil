/**
 * Real-Time Quality Dashboard
 * Live monitoring dashboard for Anvil's quality assurance metrics
 *
 * Features:
 * - Real-time quality metrics display
 * - Live performance charts
 * - Integration test status
 * - Alert notifications
 * - Historical trend analysis
 * - Agent activity monitoring
 */

const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const fs = require('fs-extra')
const path = require('path')
const ContinuousValidator = require('./ContinuousValidator')
const PerformanceRegressionDetector = require('./performance-regression-detector')

class RealTimeQualityDashboard {
  constructor(options = {}) {
    this.config = {
      port: options.port || 3001,
      updateInterval: options.updateInterval || 5000, // 5 seconds
      metricsRetention: options.metricsRetention || 1000, // Keep 1000 data points
      ...options
    }

    this.app = express()
    this.server = http.createServer(this.app)
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    this.validator = new ContinuousValidator()
    this.performanceDetector = new PerformanceRegressionDetector()

    this.dashboardData = {
      qualityMetrics: {
        score: 100,
        trend: 'stable',
        lastUpdate: new Date().toISOString()
      },
      integrationTests: {
        passed: 0,
        failed: 0,
        total: 0,
        lastRun: null
      },
      performance: {
        responseTime: 0,
        throughput: 0,
        errorRate: 0,
        trend: 'stable'
      },
      alerts: [],
      agentActivity: {
        activeAgents: 0,
        totalTasks: 0,
        completedTasks: 0
      },
      systemHealth: {
        status: 'healthy',
        uptime: 0,
        memoryUsage: 0,
        cpuUsage: 0
      }
    }

    this.connectedClients = new Set()
    this.metricsHistory = []

    this.setupRoutes()
    this.setupSocketHandlers()
    this.setupEventListeners()
  }

  /**
   * Start the dashboard server
   */
  async start() {
    console.log('🚀 Starting Real-Time Quality Dashboard...')

    // Start monitoring systems
    await this.validator.startMonitoring()
    await this.performanceDetector.startMonitoring()

    // Start dashboard updates
    this.startDashboardUpdates()

    // Start server
    this.server.listen(this.config.port, () => {
      console.log(`✅ Quality Dashboard running on http://localhost:${this.config.port}`)
      console.log('📊 Real-time monitoring active')
    })
  }

  /**
   * Setup Express routes
   */
  setupRoutes() {
    // Serve static dashboard files
    this.app.use(express.static(path.join(__dirname, 'dashboard-static')))

    // API endpoints for dashboard data
    this.app.get('/api/dashboard/status', (req, res) => {
      res.json({
        success: true,
        data: this.dashboardData,
        timestamp: new Date().toISOString()
      })
    })

    this.app.get('/api/dashboard/metrics/history', (req, res) => {
      const limit = parseInt(req.query.limit) || 100
      const history = this.metricsHistory.slice(-limit)

      res.json({
        success: true,
        data: history,
        count: history.length
      })
    })

    this.app.get('/api/dashboard/alerts', async (req, res) => {
      try {
        const alerts = await this.getRecentAlerts()
        res.json({
          success: true,
          data: alerts
        })
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        })
      }
    })

    this.app.get('/api/dashboard/performance/report', (req, res) => {
      const report = this.performanceDetector.getPerformanceReport()
      res.json({
        success: true,
        data: report
      })
    })

    // Main dashboard page
    this.app.get('/', (req, res) => {
      res.send(this.generateDashboardHTML())
    })
  }

  /**
   * Setup Socket.IO handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`📱 Dashboard client connected: ${socket.id}`)
      this.connectedClients.add(socket.id)

      // Send initial data
      socket.emit('dashboard:init', this.dashboardData)

      // Handle client requests
      socket.on('dashboard:request-update', () => {
        socket.emit('dashboard:update', this.dashboardData)
      })

      socket.on('dashboard:request-history', (params) => {
        const limit = params.limit || 100
        const history = this.metricsHistory.slice(-limit)
        socket.emit('dashboard:history', history)
      })

      socket.on('disconnect', () => {
        console.log(`📱 Dashboard client disconnected: ${socket.id}`)
        this.connectedClients.delete(socket.id)
      })
    })
  }

  /**
   * Setup event listeners for monitoring systems
   */
  setupEventListeners() {
    // Quality validator events
    this.validator.on('quality:updated', (data) => {
      this.updateQualityMetrics(data)
    })

    this.validator.on('tests:completed', (results) => {
      this.updateIntegrationTestResults(results)
    })

    this.validator.on('quality:failure', (alert) => {
      this.addAlert(alert)
    })

    this.validator.on('performance:updated', (metrics) => {
      this.updatePerformanceMetrics(metrics)
    })

    // Performance detector events (would need to be added to the detector)
    // this.performanceDetector.on('regression:detected', (alert) => {
    //   this.addAlert(alert)
    // })
  }

  /**
   * Start dashboard update loop
   */
  startDashboardUpdates() {
    setInterval(async () => {
      try {
        await this.updateDashboardData()
        this.broadcastUpdate()
      } catch (error) {
        console.error('❌ Dashboard update error:', error.message)
      }
    }, this.config.updateInterval)
  }

  /**
   * Update dashboard data
   */
  async updateDashboardData() {
    // Update system health
    this.dashboardData.systemHealth = await this.getSystemHealth()

    // Update agent activity (simulated)
    this.dashboardData.agentActivity = await this.getAgentActivity()

    // Add to metrics history
    const metricsSnapshot = {
      timestamp: new Date().toISOString(),
      qualityScore: this.dashboardData.qualityMetrics.score,
      responseTime: this.dashboardData.performance.responseTime,
      throughput: this.dashboardData.performance.throughput,
      errorRate: this.dashboardData.performance.errorRate,
      testsPassed: this.dashboardData.integrationTests.passed,
      testsFailed: this.dashboardData.integrationTests.failed
    }

    this.metricsHistory.push(metricsSnapshot)

    // Keep only recent history
    if (this.metricsHistory.length > this.config.metricsRetention) {
      this.metricsHistory = this.metricsHistory.slice(-this.config.metricsRetention)
    }
  }

  /**
   * Update quality metrics from validator
   */
  updateQualityMetrics(data) {
    this.dashboardData.qualityMetrics = {
      score: data.score,
      trend: this.calculateTrend(data.metrics.validationHistory, 'qualityScore'),
      lastUpdate: new Date().toISOString(),
      breakdown: data.metrics.breakdown || {}
    }
  }

  /**
   * Update integration test results
   */
  updateIntegrationTestResults(results) {
    this.dashboardData.integrationTests = {
      passed: results.passed,
      failed: results.failed,
      total: results.total,
      lastRun: new Date().toISOString(),
      successRate: results.total > 0 ? (results.passed / results.total * 100).toFixed(1) : '0'
    }
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(metrics) {
    this.dashboardData.performance = {
      responseTime: metrics.responseTime,
      throughput: metrics.throughput,
      errorRate: metrics.errorRate,
      trend: this.calculateTrend(this.metricsHistory, 'responseTime'),
      lastUpdate: new Date().toISOString()
    }
  }

  /**
   * Add alert to dashboard
   */
  addAlert(alert) {
    const dashboardAlert = {
      ...alert,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }

    this.dashboardData.alerts.unshift(dashboardAlert)

    // Keep only recent alerts
    if (this.dashboardData.alerts.length > 50) {
      this.dashboardData.alerts = this.dashboardData.alerts.slice(0, 50)
    }

    // Broadcast alert immediately
    this.broadcastAlert(dashboardAlert)
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth() {
    // In real implementation, this would get actual system metrics
    return {
      status: this.calculateSystemStatus(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: Math.random() * 30 + 10, // Simulated 10-40%
      diskUsage: Math.random() * 20 + 30, // Simulated 30-50%
      networkLatency: Math.random() * 10 + 5 // Simulated 5-15ms
    }
  }

  /**
   * Calculate overall system status
   */
  calculateSystemStatus() {
    const qualityScore = this.dashboardData.qualityMetrics.score
    const testFailures = this.dashboardData.integrationTests.failed
    const errorRate = this.dashboardData.performance.errorRate

    if (qualityScore >= 95 && testFailures === 0 && errorRate < 0.001) {
      return 'excellent'
    } else if (qualityScore >= 85 && testFailures === 0 && errorRate < 0.01) {
      return 'good'
    } else if (qualityScore >= 70 && testFailures <= 1 && errorRate < 0.05) {
      return 'fair'
    } else {
      return 'poor'
    }
  }

  /**
   * Get agent activity metrics
   */
  async getAgentActivity() {
    // In real implementation, this would track actual agent activity
    return {
      activeAgents: 6, // All 6 agents
      totalTasks: 42,
      completedTasks: 38,
      inProgressTasks: 4,
      completionRate: ((38 / 42) * 100).toFixed(1)
    }
  }

  /**
   * Calculate trend from historical data
   */
  calculateTrend(history, metric) {
    if (!history || history.length < 5) return 'stable'

    const recent = history.slice(-5)
    const values = recent.map(h => h[metric] || h.qualityScore || 0)

    if (values.length < 2) return 'stable'

    const trend = values[values.length - 1] - values[0]
    const percentChange = Math.abs(trend) / values[0] * 100

    if (percentChange < 5) return 'stable'
    return trend > 0 ? 'improving' : 'declining'
  }

  /**
   * Get recent alerts from files
   */
  async getRecentAlerts() {
    const alerts = []

    try {
      // Get validator alerts
      const validatorAlertsFile = path.join(__dirname, 'alerts.json')
      if (await fs.pathExists(validatorAlertsFile)) {
        const validatorAlerts = await fs.readJson(validatorAlertsFile)
        alerts.push(...validatorAlerts.slice(-20))
      }

      // Get performance alerts
      const perfAlertsFile = path.join(__dirname, 'performance-alerts.json')
      if (await fs.pathExists(perfAlertsFile)) {
        const perfAlerts = await fs.readJson(perfAlertsFile)
        alerts.push(...perfAlerts.slice(-20))
      }

      // Sort by timestamp
      alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      return alerts.slice(0, 30) // Return latest 30 alerts

    } catch (error) {
      console.error('Failed to load alerts:', error.message)
      return []
    }
  }

  /**
   * Broadcast update to all connected clients
   */
  broadcastUpdate() {
    this.io.emit('dashboard:update', this.dashboardData)
  }

  /**
   * Broadcast alert to all connected clients
   */
  broadcastAlert(alert) {
    this.io.emit('dashboard:alert', alert)
  }

  /**
   * Generate dashboard HTML
   */
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anvil Quality Assurance Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
        }

        .dashboard-header {
            background: #1e293b;
            border-bottom: 1px solid #334155;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .dashboard-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #f1f5f9;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #22c55e;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            padding: 2rem;
            max-width: 1400px;
            margin: 0 auto;
        }

        .metric-card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 1.5rem;
            transition: all 0.2s ease;
        }

        .metric-card:hover {
            border-color: #475569;
            transform: translateY(-2px);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }

        .card-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #f1f5f9;
        }

        .trend-indicator {
            font-size: 0.8rem;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 500;
        }

        .trend-stable { background: #475569; color: #e2e8f0; }
        .trend-improving { background: #065f46; color: #6ee7b7; }
        .trend-declining { background: #7f1d1d; color: #fca5a5; }

        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .metric-label {
            color: #94a3b8;
            font-size: 0.9rem;
        }

        .quality-excellent { color: #22c55e; }
        .quality-good { color: #3b82f6; }
        .quality-fair { color: #f59e0b; }
        .quality-poor { color: #ef4444; }

        .alerts-container {
            max-height: 300px;
            overflow-y: auto;
        }

        .alert-item {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            border-left: 4px solid;
            background: #334155;
            border-radius: 0 4px 4px 0;
        }

        .alert-critical { border-left-color: #ef4444; }
        .alert-high { border-left-color: #f59e0b; }
        .alert-medium { border-left-color: #3b82f6; }
        .alert-low { border-left-color: #6b7280; }

        .alert-title {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .alert-time {
            font-size: 0.8rem;
            color: #94a3b8;
        }

        .chart-container {
            height: 200px;
            background: #334155;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            margin-top: 1rem;
        }

        .connected-indicator {
            color: #94a3b8;
            font-size: 0.9rem;
        }

        .refresh-button {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }

        .refresh-button:hover {
            background: #2563eb;
        }
    </style>
</head>
<body>
    <div class="dashboard-header">
        <h1 class="dashboard-title">🛡️ Anvil Quality Assurance Dashboard</h1>
        <div class="status-indicator">
            <span class="status-dot"></span>
            <span id="connection-status" class="connected-indicator">Connected</span>
        </div>
    </div>

    <div class="dashboard-grid">
        <div class="metric-card">
            <div class="card-header">
                <h3 class="card-title">Quality Score</h3>
                <span id="quality-trend" class="trend-indicator trend-stable">Stable</span>
            </div>
            <div id="quality-score" class="metric-value quality-excellent">100</div>
            <div class="metric-label">Overall system quality</div>
        </div>

        <div class="metric-card">
            <div class="card-header">
                <h3 class="card-title">Integration Tests</h3>
                <button class="refresh-button" onclick="refreshTests()">Refresh</button>
            </div>
            <div id="test-results" class="metric-value quality-excellent">18/18</div>
            <div class="metric-label">Tests passing</div>
        </div>

        <div class="metric-card">
            <div class="card-header">
                <h3 class="card-title">Performance</h3>
                <span id="perf-trend" class="trend-indicator trend-stable">Stable</span>
            </div>
            <div id="response-time" class="metric-value quality-excellent">45ms</div>
            <div class="metric-label">Average response time</div>
        </div>

        <div class="metric-card">
            <div class="card-header">
                <h3 class="card-title">Throughput</h3>
                <span id="throughput-trend" class="trend-indicator trend-stable">Stable</span>
            </div>
            <div id="throughput" class="metric-value quality-excellent">1,250</div>
            <div class="metric-label">Requests per second</div>
        </div>

        <div class="metric-card">
            <div class="card-header">
                <h3 class="card-title">Agent Activity</h3>
            </div>
            <div id="active-agents" class="metric-value quality-excellent">6/6</div>
            <div class="metric-label">Active monitoring agents</div>
        </div>

        <div class="metric-card">
            <div class="card-header">
                <h3 class="card-title">System Health</h3>
            </div>
            <div id="system-status" class="metric-value quality-excellent">Excellent</div>
            <div class="metric-label">Overall system status</div>
        </div>

        <div class="metric-card" style="grid-column: 1 / -1;">
            <div class="card-header">
                <h3 class="card-title">Recent Alerts</h3>
                <span id="alert-count" class="trend-indicator trend-stable">0 Active</span>
            </div>
            <div id="alerts-container" class="alerts-container">
                <div style="text-align: center; color: #94a3b8; padding: 2rem;">
                    No recent alerts - system is healthy
                </div>
            </div>
        </div>

        <div class="metric-card" style="grid-column: 1 / -1;">
            <div class="card-header">
                <h3 class="card-title">Performance Chart</h3>
            </div>
            <div class="chart-container">
                Real-time performance chart will be displayed here
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let dashboardData = {};

        // Socket event handlers
        socket.on('connect', () => {
            document.getElementById('connection-status').textContent = 'Connected';
            document.querySelector('.status-dot').style.background = '#22c55e';
        });

        socket.on('disconnect', () => {
            document.getElementById('connection-status').textContent = 'Disconnected';
            document.querySelector('.status-dot').style.background = '#ef4444';
        });

        socket.on('dashboard:init', (data) => {
            dashboardData = data;
            updateDashboard();
        });

        socket.on('dashboard:update', (data) => {
            dashboardData = data;
            updateDashboard();
        });

        socket.on('dashboard:alert', (alert) => {
            addAlertToDisplay(alert);
        });

        // Update dashboard display
        function updateDashboard() {
            // Quality Score
            const qualityScore = dashboardData.qualityMetrics?.score || 100;
            document.getElementById('quality-score').textContent = qualityScore;
            document.getElementById('quality-score').className = 'metric-value ' + getQualityClass(qualityScore);

            const qualityTrend = dashboardData.qualityMetrics?.trend || 'stable';
            document.getElementById('quality-trend').className = 'trend-indicator trend-' + qualityTrend;
            document.getElementById('quality-trend').textContent = capitalizeFirst(qualityTrend);

            // Integration Tests
            const tests = dashboardData.integrationTests;
            if (tests) {
                document.getElementById('test-results').textContent = tests.passed + '/' + tests.total;
                document.getElementById('test-results').className = 'metric-value ' + (tests.failed === 0 ? 'quality-excellent' : 'quality-poor');
            }

            // Performance
            const perf = dashboardData.performance;
            if (perf) {
                document.getElementById('response-time').textContent = Math.round(perf.responseTime) + 'ms';
                document.getElementById('response-time').className = 'metric-value ' + getPerformanceClass(perf.responseTime);

                document.getElementById('throughput').textContent = Math.round(perf.throughput).toLocaleString();
                document.getElementById('throughput').className = 'metric-value ' + getThroughputClass(perf.throughput);
            }

            // Agent Activity
            const agents = dashboardData.agentActivity;
            if (agents) {
                document.getElementById('active-agents').textContent = agents.activeAgents + '/6';
            }

            // System Health
            const health = dashboardData.systemHealth;
            if (health) {
                document.getElementById('system-status').textContent = capitalizeFirst(health.status);
                document.getElementById('system-status').className = 'metric-value ' + getQualityClass(getStatusScore(health.status));
            }

            // Alerts
            updateAlertsDisplay();
        }

        function getQualityClass(score) {
            if (score >= 95) return 'quality-excellent';
            if (score >= 85) return 'quality-good';
            if (score >= 70) return 'quality-fair';
            return 'quality-poor';
        }

        function getPerformanceClass(responseTime) {
            if (responseTime < 50) return 'quality-excellent';
            if (responseTime < 100) return 'quality-good';
            if (responseTime < 200) return 'quality-fair';
            return 'quality-poor';
        }

        function getThroughputClass(throughput) {
            if (throughput > 1000) return 'quality-excellent';
            if (throughput > 500) return 'quality-good';
            if (throughput > 100) return 'quality-fair';
            return 'quality-poor';
        }

        function getStatusScore(status) {
            switch (status) {
                case 'excellent': return 100;
                case 'good': return 85;
                case 'fair': return 70;
                default: return 50;
            }
        }

        function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        function updateAlertsDisplay() {
            const alerts = dashboardData.alerts || [];
            const container = document.getElementById('alerts-container');
            const countElement = document.getElementById('alert-count');

            countElement.textContent = alerts.length + ' Active';
            countElement.className = 'trend-indicator ' + (alerts.length === 0 ? 'trend-stable' : 'trend-declining');

            if (alerts.length === 0) {
                container.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 2rem;">No recent alerts - system is healthy</div>';
                return;
            }

            container.innerHTML = alerts.slice(0, 10).map(alert =>
                '<div class="alert-item alert-' + (alert.severity || 'medium') + '">' +
                '<div class="alert-title">' + (alert.message || alert.type) + '</div>' +
                '<div class="alert-time">' + new Date(alert.timestamp).toLocaleString() + '</div>' +
                '</div>'
            ).join('');
        }

        function addAlertToDisplay(alert) {
            // Add alert to dashboard data
            if (!dashboardData.alerts) dashboardData.alerts = [];
            dashboardData.alerts.unshift(alert);
            dashboardData.alerts = dashboardData.alerts.slice(0, 50); // Keep only 50 most recent

            updateAlertsDisplay();

            // Show notification
            if (Notification.permission === 'granted') {
                new Notification('Quality Alert: ' + alert.type, {
                    body: alert.message,
                    icon: '/favicon.ico'
                });
            }
        }

        function refreshTests() {
            socket.emit('dashboard:request-update');
        }

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Initial data request
        socket.emit('dashboard:request-update');
    </script>
</body>
</html>
    `
  }

  /**
   * Stop dashboard
   */
  stop() {
    this.validator.stopMonitoring()
    this.performanceDetector.stopMonitoring()
    this.server.close()
    console.log('🛑 Quality Dashboard stopped')
  }
}

module.exports = RealTimeQualityDashboard

// CLI interface for standalone operation
if (require.main === module) {
  const dashboard = new RealTimeQualityDashboard()

  dashboard.start().catch(error => {
    console.error('❌ Failed to start dashboard:', error.message)
    process.exit(1)
  })

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down dashboard...')
    dashboard.stop()
    process.exit(0)
  })
}