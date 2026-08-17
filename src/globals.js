/**
 * Global environment polyfills and runtime initializations
 * Ensures smooth execution in browser environments, Vercel Serverless, Railway, and Vite builds.
 */

if (typeof window !== 'undefined') {
  // ⚠️ CRITICAL FIX: Polyfill Activity for React vendor chunk
  if (!window.Activity) {
    window.Activity = {};
  }

  // Polyfill 'global' for libraries expecting Node.js-style global object
  window.global = window.global || window || globalThis;

  // Polyfill minimal process environment in browser if not present
  if (!window.process) {
    window.process = {
      env: {
        NODE_ENV: import.meta.env?.MODE || 'production',
        VITE_API_URL: import.meta.env?.VITE_API_URL || '',
      },
      browser: true,
      version: '',
    };
  } else if (!window.process.env) {
    window.process.env = {
      NODE_ENV: import.meta.env?.MODE || 'production',
      VITE_API_URL: import.meta.env?.VITE_API_URL || '',
    };
  }

  // Define global safe stub for Buffer if required by client-side utilities
  if (typeof window.Buffer === 'undefined') {
    window.Buffer = {
      isBuffer: () => false,
      from: (str) => new TextEncoder().encode(str),
    };
  }

  console.log('✅ Polyfills loaded successfully');
}

export default true;