// PhotoWalk server — zero dependencies. Run: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

const PORT = process.env.PORT || 3000;
const PUB = path.join(__dirname, 'public');
const DATA = path.join(__dirname, 'data');
const IMG = path.join(DATA, 'photos');
const DB = path.join(DATA, 'photos.json');
fs.mkdirSync(IMG, { recursive: true });

let photos = [];
try { photos = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch {}
const save = () => fs.writeFileSync(DB, JSON.stringify(photos, null, 1));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon',
};

function send(res, code, body, type = 'application/json') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

function serveFile(res, base, rel) {
  const p = path.normalize(path.join(base, decodeURIComponent(rel)));
  if (!p.startsWith(base + path.sep)) return send(res, 403, 'forbidden', 'text/plain');
  fs.readFile(p, (err, data) => {
    if (err) return send(res, 404, 'not found', 'text/plain');
    send(res, 200, data, TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream');
  });
}

const num = v => (Number.isFinite(+v) ? +v : 0);

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/api/photos' && req.method === 'GET') {
    return send(res, 200, JSON.stringify(photos));
  }

  if (url.pathname === '/api/photos' && req.method === 'POST') {
    const chunks = [];
    let size = 0, aborted = false;
    req.on('data', c => {
      size += c.length;
      if (size > 8e6 && !aborted) { aborted = true; send(res, 413, '{"error":"image too big"}'); req.destroy(); }
      else if (!aborted) chunks.push(c);
    });
    req.on('end', () => {
      if (aborted) return;
      try {
        const b = JSON.parse(Buffer.concat(chunks).toString());
        const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(b.image || '');
        if (!m) throw new Error('bad image');
        const id = Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
        const file = id + (m[1] === 'png' ? '.png' : '.jpg');
        fs.writeFileSync(path.join(IMG, file), Buffer.from(m[2], 'base64'));
        const p = {
          id, x: num(b.x), z: num(b.z), yaw: num(b.yaw),
          caption: String(b.caption || '').slice(0, 140),
          author: String(b.author || 'Anonymous').slice(0, 30) || 'Anonymous',
          url: '/photos/' + file, time: Date.now(), likes: 0,
        };
        photos.push(p);
        save();
        send(res, 201, JSON.stringify(p));
      } catch {
        send(res, 400, '{"error":"bad request"}');
      }
    });
    return;
  }

  const like = /^\/api\/photos\/([a-z0-9]+)\/like$/.exec(url.pathname);
  if (like && req.method === 'POST') {
    const p = photos.find(p => p.id === like[1]);
    if (!p) return send(res, 404, '{"error":"not found"}');
    p.likes = (p.likes || 0) + 1;
    save();
    return send(res, 200, JSON.stringify(p));
  }

  if (url.pathname.startsWith('/photos/')) return serveFile(res, IMG, url.pathname.slice(8));
  serveFile(res, PUB, url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
}).listen(PORT, '0.0.0.0', () => {
  console.log(`\nPhotoWalk running:\n  This computer:  http://localhost:${PORT}`);
  for (const list of Object.values(os.networkInterfaces()))
    for (const n of list || [])
      if (n.family === 'IPv4' && !n.internal) console.log(`  Same Wi-Fi:     http://${n.address}:${PORT}`);
  console.log('');
});
