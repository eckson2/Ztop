import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, Zap, Globe, FileText, Settings, Copy, Key, Lock } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

const AutoTest = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const [config, setConfig] = useState({
        isEnabled: false,
        panelType: 'sigma',
        apiUrl: '',
        pfastToken: '',
        pfastSecret: '',
        nameField: 'Tops',
        m3uLink: '',
        appName: '',
        customPaymentUrl: '',
        templateFields: {
            username: true,
            password: true,
            dns: true,
            plano: true,
            vencimento: true,
            pagamento: true,
            m3uLink: false,
            appName: false,
            customPaymentUrl: false
        },
        generatedCount: 0,
        failedCount: 0
    });

    const webhookUrl = `${window.location.protocol}//${window.location.hostname.replace('painel', 'back')}/api/fulfillment/${user?.id || 'ID_DO_USUARIO'}`;
    // Fallback if hostname is weird in dev
    const displayWebhookUrl = user ? `https://back.ztop.dev.br/api/fulfillment/${user.id}` : 'Carregando...';

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data } = await api.get('/autotest');
            if (data) {
                // Parse templateFields if string
                let fields = data.templateFields;
                if (typeof fields === 'string') {
                    try { fields = JSON.parse(fields); } catch (e) { fields = {}; }
                }

                setConfig(prev => ({
                    ...prev,
                    ...data,
                    templateFields: {
                        ...prev.templateFields,
                        ...fields
                    }
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar configuração:', error);
            showToast('error', 'Erro ao carregar dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.post('/autotest', config);
            showToast('success', 'Configuração salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showToast('error', 'Erro ao salvar configuração.');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(displayWebhookUrl);
        showToast('success', 'URL copiada!');
    };

    if (loading) {
        return <div className="p-8"><div className="animate-pulse h-96 glass rounded-3xl" /></div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">Teste Automático</h1>
                <p className="text-slate-400">Configure a integração para geração de testes automáticos.</p>
            </div>

            {toast && (
                <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg border animate-fade-in z-50 flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' : 'bg-red-500/20 border-red-500/50 text-red-200'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {toast.message}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={64} />
                    </div>
                    <p className="text-slate-400 font-medium mb-2">Testes Gerados</p>
                    <p className="text-4xl font-bold text-emerald-400">{config.generatedCount}</p>
                </div>
                <div className="glass p-6 rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={64} />
                    </div>
                    <p className="text-slate-400 font-medium mb-2">Falhas no Envio</p>
                    <p className="text-4xl font-bold text-red-400">{config.failedCount}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Configuration */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass p-8 rounded-3xl border border-white/5">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Settings className="text-primary-400" size={24} />
                                Configurar Integração
                            </h2>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={config.isEnabled}
                                    onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${config.isEnabled ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                <span className={`ml-3 text-sm font-bold ${config.isEnabled ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {config.isEnabled ? 'ATIVADO' : 'DESATIVADO'}
                                </span>
                            </label>
                        </div>

                        <div className="space-y-6">
                            {/* Panel Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Painel</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {['sigma', 'pfast'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setConfig({ ...config, panelType: type })}
                                            className={`p-3 rounded-xl border-2 transition-all capitalized flex flex-col items-center gap-2 ${config.panelType === type
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/20 scale-105'
                                                : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20'
                                                }`}
                                        >
                                            <Globe size={18} />
                                            <span className="capitalize">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>

                        {/* Pfast Credentials OR Generic API URL */}
                        {config.panelType === 'pfast' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Token Pfast</label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            value={config.pfastToken || ''}
                                            onChange={(e) => setConfig({ ...config, pfastToken: e.target.value })}
                                            placeholder="Token do Painel"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Secret Pfast</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            value={config.pfastSecret || ''}
                                            onChange={(e) => setConfig({ ...config, pfastSecret: e.target.value })}
                                            placeholder="Secret Key"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2 text-xs text-slate-500">
                                    Essas credenciais são usadas para autenticar na API do Pfast (api.painelcliente.com).
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">URL de POST do Teste Automático</label>
                                <input
                                    type="text"
                                    value={config.apiUrl || ''}
                                    onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                                    placeholder="https://seu-painel.com/api/..."
                                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500 transition-colors"
                                />
                                <p className="text-xs text-slate-500 mt-2">Insira a URL fornecida pelo seu painel para geração de testes.</p>
                            </div>
                        )}

                        {/* Fields */}
                        {/* Fields */}
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-3">Campos na Resposta</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Nome (Manual) - Now Customizable */}
                                <div className="flex flex-col gap-1 p-3 rounded-xl bg-black/20 border border-white/5">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Nome do Estabelecimento</label>
                                    <input
                                        type="text"
                                        value={config.nameField}
                                        onChange={(e) => setConfig({ ...config, nameField: e.target.value })}
                                        placeholder="Ex: Tops IPTV"
                                        className="bg-transparent border-none text-white focus:ring-0 p-0 placeholder:text-slate-600"
                                    />
                                </div>

                                {/* Personalização Extra */}
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                                    <h3 className="md:col-span-2 text-sm font-bold text-slate-300">Configurações Avançadas</h3>

                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-medium ml-1">Nome do Aplicativo</label>
                                        <input
                                            type="text"
                                            value={config.appName || ''}
                                            onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                                            placeholder="Ex: Minha TV App"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-medium ml-1">Link de Pagamento Manual</label>
                                        <input
                                            type="text"
                                            value={config.customPaymentUrl || ''}
                                            onChange={(e) => setConfig({ ...config, customPaymentUrl: e.target.value })}
                                            placeholder="Ex: https://meulink.com"
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs text-slate-400 font-medium ml-1">Template Link M3U</label>
                                        <input
                                            type="text"
                                            value={config.m3uLink || ''}
                                            onChange={(e) => setConfig({ ...config, m3uLink: e.target.value })}
                                            placeholder="http://url.com/get.php?username={user}&password={pass}..."
                                            className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                                        />
                                        <p className="text-[10px] text-slate-500 ml-1">Variáveis: <code>{'{user}'}</code>, <code>{'{pass}'}</code></p>
                                    </div>
                                </div>
                                {Object.keys(config.templateFields).map((field) => (
                                    <label key={field} className="flex items-center gap-3 p-3 rounded-xl bg-black/20 border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={config.templateFields[field]}
                                            onChange={(e) => setConfig({
                                                ...config,
                                                templateFields: { ...config.templateFields, [field]: e.target.checked }
                                            })}
                                            className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-primary-500 focus:ring-offset-0 focus:ring-0"
                                        />
                                        <span className="text-slate-200 capitalize">
                                            {field === 'dns' ? 'DNS' : field.charAt(0).toUpperCase() + field.slice(1)}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-xl"
                        >
                            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
                            Salvar Configuração
                        </button>
                    </div>
                </div>
            </div>

            {/* Instructions Sidebar */}
            <div className="space-y-6">
                <div className="glass p-6 rounded-3xl border border-primary-500/30 bg-primary-500/5">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-primary-400" />
                        Instruções
                    </h3>
                    <div className="space-y-4 text-sm text-slate-300">
                        <p>Para o Bot responder automaticamente, configure o Webhook no Dialogflow:</p>
                        <ol className="list-decimal pl-4 space-y-2 marker:text-primary-400">
                            <li>Vá no painel do <strong>Dialogflow</strong>.</li>
                            <li>Clique em <strong>Fulfillment</strong> no menu lateral.</li>
                            <li>Ative a opção <strong>Webhook</strong>.</li>
                            <li>Cole a URL abaixo:</li>
                        </ol>

                        <div className="bg-black/40 p-3 rounded-xl border border-white/10 break-all relative group">
                            <code className="text-primary-300 text-xs">{displayWebhookUrl}</code>
                            <button
                                onClick={copyToClipboard}
                                className="absolute top-2 right-2 p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                                title="Copiar URL"
                            >
                                <Copy size={14} />
                            </button>
                        </div>

                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200 text-xs mt-4">
                            ⚠️ Não esqueça de ativar "Enable webhook call" na aba Fulfillment das Intents que devem gerar teste.
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default AutoTest;
