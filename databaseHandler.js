require('dotenv').config();
const mysql2 = require('mysql2/promise');

// Promised-Based MySQL Connection Pool
const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection
pool.getConnection()
    .then(conn => {
        console.log('✓ Database connected successfully.');
        conn.release();
    })
    .catch(err => {
        console.error('✗ Database connection failed:', err.message);
});

async function verifyUserEmail(email) {
    const [rows] = await pool.query(
        'SELECT uuid, email, password_hash FROM users WHERE email = ? LIMIT 1',
        [email]
    );

    console.log('verifyUserEmail rows:', rows);
    return {verify: Boolean(rows.length > 0), user: rows[0]};
}

async function addNewUser(uuid, email, passwordHash)
{
    try {
        await pool.execute(
            'INSERT INTO users (uuid, email, password_hash) VALUES (?, ?, ?)',
            [uuid, email, passwordHash]
        );
        return true;
    } catch (err) {
        return false;
    }
}

async function getUserEmailById(userId) 
{
    const [rows] = await pool.query(
        'SELECT email FROM users WHERE uuid = ? LIMIT 1',
        [userId]
    );
    return (rows.length > 0) ? rows[0].email : null;
}

async function createNote(uuid, title, content = '') {
    try {
        await pool.execute(
            'INSERT INTO notes (uuid, title, body) VALUES (?, ?, ?)',
            [uuid, title, content]
        );
        return { success: true, title };
    } catch (err) {
        throw err;
    }
}

async function editNoteContent(uuid, oldTitle, newTitle, content) {
    try {
        await pool.execute(
            'UPDATE notes SET title = ?, body = ? WHERE uuid = ? AND title = ?',
            [newTitle, content, uuid, oldTitle]
        );
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function deleteNote(uuid, title) {
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

async function getUserNotes(uuid) {
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

async function getNoteByTitle(uuid, title) {
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

async function doesNoteExist(uuid, title) {
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

async function getUserEvents(uuid) {
    try {
        const [rows] = await pool.query(
            'SELECT id, title, start, end_time, location, description, created_at FROM calendar_events WHERE uuid = ? ORDER BY start ASC',
            [uuid]
        );
        return rows;
    } catch (err) {
        console.error('Error fetching user events:', err);
        throw err;
    }
}

async function createEvent(uuid, title, start, end_time, location, description) {
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

async function deleteEvent(uuid, id) {
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

async function doesEventExist(uuid, id) {
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

async function deleteAccount(uuid)
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

module.exports = { verifyUserEmail, addNewUser, getUserEmailById, createNote, editNoteContent, deleteNote, getUserNotes, getNoteByTitle, doesNoteExist, getUserEvents, createEvent, deleteEvent, doesEventExist, deleteAccount };