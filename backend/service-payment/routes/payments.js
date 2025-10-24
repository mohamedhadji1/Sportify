const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
dotenv.config();

// Helper: validate input payload and return { ok: true, parsed } or { ok: false, errors }
function validatePaymentPayload(body, { requireUserId = true } = {}) {
  const errors = { missing: [], invalid: [] };
  const { bookingId, userId, amount, currency } = body || {};

  if (!bookingId) errors.missing.push('bookingId');
  if (requireUserId && !userId) errors.missing.push('userId');
  if (amount === undefined) errors.missing.push('amount');

  // Coerce bookingId to string and validate as 24-hex ObjectId (strict)
  const bookingIdStr = bookingId === undefined || bookingId === null ? '' : (typeof bookingId === 'string' ? bookingId.trim() : String(bookingId));
  const objectIdHexRegex = /^[0-9a-fA-F]{24}$/;
  if (bookingIdStr && !objectIdHexRegex.test(bookingIdStr)) errors.invalid.push('bookingId');

  const amountNum = amount === undefined ? NaN : Number(amount);
  if (amount !== undefined && (!Number.isFinite(amountNum) || amountNum <= 0)) errors.invalid.push('amount');

  const ok = errors.missing.length === 0 && errors.invalid.length === 0;
  return ok ? { ok: true, parsed: { bookingId: bookingIdStr, userId, amount: amountNum, currency } } : { ok: false, errors };
}

// Stripe setup (if STRIPE_SECRET_KEY provided)
let stripe = null;
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (stripeSecretKey && stripeSecretKey !== 'sk_test_your_stripe_secret_key_here' && stripeSecretKey.startsWith('sk_')) {
  try {
    stripe = require('stripe')(stripeSecretKey);
    console.info('✅ Stripe initialized successfully');
    console.info('📊 Stripe mode:', stripeSecretKey.includes('sk_test_') ? 'TEST' : 'LIVE');
    
    // Test Stripe connection
    stripe.customers.list({ limit: 1 }).then(() => {
      console.info('✅ Stripe API connection verified');
    }).catch(err => {
      console.error('❌ Stripe API connection failed:', err.message);
    });
    
  } catch (e) {
    console.warn('❌ Stripe package not installed or failed to initialize:', e.message);
    stripe = null;
  }
} else {
  console.info('⚠️  Stripe not configured - using mock payments only');
  console.info('💡 To enable Stripe: Set STRIPE_SECRET_KEY environment variable');
}

// Create a payment record and optionally simulate charging (mock)
router.post('/', async (req, res) => {
  try {
    const { provider = 'mock', payNow = false } = req.body;
    const validation = validatePaymentPayload(req.body);
    if (!validation.ok) return res.status(400).json({ error: 'Invalid payload', details: validation.errors });

    const { bookingId, userId, amount: amountNum, currency } = validation.parsed;

    // bookingId validated as 24-hex string in validatePaymentPayload
  const bookingObjectId = new mongoose.Types.ObjectId(bookingId);
    const payment = new Payment({ bookingId: bookingObjectId, userId, amount: amountNum, currency, provider, status: 'PENDING' });
    await payment.save();

    // If payNow and provider is mock, simulate immediate charge
    if (payNow && provider === 'mock') {
      payment.providerChargeId = `mock_${uuidv4()}`;
      payment.status = 'PAID';
      await payment.save();
    }

    res.json({ message: 'Payment created', payment });
  } catch (err) {
    if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
      console.warn('Create payment validation error:', err.message);
      return res.status(400).json({ error: 'Invalid input', details: err.message });
    }

    console.error('Create payment error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// Create a Stripe Checkout Session (or a mock session when Stripe not configured)
// Placed before param routes to avoid accidental route collisions with '/:id' patterns.
router.post('/create-checkout-session', async (req, res) => {
  try {
    console.info('create-checkout-session payload:', JSON.stringify(req.body));
    const { success_url, cancel_url } = req.body;
    const validation = validatePaymentPayload(req.body);
    if (!validation.ok) return res.status(400).json({ error: 'Invalid payload', details: validation.errors });

    const { bookingId, userId, amount: amountNum, currency = 'USD' } = validation.parsed;

    // bookingId is validated as 24-hex string in validatePaymentPayload
    const bookingIdStr = bookingId;

    // Create our local Payment record; store bookingId as an ObjectId to avoid later casting
  const bookingObjectId = new mongoose.Types.ObjectId(bookingIdStr);
    const payment = new Payment({ bookingId: bookingObjectId, userId, amount: amountNum, currency, provider: stripe ? 'stripe' : 'mock', status: 'PENDING' });
    await payment.save();

    if (stripe) {
      // Create real Stripe Checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { 
              name: `Court Booking - ${bookingId}`,
              description: `Sports court reservation payment`,
              images: ['https://your-domain.com/court-image.jpg'] // Optionnel: image du produit
            },
            unit_amount: Math.round(amountNum * 100) // Stripe utilise les centimes
          },
          quantity: 1
        }],
        client_reference_id: bookingId,
        metadata: { 
          paymentId: payment._id.toString(), 
          bookingId: bookingIdStr,
          userId: userId,
          source: 'sportify_booking'
        },
        success_url: success_url || `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancel_url || `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/courts`,
        // Options avancées Stripe
        billing_address_collection: 'auto',
        payment_intent_data: {
          metadata: {
            paymentId: payment._id.toString(),
            bookingId: bookingIdStr
          }
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // Expire dans 30 minutes
      });

      payment.providerChargeId = session.id;
      await payment.save();

      console.info('✅ Stripe session created:', session.id, 'for payment:', payment._id);
      return res.json({ 
        url: session.url, 
        sessionId: session.id, 
        paymentId: payment._id,
        provider: 'stripe'
      });
    }

    // Stripe not configured -> return a mock URL that the frontend can open
    const mockUrl = `${process.env.FRONTEND_BASE_URL || 'http://localhost:3000'}/payments/mock?paymentId=${payment._id}`;
    payment.providerChargeId = `mock_${uuidv4()}`;
    await payment.save();
    return res.json({ url: mockUrl, paymentId: payment._id });
  } catch (err) {
    // For expected input errors, return 400 with concise message and avoid noisy stack traces in logs
    if (err && (err.name === 'ValidationError' || err.name === 'CastError')) {
      console.warn('Create checkout session validation error:', err.message);
      return res.status(400).json({ error: 'Invalid input', details: err.message });
    }

    console.error('Create checkout session error:', err && err.stack ? err.stack : err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});


// Get payment status
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });
    res.json({ payment });
  } catch (err) {
    console.error('Get payment error:', err);
    res.status(500).json({ error: 'Failed to get payment' });
  }
});

// Stripe webhook endpoint (for real Stripe events)
router.post('/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!stripe || !webhookSecret) {
    console.warn('Stripe webhook received but Stripe not configured');
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  try {
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.info('✅ Stripe webhook verified:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const paymentId = session.metadata?.paymentId;
        
        if (paymentId) {
          const payment = await Payment.findById(paymentId);
          if (payment) {
            payment.status = 'PAID';
            payment.providerChargeId = session.id;
            await payment.save();
            console.info('✅ Payment marked as PAID:', paymentId);
          }
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        const failedPaymentId = failedIntent.metadata?.paymentId;
        
        if (failedPaymentId) {
          const payment = await Payment.findById(failedPaymentId);
          if (payment) {
            payment.status = 'FAILED';
            await payment.save();
            console.info('❌ Payment marked as FAILED:', failedPaymentId);
          }
        }
        break;
        
      default:
        console.info('Unhandled Stripe event type:', event.type);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('❌ Stripe webhook error:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Mock webhook endpoint (for development/testing)
router.post('/webhook', async (req, res) => {
  try {
    console.info('Mock webhook received:', JSON.stringify(req.body));
    const { providerChargeId, status } = req.body;
    if (!providerChargeId || !status) return res.status(400).json({ error: 'Missing params', details: { providerChargeId: !!providerChargeId, status: !!status } });

    const payment = await Payment.findOne({ providerChargeId });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (['PAID','CANCELLED','REFUNDED'].includes(status)) {
      payment.status = status;
      await payment.save();
      console.info('✅ Mock payment updated:', payment._id, 'status:', status);
    }

    res.json({ message: 'Mock webhook processed' });
  } catch (err) {
    console.error('Mock webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Refund endpoint (mock)
router.post('/:id/refund', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Not found' });
    if (payment.status !== 'PAID') return res.status(400).json({ error: 'Not refundable' });

    payment.status = 'REFUNDED';
    await payment.save();
    res.json({ message: 'Refunded', payment });
  } catch (err) {
    console.error('Refund error:', err);
    res.status(500).json({ error: 'Refund failed' });
  }
});

// ...existing code...

module.exports = router;
