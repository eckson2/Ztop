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
        const { provider, instanceId } = req.body; // User chooses provider and name

        // 1. Provision Instance Automagically
        console.log(`[PROVISIONING] ${provider} for user ${req.userId}`);
        const provisioned = await WhatsAppService.provisionInstance(provider, instanceId);

        const data = {
            provider,
            baseUrl: provisioned.baseUrl,
            instanceId: provisioned.instanceId,
            token: encrypt(provisioned.token),
            status: 'disconnected'
        };

        const instance = await prisma.whatsappInstance.upsert({
            where: { userId: req.userId },
            update: data,
            create: { ...data, userId: req.userId }
        });

        res.json({
            message: 'Instância provisionada com sucesso',
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
