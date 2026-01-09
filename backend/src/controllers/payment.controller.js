const prisma = require('../utils/prisma');
const { encrypt, decrypt } = require('../utils/crypto');

const PaymentController = {
    // Obter configurações de pagamento
    async getSettings(req, res) {
        try {
            const userId = req.userId;
            let config = await prisma.paymentConfig.findUnique({
                where: { userId }
            });

            if (!config) {
                // Create default if not exists
                config = await prisma.paymentConfig.create({
                    data: {
                        userId,
                        activeGateway: 'none',
                        showName: true,
                        showCpf: true,
                        showWhatsapp: true,
                        notifyAdmin: true,
                        notifyClient: true,
                        templateAdmin: `🔔 *Novo Pagamento Recebido!*

👤 *Cliente:* {{customer_name}}
📱 *WhatsApp:* {{customer_whatsapp}}
💰 Valor:  *{{customer_value}}*
📅 *Vencimento:* {{customer_duedate}}
📱 *Servidor:* {{customer_product_name}} 

✅ Pagamento confirmado com sucesso!`,
                        templateClient: `Sua assinatura foi renovada com *SUCESSO*, 
e sua nova data de vencimento é: *{{vencimento}}*
Pontos de Fidelidade: {{total_pontos}} 
{{parabens_resgate}} 

Se possivel salve nosso contato Reserva:
Telefone: 11915872978 (Francisco)

Muito obrigado‼️

Att: TopSuporte`
                    }
                });
            }

            // Hide sensitive data
            const safeConfig = {
                ...config,
                ciabraPrivate: config.ciabraPrivate ? '********' : null
            };

            return res.json(safeConfig);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar configurações de pagamento.' });
        }
    },

    // Atualizar configurações
    async updateSettings(req, res) {
        try {
            const userId = req.userId;
            const {
                activeGateway,
                ciabraPublic,
                ciabraPrivate,
                showName, showCpf, showWhatsapp,
                notifyAdmin, adminPhone, notifyClient,
                templateAdmin, templateClient
            } = req.body;

            const data = {
                activeGateway,
                ciabraPublic,
                showName, showCpf, showWhatsapp,
                notifyAdmin, adminPhone, notifyClient,
                templateAdmin, templateClient
            };

            // Only update private key if provided (and not mask)
            if (ciabraPrivate && ciabraPrivate !== '********') {
                data.ciabraPrivate = encrypt(ciabraPrivate);
            }

            const config = await prisma.paymentConfig.upsert({
                where: { userId },
                update: data,
                create: {
                    userId,
                    ...data
                }
            });

            return res.json(config);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar configurações.' });
        }
    }
};

module.exports = PaymentController;
