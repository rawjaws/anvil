/**
 * Template Recommendations - Smart template suggestions component
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Star,
  Copy,
  Edit3,
  ChevronDown,
  ChevronRight,
  Zap,
  Users,
  Calendar,
  Tag,
  Search,
  Filter
} from 'lucide-react';
import './TemplateRecommendations.css';

const TemplateRecommendations = ({
  templates = [],
  context = {},
  onTemplateSelect,
  onTemplateCustomize,
  isLoading = false
}) => {
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' ||
      template.template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.template.keywords.some(keyword =>
        keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory = selectedCategory === 'all' ||
      template.template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(templates.map(t => t.template.category))];

  // Handle template selection
  const handleTemplateSelect = (template) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  // Handle template customization
  const handleCustomize = (template) => {
    if (onTemplateCustomize) {
      onTemplateCustomize(template, {
        context,
        timestamp: new Date().toISOString()
      });
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  // Get complexity color
  const getComplexityColor = (complexity) => {
    switch (complexity) {
      case 'basic': return 'basic';
      case 'intermediate': return 'intermediate';
      case 'advanced': return 'advanced';
      default: return 'basic';
    }
  };

  if (isLoading) {
    return (
      <div className="template-recommendations">
        <div className="panel-header">
          <h4>Template Recommendations</h4>
        </div>
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Finding relevant templates...</span>
        </div>
      </div>
    );
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="template-recommendations">
        <div className="panel-header">
          <h4>Template Recommendations</h4>
        </div>
        <div className="empty-state">
          <BookOpen size={24} className="empty-icon" />
          <p>No template recommendations available</p>
          <small>Try providing more context about your document</small>
        </div>
      </div>
    );
  }

  return (
    <div className="template-recommendations">
      <div className="panel-header">
        <h4>Template Recommendations</h4>
        <div className="header-actions">
          <button
            className="filter-btn"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={12} />
            {showFilters ? 'Hide' : 'Filter'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      {showFilters && (
        <div className="filters-section">
          <div className="search-box">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-filter">
            <label>Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' :
                   category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Template List */}
      <div className="templates-list">
        {filteredTemplates.map((templateRec, index) => {
          const template = templateRec.template;
          const isExpanded = expandedTemplate === index;

          return (
            <div
              key={index}
              className={`template-item ${isExpanded ? 'expanded' : ''}`}
            >
              {/* Template Header */}
              <div
                className="template-header"
                onClick={() => setExpandedTemplate(isExpanded ? null : index)}
              >
                <div className="template-title">
                  <div className="title-row">
                    <BookOpen size={14} />
                    <span className="name">{template.name}</span>
                    <div className="template-badges">
                      <span className={`confidence ${getConfidenceColor(templateRec.confidence)}`}>
                        {Math.round(templateRec.confidence * 100)}%
                      </span>
                      <span className={`complexity ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </span>
                    </div>
                  </div>
                  <p className="description">{template.description}</p>
                </div>
                <div className="expand-icon">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
              </div>

              {/* Template Details */}
              {isExpanded && (
                <div className="template-details">
                  {/* Template Preview */}
                  <div className="template-preview">
                    <h5>Template</h5>
                    <div className="template-text">
                      {template.template}
                    </div>
                  </div>

                  {/* Fields */}
                  {template.fields && template.fields.length > 0 && (
                    <div className="template-fields">
                      <h5>Fields to Fill</h5>
                      <div className="fields-list">
                        {template.fields.map((field, fieldIndex) => (
                          <div key={fieldIndex} className="field-item">
                            <span className="field-name">{field.name}</span>
                            <span className="field-type">{field.type}</span>
                            {field.placeholder && (
                              <span className="field-placeholder">
                                {field.placeholder}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  {template.examples && template.examples.length > 0 && (
                    <div className="template-examples">
                      <h5>Examples</h5>
                      {template.examples.slice(0, 2).map((example, exampleIndex) => (
                        <div key={exampleIndex} className="example-item">
                          <div className="example-text">{example}</div>
                          <button
                            className="copy-example-btn"
                            onClick={() => handleTemplateSelect({ template: example })}
                            title="Use this example"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="template-metadata">
                    <div className="metadata-row">
                      <div className="meta-item">
                        <Tag size={12} />
                        <span>Category: {template.category}</span>
                      </div>
                      {template.usageCount > 0 && (
                        <div className="meta-item">
                          <Users size={12} />
                          <span>Used {template.usageCount} times</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <Star size={12} />
                        <span>{template.rating.toFixed(1)} rating</span>
                      </div>
                    </div>

                    {/* Keywords */}
                    {template.keywords && template.keywords.length > 0 && (
                      <div className="keywords">
                        <span className="keywords-label">Keywords:</span>
                        <div className="keyword-tags">
                          {template.keywords.slice(0, 5).map((keyword, keywordIndex) => (
                            <span key={keywordIndex} className="keyword-tag">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recommendation Reasoning */}
                  {templateRec.reasoning && templateRec.reasoning.length > 0 && (
                    <div className="recommendation-reasoning">
                      <h5>Why this template?</h5>
                      <ul>
                        {templateRec.reasoning.map((reason, reasonIndex) => (
                          <li key={reasonIndex}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Customization Suggestions */}
                  {templateRec.customization && templateRec.customization.length > 0 && (
                    <div className="customization-suggestions">
                      <h5>Customization Suggestions</h5>
                      {templateRec.customization.map((suggestion, suggestionIndex) => (
                        <div key={suggestionIndex} className="customization-item">
                          {suggestion.field && (
                            <div className="field-suggestions">
                              <strong>{suggestion.field}:</strong>
                              <div className="suggestion-values">
                                {suggestion.suggestions.map((value, valueIndex) => (
                                  <span key={valueIndex} className="suggestion-value">
                                    {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {suggestion.type === 'compliance' && (
                            <div className="compliance-suggestion">
                              <strong>Compliance:</strong>
                              <span>{suggestion.suggestion}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="template-actions">
                    <button
                      className="action-btn primary"
                      onClick={() => handleTemplateSelect(templateRec)}
                    >
                      <BookOpen size={14} />
                      Use Template
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={() => handleCustomize(templateRec)}
                    >
                      <Edit3 size={14} />
                      Customize
                    </button>
                    <button
                      className="action-btn secondary"
                      onClick={() => navigator.clipboard?.writeText(template.template)}
                    >
                      <Copy size={14} />
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* No Results */}
      {filteredTemplates.length === 0 && (
        <div className="no-results">
          <Search size={24} className="no-results-icon" />
          <p>No templates match your search criteria</p>
          <small>Try adjusting your search or filters</small>
        </div>
      )}

      {/* Footer */}
      {filteredTemplates.length > 0 && (
        <div className="templates-footer">
          <small>
            Showing {filteredTemplates.length} of {templates.length} templates
          </small>
        </div>
      )}
    </div>
  );
};

export default TemplateRecommendations;