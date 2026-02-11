import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiCalendar, FiEdit3, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import './Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <nav className="app-navbar">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiHome /> Dashboard
            </NavLink>
            <NavLink to="/calendar" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiCalendar /> Calendar
            </NavLink>
            <NavLink to="/notes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiEdit3 /> Notes
            </NavLink>
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <FiSettings /> Settings
            </NavLink>
            <button onClick={handleLogout} className="nav-link logout-btn">
                <FiLogOut /> Logout
            </button>
        </nav>
    );
};

export default Navbar;
