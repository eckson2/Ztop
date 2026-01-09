const prisma = require('../utils/prisma');

const PublicPaymentController = {
    // Get Client Info (Public - Safe Data Only)
    async getInfo(req, res) {
        try {
            const { id } = req.params;

            const customer = await prisma.customer.findUnique({
                where: { id },
                include: {
                    product: { select: { name: true } },
                    plan: { select: { name: true, price: true } }
                }
            });

            if (!customer) {
                return res.status(404).json({ error: 'Cliente não encontrado.' });
            }

            // Return only safe info needed for checkout
            return res.json({
                id: customer.id,
                name: customer.name,
                productName: customer.product?.name || 'Assinatura',
                planName: customer.plan?.name || 'Plano Padrão',
                price: customer.plan?.price || 0,
                dueDate: customer.dueDate
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar dados.' });
        }
    },

    // Process Payment (Generate PIX)
    async process(req, res) {
        try {
            const { id } = req.params;
            // In a real scenario, this would call MercadoPago or Ciabra to generate a dynamic PIX
            // For now, we will mock it or use the static PIX key if available in PaymentConfig

            const customer = await prisma.customer.findUnique({ where: { id } });
            if (!customer) return res.status(404).json({ error: 'Cliente não encontrado.' });

            // Find the user (admin) who owns this customer to get their payment config
            const paymentConfig = await prisma.paymentConfig.findUnique({
                where: { userId: customer.userId }
            });

            // Mock Response for now
            // TODO: Integrate actual Ciabra/MP generation here
            const mockPixCode = "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913Top TVS Ltda6008Brasilia62070503***6304ABCD";

            return res.json({
                qrCode: mockPixCode,
                qrCodeBase64: null, // If we had one
                copyPaste: mockPixCode,
                value: customer.planId ? 35.00 : 0 // Should fetch from plan
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao processar pagamento.' });
        }
    }
};

module.exports = PublicPaymentController;
