// Builds standalone HTML previews of the extension's webviews into out/preview/.
//
// It loads the *compiled* HTML generators (run `pnpm run compile` first), so
// the markup and CSS are exactly what VS Code renders. Differences from the
// real webview:
//   - the `vscode` module is stubbed (scripts/preview/vscode-stub.cjs)
//   - the CSP meta tag is removed so the mock scripts below can run
//   - VS Code theme variables are injected (dark by default, ?theme=light)
//   - acquireVsCodeApi() is mocked: postMessage calls are logged to the
//     console and collected in window.__messages
//   - window.__sendToWebview(msg) simulates a message from the extension

import { createRequire } from 'node:module';
import Module from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { commits, commitDetails, branches } from './fixtures.mjs';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outDir = path.join(root, 'out', 'preview');

// Route `require('vscode')` from compiled extension code to the stub.
const stubPath = path.join(here, 'vscode-stub.cjs');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
    return request === 'vscode' ? stubPath : originalResolve.call(this, request, ...rest);
};

for (const f of ['out/webviewContent.js', 'out/branchWebviewProvider.js', 'out/webview/index.js']) {
    if (!fs.existsSync(path.join(root, f))) {
        console.error(`Missing ${f}. Run \`pnpm run compile\` first.`);
        process.exit(1);
    }
}

const { getHtmlForWebview, getCommitDetailsHtml } = require(path.join(root, 'out/webviewContent.js'));
const { BranchWebviewProvider } = require(path.join(root, 'out/branchWebviewProvider.js'));

const extensionUri = { path: '', toString: () => '' };
// Pages live in out/preview/, the bundle in out/webview/.
const fakeWebview = {
    asWebviewUri: (uri) => '../' + uri.path.replace(/^\/?out\//, ''),
    cspSource: '',
};

const dark = {
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Ubuntu, sans-serif',
    'font-size': '13px',
    'editor-font-family': 'Menlo, Monaco, "Courier New", monospace',
    foreground: '#cccccc',
    descriptionForeground: '#9d9d9d',
    errorForeground: '#f85149',
    focusBorder: '#0078d4',
    'editor-background': '#1f1f1f',
    'editor-hoverHighlightBackground': 'rgba(38, 79, 120, 0.25)',
    'editorWidget-background': '#202020',
    'sideBar-background': '#181818',
    'sideBarSectionHeader-foreground': '#cccccc',
    'panel-border': '#2b2b2b',
    'input-background': '#313131',
    'input-border': '#3c3c3c',
    'input-foreground': '#cccccc',
    'input-placeholderForeground': '#989898',
    'inputValidation-errorBackground': '#5a1d1d',
    'list-activeSelectionBackground': '#04395e',
    'list-activeSelectionForeground': '#ffffff',
    'list-hoverBackground': '#2a2d2e',
    'list-hoverForeground': '#cccccc',
    'list-inactiveSelectionBackground': '#37373d',
    'menu-background': '#1f1f1f',
    'menu-border': '#454545',
    'menu-foreground': '#cccccc',
    'textPreformat-foreground': '#d0d0d0',
    'diffEditor-insertedLineBackground': 'rgba(155, 185, 85, 0.2)',
    'diffEditor-removedLineBackground': 'rgba(255, 0, 0, 0.2)',
    'gitDecoration-addedResourceForeground': '#81b88b',
    'gitDecoration-deletedResourceForeground': '#c74e39',
    'gitDecoration-modifiedResourceForeground': '#e2c08d',
    'gitDecoration-submoduleResourceForeground': '#8db9e2',
    'gitDecoration-untrackedResourceForeground': '#73c991',
};

const light = {
    ...dark,
    foreground: '#3b3b3b',
    descriptionForeground: '#3b3b3b',
    errorForeground: '#f85149',
    focusBorder: '#005fb8',
    'editor-background': '#ffffff',
    'editor-hoverHighlightBackground': 'rgba(173, 214, 255, 0.15)',
    'editorWidget-background': '#f8f8f8',
    'sideBar-background': '#f8f8f8',
    'sideBarSectionHeader-foreground': '#3b3b3b',
    'panel-border': '#e5e5e5',
    'input-background': '#ffffff',
    'input-border': '#cecece',
    'input-foreground': '#3b3b3b',
    'input-placeholderForeground': '#767676',
    'inputValidation-errorBackground': '#f2dede',
    'list-activeSelectionBackground': '#e8e8e8',
    'list-activeSelectionForeground': '#000000',
    'list-hoverBackground': '#f2f2f2',
    'list-hoverForeground': '#3b3b3b',
    'list-inactiveSelectionBackground': '#e4e6f1',
    'menu-background': '#ffffff',
    'menu-border': '#cecece',
    'menu-foreground': '#3b3b3b',
    'textPreformat-foreground': '#3b3b3b',
    'gitDecoration-addedResourceForeground': '#587c0c',
    'gitDecoration-deletedResourceForeground': '#ad0707',
    'gitDecoration-modifiedResourceForeground': '#895503',
    'gitDecoration-submoduleResourceForeground': '#1258a7',
    'gitDecoration-untrackedResourceForeground': '#007100',
};

const vars = (theme) =>
    Object.entries(theme)
        .map(([k, v]) => `--vscode-${k}: ${v};`)
        .join(' ');

const harness = `
<style>
  html[data-theme="dark"] { ${vars(dark)} }
  html[data-theme="light"] { ${vars(light)} }
  /* Mirrors the default styles VS Code injects into every webview. */
  html {
    background-color: var(--vscode-editor-background);
    color: var(--vscode-foreground);
    font-family: var(--vscode-font-family);
    font-size: var(--vscode-font-size);
  }
</style>
<script>
  document.documentElement.dataset.theme =
    new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark';
  window.__messages = [];
  window.acquireVsCodeApi = () => ({
    postMessage(message) {
      window.__messages.push(message);
      console.log('[postMessage]', JSON.stringify(message));
    },
    getState() { return undefined; },
    setState() {},
  });
  window.__sendToWebview = (data) => window.postMessage(data, '*');
</script>`;

function toPreview(html) {
    const withoutCsp = html.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/i, '');
    if (withoutCsp === html) throw new Error('CSP meta tag not found; update scripts/preview/build.mjs');
    return withoutCsp.replace(/<head>/i, `<head>${harness}`);
}

const pages = {
    graph: getHtmlForWebview(fakeWebview, commits, true, extensionUri),
    'commit-details': getCommitDetailsHtml(fakeWebview, commitDetails, extensionUri),
    // getHtml is private in TS but plain JS at runtime; call it without the
    // constructor, which would start git file watchers.
    branches: BranchWebviewProvider.prototype.getHtml.call({ _extensionUri: extensionUri }, fakeWebview, branches),
};

fs.mkdirSync(outDir, { recursive: true });
for (const [name, html] of Object.entries(pages)) {
    fs.writeFileSync(path.join(outDir, `${name}.html`), toPreview(html));
}

const links = Object.keys(pages)
    .flatMap((n) => [`<li><a href="${n}.html">${n}</a> · <a href="${n}.html?theme=light">light</a></li>`])
    .join('\n');
fs.writeFileSync(
    path.join(outDir, 'index.html'),
    `<!DOCTYPE html><meta charset="utf-8"><title>Git Lean webview previews</title><h1>Webview previews</h1><ul>${links}</ul>`,
);

console.log(`Wrote ${Object.keys(pages).length} previews to ${path.relative(root, outDir)}/`);
