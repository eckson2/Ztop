const cron = require('node-cron');
const prisma = require('../utils/prisma');
const TemplateProcessor = require('./template.processor');
// const WhatsappService = require('./whatsapp.service'); // Mock import

const BillingService = {
    start() {
        // Run Every Hour (0 * * * *)
        cron.schedule('0 * * * *', async () => {
            const now = new Date();
            console.log(`[Billing] Running Hourly Check: ${now.toLocaleTimeString()}`);
            await this.processHourlyBilling(now);
        });
        console.log('Billing Service Scheduler Started (Hourly)');
    },

    async processHourlyBilling(now) {
        try {
            const currentHour = now.getHours(); // 0-23
            const currentMinute = 0; // Since we run at top of hour
            const formattedTime = `${String(currentHour).padStart(2, '0')}:00`;

            const currentWeekDay = now.getDay(); // 0 (Sun) - 6 (Sat)

            // 1. Find all Active Rules scheduled for THIS HOUR
            // Note: We filter by timeToSend string match "HH:00"
            const rules = await prisma.sendingRule.findMany({
                where: {
                    active: true,
                    timeToSend: formattedTime,
                    category: { active: true } // Only active categories
                },
                include: { category: true, template: true }
            });

            console.log(`[Billing] Found ${rules.length} rules matching ${formattedTime}`);

            for (const rule of rules) {
                // Check Weekday
                if (!rule.weekDays.includes(String(currentWeekDay))) {
                    console.log(`[Billing] Rule ${rule.id} skipped (Weekday mismatch)`);
                    continue;
                }

                await this.executeRule(rule);
            }

        } catch (e) {
            console.error('[Billing] Error:', e);
        }
    },

    async executeRule(rule) {
        if (!rule.template) return;

        // Calculate Target Due Date based on Offset
        // Offset = days relative to DueDate.
        // If Offset = 3 (3 days before), then TargetDueDate = Today + 3
        // If Offset = -3 (3 days late), then TargetDueDate = Today - 3
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + rule.daysOffset);

        // Find Customers in this Category with matching Due Date
        const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate); end.setHours(23, 59, 59, 999);

        const customers = await prisma.customer.findMany({
            where: {
                sendingCategoryId: rule.categoryId,
                dueDate: { gte: start, lte: end },
                // sendWarnings: true // Could verify this too
            },
            include: { plan: true, product: true, apps: true, user: { include: { paymentConfig: true } } }
        });

        if (customers.length === 0) return;

        console.log(`[Billing] Rule ${rule.id} (Offset ${rule.daysOffset}) matched ${customers.length} customers.`);

        for (const customer of customers) {
            try {
                const processedMsg = await TemplateProcessor.process(rule.template.content, customer, {
                    pixKey: customer.user.paymentConfig?.pixKey
                });

                // Send Message
                // await WhatsappService.sendText(customer.phone, processedMsg);
                console.log(`[SIMULATION] Sent to ${customer.name} [${rule.category.name}]:\n${processedMsg.substring(0, 50)}...`);

            } catch (e) {
                console.error(`Failed to send to ${customer.id}`, e);
            }
        }
    }
};

module.exports = BillingService;
