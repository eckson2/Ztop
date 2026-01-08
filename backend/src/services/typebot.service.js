const axios = require('axios');
const { decrypt } = require('../utils/crypto');
// Prisma Client singleton
const prisma = require('../utils/prisma');

class TypebotService {
    static async getResponse(config, userId, remoteJid, text) {
        try {
            const token = decrypt(config.typebotToken);
            const typebotId = config.typebotId;

            // Get or create session
            let session = await prisma.chatSession.findUnique({
                where: { userId_remoteJid: { userId, remoteJid } }
            });

            let response;
            const baseUrl = `https://typebot.io/api/v1/typebots/${typebotId}`;

            if (!session || !session.botSessionId) {
                // Start chat
                response = await axios.post(`${baseUrl}/startChat`, {
                    message: text
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                // Continue chat
                response = await axios.post(`https://typebot.io/api/v1/sessions/${session.botSessionId}/continueChat`, {
                    message: text
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            const data = response.data;

            // Save sessionId for next interaction
            if (data.sessionId) {
                await prisma.chatSession.upsert({
                    where: { userId_remoteJid: { userId, remoteJid } },
                    update: { botSessionId: data.sessionId, lastInteraction: new Date() },
                    create: { userId, remoteJid, botSessionId: data.sessionId }
                });
            }

            // Extract messages
            const messages = data.messages
                .filter(m => m.type === 'text')
                .map(m => m.content.richText[0].children[0].text); // Simplified extraction

            return messages;
        } catch (error) {
            console.error('Typebot Error:', error);
            throw error;
        }
    }
}

module.exports = TypebotService;
