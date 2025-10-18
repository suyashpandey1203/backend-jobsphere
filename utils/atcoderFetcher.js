const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const PCR = require('puppeteer-chromium-resolver'); // Import the new package

puppeteer.use(StealthPlugin());

const fetchAtCoderProblem = async (url) => {
    console.log("Attempting to fetch from AtCoder:", url);

    let browser;
    try {
        // --- THIS IS THE NEW RELIABLE METHOD ---
        // 1. Run the resolver. It will download a compatible version of Chromium
        //    if it doesn't exist, and then return its location.
        console.log("Running Puppeteer-Chromium-Resolver to get browser stats...");
        const stats = await PCR();

        console.log(`Resolver found browser: Revision=${stats.revision}, Path=${stats.executablePath}`);

        // 2. Launch Puppeteer using the GUARANTEED path from the resolver.
        browser = await puppeteer.launch({
            executablePath: stats.executablePath, // Use the path from the resolver
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ]
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.part', { timeout: 10000 });

        const problem = await page.evaluate(() => {
            const title = document.querySelector('.h2')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim();
            const enSection = document.querySelector(".lang-en");
            const statement = enSection?.innerHTML || document.querySelector('.part')?.innerHTML || null;
            const sampleInputs = [];
            const sampleOutputs = [];

            const h3s = Array.from(document.querySelectorAll('h3'));
            h3s.forEach(h3 => {
                const text = h3.innerText.trim();
                let nextElement = h3.nextElementSibling;
                while (nextElement && nextElement.tagName.toLowerCase() !== 'pre') {
                    nextElement = nextElement.nextElementSibling;
                }
                if (text.startsWith('Sample Input') && nextElement) {
                    sampleInputs.push(nextElement.innerText.trim());
                }
                if (text.startsWith('Sample Output') && nextElement) {
                    sampleOutputs.push(nextElement.innerText.trim());
                }
            });
            return { title, statement, sampleInputs, sampleOutputs };
        });

        await browser.close();

        if (!problem.title || !problem.statement) {
            throw new Error("Could not parse problem title or statement from the page.");
        }
        console.log("Successfully parsed problem:", problem.title);
        return problem;

    } catch (err) {
        console.error('Error in fetchAtCoderProblem:', err.message);
        if (browser) {
            await browser.close().catch(closeErr => console.error('Error closing browser:', closeErr));
        }
        throw err;
    }
};

module.exports = { fetchAtCoderProblem };
