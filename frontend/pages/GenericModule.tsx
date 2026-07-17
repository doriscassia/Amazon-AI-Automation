import React from 'react';
import { Card } from '../components/shared/Card';
import { Settings2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

interface GenericModuleProps {
    title: string;
    description?: string;
}

export const GenericModule: React.FC<GenericModuleProps> = ({ title, description }) => {
    const { t } = useTranslation();
    const translatedTitle = t(title);

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{translatedTitle}</h1>
                <p className="text-slate-500 mt-1">
                    {description ? t(description) : t('generic.description', { title: translatedTitle })}
                </p>
            </div>

            <Card className="flex-1 flex flex-col items-center justify-center text-center p-12 border-dashed border-2 border-slate-200 bg-slate-50/50">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                    <Settings2 size={32} />
                </div>
                <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('generic.readyTitle')}</h2>
                <p className="text-slate-500 max-w-md">
                    {t('generic.readyDesc.part1')} <strong>{translatedTitle}</strong> {t('generic.readyDesc.part2')}
                </p>
                <div className="mt-8 grid grid-cols-3 gap-4 text-sm text-slate-400">
                    <div className="px-4 py-2 bg-white rounded border border-slate-100 shadow-sm">{t('generic.layer.presentation')}</div>
                    <div className="px-4 py-2 bg-white rounded border border-slate-100 shadow-sm">{t('generic.layer.application')}</div>
                    <div className="px-4 py-2 bg-white rounded border border-slate-100 shadow-sm">{t('generic.layer.domain')}</div>
                </div>
            </Card>
        </div>
    );
};
