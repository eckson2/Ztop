const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                whatsappInstance: { select: { status: true, provider: true } },
                _count: { select: { chatSessions: true } }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // active, inactive

        await prisma.user.update({
            where: { id },
            data: { status }
        });

        res.json({ message: `Status do usuário atualizado para ${status}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { listUsers, toggleUserStatus };
