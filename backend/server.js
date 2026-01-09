require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

const corsOptions = {
    origin: [process.env.FRONTEND_URL, 'https://ztop.dev.br', 'https://www.ztop.dev.br', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// [DEBUG] Global Request Logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        // Safe log of body (masking sensitive fields)
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '***';
        if (safeBody.token) safeBody.token = '***';
        console.log(`[BODY] ${JSON.stringify(safeBody).substring(0, 500)}`);
    }
    next();
});
// Basic health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Import Routes
const authRoutes = require('./src/routes/auth.routes');
const botRoutes = require('./src/routes/bot.routes');
const waRoutes = require('./src/routes/whatsapp.routes');
const webhookRoutes = require('./src/routes/webhook.routes');
const fulfillmentRoutes = require('./src/routes/fulfillment.routes'); // [NEW] Dialogflow Fulfillment
const autotestRoutes = require('./src/routes/autotest.routes'); // [NEW] AutoTest Config
const subscriptionRoutes = require('./src/routes/subscription.routes'); // [NEW] Subscription
const productRoutes = require('./src/routes/product.routes'); // [NEW] Products (Integrations)
const paymentRoutes = require('./src/routes/payment.routes'); // [NEW] Payment Config
const templateRoutes = require('./src/routes/template.routes'); // [NEW] Templates
const financialRoutes = require('./src/routes/financial.routes'); // [NEW] Financial Logs
const customerRoutes = require('./src/routes/customer.routes'); // [NEW] Customers
const adminRoutes = require('./src/routes/admin.routes');
const metricsRoutes = require('./src/routes/metrics.routes');
const sendingRoutes = require('./src/routes/sending.routes'); // [NEW]
const publicPaymentRoutes = require('./src/routes/public.payment.routes'); // [NEW]

app.use('/api/auth', authRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/whatsapp', waRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/fulfillment', fulfillmentRoutes);
app.use('/api/autotest', autotestRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/sending', sendingRoutes); // [NEW]
app.use('/api/public/checkout', publicPaymentRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 SaaS Bots Backend running on port ${PORT}`);
});

module.exports = { app, prisma };
