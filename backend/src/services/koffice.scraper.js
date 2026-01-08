const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const runNinjaScraper = async (dashboardUrl, username, password) => {
    let browser = null;
    try {
        console.log('[KOFFICE NINJA] Launching Headless Browser (Stealth Mode)...');

        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            headless: true, // 'new' can be buggy on some Alpine builds
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-zygote',
                '--disable-extensions',
                '--disable-software-rasterizer',
                '--mute-audio',
                '--window-size=1920,1080'
            ],
            ignoreHTTPSErrors: true
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Optimized Stealth: No need for manual UserAgent or WebDriver hiding, Plugin does it.

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
        await page.goto(dashboardUrl, { waitUntil: 'networkidle2', timeout: 90000 });

        // 3. Smart Cloudflare Wait (Poll for Title Change + Active Solving)
        let retries = 0;
        while (retries < 20) { // Wait up to 100s
            const title = await page.title();
            console.log(`[KOFFICE NINJA] Check ${retries + 1}/20 - Title: "${title}"`);

            if (!title.includes('Just a moment') && !title.includes('Cloudflare')) {
                break; // Passed!
            }

            console.log('[KOFFICE NINJA] Cloudflare detected. Attempting to solve...');

            // 3.1 Mouse Wiggle to prove humanity
            try {
                // Random mouse movement is key
                await page.mouse.move(100 + Math.random() * 200, 100 + Math.random() * 200);
                await page.mouse.move(300 + Math.random() * 200, 300 + Math.random() * 200);
            } catch (e) { /* ignore */ }

            // 3.2 Try to click Challenge Checkbox
            const challengeSelector = '#challenge-stage, iframe[src*="cloudflare"]';
            try {
                const challengeFrame = await page.$(challengeSelector);
                if (challengeFrame) {
                    console.log('[KOFFICE NINJA] Found potential challenge element. Hovering/Clicking...');
                    await challengeFrame.hover();
                    await challengeFrame.click();
                }
            } catch (e) { /* ignore */ }

            await new Promise(r => setTimeout(r, 5000));
            retries++;
        }

        // Check if already logged in (unlikely in fresh instance, but good practice)
        // Or if we need to log in
        const loginSelector = 'input[name="login"], input[name="username"], input[type="text"]';
        const passSelector = 'input[name="senha"], input[name="password"], input[type="password"]';
        const btnSelector = 'button[type="submit"], input[type="submit"], button.btn-primary';

        // Wait for inputs
        console.log('[KOFFICE NINJA] Waiting for Login Inputs...');
        try {
            await page.waitForSelector(passSelector, { timeout: 30000 }); // Increased to 30s
        } catch (e) {
            // Debug: Screenshot or detailed logs could go here
            console.log('[KOFFICE NINJA] Timeout waiting for inputs. Dumping HTML snippet...');
            const htmlSnippet = await page.content();
            console.log(htmlSnippet.substring(0, 500)); // Log first 500 chars to see if blocked
            throw e;
        }

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
