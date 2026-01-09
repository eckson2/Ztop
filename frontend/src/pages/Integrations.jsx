import React, { useState, useEffect } from 'react';
import { Plus, Server, Check, X, Eye, EyeOff, Save, Trash2, Link as LinkIcon, RefreshCw } from 'lucide-react';
import api from '../api';

const Integrations = () => {
    const [panels, setPanels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPanel, setEditingPanel] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'generic', // generic, playfast, sigma
        serverUrl: '',
        apiUser: '',
        apiPass: '',
        apiToken: '',
        apiSecret: '',
        autoRenewIPTV: false
    });

    useEffect(() => {
        fetchPanels();
    }, []);

    const fetchPanels = async () => {
        try {
            const { data } = await api.get('/products');
            setPanels(data);
        } catch (e) {
            console.error('Erro ao buscar painéis:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingPanel) {
                await api.put(`/products/${editingPanel.id}`, formData);
            } else {
                await api.post('/products', formData);
            }
            setShowModal(false);
            setEditingPanel(null);
            resetForm();
            fetchPanels();
        } catch (e) {
            console.error('Erro ao salvar painel:', e);
            alert('Erro ao salvar. Verifique os dados.');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza que deseja remover este painel?')) return;
        try {
            await api.delete(`/products/${id}`);
            fetchPanels();
        } catch (e) {
            console.error('Erro ao deletar:', e);
        }
    };

    const handleEdit = (panel) => {
        setEditingPanel(panel);
        setFormData({
            name: panel.name,
            type: panel.type || 'generic',
            serverUrl: panel.serverUrl || '',
            apiUser: panel.apiUser || '',
            apiPass: panel.apiPass || '',
            apiToken: panel.apiToken || '',
            apiSecret: panel.apiSecret || '',
            autoRenewIPTV: panel.autoRenewIPTV
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'generic',
            serverUrl: '',
            apiUser: '',
            apiPass: '',
            apiToken: '',
            apiSecret: '',
            autoRenewIPTV: false
        });
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Integrações IPTV</h1>
                    <p className="text-slate-400">Gerencie seus servidores e painéis conectados</p>
                </div>
                <button
                    onClick={() => { setEditingPanel(null); resetForm(); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Adicionar Novo Painel
                </button>
            </div>

            {/* Grid de Painéis */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 glass rounded-3xl animate-pulse" />)
                ) : panels.length === 0 ? (
                    <div className="col-span-3 text-center py-20 text-slate-500">
                        <Server size={64} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum painel configurado.</p>
                    </div>
                ) : (
                    panels.map((panel) => (
                        <div key={panel.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-primary-500/30 transition-all relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <Server size={24} className={panel.autoRenewIPTV ? "text-green-400" : "text-blue-400"} />
                                </div>
                                <div className="px-3 py-1 bg-white/5 rounded-full text-xs font-medium text-slate-300">
                                    {panel.type === 'playfast' ? 'PlayFast' : panel.type === 'sigma' ? 'Sigma V2' : 'Genérico'}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2">{panel.name}</h3>
                            <p className="text-sm text-slate-400 truncate mb-4">{panel.serverUrl || 'URL não configurada'}</p>

                            <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                                {panel.autoRenewIPTV ? (
                                    <span className="flex items-center gap-1 text-green-400"><RefreshCw size={14} /> Renovação Auto</span>
                                ) : (
                                    <span className="flex items-center gap-1"><X size={14} /> Renovação Manual</span>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(panel)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
                                    Configurar
                                </button>
                                <button onClick={() => handleDelete(panel.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Configuração */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {editingPanel ? `Editar ${editingPanel.name}` : 'Novo Painel'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">

                            {/* Tipo de Painel */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Integração</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {['generic', 'playfast', 'sigma'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFormData({ ...formData, type })}
                                            className={`p-4 rounded-xl border transition-all text-left ${formData.type === type ? 'bg-primary-600/20 border-primary-500 text-primary-400' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
                                        >
                                            <span className="block font-bold capitalize">{type}</span>
                                            <span className="text-xs opacity-70">
                                                {type === 'playfast' ? 'API Token + Secret' : type === 'sigma' ? 'User + Pass' : 'Credenciais Básicas'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="text-input-label">Nome do Painel</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Ex: PlayFast Principal"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="text-input-label">URL da API / Painel</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="https://api.painel.com"
                                        value={formData.serverUrl}
                                        onChange={e => setFormData({ ...formData, serverUrl: e.target.value })}
                                    />
                                </div>

                                {/* Campos Condicionais baseados no Tipo */}
                                {formData.type === 'playfast' ? (
                                    <>
                                        <div>
                                            <label className="text-input-label">API Token / Usuário</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="Token ou User"
                                                value={formData.apiToken}
                                                onChange={e => setFormData({ ...formData, apiToken: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-input-label">Secret Key</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                placeholder="Chave Secreta"
                                                value={formData.apiSecret}
                                                onChange={e => setFormData({ ...formData, apiSecret: e.target.value })}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-input-label">Usuário do Painel</label>
                                            <input
                                                type="text"
                                                className="input-field"
                                                placeholder="admin"
                                                value={formData.apiUser}
                                                onChange={e => setFormData({ ...formData, apiUser: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-input-label">Senha do Painel</label>
                                            <input
                                                type="password"
                                                className="input-field"
                                                value={formData.apiPass}
                                                onChange={e => setFormData({ ...formData, apiPass: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Toggle Auto Renew */}
                            <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <h4 className="font-bold text-white">Renovação Automática</h4>
                                    <p className="text-sm text-slate-400">Renovar clientes no painel automaticamente após pagamento.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.autoRenewIPTV}
                                        onChange={e => setFormData({ ...formData, autoRenewIPTV: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button onClick={() => setShowModal(false)} className="px-6 py-2 rounded-xl text-slate-300 hover:bg-white/5">Cancelar</button>
                                <button onClick={handleSave} className="btn-primary">Salvar Painel</button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Integrations;
