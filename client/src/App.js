import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
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
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

// Public Route (redirect if already logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    return !user ? children : <Navigate to="/dashboard" />;
};

function App() {
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
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                        
                        {/* Protected Routes */}
                        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/notes" element={<ProtectedRoute><NotesPage /></ProtectedRoute>} />
                        <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}

export default App;