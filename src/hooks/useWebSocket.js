/**
 * useWebSocket Hook - React integration for WebSocket Service
 * PERF-34: Real-time WebSocket notification system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { wsService, notificationManager } from '../services/WebSocketService';

/**
 * Hook for WebSocket connection management
 * @param {string} url - WebSocket server URL
 * @param {Object} options - Connection options
 */
export const useWebSocket = (url, options = {}) => {
  const [connectionState, setConnectionState] = useState('disconnected');
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectingRef = useRef(false);

  useEffect(() => {
    // Subscribe to connection state changes
    const unsubConnection = wsService.subscribe('connection', (data) => {
      setConnectionState(data.status);
      if (data.status === 'connected') {
        setError(null);
        reconnectingRef.current = false;
      }
    });

    const unsubError = wsService.subscribe('error', (data) => {
      setError(data.error);
    });

    const unsubReconnecting = wsService.subscribe('reconnecting', () => {
      reconnectingRef.current = true;
    });

    const unsubMessage = wsService.subscribe('message', (data) => {
      setLastMessage(data);
    });

    // Connect if autoConnect is enabled
    if (options.autoConnect !== false && url) {
      wsService.connect(url, options).catch(err => {
        setError(err);
      });
    }

    return () => {
      unsubConnection();
      unsubError();
      unsubReconnecting();
      unsubMessage();

      if (options.disconnectOnUnmount) {
        wsService.disconnect();
      }
    };
  }, [url, options.autoConnect, options.disconnectOnUnmount]);

  const connect = useCallback(() => {
    return wsService.connect(url, options);
  }, [url, options]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, []);

  const send = useCallback((type, payload, sendOptions) => {
    return wsService.send(type, payload, sendOptions);
  }, []);

  const subscribe = useCallback((event, callback) => {
    return wsService.subscribe(event, callback);
  }, []);

  const joinRoom = useCallback((roomId) => {
    wsService.joinRoom(roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    wsService.leaveRoom(roomId);
  }, []);

  return {
    connectionState,
    isConnected: connectionState === 'connected',
    isReconnecting: reconnectingRef.current,
    error,
    lastMessage,
    connect,
    disconnect,
    send,
    subscribe,
    joinRoom,
    leaveRoom,
    getState: wsService.getState.bind(wsService)
  };
};

/**
 * Hook for notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initial load
    setNotifications(notificationManager.getNotifications());
    setUnreadCount(notificationManager.getUnreadCount());

    // Subscribe to notification events
    const unsubReceived = wsService.subscribe('notification:received', () => {
      setNotifications(notificationManager.getNotifications());
      setUnreadCount(notificationManager.getUnreadCount());
    });

    const unsubRead = wsService.subscribe('notification:read', () => {
      setNotifications(notificationManager.getNotifications());
      setUnreadCount(notificationManager.getUnreadCount());
    });

    const unsubAllRead = wsService.subscribe('notifications:all_read', () => {
      setNotifications(notificationManager.getNotifications());
      setUnreadCount(0);
    });

    const unsubCleared = wsService.subscribe('notifications:cleared', () => {
      setNotifications([]);
      setUnreadCount(0);
    });

    return () => {
      unsubReceived();
      unsubRead();
      unsubAllRead();
      unsubCleared();
    };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    notificationManager.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationManager.markAllAsRead();
  }, []);

  const clearAll = useCallback(() => {
    notificationManager.clearNotifications();
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll
  };
};

/**
 * Hook for room-based messaging
 * @param {string} roomId - Room identifier
 */
export const useRoom = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    if (!roomId) return;

    // Join room on mount
    wsService.joinRoom(roomId);

    // Subscribe to room messages
    const unsubMessage = wsService.subscribe(`room:${roomId}`, (data) => {
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.payload]);
      } else if (data.type === 'members_update') {
        setMembers(data.payload.members);
      }
    });

    return () => {
      unsubMessage();
      wsService.leaveRoom(roomId);
    };
  }, [roomId]);

  const sendMessage = useCallback((content, metadata = {}) => {
    wsService.send('room:message', {
      roomId,
      content,
      metadata,
      timestamp: Date.now()
    });
  }, [roomId]);

  return {
    messages,
    members,
    sendMessage
  };
};

export default useWebSocket;
