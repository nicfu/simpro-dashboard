const Total = require('./Total');

/**
 * Section data model
 */
class Section {
  constructor(data = {}) {
    this.id = this.validateId(data.ID || data.id);
    this.name = this.validateString(data.Name || data.name, 'name');
    this.description = data.Description || data.description || '';
    this.order = data.Order || data.order || 0;
    this.status = data.Status || data.status || '';
    
    // Parse dates
    this.dateCreated = this.parseDate(data.DateCreated || data.dateCreated);
    this.dateModified = this.parseDate(data.DateModified || data.dateModified);
    
    // Parse total
    this.total = data.Total ? Total.fromAPIResponse(data.Total) : new Total();
  }

  /**
   * Validate ID field
   * @param {*} id - The ID to validate
   * @returns {number} - The validated ID
   */
  validateId(id) {
    if (id === null || id === undefined) {
      throw new Error('Section ID is required');
    }
    
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numId)) {
      throw new Error(`Invalid Section ID: ${id}`);
    }
    
    if (numId <= 0) {
      throw new Error(`Invalid Section ID: ${numId}`);
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
      throw new Error(`Section ${fieldName} is required`);
    }
    
    if (typeof value !== 'string') {
      throw new Error(`Section ${fieldName} must be a string`);
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
   * Get formatted date string
   * @param {Date} date - Date to format
   * @returns {string} - Formatted date string
   */
  formatDate(date) {
    if (!date || !(date instanceof Date)) {
      return null;
    }
    
    return date.toISOString();
  }

  /**
   * Convert to JSON object
   * @returns {Object}
   */
  toJSON() {
    return {
      ID: this.id,
      Name: this.name,
      Description: this.description,
      Order: this.order,
      Status: this.status,
      DateCreated: this.formatDate(this.dateCreated),
      DateModified: this.formatDate(this.dateModified),
      Total: this.total.toJSON()
    };
  }

  /**
   * Create a Section instance from API response
   * @param {Object} data - Raw API data
   * @returns {Section}
   */
  static fromAPIResponse(data) {
    return new Section(data);
  }

  /**
   * Validate the structure of API response data
   * @param {Object} data - Data to validate
   * @returns {boolean} - True if valid
   */
  static validateAPIResponse(data) {
    const requiredFields = ['ID', 'Name'];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Missing required Section field: ${field}`);
      }
    }
    
    return true;
  }
}

module.exports = Section;