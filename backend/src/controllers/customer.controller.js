const prisma = require('../utils/prisma');

const CustomerController = {
    // Listar clientes
    async list(req, res) {
        try {
            const userId = req.userId;
            const customers = await prisma.customer.findMany({
                where: { userId },
                orderBy: { name: 'asc' },
                include: {
                    product: { select: { name: true } },
                    plan: { select: { name: true, price: true } }
                }
            });
            return res.json(customers);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao listar clientes.' });
        }
    },

    // Criar cliente
    async create(req, res) {
        try {
            const userId = req.userId;
            const { name, phone, email, cpf, productId, planId, dueDate, notes } = req.body;

            if (!name || !phone) return res.status(400).json({ error: 'Nome e Telefone são obrigatórios.' });

            const customer = await prisma.customer.create({
                data: {
                    userId,
                    name,
                    phone,
                    email,
                    cpf,
                    productId,
                    planId,
                    dueDate: dueDate ? new Date(dueDate) : null,
                    notes
                }
            });

            return res.json(customer);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar cliente.' });
        }
    },

    // Atualizar cliente
    async update(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const { name, phone, email, cpf, productId, planId, dueDate, notes } = req.body;

            const customer = await prisma.customer.update({
                where: { id },
                data: {
                    name,
                    phone,
                    email,
                    cpf,
                    productId,
                    planId,
                    dueDate: dueDate ? new Date(dueDate) : undefined,
                    notes
                }
            });

            return res.json(customer);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao atualizar cliente.' });
        }
    },

    // Deletar cliente
    async delete(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            await prisma.customer.delete({ where: { id } });
            return res.json({ message: 'Cliente removido.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao remover cliente.' });
        }
    },

    // ====================
    // Ações Específicas
    // ====================

    // Renovar Cliente
    async renew(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;
            const {
                method, // 'manual' or 'gateway'
                manualMethodId,
                amount,
                newDueDate,
                addLoyaltyPoints
            } = req.body;

            // 1. Get Customer
            const customer = await prisma.customer.findFirst({
                where: { id, userId },
                include: { product: true }
            });
            if (!customer) return res.status(404).json({ error: 'Cliente não encontrado.' });

            // 2. Create Financial Transaction
            await prisma.financialTransaction.create({
                data: {
                    userId,
                    customerId: id,
                    amount: parseFloat(amount),
                    type: 'income',
                    category: 'Renovação',
                    description: `Renovação ${customer.product?.name || ''}`,
                    status: 'approved',
                    method: method || 'manual',
                    manualMethodId: manualMethodId || null,
                    date: new Date()
                }
            });

            // 3. Update Customer (Due Date & Loyalty)
            const updateData = {
                dueDate: new Date(newDueDate),
                status: 'active'
            };

            if (addLoyaltyPoints) {
                updateData.loyaltyPoints = { increment: 1 };
            }

            const updatedCustomer = await prisma.customer.update({
                where: { id },
                data: updateData
            });

            // 4. TODO: Call IPTV Panel API if integrated to renew there too.

            return res.json({ success: true, customer: updatedCustomer });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao renovar cliente.' });
        }
    },

    // Obter Histórico
    async getHistory(req, res) {
        try {
            const userId = req.userId;
            const { id } = req.params;

            const transactions = await prisma.financialTransaction.findMany({
                where: { userId, customerId: id },
                orderBy: { date: 'desc' },
                include: { manualMethod: true }
            });

            const messages = await prisma.messageLog.findMany({
                where: { userId, to: { contains: id } }, // This might need better query if 'to' is phone number
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            return res.json({ transactions, messages });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao buscar histórico.' });
        }
    }
};

module.exports = CustomerController;
