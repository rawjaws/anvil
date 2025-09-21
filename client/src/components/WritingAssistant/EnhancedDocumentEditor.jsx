/**
 * Enhanced Document Editor with AI Writing Assistant Integration
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Zap, Settings, HelpCircle } from 'lucide-react';
import WritingAssistantPanel from './WritingAssistantPanel';
import './EnhancedDocumentEditor.css';

const EnhancedDocumentEditor = ({
  initialText = '',
  onTextChange,
  context = {},
  placeholder = 'Start writing your requirement...',
  className = '',
  disabled = false
}) => {
  const [text, setText] = useState(initialText);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isAssistantMinimized, setIsAssistantMinimized] = useState(false);
  const [showInlinesuggestions, setShowInlineSuggestions] = useState(false);
  const [inlineSuggestions, setInlineSuggestions] = useState([]);
  const [settings, setSettings] = useState({
    enableRealTime: true,
    enableInlineSuggestions: true,
    enableQuickActions: true,
    suggestionDelay: 500
  });

  const textareaRef = useRef(null);
  const suggestionTimeoutRef = useRef(null);
  const lastProcessedText = useRef('');

  // Initialize with props
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // Handle text changes
  const handleTextChange = useCallback((newText) => {
    setText(newText);

    // Update cursor position
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }

    // Notify parent component
    if (onTextChange) {
      onTextChange(newText);
    }

    // Trigger real-time suggestions if enabled
    if (settings.enableRealTime && settings.enableInlineSuggestions) {
      clearTimeout(suggestionTimeoutRef.current);
      suggestionTimeoutRef.current = setTimeout(() => {
        if (newText !== lastProcessedText.current && newText.length > 10) {
          fetchInlineSuggestions(newText);
          lastProcessedText.current = newText;
        }
      }, settings.suggestionDelay);
    }
  }, [onTextChange, settings]);

  // Fetch inline suggestions
  const fetchInlineSuggestions = async (text) => {
    try {
      const response = await fetch('/api/writing-assistant/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          cursorPosition,
          context
        })
      });

      const data = await response.json();
      if (data.success && data.suggestions?.length > 0) {
        setInlineSuggestions(data.suggestions.slice(0, 3)); // Show top 3
        setShowInlineSuggestions(true);
      } else {
        setShowInlineSuggestions(false);
      }
    } catch (error) {
      console.error('Failed to fetch inline suggestions:', error);
      setShowInlineSuggestions(false);
    }
  };

  // Handle cursor position changes
  const handleCursorChange = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Handle suggestion acceptance
  const handleSuggestionAccept = (suggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Replace selected text or insert at cursor
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + suggestion.text + after;

    handleTextChange(newText);

    // Set cursor position after inserted text
    setTimeout(() => {
      const newPosition = start + suggestion.text.length;
      textarea.setSelectionRange(newPosition, newPosition);
      setCursorPosition(newPosition);
      textarea.focus();
    }, 0);

    // Hide inline suggestions after acceptance
    setShowInlineSuggestions(false);
  };

  // Handle inline suggestion acceptance
  const handleInlineSuggestionAccept = (suggestion) => {
    handleSuggestionAccept(suggestion);

    // Record feedback
    recordFeedback(suggestion, 'accept');
  };

  // Handle inline suggestion dismissal
  const handleInlineSuggestionDismiss = (suggestion = null) => {
    setShowInlineSuggestions(false);

    if (suggestion) {
      recordFeedback(suggestion, 'reject');
    }
  };

  // Record user feedback
  const recordFeedback = async (suggestion, action) => {
    try {
      await fetch('/api/writing-assistant/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestion,
          action,
          context: {
            ...context,
            textLength: text.length,
            cursorPosition
          }
        })
      });
    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  };

  // Toggle assistant panel
  const toggleAssistant = () => {
    if (isAssistantOpen) {
      setIsAssistantOpen(false);
      setIsAssistantMinimized(false);
    } else {
      setIsAssistantOpen(true);
      setIsAssistantMinimized(false);
    }
  };

  // Quick actions
  const quickActions = [
    {
      id: 'analyze',
      label: 'Analyze Quality',
      icon: Zap,
      action: () => {
        setIsAssistantOpen(true);
        setIsAssistantMinimized(false);
        // Switch to quality tab - this would be handled by the panel
      }
    },
    {
      id: 'templates',
      label: 'Find Templates',
      icon: MessageSquare,
      action: () => {
        setIsAssistantOpen(true);
        setIsAssistantMinimized(false);
        // Switch to templates tab
      }
    }
  ];

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Space: Toggle assistant
    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault();
      toggleAssistant();
    }

    // Escape: Hide suggestions
    if (e.key === 'Escape') {
      setShowInlineSuggestions(false);
    }

    // Tab: Accept first suggestion
    if (e.key === 'Tab' && showInlinesuggestions && inlineSuggestions.length > 0) {
      e.preventDefault();
      handleInlineSuggestionAccept(inlineSuggestions[0]);
    }
  };

  return (
    <div className={`enhanced-document-editor ${className}`}>
      {/* Editor Container */}
      <div className="editor-container">
        {/* Toolbar */}
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <span className="word-count">
              {text.split(/\s+/).filter(word => word.length > 0).length} words
            </span>
            <span className="char-count">
              {text.length} characters
            </span>
          </div>

          <div className="toolbar-right">
            {/* Quick Actions */}
            {settings.enableQuickActions && (
              <div className="quick-actions">
                {quickActions.map(action => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={action.id}
                      className="quick-action-btn"
                      onClick={action.action}
                      title={action.label}
                    >
                      <IconComponent size={14} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Assistant Toggle */}
            <button
              className={`assistant-toggle ${isAssistantOpen ? 'active' : ''}`}
              onClick={toggleAssistant}
              title="Toggle AI Writing Assistant (Ctrl+Space)"
            >
              <MessageSquare size={16} />
              <span className="toggle-label">Assistant</span>
            </button>

            {/* Settings */}
            <button
              className="settings-btn"
              onClick={() => {
                // Open settings modal or dropdown
                console.log('Open settings');
              }}
              title="Settings"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Text Editor */}
        <div className="editor-wrapper">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onSelect={handleCursorChange}
            onKeyUp={handleCursorChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="main-editor"
            spellCheck={false}
          />

          {/* Inline Suggestions */}
          {showInlinesuggestions && inlineSuggestions.length > 0 && (
            <div className="inline-suggestions">
              <div className="suggestions-header">
                <span>Suggestions</span>
                <button
                  className="dismiss-btn"
                  onClick={() => handleInlineSuggestionDismiss()}
                  title="Dismiss suggestions (Esc)"
                >
                  ×
                </button>
              </div>
              <div className="suggestions-list">
                {inlineSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="suggestion-item"
                    onClick={() => handleInlineSuggestionAccept(suggestion)}
                  >
                    <div className="suggestion-text">
                      {suggestion.text}
                    </div>
                    <div className="suggestion-meta">
                      <span className="suggestion-type">{suggestion.type}</span>
                      {suggestion.confidence && (
                        <span className="suggestion-confidence">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="suggestions-footer">
                <small>Press Tab to accept first suggestion</small>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="editor-status">
          <div className="status-left">
            {settings.enableRealTime && (
              <span className="status-indicator realtime">
                <div className="status-dot" />
                Real-time assistance enabled
              </span>
            )}
          </div>

          <div className="status-right">
            <span className="cursor-position">
              Line {text.substring(0, cursorPosition).split('\n').length},
              Column {cursorPosition - text.lastIndexOf('\n', cursorPosition - 1)}
            </span>
          </div>
        </div>
      </div>

      {/* AI Writing Assistant Panel */}
      <WritingAssistantPanel
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onMinimize={() => setIsAssistantMinimized(!isAssistantMinimized)}
        isMinimized={isAssistantMinimized}
        text={text}
        cursorPosition={cursorPosition}
        onTextChange={handleTextChange}
        onSuggestionAccept={handleSuggestionAccept}
        context={context}
      />

      {/* Help Overlay */}
      {!isAssistantOpen && text.length === 0 && (
        <div className="help-overlay">
          <div className="help-content">
            <HelpCircle size={24} className="help-icon" />
            <h3>Start Writing with AI Assistance</h3>
            <p>
              Begin typing your requirement and get intelligent suggestions,
              quality analysis, and template recommendations.
            </p>
            <div className="help-shortcuts">
              <div className="shortcut">
                <kbd>Ctrl</kbd> + <kbd>Space</kbd> - Toggle AI Assistant
              </div>
              <div className="shortcut">
                <kbd>Tab</kbd> - Accept suggestion
              </div>
              <div className="shortcut">
                <kbd>Esc</kbd> - Dismiss suggestions
              </div>
            </div>
            <button
              className="help-cta"
              onClick={toggleAssistant}
            >
              Open AI Assistant
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedDocumentEditor;