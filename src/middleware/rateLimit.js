import rateLimit from 'express-rate-limit';

const make = (opts) =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: { code: 'rate_limited', message: 'Demasiadas solicitudes. Intenta en unos momentos.' },
      }),
    ...opts,
  });

export const globalLimiter = make({ windowMs: 15 * 60 * 1000, limit: 300 });

export const sessionLimiter = make({ windowMs: 60 * 60 * 1000, limit: 20 });


export const chatLimiter = make({
  windowMs: 60 * 1000,
  limit: 8,
  keyGenerator: (req) => req.sessionId,
});
