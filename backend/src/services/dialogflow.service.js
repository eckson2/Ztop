const dialogflow = require('@google-cloud/dialogflow');
const { decrypt } = require('../utils/crypto');

class DialogflowService {
    static async getResponse(config, remoteJid, text) {
        try {
            const credentials = JSON.parse(decrypt(config.dialogflowJson));
            const projectId = config.dialogflowProjectId;
            const languageCode = config.dialogflowLang || 'pt-BR';

            const sessionClient = new dialogflow.SessionsClient({
                credentials: {
                    client_email: credentials.client_email,
                    private_key: credentials.private_key
                }
            });

            // Use remoteJid as session ID (unique per user/contact)
            const sessionPath = sessionClient.projectAgentSessionPath(projectId, remoteJid);

            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: text,
                        languageCode: languageCode,
                    },
                },
            };

            const intentResponse = await sessionClient.detectIntent(request);
            const result = intentResponse[0].queryResult;

            // Extract fulfillment messages (can be multiple)
            const responses = [];

            if (result.fulfillmentMessages && result.fulfillmentMessages.length > 0) {
                for (const msg of result.fulfillmentMessages) {
                    if (msg.text) {
                        responses.push({ type: 'text', content: msg.text.text[0] });
                    }
                    else if (msg.image) {
                        responses.push({
                            type: 'image',
                            url: msg.image.imageUri,
                            content: '' // No caption in standard image
                        });
                    }
                    else if (msg.payload) {
                        // Support Custom Payload: { "whatsapp": { "type": "image/audio/video", "url": "...", "caption": "..." } }
                        // Or Generic Custom Payload
                        const payload = msg.payload.fields;
                        // Simplistic parsing of Protobuf Struct - Dialogflow often wraps in 'fields'
                        // Actually msg.payload is already a JS object if using library, let's assume standard structure

                        // Check for known keys
                        if (payload.whatsapp) {
                            const wa = payload.whatsapp.structValue ? payload.whatsapp.structValue.fields : payload.whatsapp;

                            // Handling Protobuf Struct to JS Object extraction (simplified)
                            const extractValue = (field) => field.stringValue || field;

                            const type = extractValue(wa.type || wa.fields?.type);
                            const url = extractValue(wa.url || wa.fields?.url);
                            const caption = extractValue(wa.caption || wa.fields?.caption);

                            if (type && url) {
                                responses.push({ type, url, content: caption });
                            }
                        }
                    }
                }
            } else if (result.fulfillmentText) {
                responses.push({ type: 'text', content: result.fulfillmentText });
            }

            return responses;
        } catch (error) {
            console.error('Dialogflow Error:', error);
            throw error;
        }
    }
}

module.exports = DialogflowService;
