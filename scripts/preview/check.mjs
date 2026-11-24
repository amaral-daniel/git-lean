// Renders every webview preview in headless Chromium (dark + light), fails on
// console errors, uncaught exceptions, or an empty #root, and writes
// screenshots to out/preview/screenshots/.
//
// Requires `pnpm run preview:build` first and a Chromium for Playwright
// (`pnpm exec playwright install chromium`), or an installed Google Chrome.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { startServer } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const shotsDir = path.join(root, 'out', 'preview', 'screenshots');
// Start clean so stale screenshots from an earlier run can't be mistaken for this one.
fs.rmSync(shotsDir, { recursive: true, force: true });
fs.mkdirSync(shotsDir, { recursive: true });

const pages = ['graph', 'commit-details', 'branches'];
const themes = ['dark', 'light'];

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

// Interactions: [page, name, action]. Each action drives the UI, asserts the
// outcome (throws on failure), and gets a screenshot of the resulting state.
const interactions = [
    [
        'graph',
        'context-menu',
        async (p) => {
            await p.locator('tbody tr').first().click({ button: 'right' });
            await p.locator('.context-menu').waitFor({ state: 'visible' });
            assert((await p.locator('.context-menu-item').count()) > 0, 'context menu has no items');
        },
    ],
    [
        'graph',
        'search',
        async (p) => {
            const before = await p.locator('tbody tr').count();
            await p.locator('.search-input').fill('deps');
            await p.waitForFunction((n) => document.querySelectorAll('tbody tr').length < n, before);
            const texts = await p.locator('tbody tr .message-text').allTextContents();
            assert(texts.length > 0, 'search for "deps" matched no rows');
            assert(
                texts.every((t) => t.toLowerCase().includes('deps')),
                'search returned rows that do not match',
            );
        },
    ],
];

// Port 0 = any free port, so a running preview:serve does not clash.
const server = await startServer(Number(process.env.PORT ?? 0));
const port = server.address().port;
const browser = await launchBrowser();
const failures = [];

// Playwright's bundled Chromium first; fall back to an installed Google Chrome
// (e.g. on macOS versions Playwright no longer ships Chromium for).
// Force a channel with PREVIEW_BROWSER_CHANNEL=chrome|msedge.
async function launchBrowser() {
    const channel = process.env.PREVIEW_BROWSER_CHANNEL;
    if (channel) return chromium.launch({ channel });
    try {
        return await chromium.launch();
    } catch (err) {
        console.warn(`Bundled Chromium unavailable (${err.message.split('\n')[0]}); trying installed Chrome.`);
        return chromium.launch({ channel: 'chrome' });
    }
}

async function open(pageName, theme) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    const errors = [];
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto(`http://127.0.0.1:${port}/preview/${pageName}.html?theme=${theme}`);
    await page.waitForLoadState('networkidle');
    const text = (await page.locator('#root').innerText()).trim();
    if (!text) errors.push('#root has no visible text (webview did not render)');
    return { page, errors };
}

try {
    for (const pageName of pages) {
        for (const theme of themes) {
            const { page, errors } = await open(pageName, theme);
            const file = path.join(shotsDir, `${pageName}-${theme}.png`);
            await page.screenshot({ path: file, fullPage: true });
            // Interactions only make sense on a page that rendered cleanly.
            page.setDefaultTimeout(5000);
            for (const [p, name, action] of errors.length ? [] : interactions.filter(([p]) => p === pageName)) {
                try {
                    await action(page);
                    await page.screenshot({ path: path.join(shotsDir, `${p}-${name}-${theme}.png`), fullPage: true });
                    await page.keyboard.press('Escape');
                } catch (err) {
                    errors.push(`interaction "${name}" failed: ${err.message.split('\n')[0]}`);
                }
            }
            if (errors.length) failures.push(`${pageName} (${theme}):\n    ${errors.join('\n    ')}`);
            console.log(`${errors.length ? 'FAIL' : 'ok  '} ${pageName} (${theme})`);
            await page.close();
        }
    }
} finally {
    await browser.close();
    server.close();
}

console.log(`Screenshots in ${path.relative(root, shotsDir)}/`);
if (failures.length) {
    console.error(`\nWebview preview check failed:\n  ${failures.join('\n  ')}`);
    process.exit(1);
}
