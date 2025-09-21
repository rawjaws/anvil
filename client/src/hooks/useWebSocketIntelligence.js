/**
 * WebSocket Intelligence Hook for Real-Time Analytics
 * Provides live data streaming with <100ms latency
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocketIntelligence = (config = {}) => {
  const {
    url = 'ws://localhost:8080',
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    enableLogging = true
  } = config;

  // State management
  const [connectionState, setConnectionState] = useState('disconnected');
  const [realTimeData, setRealTimeData] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [performance, setPerformance] = useState({
    latency: 0,
    throughput: 0,
    accuracy: 0
  });
  const [error, setError] = useState(null);

  // Refs for WebSocket management
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const subscriptionsRef = useRef(new Set());
  const lastPingRef = useRef(Date.now());

  // Logging utility
  const log = useCallback((level, message, data = null) => {
    if (enableLogging) {
      console[level](`[WebSocket Intelligence] ${message}`, data || '');
    }
  }, [enableLogging]);

  // Connection management
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      log('warn', 'WebSocket already connected');
      return;
    }

    try {
      log('info', `Connecting to ${url}...`);
      setConnectionState('connecting');
      setError(null);

      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        log('info', 'WebSocket connected successfully');
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;

        // Send connection acknowledgment
        sendMessage({
          type: 'connection-ack',
          timestamp: new Date().toISOString(),
          client: 'enhanced-analytics'
        });

        // Subscribe to intelligence streams
        subscribeToStreams();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (parseError) {
          log('error', 'Failed to parse WebSocket message', parseError);
        }
      };

      wsRef.current.onclose = (event) => {
        log('warn', `WebSocket closed: ${event.code} - ${event.reason}`);
        setConnectionState('disconnected');

        if (!event.wasClean && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (event) => {
        log('error', 'WebSocket error occurred', event);
        setError('Connection error occurred');
        setConnectionState('error');
      };

    } catch (connectionError) {
      log('error', 'Failed to create WebSocket connection', connectionError);
      setError(connectionError.message);
      setConnectionState('error');
    }
  }, [url, maxReconnectAttempts, log]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    log('info', 'WebSocket disconnected');
  }, [log]);

  const scheduleReconnect = useCallback(() => {
    reconnectAttemptsRef.current += 1;
    log('info', `Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts, log]);

  // Message handling
  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message));
        return true;
      } catch (sendError) {
        log('error', 'Failed to send message', sendError);
        return false;
      }
    } else {
      log('warn', 'Cannot send message: WebSocket not connected');
      return false;
    }
  }, [log]);

  const handleMessage = useCallback((data) => {
    const now = Date.now();
    const latency = now - lastPingRef.current;

    switch (data.type) {
      case 'connection-established':
        log('info', 'Connection established', data);
        setConnectionState('connected');
        break;

      case 'intelligence-update':
        setIntelligence(data.data);
        setRealTimeData(data.data?.data);

        // Update performance metrics
        if (data.data?.performance) {
          setPerformance(prev => ({
            ...prev,
            ...data.data.performance,
            latency: latency
          }));
        }
        break;

      case 'alert':
        setAlerts(prev => [data.data, ...prev.slice(0, 19)]); // Keep last 20 alerts
        log('warn', 'New alert received', data.data);
        break;

      case 'performance-update':
        setPerformance(prev => ({
          ...prev,
          ...data.data,
          latency: latency
        }));
        break;

      case 'snapshot':
        setRealTimeData(data.data);
        log('info', 'Snapshot received');
        break;

      case 'subscription-confirmed':
        log('info', `Subscription confirmed for ${data.channel}`);
        break;

      case 'ping':
        // Respond to ping with pong
        sendMessage({ type: 'pong', timestamp: data.timestamp });
        break;

      case 'pong':
        // Calculate round-trip latency
        const rtt = now - new Date(data.timestamp).getTime();
        setPerformance(prev => ({ ...prev, latency: rtt }));
        break;

      default:
        log('warn', 'Unknown message type received', data);
    }

    lastPingRef.current = now;
  }, [log, sendMessage]);

  // Subscription management
  const subscribeToStreams = useCallback(() => {
    const streams = ['metrics', 'events', 'predictions', 'market', 'alerts'];

    streams.forEach(stream => {
      if (!subscriptionsRef.current.has(stream)) {
        sendMessage({
          type: 'subscribe',
          channel: stream,
          timestamp: new Date().toISOString()
        });
        subscriptionsRef.current.add(stream);
      }
    });
  }, [sendMessage]);

  const subscribe = useCallback((channel) => {
    if (!subscriptionsRef.current.has(channel)) {
      sendMessage({
        type: 'subscribe',
        channel: channel,
        timestamp: new Date().toISOString()
      });
      subscriptionsRef.current.add(channel);
      log('info', `Subscribed to ${channel}`);
    }
  }, [sendMessage, log]);

  const unsubscribe = useCallback((channel) => {
    if (subscriptionsRef.current.has(channel)) {
      sendMessage({
        type: 'unsubscribe',
        channel: channel,
        timestamp: new Date().toISOString()
      });
      subscriptionsRef.current.delete(channel);
      log('info', `Unsubscribed from ${channel}`);
    }
  }, [sendMessage, log]);

  // Data requests
  const requestSnapshot = useCallback(() => {
    sendMessage({
      type: 'request-snapshot',
      timestamp: new Date().toISOString()
    });
    log('info', 'Snapshot requested');
  }, [sendMessage, log]);

  const requestPrediction = useCallback((projectData) => {
    sendMessage({
      type: 'request-prediction',
      data: projectData,
      timestamp: new Date().toISOString()
    });
    log('info', 'Prediction requested', projectData);
  }, [sendMessage, log]);

  // Performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({
          type: 'ping',
          timestamp: new Date().toISOString()
        });
      }
    }, 5000); // Ping every 5 seconds

    return () => clearInterval(pingInterval);
  }, [sendMessage]);

  // Alert management
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    log('info', 'Alerts cleared');
  }, [log]);

  const dismissAlert = useCallback((alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    log('info', `Alert ${alertId} dismissed`);
  }, [log]);

  // Effects
  useEffect(() => {
    connect();
    const cleanup = startPerformanceMonitoring();

    return () => {
      cleanup();
      disconnect();
    };
  }, [connect, disconnect, startPerformanceMonitoring]);

  // Auto-reconnect on configuration change
  useEffect(() => {
    if (connectionState === 'connected') {
      disconnect();
      setTimeout(connect, 100);
    }
  }, [url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  // Return hook interface
  return {
    // Connection state
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    error,

    // Real-time data
    realTimeData,
    intelligence,
    alerts,
    performance,

    // Connection control
    connect,
    disconnect,
    reconnect: () => {
      disconnect();
      setTimeout(connect, 100);
    },

    // Subscription management
    subscribe,
    unsubscribe,
    subscriptions: Array.from(subscriptionsRef.current),

    // Data requests
    requestSnapshot,
    requestPrediction,

    // Alert management
    clearAlerts,
    dismissAlert,

    // Utility functions
    sendMessage,
    getConnectionStats: () => ({
      state: connectionState,
      reconnectAttempts: reconnectAttemptsRef.current,
      subscriptions: subscriptionsRef.current.size,
      lastLatency: performance.latency,
      alertCount: alerts.length
    })
  };
};

export default useWebSocketIntelligence;