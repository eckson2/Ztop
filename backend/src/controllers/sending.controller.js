const prisma = require('../utils/prisma');

const SendingController = {
    // --- Categories ---
    async listCategories(req, res) {
        try {
            const categories = await prisma.sendingCategory.findMany({
                where: { userId: req.userId },
                include: {
                    rules: { include: { template: true } },
                    _count: { select: { customers: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(categories);
        } catch (e) { return res.status(500).json({ error: e.message }); }
    },

    async createCategory(req, res) {
        try {
            const { name } = req.body;
            const category = await prisma.sendingCategory.create({
                data: { name, userId: req.userId }
            });
            return res.json(category);
        } catch (e) { return res.status(500).json({ error: e.message }); }
    },

    async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { name, active } = req.body;
            const category = await prisma.sendingCategory.update({
                where: { id },
                data: { name, active }
            });
            return res.json(category);
        } catch (e) { return res.status(500).json({ error: e.message }); }
    },

    async deleteCategory(req, res) {
        try {
            await prisma.sendingCategory.delete({ where: { id: req.params.id } });
            return res.json({ success: true });
        } catch (e) { return res.status(500).json({ error: e.message }); }
    },

    // --- Rules ---
    async createRule(req, res) {
        try {
            const { categoryId } = req.params;
            const { templateId, daysOffset, timeToSend, weekDays } = req.body;

            const rule = await prisma.sendingRule.create({
                data: {
                    categoryId,
                    templateId,
                    daysOffset: Number(daysOffset),
                    timeToSend,
                    weekDays
                }
            });
            return res.json(rule);
        } catch (e) { return res.status(500).json({ error: e.message }); }
    },

    async deleteRule(req, res) {
        try {
            await prisma.sendingRule.delete({ where: { id: req.params.id } });
            return res.json({ success: true });
        } catch (e) { return res.status(500).json({ error: e.message }); }
    }
};

module.exports = SendingController;
