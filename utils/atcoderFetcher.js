const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fetchAtCoderProblem = async (url) => {
    console.log("Attempting to fetch from AtCoder:", url);

    let browser;
    try {
        // --- CHANGE 1: Added all necessary arguments for a server environment ---
        // These flags are required to run Chrome correctly inside a container like Render's.
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--single-process'
            ]
        });

        const page = await browser.newPage();
        // It's good practice to set a realistic user agent.
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.part', { timeout: 10000 });

        const problem = await page.evaluate(() => {
            const title = document.querySelector('.h2')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim();
            const enSection = document.querySelector(".lang-en");
            const statement = enSection?.innerHTML || document.querySelector('.part')?.innerHTML || null;

            const sampleInputs = [];
            const sampleOutputs = [];

            // This logic is specific to AtCoder's structure
            const h3s = Array.from(document.querySelectorAll('h3'));
            h3s.forEach(h3 => {
                const text = h3.innerText.trim();
                // Find the next <pre> tag after the <h3>
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

        // --- CHANGE 2: Fixed a critical bug in error handling ---
        // This function should not send an HTTP response. It should return data or throw an error.
        if (!problem.title || !problem.statement) {
            // If scraping fails to find the content, throw an error to be caught by the controller.
            throw new Error("Could not parse problem title or statement from the page.");
        }

        console.log("Successfully parsed problem:", problem.title);
        return problem;

    } catch (err) {
        // --- CHANGE 3: Improved error cleanup and propagation ---
        console.error('Error in fetchAtCoderProblem:', err.message);
        if (browser) {
            await browser.close().catch(closeErr => console.error('Error closing browser:', closeErr));
        }
        // Re-throw the error so the controller that called this function knows it failed.
        throw err;
    }
};

module.exports = { fetchAtCoderProblem };
