// src/StoryboardModal.jsx
import React, { useState, useEffect } from 'react';
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
  Edit3,
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

  // Per-Scene Image Rendering & Custom Override States
  const [renderingIndex, setRenderingIndex] = useState(null);
  const [renderedImages, setRenderedImages] = useState({});
  const [customImagePrompts, setCustomImagePrompts] = useState({});
  const [customMotionPrompts, setCustomMotionPrompts] = useState({});
  const [copiedMotionIdx, setCopiedMotionIdx] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('16:9');

  // Initialize state when storyboard changes or modal opens
  useEffect(() => {
    if (trackData?.storyboard) {
      setStoryboard(trackData.storyboard);
    }
  }, [trackData]);

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

  const handleRenderKeyframe = async (index, fallbackPrompt) => {
    const promptToUse = customImagePrompts[index] || fallbackPrompt;
    if (!promptToUse) return;

    setRenderingIndex(index);
    try {
      const res = await fetch(`${apiBaseUrl}/.netlify/functions/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse,
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

  const handleCopyMotionPrompt = (index, fallbackPrompt) => {
    const motionToUse = customMotionPrompts[index] || fallbackPrompt;
    if (!motionToUse) return;

    navigator.clipboard.writeText(motionToUse);
    setCopiedMotionIdx(index);
    setTimeout(() => setCopiedMotionIdx(null), 2000);
  };

  const handleDownloadImage = (index) => {
    const dataUrl = renderedImages[index];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    const safeTitle = (trackData?.title || 'Scene').replace(/[^a-zA-Z0-9]/g, '');
    a.download = `${safeTitle}-Scene-${index + 1}-Keyframe.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
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

          {/* Top Control Bar */}
          <div className="flex items-center gap-2">
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[11px]">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  aspectRatio === '16:9' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                16:9 Cinema
              </button>
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                  aspectRatio === '9:16' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                9:16 Reel
              </button>
            </div>

            {/* Prompt Generator Trigger */}
            <button
              onClick={handleGenerateStoryboard}
              disabled={loadingStoryboard}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-40"
            >
              {loadingStoryboard ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{storyboard ? 'Regenerate Prompts' : 'Generate Prompts'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Workspace */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:none]">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          {!storyboard && !loadingStoryboard && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
              <Camera size={36} className="stroke-1 opacity-50" />
              <p className="text-xs font-medium">Click "Generate Prompts" or paste custom prompts from NotebookLM below.</p>
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
              {/* Visual Tone & Cinematic Style Header */}
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

              {/* Scene Cards Workspace */}
              <div className="space-y-4">
                {storyboard.scenes?.map((scene, idx) => {
                  const isRendering = renderingIndex === idx;
                  const keyframeImage = renderedImages[idx];
                  const activeImgPrompt = customImagePrompts[idx] ?? scene.imagePrompt;
                  const activeMotionPrompt = customMotionPrompts[idx] ?? scene.motionPrompt;

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

                        <div className="flex items-center gap-2">
                          {/* Render Imagen 3 Keyframe */}
                          <button
                            onClick={() => handleRenderKeyframe(idx, scene.imagePrompt)}
                            disabled={isRendering}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg text-xs font-bold transition shadow cursor-pointer disabled:opacity-50"
                          >
                            {isRendering ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <ImageIcon size={12} />
                            )}
                            <span>{keyframeImage ? 'Re-render Keyframe' : 'Render Keyframe'}</span>
                          </button>

                          {/* Copy Veo 3.1 Motion Cue */}
                          <button
                            onClick={() => handleCopyMotionPrompt(idx, scene.motionPrompt)}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
                            title="Copy Veo 3.1 Motion Cue"
                          >
                            {copiedMotionIdx === idx ? (
                              <Check size={12} className="text-emerald-400" />
                            ) : (
                              <Video size={12} className="text-amber-400" />
                            )}
                            <span>{copiedMotionIdx === idx ? 'Copied' : 'Veo Prompt'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Content Grid: Visual Concept + Prompt Editors + Image Canvas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Left 2 Columns: Editable Prompts & Cinematic Specs */}
                        <div className="md:col-span-2 space-y-2.5 text-xs">
                          <p className="text-slate-300 text-[11px]">
                            <span className="font-semibold text-slate-400">Concept: </span>
                            {scene.visualConcept}
                          </p>

                          {/* Imagen 3 Editable Prompt */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                              <Sparkles size={11} />
                              <span>Imagen 3 Anchor Prompt (Editable)</span>
                            </label>
                            <textarea
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-amber-400 outline-none resize-none h-16 leading-relaxed"
                              value={activeImgPrompt}
                              onChange={(e) =>
                                setCustomImagePrompts((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              placeholder="Enter Imagen 3 prompt or paste from NotebookLM..."
                            />
                          </div>

                          {/* Veo 3.1 Editable Motion Prompt */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                              <Video size={11} />
                              <span>Veo 3.1 Motion Cue (Editable)</span>
                            </label>
                            <textarea
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono focus:border-cyan-400 outline-none resize-none h-14 leading-relaxed"
                              value={activeMotionPrompt}
                              onChange={(e) =>
                                setCustomMotionPrompts((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              placeholder="Enter Veo 3.1 camera motion cue..."
                            />
                          </div>

                          {/* Camera & Lighting Specs */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-0.5">
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

                        {/* Right Column: Keyframe Preview Canvas */}
                        <div className="md:col-span-1 flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden min-h-[160px] relative group">
                          {keyframeImage ? (
                            <>
                              <img
                                src={keyframeImage}
                                alt={`Scene ${idx + 1} Keyframe`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleDownloadImage(idx)}
                                  className="p-2 bg-amber-400 text-slate-950 rounded-lg font-bold shadow-lg hover:bg-amber-300 transition cursor-pointer flex items-center gap-1 text-xs"
                                  title="Download Keyframe Image"
                                >
                                  <Download size={13} />
                                  <span>Save JPG</span>
                                </button>
                              </div>
                            </>
                          ) : isRendering ? (
                            <div className="flex flex-col items-center space-y-1.5 text-indigo-400 p-4 text-center">
                              <Loader2 size={24} className="animate-spin" />
                              <span className="text-[11px] font-medium text-slate-300">
                                Rendering Imagen 3 Frame...
                              </span>
                            </div>
                          ) : (
                            <div className="text-center p-4 text-slate-600 space-y-1.5">
                              <ImageIcon size={24} className="mx-auto stroke-1" />
                              <p className="text-[10px] text-slate-500">No keyframe rendered</p>
                              <button
                                onClick={() => handleRenderKeyframe(idx, scene.imagePrompt)}
                                className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                              >
                                Render Now
                              </button>
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
