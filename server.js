import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, SkipBack, SkipForward } from 'lucide-react';

const LyricsEnginePlayer = ({ trackData }) => {
  const audioRef = useRef(null);
  const lyricsContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Sync current time with active lyric line
  useEffect(() => {
    if (!trackData?.lyrics) return;
    const index = trackData.lyrics.findIndex((line, i) => {
      const nextLine = trackData.lyrics[i + 1];
      return currentTime >= line.startTime && (!nextLine || currentTime < nextLine.startTime);
    });

    if (index !== activeIndex) {
      setActiveIndex(index);
      if (lyricsContainerRef.current && index !== -1) {
        const activeElement = lyricsContainerRef.current.children[index];
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [currentTime, trackData, activeIndex]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleSeek = (time) => {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation / Header */}
      <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">{trackData.title}</h1>
          <p className="text-slate-400">{trackData.artist}</p>
        </div>
        <div className="text-xs px-3 py-1 bg-slate-800 rounded-full text-slate-300">
          Lyrics-Engine Web v2.0
        </div>
      </header>

      {/* Synchronized Lyrics Container */}
      <main className="flex-1 overflow-y-auto p-8 space-y-6 text-center" ref={lyricsContainerRef}>
        {trackData.lyrics.map((line, idx) => (
          <p
            key={idx}
            onClick={() => handleSeek(line.startTime)}
            className={`cursor-pointer transition-all duration-300 text-xl md:text-2xl font-medium ${
              idx === activeIndex
                ? 'text-amber-400 scale-110 font-bold drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {line.text}
          </p>
        ))}
      </main>

      {/* Player Bar */}
      <footer className="p-6 border-t border-slate-800 bg-slate-900 flex flex-col gap-4">
        <audio
          ref={audioRef}
          src={trackData.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
        
        {/* Scrubber */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={audioRef.current?.duration || 100}
            value={currentTime}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full accent-amber-400 bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-slate-400">
            {formatTime(audioRef.current?.duration || 0)}
          </span>
        </div>

        {/* Playback Controls */}
        <div className="flex justify-center items-center gap-6">
          <button className="text-slate-400 hover:text-white transition">
            <SkipBack size={24} />
          </button>
          <button
            onClick={togglePlay}
            className="p-4 bg-amber-400 text-slate-950 rounded-full hover:bg-amber-300 transition shadow-lg shadow-amber-400/20"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button className="text-slate-400 hover:text-white transition">
            <SkipForward size={24} />
          </button>
        </div>
      </footer>
    </div>
  );
};

const formatTime = (secs) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

export default LyricsEnginePlayer;
