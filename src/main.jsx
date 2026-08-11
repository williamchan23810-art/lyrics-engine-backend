import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import LyricsEnginePlayer from './LyricsEnginePlayer';

// Target the correct active Render URL
const API_BASE_URL = 'https://lyrics-engine-backend-1.onrender.com';

const App = () => {
  const [trackData, setTrackData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/track/1`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTrackData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("API Gateway fetch error, applying fallback state:", err);
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
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-amber-400 font-sans font-medium">
        Connecting to Lyrics-Engine Gateway...
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
