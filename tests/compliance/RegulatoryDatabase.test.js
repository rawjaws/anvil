/**
 * Test Suite for RegulatoryDatabase
 * Tests regulatory knowledge base functionality and compliance standards
 */

const { RegulatoryDatabase } = require('../../ai-services/RegulatoryDatabase');

describe('RegulatoryDatabase', () => {
  let regulatoryDatabase;

  beforeEach(async () => {
    regulatoryDatabase = new RegulatoryDatabase({
      enableAutoUpdates: false, // Disable for testing
      maxCacheSize: 100
    });
    await regulatoryDatabase.initialize();
  });

  afterEach(() => {
    if (regulatoryDatabase) {
      regulatoryDatabase.clearCache();
    }
  });

  describe('Initialization', () => {
    test('should initialize with regulations loaded', async () => {
      expect(regulatoryDatabase.regulations.size).toBeGreaterThan(0);
      expect(regulatoryDatabase.lastUpdate).toBeDefined();
    });

    test('should load GDPR regulation', async () => {
      const gdpr = await regulatoryDatabase.getRegulation('GDPR');

      expect(gdpr).toBeDefined();
      expect(gdpr.name).toBe('GDPR');
      expect(gdpr.fullName).toBe('General Data Protection Regulation');
      expect(gdpr.jurisdiction).toBe('EU');
      expect(gdpr.requirements).toBeDefined();
      expect(Array.isArray(gdpr.requirements)).toBe(true);
      expect(gdpr.requirements.length).toBeGreaterThan(0);
    });

    test('should load HIPAA regulation', async () => {
      const hipaa = await regulatoryDatabase.getRegulation('HIPAA');

      expect(hipaa).toBeDefined();
      expect(hipaa.name).toBe('HIPAA');
      expect(hipaa.fullName).toBe('Health Insurance Portability and Accountability Act');
      expect(hipaa.jurisdiction).toBe('US');
      expect(hipaa.scope).toContain('healthcare');
    });

    test('should load SOX regulation', async () => {
      const sox = await regulatoryDatabase.getRegulation('SOX');

      expect(sox).toBeDefined();
      expect(sox.name).toBe('SOX');
      expect(sox.fullName).toBe('Sarbanes-Oxley Act');
      expect(sox.scope).toContain('financial_reporting');
    });

    test('should load PCI-DSS regulation', async () => {
      const pci = await regulatoryDatabase.getRegulation('PCI-DSS');

      expect(pci).toBeDefined();
      expect(pci.name).toBe('PCI-DSS');
      expect(pci.jurisdiction).toBe('Global');
      expect(pci.scope).toContain('payment_security');
    });

    test('should load ISO 27001 regulation', async () => {
      const iso = await regulatoryDatabase.getRegulation('ISO27001');

      expect(iso).toBeDefined();
      expect(iso.name).toBe('ISO 27001');
      expect(iso.scope).toContain('information_security');
    });

    test('should load all supported regulations', async () => {
      const regulations = await regulatoryDatabase.getSupportedRegulations();

      expect(Array.isArray(regulations)).toBe(true);
      expect(regulations.length).toBeGreaterThanOrEqual(6);
      expect(regulations).toContain('GDPR');
      expect(regulations).toContain('HIPAA');
      expect(regulations).toContain('SOX');
      expect(regulations).toContain('PCI-DSS');
      expect(regulations).toContain('ISO27001');
      expect(regulations).toContain('FDA');
      expect(regulations).toContain('NIST');
    });
  });

  describe('Regulation Detection', () => {
    test('should find applicable regulations for healthcare industry', async () => {
      const criteria = {
        industry: 'healthcare',
        dataTypes: ['health'],
        geographicScope: 'US',
        businessFunctions: ['data_processing']
      };

      const applicable = await regulatoryDatabase.findApplicableRegulations(criteria);

      expect(Array.isArray(applicable)).toBe(true);
      expect(applicable.length).toBeGreaterThan(0);
      expect(applicable.some(reg => reg.name === 'HIPAA')).toBe(true);
    });

    test('should find applicable regulations for financial industry', async () => {
      const criteria = {
        industry: 'financial',
        dataTypes: ['financial'],
        geographicScope: 'US',
        businessFunctions: ['financial_reporting']
      };

      const applicable = await regulatoryDatabase.findApplicableRegulations(criteria);

      expect(applicable.some(reg => reg.name === 'SOX')).toBe(true);
    });

    test('should find GDPR for EU personal data processing', async () => {
      const criteria = {
        industry: 'technology',
        dataTypes: ['personal'],
        geographicScope: 'EU',
        businessFunctions: ['data_processing']
      };

      const applicable = await regulatoryDatabase.findApplicableRegulations(criteria);

      expect(applicable.some(reg => reg.name === 'GDPR')).toBe(true);
    });

    test('should find PCI-DSS for payment processing', async () => {
      const criteria = {
        industry: 'retail',
        dataTypes: ['financial'],
        geographicScope: 'Global',
        businessFunctions: ['payment_processing']
      };

      const applicable = await regulatoryDatabase.findApplicableRegulations(criteria);

      expect(applicable.some(reg => reg.name === 'PCI-DSS')).toBe(true);
    });

    test('should sort regulations by relevance', async () => {
      const criteria = {
        industry: 'healthcare',
        dataTypes: ['health'],
        geographicScope: 'US',
        businessFunctions: ['data_processing']
      };

      const applicable = await regulatoryDatabase.findApplicableRegulations(criteria);

      if (applicable.length > 1) {
        // HIPAA should be more relevant than others for healthcare
        const hipaaIndex = applicable.findIndex(reg => reg.name === 'HIPAA');
        expect(hipaaIndex).toBeGreaterThanOrEqual(0);
        expect(hipaaIndex).toBeLessThan(applicable.length / 2); // Should be in first half
      }
    });

    test('should handle multiple data types', async () => {
      const criteria = {
        industry: 'healthcare',
        dataTypes: ['health', 'personal'],
        geographicScope: 'US',
        businessFunctions: ['data_processing']
      };

      const applicable = await regulatoryDatabase.findApplicableRegulations(criteria);

      expect(applicable.length).toBeGreaterThan(0);
      // Should include both HIPAA (health) and potentially GDPR (personal)
    });

    test('should return empty array for non-matching criteria', async () => {
      const criteria = {
        industry: 'non-existent-industry',
        dataTypes: ['non-existent-data'],
        geographicScope: 'Mars',
        businessFunctions: ['space-travel']
      };

      const applicable = await regulatoryDatabase.findApplicableRegulations(criteria);

      expect(Array.isArray(applicable)).toBe(true);
      expect(applicable.length).toBe(0);
    });
  });

  describe('Regulation Content', () => {
    test('GDPR should have proper data protection requirements', async () => {
      const gdpr = await regulatoryDatabase.getRegulation('GDPR');

      const dataProtectionReqs = gdpr.requirements.filter(req => req.type === 'data_protection');
      expect(dataProtectionReqs.length).toBeGreaterThan(0);

      const article5 = gdpr.requirements.find(req => req.id === 'GDPR-Art5');
      expect(article5).toBeDefined();
      expect(article5.title).toContain('Principles of data processing');
      expect(article5.severity).toBe('high');
    });

    test('HIPAA should have privacy and security requirements', async () => {
      const hipaa = await regulatoryDatabase.getRegulation('HIPAA');

      const privacyReqs = hipaa.requirements.filter(req => req.type === 'privacy');
      const securityReqs = hipaa.requirements.filter(req => req.type === 'security_controls');

      expect(privacyReqs.length).toBeGreaterThan(0);
      expect(securityReqs.length).toBeGreaterThan(0);
    });

    test('SOX should have financial control requirements', async () => {
      const sox = await regulatoryDatabase.getRegulation('SOX');

      const financialReqs = sox.requirements.filter(req => req.type === 'financial_controls');
      expect(financialReqs.length).toBeGreaterThan(0);

      const section404 = sox.requirements.find(req => req.id === 'SOX-404');
      expect(section404).toBeDefined();
      expect(section404.title).toContain('internal controls');
    });

    test('PCI-DSS should have security control requirements', async () => {
      const pci = await regulatoryDatabase.getRegulation('PCI-DSS');

      const securityReqs = pci.requirements.filter(req => req.type === 'security_controls');
      expect(securityReqs.length).toBeGreaterThan(0);

      const req1 = pci.requirements.find(req => req.id === 'PCI-REQ1');
      expect(req1).toBeDefined();
      expect(req1.title).toContain('network security');
    });

    test('requirements should have proper structure', async () => {
      const gdpr = await regulatoryDatabase.getRegulation('GDPR');
      const requirement = gdpr.requirements[0];

      expect(requirement).toHaveProperty('id');
      expect(requirement).toHaveProperty('title');
      expect(requirement).toHaveProperty('type');
      expect(requirement).toHaveProperty('severity');
      expect(requirement).toHaveProperty('description');
      expect(requirement).toHaveProperty('keywords');
      expect(Array.isArray(requirement.keywords)).toBe(true);
    });
  });

  describe('Search Functionality', () => {
    test('should search regulations by keyword', async () => {
      const results = await regulatoryDatabase.searchRegulations('data protection');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      const gdprResult = results.find(r => r.regulation === 'GDPR');
      expect(gdprResult).toBeDefined();
    });

    test('should search requirements by keyword', async () => {
      const results = await regulatoryDatabase.searchRegulations('encryption');

      expect(results.length).toBeGreaterThan(0);

      const requirementResults = results.filter(r => r.matchType === 'requirement');
      expect(requirementResults.length).toBeGreaterThan(0);
    });

    test('should handle case-insensitive search', async () => {
      const upperResults = await regulatoryDatabase.searchRegulations('GDPR');
      const lowerResults = await regulatoryDatabase.searchRegulations('gdpr');

      expect(upperResults.length).toBe(lowerResults.length);
    });

    test('should return empty results for non-matching search', async () => {
      const results = await regulatoryDatabase.searchRegulations('nonexistent-keyword-xyz');

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });
  });

  describe('Requirements by Type', () => {
    test('should get data protection requirements from GDPR', async () => {
      const requirements = await regulatoryDatabase.getRequirementsByType('GDPR', 'data_protection');

      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements.every(req => req.type === 'data_protection')).toBe(true);
    });

    test('should get security controls from multiple regulations', async () => {
      const hipaaSecurityReqs = await regulatoryDatabase.getRequirementsByType('HIPAA', 'security_controls');
      const pciSecurityReqs = await regulatoryDatabase.getRequirementsByType('PCI-DSS', 'security_controls');

      expect(hipaaSecurityReqs.length).toBeGreaterThan(0);
      expect(pciSecurityReqs.length).toBeGreaterThan(0);
    });

    test('should return empty array for non-existent type', async () => {
      const requirements = await regulatoryDatabase.getRequirementsByType('GDPR', 'non-existent-type');

      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBe(0);
    });

    test('should return empty array for non-existent regulation', async () => {
      const requirements = await regulatoryDatabase.getRequirementsByType('NON-EXISTENT', 'data_protection');

      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBe(0);
    });
  });

  describe('Statistics and Analytics', () => {
    test('should provide compliance statistics', () => {
      const stats = regulatoryDatabase.getComplianceStatistics();

      expect(stats).toBeDefined();
      expect(stats.totalRegulations).toBeGreaterThan(0);
      expect(stats.totalRequirements).toBeGreaterThan(0);
      expect(typeof stats.requirementsByType).toBe('object');
      expect(typeof stats.requirementsBySeverity).toBe('object');
      expect(Array.isArray(stats.jurisdictions)).toBe(true);
      expect(Array.isArray(stats.industries)).toBe(true);
    });

    test('should count requirements by type correctly', () => {
      const stats = regulatoryDatabase.getComplianceStatistics();

      expect(stats.requirementsByType['data_protection']).toBeGreaterThan(0);
      expect(stats.requirementsByType['security_controls']).toBeGreaterThan(0);
      expect(stats.requirementsByType['financial_controls']).toBeGreaterThan(0);
    });

    test('should count requirements by severity correctly', () => {
      const stats = regulatoryDatabase.getComplianceStatistics();

      expect(stats.requirementsBySeverity['high']).toBeGreaterThan(0);
      expect(stats.requirementsBySeverity['medium']).toBeGreaterThan(0);
    });

    test('should include major jurisdictions', () => {
      const stats = regulatoryDatabase.getComplianceStatistics();

      expect(stats.jurisdictions).toContain('EU');
      expect(stats.jurisdictions).toContain('US');
      expect(stats.jurisdictions).toContain('Global');
    });

    test('should include major industries', () => {
      const stats = regulatoryDatabase.getComplianceStatistics();

      expect(stats.industries).toContain('healthcare');
      expect(stats.industries).toContain('financial');
    });
  });

  describe('Applicability Checking', () => {
    test('should check regulation applicability correctly', () => {
      const gdpr = regulatoryDatabase.regulations.get('GDPR');

      const applicable = regulatoryDatabase.isRegulationApplicable(gdpr, {
        industry: 'technology',
        dataTypes: ['personal'],
        geographicScope: 'EU',
        businessFunctions: ['data_processing']
      });

      expect(applicable).toBe(true);
    });

    test('should reject non-applicable regulations', () => {
      const hipaa = regulatoryDatabase.regulations.get('HIPAA');

      const applicable = regulatoryDatabase.isRegulationApplicable(hipaa, {
        industry: 'manufacturing',
        dataTypes: ['technical'],
        geographicScope: 'EU',
        businessFunctions: ['production']
      });

      expect(applicable).toBe(false);
    });

    test('should handle all-industry regulations', () => {
      const iso = regulatoryDatabase.regulations.get('ISO27001');

      const applicable = regulatoryDatabase.isRegulationApplicable(iso, {
        industry: 'any-industry',
        dataTypes: ['any-data'],
        geographicScope: 'Global',
        businessFunctions: ['any-function']
      });

      expect(applicable).toBe(true);
    });
  });

  describe('Relevance Scoring', () => {
    test('should calculate relevance scores', () => {
      const gdpr = regulatoryDatabase.regulations.get('GDPR');

      const score = regulatoryDatabase.calculateRelevanceScore(gdpr, {
        industry: 'technology',
        dataTypes: ['personal'],
        geographicScope: 'EU',
        businessFunctions: ['data_processing']
      });

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });

    test('should give higher scores for exact matches', () => {
      const hipaa = regulatoryDatabase.regulations.get('HIPAA');

      const exactScore = regulatoryDatabase.calculateRelevanceScore(hipaa, {
        industry: 'healthcare',
        dataTypes: ['health'],
        geographicScope: 'US',
        businessFunctions: ['healthcare_operations']
      });

      const partialScore = regulatoryDatabase.calculateRelevanceScore(hipaa, {
        industry: 'technology',
        dataTypes: ['health'],
        geographicScope: 'US',
        businessFunctions: ['data_processing']
      });

      expect(exactScore).toBeGreaterThan(partialScore);
    });
  });

  describe('Updates and Maintenance', () => {
    test('should check for updates', async () => {
      const updateCheck = await regulatoryDatabase.checkForUpdates();

      expect(updateCheck).toBeDefined();
      expect(updateCheck.hasUpdates).toBeDefined();
      expect(updateCheck.lastCheck).toBeDefined();
      expect(Array.isArray(updateCheck.availableUpdates)).toBe(true);
    });

    test('should provide database statistics', () => {
      const stats = regulatoryDatabase.getStats();

      expect(stats).toBeDefined();
      expect(stats.regulationsLoaded).toBeGreaterThan(0);
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
      expect(stats.lastUpdate).toBeDefined();
      expect(stats.memoryUsage).toBeDefined();
    });

    test('should clear cache', () => {
      // Add something to cache first
      regulatoryDatabase.regulationCache.set('test', 'value');
      expect(regulatoryDatabase.regulationCache.size).toBeGreaterThan(0);

      regulatoryDatabase.clearCache();
      expect(regulatoryDatabase.regulationCache.size).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent regulation gracefully', async () => {
      const regulation = await regulatoryDatabase.getRegulation('NON-EXISTENT');
      expect(regulation).toBeUndefined();
    });

    test('should handle empty search terms', async () => {
      const results = await regulatoryDatabase.searchRegulations('');
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle null criteria in applicability check', async () => {
      const results = await regulatoryDatabase.findApplicableRegulations({});
      expect(Array.isArray(results)).toBe(true);
    });
  });
});

// Performance Tests
describe('RegulatoryDatabase Performance', () => {
  let regulatoryDatabase;

  beforeEach(async () => {
    regulatoryDatabase = new RegulatoryDatabase();
    await regulatoryDatabase.initialize();
  });

  test('should load regulations quickly', async () => {
    const startTime = Date.now();

    const newDb = new RegulatoryDatabase();
    await newDb.initialize();

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // Should load within 1 second
  });

  test('should find applicable regulations efficiently', async () => {
    const criteria = {
      industry: 'healthcare',
      dataTypes: ['health', 'personal'],
      geographicScope: 'US',
      businessFunctions: ['data_processing', 'healthcare_operations']
    };

    const startTime = Date.now();

    const results = await regulatoryDatabase.findApplicableRegulations(criteria);

    const searchTime = Date.now() - startTime;
    expect(searchTime).toBeLessThan(100); // Should search within 100ms
    expect(results.length).toBeGreaterThan(0);
  });

  test('should handle multiple concurrent searches', async () => {
    const searches = Array.from({ length: 10 }, (_, i) => ({
      industry: i % 2 === 0 ? 'healthcare' : 'financial',
      dataTypes: ['personal'],
      geographicScope: 'US',
      businessFunctions: ['data_processing']
    }));

    const startTime = Date.now();

    const promises = searches.map(criteria =>
      regulatoryDatabase.findApplicableRegulations(criteria)
    );

    const results = await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(500); // Should handle concurrency efficiently
    expect(results).toHaveLength(10);
    expect(results.every(result => Array.isArray(result))).toBe(true);
  });
});