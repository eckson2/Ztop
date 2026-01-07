const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const WhatsAppService = require('../services/whatsapp.service');
const axios = require('axios');
const { decrypt } = require('../utils/crypto');

// Get active chats (latest sessions)
const getActiveChats = async (req, res) => {
    try {
        const userId = req.user.id;
        const chats = await prisma.chatSession.findMany({
            where: { userId },
            orderBy: { lastInteraction: 'desc' },
            take: 50
        });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Toggle Bot Status (Handoff)
const toggleBot = async (req, res) => {
    try {
        const userId = req.user.id;
        const { remoteJid, status } = req.body; // status: true (bot) or false (human)

        const chat = await prisma.chatSession.upsert({
            where: {
                userId_remoteJid: { userId, remoteJid }
            },
            update: {
                isBotActive: status,
                lastStatusChange: new Date()
            },
            create: {
                userId,
                remoteJid,
                isBotActive: status,
                lastStatusChange: new Date()
            }
        });

        console.log(`[HANDOFF] User ${userId} toggled bot for ${remoteJid} to ${status}`);
        res.json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Send Manual Message
const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { remoteJid, text } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { whatsappInstance: true }
        });

        if (!user.whatsappInstance) {
            return res.status(400).json({ error: "WhatsApp não conectado" });
        }

        await WhatsAppService.sendMessage(user.whatsappInstance, remoteJid, text);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Proxy History (Validation + Fetch from Ext API)
const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { remoteJid, limit = 20 } = req.query;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { whatsappInstance: true }
        });

        if (!user || !user.whatsappInstance) {
            return res.json([]);
        }

        const instance = user.whatsappInstance;
        const token = decrypt(instance.token);
        const baseUrl = instance.baseUrl.replace(/\/$/, '');
        const headers = { 'apikey': token };

        // [LOGIC] Determine Provider and call History Endpoint
        let messages = [];

        if (instance.provider === 'evolution') {
            // Evolution: /chat/findMessages/{instance}
            try {
                const response = await axios.post(`${baseUrl}/chat/findMessages/${instance.instanceId}`, {
                    where: {
                        key: { remoteJid: remoteJid }
                    },
                    options: {
                        limit: parseInt(limit),
                        sort: 'DESC' // Latest first
                    }
                }, { headers });

                // Normalize Evolution Data
                messages = (response.data.messages || []).map(m => ({
                    key: m.key,
                    message: m.message,
                    fromMe: m.key.fromMe,
                    timestamp: m.messageTimestamp
                })).reverse(); // Oldest top
            } catch (e) {
                console.log(`[PROXY] Evolution History Failed: ${e.message}`);
            }
        } else {
            // UazAPI: /chat/history (If available, otherwise return empty)
            // Note: UazAPI might store sqlit locally on its container.
            // Attempt generic fetch if endpoint exists
        }

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getActiveChats,
    toggleBot,
    sendMessage,
    getHistory
};
