const planLimitMiddleware = async (req, res, next) => {
    // UNLIMITED MESSAGES FOR ALL
    // Feature requested to be disabled.
    next();
};

module.exports = planLimitMiddleware;
