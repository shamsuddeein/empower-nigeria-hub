import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const scratchDir = 'C:\\Users\\Deen\\.gemini\\antigravity-ide\\brain\\2d717dd5-6fe0-481c-8812-5af67c89eca2\\scratch';
const profileDir = path.join(scratchDir, 'chrome_menu_verify_profile');

if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

console.log('Launching Headless Chrome on port 9255...');
const chromeProcess = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new',
  '--remote-debugging-port=9255',
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
      const res = await fetch('http://127.0.0.1:9255/json/version');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    await wait(300);
  }
  throw new Error('CDP port 9255 not available');
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
          const cb = this.callbacks.get(msg.id);
          this.callbacks.delete(msg.id);
          if (msg.error) cb.reject(new Error(msg.error.message));
          else cb.resolve(msg.result);
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

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result ? res.result.value : undefined;
  }

  async screenshot(filepath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    fs.writeFileSync(filepath, buffer);
    console.log(`[Screenshot saved] -> ${filepath}`);
  }

  async setViewport(width, height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: width < 1024,
    });
    await wait(200);
  }

  async dispatchKey(key, code, windowsVirtualKeyCode, modifiers = 0) {
    await this.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key,
      code,
      windowsVirtualKeyCode,
      modifiers,
    });
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode,
      modifiers,
    });
    await wait(100);
  }
}

async function main() {
  await waitForCdp();
  console.log('Connected to Chrome DevTools Protocol.');

  const targetsRes = await fetch('http://127.0.0.1:9255/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  const appUrl = 'http://localhost:8081/';
  console.log(`Navigating to ${appUrl}...`);
  await cdp.send('Page.navigate', { url: appUrl });

  console.log('Waiting for full page hydration...');
  for (let i = 0; i < 30; i++) {
    const isReady = await cdp.evaluate(`
      (() => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
        return document.readyState === 'complete' && !!btn;
      })()
    `).catch(() => false);
    if (isReady) break;
    await wait(500);
  }
  await wait(1500);

  const results = {};

  // =========================================================================
  // TEST 1: Page Top (scrollY = 0) Mobile Menu Opening & Verification
  // =========================================================================
  console.log('\n--- TEST 1: Menu Opening at Page Top (390x844) ---');
  await cdp.setViewport(390, 844);
  await cdp.evaluate('window.scrollTo(0, 0);');
  await wait(500);

  // Click Menu button
  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
      if (!btn) throw new Error('Menu button not found');
      btn.click();
    })()
  `);
  await wait(400);

  const topMenuMetrics = await cdp.evaluate(`
    (() => {
      const modal = document.getElementById('mobile-menu');
      if (!modal) return { open: false };
      const rect = modal.getBoundingClientRect();
      const parentTag = modal.parentElement.tagName.toLowerCase();
      const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Close');
      const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
      const links = Array.from(modal.querySelectorAll('nav a')).map(a => a.textContent.trim());
      const bodyOverflow = document.body.style.overflow;
      return {
        open: true,
        parentTag,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        windowHeight: window.innerHeight,
        closeSize: closeRect ? { width: closeRect.width, height: closeRect.height } : null,
        links,
        bodyOverflow,
      };
    })()
  `);

  console.log('Top Menu Metrics:', topMenuMetrics);
  results.topMenu = topMenuMetrics;
  if (!topMenuMetrics.open || topMenuMetrics.parentTag !== 'body' || topMenuMetrics.rect.height !== 844) {
    throw new Error('Test 1 failed: Mobile menu not portalled to body or wrong height at top');
  }
  if (topMenuMetrics.closeSize.height < 44 || topMenuMetrics.closeSize.width < 44) {
    throw new Error('Test 1 failed: Close button target is smaller than 44px');
  }

  const topScreenshot = path.join(scratchDir, 'mobile-menu-page-top.png');
  await cdp.screenshot(topScreenshot);

  // Close menu and check focus restoration
  await cdp.evaluate(`
    (() => {
      const modal = document.getElementById('mobile-menu');
      const closeBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.trim() === 'Close');
      closeBtn.click();
    })()
  `);
  await wait(300);

  const postCloseState = await cdp.evaluate(`
    (() => {
      const activeEl = document.activeElement;
      return {
        menuOpen: !!document.getElementById('mobile-menu'),
        bodyOverflow: document.body.style.overflow,
        focusedButtonText: activeEl ? activeEl.textContent.trim() : null,
        focusedAriaLabel: activeEl ? activeEl.getAttribute('aria-label') : null,
      };
    })()
  `);
  console.log('Post-close state:', postCloseState);
  results.postCloseState = postCloseState;
  if (postCloseState.menuOpen || postCloseState.bodyOverflow !== '' || postCloseState.focusedButtonText !== 'Menu') {
    throw new Error('Test 1 cleanup failed: Focus not restored to Menu trigger or scroll not unlocked');
  }

  // =========================================================================
  // TEST 2: Scrolled Page (scrollY = 350) - Testing Backdrop Blur Containing Block Fix!
  // =========================================================================
  console.log('\n--- TEST 2: Menu Opening After Scrolling (scrollY = 350, SiteHeader with backdrop-blur-sm) ---');
  await cdp.evaluate('window.scrollTo(0, 350);');
  await wait(500);

  const headerStateBeforeOpen = await cdp.evaluate(`
    (() => {
      const header = document.querySelector('header');
      return {
        scrollY: window.scrollY,
        headerClasses: header ? header.className : '',
        hasBackdropBlur: header ? header.className.includes('backdrop-blur-sm') : false,
      };
    })()
  `);
  console.log('Header state after scroll:', headerStateBeforeOpen);
  if (!headerStateBeforeOpen.hasBackdropBlur) {
    throw new Error('Expected header to have backdrop-blur-sm when scrolled > 12px');
  }

  // Click Menu button
  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
      btn.click();
    })()
  `);
  await wait(400);

  const scrolledMenuMetrics = await cdp.evaluate(`
    (() => {
      const modal = document.getElementById('mobile-menu');
      if (!modal) return { open: false };
      const rect = modal.getBoundingClientRect();
      const parentTag = modal.parentElement.tagName.toLowerCase();
      const links = Array.from(modal.querySelectorAll('nav a')).map(a => a.textContent.trim());
      const applyBtn = Array.from(modal.querySelectorAll('a')).find(a => a.textContent.trim() === 'Apply Now');
      const footerButtons = Array.from(modal.querySelectorAll('.shrink-0 a, .shrink-0 button')).map(el => el.textContent.trim());
      const floatingContactBar = document.querySelector('.fixed.inset-x-0.bottom-0');
      let floatingBarZIndex = floatingContactBar ? window.getComputedStyle(floatingContactBar).zIndex : null;
      let modalZIndex = window.getComputedStyle(modal).zIndex;
      return {
        open: true,
        parentTag,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        windowHeight: window.innerHeight,
        hasApplyBtn: !!applyBtn,
        linksCount: links.length,
        links,
        footerButtons,
        modalZIndex,
        floatingBarZIndex,
        bodyOverflow: document.body.style.overflow,
      };
    })()
  `);

  console.log('Scrolled Menu Metrics (CRITICAL FIX CHECK):', scrolledMenuMetrics);
  results.scrolledMenu = scrolledMenuMetrics;

  // CRITICAL CHECK: In the defect, rect.height was 64px! Now it MUST be full viewport (844px)!
  if (!scrolledMenuMetrics.open) throw new Error('Menu failed to open when scrolled');
  if (scrolledMenuMetrics.rect.height !== 844 || scrolledMenuMetrics.rect.top !== 0) {
    throw new Error(`CRITICAL DEFECT DETECTED: Menu height is ${scrolledMenuMetrics.rect.height}px instead of 844px! Containing block trap not resolved!`);
  }
  if (scrolledMenuMetrics.parentTag !== 'body') {
    throw new Error(`Expected modal parent to be body, got ${scrolledMenuMetrics.parentTag}`);
  }
  console.log('[PASS] Full viewport menu shell verified while header is scrolled and blurred!');

  const scrolledScreenshot = path.join(scratchDir, 'mobile-menu-scrolled-full-viewport.png');
  await cdp.screenshot(scrolledScreenshot);

  // Close menu via Escape key and test focus restoration
  console.log('Testing Escape key dismiss from scrolled menu...');
  await cdp.dispatchKey('Escape', 'Escape', 27);
  await wait(300);

  const escapePostState = await cdp.evaluate(`
    (() => {
      const activeEl = document.activeElement;
      return {
        menuOpen: !!document.getElementById('mobile-menu'),
        bodyOverflow: document.body.style.overflow,
        focusedButtonText: activeEl ? activeEl.textContent.trim() : null,
      };
    })()
  `);
  console.log('Post-Escape state:', escapePostState);
  results.escapePostState = escapePostState;
  if (escapePostState.menuOpen || escapePostState.bodyOverflow !== '' || escapePostState.focusedButtonText !== 'Menu') {
    throw new Error('Escape dismiss failed or focus not restored to Menu trigger');
  }

  // =========================================================================
  // TEST 3: Deep Within Page (scrollY = 2500)
  // =========================================================================
  console.log('\n--- TEST 3: Menu Opening Deep Within Page (scrollY = 2500) ---');
  await cdp.evaluate('window.scrollTo(0, 2500);');
  await wait(500);

  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
      btn.click();
    })()
  `);
  await wait(400);

  const deepMenuMetrics = await cdp.evaluate(`
    (() => {
      const modal = document.getElementById('mobile-menu');
      if (!modal) return { open: false };
      const rect = modal.getBoundingClientRect();
      return {
        open: true,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        windowHeight: window.innerHeight,
        parentTag: modal.parentElement.tagName.toLowerCase(),
      };
    })()
  `);
  console.log('Deep Menu Metrics:', deepMenuMetrics);
  results.deepMenu = deepMenuMetrics;
  if (!deepMenuMetrics.open || deepMenuMetrics.rect.height !== 844 || deepMenuMetrics.rect.top !== 0) {
    throw new Error('Deep menu failed full viewport bounds');
  }

  const deepScreenshot = path.join(scratchDir, 'mobile-menu-deep-scrolled.png');
  await cdp.screenshot(deepScreenshot);

  // Close deep menu
  await cdp.evaluate(`
    (() => {
      const closeBtn = Array.from(document.getElementById('mobile-menu').querySelectorAll('button')).find(b => b.textContent.trim() === 'Close');
      closeBtn.click();
    })()
  `);
  await wait(300);

  // =========================================================================
  // TEST 4: Short Screens and Scrollable Navigation Area (390x500)
  // =========================================================================
  console.log('\n--- TEST 4: Short Screen (390x500) & Scrollable Nav Area ---');
  await cdp.setViewport(390, 500);
  await wait(300);

  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
      btn.click();
    })()
  `);
  await wait(400);

  const shortScreenMetrics = await cdp.evaluate(`
    (() => {
      const modal = document.getElementById('mobile-menu');
      if (!modal) return { open: false };
      const scrollArea = modal.querySelector('.overflow-y-auto');
      const isScrollable = scrollArea ? scrollArea.scrollHeight > scrollArea.clientHeight : false;
      const initialScrollTop = scrollArea ? scrollArea.scrollTop : 0;
      // Scroll to bottom
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
      return {
        open: true,
        modalHeight: modal.getBoundingClientRect().height,
        scrollHeight: scrollArea ? scrollArea.scrollHeight : 0,
        clientHeight: scrollArea ? scrollArea.clientHeight : 0,
        isScrollable,
        afterScrollTop: scrollArea ? scrollArea.scrollTop : 0,
      };
    })()
  `);
  console.log('Short Screen Scroll Metrics:', shortScreenMetrics);
  results.shortScreen = shortScreenMetrics;
  if (!shortScreenMetrics.isScrollable || shortScreenMetrics.afterScrollTop <= 0) {
    throw new Error('Short screen test failed: Navigation area is not scrollable with min-h-0');
  }

  const shortScreenshot = path.join(scratchDir, 'mobile-menu-short-screen-scrolled.png');
  await cdp.screenshot(shortScreenshot);

  // Close menu
  await cdp.dispatchKey('Escape', 'Escape', 27);
  await wait(300);

  // =========================================================================
  // TEST 5: Landscape Mode (844x390)
  // =========================================================================
  console.log('\n--- TEST 5: Landscape Mode (844x390) ---');
  await cdp.setViewport(844, 390);
  await wait(300);

  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
      btn.click();
    })()
  `);
  await wait(400);

  const landscapeMetrics = await cdp.evaluate(`
    (() => {
      const modal = document.getElementById('mobile-menu');
      if (!modal) return { open: false };
      const rect = modal.getBoundingClientRect();
      const scrollArea = modal.querySelector('.overflow-y-auto');
      return {
        open: true,
        width: rect.width,
        height: rect.height,
        isScrollable: scrollArea ? scrollArea.scrollHeight > scrollArea.clientHeight : false,
      };
    })()
  `);
  console.log('Landscape Metrics:', landscapeMetrics);
  results.landscape = landscapeMetrics;
  if (!landscapeMetrics.open || landscapeMetrics.height !== 390 || landscapeMetrics.width !== 844) {
    throw new Error('Landscape viewport shell failed');
  }

  const landscapeScreenshot = path.join(scratchDir, 'mobile-menu-landscape.png');
  await cdp.screenshot(landscapeScreenshot);

  // Close landscape menu
  await cdp.dispatchKey('Escape', 'Escape', 27);
  await wait(300);

  // =========================================================================
  // TEST 6: Desktop Breakpoint Crossing (Resize 390 -> 1024)
  // =========================================================================
  console.log('\n--- TEST 6: Desktop Breakpoint Crossing & Scroll Lock Reset ---');
  await cdp.setViewport(390, 844);
  await wait(300);

  // Open menu on mobile
  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
      btn.click();
    })()
  `);
  await wait(400);

  const preResizeState = await cdp.evaluate(`
    (() => {
      return {
        menuOpen: !!document.getElementById('mobile-menu'),
        bodyOverflow: document.body.style.overflow,
      };
    })()
  `);
  console.log('Pre-resize state (open on mobile):', preResizeState);
  if (!preResizeState.menuOpen || preResizeState.bodyOverflow !== 'hidden') {
    throw new Error('Menu should be open with body overflow hidden');
  }

  // Now resize viewport across 1024px desktop breakpoint to 1280x800
  console.log('Widening viewport to 1280x800 (crossing 1024px breakpoint)...');
  await cdp.setViewport(1280, 800);
  await wait(500);

  const postResizeState = await cdp.evaluate(`
    (() => {
      const modal = document.getElementById('mobile-menu');
      return {
        menuOpen: !!modal,
        bodyOverflow: document.body.style.overflow,
      };
    })()
  `);
  console.log('Post-resize state (widened to desktop):', postResizeState);
  results.breakpointCrossing = { preResizeState, postResizeState };
  if (postResizeState.menuOpen) {
    throw new Error('Menu state was not reset when crossing desktop breakpoint');
  }
  if (postResizeState.bodyOverflow !== '') {
    throw new Error(`CRITICAL DEFECT DETECTED: Body scroll lock was NOT restored! document.body.style.overflow is still '${postResizeState.bodyOverflow}'!`);
  }
  console.log('[PASS] Menu closed and body scroll lock cleanly restored on breakpoint crossing!');

  const desktopScreenshot = path.join(scratchDir, 'desktop-breakpoint-crossing-reset.png');
  await cdp.screenshot(desktopScreenshot);

  // =========================================================================
  // TEST 7: Keyboard Accessibility: Focus Trap (Tab & Shift+Tab)
  // =========================================================================
  console.log('\n--- TEST 7: Keyboard Focus Trap Inside Dialog ---');
  await cdp.setViewport(390, 844);
  await wait(300);

  // Open menu
  await cdp.evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Menu');
      btn.click();
    })()
  `);
  await wait(400);

  // Initial focus check
  const initialFocus = await cdp.evaluate(`
    (() => {
      const active = document.activeElement;
      return {
        tag: active ? active.tagName.toLowerCase() : null,
        text: active ? active.textContent.trim() : null,
        ariaLabel: active ? active.getAttribute('aria-label') : null,
      };
    })()
  `);
  console.log('Initial focused element on open:', initialFocus);
  if (initialFocus.text !== 'Close') {
    throw new Error('Expected Close button to receive initial focus');
  }

  // Shift+Tab from Close (which is first focusable element) should wrap to last focusable element
  console.log('Dispatching Shift+Tab from first element (Close)...');
  // Modifiers: Shift = 8
  await cdp.dispatchKey('Tab', 'Tab', 9, 8);
  await wait(200);

  const afterShiftTabFocus = await cdp.evaluate(`
    (() => {
      const active = document.activeElement;
      const modal = document.getElementById('mobile-menu');
      const contains = modal ? modal.contains(active) : false;
      return {
        tag: active ? active.tagName.toLowerCase() : null,
        text: active ? active.textContent.trim() : null,
        insideModal: contains,
      };
    })()
  `);
  console.log('After Shift+Tab focus (should be last focusable element inside modal):', afterShiftTabFocus);
  if (!afterShiftTabFocus.insideModal) {
    throw new Error('Shift+Tab escaped dialog!');
  }

  // Tab from last element should wrap back to first element (Close)
  console.log('Dispatching Tab from last element...');
  await cdp.dispatchKey('Tab', 'Tab', 9, 0);
  await wait(200);

  const afterTabFocus = await cdp.evaluate(`
    (() => {
      const active = document.activeElement;
      return {
        tag: active ? active.tagName.toLowerCase() : null,
        text: active ? active.textContent.trim() : null,
      };
    })()
  `);
  console.log('After Tab focus (should wrap to Close):', afterTabFocus);
  if (afterTabFocus.text !== 'Close') {
    throw new Error('Tab did not wrap back to first element in dialog!');
  }
  console.log('[PASS] Full focus trap verified inside mobile menu dialog!');

  // Close with Escape
  await cdp.dispatchKey('Escape', 'Escape', 27);
  await wait(300);

  // Save all verification results to JSON
  const resultsPath = path.join(scratchDir, 'mobile-menu-verification-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n=== ALL 7 MOBILE MENU DEFECT & INTERACTION VERIFICATIONS PASSED ===`);
  console.log(`Results written to: ${resultsPath}`);

  cleanup();
  process.exit(0);
}

main().catch(err => {
  console.error('\n*** TEST RUN FAILED ***:', err);
  cleanup();
  process.exit(1);
});
