/**
 * API Endpoint Tests for Writing Assistant
 */

const request = require('supertest');
const express = require('express');
const writingAssistantRoutes = require('../api/writing-assistant-endpoints');

describe('Writing Assistant API Endpoints', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/writing-assistant', writingAssistantRoutes);

    // Mock user middleware for testing
    app.use((req, res, next) => {
      req.user = { id: 'test-user' };
      req.sessionID = 'test-session';
      next();
    });
  });

  describe('POST /real-time', () => {
    test('should provide real-time assistance', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/real-time')
        .send({
          text: 'The user shall be able to',
          cursorPosition: 25,
          context: { documentType: 'functional' },
          settings: { enableRealTime: true }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
    });

    test('should handle empty text gracefully', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/real-time')
        .send({
          text: '',
          cursorPosition: 0,
          context: {},
          settings: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result.suggestions).toEqual([]);
    });

    test('should handle missing parameters', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/real-time')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /autocomplete', () => {
    test('should provide autocomplete suggestions', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/autocomplete')
        .send({
          text: 'The user shall be able to',
          cursorPosition: 25,
          context: { documentType: 'functional' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.suggestions)).toBe(true);
    });

    test('should require text and cursor position', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/autocomplete')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should handle invalid cursor position', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/autocomplete')
        .send({
          text: 'The user shall',
          cursorPosition: -1,
          context: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /quality-analysis', () => {
    test('should analyze text quality', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/quality-analysis')
        .send({
          text: 'The user shall be able to create documents when authenticated.',
          options: { category: 'functional' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.overallScore).toBeGreaterThan(0);
    });

    test('should require text for analysis', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/quality-analysis')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should reject empty text', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/quality-analysis')
        .send({ text: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /template-recommendations', () => {
    test('should recommend templates', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/template-recommendations')
        .send({
          context: {
            documentType: 'functional',
            projectDomain: 'web-application'
          },
          partialText: 'user authentication'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    test('should work with empty context', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/template-recommendations')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /nlp-converter', () => {
    test('should convert natural language', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/nlp-converter')
        .send({
          input: 'Users need to be able to save their work',
          options: { targetType: 'functional' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.result).toBeDefined();
    });

    test('should require input text', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/nlp-converter')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should reject empty input', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/nlp-converter')
        .send({ input: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /feedback', () => {
    test('should record suggestion acceptance', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/feedback')
        .send({
          suggestion: {
            text: 'be able to create',
            type: 'autocomplete',
            confidence: 0.8
          },
          action: 'accept',
          context: { documentType: 'functional' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('recorded');
    });

    test('should record suggestion rejection', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/feedback')
        .send({
          suggestion: {
            text: 'invalid suggestion',
            type: 'autocomplete'
          },
          action: 'reject',
          context: {}
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    test('should require suggestion and action', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/feedback')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /metrics', () => {
    test('should return system metrics', async () => {
      const response = await request(app)
        .get('/api/writing-assistant/metrics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.metrics).toBeDefined();
      expect(response.body.metrics.writingAssistant).toBeDefined();
      expect(response.body.metrics.autocomplete).toBeDefined();
      expect(response.body.metrics.qualityAnalysis).toBeDefined();
      expect(response.body.metrics.templateEngine).toBeDefined();
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/writing-assistant/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.healthy).toBe(true);
      expect(response.body.services).toBeDefined();
      expect(response.body.services.writingAssistant).toBeDefined();
      expect(response.body.services.smartAutocomplete).toBeDefined();
      expect(response.body.services.qualityAnalysis).toBeDefined();
      expect(response.body.services.templateEngine).toBeDefined();
    });
  });

  describe('POST /templates/custom', () => {
    test('should create custom template', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/templates/custom')
        .send({
          templateData: {
            name: 'Test Custom Template',
            template: 'The {actor} shall {action} {object}.',
            description: 'A test template',
            category: 'custom',
            keywords: ['test', 'custom']
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.templateId).toBeDefined();
      expect(response.body.templateId.startsWith('custom-')).toBe(true);
    });

    test('should require template name and text', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/templates/custom')
        .send({
          templateData: {
            description: 'Incomplete template'
          }
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('GET /templates/search', () => {
    test('should search templates', async () => {
      const response = await request(app)
        .get('/api/writing-assistant/templates/search')
        .query({
          query: 'functional',
          category: 'functional'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('should require search query', async () => {
      const response = await request(app)
        .get('/api/writing-assistant/templates/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });
  });

  describe('POST /templates/:templateId/rate', () => {
    test('should rate a template', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/templates/functional-basic/rate')
        .send({ rating: 5 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('rated');
    });

    test('should validate rating range', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/templates/functional-basic/rate')
        .send({ rating: 10 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('between 1 and 5');
    });

    test('should handle non-existent template', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/templates/non-existent/rate')
        .send({ rating: 3 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /bulk-analysis', () => {
    test('should analyze multiple texts', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/bulk-analysis')
        .send({
          texts: [
            'The user shall be able to create documents.',
            'The system shall respond within 2 seconds.',
            'Users need to save their work.'
          ],
          options: { category: 'functional' }
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.results.length).toBe(3);
      expect(response.body.totalTexts).toBe(3);
    });

    test('should limit bulk analysis size', async () => {
      const texts = Array(100).fill('The user shall create documents.');

      const response = await request(app)
        .post('/api/writing-assistant/bulk-analysis')
        .send({ texts });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Maximum 50');
    });

    test('should require array of texts', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/bulk-analysis')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/autocomplete')
        .send('invalid json')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    test('should handle missing Content-Type', async () => {
      const response = await request(app)
        .post('/api/writing-assistant/autocomplete')
        .send('text=test');

      expect(response.status).toBe(400);
    });

    test('should handle very large payloads gracefully', async () => {
      const largeText = 'a'.repeat(100000);

      const response = await request(app)
        .post('/api/writing-assistant/quality-analysis')
        .send({ text: largeText });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting and Security', () => {
    test('should handle concurrent requests', async () => {
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/api/writing-assistant/autocomplete')
          .send({
            text: 'The user shall be able to',
            cursorPosition: 25
          })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    test('should sanitize input data', async () => {
      const maliciousInput = '<script>alert("xss")</script>';

      const response = await request(app)
        .post('/api/writing-assistant/quality-analysis')
        .send({ text: maliciousInput });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Analysis should work but not execute the script
    });
  });

  describe('Performance Tests', () => {
    test('should respond to health checks quickly', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/writing-assistant/health');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle autocomplete requests efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/writing-assistant/autocomplete')
        .send({
          text: 'The user shall be able to create documents',
          cursorPosition: 42
        });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
    });
  });
});