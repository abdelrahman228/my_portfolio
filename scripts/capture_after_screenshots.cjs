const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\45321931-81a5-4407-bd50-630e3463e88b';
const AFTER_DIR = path.join(__dirname, '..', 'screenshots', 'after');

if (!fs.existsSync(AFTER_DIR)) {
  fs.mkdirSync(AFTER_DIR, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const viewports = [
    { width: 360, height: 800, name: 'after_360px' },
    { width: 390, height: 844, name: 'after_390px' },
    { width: 768, height: 1024, name: 'after_768px' },
    { width: 1440, height: 900, name: 'after_1440px' }
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const localPath = path.join(AFTER_DIR, `${vp.name}.png`);
    const artifactPath = path.join(ARTIFACT_DIR, `${vp.name}.png`);

    await page.screenshot({ path: localPath, fullPage: true });
    fs.copyFileSync(localPath, artifactPath);

    console.log(`Captured full page screenshot: ${vp.width}px -> ${localPath} and ${artifactPath}`);
    await page.close();
  }

  await browser.close();
  console.log('ALL AFTER SCREENSHOTS CAPTURED SUCCESSFULLY!');
})();
