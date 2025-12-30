/**
 * notes.js - Notes Page Functionality
 * See NOTES-IMPLEMENTATION.md for detailed implementation guide.
 */

// Track the currently selected note
let currentNoteTitle = null;

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
        
        document.getElementById('username').textContent = data.email;

        return data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        document.getElementById('username').textContent = 'User';
    }
}

async function PopulateNotesList()
{
    try 
    {
        const response = await fetch('/user/notes');
        const data = await response.json();
        
        if (!data.success) 
        {
            console.error('Failed to fetch notes');
            return;
        }
        
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = ''; // Clear existing notes
        
        if (data.notes && data.notes.length > 0) 
        {
            data.notes.forEach(note => 
            {
                const noteBtn = document.createElement('button');
                noteBtn.className = 'note-item';
                noteBtn.textContent = note.title;
                noteBtn.dataset.title = note.title;
                noteBtn.dataset.content = note.content || '';
                noteBtn.addEventListener('click', () => selectNote(noteBtn));
                notesList.appendChild(noteBtn);
            });
        }
    } 
    catch (error) 
    {
        console.error('Error loading notes:', error);
    }
}

/**
 * Select a note and load its content into the editor
 */
function selectNote(noteElement) {
    // Remove selection from previously selected note
    document.querySelectorAll('.note-item.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Mark this note as selected
    noteElement.classList.add('selected');
    
    // Store the current note title
    currentNoteTitle = noteElement.dataset.title;
    
    // Load content into editor
    document.getElementById('noteTitle').value = noteElement.dataset.title;
    document.getElementById('noteContent').value = noteElement.dataset.content;
}

/**
 * Delete the currently selected note
 */
async function DeleteNote() {
    if (!currentNoteTitle) {
        alert('No note selected. Click on a note first.');
        return;
    }
    
    if (!confirm(`Delete note "${currentNoteTitle}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/user/notes/${encodeURIComponent(currentNoteTitle)}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear editor
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            currentNoteTitle = null;
            
            // Refresh list
            await PopulateNotesList();
        } else {
            alert('Failed to delete note: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        alert('Error deleting note');
    }
}

async function CreateNote()
{
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    if (!title) 
    {
        alert('Please enter a note title');
        return;
    }
    
    if (!content) 
    {
        alert('Please enter note content');
        return;
    }
    
    try 
    {
        const response = await fetch('/user/notes', 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        
        const data = await response.json();
        
        if (data.success) 
        {
            // Clear inputs
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            
            // Refresh notes list
            await PopulateNotesList();
        } 
        else 
        {
            if (response.status === 409) {
                alert('No duplicates allowed');
            } else {
                alert('Failed to create note: ' + (data.error || 'Unknown error'));
            }
        }
    } 
    catch (error) 
    {
        console.error('Error creating note:', error);
        alert('Error creating note');
    }
}

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

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch and display username
    const userData = await loadUsername();
    
    // Load notes list
    await PopulateNotesList();

    // Add note button click handler
    document.querySelector('.add-btn').addEventListener('click', () => CreateNote(userData.uuid));
    
    // Delete note button click handler
    document.querySelector('.delete-btn').addEventListener('click', () => DeleteNote());
});