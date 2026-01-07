// Check if already logged in
fetch('/auth/whoami')
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) window.location.href = '/dashboard.html';
    });

function showError(msg) {
    const box = document.getElementById('errorBox');
    box.textContent = msg;
    box.style.display = 'block';
}

/*
Brief: Wait for page to load.
*/
document.addEventListener('DOMContentLoaded', function()
{
    document.getElementById('loginForm').addEventListener('submit', async function(e) 
    {
        e.preventDefault(); // prevent page refresh
        document.getElementById('errorBox').style.display = 'none';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = document.querySelector('button[type="submit"]');
        
        // Disable button during request
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            let data = null;
            let isJson = false;
            try {
                const contentType = response.headers.get('content-type');
                isJson = contentType && contentType.includes('application/json');
                if (isJson) {
                    data = await response.json();
                }
            } catch (jsonErr) {
                // If JSON parsing fails, data remains null
            }

            if (response.ok && data && data.success) {
                sessionStorage.setItem('userEmail', data.email); // Client Email Stored
                window.location.href = '/dashboard.html';
            } else if (data && data.error) {
                showError(data.error);
            } else if (!response.ok) {
                showError('Login failed: ' + response.status + ' ' + response.statusText);
            } else {
                showError('Invalid email or password');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
});