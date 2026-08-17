// MUST BE THE FIRST IMPORT - Polyfills for browser
import './globals.js';

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './services/api';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
