import React, { useState, useEffect } from 'react';
import api from '../api';
import { Users, UserX, UserCheck, Shield, Trash2, Search, RefreshCw } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/users');
            setUsers(data);
        } catch (e) {
            console.error('Erro ao listar usuários', e);
        }
        setLoading(false);
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            await api.patch(`/admin/users/${id}/status`, { status: newStatus });
            loadUsers();
        } catch (e) {
            alert('Erro ao atualizar status');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-bold gradient-text">Gestão de Usuários</h1>
                    <p className="text-slate-400 mt-2">Controle de acesso e monitoramento da plataforma</p>
                </div>
                <button
                    onClick={loadUsers}
                    className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-300"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="glass p-8 rounded-3xl">
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou e-mail..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-500 text-sm border-b border-white/5">
                                <th className="pb-4 font-medium px-4">Usuário</th>
                                <th className="pb-4 font-medium px-4">Plano / Cargo</th>
                                <th className="pb-4 font-medium px-4">WhatsApp</th>
                                <th className="pb-4 font-medium px-4">Interações</th>
                                <th className="pb-4 font-medium px-4">Status</th>
                                <th className="pb-4 font-medium px-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="group hover:bg-white/[0.02] transition-all">
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-slate-200">{user.name}</div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                            <span className="text-xs text-slate-400">{user.plan}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4">
                                        {user.whatsappInstance ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.whatsappInstance.status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <span className="text-xs text-slate-400 uppercase">{user.whatsappInstance.provider}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-600">Não configurado</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className="text-sm font-mono text-slate-400">{user._count.chatSessions}</span>
                                    </td>
                                    <td className="py-4 px-4">
                                        <span className={`text-xs font-bold ${user.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                            {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                        </span>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <button
                                            onClick={() => toggleStatus(user.id, user.status)}
                                            className={`p-2 rounded-lg transition-all ${user.status === 'active' ? 'text-red-400 hover:bg-red-400/10' : 'text-green-400 hover:bg-green-400/10'
                                                }`}
                                            title={user.status === 'active' ? 'Bloquear' : 'Ativar'}
                                        >
                                            {user.status === 'active' ? <UserX size={18} /> : <UserCheck size={18} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-20">
                        <Users size={48} className="mx-auto text-slate-700 mb-4" />
                        <p className="text-slate-500">Nenhum usuário encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
