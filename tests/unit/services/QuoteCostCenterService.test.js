const QuoteCostCenterService = require('../../../src/services/QuoteCostCenterService');
const CostCenter = require('../../../src/models/CostCenter');
const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');
const { 
  mockQuoteCostCenterSummaries, 
  mockDetailedCostCenter, 
  mockErrorResponses,
  mockEmptyResponse,
  mockPartialResponse
} = require('../../mocks/quoteCostCenterMocks');

describe('QuoteCostCenterService', () => {
  let service;
  let mockAxios;

  beforeEach(() => {
    // Create service with test configuration
    service = new QuoteCostCenterService({
      baseURL: 'https://api.test.simpro.com/api/v1.0/companies/0/',
      apiKey: 'test-api-key',
      retryAttempts: 2,
      retryDelay: 100,
      timeout: 5000
    });
    
    // Create axios mock
    mockAxios = new MockAdapter(service.apiClient);
  });

  afterEach(() => {
    mockAxios.reset();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create service with default configuration', () => {
      const defaultService = new QuoteCostCenterService();
      
      expect(defaultService.baseURL).toBe(process.env.SIMPRO_API_URL);
      expect(defaultService.apiKey).toBe(process.env.SIMPRO_API_KEY);
      expect(defaultService.retryAttempts).toBe(3);
      expect(defaultService.retryDelay).toBe(1000);
      expect(defaultService.timeout).toBe(30000);
    });

    it('should create service with custom configuration', () => {
      const config = {
        baseURL: 'https://custom.api.com/',
        apiKey: 'custom-key',
        retryAttempts: 5,
        retryDelay: 2000,
        timeout: 10000
      };
      
      const customService = new QuoteCostCenterService(config);
      
      expect(customService.baseURL).toBe(config.baseURL);
      expect(customService.apiKey).toBe(config.apiKey);
      expect(customService.retryAttempts).toBe(config.retryAttempts);
      expect(customService.retryDelay).toBe(config.retryDelay);
      expect(customService.timeout).toBe(config.timeout);
    });
  });

  describe('shouldRetry', () => {
    it('should retry on network errors', () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ECONNRESET';
      
      expect(service.shouldRetry(networkError)).toBe(true);
    });

    it('should retry on 500 server errors', () => {
      const serverError = new Error('Server Error');
      serverError.response = { status: 500 };
      
      expect(service.shouldRetry(serverError)).toBe(true);
    });

    it('should retry on 503 service unavailable', () => {
      const serviceUnavailable = new Error('Service Unavailable');
      serviceUnavailable.response = { status: 503 };
      
      expect(service.shouldRetry(serviceUnavailable)).toBe(true);
    });

    it('should retry on 429 rate limit', () => {
      const rateLimitError = new Error('Rate Limited');
      rateLimitError.response = { status: 429 };
      
      expect(service.shouldRetry(rateLimitError)).toBe(true);
    });

    it('should not retry on 404 not found', () => {
      const notFoundError = new Error('Not Found');
      notFoundError.response = { status: 404 };
      
      expect(service.shouldRetry(notFoundError)).toBe(false);
    });

    it('should not retry on 401 unauthorized', () => {
      const unauthorizedError = new Error('Unauthorized');
      unauthorizedError.response = { status: 401 };
      
      expect(service.shouldRetry(unauthorizedError)).toBe(false);
    });

    it('should not retry on 400 bad request', () => {
      const badRequestError = new Error('Bad Request');
      badRequestError.response = { status: 400 };
      
      expect(service.shouldRetry(badRequestError)).toBe(false);
    });
  });

  describe('calculateRetryDelay', () => {
    it('should calculate exponential backoff delays', () => {
      expect(service.calculateRetryDelay(1)).toBe(100); // 100 * 2^0
      expect(service.calculateRetryDelay(2)).toBe(200); // 100 * 2^1
      expect(service.calculateRetryDelay(3)).toBe(400); // 100 * 2^2
    });
  });

  describe('enrichError', () => {
    it('should enrich error with operation context', () => {
      const originalError = new Error('Original error');
      const enriched = service.enrichError(originalError, 'Test Operation');
      
      expect(enriched.message).toBe('Test Operation failed: Original error');
      expect(enriched.originalError).toBe(originalError);
      expect(enriched.operation).toBe('Test Operation');
      expect(enriched.timestamp).toBeDefined();
    });

    it('should include response data for HTTP errors', () => {
      const httpError = new Error('HTTP Error');
      httpError.response = {
        status: 404,
        statusText: 'Not Found',
        data: { error: 'Resource not found' }
      };
      
      const enriched = service.enrichError(httpError, 'HTTP Operation');
      
      expect(enriched.status).toBe(404);
      expect(enriched.statusText).toBe('Not Found');
      expect(enriched.responseData).toEqual({ error: 'Resource not found' });
    });
  });

  describe('fetchQuoteCostCenterSummaries', () => {
    it('should fetch summaries successfully', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries);
      
      const result = await service.fetchQuoteCostCenterSummaries();
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBeInstanceOf(CostCenter);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Labor Cost Center');
    });

    it('should handle query parameters', async () => {
      const params = { quoteId: 12345 };
      mockAxios.onGet('quoteCostCenters/', { params }).reply(200, mockQuoteCostCenterSummaries);
      
      const result = await service.fetchQuoteCostCenterSummaries(params);
      
      expect(result).toHaveLength(3);
      expect(mockAxios.history.get[0].params).toEqual(params);
    });

    it('should handle empty response', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, mockEmptyResponse);
      
      const result = await service.fetchQuoteCostCenterSummaries();
      
      expect(result).toHaveLength(0);
    });

    it('should throw error for null response', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, null);
      
      await expect(service.fetchQuoteCostCenterSummaries()).rejects.toThrow('No data received from API');
    });

    it('should throw error for non-array response', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, { data: 'not an array' });
      
      await expect(service.fetchQuoteCostCenterSummaries()).rejects.toThrow('Expected array response from API');
    });

    it('should retry on network error', async () => {
      mockAxios
        .onGet('quoteCostCenters/').networkErrorOnce()
        .onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries);
      
      const result = await service.fetchQuoteCostCenterSummaries();
      
      expect(result).toHaveLength(3);
      expect(mockAxios.history.get).toHaveLength(2);
    });

    it('should fail after max retries', async () => {
      mockAxios.onGet('quoteCostCenters/').networkError();
      
      await expect(service.fetchQuoteCostCenterSummaries()).rejects.toThrow();
      expect(mockAxios.history.get).toHaveLength(2); // Initial + 1 retry
    });
  });

  describe('fetchDetailedCostCenter', () => {
    const quoteId = 12345;
    const sectionId = 67890;

    it('should fetch detailed cost center successfully', async () => {
      mockAxios.onGet(`quotes/${quoteId}/sections/${sectionId}/costCenters/`)
        .reply(200, mockDetailedCostCenter);
      
      const result = await service.fetchDetailedCostCenter(quoteId, sectionId);
      
      expect(result).toBeInstanceOf(CostCenter);
      expect(result.id).toBe(1);
      expect(result.isDetailed()).toBe(true);
      expect(result.quote).toBeDefined();
    });

    it('should throw error for missing quoteId', async () => {
      await expect(service.fetchDetailedCostCenter(null, sectionId))
        .rejects.toThrow('Both quoteId and sectionId are required');
    });

    it('should throw error for missing sectionId', async () => {
      await expect(service.fetchDetailedCostCenter(quoteId, null))
        .rejects.toThrow('Both quoteId and sectionId are required');
    });

    it('should throw error for null response', async () => {
      mockAxios.onGet(`quotes/${quoteId}/sections/${sectionId}/costCenters/`)
        .reply(200, null);
      
      await expect(service.fetchDetailedCostCenter(quoteId, sectionId))
        .rejects.toThrow('No data received from detailed API');
    });

    it('should retry on server error', async () => {
      mockAxios
        .onGet(`quotes/${quoteId}/sections/${sectionId}/costCenters/`).replyOnce(500)
        .onGet(`quotes/${quoteId}/sections/${sectionId}/costCenters/`).reply(200, mockDetailedCostCenter);
      
      const result = await service.fetchDetailedCostCenter(quoteId, sectionId);
      
      expect(result).toBeInstanceOf(CostCenter);
      expect(mockAxios.history.get).toHaveLength(2);
    });
  });

  describe('fetchCompleteQuoteCostCenters', () => {
    it('should fetch complete workflow successfully', async () => {
      // Mock summaries call
      mockAxios.onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries);
      
      // Mock detailed calls for each summary
      mockQuoteCostCenterSummaries.forEach((summary) => {
        mockAxios.onGet(`quotes/${summary.QuoteID}/sections/${summary.SectionID}/costCenters/`)
          .reply(200, { ...mockDetailedCostCenter, ID: summary.ID });
      });
      
      const result = await service.fetchCompleteQuoteCostCenters();
      
      expect(result).toHaveLength(3);
      expect(result.every(cc => cc.isDetailed())).toBe(true);
    });

    it('should handle empty summaries', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, []);
      
      const result = await service.fetchCompleteQuoteCostCenters();
      
      expect(result).toHaveLength(0);
    });

    it('should fallback to summary if detailed fetch fails', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries.slice(0, 1));
      
      // Mock detailed call to fail
      mockAxios.onGet(`quotes/${mockQuoteCostCenterSummaries[0].QuoteID}/sections/${mockQuoteCostCenterSummaries[0].SectionID}/costCenters/`)
        .reply(404, mockErrorResponses.invalidQuoteId);
      
      const result = await service.fetchCompleteQuoteCostCenters();
      
      expect(result).toHaveLength(1);
      expect(result[0].isDetailed()).toBe(false); // Fallback to summary
    });

    it('should handle mixed success and failure', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries.slice(0, 2));
      
      // First detailed call succeeds
      mockAxios.onGet(`quotes/${mockQuoteCostCenterSummaries[0].QuoteID}/sections/${mockQuoteCostCenterSummaries[0].SectionID}/costCenters/`)
        .reply(200, mockDetailedCostCenter);
      
      // Second detailed call fails
      mockAxios.onGet(`quotes/${mockQuoteCostCenterSummaries[1].QuoteID}/sections/${mockQuoteCostCenterSummaries[1].SectionID}/costCenters/`)
        .reply(404);
      
      const result = await service.fetchCompleteQuoteCostCenters();
      
      expect(result).toHaveLength(2);
      expect(result[0].isDetailed()).toBe(true);
      expect(result[1].isDetailed()).toBe(false);
    });
  });

  describe('fetchCostCentersForQuote', () => {
    it('should fetch cost centers for specific quote', async () => {
      const targetQuoteId = 12345;
      
      mockAxios.onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries);
      
      // Mock detailed calls
      mockQuoteCostCenterSummaries.forEach((summary) => {
        mockAxios.onGet(`quotes/${summary.QuoteID}/sections/${summary.SectionID}/costCenters/`)
          .reply(200, { ...mockDetailedCostCenter, ID: summary.ID, QuoteID: summary.QuoteID });
      });
      
      const result = await service.fetchCostCentersForQuote(targetQuoteId);
      
      // Should only return cost centers for the specified quote
      expect(result.every(cc => cc.quoteId === targetQuoteId)).toBe(true);
    });

    it('should throw error for missing quoteId', async () => {
      await expect(service.fetchCostCentersForQuote(null))
        .rejects.toThrow('Quote ID is required');
    });
  });

  describe('thread safety', () => {
    it('should handle concurrent requests with same parameters', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries);
      
      // Start multiple concurrent requests with same parameters
      const promises = [
        service.fetchQuoteCostCenterSummaries(),
        service.fetchQuoteCostCenterSummaries(),
        service.fetchQuoteCostCenterSummaries()
      ];
      
      const results = await Promise.all(promises);
      
      // Should only make one actual API call due to thread safety
      expect(mockAxios.history.get).toHaveLength(1);
      
      // All results should be identical
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
    });

    it('should handle concurrent requests with different parameters', async () => {
      mockAxios.onGet('quoteCostCenters/').reply(200, mockQuoteCostCenterSummaries);
      
      // Start concurrent requests with different parameters
      const promises = [
        service.fetchQuoteCostCenterSummaries({ quoteId: 1 }),
        service.fetchQuoteCostCenterSummaries({ quoteId: 2 }),
        service.fetchQuoteCostCenterSummaries({ quoteId: 3 })
      ];
      
      await Promise.all(promises);
      
      // Should make separate API calls for different parameters
      expect(mockAxios.history.get).toHaveLength(3);
    });
  });

  describe('getHealthStatus', () => {
    it('should return health status', () => {
      const status = service.getHealthStatus();
      
      expect(status).toEqual({
        baseURL: service.baseURL,
        hasApiKey: true,
        activeRequests: 0,
        configuration: {
          retryAttempts: 2,
          retryDelay: 100,
          timeout: 5000
        }
      });
    });

    it('should indicate missing API key', () => {
      const serviceWithoutKey = new QuoteCostCenterService({ apiKey: null });
      const status = serviceWithoutKey.getHealthStatus();
      
      expect(status.hasApiKey).toBe(false);
    });
  });

  describe('executeConcurrentlyWithLimit', () => {
    it('should execute promises with concurrency limit', async () => {
      const promises = [1, 2, 3, 4, 5].map(i => 
        Promise.resolve(`result-${i}`)
      );
      
      const results = await service.executeConcurrentlyWithLimit(promises, 2);
      
      expect(results).toHaveLength(5);
      expect(results).toEqual(['result-1', 'result-2', 'result-3', 'result-4', 'result-5']);
    });

    it('should handle promise rejections gracefully', async () => {
      const promises = [
        Promise.resolve('success-1'),
        Promise.reject(new Error('error-1')),
        Promise.resolve('success-2'),
        Promise.reject(new Error('error-2'))
      ];
      
      const results = await service.executeConcurrentlyWithLimit(promises, 2);
      
      expect(results).toEqual(['success-1', 'success-2']);
    });
  });
});