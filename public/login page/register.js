// Registration handler with AES encryption using crypto-js
const SECRET_KEY = 'asc-study-planner-2025'; // Change this in production

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
    
    // Encrypt the password using AES
    const encryptedPassword = CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
    
    // Store new user
    users[email] = encryptedPassword;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', email);
    
    alert('Account created successfully!');
    // Redirect to dashboard
    window.location.href = '../dashboard.html';
});
