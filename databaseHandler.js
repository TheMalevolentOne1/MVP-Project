require('dotenv').config();
const mysql2 = require('mysql2/promise');

// Promised-Based MySQL Connection Pool
const pool = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mvp_project',
    port: process.env.DB_PORT || 3306,
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
        console.error('addNewUser error:', err);
        return false;
    }
}

module.exports = { verifyUserEmail, addNewUser };