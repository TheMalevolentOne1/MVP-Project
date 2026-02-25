/*
Brief: Show toast notifications only if user has enabled them.
This should be used instead of calling toast directly throughout the app.

@Param1: message - The toast message to display.
@Param2: type - The toast type: 'success', 'error', 'loading', 'custom' (default: 'custom').
@Param3: options - Optional react-hot-toast options (duration, position, etc).

@ReturnT: Toast is shown if notifications_enabled is true in localStorage.
@ReturnF: Toast is silently suppressed if notifications_enabled is false.
*/

import toast from 'react-hot-toast';

export const showToast = (message, type = 'custom', options = {}) => {
    // Check if notifications are enabled
    const notificationsEnabled = localStorage.getItem('notifications_enabled');
    const isEnabled = notificationsEnabled !== null ? JSON.parse(notificationsEnabled) : true;

    // Only show toast if notifications are enabled
    if (!isEnabled) {
        return;
    }

    // Show appropriate toast type
    switch (type) {
        case 'success':
            toast.success(message, options);
            break;
        case 'error':
            toast.error(message, options);
            break;
        case 'loading':
            toast.loading(message, options);
            break;
        case 'custom':
        default:
            toast(message, options);
            break;
    }
};