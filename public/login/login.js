// Check if already logged in
fetch('/auth/whoami')
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) window.location.href = '../dashboard.html';
    });

function showError(msg) {
    const box = document.getElementById('errorBox');
    box.textContent = msg;
    box.style.display = 'block';
}

document.getElementById('loginForm').addEventListener('submit', async function(e) 
{
    e.preventDefault();
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
        
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('userEmail', data.email);
            window.location.href = '../dashboard.html';
        } else {
            showError(data.error || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});
