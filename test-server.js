const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// Temporary in-memory session store for testing
const sessions = new Map();

// Mock user data for testing
const mockUser = {
    uuid: 'test-user-123',
    email: 'test@example.com'
};

// Mock settings data
const mockSettings = {
    theme: 'light',
    notifications_enabled: true,
    calendar_default_view: 'week',
    time_format: '12h',
    date_format: 'MM/DD/YYYY',
    language: 'en'
};

// Session middleware
app.use((req, res, next) => {
    const sessionId = req.headers.cookie?.split('sessionId=')[1]?.split(';')[0];
    if (sessionId && sessions.has(sessionId)) {
        req.session = { userId: sessions.get(sessionId) };
    } else {
        req.session = { userId: mockUser.uuid }; // Auto-login for testing
    }
    next();
});

// Auth endpoints
app.get('/auth/whoami', (req, res) => {
    res.json({ 
        success: true, 
        loggedIn: true, 
        user: { email: mockUser.email }
    });
});

// Settings endpoints
app.get('/user/settings', (req, res) => {
    console.log('GET /user/settings called');
    res.json({ 
        success: true, 
        settings: mockSettings
    });
});

app.patch('/user/settings', (req, res) => {
    console.log('PATCH /user/settings called with:', req.body);
    
    // Update mock settings
    Object.assign(mockSettings, req.body);
    
    console.log('Updated settings:', mockSettings);
    res.json({ 
        success: true, 
        message: 'Settings updated successfully'
    });
});

// Other mock endpoints that might be called
app.get('/user/notes', (req, res) => {
    res.json({ success: true, notes: [] });
});

app.get('/user/events', (req, res) => {
    res.json({ success: true, events: [] });
});

app.get('/user/events/upcoming', (req, res) => {
    res.json({ success: true, events: [] });
});

app.get('/user/notes/recent', (req, res) => {
    res.json({ success: true, notes: [] });
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log('This is a temporary server for testing theme functionality');
});