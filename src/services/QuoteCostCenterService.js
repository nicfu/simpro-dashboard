const axios = require('axios');
const CostCenter = require('../models/CostCenter');

/**
 * Service for handling Quote Cost Center API operations
 * Implements two-step API calls with error handling and retry logic
 */
class QuoteCostCenterService {
  constructor(apiConfig = {}) {
    this.baseURL = apiConfig.baseURL || process.env.SIMPRO_API_URL;
    this.apiKey = apiConfig.apiKey || process.env.SIMPRO_API_KEY;
    this.retryAttempts = apiConfig.retryAttempts || 3;
    this.retryDelay = apiConfig.retryDelay || 1000;
    this.timeout = apiConfig.timeout || 30000;
    
    // Create axios instance with default configuration
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // Set up request/response interceptors
    this.setupInterceptors();
    
    // Thread safety tracking
    this.activeRequests = new Map();
    this.requestCounter = 0;
  }

  /**
   * Set up axios interceptors for logging and error handling
   */
  setupInterceptors() {
    // Request interceptor
    this.apiClient.interceptors.request.use(
      (config) => {
        const requestId = ++this.requestCounter;
        config.metadata = { requestId, startTime: Date.now() };
        
        console.log(`[${requestId}] API Request: ${config.method?.toUpperCase()} ${config.url}`);
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.apiClient.interceptors.response.use(
      (response) => {
        const { requestId, startTime } = response.config.metadata || {};
        const duration = Date.now() - startTime;
        
        console.log(`[${requestId}] API Response: ${response.status} (${duration}ms)`);
        
        return response;
      },
      (error) => {
        const { requestId, startTime } = error.config?.metadata || {};
        const duration = Date.now() - startTime;
        
        console.error(`[${requestId}] API Error: ${error.response?.status || 'Network Error'} (${duration}ms)`);
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Execute API call with retry logic
   * @param {Function} apiCall - The API call function
   * @param {string} operationName - Name for logging
   * @param {number} attempt - Current attempt number
   * @returns {Promise} - API response
   */
  async executeWithRetry(apiCall, operationName, attempt = 1) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        const delay = this.calculateRetryDelay(attempt);
        console.warn(`${operationName} failed (attempt ${attempt}/${this.retryAttempts}), retrying in ${delay}ms...`);
        
        await this.delay(delay);
        return this.executeWithRetry(apiCall, operationName, attempt + 1);
      }
      
      throw this.enrichError(error, operationName);
    }
  }

  /**
   * Determine if error should trigger a retry
   * @param {Error} error - The error to check
   * @returns {boolean} - True if should retry
   */
  shouldRetry(error) {
    if (!error.response) {
      // Network errors should be retried
      return true;
    }
    
    const status = error.response.status;
    
    // Retry on server errors and rate limiting
    return status >= 500 || status === 429;
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number
   * @returns {number} - Delay in milliseconds
   */
  calculateRetryDelay(attempt) {
    return this.retryDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Add delay for retry logic
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} - Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enrich error with additional context
   * @param {Error} error - Original error
   * @param {string} operation - Operation name
   * @returns {Error} - Enriched error
   */
  enrichError(error, operation) {
    const enrichedError = new Error(`${operation} failed: ${error.message}`);
    enrichedError.originalError = error;
    enrichedError.operation = operation;
    enrichedError.timestamp = new Date().toISOString();
    
    if (error.response) {
      enrichedError.status = error.response.status;
      enrichedError.statusText = error.response.statusText;
      enrichedError.responseData = error.response.data;
    }
    
    return enrichedError;
  }

  /**
   * Generate a unique request key for thread safety
   * @param {string} operation - Operation name
   * @param {Object} params - Request parameters
   * @returns {string} - Unique key
   */
  generateRequestKey(operation, params = {}) {
    const paramsStr = JSON.stringify(params);
    return `${operation}_${Buffer.from(paramsStr).toString('base64')}`;
  }

  /**
   * Execute thread-safe operation
   * @param {string} key - Unique operation key
   * @param {Function} operation - Operation to execute
   * @returns {Promise} - Operation result
   */
  async executeThreadSafe(key, operation) {
    // Check if same operation is already in progress
    if (this.activeRequests.has(key)) {
      console.log(`Thread-safe: Waiting for existing operation: ${key}`);
      return this.activeRequests.get(key);
    }
    
    // Start new operation
    const promise = operation();
    this.activeRequests.set(key, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up
      this.activeRequests.delete(key);
    }
  }

  /**
   * Step 1: Fetch quote cost center summaries
   * @param {Object} params - Query parameters
   * @returns {Promise<Array<CostCenter>>} - Array of cost center summaries
   */
  async fetchQuoteCostCenterSummaries(params = {}) {
    const requestKey = this.generateRequestKey('summaries', params);
    
    return this.executeThreadSafe(requestKey, async () => {
      const apiCall = async () => {
        const response = await this.apiClient.get('quoteCostCenters/', { params });
        
        if (!response.data) {
          throw new Error('No data received from API');
        }
        
        if (!Array.isArray(response.data)) {
          throw new Error('Expected array response from API');
        }
        
        return response.data;
      };
      
      const data = await this.executeWithRetry(apiCall, 'Fetch Quote Cost Center Summaries');
      
      // Validate and convert to model instances
      return CostCenter.fromAPIResponseArray(data);
    });
  }

  /**
   * Step 2: Fetch detailed cost center information
   * @param {number} quoteId - Quote ID
   * @param {number} sectionId - Section ID
   * @returns {Promise<CostCenter>} - Detailed cost center data
   */
  async fetchDetailedCostCenter(quoteId, sectionId) {
    if (!quoteId || !sectionId) {
      throw new Error('Both quoteId and sectionId are required');
    }
    
    const requestKey = this.generateRequestKey('detailed', { quoteId, sectionId });
    
    return this.executeThreadSafe(requestKey, async () => {
      const apiCall = async () => {
        const url = `quotes/${quoteId}/sections/${sectionId}/costCenters/`;
        const response = await this.apiClient.get(url);
        
        if (!response.data) {
          throw new Error('No data received from detailed API');
        }
        
        return response.data;
      };
      
      const data = await this.executeWithRetry(apiCall, 'Fetch Detailed Cost Center');
      
      // Validate and convert to model instance
      CostCenter.validateAPIResponse(data);
      return CostCenter.fromAPIResponse(data);
    });
  }

  /**
   * Complete workflow: Fetch summaries then detailed data for each
   * @param {Object} params - Query parameters for summaries
   * @returns {Promise<Array<CostCenter>>} - Array of detailed cost centers
   */
  async fetchCompleteQuoteCostCenters(params = {}) {
    try {
      console.log('Starting complete quote cost centers fetch workflow...');
      
      // Step 1: Get summaries
      const summaries = await this.fetchQuoteCostCenterSummaries(params);
      
      if (summaries.length === 0) {
        console.log('No cost center summaries found');
        return [];
      }
      
      console.log(`Found ${summaries.length} cost center summaries, fetching detailed data...`);
      
      // Step 2: Get detailed data for each summary
      const detailedPromises = summaries.map(async (summary) => {
        try {
          return await this.fetchDetailedCostCenter(summary.quoteId, summary.sectionId);
        } catch (error) {
          console.error(`Failed to fetch detailed data for cost center ${summary.id}:`, error.message);
          // Return summary if detailed fetch fails
          return summary;
        }
      });
      
      // Execute all detailed fetches concurrently but with controlled concurrency
      const detailed = await this.executeConcurrentlyWithLimit(detailedPromises, 5);
      
      console.log(`Successfully fetched detailed data for ${detailed.length} cost centers`);
      return detailed;
      
    } catch (error) {
      console.error('Complete workflow failed:', error);
      throw this.enrichError(error, 'Complete Quote Cost Centers Workflow');
    }
  }

  /**
   * Execute promises concurrently with a limit
   * @param {Array<Promise>} promises - Array of promises
   * @param {number} limit - Concurrency limit
   * @returns {Promise<Array>} - Results array
   */
  async executeConcurrentlyWithLimit(promises, limit = 5) {
    const results = [];
    
    for (let i = 0; i < promises.length; i += limit) {
      const batch = promises.slice(i, i + limit);
      const batchResults = await Promise.allSettled(batch);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch item ${i + index} failed:`, result.reason);
          // Could push null or default value depending on requirements
        }
      });
    }
    
    return results.filter(result => result !== null);
  }

  /**
   * Fetch cost centers for a specific quote
   * @param {number} quoteId - Quote ID
   * @returns {Promise<Array<CostCenter>>} - Cost centers for the quote
   */
  async fetchCostCentersForQuote(quoteId) {
    if (!quoteId) {
      throw new Error('Quote ID is required');
    }
    
    const params = { quoteId };
    const allCostCenters = await this.fetchCompleteQuoteCostCenters(params);
    
    return allCostCenters.filter(cc => cc.quoteId === quoteId);
  }

  /**
   * Get service health status
   * @returns {Object} - Health status
   */
  getHealthStatus() {
    return {
      baseURL: this.baseURL,
      hasApiKey: !!this.apiKey,
      activeRequests: this.activeRequests.size,
      configuration: {
        retryAttempts: this.retryAttempts,
        retryDelay: this.retryDelay,
        timeout: this.timeout
      }
    };
  }
}

module.exports = QuoteCostCenterService;