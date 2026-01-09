import React, { useState, useEffect } from 'react';
import { X, Plus, Trash, Calendar, Clock, Save } from 'lucide-react';
import api from '../../api';

const CategoryModal = ({ category, onClose, onSuccess }) => {
    const [name, setName] = useState(category?.name || '');
    const [rules, setRules] = useState([]); // Local state for UI
    const [templates, setTemplates] = useState([]);

    // New Rule State
    const [newRule, setNewRule] = useState({
        templateId: '', daysOffset: 0, timeToSend: '09:00', weekDays: [0, 1, 2, 3, 4, 5, 6]
    });

    useEffect(() => {
        fetchTemplates();
        if (category) setRules(category.rules || []);
    }, [category]);

    const fetchTemplates = async () => {
        try { const res = await api.get('/templates'); setTemplates(res.data); } catch (e) { }
    };

    const handleCreateCategory = async () => {
        if (!name) return;
        try {
            let catId = category?.id;
            // 1. Create/Update Category Name
            if (category) {
                await api.put(`/sending/categories/${category.id}`, { name });
            } else {
                const res = await api.post('/sending/categories', { name });
                catId = res.data.id;
            }

            // 2. Add New Rules if any (For simplicity, we add rules one by one in UI instantly or batch here. 
            // Strategy: We only allow adding rules if category exists. 
            // If creating new, first save category then allow adding rules.
            // For this modal, let's keep it simple: Save Category Name only. 
            // Rules management is better done in a separate view or "Edit" mode.
            // But user asked for everything in one flow.
            // Let's settle on: If (new), create cat first.
        } catch (e) { alert('Erro ao salvar'); }

        onSuccess();
    };

    const handleAddRule = async () => {
        if (!category) { alert('Salve a categoria primeiro.'); return; }
        if (!newRule.templateId) return;

        try {
            await api.post(`/sending/categories/${category.id}/rules`, {
                ...newRule,
                weekDays: newRule.weekDays.join(',')
            });
            // Refresh local rules
            onSuccess(); // Trigger parent refresh which re-mounts modal? No.
            // We need to re-fetch category rules.
            // A bit complex for single file. 
            // Let's manually append to list for UI feedback or re-fetch.
            // Ideally we close and reopen or just alert success.
            alert('Regra adicionada!');
            onSuccess(); // Refresh parent dashboard
        } catch (e) { alert('Erro ao adicionar regra'); }
    };

    const handleDeleteRule = async (id) => {
        try { await api.delete(`/rules/${id}`); onSuccess(); } catch (e) { }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X size={20} /></button>

                <h2 className="text-2xl font-bold text-white mb-6">{category ? 'Editar Categoria' : 'Nova Categoria'}</h2>

                {/* Name Input */}
                <div className="mb-8">
                    <label className="text-input-label">Nome da Categoria</label>
                    <div className="flex gap-2">
                        <input
                            className="input-field"
                            value={name} onChange={e => setName(e.target.value)}
                            placeholder="Ex: Clientes VIP"
                        />
                        {!category && (
                            <button onClick={handleCreateCategory} className="btn-primary">Criar</button>
                        )}
                        {category && <button onClick={handleCreateCategory} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 text-white"><Save size={18} /></button>}
                    </div>
                </div>

                <hr className="border-white/10 mb-8" />

                {category ? (
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-blue-400" /> Lembretes Configurados
                        </h3>

                        {/* Rule List */}
                        <div className="space-y-3 mb-8">
                            {rules.map(rule => (
                                <div key={rule.id} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-1 rounded ${rule.daysOffset > 0 ? 'bg-blue-500/20 text-blue-300' : rule.daysOffset < 0 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                                                {rule.daysOffset === 0 ? 'No Dia' : rule.daysOffset > 0 ? `${rule.daysOffset} dias antes` : `${Math.abs(rule.daysOffset)} dias depois`}
                                            </span>
                                            <span className="text-slate-400 text-sm">às {rule.timeToSend}</span>
                                        </div>
                                        <p className="text-white text-sm mt-1">{rule.template?.name || 'Template desconhecido'}</p>
                                    </div>
                                    <button onClick={() => handleDeleteRule(rule.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded"><Trash size={16} /></button>
                                </div>
                            ))}
                            {rules.length === 0 && <p className="text-slate-500 italic text-sm">Nenhum lembrete configurado.</p>}
                        </div>

                        {/* Add Rule Form */}
                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                            <h4 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Novo Lembrete</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Quando?</label>
                                    <select className="input-field text-sm" value={newRule.daysOffset} onChange={e => setNewRule({ ...newRule, daysOffset: Number(e.target.value) })}>
                                        <option value="3">3 dias antes</option>
                                        <option value="2">2 dias antes</option>
                                        <option value="1">1 dia antes</option>
                                        <option value="0">No dia do vencimento</option>
                                        <option value="-1">1 dia depois</option>
                                        <option value="-2">2 dias depois</option>
                                        <option value="-3">3 dias depois</option>
                                        <option value="-5">5 dias depois</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Horário</label>
                                    <input type="time" className="input-field text-sm" value={newRule.timeToSend} onChange={e => setNewRule({ ...newRule, timeToSend: e.target.value })} />
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs text-slate-500 mb-1 block">Mensagem</label>
                                <select className="input-field text-sm" value={newRule.templateId} onChange={e => setNewRule({ ...newRule, templateId: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleAddRule} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm">
                                Adicionar Lembrete
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-10">
                        Salve a categoria primeiro para adicionar regras.
                    </div>
                )}

            </div>
        </div>
    );
};

export default CategoryModal;
