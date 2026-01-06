const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ error: 'Acesso negado: Permissão insuficiente' });
        }

        next();
    };
};

module.exports = roleMiddleware;
