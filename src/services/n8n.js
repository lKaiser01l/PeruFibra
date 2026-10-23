import { config } from '../config.js';
import { HttpError } from '../middleware/errors.js';


export async function askAgent({ message, sessionId }, log) {
  const ctrl = new AbortController();
  const timer = config.n8n.timeoutMs > 0 ? setTimeout(() => ctrl.abort(), config.n8n.timeoutMs) : null;

  let res;
  try {
    res = await fetch(config.n8n.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        [config.n8n.headerName]: config.n8n.headerValue,
      },
      body: JSON.stringify({ message, sessionId }),
      signal: ctrl.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      log.warn('timeout esperando a n8n');
      throw new HttpError(504, 'agent_timeout', 'El asistente tardó demasiado. Intenta de nuevo.');
    }
    log.error({ err: err.message }, 'no se pudo conectar con n8n');
    throw new HttpError(502, 'agent_unavailable', 'El asistente no está disponible.');
  } finally {
    if (timer) clearTimeout(timer);
  }

  if (!res.ok) {
    log.error({ status: res.status }, 'n8n respondió con error');
    throw new HttpError(502, 'agent_error', 'El asistente no pudo responder.');
  }

  let data;
  try {
    data = await res.json();
  } catch {
    log.error('n8n devolvió algo que no es JSON');
    throw new HttpError(502, 'agent_bad_response', 'Respuesta inválida del asistente.');
  }

  const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
  if (!reply) {
    log.error('n8n devolvió JSON sin "reply"');
    throw new HttpError(502, 'agent_bad_response', 'Respuesta inválida del asistente.');
  }
  return reply;
}
