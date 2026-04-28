import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Buffer } from 'buffer';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/theme-provider';
import { QueryProvider } from './components/query-provider';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';

// Fix for react-thermal-printer Buffer error
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <ThemeProvider defaultTheme="light" storageKey="app-theme">
        <TooltipProvider>
          <App />
          <Toaster position="top-right" expand={false} richColors />
          <SpeedInsights />
        </TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  </StrictMode>,
);

// Đăng ký Service Worker cho PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA ServiceWorker registered with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('PWA ServiceWorker registration failed: ', err);
      });
  });
}
