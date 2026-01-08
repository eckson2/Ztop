// Prisma Client singleton
const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');

// List all users
const listUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
                isAdminBlocked: true,
                expirationDate: true,
                createdAt: true,
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create User Manually
const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) return res.status(400).json({ error: 'E-mail já cadastrado' });

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: role || 'USER',
                isAdminBlocked: false
            }
        });

        res.status(201).json({ message: 'Usuário criado com sucesso', user: { id: newUser.id, email: newUser.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update User (Block, Expire, Change Password)
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { password, isAdminBlocked, expirationDate, role } = req.body;

    try {
        const updateData = {};

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }
        if (typeof isAdminBlocked === 'boolean') {
            updateData.isAdminBlocked = isAdminBlocked;
        }
        if (expirationDate !== undefined) {
            updateData.expirationDate = expirationDate ? new Date(expirationDate) : null;
        }
        if (role) {
            updateData.role = role;
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData
        });

        res.json({ message: 'Usuário atualizado com sucesso', user: { id: user.id, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { listUsers, createUser, updateUser };
