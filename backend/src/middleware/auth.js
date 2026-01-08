const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        console.log('[AUTH] No Authorization header provided');
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    try {
        if (!process.env.JWT_SECRET) {
            console.error('[CRITICAL] JWT_SECRET is missing in environment variables!');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;

        // Fetch user context for role checking
        // Prisma Client singleton
        const prisma = require('../utils/prisma');

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }
        });

        if (!user) {
            console.log(`[AUTH] User not found for ID: ${decoded.userId}`);
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }

        req.user = user;
        console.log(`[AUTH] Success for User: ${user.email} (${user.role})`);
        next();
    } catch (err) {
        console.log(`[AUTH] Invalid Token: ${err.message}`);
        return res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = authMiddleware;
