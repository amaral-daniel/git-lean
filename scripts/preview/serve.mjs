// Static server for out/ so the previews can be opened in a browser or driven
// with Playwright: http://localhost:4173/preview/
// Usage: node scripts/preview/serve.mjs [port]   (or PORT env var; 0 = any free port)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../out');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

function resolveInRoot(pathname) {
    let decoded;
    try {
        decoded = decodeURIComponent(pathname);
    } catch {
        return { status: 400 };
    }
    // A NUL byte makes fs throw synchronously, which would crash the server.
    if (decoded.includes('\0')) return { status: 400 };
    const file = path.resolve(root, '.' + decoded);
    const rel = path.relative(root, file);
    if (rel.startsWith('..') || path.isAbsolute(rel)) return { status: 403 };
    return { file };
}

/** Starts the server; resolves with it once listening (rejects if the port is taken). */
export function startServer(port = 4173) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        // Browsers request this automatically; a 404 would show up as a console error.
        if (url.pathname === '/favicon.ico') {
            res.writeHead(204).end();
            return;
        }
        let { file, status } = resolveInRoot(url.pathname);
        if (status) {
            res.writeHead(status).end();
            return;
        }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        fs.readFile(file, (err, data) => {
            if (err) {
                res.writeHead(404).end('Not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
            res.end(data);
        });
    });
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => resolve(server));
    });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const requested = Number(process.argv[2] ?? process.env.PORT ?? 4173);
    try {
        const server = await startServer(requested);
        console.log(`Serving previews at http://localhost:${server.address().port}/preview/`);
    } catch (err) {
        console.error(`Could not start server on port ${requested}: ${err.message}`);
        process.exit(1);
    }
}
