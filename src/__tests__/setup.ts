// Test setup file
import 'jest';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock crypto for Web Crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(16)),
      generateKey: jest.fn().mockResolvedValue({}),
    }
  }
});

// Mock btoa for base64 encoding
global.btoa = jest.fn((str) => Buffer.from(str).toString('base64'));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});

// Export mock fetch for use in tests
export { mockFetch };
