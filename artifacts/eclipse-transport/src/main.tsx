import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

const apiUrl = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") || (import.meta.env.PROD ? "https://eclipse-transport-api-server.vercel.app" : "");
if (apiUrl) {
  setBaseUrl(apiUrl);
}

createRoot(document.getElementById('root')!).render(<App />);
