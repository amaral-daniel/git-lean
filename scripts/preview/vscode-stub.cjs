// Minimal stand-in for the `vscode` module, just enough to load the
// compiled HTML generators (out/webviewContent.js, out/branchWebviewProvider.js)
// outside VS Code. Anything not modelled here resolves to a no-op.

function joinPath(base, ...segments) {
    const path = [base.path, ...segments].filter(Boolean).join('/');
    return { path, toString: () => path };
}

const noop = new Proxy(function () {}, {
    get: (_target, prop) => (prop === Symbol.toPrimitive ? () => '' : noop),
    apply: () => noop,
    construct: () => noop,
});

const stub = {
    Uri: { joinPath, file: (path) => ({ path, toString: () => path }) },
};

module.exports = new Proxy(stub, {
    get: (target, prop) => (prop in target ? target[prop] : noop),
});
