import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ptBR } from './locales/pt-BR';

export type Language = 'pt-BR';
export type TranslationKeys = keyof typeof ptBR;

interface I18nContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKeys | string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, typeof ptBR> = {
    'pt-BR': ptBR
};

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>('pt-BR');

    const t = (key: TranslationKeys | string, params?: Record<string, string | number>): string => {
        const dict = translations[language] as Record<string, string>;
        let text = dict[key] || key;
        
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
            });
        }
        
        return text;
    };

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error('useTranslation must be used within an I18nProvider');
    }
    return context;
};
