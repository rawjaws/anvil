/**
 * Advanced Document Template Engine for Smart Document Generator
 * Provides intelligent template selection, customization, and formatting
 */

const EventEmitter = require('events');

class DocumentTemplateEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      templateCaching: config.templateCaching !== false,
      customTemplatesPath: config.customTemplatesPath || './templates',
      formatters: config.formatters || ['markdown', 'html', 'docx', 'pdf'],
      ...config
    };

    this.templates = new Map();
    this.formatters = new Map();
    this.templateCache = new Map();
    this.templateMetrics = {
      templatesLoaded: 0,
      templatesUsed: 0,
      customTemplatesLoaded: 0,
      averageRenderTime: 0
    };

    this.initialize();
  }

  /**
   * Initialize template engine with built-in templates
   */
  initialize() {
    this.loadBuiltInTemplates();
    this.initializeFormatters();
    this.loadCustomTemplates();

    this.emit('template-engine-initialized', {
      templatesLoaded: this.templates.size,
      formattersAvailable: this.formatters.size
    });
  }

  /**
   * Load built-in document templates
   */
  loadBuiltInTemplates() {
    // Requirements Document Templates
    this.templates.set('requirements-document', {
      id: 'requirements-document',
      name: 'Requirements Document',
      category: 'technical',
      description: 'Comprehensive software requirements specification',
      structure: {
        sections: [
          {
            id: 'title-page',
            name: 'Title Page',
            required: true,
            template: this.getTemplate('title-page'),
            fields: ['title', 'version', 'date', 'author', 'stakeholders']
          },
          {
            id: 'executive-summary',
            name: 'Executive Summary',
            required: true,
            template: this.getTemplate('executive-summary'),
            fields: ['overview', 'objectives', 'scope', 'success-criteria']
          },
          {
            id: 'functional-requirements',
            name: 'Functional Requirements',
            required: true,
            template: this.getTemplate('functional-requirements'),
            fields: ['requirements-list', 'priorities', 'dependencies']
          },
          {
            id: 'non-functional-requirements',
            name: 'Non-Functional Requirements',
            required: true,
            template: this.getTemplate('non-functional-requirements'),
            fields: ['performance', 'security', 'usability', 'reliability']
          },
          {
            id: 'constraints',
            name: 'Constraints and Assumptions',
            required: false,
            template: this.getTemplate('constraints'),
            fields: ['technical-constraints', 'business-constraints', 'assumptions']
          },
          {
            id: 'acceptance-criteria',
            name: 'Acceptance Criteria',
            required: true,
            template: this.getTemplate('acceptance-criteria'),
            fields: ['criteria-list', 'testing-approach', 'success-metrics']
          }
        ]
      },
      formatting: {
        style: 'formal',
        numbering: 'hierarchical',
        toc: true,
        headers: true,
        footers: true
      },
      variables: ['project-name', 'version', 'date', 'author', 'organization']
    });

    // User Stories Template
    this.templates.set('user-stories', {
      id: 'user-stories',
      name: 'User Stories Collection',
      category: 'agile',
      description: 'Agile user stories with acceptance criteria',
      structure: {
        sections: [
          {
            id: 'epic-overview',
            name: 'Epic Overview',
            required: true,
            template: this.getTemplate('epic-overview'),
            fields: ['epic-title', 'epic-description', 'business-value', 'success-metrics']
          },
          {
            id: 'persona-definitions',
            name: 'User Personas',
            required: true,
            template: this.getTemplate('persona-definitions'),
            fields: ['personas-list', 'user-goals', 'pain-points']
          },
          {
            id: 'user-stories-list',
            name: 'User Stories',
            required: true,
            template: this.getTemplate('user-stories-list'),
            fields: ['stories', 'priorities', 'story-points']
          },
          {
            id: 'acceptance-criteria-detailed',
            name: 'Acceptance Criteria',
            required: true,
            template: this.getTemplate('acceptance-criteria-detailed'),
            fields: ['given-when-then', 'edge-cases', 'non-functional-criteria']
          },
          {
            id: 'definition-of-done',
            name: 'Definition of Done',
            required: true,
            template: this.getTemplate('definition-of-done'),
            fields: ['completion-criteria', 'quality-gates', 'review-process']
          }
        ]
      },
      formatting: {
        style: 'agile',
        numbering: 'simple',
        toc: false,
        headers: true,
        footers: false
      },
      variables: ['project-name', 'sprint', 'team', 'product-owner']
    });

    // Test Cases Template
    this.templates.set('test-cases', {
      id: 'test-cases',
      name: 'Test Case Specification',
      category: 'quality',
      description: 'Comprehensive test case documentation',
      structure: {
        sections: [
          {
            id: 'test-strategy',
            name: 'Test Strategy',
            required: true,
            template: this.getTemplate('test-strategy'),
            fields: ['approach', 'scope', 'objectives', 'exclusions']
          },
          {
            id: 'test-scenarios',
            name: 'Test Scenarios',
            required: true,
            template: this.getTemplate('test-scenarios'),
            fields: ['scenario-list', 'test-conditions', 'expected-outcomes']
          },
          {
            id: 'test-cases-detailed',
            name: 'Detailed Test Cases',
            required: true,
            template: this.getTemplate('test-cases-detailed'),
            fields: ['test-steps', 'test-data', 'expected-results', 'preconditions']
          },
          {
            id: 'test-environment',
            name: 'Test Environment',
            required: true,
            template: this.getTemplate('test-environment'),
            fields: ['environment-setup', 'test-data-requirements', 'tools']
          },
          {
            id: 'automation-strategy',
            name: 'Test Automation',
            required: false,
            template: this.getTemplate('automation-strategy'),
            fields: ['automation-scope', 'tools', 'framework', 'maintenance']
          }
        ]
      },
      formatting: {
        style: 'structured',
        numbering: 'hierarchical',
        toc: true,
        headers: true,
        footers: true
      },
      variables: ['application-name', 'version', 'test-lead', 'environment']
    });

    // Architecture Documentation Template
    this.templates.set('architecture-document', {
      id: 'architecture-document',
      name: 'Architecture Documentation',
      category: 'design',
      description: 'System architecture and design documentation',
      structure: {
        sections: [
          {
            id: 'architecture-overview',
            name: 'Architecture Overview',
            required: true,
            template: this.getTemplate('architecture-overview'),
            fields: ['system-context', 'architectural-goals', 'design-principles']
          },
          {
            id: 'system-components',
            name: 'System Components',
            required: true,
            template: this.getTemplate('system-components'),
            fields: ['component-diagram', 'component-descriptions', 'responsibilities']
          },
          {
            id: 'interface-specifications',
            name: 'Interface Specifications',
            required: true,
            template: this.getTemplate('interface-specifications'),
            fields: ['api-specifications', 'data-formats', 'protocols']
          },
          {
            id: 'deployment-architecture',
            name: 'Deployment Architecture',
            required: true,
            template: this.getTemplate('deployment-architecture'),
            fields: ['deployment-diagram', 'infrastructure', 'scaling-strategy']
          },
          {
            id: 'security-architecture',
            name: 'Security Architecture',
            required: true,
            template: this.getTemplate('security-architecture'),
            fields: ['security-controls', 'authentication', 'authorization', 'data-protection']
          },
          {
            id: 'data-architecture',
            name: 'Data Architecture',
            required: false,
            template: this.getTemplate('data-architecture'),
            fields: ['data-model', 'storage-strategy', 'data-flow']
          }
        ]
      },
      formatting: {
        style: 'technical',
        numbering: 'hierarchical',
        toc: true,
        headers: true,
        footers: true,
        diagrams: true
      },
      variables: ['system-name', 'version', 'architect', 'organization']
    });

    // Product Specification Template
    this.templates.set('product-specification', {
      id: 'product-specification',
      name: 'Product Specification',
      category: 'product',
      description: 'Comprehensive product specification and roadmap',
      structure: {
        sections: [
          {
            id: 'product-vision',
            name: 'Product Vision',
            required: true,
            template: this.getTemplate('product-vision'),
            fields: ['vision-statement', 'target-market', 'value-proposition']
          },
          {
            id: 'market-analysis',
            name: 'Market Analysis',
            required: true,
            template: this.getTemplate('market-analysis'),
            fields: ['market-size', 'competitive-landscape', 'market-trends']
          },
          {
            id: 'feature-specifications',
            name: 'Feature Specifications',
            required: true,
            template: this.getTemplate('feature-specifications'),
            fields: ['feature-list', 'priorities', 'user-scenarios']
          },
          {
            id: 'product-roadmap',
            name: 'Product Roadmap',
            required: true,
            template: this.getTemplate('product-roadmap'),
            fields: ['timeline', 'milestones', 'dependencies', 'risks']
          },
          {
            id: 'success-metrics',
            name: 'Success Metrics',
            required: true,
            template: this.getTemplate('success-metrics'),
            fields: ['kpis', 'measurement-strategy', 'targets']
          }
        ]
      },
      formatting: {
        style: 'business',
        numbering: 'simple',
        toc: true,
        headers: true,
        footers: true
      },
      variables: ['product-name', 'version', 'product-manager', 'release-date']
    });

    // API Documentation Template
    this.templates.set('api-documentation', {
      id: 'api-documentation',
      name: 'API Documentation',
      category: 'technical',
      description: 'RESTful API documentation with examples',
      structure: {
        sections: [
          {
            id: 'api-overview',
            name: 'API Overview',
            required: true,
            template: this.getTemplate('api-overview'),
            fields: ['description', 'base-url', 'version', 'authentication']
          },
          {
            id: 'authentication',
            name: 'Authentication',
            required: true,
            template: this.getTemplate('authentication'),
            fields: ['auth-methods', 'api-keys', 'tokens', 'examples']
          },
          {
            id: 'endpoints',
            name: 'API Endpoints',
            required: true,
            template: this.getTemplate('endpoints'),
            fields: ['endpoint-list', 'request-response', 'parameters', 'examples']
          },
          {
            id: 'error-handling',
            name: 'Error Handling',
            required: true,
            template: this.getTemplate('error-handling'),
            fields: ['error-codes', 'error-responses', 'troubleshooting']
          },
          {
            id: 'code-examples',
            name: 'Code Examples',
            required: true,
            template: this.getTemplate('code-examples'),
            fields: ['curl-examples', 'sdk-examples', 'response-examples']
          },
          {
            id: 'rate-limiting',
            name: 'Rate Limiting',
            required: false,
            template: this.getTemplate('rate-limiting'),
            fields: ['limits', 'headers', 'exceeded-responses']
          }
        ]
      },
      formatting: {
        style: 'technical',
        numbering: 'hierarchical',
        toc: true,
        headers: true,
        footers: true,
        codeBlocks: true
      },
      variables: ['api-name', 'version', 'base-url', 'contact-email']
    });

    // Project Plan Template
    this.templates.set('project-plan', {
      id: 'project-plan',
      name: 'Project Plan',
      category: 'management',
      description: 'Comprehensive project planning document',
      structure: {
        sections: [
          {
            id: 'project-charter',
            name: 'Project Charter',
            required: true,
            template: this.getTemplate('project-charter'),
            fields: ['objectives', 'scope', 'deliverables', 'success-criteria']
          },
          {
            id: 'project-scope',
            name: 'Project Scope',
            required: true,
            template: this.getTemplate('project-scope'),
            fields: ['in-scope', 'out-of-scope', 'assumptions', 'constraints']
          },
          {
            id: 'project-timeline',
            name: 'Project Timeline',
            required: true,
            template: this.getTemplate('project-timeline'),
            fields: ['milestones', 'phases', 'dependencies', 'critical-path']
          },
          {
            id: 'resource-allocation',
            name: 'Resource Allocation',
            required: true,
            template: this.getTemplate('resource-allocation'),
            fields: ['team-structure', 'roles-responsibilities', 'budget', 'tools']
          },
          {
            id: 'risk-management',
            name: 'Risk Management',
            required: true,
            template: this.getTemplate('risk-management'),
            fields: ['risk-register', 'mitigation-strategies', 'contingency-plans']
          },
          {
            id: 'communication-plan',
            name: 'Communication Plan',
            required: false,
            template: this.getTemplate('communication-plan'),
            fields: ['stakeholders', 'communication-matrix', 'reporting-schedule']
          }
        ]
      },
      formatting: {
        style: 'business',
        numbering: 'hierarchical',
        toc: true,
        headers: true,
        footers: true
      },
      variables: ['project-name', 'project-manager', 'start-date', 'end-date']
    });

    this.templateMetrics.templatesLoaded = this.templates.size;
  }

  /**
   * Get template content by ID
   */
  getTemplate(templateId) {
    const templates = {
      // Title Page Templates
      'title-page': {
        markdown: `# {{title}}

**Version:** {{version}}
**Date:** {{date}}
**Author:** {{author}}
**Organization:** {{organization}}

## Document Information

| Field | Value |
|-------|-------|
| Document Type | {{document-type}} |
| Status | {{status}} |
| Distribution | {{distribution}} |

## Stakeholders

{{#each stakeholders}}
- **{{role}}:** {{name}} ({{contact}})
{{/each}}

---`,
        html: `<div class="title-page">
  <h1>{{title}}</h1>
  <div class="document-info">
    <p><strong>Version:</strong> {{version}}</p>
    <p><strong>Date:</strong> {{date}}</p>
    <p><strong>Author:</strong> {{author}}</p>
    <p><strong>Organization:</strong> {{organization}}</p>
  </div>
</div>`
      },

      // Executive Summary Templates
      'executive-summary': {
        markdown: `# Executive Summary

## Overview
{{overview}}

## Objectives
{{#each objectives}}
- {{this}}
{{/each}}

## Scope
{{scope}}

## Success Criteria
{{#each success-criteria}}
- {{criterion}}: {{description}}
{{/each}}

## Key Benefits
{{#each benefits}}
- {{this}}
{{/each}}`,
        html: `<section class="executive-summary">
  <h2>Executive Summary</h2>
  <div class="overview">{{overview}}</div>
  <div class="objectives">
    <h3>Objectives</h3>
    <ul>{{#each objectives}}<li>{{this}}</li>{{/each}}</ul>
  </div>
</section>`
      },

      // Functional Requirements Templates
      'functional-requirements': {
        markdown: `# Functional Requirements

## Requirements Overview
This section defines the functional capabilities that the system must provide.

{{#each requirements-list}}
### {{id}}: {{title}}

**Priority:** {{priority}}
**Category:** {{category}}

**Description:**
{{description}}

**Acceptance Criteria:**
{{#each acceptance-criteria}}
- {{this}}
{{/each}}

**Dependencies:**
{{#if dependencies}}
{{#each dependencies}}
- {{this}}
{{/each}}
{{else}}
None identified
{{/if}}

---
{{/each}}

## Requirements Traceability Matrix

| Requirement ID | Title | Priority | Status | Test Cases |
|----------------|-------|----------|---------|------------|
{{#each requirements-list}}
| {{id}} | {{title}} | {{priority}} | {{status}} | {{test-cases}} |
{{/each}}`,
        html: `<section class="functional-requirements">
  <h2>Functional Requirements</h2>
  {{#each requirements-list}}
  <div class="requirement">
    <h3>{{id}}: {{title}}</h3>
    <p class="priority">Priority: {{priority}}</p>
    <div class="description">{{description}}</div>
  </div>
  {{/each}}
</section>`
      },

      // User Stories Templates
      'user-stories-list': {
        markdown: `# User Stories

{{#each stories}}
## Story {{id}}: {{title}}

**As a** {{persona}},
**I want** {{goal}},
**So that** {{benefit}}.

**Priority:** {{priority}}
**Story Points:** {{story-points}}
**Sprint:** {{sprint}}

### Acceptance Criteria
{{#each acceptance-criteria}}
- **Given** {{given}}
- **When** {{when}}
- **Then** {{then}}

{{/each}}

### Notes
{{notes}}

---
{{/each}}`,
        html: `<section class="user-stories">
  {{#each stories}}
  <div class="user-story">
    <h3>Story {{id}}: {{title}}</h3>
    <p class="story-format">
      <strong>As a</strong> {{persona}},<br>
      <strong>I want</strong> {{goal}},<br>
      <strong>So that</strong> {{benefit}}.
    </p>
  </div>
  {{/each}}
</section>`
      },

      // Test Cases Templates
      'test-cases-detailed': {
        markdown: `# Test Cases

{{#each test-cases}}
## Test Case {{id}}: {{title}}

**Objective:** {{objective}}
**Priority:** {{priority}}
**Category:** {{category}}

### Preconditions
{{#each preconditions}}
- {{this}}
{{/each}}

### Test Steps
| Step | Action | Expected Result |
|------|--------|-----------------|
{{#each steps}}
| {{step-number}} | {{action}} | {{expected-result}} |
{{/each}}

### Test Data
{{#if test-data}}
{{#each test-data}}
- **{{name}}:** {{value}}
{{/each}}
{{else}}
No specific test data required
{{/if}}

### Postconditions
{{#each postconditions}}
- {{this}}
{{/each}}

---
{{/each}}`,
        html: `<section class="test-cases">
  {{#each test-cases}}
  <div class="test-case">
    <h3>Test Case {{id}}: {{title}}</h3>
    <p><strong>Objective:</strong> {{objective}}</p>
    <div class="test-steps">
      <h4>Test Steps</h4>
      <table>
        <thead>
          <tr><th>Step</th><th>Action</th><th>Expected Result</th></tr>
        </thead>
        <tbody>
          {{#each steps}}
          <tr><td>{{step-number}}</td><td>{{action}}</td><td>{{expected-result}}</td></tr>
          {{/each}}
        </tbody>
      </table>
    </div>
  </div>
  {{/each}}
</section>`
      },

      // Architecture Templates
      'system-components': {
        markdown: `# System Components

## Component Architecture Overview
{{overview}}

{{#each components}}
## {{name}} Component

**Type:** {{type}}
**Responsibility:** {{responsibility}}

### Description
{{description}}

### Interfaces
{{#each interfaces}}
- **{{name}}:** {{description}} ({{protocol}})
{{/each}}

### Dependencies
{{#each dependencies}}
- {{name}}: {{relationship}}
{{/each}}

### Configuration
{{#if configuration}}
\`\`\`yaml
{{configuration}}
\`\`\`
{{/if}}

---
{{/each}}

## Component Interaction Diagram
{{component-diagram}}`,
        html: `<section class="system-components">
  <h2>System Components</h2>
  {{#each components}}
  <div class="component">
    <h3>{{name}} Component</h3>
    <p><strong>Type:</strong> {{type}}</p>
    <p><strong>Responsibility:</strong> {{responsibility}}</p>
    <div class="description">{{description}}</div>
  </div>
  {{/each}}
</section>`
      },

      // API Documentation Templates
      'endpoints': {
        markdown: `# API Endpoints

{{#each endpoint-list}}
## {{method}} {{path}}

{{description}}

### Parameters

#### Path Parameters
{{#if path-parameters}}
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
{{#each path-parameters}}
| {{name}} | {{type}} | {{required}} | {{description}} |
{{/each}}
{{else}}
None
{{/if}}

#### Query Parameters
{{#if query-parameters}}
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
{{#each query-parameters}}
| {{name}} | {{type}} | {{required}} | {{description}} |
{{/each}}
{{else}}
None
{{/if}}

#### Request Body
{{#if request-body}}
\`\`\`json
{{request-body}}
\`\`\`
{{else}}
None
{{/if}}

### Response

#### Success Response ({{success-code}})
\`\`\`json
{{success-response}}
\`\`\`

#### Error Responses
{{#each error-responses}}
**{{code}}** - {{description}}
\`\`\`json
{{response}}
\`\`\`
{{/each}}

### Example
\`\`\`bash
curl -X {{method}} \\
  "{{base-url}}{{path}}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"
{{#if request-body}}
  -d '{{request-body}}'
{{/if}}
\`\`\`

---
{{/each}}`,
        html: `<section class="api-endpoints">
  {{#each endpoint-list}}
  <div class="endpoint">
    <h3><span class="method {{method-class}}">{{method}}</span> {{path}}</h3>
    <p>{{description}}</p>
    <div class="parameters">
      <h4>Parameters</h4>
      {{#if path-parameters}}
      <table>
        <thead><tr><th>Parameter</th><th>Type</th><th>Required</th><th>Description</th></tr></thead>
        <tbody>
          {{#each path-parameters}}
          <tr><td>{{name}}</td><td>{{type}}</td><td>{{required}}</td><td>{{description}}</td></tr>
          {{/each}}
        </tbody>
      </table>
      {{/if}}
    </div>
  </div>
  {{/each}}
</section>`
      }
    };

    return templates[templateId] || { markdown: '{{content}}', html: '<div>{{content}}</div>' };
  }

  /**
   * Initialize document formatters
   */
  initializeFormatters() {
    // Markdown formatter
    this.formatters.set('markdown', {
      name: 'Markdown',
      extension: '.md',
      mimeType: 'text/markdown',
      format: this.formatMarkdown.bind(this)
    });

    // HTML formatter
    this.formatters.set('html', {
      name: 'HTML',
      extension: '.html',
      mimeType: 'text/html',
      format: this.formatHTML.bind(this)
    });

    // JSON formatter
    this.formatters.set('json', {
      name: 'JSON',
      extension: '.json',
      mimeType: 'application/json',
      format: this.formatJSON.bind(this)
    });

    // Plain text formatter
    this.formatters.set('text', {
      name: 'Plain Text',
      extension: '.txt',
      mimeType: 'text/plain',
      format: this.formatPlainText.bind(this)
    });
  }

  /**
   * Apply templates to document content
   */
  async applyTemplates(content, documentType, context, options = {}) {
    const startTime = Date.now();

    try {
      // Get template configuration
      const template = this.templates.get(documentType);
      if (!template) {
        throw new Error(`Template not found for document type: ${documentType}`);
      }

      // Prepare template variables
      const variables = this.prepareTemplateVariables(content, context, template);

      // Process each section
      const processedSections = [];
      let templatesUsed = [];

      for (const sectionConfig of template.structure.sections) {
        if (!sectionConfig.required && !this.shouldIncludeSection(sectionConfig, content, context)) {
          continue;
        }

        const sectionContent = this.extractSectionContent(content, sectionConfig.id);
        const processedSection = await this.processSectionTemplate(
          sectionContent,
          sectionConfig,
          variables,
          options
        );

        processedSections.push(processedSection);
        templatesUsed.push(sectionConfig.id);
      }

      // Apply document-level formatting
      const formattedDocument = this.applyDocumentFormatting(
        processedSections,
        template,
        variables,
        options
      );

      const processingTime = Date.now() - startTime;
      this.templateMetrics.templatesUsed++;
      this.updateAverageRenderTime(processingTime);

      this.emit('template-applied', {
        documentType,
        templatesUsed: templatesUsed.length,
        processingTime
      });

      return {
        ...formattedDocument,
        metadata: {
          template: template.id,
          templatesUsed,
          processingTime,
          variables: Object.keys(variables),
          sections: processedSections.length
        }
      };

    } catch (error) {
      this.emit('template-error', {
        documentType,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process individual section template
   */
  async processSectionTemplate(content, sectionConfig, variables, options) {
    const template = sectionConfig.template;
    const formatType = options.format || 'markdown';

    // Get template content for format
    const templateContent = template[formatType] || template.markdown;

    // Process template with variables
    const processedContent = this.processTemplate(templateContent, {
      ...variables,
      ...content,
      'section-title': sectionConfig.name
    });

    return {
      id: sectionConfig.id,
      name: sectionConfig.name,
      content: processedContent,
      order: sectionConfig.order || 0,
      required: sectionConfig.required,
      templateUsed: sectionConfig.id
    };
  }

  /**
   * Process template with variable substitution
   */
  processTemplate(template, variables) {
    let processed = template;

    // Simple variable substitution using {{variable}} syntax
    processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const trimmedName = variableName.trim();

      // Handle array iteration {{#each array}}
      if (trimmedName.startsWith('#each ')) {
        const arrayName = trimmedName.substring(6);
        return this.processArrayIteration(match, arrayName, variables);
      }

      // Handle conditionals {{#if condition}}
      if (trimmedName.startsWith('#if ')) {
        const conditionName = trimmedName.substring(4);
        return this.processConditional(match, conditionName, variables);
      }

      // Handle closing tags
      if (trimmedName.startsWith('/')) {
        return '';
      }

      // Handle else
      if (trimmedName === 'else') {
        return '';
      }

      // Regular variable substitution
      return this.getVariableValue(variables, trimmedName) || match;
    });

    return processed;
  }

  /**
   * Process array iteration in templates
   */
  processArrayIteration(match, arrayName, variables) {
    const array = this.getVariableValue(variables, arrayName);
    if (!Array.isArray(array)) {
      return '';
    }

    // This is a simplified implementation
    // In a real implementation, you'd want to parse the template block properly
    return array.map(item => typeof item === 'string' ? `- ${item}` : JSON.stringify(item)).join('\n');
  }

  /**
   * Process conditional statements in templates
   */
  processConditional(match, conditionName, variables) {
    const value = this.getVariableValue(variables, conditionName);

    // This is a simplified implementation
    // In a real implementation, you'd want to parse the template block properly
    return value ? '' : '<!-- condition not met -->';
  }

  /**
   * Get variable value with dot notation support
   */
  getVariableValue(variables, path) {
    const keys = path.split('.');
    let value = variables;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Prepare template variables from content and context
   */
  prepareTemplateVariables(content, context, template) {
    const variables = {
      // Default variables
      'date': new Date().toLocaleDateString(),
      'timestamp': new Date().toISOString(),
      'version': '1.0',
      'author': context.author || 'System Generated',
      'organization': context.organization || 'Organization',

      // Content-derived variables
      'title': content.title || this.generateTitle(content, context),
      'project-name': context.projectName || 'Project',
      'document-type': template.name,

      // Context variables
      ...context,

      // Content sections
      ...content
    };

    // Add template-specific variables
    if (template.variables) {
      template.variables.forEach(varName => {
        if (!(varName in variables)) {
          variables[varName] = this.getDefaultVariableValue(varName, context);
        }
      });
    }

    return variables;
  }

  /**
   * Generate title from content and context
   */
  generateTitle(content, context) {
    if (content.title) return content.title;
    if (context.projectName) return `${context.projectName} Documentation`;
    return 'Generated Document';
  }

  /**
   * Get default value for template variables
   */
  getDefaultVariableValue(varName, context) {
    const defaults = {
      'version': '1.0',
      'status': 'Draft',
      'distribution': 'Internal',
      'contact-email': context.email || 'contact@organization.com',
      'base-url': context.baseUrl || 'https://api.example.com',
      'project-manager': context.projectManager || 'Project Manager',
      'start-date': new Date().toLocaleDateString(),
      'end-date': new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };

    return defaults[varName] || `[${varName}]`;
  }

  /**
   * Extract section content from generated content
   */
  extractSectionContent(content, sectionId) {
    if (content.sections) {
      const section = content.sections.find(s => s.id === sectionId || s.type === sectionId);
      if (section) {
        return section;
      }
    }

    // Generate section content based on ID
    return this.generateSectionContent(sectionId, content);
  }

  /**
   * Generate section content for missing sections
   */
  generateSectionContent(sectionId, content) {
    const generators = {
      'executive-summary': () => ({
        overview: content.overview || 'This document provides comprehensive documentation for the specified requirements.',
        objectives: content.objectives || ['Define clear requirements', 'Establish success criteria'],
        scope: content.scope || 'This document covers the complete scope of requirements.',
        'success-criteria': content.successCriteria || [
          { criterion: 'Completeness', description: 'All requirements are clearly defined' },
          { criterion: 'Clarity', description: 'Requirements are unambiguous' }
        ]
      }),

      'functional-requirements': () => ({
        'requirements-list': content.requirements || [
          {
            id: 'REQ-001',
            title: 'Primary Functionality',
            priority: 'High',
            category: 'Functional',
            description: 'The system shall provide the primary functionality as specified.',
            'acceptance-criteria': ['Functionality is accessible', 'Performance meets standards'],
            status: 'Draft'
          }
        ]
      }),

      'user-stories-list': () => ({
        stories: content.stories || [
          {
            id: 'US-001',
            title: 'Basic User Interaction',
            persona: 'End User',
            goal: 'interact with the system',
            benefit: 'I can accomplish my tasks efficiently',
            priority: 'High',
            'story-points': 5,
            'acceptance-criteria': [
              {
                given: 'I am an authenticated user',
                when: 'I access the system',
                then: 'I can see the main interface'
              }
            ]
          }
        ]
      })
    };

    return generators[sectionId] ? generators[sectionId]() : { content: `Content for ${sectionId}` };
  }

  /**
   * Apply document-level formatting
   */
  applyDocumentFormatting(sections, template, variables, options) {
    const format = options.format || 'markdown';
    const formatter = this.formatters.get(format);

    if (!formatter) {
      throw new Error(`Unsupported format: ${format}`);
    }

    return formatter.format(sections, template, variables, options);
  }

  /**
   * Format document as Markdown
   */
  formatMarkdown(sections, template, variables, options) {
    let document = '';

    // Add title and metadata
    if (template.formatting.headers) {
      document += `# ${variables.title}\n\n`;
      document += `**Generated:** ${variables.date}  \n`;
      document += `**Version:** ${variables.version}  \n`;
      document += `**Author:** ${variables.author}  \n\n`;
    }

    // Add table of contents if required
    if (template.formatting.toc) {
      document += '## Table of Contents\n\n';
      sections.forEach((section, index) => {
        const number = template.formatting.numbering === 'hierarchical' ? `${index + 1}.` : '-';
        document += `${number} [${section.name}](#${section.name.toLowerCase().replace(/\s+/g, '-')})\n`;
      });
      document += '\n---\n\n';
    }

    // Add sections
    sections.forEach(section => {
      document += section.content + '\n\n';
    });

    // Add footer if required
    if (template.formatting.footers) {
      document += '---\n\n';
      document += `*Document generated by Smart Document Generator v${variables.version}*\n`;
      document += `*Generated on: ${variables.timestamp}*\n`;
    }

    return {
      content: document,
      format: 'markdown',
      sections: sections.map(s => ({ id: s.id, name: s.name, order: s.order })),
      metadata: {
        wordCount: document.split(/\s+/).length,
        characterCount: document.length,
        sectionCount: sections.length
      }
    };
  }

  /**
   * Format document as HTML
   */
  formatHTML(sections, template, variables, options) {
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${variables.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #333; margin-bottom: 30px; padding-bottom: 20px; }
        .section { margin-bottom: 30px; }
        .toc { background: #f5f5f5; padding: 20px; margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>`;

    // Add header
    if (template.formatting.headers) {
      html += `<div class="header">
        <h1>${variables.title}</h1>
        <p><strong>Generated:</strong> ${variables.date}</p>
        <p><strong>Version:</strong> ${variables.version}</p>
        <p><strong>Author:</strong> ${variables.author}</p>
      </div>`;
    }

    // Add table of contents
    if (template.formatting.toc) {
      html += '<div class="toc"><h2>Table of Contents</h2><ul>';
      sections.forEach((section, index) => {
        html += `<li><a href="#section-${section.id}">${section.name}</a></li>`;
      });
      html += '</ul></div>';
    }

    // Add sections
    sections.forEach(section => {
      html += `<div class="section" id="section-${section.id}">`;
      html += section.content;
      html += '</div>';
    });

    // Add footer
    if (template.formatting.footers) {
      html += `<div class="footer">
        <hr>
        <p><em>Document generated by Smart Document Generator</em></p>
        <p><em>Generated on: ${variables.timestamp}</em></p>
      </div>`;
    }

    html += '</body></html>';

    return {
      content: html,
      format: 'html',
      sections: sections.map(s => ({ id: s.id, name: s.name, order: s.order })),
      metadata: {
        wordCount: html.replace(/<[^>]*>/g, '').split(/\s+/).length,
        characterCount: html.length,
        sectionCount: sections.length
      }
    };
  }

  /**
   * Format document as JSON
   */
  formatJSON(sections, template, variables, options) {
    const jsonDoc = {
      metadata: {
        title: variables.title,
        version: variables.version,
        author: variables.author,
        generated: variables.timestamp,
        template: template.id,
        format: 'json'
      },
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        content: section.content,
        order: section.order,
        required: section.required
      })),
      variables
    };

    return {
      content: JSON.stringify(jsonDoc, null, 2),
      format: 'json',
      sections: sections.map(s => ({ id: s.id, name: s.name, order: s.order })),
      metadata: {
        sectionCount: sections.length,
        variableCount: Object.keys(variables).length
      }
    };
  }

  /**
   * Format document as plain text
   */
  formatPlainText(sections, template, variables, options) {
    let text = '';

    // Add header
    text += `${variables.title}\n`;
    text += '='.repeat(variables.title.length) + '\n\n';
    text += `Generated: ${variables.date}\n`;
    text += `Version: ${variables.version}\n`;
    text += `Author: ${variables.author}\n\n`;

    // Add sections
    sections.forEach(section => {
      text += section.name + '\n';
      text += '-'.repeat(section.name.length) + '\n\n';
      text += section.content.replace(/<[^>]*>/g, '').replace(/\*\*(.*?)\*\*/g, '$1') + '\n\n';
    });

    return {
      content: text,
      format: 'text',
      sections: sections.map(s => ({ id: s.id, name: s.name, order: s.order })),
      metadata: {
        wordCount: text.split(/\s+/).length,
        characterCount: text.length,
        sectionCount: sections.length
      }
    };
  }

  /**
   * Load custom templates from directory
   */
  async loadCustomTemplates() {
    // This would load custom templates from files in a real implementation
    // For now, we'll just emit an event indicating custom template loading
    this.emit('custom-templates-loaded', {
      count: 0,
      path: this.config.customTemplatesPath
    });
  }

  /**
   * Determine if section should be included
   */
  shouldIncludeSection(sectionConfig, content, context) {
    // Logic to determine if optional sections should be included
    if (sectionConfig.id === 'market-analysis' && !context.includeMarketAnalysis) {
      return false;
    }

    if (sectionConfig.id === 'automation-strategy' && !context.includeAutomation) {
      return false;
    }

    return true;
  }

  /**
   * Update average render time metric
   */
  updateAverageRenderTime(renderTime) {
    const count = this.templateMetrics.templatesUsed;
    const currentAvg = this.templateMetrics.averageRenderTime;
    this.templateMetrics.averageRenderTime =
      ((currentAvg * (count - 1)) + renderTime) / count;
  }

  /**
   * Get available templates
   */
  getAvailableTemplates() {
    return Array.from(this.templates.values()).map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      description: template.description,
      sections: template.structure.sections.length,
      variables: template.variables?.length || 0
    }));
  }

  /**
   * Get template by ID
   */
  getTemplateById(templateId) {
    return this.templates.get(templateId);
  }

  /**
   * Health check
   */
  healthCheck() {
    return {
      healthy: true,
      service: 'document-template-engine',
      templatesLoaded: this.templates.size,
      formattersAvailable: this.formatters.size,
      metrics: this.templateMetrics
    };
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      ...this.templateMetrics,
      templatesAvailable: this.templates.size,
      formattersAvailable: this.formatters.size,
      cacheSize: this.templateCache.size
    };
  }
}

module.exports = DocumentTemplateEngine;