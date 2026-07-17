import React from 'react';
import { Bell, Search, Menu } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export const Header: React.FC = () => {
    const { t } = useTranslation();

    return (
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center">
                <button className="text-slate-500 hover:text-slate-700 mr-4 lg:hidden">
                    <Menu size={20} />
                </button>
                <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder={t('header.searchPlaceholder')} 
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64 transition-all"
                    />
                </div>
            </div>
            
            <div className="flex items-center space-x-4">
                <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="h-8 w-px bg-slate-200"></div>
                <div className="text-sm font-medium text-slate-700">
                    {t('header.version')}
                </div>
            </div>
        </header>
    );
};
