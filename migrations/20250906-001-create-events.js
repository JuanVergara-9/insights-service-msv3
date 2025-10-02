'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('events', {
      event_id: { type: S.UUID, primaryKey: true },
      type: { type: S.STRING(40), allowNull: false }, // user_search|provider_view|contact_click|review_submit|provider_marked_responded
      ts: { type: S.DATE, allowNull: false, defaultValue: S.fn('NOW') },

      user_id: { type: S.INTEGER, allowNull: true },
      anonymous_id: { type: S.STRING(64), allowNull: false },
      session_id: { type: S.STRING(64), allowNull: false },

      city_slug: { type: S.STRING(80), allowNull: false },
      category_slug: { type: S.STRING(80), allowNull: true },
      provider_id: { type: S.INTEGER, allowNull: true },

      query: { type: S.STRING(160) },    // user_search
      channel: { type: S.STRING(16) },   // contact_click: whatsapp|form
      rating: { type: S.SMALLINT },      // review_submit
      has_photos: { type: S.BOOLEAN },   // review_submit

      device: { type: S.STRING(160) },
      ip_hash: { type: S.STRING(64) },   // sha256(ip+salt)
      extra: { type: S.JSONB, allowNull: false, defaultValue: {} },

      created_at: { type: S.DATE, allowNull: false, defaultValue: S.fn('NOW') },
      updated_at: { type: S.DATE, allowNull: false, defaultValue: S.fn('NOW') }
    });
    await q.addIndex('events', ['ts'], { name: 'events_ts_idx' });
    await q.addIndex('events', ['type', 'ts'], { name: 'events_type_ts_idx' });
    await q.addIndex('events', ['city_slug', 'ts'], { name: 'events_city_ts_idx' });
    await q.addIndex('events', ['category_slug', 'ts'], { name: 'events_cat_ts_idx' });
    await q.addIndex('events', ['provider_id', 'ts'], { name: 'events_provider_ts_idx' });
  },
  async down(q){ await q.dropTable('events'); }
};
