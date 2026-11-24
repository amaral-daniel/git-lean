// Sample data for the webview previews, in the same raw form the extension
// gets from git. build.mjs turns `gitLog` into commits with the real compiled
// parser (out/gitParser.js). Covers every ref badge kind, a merge commit,
// overflowing refs, long messages, and local/remote/nested branches.

import { createHash } from 'node:crypto';

const authors = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton'];
const messages = [
    'feat: open VS Code diff editor on file click in commit details',
    'fix(ci): pin @types/vscode to engines.vscode so vsce can package',
    'chore(deps): bump react and @types/react',
    'refactor: extract git log parser into its own module',
    'feat: add support for multiple git repos within workspace',
    'docs: document branch panel context menu',
    'fix: handle branch names containing slashes in the tree view',
    'perf: lazy-load older commits when scrolling to the bottom of a very long history list',
];
const refsByRow = {
    0: 'HEAD -> main, origin/main, origin/HEAD',
    3: 'tag: v0.0.14',
    6: 'feat/a, feat/b, origin/feat/a, tag: v0.0.13, upstream/main, release/1.0',
    10: 'fix/publish-vscode-types-engine',
};

const sha = (i) => createHash('sha1').update(`commit-${i}`).digest('hex');
// %ai: "2026-11-23 18:00:00 +0000"
const ai = (ms) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' +0000';
const t0 = Date.UTC(2026, 10, 23, 18, 0);

// Lines in the extension's git log format: %H|%h|%P|%an|%ai|%D|%s
export const gitLog = Array.from({ length: 40 }, (_, i) => {
    const parents = i === 5 ? [sha(i + 1), sha(i + 9)] : [sha(i + 1)];
    return [
        sha(i),
        sha(i).slice(0, 7),
        parents.join(' '),
        authors[i % authors.length],
        ai(t0 - i * 7 * 3_600_000),
        refsByRow[i] ?? '',
        messages[i % messages.length],
    ].join('|');
}).join('\n');

// Shape produced by gitGraphView.showCommitDetails (dates are %aI / %cI).
export const commitDetails = {
    fullHash: sha(0),
    authorEmail: 'ada@example.com',
    authorName: 'Ada Lovelace',
    authorDate: '2026-11-23T18:00:00+00:00',
    commitDate: '2026-11-23T18:05:00+00:00',
    subject: messages[0],
    body: 'Clicking a file in the commit details panel now opens the native\nVS Code diff editor for that file at the selected commit.',
    // Full `git show <hash>` output: commit header, message, then the diffs.
    patch: [
        `commit ${sha(0)}`,
        'Author: Ada Lovelace <ada@example.com>',
        'Date:   Mon Nov 23 18:00:00 2026 +0000',
        '',
        `    ${messages[0]}`,
        '',
        'diff --git a/src/gitGraphView.ts b/src/gitGraphView.ts',
        'index 1111111..2222222 100644',
        '--- a/src/gitGraphView.ts',
        '+++ b/src/gitGraphView.ts',
        '@@ -10,7 +10,9 @@ export class GitGraphViewProvider {',
        '     private _filterBranch: string | null = null;',
        '-    private _panel?: vscode.WebviewPanel;',
        '+    private _panel?: vscode.WebviewPanel;',
        '+    private _detailsPanel?: vscode.WebviewPanel;',
        '+',
        '     constructor(private readonly _extensionUri: vscode.Uri) {}',
        'diff --git a/src/webview/commitDetails/CommitDetailsView.tsx b/src/webview/commitDetails/CommitDetailsView.tsx',
        'index 3333333..4444444 100644',
        '--- a/src/webview/commitDetails/CommitDetailsView.tsx',
        '+++ b/src/webview/commitDetails/CommitDetailsView.tsx',
        '@@ -1,4 +1,5 @@',
        " import { useState } from 'react';",
        "+import { vscode } from '../vscodeApi';",
        ' ',
        '-export function CommitDetailsView() {',
        '+export function CommitDetailsView({ data }: Props) {',
        'diff --git a/docs/notes 100%.md b/docs/notes 100%.md',
        'new file mode 100644',
        'index 0000000..5555555',
        '--- /dev/null',
        '+++ b/docs/notes 100%.md',
        '@@ -0,0 +1,2 @@',
        '+# Notes',
        '+Path with a percent sign and a space.',
        '',
    ].join('\n'),
};

// Shape produced by BranchWebviewProvider (origin/HEAD is filtered out there).
const branch = (fullName, isHead = false) => {
    const isRemote = /^(origin|upstream)\//.test(fullName);
    return { name: isRemote ? fullName.replace(/^(origin|upstream)\//, '') : fullName, fullName, isRemote, isHead };
};

export const branches = [
    branch('main', true),
    branch('feat/open-file-diff-from-commit-details'),
    branch('feat/webview-preview-harness'),
    branch('fix/publish-vscode-types-engine'),
    branch('release/1.0'),
    branch('origin/main'),
    branch('origin/feat/open-file-diff-from-commit-details'),
    branch('origin/dependabot/npm_and_yarn/dev-dependencies-6172efe319'),
    branch('upstream/main'),
];
