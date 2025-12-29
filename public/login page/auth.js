const CryptoJS = require('crypto-js');
const SQLITE = require('sqlite3').verbose();

// Simple authentication handler with AES encryption using crypto-js
const SECRET_KEY = 'asc-study-planner-2025'; // Change this in production

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevents page refresh
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Encrypt the password using AES
    const encryptedPassword = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
    
    // Store credentials in localStorage (for MVP - use backend in production)
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email]) {
        // Login: verify password
        const storedPassword = users[email];
        const decryptedPassword = CryptoJS.AES.decrypt(storedPassword, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        
        if (decryptedPassword === password) {
            alert('Login successful!');
            localStorage.setItem('currentUser', email);
            // Redirect to dashboard or main app
            window.location.href = '../dashboard.html';
        } else {
            alert('Invalid email or password');
        }
    } else {
        alert('No account found with this email. Please sign up first.');
    }
});
