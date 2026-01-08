const { PrismaClient } = require('@prisma/client');
const ciabraService = require('../services/ciabra.service');

const prisma = new PrismaClient();

/**
 * Generate PIX payment for subscription renewal
 */
const generatePix = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Fixed amount: R$ 50.00
        const amount = 50.00;

        console.log(`[SUBSCRIPTION] Generating PIX for user ${user.name} (${user.email})`);

        // 1. Create customer in Ciabra
        const customer = await ciabraService.createCustomer(user.name);
        console.log(`[SUBSCRIPTION] Customer created: ${customer.id}`);

        // 2. Create invoice
        const invoice = await ciabraService.createPixInvoice(
            customer.id,
            amount,
            'ZTop - Renovação Mensal'
        );
        console.log(`[SUBSCRIPTION] Invoice created: ${invoice.id}`);

        // Get installment data for QR Code
        const installment = invoice.installments?.[0];

        if (!installment) {
            throw new Error('Parcela não encontrada na fatura');
        }

        // Return payment data
        return res.json({
            success: true,
            invoiceId: invoice.id,
            installmentId: installment.id,
            amount: amount,
            qrCode: installment.pixQrCode || null,
            pixCopyPaste: installment.pixCopyPaste || null,
            expiresAt: installment.dueDate
        });

    } catch (error) {
        console.error('[SUBSCRIPTION] Error generating PIX:', error);
        return res.status(500).json({
            error: 'Erro ao gerar pagamento PIX',
            details: error.message
        });
    }
};

/**
 * Check payment status and renew subscription if paid
 */
const checkPayment = async (req, res) => {
    try {
        const userId = req.user.id;
        const { invoiceId, installmentId } = req.params;

        console.log(`[SUBSCRIPTION] Checking payment for invoice ${invoiceId}`);

        // Get payment details
        const payment = await ciabraService.getPaymentDetails(installmentId);

        // Check if paid
        const isPaid = payment.some(p => p.status === 'CONFIRMED' || p.status === 'PAID');

        if (isPaid) {
            // Update user subscription
            const currentDate = new Date();
            const newExpirationDate = new Date(currentDate);
            newExpirationDate.setMonth(newExpirationDate.getMonth() + 1); // Add 1 month

            await prisma.user.update({
                where: { id: userId },
                data: {
                    subscriptionExpiresAt: newExpirationDate,
                    lastRenewalAt: currentDate,
                    expirationDate: newExpirationDate // Update legacy field too
                }
            });

            console.log(`[SUBSCRIPTION] User ${userId} renewed until ${newExpirationDate}`);

            return res.json({
                success: true,
                paid: true,
                message: 'Pagamento confirmado! Seu acesso foi renovado com sucesso.',
                expiresAt: newExpirationDate
            });
        }

        return res.json({
            success: true,
            paid: false,
            message: 'Aguardando pagamento...'
        });

    } catch (error) {
        console.error('[SUBSCRIPTION] Error checking payment:', error);
        return res.status(500).json({
            error: 'Erro ao verificar pagamento',
            details: error.message
        });
    }
};

/**
 * Get current subscription status
 */
const getSubscriptionStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                subscriptionExpiresAt: true,
                lastRenewalAt: true,
                expirationDate: true
            }
        });

        const expiresAt = user.subscriptionExpiresAt || user.expirationDate;
        const isActive = expiresAt ? new Date(expiresAt) > new Date() : false;

        return res.json({
            success: true,
            isActive,
            expiresAt,
            lastRenewalAt: user.lastRenewalAt
        });

    } catch (error) {
        console.error('[SUBSCRIPTION] Error getting status:', error);
        return res.status(500).json({
            error: 'Erro ao buscar status da assinatura'
        });
    }
};

module.exports = {
    generatePix,
    checkPayment,
    getSubscriptionStatus
};
