/**
 * Comprehensive Tests for AI Writing Assistant Features
 */

const WritingAssistant = require('../ai-services/WritingAssistant');
const SmartAutocomplete = require('../ai-services/SmartAutocomplete');
const QualityAnalysisEngine = require('../ai-services/QualityAnalysisEngine');
const TemplateRecommendationEngine = require('../ai-services/TemplateRecommendationEngine');
const RequirementsNLPEngine = require('../precision-engine/RequirementsNLPEngine');

describe('AI Writing Assistant System', () => {
  let writingAssistant;
  let smartAutocomplete;
  let qualityAnalysis;
  let templateEngine;
  let nlpEngine;

  beforeAll(() => {
    // Initialize all components
    writingAssistant = new WritingAssistant();
    smartAutocomplete = new SmartAutocomplete();
    qualityAnalysis = new QualityAnalysisEngine();
    templateEngine = new TemplateRecommendationEngine();
    nlpEngine = new RequirementsNLPEngine();
  });

  describe('WritingAssistant Core', () => {
    test('should initialize with default configuration', () => {
      expect(writingAssistant.version).toBe('1.0.0');
      expect(writingAssistant.name).toBe('AI Writing Assistant');
      expect(writingAssistant.config.responseTimeout).toBe(200);
    });

    test('should convert natural language to structured requirements', async () => {
      const input = 'Users need to be able to save their work and come back to it later';
      const result = await writingAssistant.convertNaturalLanguage(input);

      expect(result.success).toBe(true);
      expect(result.result.structuredRequirement).toBeDefined();
      expect(result.result.structuredRequirement.text).toContain('shall');
      expect(result.result.confidence).toBeGreaterThan(0.5);
    });

    test('should handle empty input gracefully', async () => {
      const result = await writingAssistant.convertNaturalLanguage('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should provide quality analysis', async () => {
      const text = 'The user shall be able to create documents when authenticated.';
      const result = await writingAssistant.analyzeWritingQuality(text);

      expect(result.success).toBe(true);
      expect(result.result.overallScore).toBeGreaterThan(0);
      expect(result.result.nlpAnalysis).toBeDefined();
      expect(result.result.writingAnalysis).toBeDefined();
    });

    test('should recommend templates based on context', async () => {
      const context = {
        documentType: 'functional',
        projectDomain: 'web-application'
      };
      const result = await writingAssistant.recommendTemplates(context);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    test('should handle real-time assistance', async () => {
      const text = 'The user shall';
      const cursorPosition = 13;
      const context = { documentType: 'functional' };

      const result = await writingAssistant.processRealTimeAssistance(text, cursorPosition, context);

      expect(result.success).toBe(true);
      expect(result.autocomplete).toBeDefined();
      expect(result.quickQuality).toBeDefined();
    });

    test('should get meaningful metrics', () => {
      const metrics = writingAssistant.getMetrics();

      expect(metrics.templatesAvailable).toBeGreaterThan(0);
      expect(metrics.contextPatternsLoaded).toBeGreaterThan(0);
      expect(metrics.version).toBe('1.0.0');
    });

    test('should pass health check', async () => {
      const health = await writingAssistant.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.service).toBe('writing-assistant');
      expect(health.version).toBe('1.0.0');
    });
  });

  describe('SmartAutocomplete', () => {
    test('should provide autocomplete suggestions', async () => {
      const text = 'The user shall be able to';
      const cursorPosition = 25;
      const context = { documentType: 'functional' };

      const result = await smartAutocomplete.getSuggestions(text, cursorPosition, context);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    test('should provide context-aware suggestions', async () => {
      const text = 'When the user clicks submit';
      const cursorPosition = 26;
      const context = { documentType: 'acceptance-criteria' };

      const result = await smartAutocomplete.getSuggestions(text, cursorPosition, context);

      expect(result.success).toBe(true);
      // Should suggest continuation for acceptance criteria
      const suggestions = result.suggestions.map(s => s.text);
      expect(suggestions.some(s => s.includes('then') || s.includes(', then'))).toBe(true);
    });

    test('should handle short text input', async () => {
      const text = 'Th';
      const cursorPosition = 2;

      const result = await smartAutocomplete.getSuggestions(text, cursorPosition);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    test('should respect max suggestions limit', async () => {
      const text = 'The system shall validate user input and process requests';
      const cursorPosition = 55;

      const result = await smartAutocomplete.getSuggestions(text, cursorPosition);

      expect(result.success).toBe(true);
      expect(result.suggestions.length).toBeLessThanOrEqual(smartAutocomplete.config.maxSuggestions);
    });

    test('should record suggestion feedback', () => {
      const suggestion = {
        text: 'be able to create',
        type: 'pattern',
        confidence: 0.8
      };
      const context = { userId: 'test-user' };

      // Should not throw
      expect(() => {
        smartAutocomplete.recordSuggestionAcceptance(suggestion, context);
      }).not.toThrow();

      expect(() => {
        smartAutocomplete.recordSuggestionRejection(suggestion, context);
      }).not.toThrow();
    });

    test('should pass health check', async () => {
      const health = await smartAutocomplete.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.service).toBe('smart-autocomplete');
      expect(health.testResult).toBe('passed');
    });
  });

  describe('QualityAnalysisEngine', () => {
    test('should analyze text quality comprehensively', async () => {
      const text = 'The user shall be able to create new documents when authenticated and authorized.';
      const result = await qualityAnalysis.analyzeQuality(text);

      expect(result.success).toBe(true);
      expect(result.analysis.overallScore).toBeGreaterThan(0);
      expect(result.analysis.issues).toBeDefined();
      expect(result.analysis.suggestions).toBeDefined();
      expect(result.analysis.recommendations).toBeDefined();
    });

    test('should detect vague language', async () => {
      const text = 'The system should be user-friendly and fast.';
      const result = await qualityAnalysis.analyzeQuality(text);

      expect(result.success).toBe(true);
      expect(result.analysis.issues.some(issue =>
        issue.type === 'vague_phrase' || issue.message.includes('vague')
      )).toBe(true);
    });

    test('should detect missing stakeholders', async () => {
      const text = 'Shall create documents quickly.';
      const result = await qualityAnalysis.analyzeQuality(text);

      expect(result.success).toBe(true);
      expect(result.analysis.issues.some(issue =>
        issue.type === 'missingStakeholder' || issue.message.includes('stakeholder')
      )).toBe(true);
    });

    test('should generate auto-fixes for fixable issues', async () => {
      const text = 'The user can create documents user-friendly.';
      const result = await qualityAnalysis.analyzeQuality(text, { autoFixEnabled: true });

      expect(result.success).toBe(true);
      if (result.analysis.autoFixedText) {
        expect(result.analysis.autoFixedText).toContain('shall');
        expect(result.analysis.autoFixedText).not.toContain('user-friendly');
      }
    });

    test('should provide style guide compliance analysis', async () => {
      const text = 'The user shall be able to create documents.';
      const result = await qualityAnalysis.analyzeQuality(text, { styleGuide: 'ieee830' });

      expect(result.success).toBe(true);
      expect(result.analysis.overallScore).toBeGreaterThan(70); // Should score well for IEEE 830
    });

    test('should handle different analysis depths', async () => {
      const text = 'The system shall process requests within 2 seconds.';

      const basicResult = await qualityAnalysis.analyzeQuality(text, { analysisDepth: 'basic' });
      const comprehensiveResult = await qualityAnalysis.analyzeQuality(text, { analysisDepth: 'comprehensive' });

      expect(basicResult.success).toBe(true);
      expect(comprehensiveResult.success).toBe(true);
      expect(comprehensiveResult.analysis.issues.length).toBeGreaterThanOrEqual(basicResult.analysis.issues.length);
    });

    test('should pass health check', async () => {
      const health = await qualityAnalysis.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.service).toBe('quality-analysis-engine');
      expect(health.testResult).toBe('passed');
    });
  });

  describe('TemplateRecommendationEngine', () => {
    test('should recommend relevant templates', async () => {
      const context = {
        documentType: 'functional',
        projectDomain: 'web-application',
        userRole: 'analyst'
      };

      const result = await templateEngine.getRecommendations(context);

      expect(result.success).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].template).toBeDefined();
      expect(result.recommendations[0].relevanceScore).toBeGreaterThan(0);
    });

    test('should filter templates by relevance threshold', async () => {
      const context = {
        documentType: 'non-existent-type',
        projectDomain: 'unknown-domain'
      };

      const result = await templateEngine.getRecommendations(context);

      expect(result.success).toBe(true);
      // Should have fewer or no recommendations for irrelevant context
      result.recommendations.forEach(rec => {
        expect(rec.relevanceScore).toBeGreaterThanOrEqual(templateEngine.config.relevanceThreshold);
      });
    });

    test('should provide customization suggestions', async () => {
      const context = {
        documentType: 'functional',
        projectDomain: 'e-commerce',
        contentKeywords: ['user', 'cart', 'payment']
      };
      const partialText = 'shopping cart functionality';

      const result = await templateEngine.getRecommendations(context, partialText);

      expect(result.success).toBe(true);
      const recommendations = result.recommendations;
      expect(recommendations.some(rec => rec.customization && rec.customization.length > 0)).toBe(true);
    });

    test('should record template usage', () => {
      const templateId = 'functional-basic';
      const context = { userId: 'test-user' };

      expect(() => {
        templateEngine.recordTemplateUsage(templateId, context);
      }).not.toThrow();

      // Check that usage was recorded
      const template = templateEngine.getTemplate(templateId);
      expect(template.usageCount).toBeGreaterThan(0);
    });

    test('should support template search', () => {
      const results = templateEngine.searchTemplates('functional requirement', {
        category: 'functional'
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].template.category).toBe('functional');
    });

    test('should support custom templates', () => {
      const customTemplate = {
        name: 'Test Custom Template',
        template: 'The {actor} shall {action} {object}.',
        category: 'custom',
        description: 'A test template',
        keywords: ['test', 'custom'],
        domains: ['testing']
      };

      const templateId = templateEngine.addCustomTemplate(customTemplate, 'test-user');

      expect(templateId).toBeDefined();
      expect(templateId.startsWith('custom-')).toBe(true);

      const retrievedTemplate = templateEngine.getTemplate(templateId);
      expect(retrievedTemplate.name).toBe(customTemplate.name);
      expect(retrievedTemplate.createdBy).toBe('test-user');
    });

    test('should pass health check', async () => {
      const health = await templateEngine.healthCheck();

      expect(health.healthy).toBe(true);
      expect(health.service).toBe('template-recommendation-engine');
      expect(health.testResult).toBe('passed');
    });
  });

  describe('RequirementsNLPEngine', () => {
    test('should analyze requirement quality', async () => {
      const text = 'The user shall be able to create documents when authenticated.';
      const result = await nlpEngine.analyzeRequirement(text);

      expect(result.text).toBe(text);
      expect(result.metrics).toBeDefined();
      expect(result.metrics.qualityScore).toBeGreaterThan(0);
      expect(result.quality).toBeDefined();
      expect(result.semantic).toBeDefined();
    });

    test('should detect functional requirements', async () => {
      const text = 'The system shall validate user input before processing.';
      const result = await nlpEngine.analyzeRequirement(text);

      expect(result.semantic.structure.functional.length).toBeGreaterThan(0);
    });

    test('should extract terminology', () => {
      const text = 'The user interface shall authenticate users via API.';
      const terms = nlpEngine.extractTerminology(text);

      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
    });

    test('should convert natural language to structured requirements', async () => {
      const input = 'Users should be able to save their work automatically';
      const result = await nlpEngine.convertToRequirement(input);

      expect(result.success).toBe(true);
      expect(result.result.structured.text).toContain('shall');
      expect(result.result.classification).toBeDefined();
      expect(result.result.entities).toBeDefined();
    });

    test('should analyze requirement quality with IEEE 830 compliance', async () => {
      const text = 'The user shall be able to create documents within 2 seconds.';
      const result = await nlpEngine.analyzeRequirementQuality(text);

      expect(result.overallRequirementsScore).toBeGreaterThan(0);
      expect(result.ieee830Compliance).toBeDefined();
      expect(result.smartCompliance).toBeDefined();
    });

    test('should detect different requirement types', async () => {
      const functionalReq = 'The user shall be able to login.';
      const nonfunctionalReq = 'The system shall respond within 1 second.';
      const constraintReq = 'The system shall not store passwords in plain text.';

      const functional = await nlpEngine.analyzeRequirement(functionalReq);
      const nonfunctional = await nlpEngine.analyzeRequirement(nonfunctionalReq);
      const constraint = await nlpEngine.analyzeRequirement(constraintReq);

      expect(functional.semantic.structure.functional.length).toBeGreaterThan(0);
      expect(nonfunctional.semantic.structure.nonfunctional.length).toBeGreaterThan(0);
      expect(constraint.semantic.structure.constraints.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should integrate NLP engine with writing assistant', async () => {
      const input = 'Users need to upload files quickly';
      const result = await writingAssistant.convertNaturalLanguage(input);

      expect(result.success).toBe(true);
      expect(result.result.structuredRequirement.text).toBeDefined();
      expect(result.result.validation).toBeDefined();
    });

    test('should integrate autocomplete with quality analysis', async () => {
      const text = 'The user shall be able to';
      const suggestions = await smartAutocomplete.getSuggestions(text, text.length);

      expect(suggestions.success).toBe(true);

      if (suggestions.suggestions.length > 0) {
        const fullText = text + ' ' + suggestions.suggestions[0].text;
        const quality = await qualityAnalysis.analyzeQuality(fullText);

        expect(quality.success).toBe(true);
        expect(quality.analysis.overallScore).toBeGreaterThan(0);
      }
    });

    test('should integrate template recommendations with quality analysis', async () => {
      const context = { documentType: 'functional' };
      const templates = await templateEngine.getRecommendations(context);

      expect(templates.success).toBe(true);

      if (templates.recommendations.length > 0) {
        const templateText = templates.recommendations[0].template.template;
        const quality = await qualityAnalysis.analyzeQuality(templateText);

        expect(quality.success).toBe(true);
      }
    });

    test('should handle concurrent requests without conflicts', async () => {
      const promises = [
        smartAutocomplete.getSuggestions('The user shall', 13),
        qualityAnalysis.analyzeQuality('The system shall validate input.'),
        templateEngine.getRecommendations({ documentType: 'functional' }),
        nlpEngine.analyzeRequirement('The user shall be able to login.')
      ];

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });

    test('should maintain performance under load', async () => {
      const startTime = Date.now();

      const promises = Array(10).fill().map(() =>
        qualityAnalysis.analyzeQuality('The user shall be able to create documents when authenticated.')
      );

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed input gracefully', async () => {
      const malformedInputs = [
        null,
        undefined,
        '',
        '   ',
        {},
        []
      ];

      for (const input of malformedInputs) {
        const result = await writingAssistant.convertNaturalLanguage(input);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }
    });

    test('should handle invalid cursor positions', async () => {
      const text = 'The user shall';
      const invalidPositions = [-1, 1000, null, undefined, 'invalid'];

      for (const position of invalidPositions) {
        const result = await smartAutocomplete.getSuggestions(text, position);
        // Should either succeed with empty suggestions or fail gracefully
        expect(typeof result.success).toBe('boolean');
      }
    });

    test('should handle empty context gracefully', async () => {
      const result = await templateEngine.getRecommendations({});

      expect(result.success).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should handle analysis of very long text', async () => {
      const longText = 'The user shall be able to create documents. '.repeat(1000);
      const result = await qualityAnalysis.analyzeQuality(longText);

      expect(result.success).toBe(true);
      expect(result.analysis.overallScore).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('should respond to autocomplete requests quickly', async () => {
      const startTime = Date.now();

      await smartAutocomplete.getSuggestions('The user shall be able to', 25);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(smartAutocomplete.config.responseTimeout);
    });

    test('should maintain quality analysis accuracy with speed', async () => {
      const texts = [
        'The user shall be able to create documents.',
        'The system shall respond within 2 seconds.',
        'The application must validate all user input.',
        'Users need to save their work automatically.',
        'The interface should be user-friendly and fast.'
      ];

      const startTime = Date.now();
      const results = await Promise.all(
        texts.map(text => qualityAnalysis.analyzeQuality(text))
      );
      const totalTime = Date.now() - startTime;

      expect(results.every(r => r.success)).toBe(true);
      expect(totalTime / texts.length).toBeLessThan(1000); // Average under 1 second per analysis
    });
  });

  afterAll(() => {
    // Cleanup if needed
    if (typeof writingAssistant.cleanup === 'function') {
      writingAssistant.cleanup();
    }
  });
});