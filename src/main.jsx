import React from 'react';
import ReactDOM from 'react-dom/client';
import LyricsEnginePlayer from './LyricsEnginePlayer';

// Sample track data for initial testing
const sampleTrack = {
  trackId: "track_001",
  title: "Sample Song Title",
  artist: "Artist Name",
  audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  lyrics: [
    { startTime: 0, text: "Intro Instrumental..." },
    { startTime: 10, text: "First line of synchronized lyrics" },
    { startTime: 15, text: "Second line scrolling into view smoothly" },
    { startTime: 20, text: "Enjoy your custom Lyrics-Engine interface!" }
  ]
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LyricsEnginePlayer trackData={sampleTrack} />
  </React.StrictMode>
);
