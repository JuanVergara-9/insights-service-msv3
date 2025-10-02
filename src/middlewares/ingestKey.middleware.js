const { unauthorized } = require('../utils/httpError');

function requireIngestKey(req,_res,next){
  const k = req.headers['x-insights-key'];
  if (!process.env.INSIGHTS_INGEST_KEY) return next(); // por si no seteaste clave aún
  if (!k || k !== process.env.INSIGHTS_INGEST_KEY) {
    return next(unauthorized('INGEST.INVALID_KEY','API key inválida'));
  }
  next();
}
module.exports = { requireIngestKey };
