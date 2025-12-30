/**
 * dashboard.js - Dashboard Page Functionality
 */

document.addEventListener('DOMContentLoaded', async () => {
    await loadUsername();
});

/**
 * Fetches the current user's info and updates the username display
 */
async function loadUsername() {
    try {
        const response = await fetch('/auth/whoami');
        const data = await response.json();
        
        if (!data.loggedIn) {
            window.location.href = '/login_page.html';
            return;
        }
        
        document.getElementById('username').textContent = data.email || 'User';
    } catch (error) {
        console.error('Error fetching user info:', error);
        document.getElementById('username').textContent = 'User';
    }
}
/**
 * Handles user logout
 */
async function handleLogout() {
    try {
        const response = await fetch('/auth/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = './login_page.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed');
    }
}