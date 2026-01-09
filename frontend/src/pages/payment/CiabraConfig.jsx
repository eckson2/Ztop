import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Copy } from 'lucide-react';
import api from '../../api';

const CiabraConfig = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        activeGateway: 'ciabra',
        ciabraPublic: '',
        ciabraPrivate: '',
        showName: true,
        showCpf: true,
        showWhatsapp: true,
        notifyAdmin: true,
        notifyClient: true,
        templateAdmin: '',
        templateClient: ''
    });

    const [showSecret, setShowSecret] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data } = await api.get('/payments/settings');
            if (data) setConfig(prev => ({ ...prev, ...data }));
        } catch (e) {
            console.error('Erro ao carregar configs', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put('/payments/settings', {
                ...config,
                activeGateway: 'ciabra' // Force set as active if saving here
            });
            alert('Configurações salvas com sucesso!');
        } catch (e) {
            console.error('Erro ao salvar', e);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    const copyWebhook = () => {
        navigator.clipboard.writeText('https://topgestor.me/api/webhook/ciabra'); // Placeholder URL
        alert('URL copiada!');
    };

    if (loading) return <div className="p-10 text-center text-slate-400">Carregando...</div>;

    return (
        <div className="max-w-5xl mx-auto p-6 pb-20">
            <h1 className="text-3xl font-bold gradient-text mb-2">Configuração Ciabra</h1>
            <p className="text-slate-400 mb-8">Gerencie suas chaves de API e preferências de checkout.</p>

            <div className="space-y-8">

                {/* Credenciais */}
                <section className="glass p-6 rounded-3xl border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        🔑 Credenciais de API
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-input-label">Chave Pública</label>
                            <input
                                type="text"
                                className="input-field"
                                value={config.ciabraPublic || ''}
                                onChange={e => setConfig({ ...config, ciabraPublic: e.target.value })}
                                placeholder="Sua chave pública"
                            />
                        </div>
                        <div className="relative">
                            <label className="text-input-label">Chave Privada</label>
                            <input
                                type={showSecret ? "text" : "password"}
                                className="input-field pr-10"
                                value={config.ciabraPrivate || ''}
                                onChange={e => setConfig({ ...config, ciabraPrivate: e.target.value })}
                                placeholder="Sua chave privada"
                            />
                            <button
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-3 top-[38px] text-slate-400 hover:text-white"
                            >
                                {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
                        <label className="text-sm font-bold text-primary-400 mb-2 block">URL do Webhook</label>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-black/30 p-3 rounded-lg text-slate-300 font-mono text-sm">
                                {window.location.origin}/api/webhook/ciabra
                            </code>
                            <button onClick={copyWebhook} className="p-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                                <Copy size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Adicione esta URL no painel do Ciabra para receber notificações de pagamento.</p>
                    </div>
                </section>

                {/* Notificações e Templates */}
                <section className="glass p-6 rounded-3xl border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        🔔 Notificações WhatsApp
                    </h2>

                    {/* Toggle Admin */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-200">Notificar Administrador</h3>
                                <p className="text-sm text-slate-400">Receba um aviso no seu WhatsApp quando uma venda ocorrer.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={config.notifyAdmin} onChange={e => setConfig({ ...config, notifyAdmin: e.target.checked })} />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                            </label>
                        </div>
                        {config.notifyAdmin && (
                            <textarea
                                className="input-field h-32 font-mono text-sm"
                                value={config.templateAdmin || ''}
                                onChange={e => setConfig({ ...config, templateAdmin: e.target.value })}
                                placeholder="Template da mensagem..."
                            />
                        )}
                    </div>

                    <hr className="border-white/10 my-6" />

                    {/* Toggle Client */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-200">Notificar Cliente (Renovação)</h3>
                                <p className="text-sm text-slate-400">Envie o comprovante e dados de acesso ao cliente após o pagamento.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={config.notifyClient} onChange={e => setConfig({ ...config, notifyClient: e.target.checked })} />
                                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                            </label>
                        </div>
                        {config.notifyClient && (
                            <textarea
                                className="input-field h-40 font-mono text-sm"
                                value={config.templateClient || ''}
                                onChange={e => setConfig({ ...config, templateClient: e.target.value })}
                                placeholder="Template da mensagem..."
                            />
                        )}
                        <div className="mt-2 text-xs text-slate-500 font-mono">
                            Variáveis disponíveis: {'{{customer_name}}'}, {'{{customer_whatsapp}}'}, {'{{vencimento}}'}, {'{{customer_product_name}}'}, {'{{total_pontos}}'}, {'{{parabens_resgate}}'}
                        </div>
                    </div>
                </section>

                {/* Checkout Options */}
                <section className="glass p-6 rounded-3xl border border-white/5">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        📝 Opções de Checkout
                    </h2>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="checkbox" checked={config.showName} onChange={e => setConfig({ ...config, showName: e.target.checked })} />
                            <span className="text-slate-300">Solicitar Nome Completo</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="checkbox" checked={config.showCpf} onChange={e => setConfig({ ...config, showCpf: e.target.checked })} />
                            <span className="text-slate-300">Solicitar CPF (Obrigatório para PIX)</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" className="checkbox" checked={config.showWhatsapp} onChange={e => setConfig({ ...config, showWhatsapp: e.target.checked })} />
                            <span className="text-slate-300">Solicitar WhatsApp (Para envio do comprovante)</span>
                        </label>
                    </div>
                </section>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary w-full md:w-auto flex justify-center items-center gap-2 py-3 px-8 text-lg"
                    >
                        {saving ? 'Salvando...' : <><Save size={20} /> Salvar Configurações</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CiabraConfig;
