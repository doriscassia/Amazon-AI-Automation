import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { GenericModule } from './pages/GenericModule';
import { WedropIntegration } from './pages/WedropIntegration';
import { NAVIGATION_ITEMS } from './constants/navigation';
import { useTranslation } from './i18n/I18nContext';

const App: React.FC = () => {
    const { t } = useTranslation();

    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<MainLayout />}>
                    {/* Explicitly defined complex modules */}
                    <Route index element={<Dashboard />} />
                    <Route path="wedrop" element={<WedropIntegration />} />
                    
                    {/* Dynamically generate routes for other modules based on navigation config to ensure all requested modules exist structurally */}
                    {NAVIGATION_ITEMS.filter(item => item.path !== '/' && item.path !== '/wedrop').map((item) => (
                        <Route 
                            key={item.path} 
                            path={item.path.replace('/', '')} 
                            element={<GenericModule title={item.moduleName} />} 
                        />
                    ))}
                    
                    {/* Fallback route */}
                    <Route path="*" element={
                        <div className="flex items-center justify-center h-full">
                            <h2 className="text-xl text-slate-500">{t('app.moduleNotFound')}</h2>
                        </div>
                    } />
                </Route>
            </Routes>
        </HashRouter>
    );
};

export default App;
