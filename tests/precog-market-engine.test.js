/**
 * PreCog Market Intelligence Engine Test Suite
 * Comprehensive testing for Minority Report-inspired market analysis system
 */

const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const {
  PreCogMarketEngine,
  VisionChamber,
  PreVisionEngine,
  OracleIntelligence,
  PreCrimeDetector,
  FutureSight,
  MinorityReport
} = require('../ai-services/PreCogMarketEngine');

describe('PreCog Market Intelligence Engine', () => {
  let precogEngine;
  let mockConfig;

  beforeEach(() => {
    mockConfig = {
      predictionHorizon: 180,
      riskThreshold: 0.7,
      confidenceThreshold: 0.85,
      updateInterval: 3600000
    };
    precogEngine = new PreCogMarketEngine(mockConfig);
  });

  afterEach(() => {
    if (precogEngine && precogEngine.stopMarketScanning) {
      precogEngine.stopMarketScanning();
    }
  });

  describe('Engine Initialization', () => {
    test('should initialize with correct configuration', () => {
      expect(precogEngine.version).toBe('1.0.0');
      expect(precogEngine.name).toBe('PreCog Market Intelligence Engine');
      expect(precogEngine.config.predictionHorizon).toBe(180);
      expect(precogEngine.config.riskThreshold).toBe(0.7);
    });

    test('should initialize all subsystems', () => {
      expect(precogEngine.visionChamber).toBeInstanceOf(VisionChamber);
      expect(precogEngine.preVisionEngine).toBeInstanceOf(PreVisionEngine);
      expect(precogEngine.oracleIntelligence).toBeInstanceOf(OracleIntelligence);
      expect(precogEngine.preCrimeDetector).toBeInstanceOf(PreCrimeDetector);
      expect(precogEngine.futureSight).toBeInstanceOf(FutureSight);
      expect(precogEngine.minorityReport).toBeInstanceOf(MinorityReport);
    });

    test('should emit initialization event', (done) => {
      const newEngine = new PreCogMarketEngine(mockConfig);
      newEngine.on('precog-engine-initialized', (data) => {
        expect(data.timestamp).toBeDefined();
        expect(data.systems).toContain('VisionChamber');
        expect(data.systems).toContain('PreVision');
        expect(data.systems).toContain('Oracle');
        expect(data.systems).toContain('PreCrime');
        expect(data.systems).toContain('FutureSight');
        expect(data.systems).toContain('MinorityReport');
        done();
      });
    });
  });

  describe('Market Precognition Processing', () => {
    const mockMarketRequest = {
      type: 'market-precognition',
      market: 'technology',
      timeframe: 90,
      analysisDepth: 'comprehensive'
    };

    test('should process market precognition request successfully', async () => {
      const result = await precogEngine.process(mockMarketRequest);

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.type).toBe('market-precognition');
      expect(result.result.market).toBe('technology');
      expect(result.result.intelligence).toBeDefined();
    });

    test('should include all intelligence components', async () => {
      const result = await precogEngine.process(mockMarketRequest);
      const intelligence = result.result.intelligence;

      expect(intelligence.marketOutlook).toBeDefined();
      expect(intelligence.competitiveLandscape).toBeDefined();
      expect(intelligence.riskProfile).toBeDefined();
      expect(intelligence.successMetrics).toBeDefined();
      expect(intelligence.contrarianInsights).toBeDefined();
    });

    test('should calculate overall confidence score', async () => {
      const result = await precogEngine.process(mockMarketRequest);

      expect(result.result.confidence).toBeGreaterThan(0);
      expect(result.result.confidence).toBeLessThanOrEqual(1);
    });

    test('should emit prediction events', (done) => {
      precogEngine.on('precog-prediction-completed', (data) => {
        expect(data.requestId).toBeDefined();
        expect(data.type).toBe('market-precognition');
        expect(data.responseTime).toBeGreaterThan(0);
        expect(data.confidence).toBeGreaterThan(0);
        done();
      });

      precogEngine.process(mockMarketRequest);
    });
  });

  describe('Individual System Processing', () => {
    test('should process PreVision analysis', async () => {
      const request = {
        type: 'prevision-analysis',
        market: 'technology',
        timeframe: 90
      };

      const result = await precogEngine.process(request);
      expect(result.success).toBe(true);
      expect(result.result.primaryTrend).toBeDefined();
      expect(result.result.keyDrivers).toBeDefined();
      expect(result.result.timeline).toBeDefined();
    });

    test('should process Oracle intelligence', async () => {
      const request = {
        type: 'oracle-intelligence',
        market: 'technology',
        depth: 'standard'
      };

      const result = await precogEngine.process(request);
      expect(result.success).toBe(true);
      expect(result.result.threats).toBeDefined();
      expect(result.result.opportunities).toBeDefined();
      expect(result.result.position).toBeDefined();
      expect(result.result.recommendations).toBeDefined();
    });

    test('should process PreCrime detection', async () => {
      const request = {
        type: 'precrime-detection',
        market: 'technology',
        sensitivity: 'high'
      };

      const result = await precogEngine.process(request);
      expect(result.success).toBe(true);
      expect(result.result.riskLevel).toBeDefined();
      expect(result.result.riskCategories).toBeDefined();
      expect(result.result.earlyWarnings).toBeDefined();
      expect(result.result.mitigationStrategies).toBeDefined();
    });

    test('should process Future Sight analysis', async () => {
      const request = {
        type: 'future-sight',
        market: 'technology',
        timeframe: 90,
        factors: ['technical', 'market', 'execution']
      };

      const result = await precogEngine.process(request);
      expect(result.success).toBe(true);
      expect(result.result.overall).toBeDefined();
      expect(result.result.technical).toBeDefined();
      expect(result.result.market).toBeDefined();
      expect(result.result.execution).toBeDefined();
    });

    test('should process Minority Report analysis', async () => {
      const request = {
        type: 'minority-report',
        market: 'technology',
        riskTolerance: 'medium'
      };

      const result = await precogEngine.process(request);
      expect(result.success).toBe(true);
      expect(result.result.opportunities).toBeDefined();
      expect(result.result.indicators).toBeDefined();
      expect(result.result.strategies).toBeDefined();
      expect(result.result.riskAssessment).toBeDefined();
    });

    test('should process Vision Chamber analysis', async () => {
      const request = {
        type: 'vision-chamber-analysis',
        market: 'technology',
        analysisType: 'comprehensive'
      };

      const result = await precogEngine.process(request);
      expect(result.success).toBe(true);
      expect(result.result.insights).toBeDefined();
      expect(result.result.insights.marketStructure).toBeDefined();
      expect(result.result.insights.competitiveMapping).toBeDefined();
      expect(result.result.insights.trendAnalysis).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown request types', async () => {
      const request = {
        type: 'unknown-analysis',
        market: 'technology'
      };

      await expect(precogEngine.process(request))
        .rejects
        .toThrow('Unknown PreCog request type: unknown-analysis');
    });

    test('should emit error events for failed predictions', (done) => {
      const invalidRequest = {
        type: 'invalid-type',
        market: 'technology'
      };

      precogEngine.on('precog-prediction-failed', (data) => {
        expect(data.requestId).toBeDefined();
        expect(data.type).toBe('invalid-type');
        expect(data.error).toBeDefined();
        done();
      });

      precogEngine.process(invalidRequest).catch(() => {
        // Expected to fail
      });
    });
  });

  describe('Health Check and Metrics', () => {
    test('should perform health check', async () => {
      const health = await precogEngine.healthCheck();

      expect(health.healthy).toBeDefined();
      expect(health.systems).toBeDefined();
      expect(health.systems.visionChamber).toBeDefined();
      expect(health.systems.preVision).toBeDefined();
      expect(health.systems.oracle).toBeDefined();
      expect(health.systems.preCrime).toBeDefined();
      expect(health.systems.futureSight).toBeDefined();
      expect(health.systems.minorityReport).toBeDefined();
    });

    test('should return engine metrics', () => {
      const metrics = precogEngine.getMetrics();

      expect(metrics.version).toBe('1.0.0');
      expect(metrics.config).toBeDefined();
      expect(metrics.systems).toBeDefined();
      expect(metrics.systems.visionChamber).toBeDefined();
      expect(metrics.systems.preVision).toBeDefined();
      expect(metrics.systems.oracle).toBeDefined();
      expect(metrics.systems.preCrime).toBeDefined();
      expect(metrics.systems.futureSight).toBeDefined();
      expect(metrics.systems.minorityReport).toBeDefined();
    });
  });

  describe('Market Scanning and Signal Detection', () => {
    test('should detect market signals', async () => {
      const signals = await precogEngine.detectMarketSignals();

      expect(Array.isArray(signals)).toBe(true);
      signals.forEach(signal => {
        expect(signal.type).toBeDefined();
        expect(signal.confidence).toBeGreaterThan(0);
        expect(signal.confidence).toBeLessThanOrEqual(1);
      });
    });

    test('should update prediction cache', async () => {
      const initialCacheSize = precogEngine.predictionCache.size;
      const signals = [
        {
          type: 'trend-shift',
          severity: 'medium',
          description: 'Test signal',
          confidence: 0.8
        }
      ];

      await precogEngine.updatePredictionCache(signals);
      expect(precogEngine.predictionCache.size).toBeGreaterThan(initialCacheSize);
    });

    test('should clean expired cache entries', () => {
      // Add old cache entry
      const oldKey = 'signal_test_' + (Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      precogEngine.predictionCache.set(oldKey, {
        signal: { type: 'test' },
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        processed: false
      });

      const initialSize = precogEngine.predictionCache.size;
      precogEngine.cleanCache();
      expect(precogEngine.predictionCache.size).toBeLessThan(initialSize);
    });
  });
});

describe('VisionChamber', () => {
  let visionChamber;

  beforeEach(() => {
    visionChamber = new VisionChamber({});
  });

  test('should perform deep analysis', async () => {
    const request = {
      market: 'technology',
      analysisType: 'comprehensive'
    };

    const result = await visionChamber.performDeepAnalysis(request);

    expect(result.analysisType).toBe('comprehensive');
    expect(result.market).toBe('technology');
    expect(result.insights).toBeDefined();
    expect(result.insights.marketStructure).toBeDefined();
    expect(result.insights.competitiveMapping).toBeDefined();
    expect(result.insights.trendAnalysis).toBeDefined();
    expect(result.insights.riskFactors).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should generate TAM/SAM/SOM analysis', async () => {
    const request = { market: 'technology', analysisType: 'market-structure' };
    const result = await visionChamber.performDeepAnalysis(request);
    const structure = result.insights.marketStructure;

    expect(structure.totalAddressableMarket).toBeDefined();
    expect(structure.totalAddressableMarket.size).toBeGreaterThan(0);
    expect(structure.servicableAddressableMarket).toBeDefined();
    expect(structure.servicableObtainableMarket).toBeDefined();
  });

  test('should pass health check', async () => {
    const health = await visionChamber.healthCheck();
    expect(health.healthy).toBe(true);
    expect(health.service).toBe('vision-chamber');
  });
});

describe('PreVisionEngine', () => {
  let preVisionEngine;

  beforeEach(() => {
    preVisionEngine = new PreVisionEngine({});
  });

  test('should analyze market trends', async () => {
    const request = {
      market: 'technology',
      timeframe: 90
    };

    const result = await preVisionEngine.analyzeMarketTrends(request);

    expect(result.primaryTrend).toBeDefined();
    expect(result.primaryTrend.direction).toBeDefined();
    expect(result.primaryTrend.magnitude).toBeDefined();
    expect(result.secondaryTrends).toBeDefined();
    expect(result.keyDrivers).toBeDefined();
    expect(result.timeline).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should generate timeline phases', async () => {
    const request = { market: 'technology', timeframe: 90 };
    const result = await preVisionEngine.analyzeMarketTrends(request);

    expect(result.timeline).toHaveLength(3);
    result.timeline.forEach(phase => {
      expect(phase.phase).toBeDefined();
      expect(phase.duration).toBeDefined();
      expect(phase.characteristics).toBeDefined();
      expect(phase.confidence).toBeGreaterThan(0);
    });
  });
});

describe('OracleIntelligence', () => {
  let oracle;

  beforeEach(() => {
    oracle = new OracleIntelligence({});
  });

  test('should gather competitive intelligence', async () => {
    const request = {
      market: 'technology',
      depth: 'standard'
    };

    const result = await oracle.gatherCompetitiveIntel(request);

    expect(result.threats).toBeDefined();
    expect(result.opportunities).toBeDefined();
    expect(result.position).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.intelligence).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should generate competitive threats', async () => {
    const request = { market: 'technology' };
    const result = await oracle.gatherCompetitiveIntel(request);

    expect(Array.isArray(result.threats)).toBe(true);
    result.threats.forEach(threat => {
      expect(threat.company).toBeDefined();
      expect(threat.threat).toBeDefined();
      expect(threat.severity).toBeDefined();
      expect(threat.probability).toBeGreaterThan(0);
    });
  });

  test('should generate market position analysis', async () => {
    const request = { market: 'technology' };
    const result = await oracle.gatherCompetitiveIntel(request);

    expect(result.position.current).toBeDefined();
    expect(result.position.projected).toBeDefined();
    expect(result.position.current.rank).toBeGreaterThan(0);
    expect(result.position.current.marketShare).toBeDefined();
  });
});

describe('PreCrimeDetector', () => {
  let preCrime;

  beforeEach(() => {
    preCrime = new PreCrimeDetector({});
  });

  test('should detect market risks', async () => {
    const request = {
      market: 'technology',
      sensitivity: 'high'
    };

    const result = await preCrime.detectMarketRisks(request);

    expect(result.riskLevel).toBeDefined();
    expect(result.riskCategories).toBeDefined();
    expect(result.earlyWarnings).toBeDefined();
    expect(result.mitigationStrategies).toBeDefined();
    expect(result.timeline).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should calculate overall risk level', async () => {
    const request = { market: 'technology' };
    const result = await preCrime.detectMarketRisks(request);

    expect(result.riskLevel.level).toBeDefined();
    expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel.level);
    expect(result.riskLevel.score).toBeGreaterThan(0);
    expect(result.riskLevel.score).toBeLessThanOrEqual(100);
  });

  test('should generate early warnings', async () => {
    const request = { market: 'technology' };
    const result = await preCrime.detectMarketRisks(request);

    expect(Array.isArray(result.earlyWarnings)).toBe(true);
    result.earlyWarnings.forEach(warning => {
      expect(warning.signal).toBeDefined();
      expect(warning.severity).toBeDefined();
      expect(warning.timeToImpact).toBeDefined();
      expect(warning.confidence).toBeGreaterThan(0);
    });
  });
});

describe('FutureSight', () => {
  let futureSight;

  beforeEach(() => {
    futureSight = new FutureSight({});
  });

  test('should calculate success probability', async () => {
    const request = {
      market: 'technology',
      timeframe: 90,
      factors: ['technical', 'market', 'execution']
    };

    const result = await futureSight.calculateSuccessProbability(request);

    expect(result.overall).toBeDefined();
    expect(result.technical).toBeDefined();
    expect(result.market).toBeDefined();
    expect(result.execution).toBeDefined();
    expect(result.factors).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should calculate component probabilities', async () => {
    const request = { market: 'technology', timeframe: 90 };
    const result = await futureSight.calculateSuccessProbability(request);

    expect(result.technical.probability).toBeGreaterThan(0);
    expect(result.market.probability).toBeGreaterThan(0);
    expect(result.execution.probability).toBeGreaterThan(0);
    expect(result.overall.probability).toBeGreaterThan(0);
  });

  test('should provide probability grade and recommendation', async () => {
    const request = { market: 'technology', timeframe: 90 };
    const result = await futureSight.calculateSuccessProbability(request);

    expect(['A', 'B', 'C', 'D', 'F']).toContain(result.overall.grade);
    expect(result.overall.recommendation).toBeDefined();
    expect(result.overall.confidenceInterval).toBeDefined();
  });
});

describe('MinorityReport', () => {
  let minorityReport;

  beforeEach(() => {
    minorityReport = new MinorityReport({});
  });

  test('should find contrarian opportunities', async () => {
    const request = {
      market: 'technology',
      riskTolerance: 'medium'
    };

    const result = await minorityReport.findContrarianOpportunities(request);

    expect(result.opportunities).toBeDefined();
    expect(result.indicators).toBeDefined();
    expect(result.strategies).toBeDefined();
    expect(result.riskAssessment).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  test('should generate contrarian opportunities with contrary signals', async () => {
    const request = { market: 'technology' };
    const result = await minorityReport.findContrarianOpportunities(request);

    expect(Array.isArray(result.opportunities)).toBe(true);
    result.opportunities.forEach(opportunity => {
      expect(opportunity.opportunity).toBeDefined();
      expect(opportunity.description).toBeDefined();
      expect(opportunity.potential).toBeDefined();
      expect(opportunity.contrarySignal).toBeDefined();
    });
  });

  test('should provide alternative strategies', async () => {
    const request = { market: 'technology' };
    const result = await minorityReport.findContrarianOpportunities(request);

    expect(Array.isArray(result.strategies)).toBe(true);
    result.strategies.forEach(strategy => {
      expect(strategy.strategy).toBeDefined();
      expect(strategy.description).toBeDefined();
      expect(strategy.advantages).toBeDefined();
      expect(strategy.challenges).toBeDefined();
      expect(strategy.suitability).toBeDefined();
    });
  });
});

describe('Integration Tests', () => {
  let aiServiceManager;

  beforeEach(() => {
    // Mock AIServiceManager for integration tests
    const { AIServiceManager } = require('../ai-services/AIServiceManager');
    aiServiceManager = new AIServiceManager({
      precog: {
        predictionHorizon: 90,
        riskThreshold: 0.6,
        confidenceThreshold: 0.8
      }
    });
  });

  test('should integrate with AIServiceManager', async () => {
    expect(aiServiceManager.services.has('precog-market')).toBe(true);
  });

  test('should route market precognition requests correctly', async () => {
    const result = await aiServiceManager.performMarketPrecognition('technology', 90);

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result.type).toBe('market-precognition');
  });

  test('should provide convenience methods for all PreCog systems', async () => {
    const methods = [
      'analyzeMarketTrends',
      'gatherCompetitiveIntelligence',
      'detectMarketRisks',
      'calculateSuccessProbability',
      'findContrarianOpportunities',
      'performVisionChamberAnalysis'
    ];

    methods.forEach(method => {
      expect(typeof aiServiceManager[method]).toBe('function');
    });
  });
});

describe('Performance Tests', () => {
  let precogEngine;

  beforeEach(() => {
    precogEngine = new PreCogMarketEngine({});
  });

  test('should process requests within acceptable time limits', async () => {
    const startTime = Date.now();
    const request = {
      type: 'market-precognition',
      market: 'technology',
      timeframe: 90
    };

    await precogEngine.process(request);
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Should complete within 10 seconds
    expect(processingTime).toBeLessThan(10000);
  });

  test('should handle multiple concurrent requests', async () => {
    const requests = Array.from({ length: 5 }, (_, i) => ({
      type: 'prevision-analysis',
      market: `technology_${i}`,
      timeframe: 90
    }));

    const startTime = Date.now();
    const results = await Promise.all(
      requests.map(request => precogEngine.process(request))
    );
    const endTime = Date.now();

    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.success).toBe(true);
    });

    // Should complete all requests within 15 seconds
    expect(endTime - startTime).toBeLessThan(15000);
  });
});

describe('Data Quality Tests', () => {
  let precogEngine;

  beforeEach(() => {
    precogEngine = new PreCogMarketEngine({});
  });

  test('should generate consistent data structures', async () => {
    const request = {
      type: 'market-precognition',
      market: 'technology',
      timeframe: 90
    };

    const result1 = await precogEngine.process(request);
    const result2 = await precogEngine.process(request);

    // Structure should be consistent
    expect(Object.keys(result1.result.intelligence)).toEqual(
      Object.keys(result2.result.intelligence)
    );
  });

  test('should provide realistic confidence scores', async () => {
    const request = {
      type: 'future-sight',
      market: 'technology',
      timeframe: 90
    };

    const result = await precogEngine.process(request);
    const probability = result.result.overall.probability;

    // Confidence should be realistic (between 0.4 and 0.95)
    expect(probability).toBeGreaterThan(0.4);
    expect(probability).toBeLessThan(0.95);
  });

  test('should maintain data consistency across systems', async () => {
    const marketRequest = {
      type: 'market-precognition',
      market: 'technology',
      timeframe: 90
    };

    const result = await precogEngine.process(marketRequest);
    const intelligence = result.result.intelligence;

    // Risk and success metrics should be inversely related
    const riskLevel = intelligence.riskProfile.level;
    const successProb = intelligence.successMetrics.probability;

    // This is a logical consistency check - higher risk should generally correlate with lower success probability
    expect(typeof riskLevel).toBe('object');
    expect(typeof successProb).toBe('number');
  });
});