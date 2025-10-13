const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const fetchAtCoderProblem = async (req, res) => {
    
    const url = `https://atcoder.jp/contests/abc426/tasks/abc426_a`; // static for now
    console.log("ok")
    let browser;
    try {
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('.part', { timeout: 10000 });

        const problem = await page.evaluate(() => {
            // Title
            const title = document.querySelector('.h2')?.innerText?.trim() || document.querySelector('h1')?.innerText?.trim();

            // Try to get English version first
            const enSection = document.querySelector(".lang-en");
            
            const statement = enSection?.innerHTML || document.querySelector('.part')?.innerHTML || null;

            // Sample inputs/outputs
            const sampleInputs = [];
            const sampleOutputs = [];

            const h3s = Array.from(document.querySelectorAll('h3'));
            h3s.forEach(h3 => {
                const text = h3.innerText.trim();
                const next = h3.nextElementSibling;

                if (text === 'Sample Input' && next && next.tagName.toLowerCase() === 'pre') {
                    sampleInputs.push(next.innerText.trim());
                }
                if (text === 'Sample Output' && next && next.tagName.toLowerCase() === 'pre') {
                    sampleOutputs.push(next.innerText.trim());
                }
            });

            return { title, statement, sampleInputs, sampleOutputs };
        });

        await browser.close();

        if (!problem.title || !problem.statement) {
            return res.status(502).json({ message: "Could not fetch problem content" });
        }

        console.log(problem);
        res.json(problem);

    } catch (err) {
        if (browser) await browser.close().catch(() => {});
        console.error('Error fetching AtCoder problem:', err.message);
        res.status(500).json({ message: 'Error fetching AtCoder problem', error: err.message });
    }
};

module.exports = { fetchAtCoderProblem };
