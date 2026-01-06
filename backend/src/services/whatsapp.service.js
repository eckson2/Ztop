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
                // Try UazAPI endpoints sequentially
                let success = false;

                // Attempt 1: POST /webhook/set (v2)
                if (!success) {
                    try {
                        console.log(`[DEBUG] Trying POST /webhook/set/${instance.instanceId}`);
                        await axios.post(`${baseUrl}/webhook/set/${instance.instanceId}`, {
                            webhookUrl: webhookUrl,
                            enabled: enabled,
                            webhookByEvents: false,
                            events: ['MESSAGES_UPSERT']
                        }, { headers });
                        success = true;
                    } catch (e) {
                        console.log(`[DEBUG] POST /webhook/set failed: ${e.response?.status}`);
                    }
                }

                // Attempt 2: PUT /webhook/set (Some versions use PUT)
                if (!success) {
                    try {
                        console.log(`[DEBUG] Trying PUT /webhook/set/${instance.instanceId}`);
                        await axios.put(`${baseUrl}/webhook/set/${instance.instanceId}`, {
                            webhookUrl: webhookUrl,
                            enabled: enabled
                        }, { headers });
                        success = true;
                    } catch (e) {
                        console.log(`[DEBUG] PUT /webhook/set failed: ${e.response?.status}`);
                    }
                }

                // Attempt 3: POST /webhook (v1 legacy / universal)
                if (!success) {
                    try {
                        console.log(`[DEBUG] Trying POST /webhook`);
                        const payload = {
                            url: webhookUrl,
                            enabled: true, // Re-adding explicit enable
                            events: ['messages', 'messages_upsert', 'messages_update', 'message'],
                            excludeMessages: ['wasSentByApi', 'isGroupYes', 'fromMe'],
                            addUrlEvents: false,
                            addUrlTypesMessages: false
                        };
                        console.log('[DEBUG] Webhook Payload:', JSON.stringify(payload));

                        await axios.post(`${baseUrl}/webhook`, payload, { headers });
                        success = true;
                    } catch (e) {
                        console.log(`[DEBUG] POST /webhook failed: ${e.response?.status}`);
                    }
                }

                if (!success) throw new Error('Todas as tentativas de configurar webhook falharam');
            } else {
                // Evolution
                let finalWebhookUrl = webhookUrl;

                // [EVOLUTION FIX] Support Internal Network (Docker Swarm / VPS Localhost)
                // If BACKEND_INTERNAL_HOST is set (e.g., "dialogbot_backend:3000" or "127.0.0.1:3000"),
                // rewrite the webhook URL to use http and that host.
                if (process.env.BACKEND_INTERNAL_HOST) {
                    try {
                        const urlObj = new URL(webhookUrl);
                        finalWebhookUrl = `http://${process.env.BACKEND_INTERNAL_HOST}${urlObj.pathname}${urlObj.search}`;
                        console.log(`[DEBUG] Rewriting Evolution Webhook to Internal: ${finalWebhookUrl}`);
                    } catch (e) {
                        console.error('[DEBUG] Failed to rewrite internal URL:', e.message);
                    }
                }

                // Evolution API (User provided structure)
                await axios.post(`${baseUrl}/webhook/set/${instance.instanceId}`, {
                    webhook: {
                        enabled: enabled,
                        url: finalWebhookUrl,
                        byEvents: true, // Force using the events list
                        events: [
                            "APPLICATION_STARTUP", "QRCODE_UPDATED", "MESSAGES_SET", "MESSAGES_UPSERT",
                            "MESSAGES_UPDATE", "MESSAGES_DELETE", "SEND_MESSAGE", "CONTACTS_SET",
                            "CONTACTS_UPSERT", "CONTACTS_UPDATE", "PRESENCE_UPDATE", "CHATS_SET",
                            "CHATS_UPSERT", "CHATS_UPDATE", "CHATS_DELETE", "GROUPS_UPSERT",
                            "GROUP_UPDATE", "GROUP_PARTICIPANTS_UPDATE", "CONNECTION_UPDATE",
                            "LABELS_EDIT", "LABELS_ASSOCIATION", "CALL", "TYPEBOT_START",
                            "TYPEBOT_CHANGE_STATUS"
                        ]
                    }
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
     * Sends a media message (Image, Audio, Video, Document)
     */
    static async sendMedia(instance, remoteJid, url, type, caption = '') {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const number = remoteJid.split('@')[0];
            const headers = { 'apikey': token, 'token': token, 'admintoken': token };

            console.log(`[DEBUG] Sending ${type} via ${instance.provider} to ${number}`);

            if (instance.provider === 'evolution') {
                // Evolution API: /message/sendMedia/{instance}
                const mediaType = type === 'unknown' ? 'document' : type; // active backup

                // [FIX] Evolution often requires fileName
                const fileName = url.split('/').pop().split('?')[0] || `file.${type === 'audio' ? 'mp3' : 'jpg'}`;

                // [FIX] Flatten payload for Evolution v2 (mediatype at root)
                await axios.post(`${baseUrl}/message/sendMedia/${instance.instanceId}`, {
                    number: number,
                    mediatype: mediaType,
                    mimetype: mediaType === 'image' ? 'image/jpeg' : (mediaType === 'audio' ? 'audio/mpeg' : (mediaType === 'video' ? 'video/mp4' : 'application/pdf')),
                    media: url,
                    caption: caption || '', // [FIX] Evolution requires string, cannot be null
                    fileName: fileName
                }, { headers });
            } else if (instance.provider === 'uazapi') {
                // UazAPI v2: /send/media
                const payload = {
                    number: number,
                    url: url,
                    type: type, // image, video, audio, document
                    caption: caption,
                    extension: type === 'audio' ? 'mp3' : 'jpg' // Basic fallback guess
                };
                await axios.post(`${baseUrl}/send/media`, payload, { headers });
            }
        } catch (error) {
            console.error(`WhatsApp Media Error (${instance.provider}):`, JSON.stringify(error.response?.data || error.message, null, 2));
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
     * Delete instance from provider
     */
    static async deleteInstance(instance) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const headers = { 'apikey': token, 'token': token, 'admintoken': process.env.UAZ_ADMIN_TOKEN || token };

            console.log(`[DEBUG] Deleting Instance ${instance.instanceId} from ${instance.provider}`);

            if (instance.provider === 'evolution') {
                // Evolution: DELETE /instance/delete/{name}
                await axios.delete(`${baseUrl}/instance/delete/${instance.instanceId}`, { headers });
            } else if (instance.provider === 'uazapi') {
                // UazAPI Deletion Strategies (Brute Force Compatibility)

                // [FIX] Force Logout first to kill session on provider side
                try {
                    console.log(`[DEBUG] UazAPI: Forcing Logout before delete for ${instance.instanceId}`);
                    await axios.delete(`${baseUrl}/instance/logout/${instance.instanceId}`, { headers });
                } catch (e) {
                    console.log(`[DEBUG] Logout failed (might be already logged out): ${e.response?.status}`);
                }

                // Strategy 1: DELETE /instance/{instanceId} (RESTful Standard)
                try {
                    console.log(`[DEBUG] Trying Strategy 1: DELETE /instance/${instance.instanceId}`);
                    await axios.delete(`${baseUrl}/instance/${instance.instanceId}`, { headers });
                    console.log('[DEBUG] Strategy 1 Success');
                    return;
                } catch (e) { console.log(`[DEBUG] Strategy 1 Failed: ${e.response?.status}`); }

                // Strategy 2: DELETE /instance?instanceName={instanceId} (Query Param)
                try {
                    console.log(`[DEBUG] Trying Strategy 2: DELETE /instance?instanceName=${instance.instanceId}`);
                    // Some Go versions require 'key' instead of instanceName in query
                    await axios.delete(`${baseUrl}/instance`, {
                        headers,
                        params: {
                            instanceName: instance.instanceId,
                            key: instance.instanceId
                        }
                    });
                    console.log('[DEBUG] Strategy 2 Success');
                    return;
                } catch (e) { console.log(`[DEBUG] Strategy 2 Failed: ${e.response?.status}`); }

                // Strategy 3: DELETE /instance with Body (Likely candidate based on docs)
                try {
                    console.log(`[DEBUG] Trying Strategy 3: DELETE /instance (Body)`);
                    await axios.delete(`${baseUrl}/instance`, {
                        headers,
                        data: {
                            instanceName: instance.instanceId,
                            name: instance.instanceId, // Some versions check 'name'
                            key: instance.instanceId   // Some check 'key'
                        }
                    });
                    console.log('[DEBUG] Strategy 3 Success');
                    return;
                } catch (e) { console.log(`[DEBUG] Strategy 3 Failed: ${e.response?.status}`); }

                // Strategy 4: Legacy DELETE /instance/delete/{instanceId}
                try {
                    console.log(`[DEBUG] Trying Strategy 4: DELETE /instance/delete/${instance.instanceId}`);
                    await axios.delete(`${baseUrl}/instance/delete/${instance.instanceId}`, { headers });
                    console.log('[DEBUG] Strategy 4 Success');
                } catch (e) { console.log(`[DEBUG] Strategy 4 Failed: ${e.response?.status}`); }
            }
        } catch (error) {
            console.error(`Simple Delete Error: ${error.message}`);
            // Non-blocking, just log
        }
    }

    /**
     * Logic for automatic instance provisioning (Fase 4)
     */
    static async provisionInstance(provider, instanceName) {
        try {
            const axiosConfig = { timeout: 15000 }; // 15s timeout

            if (provider === 'evolution') {
                // [EVOLUTION FIX] Verify if we should use a private internal URL (Docker Network)
                const envUrl = process.env.EVOLUTION_PRIVATE_URL || process.env.EVOLUTION_URL;
                const baseUrl = envUrl.replace(/\/$/, '');
                const apiKey = process.env.EVOLUTION_API_KEY;

                console.log(`Creating Evolution Instance: ${baseUrl}/instance/create`);

                // Evolution v2 Payload Fix:
                // Removed webhook_wa_business (can cause 'Invalid integration' in some v2 builds)
                // Kept minimal fields
                const payload = {
                    instanceName: instanceName,
                    qrcode: true,
                    integration: 'WHATSAPP-BAILEYS' // Explicitly setting default integration
                };

                const response = await axios.post(`${baseUrl}/instance/create`, payload, {
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
    /**
     * Update Evolution Instance Settings (Reject Call, Groups, etc)
     */
    static async updateEvolutionSettings(instance, settings) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const headers = { 'apikey': token };

            console.log(`[DEBUG] Updating Settings for ${instance.instanceId}:`, settings);

            // Evolution v2: /settings/set/{instance}
            // Mapped settings: reject_call, msg_call, groups_ignore, always_online
            await axios.post(`${baseUrl}/settings/set/${instance.instanceId}`, {
                reject_call: settings.rejectCall,
                msg_call: settings.rejectMessage || '',
                groups_ignore: settings.ignoreGroups,
                always_online: settings.alwaysOnline || false
            }, { headers });

            return true;
        } catch (error) {
            console.error('[DEBUG] Failed to update settings:', error.message);
            throw new Error('Falha ao atualizar configurações.');
        }
    }

    /**
     * Update Evolution Typebot Integration
     */
    static async updateEvolutionTypebot(instance, typebotData) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const headers = { 'apikey': token };

            console.log(`[DEBUG] Updating Typebot for ${instance.instanceId}`);

            // Evolution v2: /typebot/set/{instance}
            await axios.post(`${baseUrl}/typebot/set/${instance.instanceId}`, {
                enabled: typebotData.enabled,
                url: typebotData.url,
                typebot: typebotData.flowName,
                expire: 20, // session expiration in mins
                keyword_finish: '#SAIR',
                delay_message: 1000,
                unknown_message: 'Mensagem não reconhecida',
                listening_from_me: false
            }, { headers });

            return true;
        } catch (error) {
            console.error('[DEBUG] Failed to set Typebot:', error.message);
            throw new Error('Falha ao configurar Typebot.');
        }
    }

    /**
     * Get Connection Status
     */
    static async getStatus(instance) {
        try {
            const token = decrypt(instance.token);
            const baseUrl = instance.baseUrl.replace(/\/$/, '');
            const axiosConfig = { timeout: 5000 };

            console.log(`[DEBUG] Checking Status for ${instance.instanceId}`);

            const headers = {
                'token': token,
                'apikey': token,
                'admintoken': token
            };

            const statusEndpoints = [
                `/instance/connectionState/${instance.instanceId}`, // Evolution v2 Standard
                `/instance/status?instanceId=${instance.instanceId}`, // UazAPI / Others
            ];

            for (const endpoint of statusEndpoints) {
                try {
                    const response = await axios.get(`${baseUrl}${endpoint}`, {
                        headers: headers,
                        ...axiosConfig
                    });

                    // Evolution v2 response: { instance: { state: "open" } }
                    // UazAPI response: { instance: { status: "connected" } }
                    console.log(`[DEBUG] Status Response (${endpoint}):`, JSON.stringify(response.data));

                    const s = response.data.instance?.state ||
                        response.data.instance?.status ||
                        response.data.state ||
                        response.data.status;

                    if (s === 'open' || s === 'connected') return 'connected';
                    if (s === 'close' || s === 'disconnected') return 'disconnected';
                    if (s === 'connecting') return 'connecting';
                } catch (e) {
                    // ignore failures on alternative endpoints
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
