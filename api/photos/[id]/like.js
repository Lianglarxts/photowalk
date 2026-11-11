// POST /api/photos/:id/like -> the photo with its new like count
const { put, listAll, readMeta, ready, newId, notReady } = require('../../_blob');

module.exports = async (req, res) => {
  if (!ready()) return notReady(res);
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method not allowed' }); }
  const id = String(req.query.id || '');
  if (!/^[a-z0-9]+$/.test(id)) return res.status(400).json({ error: 'bad id' });
  try {
    const meta = (await listAll(`meta/${id}.json`))[0];
    if (!meta) return res.status(404).json({ error: 'not found' });
    await put(`likes/${id}/${newId()}.json`, '1', { access: 'public', contentType: 'application/json', addRandomSuffix: false });
    const [p, likes] = await Promise.all([readMeta(meta), listAll(`likes/${id}/`)]);
    return res.status(200).json({ ...p, likes: likes.length });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'storage error' });
  }
};
