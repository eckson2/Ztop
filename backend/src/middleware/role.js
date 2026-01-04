const isAdmin = async (req, res, next) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { role: true }
        });

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado: Requer privilégios de administrador' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Erro ao verificar permissões' });
    }
};

module.exports = { isAdmin };
