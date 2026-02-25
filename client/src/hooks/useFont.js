import { useState, useEffect } from 'react';
import WebFont from 'webfontloader';

/*
Brief: Custom hook to load and manage Google Fonts in the application.

@Param1: fontFamily - The name of the Google Font family to load (e.g., 'Roboto', 'Open Sans').

@Return: Object
@ReturnT: A resolved promise with the list of loaded font families if successful
@ReturnF: An error if font loading fails.
*/
export const getAllFonts = async () =>
{
    return new Promise((res, rej) =>
    {
        WebFont.load(
        {
            google: 
            { 
                families: ['sans-serif', 'serif', 'monospace'] // default fonts to ensure we get some results
            },
            active: () => res(WebFont.getActiveFamilies()), // resolve with the list of loaded font families
            inactive: () => rej(new Error('Failed to load fonts')) // reject if loading fails
        });
    });
}

/*
Brief: useFont, custom hook that loads a specified Google Font and manages its loading state.

@Param1: fontFamily - The name of the Google Font family to load (e.g., 'Roboto', 'Open Sans').

@Return: Object
@ReturnT: An object containing isLoading, isError, and applyFont function to manage font loading and application.
@ReturnF: An error if font loading fails.
*/
export const useFont = (fontFamily) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        if (!fontFamily || fontFamily === 'Default') {
            setIsLoading(false);
            setIsError(false);
            return;
        }
        setIsLoading(true);
        setIsError(false);
        WebFont.load({
            google: {
                families: [fontFamily]
            },
            active: () => setIsLoading(false),
            inactive: () => {
                setIsLoading(false);
                setIsError(true);
            }
        });
    }, [fontFamily]);

    // Helper to apply the font to the document body
    const applyFont = () => {
        if (!fontFamily || fontFamily === 'Default') {
            document.body.style.fontFamily = '';
        } else {
            document.body.style.fontFamily = fontFamily + ', sans-serif';
        }
    };

    return { isLoading, isError, applyFont };
};