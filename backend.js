/*
=============================================================================
ENDPOINTS OVERVIEW PLAN
=============================================================================

AUTH:
  POST /auth/register  → Create user, hash password, set session ✔️
  POST /auth/login     → Verify password, set session ✔️
  POST /auth/logout    → Destroy session ✔️
  GET  /auth/whoami        → Check if logged in, return user email ✔️

NOTES:
  GET    /user/notes        → List all notes for logged-in user ✔️
  GET    /user/notes/:title    → Get single note by Title ✔️
  POST   /user/notes        → Create new note ✔️
  PATCH  /user/notes/:title    → Update note title/body ✔️
  DELETE /user/notes/:title    → Delete note ✔️

EVENTS (Calendar):
  GET    /user/events       → List all events for user ✔️
  POST   /user/events       → Create event (or import from ICS (when implemented)) ✔️
  DELETE /user/events/:id   → Delete event by ID ✔️

=============================================================================
*/

require('dotenv').config();
const { EXPRESS_PORT } = process.env;

const crypto = require('crypto'); // for UUID generation
const CryptoJS = require('crypto-js'); // for AES-128 encryption/decryption
const bcrypt = require('bcrypt'); // for password hashing and comparison
const express = require('express'); // for backend server
const session = require('express-session'); // for session/cookie handling
const databaseHandler = require('./databaseHandler'); // Database backend Handler module 

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/* 
Source: https://www.youtube.com/watch?v=OH6Z0dJ_Huk 
My familiarity with express-session was limited.
*/
app.use(session({
    secret: process.env.SESSION_SECRET, // "THE-SECRET-KEY-IS-A-SECRET" (Temporarily put here as a placeholder while dev)
    resave: false,
    saveUninitialized: false,
    cookie: { 
        httpOnly: true,
        sameSite: 'lax', // Same-Site Origin
        secure: false, // Not using SSL.
        maxAge: 24 * 60 * 60 * 1000 // 24 hours expiry date.
    }
}));

// AUTH ENDPOINTS

/*
Brief: Verify Authentication Endpoint is Accessible
*/
app.get('/auth', (req, res) => {
    res.json({ message: 'Auth endpoint is working.' });
});

/*
Brief: Check if User is Logged In
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON which includes a loggedIn boolean to verify user
*/
app.get('/auth/whoami', async (req, res) => {
    // Verify Session
    if (req.session && req.session.userId) {
        var email = await databaseHandler.getUserEmailById(req.session.userId);
        return res.json({ loggedIn: true, userId: req.session.userId, email });
    } else {
        // If No Session Exists
        return res.json({ loggedIn: false });
    }
});

/*
Brief: Logout Endpoint - Destroys Session
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message
*/
app.post('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: 'Logged out' });
    });
});

/*
Brief: Login Endpoint - Verifies Credentials and Creates Session
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message with user info or error
*/
app.post('/auth/login', async (req, res) => {
    if (!req.body.length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is empty' });
    }

    // If already logged in, redirect to dashboard
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard.html');
    }

    const { email, password } = req.body;

    // Validate Credientials are Provided
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    try {
        const { verify, user } = await databaseHandler.verifyUserEmail(email);

        // Check if user exists
        if (!verify || !user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // Compare password with bcrypt
        // First decrypt the stored password hash using UUID as key
        const decryptedPasswordHash = CryptoJS.AES.decrypt(user.password_hash, user.uuid).toString(CryptoJS.enc.Utf8);
        const match = await bcrypt.compare(password, decryptedPasswordHash);
        if (!match) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        // Create session with user uuid
        req.session.userId = user.uuid;

        // Respond with success
        return res.json({ success: true, userId: user.uuid, email: user.email });
    } catch(error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Register Endpoint - Creates New User and Session
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message with user info or error
*/
app.post('/auth/register', async (req, res) => {
    if (!req.body.length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is empty' });
    }

    // If already logged in, redirect to dashboard
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard.html');
    }

    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    if (password.length < 8) {
        return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    try {
        var { verify } = await databaseHandler.verifyUserEmail(email);

        if (verify) { 
            return res.status(409).json({ success: false, error: 'Email already registered' }); 
        }

        // Hash password and create user
        const userId = crypto.randomUUID();
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Encrypt password hash with AES using UUID as key
        const encryptedPasswordHash = CryptoJS.AES.encrypt(passwordHash, userId).toString();
        
        const created = await databaseHandler.addNewUser(userId, email, encryptedPasswordHash);
        
        if (!created) {
            return res.status(500).json({ success: false, error: 'Failed to create user' });
        }

        // Create session
        req.session.userId = userId;

        // Respond with success (frontend handles redirect)
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

// NOTES ENDPOINTS

/*
Brief: Get All Notes for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON array of notes with decrypted content
*/
app.get('/user/notes', async (req, res) => {
    // Verify Session
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userId = req.session.userId;
    try {
        const notes = await databaseHandler.getUserNotes(userId);
        
        // Decrypt body only (title is stored as plaintext to maintain Unique names)
        const decryptedNotes = notes.map(note => ({
            title: note.title,
            content: CryptoJS.AES.decrypt(note.body, userId).toString(CryptoJS.enc.Utf8),
            created_at: note.created_at,
            updated_at: note.updated_at
        }));
        
        return res.json({ success: true, notes: decryptedNotes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Create New Note for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message or error
*/
app.post('/user/notes', async (req, res) => {
    // Verify Session
    if (!req.session || !req.session.userId)
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    
    const userId = req.session.userId;

    const { title, content } = req.body;

    if (!title) {
        return res.status(400).json({ success: false, error: 'Title is required' });
    }

    // Truncate title to 30 characters
    const truncatedTitle = title.substring(0, 30);

    try {
        // Encrypt body only with AES (title stored plaintext for uniqueness)
        const encryptedContent = CryptoJS.AES.encrypt(content || '', userId).toString();
        
        await databaseHandler.CreateNote(userId, truncatedTitle, encryptedContent);
        return res.status(201).json({ success: true });
    } catch (error) {
        // Handle duplicate title error (MySQL error 1062)
        if (error.code === 'ER_DUP_ENTRY' || error.sqlState === '23000') {
            return res.status(409).json({ success: false, error: 'No duplicates allowed' });
        }
        console.error('Error creating note:', error.message);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Edit Note for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message or error
*/
app.patch('/user/notes/:title', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = req.session.userId;
    const oldTitle = decodeURIComponent(req.params.title);
    const { newTitle, content } = req.body;

    if (!newTitle) {
        return res.status(400).json({ success: false, error: 'New title is required' });
    }

    // Truncate new title to 30 characters
    const truncatedNewTitle = newTitle.substring(0, 30);

    try {
        // Encrypt content with AES
        const encryptedContent = CryptoJS.AES.encrypt(content || '', userId).toString();

        await databaseHandler.EditNoteContent(userId, oldTitle, truncatedNewTitle, encryptedContent);
        return res.json({ success: true });
    } catch (error) {
        // Handle duplicate title error (MySQL error 1062)
        if (error.code === 'ER_DUP_ENTRY' || error.sqlState === '23000') {
            return res.status(409).json({ success: false, error: 'No duplicates allowed' });
        }
        console.error('Error editing note:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Delete Note for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message or error
*/
app.delete('/user/notes/:title', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userId = req.session.userId;
    const title = decodeURIComponent(req.params.title);
    
    try {
        await databaseHandler.DeleteNote(userId, title);
        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// EVENTS ENDPOINTS

/*
Brief: Get All Events for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON array of events
*/
app.get('/user/events', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const uuid = req.session.userId;
    try {
        const events = await databaseHandler.getUserEvents(uuid);

        // Note: Calendar events are NOT encrypted for MVP simplicity/speed
        return res.json({ success: true, events });
    } catch (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Create New Event for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message with new event ID or error
*/
app.post('/user/events', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const uuid = req.session.userId;
    const { title, start, end_time, location, description } = req.body;

    // Basic Validation
    if (!title || !start) {
        return res.status(400).json({ success: false, error: 'Title and Start Date are required' });
    }

    try {        
        // Call DB Handler
        const result = await databaseHandler.createEvent(uuid, title, start, end_time, location, description);
        
        return res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Delete Event for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message or error
*/
app.delete('/user/events/:id', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const uuid = req.session.userId;
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ success: false, error: 'Event ID required' });
    }

    try {
        const result = await databaseHandler.deleteEvent(uuid, id);
        if (result.success) {
            return res.json({ success: true });
        } else {
            return res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Delete User Account Endpoint
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message or error
*/
app.post('/user/del-acc/', async (req, res) => 
{
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const uuid = req.session.userId;

    try 
    {
        await databaseHandler.deleteAccount(uuid);

        // Destroy session after account deletion
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session after account deletion:', err);
            }
        });

        return res.json({ success: true, message: 'Account deleted successfully' });
    }
    catch (error) 
    {
        console.error('Error deleting account:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Start the server
app.listen(EXPRESS_PORT, () => {
    console.log(`Server running on port ${EXPRESS_PORT}`);
});