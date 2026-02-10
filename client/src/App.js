import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './App.css';

// Page imports
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import NotesPage from './pages/NotesPage';
import CalendarPage from './pages/CalendarPage';
import SettingsPage from './pages/SettingsPage';

// Protected Route wrapper
const MemberRoute = ({ children }) => 
{
    const { user, loading } = useAuth();

    if (loading)
    {
        return <div>Loading...</div>;
    }

    return user ? children : <Navigate to="/login" />; // Redirect to login if not authenticated
};

// Public Route (redirect if already logged in)
const PublicRoute = ({ children }) => 
{
    const { user, loading } = useAuth();

    if (loading)
    {
        return <div>Loading...</div>;
    }

    return !user ? children : <Navigate to="/dashboard" />; // Redirect to dashboard if already authenticated
};

const App = () => 
{
    return (
        <BrowserRouter>
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#333',
                        color: '#fff',
                    },
                    success: {
                        iconTheme: {
                            primary: '#10B981',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
                <AuthProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                        
                        {/* Member Routes */}
                        <Route path="/dashboard" element={<MemberRoute><Dashboard /></MemberRoute>} />
                        <Route path="/notes" element={<MemberRoute><NotesPage /></MemberRoute>} />
                        <Route path="/calendar" element={<MemberRoute><CalendarPage /></MemberRoute>} />
                        <Route path="/settings" element={<MemberRoute><SettingsPage /></MemberRoute>} />
                    </Routes>
                </AuthProvider>
        </BrowserRouter>
    );
}

export default App;