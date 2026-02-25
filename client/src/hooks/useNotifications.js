import { useState, useCallback } from 'react';

/*
Brief: Custom hook to manage notification preferences (in-app toasts) with persistence in localStorage.

@Returns: Object
@ReturnT: An object containing notifications_enabled state, setter function, and checker function.
*/
export const useNotifications = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
        const saved = localStorage.getItem('notifications_enabled');
        // Default to true if not set
        return saved !== null ? JSON.parse(saved) : true;
    });

    /*
    Brief: Update notifications setting and persist to localStorage.
    
    @Param1: enabled - Boolean to enable/disable notifications.
    */
    const updateNotifications = useCallback((enabled) => {
        setNotificationsEnabled(enabled);
        localStorage.setItem('notifications_enabled', JSON.stringify(enabled));
    }, []);

    /*
    Brief: Check if notifications are currently enabled.
    
    @Returns: Boolean
    @ReturnT: True if notifications are enabled, false otherwise.
    */
    const areNotificationsEnabled = useCallback(() => {
        const saved = localStorage.getItem('notifications_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    }, []);

    return { 
        notificationsEnabled, 
        updateNotifications, 
        areNotificationsEnabled 
    };
};