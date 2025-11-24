
// Buffer polyfill for React-PDF
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

// React Grab - sadece development modunda
if (import.meta.env.DEV) {
  import('react-grab');
}

import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
createRoot(document.getElementById("root")!).render(
  <App />
);
