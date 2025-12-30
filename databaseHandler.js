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

async function CreateNote(uuid, title, content = '') {
    try {
        const [result] = await pool.execute(
            'INSERT INTO notes (uuid, title, content) VALUES (?, ?, ?)',
            [uuid, title, content]
        );
        return { success: true, noteId: result.insertId };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function EditNoteContent(noteId, uuid, title, content) {
    try {
        await pool.execute(
            'UPDATE notes SET title = ?, content = ? WHERE id = ? AND uuid = ?',
            [title, content, noteId, uuid]
        );
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function DeleteNote(noteId, uuid) {
    try {
        await pool.execute(
            'DELETE FROM notes WHERE uuid = ? AND uuid = ?',
            [noteId, uuid]
        );
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function GetUserNotes(uuid) {
    try {
        const [rows] = await pool.query(
            'SELECT uuid, title, content, created_at, updated_at FROM notes WHERE uuid = ? ORDER BY updated_at DESC',
            [uuid]
        );
        return rows;
    } catch (err) {
        return [];
    }
}

async function GetNoteByTitle(uuid, title) {
    try {
        const [rows] = await pool.query(
            'SELECT uuid, title, content, created_at, updated_at FROM notes WHERE uuid = ? AND title = ? LIMIT 1',
            [uuid, title]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        return null;
    }
}

module.exports = { verifyUserEmail, addNewUser, getUserEmailById, CreateNote, EditNoteContent, DeleteNote, GetUserNotes, GetNoteByTitle };