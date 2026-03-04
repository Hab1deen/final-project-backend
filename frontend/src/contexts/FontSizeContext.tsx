import React, { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 'small' | 'medium' | 'large';

interface FontSizeContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [fontSize, setFontSizeState] = useState<FontSize>(() => {
        const savedSize = localStorage.getItem('fontSize');
        return (savedSize as FontSize) || 'medium';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('font-small', 'font-medium', 'font-large');
        root.classList.add(`font-${fontSize}`);
        localStorage.setItem('fontSize', fontSize);
    }, [fontSize]);

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
    };

    return (
        <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </FontSizeContext.Provider>
    );
};

export const useFontSize = () => {
    const context = useContext(FontSizeContext);
    if (context === undefined) {
        throw new Error('useFontSize must be used within a FontSizeProvider');
    }
    return context;
};
