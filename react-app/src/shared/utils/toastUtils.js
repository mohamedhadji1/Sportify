// Simple utility for accessing toast globally
export const initGlobalToast = (toastInstance) => {
  if (typeof window !== 'undefined') {
    window.toast = {
      success: toastInstance.success,
      error: toastInstance.error,
      warning: toastInstance.warning,
      info: toastInstance.info,
      add: toastInstance.addToast,
    };
  }
};

// Check if toast is available globally
export const isToastAvailable = () => {
  return typeof window !== 'undefined' && window.toast !== undefined;
};

// Helper for using toast safely (fallback to console if unavailable)
export const toast = {
  success: (message, duration) => {
    if (isToastAvailable()) {
      window.toast.success(message, duration);
    } else {
      console.log('Toast Success:', message);
    }
  },
  error: (message, duration) => {
    if (isToastAvailable()) {
      window.toast.error(message, duration);
    } else {
      console.error('Toast Error:', message);
    }
  },
  warning: (message, duration) => {
    if (isToastAvailable()) {
      window.toast.warning(message, duration);
    } else {
      console.warn('Toast Warning:', message);
    }
  },
  info: (message, duration) => {
    if (isToastAvailable()) {
      window.toast.info(message, duration);
    } else {
      console.info('Toast Info:', message);
    }
  },
};