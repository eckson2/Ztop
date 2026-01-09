const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    const adminEmail = 'admin@ztop.dev.br';
    const adminPassword = 'adminpassword123'; // Change this in production

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const user = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash: passwordHash, // Force password reset
            role: 'ADMIN',
            status: 'active',
            plan: 'enterprise'
        },
        create: {
            name: 'Administrator',
            email: adminEmail,
            passwordHash: passwordHash,
            role: 'ADMIN',
            status: 'active',
            plan: 'enterprise'
        }
    });

    console.log('✅ Admin user created/updated: ' + adminEmail);

    console.log('✨ Seed finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
