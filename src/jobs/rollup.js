require('dotenv').config();
const { sequelize } = require('../../models');

(async function run(){
  try{
    // Agregamos ayer y hoy (ventana 2 días)
    await sequelize.query(`
      WITH slice AS (
        SELECT *
        FROM events
        WHERE ts >= NOW() - INTERVAL '2 days'
      )
      , daily AS (
        SELECT
          DATE_TRUNC('day', ts)::date AS day,
          city_slug,
          COALESCE(category_slug, 'all') AS category_slug,
          COUNT(*) FILTER (WHERE type='user_search') AS searches,
          COUNT(*) FILTER (WHERE type='provider_view') AS provider_views,
          COUNT(*) FILTER (WHERE type='contact_click') AS contacts,
          COUNT(*) FILTER (WHERE type='review_submit') AS reviews,
          COUNT(DISTINCT COALESCE(user_id::text, anonymous_id)) AS active_users
        FROM slice
        GROUP BY 1,2,3
      )
      INSERT INTO daily_metrics AS dm
      (day, city_slug, category_slug, searches, provider_views, contacts, reviews, active_users, updated_at)
      SELECT day, city_slug, category_slug, searches, provider_views, contacts, reviews, active_users, NOW()
      FROM daily
      ON CONFLICT (day, city_slug, category_slug)
      DO UPDATE SET
        searches = EXCLUDED.searches,
        provider_views = EXCLUDED.provider_views,
        contacts = EXCLUDED.contacts,
        reviews = EXCLUDED.reviews,
        active_users = EXCLUDED.active_users,
        updated_at = NOW();
    `);

    // Ventana 90d para calidad (rating y % con fotos)
    await sequelize.query(`
      WITH win AS (
        SELECT
          DATE_TRUNC('day', ts)::date AS day,
          city_slug,
          COALESCE(category_slug, 'all') AS category_slug,
          SUM(rating) AS rating_sum,
          COUNT(rating) AS rating_cnt,
          SUM(CASE WHEN has_photos IS TRUE THEN 1 ELSE 0 END) AS with_photos
        FROM events
        WHERE type='review_submit' AND ts >= NOW() - INTERVAL '90 days'
        GROUP BY 1,2,3
      )
      UPDATE daily_metrics dm
      SET
        rating_sum_90d = w.rating_sum,
        rating_cnt_90d = w.rating_cnt,
        reviews_with_photos_90d = w.with_photos,
        updated_at = NOW()
      FROM win w
      WHERE dm.day = w.day AND dm.city_slug = w.city_slug AND dm.category_slug = w.category_slug;
    `);

    console.log('Rollup OK');
    process.exit(0);
  } catch (e) {
    console.error('Rollup ERROR', e);
    process.exit(1);
  }
})();
