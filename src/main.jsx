import React from 'react';
import ReactDOM from 'react-dom/client';
import LyricsEnginePlayer from './LyricsEnginePlayer';

const API_BASE_URL = 'https://lyrics-engine-backend-1.onrender.com';

const initialTrack = {
  trackId: "default-01",
  title: "Karaoke & Songs Appreciation",
  artist: "William H Chan Studio",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  lyrics: []
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LyricsEnginePlayer 
      trackData={initialTrack} 
      apiBaseUrl={API_BASE_URL} 
    />
  </React.StrictMode>
);
