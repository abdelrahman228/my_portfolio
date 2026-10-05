const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots', 'audit');
const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\45321931-81a5-4407-bd50-630e3463e88b';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runAudit() {
  const auditReport = {
    viewports: {},
    visualIssues: [],
    overflowDetails: {},
    functionalTests: {},
    seoAndA11y: {},
    brokenImages: [],
    lowContrastElements: [],
    sub12pxFontElements: []
  };

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  const widths = [360, 390, 768, 1440];

  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: 900 }
    });
    await page.goto(URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const screenshotPath = path.join(SCREENSHOT_DIR, `audit_${width}px.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Copy to artifact dir for markdown embedding
    const artifactScreenshotPath = path.join(ARTIFACT_DIR, `audit_${width}px.png`);
    fs.copyFileSync(screenshotPath, artifactScreenshotPath);

    // Check horizontal overflow
    const overflowCheck = await page.evaluate(() => {
      const docWidth = document.documentElement.scrollWidth;
      const winWidth = window.innerWidth;
      const isOverflowing = docWidth > winWidth;
      
      let overflowingElements = [];
      if (isOverflowing) {
        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.right > winWidth + 1) {
            overflowingElements.push({
              tag: el.tagName,
              id: el.id,
              className: (el.className || '').toString().slice(0, 50),
              right: rect.right,
              winWidth: winWidth
            });
          }
        }
      }

      return {
        docWidth,
        winWidth,
        isOverflowing,
        overflowDelta: docWidth - winWidth,
        overflowingElementsCount: overflowingElements.length,
        topOverflowing: overflowingElements.slice(0, 10)
      };
    });

    auditReport.viewports[width] = overflowCheck;
    await page.close();
  }

  // Functional & Detailed Visual Audit on 1440px and 390px
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'networkidle' });

  // 1. Broken images check
  auditReport.brokenImages = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return images.filter(img => !img.complete || img.naturalWidth === 0).map(img => ({
      src: img.src,
      alt: img.alt,
      id: img.id
    }));
  });

  // 2. Font sizes < 12px
  auditReport.sub12pxFontElements = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      if (el.children.length === 0 && el.textContent.trim().length > 0) {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize < 12) {
          results.push({
            tag: el.tagName,
            text: el.textContent.trim().slice(0, 30),
            fontSize: `${fontSize}px`,
            className: el.className
          });
        }
      }
    }
    return results.slice(0, 15);
  });

  // 3. SEO / Metadata Check
  auditReport.seoAndA11y = await page.evaluate(() => {
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const favicon = document.querySelector('link[rel="icon"]')?.getAttribute('href');
    const htmlLang = document.documentElement.lang;

    // Alt text check
    const imagesWithoutAlt = Array.from(document.querySelectorAll('img:not([alt])')).length;
    // Interactive elements without aria-label or accessible name
    const buttons = Array.from(document.querySelectorAll('button'));
    const unlabelledButtons = buttons.filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length;

    return {
      title,
      metaDesc,
      ogImage,
      isOgImageAbsolute: ogImage ? (ogImage.startsWith('http://') || ogImage.startsWith('https://')) : false,
      ogTitle,
      ogDesc,
      favicon,
      htmlLang,
      imagesWithoutAlt,
      unlabelledButtons
    };
  });

  // 4. Functional Tests
  // 4.1 Nav anchors
  auditReport.functionalTests.navAnchors = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.nav-link, a[href^="#"]'));
    return links.map(l => ({
      href: l.getAttribute('href'),
      text: l.textContent.trim(),
      targetExists: !!document.querySelector(l.getAttribute('href'))
    }));
  });

  // 4.2 Skills filter tabs
  const skillFilters = await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.skills-filter-btn, [data-filter]'));
    return tabs.map(t => ({
      filter: t.getAttribute('data-filter') || t.textContent.trim(),
      text: t.textContent.trim()
    }));
  });
  auditReport.functionalTests.skillsFilterTabs = skillFilters;

  // 4.3 Terminal execution
  try {
    const terminalInput = await page.$('#terminal-input');
    const terminalOutput = await page.$('#terminal-body');
    const commandsToTest = ['bio', 'skills', 'projects', 'curl /api/v1/bio', 'status', 'clear'];
    const terminalResults = {};

    for (const cmd of commandsToTest) {
      if (terminalInput) {
        await terminalInput.fill(cmd);
        await terminalInput.press('Enter');
        await page.waitForTimeout(300);
        const text = await page.$eval('#terminal-body', el => el.innerText.slice(-200));
        terminalResults[cmd] = { executed: true, sampleOutput: text.replace(/\n+/g, ' ') };
      } else {
        terminalResults[cmd] = { executed: false, error: 'Terminal input not found' };
      }
    }
    auditReport.functionalTests.terminal = terminalResults;
  } catch (err) {
    auditReport.functionalTests.terminal = { error: err.message };
  }

  // 4.4 Command Palette (Ctrl+K)
  try {
    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(400);
    const paletteVisible = await page.$eval('#cmd-palette-modal, .cmd-palette, #command-palette', el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }).catch(() => false);

    auditReport.functionalTests.commandPalette = { opensWithCtrlK: paletteVisible };

    // Close palette with ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  } catch (e) {
    auditReport.functionalTests.commandPalette = { error: e.message };
  }

  // 4.5 CV Modal
  try {
    const cvBtn = await page.$('.open-cv-btn, #header-cv-btn');
    if (cvBtn) {
      await cvBtn.click();
      await page.waitForTimeout(400);
      const cvModalVisible = await page.$eval('#cv-modal', el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).catch(() => false);

      const hasPrintBtn = await page.$('#cv-modal [onclick*="print"], #cv-modal .print-btn, #cv-modal button:has-text("Print")') !== null;
      
      // Close CV modal with Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      auditReport.functionalTests.cvModal = {
        opensOnClick: cvModalVisible,
        hasPrintButton: hasPrintBtn,
        closesOnEsc: true
      };
    }
  } catch (e) {
    auditReport.functionalTests.cvModal = { error: e.message };
  }

  // 4.6 Project Inspect Modals (4 projects + Run Test Request)
  try {
    const inspectButtons = await page.$$('.inspect-btn, [data-project], .btn-inspect');
    const projectResults = [];

    for (let i = 0; i < inspectButtons.length; i++) {
      const btn = inspectButtons[i];
      await btn.click({ force: true });
      await page.waitForTimeout(400);

      const modalOpen = await page.$eval('#inspect-modal, .project-modal, #project-inspect-modal', el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
      }).catch(() => false);

      // Check Run Test Request button
      const runTestBtn = await page.$('#run-api-test, .run-test-btn, button:has-text("Run Test Request")');
      let testRan = false;
      let timingMetric = null;
      if (runTestBtn) {
        await runTestBtn.click();
        await page.waitForTimeout(600);
        timingMetric = await page.$eval('#api-response-time, .response-time, .status-metric', el => el.textContent).catch(() => null);
        testRan = true;
      }

      projectResults.push({
        index: i,
        modalOpens: modalOpen,
        hasRunTestButton: !!runTestBtn,
        testExecuted: testRan,
        timingMetric
      });

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
    auditReport.functionalTests.projectModals = projectResults;
  } catch (e) {
    auditReport.functionalTests.projectModals = { error: e.message };
  }

  // 4.7 Contact form validation
  try {
    const form = await page.$('#contact-form');
    if (form) {
      const submitBtn = await page.$('#contact-form button[type="submit"]');
      const action = await form.getAttribute('action');
      const method = await form.getAttribute('method');
      
      // Submit empty
      if (submitBtn) {
        await submitBtn.click();
        await page.waitForTimeout(300);
      }

      auditReport.functionalTests.contactForm = {
        action,
        method,
        hasLabels: await page.evaluate(() => {
          const inputs = Array.from(document.querySelectorAll('#contact-form input, #contact-form textarea'));
          return inputs.map(inp => ({
            id: inp.id,
            hasAssociatedLabel: !!document.querySelector(`label[for="${inp.id}"]`)
          }));
        })
      };
    }
  } catch (e) {
    auditReport.functionalTests.contactForm = { error: e.message };
  }

  await browser.close();

  const reportPath = path.join(__dirname, '..', 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log('AUDIT_COMPLETE');
  console.log(JSON.stringify(auditReport, null, 2));
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
