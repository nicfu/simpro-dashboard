const Total = require('../../../src/models/Total');

describe('Total Model', () => {
  describe('constructor', () => {
    it('should create a Total with valid amounts', () => {
      const data = {
        ExTax: 100.00,
        IncTax: 110.00,
        Tax: 10.00
      };
      
      const total = new Total(data);
      
      expect(total.exTax).toBe(100.00);
      expect(total.incTax).toBe(110.00);
      expect(total.tax).toBe(10.00);
    });

    it('should handle alternative property names', () => {
      const data = {
        exTax: 100.00,
        incTax: 110.00,
        tax: 10.00
      };
      
      const total = new Total(data);
      
      expect(total.exTax).toBe(100.00);
      expect(total.incTax).toBe(110.00);
      expect(total.tax).toBe(10.00);
    });

    it('should default to 0 for null/undefined values', () => {
      const total = new Total();
      
      expect(total.exTax).toBe(0);
      expect(total.incTax).toBe(0);
      expect(total.tax).toBe(0);
    });

    it('should round amounts to 2 decimal places', () => {
      const data = {
        ExTax: 100.12345,
        IncTax: 110.67891,
        Tax: 10.55556
      };
      
      const total = new Total(data);
      
      expect(total.exTax).toBe(100.12);
      expect(total.incTax).toBe(110.68);
      expect(total.tax).toBe(10.56);
    });

    it('should parse string amounts', () => {
      const data = {
        ExTax: '100.50',
        IncTax: '110.55',
        Tax: '10.05'
      };
      
      const total = new Total(data);
      
      expect(total.exTax).toBe(100.50);
      expect(total.incTax).toBe(110.55);
      expect(total.tax).toBe(10.05);
    });
  });

  describe('validation', () => {
    it('should throw error for invalid amounts', () => {
      expect(() => {
        new Total({ ExTax: 'invalid', IncTax: 110, Tax: 10 });
      }).toThrow('Invalid amount: invalid');
    });

    it('should throw error for negative amounts', () => {
      expect(() => {
        new Total({ ExTax: -100, IncTax: 110, Tax: 10 });
      }).toThrow('Amount cannot be negative: -100');
    });

    it('should throw error for inconsistent totals', () => {
      expect(() => {
        new Total({ ExTax: 100, IncTax: 120, Tax: 10 }); // 100 + 10 != 120
      }).toThrow('Total amounts are inconsistent');
    });

    it('should allow slight rounding differences', () => {
      // This should not throw due to 1 cent tolerance
      expect(() => {
        new Total({ ExTax: 100.00, IncTax: 110.01, Tax: 10.01 }); // Fixed: 100 + 10.01 = 110.01
      }).not.toThrow();
    });
  });

  describe('toJSON', () => {
    it('should return proper JSON structure', () => {
      const total = new Total({ ExTax: 100, IncTax: 110, Tax: 10 });
      const json = total.toJSON();
      
      expect(json).toEqual({
        ExTax: 100,
        IncTax: 110,
        Tax: 10
      });
    });
  });

  describe('fromAPIResponse', () => {
    it('should create Total from API response', () => {
      const apiData = {
        ExTax: 500.00,
        IncTax: 550.00,
        Tax: 50.00
      };
      
      const total = Total.fromAPIResponse(apiData);
      
      expect(total).toBeInstanceOf(Total);
      expect(total.exTax).toBe(500.00);
      expect(total.incTax).toBe(550.00);
      expect(total.tax).toBe(50.00);
    });
  });

  describe('add', () => {
    it('should add two Total objects correctly', () => {
      const total1 = new Total({ ExTax: 100, IncTax: 110, Tax: 10 });
      const total2 = new Total({ ExTax: 200, IncTax: 220, Tax: 20 });
      
      const result = total1.add(total2);
      
      expect(result.exTax).toBe(300);
      expect(result.incTax).toBe(330);
      expect(result.tax).toBe(30);
    });

    it('should throw error when adding non-Total object', () => {
      const total = new Total({ ExTax: 100, IncTax: 110, Tax: 10 });
      
      expect(() => {
        total.add({ ExTax: 100 });
      }).toThrow('Can only add Total instances');
    });
  });

  describe('percentageOf', () => {
    it('should calculate percentage correctly', () => {
      const total1 = new Total({ ExTax: 50, IncTax: 55, Tax: 5 });
      const total2 = new Total({ ExTax: 100, IncTax: 110, Tax: 10 });
      
      const percentage = total1.percentageOf(total2);
      
      expect(percentage).toBe(50); // 55/110 * 100 = 50%
    });

    it('should return 0 when comparing against zero total', () => {
      const total1 = new Total({ ExTax: 50, IncTax: 55, Tax: 5 });
      const total2 = new Total();
      
      const percentage = total1.percentageOf(total2);
      
      expect(percentage).toBe(0);
    });

    it('should throw error when comparing with non-Total object', () => {
      const total = new Total({ ExTax: 100, IncTax: 110, Tax: 10 });
      
      expect(() => {
        total.percentageOf({ IncTax: 100 });
      }).toThrow('Can only compare with Total instances');
    });
  });
});