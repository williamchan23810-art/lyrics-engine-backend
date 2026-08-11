import React, { useState } from 'react';
import { Film, Copy, Check, X, Sparkles } from 'lucide-react';

const StoryboardModal = ({ trackData, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [storyboard, setStoryboard] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!isOpen) return null;

  const generateStoryboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackData?.title,
          artist: trackData?.artist,
          lyrics: trackData?.lyrics?.map((l) => l.text).join('\n')
        })
      });
      const data = await res.json();
      setStoryboard(data);
    } catch (err) {
      console.error('Storyboard Generation Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyPrompt = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-2">
            <Film className="text-amber-400" size={20} />
            <h2 className="text-lg font-bold text-amber-400">AI Storyboard Generator</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {!storyboard && !loading && (
            <div className="text-center py-12 space-y-4">
              <Sparkles className="mx-auto text-amber-400" size={40} />
              <p className="text-slate-300">Generate a 4-scene video storyboard from "{trackData?.title || 'this track'}".</p>
              <button
                onClick={generateStoryboard}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 rounded-lg font-semibold transition"
              >
                Generate Storyboard Prompts
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-12 text-amber-400 animate-pulse font-medium">
              Analyzing lyrics & generating scene prompts...
            </div>
          )}

          {storyboard && (
            <div className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <h3 className="text-xs uppercase tracking-wider text-amber-400 font-bold mb-1">Concept Overview</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{storyboard.conceptOverview}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storyboard.scenes.map((scene, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-xs text-amber-400 font-bold mb-1">
                        <span>SCENE {scene.sceneNumber}</span>
                        <span className="text-slate-500 italic truncate max-w-[150px]">"{scene.lyricSegment}"</span>
                      </div>
                      <p className="text-xs text-slate-300 mb-2">{scene.visualDescription}</p>
                      <div className="bg-slate-900 p-2.5 rounded text-xs font-mono text-slate-400 border border-slate-800">
                        {scene.aiVideoPrompt}
                      </div>
                    </div>
                    <button
                      onClick={() => copyPrompt(scene.aiVideoPrompt, idx)}
                      className="flex items-center justify-center gap-1.5 w-full bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 py-1.5 rounded transition"
                    >
                      {copiedIndex === idx ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      {copiedIndex === idx ? 'Copied Prompt!' : 'Copy AI Prompt'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardModal;
