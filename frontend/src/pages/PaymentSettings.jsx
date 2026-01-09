import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, DollarSign } from 'lucide-react';

const PaymentSettings = () => {
    const navigate = useNavigate();

    const gateways = [
        { id: 'ciabra', name: 'Ciabra', active: true, icon: 'https://ciabra.com/wp-content/uploads/2021/08/icon-ciabra.png' }, // Placeholder icon if needed or use Lucide
        { id: 'mp', name: 'Mercado Pago', active: false },
        { id: 'asaas', name: 'Asaas', active: false },
        { id: 'pushinpay', name: 'PushinPay', active: false },
        { id: 'gestorpay', name: 'GestorPay', active: false },
        { id: 'fastdepix', name: 'FastDepix', active: false }
    ];

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold gradient-text mb-2">Configurações de Pagamento</h1>
            <p className="text-slate-400 mb-8">Escolha e configure seus métodos de recebimento.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gateways.map((gw) => (
                    <div
                        key={gw.id}
                        onClick={() => gw.active && navigate(`/payments/${gw.id}`)}
                        className={`glass p-6 rounded-3xl border border-white/5 relative group transition-all ${gw.active ? 'cursor-pointer hover:border-primary-500/50 hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-white/5 rounded-xl">
                                <CreditCard size={24} className={gw.active ? "text-primary-400" : "text-slate-500"} />
                            </div>
                            {gw.active && (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold">
                                    Disponível
                                </span>
                            )}
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">{gw.name}</h3>
                        <p className="text-sm text-slate-400">
                            {gw.active ? 'Clique para configurar credenciais e preferências.' : 'Em breve.'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PaymentSettings;
