/*
=============================================================================
ENDPOINTS OVERVIEW PLAN
=============================================================================

AUTH:
  POST /auth/register  → Create user, hash password, set session ✔️
  POST /auth/login     → Verify password, set session ✔️
  POST /auth/logout    → Destroy session ✔️
  GET  /auth/whoami        → Check if logged in, return user email ✔️
  POST /auth/del-acc   → Delete user account, destroy session ✔️

NOTES:
  GET    /user/notes        → List all notes for logged-in user ✔️
  GET    /user/notes/:title    → Get single note by Title ✔️
  GET    /user/notes/recent/  → Get last updated notes (last 7 days) ✔️
  POST   /user/notes        → Create new note ✔️
  PATCH  /user/notes/:title    → Update note title/body ✔️
  DELETE /user/notes/:title    → Delete note ✔️

EVENTS (Calendar):
  GET    /user/events       → List all events for user ✔️
  GET    /user/events/upcoming   → Get all upcoming events (next 7 days) ✔️
  GET    /user/events/export-ics → Export all events as ICS file ✔️
  POST   /user/events       → Create event (or import from ICS (when implemented)) ✔️
  POST   /user/events/import-ics → Import events from ICS file ✔️
  PATCH  /user/events/:id    → Edit event by ID ✔️
  DELETE /user/events/:id   → Delete event by ID ✔️
  
USER SETTINGS:
  GET    /user/settings     → Get user settings ✔️
  PATCH  /user/settings     → Update user settings ✔️

=============================================================================
*/

require('dotenv').config();
const { EXPRESS_PORT, SESSION_SECRET } = process.env; 

const crypto = require('crypto'); // for UUID generation
const CryptoJS = require('crypto-js'); // for AES-128 encryption/decryption
const bcrypt = require('bcrypt'); // for password hashing and comparison
const express = require('express'); // for backend server
const cors = require('cors'); // for CORS policy
const session = require('express-session'); // for session/cookie handling
const fs = require('fs'); // for reading user_instructions
const path = require('path'); // for path joining
const multer = require('multer'); // for file uploads
const ical = require('node-ical'); // for parsing ICS files
const { default: icalGenerator } = require('ical-generator'); // for generating ICS files

const databaseHandler = require('./databaseHandler'); // Database backend Handler module 
const { fetchTimetable } = require('./gettimetable'); // Timetable scraper module

const app = express();

// Configure multer for ICS file uploads with security
const icsUpload = multer({
    storage: multer.memoryStorage(), // Store in memory, not disk
    limits: {
        fileSize: 1024 * 1024, // 1MB max file size
        files: 1 // Only 1 file at a time
    },
    fileFilter: (req, file, cb) => {
        // Security: Only allow .ics files
        const allowedMimes = ['text/calendar', 'application/ics', 'text/x-vcalendar'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (ext !== '.ics') {
            return cb(new Error('Only .ics files are allowed'), false);
        }
        
        // Accept even if MIME type is generic (some systems send text/plain)
        cb(null, true);
    }
});

// CORS configuration - allow requests from React app
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); 
// Old static files removed - React app now runs on localhost:3000

/* 
Brief: Express Session Middleware

Source: https://www.youtube.com/watch?v=OH6Z0dJ_Huk 
*/
app.use(session({
    secret: SESSION_SECRET, // "THE-SECRET-KEY-IS-A-SECRET" (Temporarily put here as a placeholder while dev)
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
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object

@Return: JSON
@ReturnT: Auth endpoint is working
*/
app.get('/auth', (req, res) => {
    res.json({ message: 'Auth endpoint is working.' });
});

/*
Brief: Check if User is Logged In
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object

@Return: JSON
@ReturnT: loggedIn true with userId and email
@ReturnF: loggedIn false
*/
app.get('/auth/whoami', async (req, res) => 
{
    // Verify Session
    if (req.session && req.session.userId) 
    {
        var email = await databaseHandler.getUserEmailById(req.session.userId);
        return res.json({ loggedIn: true, userId: req.session.userId, email });
    } 
    else 
    {
        // If No Session Exists
        return res.json({ loggedIn: false });
    }
});

/*
Brief: Logout Endpoint - Destroys Session
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object

@Return: JSON
@ReturnT: Logout successful
@ReturnF: Logout failed
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

@Return: JSON
@ReturnT: Login successful with userId and email
@ReturnF: Login failed with error message
*/
app.post('/auth/login', async (req, res) => {
    if (!req.body.length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is empty' });
    }

    // If already logged in, return success
    if (req.session && req.session.userId) {
        const userEmail = await databaseHandler.getUserEmailById(req.session.userId);
        return res.json({ success: true, userId: req.session.userId, email: userEmail });
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

@Return: JSON
@ReturnT: User created successfully with user info
@ReturnF: Error message
*/
app.post('/auth/register', async (req, res) => {
    if (req.body.length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is empty' });
    }

    // If already logged in, return success
    if (req.session && req.session.userId) {
        const userEmail = await databaseHandler.getUserEmailById(req.session.userId);
        return res.json({ success: true, userId: req.session.userId, email: userEmail });
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
        var { user } = await databaseHandler.verifyUserEmail(email);

        if (user) 
        {
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

        // Create default "How to Use!" note
        try {
            const instructionsPath = path.join(__dirname, 'user_instructions');
            const instructionsContent = fs.readFileSync(instructionsPath, 'utf8');
            const encryptedContent = CryptoJS.AES.encrypt(instructionsContent, userId).toString();
            await databaseHandler.createNote(userId, 'How to Use!', encryptedContent);
        } catch (err) {
            console.error('Failed to create default user note:', err);
            // Don't fail registration if note creation fails
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
        const decryptedNotes = notes.map(note => {
            let decryptedContent = '';
            try {
                decryptedContent = CryptoJS.AES.decrypt(note.body, userId).toString(CryptoJS.enc.Utf8);
            } catch (error) {
                console.error('Error decrypting note:', error);
                decryptedContent = 'Error: Unable to decrypt note content';
            }
            return {
                title: note.title,
                content: decryptedContent,
                created_at: note.created_at,
                updated_at: note.updated_at
            };
        });
        
        return res.json({ success: true, notes: decryptedNotes });
    } catch (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Get Recent Notes for Logged-in User (last 7 days)
@Param1: req - HTTP Request
@Param2: res - HTTP Response

@Return: JSON
@ReturnT: Array of recent notes
@ReturnF: Error message
*/
app.get('/user/notes/recent', async (req, res) => 
{
    if (!req.session || !req.session.userId) 
    {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    
    const userId = req.session.userId;
    
    try 
    {
        const notes = await databaseHandler.getUserNotes(userId);
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        // Filter notes updated in the last 7 days
        const recentNotes = notes.filter(note => {
            const updatedAt = new Date(note.updated_at);
            return updatedAt >= sevenDaysAgo;
        }).map(note => {
            let decryptedContent = '';
            try {
                decryptedContent = CryptoJS.AES.decrypt(note.body, userId).toString(CryptoJS.enc.Utf8);
            } catch (error) {
                console.error('Error decrypting note:', error);
                decryptedContent = 'Error: Unable to decrypt note content';
            }
            return {
                title: note.title,
                content: decryptedContent,
                created_at: note.created_at,
                updated_at: note.updated_at
            };
        });
        
        return res.json({ success: true, notes: recentNotes });
    } catch (error) {
        console.error('Error fetching recent notes:', error);
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
        const encryptedContent = CryptoJS.AES.encrypt(content, userId).toString();
        
        await databaseHandler.createNote(userId, truncatedTitle, encryptedContent);
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

// Brief: Get a single note by Title for Logged-in User
// @Param1: req - HTTP Request Object
// @Param2: res - HTTP Response Object
// @Return: JSON object with note data or error
app.get('/user/notes/:title', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const userId = req.session.userId;
    const title = decodeURIComponent(req.params.title);
    try {
        const note = await databaseHandler.getNoteByTitle(userId, title);
        if (!note) {
            return res.status(404).json({ success: false, error: 'Note not found' });
        }
        // Decrypt content
        const content = CryptoJS.AES.decrypt(note.body, userId).toString(CryptoJS.enc.Utf8);
        return res.json({ success: true, note: { title: note.title, content, created_at: note.created_at, updated_at: note.updated_at } });
    } catch (error) {
        console.error('Error fetching note:', error);
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
    if (!req.session || !req.session.userId) 
    {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const userId = req.session.userId;
    const oldTitle = decodeURIComponent(req.params.title);
    const { newTitle, content } = req.body;

    if (!newTitle)
    {
        return res.status(400).json({ success: false, error: 'New title is required' });
    }

    // Truncate new title to 30 characters
    const truncatedNewTitle = newTitle.substring(0, 30);

    try {
        // Encrypt content with AES
        const encryptedContent = CryptoJS.AES.encrypt(content || '', userId).toString();

        await databaseHandler.editNoteContent(userId, oldTitle, truncatedNewTitle, encryptedContent);
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
        await databaseHandler.deleteNote(userId, title);
        return res.json({ success: true });
    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// EVENTS ENDPOINTS

/*
Brief: Get All Events for Logged-in User
@Param1: req - HTTP Request
@Param2: res - HTTP Response

@Return: JSON
@ReturnT: Array of events
@ReturnF: Error message
*/
app.get('/user/events', async (req, res) => 
{
    if (!req.session || !req.session.userId)
        return res.status(401).json({ success: false, error: 'Unauthorized' });

    const uuid = req.session.userId;
    
    try 
    {
        const events = await databaseHandler.getUserEvents(uuid);

        // Note: Calendar events are NOT encrypted for MVP simplicity/speed
        return res.json({ success: true, events });
    } 
    catch (error) 
    {
        console.error('Error fetching events:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Get Upcoming Events for Logged-in User
@Param1: req - HTTP Request
@Param2: res - HTTP Response

@Return: JSON
@ReturnT: Array of upcoming events (next 7 days only)
@ReturnF: Error message
*/
app.get('/user/events/upcoming', async (req, res) => 
{
    if (!req.session || !req.session.userId) 
        return res.status(401).json({ success: false, error: 'Unauthorized' });

    const uuid = req.session.userId;
    
    try 
    {
        const events = await databaseHandler.getUserEvents(uuid);
        
        // Filter events within the next 7 days
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days ahead in milliseconds

        const upcomingEvents = events.filter(e => 
        {
            const eventStart = new Date(e.start);
            return eventStart >= now && eventStart <= sevenDaysFromNow;
        });
        
        return res.json({ success: true, events: upcomingEvents });
    } catch (error) {
        console.error('Error fetching upcoming events:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Create New Event for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message with new event ID or error
*/
app.post('/user/events', async (req, res) => 
{
    if (!req.session || !req.session.userId) 
        return res.status(401).json({ success: false, error: 'Unauthorized' });

    const uuid = req.session.userId;
    const { title, start, location, description } = req.body;
    let { end_time } = req.body;

    // Basic Validation
    if (!title || !start) 
    {
        return res.status(400).json({ success: false, error: 'Title and Start Date are required' });
    }

    // If no end_time provided, set it to start time
    if (!end_time) { 
        end_time = start; 
    }

    // Validate end time is not before start time
    if (new Date(end_time) < new Date(start)) {
        return res.status(400).json({ success: false, error: 'End time cannot be before start time' });
    }

    try 
    {        
        // Call DB Handler
        const result = await databaseHandler.createEvent(uuid, title, start, end_time, location, description);
        
        if (!result.success) {
            return res.status(409).json({ success: false, error: result.error });
        }
        
        return res.status(201).json({ success: true, id: result.id });
    } catch (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Edit Event for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object

@Return: JSON
@ReturnT: Event edited successfully
@ReturnF: Error message
*/
app.patch('/user/events/:id', async (req, res) => 
{
    if (!req.session || !req.session.userId) 
        return res.status(401).json({ success: false, error: 'Unauthorized' });

    const uuid = req.session.userId;
    const id = req.params.id;
    const { title, start, end_time, location, description } = req.body;

    // Basic Validation
    if (!title || !start || !end_time) 
        return res.status(400).json({ success: false, error: 'Title, Start Date, and End Time are required' });

    // Validate end time is not before start time
    if (new Date(end_time) < new Date(start)) 
        return res.status(400).json({ success: false, error: 'End time cannot be before start time' });

    try 
    {
        const result = await databaseHandler.editEvent(uuid, id, title, start, end_time, location, description);
        
        if (result.success) 
        {
            return res.json({ success: true });
        }
        else 
        {
            return res.status(500).json({ success: false, error: result.error });
        }
    } 
    catch (error)
    {
        console.error('Error editing event:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Delete Event for Logged-in User
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message or error
*/
app.delete('/user/events/:id', async (req, res) => 
{
    if (!req.session || !req.session.userId) 
        return res.status(401).json({ success: false, error: 'Unauthorized' });

    const uuid = req.session.userId;
    const id = req.params.id;

    if (!id) {
        return res.status(400).json({ success: false, error: 'Event ID required' });
    }

    try {
        const result = await databaseHandler.deleteEvent(uuid, id);

        if (result.success) 
        {
            return res.status(200).json({ success: true });
        } 
        else 
        {
            return res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
=============================================================================
ICS IMPORT/EXPORT ENDPOINTS
=============================================================================
*/

/*
Brief: Export all user events as ICS file
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: ICS file download or error
*/
app.get('/user/events/export-ics', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const uuid = req.session.userId;

    try {
        const events = await databaseHandler.getUserEvents(uuid);
        
        // Create ICS calendar
        const calendar = icalGenerator({
            name: 'ASC Calendar Export',
            prodId: { company: 'ASC', product: 'Study Planner' }
        });

        // Add each event to the calendar
        events.forEach(event => {
            calendar.createEvent({
                start: new Date(event.start),
                end: event.end_time ? new Date(event.end_time) : new Date(event.start),
                summary: event.title,
                description: event.description || '',
                location: event.location || ''
            });
        });

        // Set headers for file download
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="asc-calendar.ics"');
        
        return res.send(calendar.toString());
    } catch (error) {
        console.error('Error exporting ICS:', error);
        return res.status(500).json({ success: false, error: 'Failed to export calendar' });
    }
});

// function to clean strings
function cleanString(str, maxLength) {
    if (!str) return '';
    // Remove potentially dangerous characters, trim whitespace
    return String(str)
        .replace(/[<>]/g, '') // Remove angle brackets
        .trim()
        .substring(0, maxLength);
}

/*
Brief: Import events from ICS file
@Param1: req - HTTP Request Object (with uploaded file)
@Param2: res - HTTP Response Object
@Return: JSON with import count or error

Security measures:
- File size limit: 1MB
- File type validation: .ics extension only
- Clean event data before database insert
*/
app.post('/user/events/import-ics', icsUpload.single('file'), async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const uuid = req.session.userId;

    try {
        // Parse ICS content from buffer
        const icsContent = req.file.buffer.toString('utf-8');
        
        // Security: Basic validation of ICS format
        if (!icsContent.includes('BEGIN:VCALENDAR') || !icsContent.includes('END:VCALENDAR')) {
            return res.status(400).json({ success: false, error: 'Invalid ICS file format' });
        }

        // Parse the ICS file
        const parsed = ical.parseICS(icsContent);
        
        let importedCount = 0;
        let errors = [];

        // Process each event
        for (const key in parsed) {
            const event = parsed[key];
            
            // Only process VEVENT type
            if (event.type !== 'VEVENT') continue;

            try {
                // Clean and validate event data
                const title = cleanString(event.summary || 'Untitled Event', 255);
                const start = event.start ? new Date(event.start) : null;
                const end = event.end ? new Date(event.end) : start;
                const location = cleanString(event.location || '', 500);
                const description = cleanString(event.description || '', 2000);

                // Skip events without valid start date
                if (!start || isNaN(start.getTime())) {
                    errors.push(`Skipped event "${title}": Invalid start date`);
                    continue;
                }

                // Create event in database
                await databaseHandler.createEvent(uuid, title, start, end, location, description);
                importedCount++;
            } catch (eventError) {
                errors.push(`Failed to import event: ${event.summary || 'Unknown'}`);
            }
        }

        return res.json({ 
            success: true, 
            imported: importedCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Error importing ICS:', error);
        return res.status(500).json({ success: false, error: 'Failed to parse ICS file' });
    }
});

// Handle multer errors
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ success: false, error: 'File too large. Maximum size is 1MB.' });
        }
        return res.status(400).json({ success: false, error: error.message });
    }
    if (error.message === 'Only .ics files are allowed') {
        return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
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

/*
Brief: Get User Settings
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON with user settings
*/
app.get('/user/settings', async (req, res) => 
{
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        const settings = await databaseHandler.getUserSettings(req.session.userId);
        return res.json({ success: true, settings });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

/*
Brief: Update User Settings
@Param1: req - HTTP Request Object
@Param2: res - HTTP Response Object
@Return: JSON success message
*/
app.patch('/user/settings', async (req, res) => 
{
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    try {
        console.log('Updating settings for user:', req.session.userId);
        console.log('Settings data:', req.body);
        
        const success = await databaseHandler.updateUserSettings(req.session.userId, req.body);
        
        if (success) {
            return res.json({ success: true, message: 'Settings updated successfully' });
        } else {
            console.error('updateUserSettings returned false');
            return res.status(500).json({ success: false, error: 'Failed to update settings' });
        }
    } catch (error) {
        console.error('Error updating settings:', error);
        return res.status(500).json({ success: false, error: error.message || 'Server error' });
    }
});

/*
Brief: Sync Timetable from University Portal
@Param1: req - HTTP Request
@Param2: res - HTTP Response

@Return: JSON 
@ReturnT: Number of events imported
@ReturnF: Error message
*/
app.post('/user/timetable/sync', async (req, res) => 
{
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    try 
    {
        // Fetch timetable from university portal
        const result = await fetchTimetable(email, password);

        if (result.error) { console.log(result.error); }
        
        if (!result.success)
            return res.status(400).json({ success: false, error: result.error || 'Failed to fetch timetable' });
        
        const events = result.events || [];

        console.log('Fetched result:', result);
        
        if (events.length === 0)
            return res.status(400).json({ success: false, error: 'No events found in timetable' });
        
        let importedCount = 0;
        const importedEvents = [];
        
        // Import each event - events now include eventDate from the parser
        for (const event of events)
        {
            if (!event) continue;
            
            try 
            {
                // Use the eventDate directly from the parsed event (YYYY-MM-DD format)
                const dateStr = event.eventDate;
                
                if (!dateStr) 
                {
                    console.error('Event missing eventDate:', event);
                    continue;
                }
                
                // Map parsed event fields to database fields
                const eventTitle = event.moduleName || 'Untitled Event';
                const startDateTime = `${dateStr}T${event.startTime}:00`;
                const endDateTime = `${dateStr}T${event.endTime}:00`;
                
                const result = await databaseHandler.createEvent(
                    req.session.userId,
                    eventTitle,
                    startDateTime,
                    endDateTime,
                    event.location || '',
                    event.description || ''
                );
                
                if (result.success === true) 
                {
                    importedCount++;
                    importedEvents.push(event);
                }
                else
                {
                    console.log('Skipping duplicate event:', eventTitle);
                }
            } 
            catch (eventError) 
            {
                console.error('Error importing event:', eventError);
                // Continue importing other events even if one fails
            }
        }
        
        return res.json(
        { 
            success: true, 
            message: `Imported ${importedCount} events`,
            events: importedEvents,
            imported: importedCount
        });
    }
    catch (error) 
    {
        console.error('Error syncing timetable:', error);
        return res.status(500).json({ success: false, error: 'Failed to sync timetable: ' + error.message });
    }
});

// Start the server
app.listen(EXPRESS_PORT, () => {
    console.log(`Server running on port ${EXPRESS_PORT}`);
});