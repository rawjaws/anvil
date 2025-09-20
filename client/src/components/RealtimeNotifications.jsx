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

import React, { useState, useEffect } from 'react';
import { Bell, X, User, Edit3, Save, AlertCircle } from 'lucide-react';
import './RealtimeNotifications.css';

export default function RealtimeNotifications({
  notifications = [],
  onDismiss,
  isConnected,
  connectionError
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'user_joined':
        return <User size={16} className="text-green-600" />;
      case 'user_left':
        return <User size={16} className="text-gray-500" />;
      case 'document_update':
        return <Edit3 size={16} className="text-blue-600" />;
      case 'document_saved':
        return <Save size={16} className="text-purple-600" />;
      case 'connection_error':
        return <AlertCircle size={16} className="text-red-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getNotificationMessage = (notification) => {
    const { type, data } = notification;
    const userName = data?.userName || data?.userId?.slice(-4).toUpperCase() || 'User';

    switch (type) {
      case 'user_joined':
        return `${userName} joined the document`;
      case 'user_left':
        return `${userName} left the document`;
      case 'document_update':
        return `${userName} made changes to the document`;
      case 'document_saved':
        return `${userName} saved the document`;
      case 'connection_error':
        return `Connection error: ${data?.message || 'Unknown error'}`;
      case 'connection_restored':
        return 'Connection restored';
      default:
        return notification.message || 'Unknown notification';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const handleNotificationClick = (notification) => {
    if (onDismiss) {
      onDismiss(notification.id);
    }
  };

  const clearAllNotifications = () => {
    notifications.forEach(notification => {
      if (onDismiss) {
        onDismiss(notification.id);
      }
    });
  };

  return (
    <div className="realtime-notifications">
      <div
        className="notification-trigger"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
        <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
      </div>

      {isExpanded && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Real-time Activity</h4>
            <div className="notification-actions">
              {notifications.length > 0 && (
                <button
                  className="clear-all-btn"
                  onClick={clearAllNotifications}
                  title="Clear all notifications"
                >
                  Clear all
                </button>
              )}
              <button
                className="close-btn"
                onClick={() => setIsExpanded(false)}
                title="Close notifications"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="connection-status-detail">
            <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              <div className="status-dot" />
              <span>
                {isConnected ? 'Connected to real-time server' : 'Disconnected from server'}
              </span>
            </div>
            {connectionError && (
              <div className="error-message">
                <AlertCircle size={14} />
                <span>{connectionError}</span>
              </div>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <Bell size={24} className="text-gray-400" />
                <p>No recent activity</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">
                      {getNotificationMessage(notification)}
                    </div>
                    <div className="notification-timestamp">
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="unread-indicator" />
                  )}
                </div>
              ))
            )}
          </div>

          {notifications.length > 10 && (
            <div className="notification-footer">
              <p>Showing 10 of {notifications.length} notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}