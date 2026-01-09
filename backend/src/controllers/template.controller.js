const prisma = require('../utils/prisma');

const MessageTemplateController = {
    // Listar todos os templates
    async list(req, res) {
        try {
            const userId = req.userId;
            const templates = await prisma.messageTemplate.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(templates);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar templates.' });
        }
    },

    // Criar template
    async create(req, res) {
        try {
            const userId = req.userId;
            const { name, content, type, mediaUrl } = req.body;

            if (!name || !content) {
                return res.status(400).json({ error: 'Nome e conteúdo são obrigatórios.' });
            }

            const template = await prisma.messageTemplate.create({
                data: {
                    userId,
                    name,
                    content,
                    type: type || 'general',
                    mediaUrl
                }
            });
            return res.json(template);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar template.' });
        }
    },

    // Atualizar template
    async update(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const { name, content, type, mediaUrl } = req.body;

            const template = await prisma.messageTemplate.findFirst({ where: { id, userId } });
            if (!template) return res.status(404).json({ error: 'Template não encontrado.' });

            const updated = await prisma.messageTemplate.update({
                where: { id },
                data: { name, content, type, mediaUrl }
            });
            return res.json(updated);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar template.' });
        }
    },

    // Deletar template
    async delete(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;

            const template = await prisma.messageTemplate.findFirst({ where: { id, userId } });
            if (!template) return res.status(404).json({ error: 'Template não encontrado.' });

            await prisma.messageTemplate.delete({ where: { id } });
            return res.json({ message: 'Template removido com sucesso.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao remover template.' });
        }
    }
};

module.exports = MessageTemplateController;
