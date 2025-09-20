# Multi-Agent Development Orchestration

## Overview
This document outlines how to orchestrate multiple Claude agents with specialized roles to efficiently work through the Anvil feature roadmap. Each agent has dedicated responsibilities and can work in parallel or sequentially as needed.

## Agent Roles & Responsibilities

### 1. **Orchestrator Agent** (Primary - YOU)
**Role**: Project manager and coordinator
**Responsibilities**:
- Overall project coordination and planning
- Task assignment and delegation to specialized agents
- Progress tracking and integration
- Code review and quality assurance
- Final testing and deployment decisions

**Tools**: All tools available
**Focus**: High-level coordination, architecture decisions, integration

### 2. **Testing Agent**
**Role**: End-to-end testing specialist
**Responsibilities**:
- Write comprehensive test suites
- Integration testing across frontend-backend
- Performance testing and optimization
- Automated testing infrastructure
- Bug identification and validation
- Test documentation and maintenance

**Tools**: Bash, Read, Write, Edit, WebFetch
**Focus**: Quality assurance, automated testing, CI/CD

### 3. **Frontend Development Agent**
**Role**: React/UI specialist
**Responsibilities**:
- React component development
- UI/UX implementation
- Frontend state management
- Component testing
- Responsive design
- Performance optimization

**Tools**: Read, Write, Edit, MultiEdit, Bash (for build/test)
**Focus**: Client-side development, user experience

### 4. **Backend Development Agent**
**Role**: API and server specialist
**Responsibilities**:
- API endpoint development
- Database operations
- Server-side logic
- Authentication and security
- Performance optimization
- Error handling

**Tools**: Read, Write, Edit, MultiEdit, Bash
**Focus**: Server-side development, data management

### 5. **DevOps Agent**
**Role**: Infrastructure and deployment specialist
**Responsibilities**:
- Build and deployment scripts
- Environment configuration
- Performance monitoring
- Security hardening
- Documentation
- Backup and recovery

**Tools**: Bash, Read, Write, Edit, WebFetch
**Focus**: Infrastructure, deployment, monitoring

## Orchestration Strategies

### Strategy 1: Sequential Development
```
Orchestrator → Backend Agent → Frontend Agent → Testing Agent → DevOps Agent
```
- Best for: New features requiring full stack changes
- Use when: Dependencies are clear and linear

### Strategy 2: Parallel Development
```
Orchestrator splits work:
├── Backend Agent (API development)
├── Frontend Agent (UI components)
└── Testing Agent (test framework)
```
- Best for: Independent feature development
- Use when: Features can be developed in isolation

### Strategy 3: Feature Team Approach
```
Feature X Team: Backend + Frontend + Testing agents
Feature Y Team: Backend + Frontend + Testing agents
Orchestrator: Coordination + Integration
```
- Best for: Multiple large features
- Use when: Complex roadmap with parallel workstreams

## Communication Protocols

### Task Delegation Format
When delegating to an agent, use this format:

```markdown
## Agent Assignment: [AGENT_TYPE]
**Feature**: [Feature Name]
**Phase**: [Roadmap Phase]
**Priority**: [High/Medium/Low]
**Dependencies**: [List any dependencies]

### Task Description
[Detailed description of what needs to be done]

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Requirements
- [Specific technical constraints]
- [Performance requirements]
- [Security considerations]

### Files to Modify/Create
- [List of files]

### Testing Requirements
- [What testing is needed]

### Definition of Done
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Code reviewed
```

### Progress Reporting Format
Agents should report back using:

```markdown
## Progress Report: [AGENT_TYPE]
**Task**: [Task Name]
**Status**: [In Progress/Completed/Blocked]
**Progress**: [X% complete]

### Completed Work
- [List completed items]

### Current Work
- [What's currently being worked on]

### Next Steps
- [Planned next actions]

### Issues/Blockers
- [Any problems encountered]

### Integration Points
- [What other agents need to know]
```

## Roadmap Agent Assignments

### Phase 1: Accuracy & Validation ✅ (Completed)
- **Backend Agent**: Requirements Precision Engine API
- **Frontend Agent**: Validation UI components
- **Testing Agent**: ✅ Integration tests implemented

### Phase 2: Optimization & Performance
**Parallel Assignment**:
- **Backend Agent**: Concurrent processing, caching, database optimization
- **Frontend Agent**: Component optimization, lazy loading, performance monitoring
- **Testing Agent**: Performance benchmarks, load testing
- **DevOps Agent**: Server optimization, monitoring setup

### Phase 3: Collaboration & Workflow
**Feature Team Assignment**:
- **Team A**: Real-time collaboration
  - Backend: WebSocket implementation, conflict resolution
  - Frontend: Real-time UI updates, collaborative editing
  - Testing: Real-time testing scenarios
- **Team B**: Workflow automation
  - Backend: Workflow engine, triggers
  - Frontend: Workflow builder UI
  - Testing: Workflow integration tests

### Phase 4: AI & Intelligence
**Sequential Assignment**:
1. **Backend Agent**: AI service integration, model management
2. **Frontend Agent**: AI-powered UI components
3. **Testing Agent**: AI testing strategies, model validation

### Phase 5: Platform & Extensibility
**Full Team Assignment**:
- **Backend Agent**: Plugin architecture, API versioning
- **Frontend Agent**: Plugin UI framework, theme system
- **Testing Agent**: Plugin testing framework
- **DevOps Agent**: Plugin deployment, marketplace infrastructure

## Implementation Commands

### Starting a New Phase
```bash
# Orchestrator creates phase plan
npm run roadmap:plan --phase=2

# Assigns tasks to agents (conceptual - you would start new Claude conversations)
npm run agent:assign --agent=backend --phase=2 --feature=performance
npm run agent:assign --agent=frontend --phase=2 --feature=optimization
npm run agent:assign --agent=testing --phase=2 --feature=benchmarks
```

### Monitoring Progress
```bash
# Validation before proceeding
npm run validate

# Integration testing
npm run test:integration

# Performance testing
npm run test:performance
```

### Integration Points
```bash
# When agents complete work
npm run integrate:backend
npm run integrate:frontend
npm run validate:integration
```

## Quality Gates

### Before Agent Assignment
- [ ] Clear task definition
- [ ] Acceptance criteria defined
- [ ] Dependencies identified
- [ ] Integration plan exists

### During Development
- [ ] Regular progress check-ins
- [ ] Continuous integration testing
- [ ] Code review checkpoints
- [ ] Performance monitoring

### Before Integration
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Security requirements validated
- [ ] Documentation complete

### After Integration
- [ ] End-to-end testing complete
- [ ] Performance regression testing
- [ ] User acceptance validation
- [ ] Deployment readiness confirmed

## Agent Context Sharing

### Shared Knowledge Base
All agents should have access to:
- **FEATURE_SYSTEM_GUIDE.md** - Architecture documentation
- **API documentation** - Backend interface specifications
- **Component library** - Frontend component standards
- **Test patterns** - Testing conventions and utilities
- **Performance baselines** - Benchmarks and targets

### Context Handoff Format
When handing off between agents:

```markdown
## Context Handoff: [FROM_AGENT] → [TO_AGENT]
**Feature**: [Feature Name]
**Handoff Point**: [What's complete]

### Completed Work
- [Files modified/created]
- [APIs implemented]
- [Tests added]

### Current State
- [What's working]
- [What's tested]
- [What's documented]

### Next Agent Tasks
- [Specific tasks for receiving agent]
- [Integration points to consider]
- [Dependencies to be aware of]

### Key Decisions Made
- [Architecture decisions]
- [Trade-offs made]
- [Patterns established]
```

## Benefits of This Approach

1. **Specialization**: Each agent becomes expert in their domain
2. **Parallelization**: Multiple features can be developed simultaneously
3. **Quality**: Dedicated testing agent ensures comprehensive validation
4. **Efficiency**: Reduced context switching and focused work
5. **Scalability**: Easy to add more agents for larger projects
6. **Consistency**: Standardized processes and communication

## Getting Started

1. **Plan the phase** with the Orchestrator agent (you)
2. **Create task specifications** for each specialized agent
3. **Start new Claude conversations** for each agent role
4. **Provide specialized context** and task assignments
5. **Monitor progress** and coordinate integration
6. **Validate integration** with comprehensive testing

This orchestration approach ensures we never have the integration issues we just fixed, as each agent has clear responsibilities and the Testing Agent specifically validates all integrations before they're considered complete.