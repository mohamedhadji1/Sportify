import React, { forwardRef } from "react"

// No-op ReCaptcha component. Returns a dummy token via callbacks but does not load external libs.
export const ReCaptcha = forwardRef(({ 
  siteKey, 
  onChange, 
  onExpired, 
  onError,
  theme = "dark",
  size = "normal",
  className = "",
  disabled = false 
}, ref) => {
  React.useImperativeHandle = React.useImperativeHandle || (() => {});

  React.useImperativeHandle(ref, () => ({
    getToken: () => 'recaptcha-disabled-token'
  }));

  if (onChange) {
    try { onChange('recaptcha-disabled-token'); } catch (e) {}
  }

  return null;
})

ReCaptcha.displayName = "ReCaptcha"
