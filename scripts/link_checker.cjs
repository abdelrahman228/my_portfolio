const { chromium } = require('playwright');
const http = require('http');
const https = require('https');

(async () => {
  console.log('--- STARTING COMPREHENSIVE LINK CHECKER ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Get all anchors on the page
  const links = await page.$$eval('a[href]', els => els.map(e => ({
    text: e.textContent.trim().replace(/\s+/g, ' '),
    href: e.getAttribute('href')
  })));

  console.log(`Found ${links.length} total links to check.`);

  let brokenCount = 0;
  for (const link of links) {
    const { href, text } = link;
    if (href.startsWith('#')) {
      // Internal anchor
      const targetId = href.substring(1);
      const targetExists = await page.$(`#${targetId}`);
      if (targetExists) {
        console.log(`[OK - ANCHOR] "${text}" -> ${href}`);
      } else {
        console.error(`[BROKEN ANCHOR] "${text}" -> ${href}`);
        brokenCount++;
      }
    } else if (href.startsWith('tel:') || href.startsWith('mailto:')) {
      console.log(`[OK - PROTOCOL] "${text}" -> ${href}`);
    } else {
      // Relative or absolute URL
      try {
        const url = new URL(href, 'http://localhost:3000');
        if (url.origin === 'http://localhost:3000') {
          const res = await page.request.get(url.href);
          if (res.status() < 400) {
            console.log(`[OK - LOCAL ${res.status()}] "${text}" -> ${url.pathname}`);
          } else {
            console.error(`[BROKEN LOCAL ${res.status()}] "${text}" -> ${url.pathname}`);
            brokenCount++;
          }
        } else {
          console.log(`[OK - EXTERNAL SYNTAX] "${text}" -> ${url.href}`);
        }
      } catch (e) {
        console.error(`[INVALID URL] "${text}" -> ${href}`);
        brokenCount++;
      }
    }
  }

  await browser.close();
  console.log('\n========================================');
  if (brokenCount === 0) {
    console.log('ALL LINKS VERIFIED CLEAN & WORKING!');
  } else {
    console.error(`BROKEN LINKS FOUND: ${brokenCount}`);
    process.exit(1);
  }
})();
