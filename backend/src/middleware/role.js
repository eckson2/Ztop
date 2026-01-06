const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        // [DEBUG] Log role check details
        console.log(`[ROLE_CHECK] User: ${req.user?.email} | Role: ${req.user?.role} | Required: ${requiredRole}`);

        if (!req.user) {
            console.log('[ROLE_CHECK] Failed: No user attached to request');
            return res.status(401).json({ error: 'Não autorizado' });
        }

        // Case-insensitive check
        if (!req.user.role || req.user.role.toUpperCase() !== requiredRole.toUpperCase()) {
            console.log(`[ROLE_CHECK] Access Denied. User Role: ${req.user.role}, Required: ${requiredRole}`);
            return res.status(403).json({ error: 'Acesso negado: Permissão insuficiente' });
        }

        next();
    };
};

module.exports = roleMiddleware;
