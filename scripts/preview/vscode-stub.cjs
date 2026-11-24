// Minimal stand-in for the `vscode` module, just enough to load the compiled
// HTML generators (out/webviewContent.js, out/branchWebviewProvider.js)
// outside VS Code.
//
// Only `Uri` is modelled. Module-level code may *reference* other APIs (e.g.
// `vscode.EventEmitter` in a class field type), so unknown properties return
// an inert placeholder instead of throwing at load time, but *calling* or
// constructing one throws, so a generator that starts depending on a real API
// fails loudly instead of silently rendering wrong output.

function joinPath(base, ...segments) {
    const path = [base.path, ...segments].filter(Boolean).join('/');
    return { path, toString: () => path };
}

function unmodelled(name) {
    const fail = () => {
        throw new Error(`vscode.${name} is not modelled by scripts/preview/vscode-stub.cjs`);
    };
    return new Proxy(fail, {
        // Not a thenable: awaiting it must not hang.
        get: (_t, prop) => (prop === 'then' ? undefined : unmodelled(`${name}.${String(prop)}`)),
        apply: fail,
        construct: fail,
    });
}

const stub = {
    Uri: { joinPath, file: (path) => ({ path, toString: () => path }) },
};

module.exports = new Proxy(stub, {
    get: (target, prop) => {
        if (prop in target) return target[prop];
        if (prop === 'then' || prop === '__esModule' || typeof prop === 'symbol') return undefined;
        return unmodelled(String(prop));
    },
});
