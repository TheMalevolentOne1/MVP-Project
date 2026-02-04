import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, settingsAPI } from '../apiHandler';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
import DeleteAccountModal from '../components/DeleteAccountModal';
import './SettingsPage.css';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { changeTheme, getThemePreference } = useTheme();
    const [settings, setSettings] = useState(() => ({
        theme: localStorage.getItem('theme') || 'light',
        time_format: '12h',
        date_format: 'MM/DD/YYYY'
    }));
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchSettings = useCallback(async () => {
        try {
            const { data } = await settingsAPI.get();
            if (data.success) {
                // Get current theme preference (light/dark/auto) from localStorage
                const currentTheme = getThemePreference();
                setSettings({
                    ...data.settings,
                    theme: currentTheme
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            // Set defaults with current theme if fetch fails
            const currentTheme = getThemePreference();
            setSettings(prev => ({ ...prev, theme: currentTheme }));
        } finally {
            setLoading(false);
        }
    }, [getThemePreference]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleChange = (field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        
        // Apply theme change immediately
        if (field === 'theme') {
            changeTheme(value);
        }
    };

    const handleSave = async () => {
        try {
            // Update theme context first
            changeTheme(settings.theme);
            
            // Filter out unsupported fields before sending to backend
            const filteredSettings = {
                theme: settings.theme,
                notifications_enabled: settings.notifications_enabled,
                time_format: settings.time_format,
                date_format: settings.date_format
            };
            
            // Save to backend
            const { data } = await settingsAPI.update(filteredSettings);
            if (data.success) {
                toast.success('Settings saved!');
            } else {
                toast.error(data.error || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please log in again.');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                toast.error(error.response?.data?.error || 'Error saving settings');
            }
        }
    };

    const handleDeleteAccount = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteAccount = async () => {
        try {
            const { data } = await authAPI.deleteAccount();
            if (data.success) {
                toast.success('Account deleted');
                await logout();
                navigate('/');
            } else {
                toast.error('Failed to delete account: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('An error occurred while deleting your account.');
        }
    };

    if (loading) {
        return (
            <div className="settings-page">
                <AppHeader title="Settings" />
                <Navbar />
                <div className="settings-loading">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <AppHeader title="Settings" />
            <Navbar />

            <main className="settings-main">
                <div className="settings-container">
                    {/* Appearance Settings */}
                    <section className="settings-section">
                        <h2>Appearance</h2>
                        <div className="setting-item">
                            <label htmlFor="theme">Theme</label>
                            <select
                                id="theme"
                                value={getThemePreference()}
                                onChange={(e) => handleChange('theme', e.target.value)}
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="auto">Auto (System)</option>
                            </select>
                        </div>
                    </section>

                    {/* Time & Date Format */}
                    <section className="settings-section">
                        <h2>Time & Date Format</h2>
                        <div className="setting-item">
                            <label htmlFor="time_format">Time Format</label>
                            <select
                                id="time_format"
                                value={settings.time_format}
                                onChange={(e) => handleChange('time_format', e.target.value)}
                            >
                                <option value="12h">12 Hour (3:00 PM)</option>
                                <option value="24h">24 Hour (15:00)</option>
                            </select>
                        </div>

                        <div className="setting-item">
                            <label htmlFor="date_format">Date Format</label>
                            <select
                                id="date_format"
                                value={settings.date_format}
                                onChange={(e) => handleChange('date_format', e.target.value)}
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY (UK)</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                            </select>
                        </div>
                    </section>

                    {/* Save Button */}
                    <div className="settings-actions">
                        <button onClick={handleSave} className="save-btn">
                            Save Settings
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <section className="settings-section danger-zone">
                        <h2>Danger Zone</h2>
                        <div className="danger-item">
                            <div className="danger-info">
                                <h3>Delete Account</h3>
                                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                            </div>
                            <button onClick={handleDeleteAccount} className="delete-account-btn">
                                Delete Account
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            <DeleteAccountModal
                isOpen={showDeleteModal}
                onConfirm={confirmDeleteAccount}
                onCancel={() => setShowDeleteModal(false)}
                userEmail={user?.email}
            />
        </div>
    );
};

export default SettingsPage;
