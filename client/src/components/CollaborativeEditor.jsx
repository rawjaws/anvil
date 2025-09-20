/*
 * Copyright 2025 Darcy Davidson
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRealtime } from '../hooks/useRealtime.js';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/apiService';
import { Save, ArrowLeft, Eye, Code, Users, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import UserPresence from './UserPresence.jsx';
import './DocumentEditor.css';

export default function CollaborativeEditor() {
  const { type, '*': path, capabilityId } = useParams();
  const navigate = useNavigate();
  const { refreshData, config, setSelectedDocument } = useApp();

  // Generate a session userId (in real app, this would come from auth)
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);
  const [documentId] = useState(() => path || `new_${type}_${Date.now()}`);

  // Document state
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(!path);
  const [editMode, setEditMode] = useState('markdown');

  // Editor state
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const textareaRef = useRef(null);
  const lastContentRef = useRef('');
  const isApplyingRemoteChange = useRef(false);

  // Real-time collaboration
  const {
    isConnected,
    connectionError,
    users,
    cursors,
    documentDeltas,
    sendTextDelta,
    sendCursorUpdate,
    sendPresenceUpdate,
    connect,
    disconnect
  } = useRealtime(documentId, userId);

  // Load document on mount
  useEffect(() => {
    if (path) {
      loadDocument();
    } else {
      initializeNewDocument();
    }
  }, [path, type]);

  // Handle real-time document updates
  useEffect(() => {
    if (documentDeltas.length > 0) {
      const latestDelta = documentDeltas[documentDeltas.length - 1];
      if (latestDelta.userId !== userId && !isApplyingRemoteChange.current) {
        applyRemoteDelta(latestDelta);
      }
    }
  }, [documentDeltas, userId]);

  // Send presence updates
  useEffect(() => {
    if (isConnected) {
      sendPresenceUpdate('editing');
    }

    return () => {
      if (isConnected) {
        sendPresenceUpdate('offline');
      }
    };
  }, [isConnected, sendPresenceUpdate]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      const data = await apiService.getFile(path);
      setDocument(data);
      setContent(data.content);
      lastContentRef.current = data.content;
    } catch (err) {
      toast.error(`Failed to load document: ${err.message}`);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const initializeNewDocument = async () => {
    try {
      setLoading(true);

      // Load template if available
      try {
        let template;
        if (type === 'enabler') {
          const response = await fetch(`/api/enabler-template/${capabilityId || ''}`);
          template = await response.json();
        } else {
          const templatePath = `templates/${type}-template.md`;
          template = await apiService.getFile(templatePath);
        }

        setContent(template.content);
        lastContentRef.current = template.content;
      } catch (templateErr) {
        const defaultContent = getDefaultContent(type);
        setContent(defaultContent);
        lastContentRef.current = defaultContent;
      }
    } catch (err) {
      toast.error(`Failed to initialize document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = (type) => {
    const timestamp = new Date().toISOString().split('T')[0];
    if (type === 'capability') {
      return `# New Capability\n\n**Owner:** ${config?.owner || 'Product Team'}\n**Status:** In Draft\n**Priority:** High\n**Created:** ${timestamp}\n\n## Description\n\n*Describe the capability here*\n\n## Acceptance Criteria\n\n- [ ] Criterion 1\n- [ ] Criterion 2\n`;
    } else if (type === 'enabler') {
      return `# New Enabler\n\n**Owner:** ${config?.owner || 'Product Team'}\n**Status:** In Draft\n**Priority:** High\n**Created:** ${timestamp}\n\n## Description\n\n*Describe the enabler here*\n\n## Requirements\n\n- [ ] Requirement 1\n- [ ] Requirement 2\n`;
    }
    return `# New Document\n\n*Content goes here*\n`;
  };

  const applyRemoteDelta = (delta) => {
    isApplyingRemoteChange.current = true;

    try {
      const { operation, position, text, length } = delta.delta;
      let newContent = content;

      switch (operation) {
        case 'insert':
          newContent = content.slice(0, position) + text + content.slice(position);
          break;
        case 'delete':
          newContent = content.slice(0, position) + content.slice(position + length);
          break;
        case 'replace':
          newContent = content.slice(0, position) + text + content.slice(position + length);
          break;
        default:
          console.warn('Unknown delta operation:', operation);
          return;
      }

      setContent(newContent);
      lastContentRef.current = newContent;

      // Update textarea if it's the active element
      if (textareaRef.current) {
        textareaRef.current.value = newContent;
      }

      toast.success(`Update from ${delta.userId}`, { duration: 2000 });
    } catch (error) {
      console.error('Failed to apply remote delta:', error);
      toast.error('Failed to apply remote changes');
    } finally {
      isApplyingRemoteChange.current = false;
    }
  };

  const handleContentChange = useCallback((e) => {
    if (isApplyingRemoteChange.current) return;

    const newContent = e.target.value;
    const oldContent = lastContentRef.current;

    // Calculate delta
    const delta = calculateTextDelta(oldContent, newContent, cursorPosition);

    if (delta && isConnected) {
      sendTextDelta(delta, { start: selection.start, end: selection.end });
    }

    setContent(newContent);
    lastContentRef.current = newContent;
  }, [cursorPosition, selection, isConnected, sendTextDelta]);

  const calculateTextDelta = (oldText, newText, position) => {
    if (oldText === newText) return null;

    // Simple diff algorithm - find the first difference
    let start = 0;
    while (start < oldText.length && start < newText.length && oldText[start] === newText[start]) {
      start++;
    }

    let oldEnd = oldText.length;
    let newEnd = newText.length;
    while (oldEnd > start && newEnd > start && oldText[oldEnd - 1] === newText[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }

    const deletedLength = oldEnd - start;
    const insertedText = newText.slice(start, newEnd);

    if (deletedLength > 0 && insertedText.length > 0) {
      return { operation: 'replace', position: start, text: insertedText, length: deletedLength };
    } else if (deletedLength > 0) {
      return { operation: 'delete', position: start, length: deletedLength };
    } else if (insertedText.length > 0) {
      return { operation: 'insert', position: start, text: insertedText };
    }

    return null;
  };

  const handleCursorChange = useCallback((e) => {
    const { selectionStart, selectionEnd } = e.target;
    setCursorPosition(selectionStart);
    setSelection({ start: selectionStart, end: selectionEnd });

    if (isConnected) {
      sendCursorUpdate({ position: selectionStart, selection: { start: selectionStart, end: selectionEnd } });
    }
  }, [isConnected, sendCursorUpdate]);

  const handleSave = async () => {
    try {
      setSaving(true);

      let savePath = path;
      if (isNew) {
        const timestamp = Date.now();
        const filename = `${type}-${timestamp}.md`;
        savePath = filename;
      }

      await apiService.saveFile(savePath, content);

      if (isConnected) {
        sendPresenceUpdate('saved');
        setTimeout(() => sendPresenceUpdate('editing'), 2000);
      }

      refreshData();

      if (isNew) {
        setSelectedDocument({
          type: type,
          path: savePath,
          id: savePath
        });
        navigate(`/view/${type}/${savePath}`);
      } else {
        toast.success('Document saved successfully');
      }

    } catch (err) {
      toast.error(`Failed to save document: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (isNew) {
      navigate('/');
    } else {
      navigate(`/view/${type}/${path}`);
    }
  };

  const renderConnectionStatus = () => {
    return (
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? (
          <>
            <Wifi size={14} />
            <span>Connected</span>
          </>
        ) : (
          <>
            <WifiOff size={14} />
            <span>Disconnected</span>
          </>
        )}
        {connectionError && (
          <span className="error-text">{connectionError}</span>
        )}
      </div>
    );
  };

  const renderCursors = () => {
    if (!textareaRef.current) return null;

    return cursors.map(cursor => (
      <div
        key={cursor.userId}
        className="remote-cursor"
        style={{
          position: 'absolute',
          left: calculateCursorPixelPosition(cursor.position.position),
          backgroundColor: getUserColor(cursor.userId),
          width: '2px',
          height: '20px',
          pointerEvents: 'none'
        }}
      />
    ));
  };

  const calculateCursorPixelPosition = (position) => {
    // This is a simplified calculation - in a real implementation,
    // you'd need to measure the actual text layout
    return position * 8; // Rough approximation
  };

  const getUserColor = (userId) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="spinner"></div>
        <p>Loading collaborative editor...</p>
      </div>
    );
  }

  return (
    <div className="document-editor collaborative-editor">
      <div className="editor-header">
        <div className="editor-title">
          <h3>{isNew ? `Create ${type}` : `Edit ${type}`}</h3>
          {renderConnectionStatus()}
        </div>

        <div className="editor-actions">
          <UserPresence users={users} currentUserId={userId} />

          <button onClick={handleBack} className="btn btn-secondary btn-sm">
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-success btn-sm"
          >
            {saving ? (
              <>
                <div className="spinner"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="collaborative-content">
          <div className="editor-container">
            <textarea
              ref={textareaRef}
              className="collaborative-textarea"
              value={content}
              onChange={handleContentChange}
              onSelect={handleCursorChange}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              placeholder="Start typing to collaborate in real-time..."
              style={{ position: 'relative' }}
            />
            {renderCursors()}
          </div>

          {documentDeltas.length > 0 && (
            <div className="collaboration-info">
              <p className="text-sm text-gray-600">
                {documentDeltas.length} real-time update{documentDeltas.length !== 1 ? 's' : ''} received
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}