import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            <header className="landing-header">
                <div className="logo">ASC</div>
                <button className="login-btn" onClick={() => navigate('/login')}>
                    Login
                </button>
            </header>

            <main className="landing-main">
                <section className="hero-section">
                    <h1 className="hero-title">Adaptive Study Cipher</h1>
                    <p className="hero-subtitle">
                        Your intelligent study planner for academic success
                    </p>
                    <p className="hero-description">
                        Organize your schedule, take notes, and sync your university timetable 
                        all in one place. Built for students, by students.
                    </p>
                    <button className="cta-btn" onClick={() => navigate('/register')}>
                        Get Started Free
                    </button>
                </section>

                <section className="features-section">
                    <h2 className="section-title">Features</h2>
                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">📅</div>
                            <h3>Smart Calendar</h3>
                            <p>Manage your classes, assignments, and events with an intuitive weekly view</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">📝</div>
                            <h3>Note Taking</h3>
                            <p>Create, edit, and organize your study notes with a powerful markdown editor</p>
                        </div>
                        <div className="feature-card">
                            <div className="feature-icon">🔄</div>
                            <h3>Auto-Sync Timetable</h3>
                            <p>Import your university timetable automatically with one click</p>
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <h2>Ready to boost your productivity?</h2>
                    <button className="cta-btn-secondary" onClick={() => navigate('/register')}>
                        Create Your Free Account
                    </button>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="footer-links">
                    <a href="#privacy">Privacy Policy</a>
                    <a href="#terms">Terms of Service</a>
                    <a href="#contact">Contact</a>
                </div>
                <p className="footer-copyright">
                    © 2026 Adaptive Study Cipher. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
