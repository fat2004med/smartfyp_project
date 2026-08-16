import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import axios from 'axios';
import './services/api';
import App from './App.jsx';
import './index.css';

// Automatically configure backend API base URL if provided in environment
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL.replace(/\/$/, '');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

