const Section = require('../../../src/models/Section');
const Total = require('../../../src/models/Total');

describe('Section Model', () => {
  const mockSectionData = {
    ID: 67890,
    Name: 'Phase 1 - Demolition and Preparation',
    Description: 'Initial demolition and site preparation work',
    Order: 1,
    Status: 'Active',
    DateCreated: '2024-01-15T08:00:00.000Z',
    DateModified: '2024-01-20T14:45:30.123Z',
    Total: {
      ExTax: 35000.00,
      IncTax: 38500.00,
      Tax: 3500.00
    }
  };

  describe('constructor', () => {
    it('should create a Section with valid data', () => {
      const section = new Section(mockSectionData);
      
      expect(section.id).toBe(67890);
      expect(section.name).toBe('Phase 1 - Demolition and Preparation');
      expect(section.description).toBe('Initial demolition and site preparation work');
      expect(section.order).toBe(1);
      expect(section.status).toBe('Active');
      expect(section.total).toBeInstanceOf(Total);
    });

    it('should handle alternative property names', () => {
      const data = {
        id: 123,
        name: 'Test Section',
        description: 'Test description',
        order: 2,
        status: 'Inactive'
      };
      
      const section = new Section(data);
      
      expect(section.id).toBe(123);
      expect(section.name).toBe('Test Section');
      expect(section.description).toBe('Test description');
      expect(section.order).toBe(2);
      expect(section.status).toBe('Inactive');
    });

    it('should handle minimal data with defaults', () => {
      const section = new Section({
        ID: 1,
        Name: 'Minimal Section'
      });
      
      expect(section.id).toBe(1);
      expect(section.name).toBe('Minimal Section');
      expect(section.description).toBe('');
      expect(section.order).toBe(0);
      expect(section.status).toBe('');
      expect(section.total).toBeInstanceOf(Total);
    });

    it('should parse dates correctly', () => {
      const section = new Section(mockSectionData);
      
      expect(section.dateCreated).toBeInstanceOf(Date);
      expect(section.dateModified).toBeInstanceOf(Date);
      expect(section.dateCreated.toISOString()).toBe('2024-01-15T08:00:00.000Z');
      expect(section.dateModified.toISOString()).toBe('2024-01-20T14:45:30.123Z');
    });
  });

  describe('validation', () => {
    it('should throw error for missing ID', () => {
      expect(() => {
        new Section({ Name: 'Test Section' });
      }).toThrow('Section ID is required');
    });

    it('should throw error for null ID', () => {
      expect(() => {
        new Section({ ID: null, Name: 'Test Section' });
      }).toThrow('Section ID is required');
    });

    it('should throw error for invalid ID', () => {
      expect(() => {
        new Section({ ID: 'invalid', Name: 'Test Section' });
      }).toThrow('Invalid Section ID: invalid');
    });

    it('should throw error for zero ID', () => {
      expect(() => {
        new Section({ ID: 0, Name: 'Test Section' });
      }).toThrow('Invalid Section ID: 0');
    });

    it('should throw error for negative ID', () => {
      expect(() => {
        new Section({ ID: -1, Name: 'Test Section' });
      }).toThrow('Invalid Section ID: -1');
    });

    it('should throw error for missing Name', () => {
      expect(() => {
        new Section({ ID: 1 });
      }).toThrow('Section name is required');
    });

    it('should throw error for null Name', () => {
      expect(() => {
        new Section({ ID: 1, Name: null });
      }).toThrow('Section name is required');
    });

    it('should throw error for empty Name', () => {
      expect(() => {
        new Section({ ID: 1, Name: '' });
      }).toThrow('Section name is required');
    });

    it('should throw error for non-string Name', () => {
      expect(() => {
        new Section({ ID: 1, Name: 123 });
      }).toThrow('Section name must be a string');
    });

    it('should trim whitespace from Name', () => {
      const section = new Section({
        ID: 1,
        Name: '  Test Section  '
      });
      
      expect(section.name).toBe('Test Section');
    });
  });

  describe('date parsing', () => {
    it('should handle valid ISO 8601 dates', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test',
        DateCreated: '2024-01-15T08:30:00.000Z'
      });
      
      expect(section.dateCreated).toBeInstanceOf(Date);
      expect(section.dateCreated.toISOString()).toBe('2024-01-15T08:30:00.000Z');
    });

    it('should handle dates with milliseconds', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test',
        DateModified: '2024-01-20T14:45:30.123Z'
      });
      
      expect(section.dateModified).toBeInstanceOf(Date);
      expect(section.dateModified.toISOString()).toBe('2024-01-20T14:45:30.123Z');
    });

    it('should handle invalid dates gracefully', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test',
        DateCreated: 'invalid-date'
      });
      
      expect(section.dateCreated).toBeNull();
    });

    it('should handle null dates', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test',
        DateCreated: null
      });
      
      expect(section.dateCreated).toBeNull();
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15T08:30:00.000Z');
      const section = new Section({
        ID: 1,
        Name: 'Test',
        DateCreated: date
      });
      
      expect(section.dateCreated).toBe(date);
    });

    it('should handle empty string dates', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test',
        DateCreated: ''
      });
      
      expect(section.dateCreated).toBeNull();
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON structure', () => {
      const section = new Section(mockSectionData);
      const json = section.toJSON();
      
      expect(json).toEqual({
        ID: 67890,
        Name: 'Phase 1 - Demolition and Preparation',
        Description: 'Initial demolition and site preparation work',
        Order: 1,
        Status: 'Active',
        DateCreated: '2024-01-15T08:00:00.000Z',
        DateModified: '2024-01-20T14:45:30.123Z',
        Total: {
          ExTax: 35000.00,
          IncTax: 38500.00,
          Tax: 3500.00
        }
      });
    });

    it('should format dates as ISO strings', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test',
        DateCreated: new Date('2024-01-15T08:30:00.000Z')
      });
      
      const json = section.toJSON();
      expect(json.DateCreated).toBe('2024-01-15T08:30:00.000Z');
    });

    it('should handle null dates in JSON', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test'
      });
      
      const json = section.toJSON();
      expect(json.DateCreated).toBeNull();
      expect(json.DateModified).toBeNull();
    });

    it('should include Total object', () => {
      const section = new Section({
        ID: 1,
        Name: 'Test',
        Total: {
          ExTax: 1000,
          IncTax: 1100,
          Tax: 100
        }
      });
      
      const json = section.toJSON();
      expect(json.Total).toEqual({
        ExTax: 1000,
        IncTax: 1100,
        Tax: 100
      });
    });
  });

  describe('fromAPIResponse', () => {
    it('should create Section from API response', () => {
      const section = Section.fromAPIResponse(mockSectionData);
      
      expect(section).toBeInstanceOf(Section);
      expect(section.id).toBe(67890);
      expect(section.name).toBe('Phase 1 - Demolition and Preparation');
      expect(section.total).toBeInstanceOf(Total);
    });

    it('should handle minimal API response', () => {
      const minimalData = {
        ID: 1,
        Name: 'Simple Section'
      };
      
      const section = Section.fromAPIResponse(minimalData);
      
      expect(section).toBeInstanceOf(Section);
      expect(section.id).toBe(1);
      expect(section.name).toBe('Simple Section');
    });
  });

  describe('validateAPIResponse', () => {
    it('should validate valid API response', () => {
      expect(() => {
        Section.validateAPIResponse(mockSectionData);
      }).not.toThrow();
    });

    it('should validate minimal valid response', () => {
      expect(() => {
        Section.validateAPIResponse({ ID: 1, Name: 'Test' });
      }).not.toThrow();
    });

    it('should throw error for missing ID', () => {
      expect(() => {
        Section.validateAPIResponse({ Name: 'Test Section' });
      }).toThrow('Missing required Section field: ID');
    });

    it('should throw error for missing Name', () => {
      expect(() => {
        Section.validateAPIResponse({ ID: 1 });
      }).toThrow('Missing required Section field: Name');
    });

    it('should throw error for null ID', () => {
      expect(() => {
        Section.validateAPIResponse({ ID: null, Name: 'Test' });
      }).toThrow('Missing required Section field: ID');
    });

    it('should throw error for null Name', () => {
      expect(() => {
        Section.validateAPIResponse({ ID: 1, Name: null });
      }).toThrow('Missing required Section field: Name');
    });
  });
});