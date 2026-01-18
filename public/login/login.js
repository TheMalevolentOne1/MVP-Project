// Check if already logged in
fetch('/auth/whoami')
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) window.location.href = '/dashboard.html';
    });

/*
Brief: Show error message
@Param1 msg (String, Error message to display)
*/
const showError = (msg) =>
{
    const box = document.getElementById('errorBox');
    box.textContent = msg;
    box.style.display = 'block';
}

/*
Brief: Asynchronous Login API Call
*/
const login = async () => 
{
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('button[type="submit"]');

    document.getElementById('errorBox').style.display = 'none';

    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    await fetch('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    }).then(async (res) => {
            let data = null;
            let isJson = false;
            
            try 
            {
                const contentType = res.headers.get('content-type');
                isJson = contentType && contentType.includes('application/json');
                if (isJson) 
                {
                    data = await res.json();
                }
            } 
            catch (jsonErr) 
            {
                // If JSON parsing fails, data remains null
            }

            if (res.ok && data && data.success) 
            {
                sessionStorage.setItem('userEmail', data.email); // Client Email Stored
                window.location.href = '/dashboard.html';
            } 
            else if (data && data.error) 
            {
                showError(data.error);
            } 
            else if (!res.ok) 
            {
                showError('Login failed: ' + res.status + ' ' + res.statusText);
            } 
            else 
            {
                showError('Invalid email or password');
            }
        }).catch((err) => {
            console.error('Login error:', err);
            showError('Error: ' + err.message);
        }).finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        });
}

/*
Brief: Wait for page to load.
@Param1 function (Function, Function to execute on load)
*/
document.addEventListener('DOMContentLoaded', function()
{
    document.getElementById('loginForm').addEventListener('submit', function (e) {
        e.preventDefault(); // prevent page refresh
        login();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default Enter behavior
            login(); // Trigger the login function
        }
    });
});