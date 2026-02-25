import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../showToast';
import { authAPI, settingsAPI } from '../apiHandler'; 
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import AppHeader from '../components/AppHeader';
import Navbar from '../components/Navbar';
import DeleteAccountModal from '../components/DeleteAccountModal';
import './SettingsPage.css';

/*const FONT_OPTIONS = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Trebuchet MS',
    'Palatino',
    'Garamond'
];*/

/*
Brief: Settings page component for managing user preferences including theme, notifications, timezone, and account settings.

@Returns: JSX.Element
@ReturnT: Renders the settings page with all preference controls.
*/
const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { changeTheme, getThemePreference } = useTheme();
    
    const [settings, setSettings] = useState(() => ({
        theme: localStorage.getItem('theme') || 'light',
        notifications_enabled: localStorage.getItem('notifications_enabled') ? localStorage.getItem('notifications_enabled') : true,
        email_notifications: localStorage.getItem('email_notifications') ? localStorage.getItem('email_notifications') : false,
        timezone: 'UTC',
        time_format: '24h',
        date_format: 'DD/MM/YYYY',
        font_choice: localStorage.getItem('font_choice') || 'Default',
        university_email: user?.email || ''
    }));

    const [initialSettings, setInitialSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Derived — true when current settings differ from last saved state
    const hasUpdatedSettings = initialSettings ? JSON.stringify(settings) !== JSON.stringify(initialSettings) : false;

    /*
    Brief: Fetch user settings from the API and populate the settings state.
    
    @ReturnT: Settings are loaded and state is updated.
    */
    const fetchSettings = useCallback(async () => {
        try {
            const { data } = await settingsAPI.get();

            if (data.success) {
                const currentTheme = getThemePreference();
                
                const loaded = { ...data.settings, theme: currentTheme };
                setSettings(loaded);
                setInitialSettings(loaded); // Snapshot for unsaved changes tracking
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            const currentTheme = getThemePreference();
            setSettings(prev => ({ ...prev, theme: currentTheme }));
        } finally {
            setLoading(false);
        }
    }, [getThemePreference]);

    /*
    Brief: Load settings on component mount.
    */
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    /*
    Brief: Handle individual setting changes and apply theme immediately if theme is changed.
    
    @Param1: field - The setting field key to update.
    @Param2: value - The new value for the field.
    */
    const handleChange = useCallback((field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        
        if (field === 'theme') {
            changeTheme(value);
        }
    }, [changeTheme]);

    /*
    Brief: Save all settings to the API and persist locally (font choice, notifications).
    
    @ReturnT: Settings are persisted to backend and toast notification is shown.
    @ReturnF: Error toast is shown if save fails.
    */
    const handleSave = useCallback(async () => {
        try {
            changeTheme(settings.theme);
            
            const filteredSettings = {
                theme: settings.theme,
                notifications_enabled: settings.notifications_enabled,
                email_notifications: settings.email_notifications,
                timezone: settings.timezone,
                time_format: settings.time_format,
                date_format: settings.date_format,
                font_choice: settings.font_choice,
                university_email: settings.university_email
            };
            
            const { data } = await settingsAPI.update(filteredSettings);
            
            if (data.success) {
                // Persist local settings to localStorage
                localStorage.setItem('font_choice', settings.font_choice);
                localStorage.setItem('notifications_enabled', JSON.stringify(settings.notifications_enabled));
                localStorage.setItem('email_notifications', JSON.stringify(settings.email_notifications));

                // Reset initial settings to match current settings (clears unsaved indicator)
                setInitialSettings({ ...settings });
                showToast('Settings saved!', 'success');
            } else {
                showToast(data.error || 'Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            
            if (error.response?.status === 401) {
                showToast('Session expired. Please log in again.', 'error');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                showToast(error.response?.data?.error || 'Error saving settings', 'error');
            }
        }
    }, [settings, changeTheme, navigate]);

    /*
    Brief: Show the delete account confirmation modal.
    */
    const handleDeleteAccount = useCallback(() => {
        setShowDeleteModal(true);
    }, []);

    /*
    Brief: Confirm and execute account deletion from the API, then redirect to home.
    
    @ReturnT: Account is deleted and user is logged out.
    @ReturnF: Error toast is shown if deletion fails.
    */
    const confirmDeleteAccount = useCallback(async () => {
        try {
            const { data } = await authAPI.deleteAccount();
            if (data.success) {
                showToast('Account deleted', 'success');
                await logout();
                navigate('/');
            } else {
                showToast('Failed to delete account: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('An error occurred while deleting your account.', 'error');
        }
    }, [logout, navigate]);

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
                                value={settings.theme}
                                onChange={(e) => handleChange('theme', e.target.value)}
                            >
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="auto">Auto (System)</option>
                            </select>
                        </div>
                    </section>

                    {/* Font
                    <section className="settings-section">
                        <h2>Font</h2>
                        <div className="setting-item">
                            <label htmlFor="font">Font</label>
                            <select
                                id="font"
                                value={settings.font_choice || 'Default'}
                                onChange={(e) => handleChange('font_choice', e.target.value)}
                            >
                                <option value="Default">Default</option>
                                {FONT_OPTIONS.map(font => (
                                    <option key={font} value={font} style={{ fontFamily: font }}>
                                        {font}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </section>
                    */}

                    {/* Notifications */}
                    <section className="settings-section">
                        <h2>Notifications</h2>
                        <div className="setting-item">
                            <label htmlFor="notifications_enabled">
                                <input
                                    type="checkbox"
                                    id="notifications_enabled"
                                    checked={settings.notifications_enabled || false}
                                    onChange={(e) => handleChange('notifications_enabled', e.target.checked)}
                                />
                                {' '}Enable In-App Notifications (Toast Messages)
                            </label>
                        </div>
                        <div className="setting-item">
                            <label htmlFor="email_notifications">
                                <input
                                    type="checkbox"
                                    id="email_notifications"
                                    checked={settings.email_notifications || false}
                                    onChange={(e) => handleChange('email_notifications', e.target.checked)}
                                />
                                {' '}Enable Email Notifications
                            </label>
                        </div>
                    </section>

                    {/* Timezone
                    <section className="settings-section">
                        <h2>Timezone</h2>
                        <div className="setting-item">
                            <label htmlFor="timezone">Timezone</label>
                            <select
                                id="timezone"
                                value={settings.timezone || 'UTC'}
                                onChange={(e) => handleChange('timezone', e.target.value)}
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="America/Anchorage">Alaska Time (AKT)</option>
                                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                                <option value="Europe/London">London (GMT/BST)</option>
                                <option value="Europe/Paris">Paris (CET/CEST)</option>
                                <option value="Europe/Berlin">Berlin (CET/CEST)</option>
                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                                <option value="Asia/Shanghai">Shanghai (CST)</option>
                                <option value="Asia/Dubai">Dubai (GST)</option>
                                <option value="Australia/Sydney">Sydney (AEDT/AEST)</option>
                            </select>
                        </div>
                    </section>
                    */}

                    {/* University Email */}
                    <section className="settings-section">
                        <h2>University Email</h2>
                        <div className="setting-item">
                            <label htmlFor="university_email">Email</label>
                            <input
                                type="email"
                                id="university_email"
                                value={settings.university_email || ''}
                                onChange={(e) => handleChange('university_email', e.target.value)}
                                placeholder="your.email@university.edu"
                            />
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
                        {hasUpdatedSettings && (
                            <div className="unsaved-indicator">⚠️ Unsaved changes</div>
                        )}
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