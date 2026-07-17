import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../../constants/navigation';
import { Box } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export const Sidebar: React.FC = () => {
    const { t } = useTranslation();

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full transition-all duration-300">
            <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
                <Box className="text-indigo-500 mr-3" size={24} />
                <span className="text-lg font-bold text-white tracking-tight">AI AutoSys</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                <nav className="space-y-1 px-3">
                    {NAVIGATION_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                                    isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'hover:bg-slate-800 hover:text-white'
                                }`
                            }
                        >
                            <span className="mr-3">{item.icon}</span>
                            {t(item.title)}
                        </NavLink>
                    ))}
                </nav>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                        AD
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-white">{t('sidebar.adminUser')}</p>
                        <p className="text-xs text-slate-400">{t('sidebar.architect')}</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
