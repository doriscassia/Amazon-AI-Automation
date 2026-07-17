import { ReactNode } from 'react';

export interface NavItem {
    title: string;
    path: string;
    icon: ReactNode;
    moduleName: string;
}

export interface MetricData {
    label: string;
    value: string | number;
    trend?: number;
    trendLabel?: string;
}
