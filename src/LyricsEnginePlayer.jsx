import React, { useState, useRef } from 'react';
import { Play, Pause, Type, Video, Music } from 'lucide-react';
import StoryboardModal from './StoryboardModal';

const LyricsEnginePlayer = ({ trackData, apiBaseUrl = '' }) => {
  const [fontFamily, setFontFamily] = useState('font-sans');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-950 text-slate-100 ${fontFamily}`}>
      {/* Header Bar */}
      <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-400/10 rounded-lg text-amber-400">
            <Music size={20} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-amber-400 tracking-wide">
              {trackData?.title || "Untitled Track"}
            </h1>
            <p className="text-xs text-slate-400">
              {trackData?.artist || "Unknown Artist"}
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3">
          {/* Typography Selector */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/50 px-3 py-1.5 rounded-lg text-xs">
            <Type size={14} className="text-slate-400" />
            <select 
              value={fontFamily} 
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer font-medium"
            >
              <option value="font-sans" className="bg-slate-900 text-slate-100">Sans-Serif (Modern)</option>
              <option value="font-[Cambria]" className="bg-slate-900 text-slate-100">Cambria (Classic Serif)</option>
            </select>
          </div>

          {/* AI Storyboard Trigger Button */}
          <button 
            onClick={() => setIsStoryboardOpen(true)}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-md shadow-amber-400/10 active:scale-95"
          >
            <Video size={14} />
            AI Storyboard
          </button>
        </div>
      </header>

      {/* Main Lyrics Canvas */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 max-w-3xl mx-auto w-full space-y-6 text-center scrollbar-thin scrollbar-thumb-slate-800">
        {trackData?.lyrics && trackData.lyrics.length > 0 ? (
          trackData.lyrics.map((line, idx) => {
            // Highlighting current lyric line based on track playback time
            const isCurrentLine = 
              currentTime >= line.startTime && 
              (!trackData.lyrics[idx + 1] || currentTime < trackData.lyrics[idx + 1].startTime);

            return (
              <p 
                key={idx} 
                className={`text-xl md:text-2xl font-medium transition-all duration-300 cursor-pointer ${
                  isCurrentLine 
                    ? 'text-amber-400 scale-105 font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 opacity-80'
                }`}
                onClick={() => {
                  if (audioRef.current && line.startTime !== undefined) {
                    audioRef.current.currentTime = line.startTime;
                  }
                }}
              >
                {line.text}
              </p>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
            <Music size={32} className="opacity-40" />
            <p className="text-sm">No lyrics loaded for this track.</p>
          </div>
        )}
      </main>

      {/* Audio Playback Footer Bar */}
      <footer className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md flex justify-between items-center px-6 md:px-12">
        <audio 
          ref={audioRef} 
          src={trackData?.audioUrl} 
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
          onEnded={() => setIsPlaying(false)}
        />

        <div className="text-xs text-slate-400 font-mono w-16">
          {formatTime(currentTime)}
        </div>

        <button 
          onClick={togglePlay}
          className="p-3 bg-amber-400 text-slate-950 rounded-full hover:bg-amber-300 transition shadow-lg shadow-amber-400/20 active:scale-90"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>

        <div className="text-xs text-slate-400 font-mono w-16 text-right">
          {audioRef.current?.duration ? formatTime(audioRef.current.duration) : '--:--'}
        </div>
      </footer>

      {/* AI Storyboard Generator Modal Add-on */}
      <StoryboardModal 
        trackData={trackData} 
        isOpen={isStoryboardOpen} 
        onClose={() => setIsStoryboardOpen(false)}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
};

export default LyricsEnginePlayer;
