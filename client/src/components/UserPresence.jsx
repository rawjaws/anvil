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

import React, { useState } from 'react';
import { Users, User, Circle } from 'lucide-react';
import './UserPresence.css';

export default function UserPresence({ users, currentUserId }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeUsers = users.filter(user => user.userId !== currentUserId);
  const onlineUsers = activeUsers.filter(user => user.status === 'editing' || user.status === 'saved');

  const getUserColor = (userId) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const hash = userId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'editing':
        return <Circle size={8} fill="#22c55e" color="#22c55e" className="status-indicator" />;
      case 'saved':
        return <Circle size={8} fill="#3b82f6" color="#3b82f6" className="status-indicator" />;
      case 'offline':
        return <Circle size={8} fill="#6b7280" color="#6b7280" className="status-indicator" />;
      default:
        return <Circle size={8} fill="#6b7280" color="#6b7280" className="status-indicator" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'editing':
        return 'Editing';
      case 'saved':
        return 'Just saved';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getUserDisplayName = (userId) => {
    // Extract a readable name from userId or use a default format
    if (userId.startsWith('user_')) {
      return `User ${userId.slice(-4).toUpperCase()}`;
    }
    return userId.slice(0, 8);
  };

  if (activeUsers.length === 0) {
    return (
      <div className="user-presence">
        <div className="user-count">
          <User size={16} />
          <span>You</span>
        </div>
      </div>
    );
  }

  return (
    <div className="user-presence">
      <div
        className="user-count"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <Users size={16} />
        <span>{onlineUsers.length + 1} online</span>
        {onlineUsers.length > 0 && (
          <div className="user-avatars">
            {onlineUsers.slice(0, 3).map(user => (
              <div
                key={user.userId}
                className="user-avatar"
                style={{ backgroundColor: getUserColor(user.userId) }}
                title={`${getUserDisplayName(user.userId)} - ${getStatusText(user.status)}`}
              >
                {getUserDisplayName(user.userId).charAt(0)}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div className="user-avatar-overflow">
                +{onlineUsers.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="user-presence-dropdown">
          <div className="user-list">
            <div className="user-item current-user">
              <div
                className="user-avatar"
                style={{ backgroundColor: '#34d399' }}
              >
                Y
              </div>
              <div className="user-info">
                <div className="user-name">You</div>
                <div className="user-status">
                  {getStatusIndicator('editing')}
                  <span>Editing</span>
                </div>
              </div>
            </div>

            {activeUsers.map(user => (
              <div key={user.userId} className="user-item">
                <div
                  className="user-avatar"
                  style={{ backgroundColor: getUserColor(user.userId) }}
                >
                  {getUserDisplayName(user.userId).charAt(0)}
                </div>
                <div className="user-info">
                  <div className="user-name">{getUserDisplayName(user.userId)}</div>
                  <div className="user-status">
                    {getStatusIndicator(user.status)}
                    <span>{getStatusText(user.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="presence-footer">
            <p className="text-xs text-gray-500">
              Real-time collaboration active
            </p>
          </div>
        </div>
      )}
    </div>
  );
}