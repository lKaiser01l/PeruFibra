import { Router } from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';
import { requireSession, signSessionToken } from '../middleware/auth.js';
import { askAgent } from '../services/n8n.js';

const router = Router();

const chatBody = z
  .object({ message: z.string({ required_error: 'message es obligatorio', invalid_type_error: 'message debe ser texto' }).trim().min(1, 'El mensaje no puede estar vacío') })
  .strict();

router.post('/session', (_req, res) => {
  const sessionId = crypto.randomUUID();
  res.status(201).json({ sessionId, token: signSessionToken(sessionId), expiresIn: config.jwt.ttlSeconds });
});

router.post('/chat', requireSession, async (req, res, next) => {
  const parsed = chatBody.safeParse(req.body);
  if (!parsed.success) return next(new HttpError(400, 'invalid_body', parsed.error.issues[0].message));
  try {
    const reply = await askAgent({ message: parsed.data.message, sessionId: req.sessionId }, req.log);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});

export default router;
