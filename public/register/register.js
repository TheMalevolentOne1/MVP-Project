// Check if already logged in
fetch('/auth/whoami')
    .then(res => res.json())
    .then(data => {
        if (data.loggedIn) window.location.href = '/dashboard.html';
    });

/*
Brief: Display error message in error box.
@Param1: msg (String, error message)
*/
const showError = (msg) => 
{
    const box = document.getElementById('errorBox');
    box.textContent = msg;
    box.style.display = 'block';
}

/*
Brief: Wait for page to load.
*/
document.addEventListener('DOMContentLoaded', function()
{
    document.getElementById('registerForm').addEventListener('submit', async function(e) 
    {
        e.preventDefault();
        document.getElementById('errorBox').style.display = 'none';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const submitBtn = document.querySelector('button[type="submit"]');
        
        // Client-side validation (server will also validate)
        if (password !== confirmPassword) 
        {
            showError('Passwords do not match!');
            return;
        }
        
        if (password.length < 8) 
        {
            showError('Password must be at least 8 characters long');
            return;
        }
        
        // Basic email format check
        // Source: https://www.regular-expressions.info/email.html
        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        
        if (!emailRegex.test(email)) 
        {
            showError('Please enter a valid email address');
            return;
        }
        
        // Disable button during request
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        try 
        {
            const response = await fetch('/auth/register', {
                method: 'POST',
                headers: 
                {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();

            if (data.success) 
            {
                // Store minimal user info for UI purposes
                sessionStorage.setItem('userEmail', data.email);
                
                alert('Account created successfully!');
                window.location.href = '/dashboard.html';
            } 
            else 
            {
                showError(data.error || 'Registration failed. Please try again.');
            }
        } 
        catch (error) 
        {
            console.error('Registration error:', error);
            showError(`Connection error. Please try again. ${error.message}`);
        } 
        finally 
        {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });
});