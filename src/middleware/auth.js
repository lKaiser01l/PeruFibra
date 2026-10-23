import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from './errors.js';

export function signSessionToken(sessionId) {
  return jwt.sign({ sid: sessionId }, config.jwt.secret, {
    algorithm: 'HS256',
    expiresIn: config.jwt.ttlSeconds,
    issuer: 'perufibra-gateway',
  });
}


export function requireSession(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'unauthorized', 'Sesión requerida.'));
  }
  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
      issuer: 'perufibra-gateway',
    });
    req.sessionId = payload.sid;
    next();
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    next(
      new HttpError(
        401,
        expired ? 'session_expired' : 'unauthorized',
        expired ? 'La sesión expiró. Inicia una nueva.' : 'Sesión inválida.'
      )
    );
  }
}
