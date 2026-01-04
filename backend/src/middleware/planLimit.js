const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const MetricsService = require('../services/metrics.service');

const PLAN_LIMITS = {
    'free': 1000,
    'pro': 50000,
    'enterprise': 9999999
};

const planLimitMiddleware = async (req, res, next) => {
    try {
        const userId = req.userId || req.params.userId;
        if (!userId) return next();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { plan: true }
        });

        if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

        const count = await MetricsService.getMonthlyCount(userId);
        const limit = PLAN_LIMITS[user.plan] || PLAN_LIMITS['free'];

        if (count >= limit) {
            return res.status(403).json({
                error: 'Limite do plano atingido',
                current: count,
                limit
            });
        }

        next();
    } catch (error) {
        console.error('[LIMIT MIDDLEWARE ERROR]', error);
        next(); // Allow on failure to prevent blocking service, but log it
    }
};

module.exports = planLimitMiddleware;
