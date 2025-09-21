/**
 * Writing Insights - Quick writing insights and suggestions
 */

import React from 'react';
import {
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Eye,
  BookOpen,
  Zap
} from 'lucide-react';
import './WritingInsights.css';

const WritingInsights = ({
  text,
  insights = {},
  onInsightAction
}) => {
  // Calculate basic metrics from text
  const getBasicMetrics = (text) => {
    if (!text) return { words: 0, sentences: 0, characters: 0 };

    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const characters = text.length;

    return { words, sentences, characters };
  };

  const metrics = getBasicMetrics(text);

  // Get reading time estimate
  const getReadingTime = (wordCount) => {
    const wordsPerMinute = 200; // Average reading speed
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes;
  };

  // Get writing complexity
  const getComplexity = (text, metrics) => {
    if (!text || metrics.words === 0) return 'none';

    const avgWordsPerSentence = metrics.words / Math.max(metrics.sentences, 1);
    const avgCharsPerWord = metrics.characters / Math.max(metrics.words, 1);

    if (avgWordsPerSentence > 20 || avgCharsPerWord > 6) return 'high';
    if (avgWordsPerSentence > 15 || avgCharsPerWord > 5) return 'medium';
    return 'low';
  };

  // Get quality indicators
  const getQualityIndicators = (text) => {
    const indicators = [];

    if (!text) return indicators;

    // Check for imperative language
    if (/\b(shall|must|will)\b/i.test(text)) {
      indicators.push({
        type: 'positive',
        icon: CheckCircle,
        message: 'Uses imperative language',
        category: 'structure'
      });
    }

    // Check for vague terms
    if (/\b(user-friendly|easy|simple|fast|good)\b/i.test(text)) {
      indicators.push({
        type: 'warning',
        icon: AlertTriangle,
        message: 'Contains vague terms',
        category: 'clarity'
      });
    }

    // Check for specific measurements
    if (/\b\d+(\.\d+)?\s*(ms|seconds?|minutes?|hours?|MB|GB|%)\b/i.test(text)) {
      indicators.push({
        type: 'positive',
        icon: Target,
        message: 'Includes specific measurements',
        category: 'specificity'
      });
    }

    // Check for stakeholder identification
    if (/\b(user|admin|system|customer|operator)\b/i.test(text)) {
      indicators.push({
        type: 'positive',
        icon: CheckCircle,
        message: 'Identifies stakeholders',
        category: 'completeness'
      });
    }

    // Check for acceptance criteria patterns
    if (/\b(given|when|then)\b/i.test(text)) {
      indicators.push({
        type: 'positive',
        icon: CheckCircle,
        message: 'Uses acceptance criteria format',
        category: 'structure'
      });
    }

    return indicators;
  };

  const complexity = getComplexity(text, metrics);
  const readingTime = getReadingTime(metrics.words);
  const qualityIndicators = getQualityIndicators(text);

  // Handle insight action
  const handleAction = (action) => {
    if (onInsightAction) {
      onInsightAction(action);
    }
  };

  if (!text || text.length < 10) {
    return (
      <div className="writing-insights">
        <div className="insights-header">
          <h4>Writing Insights</h4>
        </div>
        <div className="no-content">
          <Eye size={24} className="no-content-icon" />
          <p>Start writing to see insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="writing-insights">
      <div className="insights-header">
        <h4>Writing Insights</h4>
        <span className="insights-count">
          {qualityIndicators.length + 3} insights
        </span>
      </div>

      {/* Quick Metrics */}
      <div className="quick-metrics">
        <div className="metric-item">
          <BookOpen size={12} />
          <span className="metric-value">{metrics.words}</span>
          <span className="metric-label">words</span>
        </div>

        <div className="metric-item">
          <Target size={12} />
          <span className="metric-value">{metrics.sentences}</span>
          <span className="metric-label">sentences</span>
        </div>

        <div className="metric-item">
          <Clock size={12} />
          <span className="metric-value">{readingTime}</span>
          <span className="metric-label">min read</span>
        </div>

        <div className="metric-item">
          <TrendingUp size={12} />
          <span className={`metric-value complexity-${complexity}`}>
            {complexity}
          </span>
          <span className="metric-label">complexity</span>
        </div>
      </div>

      {/* Quality Indicators */}
      {qualityIndicators.length > 0 && (
        <div className="quality-indicators">
          <h5>Quality Indicators</h5>
          <div className="indicators-list">
            {qualityIndicators.map((indicator, index) => {
              const IconComponent = indicator.icon;
              return (
                <div
                  key={index}
                  className={`indicator-item ${indicator.type}`}
                >
                  <IconComponent size={14} className="indicator-icon" />
                  <span className="indicator-message">
                    {indicator.message}
                  </span>
                  <span className="indicator-category">
                    {indicator.category}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h5>Quick Actions</h5>
        <div className="actions-grid">
          <button
            className="action-item"
            onClick={() => handleAction({ type: 'analyze-quality' })}
          >
            <Target size={14} />
            <span>Analyze Quality</span>
          </button>

          <button
            className="action-item"
            onClick={() => handleAction({ type: 'suggest-improvements' })}
          >
            <Zap size={14} />
            <span>Get Suggestions</span>
          </button>

          <button
            className="action-item"
            onClick={() => handleAction({ type: 'find-templates' })}
          >
            <BookOpen size={14} />
            <span>Find Templates</span>
          </button>

          <button
            className="action-item"
            onClick={() => handleAction({ type: 'check-grammar' })}
          >
            <Eye size={14} />
            <span>Check Grammar</span>
          </button>
        </div>
      </div>

      {/* Advanced Insights */}
      {insights.advanced && (
        <div className="advanced-insights">
          <h5>Advanced Insights</h5>

          {insights.advanced.readabilityScore && (
            <div className="insight-item">
              <div className="insight-header">
                <Eye size={12} />
                <span>Readability Score</span>
              </div>
              <div className="insight-value">
                {insights.advanced.readabilityScore}%
                <span className="insight-description">
                  {insights.advanced.readabilityLevel || 'Standard'}
                </span>
              </div>
            </div>
          )}

          {insights.advanced.sentimentScore && (
            <div className="insight-item">
              <div className="insight-header">
                <TrendingUp size={12} />
                <span>Tone Analysis</span>
              </div>
              <div className="insight-value">
                {insights.advanced.dominantTone || 'Neutral'}
                <span className="insight-description">
                  {Math.round(insights.advanced.sentimentScore * 100)}% confident
                </span>
              </div>
            </div>
          )}

          {insights.advanced.uniqueWords && (
            <div className="insight-item">
              <div className="insight-header">
                <BookOpen size={12} />
                <span>Vocabulary Diversity</span>
              </div>
              <div className="insight-value">
                {insights.advanced.uniqueWords} unique
                <span className="insight-description">
                  {Math.round((insights.advanced.uniqueWords / metrics.words) * 100)}% diversity
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="writing-tips">
        <h5>Writing Tips</h5>
        <div className="tips-list">
          {complexity === 'high' && (
            <div className="tip-item">
              <AlertTriangle size={12} className="tip-icon warning" />
              <span>Consider breaking long sentences into shorter ones</span>
            </div>
          )}

          {metrics.words < 10 && (
            <div className="tip-item">
              <Zap size={12} className="tip-icon info" />
              <span>Add more detail to make the requirement complete</span>
            </div>
          )}

          {!/\b(shall|must|will)\b/i.test(text) && (
            <div className="tip-item">
              <Target size={12} className="tip-icon warning" />
              <span>Use imperative language like "shall" or "must"</span>
            </div>
          )}

          {qualityIndicators.filter(i => i.type === 'positive').length > 2 && (
            <div className="tip-item">
              <CheckCircle size={12} className="tip-icon success" />
              <span>Great job! Your requirement follows best practices</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingInsights;