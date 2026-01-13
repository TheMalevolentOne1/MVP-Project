// Basic Settings Page (JavaScript to handle account deletion form submission)
document.addEventListener('DOMContentLoaded', () => 
{
    const form = document.querySelector('.settings-section form');

    form.addEventListener('submit', async (e) => 
    {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!email || !password) 
        {
            alert('Please fill in both email and password fields.');
            return;
        }

        try 
        {
            const response = await fetch('/user/del-acc/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) 
            {
                alert('Account deleted successfully.');
                window.location.href = "/landing_page.html"; // Redirect to a goodbye page or homepage
            } else 
            {
                const errorData = await response.json();
                alert(`Error: ${errorData.message || 'Failed to delete account.'}`);
            }
        } 
        catch (error) 
        {
            console.error('Error deleting account:', error);
            alert('An error occurred. Please try again later.');
        }
    });
});