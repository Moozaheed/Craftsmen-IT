
import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto("http://localhost:8083", { waitUntil: "networkidle2" });
  
  // Scroll to footer
  await page.evaluate(() => {
    const footer = document.querySelector("#main-footer") || document.querySelector(".footer-wrapper");
    if (footer) footer.scrollIntoView();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: "/home/bs01233/.gemini/antigravity-cli/brain/d06f49c4-0398-4302-9fee-c34e91485226/footer_mobile_before.png" });
  await browser.close();
  console.log("Captured footer_mobile_before.png");
})();
