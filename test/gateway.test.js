import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';

let mock, mockCalls = [], gateway, base;

before(async () => {
  mock = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      mockCalls.push({ headers: req.headers, body: JSON.parse(body || '{}') });
      if (req.headers['x-api-key'] !== 'secreto-n8n') { res.writeHead(403); return res.end(); }
      const { message } = JSON.parse(body);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ reply: `eco: ${message}` }));
    });
  });
  await new Promise((r) => mock.listen(0, r));

  Object.assign(process.env, {
    NODE_ENV: 'test',
    JWT_SECRET: 'x'.repeat(48),
    N8N_WEBHOOK_URL: `http://127.0.0.1:${mock.address().port}/webhook/abc`,
    N8N_AUTH_HEADER_NAME: 'X-API-Key',
    N8N_AUTH_HEADER_VALUE: 'secreto-n8n',
    ALLOWED_ORIGINS: 'http://front.test',
  });
  const { createApp } = await import('../src/app.js');
  gateway = createApp().listen(0);
  await new Promise((r) => gateway.once('listening', r));
  base = `http://127.0.0.1:${gateway.address().port}`;
});

after(() => { gateway.close(); mock.close(); });

const post = (path, body, token, extra = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...extra },
    body: JSON.stringify(body),
  });

const newSession = async () => (await (await post('/api/session', {})).json());

test('health', async () => {
  assert.equal((await fetch(base + '/health')).status, 200);
});

test('chat sin token -> 401', async () => {
  assert.equal((await post('/api/chat', { message: 'hola' })).status, 401);
});

test('token falso -> 401', async () => {
  assert.equal((await post('/api/chat', { message: 'hola' }, 'abc.def.ghi')).status, 401);
});

test('flujo feliz: n8n recibe sessionId del token y el header secreto', async () => {
  const s = await newSession();
  const r = await post('/api/chat', { message: '  Hola   ' }, s.token);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { reply: 'eco: Hola' });
  const call = mockCalls.at(-1);
  assert.equal(call.body.sessionId, s.sessionId);
  assert.equal(call.headers['x-api-key'], 'secreto-n8n');
});

test('el cliente no puede inyectar sessionId (strict)', async () => {
  const s = await newSession();
  const r = await post('/api/chat', { message: 'hola', sessionId: 'otra-sesion' }, s.token);
  assert.equal(r.status, 400);
});

test('CORS: origen no permitido -> 403, permitido -> ok', async () => {
  const bad = await post('/api/session', {}, null, { Origin: 'http://evil.test' });
  assert.equal(bad.status, 403);
  const ok = await post('/api/session', {}, null, { Origin: 'http://front.test' });
  assert.equal(ok.status, 201);
  assert.equal(ok.headers.get('access-control-allow-origin'), 'http://front.test');
});


test('mensaje vacío o no-string -> 400', async () => {
  const s = await newSession();
  assert.equal((await post('/api/chat', { message: '   ' }, s.token)).status, 400);
  assert.equal((await post('/api/chat', { message: { $ne: 1 } }, s.token)).status, 400);
});

test('sin límites: mensaje largo, respuesta larga y muchos mensajes seguidos', async () => {
  const s = await newSession();
  const largo = 'a'.repeat(20000);
  const r = await post('/api/chat', { message: largo }, s.token);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).reply, 'eco: ' + largo);
  for (let i = 0; i < 100; i++) assert.equal((await post('/api/chat', { message: 'x' }, s.token)).status, 200);
});
