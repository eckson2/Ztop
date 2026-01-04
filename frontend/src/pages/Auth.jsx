import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Zap, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { email, password });
            login(data.user, data.token);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao entrar');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
            <div className="w-full max-w-md glass p-8 rounded-3xl border border-white/10">
                <div className="flex flex-col items-center mb-10">
                    <div className="p-3 bg-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
                        <Zap size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">Bem-vindo de volta</h1>
                    <p className="text-slate-400 mt-2 text-center text-sm">Acesse sua conta para gerenciar seus bots</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-white"
                                placeholder="nome@exemplo.com" required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-white"
                                placeholder="••••••••" required
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button type="submit" className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2 group">
                        Entrar <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-400 text-sm">
                    Não tem uma conta? <button onClick={() => navigate('/register')} className="text-primary-400 font-bold hover:underline ml-1">Cadastre-se</button>
                </p>
            </div>
        </div>
    );
};

export const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', { name, email, password });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao cadastrar');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
            <div className="w-full max-w-md glass p-8 rounded-3xl border border-white/10">
                <div className="flex flex-col items-center mb-10">
                    <div className="p-3 bg-primary-500 rounded-2xl mb-4 shadow-lg shadow-primary-500/30">
                        <Zap size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold gradient-text">Criar Conta</h1>
                    <p className="text-slate-400 mt-2 text-center text-sm">Comece sua automação em segundos</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nome Completo</label>
                        <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text" value={name} onChange={e => setName(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-white"
                                placeholder="João Silva" required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-white"
                                placeholder="nome@exemplo.com" required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-white"
                                placeholder="••••••••" required
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button type="submit" className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all">
                        Criar Conta
                    </button>
                </form>

                <p className="text-center mt-8 text-slate-400 text-sm">
                    Já tem uma conta? <button onClick={() => navigate('/login')} className="text-primary-400 font-bold hover:underline ml-1">Entrar</button>
                </p>
            </div>
        </div>
    );
};
