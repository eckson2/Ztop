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

            const responses = await sessionClient.detectIntent(request);
            const result = responses[0].queryResult;

            // Extract fulfillment messages (can be multiple)
            if (result.fulfillmentMessages && result.fulfillmentMessages.length > 0) {
                return result.fulfillmentMessages
                    .filter(m => m.text)
                    .map(m => m.text.text[0]);
            }

            return [result.fulfillmentText];
        } catch (error) {
            console.error('Dialogflow Error:', error);
            throw error;
        }
    }
}

module.exports = DialogflowService;
