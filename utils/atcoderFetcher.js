const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fetchAtCoderProblem = async (url) => {
    console.log("Attempting to fetch from AtCoder:", url);

    let browser;
    try {
        // --- FINAL FIX: Explicitly tell Puppeteer where to find Chrome ---
        // The buildpack sets the PUPPETEER_EXECUTABLE_PATH environment variable.
        // We use it here to guarantee Puppeteer finds the correct browser installation.
        browser = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
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

