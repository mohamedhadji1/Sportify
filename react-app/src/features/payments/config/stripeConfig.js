// Stripe configuration and utilities for the frontend
// This file handles Stripe publishable key and provides helper functions

class StripeConfig {
  constructor() {
    // Get publishable key from environment or fallback
    this.publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here';
    this.isConfigured = this.publishableKey && this.publishableKey !== 'pk_test_your_key_here';
    
    if (this.isConfigured) {
      console.info('✅ Stripe configured for frontend');
    } else {
      console.info('⚠️ Stripe not configured - using mock payments');
    }
  }

  isStripeAvailable() {
    return this.isConfigured;
  }

  getPublishableKey() {
    return this.publishableKey;
  }

  // Helper to format amount for display
  formatAmount(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Helper to validate card number using Luhn algorithm
  validateCardNumber(number) {
    const digits = number.replace(/\s+/g, '').split('').reverse().map(d => parseInt(d, 10));
    let sum = 0;
    
    for (let i = 0; i < digits.length; i++) {
      let digit = digits[i];
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    
    return sum % 10 === 0;
  }

  // Test card numbers for development
  getTestCards() {
    return {
      success: '4242 4242 4242 4242',
      declined: '4000 0000 0000 0002',
      expired: '4000 0000 0000 0069',
      cvcFail: '4000 0000 0000 0127',
      processing: '4000 0000 0000 3220',
      '3dSecure': '4000 0025 0000 3155'
    };
  }

  // Get appropriate payment method based on configuration
  getPaymentMethod() {
    return this.isConfigured ? 'stripe' : 'mock';
  }
}

// Export singleton instance
export const stripeConfig = new StripeConfig();

// Export payment status mapping
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid', 
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Export currency options
export const SUPPORTED_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  TND: { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar' }
};

export default stripeConfig;