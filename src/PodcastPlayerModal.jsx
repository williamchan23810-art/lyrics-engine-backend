// src/PodcastPlayerModal.jsx
import React, { useState, useEffect } from 'react';
import { Mic, Play, Pause, RotateCcw, Volume2, Download, X, Sparkles, User, Radio } from 'lucide-react';

const PodcastPlayerModal = ({ isOpen, onClose, trackData, storyboardData, apiBaseUrl = '' }) => {
  const [loading, setLoading] = useState(false);
  const [podcastData, setPodcastData] = useState(null);
  const [error, setError] = useState(null);
  
  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIdx, setCurrentLineIdx] = useState(0);

  // Generate Podcast Script on Open
  useEffect(() => {
    if (isOpen && trackData && !podcastData && !loading) {
      handleGeneratePodcast();
    }
  }, [isOpen, trackData]);

  // Speech Synthesis Controller (Browser Native Multi-Voice Speech)
  useEffect(() => {
    if (!isPlaying || !podcastData?.dialogue) return;

    if (currentLineIdx >= podcastData.dialogue.length) {
      setIsPlaying(false);
      setCurrentLineIdx(0);
      return;
    }

    const currentItem = podcastData.dialogue[currentLineIdx];
    const utterance = new SpeechSynthesisUtterance(currentItem.line);
    
    // Voice differentiation
    const voices = window.speechSynthesis.getVoices();
    if (currentItem.speaker === 'Alex') {
      utterance.pitch = 1.05;
      utterance.rate = 1.0;
      if (voices[0]) utterance.voice = voices[0];
    } else {
      utterance.pitch = 0.95;
      utterance.rate = 0.98;
      if (voices[1]) utterance.voice = voices[1];
    }

    utterance.onend = () => {
      setCurrentLineIdx((prev) => prev + 1);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, currentLineIdx, podcastData]);

  const handleGeneratePodcast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/.netlify/functions/podcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackData.title,
          artist: trackData.artist,
          lyrics: trackData.lyrics,
          storyboard: storyboardData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synthesize podcast');
      setPodcastData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentLineIdx(0);
  };

  const handleDownloadScript = () => {
    if (!podcastData) return;
    const text = `# ${podcastData.episodeTitle}\n**Song:** ${trackData.title} - ${trackData.artist}\n\n## Synopsis\n${podcastData.synopsis}\n\n## Episode Script\n` +
      podcastData.dialogue.map((d) => `**${d.speaker}** (${d.emotion}): ${d.line}`).join('\n\n');
    
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trackData.title}-Podcast-Script.md`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-sans animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-lg">
              <Radio size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{podcastData?.episodeTitle || 'AI Song Appreciation Podcast'}</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">2-Host Studio</span>
              </h2>
              <p className="text-[11px] text-slate-400">{trackData?.title} — {trackData?.artist}</p>
            </div>
          </div>
          <button onClick={() => { handleReset(); onClose(); }} className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 [scrollbar-width:none]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-amber-400">
              <Sparkles size={32} className="animate-spin" />
              <p className="text-xs font-semibold text-slate-300">Alex & Morgan are deconstructing the song narrative...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {podcastData && !loading && (
            <>
              {/* Synopsis Card */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-amber-400">Episode Premise: </span>
                {podcastData.synopsis}
              </div>

              {/* Dialogue Transcript */}
              <div className="space-y-2.5 pt-2">
                {podcastData.dialogue.map((item, idx) => {
                  const isCurrent = idx === currentLineIdx;
                  const isAlex = item.speaker === 'Alex';

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-400/10 border-amber-400/40 shadow-md'
                          : 'bg-slate-950/60 border-slate-800/80 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${isAlex ? 'text-cyan-400' : 'text-amber-400'}`}>
                          <User size={12} />
                          {item.speaker}
                        </span>
                        <span className="text-[10px] text-slate-500 italic">[{item.emotion}]</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-normal">{item.line}</p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Player Controls Bar */}
        {podcastData && !loading && (
          <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-400/20 cursor-pointer"
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                <span>{isPlaying ? 'Pause Episode' : 'Play Podcast'}</span>
              </button>

              <button
                onClick={handleReset}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer"
                title="Restart"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadScript}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                <Download size={13} />
                <span>Export Script</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastPlayerModal;
