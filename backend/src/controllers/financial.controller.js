const prisma = require('../utils/prisma');

const FinancialController = {
    // Dashboard Metrics
    async getDashboard(req, res) {
        try {
            const userId = req.userId;
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));

            // Calculate Total Approved (All time)
            const totalApproved = await prisma.financialTransaction.aggregate({
                where: { userId, status: 'approved', type: 'income' },
                _sum: { amount: true }
            });

            // Calculate This Month
            const thisMonth = await prisma.financialTransaction.aggregate({
                where: {
                    userId,
                    status: 'approved',
                    type: 'income',
                    date: { gte: firstDayOfMonth }
                },
                _sum: { amount: true }
            });

            // Calculate Today
            const today = await prisma.financialTransaction.aggregate({
                where: {
                    userId,
                    status: 'approved',
                    type: 'income',
                    date: { gte: startOfDay }
                },
                _sum: { amount: true }
            });

            // Count Pending
            const pendingCount = await prisma.financialTransaction.count({
                where: { userId, status: 'pending' }
            });

            return res.json({
                totalApproved: totalApproved._sum.amount || 0,
                thisMonth: thisMonth._sum.amount || 0,
                today: today._sum.amount || 0,
                pendingCount
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar dados financeiros.' });
        }
    },

    // List Logs (Transactions)
    async getLogs(req, res) {
        try {
            const userId = req.userId;
            const { status, gateway, startDate, endDate } = req.query;

            const where = { userId };
            if (status && status !== 'Todos') where.status = status;
            if (gateway && gateway !== 'Todos') {
                // This logic depends on how we store gateway vs manual method
                // We might need to refine this filter logic
                // For now, simple match
                // where.gateway = gateway; 
            }

            // Date filter implementation omitted for brevity, can add later

            const logs = await prisma.financialTransaction.findMany({
                where,
                orderBy: { date: 'desc' },
                include: {
                    customer: { select: { name: true, phone: true } },
                    manualMethod: true
                },
                take: 50 // Limit for performance
            });

            return res.json(logs);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar logs.' });
        }
    },

    // ====================
    // Manual Methods CRUD
    // ====================

    async listMethods(req, res) {
        try {
            const userId = req.userId;
            const methods = await prisma.manualPaymentMethod.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(methods);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar métodos.' });
        }
    },

    async createMethod(req, res) {
        try {
            const userId = req.userId;
            const { name, type, details } = req.body;

            const method = await prisma.manualPaymentMethod.create({
                data: { userId, name, type, details }
            });
            return res.json(method);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar método.' });
        }
    },

    async deleteMethod(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            await prisma.manualPaymentMethod.deleteMany({ // use deleteMany to allow simple check
                where: { id, userId }
            });
            return res.json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao deletar método.' });
        }
    }
};

module.exports = FinancialController;
