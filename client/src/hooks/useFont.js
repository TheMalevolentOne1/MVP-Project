import { useState, useEffect } from 'react';
import WebFont from 'webfontloader';

/*
Brief: Load Google Fonts.

@Param1: fontFamilies - An array of font family names to load from Google Fonts.

@Return: Object
@ReturnT: An object containing the loading state of the fonts (isLoading).
@ReturnF: Returns an object with isLoading set to true while fonts are loading, and false once loaded or if there was an error.
*/
export const useFont = (fontFamilies) => 
{
    const [isLoading, setIsLoading] = useState(true);
    const [loadedFonts, setLoadedFonts] = useState([]);
    
    useEffect(() => 
    {
        WebFont.load(
        {
            google: 
            { 
                families: fontFamilies
            },
            active: () => setIsLoading(false),
            inactive: () => setIsLoading(false) // Handle font load failure
        });
    }, [fontFamilies]);

    return { isLoading };
};