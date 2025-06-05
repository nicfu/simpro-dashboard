const Total = require('./Total');

/**
 * Quote data model
 */
class Quote {
  constructor(data = {}) {
    this.id = this.validateId(data.ID ?? data.id);
    this.name = data.Name || data.name || '';
    this.description = data.Description || data.description || '';
    this.notes = data.Notes || data.notes || '';
    
    // Parse dates
    this.dateIssued = this.parseDate(data.DateIssued || data.dateIssued);
    this.dateApproved = this.parseDate(data.DateApproved || data.dateApproved);
    this.dueDate = this.parseDate(data.DueDate || data.dueDate);
    this.dateModified = this.parseDate(data.DateModified || data.dateModified);
    
    // Customer and Site objects
    this.customer = data.Customer || data.customer || null;
    this.site = data.Site || data.site || null;
    
    // Status can be object or string
    this.status = this.parseStatus(data.Status || data.status);
    this.stage = data.Stage || data.stage || '';
    this.customerStage = data.CustomerStage || data.customerStage || '';
    
    // Personnel
    this.salesperson = data.Salesperson || data.salesperson || null;
    this.projectManager = data.ProjectManager || data.projectManager || null;
    
    // Financial data
    this.total = data.Total ? Total.fromAPIResponse(data.Total) : new Total();
    
    // Additional fields
    this.type = data.Type || data.type || '';
    this.validityDays = data.ValidityDays || data.validityDays || null;
    this.orderNo = data.OrderNo || data.orderNo || '';
    this.jobNo = data.JobNo || data.jobNo || '';
  }

  /**
   * Validate ID field
   * @param {*} id - The ID to validate
   * @returns {number} - The validated ID
   */
  validateId(id) {
    if (id === null || id === undefined) {
      throw new Error('Quote ID is required');
    }
    
    const numId = typeof id === 'string' ? parseInt(id, 10) : id;
    
    if (isNaN(numId)) {
      throw new Error(`Invalid Quote ID: ${id}`);
    }
    
    if (numId <= 0) {
      throw new Error(`Invalid Quote ID: ${numId}`);
    }
    
    return numId;
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
   * Parse status - can be object with Name/Color or simple string
   * @param {Object|string} status - Status data
   * @returns {Object} - Normalized status object
   */
  parseStatus(status) {
    if (!status) {
      return { name: '', color: '' };
    }
    
    if (typeof status === 'string') {
      return { name: status, color: '' };
    }
    
    if (typeof status === 'object') {
      return {
        id: status.ID || status.id || null,
        name: status.Name || status.name || '',
        color: status.Color || status.color || ''
      };
    }
    
    return { name: '', color: '' };
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
   * Get customer name from customer object
   * @returns {string} - Customer name
   */
  getCustomerName() {
    if (!this.customer) {
      return '';
    }
    
    return this.customer.CompanyName || this.customer.Name || this.customer.name || '';
  }

  /**
   * Get site name from site object
   * @returns {string} - Site name
   */
  getSiteName() {
    if (!this.site) {
      return '';
    }
    
    return this.site.Name || this.site.name || '';
  }

  /**
   * Get salesperson name
   * @returns {string} - Salesperson name
   */
  getSalespersonName() {
    if (!this.salesperson) {
      return '';
    }
    
    return this.salesperson.Name || this.salesperson.name || '';
  }

  /**
   * Get project manager name
   * @returns {string} - Project manager name
   */
  getProjectManagerName() {
    if (!this.projectManager) {
      return '';
    }
    
    return this.projectManager.Name || this.projectManager.name || '';
  }

  /**
   * Check if quote is expired based on due date
   * @returns {boolean} - True if expired
   */
  isExpired() {
    if (!this.dueDate) {
      return false;
    }
    
    return new Date() > this.dueDate;
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
      Notes: this.notes,
      DateIssued: this.formatDate(this.dateIssued),
      DateApproved: this.formatDate(this.dateApproved),
      DueDate: this.formatDate(this.dueDate),
      DateModified: this.formatDate(this.dateModified),
      Customer: this.customer,
      Site: this.site,
      Status: this.status,
      Stage: this.stage,
      CustomerStage: this.customerStage,
      Salesperson: this.salesperson,
      ProjectManager: this.projectManager,
      Total: this.total.toJSON(),
      Type: this.type,
      ValidityDays: this.validityDays,
      OrderNo: this.orderNo,
      JobNo: this.jobNo
    };
  }

  /**
   * Create a Quote instance from API response
   * @param {Object} data - Raw API data
   * @returns {Quote}
   */
  static fromAPIResponse(data) {
    return new Quote(data);
  }

  /**
   * Validate the structure of API response data
   * @param {Object} data - Data to validate
   * @returns {boolean} - True if valid
   */
  static validateAPIResponse(data) {
    const requiredFields = ['ID'];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`Missing required Quote field: ${field}`);
      }
    }
    
    return true;
  }
}

module.exports = Quote;