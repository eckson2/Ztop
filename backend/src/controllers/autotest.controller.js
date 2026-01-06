const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get Config
const getConfig = async (req, res) => {
    try {
        const userId = req.userId; // Auth middleware provides this
        let config = await prisma.autoTestConfig.findUnique({
            where: { userId }
        });

        if (!config) {
            // Create default if not exists
            config = await prisma.autoTestConfig.create({
                data: {
                    userId,
                    panelType: 'sigma',
                    nameField: 'Tops',
                    templateFields: JSON.stringify({
                        username: true,
                        password: true,
                        dns: true,
                        plano: true,
                        vencimento: true,
                        pagamento: true
                    })
                }
            });
        }

        return res.json(config);
    } catch (error) {
        console.error('[AUTOTEST CONFIG ERROR]', error);
        return res.status(500).json({ error: 'Erro ao buscar configuração.' });
    }
};

// Update Config
const updateConfig = async (req, res) => {
    try {
        const userId = req.userId;
        let { isEnabled, panelType, apiUrl, nameField, templateFields, pfastToken, pfastSecret } = req.body;

        const config = await prisma.autoTestConfig.upsert({
            where: { userId },
            update: {
                isEnabled,
                panelType,
                apiUrl,
                nameField,
                pfastToken: pfastToken || '',
                pfastSecret: pfastSecret || '',
                templateFields: typeof templateFields === 'string' ? templateFields : JSON.stringify(templateFields)
            },
            create: {
                userId,
                isEnabled,
                panelType,
                apiUrl,
                nameField,
                pfastToken: pfastToken || '',
                pfastSecret: pfastSecret || '',
                templateFields: typeof templateFields === 'string' ? templateFields : JSON.stringify(templateFields)
            }
        });

        return res.json(config);
    } catch (error) {
        console.error('[AUTOTEST UPDATE ERROR]', error);
        return res.status(500).json({ error: 'Erro ao atualizar configuração.' });
    }
};

module.exports = { getConfig, updateConfig };
