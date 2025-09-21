/**
 * Comprehensive Test Suite for ComplianceEngine
 * Tests all compliance checking, regulation detection, and audit functionality
 */

const { ComplianceEngine } = require('../../ai-services/ComplianceEngine');
const { RegulatoryDatabase } = require('../../ai-services/RegulatoryDatabase');
const { AuditTrailGenerator } = require('../../ai-services/AuditTrailGenerator');

describe('ComplianceEngine', () => {
  let complianceEngine;

  beforeEach(() => {
    complianceEngine = new ComplianceEngine({
      realTimeValidation: true,
      responseTimeTarget: 200,
      accuracyTarget: 95,
      enableAuditTrail: true,
      autoDetection: true
    });
  });

  afterEach(() => {
    if (complianceEngine) {
      complianceEngine.complianceCache?.clear();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      expect(complianceEngine).toBeDefined();
      expect(complianceEngine.version).toBe('1.0.0');
      expect(complianceEngine.name).toBe('Compliance Engine');
      expect(complianceEngine.config.realTimeValidation).toBe(true);
      expect(complianceEngine.config.responseTimeTarget).toBe(200);
    });

    test('should initialize regulatory database', () => {
      expect(complianceEngine.regulatoryDatabase).toBeInstanceOf(RegulatoryDatabase);
    });

    test('should initialize audit trail generator', () => {
      expect(complianceEngine.auditTrail).toBeInstanceOf(AuditTrailGenerator);
    });

    test('should emit initialization event', async (done) => {
      const newEngine = new ComplianceEngine();

      newEngine.on('compliance-engine-initialized', (data) => {
        expect(data.timestamp).toBeDefined();
        expect(data.regulations).toBeDefined();
        expect(Array.isArray(data.regulations)).toBe(true);
        done();
      });

      await newEngine.initialize();
    });
  });

  describe('Compliance Checking', () => {
    const mockDocument = {
      id: 'ENB-123456',
      title: 'Healthcare Data Processing System',
      description: 'System for processing patient health information and medical records with HIPAA compliance',
      functionalRequirements: [
        {
          reqId: 'FR-001',
          requirement: 'The system shall encrypt all PHI data at rest',
          description: 'Encrypt protected health information',
          priority: 'High',
          status: 'In Draft'
        }
      ]
    };

    test('should perform basic compliance check', async () => {
      const result = await complianceEngine.checkCompliance(mockDocument);

      expect(result).toBeDefined();
      expect(result.isCompliant).toBeDefined();
      expect(result.complianceScore).toBeDefined();
      expect(result.applicableRegulations).toBeDefined();
      expect(Array.isArray(result.applicableRegulations)).toBe(true);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.checkId).toBeDefined();
    });

    test('should detect HIPAA for healthcare documents', async () => {
      const result = await complianceEngine.checkCompliance(mockDocument);

      expect(result.applicableRegulations).toContain('HIPAA');
    });

    test('should detect GDPR for documents with personal data', async () => {
      const gdprDocument = {
        id: 'ENB-789012',
        title: 'User Registration System',
        description: 'System for collecting and processing personal data including email addresses and user preferences'
      };

      const result = await complianceEngine.checkCompliance(gdprDocument);
      expect(result.applicableRegulations).toContain('GDPR');
    });

    test('should identify compliance violations', async () => {
      const violatingDocument = {
        id: 'ENB-999999',
        title: 'Payment Processing',
        description: 'Process credit card payments without encryption'
      };

      const result = await complianceEngine.checkCompliance(violatingDocument);

      expect(result.violations).toBeDefined();
      expect(Array.isArray(result.violations)).toBe(true);
      if (result.violations.length > 0) {
        expect(result.violations[0]).toHaveProperty('type');
        expect(result.violations[0]).toHaveProperty('message');
        expect(result.violations[0]).toHaveProperty('severity');
        expect(result.violations[0]).toHaveProperty('regulation');
      }
    });

    test('should generate recommendations', async () => {
      const result = await complianceEngine.checkCompliance(mockDocument);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should calculate compliance score', async () => {
      const result = await complianceEngine.checkCompliance(mockDocument);

      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });

    test('should assess risk level', async () => {
      const result = await complianceEngine.checkCompliance(mockDocument);

      expect(result.riskLevel).toBeDefined();
      expect(['High', 'Medium', 'Low', 'Minimal']).toContain(result.riskLevel);
    });

    test('should respect response time target', async () => {
      const startTime = Date.now();
      await complianceEngine.checkCompliance(mockDocument);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(complianceEngine.config.responseTimeTarget * 2); // Allow some tolerance
    });
  });

  describe('Regulation Detection', () => {
    test('should detect industry based on keywords', () => {
      const healthcareDoc = { description: 'medical records and patient information' };
      const industry = complianceEngine.detectIndustry(healthcareDoc);
      expect(industry).toBe('healthcare');

      const financialDoc = { description: 'banking transactions and payment processing' };
      const financialIndustry = complianceEngine.detectIndustry(financialDoc);
      expect(financialIndustry).toBe('financial');
    });

    test('should detect data types', () => {
      const document = { description: 'personal data, health information, and payment details' };
      const dataTypes = complianceEngine.detectDataTypes(document);

      expect(dataTypes).toContain('personal');
      expect(dataTypes).toContain('health');
      expect(dataTypes).toContain('financial');
    });

    test('should detect geographic scope', () => {
      const euDoc = { description: 'GDPR compliance for European users' };
      const scope = complianceEngine.detectGeographicScope(euDoc);
      expect(scope).toBe('EU');

      const usDoc = { description: 'HIPAA requirements for United States healthcare' };
      const usScope = complianceEngine.detectGeographicScope(usDoc);
      expect(usScope).toBe('US');
    });

    test('should detect business functions', () => {
      const document = { description: 'user authentication and payment processing system' };
      const functions = complianceEngine.detectBusinessFunctions(document);

      expect(functions).toContain('user_authentication');
      expect(functions).toContain('payment_processing');
    });
  });

  describe('Bulk Compliance Checking', () => {
    const mockDocuments = [
      {
        id: 'ENB-001',
        title: 'Healthcare System',
        description: 'Medical records processing'
      },
      {
        id: 'ENB-002',
        title: 'Payment Gateway',
        description: 'Credit card transaction processing'
      },
      {
        id: 'ENB-003',
        title: 'User Management',
        description: 'Personal data and user authentication'
      }
    ];

    test('should process multiple documents', async () => {
      const result = await complianceEngine.bulkComplianceCheck(mockDocuments);

      expect(result).toBeDefined();
      expect(result.totalDocuments).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.averageComplianceScore).toBeGreaterThanOrEqual(0);
    });

    test('should provide summary statistics', async () => {
      const result = await complianceEngine.bulkComplianceCheck(mockDocuments);

      expect(result.compliantDocuments).toBeGreaterThanOrEqual(0);
      expect(result.nonCompliantDocuments).toBeGreaterThanOrEqual(0);
      expect(result.compliantDocuments + result.nonCompliantDocuments).toBe(result.totalDocuments);
    });
  });

  describe('Specific Regulation Validation', () => {
    describe('GDPR Validation', () => {
      test('should validate data protection requirements', async () => {
        const document = {
          id: 'ENB-GDPR-001',
          description: 'personal data processing with consent and data minimization'
        };

        const requirement = {
          id: 'GDPR-Art5',
          type: 'data_protection',
          keywords: ['personal data', 'processing', 'lawful basis']
        };

        const result = await complianceEngine.validateDataProtection(document, requirement, {});

        expect(result).toBeDefined();
        expect(result.isCompliant).toBeDefined();
        expect(result.message).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);
      });

      test('should identify missing lawful basis', async () => {
        const document = {
          id: 'ENB-GDPR-002',
          description: 'personal data collection without specified purpose'
        };

        const requirement = {
          id: 'GDPR-Art6',
          type: 'data_protection',
          keywords: ['consent', 'contract', 'legal obligation']
        };

        const result = await complianceEngine.validateDataProtection(document, requirement, {});

        expect(result.isCompliant).toBe(false);
        expect(result.recommendations.length).toBeGreaterThan(0);
      });
    });

    describe('HIPAA Validation', () => {
      test('should validate PHI protection requirements', async () => {
        const document = {
          id: 'ENB-HIPAA-001',
          description: 'health information processing with encryption and access controls'
        };

        const requirement = {
          id: 'HIPAA-164.502',
          type: 'privacy',
          keywords: ['PHI', 'protected health information']
        };

        const result = await complianceEngine.validatePrivacy(document, requirement, {});

        expect(result).toBeDefined();
        expect(result.isCompliant).toBeDefined();
      });

      test('should identify missing encryption for PHI', async () => {
        const document = {
          id: 'ENB-HIPAA-002',
          description: 'medical record storage without encryption'
        };

        const requirement = {
          id: 'HIPAA-164.312',
          type: 'security_controls',
          keywords: ['encryption', 'PHI']
        };

        const result = await complianceEngine.validatePrivacy(document, requirement, {});

        expect(result.isCompliant).toBe(false);
      });
    });

    describe('SOX Validation', () => {
      test('should validate financial controls', async () => {
        const document = {
          id: 'ENB-SOX-001',
          description: 'financial reporting with segregation of duties and audit trail'
        };

        const requirement = {
          id: 'SOX-404',
          type: 'financial_controls',
          keywords: ['internal controls', 'financial reporting']
        };

        const result = await complianceEngine.validateFinancialControls(document, requirement, {});

        expect(result).toBeDefined();
        expect(result.isCompliant).toBeDefined();
      });
    });

    describe('PCI-DSS Validation', () => {
      test('should validate payment card security', async () => {
        const document = {
          id: 'ENB-PCI-001',
          description: 'payment processing with firewall and encryption'
        };

        const requirement = {
          id: 'PCI-REQ1',
          type: 'security_controls',
          keywords: ['firewall', 'cardholder data']
        };

        const result = await complianceEngine.validateSecurityControls(document, requirement, {});

        expect(result).toBeDefined();
        expect(result.isCompliant).toBeDefined();
      });
    });
  });

  describe('Reporting and Analytics', () => {
    test('should generate compliance report', async () => {
      const report = await complianceEngine.generateComplianceReport('all', {});

      expect(report).toBeDefined();
      expect(report.reportType).toBe('compliance-summary');
      expect(report.reportMetadata).toBeDefined();
      expect(report.reportMetadata.generatedAt).toBeDefined();
      expect(report.reportMetadata.reportId).toBeDefined();
    });

    test('should include executive summary in report', async () => {
      const report = await complianceEngine.generateComplianceReport('all', {});

      expect(report.executiveSummary).toBeDefined();
    });

    test('should provide system recommendations', () => {
      const recommendations = complianceEngine.getSystemRecommendations();

      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('Performance and Metrics', () => {
    test('should track performance metrics', async () => {
      await complianceEngine.checkCompliance({ id: 'test', description: 'test document' });

      const metrics = complianceEngine.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.totalChecks).toBeGreaterThan(0);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
    });

    test('should maintain success rate tracking', async () => {
      await complianceEngine.checkCompliance({ id: 'test1', description: 'test document' });
      await complianceEngine.checkCompliance({ id: 'test2', description: 'test document' });

      const metrics = complianceEngine.getMetrics();

      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(100);
    });

    test('should perform health check', async () => {
      const health = await complianceEngine.healthCheck();

      expect(health).toBeDefined();
      expect(health.healthy).toBeDefined();
      expect(health.service).toBe('compliance-engine');
      expect(health.timestamp).toBeDefined();
    });
  });

  describe('Caching', () => {
    test('should cache compliance results', async () => {
      const document = { id: 'cache-test', description: 'caching test document' };

      // First call - should not be from cache
      const result1 = await complianceEngine.checkCompliance(document);
      expect(result1.fromCache).toBe(false);

      // Second call - should be from cache
      const result2 = await complianceEngine.checkCompliance(document);
      expect(result2.fromCache).toBe(true);
    });

    test('should respect cache TTL', async () => {
      const shortTTLEngine = new ComplianceEngine({
        cacheResults: true,
        cacheTTL: 100 // 100ms
      });

      const document = { id: 'ttl-test', description: 'TTL test document' };

      // First call
      await shortTTLEngine.checkCompliance(document);

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Second call - should not be from cache due to TTL expiration
      const result = await shortTTLEngine.checkCompliance(document);
      expect(result.fromCache).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid documents gracefully', async () => {
      const result = await complianceEngine.checkCompliance(null);

      expect(result).toBeDefined();
      expect(result.isCompliant).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle regulatory database errors', async () => {
      // Mock a regulatory database error
      const originalMethod = complianceEngine.regulatoryDatabase.findApplicableRegulations;
      complianceEngine.regulatoryDatabase.findApplicableRegulations = jest.fn().mockRejectedValue(new Error('Database error'));

      const result = await complianceEngine.checkCompliance({ id: 'error-test', description: 'test' });

      expect(result.isCompliant).toBe(false);
      expect(result.error).toBeDefined();

      // Restore original method
      complianceEngine.regulatoryDatabase.findApplicableRegulations = originalMethod;
    });
  });

  describe('Integration with AI Service Manager', () => {
    test('should implement process method for AI Service Manager integration', async () => {
      const request = {
        type: 'compliance-check',
        document: { id: 'integration-test', description: 'integration test document' },
        context: {}
      };

      const result = await complianceEngine.process(request);

      expect(result).toBeDefined();
      expect(result.isCompliant).toBeDefined();
    });

    test('should handle bulk compliance check requests', async () => {
      const request = {
        type: 'bulk-compliance-check',
        documents: [
          { id: 'bulk1', description: 'bulk test 1' },
          { id: 'bulk2', description: 'bulk test 2' }
        ],
        context: {}
      };

      const result = await complianceEngine.process(request);

      expect(result.totalDocuments).toBe(2);
      expect(result.results).toHaveLength(2);
    });

    test('should handle regulation detection requests', async () => {
      const request = {
        type: 'regulation-detection',
        document: { id: 'detection-test', description: 'healthcare data processing' },
        context: {}
      };

      const result = await complianceEngine.process(request);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    test('should handle compliance report requests', async () => {
      const request = {
        type: 'compliance-report',
        scope: 'all',
        options: {}
      };

      const result = await complianceEngine.process(request);

      expect(result.reportType).toBe('compliance-summary');
    });

    test('should reject unsupported request types', async () => {
      const request = {
        type: 'unsupported-type',
        data: {}
      };

      await expect(complianceEngine.process(request)).rejects.toThrow('Unsupported request type');
    });
  });
});

// Performance Tests
describe('ComplianceEngine Performance', () => {
  let complianceEngine;

  beforeEach(() => {
    complianceEngine = new ComplianceEngine({
      responseTimeTarget: 200,
      maxConcurrentChecks: 10
    });
  });

  test('should meet response time targets for single checks', async () => {
    const document = { id: 'perf-test', description: 'performance test document' };
    const startTime = Date.now();

    await complianceEngine.checkCompliance(document);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(500); // Allow reasonable tolerance
  });

  test('should handle concurrent compliance checks', async () => {
    const documents = Array.from({ length: 5 }, (_, i) => ({
      id: `concurrent-${i}`,
      description: `concurrent test document ${i}`
    }));

    const startTime = Date.now();

    const promises = documents.map(doc => complianceEngine.checkCompliance(doc));
    const results = await Promise.all(promises);

    const totalTime = Date.now() - startTime;

    expect(results).toHaveLength(5);
    expect(results.every(result => result.checkId)).toBe(true);
    expect(totalTime).toBeLessThan(2000); // Should handle concurrency efficiently
  });

  test('should respect concurrency limits', async () => {
    const limitedEngine = new ComplianceEngine({
      maxConcurrentChecks: 2
    });

    const documents = Array.from({ length: 5 }, (_, i) => ({
      id: `limit-${i}`,
      description: `concurrency limit test ${i}`
    }));

    const promises = documents.map(doc => limitedEngine.checkCompliance(doc));
    const results = await Promise.all(promises);

    expect(results).toHaveLength(5);
    expect(results.every(result => result.checkId)).toBe(true);
  });
});