
// Buffer polyfill for React-PDF
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer

import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
createRoot(document.getElementById("root")!).render(
  <App />
);
