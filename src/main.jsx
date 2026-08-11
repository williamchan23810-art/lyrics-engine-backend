import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import LyricsEnginePlayer from './LyricsEnginePlayer';

// Production API Gateway hosted on Render
const API_BASE_URL = 'https://lyrics-engine-backend-1.onrender.com';

const App = () => {
  const [trackData, setTrackData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/track/1`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        setTrackData(data);
      } catch (err) {
        console.warn("API Gateway initial connection warning, applying client fallback state:", err);
        // Resilient fallback payload ensuring UI displays immediately
        setTrackData({
          trackId: "1",
          title: "Karaoke & Songs Appreciation",
          artist: "William H Chan Studio",
          audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          lyrics: [
            { startTime: 0, text: "Welcome to Lyrics-Engine Studio" },
            { startTime: 5, text: "Synchronized audio playback active" },
            { startTime: 10, text: "Switch typography using Cambria font controls" },
            { startTime: 15, text: "Click AI Storyboard to generate video prompts" }
          ]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-950 text-amber-400 font-sans space-y-3">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Connecting to Lyrics-Engine Gateway...</p>
      </div>
    );
  }

  return <LyricsEnginePlayer trackData={trackData} apiBaseUrl={API_BASE_URL} />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
