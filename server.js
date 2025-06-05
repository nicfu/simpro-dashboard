const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Validate environment variables
if (!process.env.SIMPRO_API_KEY || !process.env.SIMPRO_API_URL) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

// Configure axios instance for Simpro API
const simproAPI = axios.create({
    baseURL: process.env.SIMPRO_API_URL,
    headers: {
        'Authorization': `Bearer ${process.env.SIMPRO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// API Routes

// Get quotes with enhanced data
app.get('/api/quotes', async (req, res) => {
    try {
        console.log('Fetching quotes from Simpro API with enhanced columns...');
        
        // Request specific columns including date fields and other important data
        const columns = [
            'ID',
            'Name',
            'Description',
            'Notes',
            'DateIssued',
            'DateApproved',
            'DueDate',
            'DateModified',
            'Customer',
            'Site',
            'Status',
            'Stage',
            'CustomerStage',
            'Salesperson',
            'ProjectManager',
            'Total',
            'Type',
            'ValidityDays',
            'OrderNo',
            'JobNo'
        ].join(',');
        
        const response = await simproAPI.get('quotes/', {
            params: {
                columns: columns
            }
        });
        
        console.log(`Fetched ${response.data.length || 0} quotes with enhanced data`);
        
        // Log the first quote to see available fields
        if (response.data && response.data.length > 0) {
            console.log('Sample enhanced quote structure:', JSON.stringify(response.data[0], null, 2));
            
            // Check for date fields in the enhanced quote
            const firstQuote = response.data[0];
            const dateFields = Object.keys(firstQuote).filter(key =>
                key.toLowerCase().includes('date') ||
                key.toLowerCase().includes('time') ||
                key.toLowerCase().includes('created') ||
                key.toLowerCase().includes('modified') ||
                key.toLowerCase().includes('updated')
            );
            console.log('Date fields found in enhanced quotes:', dateFields);
        }
        
        res.json({
            success: true,
            data: response.data,
            count: response.data.length || 0
        });
    } catch (error) {
        console.error('Error fetching quotes:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch quotes'
        });
    }
});

// Initialize Quote Cost Center Service
const QuoteCostCenterService = require('./src/services/QuoteCostCenterService');
const quoteCostCenterService = new QuoteCostCenterService({
    baseURL: process.env.SIMPRO_API_URL,
    apiKey: process.env.SIMPRO_API_KEY,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000
});

// Get quote cost centers (legacy endpoint - simple cost centers)
app.get('/api/quote-cost-centers', async (req, res) => {
    try {
        console.log('Fetching quote cost centers from Simpro API...');
        // Use legacy endpoint for backward compatibility
        const response = await simproAPI.get('costCenters/');
        res.json({
            success: true,
            data: response.data,
            count: response.data.length || 0
        });
    } catch (error) {
        console.error('Error fetching quote cost centers:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch quote cost centers'
        });
    }
});

// Get quote cost center summaries (step 1 of two-step process)
app.get('/api/quote-cost-centers/summaries', async (req, res) => {
    try {
        console.log('Fetching quote cost center summaries...');
        
        const params = req.query;
        const summaries = await quoteCostCenterService.fetchQuoteCostCenterSummaries(params);
        
        res.json({
            success: true,
            data: summaries.map(cc => cc.toJSON()),
            count: summaries.length,
            metadata: {
                endpoint: 'summaries',
                params: params
            }
        });
    } catch (error) {
        console.error('Error fetching quote cost center summaries:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Failed to fetch quote cost center summaries',
            operation: error.operation || 'summaries',
            timestamp: error.timestamp || new Date().toISOString()
        });
    }
});

// Get detailed cost center (step 2 of two-step process)
app.get('/api/quote-cost-centers/detailed/:quoteId/:sectionId', async (req, res) => {
    try {
        const { quoteId, sectionId } = req.params;
        
        console.log(`Fetching detailed cost center for quote ${quoteId}, section ${sectionId}...`);
        
        // Validate parameters
        if (!quoteId || !sectionId) {
            return res.status(400).json({
                success: false,
                error: 'Both quoteId and sectionId are required'
            });
        }
        
        const detailed = await quoteCostCenterService.fetchDetailedCostCenter(
            parseInt(quoteId, 10),
            parseInt(sectionId, 10)
        );
        
        res.json({
            success: true,
            data: detailed.toJSON(),
            metadata: {
                endpoint: 'detailed',
                quoteId: parseInt(quoteId, 10),
                sectionId: parseInt(sectionId, 10)
            }
        });
    } catch (error) {
        console.error('Error fetching detailed cost center:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Failed to fetch detailed cost center',
            operation: error.operation || 'detailed',
            timestamp: error.timestamp || new Date().toISOString()
        });
    }
});

// Get complete quote cost centers (full two-step workflow)
app.get('/api/quote-cost-centers/complete', async (req, res) => {
    try {
        console.log('Executing complete quote cost centers workflow...');
        
        const params = req.query;
        const complete = await quoteCostCenterService.fetchCompleteQuoteCostCenters(params);
        
        res.json({
            success: true,
            data: complete.map(cc => cc.toJSON()),
            count: complete.length,
            metadata: {
                endpoint: 'complete',
                params: params,
                workflow: 'two-step',
                detailedCount: complete.filter(cc => cc.isDetailed()).length,
                summaryCount: complete.filter(cc => !cc.isDetailed()).length
            }
        });
    } catch (error) {
        console.error('Error in complete quote cost centers workflow:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Failed to complete quote cost centers workflow',
            operation: error.operation || 'complete',
            timestamp: error.timestamp || new Date().toISOString()
        });
    }
});

// Get cost centers for a specific quote
app.get('/api/quote-cost-centers/quote/:quoteId', async (req, res) => {
    try {
        const { quoteId } = req.params;
        
        console.log(`Fetching cost centers for quote ${quoteId}...`);
        
        // Validate parameter
        if (!quoteId) {
            return res.status(400).json({
                success: false,
                error: 'Quote ID is required'
            });
        }
        
        const costCenters = await quoteCostCenterService.fetchCostCentersForQuote(
            parseInt(quoteId, 10)
        );
        
        res.json({
            success: true,
            data: costCenters.map(cc => cc.toJSON()),
            count: costCenters.length,
            metadata: {
                endpoint: 'quote-specific',
                quoteId: parseInt(quoteId, 10),
                detailedCount: costCenters.filter(cc => cc.isDetailed()).length,
                summaryCount: costCenters.filter(cc => !cc.isDetailed()).length
            }
        });
    } catch (error) {
        console.error('Error fetching cost centers for quote:', error);
        res.status(error.status || 500).json({
            success: false,
            error: error.message || 'Failed to fetch cost centers for quote',
            operation: error.operation || 'quote-specific',
            timestamp: error.timestamp || new Date().toISOString()
        });
    }
});

// Service health check
app.get('/api/quote-cost-centers/health', (req, res) => {
    try {
        const healthStatus = quoteCostCenterService.getHealthStatus();
        
        res.json({
            success: true,
            service: 'QuoteCostCenterService',
            status: 'healthy',
            ...healthStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting service health status:', error);
        res.status(500).json({
            success: false,
            service: 'QuoteCostCenterService',
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        apiUrl: process.env.SIMPRO_API_URL
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server (only if not in test environment)
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Connected to Simpro API at: ${process.env.SIMPRO_API_URL}`);
    });
}

// Export app for testing
module.exports = app;