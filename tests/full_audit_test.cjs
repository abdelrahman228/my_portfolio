const { chromium } = require('playwright');

(async () => {
  console.log('--- STARTING PLAYWRIGHT PORTFOLIO TEST SUITE ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let failedTests = 0;
  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
    } else {
      console.error(`[FAIL] ${message}`);
      failedTests++;
    }
  }

  // 1. Mobile Horizontal Overflow Test at 360px and 390px
  console.log('\n--- 1. MOBILE OVERFLOW CHECK ---');
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const innerWidth = await page.evaluate(() => window.innerWidth);
    console.log(`Viewport ${width}px: scrollWidth = ${scrollWidth}, innerWidth = ${innerWidth}`);
    assert(scrollWidth <= innerWidth, `No horizontal scroll at ${width}px (scrollWidth: ${scrollWidth} <= innerWidth: ${innerWidth})`);
  }

  // 2. Desktop Navigation & Anchor Links
  console.log('\n--- 2. NAVIGATION & ANCHORS ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  const navLinks = ['#about', '#skills', '#experience', '#projects', '#contact'];
  for (const link of navLinks) {
    const el = await page.$(`a[href="${link}"]`);
    assert(el !== null, `Nav link ${link} exists`);
  }

  // 3. Status Bar Simulation Labels
  console.log('\n--- 3. STATUS BAR & SIMULATED LABELS ---');
  const statusSimBadge = await page.textContent('.status-sim-badge');
  assert(statusSimBadge.includes('Demo / Simulated'), 'Status bar labeled [Demo / Simulated]');

  // 4. Hero Stats & Content
  console.log('\n--- 4. HERO STATS & CONTENT ---');
  const statItems = await page.$$eval('.stat-item', els => els.map(e => e.textContent.replace(/\s+/g, ' ').trim()));
  console.log('Stat items:', statItems);
  assert(statItems.some(s => s.includes('Top Achiever')), 'Stats contains Top Achiever');
  assert(statItems.some(s => s.includes('Backend Projects')), 'Stats contains Backend Projects');
  assert(statItems.some(s => s.includes('Graduated 2026')), 'Stats contains Graduated 2026');

  // Check forbidden claims are absent from the entire page
  const pageContent = await page.content();
  assert(!pageContent.includes('sub-millisecond'), 'Forbidden claim "sub-millisecond" is absent');
  assert(!pageContent.includes('dramatically'), 'Forbidden claim "dramatically" is absent');
  assert(!pageContent.includes('Expected Graduation: 2026'), '"Expected Graduation: 2026" is absent');
  assert(!pageContent.includes('Backend Node.js diploma'), '"Backend Node.js diploma" is absent');
  assert(!pageContent.includes('Backend Node.js Diploma'), '"Backend Node.js Diploma" is absent');

  // 5. Terminal Execution Tests
  console.log('\n--- 5. TERMINAL EXECUTION ---');
  const termInput = await page.$('#terminal-input');
  assert(termInput !== null, 'Terminal input exists');

  // Test bio command
  await termInput.fill('bio');
  await termInput.press('Enter');
  await page.waitForTimeout(100);
  let termBody = await page.textContent('#terminal-body');
  assert(termBody.includes('Abdulrahman Mohammed Eid'), 'Terminal output includes name for bio');
  assert(termBody.includes('Graduated 2026'), 'Terminal output includes (Graduated 2026)');

  // Test skills command
  await termInput.fill('skills');
  await termInput.press('Enter');
  await page.waitForTimeout(100);
  termBody = await page.textContent('#terminal-body');
  assert(termBody.toLowerCase().includes('languages:'), 'Terminal output includes skills');

  // Test projects command
  await termInput.fill('projects');
  await termInput.press('Enter');
  termBody = await page.textContent('#terminal-body');
  assert(termBody.includes('Wshwshny'), 'Terminal output includes projects');

  // Test curl command
  await termInput.fill('curl /api/v1/bio');
  await termInput.press('Enter');
  termBody = await page.textContent('#terminal-body');
  assert(termBody.includes('HTTP/1.1 200 OK'), 'Terminal output includes HTTP 200 for curl');

  // Test status command
  await termInput.fill('status');
  await termInput.press('Enter');
  termBody = await page.textContent('#terminal-body');
  assert(termBody.includes('Demo / Simulated'), 'Terminal status output includes (Demo / Simulated)');

  // Test clear command
  await termInput.fill('clear');
  await termInput.press('Enter');
  const linesAfterClear = await page.$$('#terminal-body .terminal-line');
  assert(linesAfterClear.length <= 1, 'Terminal cleared');

  // Test quick run buttons tap target size (min 44px)
  const quickBtns = await page.$$('.quick-cmd-btn');
  for (const btn of quickBtns) {
    const box = await btn.boundingBox();
    assert(box.height >= 43.5 && box.width >= 43.5, `Quick-cmd button has >= 44px tap target (h: ${box.height}, w: ${box.width})`);
  }

  // 6. Skills Filter Tabs on Unified Card
  console.log('\n--- 6. SKILLS UNIFIED CARD & FILTERING ---');
  const unifiedCard = await page.$('.skills-unified-card');
  assert(unifiedCard !== null, 'Unified skills card exists');

  const backendTab = await page.$('button[data-filter="backend"]');
  await backendTab.click();
  const langGroupHidden = await page.$eval('.skill-group[data-category="languages"]', el => el.style.display);
  const backendGroupVisible = await page.$eval('.skill-group[data-category="backend"]', el => el.style.display);
  assert(langGroupHidden === 'none', 'Languages group hidden when filtering backend');
  assert(backendGroupVisible !== 'none', 'Backend group visible when filtering backend');

  const allTab = await page.$('button[data-filter="all"]');
  await allTab.click();
  const langGroupShown = await page.$eval('.skill-group[data-category="languages"]', el => el.style.display);
  assert(langGroupShown !== 'none', 'All groups visible when clicking All Skills');

  // 7. Command Palette (Ctrl+K and ESC)
  console.log('\n--- 7. COMMAND PALETTE ---');
  await page.keyboard.press('Control+KeyK');
  const paletteActive = await page.$eval('#cmd-palette-modal', el => el.classList.contains('active'));
  assert(paletteActive, 'Command palette opens on Ctrl+K');

  await page.keyboard.press('Escape');
  const paletteClosed = await page.$eval('#cmd-palette-modal', el => !el.classList.contains('active'));
  assert(paletteClosed, 'Command palette closes on Escape');

  // 8. CV Modal (Open, ESC, Standalone)
  console.log('\n--- 8. CV MODAL ---');
  const openCvBtn = await page.$('.open-cv-btn');
  assert(openCvBtn !== null, 'Open CV button exists');
  await openCvBtn.click();
  await page.waitForTimeout(200);
  const cvActive = await page.$eval('#cv-modal', el => el.classList.contains('active'));
  assert(cvActive, 'CV modal opens on button click');

  // Verify text inside CV modal
  const cvModalText = await page.$eval('#cv-modal', el => el.textContent);
  assert(cvModalText.includes('Graduated 2026'), 'CV modal contains "Graduated 2026"');
  assert(cvModalText.includes('Route Academy Backend Node.js Course (Top Achiever)'), 'CV modal contains Course (Top Achiever)');
  assert(!cvModalText.includes('dramatically'), 'CV modal has no "dramatically"');

  // Test ESC closes CV modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const cvClosed = await page.$eval('#cv-modal', el => !el.classList.contains('active'));
  assert(cvClosed, 'CV modal closes on Escape key');

  // 9. Project Modals & Sandbox Runner (All 4 Projects)
  console.log('\n--- 9. PROJECT MODALS & SANDBOX RUNNER ---');
  const projectBtns = await page.$$('.inspect-btn');
  assert(projectBtns.length === 4, '4 Project Inspect buttons exist');

  for (let i = 0; i < projectBtns.length; i++) {
    const btn = projectBtns[i];
    const projName = await btn.getAttribute('data-project');
    await btn.click();
    await page.waitForTimeout(200);

    const modalActive = await page.$eval('#project-modal', el => el.classList.contains('active'));
    assert(modalActive, `Project modal opens for ${projName}`);

    // Click "Run Test Request"
    const runBtn = await page.$('#sandbox-run-btn');
    await runBtn.click();
    await page.waitForTimeout(450);

    const sandboxActive = await page.$eval('#sandbox-res-box', el => el.classList.contains('active'));
    assert(sandboxActive, `Sandbox test response returned for ${projName}`);

    const statusText = await page.$eval('#sandbox-res-status', el => el.textContent);
    assert(statusText.includes('Demo / Simulated'), `Sandbox status labeled Demo / Simulated for ${projName}`);

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
  }

  // 10. Image Lightbox
  console.log('\n--- 10. IMAGE LIGHTBOX ---');
  const firstProjectImgWrapper = await page.$('.project-img-wrapper');
  await firstProjectImgWrapper.click();
  await page.waitForTimeout(200);

  const lightbox = await page.$('.lightbox-overlay');
  assert(lightbox !== null, 'Lightbox overlay opened on project image click');

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const lightboxVisible = await page.isVisible('.lightbox-overlay');
  assert(!lightboxVisible, 'Lightbox closed on Escape key');

  // 11. Contact Form (Validation & Mocked Submission)
  console.log('\n--- 11. CONTACT FORM VALIDATION & SUBMISSION ---');
  // Attempt to submit empty form
  const submitBtn = await page.$('#form-submit-btn');
  await submitBtn.click();
  await page.waitForTimeout(100);

  const errorSummaryVisible = await page.$eval('#form-error-summary', el => el.style.display !== 'none');
  assert(errorSummaryVisible, 'Form error summary displayed on invalid submission');

  const nameErrorVisible = await page.$eval('#name-error', el => el.classList.contains('active'));
  assert(nameErrorVisible, 'Inline name error displayed');

  // Fill in form with valid mock data
  await page.fill('#form-name', 'Senior Engineering Lead');
  await page.fill('#form-email', 'recruiter@enterprise-tech.com');
  await page.fill('#form-subject', 'Senior Backend Engineer Role');
  await page.fill('#form-message', 'We reviewed your backend architecture and would like to discuss an opportunity.');

  // Mock Formspree response
  await page.route('https://formspree.io/f/mqkvrvla', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true })
    });
  });

  await submitBtn.click();
  await page.waitForTimeout(400);

  const statusMsgSuccess = await page.$eval('#form-status', el => el.classList.contains('success'));
  assert(statusMsgSuccess, 'Form submission displays success status message');

  // 12. Project Tags Check (Max 5 tags per project)
  console.log('\n--- 12. PROJECT TAGS COUNT (MAX 5) ---');
  const projectCards = await page.$$('.project-card');
  for (let i = 0; i < projectCards.length; i++) {
    const card = projectCards[i];
    const tagsCount = await card.$$eval('.project-pill', pills => pills.length);
    assert(tagsCount <= 5, `Project ${i + 1} has ${tagsCount} tags (<= 5)`);
  }

  // 13. Project Repository URLs
  console.log('\n--- 13. PROJECT REPOSITORY LINKS ---');
  const srahaLink = await page.$eval('a[href*="Sraha_app"]', el => el.href);
  assert(srahaLink.includes('abdelrahman228/Sraha_app'), 'Wshwshny project links to abdelrahman228/Sraha_app');

  // 14. Check Font Size of Chips (>= 12px)
  console.log('\n--- 14. CHIPS & BADGES >= 12PX ---');
  const chipFontSizes = await page.$$eval('.skill-tag, .project-pill, .timeline-badge', els => {
    return els.map(e => parseFloat(window.getComputedStyle(e).fontSize));
  });
  const allGte12 = chipFontSizes.every(size => size >= 11.9); // 12px allowance for float rounding
  assert(allGte12, `All chips have font-size >= 12px (checked ${chipFontSizes.length} chips, min found: ${Math.min(...chipFontSizes)}px)`);

  await browser.close();
  console.log(`\n========================================`);
  if (failedTests === 0) {
    console.log('ALL E2E & QA AUDIT CHECKS PASSED PERFECTLY!');
  } else {
    console.error(`FAILED CHECKS: ${failedTests}`);
    process.exit(1);
  }
})();
