const { sequelize } = require('../../models');
const dayjs = require('dayjs');

function parseRange(q) {
  const to = q.to ? dayjs(q.to).endOf('day') : dayjs().endOf('day');
  const from = q.from ? dayjs(q.from).startOf('day') : to.subtract(6, 'day').startOf('day'); // default 7 días
  return { from: from.toDate(), to: to.toDate() };
}

async function summary(params) {
  const { from, to } = parseRange(params);
  const city = params.city?.toLowerCase() || null;
  const cat = params.category?.toLowerCase() || null;

  // MVP: Consultar events directamente en lugar de daily_metrics para ver datos en tiempo real

  const [rows] = await sequelize.query(`
    SELECT
      COUNT(*) FILTER (WHERE type = 'search') as searches,
      COUNT(*) FILTER (WHERE type = 'view_provider') as provider_views,
      COUNT(*) FILTER (WHERE type = 'contact_intent') as contacts,
      COUNT(*) FILTER (WHERE type = 'review_submit') as reviews,
      COUNT(DISTINCT user_id) FILTER (WHERE type IN ('login', 'app_open', 'view_provider', 'search')) as dau
    FROM events
    WHERE ts BETWEEN :from AND :to
      AND (:city IS NULL OR city_slug = :city)
      AND (:cat IS NULL OR category_slug = :cat)
  `, { replacements: { from, to, city, cat } });

  const row = rows[0] || {};

  // WAU simple: actores promedio * 7 (aprox) — para MVP.
  const dau = Number(row.dau || 0);
  const wau = dau * 7;

  // Rating 90d
  const [r90] = await sequelize.query(`
    SELECT
      COALESCE(SUM(rating),0) AS rating_sum,
      COALESCE(COUNT(rating),0) AS rating_cnt,
      COALESCE(SUM(CASE WHEN has_photos THEN 1 ELSE 0 END),0) AS photos_cnt
    FROM events
    WHERE type = 'review_submit'
      AND ts >= (NOW() - INTERVAL '90 days')
      AND (:city IS NULL OR city_slug = :city)
      AND (:cat IS NULL OR COALESCE(category_slug, 'all') = COALESCE(:cat, 'all'))
  `, { replacements: { city, cat } });

  const rating90d = Number(r90[0]?.rating_cnt || 0) ? Number((r90[0].rating_sum / r90[0].rating_cnt).toFixed(1)) : 0;
  const photosRate90d = Number(r90[0]?.rating_cnt || 0) ? Math.round((r90[0].photos_cnt / r90[0].rating_cnt) * 100) : 0;

  return {
    dau,
    wau,
    searches: Number(row.searches || 0),
    providerViews: Number(row.provider_views || 0),
    contacts: Number(row.contacts || 0),
    reviews: Number(row.reviews || 0),
    rating90d,
    photosRate90d
  };
}

async function funnel(params) {
  const { from, to } = parseRange(params);
  const city = params.city?.toLowerCase() || null;
  const cat = params.category?.toLowerCase() || null;

  // MVP: Real-time from events
  const [rows] = await sequelize.query(`
    SELECT
      COUNT(*) FILTER (WHERE type = 'search') as searches,
      COUNT(*) FILTER (WHERE type = 'view_provider') as views,
      COUNT(*) FILTER (WHERE type = 'contact_intent') as contacts,
      COUNT(*) FILTER (WHERE type = 'review_submit') as reviews
    FROM events
    WHERE ts BETWEEN :from AND :to
      AND (:city IS NULL OR city_slug = :city)
      AND (:cat IS NULL OR category_slug = :cat)
  `, { replacements: { from, to, city, cat } });

  const row = rows[0] || {};
  const s = Number(row.searches || 0);
  const v = Number(row.views || 0);
  const c = Number(row.contacts || 0);
  const r = Number(row.reviews || 0);

  const pct = (a, b) => b > 0 ? Number(((a / b) * 100).toFixed(1)) : 0;

  return {
    steps: { searches: s, views: v, contacts: c, reviews: r },
    conversion: {
      searchToContact: pct(c, s),
      contactToReview: pct(r, c),
      searchToReview: pct(r, s)
    }
  };
}

async function categoriesRanking(params) {
  const { from, to } = parseRange(params);
  const city = params.city?.toLowerCase() || null;

  // MVP: Real-time from events
  const [rows] = await sequelize.query(`
    SELECT COALESCE(category_slug,'all') AS category,
           COUNT(*) FILTER (WHERE type = 'contact_intent')::int AS contacts,
           COUNT(*) FILTER (WHERE type = 'review_submit')::int  AS reviews
    FROM events
    WHERE ts BETWEEN :from AND :to
      AND (:city IS NULL OR city_slug = :city)
    GROUP BY COALESCE(category_slug,'all')
    ORDER BY contacts DESC, reviews DESC
  `, { replacements: { from, to, city } });

  return { items: rows || [] };
}

async function contactsBreakdown(params) {
  const { from, to } = parseRange(params);
  const city = params.city?.toLowerCase() || null;
  const cat = params.category?.toLowerCase() || null;

  // Consultar eventos de tipo contact_intent para el desglose
  const [rows] = await sequelize.query(`
    SELECT
      extra->>'method' as method,
      COUNT(*)::int as count
    FROM events
    WHERE type = 'contact_intent'
      AND ts BETWEEN :from AND :to
      AND (:city IS NULL OR city_slug = :city)
      AND (:cat IS NULL OR category_slug = :cat)
    GROUP BY extra->>'method'
  `, { replacements: { from, to, city, cat } });

  const breakdown = {
    whatsapp: 0,
    phone: 0,
    form: 0,
    unknown: 0,
    total: 0
  };

  rows.forEach(row => {
    const method = row.method || 'unknown';
    if (breakdown.hasOwnProperty(method)) {
      breakdown[method] += row.count;
    } else {
      breakdown.unknown += row.count;
    }
    breakdown.total += row.count;
  });

  return breakdown;
}

module.exports = { summary, funnel, categoriesRanking, contactsBreakdown };
