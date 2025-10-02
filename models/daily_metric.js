'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('DailyMetric', {
    day: { type: DataTypes.DATEONLY, primaryKey: true },
    city_slug: { type: DataTypes.STRING(80), primaryKey: true },
    category_slug: { type: DataTypes.STRING(80), primaryKey: true, allowNull: true },

    searches: { type: DataTypes.INTEGER, defaultValue: 0 },
    provider_views: { type: DataTypes.INTEGER, defaultValue: 0 },
    contacts: { type: DataTypes.INTEGER, defaultValue: 0 },
    reviews: { type: DataTypes.INTEGER, defaultValue: 0 },
    active_users: { type: DataTypes.INTEGER, defaultValue: 0 },

    rating_sum_90d: { type: DataTypes.INTEGER, defaultValue: 0 },
    rating_cnt_90d: { type: DataTypes.INTEGER, defaultValue: 0 },
    reviews_with_photos_90d: { type: DataTypes.INTEGER, defaultValue: 0 },
  }, { tableName: 'daily_metrics', underscored: true, timestamps: true, updatedAt: 'updated_at', createdAt: false });
};
