// Mock data for Quote Cost Centers API testing

const mockQuoteCostCenterSummaries = [
  {
    "ID": 1,
    "QuoteID": 12345,
    "SectionID": 67890,
    "Name": "Labor Cost Center",
    "Description": "Labor costs for main construction",
    "Total": {
      "ExTax": 15000.00,
      "IncTax": 16500.00,
      "Tax": 1500.00
    },
    "DateCreated": "2024-01-15T08:30:00.000Z",
    "DateModified": "2024-01-20T14:45:30.123Z",
    "Status": "Active",
    "Type": "Labor"
  },
  {
    "ID": 2,
    "QuoteID": 12345,
    "SectionID": 67891,
    "Name": "Materials Cost Center",
    "Description": "Material costs for construction project",
    "Total": {
      "ExTax": 25000.00,
      "IncTax": 27500.00,
      "Tax": 2500.00
    },
    "DateCreated": "2024-01-15T08:30:00.000Z",
    "DateModified": "2024-01-22T09:15:45.456Z",
    "Status": "Active",
    "Type": "Material"
  },
  {
    "ID": 3,
    "QuoteID": 12346,
    "SectionID": 67892,
    "Name": "Equipment Cost Center",
    "Description": "Equipment rental and usage costs",
    "Total": {
      "ExTax": 8000.00,
      "IncTax": 8800.00,
      "Tax": 800.00
    },
    "DateCreated": "2024-01-16T10:00:00.000Z",
    "DateModified": "2024-01-23T16:20:15.789Z",
    "Status": "Active",
    "Type": "Equipment"
  }
];

const mockDetailedCostCenter = {
  "ID": 1,
  "QuoteID": 12345,
  "SectionID": 67890,
  "Name": "Labor Cost Center",
  "Description": "Labor costs for main construction",
  "Total": {
    "ExTax": 15000.00,
    "IncTax": 16500.00,
    "Tax": 1500.00
  },
  "DateCreated": "2024-01-15T08:30:00.000Z",
  "DateModified": "2024-01-20T14:45:30.123Z",
  "Status": "Active",
  "Type": "Labor",
  "Quote": {
    "ID": 12345,
    "Name": "Office Building Renovation",
    "Customer": {
      "ID": 789,
      "CompanyName": "ABC Construction Ltd",
      "ContactName": "John Smith",
      "Email": "john.smith@abc-construction.com"
    },
    "Site": {
      "ID": 456,
      "Name": "Downtown Office Complex",
      "Address": "123 Business Street, City Center",
      "Coordinates": {
        "Latitude": -36.8485,
        "Longitude": 174.7633
      }
    },
    "DateIssued": "2024-01-10T00:00:00.000Z",
    "DateApproved": "2024-01-25T09:30:00.000Z",
    "DueDate": "2024-03-15T23:59:59.999Z",
    "Status": {
      "ID": 1,
      "Name": "Approved",
      "Color": "#28a745"
    },
    "Salesperson": {
      "ID": 101,
      "Name": "Sarah Johnson",
      "Email": "sarah.johnson@company.com"
    },
    "ProjectManager": {
      "ID": 102,
      "Name": "Mike Wilson",
      "Email": "mike.wilson@company.com"
    },
    "ValidityDays": 30,
    "OrderNo": "ORD-2024-001",
    "JobNo": "JOB-2024-0015"
  },
  "Section": {
    "ID": 67890,
    "Name": "Phase 1 - Demolition and Preparation",
    "Description": "Initial demolition and site preparation work",
    "Order": 1,
    "DateCreated": "2024-01-15T08:00:00.000Z",
    "DateModified": "2024-01-20T14:45:30.123Z",
    "Status": "Active",
    "Total": {
      "ExTax": 35000.00,
      "IncTax": 38500.00,
      "Tax": 3500.00
    }
  },
  "CostCenter": {
    "Categories": [
      {
        "ID": 1,
        "Name": "Senior Labor",
        "Rate": 85.00,
        "Hours": 120,
        "Total": {
          "ExTax": 10200.00,
          "IncTax": 11220.00,
          "Tax": 1020.00
        }
      },
      {
        "ID": 2,
        "Name": "General Labor",
        "Rate": 45.00,
        "Hours": 80,
        "Total": {
          "ExTax": 3600.00,
          "IncTax": 3960.00,
          "Tax": 360.00
        }
      },
      {
        "ID": 3,
        "Name": "Apprentice Labor",
        "Rate": 25.00,
        "Hours": 48,
        "Total": {
          "ExTax": 1200.00,
          "IncTax": 1320.00,
          "Tax": 120.00
        }
      }
    ],
    "TotalHours": 248,
    "TotalCost": {
      "ExTax": 15000.00,
      "IncTax": 16500.00,
      "Tax": 1500.00
    },
    "Margin": {
      "Percentage": 15.0,
      "Amount": {
        "ExTax": 2250.00,
        "IncTax": 2475.00,
        "Tax": 225.00
      }
    }
  }
};

const mockErrorResponses = {
  invalidQuoteId: {
    "error": {
      "code": "QUOTE_NOT_FOUND",
      "message": "Quote with ID 99999 not found",
      "details": "The specified quote ID does not exist or you do not have permission to access it"
    }
  },
  invalidSectionId: {
    "error": {
      "code": "SECTION_NOT_FOUND", 
      "message": "Section with ID 99999 not found in quote 12345",
      "details": "The specified section ID does not exist in the given quote"
    }
  },
  networkError: {
    "error": {
      "code": "NETWORK_ERROR",
      "message": "Connection timeout",
      "details": "Unable to connect to the API server"
    }
  },
  malformedResponse: {
    "invalid": "json",
    "missing": ["required", "fields"]
  },
  unauthorizedAccess: {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Invalid API key",
      "details": "The provided API key is invalid or has expired"
    }
  },
  rateLimitExceeded: {
    "error": {
      "code": "RATE_LIMIT_EXCEEDED",
      "message": "Too many requests",
      "details": "Rate limit of 1000 requests per hour exceeded"
    }
  }
};

const mockEmptyResponse = [];

const mockPartialResponse = [
  {
    "ID": 1,
    "QuoteID": 12345,
    // Missing SectionID intentionally
    "Name": "Incomplete Cost Center",
    "Total": {
      "ExTax": 1000.00
      // Missing IncTax and Tax intentionally
    }
  }
];

module.exports = {
  mockQuoteCostCenterSummaries,
  mockDetailedCostCenter,
  mockErrorResponses,
  mockEmptyResponse,
  mockPartialResponse
};