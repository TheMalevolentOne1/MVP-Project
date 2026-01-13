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
        const response = await fetch(`/user/events/${eventId}`, {
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

    // Iterate through events and create blocks
    events.forEach(event => {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end_time);
        
        // Check if event is within the current week
        if (endDate < weekStart || startDate >= weekEnd) {
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
            if (dayOffset === 0) {
                // First day: start at event start hour
                hourStart = startDate.getHours();
                hourEnd = (daysDifference === 0) ? endDate.getHours() : 23;
            } else if (dayOffset === daysDifference) {
                // Last day: end at event end hour
                hourStart = 0;
                hourEnd = endDate.getHours();
            } else {
                // Middle days: full 24 hours
                hourStart = 0;
                hourEnd = 23;
            }
            
            // Create blocks for each hour on this day
            for (let hour = hourStart; hour <= hourEnd; hour++) {
                const slot = grid.querySelector(`.grid-slot[data-day="${dayIndex}"][data-hour="${hour}"]`);
                if (slot) {
                const eventBlock = document.createElement('div');
                eventBlock.classList.add('event-block');
                
                // Format start and end times
                const startTime = new Date(event.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(event.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                // Event content
                let eventContent = `${startTime} - ${endTime} | ${event.title}`;
                if (event.description) {
                    eventContent += `\n${event.description}`;
                }
                if (event.location) {
                    eventContent += `\n${event.location}`;
                }
                
                eventBlock.innerText = eventContent;

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-event-btn');
                deleteButton.innerText = 'X';
                deleteButton.onclick = (e) => 
                {
                    deleteEvent(event.id);
                    e.stopPropagation(); // Prevent triggering slot click
                };
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

    // Format for datetime-local input (Database Support)
    const isoString = dateTime.toISOString().slice(0, 16);
    document.getElementById('eventStart').value = isoString;

    // Clear fields
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventLocation').value = '';
    document.getElementById('eventDescription').value = '';

    modal.classList.remove('hidden'); // Close Modal
};

/*
Brief: Close the calendar event modal
*/
const closeEventModal = (e) =>
{
    document.getElementById('eventModal').classList.add('hidden');
};

/*
Brief: Handle Create Event Form Submission
*/
const handleCreateEvent = async () =>
{
    const title = document.getElementById('eventTitle').value.trim();
    const start = document.getElementById('eventStart').value.trim();
    var end_time = document.getElementById('eventEnd').value.trim();
    const location = document.getElementById('eventLocation').value.trim();
    const description = document.getElementById('eventDescription').value.trim();

    if (!title || !start) {
        alert('Event title and start time are required.');
        return;
    }

    if (!end_time)
    {
        end_time = start;
    }

    try 
    {
        const response = await fetch('/user/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, start, end_time, location, description }),
        });

        const data = await response.json();

        if (data.success) 
        {
            console.log('Event created with ID:', data.id);
            alert('Event Created'); // Notify user of successful creation
            closeEventModal();
            renderWeek(currentWeekStart); // Refresh calendar
            fetchAndPopulateEvents(); // Fetch and render updated events
        } else {
            alert('Failed to create event: ' + data.error);
        }
    } 
    catch (error) 
    {
        console.error('Error creating event:', error);
        alert('Error creating event');
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
const renderWeek = (startDate) => {
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
    try {
        const response = await fetch('/user/events');
        const data = await response.json();
        return data.success ? data.events : [];
    } catch (e) {
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
    const confirmed = confirm(
        `Extract timetable for the week:\n${mondayStr} - ${sundayStr}\n\nProceed with extraction?`
    );

    if (!confirmed) {
        return;
    }

    /* TODO: Implement ULAN timetable extraction logic
     1. Fetch timetable data for the specified week
     2. Parse and convert to calendar events
     3. Insert events into the database
     4. Refresh Calendar Page */

    alert('Timetable extraction not yet implemented.\n\nEmail: ' + uniEmail + '\nWeek: ' + mondayStr + ' - ' + sundayStr); // Temporary alert
};

// Brief: Get Monday of the week for start.
let currentWeekStart = getMonday(new Date());

// Brief: Runs on content page load.
document.addEventListener('DOMContentLoaded', () => 
{
    const eventForm = document.getElementById('eventForm');
    eventForm.onsubmit = async (e) => {
        e.preventDefault(); // Prevents page refresh
        await handleCreateEvent();
    };

    loadUsername(); // Ensure user is logged in
    renderWeek(currentWeekStart); // Render Current Week
    fetchAndPopulateEvents(); // Fetch and render events

    document.getElementById('cancelEventBtn').onclick = (e) =>
    {
        e.preventDefault(); // Prevent form submission
        closeEventModal(); // Close the modal
    };
    
    document.getElementById('prevWeekBtn').onclick = () => changeWeek(PREVIOUS_WEEK); 
    document.getElementById('nextWeekBtn').onclick = () => changeWeek(NEXT_WEEK);
});