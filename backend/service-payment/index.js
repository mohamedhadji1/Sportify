const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const paymentRoutes = require('./routes/payments');
const path = require('path');

dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
  if (!err) return next();

  const isParseError = err.type === 'entity.parse.failed' || err instanceof SyntaxError || /Unexpected token/.test(err.message || '');
  if (isParseError) {
    // Log concise parse error (no stack)
    console.warn('JSON parse error:', err.message);
    return res.status(400).json({ error: 'Invalid JSON body', details: err.message });
  }

  next(err);
});

// Static uploads (if any)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/payments', paymentRoutes);

// Health
app.get('/health', (req, res) => res.status(200).json({ service: 'Payment Service', status: 'OK', timestamp: new Date().toISOString() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack || err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5010;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`));
};

startServer().catch(err => {
  console.error('Failed to start Payment Service:', err);
  process.exit(1);
});

module.exports = app;
