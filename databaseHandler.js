require('dotenv').config();

const mysql2 = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Promised-Based MySQL Connection Pool
const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, // For Demonstration Adjustment TODO: 10 -> 20. Verify with intensive LTE testing
    queueLimit: 0
});

/*
Brief: Test database connection on startup
*/
pool.getConnection().then(conn => 
    {
        console.log('✓ Database connected successfully.');
        conn.release();
    }).catch(err => 
    {
        console.error('✗ Database connection failed:', err.message);
});

/*
Brief: Verify if user email exists in the database
@Param1 email - User's Email

@Return: JSON
@ReturnT: Email exists with User Data
@ReturnF: Email does not exist
*/
const verifyUserEmail = async (email) => 
{
    const [rows] = await pool.query(
        'SELECT uuid, email, password_hash FROM users WHERE email = ? LIMIT 1',
        [email]
    );

    console.log('verifyUserEmail rows:', rows);
    return {verify: Boolean(rows.length > 0), user: rows[0]};
}

/*
Brief: Add a new user to the database
@Param1 uuid - User's UUID
@Param2 email - User's Email
@Param3 passwordHash - User's Password Hash

@Return: Boolean
@ReturnT: User added successfully
@ReturnF: Failed to add user
*/
const addNewUser = async (uuid, email, passwordHash) => 
{
    try 
    {
        await pool.execute(
            'INSERT INTO users (uuid, email, password_hash) VALUES (?, ?, ?)',
            [uuid, email, passwordHash]
        );

        return true;
    } 
    catch (err) 
    {
        return false;
    }
}

/*
Brief: Get user email by UUID
@Param1 userId - User's UUID

@Return: Email String or Null
@ReturnT: Email found
@ReturnF: No email found
*/
const getUserEmailById = async (userId) => 
{
    const [rows] = await pool.query(
        'SELECT email FROM users WHERE uuid = ? LIMIT 1',
        [userId]
    );
    return (rows.length > 0) ? rows[0].email : null;
}

/*
Brief: Create a new note for a user
@Param1 uuid - User's UUID
@Param2 title - Note title
@Param3 content - Note content

@Return: JSON
@ReturnT: Success with Note Title
@ReturnF: Failure with Error Message
*/
const createNote = async (uuid, title, content = '') => 
{
    try 
    {
        await pool.execute(
            'INSERT INTO notes (uuid, title, body) VALUES (?, ?, ?)',
            [uuid, title, content]
        );
        return { success: true, title };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/*
Brief: Edit a note's content for a user
@Param1 uuid - User's UUID
@Param2 oldTitle - Current Note title
@Param3 newTitle - New Note title
@Param4 content - New Note content

@Return: JSON
@ReturnT: Success
@ReturnF: Failure with Error Message
*/
const editNoteContent = async (uuid, oldTitle, newTitle, content) => 
{
    try 
    {
        await pool.execute(
            'UPDATE notes SET title = ?, body = ? WHERE uuid = ? AND title = ?',
            [newTitle, content, uuid, oldTitle]
        );
        return { success: true };
    } 
    catch (err) 
    {
        return { success: false, error: err.message };
    }
}

/*
Brief: Delete a note for a user
@Param1 uuid - User's UUID
@Param2 title - Note title

@Return: JSON
@ReturnT: Success
@ReturnF: Failure
*/
const deleteNote = async (uuid, title) => 
{
    try {
        await pool.execute(
            'DELETE FROM notes WHERE uuid = ? AND title = ?',
            [uuid, title]
        );
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/*
Brief: Get all notes for a user
@Param1 uuid - User's UUID

@Return: Array of Notes
@ReturnT: Array of Notes found
@ReturnF: No notes found
*/
const getUserNotes = async (uuid) => 
{
    try {
        const [rows] = await pool.query(
            'SELECT title, body, created_at, updated_at FROM notes WHERE uuid = ? ORDER BY updated_at DESC',
            [uuid]
        );
        return rows;
    } catch (err) {
        return [];
    }
}

/*
Brief: Get a specific note by title for a user
@Param1 uuid - User's UUID
@Param2 title - Note title

@Return: Note Object or Null
@ReturnT: Note found
@ReturnF: Note not found
*/
const getNoteByTitle = async (uuid, title) => 
{
    try {
        const [rows] = await pool.query(
            'SELECT title, body, created_at, updated_at FROM notes WHERE uuid = ? AND title = ? LIMIT 1',
            [uuid, title]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        return null;
    }
}

/*
Brief: Check if a note exists for a user
@Param1 uuid - User's UUID
@Param2 title - Note title

@Return: Boolean
@ReturnT: Exists
@ReturnF: Does not exist
*/
const doesNoteExist = async (uuid, title) => 
{
    try {
        const [rows] = await pool.query(
            'SELECT 1 FROM notes WHERE uuid = ? AND title = ? LIMIT 1',
            [uuid, title]
        );
        return rows.length > 0;
    } catch (err) {
        return false;
    }
}

// EVENT FUNCTIONS

/*
Brief: Get all events for a user
@Param1 uuid - User's UUID

@Return: Array of Events
@ReturnT: Array of Events found
@ReturnF: No events found
*/
const getUserEvents = async (uuid) => 
{
    try {
        const [rows] = await pool.query(
            'SELECT id, title, start, end_time, location, description, created_at FROM calendar_events WHERE uuid = ? ORDER BY start ASC',
            [uuid]
        );
        return rows;
    } catch (err) {
        return [];
    }
}

/*
Brief: Create a new event for a user
@Param1 uuid - User's UUID
@Param2 title - Event title
@Param3 start - Event start time
@Param4 end_time - Event end time
@Param5 location - Event location
@Param6 description - Event description

@Return: JSON
@ReturnT: Event created with ID
@ReturnF: Failure

*/
const createEvent = async (uuid, title, start, end_time, location, description) => 
{
    try {
        const [result] = await pool.query(
            'INSERT INTO calendar_events (uuid, title, start, end_time, location, description) VALUES (?, ?, ?, ?, ?, ?)',
            [uuid, title, start, end_time, location, description]
        );
        return { success: true, id: result.insertId };
    } catch (err) {
        console.error('Error creating event:', err);
        throw err;
    }
}

/*
Brief: Delete an event for a user
@Param1 uuid - User's UUID
@Param2 id - Event ID

@Return: JSON
@ReturnT: Success
@ReturnF: Failure
*/
const deleteEvent = async (uuid, id) => 
{
    try {
        const [result] = await pool.query(
            'DELETE FROM calendar_events WHERE id = ? AND uuid = ?',
            [id, uuid]
        );
        
        if (result.affectedRows > 0) {
            return { success: true };
        } else {
            return { success: false, error: 'Event not found or unauthorized' };
        }
    } catch (err) {
        console.error('Error deleting event:', err);
        return { success: false, error: err.message };
    }
}

/*
Brief: Check if an event exists for a user
@Param1 uuid - User's UUID
@Param2 id - Event ID

@Return: Boolean
@ReturnT: Exists
@ReturnF: Does not exist
*/
const doesEventExist = async (uuid, id) => 
{
    try {
        const [rows] = await pool.query(
            'SELECT 1 FROM calendar_events WHERE uuid = ? AND id = ? LIMIT 1',
            [uuid, id]
        );
        return rows.length > 0;
    } catch (err) {
        return false;
    }
}

/*
Brief: Delete a user account
@Param1 uuid - User's UUID

@Return: JSON
@ReturnT: Account deleted
@ReturnF: Failure
*/
const deleteAccount = async (uuid) => 
{
    try {
        await pool.execute(
            'DELETE FROM users WHERE uuid = ?',
            [uuid]
        );
    } catch (err) {
        return false;
    }
}

// Export functions
module.exports = { verifyUserEmail, addNewUser, getUserEmailById, createNote, editNoteContent, deleteNote, getUserNotes, getNoteByTitle, doesNoteExist, getUserEvents, createEvent, deleteEvent, doesEventExist, deleteAccount };