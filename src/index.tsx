/* @refresh reload */
import { render } from 'solid-js/web';
import App from './App';
import './styles/global.css';

// Register service worker only for production builds. In dev, vite-plugin-pwa
// does not generate the service worker assets and Vite should not request them.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration.scope);
    }).catch(() => {
      // Service worker registration failed - app still works
    });
  });
}

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

render(() => <App />, root);
