/**
 * AI-Powered Template Generation Engine
 * Generates intelligent templates based on industry best practices and context
 */

const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class TemplateEngine {
    constructor() {
        this.templateCache = new Map();
        this.industryPatterns = new Map();
        this.usageAnalytics = new Map();
        this.initializeIndustryPatterns();
    }

    /**
     * Initialize industry-specific patterns and best practices
     */
    initializeIndustryPatterns() {
        this.industryPatterns.set('automotive', {
            commonCapabilities: ['Vehicle Control', 'Safety Systems', 'Diagnostics', 'Connectivity'],
            namingConventions: {
                prefix: 'VEH',
                categoryPrefixes: {
                    safety: 'SAF',
                    control: 'CTL',
                    diagnostics: 'DIAG',
                    connectivity: 'CONN'
                }
            },
            requiredSections: ['Safety Requirements', 'Performance Metrics', 'Compliance Standards'],
            priorities: ['Safety', 'Performance', 'Compliance', 'User Experience']
        });

        this.industryPatterns.set('healthcare', {
            commonCapabilities: ['Patient Management', 'Data Privacy', 'Compliance', 'Integration'],
            namingConventions: {
                prefix: 'MED',
                categoryPrefixes: {
                    patient: 'PAT',
                    data: 'DATA',
                    compliance: 'COMP',
                    integration: 'INT'
                }
            },
            requiredSections: ['Privacy Requirements', 'Regulatory Compliance', 'Security Measures'],
            priorities: ['Privacy', 'Security', 'Compliance', 'Usability']
        });

        this.industryPatterns.set('fintech', {
            commonCapabilities: ['Transaction Processing', 'Fraud Detection', 'Compliance', 'User Authentication'],
            namingConventions: {
                prefix: 'FIN',
                categoryPrefixes: {
                    transaction: 'TXN',
                    security: 'SEC',
                    compliance: 'COMP',
                    user: 'USER'
                }
            },
            requiredSections: ['Security Requirements', 'Regulatory Compliance', 'Audit Trail'],
            priorities: ['Security', 'Compliance', 'Performance', 'Reliability']
        });

        this.industryPatterns.set('general', {
            commonCapabilities: ['User Management', 'Data Processing', 'API Integration', 'Reporting'],
            namingConventions: {
                prefix: 'GEN',
                categoryPrefixes: {
                    user: 'USER',
                    data: 'DATA',
                    api: 'API',
                    report: 'RPT'
                }
            },
            requiredSections: ['Technical Requirements', 'Performance Criteria', 'Integration Points'],
            priorities: ['Functionality', 'Performance', 'Maintainability', 'Scalability']
        });
    }

    /**
     * Generate a smart template based on context and requirements
     */
    async generateTemplate(options) {
        const {
            type = 'capability', // capability or enabler
            industry = 'general',
            category = 'general',
            name,
            description,
            complexity = 'medium',
            customRequirements = [],
            dependencies = [],
            targetAudience = 'technical'
        } = options;

        try {
            const templateId = this.generateTemplateId(type, industry, category);
            const industryPattern = this.industryPatterns.get(industry) || this.industryPatterns.get('general');

            let template;
            if (type === 'capability') {
                template = await this.generateCapabilityTemplate({
                    templateId,
                    industry,
                    category,
                    name,
                    description,
                    complexity,
                    customRequirements,
                    dependencies,
                    targetAudience,
                    industryPattern
                });
            } else {
                template = await this.generateEnablerTemplate({
                    templateId,
                    industry,
                    category,
                    name,
                    description,
                    complexity,
                    customRequirements,
                    dependencies,
                    targetAudience,
                    industryPattern
                });
            }

            // Cache the generated template
            this.templateCache.set(templateId, {
                template,
                metadata: {
                    created: new Date(),
                    type,
                    industry,
                    category,
                    complexity,
                    usage: 0
                }
            });

            // Track analytics
            this.trackTemplateGeneration(type, industry, category);

            return {
                templateId,
                template,
                metadata: {
                    type,
                    industry,
                    category,
                    complexity,
                    relevanceScore: this.calculateRelevanceScore(options, industryPattern)
                }
            };

        } catch (error) {
            throw new Error(`Template generation failed: ${error.message}`);
        }
    }

    /**
     * Generate a capability template with AI-driven customization
     */
    async generateCapabilityTemplate(options) {
        const { templateId, industry, name, description, industryPattern, complexity, customRequirements, dependencies } = options;

        const date = new Date().toISOString().split('T')[0];
        const priority = this.determinePriority(complexity, industry);
        const sections = this.generateCustomSections(industryPattern, customRequirements);
        const dependencyDiagram = this.generateDependencyDiagram(templateId, dependencies);

        return `# ${name || '[Capability Name]'}

## Metadata
- **Name**: ${name || '[Capability Name]'}
- **Type**: Capability
- **System**: [System Name]
- **Component**: [Component Name]
- **ID**: ${templateId}
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: ${priority}
- **Analysis Review**: Required
- **Owner**: Product Team
- **Created Date**: ${date}
- **Last Updated**: ${date}
- **Version**: 1.0
- **Industry**: ${industry}
- **Template Generated**: AI-Generated Template v1.0

## Technical Overview
### Purpose
${description || 'AI-Generated: This capability provides essential functionality for the system, designed to meet industry standards and best practices.'}

### Key Features
${this.generateKeyFeatures(industry, industryPattern)}

## Enablers
List of enablers that implement this capability:

| Enabler ID | Name | Description | Status | Approval | Priority |
|------------|------|-------------|--------|----------|----------|
| ENB-${this.generateShortId()} | ${name} Core Engine | Core implementation of ${name} functionality | In Draft | Not Approved | High |
| ENB-${this.generateShortId()} | ${name} API Interface | API endpoints for ${name} | In Draft | Not Approved | Medium |
| ENB-${this.generateShortId()} | ${name} Data Layer | Data management for ${name} | In Draft | Not Approved | Medium |

## Dependencies
### Internal Upstream Dependency
| Capability ID | Name | Description |
|---------------|------|-------------|
${dependencies.internal?.upstream?.map(dep => `| ${dep.id || 'CAP-XXXXX'} | ${dep.name} | ${dep.description} |`).join('\n') || '| CAP-XXXXX | [Dependency Name] | [Description] |'}

### Internal Downstream Impact
| Capability ID | Name | Description |
|---------------|------|-------------|
${dependencies.internal?.downstream?.map(dep => `| ${dep.id || 'CAP-XXXXX'} | ${dep.name} | ${dep.description} |`).join('\n') || '| CAP-XXXXX | [Dependent Capability] | [Description] |'}

### External Upstream Dependencies
${dependencies.external?.upstream?.map(dep => `- ${dep.name || dep}`).join('\n') || '- [External dependency as needed]'}

### External Downstream Impact
${dependencies.external?.downstream?.map(dep => `- ${dep.name || dep}`).join('\n') || '- [External systems that depend on this capability]'}

## Technical Specifications

### Capability Dependency Flow Diagram
${dependencyDiagram}

${sections}

# Development Plan
[Standard development plan sections would follow...]

## Quality Metrics
- **Relevance Score**: ${this.calculateRelevanceScore(options, industryPattern)}%
- **Industry Alignment**: ${industry.charAt(0).toUpperCase() + industry.slice(1)}
- **Complexity Rating**: ${complexity}
- **Template Version**: AI-Generated v1.0

---
*This template was generated by Anvil's AI Template Engine*
`;
    }

    /**
     * Generate an enabler template with smart defaults
     */
    async generateEnablerTemplate(options) {
        const { templateId, industry, name, description, industryPattern, complexity, customRequirements } = options;

        const date = new Date().toISOString().split('T')[0];
        const priority = this.determinePriority(complexity, industry);
        const requirements = this.generateSmartRequirements(industryPattern, customRequirements, complexity);

        return `# ${name || '[Enabler Name]'}

## Metadata
- **Name**: ${name || '[Enabler Name]'}
- **Type**: Enabler
- **ID**: ${templateId}
- **Capability ID**: CAP-XXXXXX (Parent Capability)
- **Status**: In Draft
- **Approval**: Not Approved
- **Priority**: ${priority}
- **Analysis Review**: Required
- **Code Review**: ${complexity === 'high' ? 'Required' : 'Not Required'}
- **Owner**: Product Team
- **Developer**: [Development Team/Lead]
- **Created Date**: ${date}
- **Last Updated**: ${date}
- **Version**: 1.0
- **Industry**: ${industry}
- **Template Generated**: AI-Generated Template v1.0

## Technical Overview
### Purpose
${description || 'AI-Generated: This enabler implements specific functionality to support the parent capability, following industry best practices.'}

### Key Implementation Areas
${this.generateImplementationAreas(industry, industryPattern)}

## Functional Requirements
${requirements.functional}

## Non-Functional Requirements
${requirements.nonFunctional}

# Technical Specifications

## Architecture Overview
${this.generateArchitectureOverview(industry, complexity)}

## API Technical Specifications
${this.generateAPISpecifications(industry, name)}

## Implementation Guidelines
${this.generateImplementationGuidelines(industryPattern, complexity)}

# Development Plan
[Standard enabler development plan sections would follow...]

## Quality Metrics
- **Relevance Score**: ${this.calculateRelevanceScore(options, industryPattern)}%
- **Industry Alignment**: ${industry.charAt(0).toUpperCase() + industry.slice(1)}
- **Complexity Rating**: ${complexity}
- **Template Version**: AI-Generated v1.0

---
*This template was generated by Anvil's AI Template Engine*
`;
    }

    /**
     * Generate template ID based on type and context
     */
    generateTemplateId(type, industry, category) {
        const typePrefix = type === 'capability' ? 'CAP' : 'ENB';
        const industryPattern = this.industryPatterns.get(industry);
        const prefix = industryPattern?.namingConventions?.prefix || 'GEN';
        const categoryPrefix = industryPattern?.namingConventions?.categoryPrefixes?.[category] || '';

        const timestamp = Date.now().toString().slice(-6);
        return `${typePrefix}-${prefix}${categoryPrefix ? '-' + categoryPrefix : ''}-${timestamp}`;
    }

    /**
     * Generate short ID for sub-components
     */
    generateShortId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    /**
     * Determine priority based on complexity and industry
     */
    determinePriority(complexity, industry) {
        if (industry === 'automotive' || industry === 'healthcare') {
            return complexity === 'low' ? 'Medium' : 'High';
        }

        switch (complexity) {
            case 'low': return 'Low';
            case 'medium': return 'Medium';
            case 'high': return 'High';
            default: return 'Medium';
        }
    }

    /**
     * Generate key features based on industry patterns
     */
    generateKeyFeatures(industry, industryPattern) {
        const features = industryPattern.commonCapabilities || ['Core Functionality'];
        return features.map(feature => `- ${feature} implementation`).join('\n');
    }

    /**
     * Generate implementation areas for enablers
     */
    generateImplementationAreas(industry, industryPattern) {
        const areas = [
            'Core business logic implementation',
            'Data persistence and retrieval',
            'API endpoint development',
            'Integration with external systems'
        ];

        if (industry === 'automotive') {
            areas.push('Safety-critical system compliance');
            areas.push('Real-time performance optimization');
        } else if (industry === 'healthcare') {
            areas.push('Privacy and security measures');
            areas.push('Regulatory compliance validation');
        } else if (industry === 'fintech') {
            areas.push('Financial transaction security');
            areas.push('Audit trail implementation');
        }

        return areas.map(area => `- ${area}`).join('\n');
    }

    /**
     * Generate smart requirements based on industry and complexity
     */
    generateSmartRequirements(industryPattern, customRequirements, complexity) {
        const functionalReqs = [];
        const nonFunctionalReqs = [];

        // Base functional requirements
        functionalReqs.push({
            id: 'FR-001',
            name: 'Core Functionality',
            requirement: 'System shall provide the core business functionality as specified',
            priority: 'High'
        });

        functionalReqs.push({
            id: 'FR-002',
            name: 'Data Management',
            requirement: 'System shall manage data persistence and retrieval operations',
            priority: 'High'
        });

        functionalReqs.push({
            id: 'FR-003',
            name: 'API Interface',
            requirement: 'System shall provide RESTful API endpoints for external integration',
            priority: 'Medium'
        });

        // Industry-specific functional requirements
        if (industryPattern.requiredSections) {
            industryPattern.requiredSections.forEach((section, index) => {
                functionalReqs.push({
                    id: `FR-${String(index + 10).padStart(3, '0')}`,
                    name: section,
                    requirement: `System shall implement ${section.toLowerCase()} functionality`,
                    priority: 'High'
                });
            });
        }

        // Base non-functional requirements
        nonFunctionalReqs.push({
            id: 'NFR-001',
            name: 'Performance',
            type: 'Performance',
            requirement: complexity === 'high' ? 'Response time < 100ms for 95% of requests' : 'Response time < 500ms for 95% of requests',
            priority: 'High'
        });

        nonFunctionalReqs.push({
            id: 'NFR-002',
            name: 'Availability',
            type: 'Reliability',
            requirement: complexity === 'high' ? '99.9% uptime' : '99.5% uptime',
            priority: 'Medium'
        });

        nonFunctionalReqs.push({
            id: 'NFR-003',
            name: 'Scalability',
            type: 'Scalability',
            requirement: 'System shall support horizontal scaling to handle increased load',
            priority: 'Medium'
        });

        // Add custom requirements
        customRequirements.forEach((req, index) => {
            if (req.type === 'functional') {
                functionalReqs.push({
                    id: `FR-${String(index + 100).padStart(3, '0')}`,
                    name: req.name,
                    requirement: req.description,
                    priority: req.priority || 'Medium'
                });
            } else {
                nonFunctionalReqs.push({
                    id: `NFR-${String(index + 100).padStart(3, '0')}`,
                    name: req.name,
                    type: req.category || 'General',
                    requirement: req.description,
                    priority: req.priority || 'Medium'
                });
            }
        });

        return {
            functional: this.formatRequirementsTable(functionalReqs, 'functional'),
            nonFunctional: this.formatRequirementsTable(nonFunctionalReqs, 'non-functional')
        };
    }

    /**
     * Format requirements as markdown table
     */
    formatRequirementsTable(requirements, type) {
        if (type === 'functional') {
            let table = '| ID | Name | Requirement | Priority | Status | Approval |\n';
            table += '|----|------|-------------|----------|--------|-----------|\n';
            requirements.forEach(req => {
                table += `| ${req.id} | ${req.name} | ${req.requirement} | ${req.priority} | In Draft | Not Approved |\n`;
            });
            return table;
        } else {
            let table = '| ID | Name | Type | Requirement | Priority | Status | Approval |\n';
            table += '|----|------|------|-------------|----------|--------|-----------|\n';
            requirements.forEach(req => {
                table += `| ${req.id} | ${req.name} | ${req.type} | ${req.requirement} | ${req.priority} | In Draft | Not Approved |\n`;
            });
            return table;
        }
    }

    /**
     * Generate custom sections based on industry patterns
     */
    generateCustomSections(industryPattern, customRequirements) {
        let sections = '';

        if (industryPattern.requiredSections) {
            industryPattern.requiredSections.forEach(section => {
                sections += `\n## ${section}\n`;
                sections += `*AI-Generated Section: This section addresses ${section.toLowerCase()} specific to the ${industryPattern.prefix || 'system'} industry.*\n\n`;
                sections += `### Implementation Requirements\n`;
                sections += `- Implement industry-standard ${section.toLowerCase()} practices\n`;
                sections += `- Ensure compliance with relevant regulations\n`;
                sections += `- Maintain documentation and audit trails\n\n`;
            });
        }

        return sections;
    }

    /**
     * Generate dependency diagram
     */
    generateDependencyDiagram(currentCapId, dependencies) {
        return `\`\`\`mermaid
flowchart TD
    %% Current Capability
    ${currentCapId}["${currentCapId}<br/>Current Capability<br/>🎯"]

    %% Dependencies would be added based on the dependencies parameter
    %% This is a placeholder structure

    classDef current fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    class ${currentCapId} current
\`\`\``;
    }

    /**
     * Generate architecture overview
     */
    generateArchitectureOverview(industry, complexity) {
        const baseArchitecture = `### System Architecture
This enabler follows a ${complexity === 'high' ? 'microservices' : 'modular monolithic'} architecture pattern.

#### Key Components:
- **Service Layer**: Business logic implementation
- **Data Layer**: Data persistence and management
- **API Layer**: External interface and communication
- **Integration Layer**: Third-party system connectivity`;

        if (industry === 'automotive') {
            return baseArchitecture + `
- **Safety Layer**: Safety-critical system monitoring
- **Real-time Layer**: Time-sensitive operation handling`;
        } else if (industry === 'healthcare') {
            return baseArchitecture + `
- **Security Layer**: Privacy and encryption services
- **Compliance Layer**: Regulatory requirement validation`;
        } else if (industry === 'fintech') {
            return baseArchitecture + `
- **Security Layer**: Financial transaction security
- **Audit Layer**: Transaction logging and monitoring`;
        }

        return baseArchitecture;
    }

    /**
     * Generate API specifications
     */
    generateAPISpecifications(industry, name) {
        const baseName = name || 'Resource';
        return `| API Type | Operation | Channel / Endpoint | Description | Request / Publish Payload | Response / Subscribe Data |
|----------|-----------|---------------------|-------------|----------------------------|----------------------------|
| **REST** | GET | \`/api/v1/${baseName.toLowerCase()}\` | Get ${baseName} list | N/A | ${baseName} array |
| REST | GET | \`/api/v1/${baseName.toLowerCase()}/{id}\` | Get specific ${baseName} | N/A | ${baseName} object |
| REST | POST | \`/api/v1/${baseName.toLowerCase()}\` | Create ${baseName} | ${baseName} data | Created ${baseName} |
| REST | PUT | \`/api/v1/${baseName.toLowerCase()}/{id}\` | Update ${baseName} | Updated data | Updated ${baseName} |
| REST | DELETE | \`/api/v1/${baseName.toLowerCase()}/{id}\` | Delete ${baseName} | N/A | Success/Error message |`;
    }

    /**
     * Generate implementation guidelines
     */
    generateImplementationGuidelines(industryPattern, complexity) {
        let guidelines = `### Development Standards
- Follow industry best practices for ${industryPattern.prefix || 'general'} systems
- Implement comprehensive error handling and logging
- Ensure proper input validation and sanitization
- Write unit tests with minimum 80% coverage`;

        if (complexity === 'high') {
            guidelines += `
- Implement integration tests for all external dependencies
- Set up performance monitoring and alerting
- Document all APIs with OpenAPI/Swagger specifications
- Implement circuit breaker pattern for external calls`;
        }

        if (industryPattern.priorities) {
            guidelines += `\n\n### Priority Guidelines\nImplementation should prioritize:\n`;
            industryPattern.priorities.forEach((priority, index) => {
                guidelines += `${index + 1}. ${priority}\n`;
            });
        }

        return guidelines;
    }

    /**
     * Calculate relevance score for template
     */
    calculateRelevanceScore(options, industryPattern) {
        let score = 70; // Base score

        // Industry alignment
        if (options.industry && options.industry !== 'general') {
            score += 15;
        }

        // Custom requirements provided
        if (options.customRequirements && options.customRequirements.length > 0) {
            score += 10;
        }

        // Dependencies specified
        if (options.dependencies && Object.keys(options.dependencies).length > 0) {
            score += 5;
        }

        return Math.min(score, 100);
    }

    /**
     * Track template generation analytics
     */
    trackTemplateGeneration(type, industry, category) {
        const key = `${type}-${industry}-${category}`;
        const current = this.usageAnalytics.get(key) || 0;
        this.usageAnalytics.set(key, current + 1);
    }

    /**
     * Get template recommendations based on usage patterns
     */
    getTemplateRecommendations(userContext) {
        const recommendations = [];

        // Sort by usage frequency
        const sortedUsage = Array.from(this.usageAnalytics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        sortedUsage.forEach(([key, usage]) => {
            const [type, industry, category] = key.split('-');
            recommendations.push({
                type,
                industry,
                category,
                usage,
                relevanceScore: this.calculateContextRelevance(userContext, { type, industry, category })
            });
        });

        return recommendations;
    }

    /**
     * Calculate context relevance for recommendations
     */
    calculateContextRelevance(userContext, template) {
        let relevance = 50; // Base relevance

        if (userContext.industry === template.industry) {
            relevance += 30;
        }

        if (userContext.preferredComplexity === template.complexity) {
            relevance += 20;
        }

        return Math.min(relevance, 100);
    }

    /**
     * Save template to filesystem
     */
    async saveTemplate(templateId, content, metadata) {
        try {
            const templatesDir = path.join(__dirname, '..', 'templates', 'generated');
            await fs.ensureDir(templatesDir);

            const filename = `${templateId.toLowerCase()}-${metadata.type}.md`;
            const filepath = path.join(templatesDir, filename);

            await fs.writeFile(filepath, content);

            // Save metadata
            const metadataFile = path.join(templatesDir, `${templateId.toLowerCase()}-metadata.json`);
            await fs.writeJSON(metadataFile, metadata, { spaces: 2 });

            return filepath;
        } catch (error) {
            throw new Error(`Failed to save template: ${error.message}`);
        }
    }

    /**
     * Load template from filesystem
     */
    async loadTemplate(templateId) {
        try {
            const templatesDir = path.join(__dirname, '..', 'templates', 'generated');
            const metadataFile = path.join(templatesDir, `${templateId.toLowerCase()}-metadata.json`);

            const metadata = await fs.readJSON(metadataFile);
            const filename = `${templateId.toLowerCase()}-${metadata.type}.md`;
            const filepath = path.join(templatesDir, filename);

            const content = await fs.readFile(filepath, 'utf8');

            return { content, metadata };
        } catch (error) {
            throw new Error(`Failed to load template: ${error.message}`);
        }
    }

    /**
     * Set community manager for integration
     */
    setCommunityManager(communityManager) {
        this.communityManager = communityManager;
    }
}

module.exports = TemplateEngine;