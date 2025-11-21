const { z } = require('zod');
const svc = require('../services/events.service');
const { badRequest } = require('../utils/httpError');

const eventSchema = z.object({
  eventId: z.string().uuid().optional(),
  type: z.enum(['user_search','provider_view','contact_click','review_submit','provider_marked_responded']),
  ts: z.string().datetime().optional(),
  userId: z.number().int().optional(),
  anonymousId: z.string().min(1),
  sessionId: z.string().min(1),
  city: z.string().min(1),
  category: z.string().optional(),
  providerId: z.number().int().optional(),
  query: z.string().max(160).optional(),
  channel: z.string().min(1).max(32).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  hasPhotos: z.boolean().optional(),
  device: z.string().max(160).optional(),
  extra: z.record(z.any()).optional()
}).strict();

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(100)
}).strict();

async function ingest(req,res,next){
  try{
    const data = batchSchema.parse(req.body);
    const r = await svc.ingestBatch(data.events, req);
    res.status(202).json({ ok: true, ...r });
  } catch(e){ next(e); }
}

module.exports = { ingest };
