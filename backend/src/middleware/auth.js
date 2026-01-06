const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
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
        console.log(`[AUTH] Success for UserID: ${req.userId}`);
        next();
    } catch (err) {
        console.log(`[AUTH] Invalid Token: ${err.message}`);
        return res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = authMiddleware;
