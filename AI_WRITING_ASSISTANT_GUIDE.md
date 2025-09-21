# AI Writing Assistant - Comprehensive Guide

## Overview

The AI Writing Assistant is Anvil Phase 5's intelligent requirements authoring system that transforms how teams create, refine, and optimize product requirements. Using advanced Natural Language Processing (NLP) and machine learning, it provides real-time writing assistance, quality analysis, and intelligent automation.

## Table of Contents

1. [Core Features](#core-features)
2. [Getting Started](#getting-started)
3. [Natural Language Processing](#natural-language-processing)
4. [Smart Autocomplete](#smart-autocomplete)
5. [Quality Analysis](#quality-analysis)
6. [Template Intelligence](#template-intelligence)
7. [API Reference](#api-reference)
8. [Configuration](#configuration)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Core Features

### 🧠 Natural Language Processing
Convert plain English descriptions into structured, professional requirements using advanced NLP algorithms.

**Key Capabilities:**
- Intelligent requirement type detection
- Entity extraction (stakeholders, actions, objects, conditions)
- Structured requirement generation
- Confidence scoring and validation

### ⚡ Smart Autocomplete
Context-aware real-time suggestions that understand document type, writing patterns, and industry standards.

**Features:**
- Sub-200ms response times
- Template-based suggestions
- Contextual word completion
- Structure pattern completion

### 📊 Quality Analysis
Comprehensive writing quality assessment with actionable improvement suggestions.

**Analysis Areas:**
- Readability scoring (Flesch Reading Ease)
- Clarity and specificity metrics
- Completeness assessment
- Tone and structure analysis

### 📝 Template Intelligence
Dynamic template recommendations based on content analysis and writing context.

**Template Types:**
- Functional Requirements
- Non-Functional Requirements
- Acceptance Criteria
- Constraint Requirements

## Getting Started

### Prerequisites
- Anvil Phase 5 installation
- AI services enabled in configuration
- Valid API key for AI services

### Basic Setup

1. **Enable AI Writing Assistant**
```json
{
  "ai": {
    "writingAssistant": {
      "enabled": true,
      "responseTimeout": 200,
      "qualityThreshold": 70,
      "maxSuggestions": 5,
      "enableRealTime": true
    }
  }
}
```

2. **Access the Writing Assistant**
- Open any document in Anvil
- Switch to Form mode for enhanced AI features
- The Writing Assistant panel appears automatically

3. **First Usage**
- Start typing any requirement description
- Watch real-time suggestions appear
- Click suggestions to accept them
- Use Ctrl+Space for manual autocomplete

### Quick Start Example

**Input:** "The user should be able to login"

**AI Processing:**
1. Detects functional requirement pattern
2. Suggests structured format
3. Provides quality improvements
4. Recommends related templates

**Output:** "The user shall be able to authenticate login credentials when accessing the system."

## Natural Language Processing

### How It Works

The NLP engine analyzes input text through multiple layers:

1. **Tokenization**: Break text into semantic units
2. **Entity Recognition**: Identify stakeholders, actions, objects
3. **Pattern Matching**: Detect requirement type patterns
4. **Structure Generation**: Apply appropriate templates
5. **Validation**: Quality check and confidence scoring

### Supported Requirement Types

#### Functional Requirements
**Pattern**: `The {stakeholder} shall be able to {action} {object} {conditions}`

**Examples:**
```
Input: "Users can create documents"
Output: "The user shall be able to create new documents when authenticated."

Input: "System validates data"
Output: "The system shall be able to validate input data before processing."
```

#### Non-Functional Requirements
**Pattern**: `The {component} shall {performance_criteria} within {timeframe} under {conditions}`

**Examples:**
```
Input: "System responds quickly"
Output: "The system shall respond to user requests within 2 seconds under normal load."

Input: "Application is reliable"
Output: "The application shall maintain 99.9% uptime during business hours."
```

#### Acceptance Criteria
**Pattern**: `Given {context}, when {action}, then {expected_result}`

**Examples:**
```
Input: "User logs in successfully"
Output: "Given a valid user login, when accessing the dashboard, then all user data is displayed."

Input: "Invalid data submission"
Output: "Given invalid input data, when submitting a form, then appropriate error messages are shown."
```

#### Constraint Requirements
**Pattern**: `The {component} must not {restriction} and shall comply with {standards}`

**Examples:**
```
Input: "No plain text passwords"
Output: "The system must not store sensitive data in plain text and shall comply with GDPR."

Input: "Memory usage limits"
Output: "The application must not exceed 5MB memory usage and shall comply with performance standards."
```

### API Usage

#### Convert Natural Language
```javascript
const response = await fetch('/api/ai/writing-assistant/nlp-conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: "Users can create documents",
    options: {
      documentType: "functional",
      context: "authentication_system"
    }
  })
});

const result = await response.json();
console.log(result.result.structuredRequirement.text);
```

#### Response Format
```json
{
  "success": true,
  "result": {
    "originalInput": "Users can create documents",
    "requirementType": "functional-requirement",
    "entities": {
      "stakeholders": ["user"],
      "actions": ["create"],
      "objects": ["documents"],
      "conditions": [],
      "measurements": []
    },
    "structuredRequirement": {
      "text": "The user shall be able to create new documents when authenticated.",
      "confidence": 0.85,
      "template": "functional-requirement"
    },
    "validation": {
      "qualityScore": 78,
      "clarity": { "score": 82 },
      "completeness": { "score": 75 },
      "specificity": { "score": 77 }
    },
    "confidence": 0.85,
    "suggestions": [
      {
        "type": "improvement",
        "message": "Consider specifying document types",
        "priority": "medium"
      }
    ],
    "processingTime": 145
  }
}
```

## Smart Autocomplete

### Context-Aware Suggestions

The autocomplete system provides intelligent suggestions based on:
- Current document type
- Writing context and patterns
- Industry best practices
- Previous user selections

### Suggestion Types

#### Template Suggestions
Triggered when starting new requirements or on empty lines:

```
Input: "The user"
Suggestions:
- "The user shall be able to {action} {object} {conditions}"
- "The user must be able to {action} when {conditions}"
```

#### Contextual Word Suggestions
Based on requirement patterns and stakeholder roles:

```
Input: "The sys"
Suggestions:
- "system"
- "System Administrator"
- "System"
```

#### Structure Completion
Complete common requirement patterns:

```
Input: "The user shall"
Suggestions:
- "be able to"
- "have access to"
- "receive notification when"
```

### API Usage

#### Get Autocomplete Suggestions
```javascript
const response = await fetch('/api/ai/writing-assistant/autocomplete', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "The user shall be able to create",
    cursorPosition: 31,
    context: {
      documentType: "functional",
      section: "requirements"
    }
  })
});

const result = await response.json();
console.log(result.suggestions);
```

#### Response Format
```json
{
  "success": true,
  "suggestions": [
    {
      "type": "template",
      "text": "new documents when authenticated",
      "description": "Complete functional requirement pattern",
      "category": "functional",
      "priority": 0.95
    },
    {
      "type": "action",
      "text": "create",
      "description": "Action verb",
      "priority": 0.9
    }
  ],
  "processingTime": 145
}
```

### Real-Time Configuration

```javascript
// Enable real-time autocomplete
const writingAssistant = new WritingAssistant({
  enableRealTime: true,
  responseTimeout: 200,
  maxSuggestions: 5
});

// Process real-time assistance
const result = await writingAssistant.processRealTimeAssistance(
  text,
  cursorPosition,
  context
);
```

## Quality Analysis

### Comprehensive Writing Assessment

The Quality Analysis engine evaluates requirements across multiple dimensions:

#### NLP Quality Metrics
- **Clarity Score**: How clear and understandable the requirement is
- **Completeness Score**: Whether all necessary information is included
- **Specificity Score**: Level of detail and precision
- **Overall Quality Score**: Weighted combination of all metrics

#### Writing Analysis
- **Readability Score**: Flesch Reading Ease calculation
- **Sentence Structure**: Average words per sentence, complexity
- **Tone Analysis**: Formal vs. informal, technical vs. descriptive
- **Structure Assessment**: Paragraphs, lists, organization

### Quality Scoring

#### Score Ranges
- **90-100**: Excellent - Professional, clear, complete
- **80-89**: Good - Minor improvements needed
- **70-79**: Fair - Several areas for improvement
- **60-69**: Poor - Significant revision required
- **Below 60**: Needs major restructuring

#### Improvement Suggestions

The system provides actionable suggestions:

```json
{
  "improvements": [
    {
      "type": "clarity",
      "severity": "medium",
      "message": "Consider being more specific about user types",
      "suggestion": "Replace 'user' with 'authenticated user' or 'system administrator'",
      "autoFixable": false
    },
    {
      "type": "completeness",
      "severity": "high",
      "message": "Missing success criteria",
      "suggestion": "Add what constitutes successful completion",
      "autoFixable": false
    }
  ]
}
```

### API Usage

#### Analyze Writing Quality
```javascript
const response = await fetch('/api/ai/writing-assistant/quality-analysis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "The user shall be able to create documents.",
    options: {
      includeReadability: true,
      includeStructure: true,
      includeTone: true
    }
  })
});

const result = await response.json();
```

#### Response Format
```json
{
  "success": true,
  "result": {
    "overallScore": 75,
    "metrics": {
      "readabilityScore": 78,
      "clarityScore": 82,
      "completenessScore": 68,
      "consistencyScore": 75
    },
    "writingAnalysis": {
      "wordCount": 9,
      "sentenceCount": 1,
      "averageWordsPerSentence": 9,
      "readability": {
        "score": 78,
        "level": "fairly easy"
      },
      "tone": {
        "dominant": "formal",
        "confidence": 0.8
      }
    },
    "improvements": [
      {
        "type": "completeness",
        "severity": "medium",
        "message": "Consider adding specific conditions or constraints",
        "suggestion": "Specify when or under what conditions this capability is available"
      }
    ],
    "processingTime": 234
  }
}
```

## Template Intelligence

### Dynamic Template System

The Template Intelligence system provides contextual template recommendations based on:
- Document content analysis
- Writing patterns
- Industry standards
- User preferences

### Available Templates

#### Functional Requirement Template
```
Template: "The {stakeholder} shall be able to {action} {object} {conditions}."
Fields: [stakeholder, action, object, conditions]
Keywords: [shall, must, will, function, capability]
```

#### Non-Functional Requirement Template
```
Template: "The {component} shall {performance_criteria} within {timeframe} under {conditions}."
Fields: [component, performance_criteria, timeframe, conditions]
Keywords: [performance, security, usability, reliability, scalability]
```

#### Acceptance Criteria Template
```
Template: "Given {context}, when {action}, then {expected_result}."
Fields: [context, action, expected_result]
Keywords: [given, when, then, criteria, acceptance]
```

#### Constraint Requirement Template
```
Template: "The {component} must not {restriction} and shall comply with {standards}."
Fields: [component, restriction, standards]
Keywords: [must not, constraint, limitation, comply, standard]
```

### API Usage

#### Get Template Recommendations
```javascript
const response = await fetch('/api/ai/writing-assistant/template-recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    context: {
      documentType: "requirements",
      section: "functional"
    },
    partialText: "The user should be able to"
  })
});

const result = await response.json();
```

#### Response Format
```json
{
  "success": true,
  "recommendations": [
    {
      "templateId": "functional-requirement",
      "template": {
        "id": "functional-requirement",
        "name": "Functional Requirement",
        "category": "functional",
        "template": "The {stakeholder} shall be able to {action} {object} {conditions}.",
        "fields": ["stakeholder", "action", "object", "conditions"]
      },
      "relevanceScore": 0.95,
      "reason": "Matches document type: functional, Contains relevant keywords"
    }
  ],
  "timestamp": "2025-09-20T10:30:00.000Z"
}
```

## API Reference

### Base URL
```
https://your-anvil-instance.com/api/ai/writing-assistant
```

### Authentication
All endpoints require authentication via API key:
```
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

#### POST /nlp-conversion
Convert natural language to structured requirements.

**Request Body:**
```json
{
  "input": "string (required)",
  "options": {
    "documentType": "string (optional)",
    "context": "string (optional)",
    "requirementType": "string (optional)"
  }
}
```

**Response:** NLP conversion result with structured requirement

#### POST /autocomplete
Get smart autocomplete suggestions.

**Request Body:**
```json
{
  "text": "string (required)",
  "cursorPosition": "number (required)",
  "context": {
    "documentType": "string (optional)",
    "section": "string (optional)"
  }
}
```

**Response:** Array of autocomplete suggestions

#### POST /quality-analysis
Analyze writing quality and get improvement suggestions.

**Request Body:**
```json
{
  "text": "string (required)",
  "options": {
    "includeReadability": "boolean (optional)",
    "includeStructure": "boolean (optional)",
    "includeTone": "boolean (optional)"
  }
}
```

**Response:** Comprehensive quality analysis

#### POST /template-recommendations
Get dynamic template recommendations.

**Request Body:**
```json
{
  "context": {
    "documentType": "string (optional)",
    "section": "string (optional)"
  },
  "partialText": "string (optional)"
}
```

**Response:** Relevant template recommendations

#### POST /real-time-assistance
Get real-time writing assistance (combines autocomplete, quality, templates).

**Request Body:**
```json
{
  "text": "string (required)",
  "cursorPosition": "number (required)",
  "context": {
    "documentType": "string (optional)",
    "section": "string (optional)"
  }
}
```

**Response:** Combined assistance including autocomplete, quality check, and templates

### Rate Limiting
- **Limit**: 1000 requests per hour per API key
- **Burst**: Up to 100 requests per minute
- **Headers**: Rate limit information in response headers

### Error Handling

#### Standard Error Response
```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2025-09-20T10:30:00.000Z"
}
```

#### Common Error Codes
- `INVALID_INPUT`: Invalid request parameters
- `RATE_LIMITED`: Rate limit exceeded
- `SERVICE_UNAVAILABLE`: AI service temporarily unavailable
- `PROCESSING_TIMEOUT`: Request processing timeout

## Configuration

### Basic Configuration
```json
{
  "ai": {
    "writingAssistant": {
      "enabled": true,
      "responseTimeout": 200,
      "qualityThreshold": 70,
      "maxSuggestions": 5,
      "enableRealTime": true,
      "enableNLPConversion": true,
      "enableQualityAnalysis": true,
      "enableTemplateRecommendations": true
    }
  }
}
```

### Advanced Configuration
```json
{
  "ai": {
    "writingAssistant": {
      "nlp": {
        "confidenceThreshold": 0.7,
        "maxEntityExtraction": 10,
        "enableEntityCaching": true
      },
      "autocomplete": {
        "debounceTime": 300,
        "minInputLength": 2,
        "enablePrefixMatching": true,
        "enableContextFiltering": true
      },
      "quality": {
        "enableReadabilityAnalysis": true,
        "enableToneAnalysis": true,
        "enableStructureAnalysis": true,
        "improvementSuggestionLimit": 5
      },
      "templates": {
        "enableCustomTemplates": true,
        "templateCacheSize": 100,
        "relevanceThreshold": 0.3
      },
      "performance": {
        "enableCaching": true,
        "cacheTTL": 300000,
        "maxConcurrentRequests": 10,
        "enableMetrics": true
      }
    }
  }
}
```

### Environment Variables
```bash
ANVIL_AI_WRITING_ASSISTANT_ENABLED=true
ANVIL_AI_WRITING_ASSISTANT_TIMEOUT=200
ANVIL_AI_WRITING_ASSISTANT_QUALITY_THRESHOLD=70
ANVIL_AI_WRITING_ASSISTANT_MAX_SUGGESTIONS=5
ANVIL_AI_WRITING_ASSISTANT_CACHE_TTL=300000
```

## Best Practices

### Writing Effective Requirements

#### Use Clear, Specific Language
```
❌ Poor: "The system should be fast"
✅ Good: "The system shall respond to user queries within 2 seconds under normal load"
```

#### Follow Template Patterns
```
❌ Poor: "Users need to login"
✅ Good: "The user shall be able to authenticate using valid credentials when accessing the system"
```

#### Include Acceptance Criteria
```
❌ Poor: "The user can create documents"
✅ Good: "Given an authenticated user, when creating a new document, then the document is saved with timestamp and user attribution"
```

### Optimizing AI Assistance

#### Provide Context
- Set document type for better suggestions
- Use consistent terminology
- Provide section context when available

#### Leverage Templates
- Start with template suggestions for new requirements
- Customize templates for your organization
- Use templates as learning tools

#### Review Quality Suggestions
- Address high-severity issues first
- Use quality scores to prioritize improvements
- Regularly review and update requirements

### Performance Optimization

#### Reduce Response Times
- Enable caching for repeated requests
- Use real-time assistance sparingly
- Batch process quality analysis when possible

#### Manage API Usage
- Implement client-side debouncing
- Cache template recommendations
- Use appropriate request timeouts

## Troubleshooting

### Common Issues

#### Slow Response Times
**Symptoms**: Autocomplete suggestions taking >500ms
**Solutions**:
- Check network connectivity
- Verify API key is valid
- Enable caching in configuration
- Reduce max suggestions limit

#### Low Quality Scores
**Symptoms**: Requirements consistently scoring <70
**Solutions**:
- Review writing patterns against templates
- Address specific improvement suggestions
- Use more specific language
- Include measurable criteria

#### Irrelevant Suggestions
**Symptoms**: Autocomplete suggesting incorrect patterns
**Solutions**:
- Provide better document context
- Check document type configuration
- Verify template relevance settings
- Clear suggestion cache

#### API Errors
**Symptoms**: 429 Rate Limited errors
**Solutions**:
- Implement request throttling
- Check rate limit headers
- Use caching to reduce requests
- Contact support for limit increases

### Debugging

#### Enable Debug Logging
```json
{
  "ai": {
    "writingAssistant": {
      "debug": {
        "enabled": true,
        "logLevel": "detailed",
        "logRequests": true,
        "logResponses": true
      }
    }
  }
}
```

#### Performance Monitoring
```javascript
// Monitor AI response times
const startTime = Date.now();
const result = await writingAssistant.process(request);
const responseTime = Date.now() - startTime;
console.log(`AI Response Time: ${responseTime}ms`);
```

#### Health Checks
```javascript
// Check AI service health
const health = await writingAssistant.healthCheck();
console.log('Writing Assistant Health:', health);
```

### Support Resources

#### Documentation
- [Phase 5 Overview](./PHASE_5_OVERVIEW.md)
- [API Reference](./API_REFERENCE.md)
- [Configuration Guide](./CONFIG.md)

#### Community
- [GitHub Issues](https://github.com/darcydjr/anvil/issues)
- [Community Forum](https://community.anvil-framework.com)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/anvil-framework)

#### Professional Support
- Technical Support: support@anvil-framework.com
- Training Services: training@anvil-framework.com
- Custom Development: consulting@anvil-framework.com

---

*AI Writing Assistant - Intelligent Requirements Authoring for Anvil Phase 5*

**Version**: 1.1.7
**Last Updated**: September 2025
**Compatibility**: Anvil Phase 5+