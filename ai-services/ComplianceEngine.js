/**
 * Compliance Engine - Advanced automated compliance checking for industry standards
 * Supports GDPR, HIPAA, SOX, PCI-DSS, ISO 27001, FDA, NIST and other regulatory frameworks
 */

const EventEmitter = require('events');
const { RegulatoryDatabase } = require('./RegulatoryDatabase');
const { AuditTrailGenerator } = require('./AuditTrailGenerator');

class ComplianceEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.version = '1.0.0';
    this.name = 'Compliance Engine';

    this.config = {
      realTimeValidation: config.realTimeValidation !== false,
      responseTimeTarget: config.responseTimeTarget || 200, // ms
      accuracyTarget: config.accuracyTarget || 95, // percentage
      enableAuditTrail: config.enableAuditTrail !== false,
      autoDetection: config.autoDetection !== false,
      maxConcurrentChecks: config.maxConcurrentChecks || 10,
      cacheResults: config.cacheResults !== false,
      cacheTTL: config.cacheTTL || 300000, // 5 minutes
      ...config
    };

    // Core components
    this.regulatoryDatabase = new RegulatoryDatabase(this.config.regulatory || {});
    this.auditTrail = new AuditTrailGenerator(this.config.audit || {});

    // Performance tracking
    this.metrics = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
      responseTimes: [],
      detectionAccuracy: 0,
      regulationsDetected: new Map(),
      complianceViolations: new Map()
    };

    // Cache for compliance results
    this.complianceCache = new Map();
    this.activeChecks = new Set();

    this.initialize();
  }

  /**
   * Initialize the Compliance Engine
   */
  async initialize() {
    try {
      await this.regulatoryDatabase.initialize();
      await this.auditTrail.initialize();

      this.emit('compliance-engine-initialized', {
        timestamp: new Date().toISOString(),
        regulations: await this.regulatoryDatabase.getSupportedRegulations(),
        config: this.config
      });
    } catch (error) {
      this.emit('compliance-engine-error', {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Main compliance checking method
   */
  async checkCompliance(document, context = {}) {
    const startTime = Date.now();
    const checkId = this.generateCheckId();

    this.metrics.totalChecks++;
    this.activeChecks.add(checkId);

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(document, context);
      if (this.config.cacheResults && this.complianceCache.has(cacheKey)) {
        const cached = this.complianceCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.config.cacheTTL) {
          return {
            ...cached.result,
            fromCache: true,
            processingTime: Date.now() - startTime,
            checkId
          };
        }
      }

      // Perform compliance analysis
      const complianceResult = await this.performComplianceAnalysis(document, context, checkId);

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, true);

      // Cache result
      if (this.config.cacheResults) {
        this.complianceCache.set(cacheKey, {
          result: complianceResult,
          timestamp: Date.now()
        });
      }

      // Generate audit trail entry
      if (this.config.enableAuditTrail) {
        await this.auditTrail.logComplianceCheck({
          checkId,
          document,
          result: complianceResult,
          processingTime,
          timestamp: new Date().toISOString()
        });
      }

      return {
        ...complianceResult,
        fromCache: false,
        processingTime,
        checkId
      };

    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false);

      this.emit('compliance-check-failed', {
        checkId,
        error: error.message,
        document: document.id || 'unknown',
        timestamp: new Date().toISOString()
      });

      return {
        isCompliant: false,
        applicableRegulations: [],
        violations: [{
          type: 'COMPLIANCE_CHECK_ERROR',
          message: `Compliance check failed: ${error.message}`,
          severity: 'high',
          regulation: 'SYSTEM'
        }],
        recommendations: [],
        auditTrail: [],
        processingTime: Date.now() - startTime,
        checkId,
        error: error.message
      };
    } finally {
      this.activeChecks.delete(checkId);
    }
  }

  /**
   * Perform comprehensive compliance analysis
   */
  async performComplianceAnalysis(document, context, checkId) {
    // Step 1: Detect applicable regulations
    const applicableRegulations = await this.detectApplicableRegulations(document, context);

    // Step 2: Validate against each regulation
    const validationResults = await Promise.all(
      applicableRegulations.map(regulation =>
        this.validateAgainstRegulation(document, regulation, context)
      )
    );

    // Step 3: Aggregate results
    const violations = validationResults.flatMap(result => result.violations);
    const recommendations = validationResults.flatMap(result => result.recommendations);
    const auditRequirements = validationResults.flatMap(result => result.auditRequirements);

    // Step 4: Calculate compliance score
    const complianceScore = this.calculateComplianceScore(violations, applicableRegulations.length);

    // Step 5: Generate recommendations
    const enhancedRecommendations = await this.generateComplianceRecommendations(
      violations, applicableRegulations, document, context
    );

    return {
      isCompliant: violations.length === 0,
      complianceScore,
      applicableRegulations: applicableRegulations.map(reg => reg.name),
      violations,
      recommendations: [...recommendations, ...enhancedRecommendations],
      auditRequirements,
      riskLevel: this.calculateRiskLevel(violations),
      nextReviewDate: this.calculateNextReviewDate(applicableRegulations),
      regulatoryUpdates: await this.getRecentRegulatoryUpdates(applicableRegulations)
    };
  }

  /**
   * Detect applicable regulations based on document content and context
   */
  async detectApplicableRegulations(document, context) {
    const detectionCriteria = {
      documentType: context.documentType || this.detectDocumentType(document),
      industry: context.industry || this.detectIndustry(document),
      dataTypes: this.detectDataTypes(document),
      geographicScope: context.geographicScope || this.detectGeographicScope(document),
      businessFunctions: this.detectBusinessFunctions(document)
    };

    const regulations = await this.regulatoryDatabase.findApplicableRegulations(detectionCriteria);

    // Update detection metrics
    regulations.forEach(reg => {
      const count = this.metrics.regulationsDetected.get(reg.name) || 0;
      this.metrics.regulationsDetected.set(reg.name, count + 1);
    });

    this.emit('regulations-detected', {
      documentId: document.id,
      detectedRegulations: regulations.map(r => r.name),
      criteria: detectionCriteria,
      timestamp: new Date().toISOString()
    });

    return regulations;
  }

  /**
   * Validate document against specific regulation
   */
  async validateAgainstRegulation(document, regulation, context) {
    const violations = [];
    const recommendations = [];
    const auditRequirements = [];

    for (const requirement of regulation.requirements) {
      const validationResult = await this.validateRequirement(document, requirement, context);

      if (!validationResult.isCompliant) {
        violations.push({
          type: 'REGULATORY_VIOLATION',
          regulation: regulation.name,
          requirement: requirement.id,
          title: requirement.title,
          message: validationResult.message,
          severity: requirement.severity || 'medium',
          article: requirement.article,
          remediation: requirement.remediation,
          auditEvidence: requirement.auditEvidence
        });

        // Track violation metrics
        const violationKey = `${regulation.name}-${requirement.id}`;
        const count = this.metrics.complianceViolations.get(violationKey) || 0;
        this.metrics.complianceViolations.set(violationKey, count + 1);
      }

      if (validationResult.recommendations && validationResult.recommendations.length > 0) {
        recommendations.push(...validationResult.recommendations.map(rec => ({
          ...rec,
          regulation: regulation.name,
          requirement: requirement.id
        })));
      }

      if (requirement.auditEvidence) {
        auditRequirements.push({
          regulation: regulation.name,
          requirement: requirement.id,
          evidence: requirement.auditEvidence,
          status: validationResult.isCompliant ? 'satisfied' : 'missing'
        });
      }
    }

    return { violations, recommendations, auditRequirements };
  }

  /**
   * Validate individual requirement
   */
  async validateRequirement(document, requirement, context) {
    try {
      // Use regulation-specific validation logic
      switch (requirement.type) {
        case 'data_protection':
          return await this.validateDataProtection(document, requirement, context);
        case 'access_control':
          return await this.validateAccessControl(document, requirement, context);
        case 'audit_logging':
          return await this.validateAuditLogging(document, requirement, context);
        case 'encryption':
          return await this.validateEncryption(document, requirement, context);
        case 'privacy':
          return await this.validatePrivacy(document, requirement, context);
        case 'financial_controls':
          return await this.validateFinancialControls(document, requirement, context);
        case 'security_controls':
          return await this.validateSecurityControls(document, requirement, context);
        default:
          return await this.validateGenericRequirement(document, requirement, context);
      }
    } catch (error) {
      return {
        isCompliant: false,
        message: `Validation error: ${error.message}`,
        recommendations: [{
          type: 'validation_error',
          message: 'Manual review required due to validation error'
        }]
      };
    }
  }

  /**
   * GDPR Data Protection Validation
   */
  async validateDataProtection(document, requirement, context) {
    const violations = [];
    const recommendations = [];

    // Check for personal data handling
    const personalDataIndicators = [
      'personal data', 'PII', 'personally identifiable', 'user data',
      'customer information', 'email address', 'phone number', 'address'
    ];

    const containsPersonalData = personalDataIndicators.some(indicator =>
      document.description?.toLowerCase().includes(indicator.toLowerCase()) ||
      document.title?.toLowerCase().includes(indicator.toLowerCase())
    );

    if (containsPersonalData) {
      // Check for lawful basis
      const lawfulBasisKeywords = ['consent', 'contract', 'legal obligation', 'vital interests', 'public task', 'legitimate interests'];
      const hasLawfulBasis = lawfulBasisKeywords.some(basis =>
        document.description?.toLowerCase().includes(basis.toLowerCase())
      );

      if (!hasLawfulBasis) {
        violations.push('No lawful basis for processing personal data identified');
        recommendations.push({
          type: 'gdpr_compliance',
          message: 'Specify lawful basis for processing personal data under GDPR Article 6'
        });
      }

      // Check for data minimization
      const dataMinimizationKeywords = ['minimal', 'necessary', 'limited', 'specific purpose'];
      const implementsDataMinimization = dataMinimizationKeywords.some(keyword =>
        document.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!implementsDataMinimization) {
        recommendations.push({
          type: 'gdpr_compliance',
          message: 'Consider implementing data minimization principles (GDPR Article 5)'
        });
      }
    }

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'GDPR data protection requirements satisfied',
      recommendations
    };
  }

  /**
   * HIPAA Healthcare Information Validation
   */
  async validatePrivacy(document, requirement, context) {
    const violations = [];
    const recommendations = [];

    // Check for PHI (Protected Health Information)
    const phiIndicators = [
      'health information', 'medical record', 'patient data', 'PHI',
      'healthcare data', 'medical information', 'diagnosis', 'treatment'
    ];

    const containsPHI = phiIndicators.some(indicator =>
      document.description?.toLowerCase().includes(indicator.toLowerCase()) ||
      document.title?.toLowerCase().includes(indicator.toLowerCase())
    );

    if (containsPHI) {
      // Check for encryption requirements
      const encryptionKeywords = ['encrypt', 'encryption', 'secure transmission', 'SSL', 'TLS'];
      const hasEncryption = encryptionKeywords.some(keyword =>
        document.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasEncryption) {
        violations.push('PHI transmission/storage encryption not specified');
        recommendations.push({
          type: 'hipaa_compliance',
          message: 'Implement encryption for PHI as required by HIPAA Security Rule'
        });
      }

      // Check for access controls
      const accessControlKeywords = ['access control', 'authentication', 'authorization', 'role-based'];
      const hasAccessControls = accessControlKeywords.some(keyword =>
        document.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasAccessControls) {
        violations.push('Access controls for PHI not adequately defined');
        recommendations.push({
          type: 'hipaa_compliance',
          message: 'Define proper access controls for PHI access (HIPAA Security Rule)'
        });
      }
    }

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'HIPAA privacy requirements satisfied',
      recommendations
    };
  }

  /**
   * SOX Financial Controls Validation
   */
  async validateFinancialControls(document, requirement, context) {
    const violations = [];
    const recommendations = [];

    // Check for financial reporting controls
    const financialKeywords = [
      'financial', 'accounting', 'revenue', 'expense', 'audit',
      'financial reporting', 'general ledger', 'reconciliation'
    ];

    const isFinancialProcess = financialKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase()) ||
      document.title?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isFinancialProcess) {
      // Check for segregation of duties
      const segregationKeywords = ['segregation', 'separation of duties', 'dual approval', 'maker-checker'];
      const hasSegregation = segregationKeywords.some(keyword =>
        document.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasSegregation) {
        violations.push('Segregation of duties not adequately defined for financial process');
        recommendations.push({
          type: 'sox_compliance',
          message: 'Implement segregation of duties for financial processes (SOX Section 404)'
        });
      }

      // Check for documentation and audit trail
      const auditTrailKeywords = ['audit trail', 'documentation', 'logging', 'tracking', 'evidence'];
      const hasAuditTrail = auditTrailKeywords.some(keyword =>
        document.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasAuditTrail) {
        violations.push('Audit trail and documentation requirements not specified');
        recommendations.push({
          type: 'sox_compliance',
          message: 'Ensure comprehensive audit trails for financial transactions (SOX Section 302)'
        });
      }
    }

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'SOX financial control requirements satisfied',
      recommendations
    };
  }

  /**
   * PCI-DSS Security Controls Validation
   */
  async validateSecurityControls(document, requirement, context) {
    const violations = [];
    const recommendations = [];

    // Check for payment card data handling
    const pciKeywords = [
      'payment', 'credit card', 'card data', 'PCI', 'cardholder',
      'payment processing', 'transaction', 'payment information'
    ];

    const handlesCardData = pciKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase()) ||
      document.title?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (handlesCardData) {
      // Check for network security
      const networkSecurityKeywords = ['firewall', 'network security', 'DMZ', 'network segmentation'];
      const hasNetworkSecurity = networkSecurityKeywords.some(keyword =>
        document.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasNetworkSecurity) {
        violations.push('Network security controls for cardholder data environment not specified');
        recommendations.push({
          type: 'pci_compliance',
          message: 'Implement network security controls (PCI-DSS Requirement 1)'
        });
      }

      // Check for encryption
      const encryptionKeywords = ['encrypt', 'encryption', 'secure storage', 'data protection'];
      const hasEncryption = encryptionKeywords.some(keyword =>
        document.description?.toLowerCase().includes(keyword.toLowerCase())
      );

      if (!hasEncryption) {
        violations.push('Encryption of cardholder data not specified');
        recommendations.push({
          type: 'pci_compliance',
          message: 'Implement encryption for cardholder data (PCI-DSS Requirement 3)'
        });
      }
    }

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'PCI-DSS security control requirements satisfied',
      recommendations
    };
  }

  /**
   * Access Control Validation
   */
  async validateAccessControl(document, requirement, context) {
    const violations = [];
    const recommendations = [];

    // Check for access control mechanisms
    const accessControlKeywords = [
      'access control', 'authentication', 'authorization', 'role-based',
      'RBAC', 'user management', 'permissions', 'access rights'
    ];

    const hasAccessControls = accessControlKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase()) ||
      document.title?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasAccessControls) {
      violations.push('Access control mechanisms not adequately defined');
      recommendations.push({
        type: 'access_control',
        message: 'Implement comprehensive access control system with authentication and authorization'
      });
    }

    // Check for multi-factor authentication
    const mfaKeywords = ['multi-factor', 'MFA', '2FA', 'two-factor', 'multi-step'];
    const hasMFA = mfaKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasMFA) {
      recommendations.push({
        type: 'access_control',
        message: 'Consider implementing multi-factor authentication for enhanced security'
      });
    }

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'Access control requirements satisfied',
      recommendations
    };
  }

  /**
   * Audit Logging Validation
   */
  async validateAuditLogging(document, requirement, context) {
    const violations = [];
    const recommendations = [];

    // Check for audit logging requirements
    const auditKeywords = [
      'audit log', 'logging', 'audit trail', 'event logging',
      'access logging', 'activity tracking', 'log monitoring'
    ];

    const hasAuditLogging = auditKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase()) ||
      document.title?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasAuditLogging) {
      violations.push('Audit logging requirements not specified');
      recommendations.push({
        type: 'audit_logging',
        message: 'Implement comprehensive audit logging for all system activities'
      });
    }

    // Check for log retention
    const retentionKeywords = ['retention', 'archive', 'log storage', 'backup'];
    const hasRetention = retentionKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasRetention) {
      recommendations.push({
        type: 'audit_logging',
        message: 'Define log retention and archival policies'
      });
    }

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'Audit logging requirements satisfied',
      recommendations
    };
  }

  /**
   * Encryption Validation
   */
  async validateEncryption(document, requirement, context) {
    const violations = [];
    const recommendations = [];

    // Check for encryption requirements
    const encryptionKeywords = [
      'encryption', 'encrypt', 'cryptographic', 'SSL', 'TLS',
      'AES', 'RSA', 'data protection', 'secure transmission'
    ];

    const hasEncryption = encryptionKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase()) ||
      document.title?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasEncryption) {
      violations.push('Encryption requirements not specified');
      recommendations.push({
        type: 'encryption',
        message: 'Implement encryption for data at rest and in transit'
      });
    }

    // Check for key management
    const keyMgmtKeywords = ['key management', 'key rotation', 'key storage', 'PKI'];
    const hasKeyManagement = keyMgmtKeywords.some(keyword =>
      document.description?.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasEncryption && !hasKeyManagement) {
      recommendations.push({
        type: 'encryption',
        message: 'Define proper cryptographic key management procedures'
      });
    }

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'Encryption requirements satisfied',
      recommendations
    };
  }

  /**
   * Generic validation for other requirement types
   */
  async validateGenericRequirement(document, requirement, context) {
    // Implement basic keyword matching and pattern detection
    const keywords = requirement.keywords || [];
    const mustHave = requirement.mustHave || [];
    const shouldHave = requirement.shouldHave || [];

    const violations = [];
    const recommendations = [];

    // Check must-have requirements
    mustHave.forEach(item => {
      const hasItem = document.description?.toLowerCase().includes(item.toLowerCase()) ||
                     document.title?.toLowerCase().includes(item.toLowerCase());

      if (!hasItem) {
        violations.push(`Required element '${item}' not found`);
      }
    });

    // Check should-have recommendations
    shouldHave.forEach(item => {
      const hasItem = document.description?.toLowerCase().includes(item.toLowerCase()) ||
                     document.title?.toLowerCase().includes(item.toLowerCase());

      if (!hasItem) {
        recommendations.push({
          type: 'best_practice',
          message: `Consider including '${item}' for better compliance`
        });
      }
    });

    return {
      isCompliant: violations.length === 0,
      message: violations.length > 0 ? violations.join('; ') : 'Generic requirement satisfied',
      recommendations
    };
  }

  /**
   * Generate enhanced compliance recommendations
   */
  async generateComplianceRecommendations(violations, regulations, document, context) {
    const recommendations = [];

    // Priority-based recommendations
    const highPriorityViolations = violations.filter(v => v.severity === 'high');
    const mediumPriorityViolations = violations.filter(v => v.severity === 'medium');

    if (highPriorityViolations.length > 0) {
      recommendations.push({
        type: 'urgent_action',
        priority: 'critical',
        message: `${highPriorityViolations.length} high-priority compliance violations require immediate attention`,
        actions: highPriorityViolations.map(v => v.remediation).filter(Boolean)
      });
    }

    if (mediumPriorityViolations.length > 0) {
      recommendations.push({
        type: 'improvement',
        priority: 'medium',
        message: `${mediumPriorityViolations.length} medium-priority compliance issues should be addressed`,
        actions: mediumPriorityViolations.map(v => v.remediation).filter(Boolean)
      });
    }

    // Regulation-specific recommendations
    for (const regulation of regulations) {
      const regViolations = violations.filter(v => v.regulation === regulation.name);
      if (regViolations.length === 0) {
        recommendations.push({
          type: 'compliant',
          regulation: regulation.name,
          message: `Document appears compliant with ${regulation.name} requirements`,
          nextSteps: [`Schedule periodic review for ${regulation.name} compliance`]
        });
      }
    }

    return recommendations;
  }

  /**
   * Content analysis methods for regulation detection
   */
  detectDocumentType(document) {
    if (document.id?.startsWith('CAP-')) return 'capability';
    if (document.id?.startsWith('ENB-')) return 'enabler';
    if (document.functionalRequirements) return 'requirements';
    return 'general';
  }

  detectIndustry(document) {
    const industryKeywords = {
      healthcare: ['health', 'medical', 'patient', 'clinical', 'healthcare', 'hospital'],
      financial: ['financial', 'banking', 'payment', 'finance', 'money', 'transaction'],
      retail: ['retail', 'ecommerce', 'shopping', 'customer', 'sales'],
      technology: ['software', 'system', 'application', 'technology', 'digital'],
      government: ['government', 'public', 'federal', 'state', 'municipal']
    };

    const content = (document.description || '').toLowerCase();

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return industry;
      }
    }

    return 'general';
  }

  detectDataTypes(document) {
    const dataTypes = [];
    const content = (document.description || '').toLowerCase();

    const dataTypePatterns = {
      personal: ['personal data', 'PII', 'personally identifiable'],
      financial: ['financial data', 'payment information', 'credit card'],
      health: ['health information', 'medical record', 'PHI'],
      biometric: ['biometric', 'fingerprint', 'facial recognition'],
      location: ['location data', 'GPS', 'geolocation']
    };

    for (const [type, patterns] of Object.entries(dataTypePatterns)) {
      if (patterns.some(pattern => content.includes(pattern))) {
        dataTypes.push(type);
      }
    }

    return dataTypes;
  }

  detectGeographicScope(document) {
    const regions = {
      EU: ['GDPR', 'European', 'EU', 'Europe'],
      US: ['United States', 'US', 'America', 'HIPAA', 'SOX'],
      Global: ['global', 'international', 'worldwide']
    };

    const content = (document.description || '').toLowerCase();

    for (const [region, keywords] of Object.entries(regions)) {
      if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
        return region;
      }
    }

    return 'Unknown';
  }

  detectBusinessFunctions(document) {
    const functions = [];
    const content = (document.description || '').toLowerCase();

    const functionKeywords = {
      'data_processing': ['data processing', 'data collection', 'data storage'],
      'user_authentication': ['authentication', 'login', 'user access'],
      'payment_processing': ['payment', 'transaction', 'billing'],
      'reporting': ['report', 'analytics', 'dashboard'],
      'communication': ['email', 'notification', 'messaging']
    };

    for (const [func, keywords] of Object.entries(functionKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        functions.push(func);
      }
    }

    return functions;
  }

  /**
   * Utility methods
   */
  calculateComplianceScore(violations, totalRegulations) {
    if (totalRegulations === 0) return 100;

    const violationWeight = {
      high: 15,
      medium: 10,
      low: 5
    };

    const totalDeductions = violations.reduce((sum, violation) =>
      sum + (violationWeight[violation.severity] || 10), 0);

    return Math.max(0, 100 - totalDeductions);
  }

  calculateRiskLevel(violations) {
    const highRiskCount = violations.filter(v => v.severity === 'high').length;
    const mediumRiskCount = violations.filter(v => v.severity === 'medium').length;

    if (highRiskCount > 0) return 'High';
    if (mediumRiskCount > 2) return 'Medium';
    if (violations.length > 0) return 'Low';
    return 'Minimal';
  }

  calculateNextReviewDate(regulations) {
    // Most regulations require annual review, some quarterly
    const reviewPeriods = {
      'GDPR': 365,
      'HIPAA': 365,
      'SOX': 90,
      'PCI-DSS': 90,
      'ISO 27001': 365
    };

    const shortestPeriod = Math.min(
      ...regulations.map(reg => reviewPeriods[reg.name] || 365)
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + shortestPeriod);
    return nextReview.toISOString().split('T')[0];
  }

  async getRecentRegulatoryUpdates(regulations) {
    // This would typically query a regulatory updates service
    return regulations.map(reg => ({
      regulation: reg.name,
      lastUpdate: reg.lastUpdate || 'Unknown',
      hasRecentChanges: false,
      changeDescription: null
    }));
  }

  /**
   * Cache and performance utilities
   */
  generateCacheKey(document, context) {
    return `${document.id || 'unknown'}_${JSON.stringify(context).slice(0, 100)}`;
  }

  generateCheckId() {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  updateMetrics(processingTime, success) {
    if (success) {
      this.metrics.successfulChecks++;
    } else {
      this.metrics.failedChecks++;
    }

    this.metrics.responseTimes.push(processingTime);

    // Keep only last 100 response times
    if (this.metrics.responseTimes.length > 100) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-100);
    }

    this.metrics.averageResponseTime =
      this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) /
      this.metrics.responseTimes.length;
  }

  /**
   * Public API methods
   */
  async process(request) {
    switch (request.type) {
      case 'compliance-check':
        return await this.checkCompliance(request.document, request.context);
      case 'bulk-compliance-check':
        return await this.bulkComplianceCheck(request.documents, request.context);
      case 'regulation-detection':
        return await this.detectApplicableRegulations(request.document, request.context);
      case 'compliance-report':
        return await this.generateComplianceReport(request.scope, request.options);
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }
  }

  async bulkComplianceCheck(documents, context = {}) {
    const results = await Promise.all(
      documents.map(doc => this.checkCompliance(doc, context))
    );

    return {
      totalDocuments: documents.length,
      compliantDocuments: results.filter(r => r.isCompliant).length,
      nonCompliantDocuments: results.filter(r => !r.isCompliant).length,
      averageComplianceScore: results.reduce((sum, r) => sum + (r.complianceScore || 0), 0) / results.length,
      results
    };
  }

  async generateComplianceReport(scope = 'all', options = {}) {
    return {
      reportType: 'compliance-summary',
      scope,
      generatedAt: new Date().toISOString(),
      metrics: this.getMetrics(),
      supportedRegulations: await this.regulatoryDatabase.getSupportedRegulations(),
      recentActivity: this.getRecentActivity(),
      recommendations: this.getSystemRecommendations()
    };
  }

  getMetrics() {
    const successRate = this.metrics.totalChecks > 0 ?
      (this.metrics.successfulChecks / this.metrics.totalChecks) * 100 : 0;

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 100) / 100,
      cacheSize: this.complianceCache.size,
      activeChecks: this.activeChecks.size,
      topViolations: Array.from(this.metrics.complianceViolations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
    };
  }

  getRecentActivity() {
    // This would typically be stored in a database
    return {
      checksToday: this.metrics.totalChecks,
      violationsToday: Array.from(this.metrics.complianceViolations.values()).reduce((sum, count) => sum + count, 0),
      lastCheck: new Date().toISOString()
    };
  }

  getSystemRecommendations() {
    const recommendations = [];

    if (this.metrics.averageResponseTime > this.config.responseTimeTarget) {
      recommendations.push({
        type: 'performance',
        message: `Average response time (${Math.round(this.metrics.averageResponseTime)}ms) exceeds target (${this.config.responseTimeTarget}ms)`,
        action: 'Consider increasing cache TTL or optimizing validation logic'
      });
    }

    const successRate = this.metrics.totalChecks > 0 ?
      (this.metrics.successfulChecks / this.metrics.totalChecks) * 100 : 100;

    if (successRate < this.config.accuracyTarget) {
      recommendations.push({
        type: 'accuracy',
        message: `Success rate (${Math.round(successRate)}%) below target (${this.config.accuracyTarget}%)`,
        action: 'Review failed checks and improve validation logic'
      });
    }

    return recommendations;
  }

  async healthCheck() {
    const isHealthy = this.metrics.averageResponseTime < this.config.responseTimeTarget * 2;

    return {
      healthy: isHealthy,
      service: 'compliance-engine',
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      activeChecks: this.activeChecks.size
    };
  }
}

module.exports = { ComplianceEngine };