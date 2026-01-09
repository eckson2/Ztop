import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon } from 'lucide-react';
import api from '../../api';

const MessageTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        content: '',
        type: 'general',
        mediaUrl: ''
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const { data } = await api.get('/templates');
            setTemplates(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingTemplate) {
                await api.put(`/templates/${editingTemplate.id}`, formData);
            } else {
                await api.post('/templates', formData);
            }
            setShowModal(false);
            setEditingTemplate(null);
            resetForm();
            fetchTemplates();
        } catch (e) {
            alert('Erro ao salvar template.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir este template?')) return;
        try {
            await api.delete(`/templates/${id}`);
            fetchTemplates();
        } catch (e) {
            alert('Erro ao excluir.');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', content: '', type: 'general', mediaUrl: '' });
    };

    const insertVariable = (variable) => {
        setFormData(prev => ({ ...prev, content: prev.content + ` {{${variable}}} ` }));
    };

    const variables = [
        'customer_name', 'customer_whatsapp', 'customer_product_name',
        'customer_duedate', 'total_pontos', 'pix_key'
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Templates de Mensagem</h1>
                    <p className="text-slate-400">Padronize suas mensagens de cobrança e avisos.</p>
                </div>
                <button
                    onClick={() => { setEditingTemplate(null); resetForm(); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} /> Novo Template
                </button>
            </div>

            <div className="grid gap-4">
                {loading ? <div className="text-center p-10 text-slate-500">Carregando...</div> : templates.map(t => (
                    <div key={t.id} className="glass p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${t.type === 'billing' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                    {t.type}
                                </span>
                                <h3 className="text-xl font-bold text-white">{t.name}</h3>
                            </div>
                            <pre className="text-sm text-slate-400 font-mono whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5">
                                {t.content}
                            </pre>
                            {t.mediaUrl && (
                                <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                    <ImageIcon size={14} /> Mídia anexada: {t.mediaUrl}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2 justify-center">
                            <button
                                onClick={() => { setEditingTemplate(t); setFormData(t); setShowModal(true); }}
                                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-slate-300"
                            >
                                <Edit size={20} />
                            </button>
                            <button
                                onClick={() => handleDelete(t.id)}
                                className="p-2 bg-red-500/10 rounded-lg hover:bg-red-500/20 text-red-400"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingTemplate ? 'Editar Template' : 'Novo Template'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-input-label">Nome do Template</label>
                                <input
                                    type="text" className="input-field"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Cobrança Padrão"
                                />
                            </div>

                            <div>
                                <label className="text-input-label">Tipo</label>
                                <select
                                    className="input-field"
                                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="general">Geral</option>
                                    <option value="billing">Cobrança</option>
                                    <option value="renewal">Renovação</option>
                                    <option value="welcome">Boas-vindas</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-input-label flex justify-between">
                                    <span>Conteúdo da Mensagem</span>
                                    <span className="text-xs text-slate-400">Variáveis disponíveis abaixo</span>
                                </label>
                                <textarea
                                    className="input-field h-40 font-mono text-sm leading-relaxed"
                                    value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Olá {{customer_name}}, seu pagamento vence em..."
                                />

                                {/* Variables Helper */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {variables.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => insertVariable(v)}
                                            className="bg-white/5 hover:bg-primary-500/20 border border-white/10 hover:border-primary-500/50 text-xs px-2 py-1 rounded text-slate-300 transition-colors"
                                        >
                                            {`{{${v}}}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-input-label">URL da Mídia (Opcional)</label>
                                <input
                                    type="text" className="input-field"
                                    value={formData.mediaUrl || ''} onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                                    placeholder="https://exemplo.com/imagem.png"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2 rounded-xl text-slate-300 hover:bg-white/5">Cancelar</button>
                            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                                <Save size={18} /> Salvar
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageTemplates;
