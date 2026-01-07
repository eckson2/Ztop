
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const userId = 'b6c9d639-24e8-4684-9e58-1a73210b9fe7';
    const remoteJid = '5511915872978@s.whatsapp.net';

    console.log(`Checking configuration for user: ${userId}`);

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            botConfig: true,
            whatsappInstance: true
        }
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('User Status:', user.status);
    console.log('Bot Config:', user.botConfig ? 'Found' : 'MISSING');
    if (user.botConfig) {
        console.log('  - Type:', user.botConfig.botType);
        console.log('  - Agent ID:', user.botConfig.dialogflowAgentId ? 'Set' : 'Null');
        console.log('  - Credentials:', user.botConfig.dialogflowCredentials ? 'Set' : 'Null');
    }

    console.log('WhatsApp Instance:', user.whatsappInstance ? 'Found' : 'MISSING');

    console.log(`\nChecking ChatSession for ${remoteJid}...`);
    const session = await prisma.chatSession.findUnique({
        where: {
            userId_remoteJid: {
                userId: userId,
                remoteJid: remoteJid
            }
        }
    });

    if (session) {
        console.log('Chat Session Found:');
        console.log('  - isBotActive:', session.isBotActive);
        console.log('  - lastInteraction:', session.lastInteraction);
    } else {
        console.log('Chat Session NOT found.');
    }
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
