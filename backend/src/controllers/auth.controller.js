const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Prisma Client singleton
const prisma = require('../utils/prisma');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) return res.status(400).json({ error: 'E-mail já cadastrado' });

        const passwordHash = await bcrypt.hash(password, 10);

        // Calculate 2-day trial expiration
        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 2);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                subscriptionExpiresAt: trialExpiresAt,
                expirationDate: trialExpiresAt // Legacy field support
            }
        });

        res.status(201).json({ message: 'Usuário criado com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[AUTH] Login attempt for: ${email}`);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            console.log(`[AUTH] User not found: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            console.log(`[AUTH] Invalid password for: ${email}`);
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Check if Admin Blocked
        if (user.isAdminBlocked) {
            console.log(`[AUTH] Blocked user: ${email}`);
            return res.status(403).json({ error: 'Acesso bloqueado pelo administrador.' });
        }

        // Check Expiration Date
        if (user.expirationDate && new Date() > new Date(user.expirationDate)) {
            console.log(`[AUTH] Expired user: ${email}`);
            return res.status(403).json({ error: 'Sua assinatura expirou. Entre em contato com o suporte.' });
        }

        if (user.status !== 'active') {
            console.log(`[AUTH] Inactive user: ${email}`);
            return res.status(403).json({ error: 'Usuário inativo' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('[CRITICAL] JWT_SECRET is missing during login!');
            return res.status(500).json({ error: 'Erro interno de configuração (JWT_SECRET miss)' });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        console.log(`[AUTH] Login success for: ${email}`);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                plan: user.plan,
                webhookToken: user.webhookToken
            }
        });
    } catch (error) {
        console.error(`[AUTH] Login Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login };
