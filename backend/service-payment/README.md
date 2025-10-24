Service Payment

Endpoints:
- POST /api/payments - create payment record { bookingId, userId, amount, currency, provider, payNow }
- GET /api/payments/:id - get payment status
- POST /api/payments/webhook - provider webhook (mock)
- POST /api/payments/:id/refund - refund (mock)

ENV:
- MONGO_URL - mongodb connection string
- PORT - service port (default 5010)
- PAYMENT_PROVIDER_API_KEY - provider key (optional)
