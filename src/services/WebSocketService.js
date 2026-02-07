/**
 * WebSocket Service - Real-time Notification System
 * PERF-34: Implement real-time WebSocket notification system
 *
 * Features:
 * - Automatic reconnection with exponential backoff
 * - Message queuing during disconnection
 * - Heartbeat mechanism for connection health
 * - Event-driven architecture with pub/sub pattern
 * - Room-based messaging for targeted notifications
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.heartbeatInterval = null;
    this.heartbeatTimeout = null;
    this.messageQueue = [];
    this.subscribers = new Map();
    this.rooms = new Set();
    this.isConnecting = false;
    this.connectionState = 'disconnected';
  }

  /**
   * Initialize WebSocket connection
   * @param {string} url - WebSocket server URL
   * @param {Object} options - Connection options
   */
  connect(url, options = {}) {
    if (this.isConnecting || this.connectionState === 'connected') {
      console.warn('WebSocket already connected or connecting');
      return Promise.resolve();
    }

    this.url = url;
    this.isConnecting = true;
    this.connectionState = 'connecting';

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = (event) => {
          this.handleOpen(event, resolve);
        };

        this.ws.onclose = (event) => {
          this.handleClose(event);
        };

        this.ws.onerror = (event) => {
          this.handleError(event, reject);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.connectionState === 'connecting') {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, options.timeout || 10000);

      } catch (error) {
        this.isConnecting = false;
        this.connectionState = 'error';
        reject(error);
      }
    });
  }

  /**
   * Handle successful connection
   */
  handleOpen(event, resolve) {
    console.log('WebSocket connected successfully');
    this.isConnecting = false;
    this.connectionState = 'connected';
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;

    // Start heartbeat
    this.startHeartbeat();

    // Rejoin rooms
    this.rejoinRooms();

    // Flush message queue
    this.flushMessageQueue();

    // Notify subscribers
    this.emit('connection', { status: 'connected', event });

    resolve();
  }

  /**
   * Handle connection close
   */
  handleClose(event) {
    console.log('WebSocket connection closed', event.code, event.reason);
    this.connectionState = 'disconnected';
    this.isConnecting = false;

    // Stop heartbeat
    this.stopHeartbeat();

    // Notify subscribers
    this.emit('connection', { status: 'disconnected', code: event.code, reason: event.reason });

    // Attempt reconnection if not intentional close
    if (event.code !== 1000 && event.code !== 1001) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle connection error
   */
  handleError(event, reject) {
    console.error('WebSocket error:', event);
    this.connectionState = 'error';
    this.emit('error', { error: event });

    if (reject) {
      reject(new Error('WebSocket connection failed'));
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);

      // Handle heartbeat response
      if (data.type === 'pong') {
        this.handlePong();
        return;
      }

      // Handle system messages
      if (data.type === 'system') {
        this.handleSystemMessage(data);
        return;
      }

      // Emit to subscribers
      this.emit(data.type || 'message', data);

      // Room-specific emission
      if (data.room) {
        this.emit(`room:${data.room}`, data);
      }

    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('message', { raw: event.data });
    }
  }

  /**
   * Send message through WebSocket
   * @param {string} type - Message type
   * @param {Object} payload - Message payload
   * @param {Object} options - Send options
   */
  send(type, payload = {}, options = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateMessageId()
    };

    if (this.connectionState !== 'connected') {
      if (options.queue !== false) {
        this.messageQueue.push(message);
        console.log('Message queued for later delivery');
      }
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      if (options.queue !== false) {
        this.messageQueue.push(message);
      }
      return false;
    }
  }

  /**
   * Subscribe to events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Emit event to subscribers
   */
  emit(event, data) {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in subscriber callback for ${event}:`, error);
        }
      });
    }

    // Also emit to wildcard subscribers
    const wildcardCallbacks = this.subscribers.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback({ event, data });
        } catch (error) {
          console.error('Error in wildcard subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Join a room for targeted messaging
   * @param {string} roomId - Room identifier
   */
  joinRoom(roomId) {
    this.rooms.add(roomId);
    this.send('room:join', { roomId });
  }

  /**
   * Leave a room
   * @param {string} roomId - Room identifier
   */
  leaveRoom(roomId) {
    this.rooms.delete(roomId);
    this.send('room:leave', { roomId });
  }

  /**
   * Rejoin all rooms after reconnection
   */
  rejoinRooms() {
    this.rooms.forEach(roomId => {
      this.send('room:join', { roomId }, { queue: false });
    });
  }

  /**
   * Start heartbeat mechanism
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState === 'connected') {
        this.send('ping', {}, { queue: false });

        // Set timeout for pong response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be dead');
          this.ws.close();
        }, 5000);
      }
    }, 30000);
  }

  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Handle pong response
   */
  handlePong() {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  /**
   * Handle system messages
   */
  handleSystemMessage(data) {
    switch (data.action) {
      case 'notification':
        this.emit('notification', data.payload);
        break;
      case 'broadcast':
        this.emit('broadcast', data.payload);
        break;
      case 'force_disconnect':
        console.warn('Server requested disconnect:', data.reason);
        this.disconnect();
        break;
      default:
        this.emit('system', data);
    }
  }

  /**
   * Attempt reconnection with exponential backoff
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('reconnect_failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      if (this.connectionState !== 'connected') {
        this.connect(this.url).catch(error => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }

  /**
   * Flush queued messages
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.connectionState === 'connected') {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Failed to send queued message:', error);
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  /**
   * Generate unique message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    this.stopHeartbeat();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection

    if (this.ws) {
      this.ws.close(1000, 'Client initiated disconnect');
    }

    this.connectionState = 'disconnected';
    this.emit('connection', { status: 'disconnected', reason: 'client_initiated' });
  }

  /**
   * Get current connection state
   */
  getState() {
    return {
      connectionState: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      rooms: Array.from(this.rooms)
    };
  }
}

// Notification Manager for handling different notification types
class NotificationManager {
  constructor(wsService) {
    this.wsService = wsService;
    this.notifications = [];
    this.maxNotifications = 100;
    this.handlers = new Map();

    this.setupListeners();
  }

  setupListeners() {
    this.wsService.subscribe('notification', (data) => {
      this.handleNotification(data);
    });

    this.wsService.subscribe('broadcast', (data) => {
      this.handleBroadcast(data);
    });
  }

  handleNotification(data) {
    const notification = {
      id: data.id || `notif_${Date.now()}`,
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      timestamp: data.timestamp || Date.now(),
      read: false,
      data: data.payload
    };

    this.notifications.unshift(notification);

    // Trim old notifications
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Call type-specific handler
    const handler = this.handlers.get(notification.type);
    if (handler) {
      handler(notification);
    }

    // Emit event for UI updates
    this.wsService.emit('notification:received', notification);
  }

  handleBroadcast(data) {
    this.wsService.emit('broadcast:received', data);
  }

  registerHandler(type, handler) {
    this.handlers.set(type, handler);
  }

  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.wsService.emit('notification:read', notification);
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.wsService.emit('notifications:all_read', {});
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotifications(options = {}) {
    let result = [...this.notifications];

    if (options.unreadOnly) {
      result = result.filter(n => !n.read);
    }

    if (options.type) {
      result = result.filter(n => n.type === options.type);
    }

    if (options.limit) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

  clearNotifications() {
    this.notifications = [];
    this.wsService.emit('notifications:cleared', {});
  }
}

// Export singleton instance
const wsService = new WebSocketService();
const notificationManager = new NotificationManager(wsService);

export { wsService, notificationManager, WebSocketService, NotificationManager };
export default wsService;
