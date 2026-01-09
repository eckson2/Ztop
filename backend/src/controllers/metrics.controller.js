const prisma = require('../utils/prisma');

const MetricsController = {
    async getDashboard(req, res) {
        try {
            const userId = req.userId;
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));

            // 1. KPIs
            const [
                totalCustomers,
                activeCustomers,
                expiredCustomers,
                revenueAllTime,
                revenueMonth,
                revenueToday
            ] = await Promise.all([
                prisma.customer.count({ where: { userId } }),
                prisma.customer.count({ where: { userId, dueDate: { gte: new Date() } } }),
                prisma.customer.count({ where: { userId, dueDate: { lt: new Date() } } }),

                // Revenue
                prisma.financialTransaction.aggregate({ where: { userId, status: 'approved', type: 'income' }, _sum: { amount: true } }),
                prisma.financialTransaction.aggregate({ where: { userId, status: 'approved', type: 'income', date: { gte: firstDayOfMonth } }, _sum: { amount: true } }),
                prisma.financialTransaction.aggregate({ where: { userId, status: 'approved', type: 'income', date: { gte: startOfDay } }, _sum: { amount: true } })
            ]);

            // 2. Charts: Customers by Product (Server)
            const customersByProduct = await prisma.customer.groupBy({
                by: ['productId'],
                where: { userId },
                _count: { id: true }
            });
            // Hydrate names
            const products = await prisma.product.findMany({ where: { userId }, select: { id: true, name: true } });
            const productMap = products.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {});

            const serverChartData = customersByProduct.map(item => ({
                name: productMap[item.productId] || 'Outros',
                value: item._count.id
            }));

            // 3. Charts: Sales Last 30 Days
            // This is a simplified version. For production consider better aggregation.
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentTransactions = await prisma.financialTransaction.findMany({
                where: { userId, status: 'approved', type: 'income', date: { gte: thirtyDaysAgo } },
                orderBy: { date: 'asc' }
            });

            // Group by day
            const salesMap = {};
            recentTransactions.forEach(t => {
                const day = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                salesMap[day] = (salesMap[day] || 0) + t.amount;
            });

            const salesChartData = Object.keys(salesMap).map(day => ({ name: day, value: salesMap[day] }));

            // 4. Expiring Soon (Next 7 days)
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);

            const expiringSoon = await prisma.customer.findMany({
                where: {
                    userId,
                    dueDate: {
                        gte: new Date(),
                        lte: nextWeek
                    }
                },
                orderBy: { dueDate: 'asc' },
                take: 5,
                include: { product: { select: { name: true } } }
            });

            return res.json({
                kpi: {
                    total: totalCustomers,
                    active: activeCustomers,
                    expired: expiredCustomers,
                    revenue: {
                        total: revenueAllTime._sum.amount || 0,
                        month: revenueMonth._sum.amount || 0,
                        today: revenueToday._sum.amount || 0
                    }
                },
                charts: {
                    servers: serverChartData,
                    sales: salesChartData
                },
                lists: {
                    expiring: expiringSoon
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao carregar dashboard.' });
        }
    }
};

module.exports = MetricsController;
