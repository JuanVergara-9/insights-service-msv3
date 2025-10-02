const crypto = require('crypto');
const dayjs = require('dayjs');
const { Event, sequelize } = require('../../models');

function ipHash(req){
  try{
    const ip = (req.headers['x-forwarded-for']||'').split(',')[0]?.trim() || req.ip || '';
    const salt = process.env.IP_SALT || 'salt';
    return crypto.createHash('sha256').update(ip + salt).digest('hex');
  } catch { return null; }
}

async function ingestBatch(events, req){
  const clean = [];
  for (const e of events) {
    const now = new Date();
    clean.push({
      event_id: e.eventId || crypto.randomUUID(),
      type: String(e.type || '').toLowerCase(),
      ts: e.ts ? new Date(e.ts) : now,

      user_id: e.userId ?? null,
      anonymous_id: String(e.anonymousId || 'anon'),
      session_id: String(e.sessionId || 'sess'),

      city_slug: String(e.city || '').toLowerCase(),
      category_slug: e.category ? String(e.category).toLowerCase() : null,
      provider_id: e.providerId ?? null,

      query: e.query ? String(e.query).slice(0,160) : null,
      channel: e.channel ? String(e.channel).toLowerCase() : null,
      rating: e.rating ?? null,
      has_photos: !!e.hasPhotos,

      device: e.device ? String(e.device).slice(0,160) : null,
      ip_hash: ipHash(req),
      extra: e.extra || {}
    });
  }

  // Insert idempotente por PK(event_id). Ignoramos duplicados.
  // Usamos transacción + bulkCreate con ignoreDuplicates.
  return sequelize.transaction(async (t) => {
    await Event.bulkCreate(clean, { transaction: t, ignoreDuplicates: true });
    return { inserted: clean.length };
  });
}

module.exports = { ingestBatch };
