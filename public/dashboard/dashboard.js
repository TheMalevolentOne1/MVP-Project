/*
(POST MVP)
- Quick links to common actions (Create Note, Create Event, Delete Calendar Event)
  - Create Note (New Note Page)
  - Create Event (Open Calendar Page and Calendar Modal for event data)
  - Delete Calendar Event (Open Calendar Page and select event to delete)
  
- Visualisation of activity data 
- Bar Chart? (Dates, Amount of Notes/Events Created (Combined) (Dates Created? from Database)) 
- Activity Line Graph (use dates from database and chart.js to generate activity graph)
*/

/*
Brief: WhoAmI (Authentication Endpoint, Verifies Login)
*/
const loadUsername = async () => 
{
    try 
    {
        const response = await fetch('/auth/whoami');
        const data = await response.json();
        if (!data.loggedIn) 
        {
            window.location.href = '../login_page.html';
        } 
        else
        {
            document.getElementById('username').innerText = data.email || 'User';
        }
    } 
    catch (e) 
    {
        console.error(e);
    }
}

/*
Brief: Fetch and display recent notes (last 7 days)
*/
const loadRecentNotes = async () => 
{
    const container = document.getElementById('recent-notes-list');
    
    try 
    {
        const response = await fetch('/user/notes/recent');
        const data = await response.json();
        
        if (data.success && data.notes.length > 0) 
        {
            container.innerHTML = '';
            
            data.notes.forEach(note => 
            {
                const noteItem = document.createElement('div');
                noteItem.className = 'dashboard-list-item';
                noteItem.innerHTML = `
                    <h4>${note.title}</h4>
                    <p class="item-meta">${formatDate(note.updated_at)}</p>
                `;
                noteItem.onclick = () => {
                    window.location.href = `notes.html?note=${encodeURIComponent(note.title)}`;
                };
                container.appendChild(noteItem);
            });
            
            // Update count
            document.getElementById('notes-count').textContent = data.notes.length;
        } 
        else 
        {
            container.innerHTML = '<p class="empty-message">No recent notes</p>';
            document.getElementById('notes-count').textContent = '0';
        }
    } 
    catch (error) 
    {
        console.error('Error loading recent notes:', error);
        container.innerHTML = '<p class="error-message">Failed to load notes</p>';
    }
}

/*
Brief: Fetch and display upcoming events (next 7 days)
*/
const loadUpcomingEvents = async () => 
{
    const container = document.getElementById('upcoming-events-list');
    
    try 
    {
        const response = await fetch('/user/events/upcoming');
        const data = await response.json();
        
        if (data.success && data.events.length > 0) 
        {
            container.innerHTML = '';
            
            data.events.forEach(event => 
            {
                const eventItem = document.createElement('div');
                eventItem.className = 'dashboard-list-item';
                eventItem.innerHTML = `
                    <h4>${event.title}</h4>
                    <p class="item-meta">${formatDateTime(event.start)}</p>
                    ${event.location ? `<p class="item-location">${event.location}</p>` : ''}
                `;
                eventItem.onclick = () => {
                    window.location.href = `calendar.html?date=${encodeURIComponent(event.start)}`;
                };
                container.appendChild(eventItem);
            });
            
            // Update count
            document.getElementById('events-count').textContent = data.events.length;
        } 
        else 
        {
            container.innerHTML = '<p class="empty-message">No upcoming events</p>';
            document.getElementById('events-count').textContent = '0';
        }
    } 
    catch (error) 
    {
        console.error('Error loading upcoming events:', error);
        container.innerHTML = '<p class="error-message">Failed to load events</p>';
    }
}

/*
Brief: Format date for display
@Param1: dateString - ISO date string

@Return: Date Object
@ReturnF: Formatted date string
@ReturnT: Formatted date string
*/
const formatDate = (dateString) => 
{
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', 
    { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

/*
Brief: Format datetime for display
@Param1: dateString - ISO datetime string
@Return: Formatted datetime string
*/
const formatDateTime = (dateString) => 
{
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', 
    { 
        weekday: 'short',
        day: 'numeric', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/*
Brief: dashboard.js - Dashboard Page Functionality
*/
document.addEventListener('DOMContentLoaded', async () => 
{
    await loadUsername();
    await loadRecentNotes();
    await loadUpcomingEvents();
});