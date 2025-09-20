/**
 * AI Document Generator Service
 * Smart document creation with context awareness and template-based generation
 */

const EventEmitter = require('events');

class DocumentGenerator extends EventEmitter {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    this.name = 'AI Document Generator';

    this.config = {
      maxContentLength: config.maxContentLength || 50000,
      minContentLength: config.minContentLength || 100,
      defaultOutputFormat: config.defaultOutputFormat || 'markdown',
      enableAISuggestions: config.enableAISuggestions !== false,
      generationSpeed: config.generationSpeed || 'standard', // 'fast', 'standard', 'comprehensive'
      qualityThreshold: config.qualityThreshold || 0.85,
      ...config
    };

    // Document templates
    this.templates = new Map();

    // Performance tracking
    this.metrics = {
      totalGenerations: 0,
      successfulGenerations: 0,
      averageGenerationTime: 0,
      averageContentLength: 0,
      qualityScores: []
    };

    // Content patterns and suggestions cache
    this.contentPatterns = new Map();
    this.suggestionCache = new Map();

    this.initialize();
  }

  /**
   * Initialize the document generator
   */
  initialize() {
    this.setupDefaultTemplates();
    this.setupContentPatterns();

    this.emit('generator-initialized', {
      timestamp: new Date().toISOString(),
      templatesLoaded: this.templates.size,
      patternsLoaded: this.contentPatterns.size
    });
  }

  /**
   * Setup default document templates
   */
  setupDefaultTemplates() {
    // Requirements Document Template
    this.templates.set('requirements', {
      name: 'Requirements Document',
      sections: [
        { id: 'overview', title: 'Overview', required: true },
        { id: 'scope', title: 'Scope', required: true },
        { id: 'functional-requirements', title: 'Functional Requirements', required: true },
        { id: 'non-functional-requirements', title: 'Non-Functional Requirements', required: false },
        { id: 'constraints', title: 'Constraints', required: false },
        { id: 'assumptions', title: 'Assumptions', required: false },
        { id: 'acceptance-criteria', title: 'Acceptance Criteria', required: true }
      ],
      format: 'markdown'
    });

    // Technical Specification Template
    this.templates.set('technical-spec', {
      name: 'Technical Specification',
      sections: [
        { id: 'introduction', title: 'Introduction', required: true },
        { id: 'architecture', title: 'System Architecture', required: true },
        { id: 'components', title: 'Component Design', required: true },
        { id: 'interfaces', title: 'Interface Specifications', required: true },
        { id: 'data-model', title: 'Data Model', required: false },
        { id: 'security', title: 'Security Considerations', required: true },
        { id: 'performance', title: 'Performance Requirements', required: false },
        { id: 'deployment', title: 'Deployment Strategy', required: false }
      ],
      format: 'markdown'
    });

    // Test Plan Template
    this.templates.set('test-plan', {
      name: 'Test Plan',
      sections: [
        { id: 'overview', title: 'Test Overview', required: true },
        { id: 'objectives', title: 'Test Objectives', required: true },
        { id: 'scope', title: 'Test Scope', required: true },
        { id: 'strategy', title: 'Test Strategy', required: true },
        { id: 'test-cases', title: 'Test Cases', required: true },
        { id: 'environment', title: 'Test Environment', required: false },
        { id: 'schedule', title: 'Test Schedule', required: false },
        { id: 'resources', title: 'Resources', required: false }
      ],
      format: 'markdown'
    });

    // User Manual Template
    this.templates.set('user-manual', {
      name: 'User Manual',
      sections: [
        { id: 'introduction', title: 'Introduction', required: true },
        { id: 'getting-started', title: 'Getting Started', required: true },
        { id: 'features', title: 'Features', required: true },
        { id: 'tutorials', title: 'Step-by-Step Tutorials', required: true },
        { id: 'troubleshooting', title: 'Troubleshooting', required: false },
        { id: 'faq', title: 'Frequently Asked Questions', required: false },
        { id: 'support', title: 'Support Information', required: false }
      ],
      format: 'markdown'
    });

    // API Documentation Template
    this.templates.set('api-documentation', {
      name: 'API Documentation',
      sections: [
        { id: 'overview', title: 'API Overview', required: true },
        { id: 'authentication', title: 'Authentication', required: true },
        { id: 'endpoints', title: 'Endpoints', required: true },
        { id: 'request-response', title: 'Request/Response Format', required: true },
        { id: 'error-handling', title: 'Error Handling', required: true },
        { id: 'rate-limits', title: 'Rate Limits', required: false },
        { id: 'examples', title: 'Code Examples', required: true },
        { id: 'sdks', title: 'SDKs and Libraries', required: false }
      ],
      format: 'markdown'
    });
  }

  /**
   * Setup content patterns for intelligent suggestions
   */
  setupContentPatterns() {
    // Common content patterns for different document types
    this.contentPatterns.set('requirements', {
      keyPhrases: [
        'shall', 'must', 'should', 'may', 'will',
        'functional requirement', 'non-functional requirement',
        'user story', 'acceptance criteria', 'business rule'
      ],
      structure: {
        introduction: ['purpose', 'scope', 'definitions'],
        requirements: ['functional', 'non-functional', 'constraints'],
        validation: ['acceptance criteria', 'test cases', 'verification']
      }
    });

    this.contentPatterns.set('technical-spec', {
      keyPhrases: [
        'architecture', 'component', 'interface', 'protocol',
        'data flow', 'sequence diagram', 'class diagram',
        'security', 'performance', 'scalability'
      ],
      structure: {
        overview: ['system context', 'high-level architecture'],
        detailed: ['component design', 'interface specifications'],
        quality: ['performance', 'security', 'maintainability']
      }
    });

    this.contentPatterns.set('test-plan', {
      keyPhrases: [
        'test case', 'test scenario', 'test data',
        'expected result', 'actual result', 'pass', 'fail',
        'unit test', 'integration test', 'system test'
      ],
      structure: {
        planning: ['objectives', 'scope', 'strategy'],
        execution: ['test cases', 'procedures', 'environment'],
        reporting: ['results', 'defects', 'recommendations']
      }
    });
  }

  /**
   * Generate document from request
   */
  async generateDocument(request) {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateGenerationRequest(request);

      // Extract generation parameters
      const {
        type,
        template,
        content,
        context = {},
        outputFormat = this.config.defaultOutputFormat
      } = request;

      this.emit('generation-started', {
        type,
        template,
        outputFormat,
        timestamp: new Date().toISOString()
      });

      // Get template configuration
      const templateConfig = this.getTemplate(template || type);

      // Generate content based on context and template
      const generatedContent = await this.generateContent(templateConfig, content, context);

      // Apply formatting
      const formattedContent = this.formatContent(generatedContent, outputFormat);

      // Enhance with AI suggestions if enabled
      let enhancedContent = formattedContent;
      if (this.config.enableAISuggestions) {
        enhancedContent = await this.enhanceWithAISuggestions(formattedContent, type, context);
      }

      // Validate quality
      const qualityScore = this.assessContentQuality(enhancedContent, type);

      // Prepare metadata
      const metadata = {
        generationType: type,
        template: template || type,
        outputFormat,
        contentLength: enhancedContent.length,
        qualityScore,
        generationTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        aiEnhanced: this.config.enableAISuggestions
      };

      // Update metrics
      this.updateMetrics(metadata);

      const result = {
        content: enhancedContent,
        metadata,
        performance: {
          generationTime: metadata.generationTime,
          qualityScore,
          speedRating: this.calculateSpeedRating(metadata.generationTime, enhancedContent.length)
        }
      };

      this.emit('generation-completed', {
        type,
        template,
        qualityScore,
        generationTime: metadata.generationTime,
        contentLength: enhancedContent.length
      });

      return result;

    } catch (error) {
      this.emit('generation-failed', {
        error: error.message,
        request: { type: request.type, template: request.template }
      });

      throw new Error(`Document generation failed: ${error.message}`);
    }
  }

  /**
   * Validate generation request
   */
  validateGenerationRequest(request) {
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid generation request');
    }

    if (!request.type && !request.template) {
      throw new Error('Document type or template must be specified');
    }

    if (request.content && typeof request.content !== 'string') {
      throw new Error('Content must be a string');
    }
  }

  /**
   * Get template configuration
   */
  getTemplate(templateName) {
    const template = this.templates.get(templateName);
    if (!template) {
      // Return a generic template
      return {
        name: 'Generic Document',
        sections: [
          { id: 'introduction', title: 'Introduction', required: true },
          { id: 'content', title: 'Main Content', required: true },
          { id: 'conclusion', title: 'Conclusion', required: false }
        ],
        format: 'markdown'
      };
    }
    return template;
  }

  /**
   * Generate content based on template and context
   */
  async generateContent(template, baseContent, context) {
    const sections = [];

    for (const section of template.sections) {
      try {
        const sectionContent = await this.generateSection(section, baseContent, context, template);
        if (sectionContent || section.required) {
          sections.push({
            id: section.id,
            title: section.title,
            content: sectionContent || this.generatePlaceholderContent(section)
          });
        }
      } catch (error) {
        if (section.required) {
          sections.push({
            id: section.id,
            title: section.title,
            content: this.generatePlaceholderContent(section)
          });
        }
      }
    }

    return this.assembleSections(sections, template);
  }

  /**
   * Generate individual section content
   */
  async generateSection(section, baseContent, context, template) {
    const sectionContext = {
      ...context,
      sectionId: section.id,
      sectionTitle: section.title,
      templateType: template.name
    };

    // Apply context-aware generation
    switch (section.id) {
      case 'overview':
      case 'introduction':
        return this.generateIntroductionContent(baseContent, sectionContext);

      case 'scope':
        return this.generateScopeContent(baseContent, sectionContext);

      case 'functional-requirements':
        return this.generateFunctionalRequirements(baseContent, sectionContext);

      case 'non-functional-requirements':
        return this.generateNonFunctionalRequirements(baseContent, sectionContext);

      case 'acceptance-criteria':
        return this.generateAcceptanceCriteria(baseContent, sectionContext);

      case 'architecture':
        return this.generateArchitectureContent(baseContent, sectionContext);

      case 'test-cases':
        return this.generateTestCases(baseContent, sectionContext);

      default:
        return this.generateGenericContent(section, baseContent, sectionContext);
    }
  }

  /**
   * Generate introduction content
   */
  generateIntroductionContent(baseContent, context) {
    const projectName = context.projectName || 'the system';
    const purpose = context.purpose || 'provide comprehensive functionality';

    return `This document provides a comprehensive overview of ${projectName}. The primary purpose is to ${purpose} and establish clear guidelines for development and implementation.

## Document Purpose

This document serves as the definitive guide for understanding the requirements, specifications, and implementation details for ${projectName}.

## Scope

The scope of this document includes:
- Detailed functional and non-functional requirements
- System architecture and design considerations
- Implementation guidelines and best practices
- Quality assurance and testing procedures

${baseContent ? `\n## Additional Context\n\n${baseContent}` : ''}`;
  }

  /**
   * Generate scope content
   */
  generateScopeContent(baseContent, context) {
    return `## In Scope

The following items are included within the scope of this project:
- Core functionality as defined in the requirements
- Integration with existing systems
- User interface and experience design
- Performance and security requirements
- Testing and quality assurance

## Out of Scope

The following items are explicitly excluded from this scope:
- Third-party integrations not specified in requirements
- Legacy system migrations (unless explicitly mentioned)
- Advanced features not covered in the initial requirements

${baseContent ? `\n## Additional Scope Details\n\n${baseContent}` : ''}`;
  }

  /**
   * Generate functional requirements
   */
  generateFunctionalRequirements(baseContent, context) {
    let requirements = `## Core Functional Requirements

### REQ-001: User Management
- The system SHALL provide user registration and authentication capabilities
- The system SHALL support role-based access control
- The system SHALL maintain user profile information

### REQ-002: Data Management
- The system SHALL provide CRUD operations for core data entities
- The system SHALL ensure data consistency and integrity
- The system SHALL support data validation and business rules

### REQ-003: User Interface
- The system SHALL provide an intuitive web-based interface
- The system SHALL support responsive design for multiple devices
- The system SHALL ensure accessibility compliance (WCAG 2.1 AA)

### REQ-004: Integration
- The system SHALL provide REST API endpoints for external integration
- The system SHALL support standard authentication protocols
- The system SHALL maintain audit logs for all critical operations`;

    if (baseContent) {
      requirements += `\n\n## Additional Functional Requirements\n\n${baseContent}`;
    }

    return requirements;
  }

  /**
   * Generate non-functional requirements
   */
  generateNonFunctionalRequirements(baseContent, context) {
    return `## Performance Requirements
- Response time SHALL be less than 2 seconds for 95% of requests
- The system SHALL support concurrent users as specified in capacity planning
- Database queries SHALL be optimized for performance

## Security Requirements
- All data transmission SHALL be encrypted using TLS 1.3 or higher
- User passwords SHALL be hashed using industry-standard algorithms
- The system SHALL implement proper session management

## Reliability Requirements
- System uptime SHALL be 99.9% or higher
- Data backup SHALL be performed daily with verified recovery procedures
- Error handling SHALL be comprehensive with proper logging

## Scalability Requirements
- The system SHALL be designed to scale horizontally
- Database performance SHALL remain stable with growing data volumes
- Caching strategies SHALL be implemented for optimal performance

${baseContent ? `\n## Additional Non-Functional Requirements\n\n${baseContent}` : ''}`;
  }

  /**
   * Generate acceptance criteria
   */
  generateAcceptanceCriteria(baseContent, context) {
    return `## Acceptance Criteria Overview

The following criteria must be met for successful project completion:

### Functional Acceptance
- [ ] All functional requirements are implemented and tested
- [ ] User interface meets design specifications
- [ ] Integration points function correctly
- [ ] Data validation works as specified

### Performance Acceptance
- [ ] Response time requirements are met
- [ ] Concurrent user capacity is demonstrated
- [ ] System stability under load is verified

### Security Acceptance
- [ ] Security requirements are implemented
- [ ] Vulnerability testing is completed
- [ ] Access controls function properly

### Quality Acceptance
- [ ] Code review process is completed
- [ ] Unit test coverage meets minimum threshold (90%)
- [ ] Integration testing is successful
- [ ] User acceptance testing is completed

${baseContent ? `\n## Additional Acceptance Criteria\n\n${baseContent}` : ''}`;
  }

  /**
   * Generate architecture content
   */
  generateArchitectureContent(baseContent, context) {
    return `## System Architecture Overview

### High-Level Architecture
The system follows a modern three-tier architecture pattern:

1. **Presentation Layer**: Web-based user interface built with modern frameworks
2. **Business Logic Layer**: Application services handling core business functionality
3. **Data Layer**: Persistent storage with optimized data access patterns

### Component Architecture
- **Frontend Components**: Responsive UI components with state management
- **Backend Services**: RESTful APIs with business logic implementation
- **Database Layer**: Relational database with proper indexing and relationships
- **Integration Layer**: APIs and message queues for external system communication

### Technology Stack
- Frontend: Modern JavaScript framework (React/Vue/Angular)
- Backend: Node.js/Python/Java with appropriate frameworks
- Database: PostgreSQL/MySQL with Redis for caching
- Infrastructure: Cloud-native deployment with containerization

${baseContent ? `\n## Additional Architecture Details\n\n${baseContent}` : ''}`;
  }

  /**
   * Generate test cases
   */
  generateTestCases(baseContent, context) {
    return `## Test Case Overview

### Test Case 001: User Authentication
**Objective**: Verify user login functionality
**Preconditions**: Valid user account exists
**Test Steps**:
1. Navigate to login page
2. Enter valid credentials
3. Click login button
**Expected Result**: User is authenticated and redirected to dashboard

### Test Case 002: Data CRUD Operations
**Objective**: Verify create, read, update, delete operations
**Preconditions**: User is authenticated with appropriate permissions
**Test Steps**:
1. Create new data entry
2. Verify data is saved correctly
3. Update the entry
4. Verify updates are persisted
5. Delete the entry
6. Verify deletion is successful
**Expected Result**: All CRUD operations function correctly

### Test Case 003: API Integration
**Objective**: Verify API endpoints function correctly
**Preconditions**: API is deployed and accessible
**Test Steps**:
1. Send GET request to endpoint
2. Verify response format and status
3. Send POST request with valid data
4. Verify data is created successfully
**Expected Result**: API responds correctly with expected data

${baseContent ? `\n## Additional Test Cases\n\n${baseContent}` : ''}`;
  }

  /**
   * Generate generic content for unknown sections
   */
  generateGenericContent(section, baseContent, context) {
    const title = section.title || section.id;

    let content = `## ${title}

This section covers the ${title.toLowerCase()} aspects of the project. The following information provides comprehensive details about this component.

### Key Points
- Important considerations for ${title.toLowerCase()}
- Implementation guidelines and best practices
- Quality standards and requirements
- Integration with other system components`;

    if (baseContent) {
      content += `\n\n### Additional Information\n\n${baseContent}`;
    }

    return content;
  }

  /**
   * Generate placeholder content for required sections
   */
  generatePlaceholderContent(section) {
    return `## ${section.title}

*This section requires additional content. Please provide specific details for ${section.title.toLowerCase()}.*

<!-- TODO: Add detailed content for ${section.id} -->`;
  }

  /**
   * Assemble sections into complete document
   */
  assembleSections(sections, template) {
    let document = `# ${template.name}\n\n`;

    // Add document metadata
    document += `*Generated on: ${new Date().toLocaleDateString()}*\n\n`;
    document += `---\n\n`;

    // Add table of contents
    document += `## Table of Contents\n\n`;
    sections.forEach((section, index) => {
      document += `${index + 1}. [${section.title}](#${section.id.replace(/\s+/g, '-').toLowerCase()})\n`;
    });
    document += `\n---\n\n`;

    // Add sections
    sections.forEach(section => {
      document += section.content + '\n\n';
    });

    return document;
  }

  /**
   * Format content according to output format
   */
  formatContent(content, outputFormat) {
    switch (outputFormat.toLowerCase()) {
      case 'html':
        return this.convertMarkdownToHtml(content);

      case 'pdf':
        return this.formatForPdf(content);

      case 'docx':
        return this.formatForDocx(content);

      case 'json':
        return this.formatAsJson(content);

      case 'markdown':
      default:
        return content;
    }
  }

  /**
   * Convert markdown to HTML (simplified)
   */
  convertMarkdownToHtml(content) {
    return content
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br>');
  }

  /**
   * Format for PDF output
   */
  formatForPdf(content) {
    // Add PDF-specific formatting
    return content.replace(/^---$/gm, '\n\\pagebreak\n');
  }

  /**
   * Format for DOCX output
   */
  formatForDocx(content) {
    // Add DOCX-specific formatting
    return content;
  }

  /**
   * Format as structured JSON
   */
  formatAsJson(content) {
    const sections = content.split(/^## /gm).filter(section => section.trim());
    const structured = {
      title: sections[0]?.split('\n')[0] || 'Generated Document',
      sections: sections.slice(1).map(section => {
        const lines = section.split('\n');
        const title = lines[0];
        const content = lines.slice(1).join('\n').trim();
        return { title, content };
      })
    };

    return JSON.stringify(structured, null, 2);
  }

  /**
   * Enhance content with AI suggestions
   */
  async enhanceWithAISuggestions(content, documentType, context) {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(content, documentType);
      if (this.suggestionCache.has(cacheKey)) {
        return this.applyCachedSuggestions(content, this.suggestionCache.get(cacheKey));
      }

      // Generate AI suggestions
      const suggestions = await this.generateAISuggestions(content, documentType, context);

      // Cache suggestions
      this.suggestionCache.set(cacheKey, suggestions);

      // Apply suggestions
      return this.applySuggestions(content, suggestions);

    } catch (error) {
      console.warn('AI enhancement failed, returning original content:', error.message);
      return content;
    }
  }

  /**
   * Generate AI suggestions
   */
  async generateAISuggestions(content, documentType, context) {
    // Simulate AI suggestions based on content patterns
    const patterns = this.contentPatterns.get(documentType) || { keyPhrases: [], structure: {} };

    const suggestions = {
      improvements: [],
      additions: [],
      structure: []
    };

    // Analyze content for missing key phrases
    const missingPhrases = patterns.keyPhrases.filter(phrase =>
      !content.toLowerCase().includes(phrase.toLowerCase())
    );

    if (missingPhrases.length > 0) {
      suggestions.improvements.push({
        type: 'terminology',
        suggestion: `Consider including these key terms: ${missingPhrases.slice(0, 3).join(', ')}`,
        priority: 'medium'
      });
    }

    // Check content length
    if (content.length < this.config.minContentLength) {
      suggestions.additions.push({
        type: 'content-expansion',
        suggestion: 'Content appears to be quite brief. Consider adding more detailed explanations and examples.',
        priority: 'high'
      });
    }

    // Structure suggestions
    const hasTableOfContents = content.includes('Table of Contents');
    if (!hasTableOfContents && content.length > 2000) {
      suggestions.structure.push({
        type: 'navigation',
        suggestion: 'Consider adding a table of contents for better navigation.',
        priority: 'medium'
      });
    }

    return suggestions;
  }

  /**
   * Apply suggestions to content
   */
  applySuggestions(content, suggestions) {
    let enhancedContent = content;

    // Apply high-priority suggestions
    for (const suggestion of [...suggestions.improvements, ...suggestions.additions, ...suggestions.structure]) {
      if (suggestion.priority === 'high') {
        enhancedContent = this.applySingleSuggestion(enhancedContent, suggestion);
      }
    }

    return enhancedContent;
  }

  /**
   * Apply single suggestion
   */
  applySingleSuggestion(content, suggestion) {
    switch (suggestion.type) {
      case 'content-expansion':
        // Add a note about expanding content
        return content + '\n\n> **AI Suggestion**: ' + suggestion.suggestion + '\n';

      case 'terminology':
        // Add terminology note
        return content + '\n\n> **AI Note**: ' + suggestion.suggestion + '\n';

      case 'navigation':
        // Add table of contents suggestion
        return content.replace(/^# /, '# ') + '\n\n> **AI Suggestion**: ' + suggestion.suggestion + '\n';

      default:
        return content;
    }
  }

  /**
   * Assess content quality
   */
  assessContentQuality(content, documentType) {
    let score = 100;

    // Length assessment
    if (content.length < this.config.minContentLength) {
      score -= 30;
    } else if (content.length > this.config.maxContentLength) {
      score -= 10;
    }

    // Structure assessment
    const headingCount = (content.match(/^#+\s/gm) || []).length;
    if (headingCount < 3) {
      score -= 15;
    }

    // Content quality indicators
    const patterns = this.contentPatterns.get(documentType);
    if (patterns) {
      const keyPhraseCount = patterns.keyPhrases.filter(phrase =>
        content.toLowerCase().includes(phrase.toLowerCase())
      ).length;

      if (keyPhraseCount < patterns.keyPhrases.length * 0.3) {
        score -= 20;
      }
    }

    // Format quality
    if (!content.includes('##')) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score)) / 100;
  }

  /**
   * Calculate speed rating
   */
  calculateSpeedRating(generationTime, contentLength) {
    const wordsPerSecond = (contentLength / 5) / (generationTime / 1000); // Rough estimate

    if (wordsPerSecond > 100) return 'excellent';
    if (wordsPerSecond > 50) return 'good';
    if (wordsPerSecond > 20) return 'average';
    return 'slow';
  }

  /**
   * Generate cache key
   */
  generateCacheKey(content, documentType) {
    const contentHash = content.substring(0, 100).replace(/\s+/g, '');
    return `${documentType}_${contentHash}_${content.length}`;
  }

  /**
   * Update metrics
   */
  updateMetrics(metadata) {
    this.metrics.totalGenerations++;
    this.metrics.successfulGenerations++;

    // Update average generation time
    this.metrics.averageGenerationTime =
      ((this.metrics.averageGenerationTime * (this.metrics.totalGenerations - 1)) + metadata.generationTime) /
      this.metrics.totalGenerations;

    // Update average content length
    this.metrics.averageContentLength =
      ((this.metrics.averageContentLength * (this.metrics.totalGenerations - 1)) + metadata.contentLength) /
      this.metrics.totalGenerations;

    // Track quality scores
    this.metrics.qualityScores.push(metadata.qualityScore);
    if (this.metrics.qualityScores.length > 100) {
      this.metrics.qualityScores = this.metrics.qualityScores.slice(-100);
    }
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      id: key,
      name: template.name,
      sections: template.sections.length,
      format: template.format
    }));
  }

  /**
   * Add custom template
   */
  addTemplate(id, template) {
    this.templates.set(id, template);

    this.emit('template-added', {
      templateId: id,
      templateName: template.name
    });
  }

  /**
   * Get generation metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      averageQualityScore: this.metrics.qualityScores.length > 0 ?
        this.metrics.qualityScores.reduce((sum, score) => sum + score, 0) / this.metrics.qualityScores.length : 0,
      successRate: this.metrics.totalGenerations > 0 ?
        (this.metrics.successfulGenerations / this.metrics.totalGenerations) * 100 : 0,
      templatesAvailable: this.templates.size,
      cacheSize: this.suggestionCache.size
    };
  }
}

module.exports = DocumentGenerator;