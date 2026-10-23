export class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'not_found', 'Ruta no encontrada.'));
}


export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'invalid_json', message: 'JSON inválido.' } });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'payload_too_large', message: 'Solicitud demasiado grande.' } });
  }
  if (err.message === 'CORS_NOT_ALLOWED') {
    return res.status(403).json({ error: { code: 'cors', message: 'Origen no permitido.' } });
  }
  req.log?.error({ err }, 'error no controlado');
  res.status(500).json({ error: { code: 'internal', message: 'Error interno.' } });
}
