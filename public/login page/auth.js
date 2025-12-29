const CryptoJS = require('crypto-js');
require("dotenv").config();
const crypto = require('crypto');


document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevents page refresh
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Store credentials in localStorage (for MVP - use backend in production)
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email]) {
        // Login: verify password using user's UUID as secret key
        const userUUID = users[email].id;
        const storedPassword = users[email].password;
        const decryptedPassword = CryptoJS.AES.decrypt(storedPassword, userUUID).toString(CryptoJS.enc.Utf8);
        
        if (decryptedPassword === password) {
            alert('Login successful!');
            localStorage.setItem('currentUser', email);
            localStorage.setItem('currentUserId', userUUID);
            // Redirect to protected dashboard route
            window.location.href = '/dashboard';
        } else {
            alert('Invalid email or password');
        }
    } else {
        alert('No account found with this email. Please sign up first.');
    }
});
