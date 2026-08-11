import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, Film, Loader2, AlertCircle } from 'lucide-react';

const StoryboardModal = ({ trackData, isOpen, onClose, apiBaseUrl = 'https://lyrics-engine-backend-1.onrender.com' }) => {
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!isOpen) return null;

  const generateStoryboard = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      title: trackData?.title || "Karaoke & Songs Appreciation",
      artist: trackData?.artist || "William H Chan Studio",
      lyrics: trackData?.lyrics ? trackData.lyrics.map(l => l.text).join('\n') : "Sample lyrics segment"
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/ai/storyboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Gateway returned HTTP status ${response.status}`);
      }

      const data = await response.json();
      setStoryboard(data);
    } catch (err) {
      console.error("Storyboard Generation Failed:", err);
      setError("Unable to connect to AI Storyboard gateway. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Film size={18} />
            <span>AI Storyboard Generator</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!storyboard && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
              <div className="p-3 bg-amber-400/10 rounded-full text-amber-400">
                <Sparkles size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-slate-100">
                  Generate 4-Scene AI Video Script
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Creates tailored image/video generation prompts based on "{trackData?.title || 'Current Track'}".
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={generateStoryboard}
                className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 rounded-lg font-semibold text-sm transition shadow-lg shadow-amber-400/10 active:scale-95 cursor-pointer"
              >
                <Sparkles size={16} />
                Generate Storyboard Prompts
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 size={32} className="text-amber-400 animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Drafting visual prompts with AI Agent...</p>
            </div>
          )}

          {/* Storyboard Content Cards */}
          {storyboard && !loading && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Concept Overview</h4>
                <p className="text-xs text-slate-300 mt-1">{storyboard.conceptOverview}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storyboard.scenes?.map((scene, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                        <span>Scene {scene.sceneNumber}</span>
                        <span className="text-amber-400/80 truncate max-w-[150px]">"{scene.lyricSegment}"</span>
                      </div>
                      <p className="text-xs text-slate-300">{scene.visualDescription}</p>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded p-2.5 flex items-start justify-between gap-2">
                      <code className="text-[11px] text-amber-300/90 font-mono leading-relaxed break-words flex-1">
                        {scene.aiVideoPrompt}
                      </code>
                      <button
                        onClick={() => handleCopy(scene.aiVideoPrompt, idx)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 rounded transition shrink-0"
                        title="Copy Prompt"
                      >
                        {copiedIdx === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={generateStoryboard}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                >
                  Regenerate Prompts
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardModal;
