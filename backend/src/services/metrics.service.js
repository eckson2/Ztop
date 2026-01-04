const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class MetricsService {
    /**
     * Log a message event
     * @param {string} userId 
     * @param {string} direction 'in' or 'out'
     * @param {string} type 'text', 'image', etc.
     */
    static async logMessage(userId, direction, type = 'text') {
        try {
            await prisma.messageLog.create({
                data: {
                    userId,
                    direction,
                    type
                }
            });
        } catch (error) {
            console.error('[METRICS ERROR] Failed to log message:', error);
        }
    }

    /**
     * Get message count for the current month
     */
    static async getMonthlyCount(userId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return await prisma.messageLog.count({
            where: {
                userId,
                createdAt: {
                    gte: startOfMonth
                }
            }
        });
    }
}

module.exports = MetricsService;
