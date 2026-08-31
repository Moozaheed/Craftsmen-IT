
import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8083', { waitUntil: 'networkidle2' });
  
  const el = await page.waitForSelector('.footer-wrapper');
  if (el) {
    await el.scrollIntoView();
    await new Promise(r => setTimeout(r, 800));
    await el.screenshot({ path: '/home/bs01233/.gemini/antigravity-cli/brain/d06f49c4-0398-4302-9fee-c34e91485226/footer_mobile_exact.png' });
    console.log('SUCCESS: Captured footer_mobile_exact.png');
  }
  await browser.close();
})();
