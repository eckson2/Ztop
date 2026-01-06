require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

const corsOptions = {
    origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const botRoutes = require('./src/routes/bot.routes');
const waRoutes = require('./src/routes/whatsapp.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const adminRoutes = require('./src/routes/admin.routes');
const metricsRoutes = require('./src/routes/metrics.routes');

app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/whatsapp', waRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/metrics', metricsRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SaaS Bots Backend running on port ${PORT}`);
});

module.exports = { app, prisma };
