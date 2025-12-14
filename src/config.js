let apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Remove trailing slash if present
if (apiBaseUrl.endsWith('/')) {
    apiBaseUrl = apiBaseUrl.slice(0, -1);
}

// Ensure it ends with /api
// This handles cases where user provides the root URL (e.g. ...onrender.com) instead of .../api
if (!apiBaseUrl.endsWith('/api')) {
    apiBaseUrl = `${apiBaseUrl}/api`;
}

const config = {
    API_BASE_URL: apiBaseUrl,
    SERVER_URL: apiBaseUrl.replace('/api', '')
};

export default config;
