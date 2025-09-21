/**
 * Comprehensive Test Suite for Smart Document Generator
 * Tests all generation features, engines, and integrations
 */

const { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } = require('@jest/globals');
const SmartDocumentGenerator = require('../ai-services/SmartDocumentGenerator');
const DocumentTemplateEngine = require('../ai-services/DocumentTemplateEngine');
const ContentExpansionEngine = require('../ai-services/ContentExpansionEngine');
const MultiFormatDocumentProcessor = require('../ai-services/MultiFormatDocumentProcessor');

describe('Smart Document Generator', () => {
  let generator;
  let testConfig;

  beforeAll(() => {
    testConfig = {
      expansionDepth: 'comprehensive',
      qualityThreshold: 80,
      marketInsights: false, // Disable for testing
      templateCaching: true,
      outputFormats: ['markdown', 'html', 'json']
    };
  });

  beforeEach(() => {
    generator = new SmartDocumentGenerator(testConfig);
  });

  afterEach(() => {
    // Clean up any resources
    if (generator) {
      generator.removeAllListeners();
    }
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const defaultGenerator = new SmartDocumentGenerator();
      expect(defaultGenerator).toBeDefined();
      expect(defaultGenerator.version).toBe('1.0.0');
      expect(defaultGenerator.name).toBe('Smart Document Generator');
    });

    test('should initialize with custom configuration', () => {
      expect(generator.config.expansionDepth).toBe('comprehensive');
      expect(generator.config.qualityThreshold).toBe(80);
      expect(generator.templateEngine).toBeDefined();
      expect(generator.contentExpander).toBeDefined();
      expect(generator.multiFormatProcessor).toBeDefined();
    });

    test('should emit initialization event', (done) => {
      const newGenerator = new SmartDocumentGenerator(testConfig);
      newGenerator.on('smart-document-generator-initialized', (data) => {
        expect(data.timestamp).toBeDefined();
        expect(data.version).toBe('1.0.0');
        expect(data.supportedTypes).toContain('requirements');
        done();
      });
    });
  });

  describe('Document Type Detection', () => {
    test('should detect requirements document type', async () => {
      const input = 'The system shall provide user authentication with OAuth2 integration and password policies';
      const context = await generator.contextAnalyzer.analyzeInput(input);
      const documentType = await generator.determineDocumentType(input, context);

      expect(documentType).toBe('requirements');
    });

    test('should detect user stories document type', async () => {
      const input = 'As a user, I want to login to the system so that I can access my account';
      const context = await generator.contextAnalyzer.analyzeInput(input);
      const documentType = await generator.determineDocumentType(input, context);

      expect(documentType).toBe('user-stories');
    });

    test('should detect test cases document type', async () => {
      const input = 'Verify that user login functionality works correctly with valid credentials';
      const context = await generator.contextAnalyzer.analyzeInput(input);
      const documentType = await generator.determineDocumentType(input, context);

      expect(documentType).toBe('test-cases');
    });

    test('should detect architecture document type', async () => {
      const input = 'System architecture with microservices, API gateway, and database components';
      const context = await generator.contextAnalyzer.analyzeInput(input);
      const documentType = await generator.determineDocumentType(input, context);

      expect(documentType).toBe('architecture');
    });
  });

  describe('Document Generation', () => {
    const testInputs = {
      requirements: 'Create a comprehensive requirements document for a user authentication system with OAuth2 integration, password policies, multi-factor authentication, and session management',
      userStories: 'Generate user stories for an e-commerce shopping cart system with product management, order processing, and payment integration',
      testCases: 'Create test cases for a login system that includes positive tests, negative tests, security tests, and performance tests',
      architecture: 'Design system architecture for a scalable web application with microservices, load balancer, database cluster, and caching layer'
    };

    test('should generate requirements document successfully', async () => {
      const result = await generator.generateDocument(testInputs.requirements, {
        type: 'requirements',
        formats: ['markdown']
      });

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result.document).toBeDefined();
      expect(result.result.metadata.type).toBe('requirements');
      expect(result.result.metadata.generationTime).toBeGreaterThan(0);
      expect(result.result.insights.expandedSections).toBeGreaterThan(0);
    });

    test('should generate user stories document successfully', async () => {
      const result = await generator.generateDocument(testInputs.userStories, {
        type: 'user-stories',
        formats: ['markdown']
      });

      expect(result.success).toBe(true);
      expect(result.result.document.sections).toBeDefined();
      expect(result.result.document.sections.length).toBeGreaterThan(0);
      expect(result.result.metadata.quality.overallScore).toBeGreaterThan(60);
    });

    test('should generate test cases document successfully', async () => {
      const result = await generator.generateDocument(testInputs.testCases, {
        type: 'test-cases',
        formats: ['markdown']
      });

      expect(result.success).toBe(true);
      expect(result.result.document).toBeDefined();
      expect(result.result.metadata.type).toBe('test-cases');
      expect(result.result.insights.expandedSections).toBeGreaterThan(0);
    });

    test('should generate architecture document successfully', async () => {
      const result = await generator.generateDocument(testInputs.architecture, {
        type: 'architecture',
        formats: ['markdown']
      });

      expect(result.success).toBe(true);
      expect(result.result.document).toBeDefined();
      expect(result.result.metadata.type).toBe('architecture');
    });

    test('should handle invalid input gracefully', async () => {
      const result = await generator.generateDocument('', {
        type: 'requirements'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle unsupported document type', async () => {
      const result = await generator.generateDocument(testInputs.requirements, {
        type: 'unsupported-type'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported document type');
    });
  });

  describe('Multi-Format Generation', () => {
    const testInput = 'Create a simple requirements document for user authentication';

    test('should generate multiple formats successfully', async () => {
      const result = await generator.generateDocument(testInput, {
        type: 'requirements',
        formats: ['markdown', 'html', 'json']
      });

      expect(result.success).toBe(true);
      expect(result.result.multiFormat).toBeDefined();
      expect(Object.keys(result.result.multiFormat)).toContain('markdown');
      expect(Object.keys(result.result.multiFormat)).toContain('html');
      expect(Object.keys(result.result.multiFormat)).toContain('json');
    });

    test('should validate format-specific content', async () => {
      const result = await generator.generateDocument(testInput, {
        type: 'requirements',
        formats: ['markdown', 'html', 'json']
      });

      expect(result.success).toBe(true);

      // Validate markdown format
      const markdownResult = result.result.multiFormat.markdown;
      expect(markdownResult.content).toContain('#');
      expect(markdownResult.metadata.validation.valid).toBe(true);

      // Validate HTML format
      const htmlResult = result.result.multiFormat.html;
      expect(htmlResult.content).toContain('<html>');
      expect(htmlResult.content).toContain('</html>');

      // Validate JSON format
      const jsonResult = result.result.multiFormat.json;
      expect(() => JSON.parse(jsonResult.content)).not.toThrow();
    });
  });

  describe('Document Variations', () => {
    const testInput = 'Create documentation for a REST API with authentication';

    test('should generate multiple variations', async () => {
      const result = await generator.generateVariations(testInput, {
        variations: 3,
        type: 'api-documentation'
      });

      expect(result.success).toBe(true);
      expect(result.variations).toBeDefined();
      expect(result.variations.length).toBe(3);
      expect(result.count).toBe(3);

      // Each variation should be different
      const contents = result.variations.map(v => v.document.content);
      expect(new Set(contents).size).toBe(3); // All unique
    });

    test('should generate variations with different styles', async () => {
      const result = await generator.generateVariations(testInput, {
        variations: 2,
        type: 'requirements',
        style: 'diverse'
      });

      expect(result.success).toBe(true);
      expect(result.variations.length).toBe(2);
      expect(result.variations[0].style).toBeDefined();
      expect(result.variations[1].style).toBeDefined();
      expect(result.variations[0].style).not.toBe(result.variations[1].style);
    });
  });

  describe('Quick Generation', () => {
    test('should perform quick generation', async () => {
      const result = await generator.quickGenerate(
        'Simple user login requirements',
        'requirements'
      );

      expect(result.success).toBe(true);
      expect(result.document).toBeDefined();
      expect(result.metadata.type).toBe('requirements');
      expect(result.metadata.generationTime).toBeLessThan(5000); // Should be fast
    });

    test('should have lower quality threshold for quick generation', async () => {
      const result = await generator.quickGenerate(
        'Basic test plan',
        'test-cases'
      );

      expect(result.success).toBe(true);
      expect(result.metadata.qualityScore).toBeGreaterThanOrEqual(60); // Lower threshold
    });
  });

  describe('Document Enhancement', () => {
    const basicDocument = {
      title: 'Basic Requirements',
      content: 'The system should allow users to login.',
      sections: [
        {
          id: 'overview',
          title: 'Overview',
          content: 'This is a basic overview.'
        }
      ]
    };

    test('should enhance existing document', async () => {
      const result = await generator.enhanceDocument(basicDocument, 'comprehensive');

      expect(result.success).toBe(true);
      expect(result.enhancedDocument).toBeDefined();
      expect(result.enhancements).toBeDefined();
      expect(result.enhancements.length).toBeGreaterThan(0);
      expect(result.qualityImprovement).toBeDefined();
    });

    test('should improve document quality', async () => {
      const result = await generator.enhanceDocument(basicDocument, 'comprehensive');

      expect(result.success).toBe(true);
      expect(result.qualityImprovement.enhancedScore).toBeGreaterThanOrEqual(
        result.qualityImprovement.originalScore
      );
    });
  });

  describe('Caching', () => {
    const testInput = 'Cached document generation test';

    test('should cache successful generations', async () => {
      const options = { type: 'requirements', formats: ['markdown'] };

      // First generation
      const result1 = await generator.generateDocument(testInput, options);
      expect(result1.success).toBe(true);

      // Check if cached
      const cached = generator.checkCache(testInput, options);
      expect(cached).toBeDefined();
    });

    test('should use cache for duplicate requests', async () => {
      const options = { type: 'requirements', formats: ['markdown'] };

      // First generation
      const startTime1 = Date.now();
      await generator.generateDocument(testInput, options);
      const time1 = Date.now() - startTime1;

      // Second generation (should use cache)
      const startTime2 = Date.now();
      const result2 = await generator.generateDocument(testInput, options);
      const time2 = Date.now() - startTime2;

      expect(result2.success).toBe(true);
      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.5);
    });
  });

  describe('Error Handling', () => {
    test('should handle content expansion errors', async () => {
      // Mock content expander to throw error
      const originalExpand = generator.contentExpander.expandContent;
      generator.contentExpander.expandContent = jest.fn().mockRejectedValue(
        new Error('Expansion failed')
      );

      const result = await generator.generateDocument('test input', {
        type: 'requirements'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expansion failed');

      // Restore original method
      generator.contentExpander.expandContent = originalExpand;
    });

    test('should handle template engine errors', async () => {
      // Mock template engine to throw error
      const originalApply = generator.templateEngine.applyTemplates;
      generator.templateEngine.applyTemplates = jest.fn().mockRejectedValue(
        new Error('Template error')
      );

      const result = await generator.generateDocument('test input', {
        type: 'requirements'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template error');

      // Restore original method
      generator.templateEngine.applyTemplates = originalApply;
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should track generation metrics', async () => {
      const initialMetrics = generator.getMetrics();
      const initialCount = initialMetrics.totalGenerations;

      await generator.generateDocument('Test metrics', {
        type: 'requirements',
        formats: ['markdown']
      });

      const updatedMetrics = generator.getMetrics();
      expect(updatedMetrics.totalGenerations).toBe(initialCount + 1);
      expect(updatedMetrics.successfulGenerations).toBeGreaterThan(initialMetrics.successfulGenerations);
    });

    test('should track success rate', async () => {
      const initialMetrics = generator.getMetrics();

      // Generate successful document
      await generator.generateDocument('Success test', {
        type: 'requirements'
      });

      const updatedMetrics = generator.getMetrics();
      expect(updatedMetrics.successRate).toBeGreaterThanOrEqual(initialMetrics.successRate);
    });

    test('should track average generation time', async () => {
      const initialMetrics = generator.getMetrics();

      await generator.generateDocument('Time test', {
        type: 'requirements'
      });

      const updatedMetrics = generator.getMetrics();
      expect(updatedMetrics.averageGenerationTime).toBeGreaterThan(0);
    });
  });

  describe('Health Check', () => {
    test('should perform health check', async () => {
      const health = await generator.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.service).toBe('smart-document-generator');
      expect(health.version).toBe('1.0.0');
      expect(health.components).toBeDefined();
      expect(health.metrics).toBeDefined();
      expect(health.timestamp).toBeDefined();
    });

    test('should detect unhealthy components', async () => {
      // Mock a component to be unhealthy
      const originalHealthCheck = generator.templateEngine.healthCheck;
      generator.templateEngine.healthCheck = () => ({
        healthy: false,
        service: 'template-engine',
        error: 'Service unavailable'
      });

      const health = await generator.healthCheck();

      expect(health.healthy).toBe(false);
      expect(health.components.templateEngine.healthy).toBe(false);

      // Restore original method
      generator.templateEngine.healthCheck = originalHealthCheck;
    });
  });

  describe('Integration with AI Services', () => {
    test('should integrate with Writing Assistant', async () => {
      const result = await generator.generateDocument(
        'Poor quality text that needs improvement',
        {
          type: 'requirements',
          enableWritingAssistant: true
        }
      );

      expect(result.success).toBe(true);
      expect(result.result.metadata.quality.overallScore).toBeGreaterThan(70);
    });

    test('should work without Writing Assistant', async () => {
      const result = await generator.generateDocument(
        'Simple requirements text',
        {
          type: 'requirements',
          enableWritingAssistant: false
        }
      );

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should generate document within reasonable time', async () => {
      const startTime = Date.now();

      const result = await generator.generateDocument(
        'Performance test document with moderate complexity',
        {
          type: 'requirements',
          formats: ['markdown']
        }
      );

      const generationTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(generationTime).toBeLessThan(30000); // 30 seconds max
    });

    test('should handle concurrent generations', async () => {
      const promises = [];

      for (let i = 0; i < 3; i++) {
        promises.push(
          generator.generateDocument(`Concurrent test ${i}`, {
            type: 'requirements',
            formats: ['markdown']
          })
        );
      }

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });
});

describe('Document Template Engine', () => {
  let templateEngine;

  beforeEach(() => {
    templateEngine = new DocumentTemplateEngine();
  });

  describe('Template Management', () => {
    test('should load built-in templates', () => {
      const templates = templateEngine.getAvailableTemplates();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some(t => t.id === 'requirements-document')).toBe(true);
      expect(templates.some(t => t.id === 'user-stories')).toBe(true);
    });

    test('should get template by ID', () => {
      const template = templateEngine.getTemplateById('requirements-document');
      expect(template).toBeDefined();
      expect(template.name).toBe('Requirements Document');
      expect(template.structure.sections).toBeDefined();
    });

    test('should return null for non-existent template', () => {
      const template = templateEngine.getTemplateById('non-existent');
      expect(template).toBeUndefined();
    });
  });

  describe('Template Application', () => {
    const mockContent = {
      sections: [
        {
          id: 'overview',
          name: 'Overview',
          content: 'Test overview content'
        }
      ]
    };

    const mockContext = {
      title: 'Test Document',
      author: 'Test Author',
      version: '1.0'
    };

    test('should apply template successfully', async () => {
      const result = await templateEngine.applyTemplates(
        mockContent,
        'requirements-document',
        mockContext
      );

      expect(result).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.template).toBe('requirements-document');
    });

    test('should handle missing template gracefully', async () => {
      await expect(
        templateEngine.applyTemplates(mockContent, 'non-existent-template', mockContext)
      ).rejects.toThrow('Template not found');
    });
  });

  describe('Format Support', () => {
    test('should support multiple output formats', () => {
      const supportedFormats = ['markdown', 'html', 'json', 'text'];

      supportedFormats.forEach(format => {
        const processor = templateEngine.formatters.get(format);
        expect(processor).toBeDefined();
        expect(processor.name).toBeDefined();
        expect(processor.format).toBeDefined();
      });
    });
  });
});

describe('Content Expansion Engine', () => {
  let expansionEngine;

  beforeEach(() => {
    expansionEngine = new ContentExpansionEngine({
      expansionDepth: 'comprehensive'
    });
  });

  describe('Content Analysis', () => {
    test('should analyze input complexity', () => {
      const simpleInput = 'Create user login';
      const complexInput = 'Create enterprise-grade user authentication system with OAuth2, SAML, multi-factor authentication, session management, and integration with Active Directory';

      const simpleComplexity = expansionEngine.assessComplexity(simpleInput);
      const complexComplexity = expansionEngine.assessComplexity(complexInput);

      expect(simpleComplexity).toBe('low');
      expect(complexComplexity).toBe('high');
    });

    test('should identify domain from input', () => {
      const healthcareInput = 'Patient management system for hospital';
      const financeInput = 'Banking payment processing system';
      const ecommerceInput = 'Shopping cart and checkout system';

      expect(expansionEngine.identifyDomain(healthcareInput, {})).toBe('healthcare');
      expect(expansionEngine.identifyDomain(financeInput, {})).toBe('finance');
      expect(expansionEngine.identifyDomain(ecommerceInput, {})).toBe('ecommerce');
    });

    test('should extract entities from input', () => {
      const input = 'The user should be able to create, read, update, and delete customer records';
      const entities = expansionEngine.extractEntities(input);

      expect(entities.stakeholders).toContain('user');
      expect(entities.actions).toContain('create');
      expect(entities.actions).toContain('read');
      expect(entities.actions).toContain('update');
      expect(entities.actions).toContain('delete');
    });
  });

  describe('Content Expansion', () => {
    const testInput = 'User authentication system';
    const testStructure = {
      type: 'requirements',
      sections: ['overview', 'functional-requirements', 'non-functional-requirements']
    };
    const testContext = { domain: 'general', complexity: 'medium' };

    test('should expand content successfully', async () => {
      const result = await expansionEngine.expandContent(
        testInput,
        'requirements',
        testStructure,
        testContext
      );

      expect(result.success).toBe(true);
      expect(result.sections).toBeDefined();
      expect(result.sections.length).toBeGreaterThan(0);
      expect(result.metadata.expansionLevel).toBeDefined();
      expect(result.metadata.wordsGenerated).toBeGreaterThan(0);
    });

    test('should generate appropriate number of sections', async () => {
      const result = await expansionEngine.expandContent(
        testInput,
        'requirements',
        testStructure,
        testContext
      );

      expect(result.sections.length).toBeGreaterThanOrEqual(testStructure.sections.length);
    });

    test('should maintain content quality', async () => {
      const result = await expansionEngine.expandContent(
        testInput,
        'requirements',
        testStructure,
        testContext
      );

      result.sections.forEach(section => {
        expect(section.content).toBeDefined();
        expect(section.content.length).toBeGreaterThan(50); // Minimum content length
        expect(section.title || section.name).toBeDefined();
      });
    });
  });
});

describe('Multi-Format Document Processor', () => {
  let processor;

  beforeEach(() => {
    processor = new MultiFormatDocumentProcessor({
      outputFormats: ['markdown', 'html', 'json']
    });
  });

  describe('Format Processing', () => {
    const testDocument = {
      metadata: {
        title: 'Test Document',
        author: 'Test Author'
      },
      sections: [
        {
          id: 'section1',
          name: 'Section 1',
          content: 'This is test content for section 1'
        },
        {
          id: 'section2',
          name: 'Section 2',
          content: 'This is test content for section 2'
        }
      ]
    };

    test('should process single format', async () => {
      const result = await processor.processDocument(testDocument, ['markdown']);

      expect(result.success).toBe(true);
      expect(result.results.markdown).toBeDefined();
      expect(result.results.markdown.content).toContain('#');
      expect(result.results.markdown.metadata.format).toBe('markdown');
    });

    test('should process multiple formats', async () => {
      const result = await processor.processDocument(
        testDocument,
        ['markdown', 'html', 'json']
      );

      expect(result.success).toBe(true);
      expect(Object.keys(result.results)).toHaveLength(3);
      expect(result.results.markdown).toBeDefined();
      expect(result.results.html).toBeDefined();
      expect(result.results.json).toBeDefined();
    });

    test('should validate generated formats', async () => {
      const result = await processor.processDocument(
        testDocument,
        ['markdown', 'html', 'json']
      );

      expect(result.success).toBe(true);

      // Validate markdown
      expect(result.results.markdown.metadata.validation.valid).toBe(true);

      // Validate HTML
      expect(result.results.html.content).toContain('<html');
      expect(result.results.html.content).toContain('</html>');
      expect(result.results.html.metadata.validation.valid).toBe(true);

      // Validate JSON
      expect(() => JSON.parse(result.results.json.content)).not.toThrow();
      expect(result.results.json.metadata.validation.valid).toBe(true);
    });
  });

  describe('Batch Processing', () => {
    const testDocuments = [
      {
        metadata: { title: 'Document 1' },
        sections: [{ id: 'section1', name: 'Section 1', content: 'Content 1' }]
      },
      {
        metadata: { title: 'Document 2' },
        sections: [{ id: 'section1', name: 'Section 1', content: 'Content 2' }]
      }
    ];

    test('should process multiple documents', async () => {
      const result = await processor.batchProcess(testDocuments, ['markdown']);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.metadata.totalDocuments).toBe(2);
      expect(result.metadata.successfulDocuments).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid document gracefully', async () => {
      const result = await processor.processDocument(null, ['markdown']);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle unsupported format gracefully', async () => {
      const testDocument = {
        metadata: { title: 'Test' },
        sections: []
      };

      const result = await processor.processDocument(
        testDocument,
        ['unsupported-format']
      );

      expect(result.success).toBe(true);
      expect(result.results['unsupported-format'].error).toBeDefined();
    });
  });
});

// Performance and Load Tests
describe('Performance Tests', () => {
  let generator;

  beforeAll(() => {
    generator = new SmartDocumentGenerator({
      expansionDepth: 'standard' // Use standard for performance tests
    });
  });

  test('should handle large input efficiently', async () => {
    const largeInput = 'Create comprehensive documentation for enterprise system. '.repeat(100);
    const startTime = Date.now();

    const result = await generator.generateDocument(largeInput, {
      type: 'requirements',
      formats: ['markdown']
    });

    const processingTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(processingTime).toBeLessThan(60000); // 60 seconds max
  });

  test('should handle multiple concurrent requests', async () => {
    const requests = Array.from({ length: 5 }, (_, i) =>
      generator.generateDocument(`Concurrent request ${i}`, {
        type: 'requirements',
        formats: ['markdown']
      })
    );

    const results = await Promise.all(requests);

    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});

// Integration Tests
describe('Integration Tests', () => {
  let generator;

  beforeAll(() => {
    generator = new SmartDocumentGenerator({
      marketInsights: false, // Disable for testing
      templateCaching: true
    });
  });

  test('should integrate all components successfully', async () => {
    const input = 'Create a comprehensive user management system with authentication, authorization, user profiles, and admin panel';

    const result = await generator.generateDocument(input, {
      type: 'requirements',
      formats: ['markdown', 'html'],
      includeTableOfContents: true,
      enableWritingAssistant: true
    });

    expect(result.success).toBe(true);
    expect(result.result.document).toBeDefined();
    expect(result.result.multiFormat).toBeDefined();
    expect(result.result.metadata.quality.overallScore).toBeGreaterThan(70);
    expect(result.result.insights.expandedSections).toBeGreaterThan(0);
  });

  test('should maintain data consistency across components', async () => {
    const input = 'API documentation for REST service';

    const result = await generator.generateDocument(input, {
      type: 'api-documentation',
      formats: ['json']
    });

    expect(result.success).toBe(true);

    // Verify data consistency
    const jsonResult = result.result.multiFormat.json;
    const parsedJson = JSON.parse(jsonResult.content);

    expect(parsedJson.metadata.title).toBeDefined();
    expect(parsedJson.content.sections).toBeDefined();
    expect(parsedJson.statistics.sectionCount).toBe(parsedJson.content.sections.length);
  });
});

module.exports = {
  SmartDocumentGenerator,
  DocumentTemplateEngine,
  ContentExpansionEngine,
  MultiFormatDocumentProcessor
};