import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, Clock, AlertTriangle, Send } from 'lucide-react';
import api from '../../api';

const BotConfig = () => {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState([]);
    const [config, setConfig] = useState({
        active: true,
        warningDays: 3,
        lateDays: 3,
        warningTemplateId: '',
        dueTemplateId: '',
        lateTemplateId: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const tRes = await api.get('/templates');
            setTemplates(tRes.data);
            // Fetch user config (Mocked here, real app needs /api/sending/config endpoint)
            // setConfig(...)
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        setLoading(true);
        // await api.post('/sending/config', config);
        setTimeout(() => {
            alert('Configurações Salvas! (Simulação)');
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">Configuração do Bot</h1>
            <p className="text-slate-400 mb-8">Defina como o robô deve cobrar seus clientes.</p>

            <div className="glass p-8 rounded-3xl border border-white/5 space-y-8">

                {/* Main Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${config.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Envio Automático</h3>
                            <p className="text-xs text-slate-400">O robô enviará mensagens todos os dias às 09:00.</p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={config.active} onChange={e => setConfig({ ...config, active: e.target.checked })} />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                </div>

                <hr className="border-white/10" />

                {/* Rules */}
                <div className="space-y-6">
                    <RuleRow
                        icon={<Clock size={20} className="text-yellow-400" />}
                        title="Aviso de Vencimento"
                        desc="Enviar antes do vencimento"
                        days={config.warningDays}
                        setDays={d => setConfig({ ...config, warningDays: d })}
                        template={config.warningTemplateId}
                        setTemplate={t => setConfig({ ...config, warningTemplateId: t })}
                        templates={templates}
                    />
                    <RuleRow
                        icon={<AlertTriangle size={20} className="text-orange-400" />}
                        title="Cobrança no Dia"
                        desc="Enviar no dia do vencimento"
                        fixedDay
                        template={config.dueTemplateId}
                        setTemplate={t => setConfig({ ...config, dueTemplateId: t })}
                        templates={templates}
                    />
                    <RuleRow
                        icon={<AlertTriangle size={20} className="text-red-400" />}
                        title="Cobrança de Atraso"
                        desc="Enviar após o vencimento"
                        days={config.lateDays}
                        setDays={d => setConfig({ ...config, lateDays: d })}
                        template={config.lateTemplateId}
                        setTemplate={t => setConfig({ ...config, lateTemplateId: t })}
                        templates={templates}
                    />
                </div>

                <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={loading} className="btn-primary flex items-center gap-2 px-8 py-3">
                        {loading ? 'Salvando...' : <><Save size={20} /> Salvar Configurações</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RuleRow = ({ icon, title, desc, days, setDays, template, setTemplate, templates, fixedDay }) => (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-4 flex items-center gap-3">
            {icon}
            <div>
                <p className="font-bold text-white text-sm">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
            </div>
        </div>

        <div className="md:col-span-3">
            {!fixedDay ? (
                <div className="flex items-center gap-2">
                    <input
                        type="number" className="input-field w-20 text-center"
                        value={days} onChange={e => setDays(e.target.value)}
                    />
                    <span className="text-sm text-slate-400">dias</span>
                </div>
            ) : (
                <span className="text-sm text-slate-500 italic">No dia exato</span>
            )}
        </div>

        <div className="md:col-span-5">
            <select className="input-field" value={template} onChange={e => setTemplate(e.target.value)}>
                <option value="">Selecione o Template...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
        </div>
    </div>
);

export default BotConfig;
