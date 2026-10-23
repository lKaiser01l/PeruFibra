
## Endpoints

| Método | Ruta           | Auth            | Body                | Respuesta                              |
|--------|----------------|-----------------|---------------------|----------------------------------------|
| POST   | `/api/session` | —               | `{}`                | `201 { sessionId, token, expiresIn }`  |
| POST   | `/api/chat`    | `Bearer <token>`| `{ "message": "…" }`| `200 { reply }`                        |
| GET    | `/health`      | —               | —                   | `{ status: "ok" }`                     |

## Puesta en marcha

```bash
npm install
npm run dev
```
