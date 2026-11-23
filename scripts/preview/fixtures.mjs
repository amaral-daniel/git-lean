// Sample data for the webview previews. Covers every ref badge kind, a merge
// commit, overflowing refs, long messages, and local/remote/nested branches.

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

function hash(i) {
    return (i * 2654435761 + 0x9e3779b9).toString(16).padStart(8, '0').repeat(5).slice(0, 40);
}

export const commits = Array.from({ length: 40 }, (_, i) => ({
    hash: hash(i),
    shortHash: hash(i).slice(0, 7),
    message: messages[i % messages.length],
    // git log %ai format, as produced by gitParser
    date:
        new Date(Date.UTC(2026, 10, 23, 18, 0) - i * 3_600_000 * 7).toISOString().replace('T', ' ').slice(0, 19) +
        ' +0000',
    author: authors[i % authors.length],
    parents: i === 5 ? [hash(i + 1), hash(i + 9)] : [hash(i + 1)],
    refs:
        i === 0
            ? ['HEAD -> main', 'origin/main', 'origin/HEAD']
            : i === 3
              ? ['tag: v0.0.14']
              : i === 6
                ? ['feat/a', 'feat/b', 'origin/feat/a', 'tag: v0.0.13', 'upstream/main', 'release/1.0']
                : i === 10
                  ? ['fix/publish-vscode-types-engine']
                  : [],
}));

export const commitDetails = {
    fullHash: commits[0].hash,
    authorEmail: 'ada@example.com',
    authorName: 'Ada Lovelace',
    authorDate: '2026-11-23 18:00:00 +0000',
    commitDate: '2026-11-23 18:05:00 +0000',
    subject: commits[0].message,
    body: 'Clicking a file in the commit details panel now opens the native\nVS Code diff editor for that file at the selected commit.',
    // Full `git show <hash>` output: commit header, message, then the diffs.
    patch: [
        `commit ${commits[0].hash}`,
        'Author: Ada Lovelace <ada@example.com>',
        'Date:   Mon Nov 23 18:00:00 2026 +0000',
        '',
        `    ${commits[0].message}`,
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

export const branches = [
    { name: 'main', fullName: 'main', isRemote: false, isHead: true },
    {
        name: 'feat/open-file-diff-from-commit-details',
        fullName: 'feat/open-file-diff-from-commit-details',
        isRemote: false,
        isHead: false,
    },
    { name: 'feat/webview-preview-harness', fullName: 'feat/webview-preview-harness', isRemote: false, isHead: false },
    {
        name: 'fix/publish-vscode-types-engine',
        fullName: 'fix/publish-vscode-types-engine',
        isRemote: false,
        isHead: false,
    },
    { name: 'release/1.0', fullName: 'release/1.0', isRemote: false, isHead: false },
    { name: 'main', fullName: 'origin/main', isRemote: true, isHead: false },
    {
        name: 'feat/open-file-diff-from-commit-details',
        fullName: 'origin/feat/open-file-diff-from-commit-details',
        isRemote: true,
        isHead: false,
    },
    {
        name: 'dependabot/npm_and_yarn/dev-dependencies-6172efe319',
        fullName: 'origin/dependabot/npm_and_yarn/dev-dependencies-6172efe319',
        isRemote: true,
        isHead: false,
    },
    { name: 'main', fullName: 'upstream/main', isRemote: true, isHead: false },
];
