const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function generateAssets() {
  const browser = await chromium.launch();
  const imagesDir = path.join(__dirname, '..', 'assets', 'images');

  // Crisp circular logo SVG (Navy #111B2E, Orange #F5A524, White #FFFFFF)
  // Clean geometric paths with NO blurry outer artifacts, perfectly transparent background outside the circle
  const logoSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
      <!-- Crisp Navy Background Circle -->
      <circle cx="256" cy="256" r="248" fill="#111B2E" stroke="#F5A524" stroke-width="12"/>
      <circle cx="256" cy="256" r="230" fill="none" stroke="#1E2A40" stroke-width="4"/>
      
      <!-- Terminal prompt / Backend Monogram Elements -->
      <!-- Left Angle Bracket in Vibrant Orange -->
      <path d="M160 176 L224 256 L160 336" fill="none" stroke="#F5A524" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
      
      <!-- Center Cursor Underline in Pure White -->
      <line x1="250" y1="336" x2="352" y2="336" stroke="#FFFFFF" stroke-width="32" stroke-linecap="round"/>
      
      <!-- Monogram Tag: EID DEV -->
      <text x="296" y="240" font-family="'JetBrains Mono', 'Segoe UI', monospace" font-size="76" font-weight="800" fill="#FFFFFF" letter-spacing="4">EID</text>
      <text x="296" y="292" font-family="'JetBrains Mono', 'Segoe UI', monospace" font-size="28" font-weight="600" fill="#F5A524" letter-spacing="6">DEV</text>
    </svg>
  `;

  // 1. logo.png (512x512 transparent, target < 60KB)
  {
    const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;width:512px;height:512px;">${logoSvg}</body></html>`);
    await page.screenshot({ path: path.join(imagesDir, 'logo.png'), omitBackground: true });
    await page.close();
  }

  // 2. logo-192.png (192x192 transparent)
  {
    const page = await browser.newPage({ viewport: { width: 192, height: 192 } });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;width:192px;height:192px;">${logoSvg}</body></html>`);
    await page.screenshot({ path: path.join(imagesDir, 'logo-192.png'), omitBackground: true });
    await page.close();
  }

  // 3. favicon-32.png (32x32 transparent)
  {
    const page = await browser.newPage({ viewport: { width: 32, height: 32 } });
    await page.setContent(`<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:transparent;width:32px;height:32px;">${logoSvg}</body></html>`);
    await page.screenshot({ path: path.join(imagesDir, 'favicon-32.png'), omitBackground: true });
    await page.close();
  }

  // Also update favicon.svg
  fs.writeFileSync(path.join(imagesDir, 'favicon.svg'), logoSvg.trim());

  // 4. apple-touch-icon.png (180x180, navy background #111B2E)
  {
    const page = await browser.newPage({ viewport: { width: 180, height: 180 } });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;overflow:hidden;background:#111B2E;width:180px;height:180px;display:flex;align-items:center;justify-content:center;">
          <div style="width:160px;height:160px;">${logoSvg}</div>
        </body>
      </html>
    `);
    await page.screenshot({ path: path.join(imagesDir, 'apple-touch-icon.png') });
    await page.close();
  }

  // 5. og-image.png (1200x630: navy #0A0F1A background, logo centered, crisp vector layout, target < 200KB)
  {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              width: 1200px;
              height: 630px;
              background-color: #0A0F1A;
              font-family: 'Segoe UI', -apple-system, sans-serif;
              color: #F1F5F9;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 1px solid #1E2A40;
            }
            .grid-bg {
              position: absolute;
              inset: 0;
              background-image: 
                linear-gradient(to right, rgba(30, 42, 64, 0.35) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(30, 42, 64, 0.35) 1px, transparent 1px);
              background-size: 48px 48px;
            }
            .content-box {
              position: relative;
              z-index: 2;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .logo-wrap {
              width: 160px;
              height: 160px;
              margin-bottom: 24px;
            }
            .badge {
              display: inline-block;
              background: #111B2E;
              border: 1px solid #1E2A40;
              color: #F5A524;
              font-family: monospace;
              font-size: 14px;
              font-weight: 700;
              padding: 6px 20px;
              border-radius: 9999px;
              margin-bottom: 16px;
              letter-spacing: 0.1em;
            }
            .title {
              font-size: 50px;
              font-weight: 800;
              letter-spacing: -0.02em;
              color: #F1F5F9;
              margin-bottom: 10px;
              text-align: center;
            }
            .subtitle {
              font-size: 22px;
              font-weight: 500;
              color: #94A3B8;
              margin-bottom: 26px;
              text-align: center;
            }
            .tags {
              display: flex;
              gap: 12px;
            }
            .tag {
              background: #111B2E;
              border: 1px solid #1E2A40;
              color: #3B82F6;
              font-family: monospace;
              font-size: 15px;
              font-weight: 600;
              padding: 6px 18px;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="grid-bg"></div>
          <div class="content-box">
            <div class="logo-wrap">${logoSvg}</div>
            <div class="badge">BACKEND SOFTWARE ENGINEER</div>
            <h1 class="title">Abdulrahman Mohammed Eid</h1>
            <p class="subtitle">Node.js · TypeScript · NestJS · Scalable Architecture</p>
            <div class="tags">
              <span class="tag">REST & GraphQL APIs</span>
              <span class="tag">Redis Caching</span>
              <span class="tag">MongoDB & SQL</span>
              <span class="tag">Secure Auth & RBAC</span>
            </div>
          </div>
        </body>
      </html>
    `);
    await page.screenshot({ path: path.join(imagesDir, 'og-image.png') });
    await page.close();
  }

  await browser.close();

  // Print file sizes
  const files = ['logo.png', 'logo-192.png', 'favicon-32.png', 'apple-touch-icon.png', 'og-image.png'];
  console.log('\n--- ASSET FILE SIZES ---');
  let valid = true;
  files.forEach(f => {
    const stats = fs.statSync(path.join(imagesDir, f));
    const kb = stats.size / 1024;
    console.log(`${f}: ${kb.toFixed(2)} KB`);
    if (f === 'logo.png' && kb >= 60) {
      console.error(`ERROR: logo.png is ${kb.toFixed(2)} KB (must be < 60 KB)`);
      valid = false;
    }
    if (f === 'og-image.png' && kb >= 200) {
      console.error(`ERROR: og-image.png is ${kb.toFixed(2)} KB (must be < 200 KB)`);
      valid = false;
    }
  });

  if (!valid) process.exit(1);
  console.log('\nALL ASSET SIZES SATISFY SPECIFICATIONS!');
}

generateAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
