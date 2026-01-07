const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const DialogflowService = require('../services/dialogflow.service');
const TypebotService = require('../services/typebot.service');
const WhatsAppService = require('../services/whatsapp.service');
const MetricsService = require('../services/metrics.service');

const handleWebhook = async (req, res) => {
    try {
        try {
            const { userId } = req.params;
            let { token } = req.query;

            // [EVOLUTION FIX] Strip event name if appended to token (e.g., token=XYZ/messages-upsert)
            if (token && token.includes('/')) {
                token = token.split('/')[0];
            }

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

            // [AUTH FIX] Use startsWith to handle Evolution appending /event-name to token
            // e.g. token=XYZ becomes token=XYZ/messages-upsert
            if (!token || !token.startsWith(user.webhookToken)) {
                console.log(`[DEBUG] Token mismatch for user ${userId}`);
                return res.sendStatus(200);
            }

            if (!user.botConfig || !user.whatsappInstance) {
                return res.sendStatus(200);
            }

            if (user.status !== 'active') return res.sendStatus(200);

            // 2. Normalize Payload
            let remoteJid, text, isMe, isGroup;

            if (user.whatsappInstance.provider === 'evolution') {
                // support various event casings
                const allowedEvents = ['MESSAGES_UPSERT', 'messages.upsert', 'messages_upsert'];

                // Only log if it's NOT a message event (to reduce noise) but keep errors visible
                if (!allowedEvents.includes(body.event)) {
                    // console.log(`[DEBUG] Ignored event: ${body.event}`);
                    return res.sendStatus(200);
                }

                console.log(`[DEBUG] Processing Evolution Event: ${body.event}`);

                const message = body.data;

                // Check if it's a valid message object
                if (!message || !message.key) {
                    console.log('[DEBUG] Evolution: No message key found in data');
                    return res.sendStatus(200);
                }

                remoteJid = message.key.remoteJid;
                text = message.message?.conversation || message.message?.extendedTextMessage?.text;
                isMe = message.key.fromMe;
                isGroup = remoteJid && remoteJid.includes('@g.us'); // Evolution messages also need group check
            } else {
                console.log('[DEBUG] UazAPI Webhook Payload:', JSON.stringify(body));

                // [FIX] Ignore status updates/read receipts to prevent log spam
                if (body.EventType === 'messages_update' || body.type === 'ReadReceipt' || body.event?.Type === 'Read' || body.event?.Type === 'Delivered') {
                    return res.sendStatus(200);
                }

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

            // [HANDOFF] Check/Create Chat Session
            let chatSession = await prisma.chatSession.findUnique({
                where: {
                    userId_remoteJid: { userId: user.id, remoteJid: remoteJid }
                }
            });

            if (!chatSession) {
                chatSession = await prisma.chatSession.create({
                    data: {
                        userId: user.id,
                        remoteJid: remoteJid,
                        isBotActive: true
                    }
                });
            }

            // Update last interaction
            await prisma.chatSession.update({
                where: { id: chatSession.id },
                data: { lastInteraction: new Date() }
            });

            // [HANDOFF] If Bot is Paused (Human mode), stop here.
            if (!chatSession.isBotActive) {
                console.log(`[HANDOFF] Bot paused for ${remoteJid}. Message ignored by bot engine.`);
                return res.sendStatus(200);
            } else {
                console.log(`[DEBUG] Bot ACTIVE for ${remoteJid}. Proceeding to engine.`);
            }

            let responses = [];
            try {
                if (user.botConfig.botType === 'dialogflow') {
                    console.log(`[DEBUG] Calling Dialogflow Service for ${remoteJid}...`);
                    responses = await DialogflowService.getResponse(user.botConfig, remoteJid, text);
                    console.log(`[DEBUG] Dialogflow Responses:`, JSON.stringify(responses));
                } else if (user.botConfig.botType === 'typebot') {
                    responses = await TypebotService.getResponse(user.botConfig, user.id, remoteJid, text);
                } else {
                    console.log(`[DEBUG] Unknown Bot Type: ${user.botConfig.botType}`);
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
