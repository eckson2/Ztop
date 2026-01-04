const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { encrypt, decrypt } = require('../utils/crypto');

const getConfig = async (req, res) => {
    try {
        const config = await prisma.botConfig.findUnique({
            where: { userId: req.userId }
        });

        if (config && config.typebotToken) config.typebotToken = '********';
        // We don't return the full dialogflowJson either
        if (config && config.dialogflowJson) config.dialogflowJson = '********';

        res.json(config || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const saveConfig = async (req, res) => {
    try {
        const { botType, dialogflowProjectId, dialogflowJson, dialogflowLang, typebotId, typebotToken } = req.body;

        const data = {
            botType,
            dialogflowProjectId,
            dialogflowLang: dialogflowLang || 'pt-BR',
            typebotId
        };

        if (dialogflowJson && dialogflowJson !== '********') {
            data.dialogflowJson = encrypt(typeof dialogflowJson === 'string' ? dialogflowJson : JSON.stringify(dialogflowJson));
        }

        if (typebotToken && typebotToken !== '********') {
            data.typebotToken = encrypt(typebotToken);
        }

        const config = await prisma.botConfig.upsert({
            where: { userId: req.userId },
            update: data,
            create: { ...data, userId: req.userId }
        });

        res.json({ message: 'Configuração salva com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getConfig, saveConfig };
