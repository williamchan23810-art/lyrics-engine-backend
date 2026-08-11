import React, { useState, useRef } from 'react';
import { Play, Pause, Type, Video } from 'lucide-react';
import StoryboardModal from './StoryboardModal';

const LyricsEnginePlayer = ({ trackData }) => {
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-950 text-slate-100 ${fontFamily}`}>
      {/* Header Controls */}
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
        <div>
          <h1 className="text-lg font-bold text-amber-400">{trackData?.title || "Untitled Track"}</h1>
          <p className="text-xs text-slate-400">{trackData?.artist || "Unknown Artist"}</p>
        </div>

        {/* Toolbar: Font Switcher & Storyboard Trigger */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Type size={14} className="text-slate-400" />
            <select 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="font-sans" className="bg-slate-900">Sans-Serif</option>
              <option value="font-[Cambria]" className="bg-slate-900">Cambria (Serif)</option>
            </select>
          </div>

          <button 
            onClick={() => setIsStoryboardOpen(true)}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm shadow-amber-400/20"
          >
            <Video size={14} />
            AI Storyboard
          </button>
        </div>
      </header>

      {/* Synchronized Lyrics Display */}
      <main className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto w-full space-y-6 text-center">
        {trackData?.lyrics?.length > 0 ? (
          trackData.lyrics.map((line, idx) => (
            <p key={idx} className="text-xl md:text-2xl font-medium text-slate-300 hover:text-amber-300 transition cursor-pointer">
              {line.text}
            </p>
          ))
        ) : (
          <p className="text-slate-500 my-20">No lyrics loaded yet.</p>
        )}
      </main>

      {/* Playback Controls */}
      <footer className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center px-8">
        <audio 
          ref={audioRef} 
          src={trackData?.audioUrl} 
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)} 
        />
        <button 
          onClick={togglePlay}
          className="p-3 bg-amber-400 text-slate-950 rounded-full hover:bg-amber-300 transition shadow-md shadow-amber-400/20"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </footer>

      {/* AI Storyboard Modal Component */}
      <StoryboardModal 
        trackData={trackData} 
        isOpen={isStoryboardOpen} 
        onClose={() => setIsStoryboardOpen(false)} 
      />
    </div>
  );
};

export default LyricsEnginePlayer;
