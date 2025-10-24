import React from 'react';

// Minimal no-op replacement for reCAPTCHA v3.
// This keeps the public API (executeRecaptcha) but disables external calls.
// It returns a harmless token so callers that require a token still work.

const ReCaptchaV3 = React.forwardRef(({ siteKey, action = 'submit', onVerify, onError }, ref) => {
  React.useImperativeHandle = React.useImperativeHandle || (() => {});

  React.useImperativeHandle(ref, () => ({
    executeRecaptcha: async () => {
      // Return a stable dummy token so frontend logic that requires a token does not block.
      const dummy = 'recaptcha-disabled-token';
      if (onVerify) {
        try { onVerify(dummy); } catch (e) { /* ignore */ }
      }
      return Promise.resolve(dummy);
    },
    isReady: true
  }));

  // Do not render anything or load external scripts
  return null;
});

ReCaptchaV3.displayName = 'ReCaptchaV3';

export default ReCaptchaV3;
