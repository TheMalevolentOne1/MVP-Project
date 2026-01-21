// Track the currently selected note
let currentNoteTitle = null;

// CommonMark parser and renderer
const reader = new commonmark.Parser(); // Commonmark CDN attached in HTML
const writer = new commonmark.HtmlRenderer({ safe: true });

/*
Brief: Render markdown content to HTML
@Param1: markdown (String, markdown content)
*/ 
const renderMarkdown = (markdown) =>
{
    const parsed = reader.parse(markdown);
    return writer.render(parsed);
}

/*
Brief: Set preview or edit mode
@Param1: isPreview (Boolean, true for preview mode, false for edit mode)
*/
const setPreviewMode = (isPreview) => 
{
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

/*
Brief: Fetches the current user's info and updates the username display
*/ 
const loadUsername = async () =>
{
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

/*
Brief: Logs out the current user
*/
const handleLogout = async () =>
{
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

/*
Brief: Fetches and populates the notes list
*/
const populateNotesList = async () =>
{
    try 
    {
        console.log('Fetching notes...');
        const response = await fetch('/user/notes');
        const data = await response.json();
        
        console.log('Notes response:', data);
        
        if (!data.success) 
        {
            console.error('Failed to fetch notes:', data.error);
            return;
        }
        
        const notesList = document.getElementById('notesList');
        notesList.innerHTML = ''; // Clear existing notes
        
        console.log('Number of notes:', data.notes ? data.notes.length : 0);
        
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

/*
Brief: Select a note and load its content into the editor
@Param1: noteElement (HTMLElement, the note button element clicked)
*/ 
const selectNote = (noteElement) => 
{    
    // Remove selection from all notes (Only one button can be selected at a time)
    document.querySelectorAll('.note-item.selected').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Mark note as selected
    noteElement.classList.add('selected');
    
    // Store the current note title
    currentNoteTitle = noteElement.dataset.title;
    
    // Load content into editor
    const textarea = document.getElementById('noteContent');
    const preview = document.getElementById('notePreview');
    textarea.value = noteElement.dataset.content;

    // Update preview if in preview mode
    if (preview.style.display === 'block') {
        preview.innerHTML = renderMarkdown(textarea.value);
    }

    document.getElementById('noteTitle').value = noteElement.dataset.title;
};
/*
Brief: Update the currently selected note
*/
const UpdateNote = async () =>
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

/*
Brief: Delete the currently selected note
*/
const DeleteNote = async () =>
{
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
        
        if (data.success) 
        {
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

/*
Brief: Create a new note
*/
const CreateNote = async () =>
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

/*
Brief: Save the current note (create or update)
*/
const saveNote = async () => 
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

    // Only update an existing note; do not create new notes
    if (!currentNoteTitle) {
        alert('No note selected. Click on a note first.');
        return;
    }
    // Update note
    const response = await fetch(`/user/notes/${encodeURIComponent(currentNoteTitle)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newTitle: title, content })
    });
    const data = await response.json();
    if (data.success) {
        currentNoteTitle = title;
        await populateNotesList();
        alert('Note saved!');
    } else {
        alert('Failed to save note: ' + (data.error || 'Unknown error'));
    }
}

/*
Brief: Wait for page to load
@Param1 function (Function, Function to execute on load)
*/
document.addEventListener('DOMContentLoaded', async () => 
{
    const userData = await loadUsername();
    
    // Load notes list
    await populateNotesList();

    // Check for query parameter to auto-select a note
    const params = new URLSearchParams(window.location.search);
    const noteTitle = params.get('note');
    if (noteTitle) {

        // Wait a moment for notes to be rendered, then find and click the note
        setTimeout(() => {
            const noteElements = document.querySelectorAll('.note-item');
            const matchingNote = Array.from(noteElements).find(el => el.dataset.title === noteTitle);
            if (matchingNote) {
                selectNote(matchingNote);
            }
        }, 100);
    }

    // Add note button click handler
    document.querySelector('.add-btn').addEventListener('click', () => CreateNote());
    
    // Delete note button click handler
    document.querySelector('.delete-btn').addEventListener('click', () => DeleteNote());

    // Download note button click handler
    document.querySelector('.download-btn').addEventListener('click', () => 
    {
        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value.trim();

        if (currentNoteTitle || (title && content))
        {
            const element = document.createElement('a');
            const file = new Blob([content], { type: 'text/markdown' });
            element.href = URL.createObjectURL(file);
            element.download = `${title || 'note'}.md`;
            document.body.appendChild(element); // Required for this to work in FireFox
            element.click();
            document.body.removeChild(element);
        }

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

    });

    
    // Mode toggle buttons
    document.getElementById('previewBtn').addEventListener('click', () => setPreviewMode(true));
    document.getElementById('editBtn').addEventListener('click', () => setPreviewMode(false));
    
    // Set default mode to Edit on load
    setPreviewMode(false);

    // Clear button handler
    document.querySelector('.clear-btn').addEventListener('click', () =>
    {
        if (confirm('Clear the note editor?')) 
        {
            document.getElementById('noteTitle').value = '';
            document.getElementById('noteContent').value = '';
            currentNoteTitle = null;
        }
    });

    // Save button handler
    const saveBtn = document.getElementById('saveBtn') || document.querySelector('.save-btn');
    if (saveBtn) 
    {
        saveBtn.addEventListener('click', (e) => 
        {
            e.preventDefault();
            saveNote();
        });
    }

    // Ctrl+S hotkey handler
    document.addEventListener('keydown', function(e) 
{
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') 
        {
            e.preventDefault();
            saveNote();
        }
    });
});

