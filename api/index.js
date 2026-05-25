const fs = require('fs');
const path = require('path');
const { handleApi } = require('./[...path].js');

const ROOT = path.join(__dirname, '..');
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
  '.webp': 'image/webp'
};

function sendFile(res, filePath, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = status;
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res);

  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  if (!path.extname(pathname)) pathname += '.html';

  const safePath = path.normalize(pathname).replace(/^([.][.][/\\])+/, '');
  let filePath = path.join(ROOT, safePath);
  if (!filePath.startsWith(ROOT)) filePath = path.join(ROOT, '404.html');
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(ROOT, '404.html');
    return sendFile(res, filePath, 404);
  }
  return sendFile(res, filePath, 200);
};
