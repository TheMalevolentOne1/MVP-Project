import { useState, useEffect, useCallback } from 'react';

/*
Brief: useTheme, custom hook to manage theme preferences (light/dark/auto) with persistence in localStorage and system preference detection.

@Return: Object
@ReturnT: An object containing the current theme, a function to change the theme, and a function to get the current theme preference.
@ReturnF: An error if theme loading fails.
*/
export const useTheme = () => {
    /* 
    Brief: Initialize theme state by checking localStorage for saved preference, falling back to system preference if set to 'auto' or not set.
    @Return: String
    @ReturnT: The current theme ('light', 'dark', or 'auto').
    */
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'auto' || !savedTheme) {
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
            return 'light';
        }
        return savedTheme;
    });

    /*
    Brief: Effect to apply the current theme by setting a data attribute on the document element, allowing CSS to target it for theming.
    */
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    /*
    Brief: Effect to listen for system theme changes when 'auto' is selected, updating the theme accordingly.
    */
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                setTheme(e.matches ? 'dark' : 'light');
            };
            setTheme(mediaQuery.matches ? 'dark' : 'light');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, []);

    /*
    Brief: Function to change the theme preference, saving it to localStorage and updating the theme state. If 'auto' is selected, it will set the theme based on system preference.

    @Param1: newTheme - The new theme preference ('light', 'dark', or 'auto').
    */
    const changeTheme = useCallback((newTheme) => {
        localStorage.setItem('theme', newTheme);
        if (newTheme === 'auto') {
            const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            setTheme(isDark ? 'dark' : 'light');
        } else {
            setTheme(newTheme);
        }
    }, []);

    // Brief: Function to retrieve the current theme preference from localStorage, defaulting to 'light' if not set.
    const getThemePreference = useCallback(() => {
        return localStorage.getItem('theme') || 'light';
    }, []);

    return { theme, changeTheme, getThemePreference };
};