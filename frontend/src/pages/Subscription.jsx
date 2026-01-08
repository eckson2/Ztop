import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, Loader, Copy, QrCode, Sparkles } from 'lucide-react';
import api from '../api';

const Subscription = () => {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'idle', 'generating', 'waiting', 'success'
    const [paymentData, setPaymentData] = useState(null);
    const [subscriptionInfo, setSubscriptionInfo] = useState(null);
    const [countdown, setCountdown] = useState(0);
    const [copied, setCopied] = useState(false);

    // Fetch subscription status on mount
    useEffect(() => {
        fetchSubscriptionStatus();
    }, []);

    // Polling for payment confirmation
    useEffect(() => {
        let interval;
        if (status === 'waiting' && paymentData) {
            interval = setInterval(async () => {
                await checkPaymentStatus();
                setCountdown(prev => prev + 1);
            }, 5000); // Check every 5 seconds
        }
        return () => clearInterval(interval);
    }, [status, paymentData]);

    const fetchSubscriptionStatus = async () => {
        try {
            const { data } = await api.get('/subscription/status');
            setSubscriptionInfo(data);
        } catch (error) {
            console.error('Erro ao buscar status:', error);
        }
    };

    const generatePix = async () => {
        setLoading(true);
        setStatus('generating');
        try {
            const { data } = await api.post('/subscription/generate-pix');
            setPaymentData(data);
            setStatus('waiting');
        } catch (error) {
            console.error('Erro ao gerar PIX:', error);
            alert('Erro ao gerar pagamento. Tente novamente.');
            setStatus('idle');
        } finally {
            setLoading(false);
        }
    };

    import { QRCodeSVG } from 'qrcode.react'; // Import QR generator

    const Subscription = () => {
        // ... state ...

        // ... useEffects ...

        const checkPaymentStatus = async () => {
            if (!paymentData) return;

            try {
                const { data } = await api.get(`/subscription/check-payment/${paymentData.invoiceId}/${paymentData.installmentId}`);

                if (data.paid) {
                    setStatus('success');
                    fetchSubscriptionStatus();
                } else if (data.pixUpdate) {
                    // Update QR code if it appeared in this poll
                    if ((data.pixUpdate.pixCopyPaste && !paymentData.pixCopyPaste) ||
                        (data.pixUpdate.qrCode && !paymentData.qrCode)) {

                        setPaymentData(prev => ({
                            ...prev,
                            ...data.pixUpdate
                        }));
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar pagamento:', error);
            }
        };

        // ... copyToClipboard ...

        // ... render success ...

        // Payment Waiting Screen
        if (status === 'waiting' && paymentData) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-3xl w-full">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold gradient-text mb-2">Escaneie o QR Code</h1>
                            <p className="text-slate-400">Pagamento de R$ 50,00 - Renovação Mensal</p>
                        </div>

                        <div className="glass p-8 rounded-3xl">
                            {/* QR Code Display */}
                            {paymentData.pixCopyPaste ? (
                                <div className="bg-white p-6 rounded-2xl mb-6 flex justify-center">
                                    {/* Generate QR from EMV string */}
                                    <QRCodeSVG value={paymentData.pixCopyPaste} size={256} />
                                </div>
                            ) : paymentData.qrCode ? (
                                <div className="bg-white p-6 rounded-2xl mb-6 flex justify-center">
                                    <img
                                        src={paymentData.qrCode}
                                        alt="QR Code PIX"
                                        className="max-w-xs w-full"
                                    />
                                </div>
                            ) : (
                                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-blue-500/30 p-8 rounded-2xl mb-6 flex flex-col items-center gap-4 animate-pulse">
                                    <QrCode size={64} className="text-blue-400" />
                                    <p className="text-slate-300 text-center">Gerando QRCode (Aguarde)...</p>
                                </div>
                            )}

                            {/* Pix Copy & Paste */}
                            {paymentData.pixCopyPaste && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Pix Copia e Cola
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={paymentData.pixCopyPaste}
                                            readOnly
                                            className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm font-mono"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className={`px-6 rounded-xl font-bold transition-all ${copied
                                                ? 'bg-green-500 text-white'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Status Banner */}
                            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 p-4 rounded-xl flex items-center gap-3">
                                <Loader className="animate-spin text-blue-400" size={24} />
                                <div className="flex-1">
                                    <p className="text-white font-medium">Aguardando Pagamento...</p>
                                    <p className="text-sm text-slate-400">Verificando automaticamente a cada 5 segundos</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">Tentativas: {Math.floor(countdown / 5)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-center mt-6">
                            <button
                                onClick={() => {
                                    setStatus('idle');
                                    setPaymentData(null);
                                }}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Initial Screen - Generate PIX
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-5xl font-bold gradient-text mb-3 flex items-center justify-center gap-3">
                        <Sparkles className="text-yellow-400" size={40} />
                        Renovar Assinatura
                    </h1>
                    <p className="text-slate-400 text-lg">Mantenha seu acesso ativo renovando agora</p>
                </div>

                {/* Current Status Card */}
                {subscriptionInfo && (
                    <div className="glass p-6 rounded-3xl mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Status Atual</p>
                                <p className={`text-2xl font-bold ${subscriptionInfo.isActive ? 'text-green-400' : 'text-red-400'}`}>
                                    {subscriptionInfo.isActive ? '✅ Ativa' : '❌ Expirada'}
                                </p>
                            </div>
                            {subscriptionInfo.expiresAt && (
                                <div className="text-right">
                                    <p className="text-sm text-slate-400 mb-1">Expira em</p>
                                    <p className="text-lg font-bold text-white">{formatDate(subscriptionInfo.expiresAt)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Pricing Card */}
                <div className="glass p-10 rounded-3xl border-2 border-blue-500/30 mb-6 text-center bg-gradient-to-br from-blue-500/5 to-purple-500/5">
                    <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                        <p className="text-sm font-bold text-white">💎 Plano Mensal</p>
                    </div>

                    <div className="mb-6 flex items-baseline justify-center gap-1">
                        <span className="text-6xl font-black gradient-text">R$ 50</span>
                        <span className="text-3xl font-bold text-slate-400">,00</span>
                        <span className="text-slate-400 text-lg ml-1">por mês</span>
                    </div>

                    <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
                        <div className="flex items-center gap-3 text-slate-300">
                            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                            <span>Acesso ilimitado por 30 dias</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                            <span>Geração automatizada de testes</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                            <span>Integração WhatsApp Premium</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                            <span>Suporte prioritário</span>
                        </div>
                    </div>

                    <button
                        onClick={generatePix}
                        disabled={loading}
                        className="w-full max-w-md mx-auto px-8 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20"
                    >
                        {loading ? (
                            <>
                                <Loader className="animate-spin" size={24} />
                                Gerando PIX...
                            </>
                        ) : (
                            <>
                                <CreditCard size={24} />
                                Gerar PIX para Renovação
                            </>
                        )}
                    </button>
                </div>

                {/* Info Card */}
                <div className="glass bg-white/5 p-6 rounded-2xl border border-white/10">
                    <div className="flex items-start gap-3">
                        <Clock className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <p className="text-white font-medium mb-1">Pagamento instantâneo</p>
                            <p className="text-sm text-slate-400">
                                Após o pagamento via PIX, seu acesso será renovado automaticamente. O sistema verifica o pagamento a cada 5 segundos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    export default Subscription;
