/**
 * Jest Test Setup
 * Configures mocks and test environment to avoid circular reference issues
 */

// Mock WebSocket to avoid circular reference issues in Jest
// Only mock for server-side tests, allow real WebSocket for client tests
if (typeof window === 'undefined') {
  jest.mock('ws', () => ({
    WebSocketServer: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
      clients: new Set(),
      handleUpgrade: jest.fn(),
      emit: jest.fn()
    })),
    WebSocket: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      readyState: 1, // OPEN
      emit: jest.fn(),
      removeListener: jest.fn()
    }))
  }));
}

// Mock server response objects to prevent circular references
jest.mock('http', () => {
  const originalHttp = jest.requireActual('http');
  return {
    ...originalHttp,
    createServer: jest.fn().mockImplementation(() => ({
      listen: jest.fn((port, callback) => {
        if (callback) callback();
      }),
      close: jest.fn((callback) => {
        if (callback) callback();
      }),
      on: jest.fn(),
      emit: jest.fn(),
      address: jest.fn(() => ({ port: 3000 }))
    }))
  };
});

// Increase test timeout for longer running tests
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  mockWebSocketConnection: () => ({
    readyState: 1,
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    removeListener: jest.fn(),
    id: `test_${Math.random().toString(36).substr(2, 9)}`
  }),

  mockExpressResponse: () => ({
    json: jest.fn(),
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    end: jest.fn(),
    setHeader: jest.fn(),
    locals: {}
  }),

  mockExpressRequest: (overrides = {}) => ({
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides
  })
};