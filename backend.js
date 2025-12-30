/*
=============================================================================
ENDPOINTS OVERVIEW PLAN
=============================================================================

AUTH:
  POST /auth/register  → Create user, hash password, set session
  POST /auth/login     → Verify password, set session
  POST /auth/logout    → Destroy session
  GET  /auth/whoami        → Check if logged in, return user email

NOTES:
  GET    /api/notes        → List all notes for logged-in user
  GET    /api/notes/:title    → Get single note by ID
  POST   /api/notes        → Create new note
  PATCH  /api/notes/:title    → Update note title/body
  DELETE /api/notes/:title    → Delete note

EVENTS (Calendar):
  GET    /api/events       → List all events for user
  POST   /api/events       → Create event (or import from ICS)
  DELETE /api/events/:id   → Delete event

=============================================================================
*/

require('dotenv').config();
const { EXPRESS_PORT } = process.env;

const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const bcrypt = require('bcrypt');
const express = require('express');
const session = require('express-session');
const databaseHandler = require('./databaseHandler');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* 
Source: https://www.youtube.com/watch?v=OH6Z0dJ_Huk 
My familiarity with express-session was limited.
*/
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // Not using SSL.
        maxAge: 24 * 60 * 60 * 1000 // 24 hours expiry date.
    }
}));

app.get('/auth', (req, res) => {
    res.json({ message: 'Auth endpoint is working.' });
});

app.get('/auth/whoami', (req, res) => 
{
    // Verify Session
    if (req.session && req.session.userId)
        return res.json({ loggedIn: true, userId: req.session.userId });
    else 
    // If No Session Exists
        return res.json({ loggedIn: false });
});

app.post('/auth/login', async (req, res) => {
    if (!req.body.length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is empty' });
    }

    // If already logged in, redirect to dashboard
    if (req.session && req.session.userId) 
    {
        return res.redirect('/dashboard.html');
    }

    const { email, password } = req.body;

    // Validate Credientials are Provided
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    try {
        // 1. Look up user by email
        const { verify, user } = await databaseHandler.verifyUserEmail(email);

        // 2. Check if user exists
        if (!verify || !user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // 3. Compare password with bcrypt
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // 4. Create session with user uuid
        req.session.userId = user.uuid;

        // 5. Respond with success
        return res.json({ success: true, userId: user.uuid, email: user.email });
    } catch(error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/auth/register', async (req, res) => {
    if (!req.body.length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is empty' });
    }

    // If already logged in, redirect to dashboard
    if (req.session && req.session.userId) 
    {
        return res.redirect('/dashboard.html');
    }

    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    try {
        var { verify, user } = databaseHandler.verifyUserEmail(email);

        if (verify) { res.send(409).json({ success: false, error: 'Email already registered' }); }

        // 3. Hash password and create user
        const userId = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, 10);
        
        const created = await databaseHandler.addNewUser(userId, email, passwordHash);
        
        if (!created) {
            return res.status(500).json({ success: false, error: 'Failed to create user' });
        }

        // 4. Create session
        req.session.userId = userId;

        // 5. Respond with success (frontend handles redirect)
        return res.status(201).json({ success: true, userId, email });
    } catch (error) {

        // Temp Error Catch: Handle duplicate email (MySQL error 1062)
        if (error.sqlState === '23000') {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Start the server
app.listen(EXPRESS_PORT, () => {
    console.log(`Server running on port ${EXPRESS_PORT}`);
});