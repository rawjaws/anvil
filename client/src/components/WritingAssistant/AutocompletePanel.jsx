/**
 * Autocomplete Panel - Smart autocomplete suggestions component
 */

import React, { useState } from 'react';
import { ChevronRight, Check, X, Lightbulb, Star } from 'lucide-react';
import './AutocompletePanel.css';

const AutocompletePanel = ({
  suggestions = [],
  onSuggestionAccept,
  onSuggestionReject,
  isLoading = false
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState(null);

  // Handle suggestion acceptance
  const handleAccept = (suggestion) => {
    if (onSuggestionAccept) {
      onSuggestionAccept(suggestion);
    }
    setExpandedSuggestion(null);
  };

  // Handle suggestion rejection
  const handleReject = (suggestion) => {
    if (onSuggestionReject) {
      onSuggestionReject(suggestion);
    }
  };

  // Get suggestion icon based on type
  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'pattern':
        return <Star size={12} className="icon-pattern" />;
      case 'prediction':
        return <Lightbulb size={12} className="icon-prediction" />;
      case 'learned':
        return <Star size={12} className="icon-learned" />;
      case 'completion':
        return <ChevronRight size={12} className="icon-completion" />;
      default:
        return <ChevronRight size={12} className="icon-default" />;
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  if (isLoading) {
    return (
      <div className="autocomplete-panel">
        <div className="panel-header">
          <h4>Smart Suggestions</h4>
        </div>
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Generating suggestions...</span>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="autocomplete-panel">
        <div className="panel-header">
          <h4>Smart Suggestions</h4>
        </div>
        <div className="empty-state">
          <Lightbulb size={24} className="empty-icon" />
          <p>Start typing to see smart suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="autocomplete-panel">
      <div className="panel-header">
        <h4>Smart Suggestions</h4>
        <span className="suggestion-count">{suggestions.length}</span>
      </div>

      <div className="suggestions-list">
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className={`suggestion-item ${expandedSuggestion === index ? 'expanded' : ''}`}
          >
            <div
              className="suggestion-main"
              onClick={() => setExpandedSuggestion(
                expandedSuggestion === index ? null : index
              )}
            >
              <div className="suggestion-content">
                <div className="suggestion-text">
                  {getSuggestionIcon(suggestion.type)}
                  <span className="text">{suggestion.text}</span>
                </div>

                <div className="suggestion-meta">
                  <span className={`confidence ${getConfidenceColor(suggestion.confidence || 0.5)}`}>
                    {Math.round((suggestion.confidence || 0.5) * 100)}%
                  </span>
                  {suggestion.type && (
                    <span className="type">{suggestion.type}</span>
                  )}
                </div>
              </div>
            </div>

            {expandedSuggestion === index && (
              <div className="suggestion-details">
                {suggestion.description && (
                  <p className="description">{suggestion.description}</p>
                )}

                {suggestion.source && (
                  <div className="metadata">
                    <span className="source">Source: {suggestion.source}</span>
                    {suggestion.category && (
                      <span className="category">Category: {suggestion.category}</span>
                    )}
                  </div>
                )}

                {suggestion.usageCount > 0 && (
                  <div className="usage-info">
                    Used {suggestion.usageCount} times
                    {suggestion.userRating > 0 && (
                      <span className="rating">
                        ⭐ {suggestion.userRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}

                <div className="suggestion-actions">
                  <button
                    className="action-btn accept"
                    onClick={() => handleAccept(suggestion)}
                  >
                    <Check size={14} />
                    Accept
                  </button>
                  <button
                    className="action-btn reject"
                    onClick={() => handleReject(suggestion)}
                  >
                    <X size={14} />
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {suggestions.length > 5 && (
        <div className="suggestions-footer">
          <small>Showing top {Math.min(5, suggestions.length)} suggestions</small>
        </div>
      )}
    </div>
  );
};

export default AutocompletePanel;