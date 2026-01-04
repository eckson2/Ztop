const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    const adminEmail = 'admin@ztop.dev.br';
    const adminPassword = 'adminpassword123'; // Change this in production

    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                name: 'Administrator',
                email: adminEmail,
                passwordHash: passwordHash,
                role: 'ADMIN',
                status: 'active',
                plan: 'enterprise'
            }
        });
        console.log('✅ Admin user created: ' + adminEmail);
    } else {
        console.log('ℹ️ Admin user already exists.');
    }

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
