import * as Toastify from 'react-toastify';

// Safe wrappers around react-toastify so the app doesn't crash

export const toast =
  Toastify.toast || {
    success: console.log,
    error: console.error,
    info: console.log,
    warn: console.warn,
  };

export const ToastContainer =
  Toastify.ToastContainer || (() => null);


