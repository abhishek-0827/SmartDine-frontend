const config = {
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
    // Base URL without /api if needed for other things, though currently all routes seem to be under /api or handled by it
    SERVER_URL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:4000'
};

export default config;
