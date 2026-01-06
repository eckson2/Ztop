const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autorizado' });
        }

        // Case-insensitive check
        if (req.user.role.toUpperCase() !== requiredRole.toUpperCase()) {
            console.log(`[ROLE] Access Denied. User Role: ${req.user.role}, Required: ${requiredRole}`);
            return res.status(403).json({ error: 'Acesso negado: Permissão insuficiente' });
        }

        next();
    };
};

module.exports = roleMiddleware;
