/**
 * Advanced Performance Analytics Tracker
 * Comprehensive team productivity measurement and optimization recommendations
 * Target: <200ms response time, >1000 events/second throughput
 */

const EventEmitter = require('events');

class PerformanceTracker extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.teamMetrics = new Map();
    this.projectMetrics = new Map();
    this.realTimeEvents = [];
    this.benchmarks = new Map();
    this.intervals = []; // Store intervals for cleanup
    this.initialized = false;

    this.initialize();
  }

  async initialize() {
    console.log('📊 Initializing Performance Analytics Tracker...');

    // Initialize performance tracking
    this.initializeMetrics();
    this.initializeBenchmarks();
    this.startRealTimeTracking();

    this.initialized = true;
    this.emit('initialized');
    console.log('✅ Performance Tracker ready');
  }

  initializeMetrics() {
    // Team performance metrics
    this.teamMetrics.set('velocity', {
      current: 0,
      historical: [],
      trend: 'stable',
      target: 100
    });

    this.teamMetrics.set('productivity', {
      current: 0,
      historical: [],
      factors: {
        focus_time: 0,
        collaboration_time: 0,
        meeting_time: 0,
        development_time: 0
      }
    });

    this.teamMetrics.set('quality', {
      current: 0,
      defect_rate: 0,
      code_review_coverage: 0,
      test_coverage: 0
    });

    // Project performance metrics
    this.projectMetrics.set('completion_rate', {
      current: 0,
      onTime: 0,
      delayed: 0,
      early: 0
    });

    this.projectMetrics.set('resource_efficiency', {
      current: 0,
      allocation: new Map(),
      utilization: new Map(),
      capacity: new Map()
    });

    this.projectMetrics.set('complexity_analysis', {
      average_complexity: 0,
      complexity_distribution: new Map(),
      optimization_opportunities: []
    });
  }

  initializeBenchmarks() {
    // Industry benchmarks for comparison
    this.benchmarks.set('team_velocity', {
      excellent: 120,
      good: 100,
      average: 80,
      below_average: 60
    });

    this.benchmarks.set('code_quality', {
      excellent: 0.95,
      good: 0.85,
      average: 0.75,
      below_average: 0.65
    });

    this.benchmarks.set('delivery_predictability', {
      excellent: 0.9,
      good: 0.8,
      average: 0.7,
      below_average: 0.6
    });
  }

  startRealTimeTracking() {
    // Add timeout protection to prevent infinite loops
    // Process real-time events every 100ms for high throughput
    const eventInterval = setInterval(() => {
      try {
        const startTime = Date.now();
        this.processRealTimeEvents();
        const processingTime = Date.now() - startTime;

        // Warn if processing takes too long
        if (processingTime > 50) {
          console.warn(`⚠️ Event processing took ${processingTime}ms`);
        }
      } catch (error) {
        console.error('❌ Error in real-time event processing:', error);
      }
    }, 100);
    this.intervals.push(eventInterval);

    // Update metrics every 5 seconds with timeout protection
    const metricsInterval = setInterval(() => {
      try {
        const startTime = Date.now();
        this.updateMetrics();
        const processingTime = Date.now() - startTime;

        if (processingTime > 200) {
          console.warn(`⚠️ Metrics update took ${processingTime}ms`);
        }
      } catch (error) {
        console.error('❌ Error in metrics update:', error);
      }
    }, 5000);
    this.intervals.push(metricsInterval);

    // Generate insights every minute with timeout protection
    const insightsInterval = setInterval(() => {
      try {
        const startTime = Date.now();
        this.generateInsights();
        const processingTime = Date.now() - startTime;

        if (processingTime > 500) {
          console.warn(`⚠️ Insights generation took ${processingTime}ms`);
        }
      } catch (error) {
        console.error('❌ Error in insights generation:', error);
      }
    }, 60000);
    this.intervals.push(insightsInterval);
  }

  /**
   * Track team velocity and performance
   * @param {Object} teamData - Team performance data
   */
  async trackTeamVelocity(teamData) {
    const startTime = Date.now();

    // Add input validation with fallback
    if (!teamData) {
      throw new Error('Invalid team data: teamData is required');
    }

    // Provide default teamId if missing
    if (!teamData.teamId) {
      teamData.teamId = 'default_team';
    }

    try {
      // Add timeout protection for calculations
      const calculationPromise = Promise.all([
        Promise.resolve(this.calculateVelocity(teamData)),
        Promise.resolve(this.calculateProductivity(teamData)),
        Promise.resolve(this.calculateCollaborationMetrics(teamData))
      ]);

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Team velocity calculation timeout')), 1000);
      });

      const [velocity, productivity, collaboration] = await Promise.race([
        calculationPromise,
        timeoutPromise
      ]);

      const metrics = {
        teamId: teamData.teamId,
        velocity: {
          current: velocity.current,
          trend: velocity.trend,
          prediction: velocity.prediction
        },
        productivity: {
          score: productivity.score,
          factors: productivity.factors,
          recommendations: productivity.recommendations
        },
        collaboration: {
          score: collaboration.score,
          patterns: collaboration.patterns,
          effectiveness: collaboration.effectiveness
        },
        timestamp: new Date()
      };

      this.teamMetrics.set(teamData.teamId, metrics);
      this.emit('teamVelocityTracked', metrics);

      // Performance requirement: <200ms response time
      const responseTime = Date.now() - startTime;
      if (responseTime > 200) {
        console.warn(`⚠️ Team velocity tracking exceeded 200ms: ${responseTime}ms`);
      }

      return metrics;
    } catch (error) {
      console.error('❌ Error tracking team velocity:', error);
      throw error;
    }
  }

  /**
   * Analyze document complexity and optimization opportunities
   * @param {Object} documentData - Document analysis data
   */
  async analyzeDocumentComplexity(documentData) {
    const startTime = Date.now();

    try {
      const complexity = this.calculateDocumentComplexity(documentData);
      const readability = this.calculateReadability(documentData);
      const optimization = this.generateOptimizationSuggestions(documentData, complexity);

      const analysis = {
        documentId: documentData.id,
        complexity: {
          score: complexity.score,
          factors: complexity.factors,
          distribution: complexity.distribution
        },
        readability: {
          score: readability.score,
          grade_level: readability.gradeLevel,
          suggestions: readability.suggestions
        },
        optimization: {
          opportunities: optimization.opportunities,
          priority: optimization.priority,
          impact: optimization.impact
        },
        timestamp: new Date()
      };

      this.projectMetrics.set(`doc_${documentData.id}`, analysis);
      this.emit('documentComplexityAnalyzed', analysis);

      const responseTime = Date.now() - startTime;
      return analysis;
    } catch (error) {
      console.error('❌ Error analyzing document complexity:', error);
      throw error;
    }
  }

  /**
   * Generate resource allocation recommendations
   * @param {Object} projectData - Project resource data
   */
  async generateResourceRecommendations(projectData) {
    const startTime = Date.now();

    try {
      const allocation = this.analyzeCurrentAllocation(projectData);
      const optimization = this.optimizeResourceAllocation(projectData, allocation);
      const predictions = this.predictResourceNeeds(projectData);

      const recommendations = {
        projectId: projectData.id,
        current_allocation: allocation,
        optimized_allocation: optimization.allocation,
        efficiency_gain: optimization.efficiencyGain,
        predicted_needs: predictions,
        actionable_steps: optimization.steps,
        timeline: optimization.timeline,
        timestamp: new Date()
      };

      this.emit('resourceRecommendationsGenerated', recommendations);

      const responseTime = Date.now() - startTime;
      return recommendations;
    } catch (error) {
      console.error('❌ Error generating resource recommendations:', error);
      throw error;
    }
  }

  /**
   * Track capacity planning with predictive analytics
   * @param {Object} capacityData - Team capacity data
   */
  async trackCapacityPlanning(capacityData) {
    const capacity = this.calculateTeamCapacity(capacityData);
    const utilization = this.calculateUtilization(capacityData);
    const forecast = this.forecastCapacityNeeds(capacityData);

    const planning = {
      teamId: capacityData.teamId,
      current_capacity: capacity.current,
      projected_capacity: capacity.projected,
      utilization_rate: utilization.rate,
      utilization_trend: utilization.trend,
      forecast: {
        next_sprint: forecast.nextSprint,
        next_quarter: forecast.nextQuarter,
        confidence: forecast.confidence
      },
      recommendations: this.generateCapacityRecommendations(capacity, utilization, forecast),
      timestamp: new Date()
    };

    this.teamMetrics.set(`capacity_${capacityData.teamId}`, planning);
    this.emit('capacityPlanningTracked', planning);

    return planning;
  }

  /**
   * Process real-time performance events
   */
  processRealTimeEvents() {
    if (this.realTimeEvents.length === 0) return;

    const batchSize = Math.min(1000, this.realTimeEvents.length);
    const batch = this.realTimeEvents.splice(0, batchSize);

    batch.forEach(event => {
      this.processEvent(event);
    });

    // Emit throughput metrics
    this.emit('throughputMetrics', {
      eventsProcessed: batch.length,
      queueSize: this.realTimeEvents.length,
      timestamp: new Date()
    });
  }

  processEvent(event) {
    switch (event.type) {
      case 'task_completed':
        this.updateVelocityMetrics(event);
        break;
      case 'code_committed':
        this.updateProductivityMetrics(event);
        break;
      case 'document_edited':
        this.updateCollaborationMetrics(event);
        break;
      case 'meeting_attended':
        this.updateTimeAllocationMetrics(event);
        break;
      default:
        // Handle unknown event types
        break;
    }
  }

  updateMetrics() {
    // Update all cached metrics
    this.updateTeamMetrics();
    this.updateProjectMetrics();
    this.updatePerformanceTrends();
  }

  generateInsights() {
    const insights = {
      teams: this.generateTeamInsights(),
      projects: this.generateProjectInsights(),
      optimization: this.generateOptimizationInsights(),
      predictions: this.generatePredictiveInsights(),
      timestamp: new Date()
    };

    this.emit('insightsGenerated', insights);
    return insights;
  }

  // Calculation methods
  calculateVelocity(teamData) {
    const completedStoryPoints = teamData.completedStoryPoints || 0;
    const sprintDuration = teamData.sprintDuration || 2; // weeks
    const teamSize = teamData.teamSize || 5;

    const velocity = completedStoryPoints / sprintDuration;
    const normalizedVelocity = velocity / teamSize; // per person

    // Calculate trend
    const historical = teamData.historicalVelocity || [];
    const trend = this.calculateTrend(historical.concat(velocity));

    // Predict next sprint velocity
    const prediction = this.predictNextVelocity(historical, trend);

    return {
      current: Math.round(velocity * 100) / 100,
      normalized: Math.round(normalizedVelocity * 100) / 100,
      trend,
      prediction: Math.round(prediction * 100) / 100
    };
  }

  calculateProductivity(teamData) {
    const factors = {
      focus_time: (teamData.focusTime || 6) / 8, // hours per day
      meeting_time: Math.max(0, 1 - (teamData.meetingTime || 2) / 8),
      interruptions: Math.max(0, 1 - (teamData.interruptions || 3) / 10),
      tools_efficiency: teamData.toolsEfficiency || 0.8
    };

    const weights = {
      focus_time: 0.4,
      meeting_time: 0.2,
      interruptions: 0.2,
      tools_efficiency: 0.2
    };

    const score = Object.entries(factors).reduce((sum, [factor, value]) => {
      return sum + (value * weights[factor]);
    }, 0);

    const recommendations = this.generateProductivityRecommendations(factors);

    return {
      score: Math.round(score * 100) / 100,
      factors,
      recommendations
    };
  }

  calculateCollaborationMetrics(teamData) {
    const patterns = {
      pair_programming: teamData.pairProgrammingHours || 0,
      code_reviews: teamData.codeReviews || 0,
      knowledge_sharing: teamData.knowledgeSharingSessions || 0,
      cross_training: teamData.crossTrainingHours || 0
    };

    const effectiveness = {
      communication_frequency: teamData.communicationFrequency || 5,
      decision_speed: teamData.decisionSpeed || 3,
      conflict_resolution: teamData.conflictResolution || 4
    };

    const score = (
      (patterns.pair_programming * 0.2) +
      (patterns.code_reviews * 0.3) +
      (patterns.knowledge_sharing * 0.25) +
      (effectiveness.communication_frequency * 0.15) +
      (effectiveness.decision_speed * 0.1)
    ) / 10;

    return {
      score: Math.max(0, Math.min(1, score)),
      patterns,
      effectiveness
    };
  }

  calculateDocumentComplexity(documentData) {
    const factors = {
      word_count: Math.min(1, (documentData.wordCount || 1000) / 5000),
      sentence_complexity: this.analyzeSentenceComplexity(documentData.content),
      technical_terms: this.countTechnicalTerms(documentData.content),
      structure_depth: this.analyzeStructureDepth(documentData.structure),
      cross_references: (documentData.crossReferences || []).length / 10
    };

    const weights = {
      word_count: 0.2,
      sentence_complexity: 0.3,
      technical_terms: 0.2,
      structure_depth: 0.15,
      cross_references: 0.15
    };

    const score = Object.entries(factors).reduce((sum, [factor, value]) => {
      return sum + (value * weights[factor]);
    }, 0);

    return {
      score: Math.round(score * 100) / 100,
      factors,
      distribution: this.categorizeComplexity(score)
    };
  }

  calculateReadability(documentData) {
    const content = documentData.content || '';
    const sentences = content.split(/[.!?]+/).length - 1;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);

    // Flesch Reading Ease
    const fleschScore = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    const gradeLevel = this.getGradeLevel(fleschScore);

    const suggestions = this.generateReadabilitySuggestions(fleschScore, documentData);

    return {
      score: Math.max(0, Math.min(100, fleschScore)),
      gradeLevel,
      suggestions
    };
  }

  generateOptimizationSuggestions(documentData, complexity) {
    const opportunities = [];
    let priorityScore = 0;

    if (complexity.score > 0.8) {
      opportunities.push({
        type: 'complexity_reduction',
        description: 'Document complexity is very high',
        action: 'Break down into smaller, focused sections',
        impact: 'high',
        effort: 'medium'
      });
      priorityScore += 3;
    }

    if (complexity.factors.sentence_complexity > 0.7) {
      opportunities.push({
        type: 'sentence_simplification',
        description: 'Sentences are overly complex',
        action: 'Simplify sentence structure and reduce jargon',
        impact: 'medium',
        effort: 'low'
      });
      priorityScore += 2;
    }

    if (complexity.factors.structure_depth > 0.6) {
      opportunities.push({
        type: 'structure_optimization',
        description: 'Document structure is too deep',
        action: 'Flatten hierarchy and improve navigation',
        impact: 'medium',
        effort: 'medium'
      });
      priorityScore += 2;
    }

    return {
      opportunities,
      priority: this.categorizePriority(priorityScore),
      impact: this.calculateOptimizationImpact(opportunities)
    };
  }

  analyzeCurrentAllocation(projectData) {
    const allocation = new Map();

    // Analyze current resource distribution
    if (projectData.team) {
      projectData.team.forEach(member => {
        allocation.set(member.id, {
          name: member.name,
          role: member.role,
          allocation: member.allocation || 1.0,
          utilization: member.utilization || 0.8,
          skills: member.skills || [],
          currentTasks: member.currentTasks || []
        });
      });
    }

    return allocation;
  }

  optimizeResourceAllocation(projectData, currentAllocation) {
    const optimization = new Map();
    let totalEfficiencyGain = 0;

    // Optimize based on skills matching and workload balancing
    for (const [memberId, member] of currentAllocation) {
      const skillMatch = this.calculateSkillMatch(member, projectData.requirements);
      const workloadOptimization = this.calculateOptimalWorkload(member);

      const optimizedAllocation = {
        ...member,
        optimized_allocation: workloadOptimization.optimal,
        skill_match: skillMatch.score,
        recommended_tasks: skillMatch.recommendedTasks,
        efficiency_gain: workloadOptimization.gain
      };

      optimization.set(memberId, optimizedAllocation);
      totalEfficiencyGain += workloadOptimization.gain;
    }

    const steps = this.generateOptimizationSteps(optimization);

    return {
      allocation: optimization,
      efficiencyGain: totalEfficiencyGain / currentAllocation.size,
      steps,
      timeline: this.calculateOptimizationTimeline(steps)
    };
  }

  predictResourceNeeds(projectData) {
    const currentBurnRate = projectData.burnRate || 0.1; // percentage per week
    const remainingWork = 1 - (projectData.progress || 0);
    const projectedWeeks = remainingWork / currentBurnRate;

    const resourcePrediction = {
      projected_completion: new Date(Date.now() + projectedWeeks * 7 * 24 * 60 * 60 * 1000),
      additional_resources_needed: Math.max(0, projectedWeeks - (projectData.timeRemaining || 8)),
      risk_factors: this.identifyResourceRisks(projectData),
      confidence: this.calculatePredictionConfidence(projectData)
    };

    return resourcePrediction;
  }

  // Helper methods
  calculateTrend(values) {
    if (values.length < 2) return 'stable';

    const recent = values.slice(-3);
    const older = values.slice(-6, -3);

    if (recent.length === 0 || older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;

    if (change > 0.1) return 'improving';
    if (change < -0.1) return 'declining';
    return 'stable';
  }

  predictNextVelocity(historical, trend) {
    if (historical.length === 0) return 0;

    const latest = historical[historical.length - 1];
    const trendMultiplier = trend === 'improving' ? 1.1 : trend === 'declining' ? 0.9 : 1.0;

    return latest * trendMultiplier;
  }

  generateProductivityRecommendations(factors) {
    const recommendations = [];

    if (factors.focus_time < 0.6) {
      recommendations.push({
        area: 'Focus Time',
        action: 'Block calendar for deep work sessions',
        impact: 'Increase productivity by 20-30%'
      });
    }

    if (factors.meeting_time < 0.5) {
      recommendations.push({
        area: 'Meeting Efficiency',
        action: 'Review meeting necessity and reduce duration',
        impact: 'Reclaim 5-10 hours per week'
      });
    }

    if (factors.interruptions < 0.7) {
      recommendations.push({
        area: 'Interruption Management',
        action: 'Implement quiet hours and communication protocols',
        impact: 'Improve concentration by 25%'
      });
    }

    return recommendations;
  }

  // Additional helper methods for complex calculations
  analyzeSentenceComplexity(content) {
    if (!content) return 0;

    const sentences = content.split(/[.!?]+/);
    const avgWordsPerSentence = content.split(/\s+/).length / sentences.length;

    // Normalize: 15 words = 0.5, 30+ words = 1.0
    return Math.min(1, Math.max(0, (avgWordsPerSentence - 10) / 20));
  }

  countTechnicalTerms(content) {
    if (!content) return 0;

    const technicalPatterns = [
      /API|REST|GraphQL|microservice/gi,
      /database|SQL|NoSQL|schema/gi,
      /authentication|authorization|OAuth/gi,
      /deployment|CI\/CD|DevOps/gi
    ];

    let technicalTerms = 0;
    technicalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) technicalTerms += matches.length;
    });

    const totalWords = content.split(/\s+/).length;
    return Math.min(1, technicalTerms / (totalWords * 0.1));
  }

  analyzeStructureDepth(structure) {
    if (!structure || !structure.sections) return 0;

    let maxDepth = 0;
    const calculateDepth = (sections, depth = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      sections.forEach(section => {
        if (section.subsections) {
          calculateDepth(section.subsections, depth + 1);
        }
      });
    };

    calculateDepth(structure.sections);
    return Math.min(1, maxDepth / 5); // Normalize to 0-1, where 5+ levels = 1.0
  }

  countSyllables(text) {
    return text.toLowerCase().split(/\s+/).reduce((count, word) => {
      const syllableCount = word.match(/[aeiouy]+/g)?.length || 1;
      return count + syllableCount;
    }, 0);
  }

  getGradeLevel(fleschScore) {
    if (fleschScore >= 90) return 'Grade 5';
    if (fleschScore >= 80) return 'Grade 6';
    if (fleschScore >= 70) return 'Grade 7';
    if (fleschScore >= 60) return 'Grade 8-9';
    if (fleschScore >= 50) return 'Grade 10-12';
    if (fleschScore >= 30) return 'College';
    return 'Graduate';
  }

  generateReadabilitySuggestions(score, documentData) {
    const suggestions = [];

    if (score < 50) {
      suggestions.push('Simplify sentence structure');
      suggestions.push('Use more common words');
      suggestions.push('Add more white space and bullet points');
    }

    if (score < 30) {
      suggestions.push('Break up long paragraphs');
      suggestions.push('Use active voice instead of passive');
      suggestions.push('Add examples and illustrations');
    }

    return suggestions;
  }

  categorizeComplexity(score) {
    if (score < 0.3) return 'low';
    if (score < 0.6) return 'medium';
    if (score < 0.8) return 'high';
    return 'very_high';
  }

  categorizePriority(score) {
    if (score >= 7) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  calculateOptimizationImpact(opportunities) {
    const impactScores = {
      high: 3,
      medium: 2,
      low: 1
    };

    const totalImpact = opportunities.reduce((sum, opp) => {
      return sum + (impactScores[opp.impact] || 1);
    }, 0);

    return totalImpact / opportunities.length;
  }

  // Enhanced updateTeamMetrics with timeout protection
  updateTeamMetrics() {
    try {
      const startTime = Date.now();

      // Update team-level cached metrics with bounds checking
      for (const [teamId, metrics] of this.teamMetrics) {
        if (typeof metrics === 'object' && metrics.velocity) {
          // Update trend analysis
          if (!metrics.velocity.historical) {
            metrics.velocity.historical = [];
          }

          // Add current velocity to historical data
          if (metrics.velocity.current > 0) {
            metrics.velocity.historical.push(metrics.velocity.current);
            // Keep only last 10 data points for trend analysis
            if (metrics.velocity.historical.length > 10) {
              metrics.velocity.historical = metrics.velocity.historical.slice(-10);
            }

            // Update trend
            metrics.velocity.trend = this.calculateTrend(metrics.velocity.historical);
          }
        }

        // Update team metrics timestamp
        if (typeof metrics === 'object') {
          metrics.lastUpdated = new Date();
        }

        // Add processing time check
        const processingTime = Date.now() - startTime;
        if (processingTime > 100) {
          console.warn(`⚠️ Team metrics update taking too long: ${processingTime}ms`);
          break; // Stop processing if taking too long
        }
      }
    } catch (error) {
      console.error('❌ Error updating team metrics:', error);
    }
  }

  updateProjectMetrics() {
    // Update project-level cached metrics
    for (const [projectId, metrics] of this.projectMetrics) {
      if (typeof metrics === 'object') {
        // Update completion rate calculations
        if (metrics.completion_rate) {
          const total = metrics.completion_rate.onTime +
                       metrics.completion_rate.delayed +
                       metrics.completion_rate.early;

          if (total > 0) {
            metrics.completion_rate.current = metrics.completion_rate.onTime / total;
          }
        }

        // Update resource efficiency
        if (metrics.resource_efficiency && metrics.resource_efficiency.allocation) {
          let totalUtilization = 0;
          let totalCapacity = 0;

          for (const [resourceId, data] of metrics.resource_efficiency.allocation) {
            if (typeof data === 'object' && data.utilization && data.capacity) {
              totalUtilization += data.utilization;
              totalCapacity += data.capacity;
            }
          }

          if (totalCapacity > 0) {
            metrics.resource_efficiency.current = totalUtilization / totalCapacity;
          }
        }

        // Update timestamp
        metrics.lastUpdated = new Date();
      }
    }
  }

  updatePerformanceTrends() {
    // Calculate and update overall performance trends
    const teamVelocities = [];
    const qualityScores = [];

    // Aggregate data from all teams
    for (const [teamId, metrics] of this.teamMetrics) {
      if (typeof metrics === 'object') {
        if (metrics.velocity && metrics.velocity.current) {
          teamVelocities.push(metrics.velocity.current);
        }
        if (metrics.quality && metrics.quality.current) {
          qualityScores.push(metrics.quality.current);
        }
      }
    }

    // Calculate overall trends
    const overallTrends = {
      velocity: {
        average: teamVelocities.length > 0 ?
          teamVelocities.reduce((sum, v) => sum + v, 0) / teamVelocities.length : 0,
        trend: this.calculateTrend(teamVelocities),
        distribution: this.calculateDistribution(teamVelocities)
      },
      quality: {
        average: qualityScores.length > 0 ?
          qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length : 0,
        trend: this.calculateTrend(qualityScores),
        distribution: this.calculateDistribution(qualityScores)
      },
      timestamp: new Date()
    };

    // Store trends
    this.metrics.set('overall_trends', overallTrends);
    this.emit('trendsUpdated', overallTrends);
  }

  // Missing velocity metric update methods
  updateVelocityMetrics(event) {
    if (!event.teamId) return;

    const teamMetrics = this.teamMetrics.get(event.teamId) || this.initializeTeamMetrics(event.teamId);

    if (teamMetrics.velocity) {
      teamMetrics.velocity.current += event.storyPoints || 1;
      teamMetrics.velocity.historical.push(teamMetrics.velocity.current);

      // Keep historical data manageable
      if (teamMetrics.velocity.historical.length > 20) {
        teamMetrics.velocity.historical = teamMetrics.velocity.historical.slice(-15);
      }
    }

    this.teamMetrics.set(event.teamId, teamMetrics);
  }

  updateProductivityMetrics(event) {
    if (!event.teamId && !event.userId) return;

    const teamId = event.teamId || `team_${event.userId}`;
    const teamMetrics = this.teamMetrics.get(teamId) || this.initializeTeamMetrics(teamId);

    if (teamMetrics.productivity) {
      // Update development time factor
      teamMetrics.productivity.factors.development_time += 0.1;

      // Recalculate productivity score
      const factors = teamMetrics.productivity.factors;
      const score = (
        factors.focus_time * 0.3 +
        factors.collaboration_time * 0.2 +
        factors.development_time * 0.4 +
        (1 - factors.meeting_time) * 0.1
      );
      teamMetrics.productivity.current = Math.min(1, score);
    }

    this.teamMetrics.set(teamId, teamMetrics);
  }

  updateCollaborationMetrics(event) {
    if (!event.teamId && !event.userId) return;

    const teamId = event.teamId || `team_${event.userId}`;
    const teamMetrics = this.teamMetrics.get(teamId) || this.initializeTeamMetrics(teamId);

    if (teamMetrics.productivity) {
      // Update collaboration time
      teamMetrics.productivity.factors.collaboration_time += 0.05;
      teamMetrics.productivity.factors.collaboration_time = Math.min(1,
        teamMetrics.productivity.factors.collaboration_time);
    }

    this.teamMetrics.set(teamId, teamMetrics);
  }

  updateTimeAllocationMetrics(event) {
    if (!event.teamId && !event.userId) return;

    const teamId = event.teamId || `team_${event.userId}`;
    const teamMetrics = this.teamMetrics.get(teamId) || this.initializeTeamMetrics(teamId);

    if (teamMetrics.productivity) {
      // Update meeting time factor
      teamMetrics.productivity.factors.meeting_time += 0.1;
      teamMetrics.productivity.factors.meeting_time = Math.min(1,
        teamMetrics.productivity.factors.meeting_time);
    }

    this.teamMetrics.set(teamId, teamMetrics);
  }

  initializeTeamMetrics(teamId) {
    return {
      velocity: {
        current: 0,
        historical: [],
        trend: 'stable',
        target: 100
      },
      productivity: {
        current: 0,
        historical: [],
        factors: {
          focus_time: 0.8,
          collaboration_time: 0.6,
          meeting_time: 0.2,
          development_time: 0.7
        }
      },
      quality: {
        current: 0.8,
        defect_rate: 0.05,
        code_review_coverage: 0.9,
        test_coverage: 0.85
      },
      lastUpdated: new Date()
    };
  }

  calculateDistribution(values) {
    if (values.length === 0) return { min: 0, max: 0, stdDev: 0 };

    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { min, max, mean, stdDev };
  }

  // Missing insight generation methods
  generateTeamInsights() {
    const insights = [];

    for (const [teamId, metrics] of this.teamMetrics) {
      if (typeof metrics === 'object') {
        const insight = {
          teamId,
          velocity: metrics.velocity,
          productivity: metrics.productivity,
          quality: metrics.quality,
          recommendations: this.generateTeamRecommendations(metrics)
        };
        insights.push(insight);
      }
    }

    return insights;
  }

  generateProjectInsights() {
    const insights = [];

    for (const [projectId, metrics] of this.projectMetrics) {
      if (typeof metrics === 'object') {
        const insight = {
          projectId,
          completionRate: metrics.completion_rate,
          resourceEfficiency: metrics.resource_efficiency,
          complexityAnalysis: metrics.complexity_analysis,
          recommendations: this.generateProjectRecommendations(metrics)
        };
        insights.push(insight);
      }
    }

    return insights;
  }

  generateOptimizationInsights() {
    const overallTrends = this.metrics.get('overall_trends');
    if (!overallTrends) return [];

    const insights = [];

    // Velocity optimization insights
    if (overallTrends.velocity.trend === 'declining') {
      insights.push({
        type: 'velocity_optimization',
        priority: 'high',
        message: 'Team velocity is declining across projects',
        recommendation: 'Review workload distribution and remove blockers',
        impact: 'Potential 15-20% velocity improvement'
      });
    }

    // Quality optimization insights
    if (overallTrends.quality.average < 0.8) {
      insights.push({
        type: 'quality_optimization',
        priority: 'high',
        message: 'Overall quality metrics below target threshold',
        recommendation: 'Increase code review frequency and test coverage',
        impact: 'Reduce defects by 25-30%'
      });
    }

    return insights;
  }

  generatePredictiveInsights() {
    const overallTrends = this.metrics.get('overall_trends');
    if (!overallTrends) return {};

    return {
      velocityForecast: this.forecastVelocity(overallTrends.velocity),
      qualityPrediction: this.predictQualityTrend(overallTrends.quality),
      resourceDemand: this.predictResourceDemand(),
      riskFactors: this.identifyRiskFactors()
    };
  }

  generateTeamRecommendations(metrics) {
    const recommendations = [];

    if (metrics.velocity && metrics.velocity.trend === 'declining') {
      recommendations.push({
        area: 'Velocity',
        action: 'Review and reduce blockers',
        priority: 'high'
      });
    }

    if (metrics.productivity && metrics.productivity.current < 0.7) {
      recommendations.push({
        area: 'Productivity',
        action: 'Optimize focus time and reduce meetings',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  generateProjectRecommendations(metrics) {
    const recommendations = [];

    if (metrics.completion_rate && metrics.completion_rate.current < 0.8) {
      recommendations.push({
        area: 'Delivery',
        action: 'Review project timeline and resource allocation',
        priority: 'high'
      });
    }

    return recommendations;
  }

  forecastVelocity(velocityData) {
    if (!velocityData.trend || velocityData.average === 0) {
      return { forecast: velocityData.average, confidence: 0.5 };
    }

    const trendMultiplier = velocityData.trend === 'improving' ? 1.1 :
                           velocityData.trend === 'declining' ? 0.9 : 1.0;

    return {
      forecast: velocityData.average * trendMultiplier,
      confidence: 0.75,
      trend: velocityData.trend
    };
  }

  predictQualityTrend(qualityData) {
    return {
      predicted: qualityData.average,
      confidence: 0.8,
      trend: qualityData.trend
    };
  }

  predictResourceDemand() {
    const teamCount = this.teamMetrics.size;
    const avgUtilization = 0.8; // Default assumption

    return {
      currentDemand: teamCount * avgUtilization,
      projectedDemand: teamCount * avgUtilization * 1.1,
      recommendedCapacity: teamCount * 1.2
    };
  }

  identifyRiskFactors() {
    const risks = [];
    const overallTrends = this.metrics.get('overall_trends');

    if (overallTrends && overallTrends.velocity.trend === 'declining') {
      risks.push({
        factor: 'velocity_decline',
        severity: 'medium',
        description: 'Team velocity showing declining trend'
      });
    }

    return risks;
  }

  // Additional calculation helper methods
  calculateTeamCapacity(capacityData) {
    const totalCapacity = capacityData.totalCapacity || 200;
    const currentAllocation = capacityData.currentAllocation || 170;

    return {
      current: totalCapacity,
      projected: totalCapacity * 1.1,
      available: totalCapacity - currentAllocation
    };
  }

  calculateUtilization(capacityData) {
    const capacity = capacityData.totalCapacity || 200;
    const allocation = capacityData.currentAllocation || 170;

    const rate = capacity > 0 ? allocation / capacity : 0;

    return {
      rate: Math.min(1, rate),
      trend: rate > 0.9 ? 'high' : rate > 0.7 ? 'optimal' : 'low'
    };
  }

  forecastCapacityNeeds(capacityData) {
    const currentRate = capacityData.currentAllocation / capacityData.totalCapacity;

    return {
      nextSprint: capacityData.totalCapacity * currentRate * 1.05,
      nextQuarter: capacityData.totalCapacity * currentRate * 1.15,
      confidence: 0.8
    };
  }

  generateCapacityRecommendations(capacity, utilization, forecast) {
    const recommendations = [];

    if (utilization.rate > 0.9) {
      recommendations.push({
        type: 'capacity_expansion',
        priority: 'high',
        action: 'Consider adding team members or redistributing workload',
        impact: 'Prevent burnout and maintain quality'
      });
    }

    if (forecast.confidence < 0.7) {
      recommendations.push({
        type: 'planning_improvement',
        priority: 'medium',
        action: 'Improve capacity planning accuracy',
        impact: 'Better resource allocation decisions'
      });
    }

    return recommendations;
  }

  calculateSkillMatch(member, requirements) {
    if (!member.skills || !requirements) {
      return { score: 0.5, recommendedTasks: [] };
    }

    const skillMatches = requirements.filter(req =>
      member.skills.includes(req)).length;
    const score = requirements.length > 0 ? skillMatches / requirements.length : 0.5;

    return {
      score: Math.min(1, score),
      recommendedTasks: requirements.filter(req => member.skills.includes(req))
    };
  }

  calculateOptimalWorkload(member) {
    const currentAllocation = member.allocation || 1.0;
    const currentUtilization = member.utilization || 0.8;

    // Optimal range is 0.75-0.9 utilization
    let optimal = currentAllocation;
    if (currentUtilization > 0.9) {
      optimal = currentAllocation * 0.9; // Reduce workload
    } else if (currentUtilization < 0.75) {
      optimal = Math.min(1.0, currentAllocation * 1.1); // Increase workload
    }

    const gain = Math.abs(optimal - currentAllocation) / currentAllocation;

    return {
      optimal,
      gain,
      recommendation: optimal > currentAllocation ? 'increase' :
                     optimal < currentAllocation ? 'decrease' : 'maintain'
    };
  }

  generateOptimizationSteps(optimization) {
    const steps = [];

    for (const [memberId, member] of optimization) {
      if (member.efficiency_gain > 0.1) {
        steps.push({
          member: member.name,
          action: `Adjust allocation from ${member.allocation} to ${member.optimized_allocation}`,
          timeline: '1 week',
          expectedGain: `${Math.round(member.efficiency_gain * 100)}% efficiency improvement`
        });
      }
    }

    return steps;
  }

  calculateOptimizationTimeline(steps) {
    // Simple timeline calculation based on number of steps
    const weeks = Math.ceil(steps.length / 3); // Process 3 changes per week
    return {
      duration: `${weeks} week${weeks !== 1 ? 's' : ''}`,
      phases: steps.length > 3 ? ['preparation', 'implementation', 'validation'] : ['implementation']
    };
  }

  identifyResourceRisks(projectData) {
    const risks = [];

    if (projectData.burnRate > 0.15) {
      risks.push({
        risk: 'high_burn_rate',
        severity: 'high',
        description: 'Project consuming resources faster than planned'
      });
    }

    if (projectData.progress < 0.3 && projectData.timeRemaining < 4) {
      risks.push({
        risk: 'timeline_pressure',
        severity: 'critical',
        description: 'Insufficient time remaining for current progress'
      });
    }

    return risks;
  }

  calculatePredictionConfidence(projectData) {
    const factors = [
      projectData.progress || 0,
      projectData.team?.length || 0,
      projectData.burnRate ? 1 : 0
    ];

    const completeness = factors.filter(f => f > 0).length / factors.length;
    return Math.min(0.95, 0.5 + (completeness * 0.4));
  }

  // Enhanced event recording with safety checks
  recordEvent(event) {
    try {
      // Input validation
      if (!event || typeof event !== 'object') {
        console.warn('⚠️ Invalid event data provided to recordEvent');
        return;
      }

      this.realTimeEvents.push({
        ...event,
        timestamp: Date.now()
      });

      // Maintain event queue size for performance with more aggressive pruning
      if (this.realTimeEvents.length > 5000) {
        this.realTimeEvents = this.realTimeEvents.slice(-2000);
      }
    } catch (error) {
      console.error('❌ Error recording event:', error);
    }
  }

  // Public API methods
  getTeamMetrics(teamId) {
    return this.teamMetrics.get(teamId);
  }

  getProjectMetrics(projectId) {
    return this.projectMetrics.get(projectId);
  }

  getBenchmarks() {
    return Object.fromEntries(this.benchmarks);
  }

  getPerformanceSummary() {
    return {
      teams: Object.fromEntries(this.teamMetrics),
      projects: Object.fromEntries(this.projectMetrics),
      realTimeQueueSize: this.realTimeEvents.length,
      timestamp: new Date()
    };
  }

  // Cleanup method for tests
  cleanup() {
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    // Remove all listeners
    this.removeAllListeners();

    // Clear data structures
    this.metrics.clear();
    this.teamMetrics.clear();
    this.projectMetrics.clear();
    this.realTimeEvents.length = 0;
  }
}

module.exports = PerformanceTracker;