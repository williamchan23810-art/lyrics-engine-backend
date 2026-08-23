// src/StoryboardModal.jsx
import React, { useState } from 'react';
import {
  Film,
  Sparkles,
  Download,
  Copy,
  Check,
  X,
  Image as ImageIcon,
  Camera,
  Sun,
  Video,
  Loader2,
  RefreshCw,
} from 'lucide-react';

const StoryboardModal = ({
  isOpen,
  onClose,
  trackData,
  onStoryboardGenerated,
  apiBaseUrl = '',
}) => {
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [storyboard, setStoryboard] = useState(null);
  const [error, setError] = useState(null);

  // Per-Scene Image Rendering States
  const [renderingIndex, setRenderingIndex] = useState(null);
  const [renderedImages, setRenderedImages] = useState({});
  const [copiedMotionIdx, setCopiedMotionIdx] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');

  if (!isOpen) return null;

  const handleGenerateStoryboard = async () => {
    setLoadingStoryboard(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/.netlify/functions/storyboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackData.title,
          artist: trackData.artist,
          lyrics: trackData.lyrics,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate visual storyboard');
      setStoryboard(data.storyboard);
      if (onStoryboardGenerated) onStoryboardGenerated(data.storyboard);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStoryboard(false);
    }
  };

  const handleRenderKeyframe = async (index, imagePrompt) => {
    setRenderingIndex(index);
    try {
      const res = await fetch(`${apiBaseUrl}/.netlify/functions/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to render keyframe with Imagen 3');

      setRenderedImages((prev) => ({
        ...prev,
        [index]: data.imageBase64,
      }));
    } catch (err) {
      alert(`Keyframe Render Failed: ${err.message}`);
    } finally {
      setRenderingIndex(null);
    }
  };

  const handleCopyMotionPrompt = (index, prompt) => {
    navigator.clipboard.writeText(prompt);
    setCopiedMotionIdx(index);
    setTimeout(() => setCopiedMotionIdx(null), 2000);
  };

  const handleDownloadImage = (index, sceneTitle) => {
    const dataUrl = renderedImages[index];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${trackData?.title || 'Scene'}-Scene-${index + 1}-Keyframe.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-lg">
              <Film size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>Visual Storyboard Studio</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                  Imagen 3 + Veo 3.1
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {trackData?.title} — {trackData?.artist}
              </p>
            </div>
          </div>

          {/* Top Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2 py-1 rounded font-semibold transition ${
                  aspectRatio === '16:9' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-2 py-1 rounded font-semibold transition ${
                  aspectRatio === '9:16' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                }`}
              >
                9:16
              </button>
            </div>

            <button
              onClick={handleGenerateStoryboard}
              disabled={loadingStoryboard}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-40"
            >
              {loadingStoryboard ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{storyboard ? 'Regenerate Scenes' : 'Generate Prompts'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:none]">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {!storyboard && !loadingStoryboard && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
              <Camera size={36} className="stroke-1 opacity-50" />
              <p className="text-xs font-medium">Click "Generate Prompts" to create cinematic scenes.</p>
            </div>
          )}

          {loadingStoryboard && (
            <div className="flex flex-col items-center justify-center py-20 text-amber-400 space-y-3">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-xs font-semibold text-slate-300">
                Gemini 2.5 Flash is mapping the visual narrative & cinematography...
              </p>
            </div>
          )}

          {storyboard && !loadingStoryboard && (
            <>
              {/* Song Concept Overview Banner */}
              {storyboard.songOverview && (
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <Sun size={14} />
                    <span>Visual Tone & Direction</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    <span className="font-semibold text-slate-100">Style: </span>
                    {storyboard.songOverview.cinematicStyle || 'Atmospheric 35mm film'}
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    <span className="font-semibold text-slate-300">Emotional Progression: </span>
                    {storyboard.songOverview.emotionalArc}
                  </p>
                </div>
              )}

              {/* Scene Cards Grid */}
              <div className="space-y-4">
                {storyboard.scenes?.map((scene, idx) => {
                  const isRendering = renderingIndex === idx;
                  const keyframeImage = renderedImages[idx];

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3 transition-all hover:border-slate-700"
                    >
                      {/* Scene Header */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded font-mono text-[11px] font-bold">
                            Scene {scene.sceneIndex || idx + 1}
                          </span>
                          <span className="text-xs text-slate-300 italic">
                            "{scene.lyricSegment || 'Narrative Beat'}"
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Render Imagen 3 Button */}
                          <button
                            onClick={() => handleRenderKeyframe(idx, scene.imagePrompt)}
                            disabled={isRendering}
                            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow cursor-pointer disabled:opacity-50"
                          >
                            {isRendering ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : (
                              <ImageIcon size={11} />
                            )}
                            <span>{keyframeImage ? 'Re-render Frame' : 'Render Keyframe'}</span>
                          </button>

                          {/* Copy Veo 3.1 Prompt */}
                          <button
                            onClick={() => handleCopyMotionPrompt(idx, scene.motionPrompt)}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
                            title="Copy Veo 3.1 Motion Cue"
                          >
                            {copiedMotionIdx === idx ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Video size={11} className="text-amber-400" />
                            )}
                            <span>{copiedMotionIdx === idx ? 'Copied' : 'Veo Prompt'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Content Grid: Visual Concept + Image Canvas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Prompt & Camera Specs */}
                        <div className="md:col-span-2 space-y-2 text-xs">
                          <p className="text-slate-300">
                            <span className="font-semibold text-slate-400">Concept: </span>
                            {scene.visualConcept}
                          </p>

                          <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1 font-mono text-[11px]">
                            <div className="text-amber-300/90 flex items-start gap-1">
                              <span className="text-slate-500 shrink-0">Imagen 3:</span>
                              <span className="leading-snug">{scene.imagePrompt}</span>
                            </div>
                            <div className="text-cyan-300/90 flex items-start gap-1 pt-1 border-t border-slate-800/60">
                              <span className="text-slate-500 shrink-0">Veo 3.1:</span>
                              <span className="leading-snug">{scene.motionPrompt}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                            {scene.lighting && (
                              <span className="flex items-center gap-1">
                                <Sun size={11} className="text-amber-400" />
                                {scene.lighting}
                              </span>
                            )}
                            {scene.camera && (
                              <span className="flex items-center gap-1">
                                <Camera size={11} className="text-cyan-400" />
                                {scene.camera}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rendered Image Preview Canvas */}
                        <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden min-h-[140px] relative group">
                          {keyframeImage ? (
                            <>
                              <img
                                src={keyframeImage}
                                alt={`Scene ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleDownloadImage(idx)}
                                  className="p-2 bg-amber-400 text-slate-950 rounded-lg font-bold shadow-lg hover:bg-amber-300 transition cursor-pointer"
                                  title="Download Image"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            </>
                          ) : isRendering ? (
                            <div className="flex flex-col items-center space-y-1 text-indigo-400">
                              <Loader2 size={20} className="animate-spin" />
                              <span className="text-[10px] text-slate-400">Rendering with Imagen 3...</span>
                            </div>
                          ) : (
                            <div className="text-center p-3 text-slate-600 space-y-1">
                              <ImageIcon size={20} className="mx-auto stroke-1" />
                              <p className="text-[10px]">No keyframe rendered</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryboardModal;
