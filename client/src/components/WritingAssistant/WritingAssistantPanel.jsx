/**
 * Writing Assistant Panel - Main component for AI writing assistance
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Zap, Target, BookOpen, Settings, X, Minimize2, Maximize2 } from 'lucide-react';
import AutocompletePanel from './AutocompletePanel';
import QualityAnalysisPanel from './QualityAnalysisPanel';
import TemplateRecommendations from './TemplateRecommendations';
import NLPConverterPanel from './NLPConverterPanel';
import WritingInsights from './WritingInsights';
import './WritingAssistantPanel.css';

const WritingAssistantPanel = ({
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
  text,
  cursorPosition,
  onTextChange,
  onSuggestionAccept,
  context = {}
}) => {
  const [activeTab, setActiveTab] = useState('assistant');
  const [isProcessing, setIsProcessing] = useState(false);
  const [assistantData, setAssistantData] = useState({
    suggestions: [],
    qualityAnalysis: null,
    templates: [],
    insights: {}
  });
  const [settings, setSettings] = useState({
    enableRealTime: true,
    enableAutocomplete: true,
    enableQualityAnalysis: true,
    enableTemplates: true,
    analysisDepth: 'standard'
  });

  const panelRef = useRef(null);
  const processTimeoutRef = useRef(null);

  // Real-time analysis trigger
  useEffect(() => {
    if (!settings.enableRealTime || !text || isMinimized) return;

    // Debounce real-time analysis
    if (processTimeoutRef.current) {
      clearTimeout(processTimeoutRef.current);
    }

    processTimeoutRef.current = setTimeout(() => {
      performRealTimeAnalysis();
    }, 500);

    return () => {
      if (processTimeoutRef.current) {
        clearTimeout(processTimeoutRef.current);
      }
    };
  }, [text, cursorPosition, settings.enableRealTime]);

  // Perform real-time analysis
  const performRealTimeAnalysis = async () => {
    if (text.length < 10) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai-services/writing-assistant/real-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          cursorPosition,
          context,
          settings
        })
      });

      const data = await response.json();
      if (data.success) {
        setAssistantData(prev => ({
          ...prev,
          ...data.result
        }));
      }
    } catch (error) {
      console.error('Real-time analysis failed:', error);
    }
    setIsProcessing(false);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);

    // Load tab-specific data if needed
    switch (tab) {
      case 'quality':
        if (text && !assistantData.qualityAnalysis) {
          performQualityAnalysis();
        }
        break;
      case 'templates':
        if (!assistantData.templates.length) {
          loadTemplateRecommendations();
        }
        break;
      case 'nlp':
        // NLP converter doesn't need pre-loading
        break;
    }
  };

  // Perform quality analysis
  const performQualityAnalysis = async () => {
    if (!text) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai-services/quality-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          options: {
            category: context.documentType || 'functional',
            analysisDepth: settings.analysisDepth
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        setAssistantData(prev => ({
          ...prev,
          qualityAnalysis: data.analysis
        }));
      }
    } catch (error) {
      console.error('Quality analysis failed:', error);
    }
    setIsProcessing(false);
  };

  // Load template recommendations
  const loadTemplateRecommendations = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ai-services/template-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          partialText: text
        })
      });

      const data = await response.json();
      if (data.success) {
        setAssistantData(prev => ({
          ...prev,
          templates: data.recommendations
        }));
      }
    } catch (error) {
      console.error('Template recommendations failed:', error);
    }
    setIsProcessing(false);
  };

  // Handle suggestion acceptance
  const handleSuggestionAccept = (suggestion) => {
    if (onSuggestionAccept) {
      onSuggestionAccept(suggestion);
    }

    // Record acceptance for learning
    recordSuggestionFeedback(suggestion, 'accept');
  };

  // Handle suggestion rejection
  const handleSuggestionReject = (suggestion) => {
    recordSuggestionFeedback(suggestion, 'reject');
  };

  // Record suggestion feedback
  const recordSuggestionFeedback = async (suggestion, action) => {
    try {
      await fetch('/api/ai-services/writing-assistant/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion,
          action,
          context
        })
      });
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  };

  // Handle settings change
  const handleSettingsChange = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className={`writing-assistant-panel ${isMinimized ? 'minimized' : ''}`}
    >
      {/* Panel Header */}
      <div className="panel-header">
        <div className="panel-title">
          <MessageSquare size={16} />
          <span>AI Writing Assistant</span>
          {isProcessing && <div className="processing-indicator" />}
        </div>
        <div className="panel-controls">
          <button
            onClick={onMinimize}
            className="control-btn"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button onClick={onClose} className="control-btn" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab ${activeTab === 'assistant' ? 'active' : ''}`}
              onClick={() => handleTabChange('assistant')}
            >
              <Zap size={14} />
              Assistant
            </button>
            <button
              className={`tab ${activeTab === 'quality' ? 'active' : ''}`}
              onClick={() => handleTabChange('quality')}
            >
              <Target size={14} />
              Quality
            </button>
            <button
              className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
              onClick={() => handleTabChange('templates')}
            >
              <BookOpen size={14} />
              Templates
            </button>
            <button
              className={`tab ${activeTab === 'nlp' ? 'active' : ''}`}
              onClick={() => handleTabChange('nlp')}
            >
              <MessageSquare size={14} />
              Convert
            </button>
            <button
              className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <Settings size={14} />
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'assistant' && (
              <div className="assistant-tab">
                {/* Autocomplete Suggestions */}
                {settings.enableAutocomplete && (
                  <AutocompletePanel
                    suggestions={assistantData.suggestions}
                    onSuggestionAccept={handleSuggestionAccept}
                    onSuggestionReject={handleSuggestionReject}
                    isLoading={isProcessing}
                  />
                )}

                {/* Quick Insights */}
                <WritingInsights
                  text={text}
                  insights={assistantData.insights}
                  onInsightAction={(action) => {
                    // Handle insight actions
                    console.log('Insight action:', action);
                  }}
                />
              </div>
            )}

            {activeTab === 'quality' && (
              <QualityAnalysisPanel
                analysis={assistantData.qualityAnalysis}
                text={text}
                onReanalyze={performQualityAnalysis}
                onApplyFix={(fix) => {
                  // Handle auto-fix application
                  if (onTextChange && fix.fixedText) {
                    onTextChange(fix.fixedText);
                  }
                }}
                isLoading={isProcessing}
              />
            )}

            {activeTab === 'templates' && (
              <TemplateRecommendations
                templates={assistantData.templates}
                context={context}
                onTemplateSelect={(template) => {
                  // Handle template selection
                  if (onTextChange) {
                    onTextChange(template.template);
                  }
                }}
                onTemplateCustomize={(template, customization) => {
                  // Handle template customization
                  console.log('Template customization:', template, customization);
                }}
                isLoading={isProcessing}
              />
            )}

            {activeTab === 'nlp' && (
              <NLPConverterPanel
                onConvert={(input, options) => {
                  // Handle NLP conversion
                  console.log('NLP convert:', input, options);
                }}
                onResult={(result) => {
                  if (onTextChange && result.structuredRequirement) {
                    onTextChange(result.structuredRequirement.text);
                  }
                }}
              />
            )}

            {activeTab === 'settings' && (
              <div className="settings-tab">
                <h4>Writing Assistant Settings</h4>

                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.enableRealTime}
                      onChange={(e) => handleSettingsChange({ enableRealTime: e.target.checked })}
                    />
                    Enable real-time assistance
                  </label>
                  <p className="setting-description">
                    Provides suggestions and analysis as you type
                  </p>
                </div>

                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.enableAutocomplete}
                      onChange={(e) => handleSettingsChange({ enableAutocomplete: e.target.checked })}
                    />
                    Enable smart autocomplete
                  </label>
                  <p className="setting-description">
                    Shows contextual suggestions while typing
                  </p>
                </div>

                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.enableQualityAnalysis}
                      onChange={(e) => handleSettingsChange({ enableQualityAnalysis: e.target.checked })}
                    />
                    Enable quality analysis
                  </label>
                  <p className="setting-description">
                    Analyzes writing quality and provides improvement suggestions
                  </p>
                </div>

                <div className="setting-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={settings.enableTemplates}
                      onChange={(e) => handleSettingsChange({ enableTemplates: e.target.checked })}
                    />
                    Enable template recommendations
                  </label>
                  <p className="setting-description">
                    Suggests relevant templates based on context
                  </p>
                </div>

                <div className="setting-group">
                  <label>
                    Analysis Depth:
                    <select
                      value={settings.analysisDepth}
                      onChange={(e) => handleSettingsChange({ analysisDepth: e.target.value })}
                    >
                      <option value="basic">Basic</option>
                      <option value="standard">Standard</option>
                      <option value="comprehensive">Comprehensive</option>
                    </select>
                  </label>
                  <p className="setting-description">
                    Controls the depth of quality analysis and suggestions
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Minimized View */}
      {isMinimized && (
        <div className="minimized-content">
          <div className="quick-stats">
            {assistantData.qualityAnalysis && (
              <div className="stat">
                Quality: {assistantData.qualityAnalysis.overallScore}%
              </div>
            )}
            {assistantData.suggestions?.length > 0 && (
              <div className="stat">
                {assistantData.suggestions.length} suggestions
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingAssistantPanel;