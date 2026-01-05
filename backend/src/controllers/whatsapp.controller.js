const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { encrypt } = require('../utils/crypto');
const WhatsAppService = require('../services/whatsapp.service');

const getInstance = async (req, res) => {
    try {
        const instance = await prisma.whatsappInstance.findUnique({
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
            const provisioned = await WhatsAppService.provisionInstance(provider, instanceId);
            data.baseUrl = provisioned.baseUrl;
            data.instanceId = provisioned.instanceId;
            data.token = encrypt(provisioned.token);
        }

        const instance = await prisma.whatsappInstance.upsert({
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
        const instance = await prisma.whatsappInstance.findUnique({
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
