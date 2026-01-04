const MetricsService = require('../services/metrics.service');

const getMyMetrics = async (req, res) => {
    try {
        const count = await MetricsService.getMonthlyCount(req.userId);

        // Detailed breakdown (optional for now)
        res.json({
            count: count,
            in: Math.floor(count * 0.4), // Mocked breakdown
            out: Math.ceil(count * 0.6)   // Mocked breakdown
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getMyMetrics };
