// GET  /api/photos  -> all photos with like counts
// POST /api/photos  -> { image: dataURL, x, z, yaw, caption, author }
const { put, listAll, readMeta, ready, newId, notReady } = require('../_blob');

const num = v => (Number.isFinite(+v) ? +v : 0);

module.exports = async (req, res) => {
  if (!ready()) return notReady(res);
  try {
    if (req.method === 'GET') {
      const [metas, likes] = await Promise.all([listAll('meta/'), listAll('likes/')]);
      const counts = {};
      for (const b of likes) { const id = b.pathname.split('/')[1]; counts[id] = (counts[id] || 0) + 1; }
      const photos = (await Promise.all(metas.map(readMeta)))
        .filter(Boolean)
        .map(p => ({ ...p, likes: counts[p.id] || 0 }))
        .sort((a, b) => a.time - b.time);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(photos);
    }

    if (req.method === 'POST') {
      const b = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const m = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(b.image || '');
      if (!m) return res.status(400).json({ error: 'bad image' });
      const id = newId(), ext = m[1] === 'png' ? 'png' : 'jpg';
      const img = await put(`images/${id}.${ext}`, Buffer.from(m[2], 'base64'),
        { access: 'public', contentType: `image/${m[1]}`, addRandomSuffix: false });
      const p = {
        id, x: num(b.x), z: num(b.z), yaw: num(b.yaw),
        caption: String(b.caption || '').slice(0, 140),
        author: String(b.author || 'Anonymous').slice(0, 30) || 'Anonymous',
        url: img.url, time: Date.now(),
      };
      await put(`meta/${id}.json`, JSON.stringify(p), { access: 'public', contentType: 'application/json', addRandomSuffix: false });
      return res.status(201).json({ ...p, likes: 0 });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'storage error' });
  }
};
