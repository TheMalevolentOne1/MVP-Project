// --- State ---
let currentWeekStart = getMonday(new Date());

function changeWeek(days) {
    currentWeekStart.setDate(currentWeekStart.getDate() + days);
    renderWeek(currentWeekStart);
}

function renderWeek(startDate) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = ''; // Clear previous

    // 1. Top-Left Empty Corner
    const corner = document.createElement('div');
    corner.classList.add('grid-header-cell');
    grid.appendChild(corner);

    // 2. Day Headers (Mon 30, Tue 31...)
    const weekDates = getWeekDates(startDate);
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    weekDates.forEach((date, i) => {
        const header = document.createElement('div');
        header.classList.add('grid-header-cell');
        header.innerText = `${dayNames[i]} ${date.getDate()}`;
        
        if (isToday(date)) header.classList.add('today');
        grid.appendChild(header);
    });

    // Update Label
    updateLabel(weekDates);

    // 3. Time Slots (24 Hours)
    for (let hour = 0; hour < 24; hour++) {
        // Time Label (Left Column)
        const timeCell = document.createElement('div');
        timeCell.classList.add('time-label-cell');
        timeCell.innerText = `${String(hour).padStart(2, '0')}:00`;
        grid.appendChild(timeCell);

        // 7 Day Slots
        for (let day = 0; day < 7; day++) {
            const slot = document.createElement('div');
            slot.classList.add('grid-slot');
            
            // Interaction: Click to add event (Future Feature)
            slot.onclick = () => console.log(`Clicked Day ${day}, Hour ${hour}`);
            
            grid.appendChild(slot);
        }
    }
}

async function loadUsername() {
    try {
        const response = await fetch('/auth/whoami');
        const data = await response.json();
        if (!data.loggedIn) {
            window.location.href = '../login_page.html';
        } else {
            document.getElementById('username').innerText = data.email || 'User';
        }
    } catch (e) {
        console.error(e);
    }
}

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
}

function getWeekDates(monday) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const result = new Date(monday);
        result.setDate(monday.getDate() + i);
        dates.push(result);
    }
    return dates;
}

function updateLabel(weekDates) {
    const start = weekDates[0];
    const end = weekDates[6];
    const opts = { month: 'short', day: 'numeric' };
    document.getElementById('currentWeekLabel').innerText = 
        `${start.toLocaleDateString('en-GB', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadUsername(); // Ensure user is logged in
    renderWeek(currentWeekStart);

    document.getElementById('prevWeekBtn').onclick = () => changeWeek(-7);
    document.getElementById('nextWeekBtn').onclick = () => changeWeek(7);
});