/*
=============================================================================
BACKEND ENDPOINT REQUIRED: POST /api/auth/register
=============================================================================

PURPOSE: Create a new user account and establish a session

PARAMETERS (req.body):
  - email: string (required) - User's email address, must be valid format
  - password: string (required) - Min 8 characters, will be hashed server-side

VALIDATION:
  1. Check email is valid format (regex or validator library)
  2. Check password length >= 8 characters
  3. Check email doesn't already exist in database

DATABASE OPERATIONS:
  1. Query: SELECT id FROM users WHERE email = ? (check duplicates)
  2. Generate UUID: const userId = crypto.randomUUID()
  3. Hash password: const hash = await bcrypt.hash(password, 10)
  4. Insert: INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, NOW())
  5. Create session: req.session.userId = userId

RESPONSE:
  Success (201): { success: true, userId: string, email: string }
  Invalid input (400): { success: false, error: 'Invalid email or password too short' }
  Email exists (409): { success: false, error: 'Email already registered' }
  Server error (500): { success: false, error: 'Server error' }

BACKEND FUNCTION SIGNATURE:
  app.post('/api/auth/register', async (req, res) => {
      const { email, password } = req.body;
      
      // 1. Validate inputs
      if (!email || !password || password.length < 8) {
          return res.status(400).json({ success: false, error: 'Invalid input' });
      }
      
      // 2. Check if email exists
      const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
          return res.status(409).json({ success: false, error: 'Email already registered' });
      }
      
      // 3. Create user
      const userId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.execute(
          'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
          [userId, email, passwordHash]
      );
      
      // 4. Create session
      req.session.userId = userId;
      
      res.status(201).json({ success: true, userId, email });
  });

=============================================================================
*/

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.querySelector('button[type="submit"]');
    
    // Client-side validation (server will also validate)
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        return;
    }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Disable button during request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store minimal user info for UI purposes
            sessionStorage.setItem('userEmail', data.email);
            
            alert('Account created successfully!');
            window.location.href = '../dashboard.html';
        } else {
            alert(data.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Connection error. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});
