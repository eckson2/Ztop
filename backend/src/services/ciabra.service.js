const axios = require('axios');

const CIABRA_API = process.env.CIABRA_API_URL || 'https://api.az.center';
const PUBLIC_KEY = process.env.CIABRA_PUBLIC_KEY || 'ad9e100fd48020871b32e216ef80db54d568e28086f4f55d9daa';
const SECRET_KEY = process.env.CIABRA_SECRET_KEY || '2dd276e121aad993328c';
const AUTH_TOKEN = Buffer.from(`${PUBLIC_KEY}:${SECRET_KEY}`).toString('base64');

/**
 * Generate a valid random CPF
 */
function generateValidCPF() {
    function randomDigit() {
        return Math.floor(Math.random() * 10);
    }

    function calculateDigit(cpfArray, factor) {
        let total = 0;
        for (let i = 0; i < factor - 1; i++) {
            total += cpfArray[i] * (factor - i);
        }
        const remainder = total % 11;
        return remainder < 2 ? 0 : 11 - remainder;
    }

    const cpf = [];
    for (let i = 0; i < 9; i++) {
        cpf.push(randomDigit());
    }

    cpf.push(calculateDigit(cpf, 10));
    cpf.push(calculateDigit(cpf, 11));

    return `${cpf.slice(0, 3).join('')}.${cpf.slice(3, 6).join('')}.${cpf.slice(6, 9).join('')}-${cpf.slice(9, 11).join('')}`;
}

/**
 * Create a customer in Ciabra
 */
async function createCustomer(userName) {
    try {
        const response = await axios.post(
            `${CIABRA_API}/invoices/applications/customers`,
            {
                fullName: userName || 'Cliente ZTop',
                document: generateValidCPF()
            },
            {
                headers: {
                    'Authorization': `Basic ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('[CIABRA] Error creating customer:', error.response?.data || error.message);
        throw new Error('Erro ao criar cliente no Ciabra');
    }
}

/**
 * Create a PIX invoice
 */
async function createPixInvoice(customerId, amount, description = 'Renovação ZTop - 1 Mês') {
    try {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1); // 1 day to pay

        const response = await axios.post(
            `${CIABRA_API}/invoices/applications/invoices`,
            {
                customerId,
                description,
                dueDate: dueDate.toISOString(),
                installmentCount: 1,
                invoiceType: 'SINGLE',
                items: [],
                price: amount,
                externalId: `ZTOP-${Date.now()}`,
                paymentTypes: ['PIX'],
                notifications: [],
                webhooks: []
            },
            {
                headers: {
                    'Authorization': `Basic ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('[CIABRA] Error creating invoice:', error.response?.data || error.message);
        throw new Error('Erro ao criar cobrança PIX');
    }
}

/**
 * Get invoice details (including payment status)
 */
async function getInvoiceDetails(invoiceId) {
    try {
        const response = await axios.get(
            `${CIABRA_API}/invoices/applications/invoices/${invoiceId}`,
            {
                headers: {
                    'Authorization': `Basic ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('[CIABRA] Error fetching invoice:', error.response?.data || error.message);
        throw new Error('Erro ao buscar detalhes da cobrança');
    }
}

/**
 * Get payment details for an installment
 */
async function getPaymentDetails(installmentId) {
    try {
        const response = await axios.get(
            `${CIABRA_API}/payments/applications/installments/${installmentId}`,
            {
                headers: {
                    'Authorization': `Basic ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('[CIABRA] Error fetching payment:', error.response?.data || error.message);
        throw new Error('Erro ao buscar detalhes do pagamento');
    }
}

module.exports = {
    createCustomer,
    createPixInvoice,
    getInvoiceDetails,
    getPaymentDetails
};
