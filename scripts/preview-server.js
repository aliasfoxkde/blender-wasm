#!/usr/bin/env node
/**
 * Simple static file server for previewing the built application.
 * Uses native Node.js without npm dependencies.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.PORT || 4173;
const DIST_DIR = join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.blend': 'application/x-blender',
};

async function handleRequest(req, res) {
  try {
    // Default to index.html
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';

    const filePath = join(DIST_DIR, urlPath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const content = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // Try index.html for client-side routing
      try {
        const content = await readFile(join(DIST_DIR, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not Found');
      }
    } else {
      res.writeHead(500);
      res.end('Server Error');
    }
  }
}

const server = createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Preview server running at http://localhost:${PORT}`);
  console.log(`Serving files from: ${DIST_DIR}`);
  console.log('Press Ctrl+C to stop');
});
