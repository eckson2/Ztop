const axios = require('axios');
const { decrypt } = require('../utils/crypto');

class WhatsAppService {
    /**
     * Set Webhook for Instance
     */
    static async setWebhook(instance, webhookUrl, enabled = true) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const headers = { 'apikey': token, 'token': token };

            console.log(`[DEBUG] Setting Webhook for ${instance.instanceId} to ${webhookUrl}`);

            if (instance.provider === 'uazapi') {
                // Try common UazAPI webhook endpoints
                try {
                    await axios.post(`${baseUrl}/webhook/set/${instance.instanceId}`, {
                        webhookUrl: webhookUrl,
                        enabled: enabled,
                        webhookByEvents: false,
                        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'SEND_MESSAGE']
                    }, { headers });
                } catch (e) {
                    // Fallback for some versions
                    await axios.post(`${baseUrl}/instance/webhook`, {
                        instanceId: instance.instanceId,
                        webhookUrl: webhookUrl,
                        enabled: enabled
                    }, { headers });
                }
            } else {
                // Evolution
                await axios.post(`${baseUrl}/webhook/set/${instance.instanceId}`, {
                    enabled: enabled,
                    url: webhookUrl,
                    webhookByEvents: true,
                    events: ['MESSAGES_UPSERT']
                }, { headers });
            }
            console.log('[DEBUG] Webhook set successfully');
            return true;
        } catch (error) {
            console.error('[DEBUG] Failed to set webhook:', error.message);
            return false;
        }
    }


    /**
     * Sends a text message through the configured provider
     */
    static async sendMessage(instance, remoteJid, text) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const provider = instance.provider;
            const number = remoteJid.split('@')[0];

            // Robust headers for UazAPI/Evolution
            const headers = {
                'apikey': token,
                'token': token,
                'admintoken': token
            };

            console.log(`[DEBUG] Sending Message via ${provider} to ${number}: ${text}`);

            if (provider === 'evolution') {
                await axios.post(`${baseUrl}/message/sendText/${instance.instanceId}`, {
                    number: number,
                    text: text
                }, { headers });
            } else if (provider === 'uazapi') {
                // Endpoint: /send/text
                const payload = {
                    number: number,
                    text: text,
                    linkPreview: true
                };

                const response = await axios.post(`${baseUrl}/send/text`, payload, { headers });
                console.log(`[DEBUG] Send Response:`, JSON.stringify(response.data));
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

            // List of potential endpoints to try - Prioritizing CONFIRMED working endpoint
            const endpoints = [
                // 1. Confirmed working endpoint (UazAPI v2)
                { method: 'POST', url: `/instance/connect`, data: { instanceName: instance.instanceId } },

                // Fallbacks (only kept just in case, but moved to bottom)
                { method: 'GET', url: `/instance/qr/${instance.instanceId}` },
                { method: 'GET', url: `/instance/connect/${instance.instanceId}` }
            ];

            for (const endpoint of endpoints) {
                try {
                    console.log(`[DEBUG] Trying QR Endpoint (${endpoint.method}): ${baseUrl}${endpoint.url}`);
                    const response = await axios({
                        method: endpoint.method,
                        url: `${baseUrl}${endpoint.url}`,
                        headers: headers,
                        data: endpoint.data, // Send body if defined
                        ...axiosConfig
                    });

                    console.log(`[DEBUG] Success on ${endpoint.url}`);
                    console.log('[DEBUG] Connection Response Payload:', JSON.stringify(response.data)); // <--- Log what we got
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
    /**
     * Get Connection Status
     */
    /**
     * Get Connection Status
     */
    static async getStatus(instance) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const axiosConfig = { timeout: 5000 };

            console.log(`[DEBUG] Checking Status (GET /instance/status) for ${instance.instanceId}`);

            // headers same as getConnectData for consistency (it works there)
            const headers = {
                'token': token,
                'apikey': token,
                'admintoken': token // Use instance token here too as it works for other endpoints
            };

            // User recommended: GET /instance/status
            const statusEndpoints = [
                // Most standard for v2
                `/instance/status?instanceId=${instance.instanceId}`,

                // Commented out to reduce noise, enable if needed
                // `/instance/status?key=${instance.instanceId}`,
                // `/instance/status?id=${instance.instanceId}`,
                // `/instance/status/${instance.instanceId}`
            ];

            for (const endpoint of statusEndpoints) {
                try {
                    const response = await axios.get(`${baseUrl}${endpoint}`, {
                        headers: headers,
                        ...axiosConfig
                    });

                    console.log(`[DEBUG] Status Response (${endpoint}):`, JSON.stringify(response.data));

                    // Check for "connected" or "open"
                    // Log response structure shows: response.data.instance.status = "connected"
                    const s = response.data.instance?.status || response.data.instance?.state || response.data.state || response.data.status;

                    if (s === 'open' || s === 'connected') return 'connected';
                    if (s === 'close' || s === 'disconnected') return 'disconnected';
                    if (s === 'connecting') return 'connecting';
                } catch (e) {
                    console.log(`[DEBUG] Status Probe Failed (${endpoint}): ${e.response?.status}`);
                }
            }

            return 'disconnected';
        } catch (error) {
            console.error('[DEBUG] getStatus critical error:', error.message);
            return 'disconnected';
        }
    }
}

module.exports = WhatsAppService;
