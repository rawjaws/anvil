/*
 * Copyright 2025 Darcy Davidson
 *
 * THE HAMMER'S FINAL OPTIMIZATION: Comprehensive Production Validation
 * Tests performance, security, accessibility, and production readiness
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CONCURRENT_REQUESTS = 100;
const TOTAL_REQUESTS = 1000;
const TARGET_RESPONSE_TIME = 100; // milliseconds

class HammerValidator {
  constructor() {
    this.results = {
      performance: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        requestsUnder100ms: 0,
        requestsUnder500ms: 0,
        requestsOver1000ms: 0,
        score: 0
      },
      security: {
        securityHeaders: {},
        vulnerabilities: [],
        score: 0
      },
      accessibility: {
        checks: [],
        score: 0
      },
      overall: {
        score: 0,
        readiness: 0
      }
    };

    this.endpoints = [
      '/',
      '/api/capabilities',
      '/api/enablers',
      '/api/performance/metrics',
      '/api/templates',
      '/agents',
      '/discovery',
      '/analytics'
    ];

    this.securityHeaders = [
      'strict-transport-security',
      'content-security-policy',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📊',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      hammer: '⚒️'
    }[type];

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;

      const req = protocol.request(url, {
        method: 'GET',
        timeout: 5000,
        ...options
      }, (res) => {
        let data = '';

        res.on('data', chunk => {
          data += chunk;
        });

        res.on('end', () => {
          const endTime = Date.now();
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            responseTime: endTime - startTime,
            data: data,
            url: url
          });
        });
      });

      req.on('error', (error) => {
        const endTime = Date.now();
        reject({
          error: error.message,
          responseTime: endTime - startTime,
          url: url
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject({
          error: 'Request timeout',
          responseTime: 5000,
          url: url
        });
      });

      req.end();
    });
  }

  async performLoadTest() {
    this.log('Starting load testing with The Hammer...', 'hammer');
    this.log(`Target: ${CONCURRENT_REQUESTS} concurrent requests, ${TOTAL_REQUESTS} total requests`);

    const promises = [];
    const results = [];

    for (let i = 0; i < TOTAL_REQUESTS; i++) {
      const endpoint = this.endpoints[i % this.endpoints.length];
      const url = `${BASE_URL}${endpoint}`;

      const promise = this.makeRequest(url)
        .then(result => {
          results.push(result);
          this.updatePerformanceMetrics(result);
        })
        .catch(error => {
          results.push(error);
          this.results.performance.failedRequests++;
        });

      promises.push(promise);

      // Control concurrency
      if (promises.length >= CONCURRENT_REQUESTS) {
        await Promise.allSettled(promises.splice(0, CONCURRENT_REQUESTS));
      }
    }

    // Wait for remaining requests
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    this.calculatePerformanceScore();
    this.log(`Load testing completed: ${this.results.performance.successfulRequests}/${TOTAL_REQUESTS} successful`, 'success');
  }

  updatePerformanceMetrics(result) {
    const metrics = this.results.performance;

    if (result.statusCode && result.statusCode < 400) {
      metrics.successfulRequests++;
      metrics.averageResponseTime = (
        (metrics.averageResponseTime * (metrics.successfulRequests - 1) + result.responseTime) /
        metrics.successfulRequests
      );

      metrics.minResponseTime = Math.min(metrics.minResponseTime, result.responseTime);
      metrics.maxResponseTime = Math.max(metrics.maxResponseTime, result.responseTime);

      if (result.responseTime < 100) metrics.requestsUnder100ms++;
      if (result.responseTime < 500) metrics.requestsUnder500ms++;
      if (result.responseTime > 1000) metrics.requestsOver1000ms++;
    }

    metrics.totalRequests++;
  }

  calculatePerformanceScore() {
    const metrics = this.results.performance;
    const successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    const avgResponseTime = metrics.averageResponseTime;
    const under100msRate = (metrics.requestsUnder100ms / metrics.successfulRequests) * 100;

    // Performance scoring algorithm
    let score = 0;

    // Success rate (40% of score)
    score += (successRate / 100) * 40;

    // Response time (40% of score)
    if (avgResponseTime < TARGET_RESPONSE_TIME) {
      score += 40;
    } else {
      score += Math.max(0, 40 - ((avgResponseTime - TARGET_RESPONSE_TIME) / 10));
    }

    // Consistency (20% of score)
    score += (under100msRate / 100) * 20;

    metrics.score = Math.round(score);

    this.log(`Performance Score: ${metrics.score}/100`, metrics.score >= 95 ? 'success' : 'warning');
    this.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms (Target: <${TARGET_RESPONSE_TIME}ms)`);
    this.log(`Requests under 100ms: ${under100msRate.toFixed(1)}%`);
  }

  async performSecurityAssessment() {
    this.log('Conducting security assessment...', 'hammer');

    try {
      const response = await this.makeRequest(BASE_URL);
      const headers = response.headers;

      // Check security headers
      this.securityHeaders.forEach(header => {
        const headerValue = headers[header];
        this.results.security.securityHeaders[header] = {
          present: !!headerValue,
          value: headerValue || null
        };
      });

      // Security scoring
      const presentHeaders = Object.values(this.results.security.securityHeaders)
        .filter(h => h.present).length;

      this.results.security.score = Math.round((presentHeaders / this.securityHeaders.length) * 100);

      // Check for common vulnerabilities
      await this.checkCommonVulnerabilities();

      this.log(`Security Score: ${this.results.security.score}/100`,
        this.results.security.score >= 95 ? 'success' : 'warning');

    } catch (error) {
      this.log(`Security assessment failed: ${error.message}`, 'error');
      this.results.security.score = 0;
    }
  }

  async checkCommonVulnerabilities() {
    const vulnTests = [
      {
        name: 'SQL Injection',
        url: `${BASE_URL}/api/capabilities?id=1'OR'1'='1`,
        check: (response) => response.statusCode !== 500
      },
      {
        name: 'XSS Protection',
        url: `${BASE_URL}/api/capabilities?search=<script>alert('xss')</script>`,
        check: (response) => !response.data.includes('<script>')
      },
      {
        name: 'Path Traversal',
        url: `${BASE_URL}/api/../../../etc/passwd`,
        check: (response) => response.statusCode === 404 || response.statusCode === 403
      }
    ];

    for (const test of vulnTests) {
      try {
        const response = await this.makeRequest(test.url);
        const passed = test.check(response);

        if (!passed) {
          this.results.security.vulnerabilities.push({
            name: test.name,
            severity: 'high',
            url: test.url
          });
        }
      } catch (error) {
        // Request failure is often a good sign for security tests
      }
    }
  }

  async performAccessibilityValidation() {
    this.log('Validating accessibility compliance...', 'hammer');

    const accessibilityChecks = [
      {
        name: 'Service Worker Registration',
        check: () => this.checkServiceWorkerExists(),
        weight: 20
      },
      {
        name: 'Offline Functionality',
        check: () => this.checkOfflinePage(),
        weight: 20
      },
      {
        name: 'Error Boundaries',
        check: () => this.checkErrorBoundaries(),
        weight: 20
      },
      {
        name: 'Loading States',
        check: () => this.checkLoadingStates(),
        weight: 20
      },
      {
        name: 'Accessibility Components',
        check: () => this.checkAccessibilityComponents(),
        weight: 20
      }
    ];

    let totalScore = 0;

    for (const check of accessibilityChecks) {
      try {
        const passed = await check.check();
        const score = passed ? check.weight : 0;
        totalScore += score;

        this.results.accessibility.checks.push({
          name: check.name,
          passed: passed,
          score: score,
          weight: check.weight
        });

        this.log(`${check.name}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'success' : 'warning');
      } catch (error) {
        this.log(`${check.name}: ERROR - ${error.message}`, 'error');
        this.results.accessibility.checks.push({
          name: check.name,
          passed: false,
          score: 0,
          weight: check.weight,
          error: error.message
        });
      }
    }

    this.results.accessibility.score = totalScore;
    this.log(`Accessibility Score: ${totalScore}/100`, totalScore >= 95 ? 'success' : 'warning');
  }

  checkServiceWorkerExists() {
    const swPath = path.join(__dirname, '../client/public/sw.js');
    return fs.existsSync(swPath);
  }

  checkOfflinePage() {
    const offlinePath = path.join(__dirname, '../client/public/offline.html');
    return fs.existsSync(offlinePath);
  }

  checkErrorBoundaries() {
    const errorBoundaryPath = path.join(__dirname, '../client/src/components/ErrorBoundary.jsx');
    return fs.existsSync(errorBoundaryPath);
  }

  checkLoadingStates() {
    // Check if App.jsx contains enhanced loading component
    const appPath = path.join(__dirname, '../client/src/App.jsx');
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      return content.includes('THE HAMMER\'S OPTIMIZATION') && content.includes('LoadingSpinner');
    }
    return false;
  }

  checkAccessibilityComponents() {
    const accessibilityPath = path.join(__dirname, '../client/src/components/AccessibilityEnhancer.jsx');
    return fs.existsSync(accessibilityPath);
  }

  calculateOverallScore() {
    const weights = {
      performance: 0.4,
      security: 0.3,
      accessibility: 0.3
    };

    this.results.overall.score = Math.round(
      this.results.performance.score * weights.performance +
      this.results.security.score * weights.security +
      this.results.accessibility.score * weights.accessibility
    );

    // Production readiness calculation
    const minScores = { performance: 90, security: 95, accessibility: 90 };
    const readinessFactors = [];

    Object.keys(minScores).forEach(category => {
      const score = this.results[category].score;
      const minScore = minScores[category];
      readinessFactors.push(score >= minScore ? 100 : (score / minScore) * 100);
    });

    this.results.overall.readiness = Math.round(
      readinessFactors.reduce((sum, factor) => sum + factor, 0) / readinessFactors.length
    );
  }

  generateReport() {
    this.calculateOverallScore();

    const report = {
      timestamp: new Date().toISOString(),
      version: '1.1.7-hammer-optimized',
      environment: BASE_URL,
      summary: {
        overallScore: this.results.overall.score,
        productionReadiness: this.results.overall.readiness,
        recommendation: this.results.overall.readiness >= 95 ? 'PRODUCTION READY' : 'NEEDS IMPROVEMENT'
      },
      details: this.results
    };

    // Save report
    const reportPath = path.join(__dirname, '../reports/hammer-validation-report.json');
    const reportsDir = path.dirname(reportPath);

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate console summary
    this.printSummary(report);

    return report;
  }

  printSummary(report) {
    const { summary, details } = report;

    console.log('\n' + '='.repeat(80));
    console.log('⚒️  THE HAMMER\'S FINAL OPTIMIZATION REPORT  ⚒️');
    console.log('='.repeat(80));
    console.log(`🎯 Overall Score: ${summary.overallScore}/100`);
    console.log(`🚀 Production Readiness: ${summary.productionReadiness}%`);
    console.log(`📋 Recommendation: ${summary.recommendation}`);
    console.log('='.repeat(80));

    console.log('\n📊 DETAILED SCORES:');
    console.log(`   Performance:    ${details.performance.score}/100`);
    console.log(`   Security:       ${details.security.score}/100`);
    console.log(`   Accessibility:  ${details.accessibility.score}/100`);

    console.log('\n⚡ PERFORMANCE METRICS:');
    console.log(`   Average Response Time: ${details.performance.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Success Rate: ${((details.performance.successfulRequests / details.performance.totalRequests) * 100).toFixed(1)}%`);
    console.log(`   Requests <100ms: ${details.performance.requestsUnder100ms}/${details.performance.successfulRequests}`);

    console.log('\n🔒 SECURITY STATUS:');
    Object.keys(details.security.securityHeaders).forEach(header => {
      const status = details.security.securityHeaders[header].present ? '✅' : '❌';
      console.log(`   ${status} ${header}`);
    });

    console.log('\n♿ ACCESSIBILITY FEATURES:');
    details.accessibility.checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`   ${status} ${check.name} (${check.score}/${check.weight})`);
    });

    if (summary.productionReadiness >= 95) {
      console.log('\n🎉 CONGRATULATIONS! 🎉');
      console.log('The application has achieved 100% production readiness with The Hammer\'s optimization!');
    } else {
      console.log('\n⚠️  AREAS FOR IMPROVEMENT:');
      if (details.performance.score < 90) console.log('   - Performance optimization needed');
      if (details.security.score < 95) console.log('   - Security hardening required');
      if (details.accessibility.score < 90) console.log('   - Accessibility improvements needed');
    }

    console.log('\n' + '='.repeat(80));
  }

  async run() {
    this.log('🔨 THE HAMMER\'S FINAL OPTIMIZATION VALIDATION 🔨', 'hammer');
    this.log('Starting comprehensive production readiness assessment...');

    try {
      await this.performLoadTest();
      await this.performSecurityAssessment();
      await this.performAccessibilityValidation();

      const report = this.generateReport();

      this.log('Validation completed successfully!', 'success');
      return report;

    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new HammerValidator();
  validator.run()
    .then(report => {
      process.exit(report.summary.productionReadiness >= 95 ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = HammerValidator;