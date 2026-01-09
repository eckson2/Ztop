import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CreditCard } from 'lucide-react';
import api from '../../api';

const ManualMethods = () => {
    const [methods, setMethods] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'pix', details: '' });

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            const { data } = await api.get('/financial/methods');
            setMethods(data);
        } catch (e) { console.error(e); }
    };

    const handleSave = async () => {
        try {
            await api.post('/financial/methods', formData);
            setShowModal(false);
            setFormData({ name: '', type: 'pix', details: '' });
            fetchMethods();
        } catch (e) { alert('Erro ao salvar.'); }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/financial/methods/${id}`);
            fetchMethods();
        } catch (e) { alert('Erro ao deletar.'); }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold gradient-text">Métodos Manuais</h1>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus size={20} /> Novo Método
                </button>
            </div>

            <div className="grid gap-4">
                {methods.map(m => (
                    <div key={m.id} className="glass p-4 rounded-2xl flex justify-between items-center border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/5 rounded-xl text-slate-400">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">{m.name}</h3>
                                <p className="text-sm text-slate-400">{m.details}</p>
                            </div>
                        </div>
                        <button onClick={() => handleDelete(m.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg">
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-white mb-4">Novo Método de Pagamento</h2>

                        <div className="space-y-4">
                            <input
                                className="input-field"
                                placeholder="Nome (Ex: Nubank PIX)"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                            <select
                                className="input-field"
                                value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="pix">PIX</option>
                                <option value="bank_transfer">Transferência Bancária</option>
                            </select>
                            <textarea
                                className="input-field h-24"
                                placeholder="Detalhes (Chave PIX, Agência, Conta...)"
                                value={formData.details} onChange={e => setFormData({ ...formData, details: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-300">Cancelar</button>
                            <button onClick={handleSave} className="btn-primary">Salvar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManualMethods;
