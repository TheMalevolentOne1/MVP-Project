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
Brief: changeWeek button.
@Param1: days (Date, number of days)
*/
const changeWeek = (days) =>
{
    currentWeekStart.setDate(currentWeekStart.getDate() + days);
    renderWeek(currentWeekStart);
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
const closeEventModal = () =>
{
    document.getElementById('eventModal').classList.add('hidden');
};

/*
Brief: Handle Create Event Form Submission
*/
const handleCreateEvent = async () =>
{
    const title = document.getElementById('eventTitle').value;
    const start = document.getElementById('eventStart').value;
    const end_time = document.getElementById('eventEnd').value;
    const location = document.getElementById('eventLocation').value;
    const description = document.getElementById('eventDescription').value;

    try 
    {
        const response = await fetch('/user/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, start, end_time, location, description })
        });

        const data = await response.json();

        if (data.success) 
        {
            console.log('Event created with ID:', data.id);
            closeEventModal();
            renderWeek(currentWeekStart); // Refresh calendar
        } else {
            alert('Failed to create event: ' + data.error);
        }
    } 
    catch (error) 
    {
        console.error('Error creating event:', error);
        alert('Failed to create event');
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

    document.getElementById('cancelEventBtn').onclick = closeEventModal;
    document.getElementById('prevWeekBtn').onclick = () => changeWeek(PREVIOUS_WEEK); 
    document.getElementById('nextWeekBtn').onclick = () => changeWeek(NEXT_WEEK);
});