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
        console.log(`[DEBUG] Incoming Webhook for User ${userId}`);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { botConfig: true, whatsappInstance: true }
        });

        if (!user) {
            console.log(`[DEBUG] User ${userId} not found`);
            return res.sendStatus(200);
        }
        if (user.webhookToken !== token) {
            console.log(`[DEBUG] Token mismatch for user ${userId}. Expected: ${user.webhookToken}, Got: ${token}`);
            return res.sendStatus(200);
        }

        if (!user.botConfig || !user.whatsappInstance) {
            return res.sendStatus(200);
        }

        if (user.status !== 'active') return res.sendStatus(200);

        // 2. Normalize Payload
        let remoteJid, text, isMe, isGroup;

        if (user.whatsappInstance.provider === 'evolution') {
            console.log('[DEBUG] Evolution Webhook Payload:', JSON.stringify(body, null, 2));
            const message = body.data;
            if (body.event !== 'MESSAGES_UPSERT') return res.sendStatus(200);
            remoteJid = message.key.remoteJid;
            text = message.message?.conversation || message.message?.extendedTextMessage?.text;
            isMe = message.key.fromMe;
            isGroup = remoteJid && remoteJid.includes('@g.us'); // Evolution messages also need group check
        } else {
            console.log('[DEBUG] UazAPI Webhook Payload:', JSON.stringify(body));

            // UazAPI can send 'message' or 'messages.upsert' depending on version
            // V3 / Universal Format (seen in logs)
            if (body.message && (body.EventType === 'messages' || !body.event)) {
                const msg = body.message;
                remoteJid = msg.chatid || msg.remoteJid;
                text = msg.text || msg.content || msg.conversation;
                isMe = msg.fromMe;
                isGroup = msg.isGroup || (remoteJid && remoteJid.includes('@g.us'));
            }
            // V2 (Evolution-like wrapper)
            else if (body.event === 'messages.upsert' && body.data) {
                // Format v2 similar to Evolution
                const msg = body.data.message || body.data;
                remoteJid = body.data.key?.remoteJid || body.data.jid;
                text = msg.conversation || msg.extendedTextMessage?.text || (typeof body.data.content === 'string' ? body.data.content : '');
                isMe = body.data.key?.fromMe || false;
                isGroup = remoteJid && remoteJid.includes('@g.us');
            }
            else if (body.type === 'message') {
                // Legacy Format
                remoteJid = body.data.from;
                text = body.data.text;
                isMe = body.data.wasSentByApi || false;
                isGroup = remoteJid && remoteJid.includes('@g.us');
            }
            else {
                console.log('[DEBUG] Unknown Payload Format:', JSON.stringify(body));
                return res.sendStatus(200);
            }
        }

        if (isMe || !text || isGroup) return res.sendStatus(200);

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
                // Identify type: formatted object or legacy string
                const content = typeof resp === 'string' ? resp : resp.content;
                const type = typeof resp === 'string' ? 'text' : resp.type;
                const url = typeof resp === 'string' ? null : resp.url;

                if (type === 'text') {
                    if (content) await WhatsAppService.sendMessage(user.whatsappInstance, remoteJid, content);
                } else if (['image', 'video', 'audio', 'document'].includes(type)) {
                    await WhatsAppService.sendMedia(user.whatsappInstance, remoteJid, url, type, content);
                }

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
