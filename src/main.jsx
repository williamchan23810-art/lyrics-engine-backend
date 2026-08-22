// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import LyricsEnginePlayer from './LyricsEnginePlayer';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <LyricsEnginePlayer apiBaseUrl="" />
    </React.StrictMode>
  );
} else {
  console.error("DOM root element '#root' not found.");
}
