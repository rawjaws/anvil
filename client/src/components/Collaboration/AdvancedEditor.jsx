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
import { useParams } from 'react-router-dom';
import {
  MessageSquare,
  Highlight,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MoreVertical,
  Bookmark,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import SmartComments from './SmartComments.jsx';
import WorkflowDashboard from './WorkflowDashboard.jsx';
import UserPresence from '../UserPresence.jsx';
import './AdvancedEditor.css';

export default function AdvancedEditor({
  document,
  content,
  onContentChange,
  onSave,
  isConnected,
  collaborators,
  currentUserId
}) {
  const { documentId } = useParams();

  // Editor state
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [annotations, setAnnotations] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeWorkflows, setActiveWorkflows] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  // UI state
  const [showComments, setShowComments] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [selectedAnnotationType, setSelectedAnnotationType] = useState('highlight');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [commentPosition, setCommentPosition] = useState(null);

  const editorRef = useRef(null);
  const overlayRef = useRef(null);

  // Load collaboration data
  useEffect(() => {
    if (documentId) {
      loadCollaborationData();
    }
  }, [documentId]);

  const loadCollaborationData = async () => {
    try {
      // Load comments
      const commentsResponse = await fetch(`/api/documents/${documentId}/comments`);
      const commentsData = await commentsResponse.json();
      setComments(commentsData);

      // Load annotations
      const annotationsResponse = await fetch(`/api/documents/${documentId}/annotations`);
      const annotationsData = await annotationsResponse.json();
      setAnnotations(annotationsData);

      // Load workflows
      const workflowsResponse = await fetch(`/api/documents/${documentId}/workflows`);
      const workflowsData = await workflowsResponse.json();
      setActiveWorkflows(workflowsData.filter(w => w.status === 'active'));

      // Load conflicts
      const conflictsResponse = await fetch(`/api/documents/${documentId}/conflicts`);
      const conflictsData = await conflictsResponse.json();
      setConflicts(conflictsData.filter(c => c.status !== 'resolved'));

    } catch (error) {
      console.error('Failed to load collaboration data:', error);
      toast.error('Failed to load collaboration features');
    }
  };

  // Handle text selection
  const handleSelectionChange = useCallback(() => {
    if (editorRef.current) {
      const { selectionStart, selectionEnd } = editorRef.current;
      setSelection({ start: selectionStart, end: selectionEnd });
    }
  }, []);

  // Add annotation
  const addAnnotation = useCallback(async (type, position, selection, content = '', style = {}) => {
    try {
      const annotationData = {
        type,
        position,
        selection,
        content,
        style,
        layer: 'user',
        visibility: 'all'
      };

      const response = await fetch(`/api/documents/${documentId}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(annotationData)
      });

      const newAnnotation = await response.json();
      setAnnotations(prev => [...prev, newAnnotation]);

      toast.success(`${type} annotation added`);
    } catch (error) {
      console.error('Failed to add annotation:', error);
      toast.error('Failed to add annotation');
    }
  }, [documentId]);

  // Handle annotation creation from selection
  const handleAddAnnotation = useCallback((type) => {
    if (selection.start === selection.end) {
      toast.error('Please select text to annotate');
      return;
    }

    const selectedText = content.slice(selection.start, selection.end);
    const style = getAnnotationStyle(type);

    addAnnotation(type, selection.start, selection, selectedText, style);
  }, [selection, content, addAnnotation]);

  // Get annotation style based on type
  const getAnnotationStyle = (type) => {
    const styles = {
      highlight: { backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' },
      note: { backgroundColor: '#e3f2fd', border: '1px solid #90caf9' },
      bookmark: { backgroundColor: '#f3e5f5', border: '1px solid #ce93d8' },
      'change-suggestion': { backgroundColor: '#e8f5e8', border: '1px solid #a5d6a7' }
    };
    return styles[type] || styles.highlight;
  };

  // Handle comment addition
  const handleAddComment = useCallback(async (commentData) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData)
      });

      const newComment = await response.json();
      setComments(prev => [...prev, newComment]);
      setIsAddingComment(false);
      setCommentPosition(null);

      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    }
  }, [documentId]);

  // Handle right-click context menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();

    if (selection.start !== selection.end) {
      setCommentPosition({
        x: e.clientX,
        y: e.clientY,
        selection: { ...selection },
        text: content.slice(selection.start, selection.end)
      });
      setIsAddingComment(true);
    }
  }, [selection, content]);

  // Render annotations overlay
  const renderAnnotations = () => {
    if (!showAnnotations || !editorRef.current) return null;

    return annotations.map(annotation => {
      const { position, selection, style, type, content: annotationContent } = annotation;

      return (
        <div
          key={annotation.id}
          className={`annotation annotation-${type}`}
          style={{
            position: 'absolute',
            left: calculatePosition(position).left,
            top: calculatePosition(position).top,
            width: calculateWidth(selection),
            height: '20px',
            ...style,
            pointerEvents: 'none',
            zIndex: 1
          }}
          title={annotationContent}
        />
      );
    });
  };

  // Calculate position for annotations (simplified)
  const calculatePosition = (position) => {
    // This is a simplified calculation - in production, you'd need
    // to measure actual text layout
    const lineHeight = 24;
    const charWidth = 8;

    const lines = content.slice(0, position).split('\n');
    const lineNumber = lines.length - 1;
    const columnNumber = lines[lines.length - 1].length;

    return {
      left: columnNumber * charWidth,
      top: lineNumber * lineHeight
    };
  };

  // Calculate width for selections
  const calculateWidth = (selection) => {
    if (!selection) return 0;
    const charWidth = 8;
    return (selection.end - selection.start) * charWidth;
  };

  // Render conflict indicators
  const renderConflicts = () => {
    if (conflicts.length === 0) return null;

    return (
      <div className="conflict-indicator">
        <AlertTriangle className="text-orange-500" size={16} />
        <span className="text-sm text-orange-600">
          {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected
        </span>
        <button
          className="btn btn-sm btn-outline-orange"
          onClick={() => setShowWorkflows(true)}
        >
          Resolve
        </button>
      </div>
    );
  };

  // Render collaboration status
  const renderCollaborationStatus = () => {
    const activeCollaborators = collaborators.filter(c => c.status === 'active').length;
    const pendingApprovals = activeWorkflows.reduce((count, w) =>
      count + w.steps.filter(s => s.status === 'active').length, 0
    );

    return (
      <div className="collaboration-status">
        <div className="status-item">
          <Users size={16} />
          <span>{activeCollaborators} active</span>
        </div>

        {pendingApprovals > 0 && (
          <div className="status-item">
            <Clock size={16} />
            <span>{pendingApprovals} pending</span>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="status-item text-orange-600">
            <AlertTriangle size={16} />
            <span>{conflicts.length} conflicts</span>
          </div>
        )}

        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className={`status-dot ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="advanced-editor">
      {/* Header */}
      <div className="editor-header">
        <div className="editor-title">
          <h3>{document?.name || 'Untitled Document'}</h3>
          {renderCollaborationStatus()}
        </div>

        <div className="editor-controls">
          <UserPresence users={collaborators} currentUserId={currentUserId} />

          <div className="annotation-controls">
            <button
              className={`btn btn-sm ${selectedAnnotationType === 'highlight' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedAnnotationType('highlight')}
              title="Highlight"
            >
              <Highlight size={16} />
            </button>

            <button
              className={`btn btn-sm ${selectedAnnotationType === 'note' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedAnnotationType('note')}
              title="Add Note"
            >
              <MessageSquare size={16} />
            </button>

            <button
              className={`btn btn-sm ${selectedAnnotationType === 'bookmark' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedAnnotationType('bookmark')}
              title="Bookmark"
            >
              <Bookmark size={16} />
            </button>
          </div>

          <div className="view-controls">
            <button
              className={`btn btn-sm ${showComments ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowComments(!showComments)}
              title="Toggle Comments"
            >
              <MessageSquare size={16} />
              {comments.length > 0 && <span className="badge">{comments.length}</span>}
            </button>

            <button
              className={`btn btn-sm ${showAnnotations ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowAnnotations(!showAnnotations)}
              title="Toggle Annotations"
            >
              <Tag size={16} />
              {annotations.length > 0 && <span className="badge">{annotations.length}</span>}
            </button>

            <button
              className={`btn btn-sm ${showWorkflows ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setShowWorkflows(!showWorkflows)}
              title="Toggle Workflows"
            >
              <CheckCircle size={16} />
              {activeWorkflows.length > 0 && <span className="badge">{activeWorkflows.length}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Conflict Indicators */}
      {renderConflicts()}

      {/* Main Editor Area */}
      <div className="editor-content">
        <div className="editor-container">
          {/* Text Editor */}
          <div className="editor-wrapper">
            <textarea
              ref={editorRef}
              className="advanced-textarea"
              value={content}
              onChange={onContentChange}
              onSelect={handleSelectionChange}
              onMouseUp={handleSelectionChange}
              onKeyUp={handleSelectionChange}
              onContextMenu={handleContextMenu}
              placeholder="Start typing to collaborate in real-time..."
            />

            {/* Annotations Overlay */}
            <div ref={overlayRef} className="annotations-overlay">
              {renderAnnotations()}
            </div>
          </div>

          {/* Add Annotation Button */}
          {selection.start !== selection.end && (
            <div className="floating-controls">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleAddAnnotation(selectedAnnotationType)}
                title={`Add ${selectedAnnotationType}`}
              >
                <Highlight size={14} />
                Add {selectedAnnotationType}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Panels */}
        <div className="collaboration-sidebar">
          {/* Comments Panel */}
          {showComments && (
            <div className="collaboration-panel">
              <SmartComments
                documentId={documentId}
                comments={comments}
                onAddComment={handleAddComment}
                currentUserId={currentUserId}
                onCommentUpdate={loadCollaborationData}
              />
            </div>
          )}

          {/* Workflow Panel */}
          {showWorkflows && (
            <div className="collaboration-panel">
              <WorkflowDashboard
                documentId={documentId}
                workflows={activeWorkflows}
                conflicts={conflicts}
                currentUserId={currentUserId}
                onWorkflowUpdate={loadCollaborationData}
              />
            </div>
          )}
        </div>
      </div>

      {/* Comment Context Menu */}
      {isAddingComment && commentPosition && (
        <div
          className="comment-context-menu"
          style={{
            position: 'fixed',
            left: commentPosition.x,
            top: commentPosition.y,
            zIndex: 1000
          }}
        >
          <div className="context-menu-content">
            <h4>Add Comment</h4>
            <p>Selected: "{commentPosition.text.slice(0, 50)}..."</p>

            <div className="comment-type-buttons">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  handleAddComment({
                    content: `Question about: "${commentPosition.text}"`,
                    type: 'question',
                    position: commentPosition.selection.start,
                    selection: commentPosition.selection
                  });
                }}
              >
                Ask Question
              </button>

              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  handleAddComment({
                    content: `Suggestion for: "${commentPosition.text}"`,
                    type: 'suggestion',
                    position: commentPosition.selection.start,
                    selection: commentPosition.selection
                  });
                }}
              >
                Suggest Change
              </button>

              <button
                className="btn btn-sm btn-outline"
                onClick={() => {
                  handleAddComment({
                    content: `Issue with: "${commentPosition.text}"`,
                    type: 'issue',
                    position: commentPosition.selection.start,
                    selection: commentPosition.selection
                  });
                }}
              >
                Report Issue
              </button>
            </div>

            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                setIsAddingComment(false);
                setCommentPosition(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="editor-help">
        <small className="text-gray-500">
          Right-click selected text to comment • Ctrl+H to highlight • Ctrl+/ for shortcuts
        </small>
      </div>
    </div>
  );
}