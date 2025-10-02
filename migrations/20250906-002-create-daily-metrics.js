'use strict';
module.exports = {
  async up(q, S) {
    await q.createTable('daily_metrics', {
      day: { type: S.DATEONLY, primaryKey: true },
      city_slug: { type: S.STRING(80), primaryKey: true },
      category_slug: { type: S.STRING(80), primaryKey: true, allowNull: true },

      searches: { type: S.INTEGER, allowNull:false, defaultValue:0 },
      provider_views: { type: S.INTEGER, allowNull:false, defaultValue:0 },
      contacts: { type: S.INTEGER, allowNull:false, defaultValue:0 },
      reviews: { type: S.INTEGER, allowNull:false, defaultValue:0 },
      active_users: { type: S.INTEGER, allowNull:false, defaultValue:0 },

      rating_sum_90d: { type: S.INTEGER, allowNull:false, defaultValue:0 },
      rating_cnt_90d: { type: S.INTEGER, allowNull:false, defaultValue:0 },
      reviews_with_photos_90d: { type: S.INTEGER, allowNull:false, defaultValue:0 },

      updated_at: { type: S.DATE, allowNull:false, defaultValue: S.fn('NOW') }
    });
    await q.addIndex('daily_metrics', ['day'], { name: 'dm_day_idx' });
  },
  async down(q){ await q.dropTable('daily_metrics'); }
};
