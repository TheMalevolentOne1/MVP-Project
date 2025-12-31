const databaseHandler = require("../../databaseHandler");

// Track the currently selected note
let currentNoteTitle = null;

// CommonMark parser and renderer
const reader = new commonmark.Parser();
const writer = new commonmark.HtmlRenderer({ safe: true });

// Render markdown content to HTML
function renderMarkdown(markdown) {
    const parsed = reader.parse(markdown);
    return writer.render(parsed);
}

// Toggle between Preview and Live (edit) mode
function setPreviewMode(isPreview) {
    const textarea = document.getElementById('noteContent');
    const preview = document.getElementById('notePreview');
    const previewBtn = document.getElementById('previewBtn');
    const editBtn = document.getElementById('editBtn');
    if (isPreview) {
        preview.innerHTML = renderMarkdown(textarea.value);
        textarea.style.display = 'none';
        preview.style.display = 'block';
        previewBtn.classList.add('active');
        editBtn.classList.remove('active');
    } else {
        textarea.style.display = 'block';
        preview.style.display = 'none';
        editBtn.classList.add('active');
        previewBtn.classList.remove('active');
    }
}

// Fetches the current user's info and updates the username display
 
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

async function populateNotesList()
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

// Select a note and load its content into the editor
function selectNote(noteElement) {
    
    // Remove selection from all notes (Only one button can be selected at a time)
    document.querySelectorAll('.note-item.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Mark note as selected
    noteElement.classList.add('selected');
    
    // Store the current note title
    currentNoteTitle = noteElement.dataset.title;
    
    // Load content into editor
    document.getElementById('noteTitle').value = noteElement.dataset.title;
    document.getElementById('noteContent').value = noteElement.dataset.content;
}

// Delete the currently selected note

async function UpdateNote()
{
    if (!currentNoteTitle) {
        alert('No note selected. Click on a note first.');
        return;
    }   

    const content = document.getElementById('noteContent').value.trim();

    try {

        const response = await fetch('/user/notes', 
        {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldTitle: currentNoteTitle, newTitle: currentNoteTitle, content })
        });

        const data = await response.json();
        if (data.success) {

            // Refresh notes list
            await populateNotesList();

        } else {
            alert('Failed to update note: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating note:', error);
        alert('Error updating note');
    }
}
 
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
            await populateNotesList();
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
            await populateNotesList();
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

async function editNoteContent(oldTitle, newTitle, content) {
    try {
        const response = await fetch(`/user/notes/${encodeURIComponent(oldTitle)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newTitle, content })
        });
        const data = await response.json();
        return data;
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function saveNote() 
{
    if (!currentNoteTitle && databaseHandler.getUserNotes().length >= 1)
    {
        alert('No note selected. Click on a note first.');
        return;
    }

    const newTitle = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();
    
    const response = await fetch(`/user/notes/${encodeURIComponent(currentNoteTitle)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTitle, content })
    });
    
    const data = await response.json();
    if (data.success) {
        currentNoteTitle = newTitle;
        await populateNotesList();
        alert('Note saved!');
    } else {
        alert('Failed to save note: ' + (data.error || 'Unknown error'));
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const userData = await loadUsername();
    
    // Load notes list
    await populateNotesList();

    // Add note button click handler
    document.querySelector('.add-btn').addEventListener('click', () => CreateNote());
    
    // Delete note button click handler
    document.querySelector('.delete-btn').addEventListener('click', () => DeleteNote());
    
    // Mode toggle buttons
    document.getElementById('previewBtn').addEventListener('click', () => setPreviewMode(true));
    document.getElementById('editBtn').addEventListener('click', () => setPreviewMode(false));
    
    // Set default mode to Edit on load
    setPreviewMode(false);

    // Clear button handler
    document.querySelector('.clear-btn').addEventListener('click', () => {
        if (confirm('Clear the note editor?')) {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            currentNoteTitle = null;
        }
    });

    // Save button handler
    document.querySelector('.save-btn').addEventListener('click', () => saveNote());
});

// Save note hotkey: Ctrl+S
window.addEventListener('keydown', function(e) 
{
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') 
    {
        e.preventDefault();
        if (currentNoteTitle) {
            if (confirm("Do you want to save changes to the current note?")) saveNote();
        } else if (confirm('Create new note?')) {
            CreateNote();
        }
    }
});