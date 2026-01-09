import React, { useState, useEffect } from 'react';
import { X, CreditCard, Send, CheckCircle, Smartphone } from 'lucide-react';
import api from '../api';

const RenewalModal = ({ client, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [methods, setMethods] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [step, setStep] = useState(1); // 1: Method, 2: Confirm, 3: Success

    const [formData, setFormData] = useState({
        method: 'gateway', // gateway | manual
        manualMethodId: '',
        gatewayName: '',
        newValue: client?.plan?.price || 0,
        newDueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().substr(0, 10),
        templateId: '',
        addLoyaltyPoints: true,
        renewOnPanel: false
    });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        try {
            const [methodsRes, templatesRes, configRes] = await Promise.all([
                api.get('/financial/methods'),
                api.get('/templates'),
                api.get('/payments/settings')
            ]);
            setMethods(methodsRes.data);
            const renewalTemplates = templatesRes.data.filter(t => t.type === 'renewal' || t.type === 'general');
            setTemplates(renewalTemplates);

            // Auto-select active gateway if any
            const activeGateway = configRes.data?.activeGateway;
            if (activeGateway && activeGateway !== 'none') {
                setFormData(prev => ({ ...prev, method: 'gateway', gatewayName: activeGateway }));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post(`/customers/${client.id}/renew`, {
                method: formData.method,
                manualMethodId: formData.manualMethodId,
                amount: formData.newValue,
                newDueDate: formData.newDueDate,
                addLoyaltyPoints: formData.addLoyaltyPoints
            });

            // Send Message Logic (Mocked for now or added to backend action)
            if (formData.templateId) {
                // await api.post(`/whatsapp/send`, ...);
            }

            setStep(3);
            if (onSuccess) onSuccess();
        } catch (e) {
            alert('Erro ao renovar: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(false);
        }
    };

    if (!client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg relative">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-white"><X size={20} /></button>

                {step === 3 ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Renovado com Sucesso!</h2>
                        <p className="text-slate-400 mb-6">O cliente foi renovado e a transação registrada.</p>
                        <div className="flex gap-2 justify-center">
                            <button onClick={onClose} className="btn-primary">Fechar</button>
                            <button className="px-4 py-2 bg-white/5 rounded-xl text-slate-300 hover:bg-white/10 flex items-center gap-2">
                                <Smartphone size={18} /> Enviar Comprovante
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-1">Renovar Cliente</h2>
                        <p className="text-slate-400 mb-6 text-sm">Atualize a assinatura de <span className="text-white font-bold">{client.name}</span>.</p>

                        <div className="space-y-5">
                            {/* Date & Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-input-label">Nova Data Vencimento</label>
                                    <input
                                        type="date" className="input-field"
                                        value={formData.newDueDate}
                                        onChange={e => setFormData({ ...formData, newDueDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-input-label">Valor (R$)</label>
                                    <input
                                        type="number" className="input-field"
                                        value={formData.newValue}
                                        onChange={e => setFormData({ ...formData, newValue: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="text-input-label">Como o cliente pagou?</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <label className={`p-3 rounded-xl border cursor-pointer transition-all ${formData.method === 'gateway' ? 'bg-primary-500/20 border-primary-500' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                        <input
                                            type="radio" className="hidden"
                                            name="method" value="gateway"
                                            checked={formData.method === 'gateway'}
                                            onChange={() => setFormData({ ...formData, method: 'gateway' })}
                                        />
                                        <div className="flex items-center gap-2 font-bold text-white"><CreditCard size={18} /> Gateway Auto</div>
                                        <div className="text-xs text-slate-400 mt-1">Ciabra, MercadoPago...</div>
                                    </label>

                                    <label className={`p-3 rounded-xl border cursor-pointer transition-all ${formData.method === 'manual' ? 'bg-primary-500/20 border-primary-500' : 'bg-white/5 border-transparent hover:border-white/10'}`}>
                                        <input
                                            type="radio" className="hidden"
                                            name="method" value="manual"
                                            checked={formData.method === 'manual'}
                                            onChange={() => setFormData({ ...formData, method: 'manual' })}
                                        />
                                        <div className="flex items-center gap-2 font-bold text-white"><CreditCard size={18} /> Manual</div>
                                        <div className="text-xs text-slate-400 mt-1">PIX Pessoal, Dinheiro...</div>
                                    </label>
                                </div>

                                {/* Manual Method Select */}
                                {formData.method === 'manual' && (
                                    <div className="mt-3 animate-fade-in">
                                        <select
                                            className="input-field"
                                            value={formData.manualMethodId}
                                            onChange={e => setFormData({ ...formData, manualMethodId: e.target.value })}
                                        >
                                            <option value="">Selecione o método...</option>
                                            {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Template Select */}
                            <div>
                                <label className="text-input-label">Mensagem de Confirmação</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <select
                                            className="input-field"
                                            value={formData.templateId}
                                            onChange={e => setFormData({ ...formData, templateId: e.target.value })}
                                        >
                                            <option value="">Sem mensagem</option>
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl text-slate-400 h-[46px] w-[46px] flex items-center justify-center">
                                        <Send size={18} />
                                    </div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-3 pt-2 bg-black/20 p-4 rounded-xl">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox" className="checkbox"
                                        checked={formData.addLoyaltyPoints}
                                        onChange={e => setFormData({ ...formData, addLoyaltyPoints: e.target.checked })}
                                    />
                                    <span className="text-sm text-slate-300">Adicionar Pontos de Fidelidade</span>
                                </label>

                                {client.product?.type !== 'generic' && (
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox" className="checkbox"
                                            checked={formData.renewOnPanel}
                                            onChange={e => setFormData({ ...formData, renewOnPanel: e.target.checked })}
                                        />
                                        <span className="text-sm text-slate-300">Renovar também no Painel IPTV</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white">Cancelar</button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || (formData.method === 'manual' && !formData.manualMethodId)}
                                className="btn-primary w-full md:w-auto flex items-center gap-2"
                            >
                                {loading ? 'Processando...' : <><CheckCircle size={18} /> Confirmar Renovação</>}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RenewalModal;
