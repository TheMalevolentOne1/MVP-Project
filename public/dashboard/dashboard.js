/*
TODO: (Dashboard Features)
- List of most recent notes (Clickable to open specific note)
- List of upcoming events (Clickable to open calendar at specific date)

(POST MVP)
- Quick links to common actions (Create Note, Create Event, Delete Calendar Event)
  - Create Note (New Note Page)
  - Create Event (Open Calendar Page and Calendar Modal for event data)
  - Delete Calendar Event (Open Calendar Page and select event to delete)
  - Visualisation of activity data (use dates from database and chart.js to generate activity graph
  - 
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
Brief: Logout API Call
*/
const handleLogout = async () =>
{
    try 
    {
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
Brief: Delete Account API Call
*/
const delAccount = async () => 
{
    const email = prompt("Please enter your email to confirm account deletion:");
 
    if (!email) 
    {
        alert('Email is required to delete account.');
        return;
    }
    else
    {
        try {
            const res = await fetch('/auth/whoami', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            
            const data = await res.json();

            if (data.email !== email) {
                alert('The email you entered does not match your account email.');
                return;
            } else {
                const response = await fetch('/user/del-acc/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ uuid: data.userId }),
                });
                if (response.ok) {
                    alert('Account deleted successfully.');
                    window.location.href = "../landing_page.html"; // Redirect to a goodbye page or homepage
                }
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            alert('An error occurred.');
        }
    }
}

/*
Brief: dashboard.js - Dashboard Page Functionality
*/
document.addEventListener('DOMContentLoaded', async () => {
    await loadUsername();
});