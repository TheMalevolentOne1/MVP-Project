/**
 * notes.js - Notes Page Functionality
 * 
 * HOW TO IMPLEMENT:
 * =================
 * 2. LOAD NOTES - GET /api/notes to fetch user's notes, populate #notesList with .note-item divs
 * 3. SELECT NOTE - Add click listeners to .note-item, load title/content into #noteTitle and #noteContent
 * 4. ADD NOTE - .add-btn click: POST /api/notes with empty title/content, refresh list
 * 5. DELETE NOTE - .delete-btn click: show #confirmDelete, on Yes: DELETE /api/notes/:id
 * 6. SAVE NOTE - On blur/change of #noteTitle or #noteContent: PUT /api/notes/:id
 * 7. SEARCH - Filter .note-item elements based on .notes-search input value
 * 8. MODE TOGGLE - #previewBtn/#liveBtn: toggle between #noteContent (textarea) and #notePreview (rendered)
 */

/**
 * Fetches the current user's info and updates the username display
 */
async function loadUsername() {
    try {
        const response = await fetch('/auth/whoami');
        const data = await response.json();
        
        if (!data.loggedIn) {
            window.location.href = './login_page.html';
            return;
        }
        
        document.getElementById('username').textContent = data.email || 'User';
    } catch (error) {
        console.error('Error fetching user info:', error);
        document.getElementById('username').textContent = 'User';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch and display username
    await loadUsername();

    
});