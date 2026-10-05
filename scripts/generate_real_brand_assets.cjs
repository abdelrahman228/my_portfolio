const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const UPNG = require('upng-js');

async function generateBrandAssets() {
  console.log('=== GENERATING AUTHENTIC BRAND ASSETS FROM brand-logo.png ===');
  const imagesDir = path.join(__dirname, '..', 'assets', 'images');
  const sourcePath = path.join(imagesDir, 'brand-logo.png');

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source file not found at ${sourcePath}`);
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const base64Img = fs.readFileSync(sourcePath).toString('base64');

  // Parameters derived from subpixel analysis of brand-logo.png
  // Center of outer circle: cx = 506, cy = 499
  // Outer radius of orange ring: r = 447
  // Monogram bounds: sx = 175, sy = 160, sw = 662, sh = 335
  const config = {
    cx: 506,
    cy: 499,
    r: 447,
    monogram: { sx: 175, sy: 160, sw: 662, sh: 335 }
  };

  // 1. Generate 512x512 logo.png (transparent background, masked circle, < 60KB)
  console.log('\n1. Generating logo.png (512x512, transparent, < 60KB)...');
  const logo512DataUrl = await page.evaluate(async ({ base64, config }) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // High-res supersampled canvas (1024x1024) for ultra-clean edge antialiasing
        const hiCanvas = document.createElement('canvas');
        hiCanvas.width = 1024;
        hiCanvas.height = 1024;
        const hiCtx = hiCanvas.getContext('2d');
        hiCtx.imageSmoothingEnabled = true;
        hiCtx.imageSmoothingQuality = 'high';

        // Apply clean circular mask centered on the logo
        hiCtx.save();
        hiCtx.beginPath();
        hiCtx.arc(512, 512, 498, 0, Math.PI * 2);
        hiCtx.closePath();
        hiCtx.clip();

        // Draw source onto supersampled canvas
        hiCtx.drawImage(
          img,
          config.cx - config.r, config.cy - config.r, config.r * 2, config.r * 2,
          14, 14, 996, 996
        );
        hiCtx.restore();

        // Downsample to 512x512 with bicubic smoothing
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 512;
        finalCanvas.height = 512;
        const finalCtx = finalCanvas.getContext('2d');
        finalCtx.imageSmoothingEnabled = true;
        finalCtx.imageSmoothingQuality = 'high';
        finalCtx.drawImage(hiCanvas, 0, 0, 512, 512);

        resolve(finalCanvas.toDataURL('image/png'));
      };
      img.src = `data:image/png;base64,${base64}`;
    });
  }, { base64: base64Img, config });

  // Compress logo.png with UPNG palette quantization to guarantee < 60KB while keeping 8-bit alpha antialiasing
  {
    const rawBuffer = Buffer.from(logo512DataUrl.split(',')[1], 'base64');
    const decoded = UPNG.decode(rawBuffer);
    const rgba = UPNG.toRGBA8(decoded)[0];
    // 160 colors gives ~54 KB, well under 60 KB
    const compressed = Buffer.from(UPNG.encode([rgba], 512, 512, 160));
    const targetPath = path.join(imagesDir, 'logo.png');
    fs.writeFileSync(targetPath, compressed);
    const kb = compressed.byteLength / 1024;
    console.log(`Saved logo.png: ${kb.toFixed(2)} KB (Target: < 60 KB)`);
    if (kb >= 60) {
      throw new Error(`logo.png is too large (${kb.toFixed(2)} KB)`);
    }
  }

  // 2. Generate 192x192 logo-192.png (transparent background)
  console.log('\n2. Generating logo-192.png (192x192, transparent)...');
  const logo192DataUrl = await page.evaluate(async ({ base64, config }) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 192;
        canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.save();
        ctx.beginPath();
        ctx.arc(96, 96, 92, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(
          img,
          config.cx - config.r, config.cy - config.r, config.r * 2, config.r * 2,
          4, 4, 184, 184
        );
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = `data:image/png;base64,${base64}`;
    });
  }, { base64: base64Img, config });

  {
    const rawBuffer = Buffer.from(logo192DataUrl.split(',')[1], 'base64');
    const decoded = UPNG.decode(rawBuffer);
    const rgba = UPNG.toRGBA8(decoded)[0];
    const compressed = Buffer.from(UPNG.encode([rgba], 192, 192, 200));
    fs.writeFileSync(path.join(imagesDir, 'logo-192.png'), compressed);
    console.log(`Saved logo-192.png: ${(compressed.byteLength / 1024).toFixed(2)} KB`);
  }

  // 3. Generate 32x32 favicon-32.png (Crop to AE monogram for optimal tab legibility)
  console.log('\n3. Generating favicon-32.png (32x32, cropped to AE mark for high legibility)...');
  const favicon32DataUrl = await page.evaluate(async ({ base64, config }) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Deep Navy Circular Badge matching brand palette
        ctx.beginPath();
        ctx.arc(16, 16, 15.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0B132B';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#F5A524';
        ctx.stroke();

        // Clip inside circle and draw the < AE > monogram bold and centered
        ctx.save();
        ctx.beginPath();
        ctx.arc(16, 16, 14.5, 0, Math.PI * 2);
        ctx.clip();
        
        // Monogram crop from source
        const m = config.monogram;
        ctx.drawImage(img, m.sx, m.sy, m.sw, m.sh, 3, 9.25, 26, 13.5);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = `data:image/png;base64,${base64}`;
    });
  }, { base64: base64Img, config });

  {
    const buf = Buffer.from(favicon32DataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(imagesDir, 'favicon-32.png'), buf);
    console.log(`Saved favicon-32.png: ${buf.byteLength} bytes`);
  }

  // 4. Generate 180x180 apple-touch-icon.png (navy background #0A0F1A)
  console.log('\n4. Generating apple-touch-icon.png (180x180, navy background)...');
  const appleTouchDataUrl = await page.evaluate(async ({ base64, config }) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Solid navy background
        ctx.fillStyle = '#0A0F1A';
        ctx.fillRect(0, 0, 180, 180);

        // Circular masked logo centered with 12px padding
        ctx.save();
        ctx.beginPath();
        ctx.arc(90, 90, 78, 0, Math.PI * 2);
        ctx.clip();

        ctx.drawImage(
          img,
          config.cx - config.r, config.cy - config.r, config.r * 2, config.r * 2,
          12, 12, 156, 156
        );
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = `data:image/png;base64,${base64}`;
    });
  }, { base64: base64Img, config });

  {
    const buf = Buffer.from(appleTouchDataUrl.split(',')[1], 'base64');
    fs.writeFileSync(path.join(imagesDir, 'apple-touch-icon.png'), buf);
    console.log(`Saved apple-touch-icon.png: ${(buf.byteLength / 1024).toFixed(2)} KB`);
  }

  // 5. Generate 1200x630 og-image.png (navy #0A0F1A, logo centered, < 200KB)
  console.log('\n5. Generating og-image.png (1200x630, navy #0A0F1A, logo centered)...');
  {
    const logoPngBase64 = fs.readFileSync(path.join(imagesDir, 'logo.png')).toString('base64');
    const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
    await ogPage.setContent(`
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
              position: relative;
              overflow: hidden;
            }
            .grid-bg {
              position: absolute;
              inset: 0;
              background-image: 
                linear-gradient(to right, rgba(30, 42, 64, 0.35) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(30, 42, 64, 0.35) 1px, transparent 1px);
              background-size: 48px 48px;
            }
            .glow-effect {
              position: absolute;
              width: 500px;
              height: 500px;
              background: radial-gradient(circle, rgba(245, 165, 36, 0.12) 0%, rgba(11, 19, 43, 0) 70%);
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              pointer-events: none;
            }
            .content-box {
              position: relative;
              z-index: 2;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .logo-wrap {
              width: 170px;
              height: 170px;
              margin-bottom: 22px;
              filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5));
            }
            .logo-img {
              width: 100%;
              height: 100%;
              object-fit: contain;
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
              margin-bottom: 14px;
              letter-spacing: 0.1em;
            }
            .title {
              font-size: 48px;
              font-weight: 800;
              letter-spacing: -0.02em;
              color: #F1F5F9;
              margin-bottom: 8px;
              text-align: center;
            }
            .subtitle {
              font-size: 21px;
              font-weight: 500;
              color: #94A3B8;
              margin-bottom: 24px;
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
          <div class="glow-effect"></div>
          <div class="content-box">
            <div class="logo-wrap">
              <img src="data:image/png;base64,${logoPngBase64}" class="logo-img" alt="Abdulrahman Eid Logo">
            </div>
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
    const ogPath = path.join(imagesDir, 'og-image.png');
    await ogPage.screenshot({ path: ogPath });
    await ogPage.close();
    const ogKb = fs.statSync(ogPath).size / 1024;
    console.log(`Saved og-image.png: ${ogKb.toFixed(2)} KB (Target: < 200 KB)`);
    if (ogKb >= 200) {
      throw new Error(`og-image.png is too large (${ogKb.toFixed(2)} KB)`);
    }
  }

  // 6. Delete old invented favicon.svg
  const svgPath = path.join(imagesDir, 'favicon.svg');
  if (fs.existsSync(svgPath)) {
    fs.unlinkSync(svgPath);
    console.log('\nDeleted invented assets/images/favicon.svg successfully.');
  }

  await browser.close();
  console.log('\n=== ALL BRAND ASSETS REGENERATED SUCCESSFULLY ===');
}

generateBrandAssets().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
