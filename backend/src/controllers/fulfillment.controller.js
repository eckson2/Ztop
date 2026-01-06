const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleFulfillment = async (req, res) => {
    const { userId } = req.params;

    try {
        console.log(`[FULFILLMENT] Request for User: ${userId}`);

        // 1. Fetch User Config
        const config = await prisma.autoTestConfig.findUnique({
            where: { userId }
        });

        if (!config || !config.isEnabled) {
            console.log('[FULFILLMENT] AutoTest disabled or not configured for user.');
            return res.json({
                fulfillmentText: 'O teste automático não está configurado ou ativado no momento.'
            });
        }

        if (!config.apiUrl) {
            return res.json({
                fulfillmentText: 'URL de API não configurada no painel.'
            });
        }

        const intentName = req.body.queryResult?.intent?.displayName;
        console.log(`[FULFILLMENT] Processing intent: ${intentName}`);

        // 2. Call User's Configured API
        console.log(`[FULFILLMENT] Calling API: ${config.apiUrl}`);

        let apiResponse;
        try {
            apiResponse = await axios.post(config.apiUrl, {}, {
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (apiError) {
            console.error('[FULFILLMENT API ERROR]', apiError.message);
            // Increment Failure Count
            await prisma.autoTestConfig.update({
                where: { userId },
                data: { failedCount: { increment: 1 } }
            });
            throw new Error('Falha na comunicação com o servidor de teste.');
        }

        const data = apiResponse.data;
        console.log('[FULFILLMENT] API Response:', JSON.stringify(data));

        // 3. Parse Template Fields
        const fields = JSON.parse(config.templateFields || '{}');

        // Build Response
        let responseLines = [];

        // Always show "Nome" (as requested by user logic, though not in DB config, it's static/manual usually or hardcoded for now)
        // The user said "Nome: Tops" hardcoded, but also "campo nome deverá o usuario preencher manualmente". 
        // For now I will keep "Nome: Tops" or generic, but ideally this "Nome" should probably be in the DB too.
        // I'll leave "Nome: Tops" as standard header for now based on previous request or maybe just omit if not requested?
        // Let's assume standard header.
        responseLines.push('Nome: Tops');

        if (fields.username) responseLines.push(`✅ Usuário: ${data.username || data.usuario || 'N/A'}`);
        if (fields.password) responseLines.push(`✅ Senha: ${data.password || data.senha || 'N/A'}`);
        if (fields.dns) responseLines.push(`🌐 DNS: ${data.dns || 'N/A'}`);
        if (fields.plano) responseLines.push(`📦 Plano: ${data.Plano || data.plano || 'N/A'}`);
        if (fields.vencimento) responseLines.push(`🗓️ Vencimento: ${data.Vencimento || data.vencimento || 'N/A'}`);
        if (fields.pagamento) responseLines.push(`💳 Assinar/Renovar Plano: ${data['Pagamento Automatico'] || data.pagamento_automatico || 'N/A'}`);

        const responseText = responseLines.join('\n');

        // 4. Update Success Stats
        await prisma.autoTestConfig.update({
            where: { userId },
            data: { generatedCount: { increment: 1 } }
        });

        // Return to Dialogflow
        return res.json({
            fulfillmentText: responseText
        });

    } catch (error) {
        console.error('[FULFILLMENT ERROR]', error.message);
        return res.json({
            fulfillmentText: 'Desculpe, ocorreu um erro ao gerar o teste. Tente novamente mais tarde.'
        });
    }
};

module.exports = { handleFulfillment };
