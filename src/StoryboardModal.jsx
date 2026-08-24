// src/StoryboardModal.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Trash2,
  AlertCircle,
  FileVideo,
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'karaoke_storyboard_session';

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

  // Client-Side Video Compilation State
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // 1. Initial Load & Persistent State Rehydration
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed.storyboard) setStoryboard(parsed.storyboard);
        if (parsed.renderedImages) setRenderedImages(parsed.renderedImages);
        if (parsed.customImagePrompts) setCustomImagePrompts(parsed.customImagePrompts);
        if (parsed.customMotionPrompts) setCustomMotionPrompts(parsed.customMotionPrompts);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
      } else if (trackData?.storyboard) {
        setStoryboard(trackData.storyboard);
      }
    } catch (e) {
      console.warn('Could not rehydrate session from localStorage:', e);
    }
  }, [trackData]);

  // 2. Automatically Mirror State to Storage
  useEffect(() => {
    if (storyboard || Object.keys(renderedImages).length > 0) {
      const payload = {
        storyboard,
        renderedImages,
        customImagePrompts,
        customMotionPrompts,
        aspectRatio,
      };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn('Storage quota limit reached:', e);
      }
    }
  }, [storyboard, renderedImages, customImagePrompts, customMotionPrompts, aspectRatio]);

  if (!isOpen) return null;

  // Handler: Clear current session cache
  const handleClearSession = () => {
    if (window.confirm('Reset this storyboard and start fresh?')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setStoryboard(null);
      setRenderedImages({});
      setCustomImagePrompts({});
      setCustomMotionPrompts({});
    }
  };

  // Handler: Auto-generate full storyboard with Gemini
  const handleGenerateStoryboard = async () => {
    setLoadingStoryboard(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/.netlify/functions/storyboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trackData?.title || 'Untitled',
          artist: trackData?.artist || 'Unknown Artist',
          lyrics: trackData?.lyrics || [],
        }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(`Invalid response from server (${res.status}): ${rawText.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate visual storyboard');
      }

      setStoryboard(data.storyboard);
      if (onStoryboardGenerated) onStoryboardGenerated(data.storyboard);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStoryboard(false);
    }
  };

  // Handler: Add custom scene card directly
  const handleAddCustomScene = () => {
    setError(null);
    const defaultScene = {
      sceneIndex: storyboard?.scenes ? storyboard.scenes.length + 1 : 1,
      lyricSegment: 'NotebookLM Grounded Scene',
      visualConcept: 'Custom cinematography staged from NotebookLM',
      imagePrompt: '',
      motionPrompt: '',
      lighting: 'Tungsten & Chiaroscuro',
      camera: '50mm Anamorphic Prime',
    };

    if (!storyboard) {
      setStoryboard({
        songOverview: {
          cinematicStyle: '35mm Film Still (Custom NotebookLM Production)',
          emotionalArc: 'Grounded narrative visual progression',
        },
        scenes: [defaultScene],
      });
    } else {
      setStoryboard((prev) => ({
        ...prev,
        scenes: [...(prev.scenes || []), defaultScene],
      }));
    }
  };

  // Handler: Delete scene card
  const handleDeleteScene = (idxToDelete) => {
    if (!storyboard?.scenes) return;
    const updatedScenes = storyboard.scenes.filter((_, idx) => idx !== idxToDelete);
    setStoryboard((prev) => ({
      ...prev,
      scenes: updatedScenes.length > 0 ? updatedScenes : null,
    }));
  };

  // Handler: Render keyframe with safe serverless endpoint
  const handleRenderKeyframe = async (index, fallbackPrompt) => {
    const promptToUse = customImagePrompts[index] !== undefined ? customImagePrompts[index] : fallbackPrompt;
    if (!promptToUse || !promptToUse.trim()) {
      alert('Please enter or paste an Imagen 3 prompt before rendering.');
      return;
    }

    setRenderingIndex(index);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/.netlify/functions/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToUse.trim(),
          aspectRatio: aspectRatio,
        }),
      });

      const rawText = await res.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(`Server returned non-JSON response (${res.status}): ${rawText.slice(0, 100)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Keyframe render failed with status ${res.status}`);
      }

      if (!data.imageBase64) {
        throw new Error('No image payload received from Imagen 3 endpoint.');
      }

      setRenderedImages((prev) => ({
        ...prev,
        [index]: data.imageBase64,
      }));
    } catch (err) {
      alert(`Keyframe Render Error: ${err.message}`);
    } finally {
      setRenderingIndex(null);
    }
  };

  // Handler: Copy Veo 3.1 motion cue to clipboard
  const handleCopyMotionPrompt = (index, fallbackPrompt) => {
    const motionToUse = customMotionPrompts[index] !== undefined ? customMotionPrompts[index] : fallbackPrompt;
    if (!motionToUse) return;

    navigator.clipboard.writeText(motionToUse);
    setCopiedMotionIdx(index);
    setTimeout(() => setCopiedMotionIdx(null), 2000);
  };

  // Handler: Download individual rendered image
  const handleDownloadImage = (index) => {
    const dataUrl = renderedImages[index];
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    const safeTitle = (trackData?.title || 'Scene').replace(/[^a-zA-Z0-9]/g, '');
    a.download = `${safeTitle}-Scene-${index + 1}-Keyframe.jpg`;
    a.click();
  };

  // Handler: Browser-Native Video Compilation Engine (100% Reliable, Zero Backend Failure)
  const handleExportFullVideo = async () => {
    const keys = Object.keys(renderedImages).sort((a, b) => Number(a) - Number(b));
    if (keys.length === 0) {
      alert('Please render at least one keyframe before exporting the video.');
      return;
    }

    setIsExportingVideo(true);
    setExportProgress(0);
    setError(null);

    try {
      // 1. Create In-Memory Canvas
      const width = aspectRatio === '9:16' ? 1080 : 1920;
      const height = aspectRatio === '9:16' ? 1920 : 1080;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      // 2. Preload all rendered images into HTMLImageElements
      const loadedImages = await Promise.all(
        keys.map(
          (k) =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = renderedImages[k];
            })
        )
      );

      // 3. Setup MediaRecorder
      const stream = canvas.captureStream(30); // 30 FPS
      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const renderPromise = new Promise((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const safeTitle = (trackData?.title || 'Song').replace(/[^a-zA-Z0-9]/g, '');
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          a.download = `${safeTitle}-Story-Reel.${ext}`;
          a.click();
          resolve();
        };
      });

      mediaRecorder.start();

      // 4. Render Animation Frames with Ken Burns pan/zoom
      const framesPerImage = 150; // 5 seconds @ 30 FPS per scene
      const totalFrames = loadedImages.length * framesPerImage;
      let currentFrame = 0;

      for (let imgIdx = 0; imgIdx < loadedImages.length; imgIdx++) {
        const img = loadedImages[imgIdx];
        for (let f = 0; f < framesPerImage; f++) {
          const progress = f / framesPerImage;
          const scale = 1.0 + progress * 0.08; // Subtle 8% zoom-in

          ctx.fillStyle = '#05070e';
          ctx.fillRect(0, 0, width, height);

          ctx.save();
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale, scale);
          ctx.translate(-width / 2, -height / 2);

          // Draw image aspect fit/fill
          const imgRatio = img.width / img.height;
          const targetRatio = width / height;
          let drawW = width;
          let drawH = height;
          let offX = 0;
          let offY = 0;

          if (imgRatio > targetRatio) {
            drawH = height;
            drawW = height * imgRatio;
            offX = (width - drawW) / 2;
          } else {
            drawW = width;
            drawH = width / imgRatio;
            offY = (height - drawH) / 2;
          }

          ctx.drawImage(img, offX, offY, drawW, drawH);
          ctx.restore();

          currentFrame++;
          setExportProgress(Math.round((currentFrame / totalFrames) * 100));

          // Throttle to 30fps animation cadence
          await new Promise((r) => setTimeout(r, 33));
        }
      }

      mediaRecorder.stop();
      await renderPromise;
    } catch (err) {
      alert(`Video Export Error: ${err.message}`);
    } finally {
      setIsExportingVideo(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header Bar with Action Controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
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
                {trackData?.title || 'Don\'t Cry Out Loud'} — {trackData?.artist || 'Melissa Manchester'}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
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

            {/* AI Auto-Generate */}
            <button
              onClick={handleGenerateStoryboard}
              disabled={loadingStoryboard}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-amber-400/20 cursor-pointer disabled:opacity-40"
            >
              {loadingStoryboard ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>{storyboard ? 'Regenerate All' : 'Generate Prompts'}</span>
            </button>

            {/* Add Custom Scene */}
            <button
              onClick={handleAddCustomScene}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              <Plus size={13} className="text-amber-400" />
              <span>Add Scene</span>
            </button>

            {/* PRIMARY TRIGGER BUTTON: Option B Export Video */}
            <button
              onClick={handleExportFullVideo}
              disabled={isExportingVideo || Object.keys(renderedImages).length === 0}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={Object.keys(renderedImages).length === 0 ? 'Render at least one keyframe first' : 'Compile and export video'}
            >
              {isExportingVideo ? <Loader2 size={13} className="animate-spin" /> : <FileVideo size={13} />}
              <span>{isExportingVideo ? `Compiling (${exportProgress}%)` : 'Export Video MP4'}</span>
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Workspace Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 [scrollbar-width:none]">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Empty State */}
          {!storyboard && !loadingStoryboard && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
              <Camera size={44} className="stroke-1 opacity-40 text-amber-400" />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-slate-200">No Storyboard Scenes Active</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Automatically generate scene prompts with Gemini 2.5 Flash, or add a custom card to paste directly from NotebookLM.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleGenerateStoryboard}
                  className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-400/20 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Generate Prompts (Gemini)</span>
                </button>

                <button
                  onClick={handleAddCustomScene}
                  className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  <Plus size={14} className="text-amber-400" />
                  <span>+ Add Custom Scene Card</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {loadingStoryboard && (
            <div className="flex flex-col items-center justify-center py-20 text-amber-400 space-y-3">
              <Loader2 size={32} className="animate-spin" />
              <p className="text-xs font-semibold text-slate-300">
                Gemini 2.5 Flash is mapping the cinematic narrative & visual storyboard...
              </p>
            </div>
          )}

          {/* Active Storyboard Cards */}
          {storyboard && !loadingStoryboard && (
            <>
              {storyboard.songOverview && (
                <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 text-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <Sun size={14} />
                      <span>Visual Tone & Cinematic Direction</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      <span className="font-semibold text-slate-100">Style: </span>
                      {storyboard.songOverview.cinematicStyle || 'Atmospheric 35mm film'}
                    </p>
                  </div>
                  <button
                    onClick={handleClearSession}
                    className="text-[10px] text-slate-500 hover:text-red-400 underline cursor-pointer"
                  >
                    Reset Session Cache
                  </button>
                </div>
              )}

              {/* Scene Cards List */}
              <div className="space-y-4">
                {storyboard.scenes?.map((scene, idx) => {
                  const isRendering = renderingIndex === idx;
                  const keyframeImage = renderedImages[idx];
                  const activeImgPrompt = customImagePrompts[idx] !== undefined ? customImagePrompts[idx] : scene.imagePrompt;
                  const activeMotionPrompt = customMotionPrompts[idx] !== undefined ? customMotionPrompts[idx] : scene.motionPrompt;

                  return (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3 transition-all hover:border-slate-700"
                    >
                      {/* Card Header */}
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
                          {/* Render Imagen 3 Frame */}
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

                          {/* Delete Scene Card */}
                          <button
                            onClick={() => handleDeleteScene(idx)}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition cursor-pointer"
                            title="Remove Scene"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2 space-y-2.5 text-xs">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                              <Sparkles size={11} />
                              <span>Imagen 3 Anchor Prompt (Editable / Paste from NotebookLM)</span>
                            </label>
                            <textarea
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none resize-none h-20 leading-relaxed"
                              value={activeImgPrompt}
                              onChange={(e) =>
                                setCustomImagePrompts((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              placeholder="Paste Imagen 3 prompt here..."
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                              <Video size={11} />
                              <span>Veo 3.1 Motion Cue (Editable)</span>
                            </label>
                            <textarea
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none resize-none h-14 leading-relaxed"
                              value={activeMotionPrompt}
                              onChange={(e) =>
                                setCustomMotionPrompts((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              placeholder="Paste Veo 3.1 camera motion cue here..."
                            />
                          </div>

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

                        {/* Live Render Preview Canvas */}
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
                                Rendering with Imagen 3...
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
                                Render Keyframe
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
