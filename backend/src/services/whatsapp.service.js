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
            const axiosConfig = { timeout: 15000 }; // 15s timeout

            if (provider === 'evolution') {
                const baseUrl = process.env.EVOLUTION_URL.replace(/\/$/, '');
                const apiKey = process.env.EVOLUTION_API_KEY;

                console.log(`Creating Evolution Instance: ${baseUrl}/instance/create`);

                const response = await axios.post(`${baseUrl}/instance/create`, {
                    instanceName: instanceName,
                    qrcode: true,
                    webhook_wa_business: false
                }, {
                    headers: { 'apikey': apiKey },
                    ...axiosConfig
                });

                const data = response.data.instance || response.data;
                return {
                    baseUrl,
                    instanceId: data.instanceName || instanceName,
                    token: data.token || data.apikey || apiKey
                };
            }
            else if (provider === 'uazapi') {
                const baseUrl = process.env.UAZ_URL.replace(/\/$/, '');
                const adminToken = process.env.UAZ_ADMIN_TOKEN;

                console.log(`Creating UazAPI Instance (v2): ${baseUrl}/instance/init`);

                // UazAPI v2 uses /instance/init and 'admintoken' header
                const response = await axios.post(`${baseUrl}/instance/init`, {
                    instanceName: instanceName
                }, {
                    headers: { 'admintoken': adminToken },
                    ...axiosConfig
                });

                // UazAPI v2 returns { instance: { instanceName, ... }, hash: "..." } or { token: "..." }
                const data = response.data;
                return {
                    baseUrl,
                    instanceId: data.instance?.instanceName || instanceName,
                    token: data.hash || data.token || data.instance?.token
                };
            }
            throw new Error('Provedor não suportado');
        } catch (error) {
            console.error(`WhatsApp Provision Error (${provider}):`, error.response?.data || error.message);
            // Return more user-friendly error
            if (error.code === 'ETIMEDOUT') throw new Error('Timeout: O servidor não conseguiu conectar na API do WhatsApp. Verifique a URL.');
            if (error.response?.status === 401) throw new Error('Erro de Autenticação: Verifique sua API Key / Token.');
            throw new Error(error.response?.data?.error || error.response?.data?.message || 'Falha na comunicação com a API');
        }
    }

    /**
     * Get QR Code or Connection Data
     */
    static async getConnectData(instance) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const axiosConfig = { timeout: 10000 };

            // Standardize: Both likely use Evolution endpoints logic
            // Try v2 endpoint matching
            const response = await axios.get(`${baseUrl}/instance/connect/${instance.instanceId}`, {
                headers: { 'apikey': token },
                ...axiosConfig
            });

            return response.data;
        } catch (error) {
            console.error(`WhatsApp Connect Error (${instance.provider}):`, error.response?.data || error.message);
            // Fallback for older Evolution versions / different forks
            try {
                if (instance.provider === 'uazapi') {
                    const token = decrypt(instance.token);
                    const baseUrl = instance.baseUrl.replace(/\/$/, '');
                    const fallback = await axios.get(`${baseUrl}/instance/qr-base64`, {
                        headers: { 'apikey': token },
                        timeout: 5000
                    });
                    return { base64: fallback.data.qrcode || fallback.data };
                }
            } catch (e) { }

            return null;
        }
    }
}

module.exports = WhatsAppService;
