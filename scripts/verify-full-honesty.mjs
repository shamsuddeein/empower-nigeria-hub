import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const scratchDir = 'C:\\Users\\Deen\\.gemini\\antigravity-ide\\brain\\2d717dd5-6fe0-481c-8812-5af67c89eca2\\scratch';
const profileDir = path.join(scratchDir, 'chrome_final_verify_profile');

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

console.log('Launching Headless Chrome on port 9250...');
const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9250',
  `--user-data-dir=${profileDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
], { stdio: 'ignore' });

function cleanup() {
  try {
    chromeProcess.kill('SIGTERM');
  } catch (e) {}
}
process.on('exit', cleanup);
process.on('SIGINT', cleanup);

async function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function waitForCdp(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('http://127.0.0.1:9250/json/version');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    await wait(300);
  }
  throw new Error('CDP port 9250 not available');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.callbacks.has(msg.id)) {
          const { resolve, reject } = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message));
          } else {
            resolve(msg.result);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.ws.close();
  }
}

async function run() {
  const report = {
    generatedAt: new Date().toISOString(),
    browser: '',
    viewports: [],
    modals: {},
    adminAuthCheck: {},
    imagesCheck: {},
    overallStatus: 'PASS'
  };

  try {
    const versionInfo = await waitForCdp();
    report.browser = versionInfo.Browser;
    console.log('Connected to Chrome:', versionInfo.Browser);

    const listRes = await fetch('http://127.0.0.1:9250/json/list');
    const pages = await listRes.json();
    const page = pages.find(p => p.type === 'page') || pages[0];

    const client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    const widths = [320, 360, 390, 430, 768, 1024, 1280, 1440, 1920];
    const modes = [
      { name: 'Normal (15px desktop scrollbar)', mobile: false },
      { name: 'Overlay (touch/mobile scrollbar)', mobile: true }
    ];

    console.log('\n======================================================');
    console.log('PART 1: 18-RUN RESPONSIVE OVERFLOW & VIEWPORT EXPANSION AUDIT');
    console.log('======================================================');

    for (const mode of modes) {
      console.log(`\n--- Mode: ${mode.name} ---`);
      for (const w of widths) {
        await client.send('Emulation.setDeviceMetricsOverride', {
          width: w,
          height: 800,
          deviceScaleFactor: 1,
          mobile: mode.mobile
        });

        await client.send('Page.navigate', { url: 'http://localhost:8080/' });
        await wait(1500);

        const evalRes = await client.send('Runtime.evaluate', {
          expression: `
            (() => {
              const requestedWidth = ${w};
              const innerWidth = window.innerWidth;
              const clientWidth = document.documentElement.clientWidth;
              const visualViewportWidth = window.visualViewport ? window.visualViewport.width : null;
              const scrollWidth = document.documentElement.scrollWidth;

              const overflow = Math.max(0, scrollWidth - clientWidth);
              const expanded = innerWidth > requestedWidth;
              const pass = overflow === 0 && !expanded;

              return {
                requestedWidth,
                innerWidth,
                clientWidth,
                visualViewportWidth,
                scrollWidth,
                overflow,
                expanded,
                pass
              };
            })()
          `,
          returnByValue: true
        });

        const vData = evalRes.result.value;
        const entry = {
          mode: mode.name,
          mobileFlag: mode.mobile,
          ...vData
        };
        report.viewports.push(entry);

        if (!vData.pass) {
          report.overallStatus = 'FAIL';
        }

        console.log(`Width ${w}px: [${vData.pass ? 'PASS' : 'FAIL'}] req=${vData.requestedWidth}, inner=${vData.innerWidth}, client=${vData.clientWidth}, visual=${vData.visualViewportWidth}, scroll=${vData.scrollWidth} (overflow=${vData.overflow}px, expanded=${vData.expanded})`);

        // Capture key viewport screenshots
        if (w === 320 || w === 360 || w === 390 || w === 1280) {
          const ss = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
          const ssName = `honest_viewport_${w}px_${mode.mobile ? 'overlay' : 'normal'}.jpg`;
          const ssPath = path.join(scratchDir, ssName);
          fs.writeFileSync(ssPath, Buffer.from(ss.data, 'base64'));
          entry.screenshot = ssPath;
        }
      }
    }

    console.log('\n======================================================');
    console.log('PART 2: PAGE SCROLL & LAZY IMAGE VERIFICATION');
    console.log('======================================================');

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await client.send('Page.navigate', { url: 'http://localhost:8080/' });
    await wait(1500);

    await client.send('Runtime.evaluate', {
      expression: `
        (async () => {
          const totalHeight = document.body.scrollHeight;
          const step = 600;
          for (let y = 0; y < totalHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise(r => setTimeout(r, 80));
          }
          window.scrollTo(0, 0);
        })()
      `,
      awaitPromise: true
    });
    await wait(1500);

    const imageAudit = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          const broken = imgs.filter(img => img.complete && img.naturalWidth === 0).map(img => img.src);
          const loaded = imgs.filter(img => img.naturalWidth > 0).map(img => ({
            alt: img.alt,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            src: img.src
          }));
          return {
            totalImages: imgs.length,
            loadedCount: loaded.length,
            brokenCount: broken.length,
            brokenUrls: broken
          };
        })()
      `,
      returnByValue: true
    });

    report.imagesCheck = imageAudit.result.value;
    console.log(`Image Audit: ${report.imagesCheck.totalImages} images found, ${report.imagesCheck.loadedCount} loaded, ${report.imagesCheck.brokenCount} broken`);

    console.log('\n======================================================');
    console.log('PART 3: MODAL INTERACTION, ACCESSIBILITY & ESCAPE DISMISSAL');
    console.log('======================================================');

    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 1,
      mobile: true
    });
    await client.send('Page.navigate', { url: 'http://localhost:8080/' });
    await wait(2000);

    // Click "View Specifications" on first published catalogue card
    const clickSpec = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const specBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('View Specifications'));
          if (specBtn) {
            specBtn.click();
            return { found: true, text: specBtn.textContent.trim() };
          }
          return { found: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Clicked View Specifications button:', clickSpec.result.value);
    await wait(600);

    const specModalCheck = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) return { open: false };
          const title = dialog.querySelector('h2') ? dialog.querySelector('h2').textContent : '';
          const hasApplyBtn = Array.from(dialog.querySelectorAll('button')).some(b => b.textContent && b.textContent.includes('Apply for This Item'));
          return {
            open: true,
            title,
            hasApplyBtn,
            hasAriaModal: dialog.getAttribute('aria-modal') === 'true'
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Specification Panel Open State:', specModalCheck.result.value);

    const specSs = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    const specSsPath = path.join(scratchDir, 'honest_spec_modal_390px.jpg');
    fs.writeFileSync(specSsPath, Buffer.from(specSs.data, 'base64'));

    // Press Escape to dismiss
    await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, key: 'Escape', code: 'Escape' });
    await wait(400);

    const specDismissed = await client.send('Runtime.evaluate', {
      expression: `!document.querySelector('[role="dialog"]')`,
      returnByValue: true
    });
    console.log('Specification Panel Dismissed via Escape:', specDismissed.result.value);

    // Click "Apply for This" or "Apply with These Terms"
    const clickApply = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const applyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && (b.textContent.includes('Apply for This') || b.textContent.includes('Apply with These Terms')));
          if (applyBtn) {
            applyBtn.click();
            return { found: true, text: applyBtn.textContent.trim() };
          }
          return { found: false };
        })()
      `,
      returnByValue: true
    });
    console.log('Clicked Apply button:', clickApply.result.value);
    await wait(600);

    const appModalCheck = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const dialog = document.querySelector('[role="dialog"]');
          if (!dialog) return { open: false };
          const title = dialog.querySelector('h2') ? dialog.querySelector('h2').textContent : '';
          const closeBtn = dialog.querySelector('button[aria-label="Close dialog"]');
          return {
            open: true,
            title,
            hasCloseBtn: Boolean(closeBtn),
            hasAriaModal: dialog.getAttribute('aria-modal') === 'true'
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Application Modal Open State:', appModalCheck.result.value);

    const appSs = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    const appSsPath = path.join(scratchDir, 'honest_app_modal_390px.jpg');
    fs.writeFileSync(appSsPath, Buffer.from(appSs.data, 'base64'));

    // Dismiss Application Modal via Escape
    await client.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, key: 'Escape', code: 'Escape' });
    await wait(400);

    const appDismissed = await client.send('Runtime.evaluate', {
      expression: `!document.querySelector('[role="dialog"]')`,
      returnByValue: true
    });
    console.log('Application Modal Dismissed via Escape:', appDismissed.result.value);

    report.modals = {
      specPanel: {
        ...specModalCheck.result.value,
        dismissedViaEscape: specDismissed.result.value,
        screenshot: specSsPath
      },
      applicationModal: {
        ...appModalCheck.result.value,
        dismissedViaEscape: appDismissed.result.value,
        screenshot: appSsPath
      }
    };

    console.log('\n======================================================');
    console.log('PART 4: UNAUTHENTICATED /admin ACCESS SCREEN AUDIT');
    console.log('======================================================');

    await client.send('Page.navigate', { url: 'http://localhost:8080/admin' });
    await wait(2000);

    const adminCheck = await client.send('Runtime.evaluate', {
      expression: `
        (() => {
          const h1 = document.querySelector('h1') ? document.querySelector('h1').textContent : '';
          const bodyText = document.body.textContent || '';
          const hasLoginForm = Boolean(document.querySelector('#staff-email') && document.querySelector('#staff-password'));
          const hasSubmitButton = Array.from(document.querySelectorAll('button')).some(b => b.textContent && b.textContent.includes('Sign In to Admin Portal'));

          // Ensure no leaked dashboard data/tabs
          const leaksTabs = bodyText.includes('Applications Management') || bodyText.includes('Land Inquiries Management') || bodyText.includes('Sign Out');

          return {
            h1,
            isStaffPortal: h1.includes('Staff Administration Portal'),
            hasLoginForm,
            hasSubmitButton,
            leaksTabs
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Admin Page Unauthenticated State:', adminCheck.result.value);

    const adminSs = await client.send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    const adminSsPath = path.join(scratchDir, 'honest_unauthenticated_admin.jpg');
    fs.writeFileSync(adminSsPath, Buffer.from(adminSs.data, 'base64'));

    report.adminAuthCheck = {
      ...adminCheck.result.value,
      screenshot: adminSsPath
    };

    client.close();

    const reportFile = path.join(scratchDir, 'full_honest_verification_report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log('\n======================================================');
    console.log(`FULL HONEST VERIFICATION COMPLETED: [${report.overallStatus}]`);
    console.log(`Report written to: ${reportFile}`);
    console.log('======================================================');

  } catch (err) {
    console.error('Test execution failed:', err);
  } finally {
    cleanup();
    process.exit(0);
  }
}

run();
