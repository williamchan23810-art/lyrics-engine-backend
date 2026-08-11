import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import LyricsEnginePlayer from './LyricsEnginePlayer';

// Production API base URL provided by Render
const API_BASE_URL = 'https://lyrics-engine-backend-1.onrender.com';

const App = () => {
  const [trackData, setTrackData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/track/1`)
      .then((res) => res.json())
      .then((data) => {
        setTrackData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch track from API Gateway:", err);
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
