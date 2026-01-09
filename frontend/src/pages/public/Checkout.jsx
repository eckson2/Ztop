import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, CheckCircle, Copy, CreditCard, ChevronRight } from 'lucide-react';
import api from '../../api';

const Checkout = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentData, setPaymentData] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchInfo();
    }, []);

    const fetchInfo = async () => {
        try {
            // Since this is public, we might need a separate axios instance without auth header?
            // But usually if token is missing/invalid, backend 401s protected routes.
            // Public routes ignore auth header. So reusing 'api' instance is fine IF it doesn't force redirect on 401.
            // My 'api' interceptor might force redirect to login. I'll use fetch for safety or a new axios instance.
            // For now, let's assume api instance is ok or use fetch.
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/public/checkout/${id}`);
            if (!res.ok) throw new Error('Falha ao buscar');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePix = async () => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/public/checkout/${id}/pay`, {
                method: 'POST'
            });
            const json = await res.json();
            setPaymentData(json);
        } catch (e) { alert('Erro ao gerar PIX'); }
    };

    const copyPix = () => {
        if (paymentData?.copyPaste) {
            navigator.clipboard.writeText(paymentData.copyPaste);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Carregando...</div>;
    if (!data) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-red-400">Pagamento não encontrado ou expirado.</div>;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <Shield className="text-primary-500" size={32} />
                        <span className="text-2xl font-bold text-white">Pagamento Seguro</span>
                    </div>
                </div>

                <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
                        <p className="text-blue-100 text-sm font-medium mb-1">Total a Pagar</p>
                        <h1 className="text-4xl font-bold text-white">R$ {data.price?.toFixed(2)}</h1>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Summary */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400">Cliente</span>
                                <span className="text-white font-medium">{data.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400">Produto</span>
                                <span className="text-white font-medium">{data.productName}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="text-slate-400">Plano</span>
                                <span className="text-white font-medium">{data.planName}</span>
                            </div>
                        </div>

                        {/* Action */}
                        {!paymentData ? (
                            <button
                                onClick={handleGeneratePix}
                                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                            >
                                <CreditCard size={20} /> Pagar com PIX
                            </button>
                        ) : (
                            <div className="animate-fade-in bg-white p-4 rounded-xl">
                                <div className="text-center mb-4">
                                    <p className="text-slate-900 font-bold mb-1">Escaneie o QR Code</p>
                                    <div className="aspect-square bg-slate-200 rounded-lg flex items-center justify-center mb-2 mx-auto w-48">
                                        {/* Placeholder for QR Code Image */}
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${paymentData.copyPaste}`} alt="QR Code" className="w-full h-full" />
                                    </div>
                                </div>

                                <div className="relative">
                                    <input
                                        readOnly
                                        value={paymentData.copyPaste}
                                        className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-600 font-mono pr-10"
                                    />
                                    <button
                                        onClick={copyPix}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-600 p-1 hover:bg-primary-50 rounded"
                                    >
                                        {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>

                                <p className="text-center text-xs text-slate-500 mt-3">
                                    Após o pagamento, sua assinatura será renovada automaticamente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-center mt-6 text-slate-500 text-sm flex items-center justify-center gap-1">
                    <Shield size={14} /> Ambiente criptografado e seguro.
                </div>
            </div>
        </div>
    );
};

export default Checkout;
