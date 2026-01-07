const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("--- DEBUG SESSIONS ---");

        // 1. List Users
        const users = await prisma.user.findMany({ select: { id: true, email: true } });
        console.log("Users:", users);

        // 2. Count Sessions per User
        for (const u of users) {
            const count = await prisma.chatSession.count({ where: { userId: u.id } });
            console.log(`User ${u.id} (${u.email}): ${count} sessions`);

            if (count > 0) {
                const sessions = await prisma.chatSession.findMany({
                    where: { userId: u.id },
                    take: 3
                });
                console.log("Sample Sessions:", sessions);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
