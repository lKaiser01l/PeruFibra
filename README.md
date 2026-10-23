
## Endpoints

| Método | Ruta           | Auth            | Body                | Respuesta                              |
|--------|----------------|-----------------|---------------------|----------------------------------------|
| POST   | `/api/session` | —               | `{}`                | `201 { sessionId, token, expiresIn }`  |
| POST   | `/api/chat`    | `Bearer <token>`| `{ "message": "…" }`| `200 { reply }`                        |

## Yo si creo

```bash
npm install
npm run dev
```
