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

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Filter,
  Tag,
  Clock,
  User,
  ChevronDown,
  MoreVertical,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  Reply,
  Edit3,
  Trash2,
  AtSign,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import './SmartComments.css';

export default function SmartComments({
  documentId,
  comments,
  onAddComment,
  currentUserId,
  onCommentUpdate
}) {
  // State
  const [filteredComments, setFilteredComments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('general');
  const [mentions, setMentions] = useState([]);
  const [tags, setTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [commentAnalytics, setCommentAnalytics] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [replyingTo, setReplyingTo] = useState(null);

  const textareaRef = useRef(null);

  // Load data
  useEffect(() => {
    loadTemplates();
    loadAnalytics();
  }, [documentId]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [comments, activeFilter, sortBy]);

  // Load comment templates
  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/comments/templates');
      const templatesData = await response.json();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load comment templates:', error);
    }
  };

  // Load comment analytics
  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/comments/analytics`);
      const analyticsData = await response.json();
      setCommentAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load comment analytics:', error);
    }
  };

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let filtered = [...comments];

    // Apply filters
    switch (activeFilter) {
      case 'my_comments':
        filtered = filtered.filter(c => c.userId === currentUserId);
        break;
      case 'mentions_me':
        filtered = filtered.filter(c => c.mentions.includes(currentUserId));
        break;
      case 'urgent':
        filtered = filtered.filter(c => c.tags.includes('urgent') || c.priority >= 4);
        break;
      case 'unresolved':
        filtered = filtered.filter(c => !c.resolved);
        break;
      case 'issues':
        filtered = filtered.filter(c => c.type === 'issue');
        break;
      case 'suggestions':
        filtered = filtered.filter(c => c.type === 'suggestion');
        break;
      case 'questions':
        filtered = filtered.filter(c => c.type === 'question');
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'priority':
        filtered.sort((a, b) => b.priority - a.priority);
        break;
      case 'timestamp':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type));
        break;
      case 'relevance':
        filtered = sortByRelevance(filtered);
        break;
    }

    setFilteredComments(filtered);
  };

  // Sort by relevance (smart sorting)
  const sortByRelevance = (comments) => {
    return comments.sort((a, b) => {
      let scoreA = 0, scoreB = 0;

      // User's own comments
      if (a.userId === currentUserId) scoreA += 10;
      if (b.userId === currentUserId) scoreB += 10;

      // Mentions user
      if (a.mentions.includes(currentUserId)) scoreA += 8;
      if (b.mentions.includes(currentUserId)) scoreB += 8;

      // Priority
      scoreA += a.priority * 2;
      scoreB += b.priority * 2;

      // Recency
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      if ((now - a.timestamp) < dayMs) scoreA += 5;
      if ((now - b.timestamp) < dayMs) scoreB += 5;

      // Unresolved
      if (!a.resolved) scoreA += 3;
      if (!b.resolved) scoreB += 3;

      return scoreB - scoreA;
    });
  };

  // Handle comment submission
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const commentData = {
      content: commentText,
      type: commentType,
      mentions,
      tags,
      parentId: replyingTo
    };

    try {
      await onAddComment(commentData);
      setCommentText('');
      setMentions([]);
      setTags([]);
      setReplyingTo(null);
      setSelectedTemplate(null);
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setCommentText(template.template);
    setCommentType(template.category);
    setTags([...template.tags]);
  };

  // Handle mention input
  const handleMentionInput = (value) => {
    if (value.includes('@')) {
      // Extract mention
      const mention = value.match(/@(\w+)/g);
      if (mention) {
        const userIds = mention.map(m => m.substring(1));
        setMentions([...new Set([...mentions, ...userIds])]);
      }
    }
    setCommentText(value);
  };

  // Handle comment action (resolve, react, etc.)
  const handleCommentAction = async (commentId, action, data = {}) => {
    try {
      await fetch(`/api/comments/${commentId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data })
      });

      onCommentUpdate();
      toast.success(`Comment ${action}d`);
    } catch (error) {
      toast.error(`Failed to ${action} comment`);
    }
  };

  // Toggle comment expansion
  const toggleCommentExpansion = (commentId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  // Render comment type icon
  const renderCommentTypeIcon = (type) => {
    const icons = {
      issue: <AlertCircle className="text-red-500" size={16} />,
      suggestion: <Lightbulb className="text-yellow-500" size={16} />,
      question: <HelpCircle className="text-blue-500" size={16} />,
      general: <MessageSquare className="text-gray-500" size={16} />
    };
    return icons[type] || icons.general;
  };

  // Render comment priority
  const renderCommentPriority = (priority) => {
    if (priority <= 2) return null;

    const colors = {
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-orange-100 text-orange-800',
      5: 'bg-red-100 text-red-800'
    };

    const labels = {
      3: 'Medium',
      4: 'High',
      5: 'Critical'
    };

    return (
      <span className={`priority-badge ${colors[priority]}`}>
        {labels[priority]}
      </span>
    );
  };

  // Render comment sentiment
  const renderCommentSentiment = (sentiment) => {
    if (!sentiment || sentiment.confidence < 0.5) return null;

    const icons = {
      positive: <ThumbsUp className="text-green-500" size={12} />,
      negative: <ThumbsDown className="text-red-500" size={12} />,
      neutral: null
    };

    return icons[sentiment.sentiment];
  };

  // Render analytics
  const renderAnalytics = () => {
    if (!showAnalytics || !commentAnalytics) return null;

    return (
      <div className="comments-analytics">
        <div className="analytics-header">
          <h4>
            <BarChart3 size={16} />
            Comment Analytics
          </h4>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowAnalytics(false)}
          >
            ×
          </button>
        </div>

        <div className="analytics-content">
          <div className="analytics-summary">
            <div className="metric">
              <span className="metric-value">{commentAnalytics.summary.totalComments}</span>
              <span className="metric-label">Total Comments</span>
            </div>
            <div className="metric">
              <span className="metric-value">{commentAnalytics.summary.unresolvedComments}</span>
              <span className="metric-label">Unresolved</span>
            </div>
            <div className="metric">
              <span className="metric-value">{commentAnalytics.summary.activeCollaborators}</span>
              <span className="metric-label">Contributors</span>
            </div>
          </div>

          <div className="analytics-charts">
            <div className="chart-section">
              <h5>Comment Types</h5>
              <div className="type-distribution">
                {Object.entries(commentAnalytics.summary.typeDistribution).map(([type, count]) => (
                  <div key={type} className="type-item">
                    {renderCommentTypeIcon(type)}
                    <span>{type}</span>
                    <span className="count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-section">
              <h5>Recent Trends</h5>
              <div className="trends">
                {commentAnalytics.trends.map((trend, index) => (
                  <div key={index} className="trend-item">
                    <span className="trend-period">{trend.period}</span>
                    <span className="trend-count">{trend.count} comments</span>
                  </div>
                ))}
              </div>
            </div>

            {commentAnalytics.insights.length > 0 && (
              <div className="chart-section">
                <h5>Insights</h5>
                <div className="insights">
                  {commentAnalytics.insights.map((insight, index) => (
                    <div key={index} className={`insight insight-${insight.type}`}>
                      <strong>{insight.title}</strong>
                      <p>{insight.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="smart-comments">
      {/* Header */}
      <div className="comments-header">
        <h3>
          <MessageSquare size={18} />
          Smart Comments
          {comments.length > 0 && (
            <span className="comment-count">{comments.length}</span>
          )}
        </h3>

        <div className="header-actions">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowAnalytics(!showAnalytics)}
            title="View Analytics"
          >
            <TrendingUp size={16} />
          </button>

          <div className="filter-dropdown">
            <button className="btn btn-sm btn-outline">
              <Filter size={16} />
              {activeFilter}
              <ChevronDown size={14} />
            </button>
            <div className="dropdown-menu">
              {[
                { id: 'all', label: 'All Comments' },
                { id: 'my_comments', label: 'My Comments' },
                { id: 'mentions_me', label: 'Mentions Me' },
                { id: 'urgent', label: 'Urgent' },
                { id: 'unresolved', label: 'Unresolved' },
                { id: 'issues', label: 'Issues' },
                { id: 'suggestions', label: 'Suggestions' },
                { id: 'questions', label: 'Questions' }
              ].map(filter => (
                <button
                  key={filter.id}
                  className={`dropdown-item ${activeFilter === filter.id ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sort-dropdown">
            <button className="btn btn-sm btn-outline">
              <Clock size={16} />
              Sort: {sortBy}
              <ChevronDown size={14} />
            </button>
            <div className="dropdown-menu">
              {[
                { id: 'timestamp', label: 'Recent' },
                { id: 'priority', label: 'Priority' },
                { id: 'type', label: 'Type' },
                { id: 'relevance', label: 'Relevance' }
              ].map(sort => (
                <button
                  key={sort.id}
                  className={`dropdown-item ${sortBy === sort.id ? 'active' : ''}`}
                  onClick={() => setSortBy(sort.id)}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      {renderAnalytics()}

      {/* Comment Form */}
      <div className="comment-form">
        {replyingTo && (
          <div className="reply-indicator">
            <Reply size={14} />
            Replying to comment
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </button>
          </div>
        )}

        <form onSubmit={handleSubmitComment}>
          <div className="form-row">
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value)}
              className="comment-type-select"
            >
              <option value="general">General</option>
              <option value="question">Question</option>
              <option value="suggestion">Suggestion</option>
              <option value="issue">Issue</option>
            </select>

            {templates.length > 0 && (
              <div className="template-dropdown">
                <button type="button" className="btn btn-sm btn-outline">
                  Templates
                  <ChevronDown size={14} />
                </button>
                <div className="dropdown-menu">
                  {templates.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      className="dropdown-item"
                      onClick={() => handleTemplateSelect(template)}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={(e) => handleMentionInput(e.target.value)}
            placeholder="Add a comment... Use @username to mention someone"
            className="comment-textarea"
            rows="3"
          />

          {(mentions.length > 0 || tags.length > 0) && (
            <div className="comment-metadata">
              {mentions.length > 0 && (
                <div className="mentions">
                  <AtSign size={14} />
                  {mentions.map(mention => (
                    <span key={mention} className="mention-tag">
                      @{mention}
                    </span>
                  ))}
                </div>
              )}

              {tags.length > 0 && (
                <div className="tags">
                  <Tag size={14} />
                  {tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!commentText.trim()}
            >
              <Send size={14} />
              Add Comment
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {filteredComments.length === 0 ? (
          <div className="no-comments">
            <MessageSquare size={48} className="text-gray-300" />
            <p>No comments match your current filter.</p>
            {activeFilter !== 'all' && (
              <button
                className="btn btn-outline"
                onClick={() => setActiveFilter('all')}
              >
                Show All Comments
              </button>
            )}
          </div>
        ) : (
          filteredComments.map(comment => (
            <div
              key={comment.id}
              className={`comment ${comment.resolved ? 'resolved' : ''} ${
                comment.mentions.includes(currentUserId) ? 'mentions-me' : ''
              }`}
            >
              <div className="comment-header">
                <div className="comment-meta">
                  {renderCommentTypeIcon(comment.type)}
                  <User size={14} />
                  <span className="username">{comment.userId}</span>
                  <span className="timestamp">
                    {new Date(comment.timestamp).toLocaleString()}
                  </span>
                  {renderCommentPriority(comment.priority)}
                  {renderCommentSentiment(comment.sentiment)}
                </div>

                <div className="comment-actions">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setReplyingTo(comment.id)}
                    title="Reply"
                  >
                    <Reply size={14} />
                  </button>

                  {!comment.resolved && (
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleCommentAction(comment.id, 'resolve')}
                      title="Mark as Resolved"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}

                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => toggleCommentExpansion(comment.id)}
                    title="More details"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>

              <div className="comment-content">
                <p>{comment.content}</p>

                {comment.context && expandedComments.has(comment.id) && (
                  <div className="comment-context">
                    <h5>Context:</h5>
                    <div className="context-snippet">
                      {comment.context.before && (
                        <span className="context-before">...{comment.context.before}</span>
                      )}
                      {comment.context.selected && (
                        <mark className="context-selected">{comment.context.selected}</mark>
                      )}
                      {comment.context.after && (
                        <span className="context-after">{comment.context.after}...</span>
                      )}
                    </div>
                  </div>
                )}

                {comment.actionItems && comment.actionItems.length > 0 && (
                  <div className="action-items">
                    <h5>Action Items:</h5>
                    <ul>
                      {comment.actionItems.map(item => (
                        <li key={item.id} className={item.completed ? 'completed' : ''}>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleCommentAction(comment.id, 'toggle_action_item', { itemId: item.id })}
                          />
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {(comment.tags.length > 0 || comment.mentions.length > 0) && (
                <div className="comment-footer">
                  {comment.tags.length > 0 && (
                    <div className="comment-tags">
                      {comment.tags.map(tag => (
                        <span key={tag} className={`tag tag-${tag}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {comment.mentions.length > 0 && (
                    <div className="comment-mentions">
                      <AtSign size={12} />
                      {comment.mentions.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}