import React, { useState, useEffect } from 'react';
import { Plus, Power, Users, Clock, Settings, Trash2 } from 'lucide-react';
import api from '../../api';
import CategoryModal from '../../components/marketing/CategoryModal'; // [NEW]

const BotDashboard = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/sending/categories');
            setCategories(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleCategory = async (cat) => {
        try {
            await api.put(`/sending/categories/${cat.id}`, { active: !cat.active });
            fetchCategories();
        } catch (e) { alert('Erro ao atualizar'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apagar categoria e todas regras?')) return;
        try {
            await api.delete(`/sending/categories/${id}`);
            fetchCategories();
        } catch (e) { alert('Erro ao apagar'); }
    };

    const handleEdit = (cat) => {
        setSelectedCategory(cat);
        setShowModal(true);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Ativar Cobranças</h1>
                    <p className="text-slate-400">Gerencie regras de envio por categoria de cliente.</p>
                </div>
                <button onClick={() => { setSelectedCategory(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Nova Categoria
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-20">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories.map(cat => (
                        <div key={cat.id} className="glass rounded-3xl border border-white/5 overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white">{cat.name}</h3>
                                    <button className="text-slate-500 hover:text-white"><Settings size={18} /></button>
                                </div>

                                <div className="flex items-center gap-2 mb-6">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${cat.active ? 'bg-green-500/20 text-green-400' : 'bg-slate-700/50 text-slate-400'}`}>
                                        {cat.active ? <Clock size={24} /> : <Power size={24} />}
                                    </div>
                                    <div>
                                        <p className="kpi-value text-2xl">{cat._count?.customers || 0}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase">Clientes Ativos</p>
                                    </div>
                                </div>

                                <div className="text-sm text-slate-400 flex items-center gap-2">
                                    <Settings size={14} /> {cat.rules?.length || 0} lembretes configurados
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="bg-black/20 p-4 border-t border-white/5 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => toggleCategory(cat)}
                                    className={`py-2 rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors ${cat.active ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-slate-700 text-slate-400'}`}
                                >
                                    <Power size={14} /> {cat.active ? 'Ativado' : 'Desativado'}
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(cat)} className="flex-1 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl flex items-center justify-center"><Settings size={16} /></button>
                                    <button onClick={() => handleDelete(cat.id)} className="flex-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl flex items-center justify-center"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <CategoryModal
                    category={selectedCategory}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => { setShowModal(false); fetchCategories(); }}
                />
            )}
        </div>
    );
};

export default BotDashboard;
