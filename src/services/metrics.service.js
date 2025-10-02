const { sequelize } = require('../../models');
const dayjs = require('dayjs');

function parseRange(q){
  const to = q.to ? dayjs(q.to).endOf('day') : dayjs().endOf('day');
  const from = q.from ? dayjs(q.from).startOf('day') : to.subtract(6, 'day').startOf('day'); // default 7 días
  return { from: from.toDate(), to: to.toDate() };
}

async function summary(params){
  const { from, to } = parseRange(params);
  const city = params.city?.toLowerCase();
  const cat  = params.category?.toLowerCase() || null;

  const [rows] = await sequelize.query(`
    SELECT
      COALESCE(SUM(searches),0) AS searches,
      COALESCE(SUM(provider_views),0) AS provider_views,
      COALESCE(SUM(contacts),0) AS contacts,
      COALESCE(SUM(reviews),0) AS reviews,
      COALESCE(ROUND(AVG(active_users)),0) AS dau
    FROM daily_metrics
    WHERE day BETWEEN :from::date AND :to::date
      AND city_slug = :city
      AND COALESCE(category_slug, 'all') = COALESCE(:cat, 'all')
  `, { replacements: { from, to, city, cat } });

  // WAU simple: actores promedio * 7 (aprox) — para MVP.
  const wau = Number(rows?.dau || 0) * 7;

  // Rating 90d (MVP: consulta directa a events para exactitud en rango 90d)
  const [r90] = await sequelize.query(`
    SELECT
      COALESCE(SUM(rating),0) AS rating_sum,
      COALESCE(COUNT(rating),0) AS rating_cnt,
      COALESCE(SUM(CASE WHEN has_photos THEN 1 ELSE 0 END),0) AS photos_cnt
    FROM events
    WHERE type = 'review_submit'
      AND ts >= (NOW() - INTERVAL '90 days')
      AND city_slug = :city
      AND COALESCE(category_slug, 'all') = COALESCE(:cat, 'all')
  `, { replacements: { city, cat } });

  const rating90d = Number(r90?.rating_cnt || 0) ? Number((r90.rating_sum / r90.rating_cnt).toFixed(1)) : 0;
  const photosRate90d = Number(r90?.rating_cnt || 0) ? Math.round((r90.photos_cnt / r90.rating_cnt) * 100) : 0;

  return {
    dau: Number(rows?.dau || 0),
    wau,
    searches: Number(rows?.searches || 0),
    providerViews: Number(rows?.provider_views || 0),
    contacts: Number(rows?.contacts || 0),
    reviews: Number(rows?.reviews || 0),
    rating90d,
    photosRate90d
  };
}

async function funnel(params){
  const { from, to } = parseRange(params);
  const city = params.city?.toLowerCase();
  const cat  = params.category?.toLowerCase() || null;

  const [rows] = await sequelize.query(`
    SELECT
      COALESCE(SUM(searches),0) AS searches,
      COALESCE(SUM(provider_views),0) AS views,
      COALESCE(SUM(contacts),0) AS contacts,
      COALESCE(SUM(reviews),0) AS reviews
    FROM daily_metrics
    WHERE day BETWEEN :from::date AND :to::date
      AND city_slug = :city
      AND COALESCE(category_slug, 'all') = COALESCE(:cat, 'all')
  `, { replacements: { from, to, city, cat } });

  const s = Number(rows?.searches || 0);
  const v = Number(rows?.views || 0);
  const c = Number(rows?.contacts || 0);
  const r = Number(rows?.reviews || 0);

  const pct = (a,b)=> b>0 ? Number(((a/b)*100).toFixed(1)) : 0;

  return {
    steps: { searches: s, views: v, contacts: c, reviews: r },
    conversion: {
      searchToContact: pct(c, s),
      contactToReview: pct(r, c),
      searchToReview: pct(r, s)
    }
  };
}

async function categoriesRanking(params){
  const { from, to } = parseRange(params);
  const city = params.city?.toLowerCase();

  const [rows] = await sequelize.query(`
    SELECT COALESCE(category_slug,'all') AS category,
           SUM(contacts)::int AS contacts,
           SUM(reviews)::int  AS reviews
    FROM daily_metrics
    WHERE day BETWEEN :from::date AND :to::date
      AND city_slug = :city
    GROUP BY COALESCE(category_slug,'all')
    ORDER BY contacts DESC, reviews DESC
  `, { replacements: { from, to, city } });

  return { items: rows || [] };
}

module.exports = { summary, funnel, categoriesRanking };
