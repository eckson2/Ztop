import React, { useState, useEffect } from 'react';
import { User, Shield, Search, Plus, MoreVertical, Lock, Calendar, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';
import api from '../api';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Form Stats
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        isAdminBlocked: false,
        expirationDate: null
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update
                await api.put(`/admin/users/${editingUser.id}`, formData);
            } else {
                // Create
                await api.post('/admin/users', formData);
            }
            setShowModal(false);
            fetchUsers();
            resetForm();
        } catch (error) {
            alert('Erro ao salvar usuário: ' + (error.response?.data?.error || error.message));
        }
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'USER',
            isAdminBlocked: false,
            expirationDate: null
        });
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Don't show hash
            role: user.role,
            isAdminBlocked: user.isAdminBlocked,
            expirationDate: user.expirationDate ? new Date(user.expirationDate) : null
        });
        setShowModal(true);
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8"><div className="animate-pulse h-96 glass rounded-3xl" /></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">Administração</h1>
                    <p className="text-slate-400">Gerencie usuários, acessos e permissões.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn-primary flex items-center gap-2 px-4 py-2 rounded-xl"
                >
                    <Plus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* Search */}
            <div className="glass p-4 rounded-2xl mb-6 flex items-center gap-3">
                <Search className="text-slate-500" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    className="bg-transparent border-none focus:ring-0 text-white w-full placeholder:text-slate-600"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Users List */}
            <div className="grid gap-4">
                {filteredUsers.map(user => (
                    <div key={user.id} className="glass p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 hover:border-white/10 transition-all">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className={`p-3 rounded-xl ${user.isAdminBlocked ? 'bg-red-500/10 text-red-400' : 'bg-primary-500/10 text-primary-400'}`}>
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    {user.name}
                                    {user.role === 'ADMIN' && <Shield size={14} className="text-yellow-400" />}
                                </h3>
                                <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/20">
                                {user.isAdminBlocked ? (
                                    <span className="flex items-center gap-1 text-red-400"><XCircle size={14} /> Bloqueado</span>
                                ) : (
                                    <span className="flex items-center gap-1 text-emerald-400"><CheckCircle size={14} /> Ativo</span>
                                )}
                            </div>

                            {user.expirationDate && (
                                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/20">
                                    <Calendar size={14} />
                                    <span>Vence: {format(new Date(user.expirationDate), 'dd/MM/yyyy')}</span>
                                </div>
                            )}

                            <button onClick={() => openEdit(user)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">
                                <Edit2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="glass w-full max-w-lg rounded-3xl p-6 md:p-8 animate-fade-in relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"
                        >
                            <XCircle size={24} />
                        </button>

                        <h2 className="text-2xl font-bold mb-6">
                            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Nome</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha'}
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                                    <select
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="USER">Usuário</option>
                                        <option value="ADMIN">Administrador</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, isAdminBlocked: !formData.isAdminBlocked })}
                                        className={`w-full p-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${formData.isAdminBlocked
                                                ? 'bg-red-500/20 border-red-500 text-red-400'
                                                : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                            }`}
                                    >
                                        {formData.isAdminBlocked ? 'Bloqueado' : 'Ativo'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">Data de Vencimento (Opcional)</label>
                                <DatePicker
                                    selected={formData.expirationDate}
                                    onChange={(date) => setFormData({ ...formData, expirationDate: date })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-primary-500"
                                    dateFormat="dd/MM/yyyy"
                                    isClearable
                                    placeholderText="Sem vencimento"
                                    locale={ptBR}
                                />
                            </div>

                            <button className="btn-primary w-full py-3 rounded-xl font-bold mt-4">
                                Salvar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
