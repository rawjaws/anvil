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

class WebSocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.messageQueue = [];
    this.userId = null;
    this.documentId = null;
  }

  connect(wsUrl = 'ws://localhost:3000', userId, documentId) {
    return new Promise((resolve, reject) => {
      try {
        this.userId = userId;
        this.documentId = documentId;

        // Close existing connection if any
        if (this.socket) {
          this.disconnect();
        }

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Send initial join message
          this.send({
            type: 'JOIN_DOCUMENT',
            payload: {
              userId: this.userId,
              documentId: this.documentId,
              timestamp: Date.now()
            }
          });

          // Send queued messages
          this.flushMessageQueue();

          this.emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.emit('disconnected', { code: event.code, reason: event.reason });

          // Attempt to reconnect if not a clean close
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
    this.isConnected = false;
    this.userId = null;
    this.documentId = null;
    this.messageQueue = [];
  }

  send(message) {
    if (this.isConnected && this.socket) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
        this.emit('error', error);
      }
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.userId && this.documentId) {
        this.connect('ws://localhost:3000', this.userId, this.documentId)
          .catch((error) => {
            console.error('Reconnection failed:', error);
          });
      }
    }, delay);
  }

  handleMessage(message) {
    const { type, payload } = message;

    switch (type) {
      case 'DOCUMENT_DELTA':
        this.emit('document_delta', payload);
        break;
      case 'USER_JOINED':
        this.emit('user_joined', payload);
        break;
      case 'USER_LEFT':
        this.emit('user_left', payload);
        break;
      case 'CURSOR_UPDATE':
        this.emit('cursor_update', payload);
        break;
      case 'PRESENCE_UPDATE':
        this.emit('presence_update', payload);
        break;
      case 'CONFLICT_RESOLUTION':
        this.emit('conflict_resolution', payload);
        break;
      case 'ERROR':
        this.emit('error', payload);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  }

  // Event system
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }

  off(event, listener) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Document collaboration methods
  sendTextDelta(delta, selection) {
    this.send({
      type: 'TEXT_DELTA',
      payload: {
        documentId: this.documentId,
        userId: this.userId,
        delta,
        selection,
        timestamp: Date.now()
      }
    });
  }

  sendCursorUpdate(position) {
    this.send({
      type: 'CURSOR_UPDATE',
      payload: {
        documentId: this.documentId,
        userId: this.userId,
        position,
        timestamp: Date.now()
      }
    });
  }

  sendPresenceUpdate(status) {
    this.send({
      type: 'PRESENCE_UPDATE',
      payload: {
        documentId: this.documentId,
        userId: this.userId,
        status,
        timestamp: Date.now()
      }
    });
  }

  // Getters
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
      documentId: this.documentId
    };
  }
}

// Singleton instance
const webSocketClient = new WebSocketClient();

export default webSocketClient;