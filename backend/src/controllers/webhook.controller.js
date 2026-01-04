const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const DialogflowService = require('../services/dialogflow.service');
const TypebotService = require('../services/typebot.service');
const WhatsAppService = require('../services/whatsapp.service');
const MetricsService = require('../services/metrics.service');

const handleWebhook = async (req, res) => {
    try {
        const { userId } = req.params;
        const { token } = req.query;
        const body = req.body;

        // 1. Identify User and Configs
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { botConfig: true, whatsappInstance: true }
        });

        if (!user || user.webhookToken !== token) {
            return res.sendStatus(200); // Silent ignore/unauthorized
        }

        if (!user.botConfig || !user.whatsappInstance) {
            return res.sendStatus(200);
        }

        if (user.status !== 'active') return res.sendStatus(200);

        // 2. Normalize Payload
        let remoteJid, text, isMe;

        if (user.whatsappInstance.provider === 'evolution') {
            const message = body.data;
            if (body.event !== 'MESSAGES_UPSERT') return res.sendStatus(200);
            remoteJid = message.key.remoteJid;
            text = message.message?.conversation || message.message?.extendedTextMessage?.text;
            isMe = message.key.fromMe;
        } else {
            if (body.type !== 'message') return res.sendStatus(200);
            remoteJid = body.data.from;
            text = body.data.text;
            isMe = body.data.wasSentByApi || false;
        }

        if (isMe || !text) return res.sendStatus(200);

        // 3. Log Inbound Message
        await MetricsService.logMessage(user.id, 'in');

        // 4. Process with Active Engine
        let responses = [];
        try {
            if (user.botConfig.botType === 'dialogflow') {
                responses = await DialogflowService.getResponse(user.botConfig, remoteJid, text);
            } else if (user.botConfig.botType === 'typebot') {
                responses = await TypebotService.getResponse(user.botConfig, user.id, remoteJid, text);
            }
        } catch (botError) {
            console.error('[BOT ERROR]', botError.message);
        }

        // 5. Send Responses back to WhatsApp
        if (responses && responses.length > 0) {
            for (const resp of responses) {
                await WhatsAppService.sendMessage(user.whatsappInstance, remoteJid, resp);
                // 6. Log Outbound Message
                await MetricsService.logMessage(user.id, 'out');
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('[WEBHOOK ERROR]', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { handleWebhook };
