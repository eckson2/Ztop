import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, User, Smartphone, Mail, CreditCard, Server } from 'lucide-react';
import api from '../../api';

const ClientForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // If ID exists, it's Edit mode
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [plans, setPlans] = useState([]);

    const [formData, setFormData] = useState({
        name: '', phone: '', email: '', cpf: '',
        productId: '', planId: '',
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().substr(0, 10),
        notes: ''
    });

    useEffect(() => {
        fetchResources();
        if (isEdit) fetchClient();
    }, []);

    const fetchResources = async () => {
        try {
            const { data } = await api.get('/products'); // Use products endpoint
            setProducts(data);
            // Mock plans for now or fetch from product
            setPlans([
                { id: 'p1', name: 'Mensal - R$ 35,00', price: 35 },
                { id: 'p2', name: 'Trimestral - R$ 90,00', price: 90 }
            ]);
        } catch (e) { console.error(e); }
    };

    const fetchClient = async () => {
        try {
            // We can reuse the list endpoint or create a specific get one
            // For simplicity assuming list has data or we find from list
            // Better: specific endpoint. Let's assume GET /customers/:id exists or filter locally for now
            // Implementing GET /customers/:id would be better but let's just use what we have in controller (only list).
            // Actually I should add GET /customers/:id to backend if not there. 
            // Controller doesn't have it explicitly but standard REST usually does.
            // Let's rely on list filtering or add it. I'll filter for now to save time.
            const { data } = await api.get('/customers');
            const client = data.find(c => c.id === id);
            if (client) {
                setFormData({
                    name: client.name,
                    phone: client.phone,
                    email: client.email || '',
                    cpf: client.cpf || '',
                    productId: client.productId || '',
                    planId: client.planId || '',
                    dueDate: client.dueDate ? client.dueDate.substr(0, 10) : '',
                    notes: client.notes || ''
                });
            }
        } catch (e) { console.error(e); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/customers/${id}`, formData);
            } else {
                await api.post('/customers', formData);
            }
            navigate('/customers');
        } catch (e) {
            alert('Erro ao salvar: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-bold gradient-text mb-8">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h1>

            <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl border border-white/5 space-y-8">

                {/* Personal Info */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <User className="text-primary-400" size={20} /> Dados Pessoais
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-input-label">Nome Completo *</label>
                            <input required className="input-field" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: João Silva" />
                        </div>
                        <div>
                            <label className="text-input-label">WhatsApp *</label>
                            <div className="relative">
                                <Smartphone className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input required className="input-field pl-10" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="5511999999999" />
                            </div>
                        </div>
                        <div>
                            <label className="text-input-label">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input type="email" className="input-field pl-10" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-input-label">CPF</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-3 text-slate-500" size={18} />
                                <input className="input-field pl-10" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-white/10" />

                {/* Subscription Info */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Server className="text-primary-400" size={20} /> Assinatura
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-input-label">Servidor / Painel</label>
                            <select className="input-field" value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })}>
                                <option value="">Selecione...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-input-label">Plano</label>
                            <select className="input-field" value={formData.planId} onChange={e => setFormData({ ...formData, planId: e.target.value })}>
                                <option value="">Selecione...</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-input-label">Vencimento Inicial</label>
                            <input type="date" required className="input-field" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} />
                        </div>
                    </div>
                </section>

                <div>
                    <label className="text-input-label">Observações</label>
                    <textarea className="input-field h-24" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={() => navigate('/customers')} className="px-6 py-3 rounded-xl text-slate-300 hover:bg-white/5 font-bold">Cancelar</button>
                    <button type="submit" disabled={loading} className="btn-primary px-8 py-3 flex items-center gap-2 text-lg">
                        <Save size={20} /> Salvar Cliente
                    </button>
                </div>

            </form>
        </div>
    );
};

export default ClientForm;
