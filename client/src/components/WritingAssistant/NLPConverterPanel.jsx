/**
 * NLP Converter Panel - Natural language to structured requirements conversion
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  ArrowRight,
  Zap,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Edit,
  Wand2
} from 'lucide-react';
import './NLPConverterPanel.css';

const NLPConverterPanel = ({
  onConvert,
  onResult
}) => {
  const [inputText, setInputText] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] = useState(null);
  const [conversionOptions, setConversionOptions] = useState({
    targetType: 'functional',
    includeValidation: true,
    generateAlternatives: true
  });

  // Handle conversion
  const handleConvert = async () => {
    if (!inputText.trim()) return;

    setIsConverting(true);
    try {
      const response = await fetch('/api/ai-services/nlp-converter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: inputText,
          options: conversionOptions
        })
      });

      const data = await response.json();
      if (data.success) {
        setConversionResult(data.result);
        if (onResult) {
          onResult(data.result);
        }
      } else {
        setConversionResult({
          success: false,
          error: data.error || 'Conversion failed'
        });
      }
    } catch (error) {
      setConversionResult({
        success: false,
        error: 'Network error during conversion'
      });
    }
    setIsConverting(false);

    if (onConvert) {
      onConvert(inputText, conversionOptions);
    }
  };

  // Handle use result
  const handleUseResult = (text) => {
    if (onResult) {
      onResult({ structuredRequirement: { text } });
    }
  };

  // Clear conversion
  const handleClear = () => {
    setInputText('');
    setConversionResult(null);
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  return (
    <div className="nlp-converter-panel">
      <div className="panel-header">
        <h4>Natural Language Converter</h4>
        <button
          className="clear-btn"
          onClick={handleClear}
          disabled={!inputText && !conversionResult}
        >
          <RefreshCw size={12} />
          Clear
        </button>
      </div>

      {/* Input Section */}
      <div className="input-section">
        <label>Natural Language Input</label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your requirement in natural language. For example: 'Users need to be able to save their work and come back to it later'"
          rows={4}
          disabled={isConverting}
        />

        {/* Options */}
        <div className="conversion-options">
          <div className="option-group">
            <label>Target Type:</label>
            <select
              value={conversionOptions.targetType}
              onChange={(e) => setConversionOptions(prev => ({
                ...prev,
                targetType: e.target.value
              }))}
              disabled={isConverting}
            >
              <option value="functional">Functional Requirement</option>
              <option value="non-functional">Non-Functional Requirement</option>
              <option value="user-story">User Story</option>
              <option value="acceptance-criteria">Acceptance Criteria</option>
              <option value="constraint">Constraint</option>
              <option value="auto">Auto-Detect</option>
            </select>
          </div>

          <div className="option-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={conversionOptions.includeValidation}
                onChange={(e) => setConversionOptions(prev => ({
                  ...prev,
                  includeValidation: e.target.checked
                }))}
                disabled={isConverting}
              />
              Include quality validation
            </label>

            <label>
              <input
                type="checkbox"
                checked={conversionOptions.generateAlternatives}
                onChange={(e) => setConversionOptions(prev => ({
                  ...prev,
                  generateAlternatives: e.target.checked
                }))}
                disabled={isConverting}
              />
              Generate alternatives
            </label>
          </div>
        </div>

        {/* Convert Button */}
        <button
          className="convert-btn"
          onClick={handleConvert}
          disabled={!inputText.trim() || isConverting}
        >
          {isConverting ? (
            <>
              <div className="spinner" />
              Converting...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Convert to Structured Requirement
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {conversionResult && (
        <div className="results-section">
          {conversionResult.success ? (
            <>
              {/* Main Result */}
              <div className="conversion-result">
                <div className="result-header">
                  <h5>Structured Requirement</h5>
                  <div className="result-meta">
                    <span className="requirement-type">
                      {conversionResult.classification?.primary || 'Unknown'}
                    </span>
                    {conversionResult.confidence && (
                      <span className={`confidence ${getConfidenceColor(conversionResult.confidence)}`}>
                        {Math.round(conversionResult.confidence * 100)}% confident
                      </span>
                    )}
                  </div>
                </div>

                <div className="structured-text">
                  {conversionResult.structured?.text || 'No structured text generated'}
                </div>

                <div className="result-actions">
                  <button
                    className="action-btn primary"
                    onClick={() => handleUseResult(conversionResult.structured?.text)}
                  >
                    <CheckCircle size={14} />
                    Use This
                  </button>
                  <button
                    className="action-btn secondary"
                    onClick={() => navigator.clipboard?.writeText(conversionResult.structured?.text)}
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                </div>
              </div>

              {/* Extracted Entities */}
              {conversionResult.entities && (
                <div className="entities-section">
                  <h5>Extracted Information</h5>
                  <div className="entities-grid">
                    {Object.entries(conversionResult.entities).map(([category, categoryData]) => (
                      <div key={category} className="entity-category">
                        <span className="category-name">
                          {category.charAt(0).toUpperCase() + category.slice(1)}:
                        </span>
                        <div className="entity-items">
                          {Object.entries(categoryData).map(([subcategory, items]) => (
                            Array.isArray(items) && items.length > 0 && (
                              <div key={subcategory} className="entity-subcategory">
                                <small>{subcategory}:</small>
                                {items.slice(0, 3).map((item, index) => (
                                  <span key={index} className="entity-tag">
                                    {item}
                                  </span>
                                ))}
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quality Analysis */}
              {conversionResult.validation && conversionOptions.includeValidation && (
                <div className="quality-section">
                  <h5>Quality Analysis</h5>

                  {conversionResult.validation.metrics && (
                    <div className="quality-metrics">
                      <div className="quality-score">
                        Overall Quality: {conversionResult.validation.metrics.qualityScore}%
                      </div>

                      {Object.entries(conversionResult.validation.quality || {}).map(([aspect, data]) => (
                        <div key={aspect} className="quality-aspect">
                          <span className="aspect-name">
                            {aspect.charAt(0).toUpperCase() + aspect.slice(1)}:
                          </span>
                          <span className="aspect-score">{data.score}%</span>
                          {data.issues?.length > 0 && (
                            <span className="issue-count">
                              ({data.issues.length} issues)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {conversionResult.improvements?.length > 0 && (
                    <div className="improvements">
                      <h6>Suggested Improvements</h6>
                      {conversionResult.improvements.slice(0, 3).map((improvement, index) => (
                        <div key={index} className="improvement-item">
                          <AlertCircle size={12} />
                          <span>{improvement.message || improvement.suggestion}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Alternative Versions */}
              {conversionResult.alternatives && conversionOptions.generateAlternatives && (
                <div className="alternatives-section">
                  <h5>Alternative Versions</h5>
                  {conversionResult.alternatives.map((alternative, index) => (
                    <div key={index} className="alternative-item">
                      <div className="alternative-header">
                        <span className="alternative-type">
                          {alternative.type || `Alternative ${index + 1}`}
                        </span>
                        {alternative.confidence && (
                          <span className={`confidence ${getConfidenceColor(alternative.confidence)}`}>
                            {Math.round(alternative.confidence * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="alternative-text">
                        {alternative.text}
                      </div>
                      <div className="alternative-actions">
                        <button
                          className="action-btn small"
                          onClick={() => handleUseResult(alternative.text)}
                        >
                          <CheckCircle size={12} />
                          Use
                        </button>
                        <button
                          className="action-btn small secondary"
                          onClick={() => navigator.clipboard?.writeText(alternative.text)}
                        >
                          <Copy size={12} />
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Processing Info */}
              {conversionResult.processingTime && (
                <div className="processing-info">
                  <small>
                    Processed in {conversionResult.processingTime}ms
                  </small>
                </div>
              )}
            </>
          ) : (
            /* Error State */
            <div className="error-result">
              <AlertCircle size={24} className="error-icon" />
              <h5>Conversion Failed</h5>
              <p>{conversionResult.error}</p>
              <button
                className="retry-btn"
                onClick={handleConvert}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      {!conversionResult && (
        <div className="help-section">
          <h5>Tips for Better Conversion</h5>
          <ul>
            <li>Be specific about who, what, when, and why</li>
            <li>Include action verbs (create, update, validate, etc.)</li>
            <li>Mention any conditions or constraints</li>
            <li>Describe the expected outcome or behavior</li>
          </ul>

          <div className="examples">
            <h6>Good Examples:</h6>
            <div className="example-item">
              <div className="example-input">
                "Users should be able to save their documents and retrieve them later"
              </div>
              <ArrowRight size={12} className="arrow" />
              <div className="example-output">
                "The user shall be able to save documents and retrieve them for future editing."
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NLPConverterPanel;