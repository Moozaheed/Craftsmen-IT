import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

function handler(req, res) {
  let parsedUrl;
  try {
    parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  } catch (e) {
    res.writeHead(400);
    return res.end('Bad Request');
  }

  // Handle Netlify function endpoint locally
  if (parsedUrl.pathname === '/.netlify/functions/consultation' || parsedUrl.pathname === '/api/consultation') {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        let data = {};
        try {
          data = JSON.parse(body);
        } catch (e) {
          const params = new URLSearchParams(body);
          for (const [k, v] of params.entries()) data[k] = v;
        }

        console.log('\n📩 [LOCAL SERVER] Received Consultation Request:', data);

        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ success: true, message: 'Received consultation request' }));
      });
      return;
    }
  }

  let pathname = decodeURIComponent(parsedUrl.pathname);
  let filePath = path.join(ROOT, pathname);

  // If directory, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Also check without trailing slash or extension
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    const acceptEncoding = req.headers['accept-encoding'] || '';

    // Cache-Control headers
    let cacheControl = 'public, max-age=86400';
    if (ext === '.html' || pathname === '/sw.js') {
      cacheControl = 'public, max-age=0, must-revalidate';
    } else if (['.woff2', '.woff', '.ttf', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico'].includes(ext)) {
      cacheControl = 'public, max-age=31536000, immutable';
    }

    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff'
    };

    if (pathname === '/sw.js') {
      headers['Service-Worker-Allowed'] = '/';
    }

    const isCompressible = contentType.startsWith('text/') || contentType.includes('javascript') || contentType.includes('json') || contentType.includes('svg');

    if (isCompressible && acceptEncoding.includes('gzip')) {
      headers['Content-Encoding'] = 'gzip';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createGzip()).pipe(res);
    } else if (isCompressible && acceptEncoding.includes('deflate')) {
      headers['Content-Encoding'] = 'deflate';
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(zlib.createDeflate()).pipe(res);
    } else {
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

function startServer(port) {
  const server = http.createServer(handler);
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Craftsmen.it Fast Server is live at: http://localhost:${port}`);
    console.log(`======================================================\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

const initialPort = parseInt(process.env.PORT || '8083', 10);
startServer(initialPort);
