// src/NotebookExporter.js

/**
 * Compiles track metadata, distilled lyrics, and AI storyboard prompts
 * into a structured markdown dossier optimized for NotebookLM ingestion.
 *
 * @param {Object} trackData - Contains title, artist, duration, and distilled lyrics
 * @param {Object} storyboardData - Contains songOverview and scenes array from Gemini
 * @returns {Promise<boolean>} - Resolves true on successful clipboard write
 */
export async function copyToNotebookClipboard(trackData, storyboardData) {
  if (!trackData) return false;

  const title = trackData.title || 'Untitled Track';
  const artist = trackData.artist || 'Unknown Artist';
  const formattedDate = new Date().toISOString().split('T')[0];

  let md = `${title} - Song Appreciation & Visual Storytelling Dossier\n`;
  md += `**Artist:** ${artist}  \n`;
  md += `**Archived Date:** ${formattedDate}  \n`;
  md += `**Archive Source:** William H Chan Studio - Lyrics Engine\n\n`;
  md += `---\n\n`;

  // 1. Narrative & Visual Director Overview
  md += `## 1. Narrative Premise & Visual Direction\n\n`;
  if (storyboardData?.songOverview) {
    const { coreTheme, emotionalArc, cinematicStyle } = storyboardData.songOverview;
    if (coreTheme) md += `* **Core Human Theme:** ${coreTheme}\n`;
    if (emotionalArc) md += `* **Emotional Progression:** ${emotionalArc}\n`;
    if (cinematicStyle) md += `* **Cinematic Style & Mood:** ${cinematicStyle}\n\n`;
  } else {
    md += `* **Core Theme:** A cinematic exploration of the song's poetic metaphors, character motivations, and emotional core.\n\n`;
  }

  // 2. Refined / Distilled Story Lyrics
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

  // 3. Cinematic AI Storyboard Scenes
  md += `## 3. Cinematic Scene Breakdown & Video Prompts\n\n`;
  if (storyboardData?.scenes && Array.isArray(storyboardData.scenes) && storyboardData.scenes.length > 0) {
    storyboardData.scenes.forEach((scene) => {
      const idx = scene.sceneIndex || 1;
      const time = scene.timeRange ? ` (${scene.timeRange})` : '';
      const lyric = scene.lyricSegment ? ` — *"${scene.lyricSegment}"*` : '';
      
      md += `### Scene ${idx}${time}${lyric}\n`;
      if (scene.visualConcept) md += `* **Concept:** ${scene.visualConcept}\n`;
      if (scene.imagePrompt) md += `* **Text-to-Image Prompt:** \`${scene.imagePrompt}\`\n`;
      if (scene.motionPrompt) md += `* **Motion Direction:** ${scene.motionPrompt}\n`;
      if (scene.lighting) md += `* **Lighting & Atmosphere:** ${scene.lighting}\n`;
      if (scene.camera) md += `* **Camera & Lens:** ${scene.camera}\n`;
      md += `\n`;
    });
  } else {
    md += `*No storyboard scenes generated for this entry.*\n\n`;
  }

  // 4. Host Discussion Steering Guide for NotebookLM
  md += `---\n\n`;
  md += `## 4. Audio Overview Podcast Guide (For AI Hosts)\n`;
  md += `* **Focus:** Discuss the emotional heartbreak, philosophical metaphors, and visual scenes as a cinematic short film.\n`;
  md += `* **Tone:** Dynamic, empathetic, insightful, and conversational.\n`;

  try {
    await navigator.clipboard.writeText(md);
    return true;
  } catch (err) {
    console.error('Failed to copy dossier to clipboard:', err);
    return false;
  }
}

function formatTime(sec) {
  const s = Math.floor(sec || 0);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
