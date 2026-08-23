// src/AutoGeneratorModal.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, Music, User, AlertCircle } from 'lucide-react';

const AutoGeneratorModal = ({
  isOpen,
  onClose,
  onSongGenerated,
  apiBaseUrl = ''
}) => {
  const [songTitle, setSongTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleGrabLyrics = async (e) => {
    e.preventDefault();
    const cleanTitle = songTitle.trim();
    const cleanArtist = artist.trim();

    if (!cleanTitle) {
      setError('Please enter a song title.');
      return;
    }

    setLoading(true);
    setError(null);

    // Build endpoint URL supporting relative and absolute paths
    const endpoint = apiBaseUrl 
      ? `${apiBaseUrl.replace(/\/$/, '')}/.netlify/functions/grab-lyrics`
      : '/.netlify/functions/grab-lyrics';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: cleanTitle,
          artist: cleanArtist,
          query: `${cleanTitle} ${cleanArtist}`.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}: Failed to retrieve lyrics.`);
      }

      // Verify payload structure
      if (!data.lyrics || !Array.isArray(data.lyrics) || data.lyrics.length === 0) {
        throw new Error(`No timestamped lyrics found for "${cleanTitle}".`);
      }

      // Dispatch normalized track payload up to parent stage
      onSongGenerated({
        trackId: data.trackId || Date.now().toString(),
        title: data.title || cleanTitle,
        artist: data.artist || cleanArtist || 'Unknown Artist',
        duration: data.duration || 0,
        lyrics: data.lyrics
      });

      // Clear local fields and close modal
      setSongTitle('');
      setArtist('');
      onClose();
    } catch (err) {
      console.error('Auto-Grab API Error:', err);
      setError(err.message || 'An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-lg">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-400 leading-tight">
                Auto-Grab Lyrics
              </h2>
              <p className="text-[11px] text-slate-400">
                Search LRCLIB for synchronized time-indexed lyrics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-200 disabled:opacity-30 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGrabLyrics} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Music size={12} className="text-amber-400" />
              <span>Song Title <strong className="text-rose-400">*</strong></span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Daniel, Hotel California, 海闊天空"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/60 transition disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User size={12} className="text-amber-400" />
              <span>Artist Name (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Elton John, Eagles, Beyond"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/60 transition disabled:opacity-50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !songTitle.trim()}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-400/15 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Searching LRCLIB...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Grab Lyrics</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AutoGeneratorModal;
