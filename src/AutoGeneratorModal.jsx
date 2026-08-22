// src/AutoGeneratorModal.jsx
import React, { useState } from 'react';
import { Play, Sparkles, X, Loader2, AlertCircle } from 'lucide-react';

const AutoGeneratorModal = ({ 
  isOpen, 
  onClose, 
  onSongGenerated, 
  apiBaseUrl = '' 
}) => {
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleStartGrabbing = async (e) => {
    e.preventDefault();
    if (!songTitle.trim() || !artistName.trim()) {
      setError("Please enter both Song Name and Artist Name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use relative endpoint to avoid CORS and external downtime
      const endpoint = '/.netlify/functions/grab-lyrics';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title: songTitle.trim(),
          artist: artistName.trim(),
          songName: songTitle.trim(),
          artistName: artistName.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server responded with HTTP ${response.status}`);
      }

      if (!data.lines || data.lines.length === 0) {
        throw new Error("No timestamped lyrics found for this song.");
      }

      if (onSongGenerated) {
        onSongGenerated(data);
      }

      onClose();
    } catch (err) {
      console.error("Auto Grabber Error:", err);
      setError(err.message || "Failed to grab track lyrics. Please check the song name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Sparkles size={18} />
            <span>AI Track Data Grabber</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleStartGrabbing} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">1. Song Name</label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="e.g. Daniel, Hotel California, 海闊天空"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">2. Artist Name</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="e.g. Elton John, Eagles, Beyond"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400/50"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-3 rounded-lg font-bold text-sm transition shadow-lg shadow-amber-400/10 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} fill="currentColor" />}
              {loading ? 'Grabbing Lyrics...' : 'Start Auto-Grab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AutoGeneratorModal;
