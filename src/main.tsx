import '@fontsource-variable/archivo/standard.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { applyPalette, getPalette } from './features/palette/palette';

// index.html already set the stored palette before the first paint; this syncs theme-color with it.
applyPalette(getPalette());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
