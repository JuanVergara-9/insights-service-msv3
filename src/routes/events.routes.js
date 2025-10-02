const router=require('express').Router();
const { requireIngestKey } = require('../middlewares/ingestKey.middleware');
const ctrl=require('../controllers/events.controller');

router.post('/events', requireIngestKey, ctrl.ingest);

module.exports = router;
