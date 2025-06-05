/**
 * Total data model for financial calculations
 */
class Total {
  constructor(data = {}) {
    this.exTax = this.validateAmount(data.ExTax || data.exTax);
    this.incTax = this.validateAmount(data.IncTax || data.incTax);
    this.tax = this.validateAmount(data.Tax || data.tax);
    
    // Validate consistency
    this.validateConsistency();
  }

  /**
   * Validate that an amount is a valid number
   * @param {*} amount - The amount to validate
   * @returns {number} - The validated amount
   */
  validateAmount(amount) {
    if (amount === null || amount === undefined) {
      return 0;
    }
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) {
      throw new Error(`Invalid amount: ${amount}`);
    }
    
    if (numAmount < 0) {
      throw new Error(`Amount cannot be negative: ${numAmount}`);
    }
    
    return Math.round(numAmount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Validate that ExTax + Tax = IncTax (within rounding tolerance)
   */
  validateConsistency() {
    const tolerance = 0.01; // 1 cent tolerance for rounding
    const calculated = this.exTax + this.tax;
    
    if (Math.abs(calculated - this.incTax) > tolerance) {
      throw new Error(
        `Total amounts are inconsistent: ExTax(${this.exTax}) + Tax(${this.tax}) != IncTax(${this.incTax})`
      );
    }
  }

  /**
   * Convert to JSON object
   * @returns {Object}
   */
  toJSON() {
    return {
      ExTax: this.exTax,
      IncTax: this.incTax,
      Tax: this.tax
    };
  }

  /**
   * Create a Total instance from API response
   * @param {Object} data - Raw API data
   * @returns {Total}
   */
  static fromAPIResponse(data) {
    return new Total(data);
  }

  /**
   * Add two Total objects together
   * @param {Total} other - Another Total to add
   * @returns {Total}
   */
  add(other) {
    if (!(other instanceof Total)) {
      throw new Error('Can only add Total instances');
    }
    
    return new Total({
      ExTax: this.exTax + other.exTax,
      IncTax: this.incTax + other.incTax,
      Tax: this.tax + other.tax
    });
  }

  /**
   * Calculate percentage of this total compared to another
   * @param {Total} total - The total to compare against
   * @returns {number} - Percentage (0-100)
   */
  percentageOf(total) {
    if (!(total instanceof Total)) {
      throw new Error('Can only compare with Total instances');
    }
    
    if (total.incTax === 0) {
      return 0;
    }
    
    return (this.incTax / total.incTax) * 100;
  }
}

module.exports = Total;