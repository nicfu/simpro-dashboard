# Simpro API Dashboard

A secure web application for retrieving and displaying data from Simpro's API. This application fetches data from the Quotes and Quote Cost Centers endpoints and displays it in a clean, responsive interface.

## Features

- **Secure API Integration**: API credentials are stored server-side in environment variables
- **Real-time Data Fetching**: Retrieve quotes and cost centers from Simpro API
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Graceful error handling with user-friendly messages
- **Loading States**: Visual feedback during data fetching
- **Data Visualization**: Clean card-based layout with all available fields
- **JSON View**: Toggle to view raw JSON data for each item
- **Auto-refresh**: Manual refresh buttons for each data section

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- Valid Simpro API credentials

## Installation

1. Clone or download this repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure your `.env` file contains the required credentials:
   ```
   SIMPRO_API_KEY=your_api_key_here
   SIMPRO_API_URL=https://your-instance.simprosuite.com/api/v1.0/companies/0/
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```
This will start the server with auto-reload on file changes.

### Production Mode
```bash
npm start
```

The application will be available at `http://localhost:3000`

## API Endpoints

The application exposes the following endpoints:

- `GET /api/health` - Check API connection status
- `GET /api/quotes` - Fetch all quotes from Simpro
- `GET /api/quote-cost-centers` - Fetch all quote cost centers from Simpro

## Security Features

- API credentials are never exposed to the client-side
- All API requests are proxied through the Node.js server
- Environment variables are used for sensitive configuration
- `.gitignore` file ensures credentials are not committed to version control

## Project Structure

```
simpro-api-dashboard/
├── .env                 # Environment variables (not in version control)
├── .gitignore          # Git ignore file
├── package.json        # Node.js dependencies and scripts
├── server.js           # Express server handling API requests
├── README.md           # This file
└── public/             # Frontend files
    ├── index.html      # Main HTML file
    ├── styles.css      # CSS styles
    └── app.js          # Frontend JavaScript
```

## Troubleshooting

### API Connection Failed
- Verify your API credentials in the `.env` file
- Check that the API URL is correct and accessible
- Ensure your API key has the necessary permissions

### No Data Displayed
- Check the browser console for error messages
- Verify the API endpoints are returning data
- Ensure your Simpro instance has quotes and cost centers

### Port Already in Use
- The default port is 3000. If it's already in use, you can change it by setting the PORT environment variable:
  ```bash
  PORT=3001 npm start
  ```

## Browser Compatibility

The application supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is provided as-is for demonstration purposes.