// Shared helpers for the Vercel deployment. Photos live in Vercel Blob storage:
//   images/<id>.jpg        the picture
//   meta/<id>.json         position, caption, author, time (written once)
//   likes/<id>/<rand>.json one tiny file per like (so likes never need overwrites)
const crypto = require('crypto');
const { put, list } = require('@vercel/blob');

const ready = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const newId = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');

async function listAll(prefix) {
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    out.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}

async function readMeta(blob) {
  try { const r = await fetch(blob.url); return r.ok ? await r.json() : null; } catch { return null; }
}

function notReady(res) {
  return res.status(503).json({ error: 'Photo storage is not set up yet. In Vercel, connect a Blob store to this project and redeploy.' });
}

module.exports = { put, listAll, readMeta, ready, newId, notReady };
