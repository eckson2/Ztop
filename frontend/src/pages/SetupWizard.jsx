import React, { useState, useEffect } from 'react';
import api from '../api';
import { Smartphone, Bot, CheckCircle2, Cloud, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';

const SetupWizard = () => {
    const [step, setStep] = useState(1);
    const [botType, setBotType] = useState('dialogflow');
    const [botConfig, setBotConfig] = useState({});
    const [waConfig, setWaConfig] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        try {
            const botData = await api.get('/bots');
            const waData = await api.get('/whatsapp');
            setBotConfig(botData.data);
            setWaConfig(waData.data);
            if (botData.data.botType) setBotType(botData.data.botType);
        } catch (e) { }
    };

    const handleSaveBot = async () => {
        setLoading(true);
        try {
            await api.post('/bots', { ...botConfig, botType });
            setStep(2);
            setMsg('Configuração do motor salva!');
        } catch (e) {
            setMsg('Erro ao salvar bot');
        }
        setLoading(false);
    };

    const handleSaveWA = async () => {
        setLoading(true);
        try {
            await api.post('/whatsapp', waConfig);
            setStep(3);
            setMsg('Dados do WhatsApp salvos!');
        } catch (e) {
            setMsg('Erro ao salvar WhatsApp');
        }
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-6">
            {/* Header / Steps Indicator */}
            <div className="flex justify-between items-center mb-12 relative">
                <StepIndicator current={step} number={1} label="Motor" icon={<Bot size={20} />} />
                <div className={`flex-1 h-1 mx-4 rounded ${step > 1 ? 'bg-primary-500' : 'bg-slate-700'}`} />
                <StepIndicator current={step} number={2} label="Conexão" icon={<Smartphone size={20} />} />
                <div className={`flex-1 h-1 mx-4 rounded ${step > 2 ? 'bg-primary-500' : 'bg-slate-700'}`} />
                <StepIndicator current={step} number={3} label="Ativo" icon={<CheckCircle2 size={20} />} />
            </div>

            {/* Step 1: Engine Selection */}
            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectionCard
                            active={botType === 'dialogflow'}
                            onClick={() => setBotType('dialogflow')}
                            title="Google Dialogflow"
                            desc="Poderoso processamento de linguagem natural (NLP)."
                            icon={<Cloud className="text-blue-400" size={32} />}
                        />
                        <SelectionCard
                            active={botType === 'typebot'}
                            onClick={() => setBotType('typebot')}
                            title="Typebot"
                            desc="Fluxos conversacionais visuais e intuitivos."
                            icon={<MessageSquare className="text-pink-400" size={32} />}
                        />
                    </div>

                    <div className="glass p-8 rounded-3xl space-y-6 border border-white/10">
                        {botType === 'dialogflow' ? (
                            <div className="space-y-4">
                                <h3 className="font-bold text-xl">Configurar Dialogflow</h3>
                                <Field label="Project ID" value={botConfig.dialogflowProjectId} onChange={v => setBotConfig({ ...botConfig, dialogflowProjectId: v })} />
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Service Account JSON</label>
                                    <textarea
                                        className="w-full h-32 bg-slate-800/50 border border-white/10 rounded-xl p-4 text-xs font-mono text-white outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder='{"type": "service_account", ...}'
                                        value={botConfig.dialogflowJson === '********' ? '' : botConfig.dialogflowJson}
                                        onChange={e => setBotConfig({ ...botConfig, dialogflowJson: e.target.value })}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="font-bold text-xl">Configurar Typebot</h3>
                                <Field label="Typebot ID" value={botConfig.typebotId} onChange={v => setBotConfig({ ...botConfig, typebotId: v })} />
                                <Field label="API Token" value={botConfig.typebotToken === '********' ? '' : botConfig.typebotToken} onChange={v => setBotConfig({ ...botConfig, typebotToken: v })} type="password" />
                            </div>
                        )}
                        <button onClick={handleSaveBot} className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                            {loading ? <RefreshCw className="animate-spin" /> : 'Salvar e Próximo'}
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: WhatsApp Connection */}
            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="glass p-8 rounded-3xl space-y-6 border border-white/10">
                        <h3 className="font-bold text-xl">Conectar WhatsApp</h3>
                        <p className="text-slate-400 text-sm">Escolha o seu provedor e configure a instância.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className={`p-4 rounded-xl border transition-all cursor-pointer ${waConfig.provider === 'evolution' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                                <input type="radio" name="provider" className="hidden" onClick={() => setWaConfig({ ...waConfig, provider: 'evolution' })} />
                                <span className="font-medium text-white">Evolution API</span>
                            </label>
                            <label className={`p-4 rounded-xl border transition-all cursor-pointer ${waConfig.provider === 'uazapi' ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                                <input type="radio" name="provider" className="hidden" onClick={() => setWaConfig({ ...waConfig, provider: 'uazapi' })} />
                                <span className="font-medium text-white">UazAPI</span>
                            </label>
                        </div>

                        <Field label="Base URL (API)" value={waConfig.baseUrl} onChange={v => setWaConfig({ ...waConfig, baseUrl: v })} placeholder="https://api.seuserver.com" />
                        <Field label="API Token / Key" value={waConfig.token === '********' ? '' : waConfig.token} onChange={v => setWaConfig({ ...waConfig, token: v })} type="password" />
                        <Field label="Instance Name/ID" value={waConfig.instanceId} onChange={v => setWaConfig({ ...waConfig, instanceId: v })} />

                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-4 border border-white/10 rounded-xl font-medium text-slate-300 hover:bg-white/5 transition-all">Voltar</button>
                            <button onClick={handleSaveWA} className="flex-[2] py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all">Salvar Conexão</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success / Webhook Info */}
            {step === 3 && (
                <div className="glass p-10 rounded-3xl text-center space-y-6 border border-white/10 animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-bold">Bot Pronto para Ativar!</h2>
                    <p className="text-slate-400 max-w-md mx-auto italic">
                        Configure a URL abaixo no seu provedor de WhatsApp como o Webhook de mensagens:
                    </p>
                    <div className="bg-slate-950/80 p-5 rounded-xl font-mono text-xs break-all border border-white/10 text-primary-400 select-all">
                        {`https://back.ztop.dev.br/api/webhook/whatsapp/${JSON.parse(localStorage.getItem('user'))?.id}?token=${JSON.parse(localStorage.getItem('user'))?.webhookToken}`}
                    </div>

                    <button onClick={() => window.location.href = '/'} className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all">
                        Ir para o Dashboard
                    </button>
                </div>
            )}
        </div>
    );
};

const StepIndicator = ({ current, number, label, icon }) => (
    <div className="flex flex-col items-center z-10">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${current >= number ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-800 text-slate-500'}`}>
            {current > number ? <CheckCircle2 size={20} /> : icon}
        </div>
        <span className={`text-xs mt-2 font-bold uppercase tracking-wider ${current >= number ? 'text-primary-400' : 'text-slate-600'}`}>{label}</span>
    </div>
);

const SelectionCard = ({ active, onClick, title, desc, icon }) => (
    <button onClick={onClick} className={`p-6 rounded-3xl border-2 transition-all text-left flex gap-5 ${active ? 'border-primary-500 bg-primary-500/5 shadow-xl shadow-primary-500/10' : 'border-white/5 hover:border-white/20 bg-white/5'}`}>
        <div className="p-4 bg-slate-900 rounded-2xl shrink-0">{icon}</div>
        <div>
            <h4 className="font-bold text-lg text-white">{title}</h4>
            <p className="text-slate-400 text-sm mt-1">{desc}</p>
        </div>
    </button>
);

const Field = ({ label, value, onChange, type = "text", placeholder }) => (
    <div className="space-y-1">
        <label className="text-xs text-slate-400 font-medium ml-1">{label}</label>
        <input
            type={type} value={value || ''} onChange={e => onChange(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all text-white"
            placeholder={placeholder}
        />
    </div>
);

export default SetupWizard;
