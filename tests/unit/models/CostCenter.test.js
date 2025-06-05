const CostCenter = require('../../../src/models/CostCenter');
const Total = require('../../../src/models/Total');
const { mockQuoteCostCenterSummaries, mockDetailedCostCenter } = require('../../mocks/quoteCostCenterMocks');

describe('CostCenter Model', () => {
  describe('constructor', () => {
    it('should create a CostCenter with valid data', () => {
      const data = mockQuoteCostCenterSummaries[0];
      const costCenter = new CostCenter(data);
      
      expect(costCenter.id).toBe(1);
      expect(costCenter.quoteId).toBe(12345);
      expect(costCenter.sectionId).toBe(67890);
      expect(costCenter.name).toBe('Labor Cost Center');
      expect(costCenter.description).toBe('Labor costs for main construction');
      expect(costCenter.type).toBe('Labor');
      expect(costCenter.status).toBe('Active');
      expect(costCenter.total).toBeInstanceOf(Total);
    });

    it('should handle alternative property names', () => {
      const data = {
        id: 1,
        quoteId: 12345,
        sectionId: 67890,
        name: 'Test Cost Center'
      };
      
      const costCenter = new CostCenter(data);
      
      expect(costCenter.id).toBe(1);
      expect(costCenter.quoteId).toBe(12345);
      expect(costCenter.sectionId).toBe(67890);
      expect(costCenter.name).toBe('Test Cost Center');
    });

    it('should parse dates correctly', () => {
      const data = {
        ID: 1,
        QuoteID: 12345,
        SectionID: 67890,
        Name: 'Test',
        DateCreated: '2024-01-15T08:30:00.000Z',
        DateModified: '2024-01-20T14:45:30.123Z'
      };
      
      const costCenter = new CostCenter(data);
      
      expect(costCenter.dateCreated).toBeInstanceOf(Date);
      expect(costCenter.dateModified).toBeInstanceOf(Date);
      expect(costCenter.dateCreated.getTime()).toBe(new Date('2024-01-15T08:30:00.000Z').getTime());
    });

    it('should create detailed cost center with additional data', () => {
      const costCenter = new CostCenter(mockDetailedCostCenter);
      
      expect(costCenter.isDetailed()).toBe(true);
      expect(costCenter.quote).toBeDefined();
      expect(costCenter.section).toBeDefined();
      expect(costCenter.costCenter).toBeDefined();
    });
  });

  describe('validation', () => {
    it('should throw error for missing ID', () => {
      expect(() => {
        new CostCenter({ QuoteID: 123, SectionID: 456, Name: 'Test' });
      }).toThrow('ID is required');
    });

    it('should throw error for invalid ID', () => {
      expect(() => {
        new CostCenter({ ID: 'invalid', QuoteID: 123, SectionID: 456, Name: 'Test' });
      }).toThrow('Invalid ID: invalid');
    });

    it('should throw error for missing QuoteID', () => {
      expect(() => {
        new CostCenter({ ID: 1, SectionID: 456, Name: 'Test' });
      }).toThrow('ID is required');
    });

    it('should throw error for missing SectionID', () => {
      expect(() => {
        new CostCenter({ ID: 1, QuoteID: 123, Name: 'Test' });
      }).toThrow('ID is required');
    });

    it('should throw error for missing Name', () => {
      expect(() => {
        new CostCenter({ ID: 1, QuoteID: 123, SectionID: 456 });
      }).toThrow('name is required');
    });

    it('should throw error for empty Name', () => {
      expect(() => {
        new CostCenter({ ID: 1, QuoteID: 123, SectionID: 456, Name: '' });
      }).toThrow('name is required');
    });

    it('should handle negative IDs', () => {
      expect(() => {
        new CostCenter({ ID: -1, QuoteID: 123, SectionID: 456, Name: 'Test' });
      }).toThrow('Invalid ID: -1');
    });

    it('should handle zero IDs', () => {
      expect(() => {
        new CostCenter({ ID: 0, QuoteID: 123, SectionID: 456, Name: 'Test' });
      }).toThrow('Invalid ID: 0');
    });
  });

  describe('date parsing', () => {
    it('should handle valid ISO 8601 dates', () => {
      const costCenter = new CostCenter({
        ID: 1,
        QuoteID: 123,
        SectionID: 456,
        Name: 'Test',
        DateCreated: '2024-01-15T08:30:00.000Z'
      });
      
      expect(costCenter.dateCreated).toBeInstanceOf(Date);
      expect(costCenter.dateCreated.toISOString()).toBe('2024-01-15T08:30:00.000Z');
    });

    it('should handle dates with milliseconds', () => {
      const costCenter = new CostCenter({
        ID: 1,
        QuoteID: 123,
        SectionID: 456,
        Name: 'Test',
        DateModified: '2024-01-20T14:45:30.123Z'
      });
      
      expect(costCenter.dateModified).toBeInstanceOf(Date);
      expect(costCenter.dateModified.toISOString()).toBe('2024-01-20T14:45:30.123Z');
    });

    it('should handle invalid dates gracefully', () => {
      const costCenter = new CostCenter({
        ID: 1,
        QuoteID: 123,
        SectionID: 456,
        Name: 'Test',
        DateCreated: 'invalid-date'
      });
      
      expect(costCenter.dateCreated).toBeNull();
    });

    it('should handle null dates', () => {
      const costCenter = new CostCenter({
        ID: 1,
        QuoteID: 123,
        SectionID: 456,
        Name: 'Test',
        DateCreated: null
      });
      
      expect(costCenter.dateCreated).toBeNull();
    });
  });

  describe('isDetailed', () => {
    it('should return true for detailed cost centers', () => {
      const costCenter = new CostCenter(mockDetailedCostCenter);
      expect(costCenter.isDetailed()).toBe(true);
    });

    it('should return false for summary cost centers', () => {
      const costCenter = new CostCenter(mockQuoteCostCenterSummaries[0]);
      expect(costCenter.isDetailed()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON structure for summary', () => {
      const costCenter = new CostCenter(mockQuoteCostCenterSummaries[0]);
      const json = costCenter.toJSON();
      
      expect(json).toHaveProperty('ID', 1);
      expect(json).toHaveProperty('QuoteID', 12345);
      expect(json).toHaveProperty('SectionID', 67890);
      expect(json).toHaveProperty('Name', 'Labor Cost Center');
      expect(json).toHaveProperty('Total');
      expect(json.Total).toHaveProperty('ExTax');
      expect(json.Total).toHaveProperty('IncTax');
      expect(json.Total).toHaveProperty('Tax');
    });

    it('should include detailed data in JSON when present', () => {
      const costCenter = new CostCenter(mockDetailedCostCenter);
      const json = costCenter.toJSON();
      
      expect(json).toHaveProperty('Quote');
      expect(json).toHaveProperty('Section');
      expect(json).toHaveProperty('CostCenter');
    });

    it('should format dates as ISO strings', () => {
      const costCenter = new CostCenter({
        ID: 1,
        QuoteID: 123,
        SectionID: 456,
        Name: 'Test',
        DateCreated: new Date('2024-01-15T08:30:00.000Z')
      });
      
      const json = costCenter.toJSON();
      expect(json.DateCreated).toBe('2024-01-15T08:30:00.000Z');
    });
  });

  describe('fromAPIResponse', () => {
    it('should create CostCenter from API response', () => {
      const costCenter = CostCenter.fromAPIResponse(mockQuoteCostCenterSummaries[0]);
      
      expect(costCenter).toBeInstanceOf(CostCenter);
      expect(costCenter.id).toBe(1);
      expect(costCenter.name).toBe('Labor Cost Center');
    });
  });

  describe('validateAPIResponse', () => {
    it('should validate valid API response', () => {
      expect(() => {
        CostCenter.validateAPIResponse(mockQuoteCostCenterSummaries[0]);
      }).not.toThrow();
    });

    it('should throw error for missing required fields', () => {
      const invalidData = {
        QuoteID: 123,
        SectionID: 456,
        Name: 'Test'
        // Missing ID
      };
      
      expect(() => {
        CostCenter.validateAPIResponse(invalidData);
      }).toThrow('Missing required field: ID');
    });

    it('should validate Total structure when present', () => {
      const invalidData = {
        ID: 1,
        QuoteID: 123,
        SectionID: 456,
        Name: 'Test',
        Total: {
          ExTax: 100
          // Missing IncTax and Tax
        }
      };
      
      expect(() => {
        CostCenter.validateAPIResponse(invalidData);
      }).toThrow('Missing required Total field: IncTax');
    });
  });

  describe('fromAPIResponseArray', () => {
    it('should create array of CostCenter instances', () => {
      const costCenters = CostCenter.fromAPIResponseArray(mockQuoteCostCenterSummaries);
      
      expect(costCenters).toHaveLength(3);
      expect(costCenters[0]).toBeInstanceOf(CostCenter);
      expect(costCenters[1]).toBeInstanceOf(CostCenter);
      expect(costCenters[2]).toBeInstanceOf(CostCenter);
    });

    it('should throw error for non-array input', () => {
      expect(() => {
        CostCenter.fromAPIResponseArray(mockQuoteCostCenterSummaries[0]);
      }).toThrow('Expected array of cost center data');
    });

    it('should throw error for invalid array items', () => {
      const invalidArray = [
        mockQuoteCostCenterSummaries[0],
        { ID: 'invalid' } // Invalid item
      ];
      
      expect(() => {
        CostCenter.fromAPIResponseArray(invalidArray);
      }).toThrow();
    });
  });
});