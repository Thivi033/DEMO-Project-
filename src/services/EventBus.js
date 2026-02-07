/**
 * Microservices Event Bus Architecture
 * PERF-36: Build distributed event bus for microservices communication
 *
 * Features:
 * - Pub/Sub messaging pattern
 * - Event sourcing support
 * - Dead letter queue handling
 * - Event replay capabilities
 * - Saga orchestration
 * - Circuit breaker pattern
 * - Distributed tracing
 */

const EventEmitter = require('events');

// Event Types
const EventTypes = {
  DOMAIN: 'domain',
  INTEGRATION: 'integration',
  COMMAND: 'command',
  QUERY: 'query',
  SAGA: 'saga',
  SYSTEM: 'system'
};

// Event Status
const EventStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
  DEAD_LETTER: 'dead_letter'
};

/**
 * Event class - represents a domain event
 */
class Event {
  constructor(type, payload, options = {}) {
    this.id = options.id || this.generateId();
    this.type = type;
    this.payload = payload;
    this.metadata = {
      timestamp: Date.now(),
      version: options.version || 1,
      correlationId: options.correlationId || this.id,
      causationId: options.causationId || null,
      source: options.source || 'unknown',
      userId: options.userId || null,
      traceId: options.traceId || this.generateTraceId(),
      spanId: this.generateSpanId(),
      ...options.metadata
    };
    this.status = EventStatus.PENDING;
    this.attempts = 0;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  generateId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  generateSpanId() {
    return `span_${Math.random().toString(36).substr(2, 8)}`;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      payload: this.payload,
      metadata: this.metadata,
      status: this.status,
      attempts: this.attempts
    };
  }

  static fromJSON(json) {
    const event = new Event(json.type, json.payload, {
      id: json.id,
      ...json.metadata
    });
    event.status = json.status;
    event.attempts = json.attempts;
    return event;
  }
}

/**
 * Event Store - persists events for event sourcing
 */
class EventStore {
  constructor(options = {}) {
    this.events = [];
    this.snapshots = new Map();
    this.maxEventsBeforeSnapshot = options.maxEventsBeforeSnapshot || 100;
    this.subscribers = new Map();
  }

  append(event) {
    const storedEvent = {
      ...event.toJSON(),
      storedAt: Date.now(),
      sequence: this.events.length
    };
    this.events.push(storedEvent);

    // Notify subscribers
    this.notifySubscribers(event);

    return storedEvent;
  }

  getEvents(aggregateId, options = {}) {
    let events = this.events.filter(e =>
      e.payload.aggregateId === aggregateId
    );

    if (options.fromSequence !== undefined) {
      events = events.filter(e => e.sequence >= options.fromSequence);
    }

    if (options.toSequence !== undefined) {
      events = events.filter(e => e.sequence <= options.toSequence);
    }

    if (options.eventTypes) {
      events = events.filter(e => options.eventTypes.includes(e.type));
    }

    return events;
  }

  getEventsByType(eventType, options = {}) {
    let events = this.events.filter(e => e.type === eventType);

    if (options.since) {
      events = events.filter(e => e.metadata.timestamp >= options.since);
    }

    if (options.limit) {
      events = events.slice(-options.limit);
    }

    return events;
  }

  saveSnapshot(aggregateId, state, version) {
    this.snapshots.set(aggregateId, {
      state,
      version,
      savedAt: Date.now()
    });
  }

  getSnapshot(aggregateId) {
    return this.snapshots.get(aggregateId);
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);

    return () => {
      this.subscribers.get(eventType)?.delete(callback);
    };
  }

  notifySubscribers(event) {
    const callbacks = this.subscribers.get(event.type) || new Set();
    const wildcardCallbacks = this.subscribers.get('*') || new Set();

    [...callbacks, ...wildcardCallbacks].forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Event store subscriber error:', error);
      }
    });
  }

  getEventCount() {
    return this.events.length;
  }

  clear() {
    this.events = [];
    this.snapshots.clear();
  }
}

/**
 * Dead Letter Queue - handles failed events
 */
class DeadLetterQueue {
  constructor(options = {}) {
    this.queue = [];
    this.maxSize = options.maxSize || 1000;
    this.handlers = new Map();
  }

  add(event, error) {
    const deadLetter = {
      event: event.toJSON(),
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      addedAt: Date.now(),
      retryCount: event.attempts
    };

    this.queue.push(deadLetter);

    if (this.queue.length > this.maxSize) {
      this.queue.shift(); // Remove oldest
    }

    // Notify handlers
    this.notifyHandlers(deadLetter);

    return deadLetter;
  }

  get(options = {}) {
    let items = [...this.queue];

    if (options.eventType) {
      items = items.filter(dl => dl.event.type === options.eventType);
    }

    if (options.since) {
      items = items.filter(dl => dl.addedAt >= options.since);
    }

    if (options.limit) {
      items = items.slice(0, options.limit);
    }

    return items;
  }

  retry(deadLetterId, eventBus) {
    const index = this.queue.findIndex(dl => dl.event.id === deadLetterId);
    if (index === -1) return false;

    const deadLetter = this.queue[index];
    const event = Event.fromJSON(deadLetter.event);
    event.status = EventStatus.RETRYING;
    event.attempts = 0; // Reset attempts

    this.queue.splice(index, 1);
    eventBus.publish(event);

    return true;
  }

  remove(deadLetterId) {
    const index = this.queue.findIndex(dl => dl.event.id === deadLetterId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  registerHandler(eventType, handler) {
    this.handlers.set(eventType, handler);
  }

  notifyHandlers(deadLetter) {
    const handler = this.handlers.get(deadLetter.event.type);
    if (handler) {
      handler(deadLetter);
    }

    const wildcardHandler = this.handlers.get('*');
    if (wildcardHandler) {
      wildcardHandler(deadLetter);
    }
  }

  getCount() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

/**
 * Circuit Breaker - prevents cascading failures
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.state = 'closed'; // closed, open, half-open
    this.failureCount = 0;
    this.successCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 3;
    this.timeout = options.timeout || 30000;
    this.resetTimer = null;
    this.lastFailure = null;
  }

  async execute(fn) {
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.close();
      }
    }
  }

  onFailure(error) {
    this.failureCount++;
    this.lastFailure = {
      error,
      timestamp: Date.now()
    };

    if (this.state === 'half-open') {
      this.open();
    } else if (this.failureCount >= this.failureThreshold) {
      this.open();
    }
  }

  open() {
    this.state = 'open';
    this.successCount = 0;

    this.resetTimer = setTimeout(() => {
      this.halfOpen();
    }, this.timeout);
  }

  halfOpen() {
    this.state = 'half-open';
    this.failureCount = 0;
    this.successCount = 0;
  }

  close() {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailure: this.lastFailure
    };
  }
}

/**
 * Saga - orchestrates distributed transactions
 */
class Saga {
  constructor(name, options = {}) {
    this.name = name;
    this.steps = [];
    this.compensations = [];
    this.currentStep = 0;
    this.state = 'pending'; // pending, running, completed, compensating, failed
    this.context = {};
    this.timeout = options.timeout || 60000;
  }

  addStep(execute, compensate) {
    this.steps.push({ execute, compensate });
    return this;
  }

  async run(initialContext = {}) {
    this.context = { ...initialContext };
    this.state = 'running';

    try {
      for (let i = 0; i < this.steps.length; i++) {
        this.currentStep = i;
        const step = this.steps[i];

        const result = await Promise.race([
          step.execute(this.context),
          this.createTimeout()
        ]);

        this.context = { ...this.context, ...result };
        this.compensations.unshift(step.compensate);
      }

      this.state = 'completed';
      return this.context;

    } catch (error) {
      console.error(`Saga ${this.name} failed at step ${this.currentStep}:`, error);
      await this.compensate();
      throw error;
    }
  }

  async compensate() {
    this.state = 'compensating';

    for (const compensation of this.compensations) {
      if (compensation) {
        try {
          await compensation(this.context);
        } catch (error) {
          console.error('Compensation failed:', error);
        }
      }
    }

    this.state = 'failed';
  }

  createTimeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Saga ${this.name} timed out`));
      }, this.timeout);
    });
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      currentStep: this.currentStep,
      totalSteps: this.steps.length
    };
  }
}

/**
 * Event Bus - main orchestrator for event-driven architecture
 */
class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.eventStore = new EventStore(options.eventStore);
    this.deadLetterQueue = new DeadLetterQueue(options.deadLetterQueue);
    this.circuitBreakers = new Map();
    this.handlers = new Map();
    this.middlewares = [];
    this.sagas = new Map();
    this.metrics = {
      published: 0,
      processed: 0,
      failed: 0,
      retried: 0
    };
  }

  // Middleware
  use(middleware) {
    this.middlewares.push(middleware);
    return this;
  }

  async applyMiddlewares(event) {
    let currentEvent = event;

    for (const middleware of this.middlewares) {
      currentEvent = await middleware(currentEvent);
      if (!currentEvent) {
        throw new Error('Middleware chain broken');
      }
    }

    return currentEvent;
  }

  // Handler Registration
  subscribe(eventType, handler, options = {}) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlerConfig = {
      handler,
      priority: options.priority || 0,
      filter: options.filter || null,
      circuitBreaker: options.circuitBreaker
        ? new CircuitBreaker(options.circuitBreaker)
        : null
    };

    this.handlers.get(eventType).push(handlerConfig);
    this.handlers.get(eventType).sort((a, b) => b.priority - a.priority);

    return () => this.unsubscribe(eventType, handler);
  }

  unsubscribe(eventType, handler) {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.findIndex(h => h.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Event Publishing
  async publish(event, options = {}) {
    if (!(event instanceof Event)) {
      event = new Event(event.type, event.payload, event);
    }

    try {
      // Apply middlewares
      event = await this.applyMiddlewares(event);

      // Store event
      if (options.persist !== false) {
        this.eventStore.append(event);
      }

      // Process event
      await this.process(event);

      this.metrics.published++;
      this.emit('event:published', event);

      return event;

    } catch (error) {
      this.metrics.failed++;
      this.emit('event:failed', { event, error });
      throw error;
    }
  }

  async publishBatch(events, options = {}) {
    const results = await Promise.allSettled(
      events.map(event => this.publish(event, options))
    );

    return results.map((result, index) => ({
      event: events[index],
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  // Event Processing
  async process(event) {
    event.status = EventStatus.PROCESSING;
    const handlers = this.handlers.get(event.type) || [];
    const wildcardHandlers = this.handlers.get('*') || [];

    const allHandlers = [...handlers, ...wildcardHandlers];

    for (const handlerConfig of allHandlers) {
      // Apply filter
      if (handlerConfig.filter && !handlerConfig.filter(event)) {
        continue;
      }

      try {
        // Execute with circuit breaker if configured
        if (handlerConfig.circuitBreaker) {
          await handlerConfig.circuitBreaker.execute(() =>
            this.executeHandler(handlerConfig.handler, event)
          );
        } else {
          await this.executeHandler(handlerConfig.handler, event);
        }

      } catch (error) {
        await this.handleProcessingError(event, error, handlerConfig);
      }
    }

    event.status = EventStatus.COMPLETED;
    this.metrics.processed++;
    this.emit('event:processed', event);
  }

  async executeHandler(handler, event) {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Handler timeout')), 30000);
    });

    return Promise.race([handler(event), timeout]);
  }

  async handleProcessingError(event, error, handlerConfig) {
    event.attempts++;

    if (event.attempts < event.maxRetries) {
      // Retry with exponential backoff
      event.status = EventStatus.RETRYING;
      this.metrics.retried++;

      await new Promise(resolve =>
        setTimeout(resolve, event.retryDelay * Math.pow(2, event.attempts - 1))
      );

      return this.executeHandler(handlerConfig.handler, event);
    }

    // Move to dead letter queue
    event.status = EventStatus.DEAD_LETTER;
    this.deadLetterQueue.add(event, error);
    this.emit('event:dead_letter', { event, error });
  }

  // Saga Management
  registerSaga(name, saga) {
    this.sagas.set(name, saga);
    return saga;
  }

  async executeSaga(name, context) {
    const saga = this.sagas.get(name);
    if (!saga) {
      throw new Error(`Saga "${name}" not found`);
    }

    return saga.run(context);
  }

  // Event Replay
  async replay(options = {}) {
    const events = this.eventStore.getEvents(options.aggregateId, {
      fromSequence: options.fromSequence,
      toSequence: options.toSequence,
      eventTypes: options.eventTypes
    });

    for (const storedEvent of events) {
      const event = Event.fromJSON(storedEvent);
      await this.process(event);
    }

    return events.length;
  }

  // Metrics
  getMetrics() {
    return {
      ...this.metrics,
      eventStoreCount: this.eventStore.getEventCount(),
      deadLetterCount: this.deadLetterQueue.getCount(),
      handlersCount: Array.from(this.handlers.values())
        .reduce((acc, h) => acc + h.length, 0)
    };
  }

  // Cleanup
  clear() {
    this.eventStore.clear();
    this.deadLetterQueue.clear();
    this.handlers.clear();
    this.middlewares = [];
    this.sagas.clear();
    this.metrics = {
      published: 0,
      processed: 0,
      failed: 0,
      retried: 0
    };
  }
}

// Create singleton instance
const eventBus = new EventBus();

module.exports = {
  eventBus,
  EventBus,
  Event,
  EventStore,
  DeadLetterQueue,
  CircuitBreaker,
  Saga,
  EventTypes,
  EventStatus
};
