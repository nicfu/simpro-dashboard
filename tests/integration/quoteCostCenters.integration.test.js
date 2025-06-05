const request = require('supertest');
const nock = require('nock');
const app = require('../../server');
const { 
  mockQuoteCostCenterSummaries, 
  mockDetailedCostCenter, 
  mockErrorResponses 
} = require('../mocks/quoteCostCenterMocks');

describe('Quote Cost Centers Integration Tests', () => {
  let apiScope;
  const apiUrl = process.env.SIMPRO_API_URL;

  beforeEach(() => {
    // Mock the external API
    apiScope = nock(apiUrl);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('GET /api/quote-cost-centers', () => {
    it('should fetch quote cost centers successfully', async () => {
      // Mock the API response
      apiScope
        .get('/costCenters/')
        .reply(200, mockQuoteCostCenterSummaries);

      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.count).toBe(3);
      expect(response.body.data[0]).toHaveProperty('ID', 1);
      expect(response.body.data[0]).toHaveProperty('Name', 'Labor Cost Center');
    });

    it('should handle empty response', async () => {
      apiScope
        .get('/costCenters/')
        .reply(200, []);

      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should handle API errors', async () => {
      apiScope
        .get('/costCenters/')
        .reply(500, { message: 'Internal Server Error' });

      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle network timeouts', async () => {
      apiScope
        .get('/costCenters/')
        .delayConnection(31000) // Exceed timeout
        .reply(200, mockQuoteCostCenterSummaries);

      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    }, 45000); // Increase test timeout

    it('should handle unauthorized access', async () => {
      apiScope
        .get('/costCenters/')
        .reply(401, mockErrorResponses.unauthorizedAccess);

      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      apiScope
        .get('/costCenters/')
        .reply(429, mockErrorResponses.rateLimitExceeded);

      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle malformed JSON response', async () => {
      apiScope
        .get('/costCenters/')
        .reply(200, 'invalid json', { 'Content-Type': 'application/json' });

      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Two-step API workflow simulation', () => {
    it('should complete full workflow: summaries -> detailed data', async () => {
      // Step 1: Mock summaries endpoint
      apiScope
        .get('/quoteCostCenters/')
        .reply(200, mockQuoteCostCenterSummaries);

      // Step 2: Mock detailed endpoints for each summary
      mockQuoteCostCenterSummaries.forEach((summary) => {
        apiScope
          .get(`/quotes/${summary.QuoteID}/sections/${summary.SectionID}/costCenters/`)
          .reply(200, {
            ...mockDetailedCostCenter,
            ID: summary.ID,
            QuoteID: summary.QuoteID,
            SectionID: summary.SectionID
          });
      });

      // This would be a new endpoint we'll create for the complete workflow
      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      // Verify detailed data is present
      response.body.data.forEach(costCenter => {
        expect(costCenter).toHaveProperty('Quote');
        expect(costCenter).toHaveProperty('Section');
        expect(costCenter).toHaveProperty('CostCenter');
      });
    });

    it('should handle partial failures in detailed fetching', async () => {
      // Step 1: Mock summaries endpoint
      apiScope
        .get('/quoteCostCenters/')
        .reply(200, mockQuoteCostCenterSummaries.slice(0, 2));

      // Step 2: First detailed call succeeds, second fails
      apiScope
        .get(`/quotes/${mockQuoteCostCenterSummaries[0].QuoteID}/sections/${mockQuoteCostCenterSummaries[0].SectionID}/costCenters/`)
        .reply(200, mockDetailedCostCenter);

      apiScope
        .get(`/quotes/${mockQuoteCostCenterSummaries[1].QuoteID}/sections/${mockQuoteCostCenterSummaries[1].SectionID}/costCenters/`)
        .reply(404, mockErrorResponses.invalidSectionId);

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      // First should have detailed data, second should fallback to summary
      expect(response.body.data[0]).toHaveProperty('Quote');
      expect(response.body.data[1]).not.toHaveProperty('Quote');
    });

    it('should validate date parsing in complete workflow', async () => {
      const summariesWithDates = mockQuoteCostCenterSummaries.map(summary => ({
        ...summary,
        DateCreated: '2024-01-15T08:30:00.000Z',
        DateModified: '2024-01-20T14:45:30.123Z'
      }));

      apiScope
        .get('/quoteCostCenters/')
        .reply(200, summariesWithDates);

      summariesWithDates.forEach((summary) => {
        apiScope
          .get(`/quotes/${summary.QuoteID}/sections/${summary.SectionID}/costCenters/`)
          .reply(200, {
            ...mockDetailedCostCenter,
            ID: summary.ID,
            DateCreated: summary.DateCreated,
            DateModified: summary.DateModified
          });
      });

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify ISO 8601 date formats are preserved
      response.body.data.forEach(costCenter => {
        expect(costCenter.DateCreated).toBe('2024-01-15T08:30:00.000Z');
        expect(costCenter.DateModified).toBe('2024-01-20T14:45:30.123Z');
      });
    });

    it('should validate Total object structure in complete workflow', async () => {
      apiScope
        .get('/quoteCostCenters/')
        .reply(200, mockQuoteCostCenterSummaries);

      mockQuoteCostCenterSummaries.forEach((summary) => {
        apiScope
          .get(`/quotes/${summary.QuoteID}/sections/${summary.SectionID}/costCenters/`)
          .reply(200, {
            ...mockDetailedCostCenter,
            ID: summary.ID,
            Total: {
              ExTax: 1000.50,
              IncTax: 1100.55,
              Tax: 100.05
            }
          });
      });

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200);

      expect(response.body.success).toBe(true);
      
      // Verify Total structure
      response.body.data.forEach(costCenter => {
        expect(costCenter.Total).toEqual({
          ExTax: 1000.50,
          IncTax: 1100.55,
          Tax: 100.05
        });
      });
    });
  });

  describe('Error scenarios in complete workflow', () => {
    it('should handle summaries endpoint failure', async () => {
      apiScope
        .get('/quoteCostCenters/')
        .reply(500, { message: 'Database error' });

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should handle invalid quote ID in detailed fetch', async () => {
      const invalidSummary = [{
        ID: 999,
        QuoteID: 99999, // Invalid quote ID
        SectionID: 67890,
        Name: 'Invalid Cost Center',
        Total: { ExTax: 100, IncTax: 110, Tax: 10 }
      }];

      apiScope
        .get('/quoteCostCenters/')
        .reply(200, invalidSummary);

      apiScope
        .get('/quotes/99999/sections/67890/costCenters/')
        .reply(404, mockErrorResponses.invalidQuoteId);

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200); // Should still succeed with fallback

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      // Should fallback to summary data
      expect(response.body.data[0]).not.toHaveProperty('Quote');
    });

    it('should handle invalid section ID in detailed fetch', async () => {
      const invalidSummary = [{
        ID: 999,
        QuoteID: 12345,
        SectionID: 99999, // Invalid section ID
        Name: 'Invalid Cost Center',
        Total: { ExTax: 100, IncTax: 110, Tax: 10 }
      }];

      apiScope
        .get('/quoteCostCenters/')
        .reply(200, invalidSummary);

      apiScope
        .get('/quotes/12345/sections/99999/costCenters/')
        .reply(404, mockErrorResponses.invalidSectionId);

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200); // Should still succeed with fallback

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      // Should fallback to summary data
      expect(response.body.data[0]).not.toHaveProperty('Section');
    });

    it('should handle malformed response in detailed fetch', async () => {
      apiScope
        .get('/quoteCostCenters/')
        .reply(200, mockQuoteCostCenterSummaries.slice(0, 1));

      apiScope
        .get(`/quotes/${mockQuoteCostCenterSummaries[0].QuoteID}/sections/${mockQuoteCostCenterSummaries[0].SectionID}/costCenters/`)
        .reply(200, 'invalid json response');

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200); // Should still succeed with fallback

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      // Should fallback to summary data
      expect(response.body.data[0]).not.toHaveProperty('Quote');
    });

    it('should handle missing required fields in response', async () => {
      const invalidResponse = {
        // Missing required fields like ID, QuoteID, SectionID
        Name: 'Incomplete Cost Center'
      };

      apiScope
        .get('/quoteCostCenters/')
        .reply(200, mockQuoteCostCenterSummaries.slice(0, 1));

      apiScope
        .get(`/quotes/${mockQuoteCostCenterSummaries[0].QuoteID}/sections/${mockQuoteCostCenterSummaries[0].SectionID}/costCenters/`)
        .reply(200, invalidResponse);

      const response = await request(app)
        .get('/api/quote-cost-centers/complete')
        .expect(200); // Should still succeed with fallback

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      // Should fallback to summary data
      expect(response.body.data[0]).toHaveProperty('ID');
    });
  });

  describe('Quote-specific endpoint', () => {
    it('should fetch cost centers for specific quote', async () => {
      const quoteId = 12345;
      
      apiScope
        .get('/quoteCostCenters/')
        .query({ quoteId })
        .reply(200, mockQuoteCostCenterSummaries.filter(cc => cc.QuoteID === quoteId));

      const response = await request(app)
        .get(`/api/quote-cost-centers/quote/${quoteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(cc => cc.QuoteID === quoteId)).toBe(true);
    });

    it('should handle non-existent quote ID', async () => {
      const quoteId = 99999;
      
      apiScope
        .get('/quoteCostCenters/')
        .query({ quoteId })
        .reply(200, []); // No cost centers for this quote

      const response = await request(app)
        .get(`/api/quote-cost-centers/quote/${quoteId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Performance and concurrency', () => {
    it('should handle concurrent requests efficiently', async () => {
      // Setup multiple API responses
      for (let i = 0; i < 5; i++) {
        apiScope
          .get('/costCenters/')
          .reply(200, mockQuoteCostCenterSummaries);
      }

      // Make concurrent requests
      const promises = Array(5).fill().map(() => 
        request(app).get('/api/quote-cost-centers')
      );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should handle large dataset efficiently', async () => {
      // Create large mock dataset
      const largeMockData = Array(100).fill().map((_, index) => ({
        ...mockQuoteCostCenterSummaries[0],
        ID: index + 1,
        Name: `Cost Center ${index + 1}`
      }));

      apiScope
        .get('/costCenters/')
        .reply(200, largeMockData);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/quote-cost-centers')
        .expect(200);
      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(100);
      
      // Should complete within reasonable time (less than 5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});