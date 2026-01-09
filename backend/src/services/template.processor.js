const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const prisma = require('../utils/prisma');

const TemplateProcessor = {
    /**
     * Process a message template replacing variables with customer data.
     * @param {string} templateContent - The raw template string.
     * @param {object} customer - The customer object (should include plan, product, user).
     * @param {object} config - System/Payment config (whatsapp instance, payment config).
     * @returns {Promise<string>} - The processed message.
     */
    async process(templateContent, customer, config = {}) {
        if (!templateContent) return '';

        // 1. Prepare Data
        const now = new Date();
        const companyName = customer.user?.name || 'Sua Empresa';
        const planName = customer.plan?.name || 'Plano Padrão';
        const planPrice = customer.plan?.price || 0;
        const productName = customer.product?.name || 'Serviço';

        // Dates
        const dueDate = customer.dueDate ? new Date(customer.dueDate) : now;
        const dueDateFormatted = format(dueDate, "dd/MM/yyyy HH:mm", { locale: ptBR });
        const dueDateShort = format(dueDate, "dd/MM/yyyy", { locale: ptBR });
        const createdDate = customer.createdAt ? format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR }) : '-';

        // Days Remaining
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Greetings
        const hour = now.getHours();
        let saudacao = 'Olá';
        if (hour >= 5 && hour < 12) saudacao = 'Bom dia';
        else if (hour >= 12 && hour < 18) saudacao = 'Boa tarde';
        else saudacao = 'Boa noite';

        // Loyalty Logic (Mocked if not fully implemented)
        const pointsMeta = 100; // TODO: Get from config
        const points = customer.loyaltyPoints || 0;
        const pointsRemaining = Math.max(0, pointsMeta - points);
        const parabensResgate = points >= pointsMeta
            ? "🎉 Parabéns, você atingiu o limite de pontos e está pronto para resgatar sua recompensa! 🎉"
            : "";

        // Payment & Links
        // Use env var or default if not present (config not always passed fully populated yet)
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const checkoutLink = `${baseUrl}/pay/${customer.id}`;
        const invoicePdf = `${baseUrl}/invoice/pdf/${customer.id}`; // Mock
        const invoiceLink = `${baseUrl}/invoice/${customer.id}`; // Mock

        // Apps formatting
        const appsList = customer.apps?.map(app => app.name).join(', ') || 'Nenhum';
        const mac = customer.macAddress || 'Não informado';

        // Discount (Mock for Feature Campanha)
        const discount = 0;
        const discountPercentage = "Nenhum desconto ativo";
        const valueWithDiscount = planPrice - discount;

        // 2. Map Variables
        const variables = {
            // Basics
            '{{customer_name}}': customer.name,
            '{{customer_first_name}}': customer.name.split(' ')[0],
            '{{customer_whatsapp}}': customer.phone,
            '{{customer_email}}': customer.email || 'Não informado',
            '{{customer_usuario}}': customer.iptvUsername || 'Não definido',
            '{{customer_password}}': customer.iptvPassword || '*****',
            '{{customer_created_at}}': createdDate,
            '{{obs}}': customer.notes || '',

            // Company
            '{{company_name}}': companyName,
            '{{saudacoes}}': saudacao,
            '{{key}}': config.pixKey || 'Chave não configurada', // From PaymentConfig

            // Product & Plan
            '{{customer_product_name}}': productName,
            '{{customer_plan_name}}': planName,
            '{{customer_plan_value}}': `R$ ${planPrice.toFixed(2)}`,
            '{{customer_value}}': `R$ ${valueWithDiscount.toFixed(2)}`,

            // Dates & Status
            '{{customer_duedate}}': dueDateFormatted,
            '{{customer_duedate_sh}}': dueDateShort,
            '{{customer_days}}': diffDays,
            '{{customer_last_notification_date}}': '-', // Log lookup needed? Keeping simple for now.

            // Tech
            '{{apps}}': appsList,
            '{{devices}}': appsList, // Synonym?
            '{{mac}}': mac,
            '{{telas}}': '1', // Default or from Plan

            // Links
            '{{customer_checkout}}': checkoutLink,
            '{{customer_invoice}}': invoiceLink,
            '{{customer_invoice_pdf}}': invoicePdf,

            // Loyalty
            '{{total_pontos}}': points,
            '{{pontos_restantes}}': pointsRemaining,
            '{{proximo_limite_recompensa}}': pointsMeta,
            '{{parabens_resgate}}': parabensResgate,
            '{{total_resgates}}': '0', // TODO
            '{{total_pontos_resgatados}}': '0', // TODO

            // Indication
            '{{ultimo_indicado}}': 'Ninguém', // TODO
            '{{total_indicados}}': '0', // TODO

            // Discount / Marketing
            '{{customer_discount}}': `R$ ${discount.toFixed(2)}`,
            '{{customer_discount_percentage}}': discountPercentage,
            '{{customer_plan_value_with_discount}}': `R$ ${valueWithDiscount.toFixed(2)}`
        };

        // 3. Replace All
        let processed = templateContent;
        for (const [key, value] of Object.entries(variables)) {
            // Regex to replace all occurrences case-insensitive? usually variables are exact match
            // Using split/join for simple global replacement
            processed = processed.split(key).join(value);
        }

        return processed;
    }
};

module.exports = TemplateProcessor;
