/**
 * Template Generator Component
 * AI-powered template generation interface
 */

import React, { useState, useEffect } from 'react';
import './TemplateGenerator.css';

const TemplateGenerator = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        type: 'capability',
        industry: 'general',
        category: 'general',
        name: '',
        description: '',
        complexity: 'medium',
        customRequirements: [],
        dependencies: {
            internal: { upstream: [], downstream: [] },
            external: { upstream: [], downstream: [] }
        },
        targetAudience: 'technical'
    });
    const [generatedTemplate, setGeneratedTemplate] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [validation, setValidation] = useState(null);
    const [newRequirement, setNewRequirement] = useState({
        name: '',
        description: '',
        type: 'functional',
        priority: 'medium'
    });

    // Industry options
    const industries = [
        { value: 'general', label: 'General' },
        { value: 'automotive', label: 'Automotive' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'fintech', label: 'Financial Technology' },
        { value: 'e-commerce', label: 'E-Commerce' },
        { value: 'iot', label: 'Internet of Things' },
        { value: 'saas', label: 'Software as a Service' },
        { value: 'mobile', label: 'Mobile Applications' },
        { value: 'web', label: 'Web Applications' }
    ];

    // Category options
    const categories = [
        { value: 'general', label: 'General' },
        { value: 'api', label: 'API Services' },
        { value: 'data', label: 'Data & Analytics' },
        { value: 'security', label: 'Security & Privacy' },
        { value: 'user', label: 'User Management' },
        { value: 'integration', label: 'System Integration' },
        { value: 'reporting', label: 'Reporting & Analytics' },
        { value: 'workflow', label: 'Workflow & Process' }
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleNestedInputChange = (parentField, nestedField, value) => {
        setFormData(prev => ({
            ...prev,
            [parentField]: {
                ...prev[parentField],
                [nestedField]: value
            }
        }));
    };

    const addCustomRequirement = () => {
        if (newRequirement.name.trim() && newRequirement.description.trim()) {
            setFormData(prev => ({
                ...prev,
                customRequirements: [...prev.customRequirements, { ...newRequirement }]
            }));
            setNewRequirement({
                name: '',
                description: '',
                type: 'functional',
                priority: 'medium'
            });
        }
    };

    const removeCustomRequirement = (index) => {
        setFormData(prev => ({
            ...prev,
            customRequirements: prev.customRequirements.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        const errors = [];

        if (!formData.name.trim()) {
            errors.push('Template name is required');
        }

        if (!formData.description.trim() || formData.description.length < 20) {
            errors.push('Description must be at least 20 characters long');
        }

        return errors;
    };

    const generateTemplate = async () => {
        const errors = validateForm();
        if (errors.length > 0) {
            setValidation({ isValid: false, errors });
            return;
        }

        setGenerating(true);
        setValidation(null);

        try {
            const response = await fetch('/api/marketplace/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                setGeneratedTemplate(result.data);
                setStep(4);
            } else {
                setValidation({
                    isValid: false,
                    errors: [result.error || 'Failed to generate template']
                });
            }
        } catch (error) {
            setValidation({
                isValid: false,
                errors: ['Network error occurred while generating template']
            });
        } finally {
            setGenerating(false);
        }
    };

    const downloadTemplate = () => {
        if (generatedTemplate) {
            const blob = new Blob([generatedTemplate.template], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${formData.name.replace(/[^a-zA-Z0-9]/g, '_')}_${generatedTemplate.templateId}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const saveTemplate = async () => {
        if (generatedTemplate) {
            try {
                const response = await fetch('/api/marketplace/templates/save', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        templateId: generatedTemplate.templateId,
                        content: generatedTemplate.template,
                        metadata: generatedTemplate.metadata
                    })
                });

                const result = await response.json();

                if (result.success) {
                    alert('Template saved successfully!');
                } else {
                    alert('Failed to save template: ' + result.error);
                }
            } catch (error) {
                alert('Error saving template: ' + error.message);
            }
        }
    };

    const startOver = () => {
        setStep(1);
        setFormData({
            type: 'capability',
            industry: 'general',
            category: 'general',
            name: '',
            description: '',
            complexity: 'medium',
            customRequirements: [],
            dependencies: {
                internal: { upstream: [], downstream: [] },
                external: { upstream: [], downstream: [] }
            },
            targetAudience: 'technical'
        });
        setGeneratedTemplate(null);
        setValidation(null);
    };

    const renderStepIndicator = () => (
        <div className="step-indicator">
            {[1, 2, 3, 4].map(stepNum => (
                <div
                    key={stepNum}
                    className={`step ${step >= stepNum ? 'active' : ''} ${step > stepNum ? 'completed' : ''}`}
                >
                    <div className="step-number">{stepNum}</div>
                    <div className="step-label">
                        {stepNum === 1 && 'Basic Info'}
                        {stepNum === 2 && 'Requirements'}
                        {stepNum === 3 && 'Review'}
                        {stepNum === 4 && 'Generated'}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderBasicInfo = () => (
        <div className="form-step">
            <h3>Basic Information</h3>
            <p>Tell us about the template you want to generate</p>

            <div className="form-group">
                <label>Template Type *</label>
                <div className="radio-group">
                    <label className="radio-label">
                        <input
                            type="radio"
                            value="capability"
                            checked={formData.type === 'capability'}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                        />
                        Capability
                        <span className="radio-description">High-level business functionality</span>
                    </label>
                    <label className="radio-label">
                        <input
                            type="radio"
                            value="enabler"
                            checked={formData.type === 'enabler'}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                        />
                        Enabler
                        <span className="radio-description">Technical implementation component</span>
                    </label>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="name">Template Name *</label>
                <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter a descriptive name for your template"
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe what this template will help you create (minimum 20 characters)"
                    className="form-textarea"
                    rows={4}
                />
                <div className="char-counter">
                    {formData.description.length}/20 minimum
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="industry">Industry</label>
                    <select
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                        className="form-select"
                    >
                        {industries.map(industry => (
                            <option key={industry.value} value={industry.value}>
                                {industry.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="form-select"
                    >
                        {categories.map(category => (
                            <option key={category.value} value={category.value}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="complexity">Complexity</label>
                    <select
                        id="complexity"
                        value={formData.complexity}
                        onChange={(e) => handleInputChange('complexity', e.target.value)}
                        className="form-select"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="targetAudience">Target Audience</label>
                <select
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    className="form-select"
                >
                    <option value="technical">Technical Team</option>
                    <option value="business">Business Stakeholders</option>
                    <option value="mixed">Mixed Audience</option>
                </select>
            </div>
        </div>
    );

    const renderRequirements = () => (
        <div className="form-step">
            <h3>Custom Requirements</h3>
            <p>Add specific requirements for your template (optional)</p>

            <div className="requirements-section">
                <h4>Add New Requirement</h4>
                <div className="requirement-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={newRequirement.name}
                                onChange={(e) => setNewRequirement(prev => ({
                                    ...prev,
                                    name: e.target.value
                                }))}
                                placeholder="Requirement name"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={newRequirement.type}
                                onChange={(e) => setNewRequirement(prev => ({
                                    ...prev,
                                    type: e.target.value
                                }))}
                                className="form-select"
                            >
                                <option value="functional">Functional</option>
                                <option value="non-functional">Non-Functional</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                value={newRequirement.priority}
                                onChange={(e) => setNewRequirement(prev => ({
                                    ...prev,
                                    priority: e.target.value
                                }))}
                                className="form-select"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={newRequirement.description}
                            onChange={(e) => setNewRequirement(prev => ({
                                ...prev,
                                description: e.target.value
                            }))}
                            placeholder="Describe the requirement"
                            className="form-textarea"
                            rows={2}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={addCustomRequirement}
                        className="btn-secondary"
                        disabled={!newRequirement.name.trim() || !newRequirement.description.trim()}
                    >
                        Add Requirement
                    </button>
                </div>
            </div>

            {formData.customRequirements.length > 0 && (
                <div className="requirements-list">
                    <h4>Custom Requirements ({formData.customRequirements.length})</h4>
                    {formData.customRequirements.map((req, index) => (
                        <div key={index} className="requirement-item">
                            <div className="requirement-header">
                                <span className="requirement-name">{req.name}</span>
                                <div className="requirement-badges">
                                    <span className={`badge ${req.type}`}>{req.type}</span>
                                    <span className={`badge priority-${req.priority}`}>{req.priority}</span>
                                </div>
                                <button
                                    onClick={() => removeCustomRequirement(index)}
                                    className="remove-btn"
                                    title="Remove requirement"
                                >
                                    ×
                                </button>
                            </div>
                            <p className="requirement-description">{req.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderReview = () => (
        <div className="form-step">
            <h3>Review & Generate</h3>
            <p>Review your configuration and generate the template</p>

            <div className="review-section">
                <div className="review-item">
                    <h4>Basic Information</h4>
                    <div className="review-grid">
                        <div><strong>Type:</strong> {formData.type}</div>
                        <div><strong>Name:</strong> {formData.name}</div>
                        <div><strong>Industry:</strong> {formData.industry}</div>
                        <div><strong>Category:</strong> {formData.category}</div>
                        <div><strong>Complexity:</strong> {formData.complexity}</div>
                        <div><strong>Target Audience:</strong> {formData.targetAudience}</div>
                    </div>
                    <div className="review-description">
                        <strong>Description:</strong>
                        <p>{formData.description}</p>
                    </div>
                </div>

                {formData.customRequirements.length > 0 && (
                    <div className="review-item">
                        <h4>Custom Requirements ({formData.customRequirements.length})</h4>
                        <div className="requirements-preview">
                            {formData.customRequirements.map((req, index) => (
                                <div key={index} className="requirement-preview">
                                    <span className="req-name">{req.name}</span>
                                    <span className={`req-badge ${req.type}`}>{req.type}</span>
                                    <span className={`req-badge priority-${req.priority}`}>{req.priority}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="review-item">
                    <h4>AI Generation Features</h4>
                    <ul className="features-list">
                        <li>✓ Industry-specific best practices</li>
                        <li>✓ Smart naming conventions</li>
                        <li>✓ Contextual requirements generation</li>
                        <li>✓ Dependency analysis</li>
                        <li>✓ Quality scoring and validation</li>
                        <li>✓ Structured template format</li>
                    </ul>
                </div>
            </div>

            {validation && !validation.isValid && (
                <div className="validation-errors">
                    <h4>Please fix these issues:</h4>
                    <ul>
                        {validation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="generate-section">
                <button
                    onClick={generateTemplate}
                    disabled={generating}
                    className="btn-primary generate-btn"
                >
                    {generating ? (
                        <>
                            <span className="spinner"></span>
                            Generating Template...
                        </>
                    ) : (
                        'Generate Template'
                    )}
                </button>
            </div>
        </div>
    );

    const renderGenerated = () => (
        <div className="form-step">
            <h3>Template Generated Successfully! 🎉</h3>
            <p>Your AI-generated template is ready for use</p>

            {generatedTemplate && (
                <div className="generated-section">
                    <div className="template-info">
                        <div className="info-grid">
                            <div><strong>Template ID:</strong> {generatedTemplate.templateId}</div>
                            <div><strong>Type:</strong> {generatedTemplate.metadata.type}</div>
                            <div><strong>Industry:</strong> {generatedTemplate.metadata.industry}</div>
                            <div><strong>Complexity:</strong> {generatedTemplate.metadata.complexity}</div>
                            <div><strong>Relevance Score:</strong> {generatedTemplate.metadata.relevanceScore}%</div>
                        </div>
                    </div>

                    <div className="template-preview">
                        <h4>Template Preview</h4>
                        <div className="preview-content">
                            <pre>{generatedTemplate.template.substring(0, 1000)}...</pre>
                        </div>
                    </div>

                    <div className="template-actions">
                        <button onClick={downloadTemplate} className="btn-primary">
                            📥 Download Template
                        </button>
                        <button onClick={saveTemplate} className="btn-secondary">
                            💾 Save to Library
                        </button>
                        <button onClick={startOver} className="btn-outline">
                            🔄 Generate Another
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderStepContent = () => {
        switch (step) {
            case 1: return renderBasicInfo();
            case 2: return renderRequirements();
            case 3: return renderReview();
            case 4: return renderGenerated();
            default: return renderBasicInfo();
        }
    };

    const renderNavigation = () => (
        <div className="step-navigation">
            {step > 1 && step < 4 && (
                <button
                    onClick={() => setStep(step - 1)}
                    className="btn-outline"
                >
                    ← Previous
                </button>
            )}
            {step < 3 && (
                <button
                    onClick={() => setStep(step + 1)}
                    className="btn-primary"
                    disabled={step === 1 && (!formData.name.trim() || formData.description.length < 20)}
                >
                    Next →
                </button>
            )}
        </div>
    );

    return (
        <div className="template-generator">
            <div className="generator-header">
                <h2>AI Template Generator</h2>
                <p>Create intelligent templates powered by industry best practices</p>
            </div>

            {renderStepIndicator()}

            <div className="generator-content">
                {renderStepContent()}
            </div>

            {step < 4 && renderNavigation()}
        </div>
    );
};

export default TemplateGenerator;