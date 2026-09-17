## Curl para crear pedido

```bash
curl -X POST http://localhost:3000/pedido \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <ACCESS_TOKEN>" \
-d '{"pedido": {"nombre": "Pedido de prueba", "destino": "Calle Falsa 123", "ubicacion": "Centro"}}'

```