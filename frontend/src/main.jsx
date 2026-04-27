import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { reportWebVitals, measurePageLoad } from './utils/performanceMonitor'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Measure page load performance
window.addEventListener('load', () => {
  measurePageLoad();
});

// Report Web Vitals (requires web-vitals package)
// Install with: npm install web-vitals
if (process.env.NODE_ENV === 'production') {
  import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
    getCLS(reportWebVitals);
    getFID(reportWebVitals);
    getFCP(reportWebVitals);
    getLCP(reportWebVitals);
    getTTFB(reportWebVitals);
  }).catch(() => {
    // web-vitals not installed, skip reporting
  });
}
