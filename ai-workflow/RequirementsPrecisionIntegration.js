/**
 * Requirements Precision Engine Integration
 * Integrates AI Workflow Automation with the existing Requirements Precision Engine
 */

const RequirementsAnalyzer = require('../agents/requirements/analyzer');

class RequirementsPrecisionIntegration {
  constructor(workflowEngine, aiServiceManager, smartAnalysisEngine, config = {}) {
    this.workflowEngine = workflowEngine;
    this.aiServiceManager = aiServiceManager;
    this.smartAnalysisEngine = smartAnalysisEngine;
    this.requirementsAnalyzer = new RequirementsAnalyzer();

    this.config = {
      enhanceWithAI: config.enhanceWithAI !== false,
      cacheResults: config.cacheResults !== false,
      realTimeSync: config.realTimeSync !== false,
      qualityThreshold: config.qualityThreshold || 70,
      ...config
    };

    this.integrationMetrics = {
      totalAnalyses: 0,
      enhancedAnalyses: 0,
      improvementSuggestions: 0,
      qualityImprovements: 0
    };

    this.initialize();
  }

  /**
   * Initialize the integration
   */
  initialize() {
    this.registerEnhancedWorkflows();
    this.setupIntegrationWorkflows();
  }

  /**
   * Register enhanced workflows that combine traditional and AI analysis
   */
  registerEnhancedWorkflows() {
    // Enhanced Capability Analysis Workflow
    this.workflowEngine.registerWorkflow({
      id: 'enhanced-capability-analysis',
      name: 'Enhanced Capability Analysis',
      description: 'Combines traditional Requirements Precision Engine with AI enhancement',
      version: '1.0.0',
      steps: [
        {
          id: 'traditional-analysis',
          type: 'requirements-validation',
          name: 'Traditional Requirements Analysis',
          config: {
            analysisType: 'capability',
            includeMetrics: true,
            includeSuggestions: true
          },
          timeout: 30000
        },
        {
          id: 'ai-enhancement',
          type: 'ai-analysis',
          name: 'AI Enhancement Analysis',
          config: {
            enhancementType: 'capability',
            includeSemanticAnalysis: true,
            generateImprovements: true
          },
          condition: '${data.traditional-analysis.metrics.completeness} < 80',
          timeout: 45000
        },
        {
          id: 'synthesis',
          type: 'data-transform',
          name: 'Synthesize Results',
          config: {
            transformation: {
              mapping: {
                'traditionalAnalysis': 'traditional-analysis',
                'aiEnhancement': 'ai-enhancement',
                'combinedMetrics': 'synthesizedMetrics',
                'recommendations': 'combinedRecommendations'
              }
            }
          }
        },
        {
          id: 'quality-check',
          type: 'conditional-branch',
          name: 'Quality Assessment',
          config: {
            conditions: [
              {
                name: 'high-quality',
                expression: '${data.combinedMetrics.overallQuality} >= 80',
                result: { qualityLevel: 'high', approved: true }
              },
              {
                name: 'medium-quality',
                expression: '${data.combinedMetrics.overallQuality} >= 60',
                result: { qualityLevel: 'medium', needsImprovement: true }
              },
              {
                name: 'low-quality',
                expression: '${data.combinedMetrics.overallQuality} < 60',
                result: { qualityLevel: 'low', requiresRework: true }
              }
            ]
          }
        },
        {
          id: 'generate-report',
          type: 'data-transform',
          name: 'Generate Analysis Report',
          config: {
            reportType: 'enhanced-capability-analysis',
            includeVisualization: true
          }
        }
      ],
      triggers: [
        {
          type: 'api-call',
          endpoint: '/api/ai-workflow/analyze/capability'
        },
        {
          type: 'file-upload',
          fileType: 'capability-document'
        }
      ]
    });

    // Enhanced Enabler Analysis Workflow
    this.workflowEngine.registerWorkflow({
      id: 'enhanced-enabler-analysis',
      name: 'Enhanced Enabler Analysis',
      description: 'AI-enhanced enabler document analysis',
      version: '1.0.0',
      steps: [
        {
          id: 'traditional-enabler-analysis',
          type: 'requirements-validation',
          name: 'Traditional Enabler Analysis',
          config: {
            analysisType: 'enabler',
            validateImplementationPlan: true,
            checkDependencies: true
          }
        },
        {
          id: 'ai-testability-analysis',
          type: 'ai-analysis',
          name: 'AI Testability Analysis',
          config: {
            focusArea: 'testability',
            generateTestScenarios: true,
            assessImplementationRisk: true
          }
        },
        {
          id: 'dependency-analysis',
          type: 'ai-analysis',
          name: 'Dependency Risk Analysis',
          config: {
            analysisType: 'dependency-risk',
            identifyBottlenecks: true,
            suggestMitigations: true
          }
        },
        {
          id: 'implementation-planning',
          type: 'ai-analysis',
          name: 'Implementation Planning Enhancement',
          config: {
            enhanceImplementationPlan: true,
            estimateEffort: true,
            identifyResourceNeeds: true
          }
        },
        {
          id: 'final-synthesis',
          type: 'data-transform',
          name: 'Synthesize Enabler Analysis',
          config: {
            includeImplementationRoadmap: true,
            generateActionItems: true
          }
        }
      ]
    });

    // Continuous Quality Monitoring Workflow
    this.workflowEngine.registerWorkflow({
      id: 'continuous-quality-monitoring',
      name: 'Continuous Quality Monitoring',
      description: 'Monitors and improves document quality over time',
      version: '1.0.0',
      steps: [
        {
          id: 'collect-documents',
          type: 'data-processing',
          name: 'Collect Recent Documents',
          config: {
            timeRange: '24h',
            documentTypes: ['capability', 'enabler', 'requirements']
          }
        },
        {
          id: 'batch-analysis',
          type: 'ai-analysis',
          name: 'Batch Quality Analysis',
          config: {
            batchSize: 10,
            parallel: true,
            includeComparison: true
          }
        },
        {
          id: 'trend-analysis',
          type: 'ai-analysis',
          name: 'Quality Trend Analysis',
          config: {
            identifyPatterns: true,
            comparePeriods: true,
            generateInsights: true
          }
        },
        {
          id: 'improvement-recommendations',
          type: 'ai-analysis',
          name: 'Generate Improvement Recommendations',
          config: {
            targetAudience: ['authors', 'reviewers', 'managers'],
            prioritizeByImpact: true
          }
        },
        {
          id: 'quality-report',
          type: 'notification',
          name: 'Send Quality Report',
          config: {
            recipients: ['quality-team', 'document-owners'],
            reportFormat: 'dashboard-update',
            includeActionItems: true
          }
        }
      ]
    });
  }

  /**
   * Setup integration workflows
   */
  setupIntegrationWorkflows() {
    // Register workflow for handling precision engine integration
    this.workflowEngine.registerWorkflow({
      id: 'precision-engine-integration',
      name: 'Precision Engine Integration',
      description: 'Coordinates between traditional and AI analysis',
      version: '1.0.0',
      steps: [
        {
          id: 'route-analysis',
          type: 'conditional-branch',
          name: 'Route Analysis Request',
          config: {
            conditions: [
              {
                name: 'ai-enhanced',
                expression: '${input.enhanceWithAI} === true',
                workflow: 'enhanced-capability-analysis'
              },
              {
                name: 'traditional-only',
                expression: '${input.enhanceWithAI} === false',
                result: { routeTo: 'traditional-analysis' }
              }
            ]
          }
        }
      ]
    });
  }

  /**
   * Enhanced capability analysis combining traditional and AI methods
   */
  async enhancedCapabilityAnalysis(input) {
    const { documentId, documentContent, options = {} } = input;

    try {
      // Step 1: Traditional analysis using Requirements Precision Engine
      const traditionalResult = await this.requirementsAnalyzer.analyzeCapability({
        documentId,
        documentContent,
        options: { includeSuggestions: true }
      });

      if (!traditionalResult.success) {
        throw new Error(`Traditional analysis failed: ${traditionalResult.error}`);
      }

      const analysis = {
        documentId,
        timestamp: new Date().toISOString(),
        traditional: traditionalResult.analysis,
        enhanced: null,
        synthesis: null
      };

      // Step 2: AI Enhancement (if enabled and quality below threshold)
      if (this.config.enhanceWithAI) {
        const shouldEnhance = this.shouldEnhanceWithAI(traditionalResult.analysis);

        if (shouldEnhance) {
          const aiEnhancement = await this.performAIEnhancement(
            documentContent,
            traditionalResult.analysis,
            'capability'
          );

          analysis.enhanced = aiEnhancement;
          this.integrationMetrics.enhancedAnalyses++;
        }
      }

      // Step 3: Synthesize results
      analysis.synthesis = await this.synthesizeAnalysisResults(analysis);

      // Step 4: Generate improvement suggestions if needed
      if (analysis.synthesis && analysis.synthesis.qualityScore < this.config.qualityThreshold) {
        analysis.improvements = await this.generateImprovementSuggestions(analysis);
        this.integrationMetrics.improvementSuggestions++;
      }

      this.integrationMetrics.totalAnalyses++;

      return {
        success: true,
        analysis,
        integrationMetrics: this.getIntegrationSummary(analysis)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        documentId
      };
    }
  }

  /**
   * Enhanced enabler analysis
   */
  async enhancedEnablerAnalysis(input) {
    const { documentId, documentContent, options = {} } = input;

    try {
      // Traditional enabler analysis
      const traditionalResult = await this.requirementsAnalyzer.analyzeEnabler({
        documentId,
        documentContent,
        options: { includeSuggestions: true }
      });

      if (!traditionalResult.success) {
        throw new Error(`Traditional enabler analysis failed: ${traditionalResult.error}`);
      }

      const analysis = {
        documentId,
        timestamp: new Date().toISOString(),
        traditional: traditionalResult.analysis,
        enhanced: null,
        testabilityAnalysis: null,
        implementationEnhancement: null,
        synthesis: null
      };

      // AI Enhancement for enablers
      if (this.config.enhanceWithAI) {
        // Testability analysis
        analysis.testabilityAnalysis = await this.analyzeTestability(
          documentContent,
          traditionalResult.analysis
        );

        // Implementation plan enhancement
        analysis.implementationEnhancement = await this.enhanceImplementationPlan(
          documentContent,
          traditionalResult.analysis
        );

        // General AI enhancement
        analysis.enhanced = await this.performAIEnhancement(
          documentContent,
          traditionalResult.analysis,
          'enabler'
        );
      }

      // Synthesize enabler results
      analysis.synthesis = await this.synthesizeEnablerResults(analysis);

      this.integrationMetrics.totalAnalyses++;

      return {
        success: true,
        analysis,
        integrationMetrics: this.getIntegrationSummary(analysis)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        documentId
      };
    }
  }

  /**
   * Determine if AI enhancement should be applied
   */
  shouldEnhanceWithAI(traditionalAnalysis) {
    // Enhance if quality metrics are below threshold
    const metrics = traditionalAnalysis.metrics || {};
    const completeness = metrics.completeness || 0;
    const clarity = metrics.clarity || 0;
    const consistency = metrics.consistency || 0;

    const averageQuality = (completeness + clarity + consistency) / 3;

    return averageQuality < this.config.qualityThreshold ||
           traditionalAnalysis.validation.issues.length > 0 ||
           traditionalAnalysis.validation.warnings.length > 2;
  }

  /**
   * Perform AI enhancement analysis
   */
  async performAIEnhancement(documentContent, traditionalAnalysis, documentType) {
    try {
      const enhancementRequest = {
        type: 'enhancement-analysis',
        content: documentContent,
        traditionalAnalysis,
        documentType,
        enhancements: {
          semanticAnalysis: true,
          qualityImprovement: true,
          structuralOptimization: true,
          contentEnrichment: true
        }
      };

      const result = await this.aiServiceManager.processRequest(enhancementRequest);

      if (result.success) {
        return {
          semanticInsights: result.result.semanticInsights || {},
          qualityImprovements: result.result.qualityImprovements || [],
          structuralSuggestions: result.result.structuralSuggestions || [],
          contentEnhancements: result.result.contentEnhancements || [],
          confidence: result.result.confidence || 0.8
        };
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.warn('AI enhancement failed, using traditional analysis only:', error.message);
      return null;
    }
  }

  /**
   * Analyze testability of enabler requirements
   */
  async analyzeTestability(documentContent, traditionalAnalysis) {
    try {
      const testabilityRequest = {
        type: 'testability-analysis',
        content: documentContent,
        requirements: traditionalAnalysis.requirements,
        analysis: {
          generateTestScenarios: true,
          assessTestCoverage: true,
          identifyTestingGaps: true,
          suggestTestMethods: true
        }
      };

      const result = await this.aiServiceManager.processRequest(testabilityRequest);

      if (result.success) {
        return {
          testabilityScore: result.result.testabilityScore || 0,
          testScenarios: result.result.testScenarios || [],
          testingGaps: result.result.testingGaps || [],
          recommendations: result.result.recommendations || []
        };
      }

      return null;

    } catch (error) {
      console.warn('Testability analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Enhance implementation plan
   */
  async enhanceImplementationPlan(documentContent, traditionalAnalysis) {
    try {
      const enhancementRequest = {
        type: 'implementation-enhancement',
        content: documentContent,
        currentPlan: traditionalAnalysis.implementationPlan,
        requirements: traditionalAnalysis.requirements,
        enhancement: {
          addMilestones: true,
          estimateEffort: true,
          identifyRisks: true,
          suggestResources: true
        }
      };

      const result = await this.aiServiceManager.processRequest(enhancementRequest);

      if (result.success) {
        return {
          enhancedTasks: result.result.enhancedTasks || [],
          milestones: result.result.milestones || [],
          effortEstimates: result.result.effortEstimates || {},
          riskAssessment: result.result.riskAssessment || [],
          resourceSuggestions: result.result.resourceSuggestions || []
        };
      }

      return null;

    } catch (error) {
      console.warn('Implementation plan enhancement failed:', error.message);
      return null;
    }
  }

  /**
   * Synthesize analysis results
   */
  async synthesizeAnalysisResults(analysis) {
    const traditional = analysis.traditional;
    const enhanced = analysis.enhanced;

    // Calculate combined quality score
    const traditionalQuality = this.calculateTraditionalQuality(traditional);
    const enhancedQuality = enhanced ? this.calculateEnhancedQuality(enhanced) : 0;

    const weightedQuality = enhanced ?
      (traditionalQuality * 0.6 + enhancedQuality * 0.4) :
      traditionalQuality;

    // Combine recommendations
    const combinedRecommendations = [
      ...(traditional.suggestions || []),
      ...(enhanced?.qualityImprovements || []),
      ...(enhanced?.structuralSuggestions || [])
    ];

    // Identify critical issues
    const criticalIssues = [
      ...traditional.validation.issues,
      ...(enhanced?.criticalFindings || [])
    ];

    return {
      qualityScore: Math.round(weightedQuality),
      overallAssessment: this.getOverallAssessment(weightedQuality),
      keyStrengths: this.identifyKeyStrengths(analysis),
      improvementAreas: this.identifyImprovementAreas(analysis),
      recommendations: this.prioritizeRecommendations(combinedRecommendations),
      criticalIssues,
      confidence: this.calculateConfidence(analysis),
      enhancementApplied: enhanced !== null
    };
  }

  /**
   * Synthesize enabler-specific results
   */
  async synthesizeEnablerResults(analysis) {
    const synthesis = await this.synthesizeAnalysisResults(analysis);

    // Add enabler-specific synthesis
    synthesis.implementationReadiness = this.assessImplementationReadiness(analysis);
    synthesis.testingStrategy = this.generateTestingStrategy(analysis);
    synthesis.riskMitigation = this.generateRiskMitigation(analysis);

    return synthesis;
  }

  /**
   * Generate improvement suggestions
   */
  async generateImprovementSuggestions(analysis) {
    try {
      const context = {
        currentQuality: analysis.synthesis ? analysis.synthesis.qualityScore : 50,
        documentType: analysis.traditional.type,
        criticalIssues: analysis.synthesis ? analysis.synthesis.criticalIssues : [],
        improvementAreas: analysis.synthesis ? analysis.synthesis.improvementAreas : []
      };

      const result = await this.aiServiceManager.generateSuggestions(analysis, context);

      if (result.success) {
        return {
          prioritizedSuggestions: result.result.suggestions || [],
          actionPlan: this.generateActionPlan(result.result.suggestions || []),
          estimatedImpact: this.estimateImprovementImpact(result.result.suggestions || [])
        };
      }

      return this.generateFallbackSuggestions(analysis);

    } catch (error) {
      console.warn('Failed to generate AI suggestions, using fallback:', error.message);
      return this.generateFallbackSuggestions(analysis);
    }
  }

  /**
   * Helper methods
   */
  calculateTraditionalQuality(traditional) {
    const metrics = traditional.metrics || {};
    return (metrics.completeness + metrics.clarity + metrics.consistency) / 3;
  }

  calculateEnhancedQuality(enhanced) {
    return enhanced.confidence * 100;
  }

  calculateConfidence(analysis) {
    let confidence = 0.8; // Base confidence for traditional analysis

    if (analysis.enhanced) {
      confidence = (confidence + analysis.enhanced.confidence) / 2;
    }

    // Adjust based on quality score
    if (analysis.synthesis && analysis.synthesis.qualityScore > 80) confidence += 0.1;
    if (analysis.synthesis && analysis.synthesis.qualityScore < 60) confidence -= 0.2;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  getOverallAssessment(qualityScore) {
    if (qualityScore >= 80) return 'Excellent';
    if (qualityScore >= 70) return 'Good';
    if (qualityScore >= 60) return 'Acceptable';
    if (qualityScore >= 50) return 'Needs Improvement';
    return 'Poor';
  }

  identifyKeyStrengths(analysis) {
    const strengths = [];

    if (analysis.traditional.metrics.completeness > 80) {
      strengths.push('Well-structured and complete');
    }

    if (analysis.traditional.metrics.clarity > 80) {
      strengths.push('Clear and understandable');
    }

    if (analysis.traditional.validation.issues.length === 0) {
      strengths.push('No validation issues');
    }

    return strengths;
  }

  identifyImprovementAreas(analysis) {
    const areas = [];

    if (analysis.traditional.metrics.completeness < 70) {
      areas.push('Document completeness');
    }

    if (analysis.traditional.metrics.clarity < 70) {
      areas.push('Content clarity');
    }

    if (analysis.traditional.validation.issues.length > 0) {
      areas.push('Validation issues');
    }

    return areas;
  }

  prioritizeRecommendations(recommendations) {
    return recommendations
      .filter(rec => rec && rec.message)
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      })
      .slice(0, 10); // Top 10 recommendations
  }

  assessImplementationReadiness(analysis) {
    const traditional = analysis.traditional;
    const hasImplementationPlan = traditional.implementationPlan && traditional.implementationPlan.tasks.length > 0;
    const hasRequirements = traditional.requirements.functional.length > 0;
    const hasNoDependencyIssues = traditional.dependencies.length === 0 ||
                                 traditional.validation.issues.filter(i => i.includes('dependency')).length === 0;

    let readiness = 'Low';
    if (hasImplementationPlan && hasRequirements && hasNoDependencyIssues) {
      readiness = 'High';
    } else if ((hasImplementationPlan && hasRequirements) || (hasRequirements && hasNoDependencyIssues)) {
      readiness = 'Medium';
    }

    return {
      level: readiness,
      factors: {
        hasImplementationPlan,
        hasRequirements,
        hasNoDependencyIssues
      }
    };
  }

  generateTestingStrategy(analysis) {
    const strategy = {
      approach: 'Standard',
      methods: ['Unit Testing', 'Integration Testing'],
      coverage: 'Basic'
    };

    if (analysis.testabilityAnalysis) {
      strategy.approach = 'AI-Enhanced';
      strategy.methods = analysis.testabilityAnalysis.recommendations.map(r => r.method).filter(Boolean);
      strategy.testScenarios = analysis.testabilityAnalysis.testScenarios;
      strategy.coverage = 'Comprehensive';
    }

    return strategy;
  }

  generateRiskMitigation(analysis) {
    const risks = [];

    // Check for dependency risks
    if (analysis.traditional.dependencies.length > 3) {
      risks.push({
        risk: 'High dependency complexity',
        mitigation: 'Prioritize dependency management and create contingency plans'
      });
    }

    // Check for implementation risks
    if (analysis.implementationEnhancement?.riskAssessment) {
      risks.push(...analysis.implementationEnhancement.riskAssessment.map(risk => ({
        risk: risk.description,
        mitigation: risk.mitigation
      })));
    }

    return risks;
  }

  generateActionPlan(suggestions) {
    return suggestions.map((suggestion, index) => ({
      step: index + 1,
      action: suggestion.suggestion || suggestion.message,
      priority: suggestion.priority || 'medium',
      estimatedEffort: suggestion.estimatedEffort || 'Unknown',
      owner: 'Document Author'
    }));
  }

  estimateImprovementImpact(suggestions) {
    const highImpact = suggestions.filter(s => s.priority === 'high').length;
    const mediumImpact = suggestions.filter(s => s.priority === 'medium').length;

    return {
      potentialQualityGain: Math.min(30, highImpact * 10 + mediumImpact * 5),
      implementationEffort: highImpact > 3 ? 'High' : mediumImpact > 5 ? 'Medium' : 'Low',
      timeframe: highImpact > 0 ? '1-2 weeks' : '2-5 days'
    };
  }

  generateFallbackSuggestions(analysis) {
    const suggestions = [];

    if (analysis.traditional.metrics.completeness < 70) {
      suggestions.push({
        suggestion: 'Add missing sections to improve document completeness',
        priority: 'high',
        category: 'structure'
      });
    }

    if (analysis.traditional.validation.issues.length > 0) {
      suggestions.push({
        suggestion: 'Address validation issues identified in the analysis',
        priority: 'high',
        category: 'validation'
      });
    }

    return {
      prioritizedSuggestions: suggestions,
      actionPlan: this.generateActionPlan(suggestions),
      estimatedImpact: this.estimateImprovementImpact(suggestions)
    };
  }

  getIntegrationSummary(analysis) {
    return {
      enhancementApplied: analysis.enhanced !== null,
      qualityScore: analysis.synthesis ? analysis.synthesis.qualityScore : 0,
      confidence: analysis.synthesis ? analysis.synthesis.confidence : 0.5,
      improvementsGenerated: analysis.improvements ? analysis.improvements.prioritizedSuggestions.length : 0
    };
  }

  /**
   * Get integration metrics
   */
  getMetrics() {
    return {
      ...this.integrationMetrics,
      enhancementRate: this.integrationMetrics.totalAnalyses > 0 ?
        (this.integrationMetrics.enhancedAnalyses / this.integrationMetrics.totalAnalyses) * 100 : 0,
      averageQualityImprovement: this.integrationMetrics.qualityImprovements > 0 ?
        (this.integrationMetrics.qualityImprovements / this.integrationMetrics.enhancedAnalyses) * 100 : 0
    };
  }
}

module.exports = RequirementsPrecisionIntegration;