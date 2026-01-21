/*
(POST-MVP) 
- Improve Event Calendar Rendering (Continous Blocks)
- Notifications for:
  - Upcoming Events
  - Overlapping Events Warning
  - Recurring Events Support (Reoccuring Per Week/Month Toggle)
  - 
*/

// CONSTANTS
const PREVIOUS_WEEK = -7;
const NEXT_WEEK = 7;
const DAYS_IN_WEEK = 7;
const HOURS_IN_DAY = 24;

const TIME_LABEL_WIDTH = 2;

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
Brief: Logout API Call
*/
const handleLogout = async () =>
{
    try 
    {
        const response = await fetch('/auth/logout', { method: 'POST' });
        if (response.ok)
            window.location.href = './login_page.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed');
    }
}

/*
Brief: Delete an event by ID
@Param1: eventId (Number, ID of event to delete)
*/
const deleteEvent = async (eventId) => 
{
    if (!confirm('Delete this event?')) {
        return;
    }

    try 
    {
        const response = await fetch(`/user/events/${eventId}`, 
        {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) 
        {
            console.log('Event deleted:', eventId);
            fetchAndPopulateEvents(); // Refresh calendar
        } 
        else 
        {
            alert('Failed to delete event: ' + data.error);
        }
    } 
    catch (error) 
    {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
    }
};

/*
Brief: Edit an event by ID
@Param1: eventID (Number, ID of event to edit)
@Param2: title (String, Event title)
@Param3: start (String, ISO date-time string)
@Param4: end_time (String, ISO date-time string)
@Param5: location (String, Event location)
@Param6: description (String, Event description)
*/
const editEvent = async (eventID, title, start, end_time, location, description) =>
{
    try {
        // Build update object with only provided fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (start !== undefined) updateData.start = start;
        if (end_time !== undefined) updateData.end_time = end_time;
        if (location !== undefined) updateData.location = location;
        if (description !== undefined) updateData.description = description;

        const response = await fetch(`/user/events/${eventID}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Event updated:', eventID);
            fetchAndPopulateEvents(); // Refresh calendar
        } else {
            alert('Failed to update event: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Error updating event');
    }
}

/*
Brief: Open edit modal for an event
@Param1: event (Object, Event data)
*/
const openEditModal = (event) => {
    const modal = document.getElementById('eventModal');
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('createEventBtn');
    
    // Change modal to edit mode
    modalTitle.innerText = 'Edit Event';
    submitBtn.innerText = 'Save';
    
    // Pre-fill form with event data
    document.getElementById('eventTitle').value = event.title || '';
    document.getElementById('eventStart').value = event.start ? event.start.slice(0, 16) : '';
    document.getElementById('eventEnd').value = event.end_time ? event.end_time.slice(0, 16) : '';
    document.getElementById('eventLocation').value = event.location || '';
    document.getElementById('eventDescription').value = event.description || '';
    
    // Store event ID for submission
    modal.dataset.editingEventId = event.id;
    
    modal.classList.remove('hidden');
};

/*
Brief: Render events onto the calendar grid
@Param1: events (Array, List of event objects from database)
*/
const renderEvents = async (events) =>
{
    const grid = document.getElementById('calendarGrid');

    // Clear previous events
    const existingEvents = grid.querySelectorAll('.event-block');
    existingEvents.forEach(event => event.remove());

    // Get the current week's date range
    const weekStart = new Date(currentWeekStart);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(0, 0, 0, 0);

    console.log('Rendering events:', events);
    console.log('Week range:', weekStart, 'to', weekEnd);

    // Iterate through events and create blocks
    events.forEach(event => 
    {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end_time);
        
        console.log('Event:', event.title, 'Start:', startDate, 'End:', endDate);
        
        // Check if event is within the current week
        if (endDate < weekStart || startDate >= weekEnd) {
            console.log('Skipping event - outside week range');
            return; // Skip events outside current week
        }
        
        // Check if event spans multiple days
        const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const daysDifference = Math.floor((endDay - startDay) / (1000 * 60 * 60 * 24));
        
        // Iterate through each day the event spans
        for (let dayOffset = 0; dayOffset <= daysDifference; dayOffset++) {
            const currentDate = new Date(startDay);
            currentDate.setDate(startDay.getDate() + dayOffset);
            
            // Skip if this day is outside the current week
            if (currentDate < weekStart || currentDate >= weekEnd) {
                continue;
            }
            
            // Calculate day index relative to the week start (Monday)
            const daysSinceMonday = Math.floor((currentDate - weekStart) / (1000 * 60 * 60 * 24));
            const dayIndex = daysSinceMonday; // 0 = Monday, 6 = Sunday
            
            // Determine hour range for this specific day
            let hourStart, hourEnd;
            if (dayOffset === 0) 
            {
                // First day: start at event start hour
                hourStart = startDate.getHours();
                hourEnd = (daysDifference === 0) ? endDate.getHours() : 23;
            } 
            else if (dayOffset === daysDifference) 
            {
                // Last day: end at event end hour
                hourStart = 0;
                hourEnd = endDate.getHours();
            } 
            else
            {
                // Middle days: full 24 hours
                hourStart = 0;
                hourEnd = 23;
            }
            
            // Create blocks for each hour on this day
            for (let hour = hourStart; hour <= hourEnd; hour++) 
            {
                // Find the corresponding slot in the grid with data attributes
                const slot = grid.querySelector(`.grid-slot[data-day="${dayIndex}"][data-hour="${hour}"]`);
                
                if (slot) 
                {
                    const eventBlock = document.createElement('div');
                    eventBlock.classList.add('event-block');
                    
                    // Format start and end times
                    const startTime = new Date(event.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const endTime = new Date(event.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    
                    // Event content
                    let eventContent = `${startTime} - ${endTime} | ${event.title}`;
                    if (event.location)
                        eventContent += `\n${event.location}`;
                    
                    eventBlock.innerText = eventContent;

                    const editButton = document.createElement('button');
                    editButton.classList.add('edit-event-btn');
                    editButton.innerText = '✎';
                    editButton.onclick = (e) =>
                    {
                        e.preventDefault();
                        openEditModal(event);
                        e.stopPropagation(); // Prevent triggering slot click
                    }

                    const deleteButton = document.createElement('button');
                    deleteButton.classList.add('delete-event-btn');
                    deleteButton.innerText = 'X';
                    deleteButton.onclick = (e) => 
                    {
                        deleteEvent(event.id);
                        e.stopPropagation();
                    };
                    eventBlock.appendChild(editButton);
                    eventBlock.appendChild(deleteButton);

                    slot.appendChild(eventBlock);
                }
            }
        }
    });
}

/*
Brief: changeWeek button.
@Param1: days (Date, number of days)
*/
const changeWeek = (days) =>
{
    currentWeekStart.setDate(currentWeekStart.getDate() + days);
    renderWeek(currentWeekStart);
    fetchAndPopulateEvents(); // Fetch and render events for the new week
}

/*
Brief: Calculate Monday for a given date
@Param1: date (Date)
@Returns: Date (Monday of that week)
*/
const getMonday = (d) =>
{
    var d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
}

/*
Brief: Get all dates for a week
@Param1: monday (Date)
@Returns: Date List for Week
*/
const getWeekDates = (monday) =>
{
    const dates = [];
    
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const result = new Date(monday);
        result.setDate(monday.getDate() + i);
        dates.push(result);
    }

    return dates;
}

/*
Brief: Update visible week label
@Param1: weekDates (Date[])
*/
const updateLabel = (weekDates) =>
{
    const start = weekDates[0];
    const end = weekDates[6];
    const opts = { month: 'short', day: 'numeric' };
    document.getElementById('currentWeekLabel').innerText = 
        `${start.toLocaleDateString('en-GB', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

/*
Brief: Check if date is today
@Param1: date (Date)
@Returns: Boolean
*/
const isToday = (date) =>
{
    const today = new Date();

    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

/*
Brief: Open the calendar event model when a table slot is selected
*/
const openEventModal = (dateTime) =>
{
    const modal = document.getElementById('eventModal');
    const modalTitle = modal.querySelector('h2');
    const submitBtn = document.getElementById('createEventBtn');

    // Reset to create mode
    modalTitle.innerText = 'Create Event';
    submitBtn.innerText = 'Create';
    delete modal.dataset.editingEventId;

    // Format for datetime-local input (Database Support)
    const isoString = dateTime.toISOString().slice(0, 16);
    document.getElementById('eventStart').value = isoString;
    document.getElementById('eventEnd').value = '';

    // Clear fields
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventDescription').value = '';

    modal.classList.remove('hidden');
};

/*
Brief: Close the calendar event modal
*/
const closeEventModal = (e) =>
{
    const modal = document.getElementById('eventModal');
    modal.classList.add('hidden');
    delete modal.dataset.editingEventId; // Clear edit state
};

/*
Brief: Handle Create/Edit Event Form Submission
*/
const handleEventSubmit = async () =>
{
    const modal = document.getElementById('eventModal');
    const editingId = modal.dataset.editingEventId;
    
    const title = document.getElementById('eventTitle').value.trim();
    const start = document.getElementById('eventStart').value.trim();
    var end_time = document.getElementById('eventEnd').value.trim();
    const location = document.getElementById('eventLocation').value.trim();
    const description = document.getElementById('eventDescription').value.trim();

    if (!title || !start) 
    {
        alert('Event title and start time are required.');
        return;
    }

    if (!end_time)
    {
        end_time = start;
    }

    // Validate end time is not before start time
    if (new Date(end_time) < new Date(start)) 
    {
        alert('End time cannot be before start time.');
        return;
    }

    try 
    {
        let response;
        
        if (editingId) {
            // Edit existing event
            response = await fetch(`/user/events/${editingId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, start, end_time, location, description }),
            });
        } else {
            // Create new event
            response = await fetch('/user/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, start, end_time, location, description }),
            });
        }

        const data = await response.json();

        if (data.success) 
        {
            console.log(editingId ? 'Event updated' : 'Event created with ID:', data.id);
            alert(editingId ? 'Event Updated' : 'Event Created');
            closeEventModal();
            renderWeek(currentWeekStart);
            fetchAndPopulateEvents();
        } 
        else 
        {
            alert('Failed to save event: ' + data.error);
        }
    } 
    catch (error) 
    {
        console.error('Error saving event:', error);
        alert('Error saving event');
    }
};


/*
Brief: Select day from Calendar Table
Param1: weekStart (Date, Relevant Week)
Param2: dayIndex (Date, index of day in table)
Param3: hour (String, hour selected)
*/
const daySelect = (weekStart, dayIndex, hour) =>
{
    const selectedDate = new Date(weekStart);
    selectedDate.setDate(weekStart.getDate() + dayIndex);
    selectedDate.setHours(hour, 0, 0, 0);
    
    openEventModal(selectedDate);
};


// Page Content

/*
Brief: Render Calendar for Week of Starting Date
@Param1: startDate (Int, Monday of relevant week)
*/
const renderWeek = (startDate) => 
{
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = ''; // Clear previous grid

    // Top-Left Corner
    const corner = document.createElement('div');
    corner.classList.add('grid-header-cell');
    grid.appendChild(corner);

    // Day Headers
    const weekDates = getWeekDates(startDate);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    weekDates.forEach((date, i) => {
        const header = document.createElement('div');
        header.classList.add('grid-header-cell');
        header.innerText = `${dayNames[i]} ${date.getDate()}`;
        if (isToday(date)) header.classList.add('today');
        grid.appendChild(header);
    });

    updateLabel(weekDates);

    // Time Slots (The Grid)

    for (let hour = 0; hour < HOURS_IN_DAY; hour++) 
    {
        // Time Label (e.g., "09:00")
        const timeCell = document.createElement('div');
        timeCell.classList.add('time-label-cell');
        timeCell.innerText = `${String(hour).padStart(2, '0')}:00`;
        grid.appendChild(timeCell);

        // Day Columns for this hour
        for (let day = 0; day < DAYS_IN_WEEK; day++) {
            const slot = document.createElement('div');
            slot.classList.add('grid-slot');
            
            // Assign coordinates so renderEvents can find this slot
            slot.dataset.day = day;
            slot.dataset.hour = hour;

            slot.onclick = () => daySelect(startDate, day, hour);
            grid.appendChild(slot);
        }
    }

    // Place the events on top of the newly created grid
    //renderEvents(weekDates);
};
/*
Brief: Fetch events from server
@Returns: Event List
*/
const fetchEvents = async () => 
{
    try
    {
        const response = await fetch('/user/events');
        const data = await response.json();
        return data.success ? data.events : [];
    }
    catch (e) 
    {
        console.error("Failed to fetch events", e);
        return [];
    }
};

/*
Brief: Fetch events from the API and populate the calendar grid.
*/
const fetchAndPopulateEvents = async () => {
    try {
        // Fetch events from the server
        const response = await fetch('/user/events');
        const data = await response.json();

        if (data.success) {
            const events = data.events;

            // Populate the calendar grid with fetched events
            renderEvents(events);
        } else {
            console.error('Failed to fetch events:', data.error);
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

/*
Brief: Extract timetable from ULAN (University TimeTable System (Web Scraper))
*/
const extractTimeTable = async () => {
    // Prompt for university email
    const uniEmail = prompt('Enter your University Email:');
    if (!uniEmail) {
        alert('Email is required to extract timetable.');
        return;
    }

    // Prompt for password
    const uniPassword = prompt('Enter your University Password:');
    if (!uniPassword) {
        alert('Password is required to extract timetable.');
        return;
    }

    // Get current week's Monday
    const monday = getMonday(new Date());
    const weekEnd = new Date(monday);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Format dates for confirmation
    const opts = { month: 'short', day: 'numeric', year: 'numeric' };
    const mondayStr = monday.toLocaleDateString('en-US', opts);
    const sundayStr = weekEnd.toLocaleDateString('en-US', opts);

    // Confirm extraction
    const confirmed = confirm(`Extract timetable for the week:\n${mondayStr} - ${sundayStr}\n\nProceed with extraction?`);

    if (!confirmed) {
        return;
    }

    // Call backend endpoint to sync timetable
    fetch('/user/timetable/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: uniEmail,
            password: uniPassword,
            startDate: monday.toISOString(),
            endDate: weekEnd.toISOString()
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Successfully imported ${data.imported} events`);
            // Refresh calendar to show new events
            fetchAndPopulateEvents();
        } else {
            alert('Failed to import events: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Error syncing timetable:', error);
        alert('Failed to sync timetable. Please check your credentials and try again.');
    });
};

// Brief: Get Monday of the week for start.
let currentWeekStart = getMonday(new Date());

// Brief: Runs on content page load.
document.addEventListener('DOMContentLoaded', () => 
{
    const eventForm = document.getElementById('eventForm');
    eventForm.onsubmit = async (e) => {
        e.preventDefault(); // Prevents page refresh
        await handleEventSubmit();
    };

    loadUsername(); // Ensure user is logged in
    renderWeek(currentWeekStart); // Render Current Week
    fetchAndPopulateEvents(); // Fetch and render events

    document.getElementById('cancelEventBtn').onclick = (e) =>
    {
        e.preventDefault(); // Prevent form submission
        closeEventModal(); // Close the modal
    };
    
    // Week Buttons
    document.getElementById('prevWeekBtn').onclick = () => changeWeek(PREVIOUS_WEEK); 
    document.getElementById('nextWeekBtn').onclick = () => changeWeek(NEXT_WEEK);
});