import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

/*
Brief: LoginPage component that provides a user interface for users to enter their email and password to log in to the application. 
It includes form validation, error handling, and redirects authenticated users to the dashboard.

@Return: JSX Element
@ReturnT: The LoginPage component that can be used as the login page for the app, allowing users to authenticate and access their dashboard.
*/
const LoginPage = () => {
    const navigate = useNavigate();
    const { login, user } = useAuth();

    /*
    Brief: Redirect to dashboard if user is already authenticated.
    */
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    /*
    Brief: State management for form data
    */
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /*
    Brief: Handle input changes and update form data state. Also resets error state on input change.

    @Param1: e - The event object from the input change event.

    @Return: Object
    @ReturnT: Updated formData state with the new input value, and error state reset to an empty string.
    */
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    /*
    Brief: Handle form submission for login. It validates the input, calls the login function from the auth context, and handles success or error states.

    @Param1: e - The event object from the form submission.
    */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-logo">ASC</h1>
                        <h2 className="auth-title">Welcome Back</h2>
                        <p className="auth-subtitle">Sign in to your account</p>
                    </div>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {error && <div className="error-message">{error}</div>}
                        
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/register" className="auth-link">
                                Sign up
                            </Link>
                        </p>
                        <Link to="/" className="back-link">
                            ← Back to home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;