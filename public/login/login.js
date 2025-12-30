/*
=============================================================================
BACKEND ENDPOINT REQUIRED: POST /api/auth/login
=============================================================================

PURPOSE: Authenticate a user and create a session

PARAMETERS (req.body):
  - email: string (required) - User's email address
  - password: string (required) - User's plain text password

DATABASE OPERATIONS:
  1. Query: SELECT id, email, password_hash FROM users WHERE email = ?
  2. If no user found: return 401 error
  3. Compare password with bcrypt: await bcrypt.compare(password, user.password_hash)
  4. If match: create session with req.session.userId = user.id

RESPONSE:
  Success (200): { success: true, userId: string, email: string }
  Invalid credentials (401): { success: false, error: 'Invalid email or password' }
  Server error (500): { success: false, error: 'Server error' }

BACKEND FUNCTION SIGNATURE:
  app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      // ... implementation
  });

=============================================================================
*/

document.getElementById('loginForm').addEventListener('submit', async function(e) 
{
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch('/api/auth/login', {
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
            alert(data.error || 'Invalid email or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Connection error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});
