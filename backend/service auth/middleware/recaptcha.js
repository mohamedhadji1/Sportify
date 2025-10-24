// reCAPTCHA removed: middleware is now a no-op to avoid server-side verification.
// This file intentionally accepts all requests and calls next().
// Keep function names to preserve imports across the codebase.

const verifyRecaptcha = (req, res, next) => {
  // Log once in non-production to aid debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('reCAPTCHA middleware: disabled — bypassing verification');
  }
  return next();
};

const verifyRecaptchaOptional = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('reCAPTCHA optional middleware: disabled — bypassing verification');
  }
  return next();
};

module.exports = {
  verifyRecaptcha,
  verifyRecaptchaOptional
};
