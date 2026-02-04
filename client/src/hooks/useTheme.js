import { useState, useEffect } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState(() => {
        // Check localStorage first
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'auto' || !savedTheme) {
            // Use system preference for auto or default
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }
        
        return savedTheme;
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        // Listen for system theme changes when in auto mode
        const savedTheme = localStorage.getItem('theme');
        
        if (savedTheme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleChange = (e) => {
                setTheme(e.matches ? 'dark' : 'light');
            };
            
            // Set initial value
            setTheme(mediaQuery.matches ? 'dark' : 'light');
            
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    const changeTheme = (newTheme) => 
    {
        // Always store the preference (including 'auto')
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'auto') 
        {
            // Apply current system preference immediately
            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isDark ? 'dark' : 'light');
        } else {
            setTheme(newTheme);
        }
    };

    // Get the actual preference (light/dark/auto) vs applied theme
    const getThemePreference = () => {
        return localStorage.getItem('theme') || 'light';
    };

    return { theme, changeTheme, getThemePreference };
};