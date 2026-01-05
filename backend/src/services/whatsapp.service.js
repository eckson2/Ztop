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

/*
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
            else */ if (provider === 'uazapi') {
                const baseUrl = process.env.UAZ_URL.replace(/\/$/, '');
                const adminToken = process.env.UAZ_ADMIN_TOKEN;

                console.log(`Creating UazAPI Instance (v2): ${baseUrl}/instance/init`);
                console.log('Payload being sent:', { instanceName, name: instanceName });

                // UazAPI v2 uses /instance/init and 'admintoken' header
                // Sending both keys to ensure compatibility
                const response = await axios.post(`${baseUrl}/instance/init`, {
                    instanceName: instanceName,
                    name: instanceName,
                    qrcode: true // Force QR generation flag
                }, {
                    headers: { 'admintoken': adminToken },
                    ...axiosConfig
                });

                console.log('[DEBUG] UazAPI Provision Response:', JSON.stringify(response.data, null, 2));

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
            // Disable Evolution block temporarily
            // ...

            const token = decrypt(instance.token);
            // UazAPI admin token (for fetching list)
            const checkToken = process.env.UAZ_ADMIN_TOKEN || token;

            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const axiosConfig = { timeout: 10000 };

            // Standardize headers: Send both for max compatibility
            const headers = {
                'apikey': token,
                'token': token,
                'admintoken': token // Some versions might use this?
            };

            // [DEBUG] Check if instance exists and what is its real name
            try {
                console.log(`[DEBUG] Checking active instances on: ${baseUrl}/instance/fetch`);
                const check = await axios.get(`${baseUrl}/instance/fetch`, {
                    headers: headers,
                    params: { token: checkToken }, // Some use query
                    ...axiosConfig
                });
                console.log('[DEBUG] Active Instances:', JSON.stringify(check.data.map && check.data.map(i => i.instanceName || i.name) || check.data, null, 2));
            } catch (e) { console.log('[DEBUG] Failed to fetch instances list:', e.message); }

            // List of potential endpoints to try
            const endpoints = [
                { method: 'GET', url: `/instance/connect/${instance.instanceId}` },
                { method: 'GET', url: `/instance/qr-base64` },
                { method: 'GET', url: `/instance/qr-base64?instanceId=${instance.instanceId}` },
                { method: 'GET', url: `/instance/qr-base64/${instance.instanceId}` },
                { method: 'GET', url: `/message/qrCode/${instance.instanceId}` },
                { method: 'GET', url: `/instance/qrcode/${instance.instanceId}` },
                { method: 'GET', url: `/instance/qr/${instance.instanceId}` }, // <--- Standard Evolution/UazAPI endpoint
                // V2 strict styles
                { method: 'GET', url: `/instance/connect?instance=${instance.instanceId}` },
                { method: 'POST', url: `/instance/connect/${instance.instanceId}` },
            ];

            for (const endpoint of endpoints) {
                try {
                    console.log(`[DEBUG] Trying QR Endpoint (${endpoint.method}): ${baseUrl}${endpoint.url}`);
                    const response = await axios({
                        method: endpoint.method,
                        url: `${baseUrl}${endpoint.url}`,
                        headers: headers,
                        ...axiosConfig
                    });

                    console.log(`[DEBUG] Success on ${endpoint.url}`);
                    // normalize response
                    const resData = response.data;
                    if (resData.base64) return { base64: resData.base64 };
                    if (resData.qrcode) return { base64: resData.qrcode };
                    if (resData.instance?.qrcode) return { base64: resData.instance.qrcode };

                    if (resData && (resData.base64 || resData.qrcode)) return resData; // Generic return
                    return resData;
                } catch (error) {
                    console.log(`[DEBUG] Failed ${endpoint.url}: ${error.response?.status} ${error.response?.statusText}`);
                }
            }

            // If all fail
            console.error(`[DEBUG] All QR endpoints failed for ${instance.provider}`);
            return null;
        } catch (error) {
            console.error(`WhatsApp Connect Error (${instance.provider}):`, error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = WhatsAppService;
