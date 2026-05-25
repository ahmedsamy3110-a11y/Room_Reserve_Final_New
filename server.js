const fs = require('fs');
const path = require('path');
const { handleApi } = require('./api/[...path].js');

const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

function sendFile(res, filePath, statusCode = 200) {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = statusCode;
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

function safePublicPath(urlPathname) {
  let pathname = decodeURIComponent(urlPathname.split('?')[0] || '/');
  if (pathname === '/') pathname = '/index.html';
  if (!path.extname(pathname)) pathname += '.html';
  const cleanPath = path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, cleanPath);
  if (!filePath.startsWith(PUBLIC_DIR)) return path.join(PUBLIC_DIR, '404.html');
  return filePath;
}

async function app(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
      return await handleApi(req, res);
    }
    let filePath = safePublicPath(url.pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(PUBLIC_DIR, '404.html');
      return sendFile(res, filePath, 404);
    }
    return sendFile(res, filePath, 200);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
}

module.exports = app;

if (require.main === module) {
  const http = require('http');
  const port = process.env.PORT || 3000;
  http.createServer(app).listen(port, () => {
    console.log(`Room Reserve is running at http://localhost:${port}`);
  });
}
