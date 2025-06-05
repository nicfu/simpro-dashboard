# Quote Cost Centers API Integration

## Overview

This document describes the comprehensive test suite and implementation for the Quote Cost Centers API integration. The implementation follows a two-step API call process to fetch both summary and detailed cost center information.

## API Endpoints

### 1. Legacy Endpoint (Backward Compatibility)
```
GET /api/quote-cost-centers
```
Simple cost centers endpoint for backward compatibility.

### 2. Summary Endpoint (Step 1)
```
GET /api/quote-cost-centers/summaries
```
Fetches quote cost center summaries from `/api/v1.0/companies/0/quoteCostCenters/`

**Query Parameters:**
- `quoteId` (optional): Filter by specific quote ID
- Additional filter parameters as supported by the API

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ID": 1,
      "QuoteID": 12345,
      "SectionID": 67890,
      "Name": "Labor Cost Center",
      "Description": "Labor costs for main construction",
      "Type": "Labor",
      "Status": "Active",
      "DateCreated": "2024-01-15T08:30:00.000Z",
      "DateModified": "2024-01-20T14:45:30.123Z",
      "Total": {
        "ExTax": 15000.00,
        "IncTax": 16500.00,
        "Tax": 1500.00
      }
    }
  ],
  "count": 1,
  "metadata": {
    "endpoint": "summaries",
    "params": {}
  }
}
```

### 3. Detailed Endpoint (Step 2)
```
GET /api/quote-cost-centers/detailed/:quoteId/:sectionId
```
Fetches detailed cost center information using extracted quoteID and sectionID values via `/api/v1.0/companies/0/quotes/{quoteID}/sections/{sectionID}/costCenters/`

**Path Parameters:**
- `quoteId` (required): Quote ID from summary data
- `sectionId` (required): Section ID from summary data

**Response:**
```json
{
  "success": true,
  "data": {
    "ID": 1,
    "QuoteID": 12345,
    "SectionID": 67890,
    "Name": "Labor Cost Center",
    "Quote": {
      "ID": 12345,
      "Name": "Office Building Renovation",
      "Customer": { ... },
      "Site": { ... },
      "Status": { ... }
    },
    "Section": {
      "ID": 67890,
      "Name": "Phase 1 - Demolition and Preparation",
      "Total": { ... }
    },
    "CostCenter": {
      "Categories": [...],
      "TotalHours": 248,
      "Margin": { ... }
    }
  }
}
```

### 4. Complete Workflow Endpoint
```
GET /api/quote-cost-centers/complete
```
Executes the full two-step workflow: fetches summaries then detailed data for each summary.

**Features:**
- Automatic fallback to summary data if detailed fetch fails
- Concurrent processing with configurable limits
- Comprehensive error handling
- Thread-safe operations

### 5. Quote-Specific Endpoint
```
GET /api/quote-cost-centers/quote/:quoteId
```
Fetches all cost centers for a specific quote.

### 6. Service Health Check
```
GET /api/quote-cost-centers/health
```
Returns service health status and configuration.

## Data Models

### Total
Represents financial totals with validation:
```javascript
{
  exTax: Number,    // Amount excluding tax
  incTax: Number,   // Amount including tax  
  tax: Number       // Tax amount
}
```
- Validates that `exTax + tax = incTax` (within 1 cent tolerance)
- Rounds amounts to 2 decimal places
- Provides currency formatting and percentage calculations

### CostCenter
Main cost center entity:
```javascript
{
  id: Number,
  quoteId: Number,
  sectionId: Number,
  name: String,
  description: String,
  type: String,
  status: String,
  dateCreated: Date,
  dateModified: Date,
  total: Total,
  quote: Object,     // Present in detailed data
  section: Object,   // Present in detailed data
  costCenter: Object // Present in detailed data
}
```

### Quote
Quote information included in detailed cost center data:
```javascript
{
  id: Number,
  name: String,
  customer: Object,
  site: Object,
  status: Object,
  salesperson: Object,
  projectManager: Object,
  total: Total,
  dateIssued: Date,
  dateApproved: Date,
  dueDate: Date
}
```

### Section
Section information included in detailed cost center data:
```javascript
{
  id: Number,
  name: String,
  description: String,
  order: Number,
  status: String,
  dateCreated: Date,
  dateModified: Date,
  total: Total
}
```

## Service Architecture

### QuoteCostCenterService
The main service class that handles:
- Two-step API call orchestration
- Error handling with exponential backoff retry logic
- Thread-safe concurrent operations
- Request deduplication
- Response validation and model conversion

**Key Features:**
- Configurable retry attempts (default: 3)
- Exponential backoff delay (default: 1000ms base)
- Request timeout handling (default: 30s)
- Automatic fallback to summary data on detailed fetch failure
- Controlled concurrency limits for batch operations

## Error Handling

The implementation includes comprehensive error handling for:

### Network Errors
- Connection timeouts
- DNS resolution failures
- Network connectivity issues
- Automatic retry with exponential backoff

### API Errors
- 401 Unauthorized (invalid API key)
- 404 Not Found (invalid quote/section IDs)
- 429 Rate Limit Exceeded
- 500 Server Errors
- Malformed JSON responses

### Data Validation Errors
- Missing required fields
- Invalid data types
- Inconsistent financial totals
- Invalid date formats

### Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "operation": "Operation that failed",
  "timestamp": "2024-01-15T08:30:00.000Z",
  "status": 500,
  "statusText": "Internal Server Error"
}
```

## Date Handling

All dates are handled using ISO 8601 format:
- Input: Accepts various date formats
- Storage: JavaScript Date objects
- Output: ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- Validation: Graceful handling of invalid dates (returns null)

## Testing

### Test Coverage
The implementation includes comprehensive test coverage:

#### Unit Tests
- **Total Model**: 15 tests covering validation, formatting, and calculations
- **CostCenter Model**: 25 tests covering construction, validation, and serialization  
- **Quote Model**: 35 tests covering date parsing, status handling, and validation
- **Section Model**: 25 tests covering validation and data integrity
- **QuoteCostCenterService**: 35 tests covering API calls, error handling, and concurrency

#### Integration Tests
- **API Endpoints**: 20+ tests covering complete workflow scenarios
- **Error Scenarios**: Network failures, invalid IDs, malformed responses
- **Performance Tests**: Concurrent requests, large datasets
- **Date Validation**: ISO 8601 parsing and formatting
- **Financial Data**: Total object structure and validation

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch
```

### Test Configuration
- Test environment variables in `.env.test`
- Mock data in `tests/mocks/quoteCostCenterMocks.js`
- Test setup in `tests/setup.js`
- Axios mocking with `axios-mock-adapter`
- API mocking with `nock` for integration tests

## Performance Considerations

### Concurrency Control
- Configurable concurrency limits for batch operations
- Thread-safe request deduplication
- Automatic batching for large datasets

### Caching Strategy
- Request-level caching for identical parameters
- Automatic cleanup of completed requests
- Memory-efficient operation tracking

### Error Recovery
- Graceful degradation (fallback to summary data)
- Partial success handling for batch operations
- Configurable retry strategies

## Configuration

### Environment Variables
```bash
SIMPRO_API_URL=https://api.simpro.com/api/v1.0/companies/0/
SIMPRO_API_KEY=your-api-key-here
NODE_ENV=production
```

### Service Configuration
```javascript
const service = new QuoteCostCenterService({
  baseURL: 'https://api.simpro.com/api/v1.0/companies/0/',
  apiKey: 'your-api-key',
  retryAttempts: 3,
  retryDelay: 1000,
  timeout: 30000
});
```

## Usage Examples

### Fetch Complete Data
```javascript
// Get all cost centers with detailed information
const response = await fetch('/api/quote-cost-centers/complete');
const { data } = await response.json();

data.forEach(costCenter => {
  console.log(`Cost Center: ${costCenter.Name}`);
  if (costCenter.Quote) {
    console.log(`Quote: ${costCenter.Quote.Name}`);
    console.log(`Customer: ${costCenter.Quote.Customer.CompanyName}`);
  }
});
```

### Fetch Quote-Specific Data
```javascript
// Get cost centers for a specific quote
const quoteId = 12345;
const response = await fetch(`/api/quote-cost-centers/quote/${quoteId}`);
const { data } = await response.json();

console.log(`Found ${data.length} cost centers for quote ${quoteId}`);
```

### Progressive Data Loading
```javascript
// Step 1: Get summaries
const summariesResponse = await fetch('/api/quote-cost-centers/summaries');
const { data: summaries } = await summariesResponse.json();

// Step 2: Get detailed data for each summary
for (const summary of summaries) {
  const detailedResponse = await fetch(
    `/api/quote-cost-centers/detailed/${summary.QuoteID}/${summary.SectionID}`
  );
  const { data: detailed } = await detailedResponse.json();
  
  // Process detailed data
  console.log('Detailed cost center:', detailed);
}
```

## Backward Compatibility

The implementation maintains backward compatibility with the existing API:
- Legacy `/api/quote-cost-centers` endpoint unchanged
- Existing frontend code continues to work
- New endpoints available for enhanced functionality
- Gradual migration path available

## Future Enhancements

Potential improvements for future versions:
1. WebSocket support for real-time updates
2. GraphQL endpoint for flexible data fetching
3. Caching layer (Redis) for improved performance
4. Rate limiting and request queuing
5. Metrics and monitoring integration
6. Database persistence for offline capability