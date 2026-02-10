import { useState, useEffect } from 'react';

/*
Brief: Handle user login by calling the login API and updating the user state on success.
@Param1: email - The user's email for login.
@Param2: password - The user's password for login.

@Return: Boolean
@ReturnT: True if login is successful, otherwise throws an error.
@ReturnF: Returns false if login fails.
*/

/*
Brief: Custom hook to manage theme (light/dark/auto) with persistence in localStorage and system preference support.

@Return: Object
@ReturnT: An object containing the current theme, a function to change the theme, and a function to get the stored theme preference.
*/
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

    /*
    Brief: Change the theme and store the preference in localStorage. If
    the new theme is 'auto', it applies the current system preference immediately.
    
    @Param1: newTheme - The new theme to apply ('light', 'dark', or 'auto').
    */
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

    /*
    Brief: Get the actual preference (light/dark/auto) vs applied theme

    @Return: String
    @ReturnT: The stored theme preference ('light', 'dark', or 'auto').
    */
    const getThemePreference = () => {
        return localStorage.getItem('theme') || 'light';
    };

    return { theme, changeTheme, getThemePreference };
};