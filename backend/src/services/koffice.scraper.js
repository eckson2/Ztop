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

            console.log('[KOFFICE NINJA] Cloudflare detected. Scanning frames for challenge...');

            // 3.1 Random Mouse Wiggle
            try {
                await page.mouse.move(100 + Math.random() * 200, 100 + Math.random() * 200);
            } catch (e) { /* ignore */ }

            // 3.2 Deep Frame Search & Click
            const frames = page.frames();
            for (const frame of frames) {
                try {
                    const url = frame.url();
                    // Look for Cloudflare/Turnstile frames
                    if (url.includes('cloudflare') || url.includes('turnstile') || url.includes('challenge')) {
                        console.log(`[KOFFICE NINJA] Found Challenge Frame: ${url}`);
                        const checkbox = await frame.$('input[type="checkbox"], div.ctp-checkbox-label, #challenge-stage');
                        if (checkbox) {
                            console.log('[KOFFICE NINJA] Clicking Challenge Checkbox inside frame...');
                            await checkbox.hover();
                            await checkbox.click();
                            await new Promise(r => setTimeout(r, 2000)); // Wait for verification
                        }
                    }
                } catch (err) { /* ignore frame access errors */ }
            }

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
            // Debug: Dump Body Text to see the actual error message (e.g. Error 1020)
            console.log('[KOFFICE NINJA] Timeout waiting for inputs. Dumping PAGE TEXT...');
            const bodyText = await page.evaluate(() => document.body.innerText);
            console.log('\n--- PAGE TEXT DUMP START ---\n');
            console.log(bodyText.substring(0, 1000));
            console.log('\n--- PAGE TEXT DUMP END ---\n');
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
