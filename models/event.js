'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Event', {
    event_id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    type: { type: DataTypes.STRING(40), allowNull: false },
    ts: { type: DataTypes.DATE, allowNull: false },

    user_id: DataTypes.INTEGER,
    anonymous_id: { type: DataTypes.STRING(64), allowNull: false },
    session_id: { type: DataTypes.STRING(64), allowNull: false },

    city_slug: { type: DataTypes.STRING(80), allowNull: false },
    category_slug: DataTypes.STRING(80),
    provider_id: DataTypes.INTEGER,

    query: DataTypes.STRING(160),
    channel: DataTypes.STRING(16),
    rating: DataTypes.SMALLINT,
    has_photos: DataTypes.BOOLEAN,

    device: DataTypes.STRING(160),
    ip_hash: DataTypes.STRING(64),
    extra: { type: DataTypes.JSONB, defaultValue: {} },
  }, { tableName: 'events', underscored: true });
};
