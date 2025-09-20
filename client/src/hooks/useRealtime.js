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

import { useState, useEffect, useCallback, useRef } from 'react';
import webSocketClient from '../realtime/WebSocketClient.js';

export const useRealtime = (documentId, userId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [users, setUsers] = useState(new Map());
  const [cursors, setCursors] = useState(new Map());
  const [documentDeltas, setDocumentDeltas] = useState([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const eventListenersRef = useRef([]);

  // Connection management
  const connect = useCallback(async () => {
    if (!documentId || !userId) {
      console.warn('Cannot connect: documentId and userId are required');
      return;
    }

    try {
      setConnectionError(null);
      await webSocketClient.connect('ws://localhost:3000', userId, documentId);
    } catch (error) {
      setConnectionError(error.message);
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [documentId, userId]);

  const disconnect = useCallback(() => {
    webSocketClient.disconnect();
  }, []);

  // Document operations
  const sendTextDelta = useCallback((delta, selection) => {
    webSocketClient.sendTextDelta(delta, selection);
  }, []);

  const sendCursorUpdate = useCallback((position) => {
    webSocketClient.sendCursorUpdate(position);
  }, []);

  const sendPresenceUpdate = useCallback((status) => {
    webSocketClient.sendPresenceUpdate(status);
  }, []);

  // Set up event listeners
  useEffect(() => {
    const handleConnected = () => {
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleError = (error) => {
      setConnectionError(error.message || 'WebSocket error');
    };

    const handleUserJoined = (userData) => {
      setUsers(prev => new Map(prev.set(userData.userId, userData)));
    };

    const handleUserLeft = (userData) => {
      setUsers(prev => {
        const newUsers = new Map(prev);
        newUsers.delete(userData.userId);
        return newUsers;
      });

      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userData.userId);
        return newCursors;
      });
    };

    const handleCursorUpdate = (cursorData) => {
      if (cursorData.userId !== userId) {
        setCursors(prev => new Map(prev.set(cursorData.userId, cursorData)));
      }
    };

    const handlePresenceUpdate = (presenceData) => {
      setUsers(prev => {
        const newUsers = new Map(prev);
        const user = newUsers.get(presenceData.userId);
        if (user) {
          newUsers.set(presenceData.userId, { ...user, status: presenceData.status });
        }
        return newUsers;
      });
    };

    const handleDocumentDelta = (deltaData) => {
      setDocumentDeltas(prev => [...prev, deltaData]);
    };

    // Register event listeners
    const listeners = [
      { event: 'connected', handler: handleConnected },
      { event: 'disconnected', handler: handleDisconnected },
      { event: 'error', handler: handleError },
      { event: 'user_joined', handler: handleUserJoined },
      { event: 'user_left', handler: handleUserLeft },
      { event: 'cursor_update', handler: handleCursorUpdate },
      { event: 'presence_update', handler: handlePresenceUpdate },
      { event: 'document_delta', handler: handleDocumentDelta }
    ];

    listeners.forEach(({ event, handler }) => {
      webSocketClient.on(event, handler);
    });

    eventListenersRef.current = listeners;

    // Initial connection
    if (documentId && userId) {
      connect();
    }

    // Cleanup function
    return () => {
      eventListenersRef.current.forEach(({ event, handler }) => {
        webSocketClient.off(event, handler);
      });
      eventListenersRef.current = [];
    };
  }, [documentId, userId, connect]);

  // Update reconnect attempts when connection state changes
  useEffect(() => {
    const updateReconnectAttempts = () => {
      const state = webSocketClient.getConnectionState();
      setReconnectAttempts(state.reconnectAttempts);
    };

    const interval = setInterval(updateReconnectAttempts, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clean up document deltas periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      setDocumentDeltas(prev => {
        // Keep only the last 100 deltas to prevent memory leaks
        return prev.slice(-100);
      });
    }, 30000); // Clean up every 30 seconds

    return () => clearInterval(cleanup);
  }, []);

  return {
    // Connection state
    isConnected,
    connectionError,
    reconnectAttempts,

    // Connection controls
    connect,
    disconnect,

    // Collaboration data
    users: Array.from(users.values()),
    cursors: Array.from(cursors.values()),
    documentDeltas,

    // Actions
    sendTextDelta,
    sendCursorUpdate,
    sendPresenceUpdate,

    // Utilities
    clearDocumentDeltas: () => setDocumentDeltas([]),
    getUserById: (id) => users.get(id),
    getCursorById: (id) => cursors.get(id)
  };
};

export default useRealtime;