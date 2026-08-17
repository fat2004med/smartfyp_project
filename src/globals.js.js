// Polyfills for browser environment
// This fixes the "Cannot set properties of undefined (setting 'Activity')" error

if (typeof window !== 'undefined') {
  // Fix for Activity error
  if (!window.Activity) {
    window.Activity = {};
  }
  
  // Fix for global
  if (!window.global) {
    window.global = window;
  }
  
  // Fix for process
  if (typeof process === 'undefined') {
    window.process = { 
      env: { 
        NODE_ENV: 'production',
        ...window.__ENV__ 
      } 
    };
  }

  // Fix for Buffer if needed
  if (typeof Buffer === 'undefined') {
    window.Buffer = {
      from: (data) => data,
      isBuffer: () => false
    };
  }

  console.log('✅ Polyfills loaded successfully');
}

export default {};