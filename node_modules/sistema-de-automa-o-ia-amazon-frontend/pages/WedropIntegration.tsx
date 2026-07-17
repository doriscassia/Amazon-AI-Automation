import React, { useState, useEffect } from 'react';
import { Card } from '../components/shared/Card';
import { useTranslation } from '../i18n/I18nContext';
import { DependencyInjectionContainer } from '../infrastructure/di/DependencyInjectionContainer';
import { Save, Play, CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Download, Activity } from 'lucide-react';
import { ConnectionState, WedropProduct } from '../infrastructure/services/wedrop/types';

export const WedropIntegration: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [keepConnected, setKeepConnected] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [connectionState, setConnectionState] = useState<ConnectionState>('DISCONNECTED');
    const [logs, setLogs] = useState<string[]>([]);
    const [products, setProducts] = useState<WedropProduct[]>([]);

    const di = DependencyInjectionContainer.getInstance();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const state = await di.wedropProvider.checkConnection();
                setConnectionState(state);
                
                // Load email if available
                const integration = await di.integrationRepo.findByName('WEDROP');
                if (integration && integration.credentials) {
                    setEmail(integration.credentials.email || '');
                    setKeepConnected(integration.credentials.keepConnected ?? true);
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkStatus();
    }, [di]);

    const addLog = (message: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
    };

    const handleLogin = async () => {
        setIsSaving(true);
        addLog('Iniciando login web na Wedrop...');
        
        try {
            await di.wedropProvider.login(email, password, keepConnected);
            setConnectionState('CONNECTED');
            addLog('Login concluído com sucesso. Sessão persistida.');
        } catch (error: any) {
            addLog(`Erro na autenticação: ${error.message}`);
            setConnectionState('DISCONNECTED');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        addLog('Testando conexão com a Wedrop...');
        try {
            const state = await di.wedropProvider.checkConnection();
            setConnectionState(state);
            if (state === 'CONNECTED') {
                addLog('Conexão bem-sucedida! Sessão ativa.');
            } else {
                addLog(`Status da conexão: ${state}`);
            }
        } catch (error: any) {
            addLog(`Erro ao testar conexão: ${error.message}`);
            setConnectionState('DISCONNECTED');
        } finally {
            setIsTesting(false);
        }
    };

    const handleImportProducts = async () => {
        setIsImporting(true);
        addLog('Importando produtos da Wedrop (Página 1)...');
        
        try {
            const response = await di.wedropProvider.getProducts(1, 50);
            setProducts(response.data);
            addLog(`Importação concluída. ${response.data.length} produtos carregados.`);
        } catch (error: any) {
            addLog(`Erro ao importar produtos: ${error.message}`);
        } finally {
            setIsImporting(false);
        }
    };

    const renderStatusIcon = () => {
        switch (connectionState) {
            case 'CONNECTED':
                return <><CheckCircle2 size={18} className="text-emerald-500" /><span className="text-sm text-emerald-600 font-medium">{t('wedrop.status.connected')}</span></>;
            case 'EXPIRED':
                return <><AlertCircle size={18} className="text-amber-500" /><span className="text-sm text-amber-600 font-medium">{t('wedrop.status.expired')}</span></>;
            case 'RECONNECTING':
                return <><RefreshCw size={18} className="text-blue-500 animate-spin" /><span className="text-sm text-blue-600 font-medium">{t('wedrop.status.reconnecting')}</span></>;
            case 'DISCONNECTED':
            default:
                return <><XCircle size={18} className="text-slate-400" /><span className="text-sm text-slate-500 font-medium">{t('wedrop.status.disconnected')}</span></>;
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{t('wedrop.title')}</h1>
                <p className="text-slate-500 mt-1">{t('wedrop.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration Form */}
                <Card title={t('wedrop.config.title')} className="lg:col-span-1">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('wedrop.config.email')}
                            </label>
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('wedrop.config.password')}
                            </label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="••••••••••••••••"
                            />
                        </div>
                        
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="keepConnected"
                                checked={keepConnected}
                                onChange={(e) => setKeepConnected(e.target.checked)}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                            />
                            <label htmlFor="keepConnected" className="ml-2 block text-sm text-slate-700">
                                {t('wedrop.config.keepConnected')}
                            </label>
                        </div>
                        
                        <div className="pt-2 flex flex-col space-y-3">
                            <div className="flex items-center space-x-2">
                                {renderStatusIcon()}
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={handleLogin}
                                    disabled={isSaving || !email || !password}
                                    className="flex-1 flex justify-center items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                    {isSaving ? t('wedrop.config.loggingIn') : t('wedrop.config.loginBtn')}
                                </button>
                                <button 
                                    onClick={handleTestConnection}
                                    disabled={isTesting}
                                    className="flex-1 flex justify-center items-center px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-300"
                                >
                                    {isTesting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Activity size={16} className="mr-2" />}
                                    {isTesting ? t('wedrop.config.testing') : t('wedrop.config.testConnection')}
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Sync Control */}
                <Card title={t('wedrop.sync.title')} className="lg:col-span-2">
                    <div className="flex flex-col h-full justify-between">
                        <p className="text-slate-600 text-sm mb-6">
                            {t('wedrop.sync.description')}
                        </p>
                        
                        <div className="flex justify-end space-x-4">
                            <button 
                                onClick={handleImportProducts}
                                disabled={isImporting || connectionState !== 'CONNECTED'}
                                className="flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isImporting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Download size={18} className="mr-2" />}
                                {isImporting ? t('wedrop.sync.importing') : t('wedrop.sync.import')}
                            </button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Products Table */}
            <Card title={t('wedrop.table.title')} className="flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('wedrop.table.sku')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('wedrop.table.name')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('wedrop.table.category')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('wedrop.table.price')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('wedrop.table.stock')}</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('wedrop.table.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">
                                        {t('wedrop.table.empty')}
                                    </td>
                                </tr>
                            ) : (
                                products.map((product, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{product.sku}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs" title={product.title}>{product.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{product.stock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                                {product.isPublished ? t('wedrop.table.published') : t('wedrop.table.unpublished')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Logs Console */}
            <Card title={t('wedrop.logs.title')} className="flex-1 flex flex-col min-h-[200px] mt-6">
                <div className="flex-1 bg-slate-950 rounded-md p-4 overflow-y-auto font-mono text-sm text-slate-300 custom-scrollbar">
                    {logs.length === 0 ? (
                        <span className="text-slate-600">{t('wedrop.logs.empty')}</span>
                    ) : (
                        logs.map((log, idx) => (
                            <div key={idx} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </Card>
        </div>
    );
};
