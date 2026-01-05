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
            instance.token = '********';
            // Optionally get real-time connection status here
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
                const random = Math.floor(Math.random() * 10000);
                // Assign to the 'let' variable extracted above, but since we modify it, better re-assign or use a new var.
                // Actually 'instanceId' is a const from destructuring? No, destructuring creates let/const based on context? 
                // Ah, 'const { ... }'. We need to supply it to provisionInstance.
                var finalInstanceId = `instancia-${random}`;
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
