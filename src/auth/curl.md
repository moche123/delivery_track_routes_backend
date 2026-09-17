## Curl para loguear
```bash
curl -X POST http://localhost:3000/auth/login/google \
-H "Content-Type: application/json" \
-d '{"token": "<GOOGLE_ID_TOKEN>"}'

```