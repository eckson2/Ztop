const axios = require('axios');
const { decrypt } = require('../utils/crypto');

class WhatsAppService {
    /**
     * Sends a text message through the configured provider
     */
    static async sendMessage(instance, remoteJid, text) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const provider = instance.provider;
            const number = remoteJid.split('@')[0];

            if (provider === 'evolution') {
                await axios.post(`${baseUrl}/message/sendText/${instance.instanceId}`, {
                    number: number,
                    text: text
                }, {
                    headers: { 'apikey': token }
                });
            } else if (provider === 'uazapi') {
                await axios.post(`${baseUrl}/send/text`, {
                    number: number,
                    text: text
                }, {
                    headers: { 'token': token }
                });
            }
        } catch (error) {
            console.error(`WhatsApp Send Error (${instance.provider}):`, error.response?.data || error.message);
        }
    }

    /**
     * Logic for automatic instance provisioning (Fase 4)
     */
    static async provisionInstance(provider, instanceName) {
        try {
            if (provider === 'evolution') {
                const baseUrl = process.env.EVOLUTION_URL.replace(/\/$/, '');
                const apiKey = process.env.EVOLUTION_API_KEY;

                const response = await axios.post(`${baseUrl}/instance/create`, {
                    instanceName: instanceName,
                    qrcode: true,
                    webhook_wa_business: false // Adjust based on env if needed
                }, {
                    headers: { 'apikey': apiKey }
                });

                // Evolution returns token and instance metadata
                const data = response.data.instance || response.data;
                return {
                    baseUrl,
                    instanceId: data.instanceName || instanceName,
                    token: data.token || data.apikey // Evolution v2 uses token
                };
            } else if (provider === 'uazapi') {
                const baseUrl = process.env.UAZ_URL.replace(/\/$/, '');
                const adminToken = process.env.UAZ_ADMIN_TOKEN;

                const response = await axios.post(`${baseUrl}/instance/init`, {
                    name: instanceName
                }, {
                    headers: { 'admintoken': adminToken }
                });

                // UazAPI returns token in the response
                return {
                    baseUrl,
                    instanceId: instanceName,
                    token: response.data.token
                };
            }
            throw new Error('Provedor não suportado');
        } catch (error) {
            console.error(`WhatsApp Provision Error (${provider}):`, error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Get QR Code or Connection Data
     */
    static async getConnectData(instance) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');

            if (instance.provider === 'evolution') {
                const response = await axios.get(`${baseUrl}/instance/connect/${instance.instanceId}`, {
                    headers: { 'apikey': token }
                });
                return response.data; // Usually base64 or code
            } else if (instance.provider === 'uazapi') {
                const response = await axios.get(`${baseUrl}/instance/qr-base64`, {
                    headers: { 'token': token }
                });
                return { base64: response.data };
            }
        } catch (error) {
            console.error(`WhatsApp Connect Error (${instance.provider}):`, error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = WhatsAppService;
