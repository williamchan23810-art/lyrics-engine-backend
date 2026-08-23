// src/NotebookExporterModal.jsx
import React, { useState } from 'react';
import { BookOpen, Copy, Check, ExternalLink, X, Sparkles, Film, Music } from 'lucide-react';
import { generateNotebookName } from './utils/formatters';

const NotebookExporterModal = ({ isOpen, onClose, trackData, storyboardData }) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDossier, setCopiedDossier] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  if (!isOpen || !trackData) return null;

  const songTitle = trackData.title || 'Untitled Track';
  const artistName = trackData.artist || 'Unknown Artist';
  const notebookTitle = generateNotebookName(songTitle, artistName);

  // Compile Master Markdown Dossier
  const buildDossierMarkdown = () => {
    const formattedDate = new Date().toISOString().split('T')[0];
    let md = `${songTitle} - Song Appreciation & Visual Storytelling Dossier\n`;
    md += `**Artist:** ${artistName}  \n`;
    md += `**Archived Date:** ${formattedDate}  \n`;
    md += `**Studio Pipeline:** William H Chan Studio - Lyrics Engine\n\n`;
    md += `---\n\n`;

    // 1. Narrative & Cultural Overview
    md += `## 1. Narrative Premise & Poetic Core\n\n`;
    if (storyboardData?.songOverview) {
      const { coreTheme, emotionalArc, cinematicStyle } = storyboardData.songOverview;
      if (coreTheme) md += `* **Core Human Theme:** ${coreTheme}\n`;
      if (emotionalArc) md += `* **Emotional Progression:** ${emotionalArc}\n`;
      if (cinematicStyle) md += `* **Cinematic Visual Style:** ${cinematicStyle}\n\n`;
    } else {
      md += `* **Core Theme:** A deep-dive cinematic deconstruction of the song's emotional tension, character dilemma, and poetic metaphors.\n\n`;
    }

    // 2. Distilled Story Lyrics
    md += `## 2. Chronological Distilled Story Beats\n\n`;
    if (trackData.lyrics && Array.isArray(trackData.lyrics) && trackData.lyrics.length > 0) {
      trackData.lyrics.forEach((line, idx) => {
        const text = line.text || line.originalText || '';
        const timeTag = line.startTime !== undefined ? `[${formatTime(line.startTime)}] ` : '';
        md += `${idx + 1}. ${timeTag}**${text}**\n`;
      });
      md += `\n`;
    } else {
      md += `*No lyrics lines captured.*\n\n`;
    }

    // 3. Cinematic Storyboard Prompts for Imagen 3 & Veo 3.1
    md += `## 3. Cinematic Scene Breakdown (Prompts for Imagen 3 & Veo 3.1)\n\n`;
    if (storyboardData?.scenes && Array.isArray(storyboardData.scenes) && storyboardData.scenes.length > 0) {
      storyboardData.scenes.forEach((scene) => {
        const idx = scene.sceneIndex || 1;
        const time = scene.timeRange ? ` (${scene.timeRange})` : '';
        const lyric = scene.lyricSegment ? ` — *"${scene.lyricSegment}"*` : '';

        md += `### Scene ${idx}${time}${lyric}\n`;
        if (scene.visualConcept) md += `* **Concept:** ${scene.visualConcept}\n`;
        if (scene.imagePrompt) md += `* **Imagen 3 Keyframe Prompt:** \`${scene.imagePrompt}\`\n`;
        if (scene.motionPrompt) md += `* **Veo 3.1 Video Motion Prompt:** \`${scene.motionPrompt}\`\n`;
        if (scene.lighting) md += `* **Lighting & Atmosphere:** ${scene.lighting}\n`;
        if (scene.camera) md += `* **Camera & Lens:** ${scene.camera}\n`;
        md += `\n`;
      });
    } else {
      md += `*No storyboard scenes generated. Run AI Storyboard in Lyrics Engine first.*\n\n`;
    }

    return md;
  };

  const podcastPrompt = `You are two passionate, highly articulate music historians and cinematic visual directors hosting an engaging song appreciation podcast episode.

Focus exclusively on the narrative storytelling, poetic subtext, and cinematic visual world of "${songTitle}" by ${artistName}:
1. Deconstruct the Core Emotion: Translate any technical metadata into pure human experience, emotional tension, and the singer's unspoken dilemma.
2. Lyric Deconstruction: Unpack key metaphorical lines and analyze what is happening between the lines.
3. Visual World-Building: Walk through the storyboard scenes (lighting, camera angles, mood, atmosphere) so listeners can picture the song as a short film.
4. Host Chemistry: Maintain warm, insightful, and natural conversational dialogue filled with spontaneous realizations and genuine empathy.`;

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400/10 text-amber-400 rounded-lg">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Export to Gemini Notebook</h2>
              <p className="text-[11px] text-slate-400">One-click assets for NotebookLM, Imagen 3 & Audio Overview</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Standardized Notebook Name */}
        <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Music size={11} className="text-amber-400" />
            <span>1. Standardized Notebook Name</span>
          </label>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs text-amber-300 font-mono truncate">{notebookTitle}</code>
            <button
              onClick={() => copyToClipboard(notebookTitle, setCopiedTitle)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              {copiedTitle ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedTitle ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Step 2: Master Dossier */}
        <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Film size={11} className="text-amber-400" />
            <span>2. Master Dossier (Distilled + Storyboard Prompts)</span>
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-300">Clean story beats + Imagen 3 & Veo 3.1 prompts</span>
            <button
              onClick={() => copyToClipboard(buildDossierMarkdown(), setCopiedDossier)}
              className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3 py-1 rounded-lg text-xs font-bold transition shadow-md shadow-amber-400/20 cursor-pointer"
            >
              {copiedDossier ? <Check size={12} className="text-emerald-950" /> : <Copy size={12} />}
              <span>{copiedDossier ? 'Copied Dossier!' : 'Copy Dossier'}</span>
            </button>
          </div>
        </div>

        {/* Step 3: Customized Audio Overview Prompt */}
        <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-400" />
            <span>3. Podcast Host Steering Prompt</span>
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-300">Custom 2-Host Deep Dive Audio Prompt</span>
            <button
              onClick={() => copyToClipboard(podcastPrompt, setCopiedPrompt)}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-700 transition cursor-pointer"
            >
              {copiedPrompt ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Step 4: Action Gateway */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl transition cursor-pointer"
          >
            Done
          </button>

          <a
            href="https://gemini.google.com/notebook"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <span>Open Gemini Notebook</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

function formatTime(sec) {
  const s = Math.floor(sec || 0);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

export default NotebookExporterModal;
