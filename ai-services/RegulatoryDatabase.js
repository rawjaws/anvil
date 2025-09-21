/**
 * Regulatory Database - Comprehensive knowledge base for industry standards and regulations
 * Supports GDPR, HIPAA, SOX, PCI-DSS, ISO 27001, FDA, NIST and other regulatory frameworks
 */

class RegulatoryDatabase {
  constructor(config = {}) {
    this.config = {
      enableAutoUpdates: config.enableAutoUpdates !== false,
      updateCheckInterval: config.updateCheckInterval || 86400000, // 24 hours
      maxCacheSize: config.maxCacheSize || 10000,
      ...config
    };

    this.regulations = new Map();
    this.regulationCache = new Map();
    this.lastUpdate = null;

    this.initializeRegulations();
  }

  /**
   * Initialize the regulatory database with comprehensive standards
   */
  async initialize() {
    await this.loadRegulations();

    if (this.config.enableAutoUpdates) {
      this.startAutoUpdateCheck();
    }
  }

  /**
   * Load all regulatory frameworks and their requirements
   */
  async loadRegulations() {
    // GDPR - General Data Protection Regulation
    this.regulations.set('GDPR', {
      name: 'GDPR',
      fullName: 'General Data Protection Regulation',
      jurisdiction: 'EU',
      version: '2018',
      lastUpdate: '2018-05-25',
      scope: ['data_protection', 'privacy'],
      applicability: {
        industries: ['all'],
        dataTypes: ['personal'],
        geographicScope: ['EU', 'Global'],
        businessFunctions: ['data_processing']
      },
      requirements: [
        {
          id: 'GDPR-Art5',
          title: 'Principles of data processing',
          article: 'Article 5',
          type: 'data_protection',
          severity: 'high',
          description: 'Personal data must be processed lawfully, fairly, and transparently',
          keywords: ['personal data', 'processing', 'lawful basis'],
          mustHave: ['lawful basis', 'purpose limitation', 'data minimization'],
          shouldHave: ['transparency', 'accuracy', 'storage limitation'],
          auditEvidence: 'Data processing records and lawful basis documentation',
          remediation: 'Establish clear lawful basis for all personal data processing activities'
        },
        {
          id: 'GDPR-Art6',
          title: 'Lawfulness of processing',
          article: 'Article 6',
          type: 'data_protection',
          severity: 'high',
          description: 'Processing is lawful only if at least one legal basis applies',
          keywords: ['consent', 'contract', 'legal obligation', 'vital interests'],
          mustHave: ['lawful basis'],
          auditEvidence: 'Documented lawful basis for each processing activity',
          remediation: 'Document and implement appropriate lawful basis for data processing'
        },
        {
          id: 'GDPR-Art25',
          title: 'Data protection by design and by default',
          article: 'Article 25',
          type: 'privacy',
          severity: 'medium',
          description: 'Implement appropriate technical and organizational measures',
          keywords: ['privacy by design', 'data protection', 'technical measures'],
          mustHave: ['privacy by design'],
          shouldHave: ['pseudonymization', 'data minimization'],
          auditEvidence: 'Technical and organizational measures documentation',
          remediation: 'Implement privacy by design principles in system architecture'
        },
        {
          id: 'GDPR-Art32',
          title: 'Security of processing',
          article: 'Article 32',
          type: 'security_controls',
          severity: 'high',
          description: 'Implement appropriate technical and organizational security measures',
          keywords: ['encryption', 'security', 'confidentiality', 'integrity'],
          mustHave: ['appropriate security measures'],
          shouldHave: ['encryption', 'pseudonymization', 'access controls'],
          auditEvidence: 'Security measures implementation and testing records',
          remediation: 'Implement comprehensive security controls for data protection'
        }
      ]
    });

    // HIPAA - Health Insurance Portability and Accountability Act
    this.regulations.set('HIPAA', {
      name: 'HIPAA',
      fullName: 'Health Insurance Portability and Accountability Act',
      jurisdiction: 'US',
      version: '2013',
      lastUpdate: '2013-01-25',
      scope: ['healthcare', 'privacy', 'security'],
      applicability: {
        industries: ['healthcare'],
        dataTypes: ['health'],
        geographicScope: ['US'],
        businessFunctions: ['data_processing', 'healthcare_operations']
      },
      requirements: [
        {
          id: 'HIPAA-164.502',
          title: 'Uses and disclosures of PHI',
          article: '45 CFR 164.502',
          type: 'privacy',
          severity: 'high',
          description: 'PHI may only be used or disclosed as permitted or required',
          keywords: ['PHI', 'protected health information', 'disclosure', 'authorization'],
          mustHave: ['authorization', 'minimum necessary'],
          auditEvidence: 'PHI access logs and authorization records',
          remediation: 'Implement proper authorization controls for PHI access'
        },
        {
          id: 'HIPAA-164.312',
          title: 'Technical safeguards',
          article: '45 CFR 164.312',
          type: 'security_controls',
          severity: 'high',
          description: 'Implement technical safeguards for ePHI',
          keywords: ['encryption', 'access control', 'audit logs', 'transmission security'],
          mustHave: ['access control', 'audit controls', 'integrity', 'transmission security'],
          shouldHave: ['encryption', 'decryption'],
          auditEvidence: 'Technical safeguards implementation and audit logs',
          remediation: 'Deploy comprehensive technical safeguards for ePHI protection'
        },
        {
          id: 'HIPAA-164.308',
          title: 'Administrative safeguards',
          article: '45 CFR 164.308',
          type: 'access_control',
          severity: 'medium',
          description: 'Implement administrative safeguards',
          keywords: ['workforce training', 'access management', 'security officer'],
          mustHave: ['security officer', 'workforce training', 'access management'],
          auditEvidence: 'Training records and access management documentation',
          remediation: 'Establish comprehensive administrative safeguards program'
        }
      ]
    });

    // SOX - Sarbanes-Oxley Act
    this.regulations.set('SOX', {
      name: 'SOX',
      fullName: 'Sarbanes-Oxley Act',
      jurisdiction: 'US',
      version: '2002',
      lastUpdate: '2002-07-30',
      scope: ['financial_reporting', 'corporate_governance'],
      applicability: {
        industries: ['financial', 'public_companies'],
        dataTypes: ['financial'],
        geographicScope: ['US'],
        businessFunctions: ['financial_reporting', 'audit']
      },
      requirements: [
        {
          id: 'SOX-302',
          title: 'Corporate responsibility for financial reports',
          article: 'Section 302',
          type: 'financial_controls',
          severity: 'high',
          description: 'CEO and CFO must certify financial statements',
          keywords: ['financial statements', 'certification', 'internal controls'],
          mustHave: ['management certification', 'internal controls assessment'],
          auditEvidence: 'Management certification and internal controls documentation',
          remediation: 'Establish robust internal controls over financial reporting'
        },
        {
          id: 'SOX-404',
          title: 'Management assessment of internal controls',
          article: 'Section 404',
          type: 'financial_controls',
          severity: 'high',
          description: 'Annual assessment of internal control over financial reporting',
          keywords: ['internal controls', 'financial reporting', 'effectiveness'],
          mustHave: ['internal controls framework', 'annual assessment'],
          shouldHave: ['segregation of duties', 'documentation'],
          auditEvidence: 'Internal controls testing and assessment documentation',
          remediation: 'Implement comprehensive internal controls framework'
        },
        {
          id: 'SOX-409',
          title: 'Real time issuer disclosures',
          article: 'Section 409',
          type: 'audit_logging',
          severity: 'medium',
          description: 'Rapid and current disclosure of material changes',
          keywords: ['disclosure', 'material changes', 'timely reporting'],
          mustHave: ['timely disclosure'],
          auditEvidence: 'Disclosure timeline and documentation',
          remediation: 'Establish procedures for timely material disclosures'
        }
      ]
    });

    // PCI-DSS - Payment Card Industry Data Security Standard
    this.regulations.set('PCI-DSS', {
      name: 'PCI-DSS',
      fullName: 'Payment Card Industry Data Security Standard',
      jurisdiction: 'Global',
      version: '4.0',
      lastUpdate: '2022-03-31',
      scope: ['payment_security', 'data_protection'],
      applicability: {
        industries: ['retail', 'financial', 'ecommerce'],
        dataTypes: ['financial'],
        geographicScope: ['Global'],
        businessFunctions: ['payment_processing']
      },
      requirements: [
        {
          id: 'PCI-REQ1',
          title: 'Install and maintain network security controls',
          article: 'Requirement 1',
          type: 'security_controls',
          severity: 'high',
          description: 'Network security controls that protect cardholder data',
          keywords: ['firewall', 'network security', 'cardholder data environment'],
          mustHave: ['firewall configuration', 'network segmentation'],
          auditEvidence: 'Network security configuration and testing records',
          remediation: 'Deploy and configure network security controls'
        },
        {
          id: 'PCI-REQ3',
          title: 'Protect stored cardholder data',
          article: 'Requirement 3',
          type: 'encryption',
          severity: 'high',
          description: 'Protection of stored cardholder data',
          keywords: ['encryption', 'cardholder data', 'secure storage'],
          mustHave: ['encryption', 'secure key management'],
          auditEvidence: 'Encryption implementation and key management records',
          remediation: 'Implement strong encryption for cardholder data storage'
        },
        {
          id: 'PCI-REQ10',
          title: 'Log and monitor all access to network resources',
          article: 'Requirement 10',
          type: 'audit_logging',
          severity: 'medium',
          description: 'Logging and monitoring of access to network resources',
          keywords: ['audit logs', 'monitoring', 'access tracking'],
          mustHave: ['comprehensive logging', 'log monitoring'],
          auditEvidence: 'Audit log records and monitoring procedures',
          remediation: 'Implement comprehensive logging and monitoring system'
        }
      ]
    });

    // ISO 27001 - Information Security Management
    this.regulations.set('ISO27001', {
      name: 'ISO 27001',
      fullName: 'ISO/IEC 27001 Information Security Management',
      jurisdiction: 'International',
      version: '2022',
      lastUpdate: '2022-10-25',
      scope: ['information_security', 'risk_management'],
      applicability: {
        industries: ['all'],
        dataTypes: ['all'],
        geographicScope: ['Global'],
        businessFunctions: ['all']
      },
      requirements: [
        {
          id: 'ISO27001-A5.1',
          title: 'Information security policies',
          article: 'Annex A.5.1',
          type: 'security_controls',
          severity: 'high',
          description: 'Management direction and support for information security',
          keywords: ['security policy', 'management support', 'information security'],
          mustHave: ['security policy', 'management approval'],
          auditEvidence: 'Approved security policies and management documentation',
          remediation: 'Develop and approve comprehensive information security policies'
        },
        {
          id: 'ISO27001-A8.1',
          title: 'User access management',
          article: 'Annex A.8.1',
          type: 'access_control',
          severity: 'high',
          description: 'Ensure authorized user access and prevent unauthorized access',
          keywords: ['access control', 'user management', 'authorization'],
          mustHave: ['access control policy', 'user registration'],
          shouldHave: ['privileged access management', 'access reviews'],
          auditEvidence: 'Access control procedures and user access records',
          remediation: 'Implement comprehensive user access management system'
        }
      ]
    });

    // FDA - Food and Drug Administration (Medical Devices)
    this.regulations.set('FDA', {
      name: 'FDA',
      fullName: 'FDA Medical Device Regulations',
      jurisdiction: 'US',
      version: '2021',
      lastUpdate: '2021-12-01',
      scope: ['medical_devices', 'software_validation'],
      applicability: {
        industries: ['healthcare', 'medical_devices'],
        dataTypes: ['health'],
        geographicScope: ['US'],
        businessFunctions: ['medical_device_operations']
      },
      requirements: [
        {
          id: 'FDA-820.70',
          title: 'Production and process controls',
          article: '21 CFR 820.70',
          type: 'quality_controls',
          severity: 'high',
          description: 'Controls for production and process validation',
          keywords: ['validation', 'process controls', 'medical device'],
          mustHave: ['validation procedures', 'process controls'],
          auditEvidence: 'Validation documentation and process control records',
          remediation: 'Implement comprehensive production and process controls'
        },
        {
          id: 'FDA-820.250',
          title: 'Statistical techniques',
          article: '21 CFR 820.250',
          type: 'quality_controls',
          severity: 'medium',
          description: 'Statistical methods for process control and validation',
          keywords: ['statistical methods', 'process validation', 'quality control'],
          mustHave: ['statistical procedures'],
          auditEvidence: 'Statistical analysis and validation records',
          remediation: 'Establish statistical methods for quality control'
        }
      ]
    });

    // NIST Cybersecurity Framework
    this.regulations.set('NIST', {
      name: 'NIST',
      fullName: 'NIST Cybersecurity Framework',
      jurisdiction: 'US',
      version: '1.1',
      lastUpdate: '2018-04-16',
      scope: ['cybersecurity', 'risk_management'],
      applicability: {
        industries: ['all'],
        dataTypes: ['all'],
        geographicScope: ['US', 'Global'],
        businessFunctions: ['cybersecurity']
      },
      requirements: [
        {
          id: 'NIST-ID.AM',
          title: 'Asset Management',
          article: 'Identify Function',
          type: 'security_controls',
          severity: 'medium',
          description: 'Identify and manage information systems, assets, data, and capabilities',
          keywords: ['asset management', 'inventory', 'data classification'],
          mustHave: ['asset inventory', 'data classification'],
          auditEvidence: 'Asset inventory and data classification records',
          remediation: 'Develop comprehensive asset management program'
        },
        {
          id: 'NIST-PR.AC',
          title: 'Identity Management and Access Control',
          article: 'Protect Function',
          type: 'access_control',
          severity: 'high',
          description: 'Manage access to assets and associated capabilities',
          keywords: ['access control', 'identity management', 'authentication'],
          mustHave: ['access control', 'identity verification'],
          auditEvidence: 'Access control policies and authentication records',
          remediation: 'Implement identity management and access control systems'
        },
        {
          id: 'NIST-DE.CM',
          title: 'Security Continuous Monitoring',
          article: 'Detect Function',
          type: 'audit_logging',
          severity: 'medium',
          description: 'Monitor information systems and assets',
          keywords: ['continuous monitoring', 'security monitoring', 'detection'],
          mustHave: ['monitoring procedures', 'detection capabilities'],
          auditEvidence: 'Monitoring logs and detection system records',
          remediation: 'Deploy continuous security monitoring capabilities'
        }
      ]
    });

    this.lastUpdate = new Date().toISOString();
  }

  /**
   * Find applicable regulations based on criteria
   */
  async findApplicableRegulations(criteria) {
    const applicableRegulations = [];

    for (const regulation of this.regulations.values()) {
      if (this.isRegulationApplicable(regulation, criteria)) {
        applicableRegulations.push(regulation);
      }
    }

    // Sort by relevance/importance
    return applicableRegulations.sort((a, b) => {
      const relevanceA = this.calculateRelevanceScore(a, criteria);
      const relevanceB = this.calculateRelevanceScore(b, criteria);
      return relevanceB - relevanceA;
    });
  }

  /**
   * Check if a regulation is applicable based on criteria
   */
  isRegulationApplicable(regulation, criteria) {
    const { industry, dataTypes, geographicScope, businessFunctions } = criteria;

    // Check industry applicability
    if (industry && regulation.applicability.industries.length > 0) {
      const industryMatch = regulation.applicability.industries.includes('all') ||
                           regulation.applicability.industries.includes(industry);
      if (!industryMatch) return false;
    }

    // Check data type applicability
    if (dataTypes && dataTypes.length > 0 && regulation.applicability.dataTypes.length > 0) {
      const dataTypeMatch = regulation.applicability.dataTypes.includes('all') ||
                           dataTypes.some(type => regulation.applicability.dataTypes.includes(type));
      if (!dataTypeMatch) return false;
    }

    // Check geographic scope
    if (geographicScope && regulation.applicability.geographicScope.length > 0) {
      const geoMatch = regulation.applicability.geographicScope.includes('Global') ||
                      regulation.applicability.geographicScope.includes(geographicScope);
      if (!geoMatch) return false;
    }

    // Check business functions
    if (businessFunctions && businessFunctions.length > 0 && regulation.applicability.businessFunctions.length > 0) {
      const functionMatch = regulation.applicability.businessFunctions.includes('all') ||
                           businessFunctions.some(func => regulation.applicability.businessFunctions.includes(func));
      if (!functionMatch) return false;
    }

    return true;
  }

  /**
   * Calculate relevance score for regulation ranking
   */
  calculateRelevanceScore(regulation, criteria) {
    let score = 0;

    // Base score by regulation criticality
    const criticalityScores = {
      'GDPR': 95,
      'HIPAA': 90,
      'SOX': 85,
      'PCI-DSS': 80,
      'ISO27001': 75,
      'FDA': 85,
      'NIST': 70
    };

    score += criticalityScores[regulation.name] || 50;

    // Bonus points for exact matches
    if (criteria.industry && regulation.applicability.industries.includes(criteria.industry)) {
      score += 10;
    }

    if (criteria.dataTypes) {
      const matchingDataTypes = criteria.dataTypes.filter(type =>
        regulation.applicability.dataTypes.includes(type)
      );
      score += matchingDataTypes.length * 5;
    }

    if (criteria.businessFunctions) {
      const matchingFunctions = criteria.businessFunctions.filter(func =>
        regulation.applicability.businessFunctions.includes(func)
      );
      score += matchingFunctions.length * 3;
    }

    return score;
  }

  /**
   * Get regulation by name
   */
  async getRegulation(name) {
    return this.regulations.get(name);
  }

  /**
   * Get all supported regulations
   */
  async getSupportedRegulations() {
    return Array.from(this.regulations.keys());
  }

  /**
   * Get regulation requirements by type
   */
  async getRequirementsByType(regulationName, type) {
    const regulation = this.regulations.get(regulationName);
    if (!regulation) return [];

    return regulation.requirements.filter(req => req.type === type);
  }

  /**
   * Search regulations by keyword
   */
  async searchRegulations(keyword) {
    const results = [];

    for (const [name, regulation] of this.regulations.entries()) {
      // Search in regulation name and description
      if (regulation.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
          regulation.scope.some(scope => scope.toLowerCase().includes(keyword.toLowerCase()))) {
        results.push({ regulation: name, matchType: 'regulation' });
      }

      // Search in requirements
      regulation.requirements.forEach(req => {
        if (req.title.toLowerCase().includes(keyword.toLowerCase()) ||
            req.description.toLowerCase().includes(keyword.toLowerCase()) ||
            req.keywords.some(kw => kw.toLowerCase().includes(keyword.toLowerCase()))) {
          results.push({
            regulation: name,
            requirement: req.id,
            matchType: 'requirement',
            title: req.title
          });
        }
      });
    }

    return results;
  }

  /**
   * Get compliance statistics
   */
  getComplianceStatistics() {
    const stats = {
      totalRegulations: this.regulations.size,
      totalRequirements: 0,
      requirementsByType: {},
      requirementsBySeverity: {},
      jurisdictions: new Set(),
      industries: new Set()
    };

    for (const regulation of this.regulations.values()) {
      stats.totalRequirements += regulation.requirements.length;
      stats.jurisdictions.add(regulation.jurisdiction);

      regulation.applicability.industries.forEach(industry => {
        if (industry !== 'all') stats.industries.add(industry);
      });

      regulation.requirements.forEach(req => {
        // Count by type
        stats.requirementsByType[req.type] = (stats.requirementsByType[req.type] || 0) + 1;

        // Count by severity
        stats.requirementsBySeverity[req.severity] = (stats.requirementsBySeverity[req.severity] || 0) + 1;
      });
    }

    return {
      ...stats,
      jurisdictions: Array.from(stats.jurisdictions),
      industries: Array.from(stats.industries)
    };
  }

  /**
   * Check for regulation updates
   */
  async checkForUpdates() {
    // In a real implementation, this would query external sources
    // For now, return mock update information
    return {
      hasUpdates: false,
      lastCheck: new Date().toISOString(),
      availableUpdates: []
    };
  }

  /**
   * Start automatic update checking
   */
  startAutoUpdateCheck() {
    setInterval(async () => {
      try {
        const updateCheck = await this.checkForUpdates();
        if (updateCheck.hasUpdates) {
          // Emit event for available updates
          this.emit('updates-available', updateCheck);
        }
      } catch (error) {
        console.error('Error checking for regulation updates:', error);
      }
    }, this.config.updateCheckInterval);
  }

  /**
   * Initialize default regulations
   */
  initializeRegulations() {
    // This method is called in constructor to set up basic structure
    // Actual loading happens in loadRegulations()
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.regulationCache.clear();
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      regulationsLoaded: this.regulations.size,
      cacheSize: this.regulationCache.size,
      lastUpdate: this.lastUpdate,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   */
  estimateMemoryUsage() {
    // Rough estimation
    let size = 0;
    for (const regulation of this.regulations.values()) {
      size += JSON.stringify(regulation).length;
    }
    return `${Math.round(size / 1024)}KB`;
  }
}

module.exports = { RegulatoryDatabase };