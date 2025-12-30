const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const fs = require('fs');
const bcrypt = require('bcrypt');
const express = require('express');
const session = require('express-session');
const databaseHandler = require('./databaseHandler');

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

require("dotenv").config();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* 
Source: https://www.youtube.com/watch?v=OH6Z0dJ_Huk 
My familiarity with express-session was limited.
*/
app.use(session({
    secret: process.env.SESSION_SECRET || 'change-this-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        sameSite: 'lax',
        secure: false, // Not using SSL.
        maxAge: 24 * 60 * 60 * 1000 // 24 hours expiry date.
    }
}));

app.get('/', (req, res) => res.sendStatus(500));

app.get('/auth/whoami', (req, res) => 
{
    // Verify Session
    if (req.session && req.session.userId) {
        return res.json({ loggedIn: true, userId: req.session.userId });
    }

    // If No Session Exists
    return res.json({ loggedIn: false });
});

app.post('/auth/login', async (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session && req.session.userId) 
    {
        return res.redirect('/dashboard.html');
    }

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    try {
        // 1. Find user by email
        const [rows] = await databaseHandler.pool.execute(
            'SELECT id, email, password_hash FROM users WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const user = rows[0];

        // 2. Compare password with bcrypt
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) 
        {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // 3. Create session var with user id for verification
        req.session.userId = user.id;

        // 4. Respond with success by verifying user info
        return res.json({ success: true, userId: user.id, email: user.email });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Start the server (typically at the end of the file)
app.listen(3000, () => {
    console.log('Server running on port 3000');
});