// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock environment variables for testing
process.env.SIMPRO_API_KEY = 'test-api-key';
process.env.SIMPRO_API_URL = 'https://api.test.simpro.com/api/v1.0/companies/0/';
process.env.NODE_ENV = 'test';
process.env.NO_PROXY = '*';

// Global test timeout
jest.setTimeout(30000);

// Setup global mocks
global.console = {
  ...console,
  // Suppress console.log in tests unless needed
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};