const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
                // Use stable ID based on User ID to avoid "phantom" instances on retries
                // Take last 6 chars of userId to keep it short but unique to the user
                const suffix = req.userId.slice(-6);
                var finalInstanceId = `instancia-${suffix}`;
                console.log(`[DEBUG] Generated stable Instance ID: ${finalInstanceId}`);
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

module.exports = { getInstance, saveInstance, getConnectQR };
