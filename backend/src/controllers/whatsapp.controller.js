// Prisma Client singleton
const prisma = require('../utils/prisma');
const { encrypt } = require('../utils/crypto');
const WhatsAppService = require('../services/whatsapp.service');

const getInstance = async (req, res) => {
    try {
        const instance = await prisma.whatsAppInstance.findUnique({
            where: { userId: req.userId }
        });

        if (instance) {
            // Check real-time status if configured (BEFORE masking token)
            if (instance.instanceId && instance.baseUrl) {
                try {
                    const status = await WhatsAppService.getStatus(instance);
                    instance.status = status;

                    // Force Webhook Config on every check if connected
                    // This ensures it survives restarts of the provider
                    if (status === 'connected') {
                        const user = await prisma.user.findUnique({ where: { id: req.userId } });
                        if (user && user.webhookToken) {
                            const webhookUrl = `${process.env.BACKEND_URL || 'https://back.ztop.dev.br'}/api/webhook/whatsapp/${user.id}?token=${user.webhookToken}`;
                            console.log(`[DEBUG] Triggering Auto-Webhook for ${instance.instanceId}`);
                            await WhatsAppService.setWebhook(instance, webhookUrl);
                        }
                    }

                    // Update DB with latest status
                    await prisma.whatsAppInstance.update({
                        where: { id: instance.id },
                        data: { status: status }
                    });
                } catch (e) { console.error('Status Check Error:', e.message); }
            }

            instance.token = '********';
        }

        res.json(instance || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const saveInstance = async (req, res) => {
    try {
        const { provider, instanceId, baseUrl, token } = req.body; // User inputs

        let data = { provider, instanceId, status: 'disconnected' };

        // 1. Manual Connection (User provided URL + Token)
        if (baseUrl && token && token !== '********') {
            console.log(`[MANUAL CONNECT] ${provider} for user ${req.userId}`);
            data.baseUrl = baseUrl;
            data.token = encrypt(token);
            // Optionally we could verify the connection here
        }
        // 2. Auto Provisioning (Only if manual data missing)
        else {
            console.log(`[PROVISIONING] ${provider} for user ${req.userId}`);

            // Generate ID if not provided (Zero Config)
            if (!instanceId) {
                // Generate RANDOM & FRESH ID every time to ensure clean state
                const suffix = Math.random().toString(36).substring(2, 8);
                var finalInstanceId = `instancia-${suffix}`;
                console.log(`[DEBUG] Generated New Random Instance ID: ${finalInstanceId}`);
            } else {
                var finalInstanceId = instanceId;
            }

            console.log('[DEBUG] finalInstanceId sent to provision:', finalInstanceId);
            const provisioned = await WhatsAppService.provisionInstance(provider, finalInstanceId);
            data.baseUrl = provisioned.baseUrl;
            data.instanceId = provisioned.instanceId;
            data.token = encrypt(provisioned.token);
        }

        const instance = await prisma.whatsAppInstance.upsert({
            where: { userId: req.userId },
            update: data,
            create: { ...data, userId: req.userId }
        });

        res.json({
            message: 'Instância salva com sucesso',
            instance: { ...instance, token: '********' }
        });
    } catch (error) {
        console.error('[PROVISION ERROR]', error);
        res.status(500).json({ error: 'Erro ao provisionar instância: ' + error.message });
    }
};

const getConnectQR = async (req, res) => {
    try {
        const instance = await prisma.whatsAppInstance.findUnique({
            where: { userId: req.userId }
        });

        if (!instance) return res.status(404).json({ error: 'Instância não encontrada' });

        const connectData = await WhatsAppService.getConnectData(instance);
        res.json(connectData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const configureWebhook = async (req, res) => {
    try {
        const instance = await prisma.whatsAppInstance.findUnique({
            where: { userId: req.userId }
        });

        if (!instance) return res.status(404).json({ error: 'Instância não encontrada' });

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user || !user.webhookToken) return res.status(400).json({ error: 'Usuário sem token de webhook' });

        const backendUrl = process.env.BACKEND_URL || 'https://back.ztop.dev.br';
        const webhookUrl = `${backendUrl}/api/webhook/whatsapp/${user.id}?token=${user.webhookToken}`;

        console.log(`[MANUAL WEBHOOK] Setting to: ${webhookUrl}`);
        const result = await WhatsAppService.setWebhook(instance, webhookUrl);

        res.json({ success: result, webhookUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteInstance = async (req, res) => {
    try {
        const instance = await prisma.whatsAppInstance.findUnique({
            where: { userId: req.userId }
        });

        if (instance) {
            // Optional: Try to delete from provider (fire and forget)
            try { await WhatsAppService.deleteInstance(instance); } catch (e) {
                console.error('Delete Provider Error:', e.message);
            }

            await prisma.whatsAppInstance.delete({
                where: { userId: req.userId }
            });
        }

        res.json({ message: 'Instância removida com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSettings = async (req, res) => {
    try {
        const instance = await prisma.whatsAppInstance.findUnique({ where: { userId: req.userId } });
        if (!instance) return res.status(404).json({ error: 'Instância não encontrada' });

        await WhatsAppService.updateEvolutionSettings(instance, req.body);
        res.json({ message: 'Configurações atualizadas!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

const updateTypebot = async (req, res) => {
    try {
        const instance = await prisma.whatsAppInstance.findUnique({ where: { userId: req.userId } });
        if (!instance) return res.status(404).json({ error: 'Instância não encontrada' });

        await WhatsAppService.updateEvolutionTypebot(instance, req.body);
        res.json({ message: 'Typebot configurado!' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

module.exports = { getInstance, saveInstance, getConnectQR, configureWebhook, deleteInstance, updateSettings, updateTypebot };
