// src/LyricsEnginePlayer.jsx
import React, { useState, useEffect } from 'react';
import { Film, Edit3, Music, BookOpen, Check, Sparkles, Copy, Filter, Undo2 } from 'lucide-react';
import StoryboardModal from './StoryboardModal';
import LyricsEditorModal from './LyricsEditorModal';
import AutoGeneratorModal from './AutoGeneratorModal';
import NotebookExporterModal from './NotebookExporterModal';
import { distillLyrics } from './utils/lyricDistiller';

const LyricsEnginePlayer = ({ trackData: initialTrackData, apiBaseUrl = '' }) => {
  const [trackData, setTrackData] = useState(initialTrackData);
  const [storyboardData, setStoryboardData] = useState(null);
  const [isDistilled, setIsDistilled] = useState(false);

  // Modals & Feedback
  const [isStoryboardOpen, setIsStoryboardOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAutoGrabOpen, setIsAutoGrabOpen] = useState(false);
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  useEffect(() => {
    if (initialTrackData) {
      setTrackData(initialTrackData);
      setIsDistilled(false);
    }
  }, [initialTrackData]);

  const rawLyrics = trackData?.lyrics || [];
  const activeLyrics = isDistilled ? distillLyrics(rawLyrics) : rawLyrics;

  const handleCopyLyrics = () => {
    if (!activeLyrics.length) return;
    const plainText = activeLyrics.map((l) => l.text || l.originalText).join('\n');
    navigator.clipboard.writeText(plainText);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between p-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md gap-2 z-20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-400/10 rounded-lg text-amber-400">
            <Music size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-amber-400 leading-tight">
              {trackData?.title || 'Karaoke & Songs Appreciation'}
            </h1>
            <p className="text-[11px] text-slate-400">
              {trackData?.artist || 'William H Chan Studio'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setIsAutoGrabOpen(true)}
            className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-amber-400/20 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Start Auto-Grab</span>
          </button>

          <button
            onClick={() => setIsDistilled(!isDistilled)}
            disabled={!rawLyrics.length}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer disabled:opacity-40 ${
              isDistilled
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md shadow-amber-400/20 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isDistilled ? <Undo2 size={13} /> : <Filter size={13} className="text-amber-400" />}
            <span>{isDistilled ? 'Show Raw' : 'Distill Lyrics'}</span>
          </button>

          <button
            onClick={() => setIsStoryboardOpen(true)}
            disabled={!rawLyrics.length}
            className="flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 disabled:opacity-40 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Film size={13} />
            <span>AI Storyboard</span>
          </button>

          <button
            onClick={handleCopyLyrics}
            disabled={!activeLyrics.length}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            {copiedLyrics ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} className="text-amber-400" />}
            <span>{copiedLyrics ? 'Copied' : isDistilled ? 'Copy Distilled' : 'Copy Raw'}</span>
          </button>

          <button
            onClick={() => setIsEditorOpen(true)}
            disabled={!rawLyrics.length}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Edit3 size={13} className="text-amber-400" />
            <span>Edit</span>
          </button>

          {/* Export to Notebook -> Launches One-Click Bridge Modal */}
          <button
            onClick={() => setIsNotebookModalOpen(true)}
            disabled={!rawLyrics.length}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <BookOpen size={13} className="text-amber-400" />
            <span>Export to Notebook</span>
          </button>
        </div>
      </header>

      {/* Clean Lyrics Stage */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 flex flex-col items-center [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-text">
        {!activeLyrics.length ? (
          <div className="flex flex-col items-center justify-center my-auto space-y-2 text-slate-500">
            <Music size={42} className="stroke-1 opacity-40" />
            <p className="text-xs">No lyrics loaded. Click "Start Auto-Grab" to search.</p>
          </div>
        ) : (
          <div className="w-full max-w-2xl space-y-2 py-4 text-center">
            {isDistilled && (
              <div className="mb-4 inline-block px-3 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-[11px] font-medium text-amber-300">
                ✨ Lyrics Distilled: Filtered duplicate choruses & vocal fillers ({activeLyrics.length} story beats)
              </div>
            )}

            {activeLyrics.map((line, idx) => (
              <div
                key={idx}
                className="py-1 px-3 rounded-lg hover:bg-slate-900/60 transition-colors"
              >
                <span className="text-sm md:text-base text-slate-200 font-normal leading-snug">
                  {line.text || line.originalText}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <AutoGeneratorModal
        isOpen={isAutoGrabOpen}
        onClose={() => setIsAutoGrabOpen(false)}
        onSongGenerated={(data) => {
          setTrackData(data);
          setIsDistilled(false);
          if (data.storyboard) setStoryboardData(data.storyboard);
        }}
        apiBaseUrl={apiBaseUrl}
      />
      <StoryboardModal
        trackData={{ ...trackData, lyrics: activeLyrics }}
        isOpen={isStoryboardOpen}
        onClose={() => setIsStoryboardOpen(false)}
        onStoryboardGenerated={(data) => setStoryboardData(data)}
        apiBaseUrl={apiBaseUrl}
      />
      <LyricsEditorModal
        trackData={trackData}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaveLyrics={(newLyrics) => setTrackData((prev) => ({ ...prev, lyrics: newLyrics }))}
        apiBaseUrl={apiBaseUrl}
      />
      <NotebookExporterModal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
        trackData={{ ...trackData, lyrics: activeLyrics }}
        storyboardData={storyboardData}
      />
    </div>
  );
};

export default LyricsEnginePlayer;
