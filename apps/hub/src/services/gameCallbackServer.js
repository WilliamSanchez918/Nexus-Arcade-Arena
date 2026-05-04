import http from 'node:http';
import { verifyGameResultSignature } from '../../../../packages/shared/src/crypto.js';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Callback body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export function createGameCallbackServer({ port, secret, onResult }) {
  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST' || req.url !== '/nexus/game-result') {
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    try {
      const body = await readBody(req);
      const payload = JSON.parse(body);
      if (!verifyGameResultSignature(payload, secret)) {
        res.writeHead(401, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
      }

      const result = await onResult(payload);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, result }));
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve({
        server,
        callbackUrl: `http://127.0.0.1:${port}/nexus/game-result`
      });
    });
  });
}
