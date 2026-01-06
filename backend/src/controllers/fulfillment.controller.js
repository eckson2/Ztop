const axios = require('axios');

const handleFulfillment = async (req, res) => {
    try {
        console.log('[FULFILLMENT] Incoming Request:', JSON.stringify(req.body));

        const intentName = req.body.queryResult?.intent?.displayName;

        // You can check for specific intents here if needed, or just run for any fulfillment request
        // if (intentName === 'Gerar Teste') { ... }

        console.log(`[FULFILLMENT] Processing intent: ${intentName}`);

        // Call MaxStreaming API
        const apiUrl = 'https://maxstreaming.qpanel.top/api/chatbot/RYAWRk1jlx/o231qzL4qz';

        console.log('[FULFILLMENT] Calling MaxStreaming API...');
        const apiResponse = await axios.post(apiUrl, {}, {
            headers: { 'Content-Type': 'application/json' }
        });

        const data = apiResponse.data;
        console.log('[FULFILLMENT] API Response:', JSON.stringify(data));

        // Format the response text
        // Assuming the API returns keys matching the user's placeholders or similar. 
        // We map them safely.
        const responseText = `Nome: Tops
✅ Usuário: ${data.username || data.usuario || 'N/A'}
✅ Senha: ${data.password || data.senha || 'N/A'}
🌐 DNS: ${data.dns || 'N/A'}
📦 Plano: ${data.Plano || data.plano || 'N/A'}
🗓️ Vencimento: ${data.Vencimento || data.vencimento || 'N/A'}
💳 Assinar/Renovar Plano: ${data['Pagamento Automatico'] || data.pagamento_automatico || 'N/A'}`;

        // Return JSON format required by Dialogflow
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
