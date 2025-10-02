const router = require('express').Router();
const ctrl = require('../controllers/metrics.controller');

// públicas para el dashboard MVP
router.get('/metrics/summary', ctrl.summary);
router.get('/metrics/funnel', ctrl.funnel);
router.get('/metrics/categories', ctrl.categories);

module.exports = router;
