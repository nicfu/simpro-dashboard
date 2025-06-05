// API endpoints
const API_BASE = '/api';

// State
let quotesData = [];
let costCentersData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    checkAPIConnection();
    fetchQuotes();
    fetchCostCenters();
});

// Check API connection
async function checkAPIConnection() {
    const statusElement = document.getElementById('apiStatus');
    const statusText = statusElement.querySelector('.status-text');
    
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();
        
        if (data.success) {
            statusElement.classList.add('connected');
            statusText.textContent = 'API Connected';
            document.getElementById('apiUrl').textContent = data.apiUrl;
        } else {
            throw new Error('API health check failed');
        }
    } catch (error) {
        statusElement.classList.add('error');
        statusText.textContent = 'API Connection Failed';
        console.error('API connection error:', error);
    }
}

// Fetch quotes
async function fetchQuotes() {
    const loadingEl = document.getElementById('quotesLoading');
    const errorEl = document.getElementById('quotesError');
    const containerEl = document.getElementById('quotesContainer');
    const gridEl = document.getElementById('quotesGrid');
    const countEl = document.getElementById('quotesCount');
    
    // Show loading state
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    containerEl.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/quotes`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch quotes');
        }
        
        quotesData = result.data || [];
        
        // Update count
        countEl.textContent = result.count || quotesData.length;
        
        // Render quotes
        renderQuotes(gridEl, quotesData);
        
        // Show data container
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';
        
    } catch (error) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.querySelector('.error-message').textContent = `Error: ${error.message}`;
        console.error('Error fetching quotes:', error);
    }
}

// Fetch quote cost centers
async function fetchCostCenters() {
    const loadingEl = document.getElementById('costCentersLoading');
    const errorEl = document.getElementById('costCentersError');
    const containerEl = document.getElementById('costCentersContainer');
    const gridEl = document.getElementById('costCentersGrid');
    const countEl = document.getElementById('costCentersCount');
    
    // Show loading state
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    containerEl.style.display = 'none';
    
    try {
        const response = await fetch(`${API_BASE}/quote-cost-centers`);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to fetch cost centers');
        }
        
        costCentersData = result.data || [];
        
        // Update count
        countEl.textContent = result.count || costCentersData.length;
        
        // Render cost centers
        renderCostCenters(gridEl, costCentersData);
        
        // Show data container
        loadingEl.style.display = 'none';
        containerEl.style.display = 'block';
        
    } catch (error) {
        loadingEl.style.display = 'none';
        errorEl.style.display = 'block';
        errorEl.querySelector('.error-message').textContent = `Error: ${error.message}`;
        console.error('Error fetching cost centers:', error);
    }
}

// Render quotes
function renderQuotes(container, quotes) {
    container.innerHTML = '';
    
    if (!Array.isArray(quotes) || quotes.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">No quotes found</p>';
        return;
    }
    
    quotes.forEach((quote, index) => {
        const card = createQuoteCard(quote, index);
        container.appendChild(card);
    });
}

// Render cost centers
function renderCostCenters(container, costCenters) {
    container.innerHTML = '';
    
    if (!Array.isArray(costCenters) || costCenters.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #6c757d;">No cost centers found</p>';
        return;
    }
    
    costCenters.forEach((center, index) => {
        const card = createDataCard(`Cost Center ${center.ID || index + 1}`, center);
        container.appendChild(card);
    });
}

// Create a quote card with enhanced data display
function createQuoteCard(quote, index) {
    const card = document.createElement('div');
    card.className = 'data-card quote-card';
    
    // Create header with quote number and status
    const header = document.createElement('div');
    header.className = 'quote-header';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = `Quote #${quote.ID || quote.QuoteNumber || quote.id || index + 1}`;
    header.appendChild(titleEl);
    
    // Add status badge if available
    if (quote.Status || quote.Stage || quote.status) {
        const statusBadge = document.createElement('span');
        statusBadge.className = 'status-badge';
        
        // Handle Status object vs string
        let statusText = '';
        let statusColor = '';
        
        if (quote.Status && typeof quote.Status === 'object') {
            statusText = quote.Status.Name || quote.Status.name || '';
            statusColor = quote.Status.Color || quote.Status.color || getStatusColor(statusText);
        } else {
            statusText = quote.Status || quote.Stage || quote.status || '';
            statusColor = getStatusColor(statusText);
        }
        
        statusBadge.textContent = statusText;
        statusBadge.style.backgroundColor = statusColor;
        header.appendChild(statusBadge);
    }
    
    card.appendChild(header);
    
    // Create date summary section
    const dateSummary = createDateSummary(quote);
    if (dateSummary) {
        card.appendChild(dateSummary);
    }
    
    // Priority fields to display at the top - check for various possible field names
    const priorityFields = [
        { key: 'Name', label: 'Quote Name' },
        { key: 'Customer', label: 'Customer', format: 'object', subKey: 'CompanyName' },
        { key: 'Site', label: 'Site', format: 'object', subKey: 'Name' },
        { key: 'Stage', label: 'Stage' },
        { key: 'CustomerStage', label: 'Customer Stage' },
        { key: 'Salesperson', label: 'Salesperson', format: 'object', subKey: 'Name' },
        { key: 'ProjectManager', label: 'Project Manager', format: 'object', subKey: 'Name' },
        { key: 'Total', label: 'Total (Inc Tax)', format: 'currency', subKey: 'IncTax' },
        { key: 'Total', label: 'Total (Ex Tax)', format: 'currency', subKey: 'ExTax' },
        { key: 'Total', label: 'Tax Amount', format: 'currency', subKey: 'Tax' },
        { key: 'DateIssued', label: 'Date Issued', format: 'date' },
        { key: 'DateApproved', label: 'Date Approved', format: 'date' },
        { key: 'DueDate', label: 'Due Date', format: 'date' },
        { key: 'DateModified', label: 'Last Modified', format: 'date' },
        { key: 'ValidityDays', label: 'Validity (Days)' },
        { key: 'OrderNo', label: 'Order Number' },
        { key: 'JobNo', label: 'Job Number' },
        { key: 'Type', label: 'Type' },
        { key: 'Description', label: 'Description', format: 'html' },
        { key: 'Notes', label: 'Notes' }
    ];
    
    // Display priority fields first
    const displayedKeys = [];
    priorityFields.forEach(({ key, label, format, subKey }) => {
        if (quote[key] !== undefined && quote[key] !== null && quote[key] !== '') {
            let value = quote[key];
            
            // Handle sub-keys for complex objects like Total, Customer, Site, etc.
            if (subKey && typeof value === 'object' && value !== null) {
                value = value[subKey];
            }
            
            // Handle object formatting for display
            if (format === 'object' && typeof value === 'object' && value !== null && !subKey) {
                // For objects without subKey, try to get a display name
                value = value.Name || value.CompanyName || value.name || JSON.stringify(value);
            }
            
            if (value !== undefined && value !== null && value !== '') {
                const fieldEl = createEnhancedField(label, value, format);
                card.appendChild(fieldEl);
                if (!displayedKeys.includes(key)) {
                    displayedKeys.push(key);
                }
            }
        }
    });
    
    // Display remaining fields
    Object.entries(quote).forEach(([key, value]) => {
        if (!displayedKeys.includes(key) &&
            key !== 'Status' && key !== 'Stage' && key !== 'status' &&
            value !== null && value !== undefined && value !== '') {
            // Check if it might be a date field
            let format = null;
            if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
                format = 'date';
            } else if (key.toLowerCase().includes('total') || key.toLowerCase().includes('amount') ||
                       key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) {
                format = 'currency';
            }
            const fieldEl = format ? createEnhancedField(formatFieldLabel(key), value, format) : createField(key, value);
            card.appendChild(fieldEl);
        }
    });
    
    // Add JSON viewer toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-json';
    toggleBtn.textContent = 'View JSON';
    toggleBtn.onclick = () => toggleJsonView(card, quote);
    card.appendChild(toggleBtn);
    
    return card;
}

// Create a data card for displaying an item
function createDataCard(title, data) {
    const card = document.createElement('div');
    card.className = 'data-card';
    
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    card.appendChild(titleEl);
    
    // Display all fields
    Object.entries(data).forEach(([key, value]) => {
        const fieldEl = createField(key, value);
        card.appendChild(fieldEl);
    });
    
    // Add JSON viewer toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-json';
    toggleBtn.textContent = 'View JSON';
    toggleBtn.onclick = () => toggleJsonView(card, data);
    card.appendChild(toggleBtn);
    
    return card;
}

// Create an enhanced field element with formatting
function createEnhancedField(label, value, format) {
    const fieldEl = document.createElement('div');
    fieldEl.className = 'data-field';
    
    const labelEl = document.createElement('span');
    labelEl.className = 'field-label';
    labelEl.textContent = label + ':';
    
    const valueEl = document.createElement('span');
    valueEl.className = 'field-value';
    
    // Apply formatting based on type
    if (value === null || value === undefined || value === '') {
        valueEl.className += ' null';
        valueEl.textContent = 'N/A';
    } else if (format === 'date') {
        valueEl.textContent = formatDate(value);
        valueEl.className += ' date-value';
    } else if (format === 'currency') {
        const formatted = formatCurrency(value);
        valueEl.textContent = formatted;
        valueEl.className += ' currency-value';
    } else if (format === 'html') {
        // Strip HTML tags and decode entities
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = value;
        valueEl.textContent = tempDiv.textContent || tempDiv.innerText || '';
    } else if (format === 'object' && typeof value === 'object' && value !== null) {
        // Handle object display
        valueEl.textContent = value.Name || value.CompanyName || value.name || JSON.stringify(value);
    } else {
        valueEl.textContent = value.toString();
    }
    
    fieldEl.appendChild(labelEl);
    fieldEl.appendChild(valueEl);
    
    return fieldEl;
}

// Create a field element
function createField(label, value) {
    const fieldEl = document.createElement('div');
    fieldEl.className = 'data-field';
    
    const labelEl = document.createElement('span');
    labelEl.className = 'field-label';
    labelEl.textContent = formatFieldLabel(label) + ':';
    
    const valueEl = document.createElement('span');
    valueEl.className = 'field-value';
    
    // Handle different value types
    if (value === null || value === undefined) {
        valueEl.className += ' null';
        valueEl.textContent = 'null';
    } else if (typeof value === 'object') {
        valueEl.textContent = JSON.stringify(value, null, 2);
    } else if (typeof value === 'boolean') {
        valueEl.textContent = value ? 'Yes' : 'No';
    } else {
        valueEl.textContent = value.toString();
    }
    
    fieldEl.appendChild(labelEl);
    fieldEl.appendChild(valueEl);
    
    return fieldEl;
}

// Format field labels to be more readable
function formatFieldLabel(label) {
    // Convert camelCase to Title Case
    return label
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .replace(/Id$/i, 'ID')
        .trim();
}

// Create a date summary section for quotes
function createDateSummary(quote) {
    const dateFields = [];
    
    // Check for various date field names
    const dateFieldMappings = [
        { keys: ['DateCreated', 'dateCreated', 'created_at', 'createdAt'], label: 'Created' },
        { keys: ['DateModified', 'dateModified', 'updated_at', 'updatedAt', 'lastModified'], label: 'Modified' },
        { keys: ['DateIssued', 'dateIssued', 'issued_at', 'issuedAt'], label: 'Issued' },
        { keys: ['DateAccepted', 'dateAccepted', 'accepted_at', 'acceptedAt'], label: 'Accepted' },
        { keys: ['DateDeclined', 'dateDeclined', 'declined_at', 'declinedAt'], label: 'Declined' },
        { keys: ['ExpiryDate', 'expiryDate', 'expires_at', 'expiresAt', 'validUntil'], label: 'Expires' }
    ];
    
    // Find all available date fields
    dateFieldMappings.forEach(({ keys, label }) => {
        for (const key of keys) {
            if (quote[key] && quote[key] !== null && quote[key] !== '') {
                dateFields.push({ label, value: formatDate(quote[key]) });
                break;
            }
        }
    });
    
    // Also check for any other fields that might be dates
    Object.entries(quote).forEach(([key, value]) => {
        if (value && (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) &&
            !dateFieldMappings.some(mapping => mapping.keys.includes(key))) {
            // Try to parse as date
            const formatted = formatDate(value);
            if (formatted !== value) { // If formatting changed it, it's likely a date
                dateFields.push({ label: formatFieldLabel(key), value: formatted });
            }
        }
    });
    
    // If no date fields found, return null
    if (dateFields.length === 0) {
        return null;
    }
    
    // Create the date summary element
    const summary = document.createElement('div');
    summary.className = 'date-summary';
    
    dateFields.forEach(({ label, value }) => {
        const dateItem = document.createElement('div');
        dateItem.className = 'date-item';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'date-label';
        labelSpan.textContent = label + ':';
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'date-value';
        valueSpan.textContent = value;
        
        dateItem.appendChild(labelSpan);
        dateItem.appendChild(valueSpan);
        summary.appendChild(dateItem);
    });
    
    return summary;
}

// Toggle JSON view for a card
function toggleJsonView(card, data) {
    const existingViewer = card.querySelector('.json-viewer');
    
    if (existingViewer) {
        existingViewer.remove();
        card.querySelector('.toggle-json').textContent = 'View JSON';
    } else {
        const viewer = document.createElement('pre');
        viewer.className = 'json-viewer';
        viewer.textContent = JSON.stringify(data, null, 2);
        card.appendChild(viewer);
        card.querySelector('.toggle-json').textContent = 'Hide JSON';
    }
}

// Utility function to format dates
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString;
        }
        
        // Format date with time if time component exists
        const hasTime = dateString.includes('T') || dateString.includes(' ');
        
        if (hasTime) {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    } catch (error) {
        return dateString;
    }
}

// Get status color based on status text
function getStatusColor(status) {
    if (!status || typeof status !== 'string') {
        return '#006a7a'; // Much darker teal for excellent contrast
    }
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('accept') || statusLower.includes('approved') || statusLower.includes('complete')) {
        return '#1e7e34'; // Darker green for better contrast
    } else if (statusLower.includes('pending') || statusLower.includes('draft') || statusLower.includes('scheduled') || statusLower.includes('to be completed')) {
        return '#f39c12'; // Darker orange instead of yellow for excellent contrast
    } else if (statusLower.includes('decline') || statusLower.includes('reject') || statusLower.includes('cancel')) {
        return '#bd2130'; // Darker red for better contrast
    } else if (statusLower.includes('expired')) {
        return '#343a40'; // Much darker gray for excellent contrast
    } else if (statusLower.includes('sent') || statusLower.includes('submit')) {
        return '#004085'; // Darker blue for better contrast
    } else if (statusLower.includes('in progress') || statusLower.includes('processing')) {
        return '#d35400'; // Even darker orange for in-progress states
    } else {
        return '#006a7a'; // Much darker teal for excellent contrast
    }
}

// Utility function to format currency
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return 'N/A';
    
    // Try to parse the amount if it's a string
    let numericAmount = amount;
    if (typeof amount === 'string') {
        // Remove any non-numeric characters except decimal point and minus
        numericAmount = parseFloat(amount.replace(/[^0-9.-]/g, ''));
    }
    
    // Check if the result is a valid number
    if (isNaN(numericAmount)) {
        return amount.toString(); // Return original if can't parse
    }
    
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(numericAmount);
    } catch (error) {
        return numericAmount.toString();
    }
}