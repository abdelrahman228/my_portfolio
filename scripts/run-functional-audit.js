const { chromium } = require('playwright');
const fs = require('fs');

async function testAll() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  console.log('Browser launched.');
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const results = {
    links: [],
    buttons: [],
    terminal: {},
    palette: {},
    cvModal: {},
    projectModals: {},
    contactForm: {},
    contrastIssues: [],
    fontSizesUnder12: []
  };

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Scroll through page to trigger any lazy loads or animations
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });

  await page.waitForTimeout(500);

  // 1. Check all links
  const links = await page.$$eval('a', els => els.map(a => ({
    text: a.innerText.trim() || a.getAttribute('aria-label') || '',
    href: a.getAttribute('href'),
    target: a.getAttribute('target')
  })));
  results.links = links;

  // 2. Check terminal commands
  const terminalInput = await page.$('#terminal-input');
  if (terminalInput) {
    const commands = ['bio', 'skills', 'projects', 'curl /api/v1/bio', 'status', 'clear'];
    for (const cmd of commands) {
      await terminalInput.fill(cmd);
      await terminalInput.press('Enter');
      await page.waitForTimeout(200);
      const text = await page.$eval('#terminal-body', el => el.innerText.slice(-250));
      results.terminal[cmd] = text.replace(/\n+/g, ' | ');
    }
  }

  // 3. Test Command Palette
  const paletteBtn = await page.$('#cmd-palette-btn');
  if (paletteBtn) {
    await paletteBtn.click();
    await page.waitForTimeout(300);
    const isOpen = await page.$eval('#cmd-palette-modal', el => el.classList.contains('active'));
    const itemsCount = await page.$$eval('.cmd-palette-item', els => els.length);
    results.palette.openedViaBtn = isOpen;
    results.palette.itemsCount = itemsCount;
    // press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const isClosed = await page.$eval('#cmd-palette-modal', el => !el.classList.contains('active'));
    results.palette.closedViaEsc = isClosed;
  }

  // 4. Test CV Modal
  const cvBtn = await page.$('#header-cv-btn');
  if (cvBtn) {
    await cvBtn.click();
    await page.waitForTimeout(300);
    const isOpen = await page.$eval('#cv-modal', el => el.classList.contains('active'));
    const hasPrint = await page.$('#print-cv-btn') !== null;
    const hasClose = await page.$('#cv-modal-close') !== null;
    // Test Escape key on CV modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const closedViaEsc = await page.$eval('#cv-modal', el => !el.classList.contains('active'));
    results.cvModal.closedViaEsc = closedViaEsc; // Expected FALSE with current code!
    
    // If not closed via ESC, click close button to allow further tests
    if (!closedViaEsc) {
      await page.click('#cv-modal-close');
      await page.waitForTimeout(200);
    }
    results.cvModal = { isOpen, hasPrint, hasClose, closedViaEsc };
  }

  // 5. Test Project Modals & Sandbox
  const projectKeys = ['ecommerce', 'social', 'wshwshny', 'blackhorse'];
  results.projectModals.keys = {};
  for (const key of projectKeys) {
    const btn = await page.$(`.inspect-btn[data-project="${key}"]`);
    if (btn) {
      await btn.click();
      await page.waitForTimeout(300);
      const isOpen = await page.$eval('#project-modal', el => el.classList.contains('active'));
      const title = await page.$eval('#modal-project-title', el => el.innerText);

      // Click run test request
      let sandboxResult = null;
      const runBtn = await page.$('#sandbox-run-btn');
      if (runBtn) {
        await runBtn.click();
        await page.waitForTimeout(500);
        sandboxResult = {
          status: await page.$eval('#sandbox-res-status', el => el.innerText),
          latency: await page.$eval('#sandbox-res-latency', el => el.innerText),
          server: await page.$eval('#sandbox-res-server', el => el.innerText)
        };
      }

      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      results.projectModals.keys[key] = { isOpen, title, sandboxResult };
    }
  }

  // 6. Test Contact Form Validation
  const submitBtn = await page.$('#form-submit-btn');
  if (submitBtn) {
    await submitBtn.click();
    await page.waitForTimeout(300);
    const toastText = await page.$eval('#toast-notification', el => el.innerText).catch(() => '');
    results.contactForm.emptyValidationToast = toastText;
  }

  // 7. Check font sizes < 12px
  results.fontSizesUnder12 = await page.evaluate(() => {
    const under12 = [];
    document.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim().length > 0) {
        const fs = parseFloat(window.getComputedStyle(el).fontSize);
        if (fs < 12) {
          under12.push({
            selector: el.tagName.toLowerCase() + (el.className ? '.' + el.className.split(' ').join('.') : ''),
            text: el.textContent.trim().slice(0, 30),
            fontSize: fs + 'px'
          });
        }
      }
    });
    return under12;
  });

  // 8. Horizontal scroll on mobile viewports
  results.mobileOverflow = {};
  for (const w of [360, 390]) {
    await page.setViewportSize({ width: w, height: 800 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        diff: document.documentElement.scrollWidth - window.innerWidth
      };
    });
    results.mobileOverflow[w] = overflow;
  }

  await browser.close();

  fs.writeFileSync('audit-functional-results.json', JSON.stringify(results, null, 2));
  console.log('FUNCTIONAL_AUDIT_DONE');
  console.log(JSON.stringify(results, null, 2));
}

testAll().catch(e => {
  console.error(e);
  process.exit(1);
});
