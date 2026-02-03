import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AppHeader.css';

const AppHeader = ({ title }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <header className="app-header">
            <div className="logo-area">
                <button className="logo-btn" onClick={() => navigate('/dashboard')}>
                    ASC
                </button>
            </div>

            {title && <h1 className="page-title">{title}</h1>}

            <div className="user-profile">
                <span className="user-email">{user?.email || 'User'}</span>
                <div className="profile-icon">{user?.email?.[0]?.toUpperCase() || 'U'}</div>
            </div>
        </header>
    );
};

export default AppHeader;
