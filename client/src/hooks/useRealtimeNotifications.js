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

import { useState, useEffect, useCallback } from 'react';

export const useRealtimeNotifications = (realtimeHook) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationId, setNotificationId] = useState(0);

  const { isConnected, connectionError, users, documentDeltas } = realtimeHook;

  const addNotification = useCallback((type, data, message = null) => {
    const id = notificationId;
    setNotificationId(prev => prev + 1);

    const notification = {
      id,
      type,
      data,
      message,
      timestamp: Date.now(),
      read: false
    };

    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep only 50 notifications

    // Auto-dismiss certain notifications after a delay
    if (type === 'document_update' || type === 'document_saved') {
      setTimeout(() => {
        dismissNotification(id);
      }, 5000);
    }

    return id;
  }, [notificationId]);

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Track connection status changes
  useEffect(() => {
    let connectionTimeoutId;

    if (!isConnected && connectionError) {
      addNotification('connection_error', { message: connectionError });
    } else if (isConnected) {
      // Clear any existing connection error notifications
      setNotifications(prev => prev.filter(n => n.type !== 'connection_error'));

      // Add connection restored notification if we were previously disconnected
      const hasDisconnectionError = notifications.some(n => n.type === 'connection_error');
      if (hasDisconnectionError) {
        addNotification('connection_restored', {});
      }
    }

    return () => {
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
      }
    };
  }, [isConnected, connectionError, addNotification]);

  // Track user presence changes
  useEffect(() => {
    const currentUsers = new Set(users.map(u => u.userId));
    const previousUsers = new Set(
      notifications
        .filter(n => n.type === 'user_joined' || n.type === 'user_left')
        .map(n => n.data.userId)
    );

    users.forEach(user => {
      if (!previousUsers.has(user.userId) && user.status === 'editing') {
        addNotification('user_joined', {
          userId: user.userId,
          userName: user.name || user.userId,
          status: user.status
        });
      }
    });

    // Note: user_left notifications would typically come from the server
    // when users disconnect, but for this demo we'll handle it when users
    // disappear from the users array
  }, [users, addNotification]);

  // Track document changes
  useEffect(() => {
    if (documentDeltas.length > 0) {
      const latestDelta = documentDeltas[documentDeltas.length - 1];

      // Only notify for changes from other users
      if (latestDelta.userId !== realtimeHook.userId) {
        addNotification('document_update', {
          userId: latestDelta.userId,
          deltaType: latestDelta.delta?.operation || 'unknown',
          timestamp: latestDelta.timestamp
        });
      }
    }
  }, [documentDeltas, addNotification, realtimeHook.userId]);

  // Track save events (this would normally come from the server)
  const notifyDocumentSaved = useCallback((userId = null) => {
    addNotification('document_saved', {
      userId: userId || realtimeHook.userId,
      timestamp: Date.now()
    });
  }, [addNotification, realtimeHook.userId]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    notifyDocumentSaved,
    unreadCount: notifications.filter(n => !n.read).length
  };
};

export default useRealtimeNotifications;