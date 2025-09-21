/*
 * Copyright 2025 Darcy Davidson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');

/**
 * Anvil Project Intelligence & Insights Engine
 *
 * Provides intelligent analytics, predictive insights, and project health monitoring
 * for Anvil document management and development workflows.
 */
class ProjectIntelligenceEngine {
  constructor() {
    this.documentCache = new Map();
    this.analysisCache = new Map();
    this.lastCacheUpdate = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Parse document metadata from markdown content
   */
  parseDocumentMetadata(content) {
    const metadata = {};
    const lines = content.split('\n');
    let inMetadata = false;

    for (const line of lines) {
      if (line.trim() === '## Metadata') {
        inMetadata = true;
        continue;
      }

      if (inMetadata && line.startsWith('##')) {
        break;
      }

      if (inMetadata && line.startsWith('- **')) {
        const match = line.match(/- \*\*(.*?)\*\*:\s*(.*)/);
        if (match) {
          const key = match[1].toLowerCase().replace(/\s+/g, '_');
          const value = match[2].trim();
          metadata[key] = value;
        }
      }
    }

    return metadata;
  }

  /**
   * Parse requirements tables from document content
   */
  parseRequirements(content) {
    const functionalReqs = [];
    const nonFunctionalReqs = [];

    const lines = content.split('\n');
    let currentSection = null;
    let inTable = false;
    let headers = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('## Functional Requirements')) {
        currentSection = 'functional';
        continue;
      }

      if (line.includes('## Non-Functional Requirements')) {
        currentSection = 'non-functional';
        continue;
      }

      if (line.startsWith('##') && !line.includes('Requirements')) {
        currentSection = null;
        inTable = false;
        continue;
      }

      if (currentSection && line.includes('|') && line.includes('ID')) {
        headers = line.split('|').map(h => h.trim()).filter(h => h);
        inTable = true;
        i++; // Skip separator line
        continue;
      }

      if (inTable && line.includes('|') && !line.includes('-')) {
        const values = line.split('|').map(v => v.trim()).filter(v => v);
        if (values.length >= headers.length) {
          const req = {};
          headers.forEach((header, index) => {
            if (values[index]) {
              req[header.toLowerCase().replace(/\s+/g, '_')] = values[index];
            }
          });

          if (currentSection === 'functional') {
            functionalReqs.push(req);
          } else if (currentSection === 'non-functional') {
            nonFunctionalReqs.push(req);
          }
        }
      }

      if (currentSection && line.trim() === '') {
        inTable = false;
      }
    }

    return { functional: functionalReqs, nonFunctional: nonFunctionalReqs };
  }

  /**
   * Load and parse all documents from project paths
   */
  async loadProjectDocuments(projectPaths) {
    const documents = {
      capabilities: [],
      enablers: [],
      templates: []
    };

    for (const projectPath of projectPaths) {
      try {
        if (!await fs.pathExists(projectPath)) {
          continue;
        }

        const files = await fs.readdir(projectPath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = path.join(projectPath, file);
          const content = await fs.readFile(filePath, 'utf8');
          const metadata = this.parseDocumentMetadata(content);
          const requirements = this.parseRequirements(content);

          const document = {
            filename: file,
            path: filePath,
            content,
            metadata,
            requirements,
            lastModified: (await fs.stat(filePath)).mtime,
            size: (await fs.stat(filePath)).size
          };

          if (metadata.type === 'Capability') {
            documents.capabilities.push(document);
          } else if (metadata.type === 'Enabler') {
            documents.enablers.push(document);
          } else if (file.includes('template')) {
            documents.templates.push(document);
          }
        }
      } catch (error) {
        console.error(`Error loading documents from ${projectPath}:`, error);
      }
    }

    return documents;
  }

  /**
   * Calculate project health metrics
   */
  calculateProjectHealth(documents) {
    const health = {
      overall: 0,
      capabilities: {
        total: documents.capabilities.length,
        approved: 0,
        inProgress: 0,
        blocked: 0
      },
      enablers: {
        total: documents.enablers.length,
        implemented: 0,
        inProgress: 0,
        notStarted: 0
      },
      requirements: {
        total: 0,
        implemented: 0,
        inProgress: 0,
        approved: 0
      },
      timeline: {
        averageAge: 0,
        staleDocuments: 0,
        recentActivity: 0
      }
    };

    // Analyze capabilities
    documents.capabilities.forEach(cap => {
      if (cap.metadata.approval === 'Approved') health.capabilities.approved++;
      else if (cap.metadata.status && cap.metadata.status.includes('Progress')) health.capabilities.inProgress++;
      else health.capabilities.blocked++;
    });

    // Analyze enablers
    documents.enablers.forEach(enabler => {
      if (enabler.metadata.status === 'Implemented') health.enablers.implemented++;
      else if (enabler.metadata.status && enabler.metadata.status.includes('Progress')) health.enablers.inProgress++;
      else health.enablers.notStarted++;

      // Count requirements
      health.requirements.total += enabler.requirements.functional.length + enabler.requirements.nonFunctional.length;

      enabler.requirements.functional.forEach(req => {
        if (req.status === 'Implemented') health.requirements.implemented++;
        else if (req.status && req.status.includes('Progress')) health.requirements.inProgress++;
        if (req.approval === 'Approved') health.requirements.approved++;
      });

      enabler.requirements.nonFunctional.forEach(req => {
        if (req.status === 'Implemented') health.requirements.implemented++;
        else if (req.status && req.status.includes('Progress')) health.requirements.inProgress++;
        if (req.approval === 'Approved') health.requirements.approved++;
      });
    });

    // Calculate timeline metrics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    let totalAge = 0;
    let recentCount = 0;
    let staleCount = 0;

    [...documents.capabilities, ...documents.enablers].forEach(doc => {
      const age = now - doc.lastModified;
      totalAge += age;

      if (doc.lastModified > thirtyDaysAgo) recentCount++;
      if (age > 60 * 24 * 60 * 60 * 1000) staleCount++; // 60 days
    });

    health.timeline.averageAge = Math.round(totalAge / (documents.capabilities.length + documents.enablers.length) / (24 * 60 * 60 * 1000));
    health.timeline.recentActivity = recentCount;
    health.timeline.staleDocuments = staleCount;

    // Calculate overall health score (0-100)
    const capScore = health.capabilities.total > 0 ? (health.capabilities.approved / health.capabilities.total) * 100 : 100;
    const enablerScore = health.enablers.total > 0 ? (health.enablers.implemented / health.enablers.total) * 100 : 100;
    const reqScore = health.requirements.total > 0 ? (health.requirements.implemented / health.requirements.total) * 100 : 100;
    const timelineScore = Math.max(0, 100 - (health.timeline.staleDocuments * 10));

    health.overall = Math.round((capScore + enablerScore + reqScore + timelineScore) / 4);

    return health;
  }

  /**
   * Generate predictive timeline forecast
   */
  generateTimelineForecast(documents) {
    const forecast = {
      estimatedCompletion: null,
      riskFactors: [],
      confidence: 0,
      milestones: [],
      recommendations: []
    };

    // Calculate completion velocity
    const implementedItems = documents.enablers.filter(e => e.metadata.status === 'Implemented').length;
    const totalItems = documents.enablers.length;
    const remainingItems = totalItems - implementedItems;

    if (implementedItems > 0) {
      // Simple velocity calculation based on recent implementations
      const recentImplementations = documents.enablers.filter(e => {
        if (e.metadata.status !== 'Implemented') return false;
        const lastUpdate = new Date(e.metadata.last_updated || e.lastModified);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastUpdate > thirtyDaysAgo;
      }).length;

      const velocity = recentImplementations / 30; // items per day

      if (velocity > 0) {
        const daysToComplete = remainingItems / velocity;
        forecast.estimatedCompletion = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);
        forecast.confidence = Math.min(90, recentImplementations * 20); // Higher confidence with more data
      }
    }

    // Identify risk factors
    const blockedItems = documents.enablers.filter(e =>
      e.metadata.approval === 'Not Approved' ||
      e.metadata.status === 'In Draft'
    ).length;

    if (blockedItems > totalItems * 0.3) {
      forecast.riskFactors.push({
        type: 'approval_bottleneck',
        severity: 'high',
        description: `${blockedItems} items pending approval`,
        impact: 'Could delay completion by 2-4 weeks'
      });
    }

    const staleItems = documents.enablers.filter(e => {
      const lastUpdate = new Date(e.metadata.last_updated || e.lastModified);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      return lastUpdate < sixtyDaysAgo && e.metadata.status !== 'Implemented';
    }).length;

    if (staleItems > 0) {
      forecast.riskFactors.push({
        type: 'stale_development',
        severity: staleItems > totalItems * 0.2 ? 'high' : 'medium',
        description: `${staleItems} items haven't been updated in 60+ days`,
        impact: 'May indicate abandoned or deprioritized work'
      });
    }

    // Generate recommendations
    if (blockedItems > 0) {
      forecast.recommendations.push({
        type: 'approval_acceleration',
        priority: 'high',
        action: 'Review and approve pending capabilities/enablers',
        impact: `Could accelerate completion by ${Math.round(blockedItems * 0.1)} weeks`
      });
    }

    if (staleItems > 0) {
      forecast.recommendations.push({
        type: 'development_review',
        priority: 'medium',
        action: 'Review stale items for status updates or deprioritization',
        impact: 'Improves project visibility and resource allocation'
      });
    }

    return forecast;
  }

  /**
   * Detect development patterns and anomalies
   */
  detectPatterns(documents) {
    const patterns = {
      developmentVelocity: {
        trend: 'stable',
        weeklyAverage: 0,
        anomalies: []
      },
      approvalPatterns: {
        averageTimeToApproval: 0,
        bottlenecks: []
      },
      qualityIndicators: {
        requirementCompleteness: 0,
        documentationQuality: 0,
        dependencyHealth: 0
      }
    };

    // Analyze velocity trends
    const implementations = documents.enablers
      .filter(e => e.metadata.status === 'Implemented')
      .map(e => ({
        date: new Date(e.metadata.last_updated || e.lastModified),
        enabler: e
      }))
      .sort((a, b) => a.date - b.date);

    if (implementations.length > 4) {
      const recentWeeks = [];
      const now = new Date();

      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekImplementations = implementations.filter(impl =>
          impl.date >= weekStart && impl.date < weekEnd
        ).length;
        recentWeeks.unshift(weekImplementations);
      }

      patterns.developmentVelocity.weeklyAverage = recentWeeks.reduce((a, b) => a + b, 0) / 4;

      // Detect trend
      if (recentWeeks[3] > recentWeeks[0] * 1.5) {
        patterns.developmentVelocity.trend = 'accelerating';
      } else if (recentWeeks[3] < recentWeeks[0] * 0.5) {
        patterns.developmentVelocity.trend = 'declining';
      }

      // Detect anomalies (weeks with significantly different activity)
      const average = patterns.developmentVelocity.weeklyAverage;
      recentWeeks.forEach((count, index) => {
        if (Math.abs(count - average) > average * 0.5 && average > 0) {
          patterns.developmentVelocity.anomalies.push({
            week: index + 1,
            expected: Math.round(average),
            actual: count,
            deviation: Math.round(((count - average) / average) * 100)
          });
        }
      });
    }

    // Analyze quality indicators
    let totalReqs = 0;
    let completeReqs = 0;

    documents.enablers.forEach(enabler => {
      const reqs = [...enabler.requirements.functional, ...enabler.requirements.nonFunctional];
      totalReqs += reqs.length;
      completeReqs += reqs.filter(req => req.status === 'Implemented').length;
    });

    patterns.qualityIndicators.requirementCompleteness = totalReqs > 0 ?
      Math.round((completeReqs / totalReqs) * 100) : 100;

    // Check documentation quality (presence of key sections)
    let qualityScore = 0;
    documents.enablers.forEach(enabler => {
      let score = 0;
      if (enabler.content.includes('## Technical Specifications')) score += 25;
      if (enabler.content.includes('## Functional Requirements')) score += 25;
      if (enabler.content.includes('## Non-Functional Requirements')) score += 25;
      if (enabler.content.includes('# Development Plan')) score += 25;
      qualityScore += score;
    });

    patterns.qualityIndicators.documentationQuality = documents.enablers.length > 0 ?
      Math.round(qualityScore / documents.enablers.length) : 100;

    return patterns;
  }

  /**
   * Generate smart recommendations
   */
  generateRecommendations(health, forecast, patterns) {
    const recommendations = [];

    // Health-based recommendations
    if (health.overall < 70) {
      recommendations.push({
        type: 'project_health',
        priority: 'high',
        title: 'Improve Project Health',
        description: 'Overall project health is below optimal levels',
        actions: [
          'Review blocked capabilities and enablers',
          'Accelerate approval processes',
          'Address stale documentation'
        ],
        impact: 'Could improve health score by 15-25 points'
      });
    }

    if (health.capabilities.blocked > health.capabilities.total * 0.3) {
      recommendations.push({
        type: 'approval_bottleneck',
        priority: 'high',
        title: 'Address Approval Bottlenecks',
        description: 'Too many capabilities are pending approval',
        actions: [
          'Schedule approval review sessions',
          'Clarify approval criteria',
          'Delegate approval authority'
        ],
        impact: 'Could accelerate development by 1-3 weeks'
      });
    }

    // Pattern-based recommendations
    if (patterns.developmentVelocity.trend === 'declining') {
      recommendations.push({
        type: 'velocity_improvement',
        priority: 'medium',
        title: 'Boost Development Velocity',
        description: 'Development velocity is declining',
        actions: [
          'Review team capacity and blockers',
          'Simplify development processes',
          'Provide additional resources or training'
        ],
        impact: 'Could restore velocity to previous levels'
      });
    }

    if (patterns.qualityIndicators.documentationQuality < 75) {
      recommendations.push({
        type: 'documentation_quality',
        priority: 'medium',
        title: 'Improve Documentation Quality',
        description: 'Documentation completeness is below standards',
        actions: [
          'Create documentation checklists',
          'Implement peer review processes',
          'Provide documentation templates'
        ],
        impact: 'Improves maintainability and onboarding'
      });
    }

    // Timeline-based recommendations
    if (forecast.riskFactors.length > 0) {
      const highRiskFactors = forecast.riskFactors.filter(rf => rf.severity === 'high');
      if (highRiskFactors.length > 0) {
        recommendations.push({
          type: 'risk_mitigation',
          priority: 'high',
          title: 'Mitigate Timeline Risks',
          description: `${highRiskFactors.length} high-risk factors identified`,
          actions: highRiskFactors.map(rf => `Address ${rf.type}: ${rf.description}`),
          impact: 'Reduces project delivery risk significantly'
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate comprehensive project intelligence report
   */
  async generateIntelligenceReport(projectPaths) {
    try {
      // Check cache first
      const cacheKey = projectPaths.join('|');
      if (this.analysisCache.has(cacheKey) &&
          this.lastCacheUpdate &&
          Date.now() - this.lastCacheUpdate < this.cacheTimeout) {
        return this.analysisCache.get(cacheKey);
      }

      // Load and analyze documents
      const documents = await this.loadProjectDocuments(projectPaths);
      const health = this.calculateProjectHealth(documents);
      const forecast = this.generateTimelineForecast(documents);
      const patterns = this.detectPatterns(documents);
      const recommendations = this.generateRecommendations(health, forecast, patterns);

      const report = {
        generated: new Date().toISOString(),
        summary: {
          totalDocuments: documents.capabilities.length + documents.enablers.length,
          healthScore: health.overall,
          completionEstimate: forecast.estimatedCompletion,
          riskLevel: forecast.riskFactors.length > 0 ?
            Math.max(...forecast.riskFactors.map(rf => rf.severity === 'high' ? 3 : rf.severity === 'medium' ? 2 : 1)) : 1
        },
        health,
        forecast,
        patterns,
        recommendations,
        documents: {
          capabilities: documents.capabilities.length,
          enablers: documents.enablers.length,
          templates: documents.templates.length
        }
      };

      // Cache the result
      this.analysisCache.set(cacheKey, report);
      this.lastCacheUpdate = Date.now();

      return report;
    } catch (error) {
      console.error('Error generating intelligence report:', error);
      throw new Error(`Failed to generate intelligence report: ${error.message}`);
    }
  }

  /**
   * Get real-time project metrics
   */
  async getProjectMetrics(projectPaths) {
    const documents = await this.loadProjectDocuments(projectPaths);
    const health = this.calculateProjectHealth(documents);

    return {
      timestamp: new Date().toISOString(),
      metrics: {
        totalCapabilities: health.capabilities.total,
        approvedCapabilities: health.capabilities.approved,
        totalEnablers: health.enablers.total,
        implementedEnablers: health.enablers.implemented,
        totalRequirements: health.requirements.total,
        implementedRequirements: health.requirements.implemented,
        healthScore: health.overall,
        recentActivity: health.timeline.recentActivity,
        staleDocuments: health.timeline.staleDocuments
      }
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
    this.lastCacheUpdate = null;
  }
}

module.exports = ProjectIntelligenceEngine;