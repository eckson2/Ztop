// Prisma Client singleton
const ciabraService = require('../services/ciabra.service');

const prisma = require('../utils/prisma');

// Helper to recursively find PIX EMV code (starts with 000201)
function findPixCode(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (typeof obj === 'string' && obj.startsWith('000201')) return obj;

    for (let key in obj) {
        const val = obj[key];
        // Direct key check
        if (['pixCode', 'emv', 'brCode', 'qrCode', 'pixCopyPaste', 'pix_copy_paste'].includes(key) &&
            typeof val === 'string' && val.startsWith('000201')) {
            return val;
        }
        // Recursive check
        if (typeof val === 'object') {
            const found = findPixCode(val);
            if (found) return found;
        }
    }
    return null;
}

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

        // Get installment data 
        const installmentId = invoice.installments?.[0]?.id;

        if (!installmentId) {
            throw new Error('Parcela não encontrada na fatura');
        }

        // Fetch payment details immediately
        const paymentDetails = await ciabraService.getPaymentDetails(installmentId);

        console.log('[SUBSCRIPTION] Payment details fetched. Searching for QR Code...');

        // [FIX] Use Deep Search like in ciabra-pix project
        const emvCode = findPixCode(paymentDetails);

        // Return payment data with guaranteed QR Code
        return res.json({
            success: true,
            invoiceId: invoice.id,
            installmentId: installmentId,
            amount: amount,
            qrCode: null, // Frontend generates from emv
            pixCopyPaste: emvCode || null,
            expiresAt: paymentDetails.dueDate || invoice.installments[0].dueDate
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

        // [DEBUG] Log payment checking to see if status/emv updates
        if (payment && !Array.isArray(payment)) {
            console.log(`[SUBSCRIPTION] Poll Invoice ${invoiceId}: Status=${payment?.pix?.status} EMV=${payment?.pix?.emv ? 'YES' : 'NO'}`);
            if (payment?.pix?.status !== 'GENERATING') {
                console.log(`[SUBSCRIPTION] Full PIX Data:`, JSON.stringify(payment.pix));
            }
        }

        // Check if paid (handle both object and array responses)
        let isPaid = false;
        let pixData = null;

        if (Array.isArray(payment)) {
            isPaid = payment.some(p => p.status === 'CONFIRMED' || p.status === 'PAID');
            // If array, try to find PIX data? Usually array means list of payments. 
            // The log showed object { pix: {...} } so we focus on that.
        } else if (payment && typeof payment === 'object') {
            // Check top-level or nested 'pix'
            if (payment.pix) {
                pixData = payment.pix;
                isPaid = payment.pix.status === 'CONFIRMED' || payment.pix.status === 'PAID';
            } else {
                isPaid = payment.status === 'CONFIRMED' || payment.status === 'PAID';
            }
        }

        if (isPaid) {
            // Update user subscription
            // Fetch current user data to check existing expiration
            const currentUser = await prisma.user.findUnique({ where: { id: userId } });

            const currentDate = new Date();
            let baseDate = currentDate;

            // If user has a valid future expiration, add time to THAT date
            if (currentUser && currentUser.subscriptionExpiresAt && new Date(currentUser.subscriptionExpiresAt) > currentDate) {
                baseDate = new Date(currentUser.subscriptionExpiresAt);
            }

            const newExpirationDate = new Date(baseDate);
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

        // Return updated PIX data for polling (QRCode might appear later)
        // [FIX] Use Deep Search here too
        const emvCode = findPixCode(payment);

        return res.json({
            success: true,
            paid: false,
            message: 'Aguardando pagamento...',
            // Pass updated fields if available
            pixUpdate: emvCode ? {
                qrCode: null, // Frontend generates
                pixCopyPaste: emvCode
            } : null
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
