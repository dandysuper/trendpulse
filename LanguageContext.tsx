import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ru, en, Translations } from './locales';

export type Language = 'ru' | 'en';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
    lang: 'ru',
    setLang: () => { },
    t: ru,
});

const translations: Record<Language, Translations> = { ru, en };

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>(() => {
        const stored = localStorage.getItem('trendpulse_lang');
        return (stored === 'en' ? 'en' : 'ru') as Language;
    });

    const setLang = (newLang: Language) => {
        setLangState(newLang);
        localStorage.setItem('trendpulse_lang', newLang);
    };

    const t = translations[lang];

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
