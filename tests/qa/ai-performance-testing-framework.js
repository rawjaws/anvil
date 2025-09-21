/**
 * AI Performance Testing Framework for Anvil Phase 5
 *
 * This framework provides comprehensive performance testing for all AI systems:
 * - Response time validation (<200ms target)
 * - Throughput testing
 * - Concurrent load testing
 * - Memory and CPU usage monitoring
 * - Scalability validation
 * - Performance regression detection
 */

const { performance } = require('perf_hooks');
const os = require('os');
const { AIServiceManager } = require('../../ai-services/AIServiceManager');
const { PreCogMarketEngine } = require('../../ai-services/PreCogMarketEngine');
const { ComplianceEngine } = require('../../ai-services/ComplianceEngine');
const { SmartAutocomplete } = require('../../ai-services/SmartAutocomplete');
const { QualityAnalysisEngine } = require('../../ai-services/QualityAnalysisEngine');
const { SmartAnalysisEngine } = require('../../ai-services/SmartAnalysisEngine');

class AIPerformanceTestFramework {
  constructor() {
    this.testResults = {
      responseTime: [],
      throughput: [],
      concurrency: [],
      memoryUsage: [],
      cpuUsage: [],
      errorRates: []
    };

    this.performanceTargets = {
      autocompleteResponse: 100, // ms
      aiProcessingResponse: 200, // ms
      complianceCheckResponse: 200, // ms
      analyticsResponse: 300, // ms
      precogResponse: 500, // ms
      maxMemoryIncrease: 100, // MB
      maxCPUUsage: 80, // percent
      maxErrorRate: 1, // percent
      minThroughput: 50 // requests per second
    };

    this.services = {};
  }

  async initialize() {
    this.services = {
      aiManager: new AIServiceManager(),
      precog: new PreCogMarketEngine(),
      compliance: new ComplianceEngine(),
      autocomplete: new SmartAutocomplete(),
      qualityAnalysis: new QualityAnalysisEngine(),
      analytics: new SmartAnalysisEngine()
    };

    // Initialize all services
    await Promise.all([
      this.services.precog.initialize(),
      this.services.compliance.initialize(),
      this.services.analytics.initialize()
    ]);
  }

  getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const loadAvg = os.loadavg();

    return {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024) // MB
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      load: {
        oneMinute: loadAvg[0],
        fiveMinute: loadAvg[1],
        fifteenMinute: loadAvg[2]
      },
      timestamp: Date.now()
    };
  }

  async measurePerformance(testFunction, testName, iterations = 1) {
    const startMetrics = this.getSystemMetrics();
    const responseTimes = [];
    const errors = [];

    console.log(`\n🔄 Running ${testName} (${iterations} iterations)...`);

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      try {
        await testFunction();
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        if (i % Math.max(1, Math.floor(iterations / 10)) === 0) {
          process.stdout.write(`\r  Progress: ${Math.round((i / iterations) * 100)}%`);
        }
      } catch (error) {
        errors.push(error);
        const endTime = performance.now();
        responseTimes.push(endTime - startTime);
      }
    }

    const endMetrics = this.getSystemMetrics();

    const results = {
      testName,
      iterations,
      responseTimes: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
        p50: this.percentile(responseTimes, 50),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99)
      },
      errorRate: (errors.length / iterations) * 100,
      throughput: iterations / (responseTimes.reduce((sum, time) => sum + time, 0) / 1000),
      memoryDelta: endMetrics.memory.heapUsed - startMetrics.memory.heapUsed,
      errors: errors.map(err => err.message)
    };

    console.log(`\n  ✅ ${testName} completed`);
    console.log(`     Average Response Time: ${results.responseTimes.avg.toFixed(2)}ms`);
    console.log(`     95th Percentile: ${results.responseTimes.p95.toFixed(2)}ms`);
    console.log(`     Error Rate: ${results.errorRate.toFixed(2)}%`);
    console.log(`     Throughput: ${results.throughput.toFixed(2)} req/s`);
    console.log(`     Memory Delta: ${results.memoryDelta}MB`);

    this.testResults.responseTime.push(results);
    return results;
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }

  async runAutocompletePerformanceTest() {
    const testCases = [
      { text: 'The user shall', position: 13, context: { documentType: 'functional' } },
      { text: 'The system must', position: 15, context: { documentType: 'nonfunctional' } },
      { text: 'When the user clicks', position: 20, context: { documentType: 'acceptance-criteria' } },
      { text: 'Given that the system', position: 21, context: { documentType: 'bdd' } }
    ];

    return await this.measurePerformance(async () => {
      const testCase = testCases[Math.floor(Math.random() * testCases.length)];
      await this.services.autocomplete.getSuggestions(
        testCase.text,
        testCase.position,
        testCase.context
      );
    }, 'Autocomplete Performance', 100);
  }

  async runAIProcessingPerformanceTest() {
    const testRequests = [
      {
        type: 'requirements-analysis',
        content: 'Users need to be able to save their work and come back to it later'
      },
      {
        type: 'capability-analysis',
        content: 'User authentication and session management capability'
      },
      {
        type: 'suggestions',
        analysisResult: { qualityScore: 75, issues: ['clarity'] },
        context: { documentType: 'functional' }
      }
    ];

    return await this.measurePerformance(async () => {
      const request = testRequests[Math.floor(Math.random() * testRequests.length)];
      await this.services.aiManager.processRequest(request);
    }, 'AI Processing Performance', 50);
  }

  async runCompliancePerformanceTest() {
    const testDocuments = [
      {
        id: 'PERF-TEST-001',
        title: 'Healthcare Data System',
        description: 'System for processing patient health information with HIPAA compliance requirements'
      },
      {
        id: 'PERF-TEST-002',
        title: 'Payment Gateway',
        description: 'Secure payment processing system for credit card transactions with PCI-DSS compliance'
      },
      {
        id: 'PERF-TEST-003',
        title: 'User Data Management',
        description: 'Personal data collection and processing system with GDPR compliance requirements'
      }
    ];

    return await this.measurePerformance(async () => {
      const document = testDocuments[Math.floor(Math.random() * testDocuments.length)];
      await this.services.compliance.checkCompliance(document);
    }, 'Compliance Check Performance', 30);
  }

  async runAnalyticsPerformanceTest() {
    const testInputs = [
      {
        documentType: 'requirements',
        content: 'The system shall process user requests efficiently and provide real-time feedback.'
      },
      {
        documentType: 'capability',
        content: 'Advanced analytics and reporting capability with machine learning integration.'
      },
      {
        documentType: 'enabler',
        content: 'Cloud infrastructure enabler for scalable deployment and monitoring.'
      }
    ];

    return await this.measurePerformance(async () => {
      const input = testInputs[Math.floor(Math.random() * testInputs.length)];
      await this.services.analytics.processSmartAnalysis(input);
    }, 'Analytics Performance', 25);
  }

  async runPreCogPerformanceTest() {
    const markets = ['technology', 'healthcare', 'finance', 'retail', 'automotive'];
    const timeframes = [30, 60, 90];

    return await this.measurePerformance(async () => {
      const market = markets[Math.floor(Math.random() * markets.length)];
      const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
      await this.services.precog.performMarketPrecognition(market, timeframe);
    }, 'PreCog Analysis Performance', 10);
  }

  async runConcurrencyTest() {
    const concurrencyLevels = [5, 10, 20, 30];
    const concurrencyResults = [];

    for (const level of concurrencyLevels) {
      console.log(`\n🔄 Testing concurrency level: ${level}`);

      const startTime = performance.now();
      const startMetrics = this.getSystemMetrics();

      const promises = Array.from({ length: level }, async () => {
        const operations = [
          () => this.services.autocomplete.getSuggestions('The user shall', 13),
          () => this.services.aiManager.processRequest({
            type: 'requirements-analysis',
            content: 'Test concurrent processing'
          }),
          () => this.services.compliance.checkCompliance({
            id: `CONCURRENT-${Date.now()}`,
            description: 'Concurrent test document'
          })
        ];

        const operation = operations[Math.floor(Math.random() * operations.length)];
        return await operation();
      });

      const results = await Promise.allSettled(promises);
      const endTime = performance.now();
      const endMetrics = this.getSystemMetrics();

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const totalTime = endTime - startTime;

      const concurrencyResult = {
        level,
        successful,
        failed,
        successRate: (successful / level) * 100,
        totalTime,
        avgTimePerRequest: totalTime / level,
        throughput: level / (totalTime / 1000),
        memoryDelta: endMetrics.memory.heapUsed - startMetrics.memory.heapUsed
      };

      concurrencyResults.push(concurrencyResult);

      console.log(`     Success Rate: ${concurrencyResult.successRate.toFixed(2)}%`);
      console.log(`     Throughput: ${concurrencyResult.throughput.toFixed(2)} req/s`);
      console.log(`     Memory Delta: ${concurrencyResult.memoryDelta}MB`);
    }

    this.testResults.concurrency = concurrencyResults;
    return concurrencyResults;
  }

  async runLoadTest() {
    const loadTestDuration = 30000; // 30 seconds
    const requestInterval = 100; // 100ms between requests
    const loadResults = [];

    console.log(`\n🔄 Running sustained load test for ${loadTestDuration / 1000} seconds...`);

    const startTime = Date.now();
    let requestCount = 0;
    let successCount = 0;
    let errorCount = 0;

    while (Date.now() - startTime < loadTestDuration) {
      const requestStartTime = performance.now();

      try {
        await this.services.aiManager.processRequest({
          type: 'requirements-analysis',
          content: `Load test request ${++requestCount}`
        });

        const responseTime = performance.now() - requestStartTime;
        loadResults.push({
          requestId: requestCount,
          responseTime,
          success: true,
          timestamp: Date.now()
        });

        successCount++;
      } catch (error) {
        const responseTime = performance.now() - requestStartTime;
        loadResults.push({
          requestId: requestCount,
          responseTime,
          success: false,
          error: error.message,
          timestamp: Date.now()
        });

        errorCount++;
      }

      if (requestCount % 10 === 0) {
        process.stdout.write(`\r  Requests: ${requestCount}, Success: ${successCount}, Errors: ${errorCount}`);
      }

      await new Promise(resolve => setTimeout(resolve, requestInterval));
    }

    const responseTimes = loadResults.map(r => r.responseTime);
    const loadTestResults = {
      duration: loadTestDuration,
      totalRequests: requestCount,
      successfulRequests: successCount,
      failedRequests: errorCount,
      successRate: (successCount / requestCount) * 100,
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
      p95ResponseTime: this.percentile(responseTimes, 95),
      throughput: requestCount / (loadTestDuration / 1000)
    };

    console.log(`\n  ✅ Load test completed`);
    console.log(`     Total Requests: ${loadTestResults.totalRequests}`);
    console.log(`     Success Rate: ${loadTestResults.successRate.toFixed(2)}%`);
    console.log(`     Average Response Time: ${loadTestResults.averageResponseTime.toFixed(2)}ms`);
    console.log(`     Throughput: ${loadTestResults.throughput.toFixed(2)} req/s`);

    this.testResults.throughput.push(loadTestResults);
    return loadTestResults;
  }

  async runMemoryLeakTest() {
    console.log('\n🔄 Running memory leak test...');

    const iterations = 100;
    const memorySnapshots = [];

    for (let i = 0; i < iterations; i++) {
      // Perform various AI operations
      await Promise.all([
        this.services.autocomplete.getSuggestions('The user shall', 13),
        this.services.aiManager.processRequest({
          type: 'requirements-analysis',
          content: `Memory test iteration ${i}`
        }),
        this.services.compliance.checkCompliance({
          id: `MEM-TEST-${i}`,
          description: 'Memory leak test document'
        })
      ]);

      // Take memory snapshot every 10 iterations
      if (i % 10 === 0) {
        const metrics = this.getSystemMetrics();
        memorySnapshots.push({
          iteration: i,
          heapUsed: metrics.memory.heapUsed,
          heapTotal: metrics.memory.heapTotal,
          rss: metrics.memory.rss
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      if (i % 20 === 0) {
        process.stdout.write(`\r  Memory test progress: ${Math.round((i / iterations) * 100)}%`);
      }
    }

    // Analyze memory trend
    const firstSnapshot = memorySnapshots[0];
    const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
    const memoryIncrease = lastSnapshot.heapUsed - firstSnapshot.heapUsed;
    const memoryIncreasePercentage = (memoryIncrease / firstSnapshot.heapUsed) * 100;

    const memoryLeakResult = {
      iterations,
      snapshots: memorySnapshots,
      memoryIncrease,
      memoryIncreasePercentage,
      hasMemoryLeak: memoryIncreasePercentage > 50 // Flag if memory increased by more than 50%
    };

    console.log(`\n  ✅ Memory leak test completed`);
    console.log(`     Memory Increase: ${memoryIncrease}MB (${memoryIncreasePercentage.toFixed(2)}%)`);
    console.log(`     Memory Leak Detected: ${memoryLeakResult.hasMemoryLeak ? 'YES' : 'NO'}`);

    this.testResults.memoryUsage.push(memoryLeakResult);
    return memoryLeakResult;
  }

  validatePerformanceTargets() {
    const validation = {
      autocomplete: true,
      aiProcessing: true,
      compliance: true,
      analytics: true,
      precog: true,
      concurrency: true,
      memoryUsage: true,
      overall: true
    };

    const violations = [];

    // Check response time targets
    this.testResults.responseTime.forEach(result => {
      const target = this.performanceTargets[result.testName.toLowerCase().replace(/\s+/g, '')] ||
                    this.performanceTargets.aiProcessingResponse;

      if (result.responseTimes.p95 > target) {
        validation[result.testName.toLowerCase().replace(/\s+/g, '')] = false;
        violations.push(`${result.testName}: P95 response time ${result.responseTimes.p95.toFixed(2)}ms exceeds target ${target}ms`);
      }
    });

    // Check memory usage
    this.testResults.memoryUsage.forEach(result => {
      if (result.memoryIncrease > this.performanceTargets.maxMemoryIncrease) {
        validation.memoryUsage = false;
        violations.push(`Memory increase ${result.memoryIncrease}MB exceeds target ${this.performanceTargets.maxMemoryIncrease}MB`);
      }
    });

    // Check concurrency
    this.testResults.concurrency.forEach(result => {
      if (result.successRate < 95) {
        validation.concurrency = false;
        violations.push(`Concurrency level ${result.level}: Success rate ${result.successRate.toFixed(2)}% below 95%`);
      }
    });

    validation.overall = Object.values(validation).every(v => v === true);

    return {
      validation,
      violations,
      passed: validation.overall
    };
  }

  generatePerformanceReport() {
    const validation = this.validatePerformanceTargets();

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: Object.values(this.testResults).flat().length,
        passed: validation.passed,
        violations: validation.violations.length
      },
      targets: this.performanceTargets,
      results: this.testResults,
      validation,
      recommendations: []
    };

    // Generate recommendations based on results
    if (!validation.passed) {
      report.recommendations.push('Performance optimization required before production deployment');
    }

    if (validation.violations.some(v => v.includes('response time'))) {
      report.recommendations.push('Consider optimizing AI processing algorithms or increasing hardware resources');
    }

    if (validation.violations.some(v => v.includes('Memory'))) {
      report.recommendations.push('Investigate potential memory leaks and optimize memory usage');
    }

    if (validation.violations.some(v => v.includes('Concurrency'))) {
      report.recommendations.push('Improve error handling and resource management for concurrent operations');
    }

    return report;
  }
}

module.exports = { AIPerformanceTestFramework };