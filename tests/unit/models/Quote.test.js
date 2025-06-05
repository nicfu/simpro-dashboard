const Quote = require('../../../src/models/Quote');
const Total = require('../../../src/models/Total');

describe('Quote Model', () => {
  const mockQuoteData = {
    ID: 12345,
    Name: 'Office Building Renovation',
    Description: 'Complete renovation of downtown office building',
    Notes: 'Customer requires completion by Q2',
    DateIssued: '2024-01-10T00:00:00.000Z',
    DateApproved: '2024-01-25T09:30:00.000Z',
    DueDate: '2024-03-15T23:59:59.999Z',
    DateModified: '2024-01-26T10:15:30.456Z',
    Customer: {
      ID: 789,
      CompanyName: 'ABC Construction Ltd',
      ContactName: 'John Smith',
      Email: 'john.smith@abc-construction.com'
    },
    Site: {
      ID: 456,
      Name: 'Downtown Office Complex',
      Address: '123 Business Street, City Center'
    },
    Status: {
      ID: 1,
      Name: 'Approved',
      Color: '#28a745'
    },
    Stage: 'In Progress',
    CustomerStage: 'Approved',
    Salesperson: {
      ID: 101,
      Name: 'Sarah Johnson',
      Email: 'sarah.johnson@company.com'
    },
    ProjectManager: {
      ID: 102,
      Name: 'Mike Wilson',
      Email: 'mike.wilson@company.com'
    },
    Total: {
      ExTax: 45000.00,
      IncTax: 49500.00,
      Tax: 4500.00
    },
    Type: 'Construction',
    ValidityDays: 30,
    OrderNo: 'ORD-2024-001',
    JobNo: 'JOB-2024-0015'
  };

  describe('constructor', () => {
    it('should create a Quote with valid data', () => {
      const quote = new Quote(mockQuoteData);
      
      expect(quote.id).toBe(12345);
      expect(quote.name).toBe('Office Building Renovation');
      expect(quote.description).toBe('Complete renovation of downtown office building');
      expect(quote.notes).toBe('Customer requires completion by Q2');
      expect(quote.stage).toBe('In Progress');
      expect(quote.customerStage).toBe('Approved');
      expect(quote.type).toBe('Construction');
      expect(quote.validityDays).toBe(30);
      expect(quote.orderNo).toBe('ORD-2024-001');
      expect(quote.jobNo).toBe('JOB-2024-0015');
      expect(quote.total).toBeInstanceOf(Total);
    });

    it('should handle alternative property names', () => {
      const data = {
        id: 123,
        name: 'Test Quote',
        description: 'Test description'
      };
      
      const quote = new Quote(data);
      
      expect(quote.id).toBe(123);
      expect(quote.name).toBe('Test Quote');
      expect(quote.description).toBe('Test description');
    });

    it('should handle minimal data', () => {
      const quote = new Quote({ ID: 1 });
      
      expect(quote.id).toBe(1);
      expect(quote.name).toBe('');
      expect(quote.description).toBe('');
      expect(quote.notes).toBe('');
      expect(quote.stage).toBe('');
      expect(quote.customerStage).toBe('');
    });

    it('should parse dates correctly', () => {
      const quote = new Quote(mockQuoteData);
      
      expect(quote.dateIssued).toBeInstanceOf(Date);
      expect(quote.dateApproved).toBeInstanceOf(Date);
      expect(quote.dueDate).toBeInstanceOf(Date);
      expect(quote.dateModified).toBeInstanceOf(Date);
      
      expect(quote.dateIssued.toISOString()).toBe('2024-01-10T00:00:00.000Z');
      expect(quote.dateApproved.toISOString()).toBe('2024-01-25T09:30:00.000Z');
    });

    it('should parse status object correctly', () => {
      const quote = new Quote(mockQuoteData);
      
      expect(quote.status).toEqual({
        id: 1,
        name: 'Approved',
        color: '#28a745'
      });
    });

    it('should parse string status correctly', () => {
      const data = { ID: 1, Status: 'Pending' };
      const quote = new Quote(data);
      
      expect(quote.status).toEqual({
        name: 'Pending',
        color: ''
      });
    });
  });

  describe('validation', () => {
    it('should throw error for missing ID', () => {
      expect(() => {
        new Quote({});
      }).toThrow('Quote ID is required');
    });

    it('should throw error for invalid ID', () => {
      expect(() => {
        new Quote({ ID: 'invalid' });
      }).toThrow('Invalid Quote ID: invalid');
    });

    it('should throw error for zero ID', () => {
      expect(() => {
        new Quote({ ID: 0 });
      }).toThrow('Invalid Quote ID: 0');
    });

    it('should throw error for negative ID', () => {
      expect(() => {
        new Quote({ ID: -1 });
      }).toThrow('Invalid Quote ID: -1');
    });
  });

  describe('date parsing', () => {
    it('should handle valid ISO 8601 dates', () => {
      const quote = new Quote({
        ID: 1,
        DateIssued: '2024-01-15T08:30:00.000Z'
      });
      
      expect(quote.dateIssued).toBeInstanceOf(Date);
      expect(quote.dateIssued.toISOString()).toBe('2024-01-15T08:30:00.000Z');
    });

    it('should handle invalid dates gracefully', () => {
      const quote = new Quote({
        ID: 1,
        DateIssued: 'invalid-date'
      });
      
      expect(quote.dateIssued).toBeNull();
    });

    it('should handle null dates', () => {
      const quote = new Quote({
        ID: 1,
        DateIssued: null
      });
      
      expect(quote.dateIssued).toBeNull();
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-01-15T08:30:00.000Z');
      const quote = new Quote({
        ID: 1,
        DateIssued: date
      });
      
      expect(quote.dateIssued).toBe(date);
    });
  });

  describe('status parsing', () => {
    it('should handle status object with ID, Name, and Color', () => {
      const quote = new Quote({
        ID: 1,
        Status: { ID: 5, Name: 'Completed', Color: '#28a745' }
      });
      
      expect(quote.status).toEqual({
        id: 5,
        name: 'Completed',
        color: '#28a745'
      });
    });

    it('should handle status object with alternative property names', () => {
      const quote = new Quote({
        ID: 1,
        Status: { id: 5, name: 'Completed', color: '#28a745' }
      });
      
      expect(quote.status).toEqual({
        id: 5,
        name: 'Completed',
        color: '#28a745'
      });
    });

    it('should handle string status', () => {
      const quote = new Quote({
        ID: 1,
        Status: 'Pending Review'
      });
      
      expect(quote.status).toEqual({
        name: 'Pending Review',
        color: ''
      });
    });

    it('should handle null status', () => {
      const quote = new Quote({
        ID: 1,
        Status: null
      });
      
      expect(quote.status).toEqual({
        name: '',
        color: ''
      });
    });
  });

  describe('getter methods', () => {
    let quote;
    
    beforeEach(() => {
      quote = new Quote(mockQuoteData);
    });

    describe('getCustomerName', () => {
      it('should return customer CompanyName', () => {
        expect(quote.getCustomerName()).toBe('ABC Construction Ltd');
      });

      it('should return empty string when no customer', () => {
        quote.customer = null;
        expect(quote.getCustomerName()).toBe('');
      });

      it('should handle customer with Name property', () => {
        quote.customer = { Name: 'Test Company' };
        expect(quote.getCustomerName()).toBe('Test Company');
      });
    });

    describe('getSiteName', () => {
      it('should return site name', () => {
        expect(quote.getSiteName()).toBe('Downtown Office Complex');
      });

      it('should return empty string when no site', () => {
        quote.site = null;
        expect(quote.getSiteName()).toBe('');
      });
    });

    describe('getSalespersonName', () => {
      it('should return salesperson name', () => {
        expect(quote.getSalespersonName()).toBe('Sarah Johnson');
      });

      it('should return empty string when no salesperson', () => {
        quote.salesperson = null;
        expect(quote.getSalespersonName()).toBe('');
      });
    });

    describe('getProjectManagerName', () => {
      it('should return project manager name', () => {
        expect(quote.getProjectManagerName()).toBe('Mike Wilson');
      });

      it('should return empty string when no project manager', () => {
        quote.projectManager = null;
        expect(quote.getProjectManagerName()).toBe('');
      });
    });
  });

  describe('isExpired', () => {
    it('should return false when no due date', () => {
      const quote = new Quote({ ID: 1 });
      expect(quote.isExpired()).toBe(false);
    });

    it('should return true when due date is in the past', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const quote = new Quote({
        ID: 1,
        DueDate: pastDate.toISOString()
      });
      
      expect(quote.isExpired()).toBe(true);
    });

    it('should return false when due date is in the future', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const quote = new Quote({
        ID: 1,
        DueDate: futureDate.toISOString()
      });
      
      expect(quote.isExpired()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON structure', () => {
      const quote = new Quote(mockQuoteData);
      const json = quote.toJSON();
      
      expect(json).toHaveProperty('ID', 12345);
      expect(json).toHaveProperty('Name', 'Office Building Renovation');
      expect(json).toHaveProperty('Customer');
      expect(json).toHaveProperty('Site');
      expect(json).toHaveProperty('Status');
      expect(json).toHaveProperty('Total');
      expect(json.DateIssued).toBe('2024-01-10T00:00:00.000Z');
    });

    it('should format dates as ISO strings', () => {
      const quote = new Quote({
        ID: 1,
        DateIssued: new Date('2024-01-15T08:30:00.000Z')
      });
      
      const json = quote.toJSON();
      expect(json.DateIssued).toBe('2024-01-15T08:30:00.000Z');
    });

    it('should handle null dates', () => {
      const quote = new Quote({ ID: 1 });
      const json = quote.toJSON();
      
      expect(json.DateIssued).toBeNull();
      expect(json.DateApproved).toBeNull();
      expect(json.DueDate).toBeNull();
      expect(json.DateModified).toBeNull();
    });
  });

  describe('fromAPIResponse', () => {
    it('should create Quote from API response', () => {
      const quote = Quote.fromAPIResponse(mockQuoteData);
      
      expect(quote).toBeInstanceOf(Quote);
      expect(quote.id).toBe(12345);
      expect(quote.name).toBe('Office Building Renovation');
    });
  });

  describe('validateAPIResponse', () => {
    it('should validate valid API response', () => {
      expect(() => {
        Quote.validateAPIResponse(mockQuoteData);
      }).not.toThrow();
    });

    it('should validate minimal valid response', () => {
      expect(() => {
        Quote.validateAPIResponse({ ID: 1 });
      }).not.toThrow();
    });

    it('should throw error for missing ID', () => {
      expect(() => {
        Quote.validateAPIResponse({ Name: 'Test Quote' });
      }).toThrow('Missing required Quote field: ID');
    });
  });
});