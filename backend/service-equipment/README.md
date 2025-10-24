Service Equipment — Sportify

Endpoints:
- POST /api/equipment — Submit a product (sellerId required)
- GET /api/equipment — List approved products
- GET /api/equipment/pending — Admin: list pending submissions
- POST /api/equipment/:id/approve — Admin: approve a product (adminId optional)
- POST /api/equipment/:id/reject — Admin: reject a product

Run locally:
- Create a .env with MONGODB_URI
- npm install
- npm start

Docker:
- docker build -t medhadji/service-equipment:latest .
