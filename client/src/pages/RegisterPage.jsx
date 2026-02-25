import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../apiHandler';
import './AuthPage.css';

/*
Brief: RegisterPage component that provides a user interface for new users to create an account by entering their email, password, and confirming their password. 
It includes form validation to ensure passwords match and meet length requirements, error handling for registration failures, and redirects authenticated users to the dashboard.

@Return: JSX Element
@ReturnT: The RegisterPage component that can be used as the registration page for the app, allowing new users to create an account and access their dashboard after successful registration.
*/
const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    /*
    Source Email Regex: https://stackoverflow.com/a/46181/1233763
    */
    const verifyEmailFormat = (email) => 
    {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const verifyPasswordStrength = (password) =>
    {
        return password.length >= 8; // Simple length check, can be enhanced with more complex rules
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');


        // Validate email format
        if (!verifyEmailFormat(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }

        // Validate password strength
        if (!verifyPasswordStrength(formData.password)) {
            setError('Password must be at least 8 characters');
            return;
        }

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { data } = await authAPI.register(formData.email, formData.password);
            
            if (data.success) {
                // Set default theme if not set
                if (!localStorage.getItem('theme')) {
                    localStorage.setItem('theme', 'light');
                }
                // Apply theme to document
                document.documentElement.setAttribute('data-theme', localStorage.getItem('theme'));
                // Auto-login after registration
                await login(formData.email, formData.password);
                navigate('/dashboard');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
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
                        <h2 className="auth-title">Create Account</h2>
                        <p className="auth-subtitle">Join Adaptive Study Cipher today</p>
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
                                placeholder="Create a password (min. 8 characters)"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <button 
                            type="submit" 
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">
                                Sign in
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

export default RegisterPage;
