const prisma = require('../utils/prisma');
const { encrypt } = require('../utils/crypto');

const ProductController = {
    // Listar todos os painéis do usuário
    async list(req, res) {
        try {
            const userId = req.userId;
            const products = await prisma.product.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: { customers: true }
                    }
                }
            });

            // Decrypt or Mask? Better sending masked or just not sending sensitive ones.
            // For now we send as is (encrypted string) or null, UI handles it.
            // Security best practice: Don't send passwords back.
            const safeProducts = products.map(p => ({
                ...p,
                apiPass: p.apiPass ? '********' : null,
                apiToken: p.apiToken ? '********' : null,
                apiSecret: p.apiSecret ? '********' : null,
            }));

            return res.json(safeProducts);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar painéis.' });
        }
    },

    // Criar novo painel
    async create(req, res) {
        try {
            const userId = req.userId;
            const { name, type, serverUrl, apiUser, apiPass, apiToken, apiSecret, autoRenewIPTV } = req.body;

            if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });

            const data = {
                userId,
                name,
                type: type || 'generic',
                serverUrl,
                apiUser,
                autoRenewIPTV: !!autoRenewIPTV
            };

            // Encrypt sensitive fields
            if (apiPass) data.apiPass = encrypt(apiPass);
            if (apiToken) data.apiToken = encrypt(apiToken);
            if (apiSecret) data.apiSecret = encrypt(apiSecret);

            const product = await prisma.product.create({ data });

            return res.json(product);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar painel.' });
        }
    },

    // Atualizar painel
    async update(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const { name, type, serverUrl, apiUser, apiPass, apiToken, apiSecret, autoRenewIPTV } = req.body;

            // Verify ownership
            const existing = await prisma.product.findFirst({ where: { id, userId } });
            if (!existing) return res.status(404).json({ error: 'Painel não encontrado.' });

            const data = {
                name,
                type,
                serverUrl,
                apiUser,
                autoRenewIPTV: !!autoRenewIPTV
            };

            // Only update credentials if provided (non-empty)
            if (apiPass) data.apiPass = encrypt(apiPass);
            if (apiToken) data.apiToken = encrypt(apiToken);
            if (apiSecret) data.apiSecret = encrypt(apiSecret);

            const updated = await prisma.product.update({
                where: { id },
                data
            });

            return res.json(updated);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar painel.' });
        }
    },

    // Remover painel
    async delete(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;

            const existing = await prisma.product.findFirst({ where: { id, userId } });
            if (!existing) return res.status(404).json({ error: 'Painel não encontrado.' });

            await prisma.product.delete({ where: { id } });

            return res.json({ message: 'Painel removido com sucesso.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao remover painel.' });
        }
    }
};

module.exports = ProductController;
