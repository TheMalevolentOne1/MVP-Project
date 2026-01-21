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
  POST   /user/events       → Create event (or import from ICS (when implemented)) ✔️
  PATCH  /user/events/:id    → Edit event by ID ✔️
  DELETE /user/events/:id   → Delete event by ID ✔️

=============================================================================
*/

require('dotenv').config();
const { EXPRESS_PORT, SESSION_SECRET } = process.env; 

const crypto = require('crypto'); // for UUID generation
const CryptoJS = require('crypto-js'); // for AES-128 encryption/decryption
const bcrypt = require('bcrypt'); // for password hashing and comparison
const express = require('express'); // for backend server
const session = require('express-session'); // for session/cookie handling
const fs = require('fs'); // for reading user_instructions
const path = require('path'); // for path joining

const databaseHandler = require('./databaseHandler'); // Database backend Handler module 
const { fetchTimetable } = require('./gettimetable'); // Timetable scraper module

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); 
app.use(express.static('public')); // for serving static files

/* 
Brief: Express Session Middleware

Source: https://www.youtube.com/watch?v=OH6Z0dJ_Huk 
My familiarity with express-session was limited.
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
@ReturnF: N/A
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

@Return: JSON
@ReturnT: User created successfully with user info
@ReturnF: Error message
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

    const { email, password, startDate } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    try 
    {
        // Fetch timetable from university portal
        const result = await fetchTimetable(email, password);
        
        if (!result.success)
            return res.status(400).json({ success: false, error: result.error || 'Failed to fetch timetable' });
        
        const events = result.events || [];
        
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
                
                if (!dateStr) {
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
                
                if (result.success !== false) 
                {
                    importedCount++;
                    importedEvents.push(event);
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