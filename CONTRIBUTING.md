# Contributing to Git Lean

## Prerequisites

- Node.js >= 24
- pnpm >= 10 (`npm install -g pnpm`)
- VSCode

## Setup

```sh
pnpm install
```

## Build

```sh
pnpm run compile       # full build (tsc + webview bundle)
pnpm run watch         # watch extension source
pnpm run watch:webview # watch webview source
```

## Run locally

Press **F5** in VSCode to open an Extension Development Host with the extension loaded.

## Test

```sh
pnpm run test   # runs vitest unit tests
pnpm run lint   # eslint
pnpm run format:check  # prettier
```

## Project structure

```
src/
  extension.ts           # entry point, command registration
  gitOperations.ts       # all git commands (exec wrappers)
  gitParser.ts           # pure git log output parser (unit-tested)
  gitGraphView.ts        # graph webview panel provider
  branchWebviewProvider.ts
  branchTreeProvider.ts
  webviewContent.ts
  webview/               # React UI (bundled separately by esbuild)
    graph/
    branches/
    commitDetails/
```

## Previewing webviews in a browser

The webviews (graph, commit details, branches) can be rendered outside VS Code with fixture data. The harness uses the real compiled HTML/CSS generators and git log parser, keeps each page's Content Security Policy, and mocks the VS Code API:

```sh
pnpm run preview:build   # compile + write out/preview/*.html
pnpm run preview:serve   # http://localhost:4173/preview/  (add ?theme=light)
pnpm run preview:check   # headless render of every view in dark + light, plus
                         # context-menu/search interactions; fails on console
                         # errors, CSP violations or failed assertions;
                         # writes out/preview/screenshots/
```

- Fixture data: `scripts/preview/fixtures.mjs` (raw git output; commits go through `out/gitParser.js`).
- Messages the webview sends to the extension are logged to the console as `[postMessage]` and collected in `window.__messages`.
- `window.__sendToWebview(msg)` simulates a message from the extension.

`preview:check` needs a browser: `pnpm exec playwright install chromium`. If Playwright has no Chromium build for your OS, it falls back to an installed Google Chrome. CI runs it and uploads the screenshots as the `webview-screenshots` artifact.

This is for layout, styling and webview-side behaviour. It does not exercise the extension host or git; use F5 for that.

## Releasing

Bump the version in `package.json` and push to `main`. The publish workflow runs automatically after CI passes.
