// Static server for out/ so the previews can be opened in a browser or driven
// with Playwright: http://localhost:4173/preview/
// Usage: node scripts/preview/serve.mjs [port]   (or PORT env var)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../out');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };

export function startServer(port = 4173) {
    const server = http.createServer((req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        // Browsers request this automatically; a 404 would show up as a console error.
        if (url.pathname === '/favicon.ico') {
            res.writeHead(204).end();
            return;
        }
        let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
        if (!file.startsWith(root)) {
            res.writeHead(403).end();
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
    return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const port = Number(process.argv[2] ?? process.env.PORT ?? 4173);
    await startServer(port);
    console.log(`Serving previews at http://localhost:${port}/preview/`);
}
