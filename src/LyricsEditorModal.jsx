import React, { useState } from 'react';
import { Edit3, Sparkles, X, Save, Clock, Loader2, AlertCircle, Check } from 'lucide-react';

const LyricsEditorModal = ({ trackData, isOpen, onClose, onSaveLyrics, apiBaseUrl = 'https://lyrics-engine-backend-1.onrender.com' }) => {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [formattedLyrics, setFormattedLyrics] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleFormatLyrics = async () => {
    if (!rawText.trim()) {
      setError("Please paste raw lyrics text before formatting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/format-lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackData?.title || "AppSheet Track",
          artist: trackData?.artist || "Elton John",
          rawLyrics: rawText
        })
      });

      if (!response.ok) throw new Error(`Server returned HTTP ${response.status}`);
      const data = await response.json();
      setFormattedLyrics(data.lyrics);
    } catch (err) {
      console.warn("AI formatting failed, using client-side auto-timestamping:", err);
      // Fallback timestamp generation (5 seconds per line)
      const fallback = rawText.split('\n')
        .filter(line => line.trim())
        .map((line, idx) => ({ startTime: idx * 5, text: line.trim() }));
      setFormattedLyrics(fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToPlayer = () => {
    if (formattedLyrics && onSaveLyrics) {
      onSaveLyrics(formattedLyrics);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Edit3 size={18} />
            <span>AI Lyrics Editor & Synchronizer</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!formattedLyrics ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Paste Raw Lyrics Text for "{trackData?.title || 'Current Track'}":
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste unformatted lyrics here...&#10;Line 1&#10;Line 2&#10;Line 3"
                  className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400/50 resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleFormatLyrics}
                  disabled={loading}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 rounded-lg font-bold text-xs transition shadow-lg shadow-amber-400/10 cursor-pointer disabled:opacity-50"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {loading ? 'Formatting Timestamps...' : 'Format with Gemini AI'}
                </button>
              </div>
            </div>
          ) : (
            /* Preview Formatted JSON Array */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Generated Synchronized Lyrics
                </h4>
                <button
                  onClick={() => setFormattedLyrics(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Edit Raw Text
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                {formattedLyrics.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs border-b border-slate-900 pb-1.5 last:border-none">
                    <span className="flex items-center gap-1 font-mono text-amber-400/80 bg-slate-900 px-2 py-0.5 rounded text-[11px] shrink-0">
                      <Clock size={12} />
                      {item.startTime}s
                    </span>
                    <span className="text-slate-200 truncate">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={handleApplyToPlayer}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-lg font-bold text-xs transition shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  {saved ? <Check size={16} /> : <Save size={16} />}
                  {saved ? 'Applied to Player!' : 'Apply to Current Track'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsEditorModal;
