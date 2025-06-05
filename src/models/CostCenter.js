const Total = require('./Total');

/**
 * CostCenter data model
 */
class CostCenter {
  constructor(data = {}) {
    this.id = this.validateId(data.ID ?? data.id);
    this.quoteId = this.validateId(data.QuoteID ?? data.quoteId);
    this.sectionId = this.validateId(data.SectionID ?? data.sectionId);
    this.name = this.validateString(data.Name || data.name, 'name');
    this.description = data.Description || data.description || '';
    this.type = data.Type || data.type || '';
    this.status = data.Status || data.status || '';
    
    // Parse dates
    this.dateCreated = this.parseDate(data.DateCreated || data.dateCreated);
    this.dateModified = this.parseDate(data.DateModified || data.dateModified);
    
    // Parse total
    this.total = data.Total ? Total.fromAPIResponse(data.Total) : new Total();
    
    // Additional detailed data (only present in detailed API calls)
    this.quote = data.Quote || null;
    this.section = data.Section || null;
    this.costCenter = data.CostCenter || null;
  }

  /**
   * Validate ID field
   * @param {*} id - The ID to validate
   * @returns {number} - The validated ID
   */
  validateId(id) {
    if (id === null || id === undefined) {
      throw new Error('ID is required');
    }
    
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numId)) {
      throw new Error(`Invalid ID: ${id}`);
    }
    
    if (numId <= 0) {
      throw new Error(`Invalid ID: ${numId}`);
    }
    
    return numId;
  }

  /**
   * Validate string field
   * @param {*} value - The value to validate
   * @param {string} fieldName - Name of the field for error messages
   * @returns {string} - The validated string
   */
  validateString(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} is required`);
    }
    
    if (typeof value !== 'string') {
      throw new Error(`${fieldName} must be a string`);
    }
    
    return value.trim();
  }

  /**
   * Parse date string to Date object
   * @param {string|Date} dateStr - The date to parse
   * @returns {Date|null} - Parsed date or null if invalid
   */
  parseDate(dateStr) {
    if (!dateStr) {
      return null;
    }
    
    if (dateStr instanceof Date) {
      return dateStr;
    }
    
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${dateStr}`);
        return null;
      }
      return date;
    } catch (error) {
      console.warn(`Error parsing date: ${dateStr}`, error);
      return null;
    }
  }

  /**
   * Check if this is a detailed cost center (has quote/section data)
   * @returns {boolean}
   */
  isDetailed() {
    return !!(this.quote || this.section || this.costCenter);
  }

  /**
   * Get formatted date string
   * @param {Date} date - Date to format
   * @returns {string} - Formatted date string
   */
  formatDate(date) {
    if (!date || !(date instanceof Date)) {
      return 'N/A';
    }
    
    return date.toISOString();
  }

  /**
   * Convert to JSON object
   * @returns {Object}
   */
  toJSON() {
    const json = {
      ID: this.id,
      QuoteID: this.quoteId,
      SectionID: this.sectionId,
      Name: this.name,
      Description: this.description,
      Type: this.type,
      Status: this.status,
      DateCreated: this.formatDate(this.dateCreated),
      DateModified: this.formatDate(this.dateModified),
      Total: this.total.toJSON()
    };

    // Include detailed data if present
    if (this.quote) {
      json.Quote = this.quote;
    }
    
    if (this.section) {
      json.Section = this.section;
    }
    
    if (this.costCenter) {
      json.CostCenter = this.costCenter;
    }

    return json;
  }

  /**
   * Create a CostCenter instance from API response
   * @param {Object} data - Raw API data
   * @returns {CostCenter}
   */
  static fromAPIResponse(data) {
    return new CostCenter(data);
  }

  /**
   * Validate the structure of API response data
   * @param {Object} data - Data to validate
   * @returns {boolean} - True if valid
   */
  static validateAPIResponse(data) {
    const requiredFields = ['ID', 'QuoteID', 'SectionID', 'Name'];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate Total structure if present
    if (data.Total) {
      const totalFields = ['ExTax', 'IncTax', 'Tax'];
      for (const field of totalFields) {
        if (data.Total[field] === undefined || data.Total[field] === null) {
          throw new Error(`Missing required Total field: ${field}`);
        }
      }
    }
    
    return true;
  }

  /**
   * Create multiple CostCenter instances from API response array
   * @param {Array} dataArray - Array of raw API data
   * @returns {Array<CostCenter>}
   */
  static fromAPIResponseArray(dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Expected array of cost center data');
    }
    
    return dataArray.map(data => {
      try {
        CostCenter.validateAPIResponse(data);
        return CostCenter.fromAPIResponse(data);
      } catch (error) {
        console.error('Error creating CostCenter from data:', data, error);
        throw error;
      }
    });
  }
}

module.exports = CostCenter;