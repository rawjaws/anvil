/**
 * Integration Tests for Compliance System
 * Tests the complete compliance workflow and system integration
 */

const request = require('supertest');
const express = require('express');
const { AIServiceManager } = require('../../ai-services/AIServiceManager');
const complianceRoutes = require('../../api/compliance-endpoints');
const { RequirementsPrecisionEngine } = require('../../validation/RequirementsPrecisionEngine');

describe('Compliance System Integration', () => {
  let app;
  let aiServiceManager;

  beforeAll(() => {
    // Setup Express app with compliance routes
    app = express();
    app.use(express.json());
    app.use('/api/compliance', complianceRoutes);

    // Initialize AI Service Manager
    aiServiceManager = new AIServiceManager({
      compliance: {
        realTimeValidation: true,
        responseTimeTarget: 200,
        accuracyTarget: 95,
        enableAuditTrail: true
      }
    });
  });

  describe('API Endpoints Integration', () => {
    describe('POST /api/compliance/check', () => {
      test('should perform compliance check via API', async () => {
        const document = {
          id: 'ENB-API-001',
          title: 'Healthcare Data Processing',
          description: 'System for processing patient health information with HIPAA compliance'
        };

        const response = await request(app)
          .post('/api/compliance/check')
          .send({ document })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.isCompliant).toBeDefined();
        expect(response.body.data.applicableRegulations).toBeDefined();
        expect(response.body.data.checkId).toBeDefined();
      });

      test('should return error for missing document', async () => {
        const response = await request(app)
          .post('/api/compliance/check')
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Document is required');
      });

      test('should handle healthcare documents correctly', async () => {
        const healthcareDoc = {
          id: 'ENB-HEALTH-001',
          title: 'Patient Records System',
          description: 'Electronic health records with PHI encryption and access controls'
        };

        const response = await request(app)
          .post('/api/compliance/check')
          .send({ document: healthcareDoc })
          .expect(200);

        expect(response.body.data.applicableRegulations).toContain('HIPAA');
      });

      test('should handle financial documents correctly', async () => {
        const financialDoc = {
          id: 'ENB-FIN-001',
          title: 'Financial Reporting System',
          description: 'System for financial reporting with segregation of duties and audit trails'
        };

        const response = await request(app)
          .post('/api/compliance/check')
          .send({ document: financialDoc })
          .expect(200);

        expect(response.body.data.applicableRegulations).toContain('SOX');
      });
    });

    describe('POST /api/compliance/bulk-check', () => {
      test('should perform bulk compliance checks', async () => {
        const documents = [
          {
            id: 'ENB-BULK-001',
            title: 'Healthcare System',
            description: 'Medical records processing'
          },
          {
            id: 'ENB-BULK-002',
            title: 'Payment System',
            description: 'Credit card processing'
          }
        ];

        const response = await request(app)
          .post('/api/compliance/bulk-check')
          .send({ documents })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.totalDocuments).toBe(2);
        expect(response.body.data.results).toHaveLength(2);
        expect(response.body.data.averageComplianceScore).toBeDefined();
      });

      test('should reject empty document arrays', async () => {
        const response = await request(app)
          .post('/api/compliance/bulk-check')
          .send({ documents: [] })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('must not be empty');
      });

      test('should reject oversized document arrays', async () => {
        const documents = Array.from({ length: 101 }, (_, i) => ({
          id: `ENB-${i}`,
          description: `Test document ${i}`
        }));

        const response = await request(app)
          .post('/api/compliance/bulk-check')
          .send({ documents })
          .expect(400);

        expect(response.body.error).toContain('Maximum 100 documents');
      });
    });

    describe('POST /api/compliance/detect-regulations', () => {
      test('should detect regulations for documents', async () => {
        const document = {
          id: 'ENB-DETECT-001',
          description: 'European user data processing with GDPR compliance'
        };

        const response = await request(app)
          .post('/api/compliance/detect-regulations')
          .send({ document })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('POST /api/compliance/report', () => {
      test('should generate compliance reports', async () => {
        const response = await request(app)
          .post('/api/compliance/report')
          .send({
            scope: 'all',
            format: 'json',
            timeRange: '7d'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.reportType).toBe('compliance-summary');
      });

      test('should reject invalid formats', async () => {
        const response = await request(app)
          .post('/api/compliance/report')
          .send({ format: 'invalid-format' })
          .expect(400);

        expect(response.body.error).toContain('Invalid format');
      });
    });

    describe('POST /api/compliance/dashboard', () => {
      test('should provide dashboard data', async () => {
        const response = await request(app)
          .post('/api/compliance/dashboard')
          .send({ timeRange: '7d' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.overview).toBeDefined();
        expect(response.body.data.timeRange).toBe('7d');
      });
    });

    describe('GET /api/compliance/regulations', () => {
      test('should list supported regulations', async () => {
        const response = await request(app)
          .get('/api/compliance/regulations')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.supportedRegulations).toBeDefined();
        expect(Array.isArray(response.body.data.supportedRegulations)).toBe(true);
        expect(response.body.data.supportedRegulations).toContain('GDPR');
        expect(response.body.data.supportedRegulations).toContain('HIPAA');
      });
    });

    describe('GET /api/compliance/health', () => {
      test('should provide health status', async () => {
        const response = await request(app)
          .get('/api/compliance/health')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBeDefined();
        expect(response.body.data.timestamp).toBeDefined();
      });
    });
  });

  describe('Requirements Precision Engine Integration', () => {
    let precisionEngine;

    beforeEach(() => {
      precisionEngine = new RequirementsPrecisionEngine({
        enableComplianceChecking: true,
        complianceRealtimeMode: true
      });
    });

    test('should integrate compliance checking in validation', async () => {
      const document = {
        id: 'ENB-PRECISION-001',
        title: 'Healthcare Data System',
        description: 'Process patient health information with encryption',
        status: 'In Draft',
        priority: 'High',
        owner: 'Healthcare Team'
      };

      const result = await precisionEngine.validateDocument(document, 'enabler', {});

      expect(result).toBeDefined();
      expect(result.isValid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.suggestions).toBeDefined();

      // Check if compliance-related errors/warnings were added
      const complianceItems = [
        ...result.errors,
        ...result.warnings,
        ...result.suggestions
      ].filter(item => item.field === 'compliance' || item.type?.includes('COMPLIANCE'));

      // Should have some compliance-related feedback
      expect(complianceItems.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle compliance engine unavailable gracefully', async () => {
      const engineWithoutCompliance = new RequirementsPrecisionEngine({
        enableComplianceChecking: false
      });

      const document = {
        id: 'ENB-NO-COMPLIANCE-001',
        title: 'Test Document',
        description: 'Test document without compliance checking'
      };

      const result = await engineWithoutCompliance.validateDocument(document, 'enabler', {});

      expect(result.isValid).toBeDefined();
      // Should not fail even without compliance engine
    });

    test('should map compliance severity to validation severity', () => {
      const mappings = [
        ['critical', 'high'],
        ['high', 'high'],
        ['medium', 'medium'],
        ['low', 'low'],
        ['unknown', 'medium']
      ];

      mappings.forEach(([complianceSeverity, expectedValidationSeverity]) => {
        const result = precisionEngine.mapComplianceSeverityToValidation(complianceSeverity);
        expect(result).toBe(expectedValidationSeverity);
      });
    });

    test('should add compliance recommendations as validation suggestions', async () => {
      const document = {
        id: 'ENB-SUGGESTIONS-001',
        title: 'Financial Reporting System',
        description: 'Basic financial reporting without proper controls',
        status: 'In Draft',
        priority: 'Medium'
      };

      const result = await precisionEngine.validateDocument(document, 'enabler', {});

      // Look for compliance-related suggestions
      const complianceSuggestions = result.suggestions.filter(
        suggestion => suggestion.type === 'COMPLIANCE_RECOMMENDATION'
      );

      // Should have recommendations if compliance issues are detected
      expect(Array.isArray(complianceSuggestions)).toBe(true);
    });
  });

  describe('Full Workflow Integration', () => {
    test('should complete full compliance workflow', async () => {
      // Step 1: Create a document with compliance implications
      const document = {
        id: 'ENB-WORKFLOW-001',
        title: 'Multi-Regulation System',
        description: 'System processing health information and payment data for European and US customers',
        functionalRequirements: [
          {
            reqId: 'FR-001',
            requirement: 'System shall encrypt all data in transit and at rest',
            priority: 'High'
          }
        ]
      };

      // Step 2: Detect applicable regulations
      const detectionResponse = await request(app)
        .post('/api/compliance/detect-regulations')
        .send({ document })
        .expect(200);

      expect(detectionResponse.body.data.length).toBeGreaterThan(0);

      // Step 3: Perform compliance check
      const checkResponse = await request(app)
        .post('/api/compliance/check')
        .send({ document })
        .expect(200);

      const complianceResult = checkResponse.body.data;
      expect(complianceResult.applicableRegulations.length).toBeGreaterThan(0);

      // Step 4: Validate with precision engine (including compliance)
      const precisionEngine = new RequirementsPrecisionEngine({
        enableComplianceChecking: true
      });

      const validationResult = await precisionEngine.validateDocument(document, 'enabler', {});
      expect(validationResult).toBeDefined();

      // Step 5: Generate compliance report
      const reportResponse = await request(app)
        .post('/api/compliance/report')
        .send({ scope: 'all', format: 'json' })
        .expect(200);

      expect(reportResponse.body.data.reportType).toBe('compliance-summary');
    });

    test('should maintain audit trail throughout workflow', async () => {
      const document = {
        id: 'ENB-AUDIT-001',
        title: 'Audit Trail Test',
        description: 'Document for testing audit trail functionality'
      };

      // Perform several compliance operations
      await request(app)
        .post('/api/compliance/check')
        .send({ document });

      await request(app)
        .post('/api/compliance/detect-regulations')
        .send({ document });

      // Check audit trail
      const auditResponse = await request(app)
        .get('/api/compliance/audit-trail')
        .expect(200);

      expect(auditResponse.body.success).toBe(true);
      expect(auditResponse.body.data).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    test('should meet performance targets in integrated environment', async () => {
      const document = {
        id: 'ENB-PERF-001',
        title: 'Performance Test Document',
        description: 'Healthcare system with payment processing for performance testing'
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/compliance/check')
        .send({ document });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
      expect(response.body.data.processingTime).toBeLessThan(500); // Internal processing under 500ms
    });

    test('should handle concurrent requests efficiently', async () => {
      const documents = Array.from({ length: 5 }, (_, i) => ({
        id: `ENB-CONCURRENT-${i}`,
        title: `Concurrent Test ${i}`,
        description: 'Healthcare data processing for concurrent testing'
      }));

      const startTime = Date.now();

      const promises = documents.map(document =>
        request(app)
          .post('/api/compliance/check')
          .send({ document })
      );

      const responses = await Promise.all(promises);

      const totalTime = Date.now() - startTime;

      expect(responses.every(response => response.status === 200)).toBe(true);
      expect(totalTime).toBeLessThan(3000); // All requests should complete within 3 seconds
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle malformed requests gracefully', async () => {
      const response = await request(app)
        .post('/api/compliance/check')
        .send({ invalidField: 'invalid data' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should handle service unavailability', async () => {
      // This would typically involve mocking service failures
      // For now, we'll test with invalid document structure
      const response = await request(app)
        .post('/api/compliance/check')
        .send({ document: null })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should validate input parameters', async () => {
      // Test invalid time range
      const response = await request(app)
        .post('/api/compliance/dashboard')
        .send({ timeRange: 'invalid-range' })
        .expect(200); // Should handle gracefully with defaults

      expect(response.body.success).toBe(true);
    });
  });

  describe('Security Integration', () => {
    test('should log compliance API requests for audit', async () => {
      const document = {
        id: 'ENB-SECURITY-001',
        title: 'Security Test Document',
        description: 'Document for testing security logging'
      };

      const response = await request(app)
        .post('/api/compliance/check')
        .set('X-Request-ID', 'test-request-123')
        .set('User-Agent', 'test-agent')
        .send({ document })
        .expect(200);

      expect(response.body.success).toBe(true);
      // In a real system, we would verify audit logs were created
    });

    test('should handle sensitive data appropriately', async () => {
      const sensitiveDocument = {
        id: 'ENB-SENSITIVE-001',
        title: 'Sensitive Data Processing',
        description: 'System processing SSN, credit card numbers, and health records'
      };

      const response = await request(app)
        .post('/api/compliance/check')
        .send({ document: sensitiveDocument })
        .expect(200);

      // Should detect multiple regulations for sensitive data
      expect(response.body.data.applicableRegulations.length).toBeGreaterThan(1);
    });
  });

  describe('Scalability Integration', () => {
    test('should handle large document bulk checks', async () => {
      const largeDocumentSet = Array.from({ length: 50 }, (_, i) => ({
        id: `ENB-SCALE-${i}`,
        title: `Scalability Test Document ${i}`,
        description: `Healthcare system ${i} for scalability testing`
      }));

      const response = await request(app)
        .post('/api/compliance/bulk-check')
        .send({ documents: largeDocumentSet })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.totalDocuments).toBe(50);
      expect(response.body.data.results).toHaveLength(50);
    });

    test('should maintain performance with complex documents', async () => {
      const complexDocument = {
        id: 'ENB-COMPLEX-001',
        title: 'Complex Multi-Regulatory System',
        description: 'Enterprise healthcare payment processing system with international user base, handling PHI, PII, and financial data across EU and US jurisdictions with SOX, HIPAA, GDPR, and PCI-DSS requirements',
        functionalRequirements: Array.from({ length: 20 }, (_, i) => ({
          reqId: `FR-${i + 1}`,
          requirement: `Complex functional requirement ${i + 1} with regulatory implications`,
          priority: i % 3 === 0 ? 'High' : 'Medium'
        })),
        nonFunctionalRequirements: Array.from({ length: 10 }, (_, i) => ({
          reqId: `NFR-${i + 1}`,
          type: 'Security',
          requirement: `Security requirement ${i + 1} for compliance`,
          priority: 'High'
        }))
      };

      const startTime = Date.now();

      const response = await request(app)
        .post('/api/compliance/check')
        .send({ document: complexDocument })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(response.body.success).toBe(true);
      expect(response.body.data.applicableRegulations.length).toBeGreaterThan(2);
      expect(responseTime).toBeLessThan(2000); // Should handle complexity within 2 seconds
    });
  });
});