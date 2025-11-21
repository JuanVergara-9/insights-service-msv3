const svc = require('../services/metrics.service');

async function summary(req, res, next) {
  try { const data = await svc.summary(req.query); res.json(data); }
  catch (e) { next(e); }
}
async function funnel(req, res, next) {
  try { const data = await svc.funnel(req.query); res.json(data); }
  catch (e) { next(e); }
}
async function categories(req, res, next) {
  try { const data = await svc.categoriesRanking(req.query); res.json(data); }
  catch (e) { next(e); }
}

async function contactsBreakdown(req, res, next) {
  try { const data = await svc.contactsBreakdown(req.query); res.json(data); }
  catch (e) { next(e); }
}

module.exports = { summary, funnel, categories, contactsBreakdown };
