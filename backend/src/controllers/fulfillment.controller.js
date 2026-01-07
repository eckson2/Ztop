const axios = require('axios');
const https = require('https');
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



        const intentName = req.body.queryResult?.intent?.displayName;
        console.log(`[FULFILLMENT] Processing intent: ${intentName}`);



        let apiResponse;
        let data;

        // 2. Determine API Call based on Panel Type
        if (config.panelType === 'pfast') {
            // PFAST INTEGRATION
            console.log(`[FULFILLMENT] Using Pfast Integration`);

            if (!config.pfastToken || !config.pfastSecret) {
                return res.json({
                    fulfillmentText: 'Token ou Secret do Pfast não configurados.'
                });
            }

            // Generate Random Credentials
            const randomSuffix = Math.floor(Math.random() * 90000) + 10000; // 5 digit random
            const generatedUsername = `user${randomSuffix}`;
            const generatedPassword = `pass${randomSuffix}`;

            const pfastUrl = `https://api.painelcliente.com/trial_create/${config.pfastToken}`;
            const payload = {
                secret: config.pfastSecret,
                username: generatedUsername,
                password: generatedPassword,
                idbouquet: 1 // Default bouquet, maybe make configurable later if needed
            };

            try {
                console.log(`[FULFILLMENT] Calling Pfast: ${pfastUrl}`);
                apiResponse = await axios.post(pfastUrl, payload, {
                    headers: { 'Content-Type': 'application/json' }
                });

                // Standardize Pfast Response
                // Pfast usually returns data directly or in key 'data'
                // Assuming success structure matches generic need or mapping
                const resData = apiResponse.data;
                console.log('[FULFILLMENT] Pfast Response:', JSON.stringify(resData));

                // Map Pfast specific response to our generic data structure
                data = {
                    username: generatedUsername,
                    password: generatedPassword,
                    dns: resData.dns || resData.url || 'http://dns.pfast.com', // Fallback if not provided
                    package: 'Teste 4 horas', // [FIX] Force 4 hours display
                    expiresAtFormatted: '4 Horas', // [FIX] Force 4 hours display
                    payUrl: 'Solicite ao atendente'
                };

                // Check for API error messages
                if (resData.error || resData.status === false) {
                    throw new Error(resData.message || 'Erro na API Pfast');
                }

            } catch (err) {
                console.error('[FULFILLMENT PFAST ERROR]', err.message);
                throw err; // Re-throw to hit the common catch block
            }

        } else {
            // GENERIC POST INTEGRATION (Sigma, Koffice, AutoReply style)
            console.log(`[FULFILLMENT] Calling Generic/Koffice API: ${config.apiUrl}`);

            if (!config.apiUrl) {
                return res.json({
                    fulfillmentText: 'URL de API não configurada no painel.'
                });
            }

            // Extract real data from Dialogflow body
            const originalPayload = req.body.originalDetectIntentRequest?.payload;
            const realMessage = req.body.queryResult?.queryText || 'teste';

            // Try to find the phone number in standard Evolution/WPPConnect payloads
            // Evolution usually sends: data.sender (e.g. 55119999@s.whatsapp.net)
            const remoteJid = originalPayload?.data?.sender || originalPayload?.data?.key?.remoteJid || userId;
            const senderPhone = remoteJid.replace(/\D/g, ''); // Extract just numbers
            const senderName = originalPayload?.data?.pushName || 'Cliente';

            // Construct AutoReply-compatible payload
            // Many panels (like Koffice/OpenGL) expect 'msg'/'message' and 'sender'
            const genericPayload = {
                msg: realMessage,        // Use actual user input (e.g. "teste")
                message: realMessage,    // Alternative
                text: realMessage,       // Some apps use 'text'
                sender: senderPhone,     // Numeric phone
                from: senderPhone,       // Alternative
                name: senderName,
                package: 'com.whatsapp'  // Simulando App real
            };

            try {
                // Ignore SSL errors for panels with self-signed certs
                const httpsAgent = new https.Agent({ rejectUnauthorized: false });

                console.log(`[FULFILLMENT] Sending Generic/Koffice Payload:`, JSON.stringify(genericPayload));

                apiResponse = await axios.post(config.apiUrl, genericPayload, {
                    headers: { 'Content-Type': 'application/json' },
                    httpsAgent
                });
                data = apiResponse.data;
                console.log('[FULFILLMENT] Generic/Koffice Response:', JSON.stringify(data));

            } catch (err) {
                console.error('[FULFILLMENT GENERIC ERROR]', err.response?.data || err.message);
                throw err;
            }
        }

        console.log('[FULFILLMENT] Final Data:', JSON.stringify(data));

        // 3. Parse Template Fields
        const fields = JSON.parse(config.templateFields || '{}');

        // Build Response
        let responseLines = [];

        // Show Name (Customizable)
        responseLines.push(`Nome: ${config.nameField || 'Tops'}`);

        // [NEW] App Name Configurable
        if (fields.appName && config.appName) {
            responseLines.push(`📱 Aplicativo: ${config.appName}`);
        }

        if (fields.username) responseLines.push(`✅ Usuário: ${data.username || data.usuario || 'N/A'}`);
        if (fields.password) responseLines.push(`✅ Senha: ${data.password || data.senha || 'N/A'}`);
        if (fields.dns) responseLines.push(`🌐 DNS: ${data.dns || 'N/A'}`);
        if (fields.plano) responseLines.push(`📦 Plano: ${data.package || data.Plano || data.plano || 'N/A'}`);
        if (fields.vencimento) responseLines.push(`🗓️ Vencimento: ${data.expiresAtFormatted || data.Vencimento || data.vencimento || 'N/A'}`);

        // [NEW] Custom M3U Link with Placeholder Replacement
        if (fields.m3uLink && config.m3uLink) {
            const userVal = data.username || data.usuario || data.user || '';
            const passVal = data.password || data.senha || data.pass || '';

            let m3u = config.m3uLink;
            m3u = m3u.replace(/{username}/g, userVal)
                .replace(/{password}/g, passVal)
                .replace(/{user}/g, userVal)
                .replace(/{pass}/g, passVal);

            responseLines.push(`🟢 Link M3U: ${m3u}`);
        }

        // [NEW] Custom Payment or Default
        if (fields.customPaymentUrl && config.customPaymentUrl) {
            responseLines.push(`💳 Link de Pagamento: ${config.customPaymentUrl}`);
        } else if (fields.pagamento) {
            responseLines.push(`💳 Assinar/Renovar Plano: ${data.payUrl || data['Pagamento Automatico'] || data.pagamento_automatico || 'N/A'}`);
        }

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
