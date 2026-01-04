import React, { useState, useEffect } from 'react';
import api from '../api';
import { RefreshCw, Smartphone, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Instances = () => {
    const [instance, setInstance] = useState(null);
    const [qr, setQr] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInstance();
    }, []);

    const loadInstance = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/whatsapp');
            setInstance(data);
            if (data.status === 'disconnected') fetchQr();
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const fetchQr = async () => {
        try {
            const { data } = await api.get('/whatsapp/qr');
            setQr(data.base64 || data.qrcode || data.code);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-bold gradient-text">Conexão WhatsApp</h1>
                    <p className="text-slate-400 mt-2">Gerencie sua instância e status de conexão</p>
                </div>
                <button
                    onClick={loadInstance}
                    className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-300"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {!instance ? (
                <div className="glass p-12 text-center rounded-3xl">
                    <Smartphone size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-xl font-bold">Nenhuma instância configurada</h3>
                    <p className="text-slate-400 mt-2 mb-6">Você precisa configurar seu bot primeiro.</p>
                    <button onClick={() => window.location.href = '/setup'} className="px-6 py-3 bg-primary-500 rounded-xl font-bold">Configurar Agora</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status Card */}
                    <div className="glass p-8 rounded-3xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-slate-900 rounded-2xl">
                                    <Smartphone size={24} className="text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{instance.instanceId}</h3>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{instance.provider}</p>
                                </div>
                            </div>

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${instance.status === 'connected' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                {instance.status === 'connected' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {instance.status === 'connected' ? 'Conectado' : 'Desconectado'}
                            </div>
                        </div>

                        <div className="mt-10 pt-6 border-t border-white/5">
                            <p className="text-xs text-slate-500 mb-2">Server URL</p>
                            <code className="text-xs break-all text-slate-300 bg-black/30 p-2 rounded block">{instance.baseUrl}</code>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center min-h-[400px]">
                        {instance.status === 'connected' ? (
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="text-xl font-bold">Tudo Pronto!</h3>
                                <p className="text-slate-400 text-sm max-w-[200px] mx-auto">Seu WhatsApp está emparelhado e pronto para responder.</p>
                            </div>
                        ) : qr ? (
                            <div className="text-center space-y-6">
                                <h3 className="text-xl font-bold">Escaneie o QR Code</h3>
                                <div className="p-4 bg-white rounded-3xl shadow-2xl shadow-primary-500/20">
                                    {qr.startsWith('http') || qr.length > 500 ? (
                                        <img src={qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`} alt="QR" className="w-64 h-64 rounded-xl" />
                                    ) : (
                                        <QRCodeSVG value={qr} size={256} className="rounded-xl" />
                                    )}
                                </div>
                                <p className="text-slate-400 text-xs">Abra o WhatsApp > Aparelhos Conectados</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <RefreshCw size={40} className="animate-spin text-primary-500 mx-auto mb-4" />
                                <p className="text-slate-400">Gerando QR Code...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Instances;
