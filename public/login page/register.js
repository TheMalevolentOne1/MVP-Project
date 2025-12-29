const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const mysql2 = require("mysql2/promise");
require("dotenv").config();

// Registration handler with AES encryption using crypto-js
// Each user's password is encrypted with their UUID as the secret key

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    // Validate password length
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email]) {
        alert('An account with this email already exists. Please login instead.');
        return;
    }
    
    // Generate UUID for new user
    const userId = crypto.randomUUID();
    
    // Encrypt the password using user's UUID as the secret key
    const encryptedPassword = CryptoJS.AES.encrypt(password, userId).toString();
    
    // Store new user
    users[email] = { password: encryptedPassword, id: userId };
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', email);
    localStorage.setItem('currentUserId', userId);
    
    alert('Account created successfully!');
    // Redirect to dashboard
    window.location.href = '../dashboard.html';
});
