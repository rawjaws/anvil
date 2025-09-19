# Project Discovery Guide for Anvil

## Overview
This guide provides instructions for analyzing existing projects and creating structured Capabilities and Enablers within the Anvil framework. Use this when examining codebases, applications, or systems to reverse-engineer their architecture into Anvil's capability-driven format.

## Discovery Process

### Phase 1: Project Analysis
1. **Examine Project Structure**
   - Review directory structure and file organization
   - Identify main application components, modules, and services
   - Look for configuration files, documentation, and build scripts
   - Note frameworks, libraries, and technologies used

2. **Identify Core Functionality**
   - Analyze entry points (main files, startup scripts)
   - Review API endpoints, routes, or service interfaces
   - Examine data models, schemas, and database structures
   - Identify user-facing features and business logic

3. **Map Dependencies**
   - Internal component relationships
   - External service integrations
   - Database dependencies
   - Third-party library usage

### Phase 2: Capability Identification

#### What is a Capability?
A Capability represents a high-level business function or feature that delivers value to users. It's composed of multiple Enablers that work together to implement the capability.

#### Capability Discovery Rules:
- **Business Value Focus**: Each capability should represent a distinct business function
- **User-Centric**: Capabilities should be meaningful to end users or business stakeholders
- **Independence**: Capabilities should be largely self-contained with clear boundaries
- **Granularity**: Not too broad (entire application) or too narrow (single function)

#### Common Capability Patterns:
- **User Management**: Authentication, authorization, user profiles
- **Data Management**: CRUD operations for core business entities
- **Integration**: External service connections, API management
- **Reporting**: Analytics, dashboards, data visualization
- **Communication**: Notifications, messaging, alerts
- **Security**: Access control, encryption, audit logging
- **Configuration**: Settings, preferences, system configuration

### Phase 3: Enabler Identification

#### What is an Enabler?
An Enabler is a specific technical implementation that contributes to a Capability. It represents concrete functionality, components, or services.

#### Enabler Discovery Rules:
- **Technical Focus**: Enablers represent actual code components, services, or implementations
- **Capability Alignment**: Each enabler must belong to exactly one capability
- **Implementation Specific**: Maps to actual files, classes, modules, or services
- **Testable**: Should have clear inputs, outputs, and testable behavior

#### Common Enabler Patterns:
- **API Endpoints**: REST endpoints, GraphQL resolvers
- **Database Operations**: Data access layers, repositories
- **User Interface Components**: Pages, forms, components
- **Business Logic**: Services, validators, processors
- **Infrastructure**: Configuration, deployment, monitoring
- **Security Components**: Authentication handlers, authorization middleware

### Phase 4: Documentation Generation

#### For Each Capability:
1. **Identify the capability name** (business-focused, user-meaningful)
2. **Write a clear purpose statement** explaining the business value
3. **List all enablers** that implement this capability
4. **Map dependencies** to other capabilities
5. **Assess current status** based on implementation completeness

#### For Each Enabler:
1. **Identify the enabler name** (technical, implementation-focused)
2. **Link to parent capability**
3. **Define functional requirements** (what it does)
4. **Define non-functional requirements** (performance, security, etc.)
5. **Map to actual code components** (files, classes, services)

## Implementation Guidelines

### Capability Creation:
```
Name: [Business Function Name]
Purpose: [Clear business value statement]
Status: [Current implementation state]
Priority: [Business importance]
Dependencies: [Other capabilities this depends on]
```

### Enabler Creation:
```
Name: [Technical Component Name]
Capability: [Parent capability ID]
Purpose: [Technical function description]
Implementation: [Code location/component reference]
Requirements: [Functional and non-functional needs]
```

### Status Assessment:
- **In Draft**: Concept identified but not implemented
- **Ready for Analysis**: Requirements clear, ready for detailed planning
- **Ready for Design**: Analysis complete, ready for technical design
- **Ready for Implementation**: Design complete, ready for development
- **Implemented**: Fully functional and deployed

### Priority Assessment:
- **High**: Critical business function, system cannot operate without it
- **Medium**: Important feature that enhances value but system can function without it
- **Low**: Nice-to-have feature or optimization

## Discovery Templates

### Capability Discovery Template:
```markdown
# [Capability Name]

## Business Value
[What business problem does this solve? What value does it provide?]

## Current Implementation
[How is this currently implemented in the project?]

## Components Involved
[List the main code components, files, or services]

## User Impact
[How do users interact with this capability?]

## Dependencies
[What other capabilities or external services does this depend on?]
```

### Enabler Discovery Template:
```markdown
# [Enabler Name]

## Technical Purpose
[What specific technical function does this provide?]

## Code Location
[Files, classes, modules, or services that implement this]

## API/Interface
[How other components interact with this enabler]

## Data Requirements
[What data does it need? What data does it produce?]

## External Dependencies
[Libraries, services, or systems it depends on]
```

## Common Patterns and Examples

### Web Application Discovery:
1. **User Authentication Capability**
   - Login/Logout Enabler (login endpoints, session management)
   - Password Management Enabler (reset, change password)
   - User Registration Enabler (signup process, validation)

2. **Content Management Capability**
   - Content Creation Enabler (forms, editors, file upload)
   - Content Storage Enabler (database operations, file storage)
   - Content Display Enabler (rendering, formatting, search)

### API Service Discovery:
1. **Data Processing Capability**
   - Data Ingestion Enabler (input validation, parsing)
   - Data Transformation Enabler (business logic, calculations)
   - Data Output Enabler (formatting, serialization)

2. **System Integration Capability**
   - External API Client Enabler (HTTP clients, API wrappers)
   - Data Synchronization Enabler (sync logic, conflict resolution)
   - Event Processing Enabler (webhooks, message queues)

### Database Application Discovery:
1. **Data Management Capability**
   - Schema Management Enabler (migrations, structure)
   - Query Interface Enabler (ORM, query builders)
   - Data Validation Enabler (constraints, business rules)

## Quality Checklist

### Capability Quality:
- [ ] Has clear business value
- [ ] Is meaningful to stakeholders
- [ ] Has defined scope and boundaries
- [ ] Maps to user-facing functionality
- [ ] Has measurable success criteria

### Enabler Quality:
- [ ] Has specific technical purpose
- [ ] Maps to actual code components
- [ ] Has clear inputs and outputs
- [ ] Belongs to exactly one capability
- [ ] Can be independently tested

### Documentation Quality:
- [ ] Uses consistent naming conventions
- [ ] Includes all required metadata
- [ ] Has clear dependency relationships
- [ ] Status accurately reflects implementation
- [ ] Priority aligns with business importance

## Integration with Anvil

### Using Templates:
1. Start with capability-template.md for each identified capability
2. Use enabler-template.md for each identified enabler
3. Fill in discovered information following template structure
4. Ensure all metadata fields are completed accurately

### Workflow Integration:
1. Create capabilities first to establish high-level structure
2. Create enablers and link them to parent capabilities
3. Update capability enabler tables with discovered enablers
4. Review and validate all relationships and dependencies
5. Assess implementation status and set development priorities

### Continuous Discovery:
- Update documentation as project evolves
- Regular reviews to identify new capabilities/enablers
- Refactor when capabilities become too complex
- Split enablers when they become too broad

This discovery process ensures that existing projects can be systematically analyzed and documented within Anvil's capability-driven framework, providing clear visibility into system architecture and enabling better planning for future development.