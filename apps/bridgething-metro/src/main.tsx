import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { applyTheme, cachedTheme } from '@/lib/theme';

import App from './App';
import './index.css';
import '@/styles/weather.css';

// paint the last theme before react's first frame; coming back from an app otherwise flashes the default
const last = cachedTheme();
if (last) applyTheme(last);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
