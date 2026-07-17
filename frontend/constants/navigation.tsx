import React from 'react';
import { 
    LayoutDashboard, 
    ListOrdered, 
    PackageSearch, 
    Bot, 
    CircleDollarSign, 
    Image as ImageIcon, 
    ShoppingCart, 
    FileBox, 
    Settings2, 
    Activity, 
    ScrollText, 
    BarChart3,
    ShieldCheck
} from 'lucide-react';
import { NavItem } from '../types/ui';

export const NAVIGATION_ITEMS: NavItem[] = [
    { title: 'nav.dashboard', path: '/', icon: <LayoutDashboard size={20} />, moduleName: 'nav.dashboard' },
    { title: 'nav.queue', path: '/queue', icon: <ListOrdered size={20} />, moduleName: 'nav.queue' },
    { title: 'nav.wedrop', path: '/wedrop', icon: <PackageSearch size={20} />, moduleName: 'nav.wedrop' },
    { title: 'nav.aiListing', path: '/ai-listing', icon: <Bot size={20} />, moduleName: 'nav.aiListing' },
    { title: 'nav.pricing', path: '/pricing', icon: <CircleDollarSign size={20} />, moduleName: 'nav.pricing' },
    { title: 'nav.images', path: '/images', icon: <ImageIcon size={20} />, moduleName: 'nav.images' },
    { title: 'nav.amazon', path: '/amazon', icon: <ShoppingCart size={20} />, moduleName: 'nav.amazon' },
    { title: 'nav.bling', path: '/bling', icon: <FileBox size={20} />, moduleName: 'nav.bling' },
    { title: 'nav.automation', path: '/automation', icon: <Settings2 size={20} />, moduleName: 'nav.automation' },
    { title: 'nav.monitoring', path: '/monitoring', icon: <Activity size={20} />, moduleName: 'nav.monitoring' },
    { title: 'nav.logs', path: '/logs', icon: <ScrollText size={20} />, moduleName: 'nav.logs' },
    { title: 'nav.reports', path: '/reports', icon: <BarChart3 size={20} />, moduleName: 'nav.reports' },
    { title: 'nav.settings', path: '/settings', icon: <ShieldCheck size={20} />, moduleName: 'nav.settings' },
];
