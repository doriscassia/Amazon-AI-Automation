import React from 'react';
import { MetricCard } from '../components/shared/MetricCard';
import { Card } from '../components/shared/Card';
import { Activity, AlertCircle, CircleCheck, Clock } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export const Dashboard: React.FC = () => {
    const { t } = useTranslation();

    // Mock data for architectural demonstration
    const metrics = [
        { label: t('dashboard.metrics.processed'), value: '1,248', trend: 12.5, trendLabel: t('dashboard.metrics.processedTrend') },
        { label: t('dashboard.metrics.active'), value: '8,432', trend: 3.2, trendLabel: t('dashboard.metrics.activeTrend') },
        { label: t('dashboard.metrics.pending'), value: '156', trend: -5.4, trendLabel: t('dashboard.metrics.pendingTrend') },
        { label: t('dashboard.metrics.aiSuccess'), value: '98.2%', trend: 0.5, trendLabel: t('dashboard.metrics.aiSuccessTrend') },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('dashboard.title')}</h1>
                <p className="text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
            </div>

            {/* Metrics Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map((metric, idx) => (
                    <MetricCard key={idx} metric={metric} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Processing Area Stub */}
                <Card title={t('dashboard.pipelines.title')} className="lg:col-span-2">
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50/50">
                                <div className="flex items-center space-x-4">
                                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-md">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-800">{t('dashboard.pipelines.batch', { id: 1000 + i })}</p>
                                        <p className="text-xs text-slate-500">{t('dashboard.pipelines.processing')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.random() * 100}%` }}></div>
                                    </div>
                                    <span className="text-xs font-medium text-slate-600 w-8 text-right">
                                        {Math.floor(Math.random() * 100)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* System Health / Monitoring Stub */}
                <Card title={t('dashboard.health.title')}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CircleCheck size={18} className="text-emerald-500" />
                                <span className="text-sm font-medium text-slate-700">{t('dashboard.health.amazon')}</span>
                            </div>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">{t('dashboard.health.operational')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CircleCheck size={18} className="text-emerald-500" />
                                <span className="text-sm font-medium text-slate-700">{t('dashboard.health.vertex')}</span>
                            </div>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">{t('dashboard.health.operational')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                <span className="text-sm font-medium text-slate-700">{t('dashboard.health.wedrop')}</span>
                            </div>
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full font-medium">{t('dashboard.health.delayed')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CircleCheck size={18} className="text-emerald-500" />
                                <span className="text-sm font-medium text-slate-700">{t('dashboard.health.bling')}</span>
                            </div>
                            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">{t('dashboard.health.operational')}</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Logs Area Stub */}
            <Card title={t('dashboard.logs.title')}>
                <div className="space-y-3">
                    {[
                        { time: '10:42:05', level: 'INFO', msg: t('dashboard.logs.msg1'), icon: <CircleCheck size={14} className="text-emerald-500"/> },
                        { time: '10:41:12', level: 'WARN', msg: t('dashboard.logs.msg2'), icon: <AlertCircle size={14} className="text-amber-500"/> },
                        { time: '10:39:55', level: 'INFO', msg: t('dashboard.logs.msg3'), icon: <CircleCheck size={14} className="text-emerald-500"/> },
                        { time: '10:35:20', level: 'INFO', msg: t('dashboard.logs.msg4'), icon: <Clock size={14} className="text-blue-500"/> },
                    ].map((log, i) => (
                        <div key={i} className="flex items-start space-x-3 text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-slate-400 font-mono text-xs mt-0.5">{log.time}</span>
                            <div className="mt-0.5">{log.icon}</div>
                            <span className="text-slate-700">{log.msg}</span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
};
