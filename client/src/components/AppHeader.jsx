import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AppHeader.css';

/*
Brief: The AppHeader component displays the header with a logo, page title, and user profile info.

@Param1: title - The title of the current page to display in the header.

@Return: JSX Element
@ReturnT: The AppHeader component that can be used across the app to provide consistent header UI.
*/
const AppHeader = ({ title }) => 
{
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
