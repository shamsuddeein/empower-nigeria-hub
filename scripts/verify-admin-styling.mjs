import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const scratchDir = 'C:\\Users\\Deen\\.gemini\\antigravity-ide\\brain\\2d717dd5-6fe0-481c-8812-5af67c89eca2';
const tempMediaDir = path.join(scratchDir, '.tempmediaStorage');
if (!fs.existsSync(tempMediaDir)) {
  fs.mkdirSync(tempMediaDir, { recursive: true });
}

const profileDir = path.join(scratchDir, 'scratch', 'chrome_admin_verify_profile');
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

console.log('Launching Headless Chrome on port 9222...');
const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
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
      const res = await fetch('http://127.0.0.1:9222/json/version');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    await wait(300);
  }
  throw new Error('CDP port 9222 not available');
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

async function captureScreenshot(client, filepath) {
  const screenshot = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const buffer = Buffer.from(screenshot.data, 'base64');
  fs.writeFileSync(filepath, buffer);
  console.log(`Saved screenshot: ${filepath}`);
}

async function main() {
  try {
    const versionInfo = await waitForCdp();
    console.log('Connected to Chrome:', versionInfo.Browser);

    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const page = pages.find(p => p.type === 'page') || pages[0];

    const client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    const results = {};

    // 1. Verify Desktop Layout on /admin (1280x800)
    console.log('\n--- 1. Testing /admin Desktop (1280x800) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log('Direct navigating to http://localhost:8080/admin ...');
    await client.send('Page.navigate', { url: 'http://localhost:8080/admin' });
    await wait(2000);

    const desktopAdminMetrics = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.bg-surface');
        const logo = document.querySelector('img[alt*="S.i and Billionaires Hub"]');
        const emailInput = document.querySelector('input[type="email"]');
        const passInput = document.querySelector('input[type="password"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const pageBg = window.getComputedStyle(document.querySelector('.min-h-screen')).backgroundColor;
        
        const cardRect = card ? card.getBoundingClientRect() : null;
        const logoRect = logo ? logo.getBoundingClientRect() : null;
        const emailRect = emailInput ? emailInput.getBoundingClientRect() : null;
        const passRect = passInput ? passInput.getBoundingClientRect() : null;
        const submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
        
        const emailStyle = emailInput ? window.getComputedStyle(emailInput) : null;
        const passStyle = passInput ? window.getComputedStyle(passInput) : null;
        const submitStyle = submitBtn ? window.getComputedStyle(submitBtn) : null;
        
        const labels = Array.from(document.querySelectorAll('label')).map(l => ({
          text: l.textContent.trim(),
          htmlFor: l.getAttribute('for')
        }));

        const isCentered = cardRect ? Math.abs((window.innerWidth - cardRect.width) / 2 - cardRect.left) < 10 : false;

        return {
          cardWidth: cardRect ? cardRect.width : 0,
          cardHeight: cardRect ? cardRect.height : 0,
          isCardCentered: isCentered,
          logoWidth: logoRect ? logoRect.width : 0,
          logoHeight: logoRect ? logoRect.height : 0,
          emailHeight: emailRect ? emailRect.height : 0,
          emailFontSize: emailStyle ? emailStyle.fontSize : '',
          passHeight: passRect ? passRect.height : 0,
          passFontSize: passStyle ? passStyle.fontSize : '',
          submitHeight: submitRect ? submitRect.height : 0,
          submitBg: submitStyle ? submitStyle.backgroundColor : '',
          submitColor: submitStyle ? submitStyle.color : '',
          submitText: submitBtn ? submitBtn.textContent.trim() : '',
          pageBg,
          bodyBg,
          labels
        };
      })()`,
      returnByValue: true
    });

    results.adminDesktop = desktopAdminMetrics.result.value;
    console.log('Admin Desktop Metrics:', results.adminDesktop);

    const desktopScreenshotPath = path.join(scratchDir, 'admin_desktop_verified.png');
    await captureScreenshot(client, desktopScreenshotPath);

    // 2. Test Hard Refresh
    console.log('\n--- 2. Testing Hard Refresh on /admin ---');
    await client.send('Page.reload', { ignoreCache: true });
    await wait(2000);

    const postReloadCheck = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.bg-surface');
        return {
          cardWidth: card ? card.getBoundingClientRect().width : 0,
          exists: !!card
        };
      })()`,
      returnByValue: true
    });
    results.adminPostReload = postReloadCheck.result.value;
    console.log('Post-Reload Check:', results.adminPostReload);

    // 3. Test Form Validation & Error State
    console.log('\n--- 3. Testing Form Validation & Error State ---');
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.click();
      })()`
    });
    await wait(500);

    const errorStateMetrics = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const alert = document.querySelector('[role="alert"]');
        const emailErr = document.getElementById('staff-email-err');
        const passErr = document.getElementById('staff-password-err');
        return {
          alertText: alert ? alert.textContent.trim() : null,
          emailErrText: emailErr ? emailErr.textContent.trim() : null,
          passErrText: passErr ? passErr.textContent.trim() : null
        };
      })()`,
      returnByValue: true
    });
    results.adminErrorState = errorStateMetrics.result.value;
    console.log('Error State Metrics:', results.adminErrorState);

    const errorScreenshotPath = path.join(scratchDir, 'admin_error_state_verified.png');
    await captureScreenshot(client, errorScreenshotPath);

    // 4. Verify Mobile Layout on /admin (390x844)
    console.log('\n--- 4. Testing /admin Mobile (390x844) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await wait(1000);

    const mobileAdminMetrics = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const card = document.querySelector('.bg-surface');
        const logo = document.querySelector('img[alt*="S.i and Billionaires Hub"]');
        const emailInput = document.querySelector('input[type="email"]');
        const submitBtn = document.querySelector('button[type="submit"]');
        
        const cardRect = card ? card.getBoundingClientRect() : null;
        const logoRect = logo ? logo.getBoundingClientRect() : null;
        const emailRect = emailInput ? emailInput.getBoundingClientRect() : null;
        const submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;
        const emailStyle = emailInput ? window.getComputedStyle(emailInput) : null;

        return {
          cardWidth: cardRect ? cardRect.width : 0,
          logoWidth: logoRect ? logoRect.width : 0,
          logoHeight: logoRect ? logoRect.height : 0,
          emailHeight: emailRect ? emailRect.height : 0,
          emailFontSize: emailStyle ? emailStyle.fontSize : '',
          submitHeight: submitRect ? submitRect.height : 0,
          hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth
        };
      })()`,
      returnByValue: true
    });
    results.adminMobile = mobileAdminMetrics.result.value;
    console.log('Admin Mobile Metrics:', results.adminMobile);

    const mobileScreenshotPath = path.join(scratchDir, 'admin_mobile_verified.png');
    await captureScreenshot(client, mobileScreenshotPath);

    // 5. Test Route Navigation: /admin -> / (via "Return to Public Website")
    console.log('\n--- 5. Testing Route Navigation to Public Website ---');
    await client.send('Runtime.evaluate', {
      expression: `(() => {
        const returnLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Return to Public Website'));
        if (returnLink) returnLink.click();
      })()`
    });
    await wait(2500);

    const publicPageMetrics = await client.send('Runtime.evaluate', {
      expression: `(() => {
        const hasFallbackBar = Array.from(document.querySelectorAll('a, button')).some(el => el.textContent.trim() === 'Submit Enquiry' && el.closest('.fixed'));
        const floatingContact = document.querySelector('[aria-label="Quick contact options"]');
        const heroImg = document.querySelector('section img');
        const footer = document.querySelector('footer');
        const footerPadding = footer ? window.getComputedStyle(footer.parentElement).paddingBottom : null;

        return {
          currentUrl: window.location.href,
          hasFallbackBar,
          floatingContactExists: !!floatingContact,
          heroSrc: heroImg ? heroImg.getAttribute('src') : null,
          footerPadding
        };
      })()`,
      returnByValue: true
    });
    results.publicPage = publicPageMetrics.result.value;
    console.log('Public Page Metrics:', results.publicPage);

    const publicMobileScreenshotPath = path.join(scratchDir, 'public_home_mobile_verified.png');
    await captureScreenshot(client, publicMobileScreenshotPath);

    // 6. Test Desktop Public Website (1280x800)
    console.log('\n--- 6. Testing Public Website Desktop (1280x800) ---');
    await client.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false
    });
    await wait(1500);

    const publicDesktopScreenshotPath = path.join(scratchDir, 'public_home_desktop_verified.png');
    await captureScreenshot(client, publicDesktopScreenshotPath);

    // 7. Verify Service Worker status
    console.log('\n--- 7. Verifying Service Worker Status ---');
    const swStatus = await client.send('Runtime.evaluate', {
      expression: `(async () => {
        const regs = await navigator.serviceWorker.getRegistrations();
        return {
          registrationCount: regs.length,
          scopes: regs.map(r => r.scope),
          controller: !!navigator.serviceWorker.controller
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    });
    results.serviceWorkerStatus = swStatus.result.value;
    console.log('Service Worker Status:', results.serviceWorkerStatus);

    fs.writeFileSync(
      path.join(scratchDir, 'admin_and_sw_verification_results.json'),
      JSON.stringify(results, null, 2)
    );
    console.log('\nAll verifications completed successfully!');
    client.close();
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    cleanup();
  }
}

main();
