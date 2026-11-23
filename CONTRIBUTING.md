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

## Verify

Before opening a PR, run:

```sh
pnpm run verify
```

This runs the same steps as the main CI job (`Lint, Format & Build`): frozen-lockfile install, prettier check, eslint, webview type-check, build + vitest, and `vsce package`. CI also runs separate jobs (e.g. workflow linting, below) that `verify` does not cover.

Individual steps:

```sh
pnpm run test               # build + vitest unit tests
pnpm run lint               # eslint
pnpm run format:check       # prettier
pnpm run typecheck:webview  # tsc for src/webview (esbuild does not type-check)
pnpm run package            # vsce package (catches manifest/engine errors)
```

CI also lints workflow files with [actionlint](https://github.com/rhysd/actionlint). Run `actionlint` locally if you change `.github/workflows/`.

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

## Releasing

Bump the version in `package.json` and push to `main`. The publish workflow runs automatically after CI passes.
