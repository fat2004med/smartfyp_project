// ⚠️ MUST BE THE VERY FIRST IMPORT - Polyfills for browser
import './globals.js';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './services/api';
import App from './App.jsx';
import './index.css';

// Safety check
if (typeof window !== 'undefined') {
  console.log('✅ Window is available');
  console.log('✅ Activity exists:', typeof window.Activity !== 'undefined');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);