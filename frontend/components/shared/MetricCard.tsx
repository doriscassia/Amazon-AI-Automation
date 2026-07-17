import React from 'react';
import { MetricData } from '../../types/ui';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
    metric: MetricData;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
    const isPositive = metric.trend && metric.trend > 0;
    const isNegative = metric.trend && metric.trend < 0;

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col">
            <span className="text-sm font-medium text-slate-500 mb-2">{metric.label}</span>
            <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-slate-800">{metric.value}</span>
                {metric.trend !== undefined && (
                    <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-500'}`}>
                        {isPositive && <TrendingUp size={16} className="mr-1" />}
                        {isNegative && <TrendingDown size={16} className="mr-1" />}
                        <span>{Math.abs(metric.trend)}%</span>
                    </div>
                )}
            </div>
            {metric.trendLabel && (
                <span className="text-xs text-slate-400 mt-2">{metric.trendLabel}</span>
            )}
        </div>
    );
};
