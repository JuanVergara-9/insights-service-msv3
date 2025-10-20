console.log('🚀 Starting insights-service...');
require('dotenv').config();
console.log('✅ Environment loaded');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
console.log('✅ Dependencies loaded');

console.log('📦 Loading models...');
const { sequelize } = require('../models');
console.log('✅ Models loaded');

const app = express();
const PORT = process.env.PORT || 4006;

// Confiar en proxy (Railway)
app.set('trust proxy', 1);

// CORS: libre en dev/postman, whitelist en prod
const origins = (process.env.CORS_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);                       // curl/postman
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    return cb(null, origins.length === 0 || origins.includes(origin));
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','x-request-id']
}));

app.use(helmet());
app.use(express.json({ limit: '512kb' }));
app.use(express.urlencoded({ extended: true, limit: '512kb' }));

// Request ID para trazas
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.set('x-request-id', req.id);
  next();
});

app.use(morgan(':method :url :status - :response-time ms - :req[x-request-id]'));

// Timeouts prudentes
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// Health / Readiness (incluye alias)
app.get('/health', (_req, res) => res.json({ ok: true, service: 'insights-service' }));
app.get('/ready',  async (_req, res) => {
  try { await sequelize.authenticate(); return res.json({ ok: true }); }
  catch { return res.status(503).json({ ok: false }); }
});
app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'insights-service' }));
app.get('/readyz',  async (_req, res) => {
  try { await sequelize.authenticate(); return res.json({ ok: true }); }
  catch { return res.status(503).json({ ok: false }); }
});

// Rutas
app.use('/api/v1', require('./routes/events.routes'));
app.use('/api/v1', require('./routes/metrics.routes'));

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const s = err.status || 500;
  res.status(s).json({
    error: { code: err.code || 'INTERNAL_ERROR', message: err.message || 'Internal error' }
  });
});

// Bind 0.0.0.0 para Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 insights-service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Metrics: http://localhost:${PORT}/api/v1/metrics/summary`);
});
