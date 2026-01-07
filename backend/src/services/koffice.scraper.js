const puppeteer = require('puppeteer-core');

const runNinjaScraper = async (dashboardUrl, username, password) => {
    let browser = null;
    try {
        console.log('[KOFFICE NINJA] Launching Headless Browser...');

        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage', // Prevent OOM in Docker
                '--no-first-run',
                '--no-zygote',
                '--single-process', // Better for low resources
            ],
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();

        // Optimize Page Load
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const blockedTypes = ['image', 'font', 'stylesheet', 'media'];
            if (blockedTypes.includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        console.log(`[KOFFICE NINJA] Navigating to Login: ${dashboardUrl}`);
        await page.goto(dashboardUrl, { waitUntil: 'networkidle2', timeout: 60000 });

        // Check if already logged in (unlikely in fresh instance, but good practice)
        // Or if we need to log in
        const loginSelector = 'input[name="login"], input[type="text"]'; // Heuristic
        const passSelector = 'input[name="senha"], input[type="password"]'; // Heuristic
        const btnSelector = 'button[type="submit"], input[type="submit"], button.btn-primary';

        // Wait for inputs
        await page.waitForSelector(passSelector, { timeout: 15000 });

        console.log('[KOFFICE NINJA] Typing Credentials...');
        await page.type(loginSelector, username);
        await page.type(passSelector, password);

        console.log('[KOFFICE NINJA] Clicking Login...');
        await Promise.all([
            page.click(btnSelector),
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
        ]);

        console.log('[KOFFICE NINJA] Dashboard Accessed. Looking for "TESTE IPTV" button...');

        // Find button by text "TESTE IPTV" logic using XPath or evaluate
        // User said: "é só clicar em TESTE IPTV na dashboard"
        // We'll search for any element containing that text
        const testeBtnFound = await page.evaluate(async () => {
            const elements = [...document.querySelectorAll('button, a, span, div')];
            const btn = elements.find(el => el.innerText && el.innerText.toUpperCase().includes('TESTE IPTV'));
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });

        if (!testeBtnFound) {
            throw new Error('Button "TESTE IPTV" not found on Dashboard.');
        }

        console.log('[KOFFICE NINJA] Clicked "TESTE IPTV". Waiting for Modal...');

        // Wait for Modal content to appear (User/Pass)
        // We assume the modal shows "Usuário:" and "Senha:" or similar
        // We'll retrieve the text content of the modal body

        // Wait a bit for AJAX
        await new Promise(r => setTimeout(r, 5000));

        const pageContent = await page.content();

        return {
            success: true,
            html: pageContent // Return HTML for parsing in controller (keeping customized logic there if needed, or parse here)
        };

    } catch (error) {
        console.error('[KOFFICE NINJA ERROR]', error);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
    }
};

module.exports = { runNinjaScraper };
